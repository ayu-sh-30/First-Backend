import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
// configuration of cors is done after app is made
// app.use(cors()) --> this will do the job but we can add options
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
// data boht jagah se aayega eg json url etc so we need to have limit
// on the data
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))

app.use(cookieParser()) // this should always be written before the routes
// ham yaha pe hi generally apne routes likhte hai
// import user Routes
import userRouter from "./routes/user.routes.js"
// routes declaration
app.use("/api/v1/users",userRouter)

//http://localhost:8000/api/v1/users/register 


export { app }