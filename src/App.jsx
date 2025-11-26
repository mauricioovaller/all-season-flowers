import React, { useState } from 'react';
import Header from './components/ui/Header';
import Sidebar from './components/ui/Sidebar';
import GestionVentas from './modules/pedidos/pages/GestionVentas';
import './index.css';

function App() {
  const [currentModule, setCurrentModule] = useState('dashboard');

  const renderContent = () => {
    switch (currentModule) {
      case 'ventas':
        return <GestionVentas />;
      case 'dashboard':
      default:
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-white">🌺</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Bienvenido a All Season Flowers
              </h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Sistema de gestión integral para la empresa de follajes y ornamentales.
                Selecciona un módulo del menú para comenzar.
              </p>
              <div className="mt-6 bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg inline-block">
                <span className="font-semibold">Módulo prioritario: </span>
                Sistema de Ventas
              </div>
            </div>
          </div>
        );
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