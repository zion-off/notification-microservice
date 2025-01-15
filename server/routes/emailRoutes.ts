import express from "express";
import { validateEmailBody } from "@/middlewares";
import { sendEmailController } from "@/controllers/emailControllers";

const emailRouter = express.Router();

emailRouter.post("/", validateEmailBody, sendEmailController);

export default emailRouter;
