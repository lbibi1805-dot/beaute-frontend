/**
 * AuthContext — global authentication state.
 * Stores token + role + username in localStorage so the session survives page refreshes.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { loginUser, registerUser, type AuthInfo } from "../api/client.ts";

interface AuthState {
  token: string | null;
  role: "admin" | "customer" | null;
  username: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "beaute_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as AuthState;
    } catch {}
    return { token: null, role: null, username: null };
  });

  // Keep localStorage in sync
  useEffect(() => {
    if (auth.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [auth]);

  const login = async (username: string, password: string) => {
    const info: AuthInfo = await loginUser(username, password);
    setAuth({ token: info.token, role: info.role, username: info.username });
  };

  const register = async (username: string, password: string) => {
    const info: AuthInfo = await registerUser(username, password);
    setAuth({ token: info.token, role: info.role, username: info.username });
  };

  const logout = () => setAuth({ token: null, role: null, username: null });

  return (
    <AuthContext.Provider value={{ ...auth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
