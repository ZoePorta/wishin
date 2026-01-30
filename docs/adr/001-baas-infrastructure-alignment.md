# ADR 001: BaaS Infrastructure Alignment

## Status

Accepted

## Context

The project requires rapid deployment of authentication, persistence, and real-time synchronization. A custom Express API would increase maintenance overhead and infrastructure management.

## Decision

We will use **Appwrite Cloud** as the primary Backend-as-a-Service (BaaS) provider.

## Consequences

- **Velocity:** Accelerated delivery of foundational services.
- **Vendor Lock-in:** High risk of coupling with Appwrite SDK.
- **Mitigation:** Strict enforcement of the Repository Pattern to isolate the domain logic from the infrastructure provider.
