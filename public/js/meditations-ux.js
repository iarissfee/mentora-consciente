// Biblioteca privada de meditaciones con QR configurables desde Administración.
(function(){
  const previousCommunityHtml=communityHtml;
  communityHtml=async function(){
    const html=await previousCommunityHtml();
    if(!state.me?.user)return html;
    let data={meditations:[]};
    try{data=await api('/api/community/meditations')}catch{}
    const meds=data.meditations||[];
    const library=meds.length?`<section class="mc-meditation-library"><div class="mc-meditation-head"><p class="mc-kicker">PRÁCTICAS GUIADAS</p><h2>Meditaciones</h2><p>Escaneá el QR desde otro dispositivo o abrí la práctica directamente en YouTube.</p></div><div class="mc-meditation-grid">${meds.map(m=>`<article class="mc-meditation-card"><div class="mc-meditation-qr"><img src="${e(m.qr_url)}" alt="QR para ${e(m.title)}" loading="lazy"></div><div><span>PRÁCTICA GUIADA</span><h3>${e(m.title)}</h3>${m.description?`<p>${e(m.description)}</p>`:''}<a href="${e(m.watch_url)}" target="_blank" rel="noopener noreferrer" class="mini-btn mc-meditation-open">▶ Abrir en YouTube</a></div></article>`).join('')}</div></section>`:`<section class="mc-meditation-library mc-meditation-empty"><div class="mc-meditation-head"><p class="mc-kicker">PRÁCTICAS GUIADAS</p><h2>Meditaciones</h2><p>La mentora todavía no publicó meditaciones.</p></div></section>`;
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
      panel.innerHTML=`<div class="mc-panel-heading"><div><p class="mc-kicker">YOUTUBE + QR AUTOMÁTICO</p><h3>Biblioteca de meditaciones</h3><p>Cargá un link de YouTube y el campus genera el QR solo. Las alumnas lo ven dentro de Comunidad.</p></div></div><form id="new-meditation-form" class="form-grid mc-meditation-editor"><label>Título<input name="title" maxlength="120" placeholder="Ej: Claridad matutina" required></label><label>Orden<input type="number" name="sort_order" value="0"></label><label style="grid-column:1/-1">Enlace de YouTube<input name="youtube_url" type="url" placeholder="https://youtu.be/..." required></label><label style="grid-column:1/-1">Descripción<textarea name="description" rows="2" maxlength="500" placeholder="Una frase breve sobre la práctica"></textarea></label><label><span><input type="checkbox" name="active" checked> Visible para alumnas</span></label><button class="btn btn-primary" type="submit">+ Agregar meditación</button></form><div class="mc-meditation-admin-list">${meds.length?meds.map(m=>`<form class="mc-meditation-admin-row" data-meditation-id="${m.id}"><div class="mc-admin-qr-preview"><img src="/api/community/meditations/${m.id}/qr" alt="QR ${e(m.title)}"></div><div class="mc-admin-med-fields"><label>Título<input name="title" value="${e(m.title)}" required></label><label>Link YouTube<input name="youtube_url" type="url" value="${e(m.youtube_url)}" required></label><label>Descripción<textarea name="description" rows="2">${e(m.description||'')}</textarea></label><div class="mc-admin-med-inline"><label>Orden<input type="number" name="sort_order" value="${Number(m.sort_order||0)}"></label><label><span><input type="checkbox" name="active" ${m.active?'checked':''}> Visible</span></label></div><div class="mc-admin-med-actions"><button class="mini-btn" type="submit">Guardar</button><a class="mini-btn" href="${e(m.youtube_url)}" target="_blank" rel="noopener noreferrer">▶ Probar</a><button class="mini-btn mc-delete" type="button" data-delete-meditation="${m.id}">Eliminar</button></div></div></form>`).join(''):'<p class="mc-empty-note">Todavía no agregaste meditaciones.</p>'}</div>`;
      box.prepend(panel);
      bindMeditationAdmin();
    }catch(x){console.error(x)}
  };

  function bindMeditationAdmin(){
    const nf=document.getElementById('new-meditation-form');
    if(nf)nf.onsubmit=async ev=>{ev.preventDefault();const f=new FormData(nf);try{await api('/api/admin/meditations',{method:'POST',body:{title:f.get('title'),youtube_url:f.get('youtube_url'),description:f.get('description'),sort_order:Number(f.get('sort_order')),active:!!f.get('active')}});toast('Meditación agregada · QR generado');loadAdminTab()}catch(x){toast(x.message)}};
    document.querySelectorAll('.mc-meditation-admin-row').forEach(form=>form.onsubmit=async ev=>{ev.preventDefault();const f=new FormData(form);try{await api(`/api/admin/meditations/${form.dataset.meditationId}`,{method:'PUT',body:{title:f.get('title'),youtube_url:f.get('youtube_url'),description:f.get('description'),sort_order:Number(f.get('sort_order')),active:!!f.get('active')}});toast('Meditación actualizada');loadAdminTab()}catch(x){toast(x.message)}});
    document.querySelectorAll('[data-delete-meditation]').forEach(b=>b.onclick=async()=>{if(!confirm('¿Eliminar esta meditación y su QR?'))return;try{await api(`/api/admin/meditations/${b.dataset.deleteMeditation}`,{method:'DELETE'});toast('Meditación eliminada');loadAdminTab()}catch(x){toast(x.message)}})
  }

  const previousBindAdminCourses=bindAdminCourses;
  bindAdminCourses=function(d){
    previousBindAdminCourses(d);
    document.querySelectorAll('.mc-course-footer-actions').forEach((footer,i)=>{
      if(footer.querySelector('.mc-customer-preview-label'))return;
      const label=document.createElement('div');label.className='mc-customer-preview-label';label.innerHTML='<strong>👁 Vista como alumna</strong><span>Previsualizá exactamente cómo queda el curso y qué descargables ve cada nivel.</span>';
      footer.prepend(label);
      const links=footer.querySelectorAll('a[href^="#preview/"]');
      if(links[0])links[0].textContent='Compra individual';
      if(links[1])links[1].textContent='Membresía Esencial';
      if(links[2])links[2].textContent='Membresía Premium';
    })
  };
})();
