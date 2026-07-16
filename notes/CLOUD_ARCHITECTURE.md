# VoiceText Cloud Platform Architecture

**Version:** 1.0.0  
**Date:** 2026-07-16  
**Author:** Michael K. Teferra / MIKEINTOSHSYSTEMS  
**Status:** Architecture Plan — Not Yet Implemented

---

## 1. Executive Summary

VoiceText v1.0.0 is a local-first, browser-based Amharic transcription application. This document defines the architecture for evolving it into a cloud-enabled transcription platform.

**Core Principle:** The cloud platform extends the product — it does not replace the foundation. The current static frontend remains valuable independently. Cloud features are additive.

**Evolution Path:**

```
v1.0 (Current)     → Local-first browser app, Web Speech API
v2.0 (Target)      → Cloud sync, user accounts, server-side AI
v3.0 (Future)      → Collaboration, enterprise, multi-language AI platform
```

---

## 2. Current State Analysis

### What Exists Today

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | HTML/CSS/JS (22 modules, ~4,500 lines) | Production |
| Speech | Web Speech API (browser-side) | Production |
| AI | Client-side API calls (OpenAI/Anthropic) | Production |
| Storage | IndexedDB + localStorage | Production |
| PWA | Service Worker (cache-first) | Production |
| Backend | None | N/A |
| Auth | None | N/A |
| Database | None | N/A |
| Cloud Storage | None | N/A |

### Current Architecture Strengths

1. **Zero server dependency** — runs anywhere with a browser
2. **Privacy by default** — no data leaves the device (except Web Speech API)
3. **Offline-friendly** — PWA with cached app shell
4. **Simple deployment** — static hosting only
5. **Clean module architecture** — easy to extend

### Current Architecture Limitations

1. **No cross-device access** — transcripts trapped in one browser
2. **No user accounts** — no identity, no personalization
3. **Browser speech only** — limited to Web Speech API capabilities
4. **Client-side AI keys** — API keys in sessionStorage (ephemeral but limited)
5. **No collaboration** — single-user only
6. **No server-side processing** — large audio files limited by browser

---

## 3. Target Architecture

### 3.1 System Overview

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTS                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Web App  │  │ Mobile   │  │ Desktop  │              │
│  │ (PWA)    │  │ (Future) │  │ (Future) │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       └──────────────┼──────────────┘                    │
└──────────────────────┼──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────┼──────────────────────────────────┐
│                 API GATEWAY                              │
│            (Rate limiting, Auth, Routing)                │
└──────────────────────┼──────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────┐
│              APPLICATION SERVICES                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   Auth   │ │ Transcript│ │  Audio   │ │    AI    │  │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       └──────────────┼──────────────┼──────────┘        │
└──────────────────────┼──────────────┼───────────────────┘
                       │              │
┌──────────────────────┼──────────────┼───────────────────┐
│                 DATA LAYER                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │PostgreSQL│ │  Redis   │ │ S3 Store │ │  Queue   │  │
│  │ (Primary)│ │ (Cache)  │ │ (Audio)  │ │ (BullMQ) │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Service Responsibilities

#### Auth Service
- User registration (email + OAuth)
- Session management (JWT + refresh tokens)
- API key management (encrypted storage)
- Rate limiting per user

#### Transcript Service
- CRUD operations for transcripts
- Full-text search (PostgreSQL tsvector)
- Version history
- Sharing and permissions
- Export generation

#### Audio Service
- File upload handling (multipart)
- Format validation and conversion
- Audio storage lifecycle
- Transcription job creation
- Progress tracking

#### AI Service
- Provider abstraction (Whisper, OpenAI, Anthropic, local)
- Transcription orchestration
- Summary/translation/analysis pipeline
- Caching of AI results
- Usage tracking and quotas

#### Notification Service
- Real-time updates (WebSocket/SSE)
- Transcription completion alerts
- Collaboration notifications
- System announcements

---

## 4. Technology Recommendations

### 4.1 Backend Runtime

**Recommendation: Node.js (TypeScript)**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Node.js (TS)** | Shared language with frontend, excellent async I/O, massive ecosystem | CPU-bound tasks need worker threads | **Recommended** |
| Python (FastAPI) | Great AI/ML ecosystem, strong typing | Different language from frontend, GIL | Viable alternative |
| Go | Excellent performance, compiled | Steeper learning curve, smaller ecosystem | Overkill for initial phase |

**Rationale:** The frontend is vanilla JS. A Node.js backend keeps the entire stack in one language, reducing cognitive overhead and enabling code sharing (types, validation, prompt templates).

### 4.2 API Layer

**Recommendation: REST API with optional GraphQL**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **REST** | Simple, well-understood, cacheable | Over-fetching for complex queries | **Primary** |
| GraphQL | Flexible queries, single endpoint | Complexity, N+1 queries, caching harder | Future option |
| tRPC | End-to-end type safety | Tight coupling, less standard | Not recommended |

**Rationale:** REST covers 90% of use cases. GraphQL can be added later for complex dashboard queries if needed.

### 4.3 Database

**Recommendation: PostgreSQL**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **PostgreSQL** | Full-text search, JSON support, mature, reliable | Heavier than SQLite | **Recommended** |
| MySQL | Popular, fast | Weaker full-text search, less feature-rich | Viable |
| MongoDB | Flexible schema | Less suitable for relational data, no ACID | Not recommended |
| SQLite | Simple, embedded | Not suitable for concurrent cloud access | Local only |

**Rationale:** PostgreSQL handles transcript storage, full-text search, user management, and provides JSON support for flexible metadata. It scales well and has excellent tooling.

### 4.4 Cache Layer

**Recommendation: Redis**

- Session storage
- Rate limiting
- AI result caching
- Real-time pub/sub for notifications
- Job queue backing (via BullMQ)

### 4.5 Object Storage

**Recommendation: S3-compatible storage**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **AWS S3** | Industry standard, highly reliable | Vendor lock-in, cost at scale | **Recommended** |
| Cloudflare R2 | S3-compatible, no egress fees | Newer, less mature | Strong alternative |
| MinIO | Self-hosted, S3-compatible | Operational overhead | Self-hosted option |

**Rationale:** S3-compatible storage for audio files, exports, and assets. R2 is compelling for cost savings on egress.

### 4.6 Job Queue

**Recommendation: BullMQ (Redis-backed)**

- Async transcription jobs
- AI processing pipeline
- Email/notification delivery
- Retry logic with exponential backoff
- Priority queues (free vs. paid users)

### 4.7 AI Services

| Capability | Primary Provider | Fallback |
|-----------|-----------------|----------|
| Speech-to-Text | OpenAI Whisper API | Self-hosted Whisper, Google Cloud STT |
| Summarization | OpenAI GPT-4o-mini | Anthropic Claude Haiku |
| Translation | OpenAI GPT-4o-mini | Anthropic Claude Haiku |
| Analysis | OpenAI GPT-4o-mini | Anthropic Claude Haiku |

**Server-side Whisper (for cost control):**
- OpenAI Whisper API: $0.006/minute
- Self-hosted Whisper (via Replicate/Fly.io): ~$0.002/minute at scale
- Whisper.cpp on GPU instances: ~$0.001/minute at high volume

### 4.8 Deployment

**Recommendation: Containerized deployment**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Docker + Cloud Run** | Auto-scaling, pay-per-use, simple | Google-specific | **Recommended** |
| Docker + ECS | AWS ecosystem, more control | More configuration | Viable |
| Railway/Render | Simple, fast deployment | Less control, vendor lock-in | MVP option |
| Vercel/Netlify Functions | Simple for frontend | Not suitable for long-running jobs | Frontend only |

**Rationale:** Cloud Run (or equivalent) for API services, Cloudflare R2 for storage, managed PostgreSQL for database.

---

## 5. Migration Path

### Phase 1: Backend Foundation (v2.0-alpha)

**Goal:** Introduce backend API without changing frontend UX.

**Duration:** 4-6 weeks

**Deliverables:**
- Node.js/TypeScript API server
- PostgreSQL database with schema
- User authentication (email + Google OAuth)
- Transcript CRUD via API (mirrors current IndexedDB API)
- API client module for frontend
- Deployment pipeline (Docker + Cloud Run)

**Frontend Changes:**
- New `cloud-sync.js` module
- `StorageManager` extended with optional cloud backend
- Login/signup UI (minimal)
- Sync indicator in header

**Data Model (Phase 1):**

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transcripts
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT,
  duration INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  character_count INTEGER DEFAULT 0,
  language VARCHAR(10) DEFAULT 'am-ET',
  source VARCHAR(20) DEFAULT 'microphone', -- microphone | upload
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX idx_transcripts_search ON transcripts
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));
```

**Risk:** Data migration from IndexedDB to cloud.  
**Mitigation:** Provide one-click export/import. Keep local-first as default.

---

### Phase 2: Cloud Sync (v2.0-beta)

**Goal:** Cross-device access with cloud storage.

**Duration:** 3-4 weeks (after Phase 1)

**Deliverables:**
- Bidirectional sync (IndexedDB ↔ API)
- Conflict resolution (last-write-wins with version tracking)
- Audio file upload to S3
- Cloud transcript storage
- Sync status indicator
- Offline support maintained (queue syncs when online)

**Sync Strategy:**

```
Local Change → IndexedDB → Queue Sync → API → PostgreSQL
                                                    ↓
Cloud Change → API → WebSocket → Client → IndexedDB
```

**Conflict Resolution:**
- Version field on each transcript (integer, incremented on save)
- Client sends `ifVersionMatches` on update
- Conflict: server returns latest version, client merges or overwrites
- User sees "Sync conflict" toast with merge options

---

### Phase 3: AI Platform (v2.1)

**Goal:** Server-side AI processing with provider abstraction.

**Duration:** 4-6 weeks (after Phase 2)

**Deliverables:**
- Server-side Whisper transcription (upload → transcribe → result)
- AI processing pipeline (summarize, translate, analyze)
- Provider abstraction (swap OpenAI/Anthropic/local)
- Usage tracking and quotas
- Background job processing (BullMQ)
- Progress tracking via WebSocket

**AI Pipeline:**

```
Upload Audio → Validate → Store in S3 → Queue Job
                                            ↓
                              Worker picks up job
                                            ↓
                              Whisper API transcribes
                                            ↓
                              Store transcript in DB
                                            ↓
                              Notify user via WebSocket
                                            ↓
                              User views result
```

**Quota System:**

| Tier | Transcription | AI Processing | Storage |
|------|--------------|---------------|---------|
| Free | 60 min/month | 20 requests/month | 100 MB |
| Pro | 600 min/month | 500 requests/month | 5 GB |
| Team | 3000 min/month | Unlimited | 50 GB |

---

### Phase 4: Collaboration & Enterprise (v3.0)

**Goal:** Multi-user workflows and enterprise features.

**Duration:** 6-8 weeks (after Phase 3)

**Deliverables:**
- Transcript sharing (link + invite)
- Real-time collaboration (comments, highlights)
- Team workspaces
- Organization accounts
- Admin dashboard
- Audit logs
- SSO/SAML integration
- API access for enterprise

---

## 6. Feature Roadmap

### Must Have (v2.0)

| Feature | Priority | Phase |
|---------|----------|-------|
| User registration / login | Critical | Phase 1 |
| Cloud transcript storage | Critical | Phase 2 |
| Cross-device sync | Critical | Phase 2 |
| Server-side transcription (upload) | Critical | Phase 3 |
| API key management (server-side) | High | Phase 1 |
| Transcript sharing (private link) | High | Phase 4 |

### Should Have (v2.1)

| Feature | Priority | Phase |
|---------|----------|-------|
| AI summary (server-side) | High | Phase 3 |
| AI translation (server-side) | High | Phase 3 |
| AI analysis (server-side) | High | Phase 3 |
| Usage dashboard | Medium | Phase 3 |
| Export to PDF/DOCX | Medium | Phase 2 |
| Transcript folders/tags | Medium | Phase 2 |

### Future Ideas (v3.0+)

| Feature | Priority | Phase |
|---------|----------|-------|
| Real-time collaboration | Medium | Phase 4 |
| Speaker identification | Low | Phase 3+ |
| Meeting auto-notes | Low | Phase 3+ |
| Chat with transcript | Low | Phase 3+ |
| Voice summaries | Low | Phase 3+ |
| Mobile apps (React Native) | Medium | Phase 4 |
| Browser extension | Low | Phase 4 |
| API for third-party integration | Medium | Phase 4 |
| Self-hosted deployment option | Medium | Phase 4 |
| Multi-language support (beyond Amharic) | High | Phase 3 |

---

## 7. API Design

### 7.1 Authentication

```
POST   /api/auth/register          Create account
POST   /api/auth/login             Login
POST   /api/auth/logout            Logout
POST   /api/auth/refresh           Refresh token
POST   /api/auth/forgot-password   Reset password
GET    /api/auth/me                Current user profile
```

### 7.2 Transcripts

```
GET    /api/transcripts            List transcripts (paginated, searchable)
POST   /api/transcripts            Create transcript
GET    /api/transcripts/:id        Get transcript
PUT    /api/transcripts/:id        Update transcript
DELETE /api/transcripts/:id        Delete transcript
POST   /api/transcripts/:id/share  Generate share link
GET    /api/transcripts/shared/:token  Access shared transcript
```

### 7.3 Audio

```
POST   /api/audio/upload           Upload audio file
GET    /api/audio/:id              Get audio metadata
DELETE /api/audio/:id              Delete audio file
POST   /api/audio/:id/transcribe   Start transcription job
GET    /api/audio/:id/status       Check transcription status
```

### 7.4 AI

```
POST   /api/ai/summarize           Summarize transcript
POST   /api/ai/translate           Translate transcript
POST   /api/ai/analyze             Analyze transcript
POST   /api/ai/improve             Improve transcript text
GET    /api/ai/usage               Get usage statistics
```

### 7.5 User

```
GET    /api/user/profile           Get profile
PUT    /api/user/profile           Update profile
GET    /api/user/settings          Get settings
PUT    /api/user/settings          Update settings
GET    /api/user/api-keys          List API keys
POST   /api/user/api-keys          Create API key
DELETE /api/user/api-keys/:id      Delete API key
```

---

## 8. Security Architecture

### 8.1 Authentication

- JWT access tokens (15-minute expiry)
- Refresh tokens (7-day expiry, stored httpOnly cookie)
- OAuth 2.0 (Google, GitHub)
- bcrypt password hashing (cost factor 12)
- Rate limiting: 5 login attempts per 15 minutes

### 8.2 Authorization

- Row-level security (PostgreSQL RLS)
- Users can only access their own transcripts
- Shared transcripts via signed URLs (time-limited)
- API keys scoped to user, encrypted at rest

### 8.3 Data Protection

- All data in transit: TLS 1.3
- All data at rest: AES-256 encryption
- API keys: encrypted with user-specific key
- Audio files: encrypted in S3, pre-signed URLs for access
- Database backups: encrypted, 30-day retention

### 8.4 Privacy

- Audio files deleted after transcription (configurable)
- No analytics on transcript content
- User can export all data (GDPR compliance)
- User can delete account and all data
- Privacy policy and terms of service required

---

## 9. Frontend Evolution Strategy

### Principle: Incremental, Not Revolutionary

The current vanilla JS frontend is well-structured. Do not rewrite in React/Vue/Svelte until complexity demands it.

### Migration Approach

1. **Phase 1 (v2.0):** Add `cloud-sync.js` module — handles API communication
2. **Phase 2 (v2.0):** Add `auth.js` module — handles login/session
3. **Phase 3 (v2.1):** Add `realtime.js` module — WebSocket for live updates
4. **Phase 4 (v3.0):** Evaluate framework migration if component count exceeds 50+

### When to Consider a Framework

- If the UI requires 50+ interactive components
- If state management becomes unmanageable
- If multiple developers need to work on the frontend simultaneously
- If the app needs server-side rendering (SEO for landing pages)

Until then, the current module architecture is sufficient and has the advantage of zero build step.

---

## 10. Project Structure (Future)

```
mikeintosh-platform/
├── apps/
│   ├── web/                    # Current frontend (migrated)
│   │   ├── index.html
│   │   ├── css/
│   │   ├── js/
│   │   └── assets/
│   └── admin/                  # Admin dashboard (future)
├── packages/
│   ├── api/                    # Node.js/TypeScript API
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   ├── models/
│   │   │   └── workers/
│   │   ├── prisma/             # Database schema
│   │   └── package.json
│   ├── shared/                 # Shared types, utils
│   │   ├── types/
│   │   ├── validation/
│   │   └── prompts/
│   └── ai/                     # AI service abstraction
│       ├── providers/
│       └── pipeline/
├── infrastructure/
│   ├── docker/
│   ├── terraform/              # IaC (optional)
│   └── scripts/
├── documentation/
│   ├── architecture/
│   ├── api/
│   └── user-guides/
└── docker-compose.yml
```

---

## 11. Deployment Architecture

### Development

```bash
docker-compose up
# API: localhost:3000
# DB: localhost:5432
# Redis: localhost:6379
# Frontend: localhost:8080 (static server)
```

### Production

```
Cloudflare (CDN + DNS + DDoS protection)
    ↓
Cloud Run (API server, auto-scaling)
    ↓
Cloud SQL (PostgreSQL, managed)
    ↓
Cloud Memorystore (Redis, managed)
    ↓
Cloud Storage / R2 (Audio files)
```

### Estimated Monthly Costs (1,000 users)

| Service | Cost |
|---------|------|
| Cloud Run (API) | ~$50-100 |
| Cloud SQL (PostgreSQL) | ~$50-75 |
| Redis | ~$30-50 |
| Object Storage | ~$5-10 |
| CDN | ~$10-20 |
| AI API calls | ~$100-300 |
| **Total** | **~$250-550/month** |

---

## 12. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Web Speech API deprecation | High | Low | Server-side Whisper as backup |
| AI API cost overrun | Medium | Medium | Quotas, caching, self-hosted fallback |
| Data breach | Critical | Low | Encryption, RLS, security audits |
| Sync conflicts | Medium | Medium | Version tracking, merge UI |
| Vendor lock-in | Medium | Low | S3-compatible storage, containerized |
| Scope creep | High | Medium | Phased approach, strict feature gates |

---

## 13. Success Metrics

| Metric | v1.0 (Current) | v2.0 Target | v3.0 Target |
|--------|----------------|-------------|-------------|
| Monthly active users | N/A | 1,000 | 10,000 |
| Transcripts per user | 5-10 | 20-50 | 50-100 |
| Cross-device usage | 0% | 40% | 70% |
| AI feature usage | Client-side | 60% server-side | 90% server-side |
| Uptime | N/A | 99.5% | 99.9% |
| Response time (p95) | N/A | <200ms | <150ms |

---

## 14. Next Steps

1. **Immediate:** Finalize v1.0.0 release (Task 009 complete)
2. **Week 1-2:** Set up monorepo structure, initialize API project
3. **Week 3-4:** Database schema, authentication endpoints
4. **Week 5-6:** Transcript CRUD API, frontend sync module
5. **Week 7-8:** Deployment pipeline, staging environment
6. **Month 3:** Beta launch with cloud sync
7. **Month 4-5:** AI platform integration
8. **Month 6:** Collaboration features

---

## 15. Conclusion

The cloud platform evolution follows the ROADMAP.md principle:

> "Build a simple product exceptionally well before adding complexity."

VoiceText v1.0.0 is that simple product. The cloud architecture extends it — not replaces it. Each phase delivers standalone value. The current static frontend remains the foundation.

**Key decisions:**
- Node.js/TypeScript for backend (language consistency)
- PostgreSQL for database (full-text search, reliability)
- S3-compatible for storage (vendor flexibility)
- BullMQ for job queues (Redis-based, mature)
- Incremental migration (no rewrite)

The platform should feel professional, reliable, and trustworthy at every stage.

---

*Document prepared as part of Task 010 — Cloud Platform Evolution Roadmap.*
