# CONTRIBUTING.md

# VoiceText — Development Guide

Welcome to VoiceText. This guide covers setup, workflow, and conventions for contributing to the project.

---

## Quick Start

### Prerequisites

- A modern web browser (Chrome or Edge)
- A text editor or IDE
- Git (for version control)
- A local web server (Python, Node.js, or PHP)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/MIKEINTOSHSYSTEMS/mikeintosh_voice_to_text.git
   ```

2. Navigate to the application:
   ```bash
   cd mikeintosh_voice_to_text/src/amh
   ```

3. Start a local server:
   ```bash
   # Python
   python -m http.server 8080

   # Node.js
   npx serve .

   # PHP
   php -S localhost:8080
   ```

4. Open in Chrome or Edge:
   ```
   http://localhost:8080
   ```

### No Build Step Required

VoiceText is a static web application. There is no `npm install`, no `build` command, no compilation. Edit files, refresh the browser.

---

## Project Structure

```
src/amh/
├── index.html              # Main HTML
├── manifest.json           # PWA manifest
├── service-worker.js       # App shell cache
├── css/styles.css          # Design system
├── js/                     # Core modules
│   ├── app.js              # Orchestrator
│   ├── storage.js          # Persistence
│   ├── speech.js           # Web Speech API
│   └── ...                 # Other modules
├── js/ai/                  # AI modules
├── prompts/                # Prompt templates
└── assets/                 # Icons and images
```

For the complete module inventory and dependency graph, see `notes/architecture/ARCHITECTURE.md`.

---

## Development Workflow

### Understanding the Task System

Development happens through numbered tasks defined in `notes/tasks/`:

```
notes/tasks/
├── 001-foundation.md
├── 002-recording-dashboard.md
├── 003-transcript-workspace.md
├── 004-settings-history.md
├── 005-pwa.md
├── 006-upload-audio.md
├── 007-ai-features.md
├── 008-security-performance.md
├── 009-release-preparation.md
└── 010-cloud-platform-roadmap.md
```

Each task specification defines:
- What to build
- Acceptance criteria
- Technical constraints
- Expected file changes

### Before Starting Work

1. Read the task specification
2. Read `ARCHITECTURE.md` to understand the current system
3. Read `CODING_STANDARDS.md` for coding conventions
4. Inspect the source files you'll be modifying
5. Plan your changes before writing code

### Making Changes

1. Create a feature branch (if applicable) or work on `main`
2. Make focused, incremental changes
3. Follow existing code patterns exactly
4. Test in Chrome and Edge
5. Verify existing features still work

### Committing

Use semantic commit messages:

```
feat(module): description     # New feature
fix(module): description      # Bug fix
refactor(module): description # Code restructuring
chore: description            # Maintenance
docs: description             # Documentation
```

Example:
```
feat(ai): add sentiment analysis to AI Analyzer
fix(speech): prevent double-start on rapid mic clicks
```

---

## Coding Standards

### Module Pattern

Every module uses the IIFE singleton pattern:

```javascript
var ModuleName = (function () {
  'use strict';

  var privateState = null;

  function privateFunction() { ... }

  return {
    init: function (config) { ... },
    publicMethod: function () { ... }
  };
})();
```

### Key Rules

| Rule | Details |
|------|---------|
| Use `var` | Function-scope, not block-scope (except where `const`/`let` is clearly better) |
| No `alert()` | Use existing toast for user feedback |
| No `console.log` | Use `ErrorHandler` for error logging |
| No comments | Code should be self-documenting |
| No `innerHTML` for user data | Use `textContent` to prevent XSS |
| Dependency injection | Pass dependencies via `init(config)`, not globals |
| Under 800 lines | app.js must stay under the 800-line ceiling |

### File Naming

- Lowercase with hyphens: `audio-upload.js`, `error-handler.js`
- AI modules in `js/ai/` subdirectory
- Prompt templates in `prompts/`

### When Adding a Module

1. Create the file following the IIFE pattern
2. Add `<script>` tag to `index.html` (before `app.js`)
3. Add the path to `service-worker.js` APP_SHELL array
4. Initialize in `app.js` `init()` function
5. Wire events in `app.js` `bindEvents()` function

---

## Testing

### Manual Testing Checklist

After any change, verify:

- [ ] Microphone permission prompt appears
- [ ] Recording starts and stops correctly
- [ ] Transcript text appears in workspace
- [ ] Word count updates
- [ ] Auto-save works
- [ ] History panel opens and lists transcripts
- [ ] Transcript loads from history
- [ ] Theme switching works
- [ ] Export buttons function (copy, print, download)
- [ ] Search works in transcript
- [ ] Settings modal opens and saves
- [ ] AI actions work (if API key configured)
- [ ] Upload tab works (drag-and-drop, file picker)
- [ ] Audio player controls work
- [ ] PWA offline banner shows when offline
- [ ] No console errors in DevTools

### Browser Testing

| Browser | Priority | Speech Support |
|---------|----------|---------------|
| Google Chrome (latest) | Primary | Full |
| Microsoft Edge (latest) | Primary | Full |
| Firefox | Secondary | Not supported |
| Safari | Secondary | Not supported |

---

## Architecture Reference

For complete system architecture, module inventory, dependency graphs, data flows, and security model:

**Read `notes/architecture/ARCHITECTURE.md`**

This is the single source of truth for how the application works.

---

## Documentation

| Document | Purpose | When to Update |
|----------|---------|---------------|
| `ARCHITECTURE.md` | System design | When architecture changes |
| `PROJECT_CONTEXT.md` | What the product is | When features change |
| `ROADMAP.md` | Feature roadmap | Each release |
| `CODING_STANDARDS.md` | Coding rules | When standards change |
| `AGENTS.md` | Agent instructions | When workflow changes |
| `CHANGELOG.md` | Version history | Each release |
| `DEVELOPMENT_STATUS.md` | Current state | Each task |

---

## Getting Help

- Review `ARCHITECTURE.md` for system understanding
- Review `CODING_STANDARDS.md` for coding questions
- Check `notes/tasks/` for task specifications
- Check `CHANGELOG.md` for recent changes

---

*Welcome to the project. Build clean, maintainable software that serves users well.*
