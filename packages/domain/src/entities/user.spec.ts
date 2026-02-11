import { describe, it, expect } from "vitest";
import { User } from "./user";
import { InvalidAttributeError } from "../errors/domain-errors";

describe("User Entity", () => {
  const validProps = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    email: "test@example.com",
    username: "testuser",
    imageUrl: "https://example.com/avatar.jpg",
    bio: "Hello world",
  };

  describe("Creation (STRICT Validation)", () => {
    it("should create a valid user", () => {
      const user = User.create(validProps);
      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(validProps.id);
      expect(user.email).toBe(validProps.email);
      expect(user.username).toBe(validProps.username);
    });

    it("should throw InvalidAttributeError if id is not a valid UUID v4", () => {
      expect(() => User.create({ ...validProps, id: "invalid-uuid" })).toThrow(
        InvalidAttributeError,
      );

      expect(
        () =>
          User.create({
            ...validProps,
            id: "123e4567-e89b-12d3-a456-426614174000",
          }), // v1
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if email is invalid", () => {
      expect(() =>
        User.create({ ...validProps, email: "invalid-email" }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if username is too short (<3 chars)", () => {
      expect(() => User.create({ ...validProps, username: "ab" })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InvalidAttributeError if username is too long (>30 chars)", () => {
      const longUsername = "a".repeat(31);
      expect(() =>
        User.create({ ...validProps, username: longUsername }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if username contains invalid characters", () => {
      expect(
        () => User.create({ ...validProps, username: "user name" }), // spaces
      ).toThrow(InvalidAttributeError);
      expect(
        () => User.create({ ...validProps, username: "user@name" }), // @ symbol
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if bio is not a string", () => {
      expect(() =>
        User.create({ ...validProps, bio: 123 as unknown as string }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if bio is too long (>500 chars)", () => {
      const longBio = "a".repeat(501);
      expect(() => User.create({ ...validProps, bio: longBio })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InvalidAttributeError if imageUrl is not a string", () => {
      expect(() =>
        User.create({ ...validProps, imageUrl: 123 as unknown as string }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if imageUrl is invalid", () => {
      expect(() =>
        User.create({ ...validProps, imageUrl: "invalid-url" }),
      ).toThrow("Invalid imageUrl: Must be a valid URL");
    });

    it("should throw InvalidAttributeError if imageUrl protocol is not http or https", () => {
      expect(() =>
        User.create({ ...validProps, imageUrl: "ftp://example.com/image.jpg" }),
      ).toThrow("Invalid imageUrl: Must use http or https protocol");
      expect(() =>
        User.create({ ...validProps, imageUrl: "javascript:alert(1)" }),
      ).toThrow("Invalid imageUrl: Must use http or https protocol");
    });

    it("should accept valid http/https imageUrl", () => {
      const userHttp = User.create({
        ...validProps,
        imageUrl: "http://example.com/image.jpg",
      });
      expect(userHttp).toBeInstanceOf(User);
      expect(userHttp.imageUrl).toBe("http://example.com/image.jpg");

      const userHttps = User.create({
        ...validProps,
        imageUrl: "https://example.com/image.jpg",
      });
      expect(userHttps).toBeInstanceOf(User);
      expect(userHttps.imageUrl).toBe("https://example.com/image.jpg");
    });
  });

  describe("Update", () => {
    it("should update mutable properties", () => {
      const user = User.create(validProps);
      const updatedUser = user.update({
        username: "newusername",
        bio: "New bio",
        imageUrl: "https://example.com/new.jpg",
      });

      expect(updatedUser).toBeInstanceOf(User);
      expect(updatedUser).not.toBe(user); // Immutability
      expect(updatedUser.username).toBe("newusername");
      expect(updatedUser.bio).toBe("New bio");
      expect(updatedUser.imageUrl).toBe("https://example.com/new.jpg");

      // Preserved attributes
      expect(updatedUser.id).toBe(user.id);
      expect(updatedUser.email).toBe(user.email);
    });

    it("should not allow updating id via update method", () => {
      const user = User.create(validProps);
      expect(() => user.update({ id: "new-id" })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should not allow updating email via update method", () => {
      const user = User.create(validProps);
      expect(() => user.update({ email: "new@example.com" })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should validate properties during update", () => {
      const user = User.create(validProps);
      expect(() => user.update({ username: "ab" })).toThrow(
        InvalidAttributeError,
      );
    });
  });

  describe("Reconstitution (STRUCTURAL Validation)", () => {
    it("should reconstitute specific user without strict business validation", () => {
      // Example: Legacy username that doesn't meet new criteria or email format is questionable but structural is fine
      // Actually spec says "Bypasses business rules (e.g., legacy username formats)".
      // Structural: id, email, username MUST be present.
      const legacyProps = {
        ...validProps,
        username: "Legacy User Name", // Spaces allowed structurally but not in strict?
        // Spec says "username must be non-empty strings" for Structural.
        // "3-30 chars, alphanumeric + .-_" for Business.
      };
      const user = User.reconstitute(legacyProps);
      expect(user).toBeInstanceOf(User);
      expect(user.username).toBe("Legacy User Name");
    });

    it("should still enforce structural integrity (valid UUID)", () => {
      expect(() => User.reconstitute({ ...validProps, id: "invalid" })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InvalidAttributeError if imageUrl is invalid during reconstitution", () => {
      expect(() =>
        User.reconstitute({ ...validProps, imageUrl: "invalid-url" }),
      ).toThrow("Invalid imageUrl: Must be a valid URL");
    });

    it("should throw InvalidAttributeError if imageUrl protocol is not http/https during reconstitution", () => {
      expect(() =>
        User.reconstitute({
          ...validProps,
          imageUrl: "ftp://example.com/image.jpg",
        }),
      ).toThrow("Invalid imageUrl: Must use http or https protocol");
    });
  });

  describe("Equality", () => {
    it("should return true if IDs match", () => {
      const u1 = User.create(validProps);
      const u2 = User.reconstitute(validProps);
      expect(u1.equals(u2)).toBe(true);
    });

    it("should return false if IDs different", () => {
      const u1 = User.create(validProps);
      const u2 = User.create({
        ...validProps,
        id: "999e4567-e89b-42d3-a456-426614174999",
      });
      expect(u1.equals(u2)).toBe(false);
    });
  });
});
