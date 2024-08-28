import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import { AuthContext } from '../../auth/AuthContext';

const SignIn = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext)

  const successMessage = location.state?.successMessage;

  const loginSchema = yup.object().shape({
    email: yup.string().email("Enter valid Email Address").required("MUST enter your Email Address."),
    password: yup.string()
      .matches(/^[a-zA-Z0-9!@#$%&*]{5,30}$/, "Password should be between 5 to 30 characters and contain alpha-numeric values and special characters(@ # $ % & *)")
      .required("MUST enter your Password.")
  });

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(loginSchema) });

  const loginUser = async (data) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASEURL}/login`, {
        email: data.email,
        password: data.password
      });
    //token, username set in AuthContext  
      login(response.data.token,response.data.username)
      navigate('/home');
    }
    catch (error) {
      console.log(error);
      if (error.response)
        setErrorMessage(error.response.data.message)
    }

  }

  const content = (
    <div className="topSide">
      <div className="parent-login">
        <form className="login-card" onSubmit={handleSubmit(loginUser)}>
          <h1>Sign In</h1>
          {successMessage && <div className="alert alert-success" role="alert">
            {successMessage}! Login now.
          </div>}
          {errorMessage && <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>}
          <div className="userInput">
            <input type="text" placeholder="Email" {...register("email")} />
            <p className='text-danger'>{errors ? errors.email?.message : " "}</p>
          </div>
          <div className="userInput">
            <input type="password" name="password" placeholder="Password" {...register("password")} />
            <p className='text-danger'>{errors ? errors.password?.message : " "}</p>
          </div>
          <div>
            <button className="btn-login">LOGIN</button>
          </div>
          {/* <div className="remMe">
            <div>
              <input type="checkbox" />
              <label className="cText">Remember me</label>
            </div>
          </div> */}
          <div className="mt-2">
            <Link to='/forgot-pwd' className='sLink'> Forgot Password?</Link>
          </div>
          <div className="signUp">
            New to Videolo? <Link to='/register' className='sLink'> Sign up now</Link>.
          </div>
        </form>
      </div>
    </div>)
  return content
}

export default SignIn