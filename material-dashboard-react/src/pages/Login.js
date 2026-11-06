import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CircularProgress } from '@mui/material';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import MDInput from 'components/MDInput';
import MDButton from 'components/MDButton';
import CoverLayout from 'layouts/authentication/components/CoverLayout';
import { useAuth } from 'context/AuthContext';
import bgImage from 'assets/images/bg-sign-in-basic.jpeg';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const success = await login(username, password);
    setLoading(false);

    if (success) {
      navigate('/dashboard');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <CoverLayout image={bgImage}>
      <Card>
        <MDBox
          variant="gradient"
          bgColor="info"
          borderRadius="lg"
          coloredShadow="info"
          mx={2}
          mt={-3}
          p={3}
          mb={1}
          textAlign="center"
        >
          <MDTypography variant="h4" fontWeight="bold" color="white" mt={1}>
            Gestión de Comisiones AAAU
          </MDTypography>
          <MDTypography display="block" variant="button" color="white" my={1}>
            Ingresa tu usuario y contraseña
          </MDTypography>
        </MDBox>

        <MDBox pt={4} pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit}>
            {error && (
              <MDBox mb={2}>
                <MDTypography variant="caption" color="error" fontWeight="bold">
                  {error}
                </MDTypography>
              </MDBox>
            )}

            <MDBox mb={2}>
              <MDInput
                type="text"
                label="Usuario"
                variant="standard"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </MDBox>

            <MDBox mb={2}>
              <MDInput
                type="password"
                label="Contraseña"
                variant="standard"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </MDBox>

            <MDBox mt={4} mb={1}>
              <MDButton variant="gradient" color="info" fullWidth type="submit" disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
              </MDButton>
            </MDBox>

            <MDBox mt={3} mb={1} textAlign="center">
              <MDTypography variant="button" color="text">
                © 2026 AAAU - Todos los derechos reservados
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </CoverLayout>
  );
}

export default Login;
