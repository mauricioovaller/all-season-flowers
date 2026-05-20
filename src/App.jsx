//src/App.jsx

import React, { useState } from 'react';
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
import './index.css';

function App() {
  const [currentModule, setCurrentModule] = useState('dashboard');

  const renderContent = () => {
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
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onModuleChange={setCurrentModule} />

      <div className="flex flex-col lg:flex-row">
        <Sidebar onModuleChange={setCurrentModule} />

        {/* Área principal de contenido */}
        <main className="flex-1 p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
