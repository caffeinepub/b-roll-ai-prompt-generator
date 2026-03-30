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

  // Core user record - kept at original shape to stay compatible with stored stable data.
  type User = {
    id : Text;
    email : Text;
    passwordHash : Text;
    createdAt : Int;
  };

  // Extension fields stored separately to avoid stable-type incompatibility on upgrade.
  type UserExtension = {
    subscriptionStatus : Text; // "free" or "paid"
    requestsToday : Nat;
    lastRequestDate : Nat; // days since Unix epoch
  };

  type UserPublic = {
    id : Text;
    email : Text;
    createdAt : Int;
    subscriptionStatus : Text;
    requestsToday : Nat;
    lastRequestDate : Nat;
    role : Text; // "user" or "admin"
  };

  type AuthResult = {
    #ok : Text; // session token
    #err : Text;
  };

  type PromptResult = {
    #ok : Text;
    #err : Text;
  };

  let FREE_DAILY_LIMIT : Nat = 5;

  let registeredApiKeys = Map.empty<Text, ApiKey>();
  let apiKeysByEmail = Map.empty<Text, ApiKey>(); // email -> ApiKey (session-based)
  let history = List.empty<PromptHistoryEntry>();

  // Auth state
  let users = Map.empty<Text, User>(); // email -> User (original shape, upgrade-compatible)
  let userExtensions = Map.empty<Text, UserExtension>(); // email -> extension fields
  let userRoles = Map.empty<Text, Text>(); // email -> "user" | "admin"
  let userEmailList = List.empty<Text>(); // ordered registration list for admin iteration
  let sessions = Map.empty<Text, Text>(); // token -> email
  var userCounter : Nat = 0;

  // Seed demo user on canister initialization
  let _demoSeed = do {
    users.add("demo@demo.dm", {
      id = "demo_user_1";
      email = "demo@demo.dm";
      passwordHash = "hash:demo1234";
      createdAt = 0;
    });
    userExtensions.add("demo@demo.dm", {
      subscriptionStatus = "free";
      requestsToday = 0;
      lastRequestDate = 0;
    });
    userEmailList.add("demo@demo.dm");
  };

  // Seed admin user on canister initialization
  let _adminSeed = do {
    users.add("medes608@gmail.com", {
      id = "admin_user_0";
      email = "medes608@gmail.com";
      passwordHash = "hash:Admin@1234";
      createdAt = 0;
    });
    userExtensions.add("medes608@gmail.com", {
      subscriptionStatus = "paid";
      requestsToday = 0;
      lastRequestDate = 0;
    });
    userRoles.add("medes608@gmail.com", "admin");
    userEmailList.add("medes608@gmail.com");
  };

  // Returns the extension for a user, with safe defaults for existing users who lack one.
  func getExtension(email : Text) : UserExtension {
    switch (userExtensions.get(email)) {
      case (?ext) { ext };
      case (null) { { subscriptionStatus = "free"; requestsToday = 0; lastRequestDate = 0 } };
    };
  };

  // Returns the role for a user, defaulting to "user".
  func getRole(email : Text) : Text {
    switch (userRoles.get(email)) {
      case (?role) { role };
      case (null) { "user" };
    };
  };

  // Returns true if the given session belongs to an admin user.
  func isAdminSession(sessionToken : Text) : Bool {
    switch (sessions.get(sessionToken)) {
      case (null) { false };
      case (?email) { getRole(email) == "admin" };
    };
  };

  // Builds a full UserPublic record from core User + extension + role.
  func buildUserPublic(email : Text, user : User) : UserPublic {
    let ext = getExtension(email);
    {
      id = user.id;
      email = user.email;
      createdAt = user.createdAt;
      subscriptionStatus = ext.subscriptionStatus;
      requestsToday = ext.requestsToday;
      lastRequestDate = ext.lastRequestDate;
      role = getRole(email);
    };
  };

  // Returns today as number of days since Unix epoch
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
        userExtensions.add(email, {
          subscriptionStatus = "free";
          requestsToday = 0;
          lastRequestDate = 0;
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
          case (?user) {
            ?buildUserPublic(email, user);
          };
        };
      };
    };
  };

  // Admin: returns all registered users. Returns empty array if session is not admin.
  public query func getAllUsers(sessionToken : Text) : async [UserPublic] {
    if (not isAdminSession(sessionToken)) { return [] };
    let emailArr = userEmailList.toArray();
    let result = List.empty<UserPublic>();
    for (email in emailArr.vals()) {
      switch (users.get(email)) {
        case (null) {}; // skip deleted users
        case (?user) { result.add(buildUserPublic(email, user)) };
      };
    };
    result.toArray();
  };

  // Admin: set subscription status for a user.
  public shared func adminSetSubscription(sessionToken : Text, email : Text, status : Text) : async Bool {
    if (not isAdminSession(sessionToken)) { return false };
    if (not users.containsKey(email)) { return false };
    let ext = getExtension(email);
    userExtensions.add(email, {
      subscriptionStatus = status;
      requestsToday = ext.requestsToday;
      lastRequestDate = ext.lastRequestDate;
    });
    true;
  };

  // Admin: set role for a user.
  public shared func adminSetRole(sessionToken : Text, email : Text, role : Text) : async Bool {
    if (not isAdminSession(sessionToken)) { return false };
    if (not users.containsKey(email)) { return false };
    userRoles.add(email, role);
    true;
  };

  // Admin: reset daily usage counters for a user.
  public shared func adminResetUsage(sessionToken : Text, email : Text) : async Bool {
    if (not isAdminSession(sessionToken)) { return false };
    if (not users.containsKey(email)) { return false };
    let ext = getExtension(email);
    userExtensions.add(email, {
      subscriptionStatus = ext.subscriptionStatus;
      requestsToday = 0;
      lastRequestDate = 0;
    });
    true;
  };

  // Admin: delete a user entirely.
  public shared func adminDeleteUser(sessionToken : Text, email : Text) : async Bool {
    if (not isAdminSession(sessionToken)) { return false };
    ignore users.remove(email);
    ignore userExtensions.remove(email);
    ignore userRoles.remove(email);
    true;
  };

  // Session-based API key management
  public shared func registerOpenAiApiKeyWithSession(sessionToken : Text, key : Text) : async () {
    if (key == "") { Runtime.trap("API key cannot be empty") };
    switch (sessions.get(sessionToken)) {
      case (null) { Runtime.trap("Invalid session") };
      case (?email) {
        apiKeysByEmail.add(email, key);
      };
    };
  };

  public query func isApiKeyRegisteredWithSession(sessionToken : Text) : async Bool {
    switch (sessions.get(sessionToken)) {
      case (null) { false };
      case (?email) {
        apiKeysByEmail.containsKey(email);
      };
    };
  };

  // Session-based prompt request with usage tracking and daily limit enforcement
  public shared func makePromptRequestWithSession(sessionToken : Text, promptContent : Text) : async PromptResult {
    switch (sessions.get(sessionToken)) {
      case (null) { return #err("Not authenticated") };
      case (?email) {
        switch (users.get(email)) {
          case (null) { return #err("User not found") };
          case (?_) {
            let ext = getExtension(email);
            let today = todayInDays();
            // Reset counter if it's a new day
            let currentRequests : Nat = if (ext.lastRequestDate != today) { 0 } else { ext.requestsToday };

            // Enforce free tier daily limit
            if (ext.subscriptionStatus == "free" and currentRequests >= FREE_DAILY_LIMIT) {
              return #err("DAILY_LIMIT_REACHED");
            };

            switch (apiKeysByEmail.get(email)) {
              case (null) { return #err("No API key registered") };
              case (?apiKey) {
                try {
                  let result = await openaiApiRequest(promptContent, apiKey, transform);
                  // Update usage counters in userExtensions
                  userExtensions.add(email, {
                    subscriptionStatus = ext.subscriptionStatus;
                    requestsToday = currentRequests + 1;
                    lastRequestDate = today;
                  });
                  updatePromptHistory(promptContent, result);
                  #ok(result);
                } catch e {
                  #err("Request failed. Please check your API key.");
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

  // Escape text for safe inclusion inside a JSON string value
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
      {
        name = "Authorization";
        value = "Bearer " # apiKey;
      },
      {
        name = "Content-Type";
        value = "application/json";
      },
    ];

    await OutCall.httpPostRequest(url, headers, json, transform);
  };

  func updatePromptHistory(promptInput : Text, promptOutput : Text) {
    let currentTime = Time.now();
    history.add({ timestamp = currentTime; promptInput; promptOutput });

    let size = history.size();
    if (size > 20) {
      history.clear();
    };
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
