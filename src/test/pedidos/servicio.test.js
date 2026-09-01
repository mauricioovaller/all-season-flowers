// src/test/pedidos/servicio.test.js
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  guardarPedido,
  guardarPedidoCompleto,
  buscarPedidos,
  getPedidoEspecifico,
  obtenerUltimoNumeroFactura,
  getVariedadesYGrados,
  getRazonesSociales,
  razonSocialPorDefecto,
  anularPedido,
} from "../../services/pedidos/pedidosService";

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

// ─── guardarPedido ────────────────────────────────────────────────────────────

describe("guardarPedido", () => {
  it("envía los datos al endpoint correcto y retorna respuesta", async () => {
    const respuesta = {
      success: true,
      idPedido: 42,
      numeroFactura: "FACT-000042",
    };
    vi.stubGlobal("fetch", mockFetch(respuesta));
    const res = await guardarPedido({ cliente: 1, items: [] });
    expect(res.success).toBe(true);
    expect(res.idPedido).toBe(42);
  });

  it("lanza excepción si la API devuelve HTTP 500", async () => {
    vi.stubGlobal("fetch", mockFetch("Internal Error", false, 500));
    await expect(guardarPedido({ cliente: 1 })).rejects.toThrow();
  });

  it("lanza excepción ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    await expect(guardarPedido({ cliente: 1 })).rejects.toThrow("Network");
  });
});

// ─── guardarPedidoCompleto ───────────────────────────────────────────────────

describe("guardarPedidoCompleto", () => {
  it("retorna datos del servidor al guardar correctamente", async () => {
    const respuesta = {
      success: true,
      idEncabPedido: 10,
      numeroFactura: "FACT-000010",
    };
    vi.stubGlobal("fetch", mockFetch(respuesta));
    const res = await guardarPedidoCompleto({ encabezado: {}, empaques: [] });
    expect(res.success).toBe(true);
    expect(res.idEncabPedido).toBe(10);
  });

  it("lanza excepción si el servidor responde con error", async () => {
    vi.stubGlobal("fetch", mockFetch("Error", false, 500));
    await expect(guardarPedidoCompleto({})).rejects.toThrow();
  });
});

// ─── buscarPedidos ────────────────────────────────────────────────────────────

describe("buscarPedidos", () => {
  it("retorna pedidos cuando la API responde correctamente", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, pedidos: [{ IdEncabPedido: 1 }], total: 1 }),
    );
    const res = await buscarPedidos({ fechaInicio: "2024-01-01" });
    expect(res.success).toBe(true);
    expect(res.pedidos).toHaveLength(1);
  });

  it("envía los filtros en el cuerpo de la petición", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true, pedidos: [], total: 0 }));
    await buscarPedidos({ cliente: 5, estado: "pendiente" });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.cliente).toBe(5);
  });

  it("lanza excepción ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    await expect(buscarPedidos()).rejects.toThrow();
  });
});

// ─── getPedidoEspecifico ──────────────────────────────────────────────────────

describe("getPedidoEspecifico", () => {
  it("retorna los datos del pedido", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        encabezado: { IdEncabPedido: 7 },
        detalle: [],
      }),
    );
    const res = await getPedidoEspecifico(7);
    expect(res.encabezado.IdEncabPedido).toBe(7);
  });

  it("envía el idPedido correcto", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await getPedidoEspecifico(99);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.idPedido).toBe(99);
  });
});

// ─── obtenerUltimoNumeroFactura — fallback ────────────────────────────────────

describe("obtenerUltimoNumeroFactura", () => {
  it("retorna el número de la API cuando hay éxito", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: true, ultimoNumero: 41, prefijo: "FACT-" }),
    );
    const res = await obtenerUltimoNumeroFactura();
    expect(res.success).toBe(true);
    expect(res.ultimoNumero).toBe(41);
  });

  it("retorna fallback con ultimoNumero=0 ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    const res = await obtenerUltimoNumeroFactura();
    expect(res.success).toBe(false);
    expect(res.ultimoNumero).toBe(0);
    expect(res.prefijo).toBe("FACT-");
  });
});

// ─── getVariedadesYGrados — normalización ────────────────────────────────────

describe("getVariedadesYGrados", () => {
  it("normaliza IDs a string", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        variedades: [{ id: 1, nombre: "Roja" }],
        grados: [{ id: 2, nombre: "G10" }],
      }),
    );
    const res = await getVariedadesYGrados(1);
    expect(res.variedades[0].id).toBe("1");
    expect(res.grados[0].id).toBe("2");
  });

  it("retorna arrays vacíos si la API no devuelve datos", async () => {
    vi.stubGlobal("fetch", mockFetch({}));
    const res = await getVariedadesYGrados(1);
    expect(res.variedades).toEqual([]);
    expect(res.grados).toEqual([]);
  });
});

// ─── getRazonesSociales ───────────────────────────────────────────────────────

describe("getRazonesSociales", () => {
  it("retorna las razones sociales cuando la API responde exitosamente", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        razonesSociales: [
          { IdRazonSocial: 1, Nombre: "ALL SEASON FLOWERS SAS", PorDefecto: 1 },
          { IdRazonSocial: 2, Nombre: "OTRA RAZON SOCIAL", PorDefecto: 0 },
        ],
      }),
    );
    const res = await getRazonesSociales();
    expect(res.success).toBe(true);
    expect(res.razonesSociales).toHaveLength(2);
    expect(res.razonesSociales[0].Nombre).toBe("ALL SEASON FLOWERS SAS");
  });

  it("retorna fallback con lista vacía ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    const res = await getRazonesSociales();
    expect(res.success).toBe(false);
    expect(res.razonesSociales).toEqual([]);
  });

  it("usa método POST hacia ApiGetRazonesSociales.php", async () => {
    const fetchMock = mockFetch({ success: true, razonesSociales: [] });
    vi.stubGlobal("fetch", fetchMock);
    await getRazonesSociales();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("ApiGetRazonesSociales.php"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ─── razonSocialPorDefecto (helper puro) ──────────────────────────────────────

describe("razonSocialPorDefecto", () => {
  it("retorna la marcada como porDefecto (true)", () => {
    const lista = [
      { id: "1", nombre: "ASF", porDefecto: true },
      { id: "2", nombre: "OTRA", porDefecto: false },
    ];
    expect(razonSocialPorDefecto(lista).id).toBe("1");
  });

  it("retorna la marcada como porDefecto (1 numérico)", () => {
    const lista = [
      { id: "2", nombre: "OTRA", porDefecto: 0 },
      { id: "1", nombre: "ASF", porDefecto: 1 },
    ];
    expect(razonSocialPorDefecto(lista).id).toBe("1");
  });

  it("si ninguna está marcada, retorna la primera", () => {
    const lista = [
      { id: "3", nombre: "X", porDefecto: false },
      { id: "4", nombre: "Y", porDefecto: false },
    ];
    expect(razonSocialPorDefecto(lista).id).toBe("3");
  });

  it("retorna null con lista vacía o no-array", () => {
    expect(razonSocialPorDefecto([])).toBeNull();
    expect(razonSocialPorDefecto(null)).toBeNull();
  });
});

// ─── anularPedido ────────────────────────────────────────────────────────────

describe("anularPedido", () => {
  it("retorna éxito y envía idPedido + motivo al endpoint correcto", async () => {
    const respuesta = {
      success: true,
      message: "Pedido anulado correctamente",
      idEncabPedido: 42,
    };
    const fetchMock = mockFetch(respuesta);
    vi.stubGlobal("fetch", fetchMock);

    const res = await anularPedido(42, "Error de digitación");

    expect(res.success).toBe(true);
    expect(res.idEncabPedido).toBe(42);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("ApiAnularPedido.php"),
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.idPedido).toBe(42);
    expect(body.motivo).toBe("Error de digitación");
  });

  it("propaga el mensaje de negocio cuando la API rechaza con HTTP 400", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        {
          success: false,
          message: "No se puede anular: el pedido tiene pagos de clientes asociados",
        },
        false,
        400,
      ),
    );
    await expect(anularPedido(1, "motivo")).rejects.toThrow("tiene pagos");
  });

  it("lanza excepción ante error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    await expect(anularPedido(1, "motivo")).rejects.toThrow("Network");
  });
});
