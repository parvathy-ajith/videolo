import React, { useEffect, useState, useContext } from 'react'
import Movies from '../../components/Movies'
import Pagination from '../../components/Pagination'
import { AuthContext } from '../../auth/AuthContext';
import axios from 'axios';

const WatchHistory = () => {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { token } = useContext(AuthContext);
  const limit = 6;

  useEffect(() => {
    const getWatchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:3080/videolo/api/movie/watchHistory', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            page,
            limit
          }
        });
        console.log(response.data.viewedMovies)
        setMovies(response.data.viewedMovies);
        setTotal(response.data.totalPages);
      } catch (err) {
        console.log(err);
      }
    };

    getWatchHistory();

  }, [page, token]);

  return (
    <>
      <div className="container">
        <div className="px-5 mb-4 bg-light rounded-3 text-center">
          <div className="container-fluid py-3">
            <h1 className="display-5 fw-bold">Watch History</h1>
          </div>
        </div>
      </div>
      {movies?.length > 0 ? (<div className='movies-container container mb-3'>
        <Movies movies={movies} limit={limit} />
        <Pagination page={page} limit={limit} total={total} setPage={(page) => { setPage(page) }} />
      </div>) : (<div className='movies-container container mb-3 text-center' style={{ height: "40vh" }}>
        <p className='display-1'> No Movies Watched.</p>
      </div>)}
    </>
  )
}

export default WatchHistory