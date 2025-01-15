import express from "express";
import { validateSmsBody } from "@/middlewares";
import { sendSmsController } from "@/controllers/smsControllers";

const smsRouter = express.Router();

smsRouter.use(validateSmsBody);

smsRouter.post("/", sendSmsController);

export default smsRouter;
