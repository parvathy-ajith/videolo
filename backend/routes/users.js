const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const Joi = require('joi');
const bcrypt = require('bcrypt');
const Subscription = require('../models/subscription');
const Movie = require('../models/movie');
const Admin = require('../models/admin');
const User = require('../models/user')
const moveFileWithUniqueName = require('../util/moveFileWithUniqueName');

/* Change layout for these routes. */
router.use((req, res, next) => {
  // changing layout for my admin panel
  req.app.set('layout', 'layouts/dashboard-layout');
  next();
});

/* GET Movies Listing page. */
router.get('/dashboard/movies', async function (req, res, next) {
  try {
    //page, limit, searchTerm from req.query
    const { page = 1, limit = 3, searchTerm = '' } = req.query;

    const searchQuery = searchTerm ? { title: new RegExp(searchTerm, 'i') } : {};
    const movies = await Movie.find(searchQuery)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const count = await Movie.countDocuments(searchQuery);
    const totalPages = Math.ceil(count / limit)

    res.render('admin-movie-listing', { tab_name: 'movies', movies, page, limit, searchTerm, totalPages, messages: req.flash() });
  }
  catch (errors) {
    console.log(errors)
  }
});

/* GET Movie Viewing page. */
router.get('/dashboard/movie/view/:id', function (req, res, next) {
  const id = req.params.id;
  Movie.findById(id).then(movie => {
    res.render('view-movie', { tab_name: 'movies', movie });
  }).catch(error => {
    console.log(error)
  })
});

/* GET Movie Deleting. */
router.get('/dashboard/movie/delete/:id', function (req, res, next) {
  const id = req.params.id;
  let imageFilePath;
  let videoFilePath;
  Movie.findById(id).then(movie => {
    if (movie) {
      // Paths to the files to be deleted
      imageFilePath = path.join(__dirname, '..', 'public', movie.image);
      videoFilePath = path.join(__dirname, '..', 'public', movie.video);

      // Delete the movie record from the database
      return Movie.deleteOne({ _id: id }).then(() => {
        console.log(`Movie deleted from DB: ${movie.title}`);

        // Delete the image and video files after the movie is deleted
        return Promise.all([
          fs.unlink(imageFilePath),
          fs.unlink(videoFilePath)
        ]);
      }).then(() => {
        console.log(`Deleted image file: ${imageFilePath}`);
        console.log(`Deleted video file: ${videoFilePath}`);

        req.flash('success', 'Movie and associated files deleted!');
        res.redirect('/admin/dashboard/movies');
      });
    } else {
      console.error('Movie not found');
      res.redirect('/admin/dashboard/movies');
    }
  }).catch(error => {
    console.error("Error:", error);
    res.redirect('/admin/dashboard/movies');
  });
});

/* GET Add/Edit Movie page. */
router.get('/dashboard/movies/:action', function (req, res, next) {
  const action = req.params.action;
  if (action === 'add') {
    res.render('add-edit-movie', { tab_name: 'movies', heading: 'Add', movie: null, id: null });
  } else if (action === 'edit') {
    const id = req.query.id;
    console.log(id)
    Movie.findById(id).then(movie => {
      console.log(movie)
      res.render('add-edit-movie', { tab_name: 'movies', heading: 'Edit', movie, id: id });
    }).catch(error => {
      console.log(error)
    })
  }
});

/* POST Add Movie page. */
router.post('/dashboard/movies/save', async function (req, res, next) {
  //Form data
  var data = req.body;
  //a variable representation of the files
  var imageFile = req.files.image;
  var videoFile = req.files.video;

  try {
    let imageFileName = await moveFileWithUniqueName(imageFile, 'public/images/movies');
    let videoFileName = await moveFileWithUniqueName(videoFile, 'public/videos');

    let newMovie = new Movie({
      title: data.title,
      description: data.description,
      image: "/images/movies/" + imageFileName,
      video: "/videos/" + videoFileName
    })

    await newMovie.save();
    console.log("Movie saved in DB");
    res.redirect('/admin/dashboard/movies')
  } catch (error) {
    console.error("Error saving movie:", error);
  }
});

/* POST Update Movie page. */
router.post('/dashboard/movies/update', async function (req, res, next) {
  //Form data
  var { id, title, description } = req.body;
  //a variable representation of the files
  var imageFile = req.files?.image;
  var videoFile = req.files?.video;

  try {
    const foundMovie = await Movie.findById(id);

    //assign updated values
    foundMovie.title = title;
    foundMovie.description = description;
    if (imageFile) {
      let imageFileName = await moveFileWithUniqueName(imageFile, 'public/images/movies');
      foundMovie.image = "/images/movies/" + imageFileName;
    }
    if (videoFile) {
      let videoFileName = await moveFileWithUniqueName(videoFile, 'public/videos');
      foundMovie.video = "/videos/" + videoFileName;
    }

    // Save the updated movie to the database
    await foundMovie.save();

    console.log("Movie updated in DB");
    res.redirect('/admin/dashboard/movies');
  }
  catch (error) {
    console.log(error);
  }
});

/* GET User Listing page. */
router.get('/dashboard/users', async function (req, res, next) {
  try {
    //page, limit, searchTerm from req.query
    const { page = 1, limit = 3, searchTerm = '' } = req.query;

    const searchQuery = searchTerm ? { name: new RegExp(searchTerm, 'i') } : {};
    const users = await User.find(searchQuery)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const count = await User.countDocuments(searchQuery);
    const totalPages = Math.ceil(count / limit)

    res.render('admin-user-listing', { tab_name: 'users', users, page, limit, searchTerm, totalPages });
  }
  catch (errors) {
    console.log(errors)
  }
});

/* POST User Plans page. */
router.post('/dashboard/update-user-status', function (req, res, next) {
  var { id, status } = req.body;
  User.findById(id).then(foundUser => {
    foundUser.isEnabled = status;
    foundUser.save().then(() => {
      console.log("User status updated in DB");
    }).catch((error) => {
      console.error(error);
    });
  }).catch((error) => {
    console.error(error);
  });
});

/* GET User Veiwing page. */
router.get('/dashboard/user-view', function (req, res, next) {
  const id = req.query.id;
  User.findById(id)
    .populate({
      path: 'subscribed_plans.subscription_plan',
      select: 'name'
    })
    .populate({
      path: 'movies_viewed.movie',
      select: 'title' // specify the fields you need
    })
    .exec()
    .then(foundUser => {
      console.log(foundUser?.subscribed_plans?.[0]?.subscription_plan?.name);
      if (foundUser)
        res.render('view-user', { tab_name: 'users', user: foundUser })
      else
        console.log('No such user Found')
    }).catch((error) => {
      console.error(error);
    });

});

/* GET Subscription Plans page. */
router.get('/dashboard/subscription-plans', function (req, res, next) {
  Subscription.find().then(subscriptions => {
    res.render('admin-subscription-plans', { tab_name: 'subscriptions', subscriptions: subscriptions });
  })

});

/* POST Subscription Plans change status. */
router.post('/dashboard/update-subscription-plan-status', function (req, res, next) {
  var { id, status } = req.body;
  Subscription.findById(id).then(foundPlan => {
    foundPlan.status = status;
    foundPlan.save().then(() => {
      console.log("plan status updated in DB");
    }).catch((error) => {
      console.error(error);
    });
  }).catch((error) => {
    console.error(error);
  });
});

/* GET Subscription Plans Add page. */
router.get('/dashboard/subscription/add', function (req, res, next) {
  res.render('add-subscription-plan', { tab_name: 'subscriptions', errors: null });
});

//Joi validation schema for add subscription
const addSubscriptionSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required().messages(),
  amount: Joi.number().min(0).required().messages(),
  duration: Joi.number().min(1).required().messages()
});

/* POST Subscription Plans Add page. */
router.post('/dashboard/subscription/add', function (req, res, next) {
  // Validate the request body against the joi schema
  const { error, value } = addSubscriptionSchema.validate(req.body);
  if (error) {
    res.render('add-subscription-plan', { tab_name: 'subscriptions', errors: error.details });
  }
  else {
    const errors = { details: [] };
    const { name, description, amount, duration } = req.body;

    Subscription.findOne({ name }).then(existingPlan => {
      if (existingPlan) {
        errors.details.push({ message: 'Plan name already exists!' });
        res.render('add-subscription-plan', { tab_name: 'subscriptions', errors: error.details });
      }
      else {
        const newPlan = new Subscription({ name, description, amount, duration });
        newPlan.save().then(() => {
          console.log("New plan saved in DB");
          res.redirect('admin/dashboard/subscription-plans');
        })
          .catch((error) => {
            console.error(error);
          });
      }
    }).catch((error) => {
      console.error(error);
    });
  }
});

/* GET Revenue Report page. */
router.get('/dashboard/report/revenue', function (req, res, next) {
  const year = new Date().getFullYear();
  const { searchYear = year } = req.query;
  User.aggregate([
    { 
      $unwind: "$subscribed_plans" 
    },
    {
      $match: {
        "subscribed_plans.activation_date": {
          $gte: new Date(`${searchYear}-01-01T00:00:00.000Z`),
          $lt: new Date(`${Number(searchYear) + 1}-01-01T00:00:00.000Z`)
        }
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "subscribed_plans.subscription_plan",
        foreignField: "_id",
        as: "subscription_details"
      }
    },
    {
      $group: {
        _id: {
          $month: "$subscribed_plans.activation_date"
        },
        revenue: {
          $sum: {
            $arrayElemAt: ["$subscription_details.amount", 0]
          }
        }
      }
    }
  ]).then(result => {
    console.log(result);
    res.render('report-revenue', { tab_name: 'reports', year, searchYear, result });

  })
    .catch(err => {
      console.error(err);
    });

});

/* GET Subscribers Report page. */
router.get('/dashboard/report/subscibers', function (req, res, next) {
  const year = new Date().getFullYear();
  const { searchYear = year } = req.query;

  User.aggregate([
    { $unwind: "$subscribed_plans" },
    {
      $match: {
        "subscribed_plans.activation_date": {
          $gte: new Date(`${searchYear}-01-01T00:00:00.000Z`),
          $lt: new Date(`${Number(searchYear) + 1}-01-01T00:00:00.000Z`)
        }
      }
    },
    {
      $group: {
        _id: {
          $month: "$subscribed_plans.activation_date"
        },
        numberOfSubscriptions: {
          $sum: 1
        }
      }
    }
  ]).then(result => {
    console.log(result);
    res.render('report-subscibers', { tab_name: 'reports', year, result, searchYear });
  })
    .catch(err => {
      console.error(err);
    });

});

/* GET Movie Views Report page. */
router.get('/dashboard/report/movie-views', function (req, res, next) {
  const { page = 1, limit = 6 } = req.query;
  Movie.countDocuments().then(totalMovies => {
    Movie.find()
      .select('title view_count')
      .sort({ view_count: 'desc' })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .then(movies => {
        console.log(movies);
        const totalPages = Math.ceil(totalMovies / Number(limit))
        res.render('report-movie-views', { tab_name: 'reports', movies, totalPages, page, limit });
      })
      .catch((error) => {
        console.error(error);
      });
  })
    .catch((error) => {
      console.error(error);
    });

});

/* GET Movie Rating Report page. */
router.get('/dashboard/report/movie-rating', function (req, res, next) {
  const { page = 1, limit = 6 } = req.query;
  Movie.countDocuments().then(totalMovies => {
    Movie.find()
      .select('title averageRating')
      .sort({ averageRating: 'desc' })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .then(movies => {
        console.log(movies);
        const totalPages = Math.ceil(totalMovies / Number(limit))
        res.render('report-movie-rating', { tab_name: 'reports', movies, totalPages, page, limit });
      })
      .catch((error) => {
        console.error(error);
      });
  })
    .catch((error) => {
      console.error(error);
    });
});

/* GET logout */
router.get('/dashboard/logout', function (req, res, next) {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      res.send('Error')
    } else {
      res.redirect('/login')
    }
  });
});

/* GET reset-password page. */
router.get('/dashboard/reset-password', function (req, res, next) {
  if (req.session.userId) {
    const successMessage = req.flash('success');
    res.render('reset-password', { tab_name: 'Reset Password', id: req.session.userId, token: '', errors: null, message: successMessage.length > 0 ? successMessage[0] : null });
  } else {
    console.log("No req.session.userId")
    res.redirect('/login');
  }

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

/* POST reset-password page. */
router.post('/dashboard/reset-password', function (req, res, next) {
  if (req.session.userId) {
    const id = req.session.userId;
    const { error } = passwordSchema.validate(req.body)
    if (error) {
      return res.render('reset-password', { tab_name: 'Reset Password', id, token: '', errors: error.details, message: null });
    }

    Admin.findById(id).then(foundAdmin => {
      if (!foundAdmin) {
        return res.render('reset-password', { tab_name: 'Reset Password', id, token, errors: [{ message: "Invalid ID." }], message: null });
      }
      const { newPassword } = req.body;
      bcrypt.hash(newPassword, 10).then(hashedPassword => {
        foundAdmin.password = hashedPassword;
        foundAdmin.save().then(() => {
          console.log('Password changed in DB');
          req.flash('success', 'Password reset successfully!');
          res.redirect('/admin/dashboard/reset-password');
        })
      }).catch(err => {
        console.error(err);
      });

    }).catch(err => {
      console.error(err);
    });

  } else {
    console.log("No req.session.userId")
    res.redirect('/login');
  }

});

module.exports = router;
