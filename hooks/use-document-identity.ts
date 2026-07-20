'use client';

import { useEffect } from 'react';

const FALLBACK_STORE_FAVICON = '/storeRe-logo.avif';
const JF_FAVICON = '/logo-icon.png';

function setFavicon(href: string) {
  if (typeof document === 'undefined') return;
  // Reuse/replace every icon link so the tab reflects the chosen favicon.
  const links = document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
  if (links.length === 0) {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = href;
    document.head.appendChild(link);
    return;
  }
  const absoluteHref = new URL(href, window.location.href).href;
  links.forEach((l) => {
    if (l.href !== absoluteHref) l.href = href;
  });
}

/**
 * Set the browser tab title (and optionally the favicon) at runtime for client
 * pages whose identity isn't known at build time.
 *
 * - Platform pages: `useDocumentIdentity('Home')` → "Home | Jewel Factory"
 *   (favicon left as the Jewel Factory default).
 * - Store pages: `useDocumentIdentity('Catalog', { storeName: 'Demo Store',
 *   logoUrl })` → "Catalog | Demo Store" and swaps the favicon to the store logo
 *   (falling back to the store medallion when no logo is set).
 */
export function useDocumentIdentity(
  page: string,
  store?: { storeName?: string | null; logoUrl?: string | null },
) {
  const storeName = store?.storeName ?? null;
  const logoUrl = store?.logoUrl ?? null;
  const isStore = store !== undefined;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const suffix = isStore ? (storeName || 'Store') : 'Jewel Factory';
    const title = page ? `${page} | ${suffix}` : suffix;
    const favicon = isStore ? (logoUrl || FALLBACK_STORE_FAVICON) : JF_FAVICON;
    const applyIdentity = () => {
      if (document.title !== title) document.title = title;
      setFavicon(favicon);
    };

    // Next's metadata boundary can reconcile immediately after hydration. Apply
    // once now and once after that pass so client-known store identity wins.
    applyIdentity();
    const frame = window.requestAnimationFrame(applyIdentity);
    const timeout = window.setTimeout(applyIdentity, 250);
    const observer = new MutationObserver(applyIdentity);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });

    if (isStore) {
      // Restore the Jewel Factory favicon on unmount so leaving a store surface
      // (e.g. back to the public site) doesn't keep the store's icon.
      return () => {
        window.cancelAnimationFrame(frame);
        window.clearTimeout(timeout);
        observer.disconnect();
        setFavicon(JF_FAVICON);
      };
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      observer.disconnect();
    };
  }, [page, storeName, logoUrl, isStore]);
}
