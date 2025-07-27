# TubeNode Backend project setup 

This is a self learning project to understand backend from basics to advance

-[Model Link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)

---
## 📄 Summary of this Project

This project is a **complex backend system** built using modern technologies including **Node.js**, **Express.js**, **MongoDB**, **Mongoose**, **JWT**, **Bcrypt**, and more. It is a **complete backend application** with all the essential features expected in a real-world production-grade system.

We are building (**on going**) a **video hosting platform similar to YouTube**, with core features like:

- User Authentication (Signup, Login, Logout)
- Uploading videos
- Like / Dislike functionality
- Commenting and replying
- Subscribe / Unsubscribe to users
- Full user session management
---
### ✅ Project Highlights

- Follows **production-level standards**, including modular architecture and secure coding practices.
- Routes follow **REST principles** but are blended with **RPC-style patterns**, which is common in real-world APIs.
- The backend is structured with clean separation of concerns using:
  - `models/` for schema definitions
  - `controllers/` for business logic
  - `middlewares/` for request preprocessing
  - `routes/` for route definitions
  - `utils/` for helper functions
  - `src/` as the base for source code
- Proper error handling, response formatting, and request validation have been implemented.
---
### 🧩 Libraries & Tools Used

- **JWT (jsonwebtoken)** – For secure token-based authentication (access + refresh tokens)
- **Bcrypt** – For password hashing
- **Multer** – For handling file uploads (video/image upload support)
- **Cookie-Parser** – To manage and read cookies (used for refresh tokens in httpOnly cookies)
- **Nodemon** – For live reloading during development
- **Express.js** – Fast, unopinionated web framework for Node.js
- **MongoDB + Mongoose** – NoSQL database and ODM for schema enforcement and queries

We have invested significant effort in designing this project to ensure it is scalable, secure, and easy to maintain. It is an excellent learning experience for anyone looking to understand how professional backend systems are built.

---
## 🛠️ MongoDB Atlas Connection Issue – Resolved

### ❌ Problem Faced

While setting up my backend project with MongoDB Atlas and Mongoose, I encountered the following error when attempting to connect to the database:

`MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster.
One common reason is that you're trying to access the database from an IP that isn't whitelisted.`


Despite:
- Correct `.env` setup with a valid `MONGODB_URL`
- IP whitelisting in MongoDB Atlas (`0.0.0.0/0`)
- Ensuring the cluster was running

The connection still failed.

---

### ✅ Root Cause

After extensive debugging, the actual issue was a **version incompatibility with Mongoose**.

- The latest version of `mongoose` (e.g., v8.x) wasn't connecting properly to my MongoDB Atlas cluster.
- It likely had internal breaking changes or unsupported defaults with my cluster configuration.

---

### 🧪 Solution

I fixed the issue by:

1. **Uninstalling the current version of Mongoose**:
   ```bash
   npm uninstall mongoose
2. **Installing an older stable version (v6.x or v7.x)**:
   ```bash
   npm install mongoose@7.6.0
3. **Running the app again**:
   ```bash
   npm run dev
   
✅ MongoDB connected successfully!

