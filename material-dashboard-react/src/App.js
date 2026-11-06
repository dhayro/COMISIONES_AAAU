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

import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Icon from '@mui/material/Icon';
import MDBox from 'components/MDBox';
import Sidenav from 'examples/Sidenav';
import Configurator from 'examples/Configurator';
import theme from 'assets/theme';
import themeRTL from 'assets/theme/theme-rtl';
import themeDark from 'assets/theme-dark';
import themeDarkRTL from 'assets/theme-dark/theme-rtl';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import routes, { filtrarRutasPorRol } from 'routes';
import { useMaterialUIController, setMiniSidenav, setOpenConfigurator } from 'context';
import brandWhite from 'assets/images/logo-ct.png';
import brandDark from 'assets/images/logo-ct-dark.png';
import { AuthProvider, useAuth } from 'context/AuthContext';
import Login from 'pages/Login';
import ProtectedRoute from 'components/ProtectedRoute';
import CambiarPassword from 'pages/CambiarPassword';
import NuevaComision from 'pages/Comisiones/NuevaComision';
import DetallesComision from 'pages/Comisiones/DetallesComision';
import TestSunat from 'pages/Test/TestSunat';

// Componente principal (usa AuthProvider)
function AppContent() {
  const [controller, dispatch] = useMaterialUIController();
  const {
    miniSidenav,
    direction,
    layout,
    openConfigurator,
    sidenavColor,
    transparentSidenav,
    whiteSidenav,
    darkMode,
  } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  // Cache for the rtl
  useMemo(() => {
    const cacheRtl = createCache({
      key: 'rtl',
      stylisPlugins: [rtlPlugin],
    });
    setRtlCache(cacheRtl);
  }, []);

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Change the openConfigurator state
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // Actualizar localStorage cuando navegamos a páginas de gestión
  useEffect(() => {
    if (pathname.startsWith('/gestion/')) {
      localStorage.setItem('lastPage', pathname);
    }
  }, [pathname]);

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute('dir', direction);
  }, [direction]);

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes
      .map((route) => {
        if (route.collapse) {
          return getRoutes(route.collapse);
        }

        if (route.route) {
          return (
            <Route
              path={route.route}
              element={<ProtectedRoute>{route.component}</ProtectedRoute>}
              key={route.key}
            />
          );
        }

        return null;
      })
      .flat();

  // Dynamic routes para comisiones
  const getDynamicRoutes = () => [
    <Route
      path="/comisiones/nueva"
      element={
        <ProtectedRoute>
          <NuevaComision />
        </ProtectedRoute>
      }
      key="comisiones-nueva"
    />,
    <Route
      path="/comisiones/:id"
      element={
        <ProtectedRoute>
          <DetallesComision />
        </ProtectedRoute>
      }
      key="comisiones-detalle"
    />,
    <Route
      path="/comisiones/:id/editar"
      element={
        <ProtectedRoute>
          <NuevaComision />
        </ProtectedRoute>
      }
      key="comisiones-editar"
    />,
  ];

  const configsButton = (
    <MDBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.25rem"
      height="3.25rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: 'pointer' }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="small" color="inherit">
        settings
      </Icon>
    </MDBox>
  );

  // Si no está autenticado, mostrar login
  if (!usuario) {
    return (
      <ThemeProvider theme={darkMode ? themeDark : theme}>
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/cambiar-password"
            element={
              <ProtectedRoute>
                <CambiarPassword />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </ThemeProvider>
    );
  }

  // Si está autenticado, mostrar dashboard
  // Filtrar rutas según el rol del usuario
  const rutasFiltradas = usuario?.rol ? filtrarRutasPorRol(usuario.rol) : routes;

  return direction === 'rtl' ? (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={darkMode ? themeDarkRTL : themeRTL}>
        <CssBaseline />
        {layout === 'dashboard' && (
          <>
            <Sidenav
              color={sidenavColor}
              brand={(transparentSidenav && !darkMode) || whiteSidenav ? brandDark : brandWhite}
              brandName="Gestión Comisiones"
              routes={rutasFiltradas}
              onMouseEnter={handleOnMouseEnter}
              onMouseLeave={handleOnMouseLeave}
            />
            <Configurator />
            {configsButton}
          </>
        )}
        {layout === 'vr' && <Configurator />}
        <Routes>
          {getRoutes(rutasFiltradas)}
          {getDynamicRoutes()}
          <Route path="/test/sunat" element={<TestSunat />} />
          <Route path="/cambiar-password" element={<ProtectedRoute><CambiarPassword /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </ThemeProvider>
    </CacheProvider>
  ) : (
    <ThemeProvider theme={darkMode ? themeDark : theme}>
      <CssBaseline />
      {layout === 'dashboard' && (
        <>
          <Sidenav
            color={sidenavColor}
            brand={(transparentSidenav && !darkMode) || whiteSidenav ? brandDark : brandWhite}
            brandName="Gestión Comisiones"
            routes={rutasFiltradas}
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
          />
          <Configurator />
          {configsButton}
        </>
      )}
      {layout === 'vr' && <Configurator />}
      <Routes>
        {getRoutes(rutasFiltradas)}
        {getDynamicRoutes()}
        <Route path="/test/sunat" element={<TestSunat />} />
        <Route path="/cambiar-password" element={<ProtectedRoute><CambiarPassword /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </ThemeProvider>
  );
}

// App con AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
