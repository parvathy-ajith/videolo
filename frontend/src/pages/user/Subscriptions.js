import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import axios from 'axios';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import '../../stylesheets/Subscriptions.css'

const Subscriptions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const message = location.state?.message;
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const getAllSubscriptions = async () => {
      try {
        const response = await axios.get('http://localhost:3080/videolo/api/subsciptionPlans', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(response.data.plans);
        setPlans(response.data.plans);
      } catch (err) {
        console.log(err);
      }
    };

    const existingSubscriptionPlan = async () => {
      try {
        const response = await axios.get('http://localhost:3080/videolo/api/subsciptionPlans/current', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(response.data);
        setIsSubscribed(response.data.isSubscribed);
      } catch (err) {
        console.log(err);
      }
    }

    getAllSubscriptions();
    existingSubscriptionPlan();
  }, [token]);

  const handleSubscribe = async (e, plan_id) => {
    e.preventDefault();
    if (isSubscribed) {
      alert('You are already have an active subscription.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3080/videolo/api/subscibe', {
        id: plan_id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(response.data);
      navigate('/home/payment', { state: { order_id: response.data.orderId } });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <div className="container">
        {message && <div className="alert alert-danger">{message}</div>}
        {isSubscribed && <div className="alert alert-info">You already have an active subscription.</div>}
        <div className="px-5 mb-4 bg-light rounded-3 text-center">
          <div className="container-fluid py-3">
            <h1 className="display-5 fw-bold">Subscription Plans</h1>
          </div>
        </div>
      </div>
      <div className='subscriptions-container container mb-5'>
        <Row xs={1} md={3} lg={3} className='g-4'>
          {plans.map((plan) => (
            <Col key={plan._id} className="d-flex align-items-stretch">
              <Card className='text-center plan-card'>
                <Card.Body>
                  <Card.Title>{plan.name.split(' ')[0]}</Card.Title>
                  <Card.Subtitle className="mb-2 display-1">&#8377;{plan.amount}</Card.Subtitle>
                  <div className="card-text">
                    <ul >
                      {plan.description.split('#').map((line, index) => {
                        if (line.length !== 0) {
                          return (
                            <li key={index}><i className="fa fa-circle" style={{fontSize:"8px"}}></i> {line}</li>
                          )
                        }
                        else return null
                      })}
                    </ul>
                  </div>
                </Card.Body>
                <Card.Footer style={{ border: 'none' }}>
                  <p className='lead'><strong>{plan.duration} days</strong></p>
                  <Card.Link className='btn btn-light' onClick={(e) => handleSubscribe(e, plan._id)} disabled={isSubscribed}>Subscribe</Card.Link>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </>

  );
};

export default Subscriptions;
