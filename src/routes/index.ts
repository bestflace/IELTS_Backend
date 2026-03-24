import { Router } from "express";
import healthRoute from "./health.route";
import authRoute from "../modules/auth/auth.route";
import userRoute from "../modules/users/user.route";

const router = Router();

router.use("/health", healthRoute);
router.use("/auth", authRoute);
router.use("/users", userRoute);

export default router;
