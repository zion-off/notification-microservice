import { emailProviderPorts, smsProviderPorts } from "./config";
import { ClientError, ServerError } from "./errors";
import { SMSType, EmailType } from "./types";

export class Provider {
  type: "sms" | "email";
  provider: number;
  url: string;

  private constructor(type: "sms" | "email", provider: number) {
    this.url = Provider.constructURL(type, provider);
  }

  static constructURL(type: "sms" | "email", provider: number) {
    const port =
      type === "email"
        ? emailProviderPorts[provider]
        : smsProviderPorts[provider];
    const url = `http://${
      process.env.PROVIDER_HOST
    }:${port}/api/${type}/provider${provider + 1}`;
    return url;
  }

  static createProvider(type: "sms" | "email", provider: number): Provider {
    return new Provider(type, provider);
  }

  async send(payload: SMSType | EmailType) {
    try {
      const res = await fetch(this.url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        return true;
      } else if (res.status === 500) {
        throw new ServerError("Provider failed");
      } else {
        const responseText = await res.text();
        throw new ClientError(
          `${res.status} ${res.statusText}`,
          undefined,
          responseText
        );
      }
    } catch (error) {
      throw new ServerError("Provider call failed");
    }
  }
}
