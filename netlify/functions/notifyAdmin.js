// netlify/functions/notifyAdmin.js
const nodemailer = require('nodemailer');

exports.handler = async (event) => {
    // Sirf POST request allow karenge (Security)
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);

        // ==========================================
        // 1. TELEGRAM NOTIFICATION LOGIC
        // ==========================================
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            const message = `🚀 *New Architecture Request!*\n\n*Name:* ${data.name}\n*Email:* ${data.email}\n*Type:* ${data.projectType}\n*Budget:* ${data.budget}\n*Timeline:* ${data.timeline}\n*WhatsApp:* ${data.whatsapp}\n\n*Features:* ${data.features}`;
            
            const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

            // Telegram API ko data bhejna
            await fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });
        }

        // ==========================================
        // 2. AUTO-EMAIL LOGIC (CLIENT KO)
        // ==========================================
        const GMAIL_USER = process.env.GMAIL_USER; // Aapka Gmail address
        const GMAIL_PASS = process.env.GMAIL_PASS; // Aapka Gmail App Password

        if (GMAIL_USER && GMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: GMAIL_USER,
                    pass: GMAIL_PASS
                }
            });

            // Client ko jo email jayega uska design
            const mailOptions = {
                from: `"CoderKaushal" <${GMAIL_USER}>`,
                to: data.email, // Client ka email
                subject: "Architecture Request Received | CoderKaushal",
                text: `Hello ${data.name},\n\nWe have successfully received your architecture request for a ${data.projectType}.\n\nYour stated budget is ${data.budget} with a timeline of ${data.timeline}.\n\nOur system will evaluate your requirements and I will personally reach out to you shortly.\n\nBest Regards,\nAshutosh Kaushal\nLead Architect`
            };

            await transporter.sendMail(mailOptions);
        }

        // Sab successful raha toh OK bhej do
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Notification and Email sent successfully!" })
        };

    } catch (error) {
        console.error("Backend Error:", error);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};