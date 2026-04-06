import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistUser = (nextUser) => {
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      clearSession();
      return null;
    }

    const res = await api.get('/auth/me.php');
    persistUser(res.data.user);
    return res.data.user;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      clearSession();
      setLoading(false);
      return;
    }

    refreshUser().catch(() => {
      clearSession();
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login.php', { username, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    persistUser(user);
    return user;
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser, setCurrentUser: persistUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
