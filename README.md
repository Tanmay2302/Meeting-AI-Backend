# 🧠 Meeting AI Backend

A **Node.js + Express** backend that automatically summarizes meeting transcripts using **Groq LLM** and manages users with **PostgreSQL and JWT authentication**.  
The project supports both **sync** and **async** summary generation and exposes a fully interactive **Swagger UI** for easy API testing.

## 🌍 Live Deployment

- **Base URL:** [https://meeting-ai-backend.onrender.com](https://meeting-ai-backend.onrender.com)
  
- **Swagger Docs:** [https://meeting-ai-backend.onrender.com/docs](https://meeting-ai-backend.onrender.com/docs)
  

## 🚀 Overview

This backend lets users:

- Register and log in securely using email & password (with JWT auth)
- Upload or post meeting transcripts, stores in PostgreSQL
- Automatically generate meeting summaries and action items using Groq API
- Retrieve and view all meetings or a specific meeting
- Explore and test every endpoint visually using Swagger UI

---

## 📂 Folder Structure

src/

├── config/

│ ├── env.js # Loads environment variables

│
├── db/

│ ├── client.js # PostgreSQL + Drizzle ORM client

│ ├── schema.js # Table schemas for meetings, users, embeddings

│ ├── bootstrap.js # ensures all required database tables exist automatically on startup (creates users, meetings, and embeddings tables if missing)
 
├── lib/

│ ├── ai/

│ │ ├── parse.js # Handles JSON-safe AI responses

│ │ ├── prompts.js # LLM prompt templates

│ │ ├── provider.js # Groq model integration (summary + embeddings)

│ ├── logger.js # Centralized logging with timestamps

│
│ ├── queue/

│ │ ├── queue.js # In-memory BullMQ-style queue (for async jobs)

│ │ ├── jobs.js # Job handler for summarization

│
├── middleware/

│ ├── auth.js # JWT handling & route protection

│ ├── errors.js # Error middleware

│ ├── validate.js # Input validation middleware

│
├── modules/

│ ├── auth/

│ │ ├── controller.js # Register & login logic

│ │ ├── routes.js # /auth/register, /auth/login endpoints

│ │ ├── service.js # Database-level operations for auth

│ │ ├── validators.js # Joi/Zod schema validation


│ ├── meetings/

│ │ ├── controller.js # Route handler (POST, GET, etc.)

│ │ ├── repo.js # Direct DB operations for meetings

│ │ ├── routes.js # /api/v1/meetings endpoints

│ │ ├── service.js # Logic for summary creation

│ │ ├── validators.js # Input validation for meetings


├── openapi.json # Swagger API definition

├── index.js # Main server entry (sets up routes, swagger, queue)

└── drizzle.config.js # Drizzle ORM configuration

> ✅ **Note:**  
> Our async queue is handled internally (lightweight version for local jobs).

---

## 🚀 How to Test the API on Production (Swagger UI)

**You can easily test all endpoints using the live Swagger UI hosted on Render.**

🌐 URL: https://meeting-ai-backend.onrender.com/docs

🧭 Step-by-Step Guide

1️⃣ **Open the Docs**

Visit → https://meeting-ai-backend.onrender.com/docs

You’ll see grouped sections for Auth and Meetings endpoints.

2️⃣ **Register a New User**

Expand POST → /api/v1/auth/register

Click Try it out

Paste the sample body below (or use your own email):

{
  "email": "support.desk@company.net",
  
  "password": "TempLogin$2024"
}


Click Execute

✅ Expected: 201 Created with a response like

{ "id": "uuid", "email": "support.desk@company.net" }


3️⃣ **Login to Get Your JWT**

Expand POST → /api/v1/auth/login

Click Try it out

Paste the same email/password:

{
  "email": "support.desk@company.net",
  "password": "TempLogin$2024"
}

Click Execute

✅ Copy the token from the response (a long string of letters/numbers).

4️⃣ **Authorize with the JWT**

Click the Authorize 🔒 button at the top-right.

In the BearerAuth box, paste only the raw token (❌ don’t add “Bearer”).

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...<snip>...


Click Authorize → Close.

Swagger will now include this token in all protected requests.

5️⃣ **Create a Meeting**

Expand POST → /api/v1/meetings

Click Try it out

Paste this body:

{
  "title": "Client Onboarding Feedback Session",
  
  "transcript": "Alex: 'Okay, let's review the onboarding process for the new client, 'GlobalFin'. Maria, how did the data import go?' Maria: 'The import was rough. Their files were poorly formatted, and we spent 20 hours just on cleanup. We need a stricter validation step before we accept their data next time.' Ben: 'I agree. On the training side, their team was engaged but very new to our platform. They asked for more 'hands-on' examples. The standard demo video wasn't enough.' Alex: 'Good feedback. So, action items: Maria, draft a 'Data Pre-flight Checklist' for new clients. Ben, can you create two advanced workshop modules for the finance and ops teams? I'll take this feedback to the account manager to reset expectations on future data loads.'"
}


Click Execute

✅ Expected: 201 Created with a JSON containing a meeting id.
Save that id.

6️⃣ **Get a Meeting by ID**

Expand GET → /api/v1/meetings/{id}

Click Try it out

Paste the id from the previous step (e.g. 8c8b4c9b-...)

(Optional) Add **auto = 1** to force summary generation if still processing.

Click Execute

✅ Expected: a JSON meeting with summary, actionItems, status, etc.

7️⃣ **List Recent Meetings**

Expand GET → /api/v1/meetings

Click Try it out

Click Execute

✅ Expected: a list of meetings with summaries and timestamps.

## 💡 Tips & Troubleshooting

In the Authorize popup, paste only the token, not "Bearer <token>".

If you get 401 unauthorized → re-authorize with a fresh token.

If you see "invalid token" → click the lock icon, Logout, and re-Authorize.

Always test in this order:
Register → Login → Authorize → Create Meeting → Get Meeting

> **:warning: WARNING: Do Not Use Example Data**
>
> The JSON examples provided in this documentation (such as for user credentials or meeting transcripts) are for demonstration purposes only.
>
> **Do not** copy these placeholder emails, passwords, or other sample data for use in your application, testing, or production environments. You must replace them with your own valid credentials and data.

## 🧩 How It Works

1. **User Flow**

   - A user registers (`/api/v1/auth/register`)
   - Logs in to get a JWT (`/api/v1/auth/login`)
   - Uses the token to access `/api/v1/meetings` endpoints

2. **Meeting Summary Flow**

   - On `POST /api/v1/meetings`, the transcript is saved in DB.
   - If async jobs are enabled (`ENABLE_JOBS=true`), it’s queued for processing.
   - Otherwise, Groq LLM generates a summary instantly (sync mode).
   - The summary and action items are stored in the database.

3. **Swagger UI**
   - Runs at: **[http://localhost:8080/docs](http://localhost:8080/docs)** locally  and  **[https://meeting-ai-backend.onrender.com/docs]( https://meeting-ai-backend.onrender.com/docs)** in deployment
   - Lets you test all endpoints visually.
   - Use **Authorize → Bearer Token** (paste token from `/api/v1/auth/login`).

---

## ⚙️ Environment Setup

Create a `.env` file or copy from `.env.example` with:

```bash
# Server
PORT=8080
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/meetings

# Feature toggles
ENABLE_AUTH=true
ENABLE_JOBS=false   #This is to toogle between sync and async calls (for async calls mark it true, we have used async calls. So n our project it is mark as true)
ENABLE_EMBEDDINGS=true

# AI Provider (Groq only)
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here

# JWT
JWT_SECRET=your_jwt_secret_key
```

## 🧭 API Endpoints Summary

🔑 **Authentication**

Method Endpoint Description

1.  POST /api/v1/auth/register Register a new user

2.  POST /api/v1/auth/login Login and get JWT token

📋 **Meetings**

Method Endpoint Description

1.  GET /api/v1/meetings List all meetings (requires JWT)

2.  POST /api/v1/meetings Create and summarize meeting (sync/async)

3.  GET /api/v1/meetings/{id} Get meeting by ID

4.  GET /api/v1/meetings/{id}?auto=1 Re-summarize instantly if pending

🧠 **Tech Stack**

Node.js + Express.js – REST API framework

Drizzle ORM + PostgreSQL – Database layer

Groq LLM (Llama 3.1 8B Instant) – AI summarization engine

JWT Auth (bcrypt + jsonwebtoken) – Secure login

Swagger UI – API documentation & live testing

## 🧪 Running the Project

1️⃣ Install dependencies

npm install

2️⃣ Start the dev server

npm run dev

3️⃣ Open Swagger

Visit → http://localhost:8080/docs

Then:

1.  Register a user (/api/v1/auth/register)

2.  Login to get your JWT (/api/v1/auth/login)

3.  Authorize via the Swagger “Authorize” button

4.  Test meeting endpoints interactively 🎯

## ✅ Project Requirements Met

Requirement Status Implementation:-

1.  Authentication (Register/Login)         ✅ /api/v1/auth/register and /api/v1/auth/login with JWT

2.  Meeting creation & summarization        ✅ /api/v1/meetings (Groq-based summarization)

3.  Async/Sync job support                  ✅ Controlled by ENABLE_JOBS flag

4.  Database Integration                    ✅ PostgreSQL via Drizzle ORM

5.  Swagger UI                              ✅ /docs endpoint

6.  Error Handling & Logging                ✅ Centralized logger.js + Express middleware

7.  Embeddings                              ✅ embedTextIfEnabled() in Groq provider

8.  Readable, Modular Code                  ✅ Clear folder structure

## 💡 Notes

Async jobs are optional (ENABLE_JOBS=false means sync mode).

Swagger UI auto-loads from /src/openapi.json.

repo.js in meetings module handles low-level DB operations cleanly.

The project runs smoothly without Redis or external queues.

## ✨ Example Test Data


{
"title": "Marketing Strategy Alignment - Q1 Campaign Planning",

"transcript": "Attendees: Marketing Head (Tara), Content Lead (Riya), Performance Manager (Dev), Product Marketing (Anil), Design (Irfan). Tara opened by outlining Q1 objectives: increase qualified leads by 25% and boost product awareness through multi-channel campaigns. Riya proposed a new content pillar strategy focusing on case studies and customer storytelling. Dev shared paid performance insights—LinkedIn CTR improved by 0.8%, but CAC rose by 12%. Anil suggested repositioning the product around ‘efficiency and control’ to improve ad resonance. Irfan highlighted design bottlenecks due to overlapping campaign assets; requested clearer prioritization. Risks: content backlog due to late SME inputs and high design load. Decision: pilot two campaign angles (efficiency vs innovation) and evaluate CTR differences before scaling.
}

Expected Output

{
"id": "f7280800-e26c-429d-982e-bf718dcf08d8",

"title": "Marketing Strategy Alignment - Q1 Campaign Planning",

"transcript": "Attendees: Marketing Head (Tara), Content Lead (Riya), Performance Manager (Dev), Product Marketing (Anil), Design (Irfan). Tara opened by outlining Q1 objectives: increase qualified leads by 25% and boost product awareness through multi-channel campaigns. Riya proposed a new content pillar strategy focusing on case studies and customer storytelling. Dev shared paid performance insights—LinkedIn CTR improved by 0.8%, but CAC rose by 12%. Anil suggested repositioning the product around ‘efficiency and control’ to improve ad resonance. Irfan highlighted design bottlenecks due to overlapping campaign assets; requested clearer prioritization. Risks: content backlog due to late SME inputs and high design load. Decision: pilot two campaign angles (efficiency vs innovation) and evaluate CTR differences before scaling. Action items: Riya to finalize editorial calendar, Dev to update paid dashboard, and Tara to lock Q1 spend allocation by Friday. Next review: Wednesday, 11 AM.",

"summary": "The team aligned on Q1 marketing objectives, including a 25% increase in qualified leads and multi-channel campaigns. They decided to pilot two campaign angles (efficiency and innovation) to evaluate CTR differences. Key context includes a content backlog and design bottlenecks.",

"actionItems": [

{
"text": "Riya to finalize editorial calendar",
"owner": "Riya"
},

{
"text": "Dev to update paid dashboard",
"owner": "Dev"
},

{
"due": "2023-03-03",
"text": "Tara to lock Q1 spend allocation by Friday",
"owner": "Tara"
}

],
"status": "ready",
"createdAt": "2025-11-02T13:24:08.083Z"
}
