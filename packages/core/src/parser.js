const TEAM_ALIASES = [
  ['cowboys', 'Dallas Cowboys'], ['bills', 'Buffalo Bills'], ['chiefs', 'Kansas City Chiefs'],
  ['eagles', 'Philadelphia Eagles'], ['packers', 'Green Bay Packers'], ['ravens', 'Baltimore Ravens']
];

const PLAYER_ALIASES = [
  ['josh allen', 'Josh Allen'], ['lamar jackson', 'Lamar Jackson'], ['dak prescott', 'Dak Prescott'],
  ['patrick mahomes', 'Patrick Mahomes'], ['mahomes', 'Patrick Mahomes']
];

function titleCase(text) {
  return text.replace(/\b\w/g, c => c.toUpperCase());
}

function findEntity(input) {
  const lower = input.toLowerCase();
  for (const [needle, canonical] of PLAYER_ALIASES) if (lower.includes(needle)) return { subject: canonical, subjectType: 'player' };
  for (const [needle, canonical] of TEAM_ALIASES) if (lower.includes(needle)) return { subject: canonical, subjectType: 'team' };
  return { subject: titleCase(input.trim()), subjectType: 'other' };
}

export function parseTake(input, now = new Date()) {
  const raw = input.trim();
  if (!raw) throw new Error('Take text is required');
  const lower = raw.toLowerCase();
  const entity = findEntity(raw);
  const year = now.getFullYear();

  if (/\b(mvp|most valuable player)\b/.test(lower)) {
    return {
      originalText: raw,
      canonicalText: `${entity.subject} wins NFL MVP`,
      category: 'Sports', league: 'NFL', subject: entity.subject, subjectType: entity.subjectType,
      predictionType: 'winner', metric: 'NFL MVP', operator: 'equals', targetValue: 'winner',
      season: year, resolutionSource: 'Official NFL/AP award result', resolvable: true
    };
  }

  const wins = lower.match(/(?:win|wins|get|gets|have|has)\s+(?:more than\s+|over\s+|at least\s+)?(\d{1,2})\s+(?:games|wins)/);
  if (wins) {
    const n = Number(wins[1]);
    const isOver = /more than|over/.test(lower);
    return {
      originalText: raw,
      canonicalText: `${entity.subject} ${isOver ? `wins more than ${n}` : `wins at least ${n}`} regular-season games`,
      category: 'Sports', league: 'NFL', subject: entity.subject, subjectType: entity.subjectType,
      predictionType: 'stat_threshold', metric: 'regular_season_wins', operator: isOver ? '>' : '>=', targetValue: n,
      season: year, resolutionSource: 'Official NFL standings', resolvable: true
    };
  }

  const td = lower.match(/(?:throw|throws).*?(\d{1,2})\+?\s*(?:td|tds|touchdowns)/);
  if (td) {
    return {
      originalText: raw,
      canonicalText: `${entity.subject} throws ${td[1]}+ touchdowns`,
      category: 'Sports', league: 'NFL', subject: entity.subject, subjectType: entity.subjectType,
      predictionType: 'stat_threshold', metric: 'passing_touchdowns', operator: '>=', targetValue: Number(td[1]),
      season: year, resolutionSource: 'Official NFL player statistics', resolvable: true
    };
  }

  return {
    originalText: raw,
    canonicalText: raw.replace(/[.!?]+$/, ''),
    category: 'Other', league: null, subject: entity.subject, subjectType: entity.subjectType,
    predictionType: 'custom', metric: null, operator: null, targetValue: null,
    season: year, resolutionSource: 'Manual / community resolution', resolvable: false
  };
}
