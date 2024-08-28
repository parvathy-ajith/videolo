import React,{useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';

const SignUp = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const registerSchema = yup.object().shape({
    name: yup.string().required("Pleae enter your name."),
    email: yup.string().email("Enter valid Email Address").required("MUST enter your Email Address."),
    password: yup.string()
      .matches(/^[a-zA-Z0-9!@#$%&*]{5,30}$/, "Password should be between 5 to 30 characters and contain alpha-numeric values and special characters(@ # $ % & *)")
      .required("MUST enter your Password."),
    confirmPassword: yup.string().oneOf([yup.ref("password"), null], "Passwords did not match!!!!!").required("Confirm the password.")
  });

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(registerSchema) });

  const signUpUser = async (data) => {
    try {
      const response  = await axios.post(`${process.env.REACT_APP_API_BASEURL}/register`, {
        name: data.name,
        email:data.email,
        password:data.password
      });

      console.log(response );
      navigate("/login",{state:{successMessage: response.data.message}});
    }
    catch (error) {
      console.log(error);
      if(error.response)
        setErrorMessage(error.response.data.message)
    }
  }

  const content = (
    <div className="topSide">
      <div className="parent-login">
        <form className="login-card" onSubmit={handleSubmit(signUpUser)}>
          <h1>Sign Up</h1>
          <p className='text-danger'>{errorMessage}</p>
          <div className="userInput">
            <input type="text" placeholder="Name" {...register("name")} />
            <p className='text-danger'>{errors ? errors.name?.message : " "}</p>
          </div>
          <div className="userInput">
            <input type="text" placeholder="Email" {...register("email")} />
            <p className='text-danger'>{errors ? errors.email?.message : " "}</p>
          </div>
          <div className="userInput">
            <input type="password" name="password" placeholder="Password" {...register("password")} />
            <p className='text-danger'>{errors ? errors.password?.message : " "}</p>
          </div>
          <div className="userInput">
            <input type="password" name="confirmPassword" placeholder="Confirm Password" {...register("confirmPassword")} />
            <p className='text-danger'>{errors ? errors.confirmPassword?.message : " "}</p>
          </div>
          <div>
            <button className="btn-login">REGISTER</button>
          </div>

          <div className="signIn">
            Already have an Account? <Link to='/login' className='sLink'> Sign In</Link>.
          </div>
        </form>
      </div>
    </div>)
  return content
}

export default SignUp