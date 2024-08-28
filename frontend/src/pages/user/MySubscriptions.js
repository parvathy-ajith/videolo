import React, { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../../auth/AuthContext';
import axios from 'axios';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

const MySubscriptions = () => {
  const [currentPlan, setCurrentPlan] = useState({});
  const [subscribedPlans, setSubscribedPlans] = useState([]);

  const { token } = useContext(AuthContext);

  useEffect(() => {
    const existingSubscriptionPlan = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/subsciptionPlans/current`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        console.log(response.data);
        setCurrentPlan(response.data.currentPlan);
        setSubscribedPlans(response.data.user_subscribed_plans);
      } catch (err) {
        console.log(err);
      }
    };

    existingSubscriptionPlan();
  }, [token]);

  const downloadPDF = async (id) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/subsciptionPlans/downloadpdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob',
        params: {
          id
        }
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${id}.pdf`); 
      document.body.appendChild(link);
      link.click();

    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <div className="container">
        <div className="px-5 mb-4 bg-light rounded-3 text-center">
          <div className="container-fluid py-3">
            <h1 className="display-5 fw-bold">My Subscriptions</h1>
          </div>
        </div>
      </div>

      {currentPlan && Object.keys(currentPlan).length > 0 ? (
        <div className="container mb-5">
          <div className="row d-flex justify-content-center align-items-center">
            <div className="col-6">
              <Row xs={1} className="g-4 mb-4">
                <Col key={currentPlan?.subscription_plan?._id} className="d-flex justify-content-center align-items-center">
                  <Card className="text-center plan-card">
                    <Card.Body>
                      <Card.Title className="display-4 fw-bold">Active Plan</Card.Title>
                      <Card.Subtitle className="lead fw-bold">
                        {currentPlan.subscription_plan?.name?.split(' ')[0]} : &#8377;{currentPlan.subscription_plan?.amount}
                      </Card.Subtitle>
                      <Card.Subtitle className="mb-2"></Card.Subtitle>
                      <p className="fw-bold mt-4">Activation date: {new Date(currentPlan.activation_date).toDateString()}</p>
                      <p className="fw-bold">Expiry date: {new Date(currentPlan.expiry_date).toDateString()}</p>
                      <div className="card-text">
                        <ul>
                          {currentPlan.subscription_plan?.description?.split('#').map((line, index) => (
                            line.length !== 0 && <li key={index}><i className="fa fa-circle" style={{ fontSize: "8px" }}></i> {line}</li>
                          ))}
                        </ul>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mb-5 text-center shadow rounded w-25 py-4" style={{ height: '20vh' }}>
          <h2>No Active Plan</h2>
        </div>
      )}
      <div className='container'>
        <div className="row subscription-history mt-4">
          <div className="container">
            <div className="px-5 mb-4 bg-light rounded-3 text-center">
              <div className="container-fluid py-3">
                <h3>Subscription History</h3>
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Plan Name</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Payment Status</th>
                  <th scope="col">Payment ID</th>
                  <th scope="col">Activation date</th>
                  <th scope="col">Expiry date</th>
                  <th scope="col">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {subscribedPlans?.map((plan, index) => (
                  <tr key={plan._id}>
                    <th scope="row">{index + 1}</th>
                    <td>{plan.subscription_plan.name?.split(" ").slice(0, 3).join(' ')}</td>
                    <td>Rs.{plan.subscription_plan.amount}</td>
                    <td>{plan.payment_status}</td>
                    <td>{plan.payment_status === 'success' ? plan.payment_id : '-'}</td>
                    <td>{plan.payment_status === 'success' ? new Date(plan.activation_date).toDateString() : '-'}</td>
                    <td>{plan.payment_status === 'success' ? new Date(plan.expiry_date).toDateString() : '-'}</td>
                    <td>
                      {plan.payment_status === 'success' ?
                        <button className='btn btn-secondary' onClick={() => downloadPDF(plan._id)}>
                          <i className="fa fa-download" aria-hidden="true"></i> Invoice
                        </button>
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default MySubscriptions;
