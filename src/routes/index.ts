import { Router } from "express";
import healthRoute from "./health.route";
import authRoute from "../modules/auth/auth.route";
import userRoute from "../modules/users/user.route";
import tagRoute from "../modules/tags/tag.route";
import systemConfigRoute from "../modules/system-configs/system-config.route";
import speakingRoute from "../modules/speaking/speaking.route";
import listeningRoute from "../modules/listening/listening.route";
import readingRoute from "../modules/reading/reading.route";
import writingRoute from "../modules/writing/writing.route";
import testRoute from "../modules/test/test.route";
const router = Router();

router.use("/health", healthRoute);
router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use(tagRoute);
router.use(systemConfigRoute);
router.use(speakingRoute);
router.use(listeningRoute);
router.use(readingRoute);
router.use(writingRoute);
router.use(testRoute);

export default router;
