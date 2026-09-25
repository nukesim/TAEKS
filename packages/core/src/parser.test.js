import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTake } from './parser.js';

const now = new Date('2026-09-25T09:19:00-05:00');

test('parses MVP take', () => {
  const out = parseTake('Josh Allen wins MVP', now);
  assert.equal(out.league, 'NFL');
  assert.equal(out.subject, 'Josh Allen');
  assert.equal(out.metric, 'NFL MVP');
  assert.equal(out.predictionType, 'winner');
});

test('parses team win threshold', () => {
  const out = parseTake('Cowboys win more than 11 games', now);
  assert.equal(out.subject, 'Dallas Cowboys');
  assert.equal(out.operator, '>');
  assert.equal(out.targetValue, 11);
});
