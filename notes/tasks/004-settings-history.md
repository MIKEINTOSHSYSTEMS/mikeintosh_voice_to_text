# TASK 004 - Settings and Transcript History System

# Mikeintosh Voice-to-Text

## Development Phase

Local Persistence, User Preferences, and Session Management

---

# 1. Task Purpose

The purpose of this task is to introduce persistence and personalization features.

Currently, the application works only during the active browser session.

When the user refreshes or closes the browser:

* Transcripts are lost.
* Preferences are lost.
* Previous work cannot be recovered.

This task introduces:

* Local transcript history.
* Automatic saving.
* Session recovery.
* Application settings.
* User preferences.

The goal is to make the application feel reliable and personal.

---

# 2. Required Documentation

Before implementation review:

```text
notes/prompt/AGENTS.md

notes/prompt/ROADMAP.md

notes/prompt/CODING_STANDARDS.md

notes/prompt/PROJECT_CONTEXT.md

notes/tasks/001-foundation.md

notes/tasks/002-recording-dashboard.md

notes/tasks/003-transcript-workspace.md
```

---

# 3. Current Limitation

Current behavior:

```text
User records speech

        ↓

Transcript appears

        ↓

Browser closes

        ↓

Transcript disappears
```

New behavior:

```text
User records speech

        ↓

Transcript automatically saved

        ↓

Browser closes

        ↓

User returns

        ↓

Previous work recovered
```

---

# 4. Main Objectives

Implement:

1. Local transcript storage.
2. Transcript history panel.
3. Automatic saving.
4. Session recovery.
5. Settings system.
6. User preferences.

---

# 5. Storage Architecture

Use browser-native storage.

Preferred order:

## Primary

IndexedDB

Use for:

* Large transcripts.
* Multiple sessions.
* Future expansion.

---

## Secondary

LocalStorage

Use for:

* Small preferences.
* Theme.
* Settings.

---

# 6. Storage Module

Create a dedicated storage layer.

Recommended:

```text
src/amh/js/storage.js
```

Responsibilities:

* Save transcripts.
* Load transcripts.
* Delete transcripts.
* Update transcripts.
* Manage settings.

Do not mix storage logic with UI code.

---

# 7. Transcript Data Model

Create a structured transcript object.

Example:

```javascript
{
    id: "unique-id",

    title: "Untitled Transcript",

    language: "am-ET",

    content: "",

    createdAt: "",

    updatedAt: "",

    duration: 0,

    wordCount: 0,

    characterCount: 0
}
```

Adapt according to implementation needs.

---

# 8. Automatic Saving

Implement automatic saving.

Save triggers:

* Text changes.
* Recording stops.
* User inactivity.
* Before page unload.

---

# 9. Save Status Indicator

Display:

## Saving

Example:

```
Saving...
```

---

## Saved

Example:

```
Saved
```

---

## Error

Example:

```
Unable to save
```

---

# 10. Transcript History

Create a history interface.

Users should see:

* Previous transcripts.
* Titles.
* Dates.
* Preview text.
* Word count.

Example:

```
My Speech Notes

July 15, 2026

245 words
```

---

# 11. History Actions

Users should be able to:

## Open

Load transcript into workspace.

---

## Rename

Change transcript title.

---

## Delete

Remove transcript.

Require confirmation.

---

## Duplicate

Create a copy.

---

# 12. History Search

Prepare history search.

Allow users to find transcripts by:

* Title.
* Content.
* Date.

---

# 13. Recovery System

Implement recovery behavior.

Examples:

If browser closes unexpectedly:

Show:

```
Recovered previous transcript
```

---

If unsaved changes exist:

Show:

```
You have unsaved changes
```

---

# 14. Settings System

Create settings interface.

Recommended:

```text
Settings Panel

├── Appearance
├── Language
├── Recording
├── Accessibility
└── Storage
```

---

# 15. Appearance Settings

Include:

## Theme

Options:

* Light.
* Dark.
* System.

---

## Font Size

Options:

* Small.
* Medium.
* Large.

---

## Animation

Options:

* Enabled.
* Reduced motion.

---

# 16. Language Settings

Allow selection of speech language.

Initial:

```
Amharic (am-ET)
```

Prepare for:

```
English
Oromo
Tigrinya
```

---

# 17. Recording Settings

Possible options:

* Continuous recognition.
* Auto-save.
* Default language.
* Recording indicators.

---

# 18. Accessibility Settings

Include:

* Reduced motion.
* Larger text.
* High contrast preparation.

---

# 19. Settings Persistence

All settings should survive:

* Refresh.
* Browser restart.

---

# 20. User Interface Requirements

The settings and history experience should feel like a professional application.

Use:

* Panels.
* Cards.
* Clear navigation.
* Consistent design.

Avoid clutter.

---

# 21. Architecture Preparation

Prepare for future:

* Cloud synchronization.
* User accounts.
* Backup.
* Sharing.

Do not implement cloud features yet.

---

# 22. Security and Privacy

Because transcripts may contain private information:

Follow:

* Local-first storage.
* No external transmission.
* Clear user control.

---

# 23. Performance Requirements

Storage operations should not block the UI.

Use:

* Async operations.
* IndexedDB transactions.
* Efficient updates.

---

# 24. Possible File Changes

Expected:

```text
src/amh/index.html

src/amh/css/styles.css

src/amh/js/app.js
```

New modules:

```text
src/amh/js/

storage.js

settings.js

history.js
```

---

# 25. Testing Requirements

Verify:

## Storage

* Transcript saves.
* Transcript loads.
* Transcript deletes.
* Transcript updates.

---

## Recovery

Test:

* Refresh during work.
* Browser restart.
* Multiple transcripts.

---

## Settings

Verify:

* Theme persists.
* Language persists.
* Preferences persist.

---

## Performance

Verify:

* Large transcripts save correctly.
* UI remains responsive.

---

# 26. Expected Deliverables

Provide:

## Implementation Summary

Explain:

* Storage approach.
* Settings architecture.
* User experience improvements.

---

## Modified Files

List:

* Created files.
* Modified files.

---

## Testing Report

Include:

* Storage tests.
* Browser tests.
* UI tests.

---

## Future Recommendations

Document:

* Cloud migration possibilities.
* Synchronization opportunities.

---

# 27. Completion Criteria

This task is complete when:

✔ Users no longer lose transcripts.

✔ Previous sessions can be recovered.

✔ Preferences persist.

✔ History management works.

✔ The application feels reliable.

---

# Final Instruction

A professional application remembers the user's work.

Reliability and trust are more important than adding more features.

Build persistence carefully and keep user data under user control.
