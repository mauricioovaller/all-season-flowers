import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Trash2, Search, Save, Plus, RefreshCw, Ban, FileText } from 'lucide-react';
import BajaHeader from './BajaHeader';
import BajaDetalle from './BajaDetalle';
import ModalBuscarBajas from './ModalBuscarBajas';
import ModalVisorPreliminar from '../devoluciones/ModalVisorPreliminar';
import {
  getDatosSelectBajas,
  guardarBaja,
  getBajas,
  getBajaEspecifica,
  validarBaja,
  generarPDFBaja,
} from '../../services/bajas/bajasService';

const Bajas = () => {
  const [header, setHeader] = useState({
    Fecha: new Date().toISOString().split('T')[0],
    MotivoGeneral: '',
    Observaciones: '',
    QuienAutoriza: '',
  });
  const [detalles, setDetalles] = useState([
    { IdProducto: 0, IdVariedad: 0, IdGrado: 0, Tallos: 0, MotivoSalida: '' },
  ]);
  const [productos, setProductos] = useState([]);
  const [variedades, setVariedades] = useState([]);
  const [grados, setGrados] = useState([]);
  const [loadingSelect, setLoadingSelect] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [bajasList, setBajasList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(false);
  const [esAnulado, setEsAnulado] = useState(false);
  const [mostrarVisor, setMostrarVisor] = useState(false);
  const [urlPDF, setUrlPDF] = useState(null);

  useEffect(() => {
    const cargarSelect = async () => {
      setLoadingSelect(true);
      const data = await getDatosSelectBajas();
      if (data.success) {
        setProductos(data.productos || []);
        setVariedades(data.variedades || []);
        setGrados(data.grados || []);
      }
      setLoadingSelect(false);
    };
    cargarSelect();
  }, []);

  const handleHeaderChange = (nuevoHeader) => {
    setHeader(nuevoHeader);
  };

  const handleDetallesChange = (nuevosDetalles) => {
    setDetalles(nuevosDetalles);
  };

  const handleGuardar = async () => {
    const errores = validarBaja(header, detalles);
    if (errores.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Errores de validación',
        html: `<ul class="text-left">${errores.map((e) => `<li class="text-sm">• ${e}</li>`).join('')}</ul>`,
      });
      return;
    }

    const accion = editando ? 'actualizar' : 'guardar';
    const confirm = await Swal.fire({
      title: editando ? '¿Actualizar baja?' : '¿Guardar baja?',
      text: editando
        ? 'Se actualizarán los datos de la salida de producto'
        : 'Se registrarán las salidas de producto',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
    });

    if (!confirm.isConfirmed) return;

    setGuardando(true);
    try {
      const datos = {
        encabezado: header,
        detalles: detalles.map((d) => ({
          IdProducto: d.IdProducto,
          IdVariedad: d.IdVariedad || null,
          IdGrado: d.IdGrado || null,
          Tallos: d.Tallos,
          MotivoSalida: d.MotivoSalida || '',
        })),
      };

      const result = await guardarBaja(datos);

      Swal.fire({
        icon: 'success',
        title: editando ? 'Baja actualizada' : 'Baja guardada',
        text: `Registro #BAJA-${String(result.idEncabBaja).padStart(6, '0')} ${editando ? 'actualizado' : 'creado'} correctamente`,
        timer: 2000,
        showConfirmButton: false,
      });

      limpiarFormulario();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: err.message || 'Ocurrió un error al guardar la baja',
      });
    }
    setGuardando(false);
  };

  const handleAnular = async () => {
    if (!header.IdEncabBaja) {
      Swal.fire('Aviso', 'No hay una baja para anular', 'info');
      return;
    }

    if (esAnulado) {
      Swal.fire('Aviso', 'Esta baja ya está anulada', 'info');
      return;
    }

    const confirmacion = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción anulará permanentemente la baja. ¿Desea continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!confirmacion.isConfirmed) return;

    setAnulando(true);
    try {
      Swal.fire({
        title: 'Anulando baja...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const datos = {
        encabezado: { ...header, Anulado: 1 },
        detalles: detalles.map((d) => ({
          IdProducto: d.IdProducto,
          IdVariedad: d.IdVariedad || null,
          IdGrado: d.IdGrado || null,
          Tallos: d.Tallos,
          MotivoSalida: d.MotivoSalida || '',
        })),
      };

      const resultado = await guardarBaja(datos);

      if (resultado.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Anulado!',
          text: resultado.message,
          timer: 2000,
          showConfirmButton: false,
        });
        limpiarFormulario();
      } else {
        throw new Error(resultado.message || 'Error al anular');
      }
    } catch (err) {
      Swal.fire('Error', err.message || 'No se pudo anular la baja', 'error');
    }
    setAnulando(false);
  };

  const abrirBusqueda = async () => {
    setShowModal(true);
    setBuscando(true);
    const data = await getBajas({});
    if (data.success) {
      setBajasList(data.bajas || []);
    }
    setBuscando(false);
  };

  const seleccionarBaja = async (baja) => {
    setShowModal(false);
    setGuardando(true);
    try {
      const data = await getBajaEspecifica(baja.idBaja);
      if (data.success) {
        setHeader(data.baja.header);
        setDetalles(
          data.baja.detalles.map((d) => ({
            IdProducto: d.producto,
            IdVariedad: d.variedad || 0,
            IdGrado: d.grado || 0,
            Tallos: d.tallos,
            MotivoSalida: d.motivoSalida || '',
          }))
        );
        setEditando(true);
        setEsAnulado(data.baja.header.Anulado === 1 || data.baja.header.Anulado === '1');
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
    setGuardando(false);
  };

  const handleGenerarPDF = async () => {
    if (!header.IdEncabBaja) {
      Swal.fire('Aviso', 'Debe guardar la baja primero', 'info');
      return;
    }

    try {
      Swal.fire({
        title: 'Generando PDF...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const pdfBlob = await generarPDFBaja(parseInt(header.IdEncabBaja));
      const fileURL = URL.createObjectURL(pdfBlob);
      setUrlPDF(fileURL);
      setMostrarVisor(true);

      Swal.close();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    }
  };

  const limpiarFormulario = () => {
    setHeader({
      Fecha: new Date().toISOString().split('T')[0],
      MotivoGeneral: '',
      Observaciones: '',
      QuienAutoriza: '',
    });
    setDetalles([
      { IdProducto: 0, IdVariedad: 0, IdGrado: 0, Tallos: 0, MotivoSalida: '' },
    ]);
    setEditando(false);
    setEsAnulado(false);
  };

  const totalTallos = detalles.reduce((sum, d) => sum + (parseInt(d.Tallos) || 0), 0);

  const getNumeroBaja = () => {
    if (!header.IdEncabBaja) return 'Nuevo registro';
    return `BAJA-${String(header.IdEncabBaja).padStart(6, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${esAnulado ? 'bg-gray-500' : 'bg-orange-600'}`}>
          <Trash2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {esAnulado ? 'Baja Anulada' : editando ? 'Editando Baja' : 'Nueva Baja de Producto'}
          </h1>
          <p className="text-sm text-gray-500">
            Registrar salidas por daño, pérdida, obsequio u otros conceptos
          </p>
        </div>
      </div>

      {esAnulado && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl px-5 py-3 flex items-center gap-3">
          <Ban className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Esta baja ha sido anulada</p>
            <p className="text-xs text-red-600">Los datos se muestran solo para consulta. No es posible modificar ni guardar.</p>
          </div>
        </div>
      )}

      <div className={`rounded-xl p-4 flex items-center justify-between ${
        esAnulado
          ? 'bg-gradient-to-r from-gray-500 to-gray-600'
          : 'bg-gradient-to-r from-orange-600 to-red-600'
      }`}>
        <div className="flex items-center gap-3">
          <Trash2 className="w-8 h-8 text-white/80" />
          <div>
            <h2 className="text-white font-bold text-sm">{getNumeroBaja()}</h2>
            <p className="text-white/70 text-xs">
              {totalTallos} tallo(s) · {detalles.length} item(s)
              {esAnulado && <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">ANULADO</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={abrirBusqueda}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />Buscar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || esAnulado}
            className="flex items-center gap-1.5 bg-white text-orange-700 hover:bg-orange-50 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {guardando
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />}
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
          {editando && (
            <button
              onClick={handleGenerarPDF}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
              title="Generar PDF"
            >
              <FileText className="w-4 h-4" />PDF
            </button>
          )}
          <button
            onClick={handleAnular}
            disabled={anulando || !editando || esAnulado}
            className="flex items-center gap-1.5 bg-red-500/30 hover:bg-red-500/50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Anular baja"
          >
            {anulando
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Ban className="w-4 h-4" />}
            {anulando ? 'Anulando...' : 'Anular'}
          </button>
          <button
            onClick={limpiarFormulario}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />Nuevo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <BajaHeader header={header} onChange={handleHeaderChange} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <BajaDetalle
          detalles={detalles}
          onChange={handleDetallesChange}
          productos={productos}
          variedades={variedades}
          grados={grados}
        />
      </div>

      <ModalBuscarBajas
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={seleccionarBaja}
        bajas={bajasList}
        loading={buscando}
      />

      {mostrarVisor && (
        <ModalVisorPreliminar
          url={urlPDF}
          onClose={() => {
            setMostrarVisor(false);
            if (urlPDF) URL.revokeObjectURL(urlPDF);
            setUrlPDF(null);
          }}
        />
      )}
    </div>
  );
};

export default Bajas;
