import { EmailType } from "@/utils/types";
import { emailHandler } from "@/handlers/emailHandler";

export const sendEmailService = async (emailData: EmailType) => {
  const { subject, body, recipients } = emailData;
  if (!subject || !body || !recipients) {
    throw new Error("Invalid request");
  }
  await emailHandler({ subject, body, recipients });
};
