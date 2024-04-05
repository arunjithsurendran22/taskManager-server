import TaskModal from "../models/Task.js";
import { hashPassword, comparePassword } from "../helper/auth.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const accessTokenUserSecret = process.env.USER_JWT_SECRET;
const refreshTokenUserSecret = process.env.USER_REFRESH_TOKEN_SECRET;

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const role = "user";

    // Validate input fields
    if (!email) {
      return res.json({ message: "Email is required" });
    }
    if (!password || password.length < 6) {
      return res.json({
        message: "Password is required and must be 6 characters minimum",
      });
    }

    // Check if email already registered
    const existingEmail = await TaskModal.findOne({ email });

    if (existingEmail) {
      return res.json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create a new user
    const user = await TaskModal.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    return res.status(200).json({ message: "Registered Successfully", user });
  } catch (error) {
    next(error);
    console.log(error, "error for register");
    res.status(500).json({ message: "Internal server error" });
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.json({ message: "Email is required" });
    }
    if (!password || password.length < 6) {
      return res.json({
        message: "Password is required and must be at least 6 characters long",
      });
    }

    // Check if the user is already registered
    const existingUser = await TaskModal.findOne({ email });

    if (!existingUser) {
      return res.json({ message: "User not found" });
    }

    // Check if the password is a match
    const passwordMatch = await comparePassword(
      password,
      existingUser.password
    );

    if (!passwordMatch) {
      return res.json({ message: "Invalid password" });
    }

    // Generate JWT Token
    const accessTokenUser = jwt.sign(
      {
        id: existingUser._id,
        email: existingUser.email,
        role: "user",
      },
      accessTokenUserSecret,
      { expiresIn: "1d" }
    );

    // Generate Refresh Token
    const refreshTokenUser = jwt.sign(
      {
        id: existingUser._id,
        email: existingUser.email,
        role: "user",
      },
      refreshTokenUserSecret,
      { expiresIn: "30d" }
    );

    // Set the token as a cookie in the response
    res.cookie("accessTokenUser", accessTokenUser, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    // Set the access token in the response header
    res.setHeader("authorization", `Bearer ${accessTokenUser}`);

    return res.status(200).json({
      message: "User Login successful",
      _id: existingUser._id,
      email: existingUser.email,
      accessTokenUser: accessTokenUser,
      refreshTokenUser: refreshTokenUser,
    });
  } catch (error) {
    next(error);
    console.log(error, "login failed");
    return res.status(500).json({ message: "Internal server error" });
  }
};

//GET:profile data
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    // Find the user by ID
    const user = await TaskModal.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract relevant profile data
    const userProfile = {
      name: user.name,
      email: user.email,
    };
    // Return the user's profile data
    return res.status(200).json({ userProfile });
  } catch (error) {
    next(error);
    console.log(error, "error for getting profile");
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new task
const createTask = async (req, res) => {
  try {
    const { taskName, taskDescription } = req.body;
    const userId = req.userId;

    console.log("taskName", taskName);
    console.log("taskDescription", taskDescription);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find the user by ID
    let user = await TaskModal.findById(userId);

    if (!user) {
      // If user not found, return unauthorized
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Create a new task document
    const newTask = {
      name: taskName,
      description: taskDescription,
      status: "inprogress",
    };

    // Push the new task into the todo array of the user
    user.todo.push(newTask);

    // Save the updated user document
    await user.save();

    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Controller function to fetch tasks associated with a user
const getTasks = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find the user by userId
    const user = await TaskModal.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract the todo list from the user
    const todos = user.todo;

    res.status(200).json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// put:update task status
const updateStatus = async (req, res, next) => {
  try {
    const { id, newStatus } = req.params;

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find the user task by user ID
    const userTask = await TaskModal.findOne({ _id: userId });

    if (!userTask) {
      return res.status(404).json({ message: "User task not found" });
    }

    // Find the task within the user's todo list by task ID
    const taskToUpdate = userTask.todo.find(
      (task) => task._id.toString() === id
    );

    if (!taskToUpdate) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update the task status based on the newStatus parameter
    taskToUpdate.status = newStatus;

    // Save the updated user task data
    await userTask.save();

    res.status(200).json({
      message: "Task status updated successfully",
      status: taskToUpdate,
    });
  } catch (error) {
    console.error("Error updating task status:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updatedTask = await TaskModal.findOneAndUpdate(
      { "todo._id": id },
      {
        $set: {
          "todo.$.name": name,
          "todo.$.description": description,
        },
      },
      { new: true } // Return the updated task
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({
      message: "Task updated successfully",
      updatedTask,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find the user by their ID
    const user = await TaskModal.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the task by its ID in the user's todo list
    const taskIndex = user.todo.findIndex((task) => task._id.toString() === id);

    if (taskIndex === -1) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Remove the task from the todo array
    user.todo.splice(taskIndex, 1);

    // Save the updated user data
    await user.save();

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const completeTask = async (req, res) => {
  const { Id } = req.params; // Extract task id from request parameters
  const userId = req.userId;
  try {
    // Find the task by id
    const task = await TaskModal.findById(userId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Toggle the completion status
    task.todo.forEach((todoItem) => {
      if (todoItem._id.toString() === Id) {
        todoItem.completed = !todoItem.completed;
      }
    });

    // Save the updated task
    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error toggling task completion:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout controller
const logoutUser = async (req, res, next) => {
  try {
    res.clearCookie("accessTokenUser"); // Clear access token cookie
    res.removeHeader("authorization"); // Remove access token from response header

    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    next(error);
    console.error("Logout failed:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export {
  registerUser,
  loginUser,
  getUserProfile,
  createTask,
  getTasks,
  updateTask,
  updateStatus,
  deleteTask,
  completeTask,
  logoutUser,
};
