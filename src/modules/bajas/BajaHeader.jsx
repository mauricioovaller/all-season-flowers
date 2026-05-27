import React from 'react';
import { Calendar, FileText, User, MessageSquare } from 'lucide-react';

const BajaHeader = ({ header, onChange }) => {
  const handleChange = (field, value) => {
    onChange({ ...header, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Calendar className="w-4 h-4 inline mr-1" />Fecha
        </label>
        <input
          type="date"
          value={header.Fecha || ''}
          onChange={(e) => handleChange('Fecha', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <FileText className="w-4 h-4 inline mr-1" />Motivo General
        </label>
        <select
          value={header.MotivoGeneral || ''}
          onChange={(e) => handleChange('MotivoGeneral', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        >
          <option value="">-- Seleccione --</option>
          <option value="Daño">Daño</option>
          <option value="Pérdida">Pérdida</option>
          <option value="Obsequio">Obsequio</option>
          <option value="Merma">Merma</option>
          <option value="Otro">Otro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <User className="w-4 h-4 inline mr-1" />Quién Autoriza
        </label>
        <input
          type="text"
          value={header.QuienAutoriza || ''}
          onChange={(e) => handleChange('QuienAutoriza', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Nombre de quien autoriza"
        />
      </div>

      <div className="md:col-span-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <MessageSquare className="w-4 h-4 inline mr-1" />Observaciones
        </label>
        <textarea
          value={header.Observaciones || ''}
          onChange={(e) => handleChange('Observaciones', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          rows={2}
          placeholder="Observaciones adicionales..."
        />
      </div>
    </div>
  );
};

export default BajaHeader;
