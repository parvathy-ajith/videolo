import React from 'react'
import { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import logo from '../../images/logo.png'

const LandingNav = () => {
  const [scroll, setScroll] = useState(false);
  let navigate = useNavigate(); 

   // Navigate to Sign Up page
   const signIn=()=>{
    navigate('login');
  }

  useEffect(() => {
    const handleScroll = () => {
      setScroll(window.scrollY >= 100);
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div id='nav' className={`nav ${scroll ? 'nav_black' : ''}`}>
      <Link to="/" > <img src={logo} alt='Videolo Logo' className='nav_logo' /></Link>
      <button className='nav_btn' onClick={signIn}>Sign In</button>
    </div>
  )
}

export default LandingNav