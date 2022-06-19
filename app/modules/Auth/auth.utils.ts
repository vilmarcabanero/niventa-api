import * as nodemailer from 'nodemailer';

export function sendEmail(options: any) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: 'apikey', // generated ethereal user
      pass: process.env.SENDGRID_API_KEY, // generated ethereal password
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.text,
  };

  transporter.sendMail(mailOptions, (err: any, info: any) => {
    if (err) {
      console.log('Error: ', err.message);
    } else {
      console.log('Email sent!', info);
    }
  });
}

export const CLIENT_BASE_URL = 'https://entropiya-ph.netlify.app';
// export const CLIENT_BASE_URL = 'https://entropiya.ph';

// export const CLIENT_BASE_URL = 'app://entropiya';
