// Meditaciones: la administradora carga enlaces de YouTube y las alumnas ven únicamente el QR dentro de Comunidad.
(function(){
  const previousCommunityHtml=communityHtml;
  communityHtml=async function(){
    const html=await previousCommunityHtml();
    if(!state.me?.user)return html;
    let data={meditations:[]};
    try{data=await api('/api/community/meditations')}catch{}
    const meds=data.meditations||[];
    const library=meds.length?`<section class="mc-meditation-library"><div class="mc-meditation-head"><p class="mc-kicker">MEDITACIONES</p><h2>Escaneá y escuchá</h2><p>Escaneá el QR con tu celular para abrir la meditación.</p></div><div class="mc-meditation-grid">${meds.map(m=>`<article class="mc-meditation-card mc-meditation-card-qr-only"><div class="mc-meditation-qr"><img src="${e(m.qr_url)}" alt="QR para ${e(m.title)}" loading="lazy"></div><div><h3>${e(m.title)}</h3>${m.description?`<p>${e(m.description)}</p>`:''}</div></article>`).join('')}</div></section>`:`<section class="mc-meditation-library mc-meditation-empty"><div class="mc-meditation-head"><p class="mc-kicker">MEDITACIONES</p><h2>Escaneá y escuchá</h2><p>Todavía no hay meditaciones publicadas.</p></div></section>`;
    return html.replace('<div id="community-posts">',library+'<div id="community-posts">');
  };

  const previousLoadAdminTab=loadAdminTab;
  loadAdminTab=async function(){
    await previousLoadAdminTab();
    if(state.adminTab!=='community')return;
    const box=document.getElementById('admin-content');if(!box)return;
    try{
      const d=await api('/api/admin/meditations');
      const meds=d.meditations||[];
      const panel=document.createElement('section');
      panel.className='panel mc-admin-meditations';
      panel.innerHTML=`<div class="mc-panel-heading"><div><p class="mc-kicker">MEDITACIONES DE YOUTUBE</p><h3>QR para Comunidad</h3><p>Pegá el enlace de YouTube. El campus genera el QR automáticamente y lo muestra únicamente en la sección Comunidad.</p></div></div><form id="new-meditation-form" class="form-grid mc-meditation-editor"><label>Título<input name="title" maxlength="120" placeholder="Ej: Claridad matutina" required></label><label>Orden<input type="number" name="sort_order" value="0"></label><label style="grid-column:1/-1">Enlace de YouTube<input name="youtube_url" type="url" placeholder="https://youtu.be/..." required></label><label style="grid-column:1/-1">Descripción opcional<textarea name="description" rows="2" maxlength="500" placeholder="Texto breve debajo del QR"></textarea></label><label><span><input type="checkbox" name="active" checked> Mostrar QR en Comunidad</span></label><button class="btn btn-primary" type="submit">+ Agregar QR</button></form><div class="mc-meditation-admin-list">${meds.length?meds.map(m=>`<form class="mc-meditation-admin-row" data-meditation-id="${m.id}"><div class="mc-admin-qr-preview"><img src="/api/community/meditations/${m.id}/qr" alt="QR ${e(m.title)}"></div><div class="mc-admin-med-fields"><label>Título<input name="title" value="${e(m.title)}" required></label><label>Link YouTube<input name="youtube_url" type="url" value="${e(m.youtube_url)}" required></label><label>Descripción opcional<textarea name="description" rows="2">${e(m.description||'')}</textarea></label><div class="mc-admin-med-inline"><label>Orden<input type="number" name="sort_order" value="${Number(m.sort_order||0)}"></label><label><span><input type="checkbox" name="active" ${m.active?'checked':''}> Mostrar en Comunidad</span></label></div><div class="mc-admin-med-actions"><button class="mini-btn" type="submit">Guardar</button><button class="mini-btn mc-delete" type="button" data-delete-meditation="${m.id}">Eliminar</button></div></div></form>`).join(''):'<p class="mc-empty-note">Todavía no agregaste meditaciones.</p>'}</div>`;
      box.prepend(panel);
      bindMeditationAdmin();
    }catch(x){console.error(x)}
  };

  function bindMeditationAdmin(){
    const nf=document.getElementById('new-meditation-form');
    if(nf)nf.onsubmit=async ev=>{ev.preventDefault();const f=new FormData(nf);try{await api('/api/admin/meditations',{method:'POST',body:{title:f.get('title'),youtube_url:f.get('youtube_url'),description:f.get('description'),sort_order:Number(f.get('sort_order')),active:!!f.get('active')}});toast('QR agregado a Comunidad');loadAdminTab()}catch(x){toast(x.message)}};
    document.querySelectorAll('.mc-meditation-admin-row').forEach(form=>form.onsubmit=async ev=>{ev.preventDefault();const f=new FormData(form);try{await api(`/api/admin/meditations/${form.dataset.meditationId}`,{method:'PUT',body:{title:f.get('title'),youtube_url:f.get('youtube_url'),description:f.get('description'),sort_order:Number(f.get('sort_order')),active:!!f.get('active')}});toast('QR actualizado');loadAdminTab()}catch(x){toast(x.message)}});
    document.querySelectorAll('[data-delete-meditation]').forEach(b=>b.onclick=async()=>{if(!confirm('¿Eliminar este QR de meditación?'))return;try{await api(`/api/admin/meditations/${b.dataset.deleteMeditation}`,{method:'DELETE'});toast('QR eliminado');loadAdminTab()}catch(x){toast(x.message)}})
  }

  const previousBindAdminCourses=bindAdminCourses;
  bindAdminCourses=function(d){
    previousBindAdminCourses(d);
    document.querySelectorAll('select[name="required_rank"] option[value="0"]').forEach(o=>o.textContent='Compra individual');
    document.querySelectorAll('.mc-course-footer-actions').forEach(footer=>{
      if(footer.querySelector('.mc-customer-preview-label'))return;
      const label=document.createElement('div');label.className='mc-customer-preview-label';label.innerHTML='<strong>👁 Vista como alumna</strong><span>Previsualizá exactamente cómo queda el curso y qué descargables ve cada nivel.</span>';
      footer.prepend(label);
      const links=footer.querySelectorAll('a[href^="#preview/"]');
      if(links[0])links[0].textContent='Compra individual';
      if(links[1])links[1].textContent='Membresía Esencial';
      if(links[2])links[2].textContent='Membresía Premium';
    });
    document.querySelectorAll('.add-lesson-form').forEach(form=>{if(form.querySelector('.mc-payment-access-note'))return;const note=document.createElement('small');note.className='mc-payment-access-note';note.textContent='La alumna sólo podrá abrir esta clase cuando el curso haya sido habilitado por una compra aprobada o por su membresía.';form.prepend(note)})
  };
})();
