import Map "mo:core/Map";
import Text "mo:core/Text";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import OutCall "http-outcalls/outcall";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Char "mo:core/Char";
import Nat "mo:core/Nat";

actor {
  type ApiKey = Text;

  type PromptHistoryEntry = {
    timestamp : Int;
    promptInput : Text;
    promptOutput : Text;
  };

  module PromptHistoryEntry {
    public func compare(entry1 : PromptHistoryEntry, entry2 : PromptHistoryEntry) : Order.Order {
      Int.compare(entry2.timestamp, entry1.timestamp);
    };
  };

  type User = {
    id : Text;
    email : Text;
    passwordHash : Text;
    createdAt : Int;
  };

  // V1 type: matches what was stored in the live canister.
  // Kept for stable-variable upgrade compatibility (M0170).
  // Data is migrated to userExtensionsNew in postupgrade, then cleared.
  type UserExtensionV1 = {
    subscriptionStatus : Text; // "free" or "paid"
    requestsToday : Nat;
    lastRequestDate : Nat;
  };

  // Current extension type with plan-based tiers and Stripe prep fields.
  type UserExtension = {
    plan : Text; // "free" | "starter" | "pro" | "elite"
    requestsToday : Nat;
    lastRequestDate : Nat;
    stripeCustomerId : Text;
    stripeSubscriptionId : Text;
  };

  type UserPublic = {
    id : Text;
    email : Text;
    createdAt : Int;
    plan : Text;
    requestsToday : Nat;
    lastRequestDate : Nat;
    role : Text; // "user" or "admin"
    stripeCustomerId : Text;
    stripeSubscriptionId : Text;
  };

  type AuthResult = {
    #ok : Text;
    #err : Text;
  };

  type PromptResult = {
    #ok : Text;
    #err : Text;
  };

  // Kept for upgrade compatibility (M0169): was a stable variable in the previous version.
  let FREE_DAILY_LIMIT : Nat = 3;

  // Per-plan daily request limits.
  func getDailyLimit(plan : Text) : Nat {
    if (plan == "starter") { 25 }
    else if (plan == "pro") { 100 }
    else if (plan == "elite") { 300 }
    else { FREE_DAILY_LIMIT }; // free
  };

  let registeredApiKeys = Map.empty<Text, ApiKey>();
  let apiKeysByEmail = Map.empty<Text, ApiKey>();
  let history = List.empty<PromptHistoryEntry>();

  let users = Map.empty<Text, User>();

  // LEGACY stable var: same name and type as the live canister's userExtensions.
  // Motoko deserializes old stable memory into this. Migrated to userExtensionsNew
  // in postupgrade, then cleared to free memory.
  let userExtensions = Map.empty<Text, UserExtensionV1>();

  // NEW stable var: holds all current UserExtension data after migration.
  let userExtensionsNew = Map.empty<Text, UserExtension>();

  let userRoles = Map.empty<Text, Text>();
  let userEmailList = List.empty<Text>();
  let sessions = Map.empty<Text, Text>();
  var userCounter : Nat = 0;

  // System-wide configuration (e.g., the shared OpenAI API key).
  let systemConfig = Map.empty<Text, Text>();

  // Seed demo user
  let _demoSeed = do {
    users.add("demo@demo.dm", {
      id = "demo_user_1";
      email = "demo@demo.dm";
      passwordHash = "hash:demo1234";
      createdAt = 0;
    });
    userExtensionsNew.add("demo@demo.dm", {
      plan = "free";
      requestsToday = 0;
      lastRequestDate = 0;
      stripeCustomerId = "";
      stripeSubscriptionId = "";
    });
    userEmailList.add("demo@demo.dm");
  };

  // Seed admin user
  let _adminSeed = do {
    users.add("medes608@gmail.com", {
      id = "admin_user_0";
      email = "medes608@gmail.com";
      passwordHash = "hash:Admin@1234";
      createdAt = 0;
    });
    userExtensionsNew.add("medes608@gmail.com", {
      plan = "elite";
      requestsToday = 0;
      lastRequestDate = 0;
      stripeCustomerId = "";
      stripeSubscriptionId = "";
    });
    userRoles.add("medes608@gmail.com", "admin");
    userEmailList.add("medes608@gmail.com");
  };

  // Runs after each canister upgrade. Migrates V1 extension data to the new format.
  // On a fresh deploy userExtensions is empty so no migration runs.
  system func postupgrade() {
    if (userExtensions.size() > 0) {
      let emails = userEmailList.toArray();
      for (email in emails.vals()) {
        switch (userExtensions.get(email)) {
          case (?ext) {
            let newPlan = if (ext.subscriptionStatus == "paid") { "pro" } else { "free" };
            userExtensionsNew.add(email, {
              plan = newPlan;
              requestsToday = ext.requestsToday;
              lastRequestDate = ext.lastRequestDate;
              stripeCustomerId = "";
              stripeSubscriptionId = "";
            });
          };
          case (null) {};
        };
      };
      userExtensions.clear();
    };
  };

  // Returns the extension for a user, with safe defaults.
  func getExtension(email : Text) : UserExtension {
    switch (userExtensionsNew.get(email)) {
      case (?ext) { ext };
      case (null) { { plan = "free"; requestsToday = 0; lastRequestDate = 0; stripeCustomerId = ""; stripeSubscriptionId = "" } };
    };
  };

  func getRole(email : Text) : Text {
    switch (userRoles.get(email)) {
      case (?role) { role };
      case (null) { "user" };
    };
  };

  func isAdminSession(sessionToken : Text) : Bool {
    switch (sessions.get(sessionToken)) {
      case (null) { false };
      case (?email) { getRole(email) == "admin" };
    };
  };

  func buildUserPublic(email : Text, user : User) : UserPublic {
    let ext = getExtension(email);
    {
      id = user.id;
      email = user.email;
      createdAt = user.createdAt;
      plan = ext.plan;
      requestsToday = ext.requestsToday;
      lastRequestDate = ext.lastRequestDate;
      role = getRole(email);
      stripeCustomerId = ext.stripeCustomerId;
      stripeSubscriptionId = ext.stripeSubscriptionId;
    };
  };

  func todayInDays() : Nat {
    let ns : Int = Time.now();
    if (ns <= 0) { return 0 };
    let absNs : Nat = Int.abs(ns);
    absNs / 86_400_000_000_000;
  };

  func generateId() : Text {
    userCounter += 1;
    "user_" # userCounter.toText() # "_" # Time.now().toText();
  };

  func generateToken(email : Text) : Text {
    "tok_" # email # "_" # Time.now().toText();
  };

  func hashPassword(password : Text) : Text {
    "hash:" # password;
  };

  func verifyPassword(password : Text, hash : Text) : Bool {
    hash == "hash:" # password;
  };

  public shared func signUp(email : Text, password : Text) : async AuthResult {
    if (email.size() == 0) { return #err("Email cannot be empty") };
    if (password.size() < 6) { return #err("Password must be at least 6 characters") };
    switch (users.get(email)) {
      case (?_) { return #err("Email already registered") };
      case (null) {
        let id = generateId();
        let user : User = {
          id;
          email;
          passwordHash = hashPassword(password);
          createdAt = Time.now();
        };
        users.add(email, user);
        userExtensionsNew.add(email, {
          plan = "free";
          requestsToday = 0;
          lastRequestDate = 0;
          stripeCustomerId = "";
          stripeSubscriptionId = "";
        });
        userEmailList.add(email);
        let token = generateToken(email);
        sessions.add(token, email);
        #ok(token);
      };
    };
  };

  public shared func login(email : Text, password : Text) : async AuthResult {
    switch (users.get(email)) {
      case (null) { return #err("Invalid email or password") };
      case (?user) {
        if (not verifyPassword(password, user.passwordHash)) {
          return #err("Invalid email or password");
        };
        let token = generateToken(email);
        sessions.add(token, email);
        #ok(token);
      };
    };
  };

  public shared func logout(sessionToken : Text) : async () {
    ignore sessions.remove(sessionToken);
  };

  public query func getCurrentUser(sessionToken : Text) : async ?UserPublic {
    switch (sessions.get(sessionToken)) {
      case (null) { null };
      case (?email) {
        switch (users.get(email)) {
          case (null) { null };
          case (?user) { ?buildUserPublic(email, user) };
        };
      };
    };
  };

  public query func getAllUsers(sessionToken : Text) : async [UserPublic] {
    if (not isAdminSession(sessionToken)) { return [] };
    let emailArr = userEmailList.toArray();
    let result = List.empty<UserPublic>();
    for (email in emailArr.vals()) {
      switch (users.get(email)) {
        case (null) {};
        case (?user) { result.add(buildUserPublic(email, user)) };
      };
    };
    result.toArray();
  };

  public shared func adminSetPlan(sessionToken : Text, email : Text, plan : Text) : async Bool {
    if (not isAdminSession(sessionToken)) { return false };
    if (not users.containsKey(email)) { return false };
    let ext = getExtension(email);
    userExtensionsNew.add(email, {
      plan = plan;
      requestsToday = ext.requestsToday;
      lastRequestDate = ext.lastRequestDate;
      stripeCustomerId = ext.stripeCustomerId;
      stripeSubscriptionId = ext.stripeSubscriptionId;
    });
    true;
  };

  // Legacy: kept for admin dashboard backward compat. Maps "paid" -> "pro", "free" -> "free".
  public shared func adminSetSubscription(sessionToken : Text, email : Text, status : Text) : async Bool {
    if (not isAdminSession(sessionToken)) { return false };
    if (not users.containsKey(email)) { return false };
    let ext = getExtension(email);
    let newPlan = if (status == "paid") { "pro" } else { "free" };
    userExtensionsNew.add(email, {
      plan = newPlan;
      requestsToday = ext.requestsToday;
      lastRequestDate = ext.lastRequestDate;
      stripeCustomerId = ext.stripeCustomerId;
      stripeSubscriptionId = ext.stripeSubscriptionId;
    });
    true;
  };

  // Self-service: allows the authenticated user to change their own plan.
  public shared func setUserPlan(sessionToken : Text, plan : Text) : async Bool {
    switch (sessions.get(sessionToken)) {
      case (null) { false };
      case (?email) {
        switch (users.get(email)) {
          case (null) { false };
          case (?_) {
            let ext = getExtension(email);
            userExtensionsNew.add(email, {
              plan = plan;
              requestsToday = ext.requestsToday;
              lastRequestDate = ext.lastRequestDate;
              stripeCustomerId = ext.stripeCustomerId;
              stripeSubscriptionId = ext.stripeSubscriptionId;
            });
            true;
          };
        };
      };
    };
  };

  public shared func adminSetRole(sessionToken : Text, email : Text, role : Text) : async Bool {
    if (not isAdminSession(sessionToken)) { return false };
    if (not users.containsKey(email)) { return false };
    userRoles.add(email, role);
    true;
  };

  public shared func adminResetUsage(sessionToken : Text, email : Text) : async Bool {
    if (not isAdminSession(sessionToken)) { return false };
    if (not users.containsKey(email)) { return false };
    let ext = getExtension(email);
    userExtensionsNew.add(email, {
      plan = ext.plan;
      requestsToday = 0;
      lastRequestDate = 0;
      stripeCustomerId = ext.stripeCustomerId;
      stripeSubscriptionId = ext.stripeSubscriptionId;
    });
    true;
  };

  public shared func adminDeleteUser(sessionToken : Text, email : Text) : async Bool {
    if (not isAdminSession(sessionToken)) { return false };
    ignore users.remove(email);
    ignore userExtensionsNew.remove(email);
    ignore userRoles.remove(email);
    true;
  };

  // ── System API Key (admin-only, used by all users) ──────────────────────────

  // Admin sets the single system-wide OpenAI API key used for all prompt requests.
  public shared func adminSetSystemApiKey(sessionToken : Text, key : Text) : async Bool {
    if (not isAdminSession(sessionToken)) { return false };
    if (key == "") { return false };
    systemConfig.add("openai_api_key", key);
    true;
  };

  // Admin retrieves the current system API key (full value, for display).
  public query func adminGetSystemApiKey(sessionToken : Text) : async Text {
    if (not isAdminSession(sessionToken)) { return "" };
    switch (systemConfig.get("openai_api_key")) {
      case (?key) { key };
      case (null) { "" };
    };
  };

  // Any authenticated session can check whether a system API key is configured.
  public query func isSystemApiKeySet() : async Bool {
    systemConfig.containsKey("openai_api_key");
  };

  // ── Legacy per-user key registration (kept for ABI compatibility) ───────────

  public shared func registerOpenAiApiKeyWithSession(sessionToken : Text, key : Text) : async () {
    if (key == "") { Runtime.trap("API key cannot be empty") };
    switch (sessions.get(sessionToken)) {
      case (null) { Runtime.trap("Invalid session") };
      case (?email) { apiKeysByEmail.add(email, key) };
    };
  };

  public query func isApiKeyRegisteredWithSession(sessionToken : Text) : async Bool {
    // Now reflects whether the system key is set (same for all users).
    switch (sessions.get(sessionToken)) {
      case (null) { false };
      case (?_) { systemConfig.containsKey("openai_api_key") };
    };
  };

  public shared func makePromptRequestWithSession(sessionToken : Text, promptContent : Text) : async PromptResult {
    switch (sessions.get(sessionToken)) {
      case (null) { return #err("Not authenticated") };
      case (?email) {
        switch (users.get(email)) {
          case (null) { return #err("User not found") };
          case (?_) {
            let ext = getExtension(email);
            let today = todayInDays();
            let currentRequests : Nat = if (ext.lastRequestDate != today) { 0 } else { ext.requestsToday };
            let limit = getDailyLimit(ext.plan);
            if (currentRequests >= limit) {
              return #err("DAILY_LIMIT_REACHED");
            };
            switch (systemConfig.get("openai_api_key")) {
              case (null) { return #err("No system API key configured. Please ask an admin to set the OpenAI API key.") };
              case (?apiKey) {
                try {
                  let result = await openaiApiRequest(promptContent, apiKey, transform);
                  userExtensionsNew.add(email, {
                    plan = ext.plan;
                    requestsToday = currentRequests + 1;
                    lastRequestDate = today;
                    stripeCustomerId = ext.stripeCustomerId;
                    stripeSubscriptionId = ext.stripeSubscriptionId;
                  });
                  updatePromptHistory(promptContent, result);
                  #ok(result);
                } catch e {
                  #err("Request failed. Please check the system API key.");
                };
              };
            };
          };
        };
      };
    };
  };

  func findApiKey(caller : Principal) : ApiKey {
    let callerText = caller.toText();
    switch (registeredApiKeys.get(callerText)) {
      case (null) { Runtime.trap("No API key found. User must register an OpenAI API key before making prompt requests.") };
      case (?apiKey) { apiKey };
    };
  };

  func escapeJson(text : Text) : Text {
    var result = "";
    for (c in text.chars()) {
      if (c == '\"') {
        result #= "\\\"";
      } else if (c == '\\') {
        result #= "\\\\";
      } else if (c == '\n') {
        result #= "\\n";
      } else if (c == '\r') {
        result #= "\\r";
      } else if (c == '\t') {
        result #= "\\t";
      } else {
        result #= c.toText();
      };
    };
    result;
  };

  func openaiApiRequest(promptContent : Text, apiKey : ApiKey, transform : OutCall.Transform) : async Text {
    if (apiKey == "") { Runtime.trap("Empty OpenAI API key") };
    let escaped = escapeJson(promptContent);
    let json =
      "{" #
      "\"model\":\"gpt-4o\", " #
      "\"messages\": [{\"role\": \"user\", \"content\": " #
      "\"" # escaped # "\"}]," #
      "\"max_tokens\": 2048 }";
    let url = "https://api.openai.com/v1/chat/completions";
    let headers = [
      { name = "Authorization"; value = "Bearer " # apiKey },
      { name = "Content-Type"; value = "application/json" },
    ];
    await OutCall.httpPostRequest(url, headers, json, transform);
  };

  func updatePromptHistory(promptInput : Text, promptOutput : Text) {
    let currentTime = Time.now();
    history.add({ timestamp = currentTime; promptInput; promptOutput });
    let size = history.size();
    if (size > 20) { history.clear() };
  };

  public shared ({ caller }) func registerOpenAiApiKey(openAiApiKey : Text) : async () {
    if (openAiApiKey == "") { Runtime.trap("API key cannot be empty") };
    registeredApiKeys.add(caller.toText(), openAiApiKey);
  };

  public shared ({ caller }) func makePromptRequest(promptContent : Text) : async Text {
    let apiKey = findApiKey(caller);
    let rawPromptOutput = await openaiApiRequest(promptContent, apiKey, transform);
    updatePromptHistory(promptContent, rawPromptOutput);
    rawPromptOutput;
  };

  public shared ({ caller }) func testPrompt() : async Text {
    let apiKey = findApiKey(caller);
    await openaiApiRequest("Generate 3 cinematic AI image prompts for a test scene. Return ONLY a numbered list.", apiKey, transform);
  };

  public query func transform(input: OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public query ({ caller }) func isApiKeyRegistered() : async Bool {
    registeredApiKeys.containsKey(caller.toText());
  };

  public query ({ caller }) func getPromptHistory(callerOnly : Bool) : async [PromptHistoryEntry] {
    let historyValues = history.toArray();
    let sortedHistory = historyValues.sort();
    if (callerOnly) {
      let filtered = sortedHistory.filter(
        func ({ promptInput }) {
          promptInput.contains(#text (caller.toText()));
        }
      );
      filtered;
    } else {
      sortedHistory;
    };
  };

  public query ({ caller }) func getApiKey(_ : Principal) : async ApiKey {
    findApiKey(caller);
  };
};
