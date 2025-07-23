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

app.use(express.cookieParser())
export { app }