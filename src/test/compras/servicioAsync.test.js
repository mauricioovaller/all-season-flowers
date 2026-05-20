// src/test/compras/servicioAsync.test.js
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  guardarCompraCompleta,
  buscarCompras,
  getCompraEspecifica,
  formatearNumeroCompra,
  getVariedadesYGrados,
} from "../../services/compras/comprasService";

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

// ─── formatearNumeroCompra (función pura) ─────────────────────────────────────

describe("formatearNumeroCompra", () => {
  it("formatea con cero relleno a 6 dígitos", () => {
    expect(formatearNumeroCompra(1)).toBe("COMP-000001");
    expect(formatearNumeroCompra(42)).toBe("COMP-000042");
    expect(formatearNumeroCompra(123456)).toBe("COMP-123456");
  });

  it("retorna COMP-000000 si el id es 0 o nulo", () => {
    expect(formatearNumeroCompra(0)).toBe("COMP-000000");
    expect(formatearNumeroCompra(null)).toBe("COMP-000000");
    expect(formatearNumeroCompra(undefined)).toBe("COMP-000000");
  });
});

// ─── guardarCompraCompleta ────────────────────────────────────────────────────

describe("guardarCompraCompleta", () => {
  it("retorna datos del servidor al guardar", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        idEncabCompra: 7,
        numeroOrden: "COMP-000007",
      }),
    );
    const res = await guardarCompraCompleta({ encabezado: {}, empaques: [] });
    expect(res.success).toBe(true);
    expect(res.idEncabCompra).toBe(7);
  });

  it("lanza excepción si el servidor responde con error HTTP", async () => {
    vi.stubGlobal("fetch", mockFetch("Error", false, 500));
    await expect(guardarCompraCompleta({})).rejects.toThrow();
  });

  it("envía los datos al endpoint correcto", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await guardarCompraCompleta({
      encabezado: { IdProveedor: 2 },
      empaques: [],
    });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.encabezado.IdProveedor).toBe(2);
  });
});

// ─── buscarCompras ────────────────────────────────────────────────────────────

describe("buscarCompras", () => {
  it("retorna compras cuando la API responde", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, compras: [{ IdEncabCompra: 1 }], total: 1 }),
    );
    const res = await buscarCompras({ proveedor: 3 });
    expect(res.success).toBe(true);
    expect(res.compras).toHaveLength(1);
  });

  it("envía los filtros correctamente", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, compras: [], total: 0 }));
    await buscarCompras({ fechaInicio: "2024-01-01", estado: "activo" });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.fechaInicio).toBe("2024-01-01");
  });

  it("lanza excepción ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    await expect(buscarCompras()).rejects.toThrow();
  });
});

// ─── getCompraEspecifica ──────────────────────────────────────────────────────

describe("getCompraEspecifica", () => {
  it("retorna datos de la compra", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        encabezado: { IdEncabCompra: 5 },
        empaques: [],
      }),
    );
    const res = await getCompraEspecifica(5);
    expect(res.encabezado.IdEncabCompra).toBe(5);
  });

  it("envía el idCompra correcto", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await getCompraEspecifica(33);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.idCompra).toBe(33);
  });
});

// ─── getVariedadesYGrados — normalización ────────────────────────────────────

describe("getVariedadesYGrados (compras)", () => {
  it("normaliza IDs de variedades y grados a string", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        variedades: [{ id: 10, nombre: "Blanca" }],
        grados: [{ id: 5, nombre: "G40" }],
      }),
    );
    const res = await getVariedadesYGrados(1);
    expect(res.variedades[0].id).toBe("10");
    expect(res.grados[0].id).toBe("5");
  });

  it("retorna arrays vacíos si la API no devuelve datos", async () => {
    vi.stubGlobal("fetch", mockFetch({}));
    const res = await getVariedadesYGrados(1);
    expect(res.variedades).toEqual([]);
    expect(res.grados).toEqual([]);
  });
});
