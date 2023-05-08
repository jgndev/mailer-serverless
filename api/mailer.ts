import {VercelRequest, VercelResponse} from "@vercel/node";
import {Message} from "./interfaces/message";
import {MessageRequest} from "./interfaces/messageRequest";
const sgMail = require('@sendgrid/mail');

const sendMail = async (message: Message) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
    console.log(request.body);
    const body = request.body as MessageRequest;

    console.log(body);

    const html = `
        <div>
            <span>From: ${body.name}</span><br />
            <span>Email: ${body.email}</span><br />
            <span>Phone: ${body.phone}</span><br />
            <span>Subject: Message from ${body.name}</span><br />
            <span>Message: ${body.message}</span><br />
        </div>
    `;

    const message: Message = {
        to: process.env.EMAIL_RECIPIENT,
        from: process.env.EMAIL_SENDER,
        subject: `New message from ${body.name}`,
        message: body.message,
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