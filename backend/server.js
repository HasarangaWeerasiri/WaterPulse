import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({origin: "http://localhost:5173", credentials: false}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, )
 .then(() => { console.log("MongoDB connection established Successfully");

 app.listen(process.PORT, () => {
  console.log("Server is running on port " + process.PORT);
 });
})
.catch((err) =>{
  console.error("MongoDB connection error:", err);
});
