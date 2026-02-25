/* ── LOADER ── */
window.addEventListener('load',()=>setTimeout(()=>document.getElementById('loader').classList.add('out'),700));

/* ── SCROLL ── */
window.addEventListener('scroll',()=>{
  document.getElementById('nav').classList.toggle('scrolled',scrollY>30);
  document.getElementById('scrollTop').classList.toggle('show',scrollY>500);
});
function goTo(id){document.getElementById(id).scrollIntoView({behavior:'smooth'})}

/* ── MENU ── */
function toggleMenu(){
  document.getElementById('burger').classList.toggle('open');
  document.getElementById('mobileMenu').classList.toggle('open');
  document.body.style.overflow=document.getElementById('mobileMenu').classList.contains('open')?'hidden':'';
}
function closeMenu(){
  document.getElementById('burger').classList.remove('open');
  document.getElementById('mobileMenu').classList.remove('open');
  document.body.style.overflow='';
}

/* ── CALENDAR ── */
let calNow=new Date();
const bookedDays=[5,12,18,24];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
function renderCal(){
  const y=calNow.getFullYear(),m=calNow.getMonth();
  document.getElementById('calLabel').textContent=`${MONTHS[m]} ${y}`;
  const grid=document.getElementById('calGrid');
  grid.innerHTML='';
  const firstDay=new Date(y,m,1).getDay();
  const days=new Date(y,m+1,0).getDate();
  const today=new Date();
  for(let i=0;i<firstDay;i++){const c=document.createElement('div');c.className='cd empty';grid.appendChild(c)}
  for(let d=1;d<=days;d++){
    const c=document.createElement('div');c.className='cd';c.textContent=d;
    const dt=new Date(y,m,d);
    const isPast=dt<new Date(today.getFullYear(),today.getMonth(),today.getDate());
    const isBooked=bookedDays.includes(d)&&m===today.getMonth();
    if(isPast) c.classList.add('past');
    else if(isBooked) c.classList.add('booked');
    else{
      c.classList.add('avail');
      c.onclick=()=>{
        grid.querySelectorAll('.cd').forEach(x=>x.classList.remove('selected'));
        c.classList.add('selected');
        const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        document.getElementById('bkStart').value=ds;
        goTo('booking');
      };
    }
    if(d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear()) c.classList.add('today');
    grid.appendChild(c);
  }
}
function shiftMonth(d){calNow.setMonth(calNow.getMonth()+d);renderCal()}
renderCal();

/* ── ESTIMATE ── */
function calcEst(){
  const rate=parseFloat(document.getElementById('bkSvc').value)||0;
  const extra=parseFloat(document.getElementById('bkKids').value)||0;
  const st=document.getElementById('bkST').value;
  const et=document.getElementById('bkET').value;
  const el=document.getElementById('bkTotal');
  if(rate===0){el.textContent='Let\'s chat';return}
  if(rate>=400){el.textContent=`R${rate.toLocaleString()}`;return}
  if(st&&et){
    const [sh,sm]=st.split(':').map(Number);
    const [eh,em]=et.split(':').map(Number);
    const hrs=((eh*60+em)-(sh*60+sm))/60;
    if(hrs>0){el.textContent=`R${((rate+extra)*hrs).toFixed(2)}`;return}
  }
  el.textContent='R—';
}

/* ── BOOKING ── */
const RACHELLE_WA='27603634053';
const RACHELLE_EMAIL='kalonjilubo12@gmail.com';

async function sendBooking(method){
  const name=document.getElementById('bkName').value;
  const role=document.getElementById('bkRole').value;
  const wa=document.getElementById('bkWa').value;
  const email=document.getElementById('bkEmail').value;
  const svc=document.getElementById('bkSvc').options[document.getElementById('bkSvc').selectedIndex].text;
  const kids=document.getElementById('bkKids').options[document.getElementById('bkKids').selectedIndex].text;
  const start=document.getElementById('bkStart').value;
  const end=document.getElementById('bkEnd').value;
  const st=document.getElementById('bkST').value;
  const et=document.getElementById('bkET').value;
  const notes=document.getElementById('bkNotes').value;
  const addr=document.getElementById('bkAddr').value;
  const total=document.getElementById('bkTotal').textContent;
  if(!name||!wa||!email){alert('Please enter your name, WhatsApp and email.');return}
  if(!start){alert('Please pick a start date.');return}

  /* POST to backend */
  try{
    await fetch('http://localhost:5000/api/bookings',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('nt')||''}`},
      body:JSON.stringify({name,role,whatsapp:wa,email,service:svc,children:kids,startDate:start,endDate:end,startTime:st,endTime:et,notes,address:addr,total})
    });
  }catch{}

  const wamsg=encodeURIComponent(`🍼 *BABYSITTING REQUEST*\n\n👤 *Name:* ${name} (${role})\n📋 *Service:* ${svc}\n👶 *Children:* ${kids}\n📅 *Date:* ${start}${end?' → '+end:''}\n⏰ *Time:* ${st||'TBD'} – ${et||'TBD'}\n📍 *Address:* ${addr||'TBC'}\n💰 *Est:* ${total}\n📝 *Notes:* ${notes||'None'}\n\nPlease confirm, thank you Nomsa! 😊`);
  const sub=encodeURIComponent('Babysitting Booking Request');
  const body=encodeURIComponent(`Hi Nomsa,\n\nI'd like to book your babysitting services.\n\nName: ${name} (${role})\nService: ${svc}\nChildren: ${kids}\nDate: ${start}${end?' to '+end:''}\nTime: ${st||'TBD'} – ${et||'TBD'}\nAddress: ${addr||'TBC'}\nEst: ${total}\nNotes: ${notes||'None'}\n\nThank you!\n${name}\n${wa}`);

  if(method==='wa'||method==='both') window.open(`https://wa.me/${NOMSA_WA}?text=${wamsg}`,'_blank');
  if(method==='gmail'||method==='both') setTimeout(()=>window.open(`https://mail.google.com/mail/?view=cm&to=${NOMSA_EMAIL}&su=${sub}&body=${body}`,'_blank'),method==='both'?600:0);

  const s=document.getElementById('bkSucc');
  s.style.display='flex';s.scrollIntoView({behavior:'smooth',block:'center'});
  setTimeout(()=>s.style.display='none',8000);
}

/* ── QUICK CONTACT ── */
function sendQuick(){
  const name=document.getElementById('ctName').value||'Someone';
  const contact=document.getElementById('ctContact').value;
  const msg=document.getElementById('ctMsg').value||'Hi Nomsa, I saw your website!';
  window.open(`https://wa.me/${NOMSA_WA}?text=${encodeURIComponent(`Hi Nomsa! I'm ${name}${contact?' ('+contact+')':''}.\n\n${msg}`)}`,'_blank');
}

/* ── AUTH ── */
function openAuth(tab){document.getElementById('authModal').classList.add('active');document.body.style.overflow='hidden';authTab(tab)}
function closeModal(){document.getElementById('authModal').classList.remove('active');document.body.style.overflow=''}
document.getElementById('authModal').addEventListener('click',e=>{if(e.target===document.getElementById('authModal'))closeModal()});
function authTab(t){
  const isL=t==='login';
  document.getElementById('afLogin').classList.toggle('on',isL);
  document.getElementById('afSignup').classList.toggle('on',!isL);
  document.getElementById('t1').classList.toggle('on',isL);
  document.getElementById('t2').classList.toggle('on',!isL);
  document.getElementById('authH').textContent=isL?'Welcome Back':'Create Account';
  document.getElementById('authD').textContent=isL?'Sign in to manage your bookings':'Register to track your bookings with Nomsa';
}
async function doLogin(){
  const email=document.getElementById('lMail').value,pw=document.getElementById('lPw').value;
  if(!email||!pw){alert('Please fill in email and password');return}
  try{
    const r=await fetch('http://localhost:5000/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})});
    const d=await r.json();
    if(r.ok){localStorage.setItem('nt',d.token);flashOk('loginOk')}
    else alert(d.message||'Login failed');
  }catch{flashOk('loginOk')}
}
async function doSignup(){
  const f=document.getElementById('sF').value,l=document.getElementById('sL').value;
  const email=document.getElementById('sMail').value,wa=document.getElementById('sWa').value;
  const role=document.getElementById('sRole').value;
  const pw=document.getElementById('sPw').value,pwc=document.getElementById('sPwC').value;
  if(!f||!l||!email||!pw){alert('Please fill all fields');return}
  if(pw!==pwc){alert('Passwords do not match');return}
  try{
    const r=await fetch('http://localhost:5000/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:f,lastName:l,email,phone:wa,role,password:pw})});
    const d=await r.json();
    if(r.ok){localStorage.setItem('nt',d.token);flashOk('signupOk')}
    else alert(d.message||'Registration failed');
  }catch{flashOk('signupOk')}
}
function socialAuth(p){window.location.href=`http://localhost:5000/api/auth/${p}`}
function flashOk(id){
  const el=document.getElementById(id);el.style.display='block';
  setTimeout(()=>{el.style.display='none';closeModal()},2200);
}

/* ── SET DATE MIN ── */
const todayStr=new Date().toISOString().split('T')[0];
document.getElementById('bkStart').min=todayStr;
document.getElementById('bkEnd').min=todayStr;

/* ================================================================
   CHATBOT ENGINE
   ================================================================ */
let chatOpen=false;
let chatState='start';
let chatHistory=[];
let userName='';

const BOT_DELAY=800;

const QR={
  start:['💰 Prices','📅 Book a date','⏰ Availability','👩🏾 About Rachelle','📞 Contact'],
  after_price:['📅 Book now','⏰ Availability','📞 Contact','🔙 Main menu'],
  after_book:['💬 WhatsApp Rachelle','📧 Email Rachelle','🔙 Main menu'],
  after_avail:['📅 Book now','💬 WhatsApp Rachelle','🔙 Main menu'],
  contact:['💬 Open WhatsApp','📧 Open Gmail','🔙 Main menu'],
  default:['💰 Prices','📅 Book a date','📞 Contact','🔙 Main menu']
};

const RESPONSES={
  '💰 Prices':{
    text:`Here's what I charge:\n\n👶 Baby care — **R80/hr**\n🧸 Toddler care — **R75/hr**\n🎒 After-school — **R70/hr**\n🌙 Overnight — **R400/night**\n☀️ Full day — **R500/day**\n🗓️ Regular weekly — *let's chat!*\n\n💡 Extra child? Add R15/hr for 2, R30/hr for 3 kids.`,
    next:'after_price'
  },
  '📅 Book a date':{
    text:`Great! The easiest way to book is to:\n1️⃣ Scroll up and fill in the **booking form**\n2️⃣ Or WhatsApp me directly\n\nI'll confirm your date within the hour 🙏`,
    next:'after_book',
    action:'scroll_booking'
  },
  '⏰ Availability':{
    text:`I'm generally available:\n\n☀️ **Weekdays** — 7am to 6pm\n🌆 **Evenings** — Mon–Thu, 6–10pm\n🎉 **Weekends** — all day\n🌙 **Overnight** — ask me first\n📅 **Public holidays** — available (small surcharge)\n\nBooked days are shown in the calendar above 📆`,
    next:'after_avail',
    action:'scroll_avail'
  },
  '👩🏾 About Rachelle':{
    text:`Hi! I'm Rachelle 👋🏾\n\nI've been babysitting for **6+ years** — started looking after my siblings and it just grew from there. I'm not an agency, just someone who genuinely loves kids.\n\nI'm reliable, patient and I'll always keep you updated with messages and photos while I'm with your little one 📸`,
    next:'default'
  },
  '📞 Contact':{
    text:`You can reach me here:\n\n💬 **WhatsApp:** +27 71 234 5678\n📧 **Email:** nomsa.babysitter@gmail.com\n\nWhatsApp is fastest — I usually reply within a few minutes!`,
    next:'contact'
  },
  '💬 Open WhatsApp':{text:'Opening WhatsApp now...',next:'default',action:'open_wa'},
  '📧 Open Gmail':{text:'Opening Gmail now...',next:'default',action:'open_gmail'},
  '💬 WhatsApp Rachelle':{text:'Opening WhatsApp for you! 📱',next:'default',action:'open_wa'},
  '📧 Email Rachelle':{text:'Opening Gmail for you! 📧',next:'default',action:'open_gmail'},
  '🔙 Main menu':{text:'Back to the main menu! How can I help?',next:'start'},
};

const WELCOME=`Hi there! 👋🏾 I'm Rachelle's little helper bot.\n\nI can answer questions about my services, availability, and prices — or connect you with Rachelle directly on WhatsApp.\n\nWhat would you like to know?`;

function toggleChat(){
  chatOpen=!chatOpen;
  document.getElementById('chatWindow').classList.toggle('open',chatOpen);
  document.getElementById('chatBadge').style.display='none';
  if(chatOpen&&chatHistory.length===0) setTimeout(()=>botSay(WELCOME,'start'),400);
}

function openWhatsApp(){window.open(`https://wa.me/${NOMSA_WA}?text=${encodeURIComponent('Hi Rachelle! I chatted with your website bot and I have a question about babysitting.')}`,'_blank')}

function botSay(text,nextState){
  const body=document.getElementById('chatBody');
  chatState=nextState||'default';
  const msg=document.createElement('div');
  msg.className='msg msg-bot';
  // convert **bold** and \n
  const html=text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  msg.innerHTML=`<div class="bubble">${html}</div><div class="msg-time">${getTime()}</div>`;
  body.appendChild(msg);
  body.scrollTop=body.scrollHeight;
  showQR(QR[chatState]||QR.default);
}

function userSay(text){
  const body=document.getElementById('chatBody');
  const msg=document.createElement('div');
  msg.className='msg msg-user';
  msg.innerHTML=`<div class="bubble">${text}</div><div class="msg-time">${getTime()}</div>`;
  body.appendChild(msg);
  body.scrollTop=body.scrollHeight;
  clearQR();
}

function showQR(items){
  const qr=document.getElementById('quickReplies');
  qr.innerHTML='';
  if(!items)return;
  items.forEach(t=>{
    const b=document.createElement('button');
    b.className='qr-btn';b.textContent=t;
    b.onclick=()=>handleReply(t);
    qr.appendChild(b);
  });
}
function clearQR(){document.getElementById('quickReplies').innerHTML=''}

function handleReply(text){
  userSay(text);
  const resp=RESPONSES[text];
  setTimeout(()=>{
    if(resp){
      botSay(resp.text,resp.next);
      if(resp.action) doAction(resp.action);
    } else {
      handleFreeText(text);
    }
  },BOT_DELAY);
}

function doAction(action){
  if(action==='open_wa') setTimeout(openWhatsApp,600);
  if(action==='open_gmail') setTimeout(()=>window.open(`https://mail.google.com/mail/?view=cm&to=${RACHELLE_EMAIL}`,'_blank'),600);
  if(action==='scroll_booking') setTimeout(()=>goTo('booking'),800);
  if(action==='scroll_avail') setTimeout(()=>goTo('availability'),800);
}

function sendUserMsg(){
  const inp=document.getElementById('chatInput');
  const text=inp.value.trim();
  if(!text)return;
  inp.value='';
  userSay(text);
  setTimeout(()=>handleFreeText(text),BOT_DELAY);
}

function handleFreeText(text){
  const t=text.toLowerCase();
  if(t.match(/price|cost|rate|charge|how much|rand|r[0-9]/)){
    botSay(RESPONSES['💰 Prices'].text,'after_price');
  } else if(t.match(/book|appoint|schedul|reserv|slot/)){
    botSay(RESPONSES['📅 Book a date'].text,'after_book');
    goTo('booking');
  } else if(t.match(/avail|when|free|open|schedul|day|time|hour/)){
    botSay(RESPONSES['⏰ Availability'].text,'after_avail');
  } else if(t.match(/who|about|Rachelle|experience|qualif|safe|trust/)){
    botSay(RESPONSES['👩🏾 About Rachelle'].text,'default');
  } else if(t.match(/whatsapp|wa|call|phone|contact|reach|number/)){
    botSay(RESPONSES['📞 Contact'].text,'contact');
  } else if(t.match(/overnight|night|stay/)){
    botSay('I do offer overnight babysitting! It\'s **R400 per night** — that covers dinner, bath time, bedtime and breakfast. 🌙\n\nJust WhatsApp me to check the specific date.',  'after_book');
  } else if(t.match(/infant|baby|newborn|0|1 month|month old/)){
    botSay('Yes, I work with newborns and babies! 👶 I charge **R80/hr** for infant care and I follow your routine exactly — feeding, nappy changes, nap times, everything.',  'after_price');
  } else if(t.match(/toddler|2 year|3 year|1 year/)){
    botSay('Toddlers are my favourite! 🧸 I charge **R75/hr** for toddler care — we do lots of play, simple activities, meals and nap time.', 'after_price');
  } else if(t.match(/hi|hello|hey|good morning|good day|howzit/)){
    botSay(`Hi! 👋🏾 So lovely to hear from you! How can I help? I can tell you about my services, prices, availability — or connect you with Rachelle directly.`,'start');
  } else {
    botSay(`I'm not sure I understand that one, but Nomsa will! 😊\n\nThe quickest way to get an answer is to WhatsApp her directly — she usually replies within a few minutes.`,'contact');
    document.getElementById('waRedirect').style.display='block';
  }
}

function getTime(){
  return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
}

