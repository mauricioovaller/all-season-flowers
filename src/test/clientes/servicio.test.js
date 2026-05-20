// src/test/clientes/servicio.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getClientes,
  getClienteById,
  guardarCliente,
  eliminarCliente,
  validarNITExistente,
} from "../../services/clientes/clientesService";

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

// ─── getClientes ─────────────────────────────────────────────────────────────

describe("getClientes", () => {
  it("retorna clientes en respuesta exitosa", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, clientes: [{ IdCliente: 1 }], total: 1 }),
    );
    const res = await getClientes();
    expect(res.success).toBe(true);
    expect(res.clientes).toHaveLength(1);
  });

  it("retorna fallback con success:false cuando la API falla", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: false, message: "Error BD" }));
    const res = await getClientes();
    expect(res.success).toBe(false);
    expect(res.clientes).toEqual([]);
  });

  it("retorna fallback cuando hay error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Failed to fetch")),
    );
    const res = await getClientes();
    expect(res.success).toBe(false);
    expect(res.clientes).toEqual([]);
  });

  it("envía los filtros al endpoint correcto", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, clientes: [], total: 0 }),
    );
    await getClientes({ busqueda: "test", estado: "activo" });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.busqueda).toBe("test");
    expect(body.estado).toBe("activo");
  });
});

// ─── getClienteById ──────────────────────────────────────────────────────────

describe("getClienteById", () => {
  it("retorna el cliente cuando existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, cliente: { IdCliente: 5, NOMBRE: "Test" } }),
    );
    const res = await getClienteById(5);
    expect(res.success).toBe(true);
    expect(res.cliente.IdCliente).toBe(5);
  });

  it("lanza excepción cuando el cliente no existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "Cliente no encontrado" }),
    );
    await expect(getClienteById(999)).rejects.toThrow();
  });
});

// ─── guardarCliente — normalización de datos ─────────────────────────────────

describe("guardarCliente — normalización de datos", () => {
  it("convierte ACTIVO=true a 1", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, idCliente: 1 }));
    await guardarCliente({ NOMBRE: "Test", ACTIVO: true, IVA: false });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.ACTIVO).toBe(1);
  });

  it("convierte ACTIVO=false a 0", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, idCliente: 1 }));
    await guardarCliente({ NOMBRE: "Test", ACTIVO: false, IVA: false });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.ACTIVO).toBe(0);
  });

  it("convierte IVA=true a 1", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, idCliente: 1 }));
    await guardarCliente({ NOMBRE: "Test", ACTIVO: true, IVA: true });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.IVA).toBe(1);
  });
});

// ─── guardarCliente — mensajes de error específicos ──────────────────────────

describe("guardarCliente — mensajes de error", () => {
  it("mensaje claro cuando el NIT ya está registrado", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "NIT ya está registrado" }),
    );
    await expect(
      guardarCliente({ NOMBRE: "Test", ACTIVO: true, IVA: false }),
    ).rejects.toThrow(/NIT ya está registrado/i);
  });

  it("mensaje claro cuando el nombre ya existe", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: false,
        message: "Ya existe un cliente con ese nombre",
      }),
    );
    await expect(
      guardarCliente({ NOMBRE: "Test", ACTIVO: true, IVA: false }),
    ).rejects.toThrow(/nombre diferente/i);
  });
});

// ─── eliminarCliente ─────────────────────────────────────────────────────────

describe("eliminarCliente", () => {
  it("retorna success:true al eliminar", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, message: "Eliminado" }));
    const res = await eliminarCliente(3);
    expect(res.success).toBe(true);
  });

  it("lanza excepción cuando falla", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: false, message: "Error" }));
    await expect(eliminarCliente(999)).rejects.toThrow();
  });
});

// ─── validarNITExistente ─────────────────────────────────────────────────────

describe("validarNITExistente", () => {
  it("retorna false sin llamar al servidor si el NIT está vacío", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const resultado = await validarNITExistente("");
    expect(resultado).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("retorna true cuando el NIT ya existe", async () => {
    vi.stubGlobal("fetch", mockFetch({ existe: true }));
    expect(await validarNITExistente("900123456")).toBe(true);
  });

  it("retorna false cuando el NIT no existe", async () => {
    vi.stubGlobal("fetch", mockFetch({ existe: false }));
    expect(await validarNITExistente("900999000")).toBe(false);
  });

  it("retorna false (no bloquear) si hay error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );
    expect(await validarNITExistente("900123456")).toBe(false);
  });
});
