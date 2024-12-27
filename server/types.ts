export type EmailHandlerProps = {
  subject: string;
  body: string;
  recipients: string[];
};

export type SMSProps = {
  phone: string;
  text: string;
};
