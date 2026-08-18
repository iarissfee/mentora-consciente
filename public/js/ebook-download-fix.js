// Evita descargas rotas cuando un ebook fue asignado pero todavía no tiene PDF cargado.
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .mc-pdf-unavailable{display:block;margin-top:14px;background:#eee9e3;color:#766f68;padding:11px;text-align:center;font-weight:700}
  `;
  document.head.appendChild(style);

  const previousCampus=campusHtml;
  campusHtml=async function(){
    let html=await previousCampus();
    if(!state.me?.user||state.me.user.role==='admin')return html;
    try{
      const d=await api('/api/my/ebooks');
      for(const x of (d.ebooks||[])){
        if(x.ready)continue;
        const id=Number(x.id);
        const re=new RegExp(`<a([^>]*?)href="/api/ebooks/${id}/download"([^>]*)>\\s*Descargar PDF\\s*</a>`,'gi');
        html=html.replace(re,'<span class="mc-pdf-unavailable">PDF todavía no cargado</span>');
      }
    }catch{}
    return html
  };

  document.addEventListener('click',async ev=>{
    const link=ev.target.closest('a[href^="/api/ebooks/"][href$="/download"]');
    if(!link||state.me?.user?.role==='admin')return;
    const m=(link.getAttribute('href')||'').match(/^\/api\/ebooks\/(\d+)\/download$/);
    if(!m)return;
    try{
      const d=await api('/api/my/ebooks');
      const ebook=(d.ebooks||[]).find(x=>Number(x.id)===Number(m[1]));
      if(ebook&&!ebook.ready){
        ev.preventDefault();
        ev.stopImmediatePropagation();
        toast('Este ebook está habilitado, pero todavía no tiene el PDF cargado.');
        setTimeout(()=>renderRoute(),80)
      }
    }catch{}
  },true);
})();
