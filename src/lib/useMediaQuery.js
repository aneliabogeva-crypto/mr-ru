import { useEffect, useState } from "react";

/** Ширина, под която приложението е в мобилен изглед (същата като в styles.css). */
export const MOBILE_QUERY = "(max-width: 900px)";

const matches = (query) => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(query).matches;

/** true, докато медийната заявка съвпада; обновява се при завъртане и смяна на размера. */
export function useMediaQuery(query = MOBILE_QUERY) {
  const [value, setValue] = useState(() => matches(query));
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setValue(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return value;
}
