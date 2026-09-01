import { describe, it, expect, vi, afterEach } from 'vitest';
import { getPedidosParaCobro } from '../../services/ventasComision/cuentaCobroService';

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

describe('getPedidosParaCobro', () => {
  it('retorna pedidos en éxito', async () => {
    const respuesta = {
      success: true,
      pedidos: [{ idPedido: 1, comision: 50 }],
      totalPedidos: 1,
    };
    vi.stubGlobal('fetch', mockFetch(respuesta));
    const data = await getPedidosParaCobro({ fechaInicio: '2026-01-01', fechaFin: '2026-12-31' });
    expect(data.success).toBe(true);
    expect(data.pedidos).toHaveLength(1);
  });

  it('retorna fallback ante error de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network')));
    const data = await getPedidosParaCobro({});
    expect(data.success).toBe(false);
    expect(data.pedidos).toEqual([]);
  });
});
