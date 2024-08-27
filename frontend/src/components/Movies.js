import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { AuthContext } from '../auth/AuthContext';
import axios from 'axios';

const Movies = (props) => {
    const { movies, limit,removeFromWatchLater } = props;
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);
    const location = useLocation();

    const targetPath = '/home/watch-later'

    // Convert HTML entities to text
    const decodeHtml = (html) => {
        var txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

    //navigate to Movie video if subscribed user
    const viewMovie = async (movieId) => {
        try {
            const response = await axios.get(`http://localhost:3080/videolo/api/subscribed/movie/${movieId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const movie = response.data.movie
            navigate(`/home/movie`, { state: { movie } });
        }
        catch (error) {
            console.log(error);
            if (error.response.data.redirect) {
                navigate(`/home/subscriptions`, { state: { message: 'You need to be subscribed to view movies! Please select a subscription plan.' } });
            }

        }
    }

  

    return (
        <>
            <Row xs={1} md={4} lg={limit} className='g-4'>
                {movies.map((movie) => (
                    <Col key={movie._id} className="d-flex flex-column align-items-stretch movie-col">
                        <Card className='movie-card' onClick={() => viewMovie(movie._id)}>
                            <div className="image-container border">
                                <Card.Img src={`http://localhost:3080/${movie.image}`} alt='Movie Poster' className="card-img" />
                                <Card.ImgOverlay className='movie-card-overlay'>
                                    <div className="rating-overlay">
                                        {movie.averageRating} ★
                                    </div>
                                    <div className="text-overlay">
                                        <Card.Text>
                                            <strong>{movie.title}</strong><br />
                                            {decodeHtml(movie.description)}
                                        </Card.Text>
                                    </div>
                                </Card.ImgOverlay>
                            </div>
                        </Card>
                        {location.pathname === targetPath && (
                            <div className='d-flex justify-content-center mt-2'>
                                <button className='btn btn-outline-primary' onClick={() => removeFromWatchLater(movie._id)}>Remove</button>
                            </div>
                        )}
                    </Col>
                ))}
            </Row>
        </>
    );
};

export default Movies;
