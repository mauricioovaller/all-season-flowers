// src/test/reportes/servicio.test.js
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getEstadoCuentaCliente,
  getEstadoCuentaProveedor,
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
  valorBase: 1752,
  valorBaseCOP: 6619858.96,
  valorDevolucion: 0,
  valorDevolucionCOP: 0,
  valorPagado: 0,
  valorPagadoCOP: 0,
  saldo: 1752,
  saldoCOP: 6619858.96,
};

const TOTALES_BASE = {
  valorBase: 1752,
  valorBaseCOP: 6619858.96,
  valorDevolucion: 0,
  valorDevolucionCOP: 0,
  valorPagado: 0,
  valorPagadoCOP: 0,
  saldo: 1752,
  saldoCOP: 6619858.96,
};

const MOVIMIENTO_PROVEEDOR = {
  idCompra: 1,
  numeroCompra: "COMP-000001",
  fechaEntrega: "2026-03-27",
  idMoneda: 1,
  moneda: "Dólar Americano (USD)",
  trm: 3700,
  valorBase: 37.5,
  valorBaseCOP: 138750,
  valorDevolucion: 0,
  valorDevolucionCOP: 0,
  valorPagado: 26,
  valorPagadoCOP: 96200,
  saldo: 11.5,
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
    expect(result.totales.saldo).toBe(1752);
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
    expect(result.totales.saldo).toBe(0);
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
        valorBase: 37.5,
        valorBaseCOP: 138750,
        valorDevolucion: 0,
        valorDevolucionCOP: 0,
        valorPagado: 26,
        valorPagadoCOP: 96200,
        saldo: 11.5,
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
    expect(result.totales.saldo).toBe(11.5);
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
    expect(result.totales.saldo).toBe(0);
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
