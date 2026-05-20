// src/test/ejecutivosVenta/servicio.test.js
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getEjecutivosVenta,
  guardarEjecutivoVenta,
  eliminarEjecutivoVenta,
  validarNombreEjecutivoVenta,
} from "../../services/ejecutivosVenta/ejecutivosVentaService";

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

describe("getEjecutivosVenta", () => {
  it("retorna ejecutivos en respuesta exitosa", async () => {
    const ejecutivos = [
      { IdEjecutivo: 1, NOMEJECUTIVO: "Ana Pérez", ACTIVO: 1 },
    ];
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        ejecutivos,
        estadisticas: { total: 1, activos: 1, inactivos: 0 },
      }),
    );
    const result = await getEjecutivosVenta({});
    expect(result.success).toBe(true);
    expect(result.ejecutivos).toEqual(ejecutivos);
  });

  it("retorna fallback en error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );
    const result = await getEjecutivosVenta({});
    expect(result.success).toBe(false);
    expect(result.ejecutivos).toEqual([]);
    expect(result.estadisticas).toEqual({ total: 0, activos: 0, inactivos: 0 });
  });
});

describe("guardarEjecutivoVenta", () => {
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
    await guardarEjecutivoVenta({ NOMEJECUTIVO: "Test", ACTIVO: true });
    expect(body.ACTIVO).toBe(1);
  });

  it("propaga mensaje de error específico", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        {
          success: false,
          message: "Ya existe un ejecutivo de venta con ese nombre",
        },
        true,
        200,
      ),
    );
    await expect(
      guardarEjecutivoVenta({ NOMEJECUTIVO: "Test", ACTIVO: 1 }),
    ).rejects.toThrow("Ya existe un ejecutivo de venta con ese nombre");
  });
});

describe("eliminarEjecutivoVenta", () => {
  it("retorna resultado exitoso", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, message: "Desactivado" }),
    );
    const result = await eliminarEjecutivoVenta(1);
    expect(result.success).toBe(true);
  });
});

describe("validarNombreEjecutivoVenta", () => {
  it("retorna false en error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );
    const result = await validarNombreEjecutivoVenta("Test", null);
    expect(result).toBe(false);
  });

  it("retorna true cuando el nombre existe", async () => {
    vi.stubGlobal("fetch", mockFetch({ existe: true }));
    const result = await validarNombreEjecutivoVenta("Existente", null);
    expect(result).toBe(true);
  });
});
