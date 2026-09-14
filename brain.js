(function(){
  'use strict';
  const KEY='unidojo-brain-v1';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}};
  const save=x=>{try{localStorage.setItem(KEY,JSON.stringify(x))}catch(e){}};
  const state=()=>window.S||{};
  const seed=()=>{
    const s=state(), lessons=Array.isArray(window.LESSONS)?window.LESSONS:[], completed=Array.isArray(s.completed)?s.completed:[];
    const weak=lessons.filter((_,i)=>!completed.includes(i));
    const pool=weak.length?weak:lessons;
    if(!pool.length)return null;
    const idx=(Number(s.xp)||0 + Number(s.brainVisits)||0 + completed.length*7)%pool.length;
    const x=pool[idx];
    const formats=['SCENARIO','RAPID FIRE','MONEY MATH','WHAT WOULD YOU DO?','SPOT THE TRAP','TWO-STAGE DECISION'];
    const format=formats[((Number(s.brainVisits)||0)+completed.length)%formats.length];
    const variants={
      'Runway maths':`You have £420 cash, £300 rent due, a £50 protected buffer and 7 days until payday. What is the most defensible amount of that cash to treat as flexible?`,
      'Opportunity cost':`You have £90 of genuinely flexible money and are deciding whether to spend £45 tonight. What are you giving up by choosing the £45 spend?`,
      'Credit comparison':`Two cards advertise the same headline rate, but one carries a mandatory annual fee. What evidence should decide which is actually cheaper?`,
      'Concentration risk':`You have £4,000 invested and £3,200 is in one company after a big price rise. What is the strongest reason not to interpret that rise as proof you should add even more?`,
      'Debt vs investing':`You have £600 of high-cost card debt and £600 available to invest. What should be compared before deciding where the £600 goes?`
    };
    return {title:x[0],topic:x[2],format,prompt:variants[x[0]]||x[3],choices:x[4],answer:x[5],reason:'Use the principle, then apply it to the numbers. The goal is transfer, not memorisation.'};
  };
  async function serverBrain(){
    try{
      if(!window.supabase||!window.UNIDOJO_SUPABASE_URL)return null;
      const client=window.__unidojoSupabase||window.supabaseClient;
      if(!client||!client.functions)return null;
      const s=state(), p=s.profile||{}, b=load();
      const payload={profile:{goal:p.goal||'all',confidence:Number(p.confidence)||2,income:Number(p.income)||0,rent:Number(p.rent)||0,weeklySpend:Number(p.weeklySpend)||0},xp:Number(s.xp)||0,streak:Number(s.streak)||0,completed:Array.isArray(s.completed)?s.completed.slice(-30):[],recentDecisions:Array.isArray(s.decisions)?s.decisions.slice(-12):[],brainVisits:Number(b.visits)||0};
      const {data,error}=await client.functions.invoke('unidojo-brain',{body:payload});
      if(error||!data||!data.question)return null;
      return data.question;
    }catch(e){return null}
  }
  function card(q){
    const old=document.getElementById('brain-card'); if(old)old.remove();
    const host=document.getElementById('app'); if(!host)return;
    const choices=Array.isArray(q.choices)?q.choices.slice(0,4):[];
    const html=`<section id="brain-card" class="card hero" style="border-color:#ff9800;box-shadow:0 0 0 1px #ff980033,0 12px 40px #0008"><div class="row"><span class="pill">🧠 DOJO BRAIN</span><span class="pill">${esc(q.format||'ADAPTIVE')}</span></div><h2 style="margin-top:12px">${esc(q.title||'Adaptive challenge')}</h2><p class="muted"><b>${esc(q.topic||'Training')}</b> · ${esc(q.reason||'Built around your recent performance.')}</p><p style="font-size:18px;font-weight:750">${esc(q.prompt||'')}</p><div id="brain-choices">${choices.map((c,i)=>`<button class="choice" data-brain-answer="${i}">${esc(c)}</button>`).join('')}</div><div id="brain-result" class="muted" style="margin-top:10px"></div></section>`;
    host.insertAdjacentHTML('afterbegin',html);
    document.querySelectorAll('[data-brain-answer]').forEach(btn=>btn.addEventListener('click',function(){
      const i=Number(this.dataset.brainAnswer), correct=i===Number(q.answer), root=document.getElementById('brain-card');
      document.querySelectorAll('[data-brain-answer]').forEach(b=>b.disabled=true);
      this.classList.add(correct?'correct':'wrong');
      if(!correct){const right=document.querySelector(`[data-brain-answer="${Number(q.answer)}"]`);if(right)right.classList.add('correct')}
      const r=document.getElementById('brain-result');
      r.innerHTML=correct?'<span class="success">Correct. Your Brain session has logged the result.</span>':`<span class="error">Not quite. The Brain will bias your next session toward this concept.</span>`;
      const b=load();b.last={title:q.title,topic:q.topic,correct,at:Date.now()};b.visits=(Number(b.visits)||0)+1;save(b);
      const s=state();if(Array.isArray(s.brainHistory))s.brainHistory.push(b.last);else s.brainHistory=[b.last];
      if(correct&&typeof window.addXP==='function')window.addXP(8);else if(!correct){s.hearts=Math.max(0,(Number(s.hearts)||0)-1);if(typeof window.save==='function')window.save()}
    }));
  }
  async function run(){
    const b=load(); b.visits=(Number(b.visits)||0)+1; save(b);
    const q=await serverBrain()||seed(); if(q)card(q);
  }
  function install(){
    if(window.__unidojoBrainInstalled)return; window.__unidojoBrainInstalled=true;
    let tries=0; const timer=setInterval(()=>{
      tries++;
      if(typeof window.train==='function'){
        const original=window.train;
        window.train=function(){original.apply(this,arguments);setTimeout(run,120)};
        clearInterval(timer);
      }
      if(tries>100)clearInterval(timer);
    },100);
  }
  install();
  window.UnidojoBrain={run,seed};
})();
