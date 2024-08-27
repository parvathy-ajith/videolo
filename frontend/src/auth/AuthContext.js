import React, { createContext, useState } from 'react'

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [username, setUsername] = useState(localStorage.getItem("username") || null);

    const login = (newToken, newUsername) => {
        setToken(newToken);
        setUsername(newUsername)
        localStorage.setItem("token", newToken);
        localStorage.setItem("username", newUsername);
    }

    const logout = () => {
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("username");
    }

    return (
        <AuthContext.Provider value={{ token, username, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
