# Backend Setup Guide
# For: C:\Users\sentl\OneDrive\Documents\HEADCOUNT

## Step 1 — Install Node.js
Download and install from: https://nodejs.org
Choose the LTS version. After installing, restart your terminal and verify:
  node --version
  npm --version

## Step 2 — Copy the server folder
Place the entire `server` folder inside your project:
  C:\Users\sentl\OneDrive\Documents\HEADCOUNT\server\

Your project should now look like:
  HEADCOUNT\
    src\                  ← your React code
    server\               ← new backend
      src\
      prisma\
      package.json
      .env
    package.json          ← your React package.json

## Step 3 — Create the MySQL database
Open MySQL Command Line Client (comes with MySQL) and run:
  CREATE DATABASE headcount;

You only need to do this once.

## Step 4 — Set your database password in .env
Open: server\.env
Change this line:
  DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/headcount"

Replace YOUR_PASSWORD with your actual MySQL root password.
If your MySQL has no password, use:
  DATABASE_URL="mysql://root:@localhost:3306/headcount"

## Step 5 — Install dependencies
Open a terminal, navigate to the server folder:
  cd C:\Users\sentl\OneDrive\Documents\HEADCOUNT\server
  npm install

## Step 6 — Push schema to MySQL and seed data
Still inside the server folder:
  npx prisma db push
  npm run db:seed

This creates all the tables in MySQL and fills them with your seed data.
You can verify by running:
  npm run db:studio
This opens Prisma Studio in your browser so you can see the data visually.

## Step 7 — Start the server
  npm run dev

You should see:
  🚀 Server running at http://localhost:3001
  📋 Health check: http://localhost:3001/api/health

Open http://localhost:3001/api/health in your browser to confirm it works.

## Step 8 — Keep both servers running
You need TWO terminals open while developing:
  Terminal 1 (React):  cd HEADCOUNT && npm run dev      → http://localhost:5173
  Terminal 2 (Server): cd HEADCOUNT\server && npm run dev → http://localhost:3001

## What's next
Once the server is running, the next step is updating DataContext.tsx
to call the API instead of using in-memory state. All your page components
stay exactly the same — only DataContext changes.
