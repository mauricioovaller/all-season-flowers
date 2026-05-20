// src/test/grados/servicio.test.js
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getGrados,
  getGradoById,
  guardarGrado,
  eliminarGrado,
  validarNombreGradoExistente,
  getProductosParaSelector,
} from "../../services/grados/gradosService";

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

describe("getProductosParaSelector (grados)", () => {
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
  });

  it("retorna array vacío ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    expect(await getProductosParaSelector()).toEqual([]);
  });
});

// ─── getGrados ────────────────────────────────────────────────────────────────

describe("getGrados", () => {
  it("retorna grados en respuesta exitosa", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, grados: [{ IdGrado: 1 }], total: 1 }),
    );
    const res = await getGrados();
    expect(res.success).toBe(true);
    expect(res.grados).toHaveLength(1);
  });

  it("retorna fallback con lista vacía ante error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    const res = await getGrados();
    expect(res.grados).toEqual([]);
  });

  it("envía filtros correctamente", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, grados: [], total: 0 }));
    await getGrados({ busqueda: "grado10", estado: "activo" });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.busqueda).toBe("grado10");
  });
});

// ─── getGradoById ─────────────────────────────────────────────────────────────

describe("getGradoById", () => {
  it("retorna el grado cuando existe", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, grado: { IdGrado: 3 } }));
    const res = await getGradoById(3);
    expect(res.grado.IdGrado).toBe(3);
  });

  it("lanza excepción cuando no existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "No encontrado" }),
    );
    await expect(getGradoById(999)).rejects.toThrow();
  });
});

// ─── guardarGrado — normalización ────────────────────────────────────────────

describe("guardarGrado — normalización de datos", () => {
  it("convierte ACTIVO=true a 1", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await guardarGrado({ NOMBRE: "G10", ACTIVO: true });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.ACTIVO).toBe(1);
  });

  it("convierte ACTIVO=false a 0", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await guardarGrado({ NOMBRE: "G10", ACTIVO: false });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.ACTIVO).toBe(0);
  });
});

// ─── guardarGrado — mensajes de error ────────────────────────────────────────

describe("guardarGrado — mensajes de error", () => {
  it("mensaje claro cuando el nombre ya existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: false,
        message: "Ya existe un grado con ese nombre",
      }),
    );
    await expect(guardarGrado({ NOMBRE: "G10", ACTIVO: true })).rejects.toThrow(
      /nombre.*producto/i,
    );
  });
});

// ─── eliminarGrado ────────────────────────────────────────────────────────────

describe("eliminarGrado", () => {
  it("retorna success:true al eliminar", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    expect((await eliminarGrado(1)).success).toBe(true);
  });
});

// ─── validarNombreGradoExistente ──────────────────────────────────────────────

describe("validarNombreGradoExistente", () => {
  it("retorna false sin llamar al servidor si nombre o producto vacío", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await validarNombreGradoExistente("", 1)).toBe(false);
    expect(await validarNombreGradoExistente("G10", null)).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("retorna true cuando el nombre ya existe", async () => {
    vi.stubGlobal("fetch", mockFetch({ existe: true }));
    expect(await validarNombreGradoExistente("G10", 1)).toBe(true);
  });

  it("retorna false (no bloquear) ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    expect(await validarNombreGradoExistente("G10", 1)).toBe(false);
  });
});
