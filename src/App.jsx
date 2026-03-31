//src/App.jsx

import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard/Dashboard';
import Pedidos from './modules/pedidos/Pedidos';
import Devoluciones from './modules/devoluciones/Devoluciones';
import DevolucionesCompras from './modules/devolucionesCompras/DevolucionesCompras';
import Compras from './modules/compras/Compras';
import Clientes from './pages/Clientes/Clientes';
import Productos from './pages/Productos/Productos';
import Variedades from './pages/Variedades/Variedades';
import Grados from './pages/Grados/Grados';
import Conductores from './pages/Conductores/Conductores';
import Ayudantes from './pages/Ayudantes/Ayudantes';
import Proveedores from './pages/Proveedores/Proveedores';
import DashboardAllSeason from './components/dashboard/DashboardAllSeason.jsx';
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
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

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
