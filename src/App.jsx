//src/App.jsx

import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard/Dashboard';
import Pedidos from './modules/pedidos/Pedidos';
import Devoluciones from './modules/devoluciones/Devoluciones';
import DevolucionesCompras from './modules/devolucionesCompras/DevolucionesCompras';
import Compras from './modules/compras/Compras';
import PagosClientes from './modules/pagosClientes/PagosClientes';
import PagosProveedores from './modules/pagosProveedores/PagosProveedores';
import Clientes from './pages/Clientes/Clientes';
import Productos from './pages/Productos/Productos';
import Variedades from './pages/Variedades/Variedades';
import Grados from './pages/Grados/Grados';
import Conductores from './pages/Conductores/Conductores';
import Ayudantes from './pages/Ayudantes/Ayudantes';
import Proveedores from './pages/Proveedores/Proveedores';
import DashboardAllSeason from './components/dashboard/DashboardAllSeason.jsx';
import EjecutivosVenta from './pages/EjecutivosVenta/EjecutivosVenta';
import EjecutivosCompras from './pages/EjecutivosCompras/EjecutivosCompras';
import Empaques from './pages/Empaques/Empaques';
import Aerolineas from './pages/Aerolineas/Aerolineas';
import Agencias from './pages/Agencias/Agencias';
import EstadoCuentaCliente from './pages/Reportes/EstadoCuentaCliente';
import EstadoCuentaProveedor from './pages/Reportes/EstadoCuentaProveedor';
import Bajas from './modules/bajas/Bajas';
import Inventario from './pages/Reportes/Inventario';
import PlanillaDespacho from './pages/Reportes/PlanillaDespacho';
import SolicitudMuiscas from './pages/Reportes/SolicitudMuiscas';
import ConsolidadoVentas from './pages/Reportes/ConsolidadoVentas';
import ConsolidadoCompras from './pages/Reportes/ConsolidadoCompras';
import ConsolidadoDevolucionesClientes from './pages/Reportes/ConsolidadoDevolucionesClientes';
import ConsolidadoDevolucionesProveedores from './pages/Reportes/ConsolidadoDevolucionesProveedores';
import ConsolidadoIngresosRecibidos from './pages/Reportes/ConsolidadoIngresosRecibidos';
import GestionLegacy from './pages/Reportes/GestionLegacy';
import PedidosComision from './modules/ventasComision/pedidos/PedidosComision';
import DevolucionesComision from './modules/ventasComision/devoluciones/DevolucionesComision';
import CuentaCobro from './modules/ventasComision/cuentaCobro/CuentaCobro';
import { getPermisos } from './services/permisos/permisosService';
import './index.css';

function App() {
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [rutasPermitidas, setRutasPermitidas] = useState(null);
  const [cargandoPermisos, setCargandoPermisos] = useState(true);

  useEffect(() => {
    getPermisos().then((rutas) => {
      setRutasPermitidas(rutas);
      setCargandoPermisos(false);
    });
  }, []);

  const tienePermiso = (moduloId) => {
    if (moduloId === 'dashboard') return true;
    if (!rutasPermitidas) return true;
    if (cargandoPermisos) return true;
    return rutasPermitidas.includes(`/${moduloId}`);
  };

  const renderContent = () => {
    if (cargandoPermisos) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
            <p className="text-gray-500 text-sm">Cargando permisos...</p>
          </div>
        </div>
      );
    }

    if (!tienePermiso(currentModule) && currentModule !== 'dashboard') {
      return <Dashboard />;
    }

    switch (currentModule) {
      case 'pedidos':
        return <Pedidos />;
      case 'devolucion-venta':
        return <Devoluciones />;
      case 'devolucion-compra':
        return <DevolucionesCompras />;
      case 'compras':
        return <Compras />;
      case 'pago-cliente':
        return <PagosClientes />;
      case 'pago-proveedor':
        return <PagosProveedores />;
      case 'clientes':
        return <Clientes />;
      case 'productos':
        return <Productos />;
      case 'variedades':
        return <Variedades />;
      case 'grados':
        return <Grados />;
      case 'conductores':
        return <Conductores />;
      case 'ayudantes':
        return <Ayudantes />;
      case 'proveedores':
        return <Proveedores />;
      case 'tablero-control':
        return <DashboardAllSeason />;
      case 'estado-cuenta-clientes':
        return <EstadoCuentaCliente />;
      case 'estado-cuenta-proveedores':
        return <EstadoCuentaProveedor />;
      case 'bajas':
        return <Bajas />;
      case 'inventario':
        return <Inventario />;
      case 'planilla-despacho':
        return <PlanillaDespacho />;
      case 'solicitud-muiscas':
        return <SolicitudMuiscas />;
      case 'ejecutivos-venta':
        return <EjecutivosVenta />;
      case 'ejecutivos-compra':
        return <EjecutivosCompras />;
      case 'tipos-empaque':
        return <Empaques />;
      case 'aerolineas':
        return <Aerolineas />;
      case 'agencias':
        return <Agencias />;
      case 'consolidados-ventas':
        return <ConsolidadoVentas />;
      case 'consolidados-compras':
        return <ConsolidadoCompras />;
      case 'consolidados-devoluciones-clientes':
        return <ConsolidadoDevolucionesClientes />;
      case 'consolidados-devoluciones-proveedores':
        return <ConsolidadoDevolucionesProveedores />;
      case 'consolidados-ingresos-recibidos':
        return <ConsolidadoIngresosRecibidos />;
      case 'gestion-legacy':
        return <GestionLegacy />;
      case 'pedidos-comision':
        return <PedidosComision />;
      case 'devoluciones-comision':
        return <DevolucionesComision />;
      case 'cuenta-cobro':
        return <CuentaCobro />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onModuleChange={setCurrentModule} />

      <div className="flex flex-col lg:flex-row">
        <Sidebar
          onModuleChange={setCurrentModule}
          currentModule={currentModule}
          rutasPermitidas={rutasPermitidas}
          cargandoPermisos={cargandoPermisos}
        />

        <main className="flex-1 p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
