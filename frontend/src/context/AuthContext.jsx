import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loginUser, registerUser, logoutUser, refreshSession, fetchCurrentUser } from '../api/auth.api.js';
import { setAccessToken, setUnauthorizedHandler } from '../api/axios.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogoutState = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(handleLogoutState);

    const bootstrap = async () => {
      try {
        const { data } = await refreshSession();
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
      } catch {
        handleLogoutState();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [handleLogoutState]);

  const login = async (email, password) => {
    const { data } = await loginUser({ email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await registerUser({ name, email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      handleLogoutState();
    }
  };

  const refetchUser = async () => {
    const { data } = await fetchCurrentUser();
    setUser(data.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: Boolean(user), login, register, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
