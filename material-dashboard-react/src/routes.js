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

/** 
  All of the routes for the Material Dashboard 2 React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Material Dashboard 2 React layouts
import Dashboard from 'layouts/dashboard';
import Tables from 'layouts/tables';
import Billing from 'layouts/billing';
import RTL from 'layouts/rtl';
import Notifications from 'layouts/notifications';
import Profile from 'layouts/profile';
import SignIn from 'layouts/authentication/sign-in';
import SignUp from 'layouts/authentication/sign-up';

// Páginas de Comisiones
import ListarComisiones from 'pages/Comisiones/ListarComisiones';
import NuevaComision from 'pages/Comisiones/NuevaComision';
import DetallesComision from 'pages/Comisiones/DetallesComision';

// Páginas de Gestión
import {
  GestionAmbitos,
  GestionClasificadores,
  GestionUsuarios,
  GestionComisiones,
  GestionCorrelativos,
  GestionTipoComprobante,
  GestionProveedor,
  ValidarComprobante,
} from 'pages/Gestion';
import GestionCostosViaje from 'pages/Gestion/GestionCostosViaje';
import GestionMetas from 'pages/Gestion/GestionMetas';
import GestionFuentesFinanciamiento from 'pages/Gestion/GestionFuentesFinanciamiento';
import GestionCargos from 'pages/Gestion/GestionCargos';
import GestionFeriados from 'pages/Gestion/GestionFeriados';
import EmisionFormatos from 'pages/Gestion/EmisionFormatos';
import GestionCertificacionesCredito from 'pages/Gestion/GestionCertificacionesCredito';
import GestionCertificacionesFormatos from 'pages/Gestion/GestionCertificacionesFormatos';

// Páginas de Reportes
import ReportePresupuestos from 'pages/Reportes/ReportePresupuestos';
import ReportePresupuestoPendiente from 'pages/Reportes/ReportePresupuestoPendiente';

// Páginas de Aprobaciones
import GestionAprobaciones from 'pages/Aprobaciones/GestionAprobaciones';

// Página de Calendario
import Calendario from 'pages/Calendario/Calendario';

// Página de Test
import TestSunat from 'pages/Test/TestSunat';

// @mui icons
import Icon from '@mui/material/Icon';

/**
 * Función para filtrar rutas según el rol del usuario
 * Retorna solo las rutas que el usuario tiene permiso de ver
 */
function filtrarRutasPorRol(rolUsuario) {
  const rutasFiltradas = [];

  // Dashboard - TODOS LO VEN
  rutasFiltradas.push(allRoutes[0]); // Dashboard

  // JEFE: Comisiones, Reportes Pendientes, Reportes Asignados, Aprobaciones
  if (rolUsuario === 'jefe') {
    rutasFiltradas.push(
      { type: 'title', title: 'Gestión', key: 'gestion-title' },
      {
        type: 'collapse',
        name: 'Comisiones',
        key: 'gestion-comisiones',
        icon: <Icon fontSize="small">assignment</Icon>,
        route: '/gestion/comisiones',
        component: <GestionComisiones />,
      },
      {
        type: 'collapse',
        name: 'Certificaciones de Crédito',
        key: 'gestion-certificaciones-credito',
        icon: <Icon fontSize="small">verified_user</Icon>,
        route: '/gestion/certificaciones-credito',
        component: <GestionCertificacionesCredito />,
      },
      {
        type: 'collapse',
        name: 'Emisión de Formatos',
        key: 'emision-formatos',
        icon: <Icon fontSize="small">description</Icon>,
        route: '/gestion/emision-formatos',
        component: <EmisionFormatos />,
      },
      {
        type: 'collapse',
        name: 'Validar Comprobante',
        key: 'validar-comprobante',
        icon: <Icon fontSize="small">fact_check</Icon>,
        route: '/gestion/validar-comprobante',
        component: <ValidarComprobante />,
      },
      { type: 'title', title: 'Reportes', key: 'reportes-title' },
      {
        type: 'collapse',
        name: 'Presupuestos Asignados',
        key: 'reporte-presupuestos',
        icon: <Icon fontSize="small">assessment</Icon>,
        route: '/reportes/presupuestos',
        component: <ReportePresupuestos />,
      },
      {
        type: 'collapse',
        name: 'Presupuestos Pendientes',
        key: 'reporte-presupuestos-pendientes',
        icon: <Icon fontSize="small">pending_actions</Icon>,
        route: '/reportes/presupuestos-pendientes',
        component: <ReportePresupuestoPendiente />,
      },
      { type: 'title', title: 'Seguimiento', key: 'seguimiento-title' },
      {
        type: 'collapse',
        name: 'Aprobaciones',
        key: 'gestion-aprobaciones',
        icon: <Icon fontSize="small">check_circle</Icon>,
        route: '/aprobaciones',
        component: <GestionAprobaciones />,
      },
      { type: 'divider', key: 'divider-dev-jefe' },
      { type: 'title', title: 'Desarrollo', key: 'desarrollo-title-jefe' },
      {
        type: 'collapse',
        name: '🧪 Test SUNAT API',
        key: 'test-sunat-jefe',
        icon: <Icon fontSize="small">science</Icon>,
        route: '/test/sunat',
        component: <TestSunat />,
      }
    );
    return rutasFiltradas;
  }

  // USUARIO: Solo Comisiones, Emisión de Formatos y Calendario
  if (rolUsuario === 'usuario') {
    rutasFiltradas.push(
      { type: 'title', title: 'Gestión', key: 'gestion-title' },
      {
        type: 'collapse',
        name: 'Comisiones',
        key: 'gestion-comisiones',
        icon: <Icon fontSize="small">assignment</Icon>,
        route: '/gestion/comisiones',
        component: <GestionComisiones />,
      },
      {
        type: 'collapse',
        name: 'Emisión de Formatos',
        key: 'emision-formatos',
        icon: <Icon fontSize="small">description</Icon>,
        route: '/gestion/emision-formatos',
        component: <EmisionFormatos />,
      },
      {
        type: 'collapse',
        name: 'Validar Comprobante',
        key: 'validar-comprobante',
        icon: <Icon fontSize="small">fact_check</Icon>,
        route: '/gestion/validar-comprobante',
        component: <ValidarComprobante />,
      },
      { type: 'title', title: 'Seguimiento', key: 'seguimiento-title' },
      {
        type: 'collapse',
        name: 'Calendario',
        key: 'calendario',
        icon: <Icon fontSize="small">event</Icon>,
        route: '/calendario',
        component: <Calendario />,
      },
      { type: 'divider', key: 'divider-dev-usuario' },
      { type: 'title', title: 'Desarrollo', key: 'desarrollo-title-usuario' },
      {
        type: 'collapse',
        name: '🧪 Test SUNAT API',
        key: 'test-sunat-usuario',
        icon: <Icon fontSize="small">science</Icon>,
        route: '/test/sunat',
        component: <TestSunat />,
      }
    );
    return rutasFiltradas;
  }

  // ADMINISTRATIVO: Comisiones, Reportes Pendientes, Reportes Asignados, Calendario
  if (rolUsuario === 'administrativo') {
    rutasFiltradas.push(
      { type: 'title', title: 'Gestión', key: 'gestion-title' },
      {
        type: 'collapse',
        name: 'Comisiones',
        key: 'gestion-comisiones',
        icon: <Icon fontSize="small">assignment</Icon>,
        route: '/gestion/comisiones',
        component: <GestionComisiones />,
      },
      {
        type: 'collapse',
        name: 'Certificaciones de Crédito',
        key: 'gestion-certificaciones-credito',
        icon: <Icon fontSize="small">verified_user</Icon>,
        route: '/gestion/certificaciones-credito',
        component: <GestionCertificacionesCredito />,
      },
      {
        type: 'collapse',
        name: 'Emisión de Formatos',
        key: 'emision-formatos',
        icon: <Icon fontSize="small">description</Icon>,
        route: '/gestion/emision-formatos',
        component: <EmisionFormatos />,
      },
      {
        type: 'collapse',
        name: 'Validar Comprobante',
        key: 'validar-comprobante',
        icon: <Icon fontSize="small">fact_check</Icon>,
        route: '/gestion/validar-comprobante',
        component: <ValidarComprobante />,
      },
      {
        type: 'collapse',
        name: 'Gestión Certificaciones (Admin)',
        key: 'gestion-certificaciones-formatos',
        icon: <Icon fontSize="small">verified</Icon>,
        route: '/gestion/certificaciones-formatos',
        component: <GestionCertificacionesFormatos />,
      },
      { type: 'title', title: 'Reportes', key: 'reportes-title' },
      {
        type: 'collapse',
        name: 'Presupuestos Asignados',
        key: 'reporte-presupuestos',
        icon: <Icon fontSize="small">assessment</Icon>,
        route: '/reportes/presupuestos',
        component: <ReportePresupuestos />,
      },
      {
        type: 'collapse',
        name: 'Presupuestos Pendientes',
        key: 'reporte-presupuestos-pendientes',
        icon: <Icon fontSize="small">pending_actions</Icon>,
        route: '/reportes/presupuestos-pendientes',
        component: <ReportePresupuestoPendiente />,
      },
      { type: 'title', title: 'Seguimiento', key: 'seguimiento-title' },
      {
        type: 'collapse',
        name: 'Calendario',
        key: 'calendario',
        icon: <Icon fontSize="small">event</Icon>,
        route: '/calendario',
        component: <Calendario />,
      },
      { type: 'divider', key: 'divider-dev-admin' },
      { type: 'title', title: 'Desarrollo', key: 'desarrollo-title-admin' },
      {
        type: 'collapse',
        name: '🧪 Test SUNAT API',
        key: 'test-sunat-admin',
        icon: <Icon fontSize="small">science</Icon>,
        route: '/test/sunat',
        component: <TestSunat />,
      }
    );
    return rutasFiltradas;
  }

  // ADMIN: VE TODO
  return allRoutes;
}

/**
 * Todas las rutas disponibles en el sistema
 * Se filtran según el rol del usuario
 */
const allRoutes = [
  {
    type: 'collapse',
    name: 'Dashboard',
    key: 'dashboard',
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: '/dashboard',
    component: <Dashboard />,
  },
  {
    type: 'title',
    title: 'Gestión',
    key: 'gestion-title',
  },
  {
    type: 'collapse',
    name: 'Comisiones',
    key: 'gestion-comisiones',
    icon: <Icon fontSize="small">assignment</Icon>,
    route: '/gestion/comisiones',
    component: <GestionComisiones />,
  },
  {
    type: 'collapse',
    name: 'Certificaciones de Crédito',
    key: 'gestion-certificaciones-credito',
    icon: <Icon fontSize="small">verified_user</Icon>,
    route: '/gestion/certificaciones-credito',
    component: <GestionCertificacionesCredito />,
  },
  {
    type: 'collapse',
    name: 'Emisión de Formatos',
    key: 'emision-formatos',
    icon: <Icon fontSize="small">description</Icon>,
    route: '/gestion/emision-formatos',
    component: <EmisionFormatos />,
  },
  {
    type: 'collapse',
    name: 'Validar Comprobante',
    key: 'validar-comprobante',
    icon: <Icon fontSize="small">fact_check</Icon>,
    route: '/gestion/validar-comprobante',
    component: <ValidarComprobante />,
  },
  {
    type: 'collapse',
    name: 'Gestión Certificaciones (Admin)',
    key: 'gestion-certificaciones-formatos',
    icon: <Icon fontSize="small">verified</Icon>,
    route: '/gestion/certificaciones-formatos',
    component: <GestionCertificacionesFormatos />,
  },
  {
    type: 'collapse',
    name: 'Ámbitos',
    key: 'gestion-ambitos',
    icon: <Icon fontSize="small">location_on</Icon>,
    route: '/gestion/ambitos',
    component: <GestionAmbitos />,
  },
  {
    type: 'collapse',
    name: 'Clasificadores',
    key: 'gestion-clasificadores',
    icon: <Icon fontSize="small">category</Icon>,
    route: '/gestion/clasificadores',
    component: <GestionClasificadores />,
  },
  {
    type: 'collapse',
    name: 'Costos de Viaje',
    key: 'gestion-costos-viaje',
    icon: <Icon fontSize="small">local_taxi</Icon>,
    route: '/gestion/costos-viaje',
    component: <GestionCostosViaje />,
  },
  {
    type: 'collapse',
    name: 'Usuarios',
    key: 'gestion-usuarios',
    icon: <Icon fontSize="small">people</Icon>,
    route: '/gestion/usuarios',
    component: <GestionUsuarios />,
  },
  {
    type: 'collapse',
    name: 'Metas',
    key: 'gestion-metas',
    icon: <Icon fontSize="small">flag</Icon>,
    route: '/gestion/metas',
    component: <GestionMetas />,
  },
  {
    type: 'collapse',
    name: 'Fuentes de Financiamiento',
    key: 'gestion-fuentes-financiamiento',
    icon: <Icon fontSize="small">attach_money</Icon>,
    route: '/gestion/fuentes-financiamiento',
    component: <GestionFuentesFinanciamiento />,
  },
  {
    type: 'collapse',
    name: 'Cargos',
    key: 'gestion-cargos',
    icon: <Icon fontSize="small">badge</Icon>,
    route: '/gestion/cargos',
    component: <GestionCargos />,
  },
  {
    type: 'collapse',
    name: 'Feriados',
    key: 'gestion-feriados',
    icon: <Icon fontSize="small">event_busy</Icon>,
    route: '/gestion/feriados',
    component: <GestionFeriados />,
  },
  {
    type: 'collapse',
    name: 'Control de Correlativos',
    key: 'gestion-correlativos',
    icon: <Icon fontSize="small">numbers</Icon>,
    route: '/gestion/correlativos',
    component: <GestionCorrelativos />,
  },
  {
    type: 'collapse',
    name: 'Tipos de Comprobante',
    key: 'gestion-tipo-comprobante',
    icon: <Icon fontSize="small">receipt</Icon>,
    route: '/gestion/tipo-comprobante',
    component: <GestionTipoComprobante />,
  },
  {
    type: 'collapse',
    name: 'Proveedores',
    key: 'gestion-proveedores',
    icon: <Icon fontSize="small">local_shipping</Icon>,
    route: '/gestion/proveedores',
    component: <GestionProveedor />,
  },
  {
    type: 'title',
    title: 'Reportes',
    key: 'reportes-title',
  },
  {
    type: 'collapse',
    name: 'Presupuestos Asignados',
    key: 'reporte-presupuestos',
    icon: <Icon fontSize="small">assessment</Icon>,
    route: '/reportes/presupuestos',
    component: <ReportePresupuestos />,
  },
  {
    type: 'collapse',
    name: 'Presupuestos Pendientes',
    key: 'reporte-presupuestos-pendientes',
    icon: <Icon fontSize="small">pending_actions</Icon>,
    route: '/reportes/presupuestos-pendientes',
    component: <ReportePresupuestoPendiente />,
  },
  {
    type: 'title',
    title: 'Seguimiento',
    key: 'seguimiento-title',
  },
  {
    type: 'collapse',
    name: 'Aprobaciones',
    key: 'gestion-aprobaciones',
    icon: <Icon fontSize="small">check_circle</Icon>,
    route: '/aprobaciones',
    component: <GestionAprobaciones />,
  },
  {
    type: 'collapse',
    name: 'Calendario',
    key: 'calendario',
    icon: <Icon fontSize="small">event</Icon>,
    route: '/calendario',
    component: <Calendario />,
  },
  {
    type: 'divider',
    key: 'divider-dev',
  },
  {
    type: 'title',
    title: 'Desarrollo',
    key: 'desarrollo-title',
  },
  {
    type: 'collapse',
    name: '🧪 Test SUNAT API',
    key: 'test-sunat',
    icon: <Icon fontSize="small">science</Icon>,
    route: '/test/sunat',
    component: <TestSunat />,
  },
];

// Exportar la función para filtrar rutas y las rutas completas
export { filtrarRutasPorRol };
export default allRoutes;
