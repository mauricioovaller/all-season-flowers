// src/test/reportes/servicio.test.js
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getEstadoCuentaCliente,
  getEstadoCuentaProveedor,
  getPlanillaDespacho,
  getSolicitudMuiscas,
  getConsolidadoVentas,
  getConsolidadoCompras,
  getConsolidadoDevolucionesClientes,
  getConsolidadoDevolucionesProveedores,
} from "../../services/reportes/reportesService";

function mockFetch(body, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

const MOVIMIENTO_CLIENTE = {
  factura: 440,
  fechaEntrega: "2026-05-13",
  idMoneda: 1,
  moneda: "Dólar Americano (USD)",
  trm: 3778.23,
  esCOP: false,
  valorUSD: 1752,
  valorCOP: 6619858.96,
  devolucionUSD: 0,
  devolucionCOP: 0,
  pagadoUSD: 0,
  pagadoCOP: 0,
  saldoUSD: 1752,
  saldoCOP: 6619858.96,
};

const TOTALES_BASE = {
  valorUSD: 1752,
  valorCOP: 6619858.96,
  devolucionUSD: 0,
  devolucionCOP: 0,
  pagadoUSD: 0,
  pagadoCOP: 0,
  saldoUSD: 1752,
  saldoCOP: 6619858.96,
};

const MOVIMIENTO_PROVEEDOR = {
  idCompra: 1,
  numeroCompra: "COMP-000001",
  fechaEntrega: "2026-03-27",
  idMoneda: 1,
  moneda: "Dólar Americano (USD)",
  trm: 3700,
  esCOP: false,
  valorUSD: 37.5,
  valorCOP: 138750,
  devolucionUSD: 0,
  devolucionCOP: 0,
  pagadoUSD: 26,
  pagadoCOP: 96200,
  saldoUSD: 11.5,
  saldoCOP: 42550,
};

// =====================================================================
// getEstadoCuentaCliente
// =====================================================================
describe("getEstadoCuentaCliente", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retorna movimientos y totales cuando la API responde exitosamente", async () => {
    const respuesta = {
      success: true,
      cliente: { id: 1, nombre: "FLOWERS AND PRODUCE BY TERRA" },
      movimientos: [MOVIMIENTO_CLIENTE],
      totales: TOTALES_BASE,
    };
    vi.stubGlobal("fetch", mockFetch(respuesta));

    const result = await getEstadoCuentaCliente({
      idCliente: 1,
      fechaInicio: "2026-01-01",
      fechaFin: "2026-12-31",
    });

    expect(result.success).toBe(true);
    expect(result.cliente.nombre).toBe("FLOWERS AND PRODUCE BY TERRA");
    expect(result.movimientos).toHaveLength(1);
    expect(result.movimientos[0].factura).toBe(440);
    expect(result.totales.saldoUSD).toBe(1752);
  });

  it("retorna estructura vacía de fallback cuando hay error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const result = await getEstadoCuentaCliente({
      idCliente: 1,
      fechaInicio: "2026-01-01",
      fechaFin: "2026-12-31",
    });

    expect(result.success).toBe(false);
    expect(result.movimientos).toEqual([]);
    expect(result.cliente).toBeNull();
    expect(result.totales.saldoUSD).toBe(0);
    expect(result.totales.saldoCOP).toBe(0);
  });

  it("retorna fallback cuando la API responde success: false", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "Cliente no encontrado" }),
    );

    const result = await getEstadoCuentaCliente({
      idCliente: 999,
      fechaInicio: "2026-01-01",
      fechaFin: "2026-12-31",
    });

    expect(result.success).toBe(false);
    expect(result.movimientos).toEqual([]);
    expect(result.message).toBe("Cliente no encontrado");
  });

  it("retorna fallback cuando la API responde con HTTP error", async () => {
    vi.stubGlobal("fetch", mockFetch({}, false, 500));

    const result = await getEstadoCuentaCliente({
      idCliente: 1,
      fechaInicio: "2026-01-01",
      fechaFin: "2026-12-31",
    });

    expect(result.success).toBe(false);
    expect(result.movimientos).toEqual([]);
  });
});

// =====================================================================
// getEstadoCuentaProveedor
// =====================================================================
describe("getEstadoCuentaProveedor", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retorna movimientos y totales cuando la API responde exitosamente", async () => {
    const respuesta = {
      success: true,
      proveedor: { id: 1, nombre: "WILSON VALERO GOMEZ" },
      movimientos: [MOVIMIENTO_PROVEEDOR],
      totales: {
        valorUSD: 37.5,
        valorCOP: 138750,
        devolucionUSD: 0,
        devolucionCOP: 0,
        pagadoUSD: 26,
        pagadoCOP: 96200,
        saldoUSD: 11.5,
        saldoCOP: 42550,
      },
    };
    vi.stubGlobal("fetch", mockFetch(respuesta));

    const result = await getEstadoCuentaProveedor({
      idProveedor: 1,
      fechaInicio: "2026-01-01",
      fechaFin: "2026-12-31",
    });

    expect(result.success).toBe(true);
    expect(result.proveedor.nombre).toBe("WILSON VALERO GOMEZ");
    expect(result.movimientos).toHaveLength(1);
    expect(result.movimientos[0].numeroCompra).toBe("COMP-000001");
    expect(result.totales.saldoUSD).toBe(11.5);
  });

  it("retorna estructura vacía de fallback cuando hay error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const result = await getEstadoCuentaProveedor({
      idProveedor: 1,
      fechaInicio: "2026-01-01",
      fechaFin: "2026-12-31",
    });

    expect(result.success).toBe(false);
    expect(result.movimientos).toEqual([]);
    expect(result.proveedor).toBeNull();
    expect(result.totales.saldoUSD).toBe(0);
    expect(result.totales.saldoCOP).toBe(0);
  });

  it("retorna fallback cuando la API responde success: false", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "Proveedor no encontrado" }),
    );

    const result = await getEstadoCuentaProveedor({
      idProveedor: 999,
      fechaInicio: "2026-01-01",
      fechaFin: "2026-12-31",
    });

    expect(result.success).toBe(false);
    expect(result.movimientos).toEqual([]);
    expect(result.message).toBe("Proveedor no encontrado");
  });

  it("retorna fallback cuando la API responde con HTTP error", async () => {
    vi.stubGlobal("fetch", mockFetch({}, false, 500));

    const result = await getEstadoCuentaProveedor({
      idProveedor: 1,
      fechaInicio: "2026-01-01",
      fechaFin: "2026-12-31",
    });

    expect(result.success).toBe(false);
    expect(result.movimientos).toEqual([]);
  });
});

// getPlanillaDespacho
describe("getPlanillaDespacho", () => {
  it("retorna despachos y totales en éxito", async () => {
    const resp = {
      success: true,
      despachos: [
        {
          aerolinea: "AMERIJET/TAESCOL",
          agencia: "FREIGHT WISE",
          guiaMaster: "810-51215216",
          guiaHija: "FWB66168",
          cliente: "MELODY FARMS",
          fb: 0,
          hb: 7,
          qb: 0,
          eb: 0,
          fulles: 1.75,
        },
        {
          aerolinea: "LANCO",
          agencia: "LOGIZTIK ALLIANCE",
          guiaMaster: "985-6377 6241",
          guiaHija: "BG1605007248",
          cliente: "BOCA INC",
          fb: 0,
          hb: 0,
          qb: 0,
          eb: 1,
          fulles: 0.125,
        },
      ],
      totales: { fb: 0, hb: 7, qb: 0, eb: 1, fulles: 1.875 },
    };
    vi.stubGlobal("fetch", mockFetch(resp));
    const data = await getPlanillaDespacho({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });
    expect(data.success).toBe(true);
    expect(data.despachos).toHaveLength(2);
    expect(data.despachos[0].aerolinea).toBe("AMERIJET/TAESCOL");
    expect(data.despachos[0].hb).toBe(7);
    expect(data.despachos[1].eb).toBe(1);
    expect(data.totales.hb).toBe(7);
    expect(data.totales.fulles).toBe(1.875);
  });

  it("retorna despachos vacíos cuando no hay registros", async () => {
    const resp = {
      success: true,
      despachos: [],
      totales: { fb: 0, hb: 0, qb: 0, eb: 0, fulles: 0 },
    };
    vi.stubGlobal("fetch", mockFetch(resp));
    const data = await getPlanillaDespacho({
      fechaInicio: "2026-01-01",
      fechaFin: "2026-01-01",
    });
    expect(data.success).toBe(true);
    expect(data.despachos).toHaveLength(0);
    expect(data.totales.fulles).toBe(0);
  });

  it("retorna fallback con arrays vacíos en error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );
    const data = await getPlanillaDespacho({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });
    expect(data.success).toBe(false);
    expect(data.despachos).toEqual([]);
    expect(data.totales).toEqual({ fb: 0, hb: 0, qb: 0, eb: 0, fulles: 0 });
    expect(data.message).toBe("Network error");
  });

  it("retorna fallback en error HTTP 500", async () => {
    vi.stubGlobal("fetch", mockFetch(null, false, 500));
    const data = await getPlanillaDespacho({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });
    expect(data.success).toBe(false);
    expect(data.despachos).toEqual([]);
  });

  it("retorna fallback cuando success es false en la respuesta", async () => {
    const resp = { success: false, message: "Fechas inválidas" };
    vi.stubGlobal("fetch", mockFetch(resp));
    const data = await getPlanillaDespacho({
      fechaInicio: "2026-05-31",
      fechaFin: "2026-05-01",
    });
    expect(data.success).toBe(false);
    expect(data.message).toBe("Fechas inválidas");
  });

  it("usa método POST con Content-Type JSON", async () => {
    const resp = {
      success: true,
      despachos: [],
      totales: { fb: 0, hb: 0, qb: 0, eb: 0, fulles: 0 },
    };
    const fetchMock = mockFetch(resp);
    vi.stubGlobal("fetch", fetchMock);
    await getPlanillaDespacho({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("ApiPlanillaDespacho.php"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });
});

// =====================================================================
// getSolicitudMuiscas
// =====================================================================
describe("getSolicitudMuiscas", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retorna solicitudes y totales cuando la API responde exitosamente", async () => {
    const resp = {
      success: true,
      solicitudes: [
        {
          cliente: "FLOWERS AND PRODUCE BY TERRA",
          guiaMaster: "810-51215216",
          agencia: "FREIGHT WISE",
          aerolinea: "AMERIJET/TAESCOL",
        },
        {
          cliente: "BOCA INC",
          guiaMaster: "985-6377 6241",
          agencia: "LOGIZTIK ALLIANCE",
          aerolinea: "LANCO",
        },
      ],
      total: 2,
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    };
    vi.stubGlobal("fetch", mockFetch(resp));

    const result = await getSolicitudMuiscas({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(result.success).toBe(true);
    expect(result.solicitudes).toHaveLength(2);
    expect(result.solicitudes[0].cliente).toBe("FLOWERS AND PRODUCE BY TERRA");
    expect(result.solicitudes[0].aerolinea).toBe("AMERIJET/TAESCOL");
    expect(result.total).toBe(2);
  });

  it("retorna solicitudes vacías cuando no hay registros", async () => {
    const resp = {
      success: true,
      solicitudes: [],
      total: 0,
      fechaInicio: "2026-01-01",
      fechaFin: "2026-01-01",
    };
    vi.stubGlobal("fetch", mockFetch(resp));

    const result = await getSolicitudMuiscas({
      fechaInicio: "2026-01-01",
      fechaFin: "2026-01-01",
    });

    expect(result.success).toBe(true);
    expect(result.solicitudes).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("retorna fallback con arrays vacíos en error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const result = await getSolicitudMuiscas({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(result.success).toBe(false);
    expect(result.solicitudes).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.message).toBe("Network error");
  });

  it("retorna fallback en error HTTP 500", async () => {
    vi.stubGlobal("fetch", mockFetch(null, false, 500));

    const result = await getSolicitudMuiscas({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(result.success).toBe(false);
    expect(result.solicitudes).toEqual([]);
  });

  it("retorna fallback cuando success es false en la respuesta", async () => {
    const resp = { success: false, message: "Fechas inválidas" };
    vi.stubGlobal("fetch", mockFetch(resp));

    const result = await getSolicitudMuiscas({
      fechaInicio: "2026-05-31",
      fechaFin: "2026-05-01",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Fechas inválidas");
  });

  it("usa método POST con Content-Type JSON", async () => {
    const resp = {
      success: true,
      solicitudes: [],
      total: 0,
    };
    const fetchMock = mockFetch(resp);
    vi.stubGlobal("fetch", fetchMock);

    await getSolicitudMuiscas({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("ApiSolicitudMuiscas.php"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });
});

// =====================================================================
// getConsolidadoVentas
// =====================================================================
describe("getConsolidadoVentas", () => {
  afterEach(() => vi.unstubAllGlobals());

  const REGISTRO_VENTA = {
    cliente: "MELODY FARMS",
    fechaDespacho: "2026-05-13",
    numeroPedido: 145,
    numeroInvoice: 440,
    awb: "810-51215216",
    awbHija: "FWB66168",
    aerolinea: "AMERIJET/TAESCOL",
    agencia: "FREIGHT WISE",
    po: "PO-001",
    producto: "ROSA",
    variedad: "FREEDOM",
    grado: "60CM",
    unidadFacturacion: "STEM",
    tipoEmpaque: "BUNCH",
    cantidadEmpaque: 10,
    tallosRamo: 25,
    ramosCaja: 4,
    tallosCaja: 100,
    totalTallos: 1000,
    precioVenta: 1.5,
    subTotal: 1500,
    tieneIVA: 1,
    valorIVA: 285,
    totalVenta: 1785,
  };

  const TOTALES_VENTA = {
    subtotal: 1500,
    valorIVA: 285,
    totalVenta: 1785,
    totalTallos: 1000,
    cantidadRegistros: 1,
  };

  it("retorna registros y totales cuando la API responde exitosamente", async () => {
    const respuesta = {
      success: true,
      registros: [REGISTRO_VENTA],
      totales: TOTALES_VENTA,
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    };
    vi.stubGlobal("fetch", mockFetch(respuesta));

    const result = await getConsolidadoVentas({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(result.success).toBe(true);
    expect(result.registros).toHaveLength(1);
    expect(result.registros[0].cliente).toBe("MELODY FARMS");
    expect(result.registros[0].numeroInvoice).toBe(440);
    expect(result.registros[0].awb).toBe("810-51215216");
    expect(result.registros[0].awbHija).toBe("FWB66168");
    expect(result.registros[0].totalTallos).toBe(1000);
    expect(result.totales.totalVenta).toBe(1785);
    expect(result.totales.totalTallos).toBe(1000);
    expect(result.totales.cantidadRegistros).toBe(1);
  });

  it("retorna estructura vacía de fallback cuando hay error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const result = await getConsolidadoVentas({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
    expect(result.totales.totalVenta).toBe(0);
    expect(result.totales.totalTallos).toBe(0);
    expect(result.totales.cantidadRegistros).toBe(0);
  });

  it("retorna fallback cuando la API responde success: false", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "Fechas inválidas" }),
    );

    const result = await getConsolidadoVentas({
      fechaInicio: "2026-05-31",
      fechaFin: "2026-05-01",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
    expect(result.message).toBe("Fechas inválidas");
  });

  it("retorna fallback cuando la API responde con HTTP error", async () => {
    vi.stubGlobal("fetch", mockFetch({}, false, 500));

    const result = await getConsolidadoVentas({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
  });

  it("usa método POST con Content-Type JSON", async () => {
    const fetchMock = mockFetch({
      success: true,
      registros: [],
      totales: { subtotal: 0, valorIVA: 0, totalVenta: 0, cantidadRegistros: 0 },
    });
    vi.stubGlobal("fetch", fetchMock);

    await getConsolidadoVentas({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("ApiConsolidadoVentas.php"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });
});

// =====================================================================
// getConsolidadoCompras
// =====================================================================
describe("getConsolidadoCompras", () => {
  afterEach(() => vi.unstubAllGlobals());

  const REGISTRO_COMPRA = {
    proveedor: "WILSON VALERO GOMEZ",
    fechaCompra: "2026-03-27",
    po: "PO-COMP-001",
    producto: "CLAVEL",
    variedad: "BALBOA",
    grado: "50CM",
    unidadFacturacion: "BUNCH",
    tipoEmpaque: "BOX",
    cantidadEmpaque: 5,
    tallosRamo: 20,
    ramosCaja: 6,
    tallosCaja: 120,
    totalTallos: 600,
    precioCompra: 2.0,
    subTotal: 600,
    tieneIVA: 0,
    valorIVA: 0,
    totalCompra: 600,
  };

  const TOTALES_COMPRA = {
    subtotal: 600,
    valorIVA: 0,
    totalCompra: 600,
    totalTallos: 600,
    cantidadRegistros: 1,
  };

  it("retorna registros y totales cuando la API responde exitosamente", async () => {
    const respuesta = {
      success: true,
      registros: [REGISTRO_COMPRA],
      totales: TOTALES_COMPRA,
      fechaInicio: "2026-03-01",
      fechaFin: "2026-03-31",
    };
    vi.stubGlobal("fetch", mockFetch(respuesta));

    const result = await getConsolidadoCompras({
      fechaInicio: "2026-03-01",
      fechaFin: "2026-03-31",
    });

    expect(result.success).toBe(true);
    expect(result.registros).toHaveLength(1);
    expect(result.registros[0].proveedor).toBe("WILSON VALERO GOMEZ");
    expect(result.registros[0].producto).toBe("CLAVEL");
    expect(result.registros[0].totalTallos).toBe(600);
    expect(result.totales.totalCompra).toBe(600);
    expect(result.totales.totalTallos).toBe(600);
    expect(result.totales.cantidadRegistros).toBe(1);
  });

  it("retorna estructura vacía de fallback cuando hay error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const result = await getConsolidadoCompras({
      fechaInicio: "2026-03-01",
      fechaFin: "2026-03-31",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
    expect(result.totales.totalCompra).toBe(0);
    expect(result.totales.totalTallos).toBe(0);
    expect(result.totales.cantidadRegistros).toBe(0);
  });

  it("retorna fallback cuando la API responde success: false", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "Proveedor no encontrado" }),
    );

    const result = await getConsolidadoCompras({
      fechaInicio: "2026-03-01",
      fechaFin: "2026-03-31",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
    expect(result.message).toBe("Proveedor no encontrado");
  });

  it("retorna fallback cuando la API responde con HTTP error", async () => {
    vi.stubGlobal("fetch", mockFetch({}, false, 500));

    const result = await getConsolidadoCompras({
      fechaInicio: "2026-03-01",
      fechaFin: "2026-03-31",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
  });

  it("usa método POST con Content-Type JSON", async () => {
    const fetchMock = mockFetch({
      success: true,
      registros: [],
      totales: { subtotal: 0, valorIVA: 0, totalCompra: 0, cantidadRegistros: 0 },
    });
    vi.stubGlobal("fetch", fetchMock);

    await getConsolidadoCompras({
      fechaInicio: "2026-03-01",
      fechaFin: "2026-03-31",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("ApiConsolidadoCompras.php"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });
});

// =====================================================================
// getConsolidadoDevolucionesClientes
// =====================================================================
describe("getConsolidadoDevolucionesClientes", () => {
  afterEach(() => vi.unstubAllGlobals());

  const REGISTRO_DEV_CLIENTE = {
    cliente: "MELODY FARMS",
    fechaDevolucion: "2026-05-20",
    idDevolucion: 12,
    numeroFactura: 440,
    aerolinea: "AMERIJET/TAESCOL",
    agencia: "FREIGHT WISE",
    po: "PO-001",
    producto: "ROSA",
    variedad: "FREEDOM",
    grado: "60CM",
    unidadFacturacion: "STEM",
    tipoEmpaque: "BUNCH",
    tallosDevueltos: 50,
    precioVenta: 1.5,
    motivo: "Daño",
    flete: 5,
    fumigacion: 3,
    otros: 2,
    subTotal: 75,
    tieneIVA: 1,
    valorIVA: 14.25,
    totalDevolucion: 99.25,
  };

  const TOTALES_DEV_CLIENTE = {
    tallosDevueltos: 50,
    subtotal: 75,
    valorIVA: 14.25,
    totalDevolucion: 99.25,
    cantidadRegistros: 1,
  };

  it("retorna registros y totales cuando la API responde exitosamente", async () => {
    const respuesta = {
      success: true,
      registros: [REGISTRO_DEV_CLIENTE],
      totales: TOTALES_DEV_CLIENTE,
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    };
    vi.stubGlobal("fetch", mockFetch(respuesta));

    const result = await getConsolidadoDevolucionesClientes({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(result.success).toBe(true);
    expect(result.registros).toHaveLength(1);
    expect(result.registros[0].cliente).toBe("MELODY FARMS");
    expect(result.registros[0].tallosDevueltos).toBe(50);
    expect(result.totales.totalDevolucion).toBe(99.25);
    expect(result.totales.cantidadRegistros).toBe(1);
  });

  it("retorna estructura vacía de fallback cuando hay error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const result = await getConsolidadoDevolucionesClientes({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
    expect(result.totales.totalDevolucion).toBe(0);
    expect(result.totales.cantidadRegistros).toBe(0);
  });

  it("retorna fallback cuando la API responde success: false", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "Fechas inválidas" }),
    );

    const result = await getConsolidadoDevolucionesClientes({
      fechaInicio: "2026-05-31",
      fechaFin: "2026-05-01",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
    expect(result.message).toBe("Fechas inválidas");
  });

  it("retorna fallback cuando la API responde con HTTP error", async () => {
    vi.stubGlobal("fetch", mockFetch({}, false, 500));

    const result = await getConsolidadoDevolucionesClientes({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
  });

  it("usa método POST con Content-Type JSON", async () => {
    const fetchMock = mockFetch({
      success: true,
      registros: [],
      totales: { tallosDevueltos: 0, subtotal: 0, valorIVA: 0, totalDevolucion: 0, cantidadRegistros: 0 },
    });
    vi.stubGlobal("fetch", fetchMock);

    await getConsolidadoDevolucionesClientes({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("ApiConsolidadoDevolucionesClientes.php"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });
});

// =====================================================================
// getConsolidadoDevolucionesProveedores
// =====================================================================
describe("getConsolidadoDevolucionesProveedores", () => {
  afterEach(() => vi.unstubAllGlobals());

  const REGISTRO_DEV_PROVEEDOR = {
    proveedor: "WILSON VALERO GOMEZ",
    fechaDevolucion: "2026-03-30",
    idDevolucion: 7,
    numeroCompra: 89,
    po: "PO-COMP-001",
    producto: "CLAVEL",
    variedad: "BALBOA",
    grado: "50CM",
    unidadFacturacion: "BUNCH",
    tipoEmpaque: "BOX",
    tallosDevueltos: 40,
    precioCompra: 2.0,
    motivo: "Calidad",
    subTotal: 80,
    tieneIVA: 0,
    valorIVA: 0,
    totalDevolucion: 80,
  };

  const TOTALES_DEV_PROVEEDOR = {
    tallosDevueltos: 40,
    subtotal: 80,
    valorIVA: 0,
    totalDevolucion: 80,
    cantidadRegistros: 1,
  };

  it("retorna registros y totales cuando la API responde exitosamente", async () => {
    const respuesta = {
      success: true,
      registros: [REGISTRO_DEV_PROVEEDOR],
      totales: TOTALES_DEV_PROVEEDOR,
      fechaInicio: "2026-03-01",
      fechaFin: "2026-03-31",
    };
    vi.stubGlobal("fetch", mockFetch(respuesta));

    const result = await getConsolidadoDevolucionesProveedores({
      fechaInicio: "2026-03-01",
      fechaFin: "2026-03-31",
    });

    expect(result.success).toBe(true);
    expect(result.registros).toHaveLength(1);
    expect(result.registros[0].proveedor).toBe("WILSON VALERO GOMEZ");
    expect(result.registros[0].tallosDevueltos).toBe(40);
    expect(result.totales.totalDevolucion).toBe(80);
    expect(result.totales.cantidadRegistros).toBe(1);
  });

  it("retorna estructura vacía de fallback cuando hay error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const result = await getConsolidadoDevolucionesProveedores({
      fechaInicio: "2026-03-01",
      fechaFin: "2026-03-31",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
    expect(result.totales.totalDevolucion).toBe(0);
    expect(result.totales.cantidadRegistros).toBe(0);
  });

  it("retorna fallback cuando la API responde success: false", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "Proveedor no encontrado" }),
    );

    const result = await getConsolidadoDevolucionesProveedores({
      fechaInicio: "2026-03-01",
      fechaFin: "2026-03-31",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
    expect(result.message).toBe("Proveedor no encontrado");
  });

  it("retorna fallback cuando la API responde con HTTP error", async () => {
    vi.stubGlobal("fetch", mockFetch({}, false, 500));

    const result = await getConsolidadoDevolucionesProveedores({
      fechaInicio: "2026-03-01",
      fechaFin: "2026-03-31",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
  });

  it("usa método POST con Content-Type JSON", async () => {
    const fetchMock = mockFetch({
      success: true,
      registros: [],
      totales: { tallosDevueltos: 0, subtotal: 0, valorIVA: 0, totalDevolucion: 0, cantidadRegistros: 0 },
    });
    vi.stubGlobal("fetch", fetchMock);

    await getConsolidadoDevolucionesProveedores({
      fechaInicio: "2026-03-01",
      fechaFin: "2026-03-31",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("ApiConsolidadoDevolucionesProveedores.php"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });
});
