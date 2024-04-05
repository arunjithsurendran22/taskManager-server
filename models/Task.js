import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
  },
  todo: [
    {
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      status: {
        type: String,
      },
    },
  ],
});

const TaskModal = mongoose.model("Task", taskSchema);

export default TaskModal;
