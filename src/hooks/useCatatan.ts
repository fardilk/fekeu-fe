import { useEffect, useState } from 'react';
import { getCatatanList, CatatanItem } from '../lib/api/keuangan';

let cache: CatatanItem[] | null = null;
let promise: Promise<CatatanItem[]> | null = null;

function fetchOnce(): Promise<CatatanItem[]> {
  if (cache) return Promise.resolve(cache);
  if (promise) return promise;
  promise = getCatatanList().then((data) => {
    cache = data;
    promise = null;
    return data;
  }).catch((err) => { promise = null; throw err; });
  return promise;
}

export function useCatatan() {
  const [items, setItems] = useState<CatatanItem[] | null>(cache);
  useEffect(() => {
    let mounted = true;
    fetchOnce().then(d => { if (mounted) setItems(d); }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  return items;
}

export async function refreshCatatan() {
  cache = null;
  return fetchOnce();
}
