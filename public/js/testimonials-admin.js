// Editor de comentarios del carrusel dentro de Vista de Home y edición.
(function(){
  const baseLoadTestimonials=loadAdminTab;
  loadAdminTab=async function(){
    await baseLoadTestimonials();
    if(state.adminTab!=='home'||state.me?.user?.role!=='admin')return;
    const box=document.getElementById('admin-content');
    if(!box||box.querySelector('#home-testimonials-panel'))return;
    try{
      const d=await api('/api/admin/testimonials');
      const anchor=box.querySelector('#home-main-form')?.closest('.panel');
      if(anchor)anchor.insertAdjacentHTML('afterend',testimonialsPanel(d.testimonials||[]));
      else box.insertAdjacentHTML('afterbegin',testimonialsPanel(d.testimonials||[]));
      bindTestimonialsEditor();
    }catch(x){
      const p=document.createElement('section');p.className='panel';p.id='home-testimonials-panel';p.innerHTML=`<p>${e(x.message)}</p>`;box.prepend(p)
    }
  };

  function rowHtml(x={name:'',role:'',text:''}){return `<div class="mc-testimonial-row" style="border:1px solid #ddd6cf;padding:18px;margin:0 0 14px;background:#fff">
    <div class="form-grid">
      <label>Nombre<input name="testimonial_name" value="${e(x.name||'')}" maxlength="80" placeholder="Ej: Iara"></label>
      <label>Referencia opcional<input name="testimonial_role" value="${e(x.role||'')}" maxlength="100" placeholder="Ej: Alumna de Mentoría Consciente"></label>
      <label style="grid-column:1/-1">Comentario<textarea name="testimonial_text" rows="4" maxlength="700" placeholder="Escribí el comentario que querés mostrar en Home">${e(x.text||'')}</textarea></label>
    </div>
    <button class="mini-btn mc-remove-testimonial" type="button">Eliminar comentario</button>
  </div>`}

  function testimonialsPanel(items){return `<section class="panel" id="home-testimonials-panel">
    <div class="mc-panel-heading"><div><p class="mc-kicker">HOME · COMENTARIOS</p><h3>Historias de Transformación</h3><p>Estos son exactamente los comentarios que pasan en horizontal en Home. Podés editar nombres y textos, agregar nuevos o eliminar los que no quieras.</p></div><a class="mini-btn" href="/#historias" target="_blank" rel="noopener">Ver en Home</a></div>
    <form id="home-testimonials-form">
      <div id="home-testimonials-list">${items.map(rowHtml).join('')}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><button class="mini-btn" id="add-home-testimonial" type="button">+ Agregar comentario</button><button class="btn btn-primary" type="submit">Guardar comentarios</button></div>
      <p class="form-message" id="home-testimonials-message"></p>
    </form>
  </section>`}

  function bindTestimonialsEditor(){
    const form=document.getElementById('home-testimonials-form'),list=document.getElementById('home-testimonials-list'),msg=document.getElementById('home-testimonials-message');if(!form||!list)return;
    const bindRemove=()=>list.querySelectorAll('.mc-remove-testimonial').forEach(b=>b.onclick=()=>{const rows=list.querySelectorAll('.mc-testimonial-row');if(rows.length<=1){toast('Tiene que quedar al menos un comentario.');return}b.closest('.mc-testimonial-row')?.remove()});
    bindRemove();
    const add=document.getElementById('add-home-testimonial');if(add)add.onclick=()=>{if(list.querySelectorAll('.mc-testimonial-row').length>=12){toast('Podés cargar hasta 12 comentarios.');return}list.insertAdjacentHTML('beforeend',rowHtml());bindRemove();list.lastElementChild?.scrollIntoView({behavior:'smooth',block:'center'})};
    form.onsubmit=async ev=>{ev.preventDefault();const items=[...list.querySelectorAll('.mc-testimonial-row')].map(r=>({name:r.querySelector('[name="testimonial_name"]')?.value.trim()||'',role:r.querySelector('[name="testimonial_role"]')?.value.trim()||'',text:r.querySelector('[name="testimonial_text"]')?.value.trim()||''})).filter(x=>x.name&&x.text);if(!items.length){msg.textContent='Agregá al menos un comentario con nombre y texto.';return}msg.textContent='Guardando…';try{await api('/api/admin/testimonials',{method:'PUT',body:{testimonials:items}});msg.textContent='Comentarios guardados. Ya se actualizan en Home.';toast('Comentarios de Home actualizados')}catch(x){msg.textContent=x.message}}
  }
})();
