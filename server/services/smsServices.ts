import { handler } from "@/utils/handler";
import { smsQueues } from "@/utils/broker";
import { SMSType } from "@/utils/types";

export const sendSmsService = async (smsData: SMSType) => {
  const { phone, text } = smsData;
  if (!phone || !text) {
    throw new Error("Invalid request");
  }
  await handler({ phone, text }, smsQueues, "sms");
};
