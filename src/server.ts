import express from "express";
import env from "dotenv";
import cors from "cors"
import errorHandler from "./middleware/errorHandler.js";
import connectDB from "./model/dbconnection.js";

env.config();
const app = express();

app.use(cors())
app.use(express.json())
connectDB()
const port =  process.env.PORT || 3000 


app.use(errorHandler)
app.listen(port,()=> {
console.log(`App is ruuning on ${port}`)
})
