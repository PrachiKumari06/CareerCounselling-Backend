# CareerConnect Backend API

## Project Overview

This is the backend server for the CareerConnect full stack application.

It handles:

- User Authentication (Signup, Login)
- Career Profile Management
- Job Posting & Matching
- Forum Posts
- Resource Management
- AI Recommendation Endpoint
- Session Booking
- Protected Routes with JWT
- Resume Upload Middleware

The backend follows proper MVC architecture and integrates with Supabase as the database.

-------------------------------------------------------------------------------------------------------

##  Tech Stack

- Node.js
- Express.js
- Supabase (PostgreSQL Database)
- JWT Authentication
- Axios (for API handling if needed)
- Multer (Resume Upload Middleware)

----------------------------------------------------------------------------------------------------------

##  Backend Folder Structure
```
backend/
│
├── src/
│ ├── config/
│ │ └── supabase.config.js
│ │
│ ├── controller/
│ │ ├── auth.controller.js
│ │ ├── profile.controller.js
│ │ ├── job.controller.js
│ │ ├── forum.controller.js
│ │ ├── resource.controller.js
│ │ ├── session.controller.js
│ │ └── ai.controller.js
│ │
│ ├── routes/
│ │ ├── auth.routes.js
│ │ ├── profile.routes.js
│ │ ├── job.routes.js
│ │ ├── forum.routes.js
│ │ ├── resource.routes.js
│ │ ├── session.routes.js
│ │ └── ai.routes.js
│ │
│ ├── middleware/
│ │ ├── verifyToken.middleware.js
│ │ └── uploadresume.js
│
├── server.js
├── package.json
└── .env
```
----------------------------------------------------------------------------------------------------------

## Authentication

Authentication is handled using JWT tokens.

- On login, server returns a token.
- Token is stored on frontend.
- Protected routes use `verifyToken.middleware.js`.
- Authorization header format: Authorization: Bearer <token>

----------------------------------------------------------------------------------------------------------

##  API Documentation: 

###  Auth Routes

| Method | Endpoint | Description |
|--------|----------|------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login user |
| POST | /api/auth/logout | Logout user |

---

###  Profile Routes

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | /api/profile/career-profile | Get user profile |
| POST | /api/profile/career-profile | Create profile |
| PUT | /api/profile/career-profile | Update profile |

---

###  Job Routes

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | /api/jobs | Get all jobs |
| POST | /api/jobs | Apply for job |
| GET | /api/jobs | Get getMyApplications  |

---

###  Forum Routes

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | /api/forum | Get all posts |
| POST | /api/forum | Create post |
| GET | /api/forum/:id | Get single post |

---

###  Resource Routes

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | /api/resources | Get all resources |
| POST | /api/resources | Add resource |

---

###  AI Routes

| Method | Endpoint | Description |
|--------|----------|------------|
| POST | /api/ai/recommendation | Generate AI career recommendation |

---

###  Session Routes

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | /api/session | Get sessions |
| POST | /api/session | Book session |

---

## Database Schema Explanation

Database is managed using Supabase.

### Main Tables:

### 1. users
- id (UUID)
- email
- password
- role

### 2️. career_profiles
- id
- user_id (Foreign Key → users.id)
- full_name
- education
- skills
- experience
- interests
- bio

### 3️. jobs
- id
- title
- company
- skills_required
- created_at

### 4️. forum_posts
- id
- user_id (FK)
- title
- content
- created_at

### 5️. resources
- id
- title
- description
- link

### 6️. sessions
- id
- user_id
- counselor_id
- date

All relationships are properly normalized using foreign keys.

----------------------------------------------------------------------------------------------------------


##  Installation Steps

1. Clone the repository : git clone <backend repo>
2. Install dependencies: npm install
3. Create `.env` file
   Add:
    PORT=4000
    SUPABASE_URL=your_supabase_url
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_servicekey
    GEMINI_API_KEY=your_gemini_apikey
    FRONTEND_URL=deploy frontend link

4. Start server
---------------------------------------------------------------------------------------------------------------
## 🌐 Deployment

Backend is deployed on Render.
 Deployment Link: 



