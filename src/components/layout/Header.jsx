// src/components/layout/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { CLIENTE } from '../../config/cliente.js';
import Swal from 'sweetalert2';
import {
  Search, Bell, User, LogOut, X, ChevronRight,
  Home, Users, Building, UserCheck, UserCog, Flower2, Sprout, Star,
  Package, Truck, UsersRound, Plane, ShoppingCart, CreditCard, Undo2,
  Wallet, HandCoins, FileText, BarChart3, Download, LayoutDashboard,
  Trash2, ClipboardList,
} from 'lucide-react';

// ── Índice de módulos para búsqueda ─────────────────────────────────────────
const MODULES = [
  { id: 'dashboard',                 label: 'Dashboard',              cat: 'Principal',  Icon: Home,            catColor: 'text-green-400 bg-green-400/10'     },
  { id: 'clientes',                  label: 'Clientes',               cat: 'Maestras',   Icon: Users,           catColor: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'proveedores',               label: 'Proveedores',            cat: 'Maestras',   Icon: Building,        catColor: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'ejecutivos-venta',          label: 'Ejec. de Venta',         cat: 'Maestras',   Icon: UserCheck,       catColor: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'ejecutivos-compra',         label: 'Ejec. de Compra',        cat: 'Maestras',   Icon: UserCog,         catColor: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'productos',                 label: 'Productos',              cat: 'Maestras',   Icon: Flower2,         catColor: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'variedades',                label: 'Variedades',             cat: 'Maestras',   Icon: Sprout,          catColor: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'grados',                    label: 'Grados',                 cat: 'Maestras',   Icon: Star,            catColor: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'tipos-empaque',             label: 'Empaques',               cat: 'Maestras',   Icon: Package,         catColor: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'conductores',               label: 'Conductores',            cat: 'Maestras',   Icon: Truck,           catColor: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'ayudantes',                 label: 'Ayudantes',              cat: 'Maestras',   Icon: UsersRound,      catColor: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'aerolineas',                label: 'Aerolíneas',             cat: 'Maestras',   Icon: Plane,           catColor: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'agencias',                  label: 'Agencias',               cat: 'Maestras',   Icon: Building,        catColor: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'compras',                   label: 'Compras',                cat: 'Operativos', Icon: ShoppingCart,    catColor: 'text-blue-400 bg-blue-400/10'       },
  { id: 'pedidos',                   label: 'Pedidos',                cat: 'Operativos', Icon: CreditCard,      catColor: 'text-blue-400 bg-blue-400/10'       },
  { id: 'devolucion-venta',          label: 'Devoluciones Ventas',    cat: 'Operativos', Icon: Undo2,           catColor: 'text-blue-400 bg-blue-400/10'       },
  { id: 'devolucion-compra',         label: 'Devoluciones Compras',   cat: 'Operativos', Icon: Undo2,           catColor: 'text-blue-400 bg-blue-400/10'       },
  { id: 'pago-cliente',              label: 'Pagos a Clientes',       cat: 'Operativos', Icon: Wallet,          catColor: 'text-blue-400 bg-blue-400/10'       },
  { id: 'pago-proveedor',            label: 'Pagos a Proveedores',    cat: 'Operativos', Icon: HandCoins,       catColor: 'text-blue-400 bg-blue-400/10'       },
  { id: 'bajas',                     label: 'Bajas de Producto',      cat: 'Operativos', Icon: Trash2,          catColor: 'text-blue-400 bg-blue-400/10'       },
  { id: 'estado-cuenta-proveedores', label: 'Cuenta Proveedores',     cat: 'Informes',   Icon: FileText,        catColor: 'text-amber-400 bg-amber-400/10'     },
  { id: 'estado-cuenta-clientes',    label: 'Cuenta Clientes',        cat: 'Informes',   Icon: FileText,        catColor: 'text-amber-400 bg-amber-400/10'     },
  { id: 'consolidados-ventas',       label: 'Consolidados Ventas',    cat: 'Informes',   Icon: BarChart3,       catColor: 'text-amber-400 bg-amber-400/10'     },
  { id: 'consolidados-compras',      label: 'Consolidados Compras',   cat: 'Informes',   Icon: BarChart3,       catColor: 'text-amber-400 bg-amber-400/10'     },
  { id: 'exportacion-contable',      label: 'Exportación Contable',   cat: 'Informes',   Icon: Download,        catColor: 'text-amber-400 bg-amber-400/10'     },
  { id: 'tablero-control',           label: 'Tablero de Control',     cat: 'Informes',   Icon: LayoutDashboard, catColor: 'text-amber-400 bg-amber-400/10'     },
  { id: 'inventario',                label: 'Inventarios',            cat: 'Informes',   Icon: ClipboardList,   catColor: 'text-amber-400 bg-amber-400/10'     },
];

const Header = ({ onModuleChange }) => {
  const [query,    setQuery]    = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const desktopRef = useRef(null);
  const mobileRef  = useRef(null);

  // Cierra el dropdown al hacer clic fuera de ambas barras de búsqueda
  useEffect(() => {
    const handler = (e) => {
      if (
        !desktopRef.current?.contains(e.target) &&
        !mobileRef.current?.contains(e.target)
      ) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results = query.trim()
    ? MODULES.filter(m =>
        m.label.toLowerCase().includes(query.toLowerCase()) ||
        m.cat.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (id) => {
    if (onModuleChange) onModuleChange(id);
    setQuery('');
    setShowDrop(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    setShowDrop(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setQuery(''); setShowDrop(false); }
  };

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que deseas salir de la aplicación?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        sessionStorage.clear();
        Swal.fire({
          title: 'Sesión cerrada',
          text: 'Redirigiendo a la página de autenticación...',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
          willClose: () => { window.location.href = 'https://portal.datenbankensoluciones.com.co/'; },
        });
      }
    });
  };

  // JSX del dropdown (reutilizado en desktop y móvil)
  const dropdownJSX = showDrop && query.trim() ? (
    <div className="absolute top-full mt-1.5 left-0 right-0 bg-slate-700 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
      {results.length > 0 ? (
        <ul className="py-1.5">
          {results.map(m => (
            <li key={m.id}>
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleSelect(m.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-600 transition-colors text-left group"
              >
                <span className="text-gray-400 group-hover:text-white flex-shrink-0">
                  <m.Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 text-gray-200 text-sm font-medium group-hover:text-white">{m.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${m.catColor}`}>{m.cat}</span>
                <ChevronRight className="w-3 h-3 text-gray-500 group-hover:text-gray-300 flex-shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-6 text-center">
          <Search className="w-6 h-6 mx-auto mb-2 text-gray-500" />
          <p className="text-gray-400 text-sm">
            Sin resultados para{' '}
            <span className="text-white font-medium">"{query}"</span>
          </p>
        </div>
      )}
    </div>
  ) : null;

  return (
    <header className="bg-slate-800 shadow-xl border-b border-slate-700 sticky top-0 z-40">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">

          {/* ── Logo + marca ── */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-16 h-16 bg-white rounded-xl shadow-lg overflow-hidden border border-slate-600 flex-shrink-0 flex items-center justify-center">
              <img
                src={CLIENTE.logoPath}
                alt={CLIENTE.titulo}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div
                className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 items-center justify-center"
                style={{ display: 'none' }}
              >
                <span className="text-white font-extrabold text-lg">{CLIENTE.iniciales}</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-base lg:text-lg leading-tight">{CLIENTE.titulo}</p>
              <p className="text-green-400 text-xs lg:text-sm font-medium">{CLIENTE.lema}</p>
            </div>
          </div>

          {/* ── Buscador desktop ── */}
          <div className="hidden lg:block flex-1 max-w-lg">
            <div className="relative" ref={desktopRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={handleChange}
                onFocus={() => query.trim() && setShowDrop(true)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar módulo... (ej: clientes, compras, informes)"
                className="w-full bg-slate-700 text-white placeholder-gray-400 border border-slate-600 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              {query && (
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setQuery(''); setShowDrop(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {dropdownJSX}
            </div>
          </div>

          {/* ── Acciones ── */}
          <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
            {/* Notificaciones */}
            <button className="relative p-2 rounded-lg hover:bg-slate-700 transition-colors" title="Notificaciones">
              <Bell className="w-5 h-5 text-gray-300" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-800" />
            </button>

            <div className="hidden lg:block w-px h-5 bg-slate-600" />

            {/* Usuario */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors cursor-default">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center ring-2 ring-green-500/30">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden lg:block">
                <p className="text-white text-xs font-semibold leading-none">Admin</p>
                <p className="text-gray-400 text-xs mt-0.5">Administrador</p>
              </div>
            </div>

            <div className="hidden lg:block w-px h-5 bg-slate-600" />

            {/* Cerrar sesión */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2 lg:px-3 py-2 rounded-lg border border-transparent hover:bg-red-500/15 hover:border-red-500/25 transition-all group"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300" />
              <span className="hidden lg:inline text-sm font-medium text-red-400 group-hover:text-red-300">Salir</span>
            </button>
          </div>
        </div>

        {/* ── Buscador móvil ── */}
        <div className="lg:hidden mt-3">
          <div className="relative" ref={mobileRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={() => query.trim() && setShowDrop(true)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar módulo..."
              className="w-full bg-slate-700 text-white placeholder-gray-400 border border-slate-600 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {query && (
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => { setQuery(''); setShowDrop(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {dropdownJSX}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;