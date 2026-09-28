# AGENTS.md

> **CRITICAL DIRECTIVE FOR AI AGENTS**:
> This document defines the non-negotiable architectural rules, domain constraints, API specifications, and operational guardrails for the **Peerup API**.
> 
> If any user instruction, shortcut, or suggested implementation conflicts with the rules in this document, **you MUST STOP and explicitly flag the contradiction before proceeding**. Never silently override or bypass these rules.

---

## 1. Project Overview & Scope

- **Project**: Peerup API — A peer study group and tutoring matcher for students.
- **Context**: Task 1 of a compulsory bootcamp assignment ("Build and Serve a Consumable API").
- **Core Philosophy**: The API is the product.
- **Strict Scope Boundaries**:
  - **No Authentication**: There is no authentication system for reading resources. Do NOT implement JWTs, sessions, login/signup routes, or auth middleware unless explicitly instructed with an updated contract.
  - **No Admin Panel / Extra UI**: Do NOT build landing pages, admin dashboards, or HTML views.
  - **No Images / File Uploads**: Image fields, image URLs, or file upload handlers are strictly prohibited across the schema, seed scripts, and endpoints. Bios, descriptions, and locations remain pure text.

---

## 2. Tech Stack

- **Runtime & Language**: Node.js, TypeScript
- **ORM & Database**: Prisma ORM with PostgreSQL
- **Validation**: Zod (or equivalent centralized schema validator)
- **Deployment Targets**: Railway, Render, Fly.io, or Vercel (decision deferred until the deployment stage)

---

## 3. Non-Negotiable Architecture & API Standards

### 3.1 Route Versioning
- **All** routes must be prefixed with `/api/v1/` from the very first commit without exception (e.g., `/api/v1/students`, `/api/v1/study-groups`).

### 3.2 Identifiers & Public Keys
- Every resource must expose a **12-character `nanoid`** as its public external identifier.
- **Never** expose auto-incrementing sequential integers, UUIDs, or internal database primary keys externally.
- Generate the nanoid explicitly at resource creation time in application logic; do not rely on database defaults.

### 3.3 Response Envelopes
Every API response must strictly follow these structural shapes without deviation:

#### Success (List Endpoints)
```json
{
  "data": [ ... ],
  "meta": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Success (Single Resource Endpoints)
```json
{
  "data": { ... }
}
```

#### Error Response (All 4xx / 5xx)
```json
{
  "error": {
    "code": "SPECIFIC_ERROR_CODE",
    "message": "Human-readable explanation of the error."
  }
}
```

### 3.4 HTTP Status Codes
- `200 OK` / `201 Created`: Standard success. Never return `200 OK` with an error object in the body.
- `400 Bad Request`: Invalid request parameters (e.g., negative offset, unsupported sort parameter).
- `404 Not Found`: Requested resource does not exist.
- `422 Unprocessable Entity`: Missing or invalid fields. The error message **must specifically name** the failing field(s).
- `409 Conflict`: Conflict states such as `SESSION_FULL`, `ALREADY_BOOKED`, and `SESSION_NOT_BOOKABLE`.
- `429 Too Many Requests`: Rate limit exceeded. Must include a `Retry-After` header.
- `500 Internal Server Error`: Unexpected server faults only. Never return `500` for client input errors.

### 3.5 Pagination & Query Parameters
- Applicable to all collection/list endpoints.
- Query params:
  - `limit`: Default `20`, maximum `100`. Clamp values above 100 down to 100 (do not reject).
  - `offset`: Default `0`. Reject negative values with `400 Bad Request`.
- Meta object must include `total`, `limit`, `offset`, and `hasMore` (`offset + limit < total`).

### 3.6 Validation Strategy
- Request bodies, URL path params, and query strings must be validated using centralized schema definitions (e.g., Zod schemas).
- Schema validation rules must live in a dedicated schemas directory per resource (e.g., `src/modules/<resource>/<resource>.schema.ts`), never scattered inside route controllers or handlers.

### 3.7 Rate Limiting
- Keyed by client IP address.
- Default limit: **100 requests per minute**.
- Must be configurable via a central config file/environment variable — never hardcoded within middleware or route handlers.

### 3.8 In-Scope Endpoints
- `GET /api/v1/students`
- `GET /api/v1/students/:id`
- `GET /api/v1/subjects`
- `GET /api/v1/subjects/:id`
- `GET /api/v1/subjects/:id/study-groups`
- `GET /api/v1/study-groups`
- `GET /api/v1/study-groups/:id`
- `GET /api/v1/study-groups/:id/sessions`
- `GET /api/v1/sessions`
- `GET /api/v1/sessions/:id`
- `GET /api/v1/bookings`
- `POST /api/v1/bookings`
- `GET /api/v1/bookings/:id`
- `PATCH /api/v1/bookings/:id`
- `DELETE /api/v1/bookings/:id`

Anything not listed above is out of scope.

Browser consumers are a separate deployment, so CORS configuration is an in-scope deployment concern. Allowed origins must be configurable through `CORS_ORIGINS`.

---

## 4. Data Model & Business Rules

### 4.1 Entities & Join Tables
1. **Students**
2. **Subjects**
3. **StudyGroups**
4. **Sessions**
5. **Bookings**
6. **StudentSubject** (Join table)
7. **StudyGroupMember** (Join table)

### 4.2 Invariant Business Rules
1. **Duplicate Booking Prevention**: A student cannot hold two confirmed bookings for the same session. This **must be enforced via a unique database constraint** (compound unique key) in the Prisma schema, not solely through application code.
2. **Session Capacity Enforcement**: A session's capacity is capped by its parent study group's `maxMembers`. Before confirming a new booking, verify that current confirmed bookings `< maxMembers`.
3. **Soft Booking Cancellations**: Bookings are **never hard deleted** from the database to represent a cancellation. Update the booking `status` to `"cancelled"` and retain the record.

---

## 5. Development & Commit Discipline

- **Incremental Commits**: Commit one logical, atomic change per commit with descriptive messages.
- **Environment Integrity**:
  - Never commit `.env` or local database dumps.
  - Keep `.env.example` synchronized whenever a new environment variable is introduced.

---

## 6. Conflict Resolution Protocol for AI Agents

If the user requests something that violates this specification (e.g., adding an image avatar, omitting `/api/v1/`, using sequential IDs, returning bare arrays without envelopes, or adding a login system):

1. **PAUSE** execution immediately.
2. **FLAG** the contradiction to the user explicitly, quoting the relevant section of `AGENTS.md`.
3. **PROPOSE** how to proceed in compliance with `AGENTS.md` or await confirmation if requirements have officially changed.
