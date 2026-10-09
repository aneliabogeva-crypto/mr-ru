import { useEffect, useState } from "react";

const PREFIX = "mrru.";

export function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* частен прозорец или блокирано хранилище: работим без запазване */
  }
}

/** useState, който се пази в localStorage. В продукция се заменя с API. */
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => readStored(key, typeof initial === "function" ? initial() : initial));
  useEffect(() => writeStored(key, value), [key, value]);
  return [value, setValue];
}
