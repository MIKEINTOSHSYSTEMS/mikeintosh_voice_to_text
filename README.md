# VoiceText - Amharic Voice-to-Text Transcription

> Professional Amharic speech recognition and transcription application.

**Version:** 1.0.0  
**License:** GPL-3.0  
**Developer:** Michael K. Teferra / MIKEINTOSHSYSTEMS

---

## Overview

VoiceText is a web-based application that converts Amharic speech to text in real time using the Web Speech API. It provides a professional, modern interface for live transcription, transcript management, AI-powered analysis, and export.

No installation required — open in a supported browser and start speaking.

---

## Features

### Core

- **Live Speech Recognition** — Real-time Amharic transcription using Web Speech API
- **Transcript Workspace** — Edit, review, and format transcribed text
- **Search** — Find text within transcripts
- **Statistics** — Word count, character count, reading time

### Audio Upload & File Transcription

- **Audio File Upload** — Drag-and-drop or file picker for audio files (MP3, WAV, M4A, OGG, WebM)
- **Audio Player** — Full playback controls: play/pause/stop, seek, speed adjustment, volume/mute
- **File Transcription** — Transcribe audio files using the built-in speech engine (experimental)

### AI Assistant

- **Summarize** — Generate short, detailed, or meeting-style summaries
- **Translate** — Translate between Amharic and English
- **Analyze** — Extract key points, keywords, and sentiment
- **Improve Text** — Enhance transcript readability and grammar

*Requires an API key (OpenAI, Anthropic, or local AI).*

### Management

- **History** — Browse, open, and delete saved transcripts
- **Settings** — Theme, language, auto-save preferences, AI configuration
- **Export** — Copy, print, download as TXT or DOC, share via WhatsApp and Twitter
- **Dark/Light Theme** — Toggle between dark and light modes

### PWA

- **Installable** — Add to home screen on Chrome, Edge, Android
- **Offline Support** — App shell cached for offline access
- **Auto-Update** — Notifications when new versions are available

---

## Requirements

### Browser

| Browser | Status |
|---------|--------|
| Google Chrome (latest) | Fully supported |
| Microsoft Edge (latest) | Fully supported |
| Firefox | Speech recognition not supported |
| Safari | Speech recognition not supported |

### Hardware

- Working microphone (built-in or external)
- Internet connection (required for Web Speech API)
- For file transcription: headphones recommended to prevent audio feedback

### Permissions

- Microphone access is required for live transcription
- Browser will prompt for permission on first use

---

## Installation

### Option 1: Direct Use

Visit the live demo:  
**https://mikeintoshs.com/audio-transcriber**

### Option 2: Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mikeintosh/mikeintosh_voice_to_text.git
   ```

2. Navigate to the application:
   ```bash
   cd mikeintosh_voice_to_text/src/amh
   ```

3. Serve with any static web server:
   ```bash
   # Python
   python -m http.server 8080

   # Node.js (npx)
   npx serve .

   # PHP
   php -S localhost:8080
   ```

4. Open in Chrome or Edge:
   ```
   http://localhost:8080
   ```

### Option 3: Web Hosting

Upload the `src/amh/` directory to any static hosting provider (Netlify, Vercel, GitHub Pages, Apache, Nginx). Ensure HTTPS is enabled for microphone access and PWA features.

### PWA Installation

1. Open the application in Chrome or Edge
2. Click the install icon in the address bar, or
3. Open the browser menu and select "Install VoiceText"
4. The app will appear in your application launcher

---

## Usage Guide

### Live Transcription

1. Open the application
2. Click the **microphone button** to start recording
3. Speak clearly in Amharic
4. Text appears in the transcript workspace in real time
5. Click the microphone again to stop
6. Edit the transcript if needed
7. Use the export buttons to copy, download, or share

### Audio File Transcription

1. Switch to the **Upload** tab
2. Drag an audio file onto the drop zone, or click to browse
3. Review file metadata (name, format, size, duration)
4. Click **Start Transcription** to begin
5. Review and edit the transcribed text

### AI Analysis

1. Ensure an API key is configured in **Settings**
2. Open a transcript from history or create a new one
3. Click an AI action button (Summarize, Translate, Analyze, etc.)
4. Review the AI-generated result
5. Click **Apply** to insert into transcript, or **Copy** / **Dismiss**

### Managing Transcripts

- Click the **History** button to browse saved transcripts
- Click a transcript to open it
- Click the **delete** icon to remove a transcript
- Use **New** to start a fresh transcript

---

## Privacy & Security

- **Microphone data** is processed by Google's Web Speech API servers — audio is not stored locally
- **Transcripts** are stored in your browser's IndexedDB (local only, never uploaded)
- **API keys** are stored in browser sessionStorage (cleared when the tab closes)
- **No tracking, no cookies, no analytics**
- **No server-side processing** — the application is entirely client-side

---

## Technical Details

- **Architecture:** Static HTML/CSS/JS — no build tools, no frameworks
- **Modules:** 22 JavaScript modules (~4,500 lines)
- **Storage:** IndexedDB for transcripts, localStorage for preferences, sessionStorage for API keys
- **Service Worker:** Cache-first strategy for app shell assets
- **Design:** Glass-morphism UI, CSS custom properties, responsive layout

---

## Project Structure

```
src/amh/
├── index.html              Main application
├── manifest.json           PWA manifest
├── service-worker.js       App shell caching
├── css/
│   └── styles.css          Design system
├── js/
│   ├── app.js              Application orchestrator
│   ├── audio.js            Web Audio visualization
│   ├── audio-upload.js     File upload handling
│   ├── audio-player.js     Audio playback controls
│   ├── speech.js           Web Speech API
│   ├── transcription-engine.js  Unified transcription
│   ├── storage.js          IndexedDB + localStorage
│   ├── error-handler.js    Centralized error handling
│   ├── settings.js         Settings management
│   ├── history.js          Transcript collection
│   ├── history-ui.js       History panel UI
│   ├── settings-ui.js      Settings modal UI
│   ├── theme.js            Theme management
│   ├── stats.js            Statistics calculation
│   ├── search.js           Search functionality
│   ├── pwa.js              PWA lifecycle
│   ├── ai/
│   │   ├── ai-service.js   AI provider abstraction
│   │   ├── ai-ui.js        AI interface
│   │   ├── summarizer.js   Summarization
│   │   ├── translator.js   Translation
│   │   └── analyzer.js     Analysis
│   └── prompts/
│       └── prompts.js      Prompt templates
└── assets/
    ├── favicon.png
    ├── mikeintosh_systems_sm.png
    ├── mic-animate.gif
    └── icons/
        ├── icon-192x192.png
        ├── icon-512x512.png
        └── icon-maskable-512x512.png
```

---

## Known Limitations

- **Web Speech API** requires Chrome or Edge — Firefox and Safari are not supported for speech recognition
- **File transcription** is experimental — uses a speaker-to-mic approach that requires headphones
- **Internet required** — the Web Speech API requires an active connection to Google servers
- **Amharic only** — currently supports Amharic (`am-ET`) speech recognition

---

## License

This project is licensed under the GNU General Public License v3.0.

---

## Author

**Michael K. Teferra**  
MIKEINTOSHSYSTEMS  
https://mikeintoshs.com

---

## Links

- **Live Demo:** https://mikeintoshs.com/audio-transcriber
- **GitHub:** https://github.com/MIKEINTOSHSYSTEMS
- **LinkedIn:** https://linkedin.com/in/michael-k-teferra-50573079
- **Telegram:** https://www.telegram.me/MIKEINTOSH
