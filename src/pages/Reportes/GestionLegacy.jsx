import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { CLIENTE } from "../../config/cliente.js";
import { getClientes } from "../../services/clientes/clientesService";
import { getProveedores } from "../../services/proveedores/proveedoresService";
import { apiUrl } from "../../config/api.js";
import { RefreshCw, Edit3, Trash2, Plus, Save, X } from 'lucide-react';

const API_URL = apiUrl('reportes');

export default function GestionLegacy() {
  const [movimientos, setMovimientos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState("C");
  const [filtroEntidad, setFiltroEntidad] = useState("");
  const [entidades, setEntidades] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    async function loadEntidades() {
      try {
        const [cliRes, provRes] = await Promise.all([
          getClientes(),
          getProveedores()
        ]);
        setEntidades({
          C: (cliRes.clientes || []).map(c => ({ id: c.IdCliente, nombre: c.NOMBRE })),
          P: (provRes.proveedores || []).map(p => ({ id: p.IdProveedor, nombre: p.Proveedor }))
        });
      } catch (err) {
        console.error("Error cargando entidades:", err);
      }
    }
    loadEntidades();
  }, []);

  useEffect(() => {
    cargarMovimientos();
  }, [filtroTipo, filtroEntidad]);

  const cargarMovimientos = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/ApiGetLegacyMovimientos.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: filtroTipo,
          idEntidad: filtroEntidad ? parseInt(filtroEntidad) : 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setMovimientos(data.movimientos || []);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("Error:", err);
      setMovimientos([]);
    } finally {
      setCargando(false);
    }
  };

  const handleNuevo = () => {
    setEditando("nuevo");
    setFormData({
      tipo: filtroTipo,
      idEntidad: "",
      fecha: "",
      numeroDocumento: "",
      guia: "",
      valor: "0",
      credito: "0",
      pago: "0",
      idMoneda: "1",
      trm: "1"
    });
  };

  const handleEditar = (mov) => {
    setEditando(mov.idLegacyMovimiento);
    setFormData({
      idLegacyMovimiento: mov.idLegacyMovimiento,
      tipo: mov.tipo,
      idEntidad: mov.idEntidad.toString(),
      fecha: mov.fecha,
      numeroDocumento: mov.numeroDocumento,
      guia: mov.guia || "",
      valor: mov.valor.toString(),
      credito: mov.credito.toString(),
      pago: mov.pago.toString(),
      idMoneda: mov.idMoneda.toString(),
      trm: mov.trm.toString()
    });
  };

  const handleCancelarEdicion = () => {
    setEditando(null);
    setFormData(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGuardar = async () => {
    if (!formData.tipo || !formData.idEntidad || !formData.fecha || !formData.numeroDocumento) {
      Swal.fire("Validación", "Tipo, Entidad, Fecha y Número de Documento son requeridos", "warning");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/ApiGuardarLegacyMovimiento.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "guardar",
          ...formData,
          idEntidad: parseInt(formData.idEntidad),
          valor: parseFloat(formData.valor) || 0,
          credito: parseFloat(formData.credito) || 0,
          pago: parseFloat(formData.pago) || 0,
          idMoneda: parseInt(formData.idMoneda) || 1,
          trm: parseFloat(formData.trm) || 1
        })
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire("Éxito", data.message, "success");
        setEditando(null);
        setFormData(null);
        cargarMovimientos();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleEliminar = async (id) => {
    const conf = await Swal.fire({
      title: "¿Anular registro?",
      text: "El registro se marcará como anulado y no aparecerá en los estados de cuenta",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar"
    });
    if (!conf.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/ApiGuardarLegacyMovimiento.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "eliminar", idLegacyMovimiento: id })
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire("Anulado", data.message, "success");
        cargarMovimientos();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const entidadesList = entidades[filtroTipo] || [];

  return (
    <div className="space-y-4 px-2 md:px-0">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Gestión Datos Legacy</h1>
            <p className="text-sm text-slate-300">{CLIENTE.nombre}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tipo</label>
            <select
              value={filtroTipo}
              onChange={e => { setFiltroTipo(e.target.value); setFiltroEntidad(""); }}
              className="px-3 py-2 border rounded-lg bg-white text-gray-800 text-sm"
            >
              <option value="C">Clientes</option>
              <option value="P">Proveedores</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">{filtroTipo === 'C' ? 'Cliente' : 'Proveedor'}</label>
            <select
              value={filtroEntidad}
              onChange={e => setFiltroEntidad(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white text-gray-800 text-sm min-w-[200px]"
            >
              <option value="">Todos</option>
              {entidadesList.map(e => (
                <option key={e.id} value={e.id}>{e.id} - {e.nombre}</option>
              ))}
            </select>
          </div>
          <button onClick={cargarMovimientos}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 text-sm flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
          <button onClick={handleNuevo}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>
      </div>

      {/* Formulario de edición */}
      {editando && formData && (
        <div className="bg-white rounded-2xl shadow-xl p-5 border border-purple-200">
          <h3 className="font-semibold text-gray-800 mb-4">
            {editando === "nuevo" ? "Nuevo registro" : `Editando #${formData.idLegacyMovimiento}`}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select value={formData.tipo} onChange={e => handleFormChange('tipo', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="C">Cliente</option>
                <option value="P">Proveedor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{formData.tipo === 'C' ? 'Cliente' : 'Proveedor'}</label>
              <select value={formData.idEntidad} onChange={e => handleFormChange('idEntidad', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Seleccionar...</option>
                {(entidades[formData.tipo] || []).map(e => (
                  <option key={e.id} value={e.id}>{e.id} - {e.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
              <input type="date" value={formData.fecha} onChange={e => handleFormChange('fecha', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">N° Documento</label>
              <input type="text" value={formData.numeroDocumento} onChange={e => handleFormChange('numeroDocumento', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Guía</label>
              <input type="text" value={formData.guia} onChange={e => handleFormChange('guia', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor</label>
              <input type="number" step="0.01" value={formData.valor} onChange={e => handleFormChange('valor', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Crédito</label>
              <input type="number" step="0.01" value={formData.credito} onChange={e => handleFormChange('credito', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pago</label>
              <input type="number" step="0.01" value={formData.pago} onChange={e => handleFormChange('pago', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Moneda</label>
              <select value={formData.idMoneda} onChange={e => handleFormChange('idMoneda', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="1">Dólar Americano (USD)</option>
                <option value="2">Peso Colombiano (COP)</option>
                <option value="3">Euro (EUR)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">TRM</label>
              <input type="number" step="0.01" value={formData.trm} onChange={e => handleFormChange('trm', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleGuardar}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 text-sm flex items-center gap-1">
              <Save className="w-4 h-4" /> Guardar
            </button>
            <button onClick={handleCancelarEdicion}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm flex items-center gap-1">
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {filtroTipo === 'C' ? 'Cliente' : 'Proveedor'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Doc</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Crédito</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pago</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cargando ? (
                <tr><td colSpan="10" className="text-center py-8 text-gray-500">Cargando...</td></tr>
              ) : movimientos.length === 0 ? (
                <tr><td colSpan="10" className="text-center py-8 text-gray-500">No hay registros legacy</td></tr>
              ) : movimientos.map(mov => (
                <tr key={mov.idLegacyMovimiento} className={`hover:bg-gray-50 ${mov.anulado ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 text-gray-800">{mov.idLegacyMovimiento}</td>
                  <td className="px-4 py-3 text-gray-800">{mov.nombreEntidad || `ID ${mov.idEntidad}`}</td>
                  <td className="px-4 py-3 text-gray-600">{mov.fecha}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{mov.numeroDocumento}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{mov.valor.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{mov.credito.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{mov.pago.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{mov.saldo.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-center">
                    {mov.anulado ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Anulado</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEditar(mov)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {!mov.anulado && (
                        <button onClick={() => handleEliminar(mov.idLegacyMovimiento)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Anular">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 text-sm text-gray-600">
          Total: {movimientos.length} registro(s)
        </div>
      </div>
    </div>
  );
}
