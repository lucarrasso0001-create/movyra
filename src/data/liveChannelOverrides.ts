// Overrides manuais de canais ao vivo.
// Use este arquivo para adicionar/sobrescrever URLs de stream m3u8 obtidas manualmente
// (ex.: o "style.css" do EmbedTV/embedtv.lat extraído via F12 > Network).
//
// Cada entrada vira (ou substitui) um canal na grade. Se `id` já existir na fonte pública
// (iptv-org), o override substitui o stream_url e os campos preenchidos.
//
// Para descobrir o m3u8 do EmbedTV:
//   1. Abra https://ww2.embedtv.lat/{slug} no navegador
//   2. Resolva o CAPTCHA, dê play
//   3. F12 > Network > recarregue > procure por um arquivo chamado "style.css"
//      (é o manifest HLS disfarçado). Copie a URL completa.
//
// Cole abaixo e salve. O player tocará direto via proxy HLS, sem iframe, sem anúncios.

export interface LiveChannelOverride {
  id: string;
  name: string;
  logo_url?: string | null;
  stream_url: string;
  category?: string;
  quality?: string | null;
}

export const LIVE_CHANNEL_OVERRIDES: LiveChannelOverride[] = [
  // Exemplo:
  // {
  //   id: "GloboSP.br",
  //   name: "Globo SP",
  //   logo_url: "https://img.faz-o-eli.online/globosp.prev.png",
  //   stream_url: "https://exemplo.cdn/manifest/style.css",
  //   category: "Geral",
  //   quality: "1080p",
  // },
];
