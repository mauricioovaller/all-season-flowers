// src/test/proveedores/servicio.test.js
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getProveedores,
  getProveedorById,
  guardarProveedor,
  eliminarProveedor,
  validarNITExistente,
  getUltimoCodigoProveedor,
} from "../../services/proveedores/proveedoresService";

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

// ─── getProveedores ──────────────────────────────────────────────────────────

describe("getProveedores", () => {
  it("retorna proveedores en respuesta exitosa", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, proveedores: [{ IdProveedor: 1 }], total: 1 }),
    );
    const res = await getProveedores();
    expect(res.success).toBe(true);
    expect(res.proveedores).toHaveLength(1);
  });

  it("retorna fallback con lista vacía cuando la API falla", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: false, message: "Error" }));
    const res = await getProveedores();
    expect(res.success).toBe(false);
    expect(res.proveedores).toEqual([]);
  });

  it("retorna fallback ante error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Failed to fetch")),
    );
    const res = await getProveedores();
    expect(res.success).toBe(false);
  });

  it("envía filtros correctamente", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, proveedores: [], total: 0 }),
    );
    await getProveedores({ busqueda: "flores", estado: "activo" });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.busqueda).toBe("flores");
  });
});

// ─── getProveedorById ────────────────────────────────────────────────────────

describe("getProveedorById", () => {
  it("retorna el proveedor cuando existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, proveedor: { IdProveedor: 2 } }),
    );
    const res = await getProveedorById(2);
    expect(res.proveedor.IdProveedor).toBe(2);
  });

  it("lanza excepción cuando no existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "No encontrado" }),
    );
    await expect(getProveedorById(999)).rejects.toThrow();
  });
});

// ─── guardarProveedor — normalización ────────────────────────────────────────

describe("guardarProveedor — normalización de datos", () => {
  it("convierte IVA=true a 1", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, idProveedor: 1 }));
    await guardarProveedor({ NOMBRE: "Test", IVA: true, Estado: "Activo" });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.IVA).toBe(1);
  });

  it("convierte IVA=false a 0", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, idProveedor: 1 }));
    await guardarProveedor({ NOMBRE: "Test", IVA: false, Estado: "Activo" });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.IVA).toBe(0);
  });

  it('asigna Estado="Activo" por defecto si no se proporciona', async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, idProveedor: 1 }));
    await guardarProveedor({ NOMBRE: "Test", IVA: false });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.Estado).toBe("Activo");
  });
});

// ─── guardarProveedor — mensajes de error ────────────────────────────────────

describe("guardarProveedor — mensajes de error", () => {
  it("mensaje claro cuando NIT ya está registrado", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "NIT ya está registrado" }),
    );
    await expect(
      guardarProveedor({ NOMBRE: "Test", IVA: false }),
    ).rejects.toThrow(/NIT ya está registrado/i);
  });

  it("mensaje claro cuando nombre ya existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: false,
        message: "Ya existe un proveedor con ese nombre",
      }),
    );
    await expect(
      guardarProveedor({ NOMBRE: "Test", IVA: false }),
    ).rejects.toThrow(/nombre diferente/i);
  });
});

// ─── eliminarProveedor ───────────────────────────────────────────────────────

describe("eliminarProveedor", () => {
  it("retorna success:true al eliminar", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, message: "Eliminado" }));
    const res = await eliminarProveedor(1);
    expect(res.success).toBe(true);
  });
});

// ─── getUltimoCodigoProveedor — fallback ─────────────────────────────────────

describe("getUltimoCodigoProveedor — fallback", () => {
  it("devuelve PROV-001 por defecto si la API falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );
    const res = await getUltimoCodigoProveedor();
    expect(res.success).toBe(true);
    expect(res.siguienteCodigo).toBe("PROV-001");
  });
});

// ─── validarNITExistente ─────────────────────────────────────────────────────

describe("validarNITExistente (proveedores)", () => {
  it("retorna false sin llamar al servidor si el NIT está vacío", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await validarNITExistente("")).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("retorna true cuando el NIT ya existe", async () => {
    vi.stubGlobal("fetch", mockFetch({ existe: true }));
    expect(await validarNITExistente("900123456")).toBe(true);
  });

  it("retorna false (no bloquear) ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    expect(await validarNITExistente("900123456")).toBe(false);
  });
});
