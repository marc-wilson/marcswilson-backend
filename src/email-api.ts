import { environment } from '../environment';

export class EmailApi {
    public express: any = null;
    public router: any = null;
    public nodemailer: any = null;
    public aws: any = null;

    constructor() {
        this.express = require('express');
        this.router = this.express.Router();
        this.nodemailer = require('nodemailer');
        this.aws = require('aws-sdk');
        this.router.post('/sendemail', (request, response) => {
            const body = request.body;
            const subject = body.subject;
            const from = body.from;
            const message = body.message;
            this.sendEmail(subject, from, message).then( result => {
                response.status(200).json(result);
            }, error => {
                response.status(500).json(error);
            });
        });
        module.exports = this.router;

    }
    sendEmail(subject: string, from: string, message: string): Promise<any> {
        return new Promise( (resolve, reject) => {
            this.aws.config = {
                accessKeyId: environment.AWS.AWS_ACCESS_ID,
                secretAccessKey: environment.AWS.AWS_ACCESS_KEY,
                region: 'us-east-1'
            };
            const transporter = this.nodemailer.createTransport({
                SES: new this.aws.SES({
                    apiVersion: '2012-10-17'
                })
            });
            const mailOptions = {
                from: 'mwilson@marcswilson.com',
                to: 'mwilson@marcswilson.com',
                subject: subject,
                html: message
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('error', error);
                    console.log('info', info);
                    reject(error);
                } else {
                    resolve(info);
                }
            });
        });
    }
}
new EmailApi();
