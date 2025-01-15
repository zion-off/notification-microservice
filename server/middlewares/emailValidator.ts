import { Request, Response, NextFunction, RequestHandler } from "express";

// Middleware to validate Email request body
export const validateEmailBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { subject, body, recipients } = req.body;
  if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
    res.status(400).json({ error: "Invalid or missing subject" });
    console.log("400: Email received with invalid or missing subject");
    return;
  }

  if (!body || typeof body !== "string" || body.trim().length === 0) {
    res.status(400).json({ error: "Invalid or missing body" });
    console.log("400: Email received with invalid or missing body");
    return;
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    res.status(400).json({ error: "Invalid or missing recipients list" });
    console.log("400: Email received with invalid or missing recipients list");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const email of recipients) {
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: `Invalid email in recipients: ${email}` });
      console.log(`400: Invalid email in recipients: ${email}`);
      return;
    }
  }

  next();
};
