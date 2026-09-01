// src/test/ayudantes/servicio.test.js
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getAyudantes,
  getAyudanteById,
  guardarAyudante,
  eliminarAyudante,
} from "../../services/ayudantes/ayudantesService";

function mockFetch(body, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

afterEach(() => vi.unstubAllGlobals());

// ─── getAyudantes ────────────────────────────────────────────────────────────

describe("getAyudantes", () => {
  it("retorna ayudantes en respuesta exitosa", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, ayudantes: [{ IdAyudante: 1 }], total: 1 }),
    );
    const res = await getAyudantes();
    expect(res.success).toBe(true);
    expect(res.ayudantes).toHaveLength(1);
  });

  it("retorna fallback con lista vacía ante error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    const res = await getAyudantes();
    expect(res.ayudantes).toEqual([]);
  });
});

// ─── getAyudanteById ─────────────────────────────────────────────────────────

describe("getAyudanteById", () => {
  it("retorna el ayudante cuando existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, ayudante: { IdAyudante: 4 } }),
    );
    const res = await getAyudanteById(4);
    expect(res.ayudante.IdAyudante).toBe(4);
  });

  it("lanza excepción cuando no existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "No encontrado" }),
    );
    await expect(getAyudanteById(999)).rejects.toThrow();
  });
});

// ─── guardarAyudante — normalización de datos ────────────────────────────────

describe("guardarAyudante — normalización de datos", () => {
  it("convierte ACTIVO=true a 1", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await guardarAyudante({ NOMBRE: "Test", ACTIVO: true, NoCedula: "" });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.ACTIVO).toBe(1);
  });

  it("convierte NoCedula vacío a null", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await guardarAyudante({ NOMBRE: "Test", ACTIVO: true, NoCedula: "" });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.NoCedula).toBeNull();
  });

  it("mantiene NoCedula como string (permite separadores / y -)", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await guardarAyudante({
      NOMBRE: "Test",
      ACTIVO: true,
      NoCedula: "98765432",
    });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.NoCedula).toBe("98765432");
  });
});

// ─── guardarAyudante — mensajes de error ─────────────────────────────────────

describe("guardarAyudante — mensajes de error", () => {
  it("mensaje claro cuando el nombre ya existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: false,
        message: "Ya existe un ayudante con ese nombre",
      }),
    );
    await expect(
      guardarAyudante({ NOMBRE: "Test", ACTIVO: true, NoCedula: "" }),
    ).rejects.toThrow(/nombre/i);
  });

  it("mensaje claro cuando la cédula ya existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: false,
        message: "Ya existe un ayudante con esa cédula",
      }),
    );
    await expect(
      guardarAyudante({ NOMBRE: "Test", ACTIVO: true, NoCedula: "12345" }),
    ).rejects.toThrow(/cédula/i);
  });
});

// ─── eliminarAyudante ────────────────────────────────────────────────────────

describe("eliminarAyudante", () => {
  it("retorna success:true al eliminar", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    const res = await eliminarAyudante(2);
    expect(res.success).toBe(true);
  });

  it("lanza excepción si falla", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: false, message: "Error" }));
    await expect(eliminarAyudante(999)).rejects.toThrow();
  });
});
