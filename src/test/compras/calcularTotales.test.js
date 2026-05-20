// src/test/compras/calcularTotales.test.js
// Pruebas unitarias de calcularTotales (compras)

import { describe, it, expect } from "vitest";
import { calcularTotales } from "../../services/compras/comprasService";

// ─── Datos base ──────────────────────────────────────────────────────────────

const tiposEmpaque = [
  { id: "full", equivFull: 1 },
  { id: "medio", equivFull: 0.5 },
  { id: "cuarto", equivFull: 0.25 },
];

const itemBase = { totTallosRegistro: 100, valorRegistro: 50000 };

// ─── totalPiezas ──────────────────────────────────────────────────────────────

describe("calcularTotales — totalPiezas", () => {
  it("retorna 0 con empaques vacíos", () => {
    expect(calcularTotales([], tiposEmpaque).totalPiezas).toBe(0);
  });

  it("cuenta la cantidad de empaques correctamente", () => {
    const empaques = [
      { cantidadEmpaque: 3, tipoEmpaque: "full", items: [] },
      { cantidadEmpaque: 2, tipoEmpaque: "medio", items: [] },
    ];
    expect(calcularTotales(empaques, tiposEmpaque).totalPiezas).toBe(5);
  });
});

// ─── totalFulles ──────────────────────────────────────────────────────────────

describe("calcularTotales — totalFulles", () => {
  it("un full equivale a 1 full", () => {
    const empaques = [{ cantidadEmpaque: 2, tipoEmpaque: "full", items: [] }];
    expect(calcularTotales(empaques, tiposEmpaque).totalFulles).toBe(2);
  });

  it("un medio equivale a 0.5 fulles", () => {
    const empaques = [{ cantidadEmpaque: 4, tipoEmpaque: "medio", items: [] }];
    expect(calcularTotales(empaques, tiposEmpaque).totalFulles).toBe(2);
  });

  it("un cuarto equivale a 0.25 fulles", () => {
    const empaques = [{ cantidadEmpaque: 4, tipoEmpaque: "cuarto", items: [] }];
    expect(calcularTotales(empaques, tiposEmpaque).totalFulles).toBe(1);
  });

  it("suma fulles de tipos mixtos", () => {
    const empaques = [
      { cantidadEmpaque: 2, tipoEmpaque: "full", items: [] }, // 2
      { cantidadEmpaque: 2, tipoEmpaque: "medio", items: [] }, // 1
      { cantidadEmpaque: 4, tipoEmpaque: "cuarto", items: [] }, // 1
    ];
    expect(calcularTotales(empaques, tiposEmpaque).totalFulles).toBe(4);
  });

  it("usa equivFull=1 cuando el tipo de empaque no se encuentra", () => {
    const empaques = [
      { cantidadEmpaque: 3, tipoEmpaque: "desconocido", items: [] },
    ];
    expect(calcularTotales(empaques, tiposEmpaque).totalFulles).toBe(3);
  });
});

// ─── totalTallos y totalValor ─────────────────────────────────────────────────

describe("calcularTotales — totalTallos y totalValor", () => {
  it("suma tallos y valor de todos los items de todos los empaques", () => {
    const empaques = [
      {
        cantidadEmpaque: 1,
        tipoEmpaque: "full",
        items: [
          { totTallosRegistro: 100, valorRegistro: 50000 },
          { totTallosRegistro: 50, valorRegistro: 25000 },
        ],
      },
      {
        cantidadEmpaque: 1,
        tipoEmpaque: "medio",
        items: [{ totTallosRegistro: 80, valorRegistro: 40000 }],
      },
    ];
    const resultado = calcularTotales(empaques, tiposEmpaque);
    expect(resultado.totalTallos).toBe(230);
    expect(resultado.totalValor).toBe(115000);
  });

  it("retorna 0 en tallos y valor cuando los empaques no tienen items", () => {
    const empaques = [{ cantidadEmpaque: 2, tipoEmpaque: "full", items: [] }];
    const resultado = calcularTotales(empaques, tiposEmpaque);
    expect(resultado.totalTallos).toBe(0);
    expect(resultado.totalValor).toBe(0);
  });

  it("retorna 0 cuando items es undefined", () => {
    const empaques = [{ cantidadEmpaque: 1, tipoEmpaque: "full" }]; // sin items
    const resultado = calcularTotales(empaques, tiposEmpaque);
    expect(resultado.totalTallos).toBe(0);
    expect(resultado.totalValor).toBe(0);
  });

  it("trata valores no numéricos en items como 0", () => {
    const empaques = [
      {
        cantidadEmpaque: 1,
        tipoEmpaque: "full",
        items: [{ totTallosRegistro: "", valorRegistro: null }],
      },
    ];
    const resultado = calcularTotales(empaques, tiposEmpaque);
    expect(resultado.totalTallos).toBe(0);
    expect(resultado.totalValor).toBe(0);
  });
});
