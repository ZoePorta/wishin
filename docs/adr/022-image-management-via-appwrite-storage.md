# ADR 022: Image Management via Appwrite Storage

## Status

Proposed

## Context

Project Wishin requires the ability for users to upload images for wishlist items and profile avatars. We are already using Appwrite for our database and authentication, so it is natural to leverage its Storage service for file management.

## Decision

We will integrate Appwrite Storage as our primary file storage solution.

1.  **Repository Pattern**: A `StorageRepository` interface will be defined in the Domain layer to abstract file operations.
2.  **Infrastructure Implementation**: `AppwriteStorageRepository` will implement this interface using the Appwrite SDK.
3.  **Environment Configuration**: The `EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID` will be used to identify the target bucket.
4.  **Preview Generation**: We will use Appwrite's built-in preview generation features to handle image resizing and optimization before sending to the client.
5.  **Storage ID Persistence**: We will store the Appwrite `fileId` in the `imageUrl` fields of our entities (re-purposing them or ensuring they are treated as IDs when appropriate, though for simplicity in the MVP, the `imageUrl` field in the entity will store either a full URL or a relative path that can be resolved).

## Consequences

- **Pros**:
  - Consistent ecosystem with Database and Auth.
  - Native support for image optimization and previews.
  - Secure file access control integrated with Appwrite permissions.
- **Cons**:
  - Tight coupling to Appwrite Storage in the Infrastructure layer (mitigated by the Repository Pattern).
  - Need to manage file lifecycle (e.g., deleting orphaned images when items are deleted).
