//src/App.jsx

import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard/Dashboard';
import Pedidos from './modules/pedidos/Pedidos';
import './index.css';

function App() {
  const [currentModule, setCurrentModule] = useState('dashboard');

  const renderContent = () => {
    switch (currentModule) {
      case 'pedidos':
        return <Pedidos />;
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
