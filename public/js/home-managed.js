(async function(){
  const esc=(v='')=>String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const money=(n,c='EUR')=>new Intl.NumberFormat('es-ES',{style:'currency',currency:c,maximumFractionDigits:0}).format(Number(n||0));
  const css=document.createElement('link');css.rel='stylesheet';css.href='/home-managed.css';document.head.appendChild(css);
  const earlyTrigger=document.querySelector('.video-frame');if(earlyTrigger)earlyTrigger.addEventListener('click',ev=>ev.preventDefault());

  let data,csrf='',config=null,paypalSdk=null;
  try{const r=await fetch('/api/public/home',{credentials:'same-origin'});if(!r.ok)return;data=await r.json()}catch{return}
  const s=data.settings||{},programs=data.programs||[];

  const hero=document.querySelector('.hero');
  if(hero){const h=hero.querySelector('h1'),p=hero.querySelector('.hero-copy p'),img=hero.querySelector('.video-frame img');if(h&&s.hero_title)h.textContent=s.hero_title;if(p&&s.hero_text)p.textContent=s.hero_text;if(img&&s.video_poster)img.src=s.video_poster}

  const section=document.querySelector('.programs');
  if(section){
    const h=section.querySelector('.section-title h2'),p=section.querySelector('.section-title p'),grid=section.querySelector('.program-grid');
    if(h&&s.programs_title)h.textContent=s.programs_title;
    if(p&&s.programs_text)p.textContent=s.programs_text;
    if(grid)grid.innerHTML=programs.map(x=>`<article class="program-card ${x.style==='popular'?'popular':''} ${x.style==='club'?'club':''}">${x.badge&&x.style!=='popular'?`<span class="home-card-badge">${esc(x.badge)}</span>`:''}<h3>${esc(x.title)}</h3><p>${esc(x.description)}</p><div class="program-price">${esc(money(x.price,x.currency))}</div><button class="buy home-program-buy" type="button" data-home-program-buy="${Number(x.id)}">Comprar</button></article>`).join('')
  }
  document.querySelectorAll('[data-home-program-buy]').forEach(b=>b.addEventListener('click',()=>{const item=programs.find(x=>Number(x.id)===Number(b.dataset.homeProgramBuy));if(item)startPurchase(item)}));

  const trigger=document.querySelector('.video-frame');
  if(trigger)trigger.addEventListener('click',ev=>{ev.preventDefault();if(!s.video_url){showNotice('El video de presentación todavía no está cargado.');return}openVideo(s.video_url,s.hero_title||'Video de presentación')});

  function showNotice(msg){let n=document.getElementById('home-video-notice');if(!n){n=document.createElement('div');n.id='home-video-notice';n.className='home-video-notice';document.body.appendChild(n)}n.textContent=msg;n.classList.add('show');setTimeout(()=>n.classList.remove('show'),3600)}
  async function ensureCsrf(){if(csrf)return csrf;const r=await fetch('/api/csrf',{credentials:'same-origin'}),j=await r.json();if(!r.ok)throw new Error(j.error||'No se pudo iniciar la sesión segura.');csrf=j.token;return csrf}
  async function request(url,opts={}){const o={credentials:'same-origin',...opts,headers:{...(opts.headers||{})}};if(o.method&&o.method!=='GET'&&o.method!=='HEAD'){o.headers['x-csrf-token']=await ensureCsrf()}if(o.body&&!(o.body instanceof FormData)&&typeof o.body!=='string'){o.headers['Content-Type']='application/json';o.body=JSON.stringify(o.body)}const r=await fetch(url,o);let j={};try{j=await r.json()}catch{}if(!r.ok)throw new Error(j.error||`Error ${r.status}`);return j}
  async function currentUser(){try{return await request('/api/me')}catch{return{user:null}}}
  async function getConfig(){if(config)return config;config=await request('/api/config');return config}

  async function startPurchase(item){
    if(!Number(item.course_id)){showNotice('Este programa todavía no está vinculado a sus clases.');return}
    const me=await currentUser();
    if(!me.user){openAuthForPurchase(item);return}
    openCheckout(item)
  }

  function openAuthForPurchase(item){
    const dlg=document.createElement('dialog');dlg.className='home-purchase-dialog home-auth-dialog';
    dlg.innerHTML=`<button class="home-dialog-close" type="button" aria-label="Cerrar">×</button><div class="home-purchase-box"><p class="home-purchase-kicker">ANTES DE COMPRAR</p><h2>Creá tu acceso.</h2><p class="home-purchase-copy">Tu compra queda asociada a tu cuenta para que después entres directamente a tus clases. Al completar el programa vas a poder obtener tu certificado de finalización.</p><div class="home-auth-tabs"><button type="button" data-home-auth-tab="register" class="active">Crear cuenta</button><button type="button" data-home-auth-tab="login">Ya tengo cuenta</button></div><form data-home-auth-form="register"><label>Nombre y apellido<input name="name" autocomplete="name" minlength="4" required><small style="display:block;margin-top:6px;color:#666;line-height:1.4">Escribilos completos y como querés que aparezcan en tu certificado.</small></label><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Contraseña<input name="password" type="password" autocomplete="new-password" minlength="10" required></label><button type="submit" class="home-purchase-primary">Continuar</button></form><form data-home-auth-form="login" class="home-hidden"><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Contraseña<input name="password" type="password" autocomplete="current-password" required></label><button type="submit" class="home-purchase-primary">Ingresar y continuar</button></form><p class="home-purchase-message" aria-live="polite"></p></div>`;
    document.body.appendChild(dlg);
    const msg=dlg.querySelector('.home-purchase-message');
    dlg.querySelector('.home-dialog-close').onclick=()=>dlg.close();
    dlg.querySelectorAll('[data-home-auth-tab]').forEach(b=>b.onclick=()=>{const tab=b.dataset.homeAuthTab;dlg.querySelectorAll('[data-home-auth-tab]').forEach(x=>x.classList.toggle('active',x===b));dlg.querySelectorAll('[data-home-auth-form]').forEach(f=>f.classList.toggle('home-hidden',f.dataset.homeAuthForm!==tab));msg.textContent=''});
    dlg.querySelector('[data-home-auth-form="register"]').onsubmit=async ev=>{ev.preventDefault();const f=new FormData(ev.currentTarget);msg.textContent='Creando tu acceso…';try{await request('/api/auth/register',{method:'POST',body:{name:f.get('name'),email:f.get('email'),password:f.get('password')}});dlg.close();setTimeout(()=>openCheckout(item),80)}catch(x){msg.textContent=x.message}};
    dlg.querySelector('[data-home-auth-form="login"]').onsubmit=async ev=>{ev.preventDefault();const f=new FormData(ev.currentTarget);msg.textContent='Ingresando…';try{await request('/api/auth/login',{method:'POST',body:{email:f.get('email'),password:f.get('password')}});dlg.close();setTimeout(()=>openCheckout(item),80)}catch(x){msg.textContent=x.message}};
    dlg.addEventListener('close',()=>dlg.remove(),{once:true});dlg.showModal()
  }

  async function openCheckout(item){
    let cfg;try{cfg=await getConfig()}catch(x){showNotice(x.message);return}
    const dlg=document.createElement('dialog');dlg.className='home-purchase-dialog home-checkout-dialog';
    dlg.innerHTML=`<button class="home-dialog-close" type="button" aria-label="Cerrar">×</button><div class="home-purchase-box"><p class="home-purchase-kicker">CHECKOUT SEGURO</p><h2>${esc(item.title)}</h2><div class="home-checkout-row"><span>${esc(item.title)}</span><strong>${esc(money(item.price,item.currency))}</strong></div><p class="home-purchase-copy">Cuando el pago quede confirmado, entrás directamente a este programa con sus clases, videos y materiales.</p><button type="button" class="home-purchase-primary ${cfg.paypal?.enabled?'':'home-hidden'}" data-home-paypal>Pagar con PayPal</button><button type="button" class="home-purchase-secondary ${cfg.demoCheckout?'':'home-hidden'}" data-home-demo>Simular pago</button><p class="home-purchase-message" aria-live="polite">${!cfg.paypal?.enabled&&!cfg.demoCheckout?'Falta conectar la cuenta PayPal para habilitar pagos.':''}</p></div>`;
    document.body.appendChild(dlg);const msg=dlg.querySelector('.home-purchase-message');
    dlg.querySelector('.home-dialog-close').onclick=()=>dlg.close();
    const paypalBtn=dlg.querySelector('[data-home-paypal]');if(paypalBtn)paypalBtn.onclick=()=>payProgram(item,false,dlg,msg,paypalBtn);
    const demoBtn=dlg.querySelector('[data-home-demo]');if(demoBtn)demoBtn.onclick=()=>payProgram(item,true,dlg,msg,demoBtn);
    dlg.addEventListener('close',()=>dlg.remove(),{once:true});dlg.showModal()
  }

  async function loadPayPal(cfg){
    if(paypalSdk)return paypalSdk;
    if(!cfg.paypal?.enabled)throw new Error('PayPal todavía no está conectado.');
    if(!window.paypal){await new Promise((resolve,reject)=>{const el=document.createElement('script');el.async=true;el.src=`https://${cfg.paypal.mode==='live'?'www':'www.sandbox'}.paypal.com/web-sdk/v6/core`;el.onload=resolve;el.onerror=()=>reject(new Error('No se pudo cargar PayPal.'));document.head.appendChild(el)})}
    paypalSdk=await window.paypal.createInstance({clientId:cfg.paypal.clientId,components:['paypal-payments'],pageType:'checkout'});return paypalSdk
  }

  async function payProgram(item,demo,dlg,msg,button){
    try{
      button.disabled=true;msg.textContent=demo?'Confirmando acceso…':'Abriendo PayPal…';
      if(demo){const r=await request('/api/demo/purchase',{method:'POST',body:{itemType:'course',itemId:Number(item.course_id)}});msg.textContent='Pago confirmado. Entrando a tu programa…';location.href=r.redirect;return}
      const cfg=await getConfig(),sdk=await loadPayPal(cfg),order=await request('/api/paypal/create-order',{method:'POST',body:{itemType:'course',itemId:Number(item.course_id)}});
      const payment=sdk.createPayPalOneTimePaymentSession({onApprove:async info=>{msg.textContent='Confirmando pago…';try{const cap=await request(`/api/paypal/capture-order/${encodeURIComponent(info.orderId)}`,{method:'POST',body:{}});msg.textContent='Pago confirmado. Entrando a tu programa…';location.href=cap.redirect}catch(x){msg.textContent=x.message;button.disabled=false}},onCancel:()=>{msg.textContent='El pago fue cancelado. No se habilitó el acceso.';button.disabled=false},onError:()=>{msg.textContent='PayPal no pudo completar la operación.';button.disabled=false}});
      await payment.start({presentationMode:'auto',targetElement:button},Promise.resolve({orderId:order.id}))
    }catch(x){msg.textContent=x.message;button.disabled=false}
  }

  function embedFor(raw){try{const u=new URL(raw),h=u.hostname.toLowerCase();if(h.includes('youtube.com')){if(h==='www.youtube-nocookie.com')return{type:'frame',src:raw};const id=u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).pop();return id?{type:'frame',src:`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`}:null}if(h==='youtu.be'){const id=u.pathname.slice(1).split('/')[0];return id?{type:'frame',src:`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`}:null}if(h.includes('vimeo.com')){const id=u.pathname.split('/').filter(Boolean).pop();return id?{type:'frame',src:`https://player.vimeo.com/video/${encodeURIComponent(id)}`}:null}if(/\.(mp4|webm)(?:$|\?)/i.test(raw)||h.endsWith('.r2.dev')||h.endsWith('.r2.cloudflarestorage.com'))return{type:'video',src:raw};return{type:'frame',src:raw}}catch{return null}}
  function openVideo(raw,title){const source=embedFor(raw);if(!source){showNotice('El enlace del video no es compatible.');return}const dlg=document.createElement('dialog');dlg.className='home-video-dialog';dlg.innerHTML=`<button class="home-video-close" type="button" aria-label="Cerrar">×</button><div class="home-video-stage">${source.type==='video'?`<video src="${esc(source.src)}" controls autoplay playsinline></video>`:`<iframe src="${esc(source.src)}" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`}</div>`;document.body.appendChild(dlg);dlg.querySelector('.home-video-close').onclick=()=>dlg.close();dlg.addEventListener('close',()=>dlg.remove(),{once:true});dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});dlg.showModal()}
})();
