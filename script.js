const DATA={nato:[['A','Alpha'],['B','Bravo'],['C','Charlie'],['D','Delta'],['E','Echo'],['F','Foxtrot'],['G','Golf'],['H','Hotel'],['I','India'],['J','Juliett'],['K','Kilo'],['L','Lima'],['M','Mike'],['N','November'],['O','Oscar'],['P','Papa'],['Q','Quebec'],['R','Romeo'],['S','Sierra'],['T','Tango'],['U','Uniform'],['V','Victor'],['W','Whiskey'],['X','X-ray'],['Y','Yankee'],['Z','Zulu']],deutsch:[['A','Aachen'],['Ä','Umlaut Aachen'],['B','Berlin'],['C','Chemnitz'],['D','Düsseldorf'],['E','Essen'],['F','Frankfurt'],['G','Goslar'],['H','Hamburg'],['I','Ingelheim'],['J','Jena'],['K','Köln'],['L','Leipzig'],['M','München'],['N','Nürnberg'],['O','Offenbach'],['Ö','Umlaut Offenbach'],['P','Potsdam'],['Q','Quickborn'],['R','Rostock'],['S','Salzwedel'],['ß','Eszett'],['T','Tübingen'],['U','Unna'],['Ü','Umlaut Unna'],['V','Völklingen'],['W','Wuppertal'],['X','Xanten'],['Y','Ypsilon'],['Z','Zwickau']]};

const KEY='funkalphabet-trainer-v3';

let S={
 training:{
  mode:'nato',
  source:'all',
  direction:'letter',
  index:0,
  score:0,
  correct:0,
  attempts:0,
  solved:[],
  errors:{}
 },
 stats:{
  natoAttempts:0,
  natoCorrect:0,
  deutschAttempts:0,
  deutschCorrect:0,
  exams:0,
  history:[]
 }
},
learnMode='nato',
learnIndex=0,
exam={
 mode:'nato',
 count:20,
 order:'random',
 direction:'letter'
},
questions=[],
qi=0,
qcorrect=0,
qerrors=[],
qstart=0,
timer;

const $=x=>document.getElementById(x);

const norm=x=>String(x||'')
 .normalize('NFC')
 .trim()
 .toLocaleLowerCase('de-DE')
 .replace(/\s+/g,' ');

function load(){
 try{
  let x=JSON.parse(localStorage.getItem(KEY));
  if(x){
   S={
    ...S,
    ...x,
    training:{...S.training,...x.training},
    stats:{...S.stats,...x.stats}
   }
  }
 }catch(e){}
}

function save(){
 localStorage.setItem(KEY,JSON.stringify(S));
}

function page(p){
 document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));

 const pageId=p==='stats'?'statsPage':p;
 const target=$(pageId);

 if(!target)return;

 target.classList.add('active');

 document.querySelectorAll('.nav').forEach(x=>{
  x.classList.toggle('active',x.dataset.page===p);
 });

 if(p==='learn')renderLearn();
 if(p==='training')renderTrain();
 if(p==='stats')renderStats();
 if(p==='exam')summary();
}

function speak(w){
 if(!speechSynthesis)return;

 speechSynthesis.cancel();

 let u=new SpeechSynthesisUtterance(w);
 u.lang='de-DE';
 u.rate=.82;

 speechSynthesis.speak(u);
}

function renderLearn(){
 let a=DATA[learnMode];
 let x=a[learnIndex];

 $('learnCount').textContent=`${learnIndex+1} / ${a.length}`;
 $('learnLetter').textContent=x[0];
 $('learnWord').textContent=x[1];

 document.querySelectorAll('[data-learn]').forEach(b=>{
  b.classList.toggle('active',b.dataset.learn===learnMode);
 });

 $('learnGrid').innerHTML=a.map((x,i)=>`
  <button class="${i===learnIndex?'current':''}" data-li="${i}">
   <b>${x[0]}</b>
   <small>${x[1]}</small>
  </button>
 `).join('');

 document.querySelectorAll('[data-li]').forEach(b=>{
  b.onclick=()=>{
   learnIndex=+b.dataset.li;
   renderLearn();
  };
 });
}

function pool(){
 let a=DATA[S.training.mode];

 if(S.training.source==='errors'){
  let p=a.filter(x=>S.training.errors[x[0]]);
  return p.length?p:a;
 }

 return a;
}

function renderTrain(){
 let a=pool();

 if(S.training.index>=a.length)
  S.training.index=0;

 let x=a[S.training.index];
 let rev=S.training.direction==='word';

 $('prompt').textContent=rev?x[1]:x[0];

 $('trainLabel').textContent=
  rev?'FUNKWORT EINGEGANGEN':'FUNKSPRUCH EINGEGANGEN';

 $('question').textContent=
  rev?'Welcher Buchstabe gehört dazu?':'Wie lautet das Funkwort?';

 $('answer').placeholder=
  rev?'Buchstabe eingeben …':'Funkwort eingeben …';

 $('answer').value='';

 $('trainFeedback').className='feedback';

 $('trainButton').textContent='PRÜFEN';

 S.training.answered=false;

 $('trainMode').textContent=
  S.training.mode==='nato'
   ?'NATO-ALPHABET'
   :'DEUTSCHE BUCHSTABIERTAFEL';

 document.querySelectorAll('[data-train]').forEach(b=>{
  b.classList.toggle('active',b.dataset.train===S.training.mode);
 });

 document.querySelectorAll('[data-source]').forEach(b=>{
  b.classList.toggle('active',b.dataset.source===S.training.source);
 });

 $('direction').textContent=
  rev
   ?'Richtung: Funkwort → Buchstabe'
   :'Richtung: Buchstabe → Funkwort';

 $('errorBadge').textContent=
  Object.keys(S.training.errors).length;

 statsTrain();
 gridTrain();

 setTimeout(()=>$('answer').focus(),20);
}

function fb(el,msg,ok){
 el.textContent=msg;
 el.className='feedback '+(ok?'correct':'wrong');
}

function answerTrain(e){
 e.preventDefault();

 /*
  WICHTIG:
  Wenn bereits geantwortet wurde, geht der Trainer
  beim nächsten Klick/Enter immer weiter.
 */
 if(S.training.answered){
  S.training.index=
   (S.training.index+1)%pool().length;

  renderTrain();
  return;
 }

 let x=pool()[S.training.index];

 let rev=S.training.direction==='word';

 let got=norm($('answer').value);

 let expected=
  rev
   ?x[0]
   :x[1];

 if(!got){
  fb(
   $('trainFeedback'),
   'Bitte gib eine Antwort ein.',
   false
  );
  return;
 }

 S.training.attempts++;

 S.stats[S.training.mode+'Attempts']++;

 if(got===norm(expected)){

  S.training.correct++;
  S.training.score+=10;

  S.stats[S.training.mode+'Correct']++;

  if(!S.training.solved.includes(x[0]))
   S.training.solved.push(x[0]);

  fb(
   $('trainFeedback'),
   `✓ Richtig! ${x[0]} = ${x[1]}`,
   true
  );

 }else{

  S.training.score=
   Math.max(0,S.training.score-2);

  S.training.errors[x[0]]=
   (S.training.errors[x[0]]||0)+1;

  fb(
   $('trainFeedback'),
   `✗ Falsch. Richtig wäre: ${expected}`,
   false
  );
 }

 /*
  Nach einer Antwort wird der Button zu "NÄCHSTER BUCHSTABE".
  Dadurch kann man auch nach einer falschen Antwort weitermachen.
 */
 S.training.answered=true;

 $('trainButton').textContent=
  'NÄCHSTER BUCHSTABE';

 save();
 statsTrain();
 gridTrain();
}

function statsTrain(){
 let a=S.training.attempts;
 let c=S.training.correct;
 let total=DATA[S.training.mode].length;

 $('score').textContent=S.training.score;
 $('correct').textContent=c;
 $('attempts').textContent=a;

 $('accuracy').textContent=
  a?Math.round(c/a*100)+'%':'0%';

 $('progressText').textContent=
  `${S.training.solved.length} / ${total}`;

 $('progress').style.width=
  Math.min(
   100,
   S.training.solved.length/total*100
  )+'%';
}

function gridTrain(){

 $('alphabetGrid').innerHTML=
  DATA[S.training.mode].map((x,i)=>`
   <button
    class="${S.training.solved.includes(x[0])?'done':''}"
    data-ti="${i}">
    <b>${x[0]}</b>
    <small>${x[1]}</small>
   </button>
  `).join('');

 document.querySelectorAll('[data-ti]').forEach(b=>{
  b.onclick=()=>{
   S.training.source='all';
   S.training.index=+b.dataset.ti;
   S.training.answered=false;
   renderTrain();
  };
 });
}

function summary(){

 let n=
  exam.count==='all'
   ?DATA[exam.mode].length
   :exam.count;

 $('examSummary').textContent=
  `${n} Fragen · ${
   exam.mode==='nato'?'NATO':'Deutsch'
  } · ${
   exam.order==='random'
    ?'Zufällig'
    :'Alphabetisch'
  }`;
}

function readExam(){

 exam.mode=
  document.querySelector('[name=examMode]:checked').value;

 exam.order=
  document.querySelector('[name=examOrder]:checked').value;

 exam.direction=
  document.querySelector('[name=examDir]:checked').value;

 let c=parseInt($('customCount').value);

 if(c>0){
  exam.count=Math.min(30,c);
 }else{
  let b=document.querySelector('.num.active');

  exam.count=
   b.dataset.all
    ?'all'
    :+b.textContent;
 }

 summary();
}

function startExam(){

 readExam();

 let a=[...DATA[exam.mode]];

 if(exam.order==='random')
  a.sort(()=>Math.random()-.5);

 questions=
  a.slice(
   0,
   exam.count==='all'
    ?a.length
    :exam.count
  );

 qi=0;
 qcorrect=0;
 qerrors=[];
 qstart=Date.now();

 $('examSetup').classList.add('hidden');
 $('examResult').classList.add('hidden');
 $('examRun').classList.remove('hidden');

 clearInterval(timer);

 timer=setInterval(()=>{
  $('timer').textContent=
   time(Math.floor((Date.now()-qstart)/1000));
 },500);

 showQ();
}

function showQ(){

 let x=questions[qi];
 let rev=exam.direction==='word';

 $('examNum').textContent=
  `FRAGE ${String(qi+1).padStart(2,'0')} / ${questions.length}`;

 $('examBar').style.width=
  qi/questions.length*100+'%';

 $('examDir').textContent=
  rev
   ?'FUNKWORT → BUCHSTABE'
   :'BUCHSTABE → FUNKWORT';

 $('examPrompt').textContent=
  rev?x[1]:x[0];

 $('examQuestion').textContent=
  rev
   ?'Welcher Buchstabe gehört dazu?'
   :'Wie lautet das passende Funkwort?';

 $('examAnswer').value='';

 $('examFeedback').className='feedback';

 setTimeout(()=>$('examAnswer').focus(),20);
}

function answerExam(e){

 e.preventDefault();

 let x=questions[qi];

 let rev=exam.direction==='word';

 let got=norm($('examAnswer').value);

 let expected=
  rev
   ?x[0]
   :x[1];

 if(!got){
  fb(
   $('examFeedback'),
   'Bitte gib eine Antwort ein.',
   false
  );
  return;
 }

 if(got===norm(expected)){
  qcorrect++;

  fb(
   $('examFeedback'),
   '✓ Richtig!',
   true
  );
 }else{

  qerrors.push(x);

  fb(
   $('examFeedback'),
   `✗ Falsch. Richtig: ${expected}`,
   false
  );
 }

 setTimeout(()=>{
  qi++;

  if(qi>=questions.length)
   finishExam();
  else
   showQ();

 },300);
}

function finishExam(){

 clearInterval(timer);

 let sec=
  Math.floor(
   (Date.now()-qstart)/1000
  );

 let pct=
  Math.round(
   qcorrect/questions.length*100
  );

 S.stats.exams++;

 S.stats.history.unshift({
  date:new Date().toLocaleDateString('de-DE'),
  mode:exam.mode==='nato'?'NATO':'Deutsch',
  score:qcorrect,
  total:questions.length,
  pct,
  time:time(sec)
 });

 S.stats.history=
  S.stats.history.slice(0,10);

 qerrors.forEach(x=>{
  S.training.errors[x[0]]=
   (S.training.errors[x[0]]||0)+1;
 });

 save();

 $('examRun').classList.add('hidden');
 $('examResult').classList.remove('hidden');

 $('resultScore').textContent=
  `${qcorrect} / ${questions.length}`;

 $('resultPercent').textContent=
  pct+'%';

 $('resultTime').textContent=
  'Zeit: '+time(sec);

 $('resultBar').style.width=
  pct+'%';

 $('resultErrors').innerHTML=
  qerrors.length
   ?qerrors.map(x=>`
     <span class="error-item">
      ${x[0]} = ${x[1]}
     </span>
    `).join('')
   :'<span style="color:var(--g)">✓ Keine Fehler</span>';

 $('resultMessage').textContent=
  pct===100
   ?'Perfekt. Alle Fragen richtig!'
   :pct>=90
    ?'Sehr starke Leistung.'
    :pct>=75
     ?'Gute Leistung. Weiter üben bringt noch mehr Sicherheit.'
     :'Weiter üben und erneut versuchen.';
}

function resetExam(){

 clearInterval(timer);

 $('examRun').classList.add('hidden');
 $('examResult').classList.add('hidden');
 $('examSetup').classList.remove('hidden');

 summary();
}

function time(s){

 return String(
  Math.floor(s/60)
 ).padStart(2,'0')
 +':'+
 String(
  s%60
 ).padStart(2,'0');
}

function renderStats(){

 let s=S.stats;

 let a=
  s.natoAttempts+
  s.deutschAttempts;

 let c=
  s.natoCorrect+
  s.deutschCorrect;

 $('stAttempts').textContent=a;

 $('stCorrect').textContent=c;

 $('stAccuracy').textContent=
  a
   ?Math.round(c/a*100)+'%'
   :'0%';

 $('stExams').textContent=s.exams;

 let n=
  s.natoAttempts
   ?Math.round(
     s.natoCorrect/
     s.natoAttempts*
     100
    )
   :0;

 let d=
  s.deutschAttempts
   ?Math.round(
     s.deutschCorrect/
     s.deutschAttempts*
     100
    )
   :0;

 $('natoPct').textContent=n+'%';

 $('dePct').textContent=d+'%';

 $('natoBar').style.width=n+'%';

 $('deBar').style.width=d+'%';

 $('history').innerHTML=
  s.history.length
   ?s.history.map(x=>`
     <p>
      ${x.date} · ${x.mode} · ${x.time}
      <b style="float:right">
       ${x.score}/${x.total} (${x.pct}%)
      </b>
     </p>
    `).join('')
   :'Noch keine Prüfungen absolviert.';

 let e=
  Object.keys(S.training.errors);

 $('errors').innerHTML=
  e.length
   ?e.map(k=>`
     <div class="error-item">
      <b>${k}</b>
      <small>
       ${
        [...DATA.nato,...DATA.deutsch]
         .find(x=>x[0]===k)?.[1]||''
       }
      </small>
      <small>
       ${S.training.errors[k]} Fehler
      </small>
     </div>
    `).join('')
   :'<span style="color:var(--muted)">Noch keine Fehler gespeichert.</span>';
}

function bind(){

 document.querySelectorAll('.nav').forEach(b=>{
  b.onclick=()=>{
   page(b.dataset.page);
  };
 });

 document.querySelectorAll('[data-go]').forEach(b=>{
  b.onclick=()=>{
   page(b.dataset.go);
  };
 });

 document.querySelectorAll('[data-learn]').forEach(b=>{
  b.onclick=()=>{
   learnMode=b.dataset.learn;
   learnIndex=0;
   renderLearn();
  };
 });

 $('learnPrev').onclick=()=>{
  learnIndex=
   (learnIndex-1+DATA[learnMode].length)
   %DATA[learnMode].length;

  renderLearn();
 };

 $('learnNext').onclick=()=>{
  learnIndex=
   (learnIndex+1)
   %DATA[learnMode].length;

  renderLearn();
 };

 $('learnSpeak').onclick=()=>{
  speak(
   DATA[learnMode][learnIndex][1]
  );
 };

 document.querySelectorAll('[data-train]').forEach(b=>{
  b.onclick=()=>{
   S.training.mode=b.dataset.train;
   S.training.index=0;
   S.training.source='all';
   S.training.answered=false;

   save();
   renderTrain();
  };
 });

 document.querySelectorAll('[data-source]').forEach(b=>{
  b.onclick=()=>{
   S.training.source=b.dataset.source;
   S.training.index=0;
   S.training.answered=false;

   renderTrain();
  };
 });

 $('direction').onclick=()=>{
  S.training.direction=
   S.training.direction==='letter'
    ?'word'
    :'letter';

  S.training.index=0;
  S.training.answered=false;

  save();
  renderTrain();
 };

 $('trainForm').onsubmit=answerTrain;

 $('resetTraining').onclick=()=>{
  S.training.score=0;
  S.training.correct=0;
  S.training.attempts=0;
  S.training.solved=[];
  S.training.errors={};
  S.training.index=0;

  save();
  renderTrain();
 };

 document
  .querySelectorAll(
   '[name=examMode],[name=examOrder],[name=examDir]'
  )
  .forEach(x=>{
   x.onchange=readExam;
  });

 document.querySelectorAll('.num').forEach(b=>{
  b.onclick=()=>{
   document.querySelectorAll('.num')
    .forEach(x=>x.classList.remove('active'));

   b.classList.add('active');

   $('customCount').value='';

   summary();
  };
 });

 $('customCount').oninput=()=>{
  document.querySelectorAll('.num')
   .forEach(x=>x.classList.remove('active'));

  summary();
 };

 $('startExam').onclick=startExam;

 $('examForm').onsubmit=answerExam;

 $('retry').onclick=resetExam;

 $('errorTraining').onclick=()=>{
  S.training.mode=exam.mode;
  S.training.source='errors';
  S.training.index=0;

  save();

  page('training');
 };

 $('clearStats').onclick=()=>{
  if(confirm('Alle Statistiken und Fehler löschen?')){

   S.stats={
    natoAttempts:0,
    natoCorrect:0,
    deutschAttempts:0,
    deutschCorrect:0,
    exams:0,
    history:[]
   };

   S.training.score=0;
   S.training.correct=0;
   S.training.attempts=0;
   S.training.solved=[];
   S.training.errors={};

   save();

   renderStats();
   renderTrain();
  }
 };
}

load();

bind();

renderLearn();

renderTrain();

renderStats();

summary();
