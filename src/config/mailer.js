const Brevo = require("@getbrevo/brevo");

const apiInstance = new Brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("Sender:", process.env.EMAIL_ID);
    await apiInstance.sendTransacEmail({
      sender: {
        name: "ECOM - Project by Akash Kumar",
        email: process.env.EMAIL_ID, // verified in Brevo
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    console.log("✅ Email sent via Brevo");
  } catch (error) {
    console.error(
      "❌ Brevo Error:",
      error.response?.body || error.message
    );
    throw error;
  }
};

module.exports = sendEmail;
