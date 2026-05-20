// src/test/pagosClientes/guardarPago.test.js
// Pruebas de integración del servicio guardarPagoCliente.
// Usan vi.stubGlobal para interceptar fetch — no requieren servidor real.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  guardarPagoCliente,
  getPagoClienteEspecifico,
} from "../../services/pagosClientes/pagosClientesService";

// ─── Helpers ────────────────────────────────────────────────────────────────

function mockFetch(responseBody, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => responseBody,
  });
}

const payloadBase = {
  fechaPago: "2026-04-21",
  idCliente: 5,
  idMoneda: 1,
  trm: 4200,
  idMedioPago: 2,
  valorTotal: 500000,
  costoTransferencia: 0,
  observaciones: "",
  facturas: [{ invoice: 1001, valorPago: 500000 }],
};

// ─── guardarPagoCliente — nuevo ──────────────────────────────────────────────

describe("guardarPagoCliente — INSERCIÓN", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        idEncabPagoCliente: 7,
        numeroPago: "PAG-CLI-000007",
        valorTotal: 500000,
        cantidadFacturas: 1,
        esActualizacion: false,
        message: "Pago guardado correctamente",
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("llama a la API con los datos correctos", async () => {
    await guardarPagoCliente(payloadBase);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toContain("ApiGuardarPagoCliente.php");
    const body = JSON.parse(options.body);
    expect(body.idCliente).toBe(5);
    expect(body.facturas).toHaveLength(1);
    expect(body.facturas[0].invoice).toBe(1001);
  });

  it("NO incluye idEncabPagoCliente cuando es nuevo", async () => {
    await guardarPagoCliente(payloadBase);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.idEncabPagoCliente).toBeUndefined();
  });

  it("devuelve success=true con el ID asignado", async () => {
    const res = await guardarPagoCliente(payloadBase);
    expect(res.success).toBe(true);
    expect(res.idEncabPagoCliente).toBe(7);
    expect(res.numeroPago).toBe("PAG-CLI-000007");
  });

  it("maneja error HTTP 500 sin lanzar excepción", async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "Error interno" }, false, 500),
    );
    await expect(guardarPagoCliente(payloadBase)).rejects.toThrow();
  });
});

// ─── guardarPagoCliente — actualización ─────────────────────────────────────

describe("guardarPagoCliente — ACTUALIZACIÓN", () => {
  const payloadActualizado = {
    ...payloadBase,
    idEncabPagoCliente: 7,
    facturas: [{ invoice: 1001, valorPago: 750000 }], // valor modificado
  };

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        idEncabPagoCliente: 7,
        numeroPago: "PAG-CLI-000007",
        valorTotal: 750000,
        cantidadFacturas: 1,
        esActualizacion: true,
        message: "Pago actualizado correctamente",
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("incluye idEncabPagoCliente en el body cuando es actualización", async () => {
    await guardarPagoCliente(payloadActualizado);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.idEncabPagoCliente).toBe(7);
  });

  it("devuelve esActualizacion=true", async () => {
    const res = await guardarPagoCliente(payloadActualizado);
    expect(res.esActualizacion).toBe(true);
  });

  it("mantiene el mismo numeroPago al actualizar", async () => {
    const res = await guardarPagoCliente(payloadActualizado);
    expect(res.numeroPago).toBe("PAG-CLI-000007");
  });
});

// ─── guardarPagoCliente — múltiples facturas ─────────────────────────────────

describe("guardarPagoCliente — múltiples facturas", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("envía todas las facturas al backend", async () => {
    const payload = {
      ...payloadBase,
      valorTotal: 900000,
      facturas: [
        { invoice: 1001, valorPago: 400000 },
        { invoice: 1002, valorPago: 300000 },
        { invoice: 1003, valorPago: 200000 },
      ],
    };
    vi.stubGlobal("fetch", mockFetch({ success: true, cantidadFacturas: 3 }));
    await guardarPagoCliente(payload);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.facturas).toHaveLength(3);
    expect(body.facturas[1].invoice).toBe(1002);
  });
});

// ─── getPagoClienteEspecifico ────────────────────────────────────────────────

describe("getPagoClienteEspecifico", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retorna el pago con sus facturas al cargar", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        success: true,
        encabezado: {
          idEncabPagoCliente: 7,
          numeroPago: "PAG-CLI-000007",
          idCliente: 5,
        },
        facturas: [{ invoice: 1001, valorPago: 500000 }],
      }),
    );
    const res = await getPagoClienteEspecifico(7);
    expect(res.success).toBe(true);
    expect(res.encabezado.idEncabPagoCliente).toBe(7);
    expect(res.facturas).toHaveLength(1);
  });
});
