# Patient Heart Rate Service

Submitted by Or Even Hen

This project is my solution for a home assignment to build a backend service for managing patients and their heart rate readings.

## Original assignment brief

The assignment was to build a backend service in NestJS or .NET around two core entities:

- patients
- heart rate readings

Using a mock JSON dataset, the service needed to support three main capabilities:

1. return all high heart rate events where the reading is above `100 bpm`
2. calculate heart rate analytics by time range, including average, minimum, and maximum values
3. track how many times each patient's data has been requested

The main things I wanted to optimize for were the same things emphasized in the assignment: clarity, correctness, maintainability, and reasonable design choices without overbuilding the solution.

## My approach

I treated this as a small, focused API rather than trying to make it production-complete.

My goal was to keep the code easy to read and easy to review while still showing clean structure and separation of concerns. I tried to keep the design practical: enough structure to be maintainable, but not so much that it becomes unnecessary ceremony for a short take-home assignment.

## Project structure

```text
src/
  common/
    filters/
    interceptors/
    utils/
  data/
  patients/
    dto/
    models/
    responses/
  tracking/
```

I split the project this way because it felt like the cleanest balance:

- `patients/` holds the patient-related domain logic and endpoint behavior
- `tracking/` is responsible for request counting
- `common/` contains cross-cutting concerns like exception filters and interceptors
- `data/` contains the seed data and loader

For a small project like this, I think this structure is organized without being overengineered.

## Main design choices

### Modular NestJS structure

I used controllers, services, and a repository-style data access layer instead of putting all logic directly into controller methods.

That choice was mainly about keeping responsibilities clear:

- controllers handle the HTTP layer
- services handle business logic
- the repository layer reads from the dataset
- the interceptor handles request tracking
- the exception filter keeps error responses consistent

### Why I did not use a database

I intentionally did not use a database for this assignment.

The biggest reasons were:

- the assignment already centers around a provided JSON seed dataset
- I wanted to spend time on business logic, API behavior, validation, and structure rather than on database setup and persistence plumbing
- a file-based solution makes the project very easy to run and review

For this assignment scope, I think that was the right tradeoff.

That said, in a real production system I would absolutely recommend using a database. A database would be the better choice for persistent storage, larger datasets, reliable request counters, indexing, concurrency, and long-term scalability.

### Request tracking via interceptor

I implemented patient request tracking with a NestJS interceptor because I see tracking as a cross-cutting concern.

Instead of spreading counting logic across multiple endpoints, the interceptor keeps that behavior centralized and keeps the controller methods focused on the actual business use cases.

### DTOs and explicit response shapes

I used DTOs for request validation and explicit response models to make the API contract clearer.

For such a small project, this adds a little structure, but I think it improves readability and makes the intent of each endpoint easier to understand.

## Assumptions

These are the assumptions I made while implementing the assignment.

### Data assumptions

- the JSON file is the source of truth for patients and heart rate readings
- a high heart rate event means a reading strictly greater than `100 bpm`
- timestamps are valid ISO-8601 values
- analytics are calculated only from readings inside the requested range
- `from` and `to` are inclusive

### API assumptions

- missing patients should return `404`
- empty result sets should return `200` with an empty array
- analytics should return only patients with readings in the requested range
- request tracking should represent successful patient data access, not every failed attempt

Because of that last assumption, I count only successful `2xx` patient-specific requests.

Tracked requests are limited to:

- any successful (`2xx`) `GET` request that includes either:
  - a patient id path param (e.g. `GET /patients/:id`), or
  - a `patientId` query param (e.g. `GET /patients/high-heart-rate-events?patientId=...`)

The `GET /patients/request-counts` endpoint is intentionally excluded from tracking.

### Scope assumptions

- this is a take-home assignment, not a production system
- I did not add authentication, authorization, pagination, caching, or persistence beyond the provided dataset because they were outside the requested scope
- request counts are stored in memory and reset when the application restarts

## API endpoints

### Date/time query format (`from`, `to`)

All `from` / `to` query parameters are validated as **strict ISO-8601 strings** (date-only or full date-time).

Accepted examples:

- `2024-03-01`
- `2024-03-01T10:30:00Z`
- `2024-03-01T10:30:00+02:00` (note: in URLs, `+` should be URL-encoded as `%2B`)

Recommendation:

- Prefer **full date-time** values with an explicit timezone (e.g. `...Z`) to avoid ambiguity.
- If you pass a **date-only** value like `2024-03-03`, it is interpreted as midnight at the start of that day, so it will *not* include readings later on `2024-03-03` unless you set `to` accordingly.

Notes:

- `from` and `to` are **inclusive**.
- If both are provided, `from` must be **earlier than or equal to** `to`.

### `GET /patients/high-heart-rate-events`

Optional query params:

- `patientId`
- `from`
- `to`

Returns all readings where `heartRate > 100`.

### `GET /patients/analytics`

Required query params:

- `from`
- `to`

Optional query params:

- `patientId`

Returns per-patient analytics including:

- `minHeartRate`
- `maxHeartRate`
- `avgHeartRate`
- `readingsCount`

### `GET /patients/request-counts`

Returns the current in-memory request counter for each **tracked** patient.

Notes:

- Patients that have never been tracked yet will not appear in this list (they are implicitly `0`).
- The list is empty on a fresh application start.

### `GET /patients/:id`

Returns a single patient by id.

## Error handling

I added a centralized exception filter so error responses are consistent and predictable. That keeps error formatting out of the controller layer and makes the API behavior easier to reason about.

## Running the project

```bash
npm install
npm run start:dev
```

Default port: `3000` (configurable via `PORT`)

To run the compiled build:

```bash
npm run build
npm run start
```

## Running tests

```bash
npm test
npm run test:e2e
```

## What I would improve with more time

If I were taking this beyond assignment scope, these would be my next improvements:

- move the data and tracking counters to a real database
- persist request counts across restarts
- add Swagger / OpenAPI documentation
- add structured logging and better observability
- think more about performance for larger datasets

## Final notes

I tried to keep this solution focused and practical. My intention was to show clean design decisions, a maintainable structure, and clear assumptions without adding unnecessary complexity.

For the assignment scope, I believe the file-based approach was the right choice. For production, I would recommend moving this design to a proper database-backed solution.
