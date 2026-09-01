// src/test/pagosClientes/validaciones.test.js
// Pruebas unitarias de la lógica pura: validarPagoCliente y calcularTotalesPago
// No hacen llamadas de red — corren sin servidor.

import { describe, it, expect } from "vitest";
import {
  validarPagoCliente,
  calcularTotalesPago,
  prorratearCostoTransferencia,
  calcularNetoRecibido,
} from "../../services/pagosClientes/pagosClientesService";

// ─── Datos de base reutilizables ────────────────────────────────────────────

const headerValido = {
  fecha: "2026-04-21",
  idCliente: "5",
  idMedioPago: "2",
  idMoneda: "1",
  trm: "4200",
};

const facturaValida = {
  invoice: 1001,
  numeroFactura: "1001",
  valorPago: 500000,
  saldoFactura: 800000,
  idMonedaFactura: 1,
};

// ─── calcularTotalesPago ────────────────────────────────────────────────────

describe("calcularTotalesPago", () => {
  it("retorna cero si no hay facturas", () => {
    expect(calcularTotalesPago([]).valorTotal).toBe(0);
  });

  it("suma correctamente una sola factura", () => {
    expect(calcularTotalesPago([{ valorPago: 100000 }]).valorTotal).toBe(
      100000,
    );
  });

  it("suma correctamente múltiples facturas", () => {
    const facturas = [
      { valorPago: 100000 },
      { valorPago: 250000 },
      { valorPago: 50000 },
    ];
    expect(calcularTotalesPago(facturas).valorTotal).toBe(400000);
  });

  it("ignora valores no numéricos y los trata como 0", () => {
    expect(
      calcularTotalesPago([{ valorPago: "" }, { valorPago: null }]).valorTotal,
    ).toBe(0);
  });
});

// ─── validarPagoCliente — encabezado ────────────────────────────────────────

describe("validarPagoCliente — validaciones de encabezado", () => {
  it("es válido con header y facturas correctas", () => {
    const resultado = validarPagoCliente(headerValido, [facturaValida]);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it("error cuando falta la fecha", () => {
    const header = { ...headerValido, fecha: "" };
    const { errores } = validarPagoCliente(header, [facturaValida]);
    expect(errores.some((e) => e.toLowerCase().includes("fecha"))).toBe(true);
  });

  it("error cuando no hay cliente", () => {
    const header = { ...headerValido, idCliente: "" };
    const { errores } = validarPagoCliente(header, [facturaValida]);
    expect(errores.some((e) => e.toLowerCase().includes("cliente"))).toBe(true);
  });

  it("error cuando falta el medio de pago", () => {
    const header = { ...headerValido, idMedioPago: "" };
    const { errores } = validarPagoCliente(header, [facturaValida]);
    expect(errores.some((e) => e.toLowerCase().includes("medio de pago"))).toBe(
      true,
    );
  });

  it("error cuando falta la moneda", () => {
    const header = { ...headerValido, idMoneda: "" };
    const { errores } = validarPagoCliente(header, [facturaValida]);
    expect(errores.some((e) => e.toLowerCase().includes("moneda"))).toBe(true);
  });

  it("error cuando la TRM es 0", () => {
    const header = { ...headerValido, trm: 0 };
    const { errores } = validarPagoCliente(header, [facturaValida]);
    expect(errores.some((e) => e.toLowerCase().includes("trm"))).toBe(true);
  });
});

// ─── validarPagoCliente — facturas ──────────────────────────────────────────

describe("validarPagoCliente — validaciones de facturas", () => {
  it("error cuando no hay facturas seleccionadas", () => {
    const { errores } = validarPagoCliente(headerValido, []);
    expect(errores.some((e) => e.toLowerCase().includes("factura"))).toBe(true);
  });

  it("error cuando el valorPago de una factura es 0", () => {
    const factura = { ...facturaValida, valorPago: 0 };
    const { errores } = validarPagoCliente(headerValido, [factura]);
    expect(errores.some((e) => e.toLowerCase().includes("mayor a cero"))).toBe(
      true,
    );
  });

  it("error cuando el valorPago es negativo", () => {
    const factura = { ...facturaValida, valorPago: -100 };
    const { errores } = validarPagoCliente(headerValido, [factura]);
    expect(errores.some((e) => e.toLowerCase().includes("mayor a cero"))).toBe(
      true,
    );
  });

  it("advertencia (no error) cuando el valorPago excede el saldo", () => {
    const factura = {
      ...facturaValida,
      valorPago: 999999,
      saldoFactura: 500000,
    };
    const resultado = validarPagoCliente(headerValido, [factura]);
    expect(resultado.valido).toBe(true); // sigue siendo válido
    expect(resultado.advertencias.length).toBeGreaterThan(0);
  });

  it("error cuando la moneda de la factura difiere de la del header", () => {
    const factura = { ...facturaValida, idMonedaFactura: 2 }; // header tiene idMoneda: '1'
    const { errores } = validarPagoCliente(headerValido, [factura]);
    expect(
      errores.some((e) => e.toLowerCase().includes("moneda diferente")),
    ).toBe(true);
  });

  it("es válido con múltiples facturas correctas", () => {
    const facturas = [
      {
        ...facturaValida,
        invoice: 1001,
        valorPago: 300000,
        saldoFactura: 500000,
      },
      {
        ...facturaValida,
        invoice: 1002,
        valorPago: 200000,
        saldoFactura: 400000,
      },
    ];
    const resultado = validarPagoCliente(headerValido, facturas);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });
});

// ─── prorratearCostoTransferencia / calcularNetoRecibido ─────────────────────

describe("prorratearCostoTransferencia", () => {
  it("retorna ceros cuando no hay facturas", () => {
    expect(prorratearCostoTransferencia([], 500)).toEqual([]);
  });

  it("prorratea proporcionalmente y la suma coincide con el costo total", () => {
    const facturas = [
      { valorPago: 100 },
      { valorPago: 300 },
      { valorPago: 600 },
    ];
    const prorrateos = prorratearCostoTransferencia(facturas, 50);
    // 100/1000, 300/1000, 600/1000 → 5, 15, 30
    expect(prorrateos).toEqual([5, 15, 30]);
    const suma = prorrateos.reduce((a, b) => a + b, 0);
    expect(suma).toBe(50);
  });

  it("asigna todo el costo si hay una sola factura", () => {
    expect(prorratearCostoTransferencia([{ valorPago: 500 }], 100)).toEqual([100]);
  });

  it("protege la división por cero cuando el total es 0", () => {
    expect(prorratearCostoTransferencia([{ valorPago: 0 }], 100)).toEqual([0]);
  });

  it("trata el costo no numérico como 0", () => {
    expect(prorratearCostoTransferencia([{ valorPago: 100 }], "abc")).toEqual([0]);
  });
});

describe("calcularNetoRecibido", () => {
  it("resta el costo prorrateado del valor pagado", () => {
    const facturas = [{ valorPago: 100 }, { valorPago: 300 }];
    // total 400, costo 40 → prorrateos [10, 30]
    expect(calcularNetoRecibido(facturas, 40)).toEqual([90, 270]);
  });

  it("suma de netos = valor total − costo", () => {
    const facturas = [{ valorPago: 100 }, { valorPago: 300 }, { valorPago: 600 }];
    const netos = calcularNetoRecibido(facturas, 50);
    const suma = netos.reduce((a, b) => a + b, 0);
    expect(suma).toBe(950); // 1000 − 50
  });

  it("sin costo devuelve el valor pagado", () => {
    expect(calcularNetoRecibido([{ valorPago: 250 }, { valorPago: 250 }], 0)).toEqual([250, 250]);
  });
});
