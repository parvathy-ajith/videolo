const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    }
});

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    video: {
        type: String,
        required: true
    },
    rating: {
        type: [ratingSchema],
        default: []
    },
    averageRating: { 
        type: Number, 
        default: 0 },
    view_count: {
        type: Number,
        default: 0
    }
});


movieSchema.methods.updateAverageRating = async function () {
    const ratings = this.rating;
    const averageRating = ratings.length
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
    
    this.averageRating = averageRating.toFixed(2);
    await this.save(); // Save the updated movie document
};

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;