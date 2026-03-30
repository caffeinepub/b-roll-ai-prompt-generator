import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface PromptHistoryEntry {
    promptOutput: string;
    timestamp: bigint;
    promptInput: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type ApiKey = string;
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface UserPublic {
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
export type AuthResult = { ok: string } | { err: string };
export type PromptResult = { ok: string } | { err: string };
export interface backendInterface {
    getApiKey(caller: Principal): Promise<ApiKey>;
    getPromptHistory(callerOnly: boolean): Promise<Array<PromptHistoryEntry>>;
    isApiKeyRegistered(): Promise<boolean>;
    isApiKeyRegisteredWithSession(sessionToken: string): Promise<boolean>;
    makePromptRequest(sceneDetails: string): Promise<string>;
    makePromptRequestWithSession(sessionToken: string, promptContent: string): Promise<PromptResult>;
    registerOpenAiApiKey(openAiApiKey: string): Promise<void>;
    registerOpenAiApiKeyWithSession(sessionToken: string, openAiApiKey: string): Promise<void>;
    testPrompt(): Promise<string>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    signUp(email: string, password: string): Promise<AuthResult>;
    login(email: string, password: string): Promise<AuthResult>;
    logout(sessionToken: string): Promise<void>;
    getCurrentUser(sessionToken: string): Promise<[] | [UserPublic]>;
    getAllUsers(sessionToken: string): Promise<Array<UserPublic>>;
    adminSetPlan(sessionToken: string, email: string, plan: string): Promise<boolean>;
    adminSetSubscription(sessionToken: string, email: string, status: string): Promise<boolean>;
    adminSetRole(sessionToken: string, email: string, role: string): Promise<boolean>;
    adminResetUsage(sessionToken: string, email: string): Promise<boolean>;
    adminDeleteUser(sessionToken: string, email: string): Promise<boolean>;
    setUserPlan(sessionToken: string, plan: string): Promise<boolean>;
}
