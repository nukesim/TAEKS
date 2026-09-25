import { Flame, Snowflake, LockKeyhole, Share2, ShieldCheck } from 'lucide-react';
export default function TakeCard({take,onBack,onFade,onShare,compact=false}){
  return <article className={`receipt ${compact?'compact':''}`}>
    <div className="receipt-top"><div className="brandmark"><span className="brand-fire"><Flame size={18} fill="currentColor"/></span>STAMPD</div><span className={`status ${take.status==='HIT'?'hit':take.status==='MISS'?'miss':''}`}>{take.status||'LIVE'}</span></div>
    <div className="eyebrow">{take.category} · {take.season}</div>
    <h2>{take.canonicalText}</h2>
    <div className="author"><div className="avatar">{(take.username||'B')[0].toUpperCase()}</div><div><strong>@{take.username||'bryson'}</strong><span>STAMPED {new Date(take.stampedAt).toLocaleString([], {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).toUpperCase()}</span></div></div>
    <div className="confidence-row"><div><span className="tiny">CONFIDENCE</span><strong>{take.confidence}%</strong></div><div className="meter"><span style={{width:`${take.confidence}%`}}/></div></div>
    <div className="criteria"><ShieldCheck size={17}/><div><span>LOCKED CRITERIA</span><p>{take.criteria}</p></div></div>
    <div className="receipt-footer"><span><LockKeyhole size={14}/> STAMP #{take.id}</span><span>HASH {take.hash}</span></div>
    <div className="reactions"><button onClick={onBack} className="back"><Flame size={18}/> BACK <b>{take.back||0}</b></button><button onClick={onFade} className="fade"><Snowflake size={18}/> FADE <b>{take.fade||0}</b></button><button aria-label="Share" onClick={onShare} className="share"><Share2 size={18}/></button></div>
  </article>
}
