const state = { config:null, catalog:{plans:[],courses:[]}, me:null, csrf:'', pendingCheckout:null, paypalSdk:null, adminTab:'dashboard' };
const $ = (s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const e = (v='') => String(v).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmtMoney=(n,c='USD')=>new Intl.NumberFormat('es-AR',{style:'currency',currency:c,maximumFractionDigits:0}).format(Number(n||0));
const fmtDate=(d)=>d?new Intl.DateTimeFormat('es-AR',{dateStyle:'medium'}).format(new Date(d)):'—';
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3300)}
async function api(url,opts={}){const o={credentials:'same-origin',...opts,headers:{...(opts.headers||{})}};if(o.body&&!(o.body instanceof FormData)&&typeof o.body!=='string'){o.headers['Content-Type']='application/json';o.body=JSON.stringify(o.body)}if(o.method&&o.method!=='GET'&&o.method!=='HEAD')o.headers['x-csrf-token']=state.csrf;const r=await fetch(url,o);let data={};try{data=await r.json()}catch{}if(!r.ok)throw new Error(data.error||`Error ${r.status}`);return data}
async function bootstrap(){state.csrf=(await api('/api/csrf')).token;state.config=await api('/api/config');state.catalog=await api('/api/catalog');state.me=(await api('/api/me')).user?await api('/api/me'): {user:null};applyBrand();bindGlobal();renderRoute();}
function applyBrand(){const s=state.config.settings||{};$('#brand-name').textContent=s.brand_name||'CAMPUS';$('#footer-brand').textContent=s.brand_name||'CAMPUS';document.title=s.site_title||'Campus';$('#year').textContent=new Date().getFullYear();updateHeader()}
function updateHeader(){const u=state.me?.user;$('#campus-link').classList.toggle('hidden',!u);$('#admin-button').classList.toggle('hidden',u?.role!=='admin');$('#auth-button').textContent=u?`Salir · ${u.name.split(' ')[0]}`:'Ingresar'}
function bindGlobal(){
  $('#menu-button').onclick=()=>$('.nav').classList.toggle('open');
  $$('.nav a').forEach(a=>a.addEventListener('click',()=>$('.nav').classList.remove('open')));
  $('#auth-button').onclick=async()=>{if(state.me?.user){try{await api('/api/auth/logout',{method:'POST'});state.me={user:null};updateHeader();toast('Sesión cerrada');location.hash='#home'}catch(x){toast(x.message)}}else openAuth()};
  $('#admin-button').onclick=()=>location.hash='#admin/dashboard';
  $$('[data-close-dialog]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
  $$('[data-auth-tab]').forEach(b=>b.onclick=()=>switchAuthTab(b.dataset.authTab));
  $('#login-form').onsubmit=handleLogin;$('#register-form').onsubmit=handleRegister;
  $('#paypal-pay-button').onclick=()=>payCurrent(false);$('#demo-pay-button').onclick=()=>payCurrent(true);
  window.addEventListener('hashchange',renderRoute);
  document.addEventListener('click',ev=>{const b=ev.target.closest('[data-open-auth]');if(b)openAuth()});
}
function switchAuthTab(tab){$$('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===tab));$('#login-form').classList.toggle('hidden',tab!=='login');$('#register-form').classList.toggle('hidden',tab!=='register');$('#auth-message').textContent=''}
function openAuth(tab='login'){switchAuthTab(tab);$('#auth-dialog').showModal()}
async function refreshMe(){state.me=await api('/api/me');updateHeader()}
async function handleLogin(ev){ev.preventDefault();const fd=new FormData(ev.currentTarget);try{$('#auth-message').textContent='';await api('/api/auth/login',{method:'POST',body:{email:fd.get('email'),password:fd.get('password')}});await refreshMe();$('#auth-dialog').close();toast(state.me?.user?.role==='admin'?'Panel de administración listo':'Bienvenida al campus');if(state.pendingCheckout&&state.me?.user?.role!=='admin'){const p=state.pendingCheckout;state.pendingCheckout=null;renderRoute();setTimeout(()=>openCheckout(p.type,p.item),200);return}if(state.me?.user?.role==='admin'){state.pendingCheckout=null;location.hash='#admin/dashboard'}else{location.hash='#campus'}}catch(x){$('#auth-message').textContent=x.message}}
async function handleRegister(ev){ev.preventDefault();const fd=new FormData(ev.currentTarget);try{$('#auth-message').textContent='';await api('/api/auth/register',{method:'POST',body:{name:fd.get('name'),email:fd.get('email'),password:fd.get('password')}});await refreshMe();$('#auth-dialog').close();toast('Cuenta creada');location.hash='#campus';if(state.pendingCheckout){const p=state.pendingCheckout;state.pendingCheckout=null;setTimeout(()=>openCheckout(p.type,p.item),200)}}catch(x){$('#auth-message').textContent=x.message}}
