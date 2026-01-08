// src/components/layout/Header.jsx (VERSIÓN ACTUALIZADA CON SweetAlert2)
import React from 'react';
import Swal from 'sweetalert2';
import { Search, Bell, User, Menu, LogOut } from 'lucide-react';

const Header = () => {
  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: "¿Estás seguro de que deseas salir de la aplicación?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      background: '#fff',
      iconColor: '#d33',
      customClass: {
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg',
        cancelButton: 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Limpiar sesión
        localStorage.clear();
        sessionStorage.clear();

        // Mostrar mensaje de salida
        Swal.fire({
          title: 'Sesión cerrada',
          text: 'Redirigiendo a la página de autenticación...',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
          willClose: () => {
            // Redirigir a la página de autenticación externa
            // CAMBIA ESTA URL POR LA CORRECTA DE TU SISTEMA
            window.location.href = "https://portal.datenbankensoluciones.com.co/";
          }
        });
      }
    });
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo y nombre */}
          <div className="flex items-center space-x-4">
            {/* Logo real de la empresa */}
            <div className="flex items-center justify-center w-48 h-16 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <img
                src="/DatenBankenApp/AllSeasonFlowers/img/LogoAllSeason.jpg"
                alt="All Season Flowers"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Fallback elegante si el logo no carga */}
              <div
                className="hidden w-full h-full bg-gradient-to-r from-primary to-secondary rounded-xl items-center justify-center"
                style={{ display: 'none' }}
              >
                <div className="text-white text-center">
                  <div className="text-lg font-bold">All Season Flowers</div>
                  <div className="text-sm">Flowers & Ornamentals</div>
                </div>
              </div>
            </div>

            {/* Nombre de la empresa */}
            <div className="hidden xl:block">
              <h1 className="text-2xl font-bold text-gray-800">All Season Flowers</h1>
              <p className="text-green-600 text-sm font-medium">Flowers & Ornamentals</p>
            </div>
          </div>

          {/* Barra de búsqueda (centro) */}
          <div className="flex-1 max-w-xl mx-4 lg:mx-6 hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar clientes, productos, ventas..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Iconos de usuario - CON BOTÓN DE SALIR */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Botón menú móvil */}
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>

            {/* Notificaciones */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* Separador visual */}
            <div className="hidden lg:block w-px h-6 bg-gray-300"></div>

            {/* Botón de Salir - OCULTO EN MÓVIL (se agregará en menú móvil) */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex items-center space-x-2 p-2 rounded-lg hover:bg-red-50 transition-colors group"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-600" />
              <span className="text-sm font-medium text-red-600">Salir</span>
            </button>

            {/* Perfil de usuario */}
            <button className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors group">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-sm font-medium text-gray-700 block">Usuario</span>
                <span className="text-xs text-gray-500">Administrador</span>
              </div>
            </button>
          </div>
        </div>

        {/* Barra de búsqueda móvil */}
        <div className="lg:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar clientes, productos, ventas..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>

          {/* Botón de Salir en móvil (debajo de la búsqueda) */}
          <div className="flex justify-end mt-3">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;