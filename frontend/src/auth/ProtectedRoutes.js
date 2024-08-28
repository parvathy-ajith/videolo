import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import axios from 'axios';

const PrivateRoute = ({ element }) => {
    const { token } = useContext(AuthContext);
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const authenticateToken = async () => {
            if (token) {
                try {
                    await axios.get(`${process.env.REACT_APP_API_BASEURL}/authenticate`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error('Token verification failed:', error);
                    setIsAuthenticated(false);
                    // Clear invalid token
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                }
            } else {
                setIsAuthenticated(false);
            }
        };

        authenticateToken();
    }, [token]);

    // Loading state while checking authentication
    if (isAuthenticated === null) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    
    return element;
};

export default PrivateRoute;
