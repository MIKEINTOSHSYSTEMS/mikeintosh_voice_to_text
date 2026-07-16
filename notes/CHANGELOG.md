# Changelog

## Mikeintosh Voice-to-Text

---

## [1.1.0] - 2026-07-16

### Task 010 - Cloud Platform Evolution Roadmap

#### Added

- `notes/CLOUD_ARCHITECTURE.md` — Comprehensive cloud architecture document covering:
  - Target system architecture (API Gateway, 4 services, data layer)
  - Technology recommendations (Node.js/TS, PostgreSQL, Redis, S3, BullMQ)
  - 4-phase migration path (Foundation → Cloud Sync → AI Platform → Collaboration)
  - Feature roadmap with priorities (must/should/future)
  - REST API design (auth, transcripts, audio, AI, user endpoints)
  - Security architecture (JWT, RLS, encryption, privacy)
  - Deployment architecture (Docker, Cloud Run, managed services)
  - Cost estimates (~$250-550/month for 1,000 users)
  - Risk assessment and success metrics
  - Frontend evolution strategy (incremental, not revolutionary)

#### Architecture Decisions

- Backend: Node.js/TypeScript (language consistency with frontend)
- Database: PostgreSQL (full-text search, JSONB, RLS)
- Cache: Redis (sessions, rate limiting, queues)
- Storage: S3-compatible (AWS S3, Cloudflare R2, or MinIO)
- Queue: BullMQ (Redis-backed, async AI processing)
- API: REST primary, GraphQL optional
- Deployment: Docker containers on Cloud Run
- AI: OpenAI Whisper API primary, self-hosted fallback

#### Migration Phases

1. **Phase 1 (v2.0-alpha):** Backend foundation — auth, API, database
2. **Phase 2 (v2.0-beta):** Cloud sync — cross-device access, conflict resolution
3. **Phase 3 (v2.1):** AI platform — server-side transcription, AI pipeline
4. **Phase 4 (v3.0):** Collaboration — sharing, teams, enterprise

---

## [1.0.0] - 2026-07-16

### Release - Production Launch

This is the first stable release of VoiceText — a professional Amharic voice-to-text transcription application.

#### Features (Tasks 001-008)

**Foundation (Task 001)**
- Semantic HTML structure with proper meta tags
- CSS design system with glass-morphism, dark/light themes, responsive layout
- Microphone button with keyboard shortcut (Space/Escape)
- Basic transcript output with XSS prevention

**Recording Dashboard (Task 002)**
- Live audio visualizer with Web Audio API
- Recording timer with HH:MM:SS format
- Microphone status indicators
- AudioContext reuse for performance

**Transcript Workspace (Task 003)**
- Editable transcript with auto-save
- Text search with match navigation
- Word count, character count, reading time statistics
- Export: copy, print, download TXT/DOC, share WhatsApp/Twitter

**History & Settings (Task 004)**
- IndexedDB transcript storage with CRUD operations
- History sidebar panel with list, open, delete
- Settings modal: theme, language, auto-save, AI configuration
- Migration from legacy localStorage

**PWA Support (Task 005)**
- Web App Manifest with icons
- Service Worker with cache-first app shell strategy
- Offline banner when network lost
- Update notification with refresh

**Audio Upload & File Transcription (Task 006)**
- Drag-and-drop file upload with validation
- Audio player with play/pause/stop, seek, speed, volume
- Experimental file transcription via speech engine
- Object URL lifecycle management

**AI Features (Task 007)**
- Pluggable AI service architecture (OpenAI, Anthropic, local)
- Summarization (short/detailed/meeting)
- Translation (Amharic/English)
- Transcript analysis (key points, keywords, sentiment)
- AI UI with loading states and apply/copy/dismiss workflow

**Security & Performance (Task 008)**
- API keys stored in sessionStorage
- AudioContext created once and reused
- All promise chains with .catch() handlers
- Debounced input handlers
- CSS performance hints (will-change, contain)
- Centralized error handling module
- Speech auto-retry on transient errors

#### Technical

- 22 JavaScript modules, ~4,500 lines total
- app.js orchestrator at 726 lines (under 800 ceiling)
- No build tools, no frameworks, no dependencies
- GPL-3.0 licensed

---

## [0.7.0] - 2026-07-16

### Task 008 - Security, Privacy, and Performance Hardening

#### Added

- `js/error-handler.js` — Centralized error handling module with categories (permission, browser, storage, ai, network, file, speech), sanitized logging, user-facing messages
- Cache size limit in HistoryManager (`MAX_CACHE_SIZE = 50`) with automatic eviction

#### Security

- **S1**: AI settings (aiProvider, aiModel, aiEnabled) added to SettingsManager schema validation
- **S2**: API keys moved from localStorage to sessionStorage (`StorageManager.getSecureSetting/setSecureSetting/clearSecureSettings`)
- **S3**: `window.open()` calls now include `noopener,noreferrer` on print and share actions
- **S4**: No console.error calls leak internal details in AI modules (verified clean)

#### Performance

- **P1**: AudioContext created once in `AudioManager.init()`, reused on start, only closed on `destroy()` — eliminates WebAudio API churn
- **P2**: Textarea input handler debounced (300ms save, 150ms word count)
- **P3**: Search input handler debounced (150ms)
- **P4**: CSS `will-change: transform, opacity` on settings modal and history panel
- **P5**: CSS `contain: layout style` on glass-card components

#### Reliability

- **R1**: Added `.catch()` handlers to all promise chains in app.js, history.js, history-ui.js
- **R3/R4**: Speech auto-retry infrastructure (transientRetryCount, MAX_TRANSIENT_RETRIES=2, TRANSIENT_ERRORS array), auto-restart on network/aborted errors
- **R5**: Object URLs revoked on page unload (`beforeunload` → cleanup)
- **R8**: Failed deletions in history panel show error toast feedback

#### Changed

- Service worker cache bumped to v4 (`amvtt-shell-v4`) with error-handler.js path
- app.js `cleanup()` now calls `AudioUploadManager.clear()` and `AudioPlayerManager.unload()` on unload
- ErrorHandler.init() called at app startup with showToast dependency

---

## [0.6.0] - 2026-07-16

### Task 007 - AI Features Foundation

#### Added

- `prompts/prompts.js` — Centralized prompt template system with categories: summarize (short/detailed/meeting), translate, analyze (keyPoints/keywords/sentiment), improveText
- `js/ai/ai-service.js` — Base AI service abstraction with pluggable providers (OpenAI, Anthropic, local AI), factory pattern, timeout/retry, error classification
- `js/ai/summarizer.js` — Transcript summarization module (short, detailed, meeting variants)
- `js/ai/translator.js` — Language translation module (Amharic/English with future language support)
- `js/ai/analyzer.js` — Transcript analysis module (key points, keywords, sentiment)
- `js/ai/ai-ui.js` — AI interface management: button states, loading indicators, result display, apply/copy/dismiss workflow
- AI Assistant section in index.html with action buttons: Improve Text, Summarize (Short/Detailed/Meeting), Translate, Key Points, Keywords
- AI section CSS with glass-morphism design, loading spinner animation, responsive layout, print media handling
- Service worker cache bumped to v3 with AI module paths

#### Architecture

- Factory pattern for AI service instances (not IIFE singletons)
- `init(config)` dependency injection for all AI modules
- Pluggable provider architecture: `AIService.registerProvider(name, adapter)`
- Prompt templates as functions returning `{ system, user }` objects
- No hardcoded prompts in business logic modules
- AI UI follows service/ui separation pattern (ai-ui.js separate from AI capability modules)
- app.js remains thin orchestrator: `initAIFeatures()` + `refreshAIServices()` lazy init

#### Security

- API keys stored in settings, never hardcoded in source
- Provider badge shows configuration status
- Buttons disabled until AI service is configured

---

## [0.5.1] - 2026-07-16

### Maintenance Release (Post-Task 006)

#### Fixed

- Service worker APP_SHELL: added all Task 006 JS modules (audio-upload.js, audio-player.js, transcription-engine.js, pwa.js)
- Service worker APP_SHELL: added favicon.png and mikeintosh_systems_sm.png, removed orphaned logo.png and mic.png
- Service worker cache version bumped from v1 to v2 for clean update

#### Changed

- Updated DEVELOPMENT_STATUS.md with Task 006 details
- Updated CHANGELOG.md with Task 006 and maintenance entries

---

## [0.5.0] - 2026-07-16

### Task 006 - Audio Upload & File Transcription

#### Added

- `audio-upload.js` (258 lines) — File selection, drag-and-drop, validation, metadata extraction
- `audio-player.js` (247 lines) — Play/pause/stop, seek, speed control, volume/mute
- `transcription-engine.js` (134 lines) — Unified mic/file transcription interface
- Upload UI section with drop zone, file info display, format/size/duration
- Audio player UI with progress bar, time display, speed select, volume slider
- Experimental file transcription disclaimer UI
- Favicon (favicon.png) and updated logo (mikeintosh_systems_sm.png)

#### Architecture

- TranscriptionEngine stores speech/player refs via init() (no hardcoded globals)
- Mic button routes through TranscriptionEngine for both mic and file modes
- File transcription: plays audio through system speakers, Web Speech API captures via mic (experimental)
- Object URL lifecycle: revocation on clear, stale callback guards, metadata timeout

#### Stabilization Fixes

- Keyboard handler delegates to .click() instead of bypassing TranscriptionEngine
- newTranscription/resetTranscription clear upload + player + engine state
- Upload clear stops TranscriptionEngine if running
- Object URL memory leak fixed (URL.revokeObjectURL on clear)
- Stale metadata callback guards in audio-upload.js and audio-player.js
- 10s timeout on metadata extraction
- Play error visibility via onError callback
- NaN guard on seek

#### Known Limitations

- File transcription is EXPERIMENTAL — relies on speaker-to-mic capture
- Requires headphones for best results (avoids feedback loop)
- Web Speech API only supports Chrome/Edge
- No server-side STT integration

#### Files

| File | Action | Purpose |
|------|--------|---------|
| `src/amh/js/audio-upload.js` | Created | File selection, validation, metadata |
| `src/amh/js/audio-player.js` | Created | Audio playback controls |
| `src/amh/js/transcription-engine.js` | Created | Unified transcription interface |
| `src/amh/assets/favicon.png` | Created | Browser favicon |
| `src/amh/assets/mikeintosh_systems_sm.png` | Created | Header logo |
| `src/amh/index.html` | Modified | Upload/player HTML, favicon, logo |
| `src/amh/css/styles.css` | Modified | Upload/player CSS |
| `src/amh/js/app.js` | Modified | Module wiring, regression fixes |

---

### Task 005 - Progressive Web App Transformation

#### Added

- `manifest.json` — Web App Manifest with app name, display standalone, theme color, icons
- `service-worker.js` — Application shell caching with cache-first strategy
- PWA icons (192x192, 512x512, maskable 512x512) in `assets/icons/`
- Offline status banner (red, fixed bottom) when network is lost
- Update available notification (teal, fixed bottom) with Refresh button
- Service worker registration in `app.js` with update detection
- PWA metadata in `index.html`: theme-color, apple-mobile-web-app, manifest link

#### Architecture

- Cache-first strategy for all static app shell assets (HTML, CSS, JS, images)
- Network-only for non-shell requests (Web Speech API, external resources)
- Versioned cache name (`amvtt-shell-v1`) for clean updates
- Old cache cleanup on service worker activate
- `skipWaiting` message handler for user-triggered refresh
- Offline/online event listeners for banner visibility

#### Preserved

- All existing Task 001-004 functionality unchanged
- No modifications to storage.js, history.js, settings.js, theme.js, stats.js, search.js, audio.js, speech.js, history-ui.js, settings-ui.js
- App.js remains orchestrator (771 lines, under 800 limit)
- IndexedDB transcript storage works in PWA mode
- localStorage preferences work in PWA mode
- Web Speech API gracefully fails offline (already handled)

#### Files

| File | Action | Purpose |
|------|--------|---------|
| `src/amh/manifest.json` | Created | Web App Manifest |
| `src/amh/service-worker.js` | Created | App shell caching |
| `src/amh/assets/icons/icon-192x192.png` | Created | PWA icon |
| `src/amh/assets/icons/icon-512x512.png` | Created | PWA icon |
| `src/amh/assets/icons/icon-maskable-512x512.png` | Created | PWA maskable icon |
| `src/amh/index.html` | Modified | PWA meta tags, banner HTML |
| `src/amh/css/styles.css` | Modified | Banner CSS (additive) |
| `src/amh/js/app.js` | Modified | SW registration, offline/update handling |

---

## [0.4.0] - 2026-07-16

### Task 004 Phase 1 - Storage Foundation

#### Added

- IndexedDB initialization and database creation in `storage.js`
- Transcript CRUD operations (create, get, list, update, delete, count)
- Settings persistence (loadSettings, saveSettings, resetSettings)
- Safe migration from localStorage to IndexedDB
- Migration flag (`amvtt_migrated`) for tracking migration status
- Graceful fallback if IndexedDB unavailable

#### Changed

- `storage.js` expanded from 65 to 481 lines
- `app.js` init restructured to async with IndexedDB startup
- Existing localStorage keys retained as backup

### Task 004 Phase 2 - History Service

#### Added

- `history.js` module for transcript collection management
- `create()` - Create new transcript with computed stats
- `list()` - List all transcripts sorted by updatedAt
- `get()` - Get transcript by ID (cache-first)
- `update()` - Update transcript fields
- `remove()` - Delete transcript
- In-memory cache for fast access
- Current transcript ID tracking

#### Changed

- Added `history.js` script tag to `index.html`

#### Architecture

- HistoryManager is a pure data service (no DOM manipulation)
- Uses StorageManager IndexedDB APIs for all operations
- Maintains in-memory cache synchronized with IndexedDB

### Task 004 Phase 3 - Settings Service

#### Added

- `settings.js` module for user preference management
- `get(key)` - Get setting value by key
- `set(key, value)` - Set setting with validation
- `getAll()` - Get all settings as copy
- `reset()` - Reset all settings to defaults
- `validate(key, value)` - Validate setting value against schema
- `getDefaults()` - Get default values for all settings
- `getSchema()` - Get schema with defaults and current values
- `onChange(callback)` - Register listener for setting changes
- `removeListener(callback)` - Remove change listener
- Schema-based validation for theme, speechLanguage, autoSave

#### Architecture

- SettingsManager is a pure data service (no DOM manipulation)
- Uses StorageManager for persistence (localStorage-backed)
- Change notification system for future UI integration
- Settings schema defines valid values and defaults

#### Preserved

- All existing functionality unchanged
- Theme switching continues to work via ThemeManager
- Web Speech API continues to work via SpeechManager
- No modifications to speech.js, audio.js, search.js, stats.js, theme.js

### Task 004 Phase 4 - UI Implementation

#### Added

- `history-ui.js` module (186 lines) — History panel UI
  - Slide-in sidebar from right
  - Transcript list with title, preview, date, word count
  - Open transcript into editor
  - Delete transcript with confirmation
  - Active transcript highlighting
  - Keyboard accessible (Escape to close)
  - Responsive (full-width on mobile)

- `settings-ui.js` module (128 lines) — Settings modal UI
  - Centered modal with glass-card design
  - Theme selector (dark/light)
  - Speech language selector (Amharic)
  - Auto-save toggle switch
  - Reset to defaults with confirmation
  - Keyboard accessible (Escape to close)

#### Changed

- `index.html`: Added History/Settings buttons in recording dashboard header, history panel HTML, settings modal HTML, script tags for new modules
- `css/styles.css`: Added panel overlay, history panel, settings modal, toggle switch, header action button styles; updated responsive and print rules
- `app.js` (707 lines): Added SettingsManager.init(), HistoryUI/SettingsUI initialization, transcript open/save integration, auto-save respect, theme sync with SettingsManager

#### Architecture

- Clean separation: data services (history.js, settings.js) vs UI modules (history-ui.js, settings-ui.js)
- app.js remains orchestrator at 707 lines (under 800 limit)
- History panel auto-saves current transcript on New/Clear
- Settings changes propagate via SettingsManager.onChange callback
- All panels/modals use Escape to close and overlay click to dismiss

#### Preserved

- All existing functionality unchanged
- Web Speech API transcription works identically
- Amharic am-ET support preserved
- Recording dashboard, audio visualization, timer unchanged
- Search, statistics, export functions unchanged
- Theme switching unchanged (now synced with SettingsManager)

---

### Files Modified

| File | Changes |
|------|---------|
| `src/amh/js/storage.js` | Expanded with IndexedDB, settings, migration |
| `src/amh/js/history.js` | New module for transcript collection management |
| `src/amh/js/app.js` | Async init with IndexedDB startup |
| `src/amh/index.html` | Added history.js script tag |

---

## [0.3.0] - 2026-07-16

### Task 003 - Transcript Workspace

#### Added

- Editable transcript title input with separate localStorage key (`amharic_transcript_title`)
- In-memory search functionality with real-time matching
- Search navigation controls (prev/next buttons, match count display)
- Keyboard shortcuts for search (Enter: next, Shift+Enter: prev, Escape: clear)
- Statistics panel with character count, word count, reading time, and speech duration
- Empty state overlay when no transcript content
- Optimized word counting for Amharic/Ethiopic text (`countWords()` function)
- Reading time estimation based on 200 WPM
- Speech duration accumulator across multiple recording sessions

#### Changed

- Transcript title field is now editable (was previously non-interactive)
- File downloads now use transcript title as filename
- Print function now includes transcript title in output
- `newTranscription()` and `resetTranscription()` now clear title and search
- `handleRecognitionEnd()` now accumulates speech duration
- `updateWordCount()` now includes reading time and speech duration
- Textarea input event now triggers both save and word count update

#### Fixed

- Word counting now correctly handles both Amharic and Latin characters
- Empty state does not interfere with textarea interaction
- Search works with both Amharic and English text
- Title persistence uses separate key to avoid breaking existing data

#### Preserved

- All Task 001 and Task 002 functionality
- Manual editing while transcription continues
- Live transcription appends new text correctly
- All dashboard features (mic indicator, audio visualizer, etc.)
- Theme switching
- All export functionality

---

### Files Modified

| File | Changes |
|------|---------|
| `src/amh/index.html` | Added workspace UI (title, search bar, stats, empty state) |
| `src/amh/css/styles.css` | Added workspace, search, and empty state styles |
| `src/amh/js/app.js` | Added title, search, statistics, and empty state logic |

---

## [0.2.0] - 2026-07-16

### Task 002 - Recording Dashboard

#### Added

- Recording dashboard with dedicated information area
- `AudioManager` module (`js/audio.js`) for Web Audio API handling
- Audio visualization using canvas-based frequency bars
- Microphone permission indicator with visual states
- Recognition status display (Idle/Listening/Processing/Error)
- Audio level monitoring display
- Dashboard statistics panel
- Canvas-based audio visualizer with 7 frequency bars
- Proper resource cleanup on recording stop and page unload

#### Changed

- Timer format enhanced from `MM:SS` to `HH:MM:SS`
- Expanded state management with `microphonePermission` and `recognitionStatus`
- Updated `handleRecognitionStart()` to initialize audio visualization
- Updated `handleRecognitionEnd()` to cleanup audio resources
- Updated `handleRecognitionError()` to update dashboard indicators
- Updated `toggleRecording()` to handle microphone permission states
- Updated `newTranscription()` and `resetTranscription()` to cleanup audio

#### Fixed

- Proper cleanup of AudioContext, MediaStream, and animation frames
- Resource release on page unload via `beforeunload` event
- Microphone permission detection using Permissions API

#### Preserved

- All Task 001 functionality
- Transcription persistence via localStorage
- Theme switching (dark/light mode)
- All mic/recording animations
- Export functionality
- Developer footer with social links

---

### Files Modified

| File | Changes |
|------|---------|
| `src/amh/index.html` | Added dashboard structure, canvas, audio.js script |
| `src/amh/css/styles.css` | Added dashboard, indicator, visualizer styles |
| `src/amh/js/app.js` | Integrated AudioManager, expanded state |
| `src/amh/js/audio.js` | New file for Web Audio API handling |

---

## [0.1.0] - 2026-07-16

### Task 001 - Foundation

#### Added

- Recording timer display (MM:SS format)
- `escapeHTML()` utility for XSS prevention
- `formatDuration()` utility for timer formatting
- Recording timer functions: `startRecordingTimer()`, `stopRecordingTimer()`, `updateTimerDisplay()`
- `glass-card` class to `transcription-output` and `status-section` sections
- `<p id="recording-timer">` element with hidden state

#### Changed

- Transcription ordering changed from prepend to chronological append
- Timer starts on recording start, stops on recording end
- Timer stops on "New Transcription" and "Clear" actions
- `printTranscription()` now uses `escapeHTML()` for security

#### Fixed

- Invalid CSS syntax: removed `composes: glass-card` from `.transcription-output`
- Removed duplicated glass-card styles from `.transcription-output` and `.status-section`
- Redundant `role="main"` attribute removed from `<main>` element

#### Preserved

- Transcription persistence via localStorage
- Theme switching (dark/light mode)
- All mic/recording animations
- Export functionality
- Developer footer with social links
- New Transcription and Clear buttons

---

### Files Modified

| File | Changes |
|------|---------|
| `src/amh/index.html` | Added glass-card classes, recording-timer element |
| `src/amh/css/styles.css` | Fixed invalid syntax, added recording-timer styles |
| `src/amh/js/app.js` | Added timer logic, XSS prevention, append behavior |
