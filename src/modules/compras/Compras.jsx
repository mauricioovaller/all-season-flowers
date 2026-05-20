// src/modules/compras/Compras.jsx
import React, { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Search, Save, Plus, Download, ShoppingCart } from 'lucide-react';
import CompraHeader from "./CompraHeader";
import CompraEmpaque from "./CompraEmpaque";
import ModalBuscarCompras from "./ModalBuscarCompras";
import ModalGenerarOrdenCompra from "./ModalGenerarOrdenCompra";
import {
    getDatosSelectCompras,
    guardarCompraCompleta,
    getCompraEspecifica,
    prepararDatosParaGuardar,
    calcularTotales,
    generarPDFOrdenCompra
} from "../../services/compras/comprasService";

// Función para fecha actual en formato ISO (YYYY-MM-DD)
function todayISODate() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function Compras() {
    // --------------------------------------------------------------
    // Estado del encabezado - COMPLETO PARA COMPRAS (CON IVA)
    // --------------------------------------------------------------
    const [header, setHeader] = useState({
        noCompra: `COMP-000000`,
        tipoCompra: "REGULAR",
        proveedor: "",
        comprador: "",
        fechaSolicitud: todayISODate(),
        fechaEntrega: "",
        moneda: "",
        trm: "",
        poProveedor: "",
        observaciones: "",
        totalPiezas: "0",
        equivalenciaFulles: "0",
        totalTallos: "0",
        valorCompra: "0",
        tieneIVA: false,
        iva: "0",
        totalCompra: "0",
        anulado: false,
    });

    // --------------------------------------------------------------
    // Estado de empaques
    // --------------------------------------------------------------
    const [empaques, setEmpaques] = useState([]);

    // --------------------------------------------------------------
    // Datos de selects globales PARA COMPRAS
    // --------------------------------------------------------------
    const [datosSelect, setDatosSelect] = useState({
        proveedores: [],
        compradores: [],
        monedas: [],
        productos: [],
        variedades: [],
        grados: [],
        tiposEmpaque: [],
        unidadesFacturacion: [],
        predios: [],
        tiposCompra: []
    });

    // Estados de carga inicial
    const [loadingDatos, setLoadingDatos] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [menuCompacto, setMenuCompacto] = useState(false);

    // --------------------------------------------------------------
    // Refs para validaciones
    // --------------------------------------------------------------
    const headerRefs = {
        proveedor: useRef(null),
        comprador: useRef(null),
        fechaSolicitud: useRef(null),
        fechaEntrega: useRef(null),
        moneda: useRef(null),
        trm: useRef(null),
    };

    const [mostrarModalBuscar, setMostrarModalBuscar] = useState(false);
    const [cargandoCompra, setCargandoCompra] = useState(false);

    // Estado para modal de orden de compra
    const [mostrarModalOrdenCompraSimple, setMostrarModalOrdenCompraSimple] = useState(false);

    // --------------------------------------------------------------
    // Cargar datos REALES desde la API
    // --------------------------------------------------------------
    useEffect(() => {
        async function cargarDatos() {
            try {
                setLoadingDatos(true);

                // Llamar a la API de COMPRAS
                const datosAPI = await getDatosSelectCompras();

                if (datosAPI.success) {
                    // Mapear los datos de la API al formato que necesitan los componentes
                    const datosMapeados = {
                        // Proveedores: IdProveedor, Proveedor, IVA
                        proveedores: datosAPI.proveedores?.map(p => ({
                            id: p.IdProveedor.toString(),
                            nombre: `${p.Proveedor || ''} ${p.IVA ? `(IVA)` : ''}`.trim()
                        })) || [],

                        // Compradores: IdComprador, NomComprador
                        compradores: datosAPI.compradores?.map(c => ({
                            id: c.IdComprador.toString(),
                            nombre: c.NomComprador || ''
                        })) || [],

                        // Monedas: IdMoneda, Moneda
                        monedas: datosAPI.monedas?.map(m => ({
                            id: m.IdMoneda.toString(),
                            nombre: m.Moneda || ''
                        })) || [],

                        // Productos: IdProducto, NOMPRODUCTO
                        productos: datosAPI.productos?.map(p => ({
                            id: p.IdProducto.toString(),
                            descripcion: p.NOMPRODUCTO || '',
                            codigo: p.NOMPRODUCTO?.substring(0, 10) || p.IdProducto.toString()
                        })) || [],

                        // Tipo Empaque: IdTipoEmpaque, Descripcion, EquivFull
                        tiposEmpaque: datosAPI.tipoEmpaque?.map(t => ({
                            id: t.IdTipoEmpaque.toString(),
                            descripcion: t.Descripcion || '',
                            equivFull: t.EquivFull || 1
                        })) || [],

                        // Unidades: IdUnidades, DescripUnidad
                        unidadesFacturacion: datosAPI.unidades?.map(u => ({
                            id: u.IdUnidades.toString(),
                            nombre: u.DescripUnidad || ''
                        })) || [],

                        // Predios: IdPredio, NombrePredio
                        predios: datosAPI.predios?.map(p => ({
                            id: p.IdPredio.toString(),
                            nombre: p.NombrePredio || ''
                        })) || [],

                        // Tipos de compra (array fijo del API)
                        tiposCompra: datosAPI.tiposCompra || []
                    };

                    setDatosSelect(datosMapeados);
                } else {
                    throw new Error(datosAPI.message || "Error cargando datos");
                }

                setLoadingDatos(false);

            } catch (err) {
                console.error("Error cargando datos de compras:", err);

                Swal.fire({
                    icon: 'warning',
                    title: 'API no disponible',
                    text: 'Usando datos de ejemplo. La API no respondió.',
                    timer: 3000
                });

                // Datos mock para compras
                const datosMock = {
                    proveedores: [
                        { id: "1", nombre: "Proveedor A (IVA)" },
                        { id: "2", nombre: "Proveedor B" },
                        { id: "3", nombre: "Proveedor C (IVA)" },
                    ],
                    compradores: [
                        { id: "1", nombre: "Comprador 1" },
                        { id: "2", nombre: "Comprador 2" },
                        { id: "3", nombre: "Comprador 3" },
                    ],
                    monedas: [
                        { id: "USD", nombre: "USD" },
                        { id: "EUR", nombre: "EUR" },
                        { id: "COP", nombre: "COP" },
                    ],
                    productos: [
                        { id: "1", descripcion: "Rosas Premium", codigo: "ROS-PREM" },
                        { id: "2", descripcion: "Girasoles", codigo: "GIR-STD" },
                        { id: "3", descripcion: "Lirios", codigo: "LIR-PREM" },
                        { id: "4", descripcion: "Bouquet Mixto", codigo: "BOUQ-MIX" },
                    ],
                    tiposEmpaque: [
                        { id: "1", descripcion: "Caja 100cm", equivFull: 1 },
                        { id: "2", descripcion: "Caja 120cm", equivFull: 1 },
                        { id: "3", descripcion: "Bolsa Plástica", equivFull: 0.5 },
                    ],
                    unidadesFacturacion: [
                        { id: "1", nombre: "Tallos" },
                        { id: "2", nombre: "Ramos" },
                        { id: "3", nombre: "Cajas" },
                        { id: "4", nombre: "Stem/Tallo" },
                        { id: "5", nombre: "Bunch/Ramo" },
                        { id: "6", nombre: "Bouquet" },
                    ],
                    predios: [
                        { id: "1", nombre: "La Floresta" },
                        { id: "2", nombre: "El Jardín" },
                        { id: "3", nombre: "Santa Helena" },
                    ],
                    tiposCompra: [
                        { valor: "ADICIONAL", nombre: "Adicional" },
                        { valor: "REGULAR", nombre: "Regular" },
                        { valor: "ORDEN FIJA", nombre: "Orden Fija" },
                        { valor: "OTRO", nombre: "Otro" }
                    ]
                };

                setDatosSelect(datosMock);
                setLoadingDatos(false);
            }
        }
        cargarDatos();
    }, []);

    // --------------------------------------------------------------
    // Depuración: Monitorear cambios en empaques
    // --------------------------------------------------------------
    useEffect(() => {
        console.log("Estado actual de empaques:", empaques);
    }, [empaques]);

    // --------------------------------------------------------------
    // Manejo de cambios en encabezado
    // --------------------------------------------------------------
    function handleHeaderChange(field, value) {
        const updatedHeader = { ...header, [field]: value };

        // Si se cambia el check de IVA, recalcular IVA y total
        if (field === 'tieneIVA') {
            const valorCompra = Number(updatedHeader.valorCompra) || 0;
            const iva = value ? valorCompra * 0.19 : 0;
            const totalCompra = valorCompra + iva;

            updatedHeader.iva = iva.toString();
            updatedHeader.totalCompra = totalCompra.toString();
        }

        // Si se cambia el valor de compra, recalcular IVA y total si aplica
        if (field === 'valorCompra') {
            const valorCompra = Number(value) || 0;
            const iva = updatedHeader.tieneIVA ? valorCompra * 0.19 : 0;
            const totalCompra = valorCompra + iva;

            updatedHeader.iva = iva.toString();
            updatedHeader.totalCompra = totalCompra.toString();
        }

        setHeader(updatedHeader);
    }

    // --------------------------------------------------------------
    // Manejo de cambios en empaques
    // --------------------------------------------------------------
    function handleEmpaquesChange(nuevosEmpaques) {
        console.log("Nuevos empaques recibidos:", nuevosEmpaques);
        setEmpaques(nuevosEmpaques);

        // Calcular totales del encabezado basado en los empaques
        const totales = calcularTotales(nuevosEmpaques, datosSelect.tiposEmpaque);

        const valorCompra = totales.totalValor;
        const iva = header.tieneIVA ? valorCompra * 0.19 : 0;
        const totalCompra = valorCompra + iva;

        setHeader(prev => ({
            ...prev,
            totalPiezas: totales.totalPiezas.toString(),
            equivalenciaFulles: totales.totalFulles.toString(),
            totalTallos: totales.totalTallos.toString(),
            valorCompra: valorCompra.toString(),
            iva: iva.toString(),
            totalCompra: totalCompra.toString()
        }));
    }

    // --------------------------------------------------------------
    // Validaciones generales
    // --------------------------------------------------------------
    function validarCompraCompleta() {
        const errores = [];

        // ========== 1. ENCABEZADO ==========
        if (!header.tipoCompra) errores.push("Tipo de compra es obligatorio");
        if (!header.proveedor) errores.push("Proveedor es obligatorio");
        if (!header.comprador) errores.push("Comprador es obligatorio");
        if (!header.fechaSolicitud) errores.push("Fecha de solicitud es obligatoria");
        if (!header.fechaEntrega) errores.push("Fecha de entrega es obligatoria");
        if (!header.moneda) errores.push("Moneda es obligatoria");

        // TRM es obligatorio y mayor a 0
        const trmValue = parseFloat(header.trm);
        if (!header.trm || isNaN(trmValue) || trmValue <= 0) {
            errores.push("TRM es obligatorio y debe ser mayor a 0");
        }

        // ========== 2. EMPAQUES ==========
        if (empaques.length === 0) {
            errores.push("Debe agregar al menos un empaque");
            return errores;
        }

        empaques.forEach((empaque, empIndex) => {
            const numEmpaque = empIndex + 1;

            // Validar empaque
            if (!empaque.tipoEmpaque) {
                errores.push(`Empaque ${numEmpaque}: Tipo de empaque es obligatorio`);
            }

            const cantidadEmpaque = parseInt(empaque.cantidadEmpaque);
            if (!empaque.cantidadEmpaque || isNaN(cantidadEmpaque) || cantidadEmpaque <= 0) {
                errores.push(`Empaque ${numEmpaque}: Cantidad de empaques debe ser mayor a 0`);
            }

            // Validar productos en el empaque
            if (!empaque.items || empaque.items.length === 0) {
                errores.push(`Empaque ${numEmpaque}: Debe contener al menos un producto`);
            } else {
                empaque.items.forEach((item, itemIndex) => {
                    const numProducto = itemIndex + 1;

                    // ========== VALIDACIONES PARA TODOS LOS PRODUCTOS ==========
                    if (!item.producto) {
                        errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Producto es obligatorio`);
                    }

                    if (!item.descripcion || item.descripcion.trim() === '') {
                        errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Descripción es obligatoria`);
                    }

                    if (!item.unidadFacturacion) {
                        errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Unidad de facturación es obligatoria`);
                    }

                    // Precio de COMPRA obligatorio y mayor a 0
                    const precioCompra = parseFloat(item.precioCompra);
                    if (!item.precioCompra || isNaN(precioCompra) || precioCompra <= 0) {
                        errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Precio de compra debe ser mayor a 0`);
                    }

                    // ========== VALIDACIONES ESPECÍFICAS POR TIPO ==========
                    if (item.esBouquet) {
                        // Validaciones para bouquets
                        const cantidadBouquets = parseInt(item.cantidadBouquets);
                        if (!item.cantidadBouquets || isNaN(cantidadBouquets) || cantidadBouquets <= 0) {
                            errores.push(`Empaque ${numEmpaque}, Bouquet ${numProducto}: Cantidad de bouquets debe ser mayor a 0`);
                        }

                        const tallosBouquet = parseInt(item.tallosRamo);
                        if (!item.tallosRamo || isNaN(tallosBouquet) || tallosBouquet <= 0) {
                            errores.push(`Empaque ${numEmpaque}, Bouquet ${numProducto}: Tallos por bouquet debe ser mayor a 0`);
                        }

                        // Validar receta
                        if (!item.receta || item.receta.length === 0) {
                            errores.push(`Empaque ${numEmpaque}, Bouquet ${numProducto}: La receta debe tener al menos un ingrediente`);
                        } else {
                            // Validar cada ingrediente
                            item.receta.forEach((ingrediente, ingIndex) => {
                                const numIng = ingIndex + 1;

                                if (!ingrediente.producto) {
                                    errores.push(`Empaque ${numEmpaque}, Bouquet ${numProducto}, Ingrediente ${numIng}: Producto es obligatorio`);
                                }
                                if (!ingrediente.variedad) {
                                    errores.push(`Empaque ${numEmpaque}, Bouquet ${numProducto}, Ingrediente ${numIng}: Variedad es obligatoria`);
                                }

                                const tallosPorBouquet = parseInt(ingrediente.tallosPorBouquet);
                                if (!ingrediente.tallosPorBouquet || isNaN(tallosPorBouquet) || tallosPorBouquet <= 0) {
                                    errores.push(`Empaque ${numEmpaque}, Bouquet ${numProducto}, Ingrediente ${numIng}: Tallos por bouquet debe ser mayor a 0`);
                                }
                            });
                        }

                    } else {
                        // ========== VALIDACIONES PARA PRODUCTOS SIMPLES ==========
                        if (!item.variedad) {
                            errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Variedad es obligatoria`);
                        }

                        if (!item.grado) {
                            errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Grado es obligatorio`);
                        }

                        const tallosRamo = parseInt(item.tallosRamo);
                        if (!item.tallosRamo || isNaN(tallosRamo) || tallosRamo <= 0) {
                            errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Tallos por ramo debe ser mayor a 0`);
                        }

                        const ramosCaja = parseInt(item.ramosCaja);
                        if (!item.ramosCaja || isNaN(ramosCaja) || ramosCaja <= 0) {
                            errores.push(`Empaque ${numEmpaque}, Producto ${numProducto}: Ramos por caja debe ser mayor a 0`);
                        }
                    }
                });
            }
        });

        return errores;
    }

    // --------------------------------------------------------------
    // Guardar compra
    // --------------------------------------------------------------
    async function handleSave() {
        console.log("Iniciando validación de la compra...");

        const esNueva = header.noCompra === "COMP-000000";
        console.log("Es nueva compra?", esNueva);

        // 1. Ejecutar validación completa
        const errores = validarCompraCompleta();

        // 2. Si hay errores, mostrarlos
        if (errores.length > 0) {
            console.log("Errores encontrados:", errores);

            Swal.fire({
                icon: 'error',
                title: 'Errores de validación',
                html: `
        <div class="text-left">
          <p class="font-semibold mb-2">Por favor corrija los siguientes errores:</p>
          <div class="max-h-60 overflow-y-auto">
            <ul class="list-disc pl-5 space-y-1">
              ${errores.map(error => `<li class="text-sm">${error}</li>`).join('')}
            </ul>
          </div>
          <p class="text-xs text-gray-500 mt-3">Total de errores: ${errores.length}</p>
        </div>
      `,
                confirmButtonText: 'Entendido',
                width: '500px'
            });

            return;
        }

        console.log("Validación pasada. Preparando datos...");

        // 3. Preparar datos para el backend
        const datosParaGuardar = prepararDatosParaGuardar(header, empaques);

        // 4. Mostrar confirmación con vista previa
        Swal.fire({
            title: '¿Guardar compra?',
            html: `
      <div class="text-left">
        <p class="font-medium mb-2">Se guardarán los siguientes datos:</p>
        <div class="text-xs space-y-1 max-h-60 overflow-y-auto">
          <p><strong>Proveedor ID:</strong> ${datosParaGuardar.encabezado.IdProveedor}</p>
          <p><strong>Comprador ID:</strong> ${datosParaGuardar.encabezado.IdComprador}</p>
          <p><strong>Fechas:</strong> ${datosParaGuardar.encabezado.FechaSolicitud} → ${datosParaGuardar.encabezado.FechaEntrega}</p>
          <p><strong>Empaques:</strong> ${datosParaGuardar.empaques.length}</p>
          <p><strong>Total productos:</strong> ${datosParaGuardar.empaques.reduce((sum, emp) => sum + emp.productos.length, 0)}</p>
          <p><strong>Tipo compra:</strong> ${datosParaGuardar.encabezado.TipoCompra}</p>
          <p><strong>IVA aplicado:</strong> ${datosParaGuardar.encabezado.IVA ? 'Sí (19%)' : 'No'}</p>
        </div>
        <p class="text-xs text-gray-500 mt-3">Revise la consola para ver todos los datos.</p>
      </div>
    `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'Cancelar',
            width: '500px'
        }).then((result) => {
            if (result.isConfirmed) {
                // 5. Iniciar proceso de guardado real
                iniciarGuardado(datosParaGuardar);
            }
        });
    }

    async function iniciarGuardado(datosParaGuardar) {
        setGuardando(true);

        try {
            // Mostrar loading
            Swal.fire({
                title: "Enviando al servidor...",
                text: "Guardando compra en la base de datos",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // 1. Llamar al servicio real
            console.log("Llamando a guardarCompraCompleta...");
            console.log("Datos para guardar:", datosParaGuardar);

            const resultado = await guardarCompraCompleta(datosParaGuardar);
            console.log("Resultado del servidor:", resultado);

            if (resultado.success) {
                // 2. Actualizar estado con respuesta real
                const nuevoNumero = `COMP-${String(resultado.idEncabCompra).padStart(6, "0")}`;

                setHeader(prev => ({
                    ...prev,
                    noCompra: nuevoNumero
                }));

                // 3. Mostrar éxito con datos reales
                Swal.fire({
                    icon: 'success',
                    title: '¡Compra Guardada!',
                    html: `
          <div class="text-center">
            <p class="font-semibold text-lg">${nuevoNumero}</p>
            <div class="mt-3 text-sm text-left bg-green-50 p-3 rounded border border-green-200">
              <p class="font-medium text-green-800">✓ Guardada en base de datos</p>
              <p class="mt-2"><strong>ID Compra:</strong> ${resultado.idEncabCompra}</p>
              <p><strong>Fecha registro:</strong> ${resultado.fechaRegistro || new Date().toLocaleString()}</p>
              <p><strong>IVA aplicado:</strong> ${header.tieneIVA ? 'Sí (19%)' : 'No'}</p>
              <p><strong>Mensaje:</strong> ${resultado.message}</p>
            </div>
            <p class="text-xs text-gray-500 mt-3">Puede continuar trabajando con esta compra.</p>
          </div>
        `,
                    confirmButtonText: 'Aceptar',
                    width: '500px'
                });

            } else {
                throw new Error(resultado.message || "Error desconocido del servidor");
            }

            setGuardando(false);

        } catch (err) {
            console.error("Error en el proceso de guardado:", err);

            let mensajeError = err.message;
            if (err.message.includes("Failed to fetch")) {
                mensajeError = "No se pudo conectar con el servidor. Verifique la conexión.";
            } else if (err.message.includes("404")) {
                mensajeError = "Servicio no encontrado. Verifique la URL del API.";
            }

            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                html: `
        <div class="text-left">
          <p class="font-medium">${mensajeError}</p>
          <div class="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <p><strong>Detalles:</strong></p>
            <p class="mt-1">${err.message}</p>
            <p class="mt-2 text-gray-600">Revise la consola para más información.</p>
          </div>
          <p class="text-xs text-gray-500 mt-3">Los datos no se han perdido. Puede intentar nuevamente.</p>
        </div>
      `,
                confirmButtonText: 'Entendido',
                width: '500px'
            });

            setGuardando(false);
        }
    }

    // --------------------------------------------------------------
    // Nueva compra
    // --------------------------------------------------------------
    function handleNew() {
        Swal.fire({
            title: '¿Nueva compra?',
            text: "Se perderán los cambios no guardados",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, nueva compra',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                setHeader({
                    noCompra: `COMP-000000`,
                    tipoCompra: "REGULAR",
                    proveedor: "",
                    comprador: "",
                    fechaSolicitud: todayISODate(),
                    fechaEntrega: "",
                    moneda: "",
                    trm: "",
                    poProveedor: "",
                    observaciones: "",
                    totalPiezas: "0",
                    equivalenciaFulles: "0",
                    totalTallos: "0",
                    valorCompra: "0",
                    tieneIVA: false,
                    iva: "0",
                    totalCompra: "0",
                    anulado: false,
                });
                setEmpaques([]);                

                Swal.fire(
                    '¡Listo!',
                    'Nueva compra creada',
                    'success'
                );
            }
        });
    }

    // --------------------------------------------------------------
    // Cargar compra existente
    // --------------------------------------------------------------
    const handleSeleccionarCompra = async (compra) => {
        try {
            setCargandoCompra(true);

            // Obtener datos completos de la compra
            const res = await getCompraEspecifica(compra.idCompra);

            if (res.success) {
                const datosCompra = res.compra;

                // 1. Actualizar encabezado
                const headerData = datosCompra.header;

                const nuevoHeader = {
                    noCompra: `COMP-${String(headerData.IdEncabCompra).padStart(6, "0")}`,
                    tipoCompra: headerData.TipoCompra || "REGULAR",
                    proveedor: String(headerData.IdProveedor),
                    comprador: String(headerData.IdComprador),
                    fechaSolicitud: headerData.FechaSolicitud || todayISODate(),
                    fechaEntrega: headerData.FechaEntrega || "",
                    moneda: String(headerData.IdMoneda),
                    trm: String(headerData.TRM || ""),
                    poProveedor: headerData.PO_Proveedor || "",
                    observaciones: headerData.Observaciones || "",
                    totalPiezas: "0", // Se calcularán después
                    equivalenciaFulles: "0", // Se calcularán después
                    totalTallos: "0", // Se calcularán después
                    valorCompra: "0", // Se calcularán después
                    tieneIVA: headerData.IVA === 1,
                    iva: String(headerData.TotalIVA || "0"),
                    totalCompra: String(headerData.TotalGeneral || "0"),
                    anulado: headerData.Anulado === 1,
                };

                setHeader(nuevoHeader);

                // 2. Transformar empaques al formato que espera el componente
                const empaquesTransformados = datosCompra.empaques.map(empaque => {
                    // Calcular fulles según equivalencia del tipo de empaque
                    const tipoEmpaqueObj = datosSelect.tiposEmpaque.find(t => t.id === String(empaque.tipoEmpaque));
                    const equivFull = tipoEmpaqueObj?.equivFull || 1;
                    const cantidadEmpaques = Number(empaque.cantidadEmpaque) || 0;
                    const fullesEmpaque = cantidadEmpaques * equivFull;

                    // Calcular totales de este empaque
                    let totalTallosEmpaque = 0;
                    let valorTotalEmpaque = 0;

                    const itemsTransformados = empaque.items.map(item => {
                        const tallosRamo = Number(item.tallosRamo) || 0;
                        const ramosCaja = Number(item.ramosCaja) || 0;
                        const cantidadBouquets = Number(item.cantidadBouquets) || 1;
                        const precioCompra = parseFloat(String(item.precioCompra || "0").replace(/,/g, '.')) || 0;

                        let tallosCaja = 0;
                        let totTallosRegistro = 0;
                        let valorRegistro = 0;

                        if (item.esBouquet) {
                            tallosCaja = tallosRamo;
                            totTallosRegistro = tallosRamo * cantidadBouquets * cantidadEmpaques;

                            const unidad = datosSelect.unidadesFacturacion.find(u => u.id === String(item.unidadFacturacion));
                            if (unidad?.nombre === "Stem/Tallo") {
                                valorRegistro = totTallosRegistro * precioCompra;
                            } else {
                                valorRegistro = cantidadBouquets * cantidadEmpaques * precioCompra;
                            }
                        } else {
                            tallosCaja = tallosRamo * ramosCaja;
                            totTallosRegistro = tallosCaja * cantidadEmpaques;

                            const unidad = datosSelect.unidadesFacturacion.find(u => u.id === String(item.unidadFacturacion));
                            if (unidad?.nombre === "Stem/Tallo") {
                                valorRegistro = totTallosRegistro * precioCompra;
                            } else if (unidad?.nombre === "Bunch/Ramo" || unidad?.nombre === "Bouquet" || unidad?.nombre === "Consumer/Bunch") {
                                valorRegistro = cantidadEmpaques * ramosCaja * precioCompra;
                            } else {
                                valorRegistro = totTallosRegistro * precioCompra;
                            }
                        }

                        totalTallosEmpaque += totTallosRegistro;
                        valorTotalEmpaque += valorRegistro;

                        return {
                            id: `${item.id}_${Date.now()}`,
                            producto: String(item.producto),
                            variedad: String(item.variedad || ""),
                            grado: String(item.grado || ""),
                            descripcion: item.descripcion || "",
                            unidadFacturacion: String(item.unidadFacturacion),
                            tallosRamo: tallosRamo,
                            ramosCaja: ramosCaja,
                            precioCompra: String(item.precioCompra || 0),
                            totTallosRegistro: totTallosRegistro,
                            valorRegistro: valorRegistro,
                            predio: String(item.predio || ""),
                            esBouquet: item.esBouquet || false,
                            cantidadBouquets: cantidadBouquets,
                            receta: item.receta?.map(ing => ({
                                id: `${ing.id}_${Date.now()}`,
                                producto: String(ing.producto),
                                variedad: String(ing.variedad),
                                tallosPorBouquet: ing.tallosPorBouquet,
                                descripcion: `${ing.nombreProducto} ${ing.nombreVariedad}`
                            })) || []
                        };
                    });

                    return {
                        id: `${empaque.id}_${Date.now()}`,
                        tipoEmpaque: String(empaque.tipoEmpaque),
                        cantidadEmpaque: cantidadEmpaques,
                        poCodeEmpaque: empaque.poCodeEmpaque || "",
                        items: itemsTransformados,
                        totalTallosEmpaque: totalTallosEmpaque,
                        valorTotalEmpaque: valorTotalEmpaque,
                        fullesEmpaque: fullesEmpaque
                    };
                });

                // 3. Calcular totales generales del encabezado
                let totalPiezas = 0;
                let totalFulles = 0;
                let totalTallos = 0;
                let valorCompra = 0;

                empaquesTransformados.forEach(empaque => {
                    totalPiezas += Number(empaque.cantidadEmpaque) || 0;
                    totalFulles += empaque.fullesEmpaque || 0;
                    totalTallos += empaque.totalTallosEmpaque || 0;
                    valorCompra += empaque.valorTotalEmpaque || 0;
                });

                // Calcular IVA y total
                const tieneIVA = headerData.IVA === 1;
                const iva = tieneIVA ? valorCompra * 0.19 : 0;
                const totalCompra = valorCompra + iva;

                // 4. Actualizar TODOS los estados con los valores calculados
                setHeader(prev => ({
                    ...prev,
                    totalPiezas: totalPiezas.toString(),
                    equivalenciaFulles: totalFulles.toString(),
                    totalTallos: totalTallos.toString(),
                    valorCompra: valorCompra.toString(),
                    tieneIVA: tieneIVA,
                    iva: iva.toString(),
                    totalCompra: totalCompra.toString()
                }));

                setEmpaques(empaquesTransformados);

                // 5. Actualizar estado de orden de compra si existe                

                // 6. Mostrar mensaje de éxito con resumen
                Swal.fire({
                    icon: 'success',
                    title: 'Compra Cargada',
                    html: `
          <div class="text-left">
            <p><strong>Compra:</strong> COMP-${headerData.IdEncabCompra}</p>
            <p><strong>Empaques:</strong> ${empaquesTransformados.length}</p>
            <p><strong>Piezas totales:</strong> ${totalPiezas}</p>
            <p><strong>Fulles totales:</strong> ${totalFulles.toFixed(3)}</p>
            <p><strong>Tallos totales:</strong> ${totalTallos}</p>
            <p><strong>Valor compra:</strong> $${valorCompra.toLocaleString()}</p>
            <p><strong>IVA (${tieneIVA ? '19%' : '0%'}):</strong> $${iva.toLocaleString()}</p>
            <p><strong>Total compra:</strong> $${totalCompra.toLocaleString()}</p>
          </div>
        `,
                    timer: 3000
                });

            } else {
                throw new Error(res.message || "Error al cargar la compra");
            }
        } catch (error) {
            console.error("Error cargando compra:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar la compra. Intenta nuevamente.',
            });
        } finally {
            setCargandoCompra(false);
        }
    };

    // --------------------------------------------------------------
    // Exportar a Excel
    // --------------------------------------------------------------
    function handleExportExcel() {
        if (!header.noCompra || header.noCompra === "COMP-000000") {
            Swal.fire("Aviso", "No hay compra para exportar.", "info");
            return;
        }

        const datosExportacion = {
            encabezado: header,
            empaques: empaques,
            fechaExportacion: new Date().toLocaleDateString('es-CO'),
            totales: {
                piezas: header.totalPiezas,
                fulles: header.equivalenciaFulles,
                tallos: header.totalTallos,
                valor: header.valorCompra,
                iva: header.iva,
                total: header.totalCompra
            }
        };

        console.log("Datos para exportar a Excel:", datosExportacion);

        Swal.fire({
            icon: 'info',
            title: 'Exportar a Excel',
            html: `
        <div class="text-left">
          <p>Se prepararán los datos para exportar:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Compra:</strong> ${header.noCompra}</li>
            <li><strong>Empaques:</strong> ${empaques.length}</li>
            <li><strong>Productos totales:</strong> ${empaques.reduce((sum, emp) => sum + (emp.items?.length || 0), 0)}</li>
            <li><strong>Valor compra:</strong> $${parseFloat(header.valorCompra).toLocaleString('es-CO')}</li>
            <li><strong>IVA (${header.tieneIVA ? '19%' : '0%'}):</strong> $${parseFloat(header.iva).toLocaleString('es-CO')}</li>
            <li><strong>Total compra:</strong> $${parseFloat(header.totalCompra).toLocaleString('es-CO')}</li>
          </ul>
          <p class="mt-3 text-sm text-gray-600">Los datos están listos en consola para integración con API de exportación.</p>
        </div>
      `,
            showCancelButton: true,
            confirmButtonText: 'Generar Excel',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Excel generado',
                    text: 'Archivo listo para descargar (simulación)',
                    timer: 2000
                });
            }
        });
    }

    // --------------------------------------------------------------
    // Generar Orden de Compra
    // --------------------------------------------------------------
    const handleGenerarOrdenCompra = () => {
        if (header.noCompra === "COMP-000000") {
            Swal.fire("Aviso", "Debe guardar la compra primero.", "info");
            return;
        }

        // Abrir modal simple
        setMostrarModalOrdenCompraSimple(true);
    };

    // --------------------------------------------------------------
    // Renderizado
    // --------------------------------------------------------------
    if (loadingDatos) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-700">Cargando datos de compras...</p>
                    <p className="text-sm text-gray-500">Por favor espere</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6 px-2 md:px-0">
            {/* ── Barra de acciones profesional ── */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl overflow-hidden">
                {/* Cabecera info */}
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/40 flex-shrink-0">
                            <ShoppingCart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-base lg:text-lg leading-tight">Compras de Flor</h2>
                            <p className="text-slate-400 text-xs">All Season Flowers — Sistema de compras</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            header.noCompra !== 'COMP-000000'
                                ? 'bg-green-500/15 text-green-400 border-green-500/25'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${header.noCompra !== 'COMP-000000' ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
                            {header.noCompra !== 'COMP-000000' ? 'Activa' : 'Sin guardar'}
                        </div>
                        <span className="text-slate-500 text-xs font-mono hidden sm:block">{header.noCompra}</span>
                    </div>
                </div>
                {/* Botones */}
                <div className="px-5 py-3">
                    <div className={`${menuCompacto ? 'hidden sm:flex' : 'flex'} flex-wrap sm:flex-nowrap gap-2`}>
                        <button
                            onClick={() => setMostrarModalBuscar(true)}
                            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px]"
                        >
                            <Search className="w-4 h-4 flex-shrink-0" />
                            <span>Buscar</span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={guardando}
                            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px] ${
                                guardando
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-md shadow-green-900/40'
                            }`}
                        >
                            {guardando ? (
                                <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-slate-400 flex-shrink-0" /><span>Guardando...</span></>
                            ) : (
                                <><Save className="w-4 h-4 flex-shrink-0" /><span>{header.noCompra !== "COMP-000000" ? "Actualizar" : "Guardar"}</span></>
                            )}
                        </button>
                        <button
                            onClick={handleNew}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px]"
                        >
                            <Plus className="w-4 h-4 flex-shrink-0" />
                            <span>Nueva</span>
                        </button>
                        <button
                            onClick={handleExportExcel}
                            disabled={header.noCompra === "COMP-000000"}
                            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 font-semibold text-sm flex-1 min-w-[85px] ${
                                header.noCompra !== "COMP-000000"
                                    ? 'bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white shadow-md shadow-teal-900/40'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            <Download className="w-4 h-4 flex-shrink-0" />
                            <span>Excel</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Encabezado de la compra */}
            <CompraHeader
                header={header}
                onChange={handleHeaderChange}
                proveedores={datosSelect.proveedores}
                compradores={datosSelect.compradores}
                monedas={datosSelect.monedas}
                tiposCompra={datosSelect.tiposCompra}
                inputRefs={headerRefs}
            />

            {/* SECCIÓN: ORDEN DE COMPRA - VERSIÓN SIMPLIFICADA */}
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-3 md:p-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base md:text-lg font-semibold text-slate-700">
                        📄 Orden de Compra
                    </h3>
                    <div className="text-xs text-gray-500">
                        {header.noCompra !== "COMP-000000" ? "Disponible" : "Guarde la compra primero"}
                    </div>
                </div>

                {/* BOTÓN ÚNICO PARA GENERAR ORDEN */}
                <div className="mb-4">
                    <button
                        onClick={handleGenerarOrdenCompra}
                        disabled={header.noCompra === "COMP-000000"}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all w-full ${header.noCompra !== "COMP-000000"
                            ? "bg-purple-50 border-purple-200 hover:bg-purple-100 hover:shadow-sm"
                            : "bg-gray-100 border-gray-200 cursor-not-allowed"
                            }`}
                    >
                        <div className="text-3xl mb-2">📋</div>
                        <div className="font-medium text-sm text-gray-800">Generar Orden de Compra</div>
                        <div className="text-xs text-gray-600 mt-0.5">Crear documento PDF</div>
                    </button>
                </div>

                {/* INFORMACIÓN SIMPLE */}
                <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded border">
                    <p>La orden de compra usará el ID de la compra como número de documento.</p>
                </div>
            </div>

            {/* Componente de empaques */}
            <CompraEmpaque
                empaques={empaques}
                onChangeEmpaques={handleEmpaquesChange}
                productos={datosSelect.productos}
                tiposEmpaque={datosSelect.tiposEmpaque}
                unidadesFacturacion={datosSelect.unidadesFacturacion}
                predios={datosSelect.predios}
            />

            {/* Información adicional - COMPACTA - IGUAL A PEDIDOS */}
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-3 md:p-4">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm md:text-base font-semibold text-slate-700">Ayuda Rápida</h4>
                    <button
                        onClick={() => {
                            Swal.fire({
                                icon: 'info',
                                title: 'Tips Rápidos',
                                html: `
                  <div class="text-left space-y-2">
                    <p><b>✓</b> Cada empaque puede contener múltiples productos</p>
                    <p><b>✓</b> Bouquets permiten crear recetas con ingredientes</p>
                    <p><b>✓</b> Totales se calculan automáticamente</p>
                    <p><b>✓</b> Toque los encabezados para expandir/colapsar</p>
                    <p><b>✓</b> Fulles se calculan según equivalencia del tipo de empaque</p>
                    <p><b>✓</b> IVA se calcula automáticamente al marcar la casilla</p>
                    <p><b>✓</b> <strong>Descripción es obligatoria</strong> para cada producto</p>
                    <p><b>✓</b> Descripción se autocompleta con Producto + Variedad + Grado</p>
                  </div>
                `,
                                confirmButtonText: 'Entendido'
                            });
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                    >
                        Ver más tips
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs md:text-sm">
                    <div className="p-2 bg-blue-50 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="text-gray-600">
                            <span className="font-medium text-blue-700">IVA:</span> Marque la casilla para calcular automáticamente el 19%
                        </div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="text-gray-600">
                            <span className="font-medium text-purple-700">Fulles:</span> Se calculan según la equivalencia del tipo de empaque
                        </div>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="text-gray-600">
                            <span className="font-medium text-green-700">Descripción:</span> Campo obligatorio para todos los productos
                        </div>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <div className="text-gray-600">
                            <span className="font-medium text-amber-700">Autocompletado:</span> Descripción se genera automáticamente al seleccionar Producto + Variedad + Grado
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================================== */}
            {/* MODALES */}
            {/* =========================================================== */}

            {/* MODAL BUSCAR COMPRAS */}
            {mostrarModalBuscar && (
                <ModalBuscarCompras
                    isOpen={mostrarModalBuscar}
                    onClose={() => setMostrarModalBuscar(false)}
                    onSeleccionarCompra={handleSeleccionarCompra}
                />
            )}

            {/* MODAL SIMPLE PARA GENERAR ORDEN DE COMPRA */}
            {mostrarModalOrdenCompraSimple && (
                <ModalGenerarOrdenCompra
                    isOpen={mostrarModalOrdenCompraSimple}
                    onClose={() => setMostrarModalOrdenCompraSimple(false)}
                    compraNumero={header.noCompra}
                    compraId={header.noCompra.replace('COMP-', '')}
                />
            )}

            {/* Loading overlay mientras carga la compra */}
            {cargandoCompra && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-6 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-700">Cargando compra...</p>
                    </div>
                </div>
            )}
        </div>
    );
}