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
      });
      box.querySelectorAll('button').forEach(b=>{if(b.textContent.trim()==='Guardar Inicio')b.textContent='Guardar Home'});
      box.querySelectorAll('#home-main-form label').forEach(label=>{if(label.textContent.includes('Imagen de portada del video'))label.remove()});

      if(!box.querySelector('.mc-home-master-note')){
        const note=document.createElement('section');
        note.className='panel mc-home-master-note';
        note.innerHTML='<p class="mc-kicker">VISTA DE HOME Y EDICIÓN</p><h3>Todo Home en un solo lugar</h3><p>Acá editás lo que ve la clienta en Home: títulos, textos, video, programas, precios y ebooks.</p><a class="mini-btn" href="/" target="_blank" rel="noopener">Ver Home pública</a>';
        box.prepend(note);
      }

      if(!box.querySelector('#home-poster-editor')){
        let d;try{d=await api('/api/admin/home')}catch{return}
        const s=d.settings||{},poster=s.video_poster||'/api/home/original-poster?v=6';
        const panel=document.createElement('section');
        panel.className='panel';panel.id='home-poster-editor';
        panel.innerHTML=`
          <div class="mc-panel-heading"><div><p class="mc-kicker">PORTADA DE HOME</p><h3>Foto del video de inicio</h3><p>Elegí una foto desde tu celular y tocá Guardar. La misma imagen se usa automáticamente en Home.</p></div></div>
          <div style="display:grid;grid-template-columns:minmax(220px,420px) 1fr;gap:24px;align-items:start">
            <div style="background:#f2eee8;border:1px solid #e2ddd7;overflow:hidden;aspect-ratio:16/10;display:grid;place-items:center"><img id="home-poster-preview" src="${e(poster)}" alt="Portada actual" style="width:100%;height:100%;object-fit:cover;display:block"></div>
            <div><label style="display:grid;gap:8px;font-weight:600">Elegir nueva foto<input id="home-poster-file" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" style="width:100%"></label><p style="font-size:12px;color:#6a6a65;margin:10px 0 18px">JPG, PNG o WebP · máximo 8 MB.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button id="home-poster-save" class="btn btn-primary" type="button" disabled>Guardar nueva portada</button><button id="home-poster-reset" class="mini-btn" type="button">Restaurar original</button><a class="mini-btn" href="/" target="_blank" rel="noopener">Ver Home</a></div><p id="home-poster-status" style="font-size:12px;margin:14px 0 0;color:#536157;font-weight:600"></p></div>
          </div>`;
        const firstReal=[...box.querySelectorAll('section.panel')].find(x=>!x.classList.contains('mc-home-master-note'));
        if(firstReal)firstReal.before(panel);else box.append(panel);
        const input=panel.querySelector('#home-poster-file'),preview=panel.querySelector('#home-poster-preview'),save=panel.querySelector('#home-poster-save'),reset=panel.querySelector('#home-poster-reset'),status=panel.querySelector('#home-poster-status');
        let objectUrl='';
        const releaseObjectUrl=()=>{if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=''}};
        const supportedFile=f=>{
          const type=String(f?.type||'').toLowerCase();
          if(['image/jpeg','image/png','image/webp'].includes(type))return true;
          return /\.(jpe?g|png|webp)$/i.test(String(f?.name||''));
        };
        const showServerPoster=async src=>{
          const sep=String(src).includes('?')?'&':'?';
          const url=String(src||'/api/home/poster-image')+sep+'t='+Date.now();
          const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});
          if(!r.ok)throw new Error('La foto se guardó pero no se pudo volver a abrir.');
          const blob=await r.blob();
          if(!String(blob.type||'').startsWith('image/'))throw new Error('El servidor no devolvió una imagen válida.');
          releaseObjectUrl();objectUrl=URL.createObjectURL(blob);preview.style.opacity='1';preview.src=objectUrl;
        };
        preview.onerror=()=>{preview.style.opacity='.18';status.textContent='La portada guardada no se pudo mostrar. Elegí una nueva foto.'};

        input.onchange=()=>{
          const f=input.files&&input.files[0];save.disabled=!f;if(!f)return;
          if(f.size>8*1024*1024){status.textContent='La imagen supera 8 MB. Elegí una más liviana.';toast('La imagen supera 8 MB');input.value='';save.disabled=true;return}
          if(!supportedFile(f)){status.textContent='Usá una imagen JPG, PNG o WebP.';toast('Formato de imagen no válido');input.value='';save.disabled=true;return}
          releaseObjectUrl();objectUrl=URL.createObjectURL(f);preview.style.opacity='1';preview.src=objectUrl;
          status.textContent='Vista previa lista. Tocá Guardar nueva portada.';
        };

        save.onclick=async()=>{
          const f=input.files&&input.files[0];if(!f)return;
          save.disabled=true;input.disabled=true;save.textContent='Guardando…';status.textContent='Subiendo y comprobando la foto…';
          try{
            const type=['image/jpeg','image/png','image/webp'].includes(String(f.type||'').toLowerCase())?f.type:'application/octet-stream';
            const r=await fetch('/api/admin/home/poster',{method:'POST',credentials:'same-origin',headers:{'x-csrf-token':state.csrf,'Content-Type':type},body:f});
            let data={};try{data=await r.json()}catch{}
            if(!r.ok)throw new Error(data.error||`Error ${r.status}`);
            await showServerPoster(data.video_poster||'/api/home/poster-image');
            status.textContent='✓ Guardada y comprobada. Ya está actualizada en Home.';toast('Portada de Home actualizada');
            input.value='';
          }catch(x){status.textContent='No se pudo guardar: '+x.message;toast(x.message)}
          finally{input.disabled=false;save.disabled=!input.files?.length;save.textContent='Guardar nueva portada'}
        };

        reset.onclick=async()=>{
          if(!confirm('¿Restaurar la portada original de Mentora?'))return;
          reset.disabled=true;status.textContent='Restaurando…';
          try{
            const r=await api('/api/admin/home/poster',{method:'DELETE'});
            await showServerPoster(r.video_poster||'/api/home/original-poster?v=6');
            status.textContent='✓ Portada original restaurada.';toast('Portada original restaurada')
          }catch(x){status.textContent=x.message;toast(x.message)}finally{reset.disabled=false}
        };
      }
    }
  };
})();
