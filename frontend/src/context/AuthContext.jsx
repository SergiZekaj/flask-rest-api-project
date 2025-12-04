import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Token exists, user is logged in
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      const { access_token, refresh_token } = response.data;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      setUser({ token: access_token });
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      // Try different error message locations
      const errorMessage = 
        error.response?.data?.message ||
        error.response?.data?.errors?.json?.message ||
        error.response?.data?.description ||
        error.message ||
        'Login failed';
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const register = async (username, password) => {
    try {
      await authAPI.register(username, password);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      
      // Handle network errors
      if (!error.response) {
        return {
          success: false,
          error: `Network error: ${error.message}. Please check if the backend server is running.`,
        };
      }
      
      // Handle Flask-Smorest validation errors
      if (error.response?.data?.errors?.json) {
        const validationErrors = error.response.data.errors.json;
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        return {
          success: false,
          error: `Validation error: ${errorMessages}`,
        };
      }
      
      // Try different error message locations (Flask-Smorest can return errors in different formats)
      const errorMessage = 
        error.response?.data?.message ||
        error.response?.data?.description ||
        error.message ||
        `Registration failed (Status: ${error.response?.status || 'Unknown'})`;
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

