import {useCallback, useEffect, useState} from 'react';
import {subscribeCatalogChanges} from './catalog-refresh.js';

export function useLiveCatalog(url) {
  const [result, setResult] = useState({url:null, data:null, error:''});
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => subscribeCatalogChanges(refresh), [refresh]);
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    fetch(url, {cache:'no-store', signal:controller.signal}).then(async response => {
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'The shop menu could not load.');
      if (!controller.signal.aborted) setResult({url, data, error:''});
    }).catch(error => {
      if (!controller.signal.aborted) setResult({url, data:null, error:'We couldn’t check the latest shop menu. Your choices are kept. Try again or ask the shop for an estimate.'});
    });
    return () => controller.abort();
  }, [url, revision]);
  return {...(result.url===url ? result : {data:null,error:''}), refresh};
}
