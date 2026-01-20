# Signal Failure

This repository contains the backend API and frontend UI that together power the Signal Failure application. Use the sections below to understand each component and how to run them locally.

## API
- Location: `api/`
- Stack: Go with the module definition in `api/go.mod` and entry point in `api/main.go`.
- Local development:
  1. `cd api`
  2. Install dependencies with `go mod tidy` (first run only).
  3. Start the service with `go run ./...`.
- Docker: The API has its own `api/Dockerfile` and is wired into the root `docker-compose.yml` for containerized workflows.
- Supporting code lives under `api/lib/` (event broker, relay, and handlers).

## UI
- Location: `ui/`
- Stack: JavaScript front end defined by `ui/package.json`, with the main entry in `ui/App.js` and shared styles in `ui/styles.js`.
- Local development:
  1. `cd ui`
  2. Install dependencies with `npm install` (or `yarn` if preferred).
  3. Start the UI with `npm start` to launch the development server or bundler configured in `package.json`.
- Docker: The UI also has a dedicated `ui/Dockerfile` and is orchestrated via `docker-compose.yml` for full-stack container runs.

## Combined Workflow
Run `docker compose up --build` from the repository root to start both services together using the provided Compose configuration.
