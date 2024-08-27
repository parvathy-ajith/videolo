import React,{ useContext }  from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'
import LandingNav from '../navbars/LandingNav'
import Footer from '../Footer'
import { AuthContext } from '../../auth/AuthContext'

const LandingPageLayout = () => {
  const location = useLocation();
  const { token } = useContext(AuthContext);

  if (token && !location.pathname.startsWith('/home')) {
    return <Navigate to="/home" />;
  }

  return (
    <>
      {!location.pathname.startsWith('/home') && <LandingNav />}
      <Outlet />
      <Footer />
    </>

  )
}

export default LandingPageLayout