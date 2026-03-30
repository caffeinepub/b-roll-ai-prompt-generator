/* eslint-disable */
// @ts-nocheck
import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export type ApiKey = string;
export interface PromptHistoryEntry {
  'promptOutput' : string,
  'timestamp' : bigint,
  'promptInput' : string,
}
export interface TransformationInput {
  'context' : Uint8Array,
  'response' : http_request_result,
}
export interface TransformationOutput {
  'status' : bigint,
  'body' : Uint8Array,
  'headers' : Array<http_header>,
}
export interface http_header { 'value' : string, 'name' : string }
export interface http_request_result {
  'status' : bigint,
  'body' : Uint8Array,
  'headers' : Array<http_header>,
}
export interface UserPublic {
  'id' : string,
  'email' : string,
  'createdAt' : bigint,
  'plan' : string,
  'requestsToday' : bigint,
  'lastRequestDate' : bigint,
  'role' : string,
  'stripeCustomerId' : string,
  'stripeSubscriptionId' : string,
}
export type AuthResult = { 'ok' : string } | { 'err' : string };
export type PromptResult = { 'ok' : string } | { 'err' : string };
export interface _SERVICE {
  'getApiKey' : ActorMethod<[Principal], ApiKey>,
  'getPromptHistory' : ActorMethod<[boolean], Array<PromptHistoryEntry>>,
  'isApiKeyRegistered' : ActorMethod<[], boolean>,
  'isApiKeyRegisteredWithSession' : ActorMethod<[string], boolean>,
  'isSystemApiKeySet' : ActorMethod<[], boolean>,
  'makePromptRequest' : ActorMethod<[string], string>,
  'makePromptRequestWithSession' : ActorMethod<[string, string], PromptResult>,
  'registerOpenAiApiKey' : ActorMethod<[string], undefined>,
  'registerOpenAiApiKeyWithSession' : ActorMethod<[string, string], undefined>,
  'testPrompt' : ActorMethod<[], string>,
  'transform' : ActorMethod<[TransformationInput], TransformationOutput>,
  'signUp' : ActorMethod<[string, string], AuthResult>,
  'login' : ActorMethod<[string, string], AuthResult>,
  'logout' : ActorMethod<[string], undefined>,
  'getCurrentUser' : ActorMethod<[string], [] | [UserPublic]>,
  'getAllUsers' : ActorMethod<[string], Array<UserPublic>>,
  'adminSetPlan' : ActorMethod<[string, string, string], boolean>,
  'adminSetSubscription' : ActorMethod<[string, string, string], boolean>,
  'adminSetRole' : ActorMethod<[string, string, string], boolean>,
  'adminResetUsage' : ActorMethod<[string, string], boolean>,
  'adminDeleteUser' : ActorMethod<[string, string], boolean>,
  'setUserPlan' : ActorMethod<[string, string], boolean>,
  'adminSetSystemApiKey' : ActorMethod<[string, string], boolean>,
  'adminGetSystemApiKey' : ActorMethod<[string], string>,
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
