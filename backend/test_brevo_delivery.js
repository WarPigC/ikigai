import dotenv from "dotenv";
dotenv.config();

import { sendMail } from "./mailer.js";

async function testMail() {
  try {
    console.log("Attempting to send email to sh.aniruddha39@gmail.com...");
    const result = await sendMail({
      to: "sh.aniruddha39@gmail.com",
      subject: "Test Brevo Delivery",
      html: "<p>If you see this, Brevo is working.</p>",
    });
    console.log("Success! Brevo response:", result);
  } catch (err) {
    console.error("Failed to send mail:", err.message);
    if (err.response && err.response.text) {
      console.error("Brevo Error Details:", err.response.text);
    }
  }
}

testMail();
