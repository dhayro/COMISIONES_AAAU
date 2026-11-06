import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Card,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import MDButton from 'components/MDButton';
import api from 'services/api';
import { useAuth } from 'context/AuthContext';

const REQUISITOS = [
  { id: 'longitud', texto: 'Al menos 8 caracteres', cumple: (p) => p.length >= 8 },
  { id: 'letra', texto: 'Contiene letras', cumple: (p) => /[A-Za-z]/.test(p) },
  { id: 'numero', texto: 'Contiene números', cumple: (p) => /\d/.test(p) },
  { id: 'simbolo', texto: 'Un símbolo o mayúscula (recomendado)', cumple: (p) => /[^A-Za-z0-9]|[A-Z]/.test(p) },
];

const iniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';

const animacionEntrada = {
  '@keyframes fadeUp': {
    from: { opacity: 0, transform: 'translateY(12px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  animation: 'fadeUp 0.4s ease-out',
};

function CambiarPassword() {
  const navigate = useNavigate();
  const { usuario, logout, setDebeCambiarPassword } = useAuth();
  const [formData, setFormData] = useState({ password_actual: '', password_nueva: '', confirmar: '' });
  const [mostrar, setMostrar] = useState({ actual: false, nueva: false, confirmar: false });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);

  const cumplidos = useMemo(
    () => REQUISITOS.map((r) => ({ ...r, ok: r.cumple(formData.password_nueva) })),
    [formData.password_nueva]
  );
  const puntaje = cumplidos.filter((r) => r.ok).length;
  const progreso = (puntaje / REQUISITOS.length) * 100;
  const colorFuerza = puntaje <= 1 ? 'error' : puntaje <= 2 ? 'warning' : 'success';
  const textoFuerza = puntaje <= 1 ? 'Débil' : puntaje <= 2 ? 'Aceptable' : 'Fuerte';
  const coinciden = formData.confirmar.length > 0 && formData.password_nueva === formData.confirmar;
  const puedeGuardar =
    !guardando &&
    formData.password_actual &&
    formData.password_nueva.length >= 8 &&
    formData.confirmar &&
    formData.password_nueva === formData.confirmar;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const toggleMostrar = (clave) => setMostrar((prev) => ({ ...prev, [clave]: !prev[clave] }));

  const handleGuardar = async () => {
    setError('');
    if (formData.password_nueva !== formData.confirmar) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    setGuardando(true);
    try {
      await api.request('/auth/cambiar-password', {
        method: 'POST',
        body: JSON.stringify({
          password_actual: formData.password_actual,
          password_nueva: formData.password_nueva,
        }),
      });
      localStorage.setItem('debeCambiarPassword', '0');
      setDebeCambiarPassword(false);
      setExito(true);
      setTimeout(() => navigate('/dashboard', { replace: true }), 1600);
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la contraseña.');
      setGuardando(false);
    }
  };

  const campo = (name, label, clave, valor, autoComplete) => (
    <TextField
      fullWidth
      name={name}
      label={label}
      type={mostrar[clave] ? 'text' : 'password'}
      value={valor}
      onChange={handleChange}
      autoComplete={autoComplete}
      sx={{ mb: 2 }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={mostrar[clave] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => toggleMostrar(clave)}
              edge="end"
            >
              {mostrar[clave] ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'linear-gradient(135deg, #1A73E8 0%, #6C63FF 100%)',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 460,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          ...animacionEntrada,
        }}
      >
        {exito ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold">
              ¡Contraseña actualizada!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Te estamos llevando al sistema…
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: '#E8F0FE',
                  color: '#1A73E8',
                  fontWeight: 'bold',
                  fontSize: '1.4rem',
                }}
              >
                {usuario?.nombre ? iniciales(usuario.nombre) : <LockOutlinedIcon fontSize="large" />}
              </Avatar>
              <Typography variant="h5" fontWeight="bold">
                {usuario?.nombre ? `Hola, ${usuario.nombre.split(' ')[0]}` : 'Crea tu nueva contraseña'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Tu contraseña es temporal. Elige una nueva para continuar.
              </Typography>
              {usuario?.username && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Usuario: <strong>{usuario.username}</strong>
                </Typography>
              )}
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {campo('password_actual', 'Contraseña temporal o actual', 'actual', formData.password_actual, 'current-password')}
            {campo('password_nueva', 'Nueva contraseña', 'nueva', formData.password_nueva, 'new-password')}

            {formData.password_nueva && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Seguridad</Typography>
                  <Typography variant="caption" fontWeight="bold" color={`${colorFuerza}.main`}>
                    {textoFuerza}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progreso}
                  color={colorFuerza}
                  sx={{ height: 6, borderRadius: 3, transition: 'all 0.3s' }}
                />
              </Box>
            )}

            <Box sx={{ mb: 2, pl: 0.5 }}>
              {cumplidos.map((r) => (
                <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  {r.ok ? (
                    <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  )}
                  <Typography variant="caption" color={r.ok ? 'text.primary' : 'text.secondary'}>
                    {r.texto}
                  </Typography>
                </Box>
              ))}
            </Box>

            {campo('confirmar', 'Confirmar nueva contraseña', 'confirmar', formData.confirmar, 'new-password')}
            {formData.confirmar && (
              <Typography
                variant="caption"
                sx={{ display: 'block', mb: 2 }}
                color={coinciden ? 'success.main' : 'error.main'}
              >
                {coinciden ? '✔ Las contraseñas coinciden' : '✖ Las contraseñas no coinciden'}
              </Typography>
            )}

            <MDButton
              variant="gradient"
              color="info"
              fullWidth
              size="large"
              onClick={handleGuardar}
              disabled={!puedeGuardar}
              sx={{ mt: 1, mb: 2 }}
            >
              {guardando ? 'Guardando…' : 'Guardar y continuar'}
            </MDButton>

            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="body2"
                color="text.secondary"
                onClick={logout}
                sx={{ cursor: 'pointer', textDecoration: 'underline', '&:hover': { color: 'error.main' } }}
              >
                Cerrar sesión
              </Typography>
            </Box>
          </>
        )}
      </Card>
    </Box>
  );
}

export default CambiarPassword;
