// src/test/dashboard/servicio.test.js
import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchDashboardData } from "../../services/dashboard/dashboardService";

function mockFetch(body, ok = true) {
  return vi
    .fn()
    .mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body });
}

afterEach(() => vi.unstubAllGlobals());

// ─── fetchDashboardData ───────────────────────────────────────────────────────

describe("fetchDashboardData", () => {
  it("retorna los datos cuando la API responde con éxito", async () => {
    const datos = {
      success: true,
      ventas: { total: 100 },
      compras: { total: 50 },
    };
    vi.stubGlobal("fetch", mockFetch(datos));
    const res = await fetchDashboardData(
      "allseason",
      "2024-01-01",
      "2024-12-31",
    );
    expect(res.success).toBe(true);
    expect(res.ventas.total).toBe(100);
  });

  it("envía app, fechaInicio y fechaFin al servidor", async () => {
    vi.stubGlobal("fetch", mockFetch({ success: true }));
    await fetchDashboardData("allseason", "2024-01-01", "2024-03-31");
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.app).toBe("allseason");
    expect(body.fechaInicio).toBe("2024-01-01");
    expect(body.fechaFin).toBe("2024-03-31");
  });

  it("lanza excepción cuando la API devuelve success:false", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({ success: false, message: "Error en los datos" }),
    );
    await expect(
      fetchDashboardData("allseason", "2024-01-01", "2024-12-31"),
    ).rejects.toThrow(/Error en los datos/i);
  });

  it("lanza excepción cuando la respuesta HTTP no es ok", async () => {
    vi.stubGlobal("fetch", mockFetch({}, false));
    await expect(
      fetchDashboardData("allseason", "2024-01-01", "2024-12-31"),
    ).rejects.toThrow();
  });

  it("lanza excepción ante error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );
    await expect(
      fetchDashboardData("allseason", "2024-01-01", "2024-12-31"),
    ).rejects.toThrow("Network error");
  });
});
