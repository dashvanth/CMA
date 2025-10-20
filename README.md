# 🧠 Cognitive Mindmap Assistant (CMA)

Where Thought Maps Itself.

The Cognitive Mindmap Assistant (CMA) is a full-stack, AI-powered application designed to transform raw text, PDFs, and potentially voice input into interactive, hierarchical mind maps.

It leverages Google's Genkit framework with the Gemini model for sophisticated content analysis and generation, backed by Firebase for robust user authentication and data persistence.🚀

## Getting Started (Local Development)This project requires a dual setup:

    - the Next.js Frontend and the Genkit AI Backend must run concurrently on separate ports to avoid conflicts.
    - PrerequisitesNode.js: Version 20.x or higher.
    - A Gemini API Key: Required for all AI generation and summarization flows.
    - InstallationClone the repository.Install dependencies:Bashnpm install

# Project Title: Spectra Project

## Set up Environment Variables

Create a file named `.env` in the root directory and add your Gemini API Key:

```plaintext
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
```

## Running Locally (Two Terminals)

You must run the services in two separate terminal windows.

| Terminal       | Command              | Role                                              | Access URL                                                             |
| -------------- | -------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| **Terminal 1** | `npm run genkit:dev` | Runs the Google Genkit development server.        | [http://localhost:3000/api/genkit/](http://localhost:3000/api/genkit/) |
| **Terminal 2** | `npm run dev`        | Runs the Next.js development server on port 3001. | [http://localhost:3001](http://localhost:3001)                         |

> **Note:** The frontend is configured to run on port 3001 to prevent a port conflict with the Genkit server, which defaults to 3000.

## 💻 Tech Stack & Architecture

### Frontend (Next.js)

- **Framework:** Next.js (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict mode enforced)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) and class-variance-authority (Shadcn UI components)
- **Data Visualization:** D3.js (for layout and hierarchy) and custom React components for node rendering.
- **PDF Processing (Client-side):** `pdfjs-dist` is used to extract text content from uploaded PDF files, which is then sent to the AI backend for processing.

### Backend (AI & Data)

- **AI Framework:** [Google Genkit](https://genkit.dev/)
- **LLM Model:** googleai/gemini-2.5-flash
- **Database:** [Firebase Firestore](https://firebase.google.com/docs/firestore) for data persistence.
- **Authentication:** [Firebase Auth](https://firebase.google.com/docs/auth) (Email/Password & Google OAuth).
