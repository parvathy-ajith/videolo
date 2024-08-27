import React from 'react'
import { Outlet } from 'react-router-dom'
import UserNav from '../navbars/UserNav'

const HomePageLayout = () => {
  
  return (
    <div className='user-page-bg'>
    <UserNav />
    <Outlet />
    </div>  
  )
}

export default HomePageLayout