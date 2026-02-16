# ADR 015: Automated Infrastructure Provisioning and Namespacing

## Status

Accepted

## Context

Managing multiple environments (development, integration testing, staging, production) within a single BaaS project (Appwrite) requires a robust strategy to prevent resource collisions and data leakage. Manual provisioning of databases, collections, and attributes is error-prone, non-deterministic, and difficult to scale across a team.

## Decision

We will implement an automated, idempotent infrastructure provisioning workflow using a dedicated TypeScript script (`scripts/provision.ts`).

### 1. Resource Namespacing

All environment-specific collections will be prefixed using an `EXPO_PUBLIC_DB_PREFIX` environment variable.

- Example: `dev_users`, `test_users`.
- If the prefix is empty, the resource ID is used directly (intended for production or shared environments).

### 2. Idempotent Execution

The provisioning script must be idempotent.

- It checks for the existence of the Database and Collections before attempting creation.
- It iterates through the defined schema and creates missing attributes.
- It uses the latest Appwrite SDK object-based signatures for compatibility and future-proofing.

### 3. Cleanup Strategy

For ephemeral environments (specifically integration tests), a cleanup mechanism is provided.

- Controlled by `CLEANUP=true` environment variable.
- For safety, cleanup **requires** a non-empty `EXPO_PUBLIC_DB_PREFIX`. It only deletes collections starting with that prefix.

### 4. Developer Experience

Standardized npm scripts wrap the provisioning logic:

- `db:provision`: Standard dev provisioning.
- `db:reset`: Destructive cleanup and re-provisioning.
- `test:integration`: Automates `test` prefix setup and cleanup.

## Consequences

- **Safety**: Prefix requirement for cleanup prevents accidental deletion of the main development or production database collections.
- **Portability**: The use of `cross-env` ensures these scripts work across Windows, Linux, and macOS.
- **Maintenance**: Updates to the database schema must be reflected in `scripts/provision.ts` to be applied across environments.
- **SDK Alignment**: Migration to object-based arguments removes deprecation warnings and aligns with modern `node-appwrite` patterns.
