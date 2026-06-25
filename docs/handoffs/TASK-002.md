# Handoff: TASK-002 - Implement User Authentication Endpoints

* **Task ID**: TASK-002
* **Lane**: FB-Tech
* **Owner**: FB-Tech (Tech Lead and Core Developer)

---

## Goal Alignment
- `Goal Alignment`: aligned
- `Goal Challenge / Caveat`: Legacy handoff predates the Goal Alignment loop; goal is inferred from the task scope.
- `Evidence Against Goal`: Authentication endpoints, database interfaces, and Node integration tests support the original authentication goal; in-memory persistence remains a known caveat for production use.

---

## What Was Built
1. **Database Interfaces (`src/db.ts`)**:
   - Implemented in-memory Maps representing database collections for `User` and `Session`.
   - Exposed queries and mutations: `createUser`, `getUserByUsername` (case-insensitive), `getUserById`, `createSession` (valid for 24 hours), `getSessionByToken` (automatically invalidates/deletes expired sessions), and `deleteSession` (logout).

2. **Authentication Cryptography & Endpoints (`src/auth.ts`)**:
   - Built a secure password hashing mechanism using Node's built-in `crypto.pbkdf2Sync` (SHA-512 with 100,000 iterations and random salts) and verification using `crypto.timingSafeEqual` to defend against timing attacks.
   - Built a robust router using the Node.js native `http` module.
   - Handled JSON request body parsing with built-in security features, including a strict 1MB size limit to prevent Denial of Service (DoS) memory exhaustion.
   - Supported registration (`POST /api/register`), login (`POST /api/login`), logout (`POST /api/logout`), and fetching current session profile info (`GET /api/me`). Supported both standard `Authorization: Bearer <token>` and custom `x-session-token` headers.

3. **Self-Contained Test Suite (`src/auth.ts`)**:
   - Written standard assertions utilizing Node's native `assert` library.
   - Bootstrapped a real test HTTP server instance listening on a dynamic port (port `0` assigned by OS) to verify route handler integration, validating success paths, duplicate registrations, input validation, and unauthorized/authorized requests.

---

## Technical Decisions & Trade-offs
- **Zero External Dependencies**: We avoided installing heavy external modules like `bcrypt` or `express` by using Node.js's built-in `crypto` and `http` modules. This ensures the environment remains minimal, fast, and does not require complex npm environment setup/dependencies.
- **Native TypeScript Stripping**: Node v25 supports running `.ts` files directly out-of-the-box (TypeScript stripping). Thus, tests can be executed natively without a build/compilation step using `node src/auth.ts`.
- **In-Memory Storage**: The database is stored in-memory (Map). This is ideal for lightweight serverless environments, unit tests, and prototyping. In a production release, these database methods would be swapped to use a persistent driver (e.g., PostgreSQL or SQLite), but the public interfaces (`createUser`, `getUserByUsername`, etc.) remain identical.

---

## Modified/Created Files
- `src/db.ts`: In-memory user and session stores.
- `src/auth.ts`: Hashing cryptography, HTTP router, and testing suite.

---

## Testing
Tested successfully using native Node 25:
```bash
node src/auth.ts
```

### Output:
```
🧪 Running User Auth Unit & Integration Tests...
   Testing password hashing & verification...
   Testing database interface...
   Testing HTTP integration endpoints...
✅ All tests completed successfully!
```

---

## Known Risks / Caveats
- Since storage is in-memory, users/sessions are wiped upon server restart.
- Password requirements are minimal (length >= 6) and username (length >= 3). Standard production environments might require character complexity checks.

---

## Blocked Dependencies
None. Ready to be integrated by other lanes (e.g. Design for visual login forms).
