const PLAYERS = [['josh allen','Josh Allen'],['lamar jackson','Lamar Jackson'],['dak prescott','Dak Prescott'],['patrick mahomes','Patrick Mahomes'],['mahomes','Patrick Mahomes']];
const TEAMS = [['cowboys','Dallas Cowboys'],['bills','Buffalo Bills'],['chiefs','Kansas City Chiefs'],['eagles','Philadelphia Eagles'],['packers','Green Bay Packers'],['ravens','Baltimore Ravens']];
function entity(raw){ const l=raw.toLowerCase(); for(const [n,c] of PLAYERS) if(l.includes(n)) return [c,'player']; for(const [n,c] of TEAMS) if(l.includes(n)) return [c,'team']; return [raw.replace(/[.!?]+$/,''),'other']; }
export function parseTake(raw){
  const text=raw.trim(); const l=text.toLowerCase(); const [subject,subjectType]=entity(text); const season=new Date().getFullYear();
  if(/\b(mvp|most valuable player)\b/.test(l)) return {originalText:text,canonicalText:`${subject} wins NFL MVP`,category:'NFL',subject,subjectType,predictionType:'Award',criteria:`${subject} is named AP NFL MVP for the ${season} season`,resolutionSource:'Official AP/NFL award result',season};
  const wins=l.match(/(?:win|wins|get|gets|have|has)\s+(?:more than\s+|over\s+|at least\s+)?(\d{1,2})\s+(?:games|wins)/);
  if(wins){ const n=Number(wins[1]); const over=/more than|over/.test(l); return {originalText:text,canonicalText:`${subject} ${over?'wins more than':'wins at least'} ${n} regular-season games`,category:'NFL',subject,subjectType,predictionType:'Threshold',criteria:`${subject} finishes the ${season} NFL regular season with ${over?'>':'≥'} ${n} wins`,resolutionSource:'Official NFL standings',season}; }
  const td=l.match(/(?:throw|throws).*?(\d{1,2})\+?\s*(?:td|tds|touchdowns)/);
  if(td) return {originalText:text,canonicalText:`${subject} throws ${td[1]}+ touchdowns`,category:'NFL',subject,subjectType,predictionType:'Threshold',criteria:`${subject} records at least ${td[1]} passing TDs in the ${season} regular season`,resolutionSource:'Official NFL player stats',season};
  return {originalText:text,canonicalText:text.replace(/[.!?]+$/,''),category:'OTHER',subject,subjectType,predictionType:'Custom',criteria:'Resolve exactly as written, or by group vote if objectively unverifiable.',resolutionSource:'Community / manual resolution',season};
}
export function makeId(){ return Math.random().toString(36).slice(2,8).toUpperCase(); }
export function contentHash(take){ let h=2166136261; const s=JSON.stringify(take); for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)} return (h>>>0).toString(16).padStart(8,'0').toUpperCase(); }
