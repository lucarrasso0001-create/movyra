// Utilitários para neutralizar anúncios popunder/popup do player de origem.
// Estratégia: interceptar globalmente window.open e abrir o popup em uma
// "janela invisível" (off-screen, 1x1) que se auto-fecha imediatamente.
// Tudo só fica ativo enquanto o player está aberto (refcount).

type OriginalOpen = typeof window.open;

let depth = 0;
let originalOpen: OriginalOpen | null = null;

const isInternalUrl = (raw: any): boolean => {
  if (!raw) return true;
  const url = String(raw);
  if (url.startsWith("about:")) return true;
  if (url.startsWith("blob:")) return true;
  try {
    const u = new URL(url, window.location.origin);
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
};

const swallow = (url: string) => {
  try {
    // Abre numa janela 1x1 off-screen e fecha imediatamente.
    const w = (originalOpen || window.open).call(
      window,
      url,
      "_blank",
      "width=1,height=1,left=-9999,top=-9999,noopener,noreferrer"
    );
    if (w) {
      // Tenta fechar imediatamente; se não fechar, agenda múltiplas tentativas.
      const tryClose = () => {
        try {
          w.close();
        } catch {}
      };
      tryClose();
      setTimeout(tryClose, 50);
      setTimeout(tryClose, 250);
      setTimeout(tryClose, 1000);
    }
  } catch {
    // ignore
  }
};

/**
 * Abre uma janela "isca" — alguns popunders só são acionados pelo primeiro
 * window.open após um clique de usuário. Abrir e fechar uma janela
 * minúscula consome esse primeiro pop e impede que o anúncio real apareça.
 */
export const fireDecoyPopup = () => {
  try {
    const w = window.open("about:blank", "_blank", "width=1,height=1,left=-9999,top=-9999");
    if (w) {
      setTimeout(() => {
        try {
          w.close();
        } catch {}
      }, 50);
    }
  } catch {}
};

export const enableAdSwallow = () => {
  depth++;
  if (depth > 1) return;
  originalOpen = window.open;
  // @ts-ignore — override para neutralizar popups de anúncio
  window.open = function (url?: any, target?: any, features?: any) {
    if (isInternalUrl(url)) {
      return (originalOpen as OriginalOpen).call(window, url, target, features);
    }
    swallow(String(url || "about:blank"));
    // Retorna um stub para não quebrar scripts que esperam Window
    return null;
  };
};

export const disableAdSwallow = () => {
  depth = Math.max(0, depth - 1);
  if (depth === 0 && originalOpen) {
    window.open = originalOpen;
    originalOpen = null;
  }
};
