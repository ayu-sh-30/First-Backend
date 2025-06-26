# First backend project setup 

This is a self learning project to understand backend from basics to advance

-[Model Link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)

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

