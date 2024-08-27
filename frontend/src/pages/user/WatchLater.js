import React, { useEffect, useState, useContext } from 'react'
import Movies from '../../components/Movies'
import Pagination from '../../components/Pagination'
import { AuthContext } from '../../auth/AuthContext';
import axios from 'axios';

const WatchLater = () => {
  const [movies, setMovies] = useState([]);
  const [watchLaterMessage, setwatchLaterMessage] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { token } = useContext(AuthContext);
  const limit = 6;

  const getWatchLaterMovies = async () => {
    try {
      const response = await axios.get('http://localhost:3080/videolo/api/movie/watchLater', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page,
          limit
        }
      });
      console.log(response.data.watchLaterMovies)
      setMovies(response.data.watchLaterMovies);
      setTotal(response.data.totalPages);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {

    getWatchLaterMovies();

  }, [page, token]);

  //remove From Watch Later
  const removeFromWatchLater = async (movieId) => {
    try {
      const response = await axios.patch(`http://localhost:3080/videolo/api/subscribed/movie/${movieId}/watchLater/remove`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      getWatchLaterMovies();
      setwatchLaterMessage(response.data.message);
    }
    catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <div className="container">
        <div className="px-5 mb-4 bg-light rounded-3 text-center">
          <div className="container-fluid py-3">
            <h1 className="display-5 fw-bold">Watch Later</h1>
          </div>
        </div>
      </div>
      {movies?.length > 0 ? (<div className='movies-container container mb-3'>
        {watchLaterMessage ? <p className='mt-2 fw-bold fst-italic'>{watchLaterMessage}</p> : ''}
        <Movies movies={movies} limit={limit} removeFromWatchLater={removeFromWatchLater} />
        <Pagination page={page} limit={limit} total={total} setPage={(page) => { setPage(page) }} />
      </div>) : (<div className='movies-container container mb-3 text-center' style={{height:"40vh"}}>
        <p className='display-1'> No Movies added.</p>
      </div>)}
    </>
  )
}

export default WatchLater