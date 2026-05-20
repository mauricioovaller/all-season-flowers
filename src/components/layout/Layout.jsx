// src/components/layout/Layout.jsx
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children, currentModule, onModuleChange }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-col lg:flex-row">
        <Sidebar 
          onModuleChange={onModuleChange} 
          currentModule={currentModule}
        />
        {/* Ajuste para móvil: añadir padding-top para evitar que el contenido quede debajo del menú móvil */}
        <main className="flex-1 min-w-0 overflow-x-hidden p-4 lg:p-6 mt-16 lg:mt-0 lg:ml-0 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;