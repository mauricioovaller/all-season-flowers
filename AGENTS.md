# AGENTS.md - All Season Flowers Project Guide

## Project Overview
This is a React-based web application for managing a flower business (All Season Flowers). The application includes modules for orders, returns, purchases, customers, products, varieties, grades, drivers, assistants, and suppliers. It uses Vite as the build tool, Tailwind CSS for styling, and communicates with a PHP backend API.

## Build, Lint, and Test Commands

### Development
```bash
npm run dev          # Start development server (Vite)
```

### Build
```bash
npm run build        # Build for production (Vite)
npm run preview      # Preview production build
```

### Linting
```bash
npm run lint         # Run ESLint on all files
```

### Testing
**Note:** No test framework is currently configured. The project does not have Jest, Vitest, or other testing frameworks installed. If tests are added in the future, they should follow these conventions:
- Test files should be named `*.test.jsx` or `*.spec.jsx`
- Place test files next to the components they test or in a `__tests__` directory
- Use React Testing Library for component testing

## Code Style Guidelines

### File Structure
- **Components**: `src/components/` - Reusable UI components
- **Pages**: `src/pages/` - Page-level components
- **Modules**: `src/modules/` - Business logic modules (orders, returns, purchases)
- **Services**: `src/services/` - API service functions
- **API**: `src/Api/` - PHP backend API files
- **Layout**: `src/components/layout/` - Layout components (Header, Sidebar, Layout)

### Naming Conventions
- **Files**: Use PascalCase for React components (`ComponentName.jsx`), camelCase for utilities/services (`serviceName.js`)
- **Components**: PascalCase for component names (`ProductList`, `DashboardAllSeason`)
- **Variables/Functions**: camelCase (`getProductos`, `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`, `MAX_ITEMS`)
- **CSS Classes**: Use Tailwind CSS utility classes, custom classes in `kebab-case`

### Imports Order
1. React imports
2. External library imports
3. Internal component imports
4. Service/utility imports
5. Style imports
6. Type imports (if using TypeScript)

Example:
```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import { getProductos } from './services/productos/productosService';
import './index.css';
```

### Component Structure
1. Import statements
2. Component function/class
3. State and hooks
4. Event handlers
5. JSX return
6. Export

Example:
```jsx
import React, { useState } from 'react';

const ProductList = ({ products }) => {
  const [filter, setFilter] = useState('');
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(filter.toLowerCase())
  );
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <input 
        type="text" 
        value={filter}
        onChange={handleFilterChange}
        className="border rounded px-3 py-2 w-full mb-4"
        placeholder="Buscar productos..."
      />
      {/* Product list rendering */}
    </div>
  );
};

export default ProductList;
```

### Error Handling
- Use try-catch blocks in async functions
- Provide fallback data when API calls fail
- Show user-friendly error messages
- Log errors to console for debugging

Example from `productosService.js`:
```javascript
try {
  const res = await fetch(`${API_URL}/ApiGetProductos.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filtros),
  });
  
  if (!res.ok) {
    throw new Error(`Error HTTP: ${res.status}`);
  }
  
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.message || "Error al obtener productos");
  }
  
  return data;
} catch (err) {
  console.error("Error al obtener productos:", err);
  
  // Fallback: Return valid empty structure
  return {
    success: false,
    productos: [],
    estadisticas: { total: 0, activos: 0, inactivos: 0 },
    total: 0,
    message: err.message
  };
}
```

### State Management
- Use React hooks (`useState`, `useEffect`, `useContext`) for state management
- Keep state as local as possible
- Lift state up when multiple components need access
- Consider using Context API for global state if needed

### Styling
- Use Tailwind CSS utility classes primarily
- Custom CSS should be in `src/index.css` or component-specific CSS files
- Follow responsive design patterns with Tailwind breakpoints
- Use consistent spacing (multiples of 4px)

### API Integration
- Service functions are in `src/services/` directory
- API base URL: `https://portal.datenbankensoluciones.com.co/DatenBankenApp/AllSeasonFlowers/Api/`
- Use POST requests with JSON body for data operations
- Handle loading states and errors in components
- Validate responses before using data

### Comments and Documentation
- Use JSDoc comments for service functions
- Add comments for complex business logic
- Keep comments up-to-date with code changes
- Use Spanish comments (matching existing codebase)

Example JSDoc:
```javascript
/**
 * Obtiene la lista de productos con filtros
 * @param {Object} filtros - Filtros opcionales {busqueda, estado}
 * @returns {Promise<Object>} {productos, estadisticas, total}
 */
```

### ESLint Rules
The project uses ESLint with these key rules:
- `no-unused-vars`: Error (except variables starting with uppercase)
- React Hooks rules enforced
- React Refresh rules for Vite
- JavaScript ES2020+ features allowed

### Git Conventions
- Use descriptive commit messages in Spanish or English
- Follow conventional commits if possible
- Keep commits focused on single changes
- Test changes before committing

## Development Workflow

1. **Start development**: `npm run dev`
2. **Make changes**: Follow code style guidelines
3. **Check linting**: `npm run lint` (fix any issues)
4. **Test manually**: Verify functionality in browser
5. **Build for production**: `npm run build` (verify no errors)
6. **Preview**: `npm run preview` (test production build)

## Project-Specific Notes

### Global Configuration
- Base path: `/DatenBankenApp/AllSeasonFlowers/` (configured in Vite and React Router)
- jsPDF is made available globally via `window.jspdf`
- Tailwind CSS is configured with default theme

### Module Structure
- **Pedidos**: Order management module
- **Devoluciones**: Returns management module  
- **Compras**: Purchases management module
- Each module has its own services and API endpoints

### Backend Integration
- PHP backend API endpoints are in `src/Api/` directory
- Each entity has its own API directory (productos, pedidos, etc.)
- API responses follow `{success: boolean, message: string, data: any}` pattern

## When Adding New Features

1. **Check existing patterns**: Look at similar features in the codebase
2. **Follow naming conventions**: Use consistent naming with existing code
3. **Add service functions**: Create service files in appropriate directory
4. **Add API endpoints**: If needed, add PHP API files in `src/Api/`
5. **Test thoroughly**: Manual testing of all functionality
6. **Update documentation**: Add comments and update this guide if needed

## Troubleshooting

### Common Issues
- **CORS errors**: Check API endpoint URLs and server configuration
- **Build errors**: Run `npm run lint` to check for ESLint issues
- **Routing issues**: Verify base path configuration matches deployment
- **API connection**: Check network tab in dev tools for failed requests

### Performance Considerations
- Use React.memo for expensive component re-renders
- Implement pagination for large data sets
- Optimize images and assets
- Use code splitting if the bundle grows large