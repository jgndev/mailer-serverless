import {VercelRequest, VercelResponse} from "@vercel/node";
import {Message} from "./interfaces/message";
import {MessageRequest} from "./interfaces/messageRequest";
import {Credentials} from 'aws-sdk';

const AWS = require('aws-sdk');
const sgMail = require('@sendgrid/mail');

AWS.config.update({region: process.env.AWS_REGION});

const getDynamoClient = async () => {
    const credentials = await getAwsCredentials();
    return new AWS.DynamoDB.DocumentClient({
        region: process.env.AWS_REGION,
        credentials,
    });
}

const getAwsCredentials = (): Credentials => {
    return new Credentials({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
}

const sendMail = async (message: Message) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    try {
        await sgMail.send(message);

        const db = await getDynamoClient();
        const timestamp = new Date().toISOString();

        const params = {
            TableName: 'jgnovak-com-sent-messages',
            Item: {
                'PK': `MESSAGE#${timestamp}`,
                'SK': `MESSAGE#${timestamp}`,
                'message-log': `MESSAGE#${timestamp}`,
                'to': message.to,
                'from': message.from,
                'subject': message.subject,
                'html': message.html,
                'timestamp': timestamp,
                'status': 'success'
            }
        };

        await db.put(params).promise();
        console.log(`[SUCCESS]: Message logged to DynamoDB`);

    } catch (error) {
        const db = await getDynamoClient();
        const timestamp = new Date().toISOString();
        const params = {
            TableName: 'jgnovak-com-sent-messages',
            Item: {
                'PK': `MESSAGE#${timestamp}`,
                'SK': `MESSAGE#${timestamp}`,
                'message-log': `MESSAGE#${timestamp}`,
                'to': message.to,
                'from': message.from,
                'subject': message.subject,
                'html': message.html,
                'timestamp': timestamp,
                'status': 'error'
            }
        };

        await db.put(params).promise();
        console.log(`[ERROR]: Problem sending the message. ${error}`);
    }
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
    const body = request.body as MessageRequest;

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