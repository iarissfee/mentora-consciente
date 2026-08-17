// Navegación final y consistente del menú izquierdo de Administración.
(function(){
  const allowed=new Set(['dashboard','students','courses','home','ebooks','community','settings']);
  document.addEventListener('click',ev=>{
    const a=ev.target.closest('.mc-admin-sidebar a[href^="#admin/"]');
    if(!a)return;
    const href=a.getAttribute('href')||'',tab=href.split('/')[1]||'dashboard';
    if(!allowed.has(tab))return;
    ev.preventDefault();ev.stopImmediatePropagation();
    state.adminTab=tab;
    const target=`#admin/${tab}`;
    if(location.hash!==target)location.hash=target;
    // Render explícito para evitar que navegaciones anteriores o caché de hash
    // dejen el botón marcado sin abrir su contenido.
    setTimeout(()=>{if(location.hash===target)renderRoute()},0)
  },true)
})();
