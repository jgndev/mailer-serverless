import {VercelRequest, VercelResponse} from "@vercel/node";
import {Message} from "./interfaces/message";
const sgMail = require('@sendgrid/mail');

const validEmail: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const sendMail = (message: Message) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    sgMail
        .send(message)
        .then(() => {
            console.log("Message sent")
        })
        .catch((error) => {
            console.log(error);
        })
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
    console.log("In the function!");
    const body = request.body;

    // Don't send an email with an invalid email address.
    if (!validEmail.test(body.from)) {
        return response.status(400).send('Invalid email address');
    }

    const message: Message = {
        to: process.env.EMAIL_RECIPIENT,
        from: body.from,
        phone: body.phone !== null ? body.phone : null,
        subject: body.subject,
        body: body.body,
    };

    try {
        sendMail(message);
        return response.status(200).send("Email sent!");
    } catch (error) {
        console.error(error);
        return response.status(500).send('Error sending email');
    }
}

module.exports = allowCors(handler);