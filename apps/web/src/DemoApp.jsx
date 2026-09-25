import React, {useMemo,useState} from 'react';
import { Flame, LockKeyhole, Trophy, Users, UserRound, Plus, ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import TakeCard from './components/TakeCard';
import {parseTake,makeId,contentHash} from './lib/take';

const examples=['Josh Allen wins MVP','Cowboys win more than 11 games','Dak throws 35+ TDs'];
const seed=[
  {id:'A83F91',canonicalText:'Josh Allen wins NFL MVP',category:'NFL',season:2026,confidence:80,criteria:'Josh Allen is named AP NFL MVP for the 2026 season',stampedAt:'2026-09-25T09:19:00-05:00',status:'LIVE',back:14,fade:8,hash:'9B3F7A1C'},
  {id:'7K2D4Q',canonicalText:'Dallas Cowboys win more than 11 regular-season games',category:'NFL',season:2026,confidence:64,criteria:'Dallas Cowboys finish the 2026 NFL regular season with > 11 wins',stampedAt:'2026-09-24T20:11:00-05:00',status:'LIVE',back:9,fade:21,hash:'42A8DE11'}
];

function Logo(){return <div className="logo"><span><Flame size={22} fill="currentColor"/></span>TAEKS</div>}

export default function App(){
 const [screen,setScreen]=useState(location.hash.startsWith('#take=')?'receipt':'home');
 const [text,setText]=useState(''); const [confidence,setConfidence]=useState(75); const [draft,setDraft]=useState(null); const [takes,setTakes]=useState(seed);
 const currentId=location.hash.replace('#take=',''); const current=useMemo(()=>takes.find(t=>t.id===currentId)||takes[0],[takes,currentId]);
 const analyze=()=>{if(!text.trim())return;setDraft(parseTake(text));};
 const stamp=()=>{ const base={...draft,confidence,id:makeId(),stampedAt:new Date().toISOString(),status:'LIVE',back:0,fade:0}; const take={...base,hash:contentHash(base)}; setTakes(x=>[take,...x]); location.hash=`take=${take.id}`; setScreen('receipt'); setDraft(null); setText(''); };
 const react=(id,key)=>setTakes(ts=>ts.map(t=>t.id===id?{...t,[key]:(t[key]||0)+1}:t));
 const share=async(t)=>{const url=`${location.origin}${location.pathname}#take=${t.id}`; const data={title:`TAEKS: ${t.canonicalText}`,text:`🔥 ${t.canonicalText} — locked by @bryson`,url}; try{if(navigator.share) await navigator.share(data); else await navigator.clipboard.writeText(url);}catch{}};
 return <div className="app-shell">
   <header><Logo/><button className="profile-chip">B</button></header>
   {screen==='home' && <main>
    <section className="hero"><div className="kicker">SAY IT. LOCK IT. PROVE IT.</div><h1>What's your <em>take?</em></h1><p>Turn any prediction into a permanent, timestamped receipt.</p>
      <div className="composer"><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Josh Allen wins MVP..." maxLength={180}/><div className="composer-bottom"><span>{text.length}/180</span><button onClick={analyze} disabled={!text.trim()}><Flame size={18} fill="currentColor"/> LOCK IT</button></div></div>
      <div className="examples">{examples.map(x=><button key={x} onClick={()=>setText(x)}>{x}</button>)}</div>
    </section>
    <section className="feed"><div className="section-title"><div><span>YOUR LIVE TAKES</span><h3>Receipts in progress</h3></div><button>View all</button></div>{takes.map(t=><TakeCard compact key={t.id} take={t} onBack={()=>react(t.id,'back')} onFade={()=>react(t.id,'fade')} onShare={()=>share(t)}/>)}</section>
   </main>}

   {draft && <div className="modal-backdrop"><div className="modal"><button className="close" onClick={()=>setDraft(null)}>×</button><div className="stamp-icon"><Flame size={28} fill="currentColor"/></div><span className="modal-label">WE INTERPRETED YOUR TAKE AS</span><h2>{draft.canonicalText}</h2><div className="parse-grid"><div><span>CATEGORY</span><b>{draft.category}</b></div><div><span>TYPE</span><b>{draft.predictionType}</b></div><div className="wide"><span>RESOLUTION CRITERIA</span><b>{draft.criteria}</b></div><div className="wide"><span>SOURCE</span><b>{draft.resolutionSource}</b></div></div><label className="slider-label"><span>HOW HARD ARE YOU STAMPING THIS?</span><b>{confidence}%</b></label><input className="slider" type="range" min="50" max="100" value={confidence} onChange={e=>setConfidence(+e.target.value)}/><p className="warning"><LockKeyhole size={15}/> Once stamped, the prediction, confidence, and criteria cannot be edited.</p><button className="stamp-button" onClick={stamp}><Flame size={19} fill="currentColor"/> LOCK THIS TAKE</button></div></div>}

   {screen==='receipt' && current && <main className="receipt-page"><button className="back-link" onClick={()=>{history.replaceState(null,'',location.pathname);setScreen('home')}}><ArrowLeft size={17}/> Back to takes</button><div className="locked-banner"><CheckCircle2 size={18}/> Receipt locked. This take is now part of the record.</div><TakeCard take={current} onBack={()=>react(current.id,'back')} onFade={()=>react(current.id,'fade')} onShare={()=>share(current)}/><div className="receipt-actions"><button onClick={()=>share(current)}>Share receipt</button><button onClick={()=>{setText('');history.replaceState(null,'',location.pathname);setScreen('home')}}><RotateCcw size={16}/> Stamp another</button></div></main>}

   <nav><button className={screen==='home'?'active':''} onClick={()=>setScreen('home')}><Flame/><span>Takes</span></button><button><Users/><span>Groups</span></button><button className="create" onClick={()=>setScreen('home')}><Plus/></button><button><Trophy/><span>Records</span></button><button><UserRound/><span>Me</span></button></nav>
 </div>
}
