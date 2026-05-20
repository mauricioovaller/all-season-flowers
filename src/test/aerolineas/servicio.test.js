// src/test/aerolineas/servicio.test.js
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getAerolineas,
  guardarAerolinea,
  eliminarAerolinea,
  validarNombreAerolinea,
} from "../../services/aerolineas/aerolineasService";

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

describe("getAerolineas", () => {
  it("retorna aerolineas en respuesta exitosa", async () => {
    const aerolineas = [
      { IdAerolinea: 1, NOMAEROLINEA: "Avianca", CODAEROLINEA: "AV" },
    ];
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, aerolineas, estadisticas: { total: 1 } }),
    );
    const result = await getAerolineas({});
    expect(result.success).toBe(true);
    expect(result.aerolineas).toEqual(aerolineas);
  });

  it("retorna fallback en error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );
    const result = await getAerolineas({});
    expect(result.success).toBe(false);
    expect(result.aerolineas).toEqual([]);
    expect(result.estadisticas).toEqual({ total: 0 });
  });
});

describe("guardarAerolinea", () => {
  it("guarda correctamente y retorna success", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, message: "Guardada correctamente" }),
    );
    const result = await guardarAerolinea({
      NOMAEROLINEA: "Avianca",
      CODAEROLINEA: "AV",
    });
    expect(result.success).toBe(true);
  });

  it("propaga mensaje de error específico", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        { success: false, message: "Ya existe una aerolínea con ese nombre" },
        true,
        200,
      ),
    );
    await expect(guardarAerolinea({ NOMAEROLINEA: "Avianca" })).rejects.toThrow(
      "Ya existe una aerolínea con ese nombre",
    );
  });
});

describe("eliminarAerolinea", () => {
  it("retorna resultado exitoso", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, message: "Eliminada" }));
    const result = await eliminarAerolinea(1);
    expect(result.success).toBe(true);
  });
});

describe("validarNombreAerolinea", () => {
  it("retorna false en error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );
    const result = await validarNombreAerolinea("Avianca", null);
    expect(result).toBe(false);
  });

  it("retorna true cuando el nombre existe", async () => {
    vi.stubGlobal("fetch", mockFetch({ existe: true }));
    const result = await validarNombreAerolinea("Avianca", null);
    expect(result).toBe(true);
  });
});
