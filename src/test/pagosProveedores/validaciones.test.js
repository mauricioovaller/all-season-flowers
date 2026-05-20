// src/test/pagosProveedores/validaciones.test.js
// Pruebas unitarias de validarPagoProveedor y calcularTotalPagoProveedor

import { describe, it, expect } from "vitest";
import {
  validarPagoProveedor,
  calcularTotalPagoProveedor,
} from "../../services/pagosProveedores/pagosProveedoresService";

// ─── Datos base ──────────────────────────────────────────────────────────────

const headerValido = {
  fecha: "2026-04-21",
  idProveedor: 3,
  idMoneda: 1,
  idMedioPago: 2,
};

const comprasValidas = [{ idCompra: 7, valorPago: 1500000 }];

// ─── calcularTotalPagoProveedor ───────────────────────────────────────────────

describe("calcularTotalPagoProveedor", () => {
  it("retorna cero si no hay compras", () => {
    expect(calcularTotalPagoProveedor([])).toBe(0);
  });

  it("suma correctamente una sola compra", () => {
    expect(calcularTotalPagoProveedor([{ valorPago: 800000 }])).toBe(800000);
  });

  it("suma correctamente múltiples compras", () => {
    const compras = [
      { valorPago: 300000 },
      { valorPago: 500000 },
      { valorPago: 200000 },
    ];
    expect(calcularTotalPagoProveedor(compras)).toBe(1000000);
  });

  it("ignora valores no numéricos tratándolos como 0", () => {
    expect(
      calcularTotalPagoProveedor([{ valorPago: "" }, { valorPago: null }]),
    ).toBe(0);
  });
});

// ─── validarPagoProveedor ─────────────────────────────────────────────────────

describe("validarPagoProveedor — pago válido", () => {
  it("es válido con todos los campos correctos", () => {
    const resultado = validarPagoProveedor(headerValido, comprasValidas);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });
});

describe("validarPagoProveedor — campos requeridos", () => {
  it("error cuando falta la fecha", () => {
    const { errores } = validarPagoProveedor(
      { ...headerValido, fecha: "" },
      comprasValidas,
    );
    expect(errores.some((e) => e.toLowerCase().includes("fecha"))).toBe(true);
  });

  it("error cuando no hay proveedor", () => {
    const { errores } = validarPagoProveedor(
      { ...headerValido, idProveedor: 0 },
      comprasValidas,
    );
    expect(errores.some((e) => e.toLowerCase().includes("proveedor"))).toBe(
      true,
    );
  });

  it("error cuando no hay moneda seleccionada", () => {
    const { errores } = validarPagoProveedor(
      { ...headerValido, idMoneda: 0 },
      comprasValidas,
    );
    expect(errores.some((e) => e.toLowerCase().includes("moneda"))).toBe(true);
  });

  it("error cuando no hay compras seleccionadas", () => {
    const { errores } = validarPagoProveedor(headerValido, []);
    expect(errores.some((e) => e.toLowerCase().includes("compra"))).toBe(true);
  });

  it("error cuando no hay medio de pago", () => {
    const { errores } = validarPagoProveedor(
      { ...headerValido, idMedioPago: 0 },
      comprasValidas,
    );
    expect(errores.some((e) => e.toLowerCase().includes("medio de pago"))).toBe(
      true,
    );
  });

  it("error cuando el valor total de pago es 0", () => {
    const { errores } = validarPagoProveedor(headerValido, [
      { idCompra: 1, valorPago: 0 },
    ]);
    expect(errores.some((e) => e.toLowerCase().includes("valor"))).toBe(true);
  });

  it("error cuando el valor de pago es negativo", () => {
    const { errores } = validarPagoProveedor(headerValido, [
      { idCompra: 1, valorPago: -500 },
    ]);
    expect(errores.some((e) => e.toLowerCase().includes("valor"))).toBe(true);
  });

  it("acumula múltiples errores cuando faltan varios campos", () => {
    const { errores } = validarPagoProveedor(
      { fecha: "", idProveedor: 0, idMoneda: 0, idMedioPago: 0 },
      [],
    );
    expect(errores.length).toBeGreaterThanOrEqual(5);
  });
});
