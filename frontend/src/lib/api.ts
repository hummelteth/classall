import { useEffect, useState } from "react";

export async function request<T>(
  path: string,
  userId?: number,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(userId ? { "X-Demo-User-Id": String(userId) } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const body = await response.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail))
        message = body.detail
          .map((item: { msg: string }) => item.msg)
          .join(" ");
    } catch {
      /* Non-JSON proxy error. */
    }
    if (response.status >= 500)
      message =
        "The API is unavailable. Start the Python backend and try again.";
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function useRemote<T>(
  path: string,
  userId?: number,
  version = 0,
  enabled = true,
) {
  const [state, setState] = useState<{
    data: T | null;
    error: string;
    loading: boolean;
  }>({ data: null, error: "", loading: true });
  const [retry, setRetry] = useState(0);
  // Tag results so role/filter changes can never render stale data while the effect starts.
  const key = `${path}:${userId}:${version}:${retry}:${enabled}`;
  const [loadedKey, setLoadedKey] = useState("");
  useEffect(() => {
    if (!enabled) {
      setLoadedKey(key);
      setState({ data: null, error: "", loading: false });
      return;
    }
    const controller = new AbortController();
    setState({ data: null, error: "", loading: true });
    setLoadedKey(key);
    request<T>(path, userId, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ data, error: "", loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            data: null,
            error:
              error instanceof TypeError
                ? "Cannot reach the API. Check that the Python backend is running."
                : error.message,
            loading: false,
          });
      });
    return () => controller.abort();
  }, [path, userId, version, retry, key, enabled]);
  const current =
    key === loadedKey ? state : { data: null, error: "", loading: true };
  return { ...current, retry: () => setRetry((n) => n + 1) };
}

export function dateLabel(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  },
) {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(value));
}
export const timeLabel = (value: string) =>
  dateLabel(value, { hour: "2-digit", minute: "2-digit" });
export const timezoneLabel = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const upcoming = (value: string) =>
  new Date(value).getTime() > Date.now();
