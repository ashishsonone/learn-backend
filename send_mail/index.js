var nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport('smtps://ashish@trumplab.com:trumplab%400@smtp.gmail.com');

// setup e-mail data with unicode symbols
var mailOptions = {
    from: 'ashish@trumplab.com', // sender address
    to: 'ashish@trumplab.com', // list of receivers
    subject: 'Hello', // Subject line
    text: 'Hello world', // plaintext body
    html: 'Hello world' // html body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log('Message sent: ' + info.response);
});
