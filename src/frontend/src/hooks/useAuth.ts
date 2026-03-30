import { useCallback, useEffect, useState } from "react";
import { createActorWithConfig } from "../config";

const SESSION_KEY = "broll_session_token";

export interface AuthUser {
  id: string;
  email: string;
  createdAt: bigint;
  subscriptionStatus: string;
  requestsToday: bigint;
  lastRequestDate: bigint;
  role: string;
}

async function getBackend() {
  return createActorWithConfig() as any;
}

function firstOrNull<T>(arr: T[]): T | null {
  return arr.length > 0 ? (arr[0] as T) : null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(SESSION_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const actor = await getBackend();
        const result: AuthUser[] = await actor.getCurrentUser(storedToken);
        const found = firstOrNull(result);
        if (found) {
          setSessionToken(storedToken);
          setUser(found);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) return;
    try {
      const actor = await getBackend();
      const result: AuthUser[] = await actor.getCurrentUser(token);
      const found = firstOrNull(result);
      if (found) {
        setUser(found);
      }
    } catch {
      // ignore refresh errors silently
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const actor = await getBackend();
    const result: { ok: string } | { err: string } = await actor.login(
      email,
      password,
    );
    if ("err" in result) throw new Error(result.err);
    const token = result.ok;
    localStorage.setItem(SESSION_KEY, token);
    setSessionToken(token);
    const userResult: AuthUser[] = await actor.getCurrentUser(token);
    const found = firstOrNull(userResult);
    if (found) setUser(found);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const actor = await getBackend();
    const result: { ok: string } | { err: string } = await actor.signUp(
      email,
      password,
    );
    if ("err" in result) throw new Error(result.err);
    const token = result.ok;
    localStorage.setItem(SESSION_KEY, token);
    setSessionToken(token);
    const userResult: AuthUser[] = await actor.getCurrentUser(token);
    const found = firstOrNull(userResult);
    if (found) setUser(found);
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(SESSION_KEY);
    if (token) {
      try {
        const actor = await getBackend();
        await actor.logout(token);
      } catch {
        // ignore logout errors
      }
    }
    localStorage.removeItem(SESSION_KEY);
    setSessionToken(null);
    setUser(null);
  }, []);

  return { user, sessionToken, isLoading, login, signUp, logout, refreshUser };
}
