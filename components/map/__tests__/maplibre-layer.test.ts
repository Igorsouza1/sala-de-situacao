import { resolveLayerType, toFillPaint, toCirclePaint, toLinePaint } from '../helpers/maplibre-layer';
import type { Feature } from 'geojson';

describe('resolveLayerType', () => {
  it('returns "line" when style type is "line"', () => {
    expect(resolveLayerType({ type: 'line' })).toBe('line');
  });

  it('returns "circle" when style type is "circle"', () => {
    expect(resolveLayerType({ type: 'circle' })).toBe('circle');
  });

  it('returns "circle" when style type is "point"', () => {
    expect(resolveLayerType({ type: 'point' })).toBe('circle');
  });

  it('returns "fill" when style type is "polygon"', () => {
    expect(resolveLayerType({ type: 'polygon' })).toBe('fill');
  });

  it('infers "circle" from Point geometry when no style type', () => {
    const feature: Feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: {},
    };
    expect(resolveLayerType(null, feature)).toBe('circle');
  });

  it('infers "circle" from MultiPoint geometry', () => {
    const feature: Feature = {
      type: 'Feature',
      geometry: { type: 'MultiPoint', coordinates: [[0, 0], [1, 1]] },
      properties: {},
    };
    expect(resolveLayerType(null, feature)).toBe('circle');
  });

  it('infers "line" from LineString geometry when no style type', () => {
    const feature: Feature = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
      properties: {},
    };
    expect(resolveLayerType(null, feature)).toBe('line');
  });

  it('infers "line" from MultiLineString geometry', () => {
    const feature: Feature = {
      type: 'Feature',
      geometry: { type: 'MultiLineString', coordinates: [[[0, 0], [1, 1]]] },
      properties: {},
    };
    expect(resolveLayerType(null, feature)).toBe('line');
  });

  it('defaults to "fill" for Polygon geometry', () => {
    const feature: Feature = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
      properties: {},
    };
    expect(resolveLayerType(null, feature)).toBe('fill');
  });

  it('defaults to "fill" when no style and no feature', () => {
    expect(resolveLayerType()).toBe('fill');
  });

  it('style type takes priority over geometry type', () => {
    const feature: Feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: {},
    };
    // Even though geometry is Point, explicit type overrides
    expect(resolveLayerType({ type: 'polygon' }, feature)).toBe('fill');
  });
});

describe('toFillPaint', () => {
  it('uses fillColor when provided', () => {
    const paint = toFillPaint({ color: '#ff0000', fillColor: '#00ff00' });
    expect(paint['fill-color']).toBe('#00ff00');
  });

  it('falls back to color when no fillColor', () => {
    const paint = toFillPaint({ color: '#ff0000' });
    expect(paint['fill-color']).toBe('#ff0000');
  });

  it('uses default color when no style', () => {
    const paint = toFillPaint();
    expect(paint['fill-color']).toBe('#3b82f6');
  });

  it('uses fillOpacity when provided', () => {
    const paint = toFillPaint({ fillOpacity: 0.3, opacity: 0.9 });
    expect(paint['fill-opacity']).toBe(0.3);
  });

  it('falls back to opacity when no fillOpacity', () => {
    const paint = toFillPaint({ opacity: 0.7 });
    expect(paint['fill-opacity']).toBe(0.7);
  });

  it('uses default opacity when no style', () => {
    const paint = toFillPaint();
    expect(paint['fill-opacity']).toBe(0.5);
  });
});

describe('toCirclePaint', () => {
  it('returns correct circle paint from full style', () => {
    const paint = toCirclePaint({ color: '#ff0000', radius: 8, opacity: 0.7 });
    expect(paint['circle-color']).toBe('#ff0000');
    expect(paint['circle-radius']).toBe(8);
    expect(paint['circle-opacity']).toBe(0.7);
  });

  it('uses defaults when no style', () => {
    const paint = toCirclePaint();
    expect(paint['circle-color']).toBe('#3b82f6');
    expect(paint['circle-radius']).toBe(6);
    expect(paint['circle-opacity']).toBe(0.8);
  });

  it('uses default color when only radius provided', () => {
    const paint = toCirclePaint({ radius: 10 });
    expect(paint['circle-color']).toBe('#3b82f6');
    expect(paint['circle-radius']).toBe(10);
  });
});

describe('toLinePaint', () => {
  it('returns correct line paint from full style', () => {
    const paint = toLinePaint({ color: '#6b7280', weight: 3, opacity: 0.6 });
    expect(paint['line-color']).toBe('#6b7280');
    expect(paint['line-width']).toBe(3);
    expect(paint['line-opacity']).toBe(0.6);
  });

  it('uses defaults when no style', () => {
    const paint = toLinePaint();
    expect(paint['line-color']).toBe('#3b82f6');
    expect(paint['line-width']).toBe(2);
    expect(paint['line-opacity']).toBe(0.8);
  });

  it('falls back to default width when weight not set', () => {
    const paint = toLinePaint({ color: '#000000' });
    expect(paint['line-width']).toBe(2);
  });
});
