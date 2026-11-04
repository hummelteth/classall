import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useRemote } from "./api";
import type { DemoUser } from "./types";
import { AlertCircle, RefreshCw } from "lucide-react";

interface DemoState {
  user: DemoUser;
  users: DemoUser[];
  selectUser: (id: number) => void;
  version: number;
  refresh: () => void;
}
const DemoContext = createContext<DemoState | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const remote = useRemote<DemoUser[]>("/demo-users");
  const [userId, setUserId] = useState(() => {
    try {
      return Number(localStorage.getItem("classall-demo-user")) || 1;
    } catch {
      return 1;
    }
  });
  const [version, setVersion] = useState(0);
  const user = remote.data?.find((u) => u.id === userId) ?? remote.data?.[0];
  if (remote.error)
    return (
      <main className="connection-screen">
        <div className="brand">
          ClassAll<span>✳</span>
        </div>
        <AlertCircle size={36} />
        <h1>Let’s get connected.</h1>
        <p>{remote.error}</p>
        <p>Run the backend on port 8000, then retry.</p>
        <button className="button primary" onClick={remote.retry}>
          <RefreshCw size={16} /> Retry connection
        </button>
        <a href="/">Back to ClassAll</a>
      </main>
    );
  if (!user || !remote.data)
    return (
      <main className="connection-screen" aria-live="polite">
        <div className="brand">
          ClassAll<span>✳</span>
        </div>
        <span className="spinner" />
        <p>Opening your demo campus…</p>
      </main>
    );
  const selectUser = (id: number) => {
    setUserId(id);
    try {
      localStorage.setItem("classall-demo-user", String(id));
    } catch {
      /* Demo still works without local storage. */
    }
  };
  return (
    <DemoContext.Provider
      value={{
        user,
        users: remote.data,
        selectUser,
        version,
        refresh: () => setVersion((n) => n + 1),
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const state = useContext(DemoContext);
  if (!state) throw new Error("DemoProvider is required");
  return state;
}
