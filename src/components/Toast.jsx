import { useCallback, useEffect, useRef, useState } from "react";

export function useToast(duration = 3400) {
  const [message, setMessage] = useState(null);
  const timer = useRef();
  const notify = useCallback(
    (text) => {
      setMessage(text);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), duration);
    },
    [duration],
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  return [message, notify];
}

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      {message}
    </div>
  );
}
