const https = require('https');
const nodemailer = require('nodemailer');

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const data = JSON.parse(event.body);
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // 1. ROUTING LOGIC: Telegram Admin ko kab jayega? (Jab Admin khud action NAHI le raha ho)
    const sendTelegram = !['WORKSPACE_APPROVED', 'WORKSPACE_UPDATED'].includes(data.category);
    
    // Email hamesha User/Client ko hi bhejenge (Auto-reply ya Update)
    const targetEmail = data.email;

    // 2. CONTENT VARIABLES
    let tgMessage = `🚀 *Alert: ${data.category}*\n━━━━━━━━━━━━━━━━━━━━\n`;
    let emailSubject = 'CoderKaushal Notification';
    let emailHtml = '';

    // 3. BUILD CONTENT BASED ON CATEGORY
    if (data.category === 'LEAD') {
        tgMessage += `👤 Name: ${data.name}\n📧 Email: ${data.email}\n📱 WA: ${data.whatsapp}\n🏗️ Type: ${data.projectType}\n💰 Budget: ${data.budget}\n⏳ Timeline: ${data.timeline}`;
        
        emailSubject = `Project Architecture Request Secured | CoderKaushal`;
        emailHtml = `<h3>Hello ${data.name},</h3>
                     <p>Your architecture request has been securely logged in our system.</p>
                     <p><b>Your Submission Details:</b></p>
                     <ul>
                        <li><b>Project Type:</b> ${data.projectType}</li>
                        <li><b>Budget:</b> ${data.budget}</li>
                        <li><b>Timeline:</b> ${data.timeline}</li>
                        <li><b>Features Requested:</b> ${data.features}</li>
                     </ul>
                     <p>I will review this and reach out to you on WhatsApp (${data.whatsapp}) shortly.</p>
                     <p>Best Regards,<br>Ashutosh Kaushal</p>`;
                     
    } else if (data.category === 'CONTACT') {
        tgMessage += `👤 Name: ${data.name}\n📧 Email: ${data.email}\n🌐 Platform: ${data.platform} (${data.platform_id})\n💬 Msg: ${data.message}`;
        
        emailSubject = `Direct Message Received | CoderKaushal`;
        emailHtml = `<h3>Hi ${data.name},</h3>
                     <p>I have securely received your direct message from my console.</p>
                     <p><b>Your Message:</b><br><i>"${data.message}"</i></p>
                     <p>I will get back to you as soon as possible via your provided platform.</p>`;
                     
    } else if (data.category === 'REPORT') {
        tgMessage += `📧 User: ${data.email}\n🚨 Type: ${data.type}\n📝 Desc: ${data.description}`;
        
        emailSubject = `Issue Report Filed | CoderKaushal`;
        emailHtml = `<h3>Issue Received</h3>
                     <p>We've received your report.</p>
                     <p><b>Issue Type:</b> ${data.type}</p>
                     <p><b>Description:</b> ${data.description}</p>
                     <p>I will investigate this immediately and fix it.</p>`;
                     
    } else if (data.category === 'WORKSPACE_APPROVED') {
        // No Telegram for Admin here
        emailSubject = `Your Project Portal is Ready | CoderKaushal`;
        emailHtml = `<h3>Welcome aboard, ${data.name}!</h3>
                     <p>Your architecture request is approved. Access your live portal here:</p>
                     <p><b>Portal Link:</b> <a href="https://coderkaushal.netlify.app/portal" target="_blank">https://coderkaushal.netlify.app/portal</a><br>
                     <b>Workspace ID:</b> ${data.portalId}<br>
                     <b>Secure PIN:</b> ${data.pin}</p>
                     <p>Please log in to submit your exact blueprint and milestones.</p>`;
                     
    } else if (data.category === 'WORKSPACE_UPDATED') {
        // No Telegram for Admin here
        emailSubject = `Project Status Update | CoderKaushal`;
        emailHtml = `<h3>Hi ${data.name},</h3>
                     <p>Your project workspace has been updated.</p>
                     <p><b>Current Status:</b> <span style="color: #8b5cf6; font-weight: bold;">${data.status}</span></p>
                     <p>Log into your secure portal to see live previews or updates.</p>`;
                     
    } else if (data.category === 'BLUEPRINT_SUBMITTED') {
        tgMessage += `✅ *BLUEPRINT LOCKED*\nWorkspace: ${data.portalId}\nClient has submitted architectural requirements.`;
        
        emailSubject = `Blueprint Secured & Scope Locked | Ashutosh Kaushal`;
        emailHtml = `<h3>Technical Architecture Finalized</h3>
                     <p>The requirements for Workspace <b>${data.portalId}</b> have been successfully encrypted and locked.</p>
                     <p>Our team is now initiating the development phase based on the provided blueprint. No further changes can be made.</p>
                     <p>Best Regards,<br>Ashutosh Kaushal</p>`;
    }

    // 4. SEND NOTIFICATIONS
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
    });

    try {
        // A. Send TG Alert to Admin (only if sendTelegram is TRUE)
        if (sendTelegram && BOT_TOKEN && CHAT_ID) {
            const tgPayload = JSON.stringify({ chat_id: CHAT_ID, text: tgMessage, parse_mode: 'Markdown' });
            const req = https.request({ hostname: 'api.telegram.org', path: `/bot${BOT_TOKEN}/sendMessage`, method: 'POST', headers: {'Content-Type': 'application/json'} }, (res) => { res.on('data', ()=>{}); });
            req.write(tgPayload); req.end();
        }

        // B. Send Email to Client/User (only if email is provided and HTML is built)
        if (targetEmail && emailHtml) {
            await transporter.sendMail({ 
                from: `"Ashutosh Kaushal" <${process.env.GMAIL_USER}>`, 
                to: targetEmail, 
                subject: emailSubject, 
                html: emailHtml 
            });
        }
        
        return { statusCode: 200, body: JSON.stringify({ status: 'Success' }) };
    } catch (err) {
        console.error("Notify Error: ", err);
        return { statusCode: 500, body: JSON.stringify({ status: 'Error', error: err.message }) };
    }
};