import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getDatosSelectBajas,
  guardarBaja,
  getBajas,
  getBajaEspecifica,
  validarBaja,
} from "../../services/bajas/bajasService";

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

describe("bajasService", () => {
  describe("getDatosSelectBajas", () => {
    it("retorna productos, variedades y grados en éxito", async () => {
      const resp = {
        success: true,
        productos: [{ id: 1, nombre: "Rosa" }],
        variedades: [{ id: 1, idProducto: 1, nombre: "Red" }],
        grados: [{ id: 1, idProducto: 1, nombre: "40cm" }],
      };
      vi.stubGlobal("fetch", mockFetch(resp));
      const data = await getDatosSelectBajas();
      expect(data.success).toBe(true);
      expect(data.productos).toHaveLength(1);
      expect(data.variedades).toHaveLength(1);
      expect(data.grados).toHaveLength(1);
    });

    it("retorna fallback con arrays vacíos en error de red", async () => {
      vi.stubGlobal("fetch", mockFetch(null, false, 500));
      const data = await getDatosSelectBajas();
      expect(data.success).toBe(false);
      expect(data.productos).toEqual([]);
      expect(data.variedades).toEqual([]);
      expect(data.grados).toEqual([]);
    });

    it("retorna fallback cuando success es false", async () => {
      vi.stubGlobal("fetch", mockFetch({ success: false, message: "Error" }));
      const data = await getDatosSelectBajas();
      expect(data.success).toBe(false);
    });
  });

  describe("guardarBaja", () => {
    it("retorna el id de la baja guardada en éxito", async () => {
      const resp = { success: true, message: "Baja guardada", idEncabBaja: 1 };
      vi.stubGlobal("fetch", mockFetch(resp));
      const data = await guardarBaja({ encabezado: {}, detalles: [] });
      expect(data.success).toBe(true);
      expect(data.idEncabBaja).toBe(1);
    });

    it("lanza error cuando la respuesta no es exitosa", async () => {
      vi.stubGlobal("fetch", mockFetch({ success: false, message: "Error al guardar" }));
      await expect(guardarBaja({})).rejects.toThrow("Error al guardar");
    });

    it("lanza error en fallo de red", async () => {
      vi.stubGlobal("fetch", mockFetch(null, false, 500));
      await expect(guardarBaja({})).rejects.toThrow();
    });
  });

  describe("getBajas", () => {
    it("retorna lista de bajas en éxito", async () => {
      const resp = {
        success: true,
        bajas: [{ idBaja: 1, numeroBaja: "BAJA-000001", fecha: "2026-05-01" }],
        total: 1,
      };
      vi.stubGlobal("fetch", mockFetch(resp));
      const data = await getBajas({});
      expect(data.success).toBe(true);
      expect(data.bajas).toHaveLength(1);
    });

    it("retorna fallback con array vacío en error", async () => {
      vi.stubGlobal("fetch", mockFetch(null, false, 500));
      const data = await getBajas({});
      expect(data.success).toBe(false);
      expect(data.bajas).toEqual([]);
      expect(data.total).toBe(0);
    });
  });

  describe("getBajaEspecifica", () => {
    it("retorna baja completa en éxito", async () => {
      const resp = {
        success: true,
        baja: {
          header: { IdEncabBaja: 1, Fecha: "2026-05-01" },
          detalles: [{ producto: 1, tallos: 100 }],
        },
      };
      vi.stubGlobal("fetch", mockFetch(resp));
      const data = await getBajaEspecifica(1);
      expect(data.success).toBe(true);
      expect(data.baja.header.IdEncabBaja).toBe(1);
    });

    it("lanza error cuando falla", async () => {
      vi.stubGlobal("fetch", mockFetch(null, false, 404));
      await expect(getBajaEspecifica(999)).rejects.toThrow();
    });
  });

  describe("validarBaja", () => {
    it("retorna array vacío para datos válidos", () => {
      const enc = { Fecha: "2026-05-01", MotivoGeneral: "Daño" };
      const det = [{ IdProducto: 1, Tallos: 100 }];
      expect(validarBaja(enc, det)).toEqual([]);
    });

    it("retorna error si falta fecha", () => {
      const errores = validarBaja({ MotivoGeneral: "Daño" }, [{ IdProducto: 1, Tallos: 100 }]);
      expect(errores.some((e) => e.includes("fecha"))).toBe(true);
    });

    it("retorna error si falta motivo general", () => {
      const errores = validarBaja({ Fecha: "2026-05-01" }, [{ IdProducto: 1, Tallos: 100 }]);
      expect(errores.some((e) => e.includes("motivo"))).toBe(true);
    });

    it("retorna error si no hay detalles", () => {
      const errores = validarBaja({ Fecha: "2026-05-01", MotivoGeneral: "Daño" }, []);
      expect(errores.some((e) => e.includes("al menos un detalle"))).toBe(true);
    });

    it("retorna error si producto es inválido", () => {
      const errores = validarBaja(
        { Fecha: "2026-05-01", MotivoGeneral: "Daño" },
        [{ IdProducto: 0, Tallos: 100 }]
      );
      expect(errores.some((e) => e.includes("producto"))).toBe(true);
    });

    it("retorna error si tallos son 0", () => {
      const errores = validarBaja(
        { Fecha: "2026-05-01", MotivoGeneral: "Daño" },
        [{ IdProducto: 1, Tallos: 0 }]
      );
      expect(errores.some((e) => e.includes("tallos"))).toBe(true);
    });
  });
});
