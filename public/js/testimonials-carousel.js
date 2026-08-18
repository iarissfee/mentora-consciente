// Usa los comentarios editables de Administración en el carrusel existente de Home.
(async function(){
  const section=document.querySelector('.stories');
  const track=section?.querySelector('.story-grid');
  if(!section||!track)return;
  section.id='historias';
  const esc=(v='')=>String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  let items=[];
  try{const r=await fetch('/api/public/testimonials',{credentials:'same-origin'});if(!r.ok)return;const d=await r.json();items=Array.isArray(d.testimonials)?d.testimonials:[]}catch{return}
  if(!items.length)return;
  const display=items.length<5?[...items,...items]:items;
  track.innerHTML=display.map(x=>`<article class="story"><div class="quote">“</div><p>${esc(x.text)}</p><footer><strong>${esc(x.name)}</strong>${x.role?esc(x.role):''}</footer></article>`).join('');
  track.setAttribute('aria-label','Comentarios de alumnas');
  let timer=null;
  const advance=()=>{
    const first=track.querySelector('.story');if(!first)return;
    const gap=parseFloat(getComputedStyle(track).gap||20),step=first.getBoundingClientRect().width+gap;
    const end=track.scrollWidth-track.clientWidth-4;
    if(track.scrollLeft>=end-step/2)track.scrollTo({left:0,behavior:'smooth'});else track.scrollBy({left:step,behavior:'smooth'});
  };
  const start=()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;clearInterval(timer);timer=setInterval(advance,3600)};
  const stop=()=>{clearInterval(timer);timer=null};
  track.addEventListener('pointerdown',stop,{passive:true});
  track.addEventListener('pointerup',start,{passive:true});
  track.addEventListener('mouseenter',stop);
  track.addEventListener('mouseleave',start);
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  start();
})();
