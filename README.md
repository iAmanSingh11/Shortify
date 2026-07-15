# 🚀 Shortify : Production Ready URL Shortener

Shortify : A full stack URL shortening platform inspired by Bitly, built with a strong focus on **performance, security, and scalability**. I created this project to go beyond CRUD applications and gain hands-on experience with production-ready backend architecture, caching, authentication, background jobs, and analytics.



## 🌐 Live Demo
https://shortify-five-iota.vercel.app

# ✨ Features

###  Authentication & Security
- JWT Authentication with Refresh Token Rotation
- Role-Based Access Control (RBAC)
- API Key Authentication
- Password Hashing (bcrypt)
- HTTP-only Cookies
- Account Lockout Protection
- Rate Limiting
- Helmet Security
- MongoDB Sanitization
- Request Validation (Zod)
- Audit Logging

###  URL Management
- Short URL Generation
- Custom Aliases
- Password-Protected Links
- Link Expiration
- QR Code Generation
- Search, Filter & Pagination

###  Analytics
- Total & Daily Clicks
- Browser, Device & OS Statistics
- Country & Referrer Analytics
- Returning Visitors
- Top Performing Links

###  Performance
- Redis Caching
- BullMQ Background Jobs
- Optimized MongoDB Indexes
- Aggregation Pipelines
- Fast Redirect Handling
- Structured Logging

###  Admin Dashboard
- Platform Overview
- User Management
- Role Management
- Link Management
- Audit Logs



# 🛠 Tech Stack

| Frontend | Backend | Database | Deployment |
|----------|----------|----------|------------|
| React, Vite, Tailwind CSS | Node.js, Express.js | MongoDB Atlas | Vercel |
| Axios, Chart.js | Redis, BullMQ | Mongoose | Render |
| React Router | JWT, bcrypt, Zod | Upstash Redis | GitHub Actions |



# 🏗 Architecture

```
React Frontend
       │
 REST APIs
       │
 Express.js
       │
 ├───────────── MongoDB
 ├───────────── Redis Cache
 └───────────── BullMQ Workers
                     │
             Analytics Processing
```

The project follows a modular architecture with separate **Controllers**, **Routes**, **Models**, **Middlewares**, **Services**, and **Background Workers** for better scalability and maintainability.


# Project Structure

```
Shortify
│
├── backend
│   ├── controllers
│   ├── middlewares
│   ├── models
│   ├── routes
│   ├── services
│   ├── queues
│   └── tests
│
├── frontend
│   ├── api
│   ├── components
│   ├── pages
│   ├── routes
│   └── context
│
└── README.md
```



# Getting Started

### Clone Repository

```bash
git clone
cd Shortify
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```
```
```
```
```



# ☁ Deployment

| Service | Platform |
|----------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Cache | Upstash Redis |




#  Testing

The backend is tested using:

- Jest
- Supertest
- MongoDB Memory Server
- Mock Redis

GitHub Actions automatically builds and tests the project on every push.


#  What I Learned

Building Shortify helped me gain practical experience with:

- Designing scalable REST APIs
- Authentication & Authorization
- Redis Caching
- Background Job Processing
- MongoDB Aggregation
- Database Indexing
- Backend Security
- CI/CD
- Cloud Deployment
- Clean Architecture



##  Author

**Aman Singh**

- GitHub: https://github.com/iAmanSingh11
- LinkedIn: *()*


**If you found this project interesting, consider giving it a star!**
