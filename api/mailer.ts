import {VercelRequest, VercelResponse} from "@vercel/node";
import {Message} from "./interfaces/message";
const sgMail = require('@sendgrid/mail');

const validEmail: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const sendMail = async (message: Message) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // let status = '';

    await sgMail
        .send(message)
        .then(() => {
            console.log(`Message sent to ${message.to}`);
        })
        .catch((error) => {
            console.log('Error sending email');
            console.log(error);
            if (error.response) {
                console.error(error.response.body);
            }
        });
}

const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }
    return await fn(req, res)
}

const handler = async (request: VercelRequest, response: VercelResponse) => {
    const body = request.body;

    // Don't send an email with an invalid email address.
    if (!validEmail.test(body.from)) {
        return response.status(400).send('Invalid email address');
    }

    const html = `
        <div>
            <span>From: ${body.name}</span><br />
            <span>Email: ${body.email}</span>
            <span>Phone: ${body.phone}</span>
            <span>Subject: ${body.subject}</span><br />
            <span>Message: ${body.message}</span><br />
        </div>
    `;

    const text = `
        From: ${body.from}
        Name: ${body.name}
        Email: ${body.email}
        Phone: ${body.phone}
        Subject: New message from ${body.name}
        Message: ${body.message}
    `;

    const message: Message = {
        to: process.env.EMAIL_RECIPIENT,
        from: process.env.EMAIL_SENDER,
        name: body.name,
        phone: body.phone !== null ? body.phone : null,
        subject: `New message from ${body.name}`,
        message: body.message,
        text: text,
        html: html,
    };

    try {
        await sendMail(message);
        return response.status(200).send("Email sent!");
    } catch (error) {
        console.error(error);
        return response.status(500).send('Error sending email');
    }
}

module.exports = allowCors(handler);