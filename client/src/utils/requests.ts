export async function sendEmail() {
  try {
    const res = await fetch("http://localhost:3001/api/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject: "Dummy email",
        body: "Email body",
        recipients: ["recipient@gmail.com", "recipient@yahoo.com"],
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to send email");
    }
  } catch (error) {
    console.log(error);
  }
}

export async function sendSMS() {
  try {
    const res = await fetch("http://localhost:3001/api/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "phone": "+8801712345678",
        "text": "Dummy text"
    }),
    });

    if (!res.ok) {
      throw new Error("Failed to send email");
    }
  } catch (error) {
    console.log(error);
  }
}
