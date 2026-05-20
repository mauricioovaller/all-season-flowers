// src/test/conductores/servicio.test.js
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getConductores,
  getConductorById,
  guardarConductor,
  eliminarConductor,
  validarCampoUnico,
} from "../../services/conductores/conductoresService";

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

// ─── getConductores ──────────────────────────────────────────────────────────

describe("getConductores", () => {
  it("retorna conductores en respuesta exitosa", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, conductores: [{ IdConductor: 1 }], total: 1 }),
    );
    const res = await getConductores();
    expect(res.success).toBe(true);
    expect(res.conductores).toHaveLength(1);
  });

  it("retorna fallback con lista vacía ante error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    const res = await getConductores();
    expect(res.conductores).toEqual([]);
  });
});

// ─── getConductorById ────────────────────────────────────────────────────────

describe("getConductorById", () => {
  it("retorna el conductor cuando existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, conductor: { IdConductor: 3 } }),
    );
    const res = await getConductorById(3);
    expect(res.conductor.IdConductor).toBe(3);
  });

  it("lanza excepción cuando no existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "No encontrado" }),
    );
    await expect(getConductorById(999)).rejects.toThrow();
  });
});

// ─── guardarConductor — normalización ────────────────────────────────────────

describe("guardarConductor — normalización de datos", () => {
  it("convierte ACTIVO=true a 1", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await guardarConductor({ NOMBRE: "Test", ACTIVO: true });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.ACTIVO).toBe(1);
  });

  it("convierte ACTIVO=false a 0", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await guardarConductor({ NOMBRE: "Test", ACTIVO: false });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.ACTIVO).toBe(0);
  });
});

// ─── guardarConductor — mensajes de error ────────────────────────────────────

describe("guardarConductor — mensajes de error", () => {
  it("mensaje claro cuando el nombre ya existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: false,
        message: "Ya existe un conductor con ese nombre",
      }),
    );
    await expect(
      guardarConductor({ NOMBRE: "Test", ACTIVO: true }),
    ).rejects.toThrow(/nombre/i);
  });

  it("mensaje claro cuando la cédula ya existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: false,
        message: "Ya existe un conductor con esa cédula",
      }),
    );
    await expect(
      guardarConductor({ NOMBRE: "Test", ACTIVO: true }),
    ).rejects.toThrow(/cédula/i);
  });

  it("mensaje claro cuando las placas ya existen", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: false,
        message: "Ya existe un conductor con esas placas",
      }),
    );
    await expect(
      guardarConductor({ NOMBRE: "Test", ACTIVO: true }),
    ).rejects.toThrow(/placas/i);
  });
});

// ─── eliminarConductor ───────────────────────────────────────────────────────

describe("eliminarConductor", () => {
  it("retorna success:true al eliminar", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    const res = await eliminarConductor(1);
    expect(res.success).toBe(true);
  });
});

// ─── validarCampoUnico ───────────────────────────────────────────────────────

describe("validarCampoUnico", () => {
  it("retorna false sin llamar servidor si el valor está vacío", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await validarCampoUnico("cedula", "")).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("retorna true cuando el campo ya existe", async () => {
    vi.stubGlobal("fetch", mockFetch({ existe: true }));
    expect(await validarCampoUnico("cedula", "12345678")).toBe(true);
  });

  it("retorna false (no bloquear) ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    expect(await validarCampoUnico("cedula", "12345678")).toBe(false);
  });
});
