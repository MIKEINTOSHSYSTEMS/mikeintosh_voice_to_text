# TASK 006 - Audio File Upload and Transcription Architecture

# Mikeintosh Voice-to-Text

## Development Phase

Audio Upload Foundation and Future AI Transcription Preparation

---

# 1. Task Purpose

The purpose of this task is to introduce support for uploading existing audio recordings and preparing the application architecture for audio-file transcription.

Currently, the application supports:

* Live microphone speech recognition.

However, users may also need to transcribe:

* Recorded speeches.
* Interviews.
* Meetings.
* Lectures.
* Voice notes.
* Previously recorded audio files.

This task introduces the foundation required for this capability.

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

notes/tasks/004-settings-history.md

notes/tasks/005-pwa.md
```

---

# 3. Current Limitation

Current architecture:

```text
Microphone

    ↓

Web Speech API

    ↓

Live Transcript
```

Limitation:

The Web Speech API does not provide a reliable production workflow for:

* Uploaded audio files.
* Batch transcription.
* Background processing.
* Long recordings.

---

# 4. Future Architecture Direction

The application should evolve toward:

```text
Audio File

    ↓

Audio Processing Layer

    ↓

Transcription Engine

    ↓

Transcript Workspace

    ↓

Storage / Export / AI Features
```

---

# 5. Main Objectives

Implement:

1. Audio upload interface.
2. Audio file validation.
3. Audio preview.
4. File metadata display.
5. Transcription architecture layer.
6. Future AI engine compatibility.

---

# 6. Supported File Types

Initially support:

Audio:

* MP3.
* WAV.
* M4A.
* OGG.
* WEBM.

The system should be designed to allow future formats.

---

# 7. Upload Interface

Create a professional upload area.

Features:

* Drag and drop.
* File browser selection.
* Upload status.
* File information.

Example:

```
Upload Audio Recording

Drag your audio file here

or

Browse Files
```

---

# 8. File Information Display

After upload display:

* File name.
* File size.
* Duration.
* Format.
* Processing status.

Example:

```
Interview.mp3

Duration:
15:32

Size:
24 MB

Ready for transcription
```

---

# 9. Audio Preview

Allow users to preview uploaded audio.

Features:

* Play.
* Pause.
* Seek.
* Volume control.

Use:

HTML5 Audio API.

---

# 10. Audio Validation

Validate:

## File type

Reject unsupported formats.

---

## File size

Provide reasonable limits.

Example:

```
File too large.

Please upload a smaller recording.
```

---

## Corrupted files

Handle gracefully.

---

# 11. Audio Processing Module

Create separation between:

* Upload handling.
* Audio processing.
* Transcription engine.

Recommended future structure:

```
src/amh/js/

audio-upload.js

audio-player.js

transcription-engine.js
```

---

# 12. Transcription Engine Abstraction

Do not directly connect upload logic to a specific AI provider.

Create an abstraction.

Example concept:

```javascript
transcriptionEngine.transcribe(audioFile)
```

Future implementations:

```
Web Speech Adapter

Whisper Local Adapter

Cloud AI Adapter
```

---

# 13. Current Browser Capability Handling

The application should clearly communicate limitations.

Example:

```
Live microphone transcription is available.

Uploaded audio transcription requires a compatible transcription engine.
```

Do not create misleading functionality.

---

# 14. Whisper Preparation

Prepare architecture for future Whisper integration.

Possible approaches:

## Client-side

Technologies:

* Transformers.js.
* ONNX Runtime Web.
* WebAssembly.

Advantages:

* Privacy.
* Offline capability.

Limitations:

* Device performance.
* Model size.

---

## Server-side

Possible future:

* Whisper API.
* Self-hosted Whisper.
* Dedicated transcription service.

Advantages:

* Faster processing.
* Longer recordings.

---

# 15. Processing Interface

Create UI states:

## Ready

```
Audio loaded.
Ready for transcription.
```

---

## Processing

```
Transcribing audio...
```

---

## Complete

```
Transcription completed.
```

---

## Error

```
Unable to process audio.
```

---

# 16. Progress Display

Prepare for:

* Upload progress.
* Processing percentage.
* Estimated remaining time.

---

# 17. Transcript Integration

When transcription completes:

The result should enter the existing transcript workspace.

Flow:

```
Audio Upload

        ↓

Transcription Engine

        ↓

Transcript Workspace

        ↓

Save / Export / History
```

---

# 18. User Experience Requirements

The feature should feel:

* Simple.
* Professional.
* Reliable.

Users should always know:

* What file was selected.
* What is happening.
* What action is available.

---

# 19. Accessibility Requirements

Ensure:

* Upload controls are keyboard accessible.
* Drop zone has accessible labels.
* Status changes are announced.

---

# 20. Performance Requirements

Handle:

* Large files carefully.
* Memory usage.
* Browser limitations.

Avoid loading very large files unnecessarily.

---

# 21. Privacy Requirements

Important:

Audio files may contain sensitive information.

The application should:

* Explain processing location.
* Avoid unexpected uploads.
* Give users control.

---

# 22. Possible File Changes

Expected:

```
src/amh/index.html

src/amh/css/styles.css

src/amh/js/app.js
```

Possible new modules:

```
src/amh/js/

audio-upload.js

audio-player.js

transcription-engine.js
```

---

# 23. Testing Requirements

Test:

## Upload

* Valid audio.
* Invalid file.
* Large file.
* Corrupted file.

---

## Playback

Verify:

* Play.
* Pause.
* Seek.

---

## Integration

Verify:

* Transcript workspace receives output.
* Existing microphone transcription still works.

---

# 24. Expected Deliverables

Provide:

## Implementation Summary

Explain:

* Upload architecture.
* Supported formats.
* Limitations.

---

## Modified Files

List:

* Added files.
* Updated files.

---

## Testing Report

Include:

* File tests.
* Browser tests.
* User workflow tests.

---

## Future Recommendations

Document:

* Whisper integration.
* Cloud transcription.
* Offline AI options.

---

# 25. Completion Criteria

This task is complete when:

✔ Users can upload audio files.

✔ Audio information is displayed.

✔ Audio preview works.

✔ Architecture supports future transcription engines.

✔ Existing microphone transcription remains stable.

✔ Users are not misled about browser limitations.

---

# Final Instruction

Do not force the Web Speech API to do something it was not designed for.

Build a clean transcription architecture where different engines can be added safely in the future.

The upload layer should become the bridge toward advanced AI transcription capabilities.
