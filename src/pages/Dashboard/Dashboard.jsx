 //src/pages/Dashboard/Dashboard.jsx

import React from 'react';

const Dashboard = () => {
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
};

export default Dashboard;
