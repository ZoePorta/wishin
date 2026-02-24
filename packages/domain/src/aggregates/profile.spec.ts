import { describe, it, expect } from "vitest";
import { Profile } from "./profile";
import { InvalidAttributeError } from "../errors/domain-errors";

describe("Profile Entity", () => {
  const validProps = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    username: "testuser",
    imageUrl: "https://example.com/avatar.jpg",
    bio: "Hello world",
  };

  describe("Creation (STRICT Validation)", () => {
    it("should create a valid profile", () => {
      const profile = Profile.create(validProps);
      expect(profile).toBeInstanceOf(Profile);
      expect(profile.toProps()).toEqual(validProps);
    });

    it("should create a profile when optional fields are omitted", () => {
      const minimalProps = {
        id: validProps.id,
        username: "  testuser  ", // Testing trim too
      };
      const profile = Profile.create(minimalProps);
      expect(profile).toBeInstanceOf(Profile);
      const props = profile.toProps();
      expect(props.id).toBe(validProps.id);
      expect(props.username).toBe("testuser");
      expect(props.bio).toBeUndefined();
      expect(props.imageUrl).toBeUndefined();
    });

    it("should trim username and bio during creation", () => {
      const profile = Profile.create({
        ...validProps,
        username: "  testuser  ",
        bio: "  Hello world  ",
      });
      expect(profile.toProps()).toEqual({
        ...validProps,
        username: "testuser",
        bio: "Hello world",
      });
    });

    it("should throw InvalidAttributeError if id is missing", () => {
      expect(() => Profile.create({ ...validProps, id: "" })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InvalidAttributeError if username is too short (<3 chars)", () => {
      expect(() => Profile.create({ ...validProps, username: "ab" })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InvalidAttributeError if username is too long (>30 chars)", () => {
      const longUsername = "a".repeat(31);
      expect(() =>
        Profile.create({ ...validProps, username: longUsername }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if username contains invalid characters", () => {
      expect(
        () => Profile.create({ ...validProps, username: "user name" }), // spaces
      ).toThrow(InvalidAttributeError);
      expect(
        () => Profile.create({ ...validProps, username: "user@name" }), // @ symbol
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if bio is not a string", () => {
      expect(() =>
        Profile.create({ ...validProps, bio: 123 as unknown as string }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if bio is too long (>500 chars)", () => {
      const longBio = "a".repeat(501);
      expect(() => Profile.create({ ...validProps, bio: longBio })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InvalidAttributeError if imageUrl is not a string", () => {
      expect(() =>
        Profile.create({ ...validProps, imageUrl: 123 as unknown as string }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if imageUrl is invalid", () => {
      expect(() =>
        Profile.create({ ...validProps, imageUrl: "invalid-url" }),
      ).toThrow("Invalid imageUrl: Must be a valid URL");
    });

    it("should throw InvalidAttributeError if imageUrl protocol is not http or https", () => {
      expect(() =>
        Profile.create({
          ...validProps,
          imageUrl: "ftp://example.com/image.jpg",
        }),
      ).toThrow("Invalid imageUrl: Must use http or https protocol");
    });
  });

  describe("Update", () => {
    it("should update mutable properties", () => {
      const profile = Profile.create(validProps);
      const updatedProfile = profile.update({
        username: "newusername",
        bio: "New bio",
        imageUrl: "https://example.com/new.jpg",
      });

      expect(updatedProfile).toBeInstanceOf(Profile);
      expect(updatedProfile).not.toBe(profile); // Immutability
      expect(updatedProfile.toProps()).toEqual({
        ...validProps,
        username: "newusername",
        bio: "New bio",
        imageUrl: "https://example.com/new.jpg",
      });
    });

    it("should not allow updating id via update method", () => {
      const profile = Profile.create(validProps);
      expect(() => profile.update({ id: "new-id" })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should validate properties during update", () => {
      const profile = Profile.create(validProps);
      expect(() => profile.update({ username: "ab" })).toThrow(
        InvalidAttributeError,
      );
    });
  });

  describe("Reconstitution (STRUCTURAL Validation)", () => {
    it("should reconstitute specific profile without strict business validation", () => {
      const legacyProps = {
        ...validProps,
        username: "Legacy User Name",
      };
      const profile = Profile.reconstitute(legacyProps);
      expect(profile).toBeInstanceOf(Profile);
      expect(profile.username).toBe("Legacy User Name");
    });

    it("should still enforce presence of id", () => {
      expect(() => Profile.reconstitute({ ...validProps, id: "" })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should allow anonymous IDs in reconstitution (structural mode)", () => {
      const anonymousProps = {
        ...validProps,
        id: "anon:123456789",
      };
      const profile = Profile.reconstitute(anonymousProps);
      expect(profile.id).toBe("anon:123456789");
    });
  });

  describe("Equality", () => {
    it("should return true if IDs match", () => {
      const p1 = Profile.create(validProps);
      const p2 = Profile.reconstitute(validProps);
      expect(p1.equals(p2)).toBe(true);
    });

    it("should return false if IDs different", () => {
      const p1 = Profile.create(validProps);
      const p2 = Profile.create({
        ...validProps,
        id: "999e4567-e89b-42d3-a456-426614174999",
      });
      expect(p1.equals(p2)).toBe(false);
    });
  });
});
