// src/test/devolucionesCompras/validaciones.test.js
// Pruebas unitarias de validarDevolucionCompra y calcularTotalesDevolucionCompra

import { describe, it, expect } from "vitest";
import {
  validarDevolucionCompra,
  calcularTotalesDevolucionCompra,
} from "../../services/devolucionesCompras/devolucionesComprasService";

// ─── Datos base ──────────────────────────────────────────────────────────────

const detalleValido = {
  idDetProducto: 10,
  tallosDevolucion: 50,
  precioCompra: 1200,
};

const devolucionValida = {
  idCompra: 5,
  fechaDevolucion: "2026-04-21",
  detalles: [detalleValido],
};

// ─── calcularTotalesDevolucionCompra ─────────────────────────────────────────

describe("calcularTotalesDevolucionCompra", () => {
  it("calcula totalProductos correctamente", () => {
    const resultado = calcularTotalesDevolucionCompra([
      detalleValido,
      detalleValido,
    ]);
    expect(resultado.totalProductos).toBe(2);
  });

  it("calcula totalTallosDevolucion sumando todos los detalles", () => {
    const detalles = [
      { idDetProducto: 1, tallosDevolucion: 30, precioCompra: 1000 },
      { idDetProducto: 2, tallosDevolucion: 20, precioCompra: 1500 },
    ];
    expect(
      calcularTotalesDevolucionCompra(detalles).totalTallosDevolucion,
    ).toBe(50);
  });

  it("calcula valorDevolucion como precio × tallos por cada detalle", () => {
    // 50 tallos × $1200 = $60.000
    const resultado = calcularTotalesDevolucionCompra([detalleValido]);
    expect(resultado.valorDevolucion).toBe(60000);
  });

  it("calcula valorDevolucion para múltiples detalles", () => {
    const detalles = [
      { idDetProducto: 1, tallosDevolucion: 10, precioCompra: 1000 }, // 10.000
      { idDetProducto: 2, tallosDevolucion: 5, precioCompra: 2000 }, // 10.000
    ];
    expect(calcularTotalesDevolucionCompra(detalles).valorDevolucion).toBe(
      20000,
    );
  });

  it("retorna 0 en todos los campos con array vacío", () => {
    const resultado = calcularTotalesDevolucionCompra([]);
    expect(resultado.totalProductos).toBe(0);
    expect(resultado.totalTallosDevolucion).toBe(0);
    expect(resultado.valorDevolucion).toBe(0);
  });

  it("trata tallosDevolucion o precioCompra undefined como 0", () => {
    const resultado = calcularTotalesDevolucionCompra([{ idDetProducto: 1 }]);
    expect(resultado.valorDevolucion).toBe(0);
    expect(resultado.totalTallosDevolucion).toBe(0);
  });
});

// ─── validarDevolucionCompra ──────────────────────────────────────────────────

describe("validarDevolucionCompra — devolución válida", () => {
  it("es válida con todos los campos correctos", () => {
    const resultado = validarDevolucionCompra(devolucionValida);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });
});

describe("validarDevolucionCompra — validaciones de encabezado", () => {
  it("error cuando idCompra es 0", () => {
    const { errores } = validarDevolucionCompra({
      ...devolucionValida,
      idCompra: 0,
    });
    expect(errores.some((e) => e.toLowerCase().includes("compra"))).toBe(true);
  });

  it("error cuando falta la fecha", () => {
    const { errores } = validarDevolucionCompra({
      ...devolucionValida,
      fechaDevolucion: "",
    });
    expect(errores.some((e) => e.toLowerCase().includes("fecha"))).toBe(true);
  });

  it("error cuando detalles está vacío", () => {
    const { errores } = validarDevolucionCompra({
      ...devolucionValida,
      detalles: [],
    });
    expect(errores.some((e) => e.toLowerCase().includes("producto"))).toBe(
      true,
    );
  });
});

describe("validarDevolucionCompra — validaciones de detalles", () => {
  it("error cuando un detalle no tiene idDetProducto", () => {
    const detalles = [{ idDetProducto: 0, tallosDevolucion: 10 }];
    const { errores } = validarDevolucionCompra({
      ...devolucionValida,
      detalles,
    });
    expect(errores.some((e) => e.toLowerCase().includes("id de detalle"))).toBe(
      true,
    );
  });

  it("error cuando tallosDevolucion es 0", () => {
    const detalles = [{ idDetProducto: 5, tallosDevolucion: 0 }];
    const { errores } = validarDevolucionCompra({
      ...devolucionValida,
      detalles,
    });
    expect(errores.some((e) => e.toLowerCase().includes("tallos"))).toBe(true);
  });

  it("es válida con múltiples detalles correctos", () => {
    const detalles = [
      { idDetProducto: 1, tallosDevolucion: 20, precioCompra: 1000 },
      { idDetProducto: 2, tallosDevolucion: 15, precioCompra: 1500 },
      { idDetProducto: 3, tallosDevolucion: 30, precioCompra: 800 },
    ];
    const resultado = validarDevolucionCompra({
      ...devolucionValida,
      detalles,
    });
    expect(resultado.valido).toBe(true);
  });
});
