const channelName = 'njo-catalog-updated';

// Announce only that data changed. Private records never enter browser messages.
export function announceCatalogChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(channelName));
  try { const channel = new BroadcastChannel(channelName); channel.postMessage('refresh'); channel.close(); } catch {}
}

export function subscribeCatalogChanges(refresh) {
  const visible = () => { if (!document.hidden) refresh(); };
  window.addEventListener(channelName, refresh);
  window.addEventListener('focus', visible);
  document.addEventListener('visibilitychange', visible);
  let channel;
  try { channel = new BroadcastChannel(channelName); channel.onmessage = refresh; } catch {}
  const timer = setInterval(visible, 30000);
  return () => {
    clearInterval(timer); channel?.close();
    window.removeEventListener(channelName, refresh);
    window.removeEventListener('focus', visible);
    document.removeEventListener('visibilitychange', visible);
  };
}
