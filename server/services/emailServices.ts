import { handler } from "@/utils/handler";
import { emailQueues } from "@/utils/broker";
import { EmailType } from "@/utils/types";

export const sendEmailService = async (emailData: EmailType) => {
  const { subject, body, recipients } = emailData;
  if (!subject || !body || !recipients) {
    throw new Error("Invalid request");
  }
  await handler({ subject, body, recipients }, emailQueues, "email");
};
