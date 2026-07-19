import nodemailer from 'nodemailer';

let transporterPromise = (async () => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
        console.log('✉️ Configuring real SMTP transporter for email service.');
        return nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort),
            secure: smtpPort === '465', // true for 465, false for other ports
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });
    } else {
        console.log('✉️ No SMTP credentials found. Creating Ethereal email test account for development.');
        const testAccount = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    }
})();

export const sendVerificationEmail = async (toEmail, verificationToken) => {
    try {
        const transporter = await transporterPromise;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

        const mailOptions = {
            from: process.env.SMTP_FROM || '"AlumniConnect" <no-reply@alumniconnect.com>',
            to: toEmail,
            subject: 'Verify your AlumniConnect Email',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #4f46e5; text-align: center;">Welcome to AlumniConnect!</h2>
                    <p>Thank you for registering. Please verify your email address to activate your student account.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
                    </div>
                    <p style="font-size: 12px; color: #64748b;">If the button above does not work, copy and paste this URL into your browser:</p>
                    <p style="font-size: 12px; color: #64748b; word-break: break-all;">${verificationLink}</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #94a3b8; text-align: center;">If you did not sign up for this account, please ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        // Log preview URL in development (Ethereal)
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`\n==================================================`);
            console.log(`✉️ Verification email sent to: ${toEmail}`);
            console.log(`📧 Ethereal Preview URL: ${previewUrl}`);
            console.log(`==================================================\n`);
        } else {
            console.log(`✉️ Verification email sent successfully to ${toEmail}`);
        }
        
        return { success: true, previewUrl };
    } catch (err) {
        console.error('✉️ Failed to send verification email:', err);
        throw err;
    }
};
