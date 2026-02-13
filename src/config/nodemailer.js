
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
  pool: true,          // ✅ Keep connection alive
  maxConnections: 5,   // ✅ Reuse connections
  maxMessages: 100,
});

// Verify on startup
transporter.verify((err) => {
  if (err) {
    console.log("❌ Mail Config Error:", err);
  } else {
    console.log("✅ Mail Server Ready");
  }
});

const sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: `"URL SHORTNER" <${process.env.EMAIL}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
