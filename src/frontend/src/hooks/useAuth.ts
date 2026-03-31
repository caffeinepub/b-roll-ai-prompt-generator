import { useCallback, useEffect, useState } from "react";
import { createActorWithConfig } from "../config";

const SESSION_KEY = "broll_session_token";

export interface AuthUser {
  id: string;
  email: string;
  createdAt: bigint;
  plan: string;
  requestsToday: bigint;
  lastRequestDate: bigint;
  role: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}

async function getBackend() {
  return createActorWithConfig() as any;
}

function firstOrNull<T>(arr: T[]): T | null {
  return arr.length > 0 ? (arr[0] as T) : null;
}

function isCanisterStoppedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("ic0508") ||
    lower.includes("canister is stopped") ||
    lower.includes("reject code: 5") ||
    lower.includes("reject_code: 5") ||
    lower.includes('"reject_code":5') ||
    (lower.includes("canister") && lower.includes("stopped"))
  );
}

async function withCanisterRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 10,
  delayMs = 3000,
): Promise<T> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (isCanisterStoppedError(err) && i < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
  throw new Error("CANISTER_STARTING");
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanisterStarting, setIsCanisterStarting] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem(SESSION_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const actor = await getBackend();
        const result: AuthUser[] = await withCanisterRetry(() =>
          actor.getCurrentUser(storedToken),
        );
        const found = firstOrNull(result);
        if (found) {
          setSessionToken(storedToken);
          setUser(found);
          setIsCanisterStarting(false);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch (err) {
        if (
          (err instanceof Error && err.message === "CANISTER_STARTING") ||
          isCanisterStoppedError(err)
        ) {
          setIsCanisterStarting(true);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
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
        setIsCanisterStarting(false);
      }
    } catch {
      // ignore
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const actor = await getBackend();
    const result: { ok: string } | { err: string } = await withCanisterRetry(
      () => actor.login(email, password),
    );
    if ("err" in result) throw new Error(result.err);
    const token = result.ok;
    localStorage.setItem(SESSION_KEY, token);
    setSessionToken(token);
    const userResult: AuthUser[] = await actor.getCurrentUser(token);
    const found = firstOrNull(userResult);
    if (found) {
      setUser(found);
      setIsCanisterStarting(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const actor = await getBackend();
    const result: { ok: string } | { err: string } = await withCanisterRetry(
      () => actor.signUp(email, password),
    );
    if ("err" in result) throw new Error(result.err);
    const token = result.ok;
    localStorage.setItem(SESSION_KEY, token);
    setSessionToken(token);
    const userResult: AuthUser[] = await actor.getCurrentUser(token);
    const found = firstOrNull(userResult);
    if (found) {
      setUser(found);
      setIsCanisterStarting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(SESSION_KEY);
    if (token) {
      try {
        const actor = await getBackend();
        await actor.logout(token);
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(SESSION_KEY);
    setSessionToken(null);
    setUser(null);
    setIsCanisterStarting(false);
    window.location.reload();
  }, []);

  return {
    user,
    sessionToken,
    isLoading,
    isCanisterStarting,
    login,
    signUp,
    logout,
    refreshUser,
  };
}
