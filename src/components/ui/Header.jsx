import React from 'react';
import { Search, Bell, User, Menu } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo y nombre - PROPORCIONES CORREGIDAS */}
          <div className="flex items-center space-x-4">
            {/* Logo real de la empresa - PROPORCIÓN ANCHO */}
            <div className="flex items-center justify-center w-48 h-16 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <img 
                src="/assets/logos/LogoAllSeason.jpg" 
                alt="All Season Flowers"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback si la imagen no carga
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
            
            {/* Nombre de la empresa - OCULTO AHORA QUE EL LOGO ES GRANDE */}
            <div className="hidden xl:block">
              <h1 className="text-2xl font-bold text-gray-800">All Season Flowers</h1>
              <p className="text-green-600 text-sm font-medium">Flowers & Ornamentals</p>
            </div>
          </div>

          {/* Barra de búsqueda (centro) - AJUSTADA AL LOGO GRANDE */}
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

          {/* Iconos de usuario - COMPACTOS POR EL LOGO GRANDE */}
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

            {/* Perfil de usuario */}
            <button className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden lg:block text-sm font-medium text-gray-700">Usuario</span>
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
        </div>
      </div>
    </header>
  );
};

export default Header;