// Descarga estable de ebooks: transforma enlaces antiguos por ID al endpoint robusto por slug.
(function(){
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
      window.location.href=`/api/my/ebook-download/${encodeURIComponent(ebook.slug)}`;
    }catch(x){toast(x.message||'No se pudo descargar el ebook.')}
  },true);
})();
