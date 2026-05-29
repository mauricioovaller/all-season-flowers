// src/test/permisos/servicio.test.js
import { describe, it, expect, vi, afterEach } from "vitest";
import { getPermisos } from "../../services/permisos/permisosService";

function mockFetch(body, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("getPermisos", () => {
  it("retorna rutas en respuesta exitosa", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        permisos: [
          { nombreOpcion: "Clientes", ruta: "/clientes" },
          { nombreOpcion: "Pedidos", ruta: "/pedidos" },
        ],
      }),
    );
    const rutas = await getPermisos();
    expect(rutas).toEqual(["/clientes", "/pedidos"]);
  });

  it("retorna arreglo vacío cuando success es false", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: false }));
    const rutas = await getPermisos();
    expect(rutas).toEqual([]);
  });

  it("retorna arreglo vacío ante error HTTP", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: false }, false, 500));
    const rutas = await getPermisos();
    expect(rutas).toEqual([]);
  });

  it("retorna arreglo vacío ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    const rutas = await getPermisos();
    expect(rutas).toEqual([]);
  });

  it("retorna arreglo vacío cuando permisos no es un arreglo", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, permisos: "no-es-arreglo" }),
    );
    const rutas = await getPermisos();
    expect(rutas).toEqual([]);
  });

  it("envía POST con credentials include", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, permisos: [] }));
    await getPermisos();
    expect(fetch.mock.calls[0][1].method).toBe("POST");
    expect(fetch.mock.calls[0][1].credentials).toBe("include");
  });
});
