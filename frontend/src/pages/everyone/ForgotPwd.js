import React,{useState} from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';

const ForgotPwd = () => {
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const emailSchema = yup.object().shape({
        email: yup.string().email("Enter valid Email Address").required("MUST enter your Email Address.")
    });

    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(emailSchema) });

    const sendEmail = async (data) => {
        try {
            await axios.post(`${process.env.REACT_APP_API_BASEURL}/forgot-password`, {
                ...data
            });

            setSuccessMsg("Reset Password link sent  to registered email.");
            setErrorMsg('')
        }
        catch (error) {
            console.log(error);
            setErrorMsg(error.response.data.message)
        }
    }

    const content = (
        <div className="topSide">
            <div className="parent-login">
                <form className="login-card" onSubmit={handleSubmit(sendEmail)}>
                    <h1>Forgot Password</h1>
                    {successMsg && <div className="alert alert-success" role="alert">
                        {successMsg}
                    </div>}
                    {errorMsg && <div className="alert alert-danger" role="alert">
                        {errorMsg}
                    </div>}
                    <div className="userInput">
                        <input type="text" placeholder="Email" {...register("email")} />
                        <p className='text-danger'>{errors ? errors.email?.message : " "}</p>
                    </div>
                    <div>
                        <button className="btn-login">Send Email</button>
                    </div>
                    <div className="signIn">
                        Already have an Account? <Link to='/login' className='sLink'> Sign In</Link>.
                    </div>
                </form>
            </div>
        </div>)
    return content
}

export default ForgotPwd