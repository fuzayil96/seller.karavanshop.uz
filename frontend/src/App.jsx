import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        {/* The seller route */}
        <Route path="/" element={<SellerDashboard />} />
        
        {/* The admin routes */}
        <Route path="/login" element={token ? <Navigate to="/admin" /> : <Login setToken={setToken} />} />
        <Route path="/admin" element={token ? <AdminDashboard token={token} setToken={setToken} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
