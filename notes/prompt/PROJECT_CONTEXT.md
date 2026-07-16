# PROJECT_CONTEXT.md

# VoiceText — Project Context and Technical Overview

| Field | Value |
|-------|-------|
| Product Name | VoiceText (Amharic Voice-to-Text) |
| Current Version | 1.0.0 |
| License | GPL-3.0 |
| Developer | Michael K. Teferra / MIKEINTOSHSYSTEMS |
| Architecture Reference | `notes/architecture/ARCHITECTURE.md` |

---

## 1. What Is VoiceText?

VoiceText is a professional web application that converts Amharic speech to text in real time. It runs entirely in the browser — no backend server, no installation, no account required. Open in Chrome or Edge, click the microphone, and start speaking.

The application targets Amharic speakers who need to quickly transcribe spoken language into written text for documents, messages, articles, and notes.

---

## 2. Core Value Proposition

| For Users | How |
|-----------|-----|
| Transcribe speech instantly | Web Speech API with live results |
| Upload and transcribe audio files | Drag-and-drop with built-in player |
| Analyze transcripts with AI | Summarize, translate, extract key points |
| Manage transcripts over time | IndexedDB history with search |
| Work offline | PWA with cached app shell |
| Export everywhere | Copy, print, TXT, DOC, WhatsApp, Twitter |

---

## 3. Feature Overview

### Live Transcription
- Real-time Amharic speech recognition
- Audio visualizer with frequency display
- Recording timer (HH:MM:SS)
- Microphone status indicators
- Keyboard shortcut (Space to toggle)

### Audio Upload
- Drag-and-drop or file picker
- Supported: MP3, WAV, M4A, OGG, WebM, FLAC, AAC
- Built-in audio player (play/pause/stop, seek, speed, volume)
- Experimental file transcription (requires headphones)

### Transcript Workspace
- Editable transcript with auto-save
- Text search with match navigation
- Word count, character count, reading time
- Editable transcript title

### AI Assistant
- Summarize (short, detailed, meeting-style)
- Translate (Amharic ↔ English, + Oromo, Tigrinya, Arabic, French)
- Analyze (key points, keywords, sentiment)
- Improve text (grammar and readability)
- Supports OpenAI, Anthropic, and local AI providers

### History
- Automatic transcript saving
- History sidebar with browse, open, delete
- Sorted by most recent

### Settings
- Dark/light theme
- Language preference
- Auto-save toggle
- AI provider configuration

### Export
- Copy to clipboard
- Print
- Download as TXT
- Download as DOC
- Share via WhatsApp
- Share via Twitter

### PWA
- Installable on Chrome, Edge, Android
- Offline app shell via service worker
- Auto-update notification

---

## 4. Current Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| Chrome/Edge only | Firefox and Safari unsupported | Clear browser requirements in docs |
| Internet required for speech | No offline transcription | Web Speech API is cloud-based |
| Amharic only for STT | Other languages not supported | AI translation available for output |
| File transcription experimental | Speaker-to-mic approach | Headphones required, disclaimer shown |
| No cloud storage | Transcripts trapped in one browser | Cloud sync planned for v2.0 |
| No user accounts | No cross-device access | Planned for v2.0 |
| No collaboration | Single-user only | Planned for v3.0 |

---

## 5. Technology Summary

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Speech | Web Speech API (Google) |
| Audio | Web Audio API |
| Storage | IndexedDB, localStorage, sessionStorage |
| PWA | Service Worker, Web App Manifest |
| AI | OpenAI, Anthropic, Local (Ollama) |
| Build | None (static files) |
| Backend | None (client-side only) |

For complete technical details, see `ARCHITECTURE.md`.

---

## 6. Target Users

| User | Use Case |
|------|----------|
| Amharic speakers | Quick voice-to-text transcription |
| Journalists | Interview transcription |
| Students | Lecture notes from speech |
| Professionals | Meeting notes, dictated documents |
| Content creators | Script drafting from speech |
| Developers | API integration (future) |

---

## 7. Product Principles

1. **Simplicity** — Start transcribing in under 5 seconds
2. **Privacy** — Data stays on your device by default
3. **Reliability** — Clear feedback for every action
4. **Accessibility** — Keyboard navigable, screen reader friendly
5. **Professionalism** — Feels like a real product, not a demo

---

## 8. Version History Summary

| Version | Milestone |
|---------|-----------|
| v0.1.0 | Foundation — HTML/CSS/JS structure |
| v0.2.0 | Recording dashboard with visualization |
| v0.3.0 | Transcript workspace with search |
| v0.4.0 | History, settings, IndexedDB storage |
| v0.5.0 | Audio upload, player, file transcription |
| v0.6.0 | AI features (summarize, translate, analyze) |
| v0.7.0 | Security and performance hardening |
| v1.0.0 | Production release |
| v1.1.0 | Cloud architecture planning |

---

## 9. Related Documents

| Document | Purpose |
|----------|---------|
| `ARCHITECTURE.md` | Complete system architecture (single source of truth) |
| `ROADMAP.md` | Product vision and feature roadmap |
| `CODING_STANDARDS.md` | Engineering coding standards |
| `AGENTS.md` | AI agent instructions |
| `CHANGELOG.md` | Detailed version history |
| `DEVELOPMENT_STATUS.md` | Current development state |
| `CLOUD_ARCHITECTURE.md` | Cloud platform evolution plan |

---

*This document describes what VoiceText is and who it serves. For how it works internally, see `ARCHITECTURE.md`.*
