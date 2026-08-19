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

      if(!box.querySelector('.mc-home-master-note')){
        const note=document.createElement('section');
        note.className='panel mc-home-master-note';
        note.innerHTML='<p class="mc-kicker">VISTA DE HOME Y EDICIÓN</p><h3>Todo Home en un solo lugar</h3><p>Acá editás lo que ve la clienta en Home: títulos, textos, video, programas, precios y ebooks. La sección Ebooks sigue disponible como acceso rápido y edita exactamente los mismos datos.</p><a class="mini-btn" href="/" target="_blank" rel="noopener">Ver Home pública</a>';
        box.prepend(note);
      }

      if(!box.querySelector('#home-poster-editor')){
        let d;try{d=await api('/api/admin/home')}catch{return}
        const s=d.settings||{},poster=s.video_poster||'/api/home/original-poster';
        const panel=document.createElement('section');
        panel.className='panel';panel.id='home-poster-editor';
        panel.innerHTML=`
          <div class="mc-panel-heading"><div><p class="mc-kicker">PORTADA DE HOME</p><h3>Foto del video de inicio</h3><p>Cambiá esta foto desde tu celular. Al guardarla se actualiza automáticamente en Home.</p></div></div>
          <div style="display:grid;grid-template-columns:minmax(220px,420px) 1fr;gap:24px;align-items:start">
            <div style="background:#f2eee8;border:1px solid #e2ddd7;overflow:hidden;aspect-ratio:16/10;display:grid;place-items:center"><img id="home-poster-preview" src="${e(poster)}" alt="Portada actual" style="width:100%;height:100%;object-fit:cover;display:block"></div>
            <div><label style="display:grid;gap:8px;font-weight:600">Elegir nueva foto<input id="home-poster-file" type="file" accept="image/jpeg,image/png,image/webp" style="width:100%"></label><p style="font-size:12px;color:#6a6a65;margin:10px 0 18px">JPG, PNG o WebP · máximo 8 MB. La vista previa aparece antes de guardar.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button id="home-poster-save" class="btn btn-primary" type="button" disabled>Guardar nueva portada</button><button id="home-poster-reset" class="mini-btn" type="button">Restaurar original</button></div><p id="home-poster-status" style="font-size:12px;margin:12px 0 0;color:#536157"></p></div>
          </div>`;
        const firstReal=[...box.querySelectorAll('section.panel')].find(x=>!x.classList.contains('mc-home-master-note'));
        if(firstReal)firstReal.before(panel);else box.append(panel);
        const input=panel.querySelector('#home-poster-file'),preview=panel.querySelector('#home-poster-preview'),save=panel.querySelector('#home-poster-save'),reset=panel.querySelector('#home-poster-reset'),status=panel.querySelector('#home-poster-status');
        let objectUrl='';
        input.onchange=()=>{const f=input.files&&input.files[0];save.disabled=!f;if(!f)return;if(f.size>8*1024*1024){status.textContent='La imagen supera 8 MB.';save.disabled=true;return}if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(f);preview.src=objectUrl;status.textContent='Vista previa lista. Tocá Guardar nueva portada.'};
        save.onclick=async()=>{const f=input.files&&input.files[0];if(!f)return;const fd=new FormData();fd.append('poster',f,f.name);save.disabled=true;save.textContent='Guardando…';status.textContent='Subiendo la foto…';try{await api('/api/admin/home/poster',{method:'POST',body:fd});toast('Portada actualizada');status.textContent='Listo. Ya se actualizó en Home.';setTimeout(()=>loadAdminTab(),450)}catch(x){status.textContent=x.message;toast(x.message);save.disabled=false;save.textContent='Guardar nueva portada'}};
        reset.onclick=async()=>{if(!confirm('¿Restaurar la portada original de Mentora?'))return;reset.disabled=true;status.textContent='Restaurando…';try{await api('/api/admin/home/poster',{method:'DELETE'});toast('Portada original restaurada');setTimeout(()=>loadAdminTab(),400)}catch(x){status.textContent=x.message;reset.disabled=false}};
      }
    }
  };
})();
