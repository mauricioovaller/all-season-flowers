// src/test/ejecutivosCompras/servicio.test.js
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getEjecutivosCompras,
  guardarEjecutivoCompra,
  eliminarEjecutivoCompra,
  validarNombreEjecutivoCompra,
} from "../../services/ejecutivosCompras/ejecutivosComprasService";

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

describe("getEjecutivosCompras", () => {
  it("retorna compradores en respuesta exitosa", async () => {
    const compradores = [
      { IdComprador: 1, NomComprador: "Carlos López", ACTIVO: 1 },
    ];
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        compradores,
        estadisticas: { total: 1, activos: 1, inactivos: 0 },
      }),
    );
    const result = await getEjecutivosCompras({});
    expect(result.success).toBe(true);
    expect(result.compradores).toEqual(compradores);
  });

  it("retorna fallback en error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );
    const result = await getEjecutivosCompras({});
    expect(result.success).toBe(false);
    expect(result.compradores).toEqual([]);
    expect(result.estadisticas).toEqual({ total: 0, activos: 0, inactivos: 0 });
  });
});

describe("guardarEjecutivoCompra", () => {
  it("normaliza ACTIVO true a 1", async () => {
    let body;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url, opts) => {
        body = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, message: "OK" }),
          text: async () => "{}",
        });
      }),
    );
    await guardarEjecutivoCompra({ NomComprador: "Test", ACTIVO: true });
    expect(body.ACTIVO).toBe(1);
  });

  it("propaga mensaje de error específico", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        {
          success: false,
          message: "Ya existe un ejecutivo de compras con ese nombre",
        },
        true,
        200,
      ),
    );
    await expect(
      guardarEjecutivoCompra({ NomComprador: "Test", ACTIVO: 1 }),
    ).rejects.toThrow("Ya existe un ejecutivo de compras con ese nombre");
  });
});

describe("eliminarEjecutivoCompra", () => {
  it("retorna resultado exitoso", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, message: "Desactivado" }),
    );
    const result = await eliminarEjecutivoCompra(1);
    expect(result.success).toBe(true);
  });
});

describe("validarNombreEjecutivoCompra", () => {
  it("retorna false en error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );
    const result = await validarNombreEjecutivoCompra("Test", null);
    expect(result).toBe(false);
  });

  it("retorna true cuando el nombre existe", async () => {
    vi.stubGlobal("fetch", mockFetch({ existe: true }));
    const result = await validarNombreEjecutivoCompra("Existente", null);
    expect(result).toBe(true);
  });
});
