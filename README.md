# 3D Classroom

A collaborative 3D learning environment with teacher and student roles, real-time multiplayer movement, audio signaling, avatar selection, and an AI-powered classroom assistant.

## Key Features

- Role-based entry: teacher or student
- Room creation and joining
- 3D classroom scene powered by React Three Fiber
- Avatar selection with custom color
- Real-time multiplayer synchronization using Socket.IO
- Voice/audio peer signaling support
- Teacher UI and student UI components
- AI chat assistant backend with document search over course materials
- Document ingestion from `backend/documents` (`.txt`, `.pdf`, `.pptx`, `.docx`)

## Tech Stack

- Frontend: React, Vite, React Three Fiber, React Router, Socket.IO Client
- Backend: Node.js, Express, Socket.IO, dotenv, Groq SDK, OfficeParser

## Repository Structure

- `backend/` - Express server, socket handlers, document loader, AI chat endpoint
- `frontend/` - React app, routes, 3D classroom components, UI flows
- `.env.example` - example environment file for backend API keys
- `.gitignore` - ignores node modules, env files, build artifacts

## Prerequisites

- Node.js 18+ installed
- npm available
- A Groq API key for AI chat functionality

## Setup

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

3. Create a local environment file in the project root:

```bash
cp .env.example .env
```

4. Open `.env` and add your API key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

## Run the Project

### Start the backend

```bash
cd backend
node server.js
```

The backend runs on `http://localhost:3002`.

### Start the frontend

```bash
cd frontend
npm run dev
```

The frontend typically runs on `http://localhost:5173`.

## How to Use

1. Open the frontend URL in your browser.
2. Choose your role: Teacher or Student.
3. Enter a display name and room name.
4. Select an avatar color.
5. Join the classroom and interact in real time.

## Backend AI Chat

The backend exposes a chat API at `/api/chat` that searches loaded documents for relevant context before querying the Groq model.

- Documents are loaded from `backend/documents`
- Supported file types: `.txt`, `.pdf`, `.pptx`, `.docx`
- The chat assistant uses `process.env.GROQ_API_KEY`

## Notes

- Keep `.env` local and do not commit it to GitHub.
- The root `.gitignore` already excludes `.env` and `node_modules`.
- If you add more course materials, place them inside `backend/documents`.

## License

This project is provided as-is. Update license information as needed.
