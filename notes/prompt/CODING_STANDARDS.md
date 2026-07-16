# CODING_STANDARDS.md

# Mikeintosh Voice-to-Text

# Software Engineering Standards

---

# 1. Purpose

This document defines the coding standards, engineering practices, and quality expectations for the Mikeintosh Voice-to-Text project.

All code contributions should follow these standards.

The objective is to maintain a clean, professional, scalable, and maintainable codebase.

---

# 2. General Engineering Principles

## Write maintainable code

Code should be written for future developers, not only for immediate execution.

Prioritize:

* Readability.
* Simplicity.
* Consistency.
* Maintainability.

---

## Avoid unnecessary complexity

Do not introduce complexity unless it solves a real problem.

Prefer:

Simple solution > complicated solution.

Native browser API > unnecessary dependency.

Clear code > clever code.

---

## Keep responsibilities separated

Each file and function should have a clear purpose.

Avoid creating:

* Giant files.
* Large functions.
* Mixed responsibilities.

---

# 3. Project Structure Standards

Current structure:

```text
src/
└── amh/
    ├── index.html
    ├── assets/
    ├── css/
    └── js/
```

Maintain clear separation.

---

## HTML

Responsible for:

* Application structure.
* Semantic content.
* Accessibility markup.

---

## CSS

Responsible for:

* Visual design.
* Layout.
* Responsive behavior.
* Animations.

---

## JavaScript

Responsible for:

* Application logic.
* Browser API interactions.
* State management.
* User interactions.

---

# 4. HTML Standards

## Use semantic HTML

Prefer:

```html
<header>
<main>
<section>
<article>
<footer>
<nav>
<button>
```

Avoid unnecessary:

```html
<div>
```

when a semantic element exists.

---

## Accessibility requirements

Every interactive element must be accessible.

Buttons must have:

* Clear labels.
* Keyboard support.
* Appropriate states.

Images must include:

```html
alt
```

attributes.

---

## Forms and controls

Inputs should include:

* Labels.
* Validation.
* Helpful messages.

---

# 5. CSS Standards

## Use CSS variables

All reusable values should use variables.

Example:

```css
:root {
  --primary-color: #2563eb;
  --background-color: #ffffff;
  --text-color: #111827;
}
```

Avoid repeating values.

---

# Naming conventions

Use descriptive class names.

Preferred:

```css
.transcription-panel
.recording-status
.export-button
```

Avoid:

```css
.box
.item
.blue-button
```

---

# Component-based styling

Organize CSS logically:

Example:

```text
css/

styles.css

variables.css

components.css

responsive.css
```

---

# Responsive design

All interfaces must support:

* Desktop.
* Tablet.
* Mobile.

Use:

* Flexible layouts.
* CSS Grid.
* Flexbox.
* Appropriate breakpoints.

---

# Animation standards

Animations should:

* Improve user experience.
* Be smooth.
* Respect reduced-motion preferences.

Avoid excessive animations.

---

# 6. JavaScript Standards

## Modern JavaScript

Use:

* const.
* let.
* Arrow functions.
* Async/await.
* Modules where appropriate.

Avoid outdated patterns.

---

# Naming conventions

Variables:

Use meaningful names.

Good:

```javascript
transcriptionText
recordingDuration
microphoneStatus
```

Bad:

```javascript
x
data1
temp
```

---

Functions:

Functions should describe their action.

Good:

```javascript
startRecording()

saveTranscript()

updateStatusMessage()
```

Bad:

```javascript
doStuff()

process()
```

---

# 7. Function Design

Functions should:

* Do one thing.
* Be easy to test.
* Have clear inputs and outputs.

Avoid:

Large functions containing:

* UI logic.
* Business logic.
* API logic.
* Storage logic.

Separate responsibilities.

---

# 8. JavaScript File Organization

Preferred future structure:

```text
js/

app.js

speech.js

audio.js

storage.js

ui.js

settings.js

export.js

utils.js
```

---

Responsibilities:

## app.js

Application initialization.

---

## speech.js

Speech recognition logic.

---

## audio.js

Audio visualization and Web Audio API.

---

## storage.js

Local storage and IndexedDB.

---

## ui.js

Interface updates.

---

## settings.js

Application preferences.

---

## export.js

File generation.

---

# 9. State Management

Avoid excessive global variables.

Prefer centralized application state.

Example:

```javascript
const appState = {
    isRecording: false,
    language: "am-ET",
    transcript: "",
};
```

---

# 10. Error Handling

Never fail silently.

Always provide:

* User-friendly messages.
* Developer-friendly logs.

Example:

```javascript
try {

}
catch(error) {

 console.error(error);

 showMessage(
 "Something went wrong"
 );

}
```

---

# 11. Browser API Usage

When using browser APIs:

Always handle:

* Unsupported browsers.
* Permission denial.
* Runtime errors.
* User cancellation.

Examples:

* Microphone permissions.
* Speech recognition availability.
* Storage availability.

---

# 12. Performance Standards

Optimize:

* DOM updates.
* Event listeners.
* Animations.
* Memory usage.

Avoid:

* Unnecessary rendering.
* Repeated calculations.
* Memory leaks.

---

# 13. Security Practices

Never:

* Store secrets in frontend code.
* Trust user input blindly.
* Insert unsafe HTML.

Use:

* Safe DOM manipulation.
* Validation.
* Sanitization where required.

---

# 14. Git Practices

Commit messages should describe changes.

Good:

```
Add transcript history storage
```

```
Improve microphone error handling
```

Bad:

```
Update
```

```
Changes
```

---

# 15. Documentation Standards

Every major feature should include:

* Purpose.
* How it works.
* Files affected.
* Limitations.

Avoid undocumented complex logic.

---

# 16. Testing Standards

Before completing a task verify:

## Core features

* Application loads.
* Microphone works.
* Speech recognition works.
* Transcript appears.
* Export works.

---

## UI

Check:

* Desktop.
* Tablet.
* Mobile.

---

## Accessibility

Check:

* Keyboard navigation.
* Focus states.
* Screen reader labels.

---

# 17. Code Review Checklist

Before considering work complete:

Ask:

## Does it work?

Yes.

## Did it break existing features?

No.

## Is the code understandable?

Yes.

## Is it maintainable?

Yes.

## Is it accessible?

Yes.

## Is it responsive?

Yes.

---

# 18. Dependency Policy

Avoid adding dependencies unless necessary.

Before adding a package evaluate:

* Is it required?
* Can browser APIs solve this?
* Does it improve the project significantly?
* Does it increase maintenance cost?

Prefer lightweight solutions.

---

# 19. Future Compatibility

All code should consider future expansion:

* Audio upload.
* Whisper integration.
* AI processing.
* Cloud services.
* Multi-user support.

Do not create architecture that blocks future development.

---

# Final Engineering Rule

Write software as if another professional engineer will maintain it tomorrow.

Clean code.

Clear architecture.

Reliable behavior.

Excellent user experience.
