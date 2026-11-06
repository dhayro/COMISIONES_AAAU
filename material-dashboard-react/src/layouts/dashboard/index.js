/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// Material Dashboard 2 React components
import MDBox from 'components/MDBox';

// Material Dashboard 2 React example components
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';

// Dashboards específicos por rol
import DashboardAdmin from 'pages/Dashboard/DashboardAdmin';
import DashboardUsuario from 'pages/Dashboard/DashboardUsuario';
import DashboardJefe from 'pages/Dashboard/DashboardJefe';
import DashboardVisitador from 'pages/Dashboard/DashboardVisitador';

// Context
import { useAuth } from 'context/AuthContext';

function Dashboard() {
  const { usuario } = useAuth();

  // Renderiza el dashboard según el rol del usuario
  if (usuario?.rol === 'admin') {
    return <DashboardAdmin />;
  }

  if (usuario?.rol === 'jefe') {
    return <DashboardJefe />;
  }

  if (usuario?.rol === 'administrativo') {
    return <DashboardVisitador />;
  }

  return <DashboardUsuario />;
}

export default Dashboard;
