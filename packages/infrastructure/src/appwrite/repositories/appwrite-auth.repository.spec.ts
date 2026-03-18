import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppwriteAuthRepository } from "./appwrite-auth.repository";
import { Client, OAuthProvider, AppwriteException, Models } from "appwrite";

// 1. Hoisted mocks for sharing across factory and tests
const {
  mockCreate,
  mockCreateEmailPasswordSession,
  mockGet,
  mockCreateOAuth2Token,
  mockCreateSession,
  mockDeleteSession,
  mockCreateAnonymousSession,
  mockUpdateEmail,
  mockUpdateName,
  mockGetRow,
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockCreateEmailPasswordSession: vi.fn(),
  mockGet: vi.fn(),
  mockCreateOAuth2Token: vi.fn(),
  mockCreateSession: vi.fn(),
  mockDeleteSession: vi.fn().mockResolvedValue({}),
  mockCreateAnonymousSession: vi.fn(),
  mockUpdateEmail: vi.fn(),
  mockUpdateName: vi.fn(),
  mockGetRow: vi.fn(),
}));

// 2. Mock Appwrite SDK
vi.mock("appwrite", () => {
  return {
    Client: class {
      setEndpoint = vi.fn().mockReturnThis();
      setProject = vi.fn().mockReturnThis();
    },
    Account: class {
      create = mockCreate;
      createEmailPasswordSession = mockCreateEmailPasswordSession;
      get = mockGet;
      createOAuth2Token = mockCreateOAuth2Token;
      createSession = mockCreateSession;
      deleteSession = mockDeleteSession;
      createAnonymousSession = mockCreateAnonymousSession;
      updateEmail = mockUpdateEmail;
      updateName = mockUpdateName;
    },
    AppwriteException: class extends Error {
      constructor(
        public override message: string,
        public code = 0,
      ) {
        super(message);
        this.name = "AppwriteException";
      }
    },
    TablesDB: class {
      getRow = mockGetRow;
    },
    ID: { unique: () => "unique-id" },
    OAuthProvider: { Google: "google" },
  };
});

describe("AppwriteAuthRepository", () => {
  let repository: AppwriteAuthRepository;
  let mockClient: Client;

  beforeEach(() => {
    vi.resetAllMocks();
    mockDeleteSession.mockResolvedValue({} as Models.Session);
    mockClient = new Client();
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    repository = new AppwriteAuthRepository(
      mockClient,
      "https://api.appwrite.io/v1",
      "project",
      "database",
      "profiles",
      logger,
    );
  });

  describe("getGoogleOAuthUrl", () => {
    it("should extract state from the URL returned by Appwrite", async () => {
      const mockState = "extracted-state-123";
      const mockUrl = `https://appwrite.io/oauth/google?state=${mockState}`;
      mockCreateOAuth2Token.mockReturnValue(mockUrl);

      const result = await repository.getGoogleOAuthUrl();

      expect(result.url).toBe(mockUrl);
      expect(result.state).toBe(mockState);
      expect(mockCreateOAuth2Token).toHaveBeenCalledWith({
        provider: OAuthProvider.Google,
      });
    });

    it("should throw if Appwrite URL is missing state", async () => {
      mockCreateOAuth2Token.mockReturnValue("https://appwrite.io/oauth/google");
      await expect(repository.getGoogleOAuthUrl()).rejects.toThrow();
    });

    it("should throw if Appwrite fails to generate a URL", async () => {
      mockCreateOAuth2Token.mockReturnValue("");
      await expect(repository.getGoogleOAuthUrl()).rejects.toThrow();
    });
  });

  describe("completeGoogleOAuth", () => {
    it("should create a session when state matches", async () => {
      mockCreateOAuth2Token.mockReturnValue("https://url.com?state=init-state");
      const initiation = await repository.getGoogleOAuthUrl();

      const callbackUrl = `exp://localhost:8081?userId=user-123&secret=secret-456&state=${initiation.state}`;
      const mockUser = { $id: "user-123", email: "test@example.com" };

      mockCreateSession.mockResolvedValue({
        $id: "session-123",
        userId: "user-123",
      } as Models.Session);
      mockGet.mockResolvedValue(mockUser as Models.User<Models.Preferences>);

      const result = await repository.completeGoogleOAuth(
        callbackUrl,
        initiation.state,
      );
      expect(result.type).toBe("authenticated");
      expect(result.userId).toBe("user-123");
      expect(mockCreateSession).toHaveBeenCalled();
    });

    it("should throw if state is invalid", async () => {
      const state = "expected";
      const callbackUrl = `exp://localhost:8081?state=mismatch&userId=1&secret=2`;
      await expect(
        repository.completeGoogleOAuth(callbackUrl, state),
      ).rejects.toThrow(/Mismatched OAuth state/);
    });
  });

  describe("register", () => {
    it("should create a new user and return AuthResult with isNewUser: true", async () => {
      const email = "test@example.com";
      const password = "Password123!";

      mockGet.mockRejectedValue(new AppwriteException("No session", 401));
      mockCreate.mockResolvedValue({
        $id: "user-123",
        email,
      } as Models.User<Models.Preferences>);

      const result = await repository.register(email, password, "testuser");

      expect(mockCreate).toHaveBeenCalledWith({
        userId: "unique-id",
        email,
        password,
        name: "testuser",
      });
      expect(result.isNewUser).toBe(true);
    });

    it("should promote an anonymous session if active", async () => {
      const email = "test@example.com";
      const password = "Password123!";
      const userId = "anonymous-123";

      mockGet.mockResolvedValueOnce({
        $id: userId,
        email: "",
      } as Models.User<Models.Preferences>);
      mockUpdateEmail.mockResolvedValue({
        $id: userId,
        email,
      } as Models.User<Models.Preferences>);
      mockUpdateName.mockResolvedValue({} as Models.User<Models.Preferences>);

      const result = await repository.register(email, password, "testuser");

      expect(mockUpdateEmail).toHaveBeenCalledWith({
        email,
        password,
      });
      expect(mockUpdateName).toHaveBeenCalledWith({ name: "testuser" });
      expect(result.isNewUser).toBe(false);
    });
  });

  describe("login", () => {
    it("should create a session and return AuthResult", async () => {
      const email = "test@example.com";
      const password = "Password123!";

      mockGet.mockRejectedValueOnce(new AppwriteException("Unauthorized", 401));
      mockCreateEmailPasswordSession.mockResolvedValueOnce(
        {} as Models.Session,
      );
      mockGet.mockResolvedValueOnce({
        $id: "user-123",
        email,
      } as Models.User<Models.Preferences>);

      const result = await repository.login(email, password);

      expect(mockCreateEmailPasswordSession).toHaveBeenCalled();
      expect(result.email).toBe(email);
    });

    it("should restore anonymous session if login fails", async () => {
      // 1. Initial guest session state (priorSessionIsAnonymous = true)
      mockGet.mockResolvedValueOnce({
        $id: "guest-123",
        email: "",
      } as Models.User<Models.Preferences>);
      // 2. Login fails on probe client
      mockCreateEmailPasswordSession.mockRejectedValue(
        new AppwriteException("Unauthorized", 401),
      );

      // 3. Verification: mockCreateAnonymousSession is called in the catch block
      mockCreateAnonymousSession.mockResolvedValue({} as Models.Session);

      await expect(repository.login("a@b.com", "p")).rejects.toThrow();

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockCreateAnonymousSession).toHaveBeenCalled();
    });
  });

  describe("loginAnonymously", () => {
    it("should create an anonymous session if none exists", async () => {
      mockGet.mockRejectedValueOnce(new AppwriteException("Unauthorized", 401));
      mockCreateAnonymousSession.mockResolvedValueOnce({} as Models.Session);
      mockGet.mockResolvedValueOnce({
        $id: "anon-123",
        email: "",
      } as Models.User<Models.Preferences>);

      const result = await repository.loginAnonymously();
      expect(mockCreateAnonymousSession).toHaveBeenCalled();
      expect(result.isNewUser).toBe(true);
    });

    it("should return existing session if already anonymous", async () => {
      const mockUser = { $id: "existing-anon", email: "" };
      mockGet.mockResolvedValue(mockUser as Models.User<Models.Preferences>);

      const result = await repository.loginAnonymously();

      expect(mockCreateAnonymousSession).not.toHaveBeenCalled();
      expect(result.userId).toBe("existing-anon");
    });
  });

  describe("logout", () => {
    it("should delete the current session", async () => {
      mockDeleteSession.mockResolvedValue({} as Models.Session);
      await repository.logout();
      expect(mockDeleteSession).toHaveBeenCalledWith({ sessionId: "current" });
    });
  });

  describe("getCurrentUserId", () => {
    it("should return userId if session is active", async () => {
      mockGet.mockResolvedValue({
        $id: "user-123",
      } as Models.User<Models.Preferences>);
      const id = await repository.getCurrentUserId();
      expect(id).toBe("user-123");
    });

    it("should return null if no session", async () => {
      mockGet.mockRejectedValue(new AppwriteException("Unauthorized", 401));
      const id = await repository.getCurrentUserId();
      expect(id).toBeNull();
    });
  });

  describe("getSessionType", () => {
    it("should return 'anonymous' for email-less user", async () => {
      mockGet.mockResolvedValue({
        $id: "guest-123",
        email: "",
      } as Models.User<Models.Preferences>);
      const type = await repository.getSessionType();
      expect(type).toBe("anonymous");
    });

    it("should return 'registered' if profile exists", async () => {
      mockGet.mockResolvedValue({
        $id: "user-123",
        email: "a@b.com",
      } as Models.User<Models.Preferences>);
      mockGetRow.mockResolvedValue({ $id: "user-123" });

      const type = await repository.getSessionType();
      expect(type).toBe("registered");
      expect(mockGetRow).toHaveBeenCalledWith({
        databaseId: "database",
        tableId: "profiles",
        rowId: "user-123",
      });
    });

    it("should return 'incomplete' if profile does not exist (404)", async () => {
      mockGet.mockResolvedValue({
        $id: "user-123",
        email: "a@b.com",
      } as Models.User<Models.Preferences>);
      mockGetRow.mockRejectedValue(new AppwriteException("Not found", 404));

      const type = await repository.getSessionType();
      expect(type).toBe("incomplete");
    });

    it("should return null if no session", async () => {
      mockGet.mockRejectedValue(new AppwriteException("Unauthorized", 401));
      const type = await repository.getSessionType();
      expect(type).toBeNull();
    });
  });
});
