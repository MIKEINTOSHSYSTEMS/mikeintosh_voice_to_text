# Mikeintosh Voice-to-Text

# Technology Stack Guidelines

---

# Purpose

This document defines the approved technology direction for Mikeintosh Voice-to-Text.

The goal is to maintain engineering consistency and prevent unnecessary technology changes.

---

# Current Development Stack

The current application should be developed using:

## Frontend

Primary technologies:

* HTML5
* CSS3
* Modern JavaScript ES6+

Current architecture:

```text
src/amh/

index.html

css/

js/

assets/
```

---

# Current Browser Technologies

Use browser-native capabilities where appropriate:

* Web Speech API
* MediaDevices API
* Web Audio API
* IndexedDB
* LocalStorage
* Clipboard API
* File API

---

# Current Application Strategy

The application is:

* Local-first.
* Privacy-conscious.
* Lightweight.
* Progressive Web App capable.

Do not introduce unnecessary frameworks during the current phase.

---

# Frontend Rules

Prefer:

* Modular JavaScript.
* Clean file separation.
* Reusable functions.
* Maintainable CSS architecture.

Avoid:

* Large dependencies without justification.
* Full rewrites.
* Framework migration without approval.

---

# Future Frontend Evolution

When application complexity requires it, migration may be considered:

Possible future stack:

```text
TypeScript

+

Vite

+

Modern frontend framework
```

Possible frameworks:

* React.
* Vue.
* Svelte.

Migration should happen only when there is clear value.

---

# AI Architecture Direction

The application must prepare for future AI capabilities.

Future support may include:

## Speech Processing

* Whisper models.
* Local AI transcription.
* Cloud transcription services.

---

## AI Intelligence

* Summarization.
* Translation.
* Transcript analysis.
* AI assistant features.

---

# Backend Future Direction

When cloud features are introduced:

Preferred backend direction:

```text
Node.js

+

TypeScript

+

Fastify
```

Alternative:

```text
Python

+

FastAPI
```

depending on AI requirements.

---

# Future Database

Preferred:

```text
PostgreSQL
```

For:

* Users.
* Transcripts.
* Metadata.
* Organizations.

---

# Future Storage

Audio files should use:

Object storage:

* S3-compatible storage.
* Cloudflare R2.
* Azure Blob Storage.

---

# AI Processing Architecture

Long-running tasks should use background processing.

Future:

```text
Queue

↓

Worker

↓

AI Processing

↓

Result
```

Possible technologies:

* Redis.
* BullMQ.
* Background workers.

---

# Deployment Direction

Future production deployment:

Frontend:

* Static hosting/CDN.

Backend:

* Dockerized services.

Database:

* Managed PostgreSQL.

---

# Important Rule

Do not prematurely implement future technologies.

Build today's requirements using today's stack while maintaining clean architecture for tomorrow.

---

# Technology Decision Principle

Choose technology based on:

1. User value.
2. Maintainability.
3. Performance.
4. Security.
5. Long-term scalability.

Do not choose technology because it is popular.

---

# Final Direction

Mikeintosh Voice-to-Text should evolve as:

```text
HTML/CSS/JavaScript

↓

Modular Frontend Architecture

↓

TypeScript

↓

AI Integration

↓

Cloud Platform

↓

Enterprise Transcription Ecosystem
```

The goal is controlled evolution, not unnecessary complexity.
