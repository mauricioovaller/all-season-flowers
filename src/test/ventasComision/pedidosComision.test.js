import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getDatosSelect,
  getVariedadesYGrados,
  guardarPedidoCompleto,
  buscarPedidos,
  getPedidoEspecifico,
  obtenerUltimoNumeroPedido,
} from '../../services/ventasComision/pedidosComisionService';

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

describe('getDatosSelect', () => {
  it('retorna datos de selects en éxito', async () => {
    const respuesta = { success: true, clientes: [{ id: '1', nombre: 'Test' }] };
    vi.stubGlobal('fetch', mockFetch(respuesta));
    const data = await getDatosSelect();
    expect(data.success).toBe(true);
    expect(data.clientes).toHaveLength(1);
  });

  it('retorna fallback con arrays vacíos ante error HTTP', async () => {
    vi.stubGlobal('fetch', mockFetch(null, false, 500));
    const data = await getDatosSelect();
    expect(data.success).toBe(false);
    expect(data.clientes).toEqual([]);
  });

  it('retorna fallback ante error de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network')));
    const data = await getDatosSelect();
    expect(data.success).toBe(false);
  });
});

describe('getVariedadesYGrados', () => {
  it('retorna variedades y grados', async () => {
    const respuesta = { success: true, variedades: [{ id: '1', nombre: 'Red' }], grados: [] };
    vi.stubGlobal('fetch', mockFetch(respuesta));
    const data = await getVariedadesYGrados(1);
    expect(data.success).toBe(true);
    expect(data.variedades).toHaveLength(1);
  });

  it('retorna fallback ante error de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network')));
    const data = await getVariedadesYGrados(1);
    expect(data.success).toBe(false);
    expect(data.variedades).toEqual([]);
  });
});

describe('guardarPedidoCompleto', () => {
  it('retorna datos del servidor al guardar', async () => {
    const respuesta = { success: true, idPedido: 1, numeroPedido: 'PEC-000001' };
    vi.stubGlobal('fetch', mockFetch(respuesta));
    const data = await guardarPedidoCompleto({ encabezado: {}, empaques: [] });
    expect(data.success).toBe(true);
    expect(data.idPedido).toBe(1);
  });

  it('lanza excepción si el servidor responde con error HTTP', async () => {
    vi.stubGlobal('fetch', mockFetch(null, false, 500));
    await expect(guardarPedidoCompleto({})).rejects.toThrow('Error HTTP: 500');
  });
});

describe('buscarPedidos', () => {
  it('retorna lista de pedidos en éxito', async () => {
    const respuesta = { success: true, pedidos: [{ idPedido: 1, NumeroPedido: 'PEC-000001' }], total: 1 };
    vi.stubGlobal('fetch', mockFetch(respuesta));
    const data = await buscarPedidos({});
    expect(data.success).toBe(true);
    expect(data.pedidos).toHaveLength(1);
  });

  it('retorna fallback con lista vacía ante error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network')));
    const data = await buscarPedidos({});
    expect(data.success).toBe(false);
    expect(data.pedidos).toEqual([]);
  });
});

describe('getPedidoEspecifico', () => {
  it('retorna encabezado y empaques', async () => {
    const respuesta = {
      success: true, idPedido: 1, numeroPedido: 'PEC-000001',
      encabezado: { IdCliente: 1 }, empaques: [],
    };
    vi.stubGlobal('fetch', mockFetch(respuesta));
    const data = await getPedidoEspecifico(1);
    expect(data.success).toBe(true);
    expect(data.encabezado.IdCliente).toBe(1);
  });

  it('lanza excepción si success es false', async () => {
    vi.stubGlobal('fetch', mockFetch({ success: false, message: 'No encontrado' }));
    await expect(getPedidoEspecifico(1)).rejects.toThrow('No encontrado');
  });

  it('lanza excepción ante error HTTP', async () => {
    vi.stubGlobal('fetch', mockFetch(null, false, 404));
    await expect(getPedidoEspecifico(1)).rejects.toThrow('Error HTTP: 404');
  });
});

describe('obtenerUltimoNumeroPedido', () => {
  it('retorna último número formateado', async () => {
    const respuesta = { success: true, ultimoNumero: 5, siguienteNumeroFormateado: 'PEC-000006' };
    vi.stubGlobal('fetch', mockFetch(respuesta));
    const data = await obtenerUltimoNumeroPedido();
    expect(data.success).toBe(true);
    expect(data.siguienteNumeroFormateado).toBe('PEC-000006');
  });

  it('retorna fallback ante error de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network')));
    const data = await obtenerUltimoNumeroPedido();
    expect(data.success).toBe(false);
    expect(data.siguienteNumeroFormateado).toBe('PEC-000001');
  });
});
