import test from 'node:test';
import assert from 'node:assert/strict';
import { takeForInsert, toTake } from './receipts.js';

test('stamps include confirmed interpretation and leave server fields to the database', () => {
  const row = takeForInsert('Josh Allen wins MVP', 82, 'account-id');
  assert.equal(row.user_id, 'account-id');
  assert.equal(row.confidence, 82);
  assert.match(row.resolution_criteria, /Josh Allen.*MVP/);
  assert.equal(row.visibility, 'public');
  assert.equal(row.content_hash, '');
  assert.equal('stamped_at' in row, false);
  assert.equal('short_id' in row, false);
});

test('receipt counts reflect persisted reactions', () => {
  const take = toTake({ id: 'uuid', short_id: 'ABC123', original_text: 'A take', canonical_text: 'A take', category: 'NFL', season: 2026, confidence: 75, resolution_criteria: 'Criteria', stamped_at: '2026-09-25T12:00:00Z', status: 'LIVE', content_hash: 'abcdef1234567890', profiles: { username: 'bryson' } }, [
    { reaction: 'BACK' }, { reaction: 'BACK' }, { reaction: 'FADE' }
  ]);
  assert.deepEqual([take.id, take.back, take.fade, take.username], ['ABC123', 2, 1, 'bryson']);
});
