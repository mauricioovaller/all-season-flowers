//src/App.jsx

import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard/Dashboard';
import Ventas from './pages/Ventas/Ventas';
import './index.css';

function App() {
  const [currentModule, setCurrentModule] = useState('dashboard');

  const renderContent = () => {
    switch (currentModule) {
      case 'pedidos':
        return <Ventas />;
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
