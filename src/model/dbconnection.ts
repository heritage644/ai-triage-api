import mongoose from "mongoose";
import env from "dotenv";
env.config();


const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI!) 
        console.log("connection establihshed", conn.connection.host,
            conn.connection.name
          
        )
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
      console.log(process.env.MONGO_URI);
}
export default connectDB

