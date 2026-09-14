(function(){
  'use strict';
  const KEY='unidojo-core-v5', BKEY='unidojo-brain-v1';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}};
  const bload=()=>{try{return JSON.parse(localStorage.getItem(BKEY)||'{}')}catch(e){return {}}};
  const bsave=x=>{try{localStorage.setItem(BKEY,JSON.stringify(x))}catch(e){}};
  const curriculum=[
    {title:'Runway maths',topic:'FOUNDATION',prompt:'You have £420 cash, £300 rent due, a £50 protected buffer and 7 days until payday. What is the most defensible amount to treat as genuinely flexible?',choices:['£10/day','£17.14/day','£60/day','£70/day'],answer:1,why:'Separate committed cash and a protected buffer before calculating flexible runway.'},
    {title:'Opportunity cost',topic:'DECISIONS',prompt:'You have £90 of genuinely flexible money and are deciding whether to spend £45 tonight. What is the key financial idea you should apply?',choices:['The £45 has no future cost','The £45 has an opportunity cost because it cannot fund another goal','Spending is always bad','Cash automatically loses £45'],answer:1,why:'Every flexible pound has competing uses; choosing one means giving up another.'},
    {title:'Credit comparison',topic:'CREDIT',prompt:'Two cards advertise the same headline rate, but one has a compulsory annual fee. What evidence should decide which is actually cheaper?',choices:['The headline rate alone','APR and total borrowing cost for the expected balance','The minimum payment','Which card looks more premium'],answer:1,why:'Headline rates can hide fees and other costs.'},
    {title:'Real returns',topic:'ECONOMICS',prompt:'A savings account pays 4% while inflation is 3%. Ignoring tax and exact compounding, what is the approximate real gain?',choices:['7%','4%','1%','3%'],answer:2,why:'A useful approximation is nominal return minus inflation.'},
    {title:'Buffer design',topic:'RESILIENCE',prompt:'You have £250 cash, irregular income and depend on a laptop for university. Which choice best protects future optionality?',choices:['Spend it because cash loses value','Keep a protected accessible reserve','Put it all into a volatile asset','Borrow £100 instead'],answer:1,why:'Liquidity matters when a surprise expense could interrupt study or income.'},
    {title:'Behaviour design',topic:'BEHAVIOUR',prompt:'You repeatedly overspend on food during busy weeks despite having a detailed budget. What intervention is most likely to change behaviour?',choices:['Make the spreadsheet more complicated','Create a realistic weekly rule and a cheap default meal option','Stop tracking entirely','Set an impossible target'],answer:1,why:'Good behaviour design changes the environment and default action, not just the spreadsheet.'},
    {title:'Concentration risk',topic:'INVESTING',prompt:'You have £4,000 invested and £3,200 is now in one company after a large price rise. What is the strongest reason not to treat the rise itself as proof you should add more?',choices:['The company can never rise again','Your portfolio is already highly exposed to one outcome','All shares are equally risky','Diversification guarantees profit'],answer:1,why:'A strong past move does not remove concentration risk.'},
    {title:'Debt vs investing',topic:'CREDIT',prompt:'You have £600 of high-cost card debt and £600 available to invest. What should you compare first?',choices:['Expected investment return versus borrowing cost and risk','Only the investment’s best historical year','The minimum payment','The investment’s popularity'],answer:0,why:'Borrowing cost is a known drag; investment returns are uncertain.'},
    {title:'Liquidity first',topic:'RESILIENCE',prompt:'You need £800 for a guaranteed university cost in three months. What is the strongest default principle?',choices:['Take equity risk for upside','Keep required money accessible and low-risk','Use credit and invest the £800','Ignore the date'],answer:1,why:'A short, known spending deadline calls for liquidity and capital preservation.'},
    {title:'Rent reality',topic:'LIFE',prompt:'Option A costs £725/month. Option B costs £775/month but saves £35/month on transport. Ignoring other factors, which is cheaper annually?',choices:['A by £600','B by £600','B by £1,020','They cost the same'],answer:1,why:'B costs £50 more in rent but saves £35 transport: £15 net monthly saving, or £180/year — wait: this is a deliberate trap. Recalculate before committing.'],
    {title:'Subscription trap',topic:'BEHAVIOUR',prompt:'Subscriptions cost £7, £6, £5, £5, £4 and £3 monthly. Cancelling the £6 and one £5 subscription saves how much?',choices:['£11/year','£11/month','£66/month','£132/month'],answer:1,why:'Recurring costs should be compared in monthly and annual terms.'}
  ];
  const formats=['SCENARIO','RAPID FIRE','MONEY MATH','WHAT WOULD YOU DO?','SPOT THE TRAP','TWO-STAGE DECISION'];
  function choose(s,b){
    const completed=Array.isArray(s.completed)?s.completed:[], history=Array.isArray(s.brainHistory)?s.brainHistory:[], last=history[history.length-1];
    let pool=curriculum.filter((_,i)=>!completed.includes(i));
    if(!pool.length)pool=curriculum.slice();
    const weakTopic=last&&!last.correct?last.topic:null;
    if(weakTopic){const same=pool.filter(x=>x.topic===weakTopic);if(same.length)pool=same}
    const seed=(Number(s.xp)||0)+(Number(s.streak)||0)*3+(Number(b.visits)||0)*11+history.length*7;
    const q=pool[Math.abs(seed)%pool.length];
    const format=formats[(Number(b.visits)||0+history.length)%formats.length];
    return {title:q.title,topic:q.topic,format,prompt:q.prompt,choices:q.choices,answer:q.answer,reason:q.why};
  }
  async function server(){
    const s=load(),b=bload();
    if(!window.UNIDOJO_SUPABASE_URL||!window.UNIDOJO_SUPABASE_KEY||!window.supabase?.createClient)return null;
    try{
      const client=window.__unidojoBrainClient||(window.__unidojoBrainClient=window.supabase.createClient(window.UNIDOJO_SUPABASE_URL,window.UNIDOJO_SUPABASE_KEY));
      const {data:{session}}=await client.auth.getSession();
      if(!session)return null;
      const payload={profile:{goal:String(s.profile?.goal||'all').slice(0,20),confidence:Math.max(1,Math.min(4,Number(s.profile?.confidence)||2)),income:Math.max(0,Math.min(100000,Number(s.profile?.income)||0)),rent:Math.max(0,Math.min(100000,Number(s.profile?.rent)||0)),weeklySpend:Math.max(0,Math.min(10000,Number(s.profile?.weeklySpend)||0))},xp:Math.max(0,Math.min(100000,Number(s.xp)||0)),streak:Math.max(0,Math.min(10000,Number(s.streak)||0)),completed:(Array.isArray(s.completed)?s.completed:[]).slice(0,30).map(Number).filter(Number.isInteger),recentDecisions:(Array.isArray(s.decisions)?s.decisions:[]).slice(-10),brainVisits:Math.max(0,Math.min(10000,Number(b.visits)||0)),brainHistory:(Array.isArray(s.brainHistory)?s.brainHistory:[]).slice(-10)};
      const r=await fetch(window.UNIDOJO_SUPABASE_URL+'/functions/v1/unidojo-brain',{method:'POST',headers:{'Content-Type':'application/json',apikey:window.UNIDOJO_SUPABASE_KEY,Authorization:'Bearer '+session.access_token},body:JSON.stringify(payload)});
      if(!r.ok)return null;const data=await r.json();return data?.question||null;
    }catch(e){return null}
  }
  function render(q){
    const old=document.getElementById('brain-card');if(old)old.remove();const host=document.getElementById('app');if(!host||!q)return;
    const choices=Array.isArray(q.choices)?q.choices.slice(0,4):[];
    host.insertAdjacentHTML('afterbegin',`<section id="brain-card" class="card hero" style="border-color:#ff9800;box-shadow:0 0 0 1px #ff980033,0 12px 40px #0008"><div class="row"><span class="pill">🧠 DOJO BRAIN</span><span class="pill">${esc(q.format||'ADAPTIVE')}</span></div><h2 style="margin-top:12px">${esc(q.title||'Adaptive challenge')}</h2><p class="muted"><b>${esc(q.topic||'Training')}</b> · ${esc(q.reason||'Chosen from your current learning state.')}</p><p style="font-size:18px;font-weight:750">${esc(q.prompt||'')}</p><div id="brain-choices">${choices.map((c,i)=>`<button class="choice" data-brain-answer="${i}">${esc(c)}</button>`).join('')}</div><div id="brain-result" class="muted" style="margin-top:10px"></div></section>`);
    document.querySelectorAll('[data-brain-answer]').forEach(btn=>btn.addEventListener('click',function(){
      const i=Number(this.dataset.brainAnswer),correct=i===Number(q.answer);document.querySelectorAll('[data-brain-answer]').forEach(x=>x.disabled=true);this.classList.add(correct?'correct':'wrong');if(!correct){const r=document.querySelector(`[data-brain-answer="${Number(q.answer)}"]`);if(r)r.classList.add('correct')}
      const out=document.getElementById('brain-result');out.innerHTML=correct?'<span class="success">Correct. The Brain has logged the win.</span>':'<span class="error">Not quite. The Brain will give this concept more weight next time.</span>';
      const s=load(),h=Array.isArray(s.brainHistory)?s.brainHistory:[];h.push({title:q.title,topic:q.topic,correct,at:Date.now()});s.brainHistory=h.slice(-30);try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){};
      const b=bload();b.visits=(Number(b.visits)||0)+1;b.last={title:q.title,topic:q.topic,correct};bsave(b);
      if(correct&&typeof window.addXP==='function')window.addXP(8);
    }));
  }
  async function run(){const b=bload();b.visits=(Number(b.visits)||0)+1;bsave(b);const q=await server()||choose(load(),b);render(q)}
  function install(){let n=0;const t=setInterval(()=>{n++;if(typeof window.train==='function'&&!window.__unidojoBrainInstalled){window.__unidojoBrainInstalled=true;const original=window.train;window.train=function(){original.apply(this,arguments);setTimeout(run,160)};clearInterval(t)}if(n>120)clearInterval(t)},100)}
  install();window.UnidojoBrain={run};
})();
