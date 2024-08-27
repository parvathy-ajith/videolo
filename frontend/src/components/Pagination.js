import React from 'react'

const Pagination = ({page, total, limit, setPage}) => {
    const totalPages = total;
    
    const onClick = (newPage) => {
        setPage(newPage+1);
    }
  return (
    <div className='pagination-container'>
         {totalPages > 0 && [...Array(totalPages)].map((_, index) => (
                <button
                    className={page === index + 1 ? 'page_btn active' : 'page_btn'}
                    key={index}
                    onClick={() => onClick(index)}
                >
                    {index + 1}
                </button>
            ))}
    </div>
  )
}

export default Pagination