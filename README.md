# TaskFlo Frontend

A modern web frontend for the **TaskFlo task management application**, built with Next.js and designed to connect to the TaskFlo Django REST API.

The frontend provides an authenticated interface where users can register, sign in, manage their projects, and organize tasks within those projects.

## Features

* User login
* User registration
* JWT-based authentication
* Protected dashboard
* Project management
* Task management
* Project-specific task views
* Create new projects
* Create tasks within projects
* Task status tracking
* Task priority management
* Task due dates
* User-specific project and task data
* Responsive interface
* Error and validation handling
* Production API integration

## Tech Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* Next.js App Router
* Browser-based JWT token storage
* Django REST Framework API

## Project Structure

```text
frontend/
├── public/
│   └── images/
├── src/
│   └── app/
│       ├── page.tsx
│       └── dashboard/
│           ├── page.tsx
│           ├── projects/
│           │   ├── page.tsx
│           │   ├── new/
│           │   └── [id]/
│           │       └── tasks/
│           │           └── new/
│           └── tasks/
├── package.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

## Application Routes

### Authentication

```text
/
```

The root page provides:

* Sign in
* User registration
* Authentication error handling
* Registration validation
* Login and registration form switching

After successful authentication, the user is redirected to:

```text
/dashboard
```

### Dashboard

```text
/dashboard
```

The authenticated dashboard provides access to the user's projects and tasks.

### Projects

```text
/dashboard/projects
/dashboard/projects/new
/dashboard/projects/[id]
```

Users can:

* View their projects
* Create projects
* Open individual projects
* View tasks associated with a project

### Tasks

```text
/dashboard/tasks
/dashboard/projects/[id]/tasks/new
```

Users can:

* View their tasks
* Create tasks within projects
* Track task status
* Manage task priorities
* Manage task due dates

## API Integration

The frontend communicates with the **TaskFlo Django REST API**.

The API base URL is configured through the `NEXT_PUBLIC_API_URL` environment variable.

### Local Development

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Production

```env
NEXT_PUBLIC_API_URL=https://task-management-api-ntwv.onrender.com
```

The frontend uses the API for:

* User registration
* User authentication
* JWT token generation
* Project operations
* Task operations

## Authentication

TaskFlo uses JWT authentication provided by the Django REST API.

When a user successfully signs in, the frontend receives:

* Access token
* Refresh token

The tokens are stored in the browser and used when making authenticated API requests.

After successful authentication, the application redirects the user to:

```text
/dashboard
```

Protected API resources require a valid JWT access token.

## Running the Frontend

### Prerequisites

Make sure Node.js and npm are installed.

### Install Dependencies

From the frontend directory:

```bash
npm install
```

### Configure Environment Variables

Create a `.env.local` file in the frontend root directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

The local Django API should be running before testing authenticated functionality.

### Start the Development Server

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

## Production Build

Create an optimized production build:

```bash
npm run build
```

Start the production server locally:

```bash
npm run start
```

## Environment Variables

The frontend currently uses the following environment variable:

```env
NEXT_PUBLIC_API_URL=your-api-base-url
```

### Local Environment

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Production Environment

```env
NEXT_PUBLIC_API_URL=https://task-management-api-ntwv.onrender.com
```

Environment files containing local or project-specific configuration should not be committed when they contain sensitive values.

## Development

To run the application locally:

```bash
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

The Django backend runs separately on:

```text
http://127.0.0.1:8000
```

The frontend communicates with the backend through the configured `NEXT_PUBLIC_API_URL`.

## Deployment

The frontend is deployed independently from the Django backend.

### Frontend — Vercel

The Next.js frontend is designed to be deployed through Vercel.

The production frontend domain is:

```text
https://task-management-api-frontend-psi.vercel.app
```

The Vercel project should have the following production environment variable:

```env
NEXT_PUBLIC_API_URL=https://task-management-api-ntwv.onrender.com
```

### Backend — Render

The Django REST API is deployed separately through Render.

Production API:

```text
https://task-management-api-ntwv.onrender.com
```

The Django backend must allow the production frontend origin through its CORS configuration.

The production architecture is:

```text
User
  │
  ▼
Next.js Frontend
Vercel
  │
  │ HTTPS API requests
  ▼
Django REST API
Render
  │
  ▼
Database
```

## API Endpoints Used by the Frontend

### Authentication

```text
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/token/refresh/
```

### Projects and Tasks

```text
/api/projects/
```

Authenticated project and task requests require a valid JWT access token.

## Current Scope

The frontend currently provides the user-facing interface for authenticated project and task management.

The current application includes:

* Authentication
* Dashboard
* Projects
* Tasks
* Project-specific task management

Administrative functionality is outside the current frontend scope.

## Next.js Resources

This project is built with Next.js.

* [Next.js Documentation](https://nextjs.org/docs)
* [Learn Next.js](https://nextjs.org/learn)
* [Next.js GitHub Repository](https://github.com/vercel/next.js)

## License

This project is currently intended as a personal/project implementation.
