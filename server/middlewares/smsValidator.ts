import { Request, Response, NextFunction, RequestHandler } from "express";

const bangladeshiPhoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;

// Middleware to validate SMS request body
export const validateSmsBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { phone, text } = req.body;
  if (!phone || !bangladeshiPhoneRegex.test(phone)) {
    res.status(400).json({ error: "Invalid or missing phone number" });
    console.log("Invalid or missing phone number");
    return;
  }

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "Invalid or missing text" });
    console.log("Invalid or missing text");
    return;
  }

  next();
};
