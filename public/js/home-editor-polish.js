// Unifica la edición de Home: Programas + Ebooks comparten los mismos datos.
(function(){
  const baseAdminHtml=adminHtml;
  adminHtml=async function(){
    let html=await baseAdminHtml();
    if(state.me?.user?.role!=='admin')return html;
    html=html.replace(/(<a[^>]+href="#admin\/home"[^>]*><span>⌂<\/span>)\s*Inicio<\/a>/, '$1 Vista de Home y edición</a>');
    html=html.replace(/(<button[^>]+data-admin-tab="home"[^>]*>)Inicio<\/button>/, '$1Vista de Home y edición</button>');
    if(state.adminTab==='home'){
      html=html.replace('<h1>Inicio</h1>','<h1>Vista de Home y edición</h1>');
      html=html.replace('Gestioná el video principal y los programas que se compran directamente desde la Home.','Editá desde un solo lugar todo lo que se ve en Home: textos, video, programas, precios y ebooks.');
    }
    return html;
  };

  const baseLoad=loadAdminTab;
  loadAdminTab=async function(){
    await baseLoad();
    if(!['home','ebooks'].includes(state.adminTab))return;
    const box=document.getElementById('admin-content');
    if(!box)return;

    // Nombres consistentes: siempre "de Home", nunca "de la Home".
    const walker=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      n.nodeValue=n.nodeValue
        .replace(/de la Home/g,'de Home')
        .replace(/en la Home/g,'en Home')
        .replace(/a la Home/g,'a Home')
        .replace(/la página pública/g,'Home pública');
    });

    if(state.adminTab==='home'){
      box.querySelectorAll('h3').forEach(h=>{
        if(h.textContent.trim()==='Video y encabezado de inicio')h.textContent='Video y encabezado de Home';
        if(h.textContent.trim()==='Agregar opción a Home')h.textContent='Agregar programa para Home';
        if(h.textContent.trim()==='Agregar opción a la Home')h.textContent='Agregar programa para Home';
        if(h.textContent.trim()==='Ebooks de Home')h.textContent='Ebooks de Home';
      });
      box.querySelectorAll('button').forEach(b=>{
        if(b.textContent.trim()==='Guardar Inicio')b.textContent='Guardar Home';
      });

      // Encabezado explicativo para dejar claro que este es el panel maestro.
      if(!box.querySelector('.mc-home-master-note')){
        const note=document.createElement('section');
        note.className='panel mc-home-master-note';
        note.innerHTML='<p class="mc-kicker">VISTA DE HOME Y EDICIÓN</p><h3>Todo Home en un solo lugar</h3><p>Acá editás lo que ve la clienta en Home: títulos, textos, video, programas, precios y ebooks. La sección Ebooks sigue disponible como acceso rápido y edita exactamente los mismos datos.</p><a class="mini-btn" href="/" target="_blank" rel="noopener">Ver Home pública</a>';
        box.prepend(note);
      }
    }
  };
})();
