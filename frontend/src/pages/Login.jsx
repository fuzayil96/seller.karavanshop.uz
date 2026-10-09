import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.DEV ? 'http://localhost:3000/api' : '/api';

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/admin/login`, { username, password });
      if (res.data.token) {
        setToken(res.data.token);
        navigate('/admin');
      } else {
        setError('Login muvaffaqiyatsiz');
      }
    } catch (_err) {
      setError('Xatolik yuz berdi. Login yoki parol noto\'g\'ri.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#02130e]">
      <div className="bg-[#072f23] border border-[#0e4b39] p-8 rounded-2xl w-full max-w-sm">
        <h2 className="text-2xl font-bold text-emerald-50 text-center mb-6">Admin Panel</h2>
        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-emerald-100/70 text-sm mb-1">Username</label>
            <input 
              type="text" 
              className="w-full bg-[#041f17] border border-emerald-500/30 rounded-lg p-2.5 text-emerald-50 focus:outline-none focus:border-emerald-500"
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-emerald-100/70 text-sm mb-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-[#041f17] border border-emerald-500/30 rounded-lg p-2.5 text-emerald-50 focus:outline-none focus:border-emerald-500"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-colors">
            Kirish
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
