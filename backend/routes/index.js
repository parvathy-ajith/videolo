const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Admin = require('../models/admin')
const Token = require('../models/token')
const { sendMail } = require('../config/mailConfig')
const Joi = require('joi');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/* Change layout for these routes. */
router.use((req, res, next) => {
  // changing layout for my admin panel
  req.app.set('layout', 'layouts/admin-layout');
  next();
});

//Joi validation schema for email and password
const schema = Joi.object({
  email: Joi.string().email().required().label('Email'),
  password: Joi.string()
    .pattern(new RegExp('^[a-zA-Z0-9!@#$%&*]{3,30}$'))
    .required()
    .messages({
      "string.pattern.base": `Password should be between 3 to 30 characters and contain alpha-numeric values and special characters(@ # $ % & *)`,
      "string.empty": `Password cannot be empty`,
      "any.required": `Password is required`,
    })
});

//Joi validation schema for email
const emailSchema = Joi.object({
  email: Joi.string().email().required().label('Email'),
});

//Joi validation schema for password
const passwordSchema = Joi.object({
  newPassword: Joi.string()
    .pattern(new RegExp('^[a-zA-Z0-9!@#$%&*]{3,30}$'))
    .required()
    .label('Password')
    .messages({
      "string.pattern.base": `Password should be between 3 to 30 characters and contain alpha-numeric values and special characters(@ # $ % & *)`,
      "string.empty": `Password cannot be empty`,
      "any.required": `Password is required`,
    }),
  confirmPassword: Joi.any().equal(Joi.ref('newPassword'))
    .required()
    .label('Confirm password')
    .options({ messages: { 'any.only': '{{#label}} does not match' } })
});


/* GET admin creation. */
// router.get('/create-admin', function (req, res, next) {

//   let client = {
//     email: 'parvathy.lali.ajith@gmail.com',
//     password: 'admin@123'
//   }

//   // Validate the admin data against the schema
//   const { error} = schema.validate(client);

//   if (error) {
//     res.render('login', {  errors: error.details, messages: req.flash() });
//   } else {
//  const errors={details:[]};
//     const { email, password } = client; // Extract email and password
//     //find if email is already registered
//     Admin.findOne({ email }).then(existingUser => {
//       console.log(existingUser);
//       if (existingUser) {
//         errors.details.push({ message: 'Duplicate email address : email already registred' });
//         res.render('login', {  errors: error.details, messages: req.flash() });
//       } else {
//         return bcrypt.hash(password, 10);
//       }
//     }).then(hashedPassword => {
//       client.password = hashedPassword;
//       const signupAdmin = new Admin(client);
//       // Create an Admin account in MongoDB
//       signupAdmin.save()
//         .then(() => {
//           console.log("admin saved in DB");
//           res.render('login', { errors: null, messages: req.flash()});
//         })
//         .catch((error) => {
//           console.error(error);
//         });

//     }).catch((error) => {
//       console.error(error);
//     });
//   }
// });

/* GET admin landing page. */
router.get('/', function (req, res, next) {
  res.render('landing');
});

/* GET admin login page. */
router.get('/login', function (req, res, next) {
  res.render('login', { errors: null, messages: req.flash() });
});

/* Post admin login. */
router.post('/login', function (req, res, next) {
  // Validate the request body against the schema
  const { error } = schema.validate(req.body);
  if (error) {
    res.render('login', { errors: error.details, messages: null });
  }
  else {
    const errors = { details: [] };
    // No validation errors, proceed with authentication
    let { email, password } = req.body;
    let foundAdmin; // Declare foundAdmin here

    Admin.findOne({ email }).then(user => {
      if (!user) {
        errors.details.push({ message: 'Incorrect Email Address : No such admin registered' });
        res.render('login', { errors: errors.details, messages: null });
      }
      foundAdmin = user; // Assign user to foundAdmin
      return bcrypt.compare(password, user.password)
    }).then(isPasswordValid => {
      if (!isPasswordValid) {
        errors.details.push({ message: 'Incorrect Password' });
        return res.render('login', { errors: errors.details, messages: null });
      }

      // Set user's ID and email in the session
      req.session.userId = foundAdmin._id;
      req.session.userEmail = foundAdmin.email;
      res.redirect('/admin/dashboard/movies');

    }).catch((error) => {
      console.error(error);
    });
  }
});

/* GET forgot-password page to send reset password link. */
router.get('/forgot-password', function (req, res, next) {
  res.render('forgot-password', { errors: null, message: null });
});

/* POST forgot-password page to send reset password link. */
router.post('/forgot-password', async function (req, res, next) {
  try {
    // Validate email
    const { error } = emailSchema.validate(req.body);
    if (error) {
      return res.render('forgot-password', { errors: error.details, message: null });
    }

    const { email } = req.body;
    const foundAdmin = await Admin.findOne({ email });

    if (!foundAdmin) {
      const errors = [{ message: 'Incorrect Email Address: No such admin registered' }];
      return res.render('forgot-password', { errors, message: null });
    }

    // Find or create token
    let token = await Token.findOne({ userId: foundAdmin._id });
    if (!token) {
      token = new Token({
        userId: foundAdmin._id,
        userType: 'Admin',
        token: uuidv4()
      });
      await token.save();
    }

    const url = `${process.env.BASE_URL}reset-password/${foundAdmin._id}/${encodeURIComponent(token.token)}`;
    await sendMail(foundAdmin.email, "Password Reset", url);

    return res.render('forgot-password', { errors: null, message: 'Reset password link sent to your email address.' });

  } catch (err) {
    console.error(err);
  }
});

/* GET reset-password page from link. */
router.get('/reset-password/:id/:token', function (req, res, next) {
  const { id, token } = req.params;

  // Check if the id is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).render('400', { message: "Invalid link" });
  }

  Admin.findById(id).then(foundAdmin => {
    if (!foundAdmin) {
      return res.status(400).render('400', { message: "Invalid link" });
    }
    Token.findOne({ userId: foundAdmin._id, token }).then(foundToken => {
      if (!foundToken) {
        return res.status(400).render('400', { message: "Invalid link : Link Timed-Out" });
      }
      return res.render('reset-password', { id: foundAdmin._id, token: foundToken.token, errors: null, message: null });
    })

  }).catch(err => {
    console.error(err);
  });
});

/* POST reset-password page from link. */
router.post('/reset-password/:id/:token', function (req, res, next) {
  const { id, token } = req.params;

  const { error } = passwordSchema.validate(req.body)
  if (error) {
    return res.render('reset-password', { id, token, errors: error.details, message: null });
  }

  // Check if the id is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.render('reset-password', { id, token, errors: [{ message: "Invalid ID." }], message: null });
  }

  Admin.findById(id).then(foundAdmin => {
    if (!foundAdmin) {
      return res.render('reset-password', { id, token, errors: [{ message: "Invalid ID." }], message: null });

    }

    Token.findOne({ userId: foundAdmin._id, token }).then(foundToken => {
      if (!foundToken) {
        return res.render('reset-password', { id, token, errors: [{ message: "Link timed out." }], message: null });

      }

      const { newPassword } = req.body;
      return bcrypt.hash(newPassword, 10);

    }).then(hashedPassword => {

      foundAdmin.password = hashedPassword;
      foundAdmin.save().then(() => {
        console.log('Password changed in DB');
        // return res.render('reset-password', { id: null, token: null, errors: null, message: { message: "Password reset successfully!!" } });
        req.flash('success', 'Password reset successfully! Please log in.');
        res.redirect('/login');
      })
    }).catch(err => {
      console.error(err);
    });

  }).catch(err => {
    console.error(err);
  });
});

module.exports = router;
