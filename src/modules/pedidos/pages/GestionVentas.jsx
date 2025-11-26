// src/modules/pedidos/pages/GestionVentas.jsx
import React from 'react';
import Pedidos from '../Pedidos';

export default function GestionVentas() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Ventas</h1>
          <p className="text-gray-600 mt-2">Sistema de pedidos y ventas - All Season Flowers</p>
        </div>
        <Pedidos />
      </div>
    </div>
  );
}
