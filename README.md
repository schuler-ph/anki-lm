<div align="center">
  <img src="public/ankilm-new.svg" height="120" alt="AnkiLM logo" />
  <h1 style="margin-top: 0;">AnkiLM</h1>
  <a href="https://schuler-ph.github.io/dir-praxis/#/">
    <img src="https://img.shields.io/badge/View_Live_Demo-3B82F6?style=for-the-badge&logo=github&logoColor=white" alt="View Live Demo" />
  </a>
</div>

> An automated "Import-to-Learn" pipeline that transforms raw lecture materials
> into structured, exam-ready study artifacts.

## 🚀 Overview

This project is a sophisticated study assistant designed to automate the grunt
work of university studies. Instead of manually transcribing lectures or
summarizing endless slide decks, this system ingests raw data (audio recordings
& PDFs) and uses an AI-powered pipeline to generate concise summaries, deep-dive
explanations, and spaced-repetition flashcards.

Information flows from raw files into a **local orchestration layer**, through
an **AI processing engine (Whisper & Dify)**, and finally renders into this
interactive **Frontend Dashboard** for review and study.

## ✨ Key Features

### 1. The "Import to Learn" Pipeline

- **Audio Ingestion**: Automatically detects and processes lecture recordings
  (MP3).
- **High-Fidelity Transcription**: Uses **OpenAI Whisper** to generate accurate
  text from speech.
- **Smart PDF Integration**: "stamps" slide decks with page numbers, allowing
  the AI to cite specific slides in its explanations.

### 2. AI-Powered Analysis (Dify Workflow)

The system feeds prepared data into a Dify workflow to produce structured
artifacts:

- **📄 Summaries**: Executive summaries of the lecture topics.
- **✨ Refined Transcripts**: Cleaned-up text, removing filler words and
  stuttering.
- **⚡ TL;DRs**: One-page cheat sheets with key exam topics.
- **📖 Concepts & Definitions**: Extracted terminology tables.
- **🧮 Example Problems**: Breakdown of practical examples mentioned in class.
- **🧠 Anki Cards**: Formatted flashcards ready for import into spaced
  repetition tools.

### 3. Interactive Frontend Dashboard

This repository hosts the modern web interface used to study the generated
content.

- **Tech Stack**: Built with **React 19**, **Vite**, **Tailwind CSS v4**, and
  **Framer Motion**.
- **MDX Integration**: Renders rich text content directly from the generated
  markdown files.
- **Responsive UI**: A clean, distraction-free reading environment.

## 🛠️ System Architecture

```mermaid
graph TD
    A[Raw Input] -->|MP3 & PDF| B(Orchestrator)
    B -->|Audio Processing| C[Whisper AI]
    B -->|Slide Processing| D[PDF Stamper]
    C & D --> E[AI Brain / Dify]
    E -->|Structured MDX| F[Study Artifacts]
    F --> G[Frontend Dashboard]
```

1. **Orchestrator**: A local script watches subject directories for new files.
2. **Processing**: Audio is transcribed; slides are indexed.
3. **Synthesis**: The Dify agent analyzes the content against the slides.
4. **Presentation**: This React application renders the final `01-summary.mdx`,
   `06-anki.mdx`, etc.

## 📸 Screenshots

<div style="display: flex; gap: 10px;">
  <img width="45%" alt="Dify Pipeline" src="https://github.com/user-attachments/assets/de00563e-add6-4f3a-ad16-b435c034583c" />
  <img width="45%" alt="Landig Page" src="https://github.com/user-attachments/assets/e72d0256-a156-41e2-bb20-35be8e2b3e00" />
</div>

<div style="display: flex; gap: 10px;">
  <img width="45%" alt="grafik" src="https://github.com/user-attachments/assets/0cb5e27c-97d6-4d3f-9cba-6a1681de0235" />
  <img width="45%" alt="grafik" src="https://github.com/user-attachments/assets/6b3bc1d9-0da6-4806-a3e1-ec10f6231dc3" />
</div>

## 💻 Tech Stack

**Frontend:**

- ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
- ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
- ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
- **Framer Motion** (for smooth transitions)
- **MDX** (for content rendering)

**Pipeline / Backend:**

- Deno (Orchestrator)
- OpenAI Whisper (ASR)
- Dify (LLM Workflow Orchestration)

## 📝 Usage

- **Process New Content**: (Backend step) Drop files into the monitored data
  folder and run the orchestrator.
- **Study**: Open this dashboard. Navigate to the specific lecture to view the
  auto-generated summaries, definitions, and flashcards.

## 🔜 Future Improvements

- Real-time processing status updates in the dashboard.
- Direct PDF viewer integration alongside the transcript.
- Export to Notion integration.
