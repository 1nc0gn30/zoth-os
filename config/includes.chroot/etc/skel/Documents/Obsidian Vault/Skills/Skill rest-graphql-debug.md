---
title: "rest-graphql-debug"
tags: [skill, hermes]
aliases: ["rest-graphql-debug"]
---

# rest-graphql-debug

Systematic diagnostic methodology and execution workflows for debugging REST and GraphQL APIs across the full networking and application stack. It enforces isolating the failing architectural layer before attempting code fixes.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/software-development/rest-graphql-debug/SKILL.md`

### When to Load
- An API endpoint returns unexpected HTTP status codes (401, 403, 404, 409, 422, 429, or 5xx series).
- Diagnosing GraphQL queries that return HTTP 200 OK but contain errors in the JSON response payload.
- Resolving auth failures, JWT expiration (`exp` claim decode), or header vs query parameter credential mismatches.
- Requests succeed in Postman/curl but fail in application code (Content-Type header vs serialization mismatches).
- Diagnosing webhook integration, rate-limit backoff handling, pagination loops (cursor vs offset), or network timeouts.
- Constructing regression smoke tests and contract validation checks for API endpoints.

### Layered Diagnostic Flow
1. **Connectivity & Timeouts:** Host reachability, DNS resolution, and distinguishing connect latency from server response time.
2. **TLS/SSL:** Certificate validity, hostname verification, and CA bundles.
3. **Authentication:** Bearer/Basic schemes, token expiration, and permission scopes.
4. **Request Formatting:** JSON payload serialization vs form-encoding, HTTP methods, and required fields.
5. **Response Parsing:** Validating `Content-Type` before deserialization and catching HTML error pages.
6. **Semantic & Contract Validation:** Verifying field types, IDs, timezones, and tracking correlation IDs (`X-Request-Id`, `CF-Ray`).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill systematic-debugging|systematic-debugging]] · [[Skill test-driven-development|test-driven-development]]