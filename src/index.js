// require('dotenv').config({path: "./env"});
import dotenv from "dotenv";
dotenv.config({
    path: './env'
})
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import express from "express"
import { app } from "./app.js";
// const app = express()

connectDB()                 //whenever an asynchronous method get
.then(() => {               //completed it also returns a promise
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port: ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MongoDB connection failed: ", err)
})                
                











/*
import express from "express";
const app = express();

// IIFE - 
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error;
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR: ", error)
        throw error
    }
})()
*/