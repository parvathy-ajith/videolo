import React, { useState } from 'react'

const Search = ({ setSearch, setPage }) => {
    const [input, setInput] = useState('');

    const handleInputChange = (e) => {
        setInput(e.target.value);
        setSearch(e.target.value);
        setPage(1);
    };

    return (
        <div className="search-group input-group mb-3">
            <input 
            type="text" 
            value={input}
            onChange={handleInputChange}
            className="search-control form-control" 
            placeholder="Search for a movie......" 
            aria-label="Search for movie by title" 
            aria-describedby="button-addon2" />
        </div>
    )
}

export default Search