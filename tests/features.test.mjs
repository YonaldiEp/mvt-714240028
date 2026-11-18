import test from 'node:test';
import assert from 'node:assert/strict';
import { featureBounds, filterFeatures, geometryLabel } from '../feature-utils.js';

test('pencarian menggabungkan filter dataset, nama, dan nama yang berulang', () => {
  const records = [
    { feature: { id: 3, properties: { Nama: 'Gedung Ráflesia', dataset: 'kampus' } } },
    { feature: { id: 1, properties: { Nama: 'Gedung Raflesia', dataset: 'jalan' } } },
    { feature: { id: 2, properties: { Nama: 'Gedung Ráflesia', dataset: 'kampus' } } }
  ];
  assert.deepEqual(filterFeatures(records, 'kampus', '  RAFLESIA ').map(item => item.feature.id), [2, 3]);
  assert.equal(filterFeatures(records, 'all', '').length, 3);
  assert.equal(filterFeatures(records, 'kampus', 'tidak ada').length, 0);
  assert.equal(filterFeatures([{ feature: { id: 4, properties: { Nama: 123, dataset: 'kampus' } } }], 'all', '123').length, 1);
});

test('fokus fitur mengambil seluruh posisi termasuk ring dan geometri multi', () => {
  assert.deepEqual(featureBounds({ type: 'MultiPolygon', coordinates: [[[[107, -7], [108, -6], [107, -7]]], [[[106, -8], [109, -5], [106, -8]]]] }), [106, -8, 109, -5]);
  assert.deepEqual(featureBounds({ type: 'Point', coordinates: [107, -6] }), [107, -6, 107, -6]);
  assert.equal(featureBounds({ type: 'Polygon', coordinates: [] }), null);
  assert.equal(geometryLabel('MultiPolygon'), 'Area');
  assert.equal(geometryLabel('MultiLineString'), 'Garis');
  assert.equal(geometryLabel('MultiPoint'), 'Titik');
});
