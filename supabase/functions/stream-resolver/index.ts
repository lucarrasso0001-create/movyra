// Resolves a TMDB id into a direct playable MP4/MKV URL via Torrentio + Real-Debrid.
// No iframe, no ads — just a direct link the browser can play in <video>.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY")!;
const RD_API_KEY = Deno.env.get("RD_API_KEY")!;

const VIDEO_EXT = /\.(mp4|mkv|avi|mov|webm|m4v)$/i;
const BAD = /\b(cam|hdcam|ts|telesync|hdts|workprint|screener)\b/i;

async function getImdbId(tmdbId: string, mediaType: "movie" | "tv"): Promise<string | null> {
  const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = await r.json();
  return j.imdb_id || null;
}

interface TorrentioStream {
  title?: string;
  name?: string;
  infoHash?: string;
  fileIdx?: number;
  behaviorHints?: { bingeGroup?: string };
}

async function getTorrentioStreams(
  imdbId: string,
  mediaType: "movie" | "tv",
  season?: number,
  episode?: number,
): Promise<TorrentioStream[]> {
  const id = mediaType === "tv" && season && episode
    ? `${imdbId}:${season}:${episode}`
    : imdbId;
  const cfg = "sort=qualitysize|qualityfilter=cam,unknown|limit=5";
  const url = `https://torrentio.strem.fun/${cfg}/stream/${mediaType === "tv" ? "series" : "movie"}/${id}.json`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const j = await r.json();
  return (j.streams || []) as TorrentioStream[];
}

async function rd(path: string, init?: RequestInit) {
  return fetch(`https://api.real-debrid.com/rest/1.0${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${RD_API_KEY}`,
    },
  });
}

async function resolveWithRD(infoHash: string): Promise<string | null> {
  try {
    const magnet = `magnet:?xt=urn:btih:${infoHash}`;
    // Add magnet
    const addRes = await rd("/torrents/addMagnet", {
      method: "POST",
      body: new URLSearchParams({ magnet }),
    });
    if (!addRes.ok) return null;
    const { id } = await addRes.json();

    // Get info
    const infoRes = await rd(`/torrents/info/${id}`);
    const info = await infoRes.json();

    // Select largest video file
    const files = (info.files || []) as Array<{ id: number; path: string; bytes: number }>;
    const videos = files.filter((f) => VIDEO_EXT.test(f.path)).sort((a, b) => b.bytes - a.bytes);
    if (!videos.length) {
      await rd(`/torrents/delete/${id}`, { method: "DELETE" });
      return null;
    }
    await rd(`/torrents/selectFiles/${id}`, {
      method: "POST",
      body: new URLSearchParams({ files: String(videos[0].id) }),
    });

    // Poll for download links (RD usually has cached torrents ready instantly)
    let links: string[] = [];
    for (let i = 0; i < 8; i++) {
      const r = await rd(`/torrents/info/${id}`);
      const data = await r.json();
      if (data.status === "downloaded" && data.links?.length) {
        links = data.links;
        break;
      }
      if (["magnet_error", "error", "virus", "dead"].includes(data.status)) break;
      await new Promise((res) => setTimeout(res, 1500));
    }
    if (!links.length) return null;

    // Unrestrict first link → direct streaming URL
    const unrestRes = await rd("/unrestrict/link", {
      method: "POST",
      body: new URLSearchParams({ link: links[0] }),
    });
    if (!unrestRes.ok) return null;
    const u = await unrestRes.json();
    return u.download || null;
  } catch (e) {
    console.error("[RD]", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { tmdbId, mediaType, season, episode } = await req.json();
    if (!tmdbId || !mediaType) {
      return new Response(JSON.stringify({ error: "tmdbId & mediaType required" }), {
        status: 400,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    const imdbId = await getImdbId(String(tmdbId), mediaType);
    if (!imdbId) {
      return new Response(JSON.stringify({ error: "imdb_id not found" }), {
        status: 404,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    const streams = await getTorrentioStreams(imdbId, mediaType, season, episode);
    const filtered = streams.filter((s) => s.infoHash && !BAD.test(s.title || s.name || ""));

    for (const s of filtered.slice(0, 4)) {
      const url = await resolveWithRD(s.infoHash!);
      if (url) {
        return new Response(JSON.stringify({ url, source: "real-debrid", title: s.title }), {
          headers: { ...cors, "content-type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "no playable source" }), {
      status: 404,
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("[stream-resolver]", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
