# agentic-sdlc-demo-live

Fresh live target for the agentic-SDLC harness optimizer loop.

## Harness

This repo is governed by the agentic-SDLC harness (see AGENTS.md).

## API Reference

Base path: `/api/todos`

### List todos

`GET /api/todos`

Returns all todos.

- **200** — JSON array of todo objects (empty array when none exist).

### Create a todo

`POST /api/todos`

Request body: `{ "title": "<non-empty string>" }`

Server-owned fields (`id`, `completed`, `createdAt`) are always assigned by the server and any client-supplied values for these fields are ignored.

- **201** — `{ "id": string, "title": string, "completed": false, "createdAt": string (ISO-8601) }`
- **400** — `{ "error": "Invalid request payload" }` — when `title` is missing, blank, whitespace-only, or not a string.

### Get a todo

`GET /api/todos/:id`

- **200** — the todo object.
- **404** — `{ "error": "Todo not found" }` — when the id does not exist.

### Update a todo

`PUT /api/todos/:id`

Request body: partial update — `title` (non-empty string) and/or `completed` (boolean). `id` and `createdAt` are never mutated.

- **200** — the updated todo object.
- **400** — `{ "error": "Invalid request payload" }` — when `title` is present but not a non-empty string, `completed` is present but not a boolean, or the body contains no valid updatable field.
- **404** — `{ "error": "Todo not found" }` — when the id does not exist.

### Delete a todo

`DELETE /api/todos/:id`

- **204** — empty body; the todo is removed.
- **404** — `{ "error": "Todo not found" }` — when the id does not exist.
