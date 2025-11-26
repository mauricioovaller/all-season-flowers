import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children, currentModule, onModuleChange }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar 
          onModuleChange={onModuleChange} 
          currentModule={currentModule}
        />
        <main className="flex-1 p-6 lg:ml-0 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;