// src/test/devoluciones/servicio.test.js
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  obtenerUltimoNumeroDevolucion,
  getDetalleFactura,
  guardarDevolucion,
  getDevolucionEspecifica,
  buscarDevoluciones,
  getFacturasCliente,
  eliminarDevolucion,
} from "../../services/devoluciones/devolucionesService";

function mockFetch(body, ok = true, status = 200) {
  return vi
    .fn()
    .mockResolvedValue({
      ok,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    });
}

afterEach(() => vi.unstubAllGlobals());

// ─── obtenerUltimoNumeroDevolucion — fallback ────────────────────────────────

describe("obtenerUltimoNumeroDevolucion", () => {
  it("retorna el número cuando la API responde", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        ultimoNumero: 5,
        siguienteNumeroFormateado: "DEV-000006",
      }),
    );
    const res = await obtenerUltimoNumeroDevolucion();
    expect(res.success).toBe(true);
    expect(res.siguienteNumeroFormateado).toBe("DEV-000006");
  });

  it("retorna fallback DEV-000001 ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    const res = await obtenerUltimoNumeroDevolucion();
    expect(res.success).toBe(false);
    expect(res.siguienteNumeroFormateado).toBe("DEV-000001");
    expect(res.ultimoNumero).toBe(0);
  });
});

// ─── getDetalleFactura ────────────────────────────────────────────────────────

describe("getDetalleFactura", () => {
  it("retorna el detalle cuando la factura existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, detalle: [{ IdDetPedido: 1 }], total: 1 }),
    );
    const res = await getDetalleFactura(10);
    expect(res.detalle).toHaveLength(1);
  });

  it("envía el idFactura correcto", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, detalle: [] }));
    await getDetalleFactura(55);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.idFactura).toBe(55);
  });

  it("lanza excepción ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    await expect(getDetalleFactura(10)).rejects.toThrow();
  });
});

// ─── guardarDevolucion ────────────────────────────────────────────────────────

describe("guardarDevolucion", () => {
  it("retorna la respuesta del servidor al guardar", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        idDevolucion: 3,
        numeroDevolucion: "DEV-000003",
      }),
    );
    const res = await guardarDevolucion({ idFactura: 10, motivo: "defecto" });
    expect(res.success).toBe(true);
    expect(res.idDevolucion).toBe(3);
  });

  it("lanza excepción si el servidor responde con error", async () => {
    vi.stubGlobal("fetch", mockFetch("Error", false, 500));
    await expect(guardarDevolucion({})).rejects.toThrow();
  });
});

// ─── getDevolucionEspecifica ──────────────────────────────────────────────────

describe("getDevolucionEspecifica", () => {
  it("retorna encabezado y detalle de la devolución", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        encabezado: { IdEncabPedido: 10 },
        detalle: [],
      }),
    );
    const res = await getDevolucionEspecifica(10);
    expect(res.encabezado.IdEncabPedido).toBe(10);
  });

  it("lanza excepción ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    await expect(getDevolucionEspecifica(10)).rejects.toThrow();
  });
});

// ─── buscarDevoluciones ───────────────────────────────────────────────────────

describe("buscarDevoluciones", () => {
  it("retorna lista de devoluciones", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        devoluciones: [{ IdDevolucion: 1 }],
        total: 1,
      }),
    );
    const res = await buscarDevoluciones({ cliente: 2 });
    expect(res.devoluciones).toHaveLength(1);
  });

  it("envía filtros en el cuerpo", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, devoluciones: [], total: 0 }),
    );
    await buscarDevoluciones({ fechaInicio: "2024-01-01" });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.fechaInicio).toBe("2024-01-01");
  });
});

// ─── getFacturasCliente ───────────────────────────────────────────────────────

describe("getFacturasCliente", () => {
  it("retorna facturas del cliente", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, facturas: [{ IdEncabPedido: 5 }] }),
    );
    const res = await getFacturasCliente(3);
    expect(res.facturas).toHaveLength(1);
  });

  it("lanza excepción si falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    await expect(getFacturasCliente(3)).rejects.toThrow();
  });
});

// ─── eliminarDevolucion ───────────────────────────────────────────────────────

describe("eliminarDevolucion", () => {
  it("retorna la respuesta del servidor", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, idDevolucion: 2, idFactura: 10 }),
    );
    const res = await eliminarDevolucion(2);
    expect(res.success).toBe(true);
  });

  it("envía el idDevolucion correcto", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await eliminarDevolucion(7);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.idDevolucion).toBe(7);
  });
});
