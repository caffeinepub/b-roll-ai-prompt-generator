/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

export const ApiKey = IDL.Text;
export const PromptHistoryEntry = IDL.Record({
  'promptOutput' : IDL.Text,
  'timestamp' : IDL.Int,
  'promptInput' : IDL.Text,
});
export const http_header = IDL.Record({
  'value' : IDL.Text,
  'name' : IDL.Text,
});
export const http_request_result = IDL.Record({
  'status' : IDL.Nat,
  'body' : IDL.Vec(IDL.Nat8),
  'headers' : IDL.Vec(http_header),
});
export const TransformationInput = IDL.Record({
  'context' : IDL.Vec(IDL.Nat8),
  'response' : http_request_result,
});
export const TransformationOutput = IDL.Record({
  'status' : IDL.Nat,
  'body' : IDL.Vec(IDL.Nat8),
  'headers' : IDL.Vec(http_header),
});
export const UserPublic = IDL.Record({
  'id' : IDL.Text,
  'email' : IDL.Text,
  'createdAt' : IDL.Int,
  'subscriptionStatus' : IDL.Text,
  'requestsToday' : IDL.Nat,
  'lastRequestDate' : IDL.Nat,
  'role' : IDL.Text,
});
export const AuthResult = IDL.Variant({
  'ok' : IDL.Text,
  'err' : IDL.Text,
});
export const PromptResult = IDL.Variant({
  'ok' : IDL.Text,
  'err' : IDL.Text,
});

export const idlService = IDL.Service({
  'getApiKey' : IDL.Func([IDL.Principal], [ApiKey], ['query']),
  'getPromptHistory' : IDL.Func([IDL.Bool], [IDL.Vec(PromptHistoryEntry)], ['query']),
  'isApiKeyRegistered' : IDL.Func([], [IDL.Bool], ['query']),
  'isApiKeyRegisteredWithSession' : IDL.Func([IDL.Text], [IDL.Bool], ['query']),
  'makePromptRequest' : IDL.Func([IDL.Text], [IDL.Text], []),
  'makePromptRequestWithSession' : IDL.Func([IDL.Text, IDL.Text], [PromptResult], []),
  'registerOpenAiApiKey' : IDL.Func([IDL.Text], [], []),
  'registerOpenAiApiKeyWithSession' : IDL.Func([IDL.Text, IDL.Text], [], []),
  'testPrompt' : IDL.Func([], [IDL.Text], []),
  'transform' : IDL.Func([TransformationInput], [TransformationOutput], ['query']),
  'signUp' : IDL.Func([IDL.Text, IDL.Text], [AuthResult], []),
  'login' : IDL.Func([IDL.Text, IDL.Text], [AuthResult], []),
  'logout' : IDL.Func([IDL.Text], [], []),
  'getCurrentUser' : IDL.Func([IDL.Text], [IDL.Opt(UserPublic)], ['query']),
  'getAllUsers' : IDL.Func([IDL.Text], [IDL.Vec(UserPublic)], ['query']),
  'adminSetSubscription' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
  'adminSetRole' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
  'adminResetUsage' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
  'adminDeleteUser' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const ApiKey = IDL.Text;
  const PromptHistoryEntry = IDL.Record({
    'promptOutput' : IDL.Text,
    'timestamp' : IDL.Int,
    'promptInput' : IDL.Text,
  });
  const http_header = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const http_request_result = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(http_header),
  });
  const TransformationInput = IDL.Record({
    'context' : IDL.Vec(IDL.Nat8),
    'response' : http_request_result,
  });
  const TransformationOutput = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(http_header),
  });
  const UserPublic = IDL.Record({
    'id' : IDL.Text,
    'email' : IDL.Text,
    'createdAt' : IDL.Int,
    'subscriptionStatus' : IDL.Text,
    'requestsToday' : IDL.Nat,
    'lastRequestDate' : IDL.Nat,
    'role' : IDL.Text,
  });
  const AuthResult = IDL.Variant({
    'ok' : IDL.Text,
    'err' : IDL.Text,
  });
  const PromptResult = IDL.Variant({
    'ok' : IDL.Text,
    'err' : IDL.Text,
  });
  return IDL.Service({
    'getApiKey' : IDL.Func([IDL.Principal], [ApiKey], ['query']),
    'getPromptHistory' : IDL.Func([IDL.Bool], [IDL.Vec(PromptHistoryEntry)], ['query']),
    'isApiKeyRegistered' : IDL.Func([], [IDL.Bool], ['query']),
    'isApiKeyRegisteredWithSession' : IDL.Func([IDL.Text], [IDL.Bool], ['query']),
    'makePromptRequest' : IDL.Func([IDL.Text], [IDL.Text], []),
    'makePromptRequestWithSession' : IDL.Func([IDL.Text, IDL.Text], [PromptResult], []),
    'registerOpenAiApiKey' : IDL.Func([IDL.Text], [], []),
    'registerOpenAiApiKeyWithSession' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'testPrompt' : IDL.Func([], [IDL.Text], []),
    'transform' : IDL.Func([TransformationInput], [TransformationOutput], ['query']),
    'signUp' : IDL.Func([IDL.Text, IDL.Text], [AuthResult], []),
    'login' : IDL.Func([IDL.Text, IDL.Text], [AuthResult], []),
    'logout' : IDL.Func([IDL.Text], [], []),
    'getCurrentUser' : IDL.Func([IDL.Text], [IDL.Opt(UserPublic)], ['query']),
    'getAllUsers' : IDL.Func([IDL.Text], [IDL.Vec(UserPublic)], ['query']),
    'adminSetSubscription' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
    'adminSetRole' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
    'adminResetUsage' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'adminDeleteUser' : IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
  });
};

export const init = ({ IDL }) => { return []; };
