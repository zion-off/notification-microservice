import express from "express";
import { sendEmailController } from "@/controllers/emailControllers";

const emailRouter = express.Router();

emailRouter.post("/", sendEmailController);

export default emailRouter;
