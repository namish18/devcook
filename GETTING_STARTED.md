# Getting Started with LeetClone

This guide will help you set up and run the LeetClone platform locally.

## Prerequisites

- **Node.js** >= 18.0.0
- **MongoDB** (local installation or MongoDB Atlas)
- **Redis** (local installation or Redis Cloud)
- **Judge0 API Key** (optional, for code execution - get from RapidAPI)

## Installation Steps

### 1. Install Dependencies

From the root directory:

```bash
npm install
```

This will install dependencies for both server and client workspaces.

### 2. Configure Environment Variables

#### Server (.env)

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/leetclone

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d

# Judge0 API (RapidAPI)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your-rapidapi-key-here
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com

# Execution Limits
DEFAULT_TIME_LIMIT_MS=2000
DEFAULT_MEMORY_LIMIT_MB=256

# CORS
CORS_ORIGIN=http://localhost:5173
```

#### Client (.env)

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

### 3. Start MongoDB and Redis

Make sure both MongoDB and Redis are running on your system.

**MongoDB**: Usually runs on `mongodb://localhost:27017`

**Redis**: Usually runs on `localhost:6379`

### 4. Seed Sample Problems

Run the seed script to populate the database with 4 sample problems:

```bash
npm run seed --workspace=server
```

This creates:
- Admin user: `admin@leetclone.com` / `admin123`
- 2 DSA problems (Two Sum, Longest Increasing Subarray)
- 1 SQL problem (Active Customers)
- 1 Pandas problem (Flag High Spenders)

### 5. Start the Development Servers

From the root directory, run both server and client:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client

# Terminal 3 - Worker (for processing submissions)
npm run worker --workspace=server
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## Usage

### Creating an Account

1. Navigate to http://localhost:5173
2. Click "Register" and create a new account
3. Or use the admin account: `admin@leetclone.com` / `admin123`

### Solving Problems

1. Browse problems on the Problems page
2. Click on a problem to view details
3. Select a language (Java, C++, Python, SQL, or Pandas)
4. Write your solution in the Monaco Editor
5. Click "Submit" to evaluate your code
6. View real-time feedback as your code is tested

### Submission Workflow

- Submissions are queued using BullMQ
- Worker processes evaluate code via Judge0 API (or custom runners for SQL/Pandas)
- Real-time updates stream via WebSocket
- View detailed results including pass/fail per testcase

## Architecture Overview

### Backend
- **Express.js** server with TypeScript
- **MongoDB** for data persistence
- **Redis + BullMQ** for job queue
- **Socket.io** for WebSocket connections
- **Judge0 API** for code execution
- Custom runners for SQL (SQLite) and Pandas (Python)

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **Monaco Editor** for code editing
- **TanStack Query** for API state
- **Socket.io Client** for real-time updates

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in `server/.env`

### Redis Connection Error
- Ensure Redis is running: `redis-server`
- Check Redis configuration in `server/.env`

### Judge0 API Errors
- Verify API key is correct
- Check RapidAPI account limits
- Alternative: Set up self-hosted Judge0 instance

### Worker Not Processing Jobs
- Make sure worker is running: `npm run worker --workspace=server`
- Check Redis connection
- View logs for worker errors

## Next Steps

- Explore the 4 sample problems
- Create new problems via admin panel (admin account required)
- Customize language execution limits
- Add more testcases to existing problems
- Extend support for additional languages

## License

MIT
