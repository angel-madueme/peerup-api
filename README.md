# Peerup API

Peerup is a peer study-group and tutoring matcher API. The API is served under `/api/v1` and returns JSON envelopes for every response.

## Running locally

```bash
npm install
npm run build
npm start
```

The server listens on `http://localhost:3000` by default. The database connection is read from `DATABASE_URL`.

## Response and query conventions

List endpoints return `{ "data": [], "meta": { "total": 0, "limit": 20, "offset": 0, "hasMore": false } }`. Single resources return `{ "data": {} }`; errors always return `{ "error": { "code": "...", "message": "..." } }`.

Every list endpoint accepts `limit` (number, default `20`, maximum `100`; values above `100` are clamped), `offset` (number, default `0`, must be non-negative), `sort` (resource-specific), and `order` (`asc` or `desc`, default `asc`).

## Endpoints

### Students

#### `GET /api/v1/students`

Query parameters: `limit` number default `20` max `100`; `offset` number default `0`; `sort` `name|createdAt` default `createdAt`; `order` `asc|desc` default `asc`; `isTutor` boolean; `subjectId` 12-character alphanumeric id.

```bash
curl "http://localhost:3000/api/v1/students?isTutor=true&limit=20&sort=name&order=asc"
```

```json
{ "data": [{ "id": "a1b2c3d4e5f6", "name": "Ada Lovelace", "email": "student001@peerup.example", "bio": "Enjoys problem solving.", "isTutor": true, "createdAt": "2026-09-28T10:00:00.000Z", "subjects": [] }], "meta": { "total": 1, "limit": 20, "offset": 0, "hasMore": false } }
```

#### `GET /api/v1/students/:id`

Path parameter: `id` is a 12-character alphanumeric id.

```bash
curl "http://localhost:3000/api/v1/students/a1b2c3d4e5f6"
```

```json
{ "data": { "id": "a1b2c3d4e5f6", "name": "Ada Lovelace", "email": "student001@peerup.example", "bio": null, "isTutor": true, "createdAt": "2026-09-28T10:00:00.000Z", "subjects": [] } }
```

### Subjects

#### `GET /api/v1/subjects`

Query parameters: `limit` number default `20` max `100`; `offset` number default `0`; `sort` `name` default `name`; `order` `asc|desc` default `asc`; `category` string.

```bash
curl "http://localhost:3000/api/v1/subjects?category=Math&limit=20"
```

```json
{ "data": [{ "id": "a1b2c3d4e5f6", "name": "Calculus II", "category": "Math" }], "meta": { "total": 1, "limit": 20, "offset": 0, "hasMore": false } }
```

#### `GET /api/v1/subjects/:id`

Path parameter: `id` is a 12-character alphanumeric id.

```bash
curl "http://localhost:3000/api/v1/subjects/a1b2c3d4e5f6"
```

```json
{ "data": { "id": "a1b2c3d4e5f6", "name": "Calculus II", "category": "Math" } }
```

#### `GET /api/v1/subjects/:id/study-groups`

Path parameter: `id` is a 12-character alphanumeric id. Query parameters: `limit` number default `20` max `100`; `offset` number default `0`; `sort` `name|createdAt` default `createdAt`; `order` `asc|desc` default `asc`; `hasSpace` boolean.

```bash
curl "http://localhost:3000/api/v1/subjects/a1b2c3d4e5f6/study-groups?hasSpace=true"
```

```json
{ "data": [{ "id": "b1c2d3e4f5g6", "name": "Calculus II Study Circle", "description": "A peer-led group.", "maxMembers": 8, "memberCount": 5, "subject": { "id": "a1b2c3d4e5f6", "name": "Calculus II", "category": "Math" }, "nextSession": null }], "meta": { "total": 1, "limit": 20, "offset": 0, "hasMore": false } }
```

### Study groups

#### `GET /api/v1/study-groups`

Query parameters: `limit` number default `20` max `100`; `offset` number default `0`; `sort` `name|createdAt` default `createdAt`; `order` `asc|desc` default `asc`; `subjectId` 12-character alphanumeric id; `hasSpace` boolean.

```bash
curl "http://localhost:3000/api/v1/study-groups?hasSpace=true&sort=name"
```

```json
{ "data": [{ "id": "b1c2d3e4f5g6", "name": "Calculus II Study Circle", "description": "A peer-led group.", "maxMembers": 8, "memberCount": 5, "subject": { "id": "a1b2c3d4e5f6", "name": "Calculus II", "category": "Math" }, "nextSession": null }], "meta": { "total": 1, "limit": 20, "offset": 0, "hasMore": false } }
```

#### `GET /api/v1/study-groups/:id`

Path parameter: `id` is a 12-character alphanumeric id.

```bash
curl "http://localhost:3000/api/v1/study-groups/b1c2d3e4f5g6"
```

```json
{ "data": { "id": "b1c2d3e4f5g6", "name": "Calculus II Study Circle", "description": "A peer-led group.", "maxMembers": 8, "memberCount": 5, "subject": { "id": "a1b2c3d4e5f6", "name": "Calculus II", "category": "Math" }, "nextSession": null } }
```

#### `GET /api/v1/study-groups/:id/sessions`

Path parameter: `id` is a 12-character alphanumeric id. Query parameters: `limit` number default `20` max `100`; `offset` number default `0`; `sort` `startTime` default `startTime`; `order` `asc|desc` default `asc`; `status` `scheduled|completed|cancelled`; `when` `upcoming|past`; `studentId` optional 12-character alphanumeric id.

```bash
curl "http://localhost:3000/api/v1/study-groups/b1c2d3e4f5g6/sessions?when=upcoming&studentId=c1d2e3f4g5h6"
```

```json
{ "data": [{ "id": "d1e2f3g4h5i6", "startTime": "2026-10-01T10:00:00.000Z", "endTime": "2026-10-01T11:30:00.000Z", "locationOrLink": "Library Room 204", "status": "scheduled", "confirmedCount": 3, "isFull": false, "bookedByStudent": true }], "meta": { "total": 1, "limit": 20, "offset": 0, "hasMore": false } }
```

### Sessions

#### `GET /api/v1/sessions`

Query parameters: `limit` number default `20` max `100`; `offset` number default `0`; `sort` `startTime` default `startTime`; `order` `asc|desc` default `asc`; `studyGroupId` 12-character alphanumeric id; `status` `scheduled|completed|cancelled`; `when` `upcoming|past`.

```bash
curl "http://localhost:3000/api/v1/sessions?when=upcoming&status=scheduled"
```

```json
{ "data": [{ "id": "d1e2f3g4h5i6", "startTime": "2026-10-01T10:00:00.000Z", "endTime": "2026-10-01T11:30:00.000Z", "locationOrLink": "Library Room 204", "status": "scheduled", "confirmedCount": 3, "isFull": false, "studyGroup": { "id": "b1c2d3e4f5g6", "name": "Calculus II Study Circle" } }], "meta": { "total": 1, "limit": 20, "offset": 0, "hasMore": false } }
```

#### `GET /api/v1/sessions/:id`

Path parameter: `id` is a 12-character alphanumeric id.

```bash
curl "http://localhost:3000/api/v1/sessions/d1e2f3g4h5i6"
```

```json
{ "data": { "id": "d1e2f3g4h5i6", "startTime": "2026-10-01T10:00:00.000Z", "endTime": "2026-10-01T11:30:00.000Z", "locationOrLink": "Library Room 204", "status": "scheduled", "confirmedCount": 3, "isFull": false, "studyGroup": { "id": "b1c2d3e4f5g6", "name": "Calculus II Study Circle" } } }
```

### Bookings

#### `GET /api/v1/bookings`

Query parameters: `limit` number default `20` max `100`; `offset` number default `0`; `sort` `createdAt|sessionStartTime` default `createdAt`; `order` `asc|desc` default `asc`; `studentId` 12-character alphanumeric id; `status` `confirmed|cancelled`; `when` `upcoming|past` based on session start time.

```bash
curl "http://localhost:3000/api/v1/bookings?studentId=c1d2e3f4g5h6&status=confirmed"
```

```json
{ "data": [{ "id": "e1f2g3h4i5j6", "studentId": "c1d2e3f4g5h6", "sessionId": "d1e2f3g4h5i6", "status": "confirmed", "createdAt": "2026-09-28T10:00:00.000Z", "updatedAt": "2026-09-28T10:00:00.000Z", "session": { "id": "d1e2f3g4h5i6", "startTime": "2026-10-01T10:00:00.000Z", "endTime": "2026-10-01T11:30:00.000Z", "locationOrLink": "Library Room 204", "status": "scheduled" }, "studyGroup": { "id": "b1c2d3e4f5g6", "name": "Calculus II Study Circle", "memberCount": 5, "maxMembers": 8 }, "subject": { "id": "a1b2c3d4e5f6", "name": "Calculus II", "category": "Math" } }], "meta": { "total": 1, "limit": 20, "offset": 0, "hasMore": false } }
```

#### `POST /api/v1/bookings`

Request body: `studentId` and `sessionId`, both 12-character alphanumeric ids. The endpoint returns `409 SESSION_NOT_BOOKABLE`, `409 ALREADY_BOOKED`, or `409 SESSION_FULL` for the corresponding conflict.

```bash
curl -X POST "http://localhost:3000/api/v1/bookings" -H "content-type: application/json" -d '{"studentId":"c1d2e3f4g5h6","sessionId":"d1e2f3g4h5i6"}'
```

```json
{ "data": { "id": "e1f2g3h4i5j6", "studentId": "c1d2e3f4g5h6", "sessionId": "d1e2f3g4h5i6", "status": "confirmed", "session": { "id": "d1e2f3g4h5i6", "startTime": "2026-10-01T10:00:00.000Z", "endTime": "2026-10-01T11:30:00.000Z", "locationOrLink": "Library Room 204", "status": "scheduled" }, "studyGroup": { "id": "b1c2d3e4f5g6", "name": "Calculus II Study Circle", "memberCount": 5, "maxMembers": 8 }, "subject": { "id": "a1b2c3d4e5f6", "name": "Calculus II", "category": "Math" } } }
```

#### `GET /api/v1/bookings/:id`

Path parameter: `id` is a 12-character alphanumeric id. The response has the same embedded shape as the bookings list.

```bash
curl "http://localhost:3000/api/v1/bookings/e1f2g3h4i5j6"
```

```json
{ "data": { "id": "e1f2g3h4i5j6", "studentId": "c1d2e3f4g5h6", "sessionId": "d1e2f3g4h5i6", "status": "confirmed", "session": { "id": "d1e2f3g4h5i6", "startTime": "2026-10-01T10:00:00.000Z", "endTime": "2026-10-01T11:30:00.000Z", "locationOrLink": "Library Room 204", "status": "scheduled" }, "studyGroup": { "id": "b1c2d3e4f5g6", "name": "Calculus II Study Circle", "memberCount": 5, "maxMembers": 8 }, "subject": { "id": "a1b2c3d4e5f6", "name": "Calculus II", "category": "Math" } } }
```

#### `PATCH /api/v1/bookings/:id`

Path parameter: `id` is a 12-character alphanumeric id. Request body: `{ "status": "cancelled" }`. Cancelling an already cancelled booking is idempotent.

```bash
curl -X PATCH "http://localhost:3000/api/v1/bookings/e1f2g3h4i5j6" -H "content-type: application/json" -d '{"status":"cancelled"}'
```

```json
{ "data": { "id": "e1f2g3h4i5j6", "studentId": "c1d2e3f4g5h6", "sessionId": "d1e2f3g4h5i6", "status": "cancelled", "session": { "id": "d1e2f3g4h5i6", "startTime": "2026-10-01T10:00:00.000Z", "endTime": "2026-10-01T11:30:00.000Z", "locationOrLink": "Library Room 204", "status": "scheduled" }, "studyGroup": { "id": "b1c2d3e4f5g6", "name": "Calculus II Study Circle", "memberCount": 5, "maxMembers": 8 }, "subject": { "id": "a1b2c3d4e5f6", "name": "Calculus II", "category": "Math" } } }
```

#### `DELETE /api/v1/bookings/:id`

Path parameter: `id` is a 12-character alphanumeric id. Returns `204 No Content`. The app does not use DELETE for cancellation; cancellation uses the PATCH endpoint so the row is retained.

```bash
curl -i -X DELETE "http://localhost:3000/api/v1/bookings/e1f2g3h4i5j6"
```

```text
HTTP/1.1 204 No Content
```

## Design decisions

The resources are students, subjects, study groups, sessions, and bookings because they represent the complete matching and attendance flow: students have subject interests, groups organize peers around subjects, sessions create bookable time slots, and bookings record attendance state.

Nanoid identifiers give every public resource a short, non-sequential key. They avoid exposing database ordering while remaining convenient in URLs and small enough for client payloads.

Offset pagination is simple for the assignment and makes page counts and `hasMore` metadata straightforward. Cursor pagination would be more stable and efficient for rapidly changing or very large lists, but would require opaque cursors, deterministic tie-breakers, and different client navigation semantics.

The envelope keeps collection metadata beside the data and gives all errors one predictable shape. Clients can therefore share response handling across resources without guessing whether a response is a bare object, array, or error format.
