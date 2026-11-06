import React, { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import apiService from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debeCambiarPassword, setDebeCambiarPassword] = useState(
    () => localStorage.getItem('debeCambiarPassword') === '1'
  );

  // Verificar si hay token guardado al cargar
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      verificarUsuario();
    } else {
      setLoading(false);
    }
  }, []);

  const verificarUsuario = async () => {
    try {
      const response = await apiService.obtenerPerfil();
      setUsuario(response.usuario);
      setError(null);
    } catch (err) {
      localStorage.removeItem('authToken');
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await apiService.login(username, password);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('debeCambiarPassword', response.debe_cambiar_password ? '1' : '0');
      setDebeCambiarPassword(!!response.debe_cambiar_password);
      setUsuario(response.usuario);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const registrar = async (email, password, nombre) => {
    try {
      setLoading(true);
      await apiService.registrar(email, password, nombre);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('debeCambiarPassword');
    setDebeCambiarPassword(false);
    setUsuario(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, error, login, registrar, logout, debeCambiarPassword, setDebeCambiarPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
