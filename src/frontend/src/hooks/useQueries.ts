import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PromptHistoryEntry, UserPublic } from "../backend.d";
import { createActorWithConfig } from "../config";

async function getBackend() {
  return createActorWithConfig();
}

export function useIsApiKeyRegistered() {
  return useQuery<boolean>({
    queryKey: ["apiKeyRegistered"],
    queryFn: async () => {
      const actor = await getBackend();
      return actor.isApiKeyRegistered();
    },
    staleTime: 30_000,
  });
}

export function useRegisterApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const actor = await getBackend();
      return actor.registerOpenAiApiKey(key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeyRegistered"] });
    },
  });
}

export function useMakePromptRequest() {
  return useMutation({
    mutationFn: async (sceneDetails: string) => {
      const actor = await getBackend();
      const result = await actor.makePromptRequest(sceneDetails);
      return result;
    },
  });
}

export function usePromptHistory(enabled: boolean) {
  return useQuery<PromptHistoryEntry[]>({
    queryKey: ["promptHistory"],
    queryFn: async () => {
      const actor = await getBackend();
      return actor.getPromptHistory(true);
    },
    enabled,
    staleTime: 0,
  });
}

// Session-based hooks

export function useIsApiKeyRegisteredWithSession(sessionToken: string | null) {
  return useQuery<boolean>({
    queryKey: ["apiKeyRegisteredWithSession", sessionToken],
    queryFn: async () => {
      if (!sessionToken) return false;
      const actor = await getBackend();
      return actor.isApiKeyRegisteredWithSession(sessionToken);
    },
    enabled: !!sessionToken,
    staleTime: 30_000,
  });
}

export function useRegisterApiKeyWithSession(sessionToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      if (!sessionToken) throw new Error("No session token");
      const actor = await getBackend();
      return actor.registerOpenAiApiKeyWithSession(sessionToken, key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["apiKeyRegisteredWithSession", sessionToken],
      });
    },
  });
}

export function useMakePromptRequestWithSession() {
  return useMutation({
    mutationFn: async ({
      sessionToken,
      promptContent,
    }: {
      sessionToken: string;
      promptContent: string;
    }) => {
      const actor = await getBackend();
      const result = await actor.makePromptRequestWithSession(
        sessionToken,
        promptContent,
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
  });
}

// Admin hooks

export function useGetAllUsers(sessionToken: string | null) {
  return useQuery<UserPublic[]>({
    queryKey: ["adminUsers", sessionToken],
    queryFn: async () => {
      if (!sessionToken) return [];
      const actor = await getBackend();
      return actor.getAllUsers(sessionToken);
    },
    enabled: !!sessionToken,
    staleTime: 0,
  });
}

export function useAdminSetSubscription(sessionToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      email,
      status,
    }: { email: string; status: string }) => {
      if (!sessionToken) throw new Error("No session");
      const actor = await getBackend();
      return actor.adminSetSubscription(sessionToken, email, status);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
  });
}

export function useAdminSetRole(sessionToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!sessionToken) throw new Error("No session");
      const actor = await getBackend();
      return actor.adminSetRole(sessionToken, email, role);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
  });
}

export function useAdminResetUsage(sessionToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      if (!sessionToken) throw new Error("No session");
      const actor = await getBackend();
      return actor.adminResetUsage(sessionToken, email);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
  });
}

export function useAdminDeleteUser(sessionToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      if (!sessionToken) throw new Error("No session");
      const actor = await getBackend();
      return actor.adminDeleteUser(sessionToken, email);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
  });
}

// Self-service plan change
export function useSetUserPlan(sessionToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: string) => {
      if (!sessionToken) throw new Error("No session");
      const actor = await getBackend();
      return actor.setUserPlan(sessionToken, plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
}

// Admin plan setter
export function useAdminSetPlan(sessionToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, plan }: { email: string; plan: string }) => {
      if (!sessionToken) throw new Error("No session");
      const actor = await getBackend();
      return actor.adminSetPlan(sessionToken, email, plan);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
  });
}
