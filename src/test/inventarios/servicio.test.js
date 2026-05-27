import { describe, it, expect, afterEach, vi } from "vitest";
import { getInventario } from "../../services/inventarios/inventariosService";

function mockFetch(body, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("inventariosService", () => {
  describe("getInventario", () => {
    it("retorna inventario agrupado en éxito para nivel 1", async () => {
      const resp = {
        success: true,
        nivel: 1,
        fechaInicio: "2026-01-01",
        fechaFin: "2026-05-23",
        inventarios: [
          {
            idProducto: 1,
            producto: "Rosa",
            variedad: null,
            grado: null,
            entradas: 5000,
            salidas: 3200,
            saldo: 1800,
            movimientos: [
              { fecha: "2026-01-15", tipoDocumento: "Compra", numeroDocumento: "COMP-000001", tallos: 2000, direccion: "entrada" },
            ],
          },
        ],
        resumen: { totalEntradas: 5000, totalSalidas: 3200, totalSaldo: 1800 },
      };
      vi.stubGlobal("fetch", mockFetch(resp));
      const data = await getInventario({ fechaInicio: "2026-01-01", fechaFin: "2026-05-23", nivel: 1 });
      expect(data.success).toBe(true);
      expect(data.nivel).toBe(1);
      expect(data.inventarios).toHaveLength(1);
      expect(data.inventarios[0].producto).toBe("Rosa");
      expect(data.inventarios[0].saldo).toBe(1800);
      expect(data.inventarios[0].movimientos).toHaveLength(1);
      expect(data.resumen.totalSaldo).toBe(1800);
    });

    it("retorna inventario para nivel 3 con variedad y grado", async () => {
      const resp = {
        success: true,
        nivel: 3,
        inventarios: [
          {
            idProducto: 1,
            producto: "Rosa",
            variedad: "Red",
            grado: "40cm",
            entradas: 1000,
            salidas: 500,
            saldo: 500,
            movimientos: [],
          },
        ],
        resumen: { totalEntradas: 1000, totalSalidas: 500, totalSaldo: 500 },
      };
      vi.stubGlobal("fetch", mockFetch(resp));
      const data = await getInventario({ fechaInicio: "2026-01-01", fechaFin: "2026-05-23", nivel: 3 });
      expect(data.success).toBe(true);
      expect(data.inventarios[0].variedad).toBe("Red");
      expect(data.inventarios[0].grado).toBe("40cm");
    });

    it("retorna fallback con arrays vacíos en error de red", async () => {
      vi.stubGlobal("fetch", mockFetch(null, false, 500));
      const data = await getInventario({ fechaInicio: "2026-01-01", fechaFin: "2026-05-23", nivel: 1 });
      expect(data.success).toBe(false);
      expect(data.inventarios).toEqual([]);
      expect(data.resumen.totalSaldo).toBe(0);
    });

    it("retorna fallback cuando success es false", async () => {
      vi.stubGlobal("fetch", mockFetch({ success: false, message: "Error" }));
      const data = await getInventario({});
      expect(data.success).toBe(false);
      expect(data.inventarios).toEqual([]);
    });

    it("usa valores por defecto cuando no se pasan filtros", async () => {
      vi.stubGlobal("fetch", mockFetch({ success: true, inventarios: [], resumen: { totalEntradas: 0, totalSalidas: 0, totalSaldo: 0 } }));
      const data = await getInventario({});
      expect(data.success).toBe(true);
    });
  });
});
