const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { sendMail } = require('../config/mailConfig')
const { userValidationSchema, loginValidationSchema } = require('../util/joiValidation');
const User = require('../models/user');
const Movie = require('../models/movie');
const Subscription = require('../models/subscription');
const Token = require('../models/token')
const authenticateToken = require('../middleware/authenticateToken');
const { log } = require('console');

//400 Bad Request : The server cannot or will not process the request due to something that is perceived to be a client error.
//401 Unauthorized:Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated". That is, the client must authenticate itself to get the requested response.
//409 Conflict : This response is sent when a request conflicts with the current state of the server.
//200 OK:The request succeeded. The result meaning of "success" depends on the HTTP method.
//201 Created: The request succeeded, and a new resource was created as a result. This is typically the response sent after POST requests, or some PUT requests.
//500 Internal Server Error : The server has encountered a situation it does not know how to handle.

/* POST register user. */
//req.body: {name, email, password}
router.post('/api/register', async function (req, res, next) {
    try {
        const { error } = userValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { name, email, password } = req.body

        const user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({ message: "User with given email already Exist!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await new User({ name, email, password: hashedPassword }).save();
        res.status(201).json({ message: "User created successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* POST login user. */
//req.body: {email, password}
//res: success=token
router.post('/api/login', async function (req, res, next) {
    try {
        const { error } = loginValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }
        if (!user.isEnabled) {
            return res.status(401).json({ message: "User is Disabled. Please contact Videolo." });
        }
        //Valid user with correct password, generate token
        const token = user.generateAuthToken();
        res.status(200).json({ token, username: user.name, message: "logged in successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* GET Authenticate. */
//req.header token
//res:authenticate
router.get('/api/authenticate', authenticateToken, (req, res, next) => {

    const userId = req.userId;

    User.findById(userId).then((user) => {
        res.status(200).json({ message: "Valid User", isValid: true });
    }).
        catch(errors => {
            console.log(errors)
            res.status(500).json({ message: "Internal Server Error" })
        });
});

/* GET Movie List. */
//req.query: {seearchTerm, page, limit}
//res: [{movies}], totalCount
router.get('/api/movies', authenticateToken, async function (req, res, next) {
    try {
        //page, limit, searchTerm from req.query
        const { page = 1, limit = 5, searchTerm = '' } = req.query;

        const searchQuery = searchTerm ? { title: new RegExp(searchTerm, 'i') } : {};
        const movies = await Movie.find(searchQuery)
            .select('-__v -rating')
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean()
        const count = await Movie.countDocuments(searchQuery);
        const totalPages = Math.ceil(count / limit)

        res.status(200).json({ movies, totalPages });

    }
    catch (errors) {
        console.log(errors)
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* GET Movie by id for subscribed user. */
//req.param: {movieId}
//res: movie if subscribed
router.get('/api/subscribed/movie/:id', authenticateToken, function (req, res, next) {
    const userId = req.userId;

    User.findById(userId).then(foundUser => {
        console.log(foundUser)
        console.log(foundUser.isSubscribed())
        if (foundUser.isSubscribed()) {
            console.log("Subscribed");

            const movieId = req.params.id;
            Movie.findById(movieId)
                .select('-__v -rating')
                .then(foundMovie => {
                    if (!foundMovie) {
                        return res.status(404).json({ message: "Movie not found" });
                    }
                    res.status(200).json({ movie: foundMovie });
                })
        }
        else {
            console.log("NOT Subscribed");
            return res.status(403).json({ message: 'Access denied - Subscription required', redirect: true });
        }
    })

});

/* GET All subscription plans. */
//res: subscriptions
router.get('/api/subsciptionPlans', authenticateToken, async function (req, res, next) {
    try {
        const userId = req.userId;
        const sub_plans = await Subscription.find({ status: true });
        if (!sub_plans) {
            return res.status(404).json({ message: 'Subscription Plan not found' });
        }

        const foundUser = await User.findById(userId);
        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' });
        }


        res.status(200).json({ message: 'Subscription Plans List', plans: sub_plans });
    }
    catch (errors) {
        console.log(errors)
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* GET Current subscription plan and plan history. */
//res: all subscriptions and current
router.get('/api/subsciptionPlans/current', authenticateToken, async function (req, res, next) {
    try {
        const userId = req.userId;

        const foundUser = await User.findById(userId)
            .populate('subscribed_plans.subscription_plan');

        const user_subscribed_plans = foundUser.subscribed_plans;

        if (foundUser.isSubscribed()) {
            const currentDate = Date.now();
            const currentPlan = foundUser.subscribed_plans.find(plan => {
                return plan.expiry_date > currentDate && plan.payment_status === 'success';
            });

            res.status(200).json({ message: 'Active subscription', isSubscribed: true, user_subscribed_plans, currentPlan });
        }
        else {
            res.status(200).json({ message: 'No active subscription', isSubscribed: false, user_subscribed_plans, currentPlan: {} });
        }

    }
    catch (errors) {
        console.log(errors)
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* GET Get a PDF invoice document. */
//req.query: subscription ID
//res: pdf documnent
router.get('/api/subsciptionPlans/downloadpdf', authenticateToken, async function (req, res, next) {
    try {
        const userId = req.userId;
        const subscriptionID = req.query.id;
        console.log(subscriptionID);

        const foundUser = await User.findById(userId)
            .select('-password -isEnabled -movies_viewed -watch_later')
            .populate('subscribed_plans.subscription_plan');

        const planForInvoiceCreation = foundUser.subscribed_plans.find(plan => { return plan._id.toString() === subscriptionID });
        console.log(planForInvoiceCreation);

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        const html=(
            `<!doctype html>
<html lang="en">

<head>

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap');
    </style>

    <style>
        body {
            position: relative;
            font-family: "Work Sans", sans-serif;
            height: 90vh;
        }

        .brand-name {
            font-family: "Pacifico", cursive;
            font-size: 30px;
        }
        .footer{
            position:absolute;
            bottom: 20px;
            left:0;
        }
    </style>
    <title>Videolo|Invoice</title>
</head>

<body>
    <div class="container-fluid mt-5 px-2">
        <div class="row">
            <div class="col-12 ">
                <img src="http://localhost:3080/images/logo.png" width="50px" class="inline-block pb-4"><span
                    class="brand-name">Videolo</span>
            </div>
        </div>
        <div class="row my-3">
            <div class="col-6 text-start">
                <h2 class="">Invoice</h2>
            </div>
            <div class="col-6 text-end">
                <h3 class="">Order #${planForInvoiceCreation.order_id}</h3>
            </div>
        </div>
        <div class="row my-3">
            <div class="col-6 text-start">
                <p><strong>Billed To:</strong><br>
                    ${foundUser.name}<br>
                    ${foundUser.email}</p>
            </div>
            <div class="col-6 text-end">
                <p><strong>Order Date:</strong><br>
                    ${planForInvoiceCreation.activation_date.toDateString()}</p>
            </div>
        </div>
        <div class="row my-3">
            <div class="col-6 text-start">
                <p><strong>Payment ID:</strong><br>
                    ${planForInvoiceCreation.payment_id}</p>
            </div>
        </div>
        <div class="row my-3">
            <div class="col-12">
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Subscription Plan</th>
                            <th scope="col">Activation Date</th>
                            <th scope="col">Expiry Date</th>
                            <th scope="col">Price</th>
                        </tr>
                    </thead>
                    <tbody class="table-group-divider">
                        <tr>
                            <th scope="row">1</th>
                            <td>${planForInvoiceCreation.subscription_plan.name}</td>
                            <td>${planForInvoiceCreation.activation_date.toDateString()}</td>
                            <td>${planForInvoiceCreation.expiry_date.toDateString()}</td>
                            <td>Rs.${planForInvoiceCreation.subscription_plan.amount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="row my-3">
            <div class="col-12 text-start">

                <blockquote>
                    <h6>Thank You for Your Business!</h6>
                    We appreciate your trust in us and value your continued support.<br>
                    If you have any questions about this invoice or need further assistance, please don't hesitate to
                    contact us.<br>
                    We look forward to serving you again.
                </blockquote>
            </div>
        </div>
        
    </div>


    <div class="footer">
        <div class="col-12 text-start">
            <span>contact_us@videolo.com | 555 4444 66666 | videolo.com </span>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM"
        crossorigin="anonymous"></script>
</body>

</html>`
        );
        await page.setContent(html);
        const pdfBuffer = await page.pdf({ format: 'A4' });

        // Close the browser
        await browser.close();

        const filePath = path.join(__dirname, 'temp', `Invoice_${subscriptionID}.pdf`);
        fs.writeFileSync(filePath, pdfBuffer);
        
        // Send the file as a download
        res.download(filePath, (err) => {
            if (err) {
                console.error('Error sending the file:', err);
                res.status(500).send('Error sending the file');
            }
            // Clean up the file after sending
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting the file:', unlinkErr);
            });
        });
    }
    catch (errors) {
        console.log(errors)
        res.status(500).send('Error generating PDF');
    }
});

/* POST User subscribes to a plan. */
//req.body: {subscriptionId,}
//Creating Razorpay Order
router.post('/api/subscibe', authenticateToken, async function (req, res, next) {
    try {
        const subscriptionId = req.body.id;
        const userId = req.userId;
        const sub_plan = await Subscription.findById(subscriptionId);
        if (!sub_plan) {
            return res.status(404).json({ message: 'Subscription Plan not found' });
        }
        if (!sub_plan.status) {
            return res.status(404).json({ message: 'Subscription Plan no longer active' });
        }

        const foundUser = await User.findById(userId);
        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        //usually from new Razorpay().instance.orders.create()
        const orderId = `order_${require("crypto").randomBytes(16).toString('hex')}_${Date.now()}`;
        foundUser.subscribed_plans.push({ subscription_plan: sub_plan._id, order_id: orderId });

        await foundUser.save();

        res.status(200).json({ message: 'Subscription Plan selected. Awaiting Payment confirmation.', status: 'pending', orderId: orderId });
    }
    catch (errors) {
        console.log(errors)
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* PATCH User subscribe payment verificatiom. */
//req.body: {razorpay_orderID, razorpay_paymentID }
//updating payment_status to 'success'
router.patch('/api/subscibe/verify', authenticateToken, async function (req, res, next) {
    try {
        const { razorpay_orderID, razorpay_paymentID } = req.body;
        console.log('Received body:', req.body);
        const userId = req.userId;

        if (!razorpay_orderID) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const foundUser = await User.findById(userId);
        const subscriptionPlan = foundUser.subscribed_plans.find(plan => plan.order_id === razorpay_orderID);
        if (!subscriptionPlan) {
            return res.status(404).json({ message: 'Subscription Plan not found' });
        }

        // Retrieve the subscription duration
        const subscription = await Subscription.findById(subscriptionPlan.subscription_plan).select('duration');
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        if (!razorpay_paymentID) {
            subscriptionPlan.payment_id = '';
            subscriptionPlan.payment_status = 'failed';
            subscriptionPlan.activation_date = null;
            subscriptionPlan.expiry_date = null;

            // Mark the subdocument as modified
            foundUser.markModified('subscribed_plans');
            // Save the updated user document
            await foundUser.save();

            return res.status(422).json({ message: 'Payment ID is missing, subscription failed.', status: 'failed' });
        }

        subscriptionPlan.payment_id = razorpay_paymentID;
        subscriptionPlan.payment_status = 'success';

        // Set activation and expiry dates
        const activationDate = new Date(); // Set to current date
        const expiryDate = new Date(activationDate);
        expiryDate.setDate(activationDate.getDate() + subscription.duration);

        subscriptionPlan.activation_date = activationDate;
        subscriptionPlan.expiry_date = expiryDate;

        // Mark the subdocument as modified
        foundUser.markModified('subscribed_plans');

        // Save the updated user document
        await foundUser.save();

        res.status(200).json({ message: 'Payment Verified. Subscription Plan confirmed.', status: 'success' });
    }
    catch (errors) {
        console.log(errors)
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* PATCH User add viewed movie and update view count of movie on . */
//req.param: {movieId}
//view_count++
router.patch('/api/subscribed/movie/:id/viewed', authenticateToken, async function (req, res, next) {
    const userId = req.userId;
    const movieId = req.params.id;

    try {
        const foundUser = await User.findById(userId);

        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!foundUser.isSubscribed()) {
            return res.status(403).json({ message: 'Access denied - Subscription required', redirect: true });
        }

        const foundMovie = await Movie.findById(movieId);

        if (!foundMovie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Increment view count of movie
        foundMovie.view_count++;

        // Check if the movie has already been viewed
        const alreadyViewed = foundUser.movies_viewed.some(movieViewed => movieViewed.movie.toString() === movieId);
        if (alreadyViewed) {
            await foundMovie.save();
            return res.status(200).json({ message: 'Movie already viewed.' });
        }

        // Add movie to movies_viewed
        foundUser.movies_viewed.push({ movie: movieId });

        // Save both user and movie documents
        await foundMovie.save();
        await foundUser.save();

        res.status(200).json({ message: 'Movie added to viewed list.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* Get User  Watch History . */
//res: [{movies_viewed}], totalCount
router.get('/api/movie/watchHistory', authenticateToken, async function (req, res, next) {
    const userId = req.userId;

    try {
        const foundUser = await User.findById(userId);

        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        //page, limit, searchTerm from req.query
        const { page = 1, limit = 5 } = req.query;
        let skip = (page - 1) * limit;
        const movies_viewedArray = await User.findById(userId)
            .select('movies_viewed')
            .populate({
                path: 'movies_viewed.movie',
                options: {
                    skip: skip,
                    limit: parseInt(limit, 10)
                }
            })
            .exec();

        //array of movies
        const viewedMovies = movies_viewedArray.movies_viewed.map(viewedMovie => { return viewedMovie.movie });

        const count = foundUser.movies_viewed.length;
        const totalPages = Math.ceil(count / Number(limit))
        console.log(viewedMovies);
        res.status(200).json({ viewedMovies, totalPages });


    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* Get User  Watch Later . */
//res: [{watchLaterMovies}], totalCount
router.get('/api/movie/watchLater', authenticateToken, async function (req, res, next) {
    const userId = req.userId;

    try {
        const foundUser = await User.findById(userId);

        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        //page, limit, searchTerm from req.query
        const { page = 1, limit = 5 } = req.query;
        let skip = (page - 1) * limit;
        const watchLaterArray = await User.findById(userId)
            .select('watch_later')
            .populate({
                path: 'watch_later.movie',
                options: {
                    skip: skip,
                    limit: parseInt(limit, 10)
                }
            })
            .exec();

        //array of movies
        const watchLaterMovies = watchLaterArray.watch_later.map(addedMovie => { return addedMovie.movie });

        const count = foundUser.watch_later.length;
        const totalPages = Math.ceil(count / Number(limit))

        res.status(200).json({ watchLaterMovies, totalPages });


    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* PATCH User add movie to Watch Later . */
//req.param: {movieId}
//res: added true of false
router.patch('/api/subscribed/movie/:id/watchLater/add', authenticateToken, async function (req, res, next) {
    const userId = req.userId;
    const movieId = req.params.id;

    try {
        const foundUser = await User.findById(userId);

        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!foundUser.isSubscribed()) {
            return res.status(403).json({ message: 'Access denied - Subscription required', redirect: true });
        }

        const foundMovie = await Movie.findById(movieId);

        if (!foundMovie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Check if the movie has already added
        const alreadyAdded = foundUser.watch_later.some(movieAdded => movieAdded.movie.toString() === movieId);
        if (alreadyAdded) {
            return res.status(200).json({ message: 'Movie already in Watch Later.', added: false });
        }

        // Add movie to watch_later
        foundUser.watch_later.push({ movie: movieId });

        // Save user 
        await foundUser.save();

        res.status(200).json({ message: 'Movie added to Watch Later.', added: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* PATCH User remove movie from Watch Later . */
//req.param: {movieId}
//res: added true of false
router.patch('/api/subscribed/movie/:id/watchLater/remove', authenticateToken, async function (req, res, next) {
    const userId = req.userId;
    const movieId = req.params.id;

    try {
        const foundUser = await User.findById(userId);

        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!foundUser.isSubscribed()) {
            return res.status(403).json({ message: 'Access denied - Subscription required', redirect: true });
        }

        const foundMovie = await Movie.findById(movieId);

        if (!foundMovie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Check if the movie has already in watchLater
        const inWatchLater = foundUser.watch_later.some(movieAdded => movieAdded.movie.toString() === movieId);
        if (inWatchLater) {
            foundUser.watch_later = foundUser.watch_later.filter(watchLatermovie => watchLatermovie.movie.toString() !== movieId)
            // Save user 
            await foundUser.save();

            return res.status(200).json({ message: 'Movie removed from Watch Later.' });
        }
        res.status(404).json({ message: 'Movie not found in Watch Later.' });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* GET  User rating of a viewed movie . */
//req.param: {movieId}
//movie rated msg
router.get('/api/subscribed/movie/:id/rating', authenticateToken, async function (req, res, next) {
    const userId = req.userId;
    const movieId = req.params.id;

    try {
        // Validate rating value

        const foundUser = await User.findById(userId);
        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!foundUser.isSubscribed()) {
            return res.status(403).json({ message: 'Access denied - Subscription required', redirect: true });
        }

        const foundMovie = await Movie.findById(movieId);
        if (!foundMovie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Check if the movie has already been viewed
        const alreadyViewed = foundUser.movies_viewed.some(movieViewed => movieViewed.movie.toString() === movieId);
        if (alreadyViewed) {
            // Add or update the rating
            const existingRating = foundMovie.rating.find(r => foundUser._id.toString() === r.userId.toString());
            if (existingRating) {
                return res.status(200).json({ message: 'Existing rating found.', rating: existingRating.rating, isViewed: true });
            } else {
                return res.status(200).json({ message: 'No existing rating.', rating: 0, isViewed: true });
            }
        }

        res.status(200).json({ message: 'Not a viewed movie.', rating: 0, isViewed: false });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* PATCH User can rate a viewed movie . */
//req.param: {movieId}
//movie rated msg
router.patch('/api/subscribed/movie/:id/rating', authenticateToken, async function (req, res, next) {
    const userId = req.userId;
    const movieId = req.params.id;
    const rating = Number(req.body.rating);

    try {
        // Validate rating value
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const foundUser = await User.findById(userId);
        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!foundUser.isSubscribed()) {
            return res.status(403).json({ message: 'Access denied - Subscription required', redirect: true });
        }

        const foundMovie = await Movie.findById(movieId);
        if (!foundMovie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Check if the movie has already been viewed
        const alreadyViewed = foundUser.movies_viewed.some(movieViewed => movieViewed.movie.toString() === movieId);
        if (alreadyViewed) {
            // Add or update the rating
            const existingRating = foundMovie.rating.find(r => foundUser._id.toString() === r.userId.toString());
            if (existingRating) {
                existingRating.rating = rating;
            } else {
                foundMovie.rating.push({ userId: foundUser._id, rating });
            }
            await foundMovie.updateAverageRating();

            res.status(200).json({ message: 'Rating submitted successfully.' });
        }
        else {
            return res.status(200).json({ message: 'User has not viewed this movie.', canRate: false });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* PATCH User reset password. */
//token and userId from header
//res: success=password change
router.patch('/api/reset-password', authenticateToken, async function (req, res, next) {
    const userId = req.userId;
    const password = req.body.password;

    try {
        const foundUser = await User.findById(userId);

        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        let hashedPassword = await bcrypt.hash(password, 10)
        foundUser.password = hashedPassword;

        // Save user 
        await foundUser.save();

        res.status(200).json({ message: 'Password Changed.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* POST forgot-password page to send reset password link. */
//req.body: email
//res: email sent
router.post('/api/forgot-password', async function (req, res, next) {
    try {
        //Joi validation schema for email
        const emailSchema = Joi.object({
            email: Joi.string().email().required().label('Email'),
        });
        // Validate email
        const { error } = emailSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Incorrect e-mail format' });
        }

        const { email } = req.body;
        const foundUser = await User.findOne({ email });

        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find or create token
        let token = await Token.findOne({ userId: foundUser._id });
        if (!token) {
            token = new Token({
                userId: foundUser._id,
                userType: 'User',
                token: uuidv4()
            });
            await token.save();
        }

        const url = `${process.env.BASE_URL_REACT}email/reset-pwd/${foundUser._id}/${encodeURIComponent(token.token)}`;
        await sendMail(foundUser.email, "Password Reset", url);

        res.status(200).json({ message: 'Link sent over email.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* PATCH User reset password. */
//token and userId from header
//res: success=password change
router.patch('/api/reset-password/:id/:token', async function (req, res, next) {
    const { id, token } = req.params;

    //Joi validation schema for password
    const passwordSchema = Joi.object({
        password: Joi.string()
            .pattern(new RegExp('^[a-zA-Z0-9!@#$%&*]{3,30}$'))
            .required()
            .label('Password')
    });

    const { error } = passwordSchema.validate(req.body)
    if (error) {
        return res.status(400).json({ message: 'Incorrect password format' });
    }

    // Check if the id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Link.' });
    }

    User.findById(id).then(foundUser => {
        if (!foundUser) {
            return res.status(400).json({ message: 'No such user registered.' });

        }

        Token.findOne({ userId: foundUser._id, token }).then(foundToken => {
            if (!foundToken) {
                return res.status(404).json({ message: 'Invalid Link.' });

            }

            const { password } = req.body;
            return bcrypt.hash(password, 10);

        }).then(hashedPassword => {

            foundUser.password = hashedPassword;
            foundUser.save().then(() => {
                console.log('Password changed in DB');
                res.status(200).json({ message: 'Password Changed.' });
            })
        }).catch(err => {
            console.error(err);
        });

    }).catch(err => {
        console.error(err);
    });
});

module.exports = router;