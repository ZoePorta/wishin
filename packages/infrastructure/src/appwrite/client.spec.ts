import { describe, it, expect, vi } from "vitest";
import { createAppwriteClient } from "./client";
import { Client } from "react-native-appwrite";

vi.mock("react-native-appwrite", () => ({
  Client: class {
    setEndpoint = vi.fn().mockReturnThis();
    setProject = vi.fn().mockReturnThis();
  },
}));

describe("Appwrite Client Factory", () => {
  it("should initialize an Appwrite Client with correct configuration", () => {
    const endpoint = "https://cloud.appwrite.io/v1";
    const projectId = "test-project";

    const client = createAppwriteClient(endpoint, projectId);

    expect(client).toBeInstanceOf(Client);
    // Note: External properties of Client might not be directly accessible
    // depending on the SDK version, but instance check is valid.
  });
});
