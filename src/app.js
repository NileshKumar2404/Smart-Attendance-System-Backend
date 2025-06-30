import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))


app.use((req, res, next) => {
    console.log(`request body: ${req.body}`);
    next()
})


//import routes
import userRouter from "./routes/user.routes.js"
import classRouter from "./routes/class.routes.js"

app.use("/api/v1/user", userRouter)
app.use("/api/v1/class", classRouter)

export {app}