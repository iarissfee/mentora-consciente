// Editor visual de la portada principal de Home.
(function(){
  const baseLoadHomePoster=loadAdminTab;
  loadAdminTab=async function(){
    await baseLoadHomePoster();
    if(state.adminTab!=='home')return;
    const box=document.getElementById('admin-content');
    if(!box||box.querySelector('#home-poster-editor'))return;
    let d;try{d=await api('/api/admin/home')}catch{return}
    const s=d.settings||{},poster=s.video_poster||'/api/home/original-poster';
    const panel=document.createElement('section');
    panel.className='panel';panel.id='home-poster-editor';
    panel.innerHTML=`
      <div class="mc-panel-heading">
        <div><p class="mc-kicker">PORTADA DE HOME</p><h3>Foto del video de inicio</h3><p>Cambiá esta foto desde tu celular. Al guardarla se actualiza automáticamente en Home.</p></div>
      </div>
      <div style="display:grid;grid-template-columns:minmax(220px,420px) 1fr;gap:24px;align-items:start">
        <div style="background:#f2eee8;border:1px solid #e2ddd7;overflow:hidden;aspect-ratio:16/10;display:grid;place-items:center">
          <img id="home-poster-preview" src="${e(poster)}" alt="Portada actual" style="width:100%;height:100%;object-fit:cover;display:block">
        </div>
        <div>
          <label style="display:grid;gap:8px;font-weight:600">Elegir nueva foto
            <input id="home-poster-file" type="file" accept="image/jpeg,image/png,image/webp" style="width:100%">
          </label>
          <p style="font-size:12px;color:#6a6a65;margin:10px 0 18px">JPG, PNG o WebP · máximo 8 MB. La vista previa aparece antes de guardar.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button id="home-poster-save" class="btn btn-primary" type="button" disabled>Guardar nueva portada</button>
            <button id="home-poster-reset" class="mini-btn" type="button">Restaurar original</button>
          </div>
          <p id="home-poster-status" style="font-size:12px;margin:12px 0 0;color:#536157"></p>
        </div>
      </div>`;
    const firstRealPanel=[...box.querySelectorAll('section.panel')].find(x=>!x.classList.contains('mc-home-master-note'));
    if(firstRealPanel)firstRealPanel.before(panel);else box.prepend(panel);

    const input=panel.querySelector('#home-poster-file'),preview=panel.querySelector('#home-poster-preview'),save=panel.querySelector('#home-poster-save'),reset=panel.querySelector('#home-poster-reset'),status=panel.querySelector('#home-poster-status');
    let objectUrl='';
    input.onchange=()=>{
      const f=input.files&&input.files[0];save.disabled=!f;
      if(!f)return;
      if(f.size>8*1024*1024){status.textContent='La imagen supera 8 MB.';save.disabled=true;return}
      if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(f);preview.src=objectUrl;status.textContent='Vista previa lista. Tocá Guardar nueva portada.'
    };
    save.onclick=async()=>{
      const f=input.files&&input.files[0];if(!f)return;
      const fd=new FormData();fd.append('poster',f,f.name);
      save.disabled=true;save.textContent='Guardando…';status.textContent='Subiendo la foto…';
      try{await api('/api/admin/home/poster',{method:'POST',body:fd});toast('Portada actualizada');status.textContent='Listo. Ya se actualizó en Home.';setTimeout(()=>loadAdminTab(),500)}catch(x){status.textContent=x.message;toast(x.message);save.disabled=false;save.textContent='Guardar nueva portada'}
    };
    reset.onclick=async()=>{
      if(!confirm('¿Restaurar la portada original de Mentora?'))return;
      reset.disabled=true;status.textContent='Restaurando…';
      try{await api('/api/admin/home/poster',{method:'DELETE'});toast('Portada original restaurada');setTimeout(()=>loadAdminTab(),400)}catch(x){status.textContent=x.message;reset.disabled=false}
    };
  };
})();
