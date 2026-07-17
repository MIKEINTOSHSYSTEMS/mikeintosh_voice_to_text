# Task 012 — AI Platform

**Status:** In Progress
**Depends on:** Task 011 (Platform Foundation) ✓
**Goal:** Server-side AI processing with provider abstraction, job queue, and usage tracking

---

## Objective

Transform VoiceText into an AI-powered transcription platform with server-side processing. Users upload audio → server transcribes via Whisper → AI summarizes/translates/analyzes → results delivered.

---

## Deliverables

### 1. Database Schema Extensions
- `Audio` model (file metadata, S3 key, status)
- `Job` model (BullMQ job tracking, status, result)
- `Usage` model (monthly quotas, usage counters)
- `User` model extension (tier, quota fields)

### 2. AI Provider Abstraction
- Provider interface (swap OpenAI/Anthropic/local)
- Whisper provider (speech-to-text)
- LLM provider (summarize, translate, analyze)
- Fallback chain (primary → secondary → local)

### 3. Audio Upload Pipeline
- Multipart upload handling
- Format validation (wav, mp3, m4a, webm, ogg)
- S3-compatible storage (MinIO for dev, S3/R2 for prod)
- Pre-signed URLs for secure access

### 4. Job Queue (BullMQ)
- Transcription jobs (async Whisper processing)
- AI processing jobs (summarize, translate, analyze)
- Retry logic with exponential backoff
- Priority queues (free vs. paid users)
- Progress tracking via WebSocket/SSE

### 5. AI Processing Pipeline
- Summarize transcript (GPT-4o-mini)
- Translate transcript (GPT-4o-mini)
- Analyze transcript (sentiment, key topics, action items)
- Provider abstraction (swap models easily)

### 6. Usage Tracking & Quotas
- Monthly usage counters (transcription minutes, AI requests, storage)
- Tier-based limits (Free/Pro/Team)
- Usage API endpoint
- Quota enforcement middleware

---

## Architecture

```
Upload Audio → Validate → Store in S3 → Queue Transcription Job
                                            ↓
                              Worker: Whisper API transcribes
                                            ↓
                              Store transcript in DB
                                            ↓
                              Queue AI Processing Job (optional)
                                            ↓
                              Worker: GPT-4o-mini processes
                                            ↓
                              Store AI results in DB
                                            ↓
                              Notify user via SSE/WebSocket
```

---

## API Endpoints (New)

```
POST   /api/audio/upload           Upload audio file
GET    /api/audio/:id              Get audio metadata
DELETE /api/audio/:id              Delete audio file
POST   /api/audio/:id/transcribe   Start transcription job
GET    /api/audio/:id/status       Check transcription status

POST   /api/ai/summarize           Summarize transcript
POST   /api/ai/translate           Translate transcript
POST   /api/ai/analyze             Analyze transcript
GET    /api/ai/usage               Get usage statistics

GET    /api/jobs/:id               Get job status
GET    /api/jobs                   List user's jobs
```

---

## Dependencies (New)

```json
{
  "bullmq": "^5.0.0",
  "ioredis": "^5.4.0",
  "openai": "^4.70.0",
  "@aws-sdk/client-s3": "^3.600.0",
  "@aws-sdk/s3-request-presigner": "^3.600.0",
  "@fastify/multipart": "^9.0.0",
  "@fastify/sse": "^1.0.0"
}
```

---

## Implementation Order

1. **Phase A: Schema & Dependencies** — Extend Prisma, add packages
2. **Phase B: Storage Service** — S3/MinIO upload, pre-signed URLs
3. **Phase C: Job Queue** — BullMQ setup, Redis connection
4. **Phase D: AI Providers** — Whisper + LLM abstraction
5. **Phase E: Audio Routes** — Upload, transcribe, status
6. **Phase F: AI Routes** — Summarize, translate, analyze
7. **Phase G: Usage Tracking** — Quotas, enforcement
8. **Phase H: Integration** — End-to-end testing

---

## Success Criteria

- [ ] Upload audio file → stored in S3
- [ ] Start transcription → BullMQ job created → Whisper transcribes → transcript saved
- [ ] Summarize/translate/analyze → GPT-4o-mini processes → results saved
- [ ] Usage tracking → monthly counters updated → quota enforced
- [ ] All endpoints documented in Scalar UI
- [ ] All services containerized and running

---

*Created as part of Task 012 — AI Platform Implementation.*
