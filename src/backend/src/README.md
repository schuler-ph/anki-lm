# Lecture Summarization & Study Helper

This toolset acts as your personal automated study assistant. Its main purpose
is to take raw, unstructured lecture materials—like audio recordings and PDF
slides—and transform them into structured, exam-ready study artifacts.

Instead of manually transcribing lectures or summarizing endless slides, this
system automates the grunt work so you can focus on actually understanding the
material.

## What does it do?

The system performs a complete "Import to Learn" pipeline:

1. **Ingests Raw Data**: It looks at your course folders (e.g., `vsys`, `prpd`)
   for new content.
2. **Prepares Material**:
   - It listens to your lecture recordings (MP3) and transcribes them into text
     using high-quality AI (Whisper).
   - It processes your slides (PDF), ensuring every page is numbered so the AI
     can cite sources precisely.
3. **Generates Study Aids**: It sends this prepared data to an AI workflow
   (Dify) which returns structured documents:
   - **Summaries**: Concise overviews of the lecture content.
   - **Refined Transcripts**: Readable, clean versions of the lecture text
     without filler words.
   - **TL;DRs**: "Too Long; Didn't Read" one-pagers highlighting key exam topics
     and to-dos.
   - **Concepts & Definitions**: Extracted tables of key terms and their
     meanings.
   - **Example Problems**: Breakdowns of problem types mentioned in class.
   - **Anki Cards**: Ready-to-use flashcards for spaced repetition learning.

## Components & Flow

Conceptually, the system is split into **Preparation** and **Intelligence**.

### 1. Preparation (The "Orchestrator")

This part runs locally on your machine.

- **Scanner**: Checks your subject folders for new audio or PDF files.
- **Transcriber**: Splits long audio files into chunks and converts speech to
  text.
- **Stamper**: Adds page numbers to PDFs so the AI can cite sources precisely.
- **Courier**: Packages these files and sends them to the "Brain".

### 2. AI Pipeline (The "Brain" / Dify)

This is the AI workflow that receives the text and slides.

- It cleans up the messy transcript.
- It analyzes the content against the slides.
- It produces the final markdown files (`01-summary.md`, `02-veredelt.md`, etc.)
  and saves them back to your folder.

## How to use it

Set `LECTURE_ROOT` in your `.env` to the Google Drive folder that contains your
subject folders.

Example:

```text
LECTURE_ROOT=/Users/p.schuler/Library/CloudStorage/GoogleDrive-schulerp03@gmail.com/Meine Ablage/Uni/Sem 6
```

1. **Drop Files**: Place your lecture MP3s and PDFs into a data folder (e.g.,
   `lva/vsys/data/lecture_05/`).
2. **Run**: Start the orchestrator script.
3. **Study**: Once finished, look in the `from_dify` subfolder for your
   ready-made notes and flashcards.
