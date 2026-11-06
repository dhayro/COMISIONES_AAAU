import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from 'context/AuthContext';

function ProtectedRoute({ children }) {
  const { usuario, loading, debeCambiarPassword } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (debeCambiarPassword && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
