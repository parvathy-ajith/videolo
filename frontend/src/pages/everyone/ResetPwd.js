import React, { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../../auth/AuthContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import logo from '../../images/logo.png'
import axios from 'axios';

const ResetPwd = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [resetMethod, setResetMethod] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const { userId, userToken } = useParams();
    const { logout, token } = useContext(AuthContext);

    const pathname = location.pathname;

    useEffect(() => {
        if (pathname.match(/^(\/email\/reset-pwd\/)/)) {
            console.log("matches pathname :" + pathname);
            setResetMethod('userToken')
        } else if (pathname.match(/^(\/home\/reset-pwd)/)) {
            console.log("matches pathname :" + pathname);
            setResetMethod('token')
        }
    }, [pathname, logout, navigate]);

    const passwordSchema = yup.object().shape({
        password: yup.string()
            .matches(/^[a-zA-Z0-9!@#$%&*]{5,30}$/, "Password should be between 5 to 30 characters and contain alpha-numeric values and special characters(@ # $ % & *)")
            .required("MUST enter your Password."),
        confirmPassword: yup.string().oneOf([yup.ref("password"), null], "Passwords did not match!!!!!").required("Confirm the password.")
    });

    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(passwordSchema) });

    const handleResetPwdToken = async (data) => {
        try {
            await axios.patch(`${process.env.REACT_APP_API_BASEURL}/reset-password`, {
                password: data.password
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setSuccessMsg("Password changed.");
            setErrorMsg('')
        }
        catch (error) {
            console.log(error);
            setErrorMsg('Could not change the password !!')
        }
    }
    // Reset password from email link
    const handleResetPwdEmailLink = async (data) => {
        try {
            await axios.patch(`${process.env.REACT_APP_API_BASEURL}/reset-password/${userId}/${userToken}`, {
                password: data.password
            });

            setSuccessMsg("Password changed. Redirecting to Sign In.... ");
            setErrorMsg('');
            setTimeout(() => {
                navigate('/login');
            }, 2500);
        }
        catch (error) {
            console.log(error);
            setErrorMsg('Could not change the password !!')
        }
    }


    const content = (
        <div className="vw-100 d-flex justify-content-center align-items-center" style={{ height: "75vh" }}>
            <div className="parent-login">
                <form className="login-card p-4 " onSubmit={handleSubmit(resetMethod === 'token' ? handleResetPwdToken : handleResetPwdEmailLink)}>
                    <h1 className="text-center mb-4"> <img src={logo} alt='Videolo Logo' width="60" height="60" className="d-inline-block align-top" />
                        Reset Password</h1>
                    {successMsg && <div className="alert alert-success" role="alert">
                        {successMsg}
                    </div>}
                    {errorMsg && <div className="alert alert-danger" role="alert">
                        {errorMsg}
                    </div>}
                    <div className="userInput mb-3">
                        <input type="password" placeholder="Password" {...register("password")} />
                        <p className='text-danger'>{errors ? errors.password?.message : " "}</p>
                    </div>
                    <div className="userInput mb-3">
                        <input type="password" placeholder="Confirm Password" {...register("confirmPassword")} />
                        <p className='text-danger'>{errors ? errors.confirmPassword?.message : " "}</p>
                    </div>
                    <div>
                        <button className="btn-login">Reset Password</button>
                    </div>
                </form>
            </div>
        </div>
    )
    return content
}

export default ResetPwd