const nodemailer = require('nodemailer')
const {SMTP_AUTH_MAIL, SMTP_AUTH_PASS, SMTP_SERVICE} = require('./../config')

const mailer = {

    sendEmail : (to, subject, body)=>{

        var transporter = nodemailer.createTransport({
            service: SMTP_SERVICE,
            auth : {
                user : SMTP_AUTH_MAIL,
                pass : SMTP_AUTH_PASS
            }
        })

        var mailOptions = {
            from : SMTP_AUTH_MAIL,
            subject : subject,
            text : body,
            bcc : to
        }

        console.log(SMTP_SERVICE, SMTP_AUTH_MAIL, SMTP_AUTH_PASS)
        console.log(mailOptions)
        transporter.sendMail(mailOptions, function(error, info){
            console.log("Mailing now...",error,info);
            if (error) {
                console.log("seinfing mail error",error);
            }
            if (info != undefined) {
                console.log('Message sent: ' + info.response);
            } else {
                console.log("error sending mail");
            }
        })
    }
}

module.exports = mailer