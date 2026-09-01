import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  obtenerUltimoNumeroDevolucion,
  getFacturasCliente,
  getDetalleFactura,
  guardarDevolucion,
  getDevolucionEspecifica,
  buscarDevoluciones,
  eliminarDevolucion,
} from '../../services/ventasComision/devolucionesComisionService';

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

describe('obtenerUltimoNumeroDevolucion', () => {
  it('retorna número formateado', async () => {
    const respuesta = { success: true, ultimoNumero: 5 };
    vi.stubGlobal('fetch', mockFetch(respuesta));
    const data = await obtenerUltimoNumeroDevolucion();
    expect(data.success).toBe(true);
    expect(data.siguienteNumeroFormateado).toBe('DEV-000006');
  });

  it('retorna fallback ante error de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network')));
    const data = await obtenerUltimoNumeroDevolucion();
    expect(data.success).toBe(false);
    expect(data.siguienteNumeroFormateado).toBe('DEV-000001');
  });
});

describe('getFacturasCliente', () => {
  it('retorna facturas del cliente', async () => {
    const respuesta = { success: true, facturas: [{ idFactura: 1 }], total: 1 };
    vi.stubGlobal('fetch', mockFetch(respuesta));
    const data = await getFacturasCliente(1);
    expect(data.success).toBe(true);
    expect(data.facturas).toHaveLength(1);
  });

  it('retorna fallback ante error de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network')));
    const data = await getFacturasCliente(1);
    expect(data.success).toBe(false);
    expect(data.facturas).toEqual([]);
  });
});

describe('getDetalleFactura', () => {
  it('retorna detalle de factura', async () => {
    const respuesta = { success: true, detalle: [{ idDetProducto: 1 }] };
    vi.stubGlobal('fetch', mockFetch(respuesta));
    const data = await getDetalleFactura(1);
    expect(data.success).toBe(true);
    expect(data.detalle).toHaveLength(1);
  });

  it('lanza excepción ante error HTTP', async () => {
    vi.stubGlobal('fetch', mockFetch(null, false, 500));
    await expect(getDetalleFactura(1)).rejects.toThrow('Error HTTP: 500');
  });
});

describe('guardarDevolucion', () => {
  it('retorna datos al guardar', async () => {
    const respuesta = { success: true, idDevolucion: 1, numeroDevolucion: 'DEV-000001' };
    vi.stubGlobal('fetch', mockFetch(respuesta));
    const data = await guardarDevolucion({ idFactura: 1, detalles: [] });
    expect(data.success).toBe(true);
    expect(data.idDevolucion).toBe(1);
  });

  it('lanza excepción si success es false', async () => {
    vi.stubGlobal('fetch', mockFetch({ success: false, message: 'Error' }));
    await expect(guardarDevolucion({})).rejects.toThrow('Error');
  });

  it('lanza excepción ante error HTTP', async () => {
    vi.stubGlobal('fetch', mockFetch(null, false, 500));
    await expect(guardarDevolucion({})).rejects.toThrow('Error HTTP: 500');
  });
});

describe('getDevolucionEspecifica', () => {
  it('retorna devolución', async () => {
    const respuesta = { success: true, idDevolucion: 1, encabezado: {}, detalle: [] };
    vi.stubGlobal('fetch', mockFetch(respuesta));
    const data = await getDevolucionEspecifica(1);
    expect(data.success).toBe(true);
  });

  it('lanza excepción si success es false', async () => {
    vi.stubGlobal('fetch', mockFetch({ success: false, message: 'Error' }));
    await expect(getDevolucionEspecifica(1)).rejects.toThrow('Error');
  });
});

describe('buscarDevoluciones', () => {
  it('retorna lista en éxito', async () => {
    const respuesta = { success: true, devoluciones: [{ idDevolucion: 1 }], total: 1 };
    vi.stubGlobal('fetch', mockFetch(respuesta));
    const data = await buscarDevoluciones({});
    expect(data.success).toBe(true);
    expect(data.devoluciones).toHaveLength(1);
  });

  it('retorna fallback ante error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network')));
    const data = await buscarDevoluciones({});
    expect(data.success).toBe(false);
    expect(data.devoluciones).toEqual([]);
  });
});

describe('eliminarDevolucion', () => {
  it('retorna éxito al eliminar', async () => {
    const respuesta = { success: true, message: 'Eliminada' };
    vi.stubGlobal('fetch', mockFetch(respuesta));
    const data = await eliminarDevolucion(1);
    expect(data.success).toBe(true);
  });

  it('lanza excepción ante error HTTP', async () => {
    vi.stubGlobal('fetch', mockFetch(null, false, 500));
    await expect(eliminarDevolucion(1)).rejects.toThrow('Error HTTP: 500');
  });
});
