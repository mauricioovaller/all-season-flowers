// src/test/pagosProveedores/servicioAsync.test.js
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  obtenerUltimoNumeroPagoProveedor,
  getComprasProveedorConSaldo,
  guardarPagoProveedor,
  getPagoProveedorEspecifico,
  buscarPagosProveedores,
  eliminarPagoProveedor,
} from "../../services/pagosProveedores/pagosProveedoresService";

function mockFetch(body, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

afterEach(() => vi.unstubAllGlobals());

// ─── obtenerUltimoNumeroPagoProveedor — fallback ──────────────────────────────

describe("obtenerUltimoNumeroPagoProveedor", () => {
  it("retorna el número cuando la API responde", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        ultimoNumero: 3,
        siguienteNumeroFormateado: "PAG-PROV-000004",
      }),
    );
    const res = await obtenerUltimoNumeroPagoProveedor();
    expect(res.success).toBe(true);
    expect(res.siguienteNumeroFormateado).toBe("PAG-PROV-000004");
  });

  it("retorna fallback PAG-PROV-000001 ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    const res = await obtenerUltimoNumeroPagoProveedor();
    expect(res.success).toBe(false);
    expect(res.siguienteNumeroFormateado).toBe("PAG-PROV-000001");
    expect(res.ultimoNumero).toBe(0);
  });
});

// ─── getComprasProveedorConSaldo — fallback ───────────────────────────────────

describe("getComprasProveedorConSaldo", () => {
  it("retorna compras con saldo en respuesta exitosa", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, compras: [{ IdCompra: 1 }], total: 1 }),
    );
    const res = await getComprasProveedorConSaldo(5);
    expect(res.success).toBe(true);
    expect(res.compras).toHaveLength(1);
  });

  it("retorna fallback con lista vacía ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    const res = await getComprasProveedorConSaldo(5);
    expect(res.success).toBe(false);
    expect(res.compras).toEqual([]);
  });

  it("envía idPagoExcluir cuando se proporciona", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, compras: [], total: 0 }));
    await getComprasProveedorConSaldo(5, 42);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.idProveedor).toBe(5);
    expect(body.idPagoExcluir).toBe(42);
  });

  it("no envía idPagoExcluir cuando no se proporciona", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, compras: [], total: 0 }));
    await getComprasProveedorConSaldo(5);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.idProveedor).toBe(5);
    expect(body.idPagoExcluir).toBeUndefined();
  });
});

// ─── guardarPagoProveedor ─────────────────────────────────────────────────────

describe("guardarPagoProveedor", () => {
  it("retorna datos del servidor al guardar", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        idPagoProveedor: 10,
        numeroPago: "PAG-PROV-000010",
      }),
    );
    const res = await guardarPagoProveedor({
      idProveedor: 1,
      valorPago: 500000,
    });
    expect(res.success).toBe(true);
    expect(res.idPagoProveedor).toBe(10);
  });

  it("lanza excepción si el servidor responde con error", async () => {
    vi.stubGlobal("fetch", mockFetch("Error", false, 500));
    await expect(guardarPagoProveedor({})).rejects.toThrow();
  });

  it("envía los datos al endpoint correcto con nueva estructura", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await guardarPagoProveedor({
      encabezado: { idProveedor: 3, costoTransferencia: 0 },
      compras: [{ idCompra: 1, valorPago: 200000 }],
    });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.encabezado.idProveedor).toBe(3);
    expect(body.compras[0].valorPago).toBe(200000);
  });
});

// ─── getPagoProveedorEspecifico ───────────────────────────────────────────────

describe("getPagoProveedorEspecifico", () => {
  it("retorna encabezado y compras", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        encabezado: { idPagoProveedor: 5 },
        compras: [],
      }),
    );
    const res = await getPagoProveedorEspecifico(5);
    expect(res.encabezado.idPagoProveedor).toBe(5);
  });

  it("envía idPagoProveedor correcto", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await getPagoProveedorEspecifico(99);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.idPagoProveedor).toBe(99);
  });
});

// ─── buscarPagosProveedores — fallback ────────────────────────────────────────

describe("buscarPagosProveedores", () => {
  it("retorna pagos cuando la API responde", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, pagos: [{ IdPagoProveedor: 1 }], total: 1 }),
    );
    const res = await buscarPagosProveedores({ proveedor: 2 });
    expect(res.success).toBe(true);
    expect(res.pagos).toHaveLength(1);
  });

  it("retorna fallback con lista vacía ante error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    const res = await buscarPagosProveedores({});
    expect(res.success).toBe(false);
    expect(res.pagos).toEqual([]);
  });
});

// ─── eliminarPagoProveedor ────────────────────────────────────────────────────

describe("eliminarPagoProveedor", () => {
  it("retorna la respuesta del servidor", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, numeroPago: "PAG-PROV-000005" }),
    );
    const res = await eliminarPagoProveedor(5);
    expect(res.success).toBe(true);
  });

  it("envía el idPagoProveedor correcto", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await eliminarPagoProveedor(8);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.idPagoProveedor).toBe(8);
  });
});
