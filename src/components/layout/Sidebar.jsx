// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { CLIENTE } from '../../config/cliente.js';
import {
  Users, Building, UserCheck, UserCog, Flower2, Sprout, Star, Package,
  Truck, UsersRound, Plane, BarChart3, ShoppingCart, CreditCard,
  FileText, Download,   LayoutDashboard, ChevronLeft, ChevronRight, Home, Undo2,
  Wallet, HandCoins, Menu, X, Trash2, ClipboardList
} from 'lucide-react';

const Sidebar = ({ onModuleChange, currentModule, rutasPermitidas, cargandoPermisos }) => {
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
    { id: 'pago-cliente', label: 'Pago Clientes', icon: <Wallet className="w-5 h-5" />, category: 'operativos', priority: 2 },
    { id: 'pago-proveedor', label: 'Pago Proveedores', icon: <HandCoins className="w-5 h-5" />, category: 'operativos', priority: 2 },
    { id: 'bajas', label: 'Bajas', icon: <Trash2 className="w-5 h-5" />, category: 'operativos', priority: 2 },

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
    { id: 'inventario', label: 'Inventarios', icon: <ClipboardList className="w-5 h-5" />, category: 'informes', priority: 3 },
  ];

  // Filtrar ítems del menú según permisos del usuario
  const menuItemsPermitidos = React.useMemo(() => {
    if (cargandoPermisos || !rutasPermitidas) return [];

    return menuItems.filter((item) => {
      if (item.type === 'header') return true;
      if (item.id === 'dashboard') return true;
      return rutasPermitidas.includes(`/${item.id}`);
    });
  }, [rutasPermitidas, cargandoPermisos, menuItems]);

  const handleItemClick = (itemId) => {
    if (onModuleChange) {
      onModuleChange(itemId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderMenuItems = (items) => {
    return items.map((item) => {
      if (item.type === 'header') {
        return (
          <li key={item.id} className={isCollapsed ? 'hidden' : 'pt-2'}>
            <div className="mx-1 mb-1">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 border-l-4 border-green-400">
                <span className="text-green-400">{item.icon}</span>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{item.label}</span>
              </div>
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
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md shadow-green-900/40' 
                : 'text-gray-300 hover:bg-slate-700 hover:text-white'
              }
            `}
          >
            <span className={`transition-transform group-hover:scale-110 ${currentModule === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
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

  // Filtros por categoría para menú móvil
  const itemsParaMobile = cargandoPermisos || !rutasPermitidas ? menuItems : menuItemsPermitidos;
  const dashboardMobileItems = itemsParaMobile.filter(item => item.category === 'dashboard');
  const maestrasMobileItems  = itemsParaMobile.filter(item => item.category === 'maestras');
  const operativosMobileItems = itemsParaMobile.filter(item => item.category === 'operativos');
  const informesMobileItems  = itemsParaMobile.filter(item => item.category === 'informes');
  const currentModuleLabel   = menuItems.find(item => item.id === currentModule)?.label || 'Inicio';

  return (
    <>
      {/* Sidebar para desktop */}
      <aside className={`
        hidden lg:flex flex-col bg-slate-800 shadow-2xl min-h-screen transition-all duration-300
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}>
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-slate-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/40">
                <span className="text-white font-bold text-sm">{CLIENTE.iniciales}</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">{CLIENTE.titulo}</h2>
                <p className="text-xs text-green-400 font-medium">{CLIENTE.lema}</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center">
              <div className="w-9 h-9 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/40">
                <span className="text-white font-bold text-sm">{CLIENTE.iniciales}</span>
              </div>
            </div>
          )}
        </div>

        {/* Menú de navegación */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {cargandoPermisos || !rutasPermitidas ? (
              <li className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400 mx-auto" />
                <p className="text-gray-500 text-xs mt-2">Cargando...</p>
              </li>
            ) : menuItemsPermitidos.length === 0 ? (
              <li className="p-4 text-center">
                <p className="text-gray-500 text-xs">Sin acceso</p>
              </li>
            ) : (
              renderMenuItems(menuItemsPermitidos)
            )}
          </ul>
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full p-3 text-gray-400 hover:bg-slate-700 hover:text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
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

      {/* Menú móvil - REDISEÑADO */}
      <div className="lg:hidden" id="mobile-menu">

        {/* Barra de cabecera - siempre visible */}
        <div className="bg-slate-800 shadow-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow shadow-green-900/40 flex-shrink-0">
              <span className="text-white font-bold text-xs">{CLIENTE.iniciales}</span>
            </div>
            <div className="min-w-0">
              <span className="text-white text-sm font-bold block leading-tight truncate">{CLIENTE.titulo}</span>
              <span className="text-green-400 text-xs font-medium truncate block">{currentModuleLabel}</span>
            </div>
          </div>
          <button
            onClick={() => setShowAllMobileItems(!showAllMobileItems)}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-gray-200 hover:text-white px-3 py-2 rounded-lg transition-colors flex-shrink-0 ml-3"
          >
            {showAllMobileItems ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="text-xs font-semibold">{showAllMobileItems ? 'Cerrar' : 'Menú'}</span>
          </button>
        </div>

        {/* Panel desplegable con secciones */}
        {showAllMobileItems && (
          <div className="bg-slate-900 border-t border-slate-700 px-4 py-4 space-y-5">

            {/* Dashboard */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Home className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Principal</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {dashboardMobileItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { handleItemClick(item.id); setShowAllMobileItems(false); }}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                      currentModule === item.id
                        ? 'bg-gradient-to-b from-green-600 to-emerald-700 text-white shadow-md shadow-green-900/40'
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="mb-1.5">{item.icon}</span>
                    <span className="text-[11px] text-center leading-tight font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tablas Maestras */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Tablas Maestras</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {maestrasMobileItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { handleItemClick(item.id); setShowAllMobileItems(false); }}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                      currentModule === item.id
                        ? 'bg-gradient-to-b from-green-600 to-emerald-700 text-white shadow-md shadow-green-900/40'
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="mb-1.5">{item.icon}</span>
                    <span className="text-[11px] text-center leading-tight font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Módulos Operativos */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Módulos Operativos</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {operativosMobileItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { handleItemClick(item.id); setShowAllMobileItems(false); }}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                      currentModule === item.id
                        ? 'bg-gradient-to-b from-green-600 to-emerald-700 text-white shadow-md shadow-green-900/40'
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="mb-1.5">{item.icon}</span>
                    <span className="text-[11px] text-center leading-tight font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Informes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Download className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Informes</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {informesMobileItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { handleItemClick(item.id); setShowAllMobileItems(false); }}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                      currentModule === item.id
                        ? 'bg-gradient-to-b from-green-600 to-emerald-700 text-white shadow-md shadow-green-900/40'
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="mb-1.5">{item.icon}</span>
                    <span className="text-[11px] text-center leading-tight font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;