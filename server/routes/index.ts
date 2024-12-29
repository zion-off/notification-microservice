import { Router } from "express";
import emailRouter from "./emailRoutes";
import smsRouter from "./smsRoutes";

const router = Router();

router.use("/email", emailRouter);
router.use("/sms", smsRouter);

export default router;
