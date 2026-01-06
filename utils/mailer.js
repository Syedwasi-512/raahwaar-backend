const nodemailer = require('nodemailer');
const {EMAIL_USER , EMAIL_PASS} = process.env;

const sendEmail = async (to , subject , html)=>{
    
const transporter = nodemailer.createTransport({
    service: 'gmail' , 

    auth:{
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    }
});



    await transporter.sendMail({
        from: `"VilayatBazaar" <${process.env.EMAIL_USER}>`,
        to,
        subject ,
        html
    });
};

module.exports = sendEmail;