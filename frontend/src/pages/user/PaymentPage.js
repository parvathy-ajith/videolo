import React, {useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import axios from 'axios';

const PaymentPage = () => {
    const [isSuccess, setIsSuccess] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const orderId = location.state?.order_id;
    const { token } = useContext(AuthContext);


    const verifyPayment = async () => {
        try {
            const randomPaymentId = 'pay_' + Math.random().toString(36).slice(2, 11);
            const response = await axios.patch(`http://localhost:3080/videolo/api/subscibe/verify`, {
                razorpay_orderID: orderId,
                razorpay_paymentID: randomPaymentId
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(response)
            setIsSuccess(true);
            // Redirect to home after a delay
            setTimeout(() => {
                navigate('/home');
            }, 3000);
        }
        catch (error) {
            console.log(error);
            if (error.response && error.response.status === 422 && error.response.data.status === 'failed') {
                navigate(`/home/subscriptions`, { state: { message: 'Payment failed. Try again.' } });
            }
        }
    }

    
    return (
        <div className="container text-center mt-5" style={{height: '55vh'}}>
            <h1>Payment Page</h1>
            <button className="btn btn-primary mt-3" onClick={verifyPayment}>
                Make Payment
            </button>
            <div>
                {isSuccess && <div className="alert alert-success">Payment successful! Redirecting to home...</div>}
            </div>
        </div>
    )
}

export default PaymentPage