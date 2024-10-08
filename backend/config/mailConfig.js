const nodemailer = require('nodemailer');

module.exports.sendMail = async (email, subject, text)=>{
    try{
        const transporter = nodemailer.createTransport({
			host: process.env.HOST,
			port: Number(process.env.EMAIL_PORT),
			auth: {
				user: process.env.USER,
				pass: process.env.PASS,
			}
		});

		await transporter.sendMail({
			from: process.env.USER,
			to: email,
			subject: subject,
			text: text,
		});
		console.log("email sent successfully");
    }
    catch(error){
        console.log("email not sent!");
		console.log(error);
		return error;
    }
}

