# Fable Lab

<div align="center">
  <img src="public/icon.png" alt="Fable Lab Logo" width="120" />
  <h3>AI-Native Interactive STEM Learning Platform</h3>
  <p>Stories that teach. Experiments that live. Learning that adapts.</p>
</div>

<br/>

Fable Lab is a next-generation K12 educational platform that combines **generative AI**, **interactive p5.js simulations**, and **interactive storytelling** to make STEM concepts tangible and engaging.

Built with **Next.js 16** and **Google's Gemini models**, it offers two distinct modes:
1.  **Lesson Mode**: A structured, story-driven learning experience powered by a multi-agent backend.
2.  **Playground**: A real-time, voice-enabled collaborative coding environment where students build experiments by talking to an AI.

## ✨ Key Features

-   **🤖 AI-Generated Lessons**: Enter a topic (e.g., "Photosynthesis for 5th graders"), and our multi-agent system generates a complete lesson with:
    -   A narrative story tailored to the age group.
    -   Consistent characters and visual style.
    -   A fully interactive, code-generated p5.js experiment.
    -   Embedded quiz questions.
-   **🎙️ Voice-First Playground**: Talk to the AI to build visualizations in real-time.
    -   "Make a bouncing ball." -> *Code generates*
    -   "Now make it react to gravity." -> *Code updates*
    -   Uses **Gemini Multimodal Live API** for sub-100ms latency.
-   **🎨 Dynamic Visuals**: Consistent art direction across generated stories using specialized prompting pipelines.
-   **🛠️ Modern Tech Stack**: Built for performance and developer experience.

## 🏗️ Tech Stack

-   **Framework**: Next.js 16 (App Router)
-   **Language**: TypeScript
-   **AI SDK**: Vercel AI SDK + Google Generative AI
-   **Database**: PostgreSQL (Neon) + Drizzle ORM
-   **Styling**: Tailwind CSS + Shadcn UI
-   **State/API**: tRPC + TanStack Query
-   **Auth**: Better Auth

## 🚀 Getting Started

### Prerequisites
-   Node.js 20+
-   Bun (recommended) or npm/pnpm
-   PostgreSQL database (Neon.tech recommended)
-   Google Cloud Project with Vertex AI / Gemini API enabled

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/emrsyah/fable-lab.git
    cd fable-lab
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file based on `.env.example`:
    ```bash
    cp .env.example .env.local
    ```
    Fill in your API keys (Google AI, Database URL, etc.).

4.  **Database Migration:**
    Push the schema to your database:
    ```bash
    bun db:generate
    bun db:migrate
    ```

5.  **Run Development Server:**
    ```bash
    bun dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📜 Scripts

| Script | Purpose |
| --- | --- |
| `bun dev` | Start development server |
| `bun build` | Build for production |
| `bun db:studio` | Open Drizzle Studio to manage DB data |
| `bun db:push` | Push schema changes to DB (prototyping) |
| `bun lint` | Run Biome linter |

## 🤝 Related Projects

-   **[Fable Lab ADK](https://github.com/emrsyah/fable-lab-adk)**: The Python backend hosting the advanced AI agents that power this frontend.
