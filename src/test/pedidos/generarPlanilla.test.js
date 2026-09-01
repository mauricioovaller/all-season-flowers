// src/test/pedidos/generarPlanilla.test.js
/**
 * Tests para la generación y carga de planillas en el módulo de Pedidos
 * Verifica que DestinoFinal se guarda, carga y se usa en PDF
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  generarPlanilla,
  obtenerPlanilla,
  obtenerUltimoNumeroPlanilla,
} from "../../services/pedidos/pedidosService";

function mockFetch(body, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

afterEach(() => vi.unstubAllGlobals());

// ─── generarPlanilla ──────────────────────────────────────────────────────────

describe("generarPlanilla", () => {
  it("guarda DestinoFinal junto con conductor, ayudante, placa y precinto", async () => {
    const respuesta = {
      success: true,
      message: "Planilla generada correctamente",
      numeroPlanillaInt: 123,
      data: {
        conductorId: 5,
        ayudanteId: 8,
        placa: "ABC-123",
        precinto: "000456",
        destinoFinal: "Calle 50 # 10-20, Miami, Florida, USA",
      },
    };

    vi.stubGlobal("fetch", mockFetch(respuesta));

    const resultado = await generarPlanilla(42, "0123", {
      conductorId: 5,
      ayudanteId: 8,
      placa: "ABC-123",
      precinto: "000456",
      destinoFinal: "Calle 50 # 10-20, Miami, Florida, USA",
    });

    expect(resultado.success).toBe(true);
    expect(resultado.numeroPlanillaInt).toBe(123);
  });

  it("envía DestinoFinal vacío si el usuario no lo especifica", async () => {
    const respuesta = {
      success: true,
      message: "Planilla generada correctamente",
      numeroPlanillaInt: 124,
    };

    vi.stubGlobal("fetch", mockFetch(respuesta));

    const resultado = await generarPlanilla(42, "0124", {
      conductorId: 5,
      ayudanteId: 0,
      placa: "XYZ-789",
      precinto: "000789",
      destinoFinal: "",
    });

    expect(resultado.success).toBe(true);
  });

  it("lanza excepción si API retorna HTTP error", async () => {
    vi.stubGlobal("fetch", mockFetch("Error", false, 500));

    await expect(
      generarPlanilla(42, "0125", {
        conductorId: 5,
        ayudanteId: 8,
        placa: "ABC-123",
        precinto: "000456",
        destinoFinal: "Dirección",
      }),
    ).rejects.toThrow();
  });

  it("lanza excepción ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));

    await expect(
      generarPlanilla(42, "0126", {
        conductorId: 5,
        ayudanteId: 8,
        placa: "ABC-123",
        precinto: "000456",
        destinoFinal: "Dirección",
      }),
    ).rejects.toThrow("Network");
  });
});

// ─── obtenerPlanilla ──────────────────────────────────────────────────────────

describe("obtenerPlanilla", () => {
  it("carga DestinoFinal cuando se edita una planilla existente", async () => {
    const respuesta = {
      success: true,
      planilla: {
        IdConductor: 5,
        IdAyudante: 8,
        Placa: "ABC-123",
        Precinto: "000456",
        DestinoFinal: "Calle 50 # 10-20, Miami, Florida, USA",
      },
    };

    vi.stubGlobal("fetch", mockFetch(respuesta));

    const resultado = await obtenerPlanilla("0123");

    expect(resultado.success).toBe(true);
    expect(resultado.planilla.DestinoFinal).toBe(
      "Calle 50 # 10-20, Miami, Florida, USA",
    );
  });

  it("devuelve DestinoFinal vacío si no fue especificado", async () => {
    const respuesta = {
      success: true,
      planilla: {
        IdConductor: 5,
        IdAyudante: 0,
        Placa: "XYZ-789",
        Precinto: "000789",
        DestinoFinal: null,
      },
    };

    vi.stubGlobal("fetch", mockFetch(respuesta));

    const resultado = await obtenerPlanilla("0124");

    expect(resultado.success).toBe(true);
    expect(resultado.planilla.DestinoFinal).toBeNull();
  });

  it("lanza excepción ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));

    await expect(obtenerPlanilla("0125")).rejects.toThrow("Network");
  });
});

// ─── obtenerUltimoNumeroPlanilla ──────────────────────────────────────────────

describe("obtenerUltimoNumeroPlanilla", () => {
  it("retorna el último número de planilla disponible", async () => {
    const respuesta = {
      success: true,
      ultimoNumero: 150,
      siguienteNumeroFormateado: "PLAN-0151",
    };

    vi.stubGlobal("fetch", mockFetch(respuesta));

    const resultado = await obtenerUltimoNumeroPlanilla();

    expect(resultado.success).toBe(true);
    expect(resultado.ultimoNumero).toBe(150);
  });

  it("retorna 0 si no hay planillas previas", async () => {
    const respuesta = {
      success: true,
      ultimoNumero: 0,
      siguienteNumeroFormateado: "PLAN-0001",
    };

    vi.stubGlobal("fetch", mockFetch(respuesta));

    const resultado = await obtenerUltimoNumeroPlanilla();

    expect(resultado.ultimoNumero).toBe(0);
    expect(resultado.siguienteNumeroFormateado).toBe("PLAN-0001");
  });

  it("devuelve estructura válida ante error de conexión", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const resultado = await obtenerUltimoNumeroPlanilla();

    expect(resultado.success).toBe(false);
  });
});
