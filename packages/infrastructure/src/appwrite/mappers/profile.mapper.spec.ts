import { describe, it, expect } from "vitest";
import { ProfileMapper, type ProfileDocument } from "./profile.mapper";
import { Profile, InvalidAttributeError } from "@wishin/domain";
import type { Models } from "react-native-appwrite";

describe("ProfileMapper", () => {
  const mockDoc: ProfileDocument = {
    $id: "user-123",
    $collectionId: "profiles",
    $databaseId: "db",
    $createdAt: "2023-01-01T00:00:00Z",
    $updatedAt: "2023-01-01T00:00:00Z",
    $permissions: [],
    $sequence: 0,
    username: "testuser",
    imageUrl: "https://example.com/image.jpg",
    bio: "Test bio",
  };

  describe("toDomain", () => {
    it("should convert a valid Appwrite document to a Profile entity", () => {
      const result = ProfileMapper.toDomain(mockDoc);

      expect(result).toBeInstanceOf(Profile);
      expect(result.id).toBe("user-123");
      expect(result.username).toBe("testuser");
      expect(result.imageUrl).toBe("https://example.com/image.jpg");
      expect(result.bio).toBe("Test bio");
    });

    it("should handle missing optional fields", () => {
      const minimalDoc: ProfileDocument = {
        $id: "user-123",
        $collectionId: "profiles",
        $databaseId: "db",
        $createdAt: "2023-01-01T00:00:00Z",
        $updatedAt: "2023-01-01T00:00:00Z",
        $permissions: [],
        $sequence: 0,
        username: "testuser",
      };

      const result = ProfileMapper.toDomain(minimalDoc);

      expect(result.username).toBe("testuser");
      expect(result.imageUrl).toBeUndefined();
      expect(result.bio).toBeUndefined();
    });

    it("should throw InvalidAttributeError if $id is missing", () => {
      const invalidDoc = { ...mockDoc, $id: "" } as unknown as Models.Document;

      expect(() => ProfileMapper.toDomain(invalidDoc)).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InvalidAttributeError if username is missing", () => {
      const invalidDoc = { ...mockDoc };
      // @ts-expect-error - Testing runtime validation by deleting required field
      delete invalidDoc.username;

      expect(() => ProfileMapper.toDomain(invalidDoc)).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InvalidAttributeError if username is not a string", () => {
      const invalidDoc = {
        ...mockDoc,
        username: 123,
      } as unknown as Models.Document;

      expect(() => ProfileMapper.toDomain(invalidDoc)).toThrow(
        InvalidAttributeError,
      );
    });
  });

  describe("toPersistence", () => {
    it("should convert a Profile entity to persistence format", () => {
      const profile = Profile.reconstitute({
        id: "user-123",
        username: "testuser",
        imageUrl: "https://example.com/image.jpg",
        bio: "Test bio",
      });

      const result = ProfileMapper.toPersistence(profile);

      expect(result).toEqual({
        username: "testuser",
        imageUrl: "https://example.com/image.jpg",
        bio: "Test bio",
      });
    });
  });
});
