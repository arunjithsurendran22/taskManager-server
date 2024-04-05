// routes/taskRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  completeTask,
  updateStatus,
  logoutUser,
} from "../controllers/taskController.js";
import { userAuthenticate } from "../middleware/userAuthMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile/get", userAuthenticate, getUserProfile);
router.post("/create", userAuthenticate, createTask);
router.get("/get", userAuthenticate, getTasks);
router.put("/update/:id", userAuthenticate, updateTask);
router.delete("/delete/:id", userAuthenticate, deleteTask);
router.put("/complete/:id", userAuthenticate, completeTask);
router.put("/update-status/:id/:newStatus", userAuthenticate, updateStatus);
router.post("/logout", userAuthenticate, logoutUser);


export default router;
