import { parseTake } from './take.js';

export function toTake(row, reactions = [], username) {
  return {
    id: row.short_id,
    originalText: row.original_text,
    canonicalText: row.canonical_text,
    category: row.category,
    season: row.season,
    confidence: row.confidence,
    criteria: row.resolution_criteria,
    stampedAt: row.stamped_at,
    status: row.status,
    hash: row.content_hash.slice(0, 12).toUpperCase(),
    username: username || row.profiles?.username || 'member',
    back: reactions.filter(r => r.reaction === 'BACK').length,
    fade: reactions.filter(r => r.reaction === 'FADE').length,
    uuid: row.id
  };
}

export function takeForInsert(text, confidence, userId) {
  const parsed = parseTake(text);
  return {
    user_id: userId,
    original_text: parsed.originalText,
    canonical_text: parsed.canonicalText,
    category: parsed.category,
    subject: parsed.subject,
    subject_type: parsed.subjectType,
    prediction_type: parsed.predictionType,
    season: parsed.season,
    confidence,
    resolution_criteria: parsed.criteria,
    resolution_source: parsed.resolutionSource,
    visibility: 'public',
    content_hash: '' // The database overwrites this in the before-insert trigger.
  };
}
