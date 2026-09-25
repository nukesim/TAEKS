import React, { useEffect, useState } from 'react';
import { Flame, ArrowLeft, LockKeyhole } from 'lucide-react';
import DemoApp from './DemoApp';
import TakeCard from './components/TakeCard';
import { parseTake } from './lib/take';
import { supabase } from './lib/supabase';
import { takeForInsert, toTake } from './lib/receipts';

function routeId() {
  return decodeURIComponent(location.pathname.match(/^\/t\/([^/]+)\/?$/)?.[1] || '');
}

function ConnectedApp() {
  const [receiptId, setReceiptId] = useState(routeId);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [text, setText] = useState('');
  const [draft, setDraft] = useState(null);
  const [confidence, setConfidence] = useState(75);
  const [takes, setTakes] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(Boolean(routeId()));
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function navigate(id = '') {
    history.pushState({}, '', id ? `/t/${encodeURIComponent(id)}` : '/');
    setReceiptId(id);
    setError('');
  }

  useEffect(() => {
    const onPop = () => setReceiptId(routeId());
    addEventListener('popstate', onPop);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!authError) setUser(data.user || null);
      setLoading(false);
    });
    return () => { removeEventListener('popstate', onPop); subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user) { setUsername(''); setTakes([]); return; }
    let active = true;
    async function setup() {
      try {
        let { data: profile, error: readError } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
        if (readError) throw readError;
        if (!profile) {
          const created = await supabase.from('profiles').insert({ id: user.id, username: `user_${user.id.slice(0, 8)}` }).select('username').single();
          if (created.error) throw created.error;
          profile = created.data;
        }
        if (active) setUsername(profile.username);
        await loadMine(user.id, () => active);
      } catch (e) { if (active) setError(e.message); }
    }
    setup();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!receiptId) { setReceipt(null); setReceiptLoading(false); return; }
    let active = true;
    setReceipt(null); setReceiptLoading(true);
    loadReceipt(receiptId).then(take => { if (active) setReceipt(take); }).catch(e => { if (active) { setReceipt(null); setError(e.message); } }).finally(() => { if (active) setReceiptLoading(false); });
    return () => { active = false; };
  }, [receiptId, user?.id]);

  async function withReactions(rows) {
    if (!rows.length) return [];
    const { data, error: readError } = await supabase.from('take_reactions').select('take_id,reaction').in('take_id', rows.map(t => t.id));
    if (readError) throw readError;
    return rows.map(row => toTake(row, (data || []).filter(r => r.take_id === row.id)));
  }

  async function loadMine(userId = user?.id, isActive = () => true) {
    if (!userId) return;
    const { data, error: readError } = await supabase.from('takes').select('*, profiles(username)').eq('user_id', userId).order('stamped_at', { ascending: false });
    if (readError) throw readError;
    const formatted = await withReactions(data || []);
    if (isActive()) setTakes(formatted);
  }

  async function loadReceipt(id) {
    const { data, error: readError } = await supabase.from('takes').select('*, profiles(username)').eq('short_id', id).maybeSingle();
    if (readError) throw readError;
    if (!data) return null;
    return (await withReactions([data]))[0];
  }

  async function sendLink(event) {
    event.preventDefault(); setBusy(true); setError('');
    const { error: authError } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href } });
    setBusy(false);
    if (authError) setError(authError.message);
    else setEmailSent(true);
  }

  async function stamp() {
    if (!user || !draft || busy) return;
    setBusy(true); setError('');
    const { data, error: insertError } = await supabase.from('takes').insert(takeForInsert(text, confidence, user.id)).select('short_id').single();
    setBusy(false);
    if (insertError) { setError(insertError.message); return; }
    setDraft(null); setText('');
    navigate(data.short_id);
    loadMine().catch(e => setError(e.message));
  }

  async function react(take, reaction) {
    if (!user) { setError('Sign in below to Back or Fade this take.'); return; }
    setBusy(true); setError('');
    const { error: reactionError } = await supabase.from('take_reactions').upsert({ take_id: take.uuid, user_id: user.id, reaction }, { onConflict: 'take_id,user_id' });
    setBusy(false);
    if (reactionError) { setError(reactionError.message); return; }
    if (receiptId) setReceipt(await loadReceipt(receiptId));
    else await loadMine();
  }

  async function share(take) {
    const url = `${location.origin}/t/${encodeURIComponent(take.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: `TAEKS: ${take.canonicalText}`, text: `${take.canonicalText} — locked by @${take.username}`, url });
      else { await navigator.clipboard.writeText(url); setError('Receipt link copied.'); }
    } catch (e) { if (e.name !== 'AbortError') setError('Could not share the receipt.'); }
  }

  const card = take => <TakeCard key={take.id} take={take} onBack={() => react(take, 'BACK')} onFade={() => react(take, 'FADE')} onShare={() => share(take)} />;
  const signIn = <form className="sign-in" onSubmit={sendLink}><label htmlFor="email">Sign in to stamp, Back or Fade</label><input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" /><button disabled={busy}>Email me a sign-in link</button>{emailSent && <p>Check your inbox for the link.</p>}</form>;

  return <div className="app-shell connected">
    <header><button className="plain-logo" onClick={() => navigate()}><Flame size={22} fill="currentColor" /> TAEKS</button><span className="profile-chip">{username ? username[0].toUpperCase() : '?'}</span></header>
    {error && <div className="app-message" role="status">{error}</div>}
    {receiptId ? <main className="receipt-page">
      <button className="back-link" onClick={() => navigate()}><ArrowLeft size={17} /> Back to takes</button>
      {receipt ? <>{card(receipt)}<div className="receipt-actions"><button onClick={() => share(receipt)}>Share receipt</button></div>{!user && signIn}</> : <p>{receiptLoading ? 'Loading receipt…' : 'Receipt unavailable or private.'}</p>}
    </main> : <main>
      <section className="hero"><div className="kicker">SAY IT. LOCK IT. PROVE IT.</div><h1>What's your <em>take?</em></h1><p>Make a prediction and share its locked receipt.</p>
        {user ? <><div className="composer"><textarea value={text} onChange={e => setText(e.target.value)} placeholder="Josh Allen wins MVP…" maxLength={180} /><div className="composer-bottom"><span>{text.length}/180</span><button disabled={!text.trim()} onClick={() => setDraft(parseTake(text))}><Flame size={18} /> LOCK IT</button></div></div><button className="quiet-action" onClick={() => supabase.auth.signOut()}>Sign out @{username}</button></>
          : signIn}
      </section>
      <section className="feed"><div className="section-title"><div><span>YOUR LIVE TAKES</span><h3>Receipts in progress</h3></div></div>{takes.length ? takes.map(card) : <p>{user ? 'Your first receipt will appear here.' : 'Sign in to see your takes.'}</p>}</section>
    </main>}
    {draft && <div className="modal-backdrop"><div className="modal"><button className="close" onClick={() => setDraft(null)}>×</button><div className="stamp-icon"><Flame size={28} fill="currentColor" /></div><span className="modal-label">WE INTERPRETED YOUR TAKE AS</span><h2>{draft.canonicalText}</h2><div className="parse-grid"><div><span>CATEGORY</span><b>{draft.category}</b></div><div><span>TYPE</span><b>{draft.predictionType}</b></div><div className="wide"><span>RESOLUTION CRITERIA</span><b>{draft.criteria}</b></div><div className="wide"><span>SOURCE</span><b>{draft.resolutionSource}</b></div></div><label className="slider-label"><span>HOW HARD ARE YOU STAMPING THIS?</span><b>{confidence}%</b></label><input className="slider" type="range" min="50" max="100" value={confidence} onChange={e => setConfidence(+e.target.value)} /><p className="warning"><LockKeyhole size={15} /> Once stamped, these details cannot be edited.</p><button className="stamp-button" disabled={busy} onClick={stamp}>LOCK THIS TAKE</button></div></div>}
  </div>;
}

export default function App() { return supabase ? <ConnectedApp /> : <DemoApp />; }
