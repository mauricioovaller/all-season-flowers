// src/test/agencias/servicio.test.js
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getAgencias,
  guardarAgencia,
  eliminarAgencia,
  validarNombreAgencia,
} from "../../services/agencias/agenciasService";

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

describe("getAgencias", () => {
  it("retorna agencias en respuesta exitosa", async () => {
    const agencias = [{ IdAgencia: 1, NOMAGENCIA: "Agencia ABC" }];
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, agencias, estadisticas: { total: 1 } }),
    );
    const result = await getAgencias({});
    expect(result.success).toBe(true);
    expect(result.agencias).toEqual(agencias);
  });

  it("retorna fallback en error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );
    const result = await getAgencias({});
    expect(result.success).toBe(false);
    expect(result.agencias).toEqual([]);
    expect(result.estadisticas).toEqual({ total: 0 });
  });
});

describe("guardarAgencia", () => {
  it("guarda correctamente y retorna success", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, message: "Guardada correctamente" }),
    );
    const result = await guardarAgencia({ NOMAGENCIA: "Agencia ABC" });
    expect(result.success).toBe(true);
  });

  it("propaga mensaje de error específico", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        { success: false, message: "Ya existe una agencia con ese nombre" },
        true,
        200,
      ),
    );
    await expect(guardarAgencia({ NOMAGENCIA: "Agencia ABC" })).rejects.toThrow(
      "Ya existe una agencia con ese nombre",
    );
  });
});

describe("eliminarAgencia", () => {
  it("retorna resultado exitoso", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, message: "Eliminada" }));
    const result = await eliminarAgencia(1);
    expect(result.success).toBe(true);
  });
});

describe("validarNombreAgencia", () => {
  it("retorna false en error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );
    const result = await validarNombreAgencia("Agencia ABC", null);
    expect(result).toBe(false);
  });

  it("retorna true cuando el nombre existe", async () => {
    vi.stubGlobal("fetch", mockFetch({ existe: true }));
    const result = await validarNombreAgencia("Agencia ABC", null);
    expect(result).toBe(true);
  });
});
