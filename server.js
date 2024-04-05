import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import todoRoute from "./routes/todoRoute.js"

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// CORS configuration allowing requests from any origin
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.get('/', (req, res) => {
  res.send("Welcome");
});



// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Database connected.....");
  })
  .catch((error) => {
    console.log(error, "Database disconnected.....");
  });

// Route for root endpoint


// Routing
app.use("/api/v2", todoRoute);

// Server connection
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server connected PORT ${PORT}`);
});
