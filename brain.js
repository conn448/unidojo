(function(){
  'use strict';
  const KEY='unidojo-core-v5', BKEY='unidojo-brain-v2';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}};
  const bload=()=>{try{return JSON.parse(localStorage.getItem(BKEY)||'{}')}catch(e){return {}}};
  const bsave=x=>{try{localStorage.setItem(BKEY,JSON.stringify(x))}catch(e){}};
  const fallback=[
    {id:'local-runway',skill:'runway',title:'Runway maths',topic:'FOUNDATION',format:'numeric',difficulty:2,prompt:'You have £420 cash. £300 rent is committed, £50 is protected as a buffer, and payday is 7 days away. What is your maximum flexible runway per day?',value:10,tolerance:.01,reason:'Separate committed and protected cash before calculating flexible runway.',misconception:'Treating committed or protected cash as spendable.',why:'£420 − £300 − £50 = £70; £70 ÷ 7 = £10/day.'},
    {id:'local-opportunity',skill:'opportunity_cost',title:'The invisible price',topic:'DECISIONS',format:'two_stage',difficulty:3,prompt:'You have £90 of flexible money. A £45 night out is available. What is the strongest first move?',choices:['Take it automatically','Check what the £45 would otherwise fund'],answer:1,stage2:{prompt:'What concept are you applying?',choices:['Opportunity cost','Inflation','Liquidity','Compounding'],answer:0},reason:'A spending decision changes which other goals the same money can serve.',misconception:'Thinking opportunity cost means an expense is automatically bad.',why:'The key is the value of the best alternative use of the £45.'},
    {id:'local-credit',skill:'credit',title:'APR beats the headline',topic:'CREDIT',format:'pick_two',difficulty:3,prompt:'Two cards advertise 19%. One has a compulsory annual fee. Pick the TWO strongest comparison points.',choices:['APR','Expected borrowing pattern','Card colour','Minimum payment alone'],answers:[0,1],reason:'Borrowing cost depends on the effective rate, fees and how much/for how long you borrow.',misconception:'Choosing credit from headline rate alone.',why:'APR and expected borrowing pattern reveal more of the true cost.'},
    {id:'local-return',skill:'real_returns',title:'Nominal vs real',topic:'ECONOMICS',format:'numeric',difficulty:3,prompt:'Savings pays 4%; inflation is 3%. Ignoring tax and exact compounding, approximate real return (%)?',value:1,tolerance:.15,reason:'Compare nominal return with inflation.',misconception:'Adding inflation to the nominal return.',why:'4% − 3% ≈ 1% real return.'},
    {id:'local-buffer',skill:'buffer',title:'Protect the option',topic:'RESILIENCE',format:'scenario',difficulty:3,prompt:'You have £250 cash, irregular income and rely on a laptop for university. Which move best protects future optionality?',choices:['Spend it because cash loses value','Keep a protected accessible reserve','Put it all into a volatile asset','Borrow £100 instead'],answer:1,reason:'Liquidity protects against near-term shocks.',misconception:'Ignoring liquidity because long-term returns look attractive.',why:'An accessible reserve can prevent forced borrowing or selling when something goes wrong.'},
    {id:'local-concentration',skill:'concentration',title:'Spot the trap',topic:'INVESTING',format:'trap',difficulty:4,prompt:'Your £4,000 portfolio is now £3,200 in one company after a sharp rise. What is the trap?',choices:['The rise proves the company is safe','Past performance removes concentration risk','The rising price can make one position dominate the portfolio','Diversification guarantees profit'],answer:2,reason:'Price gains can increase concentration even when you buy nothing.',misconception:'Equating recent outperformance with lower risk.',why:'A bigger position means more of your outcome depends on one company.'},
    {id:'local-hype',skill:'behaviour_investing',title:'Chasing the green candle',topic:'BEHAVIOUR',format:'two_stage',difficulty:5,prompt:'A stock rises 15% in two days after viral attention. You feel you are missing out. What is stronger?',choices:['Buy immediately','Pause and investigate the new information and valuation'],answer:1,stage2:{prompt:'What most weakens the case for buying?',choices:['Price rose quickly without matching fundamental change','The company is famous','The stock is liquid','You recognise the ticker'],answer:0},reason:'A price move is information, not proof that an asset is attractive.',misconception:'Using recent momentum as the investment thesis.',why:'You need to distinguish new fundamental information from attention and price movement.'}
  ];
  function localPick(){
    const s=load(),b=bload(),h=Array.isArray(s.brainHistory)?s.brainHistory:[];
    const last=h[h.length-1],weak=last&&!last.correct?last.skill:null;
    let pool=weak?fallback.filter(q=>q.skill===weak):fallback.slice(); if(!pool.length)pool=fallback.slice();
    const unseen=pool.filter(q=>!h.some(x=>x.id===q.id)); if(unseen.length)pool=unseen;
    return pool[Math.floor(Math.random()*pool.length)];
  }
  async function getClient(){
    if(!window.UNIDOJO_SUPABASE_URL||!window.UNIDOJO_SUPABASE_KEY||!window.supabase?.createClient)return null;
    try{return window.__unidojoBrainClient||(window.__unidojoBrainClient=window.supabase.createClient(window.UNIDOJO_SUPABASE_URL,window.UNIDOJO_SUPABASE_KEY))}catch(e){return null}
  }
  async function server(){
    const s=load(),b=bload(),client=await getClient();
    if(!client)return null;
    try{
      const {data:{session}}=await client.auth.getSession();
      const profile=s.profile||{};
      const payload={profile:{goal:String(profile.goal||'all').slice(0,20),confidence:Math.max(1,Math.min(4,Number(profile.confidence)||2)),income:Math.max(0,Math.min(100000,Number(profile.income)||0)),rent:Math.max(0,Math.min(100000,Number(profile.rent)||0)),weeklySpend:Math.max(0,Math.min(10000,Number(profile.weeklySpend)||0))},xp:Number(s.xp)||0,streak:Number(s.streak)||0,brainHistory:(Array.isArray(s.brainHistory)?s.brainHistory:[]).slice(-30)};
      const r=await fetch(window.UNIDOJO_SUPABASE_URL+'/functions/v1/unidojo-brain',{method:'POST',headers:{'Content-Type':'application/json',apikey:window.UNIDOJO_SUPABASE_KEY,Authorization:session?'Bearer '+session.access_token:''},body:JSON.stringify(payload)});
      if(!r.ok)return null;const data=await r.json();return data?.question?{...data.question,brain:data.brain}:null;
    }catch(e){return null}
  }
  async function logEvent(q,correct,startedAt,confidence){
    const s=load(),h=Array.isArray(s.brainHistory)?s.brainHistory:[];
    h.push({id:q.id,skill:q.skill,title:q.title,correct,at:Date.now(),difficulty:q.difficulty,format:q.format});
    s.brainHistory=h.slice(-40);try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}
    const client=await getClient(); if(!client)return;
    try{const {data:{session}}=await client.auth.getSession();if(!session)return;await client.from('learning_events').insert({user_id:session.user.id,skill_id:q.skill,question_id:q.id,format:q.format,difficulty:q.difficulty,correct,confidence:confidence||null,response_ms:Math.max(0,Date.now()-startedAt),misconception:correct?null:(q.misconception||null)});}catch(e){}
  }
  function masteryLine(q){
    const h=load().brainHistory||[],rows=h.filter(x=>x.skill===q.skill).slice(-8);if(!rows.length)return 'NEW SKILL';const score=Math.round(rows.filter(x=>x.correct).length/rows.length*100);return score+'% recent mastery';
  }
  function shell(q){
    const old=document.getElementById('brain-card');if(old)old.remove();const host=document.getElementById('app');if(!host||!q)return null;
    host.insertAdjacentHTML('afterbegin',`<section id="brain-card" class="card hero" style="border-color:#ff9800;box-shadow:0 0 0 1px #ff980033,0 12px 40px #0008"><div class="row wrap"><span class="pill">🧠 DOJO BRAIN</span><span class="pill">${esc((q.format||'ADAPTIVE').replace('_',' ').toUpperCase())}</span><span class="pill">LVL ${esc(q.difficulty||2)}</span></div><div class="eyebrow" style="margin-top:12px">${esc(q.topic||'TRAINING')} · ${esc(masteryLine(q))}</div><h2 style="margin-top:7px">${esc(q.title||'Adaptive challenge')}</h2><p style="font-size:18px;font-weight:780">${esc(q.prompt||'')}</p><div id="brain-body"></div><div id="brain-result" class="muted" style="margin-top:12px"></div></section>`);
    return document.getElementById('brain-body');
  }
  function finish(q,correct,startedAt,confidence,explanation){
    const buttons=document.querySelectorAll('#brain-card button');buttons.forEach(b=>b.disabled=true);
    const result=document.getElementById('brain-result');result.innerHTML=correct?`<span class="success">✓ Correct. ${esc(explanation||q.why||'Good decision.')}</span>`:`<span class="error">Not quite. ${esc(explanation||q.why||'The Brain will weight this concept more heavily next time.')}</span><div class="muted" style="margin-top:7px">${correct?'Keep going — difficulty can rise from here.':'Misconception logged: '+esc(q.misconception||'The Brain will revisit this.')}</div>`;
    logEvent(q,correct,startedAt,confidence);
    if(correct&&typeof window.addXP==='function')window.addXP(8+Math.max(0,(Number(q.difficulty)||1)-2)*2);else{const s=load();s.hearts=Math.max(1,(Number(s.hearts)||5)-1);try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
  }
  function render(q){
    const body=shell(q);if(!body)return;const startedAt=Date.now();
    if(q.format==='numeric'){
      body.innerHTML=`<input id="brain-input" class="input" inputmode="decimal" placeholder="Type your answer"><div class="actions"><button class="primary" id="brain-submit">Check answer</button></div>`;
      document.getElementById('brain-submit').onclick=()=>{const raw=document.getElementById('brain-input').value.replace(/£|,/g,'').trim(),v=Number(raw);if(!Number.isFinite(v)){toast('Enter a number');return}finish(q,Math.abs(v-Number(q.value))<=Number(q.tolerance||0),startedAt,null,`Correct answer: ${q.value}. ${q.why}`)};
    } else if(q.format==='pick_two'){
      body.innerHTML=(q.choices||[]).map((c,i)=>`<button class="choice" data-pick="${i}">${esc(c)}</button>`).join('')+'<div class="actions"><button class="primary" id="brain-submit">Lock in two</button></div>';
      const picks=[];body.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.pick);const at=picks.indexOf(i);if(at>=0){picks.splice(at,1);b.classList.remove('selected')}else if(picks.length<2){picks.push(i);b.classList.add('selected')}});
      document.getElementById('brain-submit').onclick=()=>{if(picks.length!==2){toast('Pick exactly two');return}const a=[...picks].sort((a,b)=>a-b),ans=[...(q.answers||[])].sort((a,b)=>a-b);finish(q,JSON.stringify(a)===JSON.stringify(ans),startedAt,null,`Best pair: ${(q.answers||[]).map(i=>q.choices[i]).join(' + ')}. ${q.why}`)};
    } else if(q.format==='rank'){
      body.innerHTML=`<p class="muted">Tap items in the order you want: most concentrated → least concentrated.</p>`+(q.choices||[]).map((c,i)=>`<button class="choice" data-rank="${i}">${esc(c)}</button>`).join('')+'<div class="actions"><button class="primary" id="brain-submit">Lock ranking</button></div>';
      const order=[];body.querySelectorAll('[data-rank]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.rank);if(order.includes(i))return;order.push(i);b.classList.add('selected');b.textContent=(order.length)+'. '+q.choices[i]});
      document.getElementById('brain-submit').onclick=()=>{if(order.length!==(q.choices||[]).length){toast('Rank every option');return}finish(q,JSON.stringify(order)===JSON.stringify(q.order),startedAt,null,`Correct order: ${(q.order||[]).map(i=>q.choices[i]).join(' → ')}. ${q.why}`)};
    } else if(q.format==='two_stage'){
      body.innerHTML=(q.choices||[]).map((c,i)=>`<button class="choice" data-stage="1" data-i="${i}">${esc(c)}</button>`).join('');
      body.querySelectorAll('[data-stage="1"]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.i);body.innerHTML=`<div class="eyebrow">STAGE 2</div><p style="font-weight:750">${esc(q.stage2?.prompt||'Why?')}</p>`+(q.stage2?.choices||[]).map((c,j)=>`<button class="choice" data-stage2="${j}">${esc(c)}</button>`).join('');body.querySelectorAll('[data-stage2]').forEach(x=>x.onclick=()=>{const j=Number(x.dataset.stage2);finish(q,i===Number(q.answer)&&j===Number(q.stage2?.answer),startedAt,null,`Stage 1: ${q.choices[i]}. Stage 2: ${q.stage2?.choices?.[q.stage2.answer]||''}. ${q.why}`)})});
    } else {
      body.innerHTML=(q.choices||[]).map((c,i)=>`<button class="choice" data-choice="${i}">${esc(c)}</button>`).join('');
      body.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.choice);finish(q,i===Number(q.answer),startedAt,null,`Best answer: ${q.choices[i===Number(q.answer)?q.answer:i]}. ${q.why}`)});
    }
  }
  async function run(){const b=bload();b.visits=(Number(b.visits)||0)+1;bsave(b);const q=await server()||localPick();render(q)}
  function install(){let n=0;const t=setInterval(()=>{n++;if(typeof window.train==='function'&&!window.__unidojoBrainInstalled){window.__unidojoBrainInstalled=true;const original=window.train;window.train=function(){original.apply(this,arguments);setTimeout(run,180)};clearInterval(t)}if(n>120)clearInterval(t)},100)}
  install();window.UnidojoBrain={run};
})();
