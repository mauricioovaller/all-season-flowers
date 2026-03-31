// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import {
  Users, Building, UserCheck, UserCog, Flower2, Sprout, Star, Package,
  Truck, UsersRound, Plane, BarChart3, ShoppingCart, CreditCard,
  FileText, Download, LayoutDashboard, ChevronLeft, ChevronRight, Home, Undo2, 
} from 'lucide-react';

const Sidebar = ({ onModuleChange, currentModule }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAllMobileItems, setShowAllMobileItems] = useState(false);

  const menuItems = [
    // DASHBOARD
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      category: 'dashboard',
      priority: 1 // Alta prioridad
    },

    // TABLAS MAESTRAS
    {
      id: 'tablas-maestras',
      label: 'Tablas Maestras',
      icon: <FileText className="w-5 h-5" />,
      type: 'header'
    },
    { id: 'clientes', label: 'Clientes', icon: <Users className="w-5 h-5" />, category: 'maestras', priority: 1 },
    { id: 'proveedores', label: 'Proveedores', icon: <Building className="w-5 h-5" />, category: 'maestras', priority: 1 },
    { id: 'ejecutivos-venta', label: 'Ejec. Venta', icon: <UserCheck className="w-5 h-5" />, category: 'maestras', priority: 2 },
    { id: 'ejecutivos-compra', label: 'Ejec. Compra', icon: <UserCog className="w-5 h-5" />, category: 'maestras', priority: 2 },
    { id: 'productos', label: 'Productos', icon: <Flower2 className="w-5 h-5" />, category: 'maestras', priority: 1 },
    { id: 'variedades', label: 'Variedades', icon: <Sprout className="w-5 h-5" />, category: 'maestras', priority: 1 },
    { id: 'grados', label: 'Grados', icon: <Star className="w-5 h-5" />, category: 'maestras', priority: 1 },
    { id: 'tipos-empaque', label: 'Empaques', icon: <Package className="w-5 h-5" />, category: 'maestras', priority: 2 },
    { id: 'conductores', label: 'Conductores', icon: <Truck className="w-5 h-5" />, category: 'maestras', priority: 1 },
    { id: 'ayudantes', label: 'Ayudantes', icon: <UsersRound className="w-5 h-5" />, category: 'maestras', priority: 1 },
    { id: 'aerolineas', label: 'Aerolíneas', icon: <Plane className="w-5 h-5" />, category: 'maestras', priority: 3 },
    { id: 'agencias', label: 'Agencias', icon: <Building className="w-5 h-5" />, category: 'maestras', priority: 3 },

    // MÓDULOS OPERATIVOS
    {
      id: 'modulos-operativos',
      label: 'Módulos Operativos',
      icon: <BarChart3 className="w-5 h-5" />,
      type: 'header'
    },
    { id: 'compras', label: 'Compras', icon: <ShoppingCart className="w-5 h-5" />, category: 'operativos', priority: 2 },
    { id: 'pedidos', label: 'Pedidos', icon: <CreditCard className="w-5 h-5" />, category: 'operativos', priority: 2 },
    { id: 'devolucion-venta', label: 'Devoluciones Ventas', icon: <Undo2 className="w-5 h-5" />, category: 'operativos', priority: 2 },
    { id: 'devolucion-compra', label: 'Devoluciones Compras', icon: <Undo2 className="w-5 h-5" />, category: 'operativos', priority: 2 },

    // INFORMES
    {
      id: 'informes',
      label: 'Informes',
      icon: <Download className="w-5 h-5" />,
      type: 'header'
    },
    { id: 'estado-cuenta-proveedores', label: 'Cuenta Prov.', icon: <FileText className="w-5 h-5" />, category: 'informes', priority: 3 },
    { id: 'estado-cuenta-clientes', label: 'Cuenta Clientes', icon: <FileText className="w-5 h-5" />, category: 'informes', priority: 3 },
    { id: 'consolidados-ventas', label: 'Cons. Ventas', icon: <BarChart3 className="w-5 h-5" />, category: 'informes', priority: 3 },
    { id: 'consolidados-compras', label: 'Cons. Compras', icon: <BarChart3 className="w-5 h-5" />, category: 'informes', priority: 3 },
    { id: 'exportacion-contable', label: 'Exportación', icon: <Download className="w-5 h-5" />, category: 'informes', priority: 3 },
    {id: 'tablero-control', label: 'Tablero Control', icon: <LayoutDashboard className="w-5 h-5" />, category: 'informes', priority: 3 },
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
              flex items-center space-x-3
              ${isCollapsed ? 'justify-center' : ''}
              ${currentModule === item.id 
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' 
                : 'hover:bg-gray-100 text-gray-700'
              }
            `}
          >
            <span className={`transition-transform group-hover:scale-110 ${currentModule === item.id ? 'text-white' : 'text-gray-600'}`}>
              {item.icon}
            </span>
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between">
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">
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

  // Filtrar items para móvil (prioridad 1 y 2 primero, luego el resto)
  const priorityMobileItems = menuItems.filter(item => 
    item.type !== 'header' && (item.priority === 1 || item.id === 'pedidos')
  );
  
  const secondaryMobileItems = menuItems.filter(item => 
    item.type !== 'header' && item.priority === 2 && item.id !== 'pedidos'
  );
  
  const otherMobileItems = menuItems.filter(item => 
    item.type !== 'header' && item.priority === 3
  );

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

      {/* Menú móvil - MEJORADO */}
      <div className="lg:hidden bg-white border-b border-gray-200 shadow-sm" id="mobile-menu">
        <div className="container mx-auto px-2 py-3">
          {/* Título del menú móvil */}
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-sm font-semibold text-gray-700">Navegación</h3>
            <button 
              onClick={() => setShowAllMobileItems(!showAllMobileItems)}
              className="text-xs text-primary font-medium hover:text-secondary"
            >
              {showAllMobileItems ? '↑ Ver menos' : '↓ Ver más'}
            </button>
          </div>

          {/* Tarjetas principales (siempre visibles) */}
          <div className="overflow-x-auto pb-2">
            <div className="flex space-x-2 px-2 min-w-max">
              {priorityMobileItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    flex flex-col items-center p-3 rounded-xl transition-all 
                    min-w-[85px] border
                    ${currentModule === item.id
                      ? 'bg-gradient-to-r from-primary to-secondary text-white border-primary shadow-md'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-xl mb-2">{item.icon}</span>
                  <span className={`text-xs font-medium text-center leading-tight whitespace-nowrap ${
                    currentModule === item.id ? 'text-white' : 'text-gray-700'
                  }`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="mt-1 bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded-full">
                      ⚡ PRIO
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tarjetas secundarias (visibles al expandir) */}
          {showAllMobileItems && (
            <>
              {/* Segunda fila - secundarios */}
              <div className="overflow-x-auto pb-2 mt-2">
                <div className="flex space-x-2 px-2 min-w-max">
                  {secondaryMobileItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`
                        flex flex-col items-center p-3 rounded-xl transition-all 
                        min-w-[85px] border
                        ${currentModule === item.id
                          ? 'bg-gradient-to-r from-primary to-secondary text-white border-primary shadow-md'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="text-xl mb-2">{item.icon}</span>
                      <span className={`text-xs font-medium text-center leading-tight whitespace-nowrap ${
                        currentModule === item.id ? 'text-white' : 'text-gray-700'
                      }`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tercera fila - otros */}
              <div className="overflow-x-auto pb-2 mt-2">
                <div className="flex space-x-2 px-2 min-w-max">
                  {otherMobileItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`
                        flex flex-col items-center p-3 rounded-xl transition-all 
                        min-w-[85px] border
                        ${currentModule === item.id
                          ? 'bg-gradient-to-r from-primary to-secondary text-white border-primary shadow-md'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="text-xl mb-2">{item.icon}</span>
                      <span className={`text-xs font-medium text-center leading-tight whitespace-nowrap ${
                        currentModule === item.id ? 'text-white' : 'text-gray-700'
                      }`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;