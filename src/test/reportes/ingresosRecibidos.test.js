// src/test/reportes/ingresosRecibidos.test.js
import { describe, it, expect, afterEach, vi } from "vitest";
import { getIngresosRecibidos } from "../../services/reportes/reportesService";

function mockFetch(body, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

const RESPUESTA_OK = {
  success: true,
  registros: [
    {
      numeroPago: "PAG-CLI-000006",
      idPago: 6,
      fecha: "2026-05-13",
      cliente: "Gl Colombian Flowers NJ LLC",
      medioPago: "TRANSFERENCIA",
      moneda: "Dólar Americano (USD)",
      monedaCorta: "USD",
      numeroFactura: 439,
      valorPago: 40.5,
      costoTransferencia: 0,
      netoRecibido: 40.5,
    },
    {
      numeroPago: "PAG-CLI-000006",
      idPago: 6,
      fecha: "2026-05-13",
      cliente: "Gl Colombian Flowers NJ LLC",
      medioPago: "TRANSFERENCIA",
      moneda: "Dólar Americano (USD)",
      monedaCorta: "USD",
      numeroFactura: 438,
      valorPago: 273.7,
      costoTransferencia: 0,
      netoRecibido: 273.7,
    },
  ],
  totales: {
    porMoneda: {
      USD: { valorPago: 314.2, costoTransferencia: 0, netoRecibido: 314.2, cantidad: 2 },
    },
    cantidadRegistros: 2,
    cantidadPagos: 1,
  },
  fechaInicio: "2026-05-01",
  fechaFin: "2026-05-31",
};

const TOTALES_VACIOS = {
  porMoneda: {},
  cantidadRegistros: 0,
  cantidadPagos: 0,
};

describe("getIngresosRecibidos", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retorna registros y totales por moneda cuando la API responde exitosamente", async () => {
    vi.stubGlobal("fetch", mockFetch(RESPUESTA_OK));

    const result = await getIngresosRecibidos({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(result.success).toBe(true);
    expect(result.registros).toHaveLength(2);
    expect(result.registros[0].numeroPago).toBe("PAG-CLI-000006");
    expect(result.registros[0].monedaCorta).toBe("USD");
    expect(result.registros[0].netoRecibido).toBe(40.5);
    expect(result.totales.porMoneda.USD.netoRecibido).toBe(314.2);
    expect(result.totales.cantidadPagos).toBe(1);
  });

  it("retorna estructura vacía de fallback cuando hay error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const result = await getIngresosRecibidos({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
    expect(result.totales).toEqual(TOTALES_VACIOS);
    expect(result.message).toBe("Network error");
  });

  it("retorna fallback cuando la API responde success: false", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: false, message: "Fechas inválidas" }));

    const result = await getIngresosRecibidos({
      fechaInicio: "2026-05-31",
      fechaFin: "2026-05-01",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
    expect(result.message).toBe("Fechas inválidas");
  });

  it("retorna fallback cuando la API responde con HTTP error", async () => {
    vi.stubGlobal("fetch", mockFetch({}, false, 500));

    const result = await getIngresosRecibidos({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
    });

    expect(result.success).toBe(false);
    expect(result.registros).toEqual([]);
  });

  it("usa método POST con Content-Type JSON hacia ApiIngresosRecibidos.php", async () => {
    const fetchMock = mockFetch({
      success: true,
      registros: [],
      totales: TOTALES_VACIOS,
    });
    vi.stubGlobal("fetch", fetchMock);

    await getIngresosRecibidos({
      fechaInicio: "2026-05-01",
      fechaFin: "2026-05-31",
      idCliente: 7,
      idMedioPago: 1,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("ApiIngresosRecibidos.php"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.idCliente).toBe(7);
    expect(body.idMedioPago).toBe(1);
  });
});
