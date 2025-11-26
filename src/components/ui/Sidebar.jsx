// src/components/ui/Sidebar.jsx
import React, { useState } from 'react';
import {
  Users, Building, UserCheck, UserCog, Flower2, Sprout, Star, Package,
  Truck, UsersRound, Plane, BarChart3, ShoppingCart, CreditCard,
  FileText, Download, ChevronLeft, ChevronRight, Home
} from 'lucide-react';

const Sidebar = ({ onModuleChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    // DASHBOARD
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      category: 'dashboard'
    },

    // TABLAS MAESTRAS
    {
      id: 'tablas-maestras',
      label: 'Tablas Maestras',
      icon: <FileText className="w-5 h-5" />,
      type: 'header'
    },
    { id: 'clientes', label: 'Clientes', icon: <Users className="w-5 h-5" />, category: 'maestras' },
    { id: 'proveedores', label: 'Proveedores', icon: <Building className="w-5 h-5" />, category: 'maestras' },
    { id: 'ejecutivos-venta', label: 'Ejecutivos Venta', icon: <UserCheck className="w-5 h-5" />, category: 'maestras' },
    { id: 'ejecutivos-compra', label: 'Ejecutivos Compra', icon: <UserCog className="w-5 h-5" />, category: 'maestras' },
    { id: 'productos', label: 'Productos', icon: <Flower2 className="w-5 h-5" />, category: 'maestras' },
    { id: 'variedades', label: 'Variedades', icon: <Sprout className="w-5 h-5" />, category: 'maestras' },
    { id: 'grados', label: 'Grados', icon: <Star className="w-5 h-5" />, category: 'maestras' },
    { id: 'tipos-empaque', label: 'Tipos Empaque', icon: <Package className="w-5 h-5" />, category: 'maestras' },
    { id: 'conductores', label: 'Conductores', icon: <Truck className="w-5 h-5" />, category: 'maestras' },
    { id: 'ayudantes', label: 'Ayudantes', icon: <UsersRound className="w-5 h-5" />, category: 'maestras' },
    { id: 'aerolineas', label: 'Aerolíneas', icon: <Plane className="w-5 h-5" />, category: 'maestras' },
    { id: 'agencias', label: 'Agencias', icon: <Building className="w-5 h-5" />, category: 'maestras' },

    // MÓDULOS OPERATIVOS
    {
      id: 'modulos-operativos',
      label: 'Módulos Operativos',
      icon: <BarChart3 className="w-5 h-5" />,
      type: 'header'
    },
    { id: 'compras', label: 'Compras', icon: <ShoppingCart className="w-5 h-5" />, category: 'operativos' },
    {
      id: 'ventas',
      label: 'Ventas',
      icon: <CreditCard className="w-5 h-5" />,
      category: 'operativos',
      badge: '⚡ PRIORIDAD'
    },

    // INFORMES
    {
      id: 'informes',
      label: 'Informes',
      icon: <Download className="w-5 h-5" />,
      type: 'header'
    },
    { id: 'estado-cuenta-proveedores', label: 'Estado Cuenta Prov.', icon: <FileText className="w-5 h-5" />, category: 'informes' },
    { id: 'estado-cuenta-clientes', label: 'Estado Cuenta Clientes', icon: <FileText className="w-5 h-5" />, category: 'informes' },
    { id: 'consolidados-ventas', label: 'Consolidados Ventas', icon: <BarChart3 className="w-5 h-5" />, category: 'informes' },
    { id: 'consolidados-compras', label: 'Consolidados Compras', icon: <BarChart3 className="w-5 h-5" />, category: 'informes' },
    { id: 'exportacion-contable', label: 'Exportación Contable', icon: <Download className="w-5 h-5" />, category: 'informes' },
  ];

  const handleItemClick = (itemId) => {
    if (onModuleChange) {
      onModuleChange(itemId);
    }
  };

  const renderMenuItems = (items) => {
    return items.map((item) => {
      if (item.type === 'header') {
        return (
          <li key={item.id} className={isCollapsed ? 'hidden' : ''}>
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {item.label}
            </div>
          </li>
        );
      }

      return (
        <li key={item.id}>
          <button 
            onClick={() => handleItemClick(item.id)}
            className={`
              w-full text-left p-3 rounded-xl transition-all duration-200 group
              hover:bg-primary hover:text-white hover:shadow-md
              flex items-center space-x-3
              ${isCollapsed ? 'justify-center' : ''}
              ${item.id === 'ventas' ? 'border-l-4 border-accent bg-green-50' : ''}
            `}
          >
            <span className="text-xl transition-transform group-hover:scale-110">
              {item.icon}
            </span>
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between">
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="bg-accent text-gray-800 text-xs px-2 py-1 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
            )}
          </button>
        </li>
      );
    });
  };

  return (
    <>
      {/* Sidebar para desktop */}
      <aside className={`
        hidden lg:flex flex-col bg-white shadow-xl min-h-screen transition-all duration-300
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}>
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-100">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AS</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">All Season Flowers</h2>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AS</span>
              </div>
            </div>
          )}
        </div>

        {/* Menú de navegación */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {renderMenuItems(menuItems)}
          </ul>
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span>Colapsar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Menú móvil simplificado */}
      <div className="lg:hidden bg-white border-b border-gray-200">
        <div className="overflow-x-auto">
          <div className="flex space-x-1 p-2 min-w-max">
            {menuItems
              .filter(item => item.type !== 'header' && item.id !== 'tablas-maestras' && item.id !== 'modulos-operativos' && item.id !== 'informes')
              .slice(0, 8) // Mostrar solo los principales en móvil
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all min-w-[70px] ${
                    item.id === 'ventas'
                      ? 'bg-primary text-white shadow-md'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl mb-1">{item.icon}</span>
                  <span className="text-xs font-medium text-center leading-tight">
                    {item.label.split(' ')[0]}
                  </span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;