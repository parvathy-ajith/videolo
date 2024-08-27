import React,{useContext} from 'react';
import {useNavigate} from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Offcanvas from 'react-bootstrap/Offcanvas';
import logo from '../../images/logo.png';
import avatar from '../../images/avatar.png';
import { AuthContext } from '../../auth/AuthContext';

const UserNav = () => {
  const navigate=useNavigate()
  const {logout, username} = useContext(AuthContext)
  const expand = false

  const handleLogout = () => {
    //AuthContext remove token
    logout();
    navigate('/')
  };

  const content = (
    <>
      <Navbar key={expand} expand={expand} className=" mb-3 user-nav">
        <Container fluid>
          <Navbar.Brand href="/home"><img src={logo} alt='Videolo Logo' width="60" height="60" className="d-inline-block align-top" /></Navbar.Brand>
          <Nav.Link className='nav-movies' href="/home">
            <i className="fa-solid fa-film me-2"></i>Movies
          </Nav.Link>
          <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-${expand}`} />
          <Navbar.Offcanvas
            id={`offcanvasNavbar-expand-${expand}`}
            aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
            placement="end"
          >
            <Offcanvas.Header closeButton>
              <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${expand}`} >
                <img src={avatar} alt='User Avatar' width="50" height="50" className="d-inline-block align-top" />
                <span className="sidenav-username d-inline-block " >{username}</span>
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="justify-content-end flex-grow-1 pe-3">
                <Nav.Link href="/home" className="sidenav-link" ><i className="fa-solid fa-film me-2"></i> Home</Nav.Link>
                <Nav.Link href="/home/my-subscriptions" className="sidenav-link" ><i className="fas fa-subscript me-2"></i> My Subscriptions</Nav.Link>
                <Nav.Link href="/home/subscriptions" className="sidenav-link" ><i className="fas fa-file-invoice-dollar me-2"></i> Subscription Plans</Nav.Link>
                <Nav.Link href="/home/watch-later" className="sidenav-link" ><i className="fas fa-clock me-2"></i> Watch Later</Nav.Link>
                <Nav.Link href="/home/watch-history" className="sidenav-link" ><i className="fas fa-history me-2"></i> Watch History</Nav.Link>
                <Nav.Link href="/home/reset-pwd" className="sidenav-link" ><i className="fas fa-key me-2"></i> Reset Password</Nav.Link>
                <Nav.Link onClick={handleLogout} href="#logout" className="sidenav-link" ><i className="fas fa-sign-out-alt me-2"></i> Logout</Nav.Link>
              </Nav>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>
    </>
  )
  return content
}

export default UserNav