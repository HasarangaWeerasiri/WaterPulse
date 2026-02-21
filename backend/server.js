import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({origin: "http://localhost:5173", credentials: true}));
app.use(express.json());

// Auth routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is healthy' });
});

// Report routes
app.use("/api/reports", reportRoutes);

mongoose.connect(process.env.MONGO_URI)
 .then(() => { 
   console.log("MongoDB connection established Successfully");

   app.listen(PORT, () => {
     console.log("Server is running on port " + PORT);
   });
 })
 .catch((err) =>{
   console.error("MongoDB connection error:", err);
 });


