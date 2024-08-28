import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Rating from 'react-rating';
import { AuthContext } from '../../auth/AuthContext';
import axios from 'axios';

const Movie = () => {
  const [isPlayed, setIsPlayed] = useState(false);
  const [watchLaterMessage, setwatchLaterMessage] = useState('');
  const [rating, setRating] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const movie = location.state?.movie;
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const existingRating = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/subscribed/movie/${movie._id}/rating`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(response)
        setIsPlayed(response.data.isViewed);
        setRating(response.data.rating);
      }
      catch (error) {
        console.log(error);
        if (error.response.data.redirect) {
          navigate(`/home/subscriptions`, { state: { message: 'You need to be subscribed to view movies! Please select a subscription plan.' } });
        }
      }
    }
    existingRating();
  }, [token, movie._id, navigate])

  const viewMovie = async () => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_BASEURL}/subscribed/movie/${movie._id}/viewed`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setIsPlayed(true);
    }
    catch (error) {
      console.log(error);
      if (error.response.data.redirect) {
        navigate(`/home/subscriptions`, { state: { message: 'You need to be subscribed to view movies! Please select a subscription plan.' } });
      }
    }
  }

  const handleRating = async (newRating) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_BASEURL}/subscribed/movie/${movie._id}/rating`, {
        rating: newRating
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
    catch (error) {
      console.log(error);
    }
  }

  const addToWatchLater = async () => {
    try {
      const response = await axios.patch(`${process.env.REACT_APP_API_BASEURL}/subscribed/movie/${movie._id}/watchLater/add`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setwatchLaterMessage(response.data.message);
    }
    catch (error) {
      console.log(error);
      if (error.response.data.redirect) {
        navigate(`/home/subscriptions`, { state: { message: 'You need to be subscribed to view movies! Please select a subscription plan.' } });
      }
    }
  }

  return (
    <div className='container mb-3'>
      <div className='row'>
        <div className='col-12  d-flex justify-content-center'>
          <video className='w-50 w-sm-100' controls onPlay={viewMovie}   >
            <source src={`${process.env.REACT_APP_ASSET_BASEURL}/${movie.video}`} type="video/mp4" />
            Your browser does not support HTML video.
          </video>
        </div>
      </div>
      <div className='row movie-description mt-3 p-3'>
        <div className='col-12'>
          <h1>{movie.title}</h1>
        </div>
        <div className='col-12'>
          <p>{movie.description}</p>
        </div>
        <div className='col-lg-6 my-3 my-lg-0'>
          <button className='btn btn-outline-primary' onClick={addToWatchLater}>Watch Later</button>
          {watchLaterMessage? <p className='mt-2 fw-bold fst-italic'>{watchLaterMessage}</p> : ''}
        </div>
        <div className='col-lg-6'>
          {isPlayed && <Rating
            emptySymbol="fa fa-star-o fa-2x medium"
            fullSymbol="fa fa-star fa-2x medium"
            fractions={10}
            initialRating={rating}
            style={{ color: '#2596be' }}
            onClick={(newRating) => handleRating(newRating)}
          />}
        </div>
      </div>
    </div>
  )
}

export default Movie