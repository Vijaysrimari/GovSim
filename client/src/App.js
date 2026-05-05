import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PolicyLibrary from './pages/PolicyLibrary';
import SimulationView from './pages/SimulationView';
import CustomPolicy from './pages/CustomPolicy';
import Profile from './pages/Profile';
import Layout from './components/layout/Layout';
import api from './services/api';
import { clearAuthSession, getCachedAuth, storeSession } from './services/localAuth';

// Auth Context
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const cachedAuth = getCachedAuth();

    if (!token && cachedAuth?.user) {
      setUser(cachedAuth.user);
      setLoading(false);
      return;
    }

    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
          storeSession({ token, user: res.data });
        })
        .catch(() => {
          if (cachedAuth?.user) {
            setUser(cachedAuth.user);
            storeSession(cachedAuth);
            return;
          }
          clearAuthSession();
        })
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = (data) => {
    storeSession(data);
    setUser(data.user);
  };
  const logout = () => {
    clearAuthSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ width:32, height:32, border:'2px solid var(--border)', borderTopColor:'var(--orange)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="policies" element={<PolicyLibrary />} />
            <Route path="simulate/:id" element={<SimulationView />} />
            <Route path="create" element={<CustomPolicy />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
