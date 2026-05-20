// src/test/productos/servicio.test.js
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getProductos,
  getProductoById,
  guardarProducto,
  eliminarProducto,
  validarNombreProductoExistente,
} from "../../services/productos/productosService";

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

// ─── getProductos ─────────────────────────────────────────────────────────────

describe("getProductos", () => {
  it("retorna productos en respuesta exitosa", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        productos: [{ IdProducto: 1, NOMBRE: "Rosa" }],
        total: 1,
      }),
    );
    const res = await getProductos();
    expect(res.success).toBe(true);
    expect(res.productos).toHaveLength(1);
  });

  it("retorna fallback con lista vacía ante error de API", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: false, message: "Error" }));
    const res = await getProductos();
    expect(res.success).toBe(false);
    expect(res.productos).toEqual([]);
  });

  it("retorna fallback ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    const res = await getProductos();
    expect(res.success).toBe(false);
  });

  it("envía filtros correctamente", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, productos: [], total: 0 }),
    );
    await getProductos({ busqueda: "rosa", estado: "activo" });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.busqueda).toBe("rosa");
  });
});

// ─── getProductoById ──────────────────────────────────────────────────────────

describe("getProductoById", () => {
  it("retorna el producto cuando existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        producto: { IdProducto: 5, NOMBRE: "Clavel" },
      }),
    );
    const res = await getProductoById(5);
    expect(res.producto.IdProducto).toBe(5);
  });

  it("lanza excepción cuando no existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "No encontrado" }),
    );
    await expect(getProductoById(999)).rejects.toThrow();
  });
});

// ─── guardarProducto — normalización ─────────────────────────────────────────

describe("guardarProducto — normalización de datos", () => {
  it("convierte ACTIVO=true a 1", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, idProducto: 1 }));
    await guardarProducto({ NOMBRE: "Rosa", ACTIVO: true });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.ACTIVO).toBe(1);
  });

  it("convierte ACTIVO=false a 0", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, idProducto: 1 }));
    await guardarProducto({ NOMBRE: "Rosa", ACTIVO: false });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.ACTIVO).toBe(0);
  });
});

// ─── guardarProducto — mensajes de error ─────────────────────────────────────

describe("guardarProducto — mensajes de error", () => {
  it("mensaje claro cuando el nombre ya existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: false,
        message: "Ya existe un producto con ese nombre",
      }),
    );
    await expect(
      guardarProducto({ NOMBRE: "Rosa", ACTIVO: true }),
    ).rejects.toThrow(/nombre diferente/i);
  });
});

// ─── eliminarProducto ─────────────────────────────────────────────────────────

describe("eliminarProducto", () => {
  it("retorna success:true al eliminar", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    expect((await eliminarProducto(1)).success).toBe(true);
  });
});

// ─── validarNombreProductoExistente ──────────────────────────────────────────

describe("validarNombreProductoExistente", () => {
  it("retorna false sin llamar al servidor si el nombre está vacío", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await validarNombreProductoExistente("")).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("retorna true cuando el nombre ya existe", async () => {
    vi.stubGlobal("fetch", mockFetch({ existe: true }));
    expect(await validarNombreProductoExistente("Rosa")).toBe(true);
  });

  it("retorna false (no bloquear) ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    expect(await validarNombreProductoExistente("Rosa")).toBe(false);
  });
});
