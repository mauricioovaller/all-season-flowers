// src/test/empaques/servicio.test.js
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getEmpaques,
  guardarEmpaque,
  eliminarEmpaque,
  validarAbreviatura as validarAbreviaturaEmpaque,
} from "../../services/empaques/empaquesService";

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

describe("getEmpaques", () => {
  it("retorna empaques en respuesta exitosa", async () => {
    const empaques = [
      {
        IdTipoEmpaque: 1,
        Abreviatura: "FULL",
        Descripcion: "Full Box",
        EquivFull: 1.0,
      },
    ];
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, empaques, estadisticas: { total: 1 } }),
    );
    const result = await getEmpaques({});
    expect(result.success).toBe(true);
    expect(result.empaques).toEqual(empaques);
  });

  it("retorna fallback en error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );
    const result = await getEmpaques({});
    expect(result.success).toBe(false);
    expect(result.empaques).toEqual([]);
    expect(result.estadisticas).toEqual({ total: 0 });
  });
});

describe("guardarEmpaque", () => {
  it("convierte EquivFull a float", async () => {
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
    await guardarEmpaque({
      Abreviatura: "HLF",
      Descripcion: "Half Box",
      EquivFull: "0.5",
    });
    expect(body.EquivFull).toBe(0.5);
  });

  it("propaga mensaje de error específico", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        { success: false, message: "Ya existe un empaque con esa abreviatura" },
        true,
        200,
      ),
    );
    await expect(
      guardarEmpaque({
        Abreviatura: "FULL",
        Descripcion: "Full",
        EquivFull: 1,
      }),
    ).rejects.toThrow("Ya existe un empaque con esa abreviatura");
  });
});

describe("eliminarEmpaque", () => {
  it("retorna resultado exitoso", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, message: "Eliminado" }));
    const result = await eliminarEmpaque(1);
    expect(result.success).toBe(true);
  });
});

describe("validarAbreviaturaEmpaque", () => {
  it("retorna false en error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );
    const result = await validarAbreviaturaEmpaque("HLF", null);
    expect(result).toBe(false);
  });

  it("retorna true cuando la abreviatura existe", async () => {
    vi.stubGlobal("fetch", mockFetch({ existe: true }));
    const result = await validarAbreviaturaEmpaque("FULL", null);
    expect(result).toBe(true);
  });
});
