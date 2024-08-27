import React, { useRef, useEffect } from 'react'
import { useNavigate } from "react-router-dom";

const Landing = () => {

  const rowRef = useRef(null);
  let navigate = useNavigate();

  // Navigate to Sign Up page
  const signUp = () => {
    navigate('register');
  }

  // Scroll the trending Movies List
  const scrollLeft = () => {
    rowRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    rowRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleWheel = (event) => {
      event.preventDefault();
      if (event.deltaY > 0) {
        rowRef.current.scrollBy({ left: 300, behavior: 'smooth' });
      } else {
        rowRef.current.scrollBy({ left: -300, behavior: 'smooth' });
      }
    };

    const row = rowRef.current;
    row.addEventListener('wheel', handleWheel);

    return () => {
      row.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <>
      {/* Header */}
      <div className='banner'>
        <div className='banner_contents'>
          <h1 className='banner_title'>Be the First to Watch</h1>
          <div className='banner_description'>
            Stream Unlimited movies here!<br />
            <b>Watch anywhere. Cancel anytime.</b><br />
            Ready to watch?<br />
            <p className='banner_important'>
              <b>Create your membership NOW <i className="fa-solid fa-arrow-down"></i></b>
            </p>
          </div>
          <div className='banner_btns'>
            <button className='banner_btn' onClick={signUp}>Sign Up <i className="fa-solid fa-chevron-right"></i></button>
          </div>
        </div>
        <div className='banner__fadeBottom'></div>
      </div>

      {/* Movie Image Display */}
      <div className='movie_row'>
        <h2>Trending Movies</h2>
        <div className='row_posters_wrapper'>
          <img className='' src='/images/back.png' alt='back icon' id='backBtn' onClick={scrollLeft} />
          <div className='row_posters' ref={rowRef}>
            <img className='row_poster row_posterLarge' src='/images/large-movie1.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie2.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie3.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie4.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie5.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie6.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie7.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie8.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie1.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie2.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie3.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie4.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie5.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie6.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie7.jpg' alt='Movie Poster' />
            <img className='row_poster row_posterLarge' src='/images/large-movie8.jpg' alt='Movie Poster' />
          </div>
          <img className='' src='/images/next.png' alt='next icon' id='nextBtn' onClick={scrollRight} />
        </div>
      </div>

      {/* Showcase */}
      <section className="showcase">
        <div className="showcase-container case1">
          <div className="inner-container">
            <div className="inner-title">
              <h1>Enjoy on your TV.</h1>
            </div>
            <div className="inner-text">
              <p>
                Watch on Smart TVs, Playstation, Xbox, Chromecast, Apple TV,
                Blu-ray players, and more.
              </p>
            </div>
          </div>
          <div className="showcase-img">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRc2Ah-u2dcRFG3IQwzVugTLaUH3HUtVvP8IA&s"
              alt=""
            />
          </div>
        </div>
      </section>

      <section className="showcase">
        <div className="showcase-container case2">
          <div className="showcase-img">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvTyKBIwkJ6i6kdO55ujSv2OSYRw-SyhIpVQ&s"
              alt=""
            />
          </div>
          <div className="inner-container">
            <div className="inner-title">
              <h1>Download your shows to watch offline.</h1>
            </div>
            <div className="inner-text">
              <p>
                Save your favorites easily and always have something to watch.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="showcase">
        <div className="showcase-container case3">
          <div className="inner-container">
            <div className="inner-title">
              <h1>Watch everywhere.</h1>
            </div>
            <div className="inner-text">
              <p>
                Stream unlimited movies on your phone, tablet,
                laptop, and TV without paying more.
              </p>
            </div>
          </div>
          <div className="showcase-img">
            <img
              src="https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/device-pile.png"
              alt=""/>
          </div>
        </div>
      </section>
    </>
  )
}

export default Landing