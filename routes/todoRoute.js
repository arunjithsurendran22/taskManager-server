import express from "express";
import taskRoute from "./taskRoutes.js";
const router = express.Router();

const defaultRoutes = [
  {
    path: "/todo",
    route: taskRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
