# LeetClone

A comprehensive online coding platform with DSA and database problem support, featuring automated evaluation, real-time feedback, and a built-in IDE.

## Features

- **Problem Catalog**: Browse and filter DSA and database problems with tags, difficulty levels, and domains
- **Built-in IDE**: Monaco Editor with syntax highlighting for Java, C++, Python, SQL, and Pandas
- **Automated Evaluation**: Real-time code execution with detailed testcase results
- **Multiple Language Support**: Java, C++, Python for DSA; SQL and Pandas for database problems
- **Real-time Updates**: WebSocket-based live submission progress
- **User Profiles**: Track your progress, view statistics, and manage favorites
- **Admin Panel**: Create and manage problems, testcases, and datasets
- **Dark/Light Mode**: Customizable theme with persisted preferences

## Tech Stack

### Backend
- Node.js + Express.js
- TypeScript
- MongoDB (Mongoose ODM)
- Redis + BullMQ (job queue)
- Socket.io (WebSocket)
- Judge0 API (code execution)

### Frontend
- React 18 + TypeScript
- React Router DOM
- TanStack Query (React Query)
- Monaco Editor
- shadcn/ui + Tailwind CSS
- Socket.io Client

## Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- Redis (local or Redis Cloud)
- Judge0 API key or self-hosted instance

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd devcook
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create `.env` in the `server` folder:
```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/leetclone

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Judge0
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your-judge0-api-key
```

Create `.env` in the `client` folder:
```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

4. Seed sample problems:
```bash
npm run seed --workspace=server
```

5. Start the development servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Project Structure

```
devcook/
├── server/                 # Backend application
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   │   └── evaluator/ # Code evaluation engine
│   │   ├── queues/        # BullMQ job queues
│   │   ├── workers/       # Queue workers
│   │   ├── middleware/    # Express middleware
│   │   ├── websocket/     # Socket.io handlers
│   │   └── scripts/       # Utility scripts
│   └── package.json
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   ├── styles/        # Global styles
│   │   └── App.tsx
│   └── package.json
└── package.json           # Root package.json
```

## Sample Problems

The platform includes 4 pre-seeded problems:

1. **Two Sum Unique Pairs** (DSA - Easy)
2. **Longest Increasing Subarray Length** (DSA - Medium)
3. **Active Customers** (SQL - Easy)
4. **Flag High Spenders** (Pandas - Medium)

## License

MIT
