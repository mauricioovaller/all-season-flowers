// src/test/variedades/servicio.test.js
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getVariedades,
  getVariedadById,
  guardarVariedad,
  eliminarVariedad,
  validarNombreVariedadExistente,
  getProductosParaSelector,
} from "../../services/variedades/variedadesService";

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

// ─── getProductosParaSelector ─────────────────────────────────────────────────

describe("getProductosParaSelector", () => {
  it("retorna los productos cuando hay éxito", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        productos: [{ IdProducto: 1, NOMBRE: "Rosa" }],
      }),
    );
    const res = await getProductosParaSelector();
    expect(res).toHaveLength(1);
    expect(res[0].NOMBRE).toBe("Rosa");
  });

  it("retorna array vacío ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    expect(await getProductosParaSelector()).toEqual([]);
  });
});

// ─── getVariedades ────────────────────────────────────────────────────────────

describe("getVariedades", () => {
  it("retorna variedades en respuesta exitosa", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, variedades: [{ IdVariedad: 1 }], total: 1 }),
    );
    const res = await getVariedades();
    expect(res.success).toBe(true);
    expect(res.variedades).toHaveLength(1);
  });

  it("retorna fallback con lista vacía ante error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    const res = await getVariedades();
    expect(res.variedades).toEqual([]);
  });
});

// ─── getVariedadById ──────────────────────────────────────────────────────────

describe("getVariedadById", () => {
  it("retorna la variedad cuando existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, variedad: { IdVariedad: 2 } }),
    );
    const res = await getVariedadById(2);
    expect(res.variedad.IdVariedad).toBe(2);
  });

  it("lanza excepción cuando no existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "No encontrada" }),
    );
    await expect(getVariedadById(999)).rejects.toThrow();
  });
});

// ─── guardarVariedad — normalización ─────────────────────────────────────────

describe("guardarVariedad — normalización de datos", () => {
  it("convierte ACTIVO=true a 1", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await guardarVariedad({ NOMBRE: "Roja", ACTIVO: true });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.ACTIVO).toBe(1);
  });

  it("convierte ACTIVO=false a 0", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await guardarVariedad({ NOMBRE: "Roja", ACTIVO: false });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.ACTIVO).toBe(0);
  });
});

// ─── guardarVariedad — mensajes de error ─────────────────────────────────────

describe("guardarVariedad — mensajes de error", () => {
  it("mensaje claro cuando el nombre ya existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: false,
        message: "Ya existe una variedad con ese nombre",
      }),
    );
    await expect(
      guardarVariedad({ NOMBRE: "Roja", ACTIVO: true }),
    ).rejects.toThrow(/nombre.*producto/i);
  });
});

// ─── eliminarVariedad ─────────────────────────────────────────────────────────

describe("eliminarVariedad", () => {
  it("retorna success:true al eliminar", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    expect((await eliminarVariedad(1)).success).toBe(true);
  });
});

// ─── validarNombreVariedadExistente ──────────────────────────────────────────

describe("validarNombreVariedadExistente", () => {
  it("retorna false sin llamar al servidor si nombre o producto vacío", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await validarNombreVariedadExistente("", 1)).toBe(false);
    expect(await validarNombreVariedadExistente("Roja", null)).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("retorna true cuando el nombre ya existe", async () => {
    vi.stubGlobal("fetch", mockFetch({ existe: true }));
    expect(await validarNombreVariedadExistente("Roja", 1)).toBe(true);
  });

  it("retorna false (no bloquear) ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    expect(await validarNombreVariedadExistente("Roja", 1)).toBe(false);
  });
});
