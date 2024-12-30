import { SMSType } from "@/utils/types";
import { smsHandler } from "@/handlers/smsHandler";

export const sendSmsService = async (smsData: SMSType) => {
  const { phone, text } = smsData;
  if (!phone || !text) {
    throw new Error("Invalid request");
  }
  await smsHandler({ phone, text });
};
