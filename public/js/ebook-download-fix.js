// Descarga robusta de ebooks: usa el ebook realmente habilitado en la cuenta y lo resuelve por slug.
(function(){
  const style=document.createElement('style');
  style.textContent=`.mc-pdf-unavailable{display:block;margin-top:14px;background:#eee9e3;color:#766f68;padding:11px;text-align:center;font-weight:700}`;
  document.head.appendChild(style);

  const previousCampus=campusHtml;
  campusHtml=async function(){
    let html=await previousCampus();
    if(!state.me?.user||state.me.user.role==='admin')return html;
    try{
      const d=await api('/api/my/ebooks');
      for(const x of (d.ebooks||[])){
        const id=Number(x.id);
        if(!x.ready){
          const re=new RegExp(`<a([^>]*?)href="/api/ebooks/${id}/download"([^>]*)>\\s*Descargar PDF\\s*</a>`,'gi');
          html=html.replace(re,'<span class="mc-pdf-unavailable">PDF todavía no cargado</span>');
        }
      }
    }catch{}
    return html
  };

  document.addEventListener('click',async ev=>{
    const link=ev.target.closest('a[href^="/api/ebooks/"][href$="/download"]');
    if(!link||state.me?.user?.role==='admin')return;
    const m=(link.getAttribute('href')||'').match(/^\/api\/ebooks\/(\d+)\/download$/);
    if(!m)return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    try{
      const d=await api('/api/my/ebooks');
      const ebook=(d.ebooks||[]).find(x=>Number(x.id)===Number(m[1]));
      if(!ebook)return toast('Ese ebook no está habilitado en esta cuenta.');
      if(!ebook.ready)return toast('El ebook está asignado, pero la base no está detectando el PDF. Revisalo una vez desde Administración → Ebooks.');
      window.location.href=`/api/my/ebook-download/${encodeURIComponent(ebook.slug)}`;
    }catch(x){toast(x.message||'No se pudo descargar el ebook.')}
  },true);
})();
