import express from "express";
import { sendSmsController } from "@/controllers/smsControllers";

const smsRouter = express.Router();

smsRouter.post("/", sendSmsController);

export default smsRouter;
