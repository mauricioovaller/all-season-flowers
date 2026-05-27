// src/pages/Dashboard/Dashboard.jsx

import React, { useEffect, useState } from 'react';
import { CLIENTE } from '../../config/cliente.js';
import {
  Flower2, Leaf, Sprout, Users, Building, UserCheck, UserCog,
  Package, Truck, UsersRound, Plane, Star,
  ShoppingCart, CreditCard, Undo2, Wallet, HandCoins,
  FileText, BarChart3, Download, LayoutDashboard,
  CheckCircle2, TrendingUp, Shield, Zap,
} from 'lucide-react';

const categorias = [
  {
    titulo: 'Tablas Maestras',
    count: 12,
    icon: <Shield className="w-6 h-6" />,
    gradiente: 'from-green-600 to-emerald-700',
    shadowColor: 'shadow-green-500/20',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-800',
    chipClasses: 'bg-green-50 text-green-700 border border-green-200',
    modulos: [
      { icon: <Users className="w-3 h-3" />,      label: 'Clientes' },
      { icon: <Building className="w-3 h-3" />,   label: 'Proveedores' },
      { icon: <UserCheck className="w-3 h-3" />,  label: 'Ejec. Venta' },
      { icon: <UserCog className="w-3 h-3" />,    label: 'Ejec. Compra' },
      { icon: <Flower2 className="w-3 h-3" />,    label: 'Productos' },
      { icon: <Sprout className="w-3 h-3" />,     label: 'Variedades' },
      { icon: <Star className="w-3 h-3" />,       label: 'Grados' },
      { icon: <Package className="w-3 h-3" />,    label: 'Empaques' },
      { icon: <Truck className="w-3 h-3" />,      label: 'Conductores' },
      { icon: <UsersRound className="w-3 h-3" />, label: 'Ayudantes' },
      { icon: <Plane className="w-3 h-3" />,      label: 'Aerolíneas' },
      { icon: <Building className="w-3 h-3" />,   label: 'Agencias' },
    ],
  },
  {
    titulo: 'Módulos Operativos',
    count: 6,
    icon: <Zap className="w-6 h-6" />,
    gradiente: 'from-blue-600 to-indigo-700',
    shadowColor: 'shadow-blue-500/20',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    chipClasses: 'bg-blue-50 text-blue-700 border border-blue-200',
    modulos: [
      { icon: <ShoppingCart className="w-3 h-3" />, label: 'Compras' },
      { icon: <CreditCard className="w-3 h-3" />,   label: 'Pedidos' },
      { icon: <Undo2 className="w-3 h-3" />,        label: 'Dev. Ventas' },
      { icon: <Undo2 className="w-3 h-3" />,        label: 'Dev. Compras' },
      { icon: <Wallet className="w-3 h-3" />,       label: 'Pago Clientes' },
      { icon: <HandCoins className="w-3 h-3" />,    label: 'Pago Proveed.' },
    ],
  },
  {
    titulo: 'Informes y Reportes',
    count: 6,
    icon: <TrendingUp className="w-6 h-6" />,
    gradiente: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/20',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    chipClasses: 'bg-amber-50 text-amber-700 border border-amber-200',
    modulos: [
      { icon: <FileText className="w-3 h-3" />,       label: 'Cta. Proveedores' },
      { icon: <FileText className="w-3 h-3" />,       label: 'Cta. Clientes' },
      { icon: <BarChart3 className="w-3 h-3" />,      label: 'Cons. Ventas' },
      { icon: <BarChart3 className="w-3 h-3" />,      label: 'Cons. Compras' },
      { icon: <Download className="w-3 h-3" />,       label: 'Export. Contable' },
      { icon: <LayoutDashboard className="w-3 h-3" />,label: 'Tablero Control' },
    ],
  },
];

const stats = [
  { label: 'Tablas Maestras',     value: '12', icon: <Shield className="w-4 h-4" />,    color: 'text-green-400' },
  { label: 'Módulos Operativos',  value: '6',  icon: <Zap className="w-4 h-4" />,        color: 'text-blue-400'  },
  { label: 'Informes',            value: '6',  icon: <BarChart3 className="w-4 h-4" />,  color: 'text-amber-400' },
  { label: 'Total Módulos',       value: '25', icon: <TrendingUp className="w-4 h-4" />, color: 'text-purple-400'},
];

const Dashboard = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {/* ────────────── HERO ────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 mb-6">

        {/* Glow blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-green-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80  h-80  bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2  right-1/4  w-56  h-56  bg-teal-500/8   rounded-full blur-2xl pointer-events-none" />

        {/* Floating particles */}
        <div className="absolute top-6    right-20  w-2.5 h-2.5 bg-green-400/50   rounded-full animate-bounce" style={{ animationDuration: '3.2s' }} />
        <div className="absolute top-16   right-36  w-1.5 h-1.5 bg-emerald-300/40 rounded-full animate-bounce" style={{ animationDuration: '4.1s', animationDelay: '0.6s' }} />
        <div className="absolute top-10   right-52  w-3   h-3   bg-green-500/30   rounded-full animate-bounce" style={{ animationDuration: '3.7s', animationDelay: '1.1s' }} />
        <div className="absolute bottom-12 right-28 w-2   h-2   bg-teal-400/40    rounded-full animate-bounce" style={{ animationDuration: '5s',   animationDelay: '0.3s' }} />
        <div className="absolute bottom-20 right-10 w-1.5 h-1.5 bg-green-300/35  rounded-full animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.8s' }} />

        {/* Large background flower silhouette */}
        <div className="absolute top-4 right-4 lg:top-8 lg:right-8 opacity-[0.06] pointer-events-none select-none">
          <Flower2 className="w-52 h-52 lg:w-80 lg:h-80 text-green-300" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 lg:p-10 xl:p-12">

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/25 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-semibold tracking-widest uppercase">Sistema en línea</span>
          </div>

          {/* Icon + Title */}
          <div className="flex items-start gap-4 lg:gap-5 mb-5">
            <div className="asf-float flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-green-900/50 ring-2 ring-green-400/20">
              <Flower2 className="w-9 h-9 lg:w-11 lg:h-11 text-white" />
            </div>
            <div className="min-w-0 max-w-full">
              <h1 className="asf-gradient-text text-3xl lg:text-4xl font-extrabold leading-snug tracking-tight break-words whitespace-normal">
                {CLIENTE.titulo}
              </h1>
              <p className="text-green-400/80 font-medium text-sm lg:text-base mt-1 tracking-wide">
                {CLIENTE.lema}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-sm lg:text-base max-w-xl leading-relaxed mb-7">
            Plataforma de gestión integral para la administración eficiente de{' '}
            <span className="text-green-400 font-medium">pedidos, compras, inventario y pagos</span>{' '}
            de follajes y ornamentales.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-3 text-center hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className={`flex justify-center mb-1.5 ${s.color}`}>{s.icon}</div>
                <div className="text-white font-extrabold text-2xl leading-none mb-1">{s.value}</div>
                <div className="text-gray-500 text-xs leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ────────────── MÓDULOS ────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="w-5 h-5 text-green-600" />
          <h2 className="text-base lg:text-lg font-bold text-gray-800">Módulos del Sistema</h2>
          <span className="text-xs text-gray-400 hidden sm:inline">— Usa el menú lateral para navegar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categorias.map((cat, ci) => (
            <div
              key={ci}
              className={`group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-md ${cat.shadowColor} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}
            >
              {/* Colored top strip */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${cat.gradiente}`} />

              <div className="p-5">
                {/* Card header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradiente} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      {cat.icon}
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm lg:text-base">{cat.titulo}</h3>
                  </div>
                  <span className={`${cat.badgeBg} ${cat.badgeText} text-xs font-bold px-2.5 py-1 rounded-full`}>
                    {cat.count}
                  </span>
                </div>

                {/* Module chips */}
                <div className="flex flex-wrap gap-1.5">
                  {cat.modulos.map((m, mi) => (
                    <span
                      key={mi}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium ${cat.chipClasses}`}
                    >
                      {m.icon}
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Corner glow */}
              <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${cat.gradiente} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
            </div>
          ))}
        </div>
      </div>

      {/* ────────────── FOOTER ────────────── */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 lg:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Datenbanken Soluciones</p>
            <p className="text-gray-500 text-xs">Software desarrollado por DatenBanken Solutions S.A.S.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2 flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm font-medium">v2.0 — 2026</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;