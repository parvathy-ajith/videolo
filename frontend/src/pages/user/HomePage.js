import React from 'react'
import { useEffect, useState, useContext } from "react";
import Search from '../../components/Search'
import Movies from '../../components/Movies'
import Pagination from '../../components/Pagination'
import { AuthContext } from '../../auth/AuthContext';
import axios from 'axios';

const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const { token } = useContext(AuthContext);
  const limit = 6;

  useEffect(() => {
    const getAllMovies = async () => {
      try {
        const response = await axios.get('http://localhost:3080/videolo/api/movies', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            searchTerm: search,
            page,
            limit
          }
        });
        console.log(response.data.movies)
        setMovies(response.data.movies);
        setTotal(response.data.totalPages);
      } catch (err) {
        console.log(err);
      }
    };

    getAllMovies();
  }, [page, search, token]);

  return (
    <>
      <div className="container">
        <div className="px-5 mb-3 bg-light rounded-3">
          <div className="container-fluid py-3">
            <h1 className="display-5 fw-bold">Welcome.</h1>
            <p className="col-md-8 fs-4">Millions of movies to discover. Explore now.</p>
            <Search setSearch={(search) => setSearch(search)} setPage={(page) => setPage(page)}/>
          </div>
        </div>
      </div>
      <div className='movies-container container mb-3'>
        <Movies movies={movies} limit={limit} />
        <Pagination page={page} limit={limit} total={total} setPage={(page) => { setPage(page) }} />
      </div>
    </>

  )
}

export default MovieList