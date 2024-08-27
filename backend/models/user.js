const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");

// Movie viewed schema
const movieViewedSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  date_viewed: {
    type: Date,
    default: Date.now // Automatically set the current date when viewed
  }
});

// Subscribed Plan schema
const suscribedPlanSchema = new mongoose.Schema({
  subscription_plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  order_id: {
    type: String,
    required: true
  },
  activation_date: {
    type: Date
  },
  expiry_date: {
    type: Date
  },
  payment_id: {
    type: String
  },
  payment_status: {
    type: String,
    enum: ['pending', 'success', 'failed'], 
    default: 'pending'
  }
});

// Movie saved to watch later schema
const watchLaterSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  date_added: {
    type: Date,
    default: Date.now // Automatically set the current date when viewed
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  movies_viewed: {
    type: [movieViewedSchema], // Reference to the movieViewedSchema
    default: []
  },
  subscribed_plans: {
    type: [suscribedPlanSchema],
    default: []
  },
  watch_later: {
    type: [watchLaterSchema], // Reference to the watchLaterSchema
    default: []
  }
})

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "24h",
  });
  return token;
};

userSchema.methods.isSubscribed = function () {
  const currentDate = new Date();
  // Check if there is any active subscription plan
  //The some() method returns true (and stops) if the function returns true for one of the array elements, returns false for empty array
  return this.subscribed_plans.some(plan => {
    return plan.expiry_date > currentDate && plan.payment_status === 'success';
  });



}

module.exports = mongoose.model('User', userSchema);