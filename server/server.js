import express from 'express'; // Express import kar rahe hain
import cors from 'cors';       // CORS middleware import
import 'dotenv/config';        // .env file se variables load karna
import { clerkMiddleware, requireAuth } from "@clerk/express";
import aiRouter from './routes/aiRouter.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';


const app = express();         // Express app create kiya
await connectCloudinary();

app.use(cors());               // CORS enable kiya
app.use(express.json());       // JSON data ko parse karne ke liye
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send('Server is Live!')); // Root route - simple response
app.use(requireAuth())
app.use('/api/ai', aiRouter)
app.use('/api/ai', userRouter)

const PORT = process.env.PORT || 3000; // PORT env se ya 3000 default

app.listen(PORT, () => {
  console.log('Server is running on port', PORT); // Server start hone par console log
});
