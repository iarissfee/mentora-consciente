// Gestión de la Home pública: video principal y tarjetas de Programas.
(function(){
  const baseAdminHtmlHome=adminHtml;
  adminHtml=async function(){
    let html=await baseAdminHtmlHome();
    if(state.me?.user?.role!=='admin')return html;
    const active=state.adminTab==='home'?'active':'';
    const side=`<a class="${active}" href="#admin/home"><span>⌂</span> Inicio</a>`;
    const tab=`<button data-admin-tab="home" class="${active}">Inicio</button>`;
    html=html.replace(/(<a class="[^"]*" href="#admin\/community"><span>♧<\/span> Comunidad<\/a>)/,side+'$1');
    html=html.replace(/(<button data-admin-tab="community"[^>]*>Comunidad<\/button>)/,tab+'$1');
    if(state.adminTab==='home')html=html.replace('<h1>Resumen y ventas</h1><p>Mirá cómo viene funcionando tu campus.</p>','<h1>Inicio</h1><p>Gestioná el video principal y las tarjetas de Programas de la página pública.</p>');
    return html
  };

  const baseLoadAdminHome=loadAdminTab;
  loadAdminTab=async function(){
    if(state.adminTab!=='home'){
      await baseLoadAdminHome();
      if(state.adminTab==='dashboard'){
        const quick=document.querySelector('.mc-admin-quick');
        if(quick&&!quick.querySelector('[href="#admin/home"]'))quick.insertAdjacentHTML('beforeend','<a href="#admin/home"><strong>Gestionar Inicio</strong><span>Video principal y tarjetas de Programas</span></a>')
      }
      return
    }
    const box=document.getElementById('admin-content');if(!box)return;
    try{const d=await api('/api/admin/home');box.innerHTML=homeAdminHtml(d);bindHomeAdmin(d)}catch(x){box.innerHTML=`<div class="panel"><p>${e(x.message)}</p></div>`}
  };

  function productOptions(selected=''){
    const options=[`<option value="/campus.html#courses" ${!selected||selected==='/campus.html#courses'||selected.includes('#memberships')?'selected':''}>Catálogo de cursos (sin producto asociado)</option>`];
    for(const c of state.catalog.courses||[])options.push(`<option value="/campus.html#buy/course/${c.id}" ${selected===`/campus.html#buy/course/${c.id}`?'selected':''}>Curso · ${e(c.title)} · ${fmtMoney(c.price,c.currency)}</option>`);
    for(const p of state.catalog.plans||[])options.push(`<option value="/campus.html#buy/plan/${p.id}" ${selected===`/campus.html#buy/plan/${p.id}`?'selected':''}>Membresía · ${e(p.name)} · ${fmtMoney(p.price,p.currency)}</option>`);
    return options.join('')
  }

  function homeAdminHtml(d){const s=d.settings||{},programs=d.programs||[];return `
    <section class="panel"><div class="mc-panel-heading"><div><p class="mc-kicker">PÁGINA PÚBLICA</p><h3>Video y encabezado de inicio</h3><p>El botón ▶ de la Home reproduce este video. Ya no lleva a Administración.</p></div><a class="mini-btn" href="/" target="_blank" rel="noopener">Ver Home</a></div>
      <form id="home-main-form" class="form-grid">
        <label>Título principal<input name="hero_title" value="${e(s.hero_title||'')}" maxlength="120"></label>
        <label style="grid-column:1/-1">Texto principal<textarea name="hero_text" rows="3" maxlength="500">${e(s.hero_text||'')}</textarea></label>
        <label style="grid-column:1/-1">Video de inicio<input name="video_url" type="url" value="${e(s.video_url||'')}" placeholder="YouTube, Vimeo, R2/MP4 o proveedor compatible"></label>
        <label style="grid-column:1/-1">Imagen de portada del video<input name="video_poster" type="url" value="${e(s.video_poster||'')}" placeholder="https://..."></label>
        <label>Título de la sección Programas<input name="programs_title" value="${e(s.programs_title||'Programas')}" maxlength="100"></label>
        <label style="grid-column:1/-1">Texto de la sección Programas<textarea name="programs_text" rows="2" maxlength="500">${e(s.programs_text||'')}</textarea></label>
        <button class="btn btn-primary" type="submit">Guardar Inicio</button>
      </form>
    </section>
    <section class="panel"><div class="mc-panel-heading"><div><p class="mc-kicker">NUEVA TARJETA</p><h3>Agregar programa o mentoría</h3><p>En la Home se verá primero una previsualización. Desde esa ficha la clienta continúa al producto exacto que asocies acá.</p></div></div>
      <form id="new-home-program" class="form-grid">
        <label>Título<input name="title" required maxlength="120" placeholder="Ej: Mentoría Consciente"></label><label>Precio<input name="price" type="number" min="0" step="1" value="0"></label>
        <label>Moneda<select name="currency"><option>EUR</option><option>USD</option></select></label><label>Orden<input name="sort_order" type="number" value="0"></label>
        <label style="grid-column:1/-1">Descripción para la previsualización<textarea name="description" rows="4" maxlength="700" placeholder="Explicá qué incluye, para quién es y qué va a encontrar la clienta."></textarea></label>
        <label>Botón final de la ficha<input name="button_label" value="Continuar" maxlength="80"></label><label>Estilo<select name="style"><option value="standard">Normal</option><option value="popular">Popular</option><option value="club">Club / oscuro</option></select></label>
        <label style="grid-column:1/-1">Producto que compra al continuar<select name="product_target">${productOptions('')}</select></label>
        <label>Etiqueta opcional<input name="badge" maxlength="30" placeholder="POPULAR"></label><label><span><input type="checkbox" name="active" checked> Visible en Home</span></label>
        <button class="btn btn-primary" type="submit">+ Agregar tarjeta</button>
      </form>
    </section>
    <div class="mc-course-list-heading"><h2>Tarjetas de la Home</h2><span>${programs.length} en total</span></div>
    ${programs.length?programs.map(homeProgramEditor).join(''):'<div class="panel"><p>No hay tarjetas todavía.</p></div>'}`}

  function homeProgramEditor(p){return `<details class="mc-manage-course" open><summary><div><span class="mc-course-state ${p.active?'live':'draft'}">${p.active?'VISIBLE':'OCULTA'}</span><h3>${e(p.title)}</h3><p>${fmtMoney(p.price,p.currency)} · orden ${Number(p.sort_order||0)}</p></div><span class="mc-open-label">Gestionar ▾</span></summary><div class="mc-manage-body"><form class="form-grid home-program-form" data-home-program="${p.id}"><label>Título<input name="title" value="${e(p.title)}" required></label><label>Precio<input name="price" type="number" min="0" step="1" value="${Number(p.price||0)}"></label><label>Moneda<select name="currency"><option ${p.currency==='EUR'?'selected':''}>EUR</option><option ${p.currency==='USD'?'selected':''}>USD</option></select></label><label>Orden<input name="sort_order" type="number" value="${Number(p.sort_order||0)}"></label><label style="grid-column:1/-1">Descripción de la previsualización<textarea name="description" rows="4">${e(p.description||'')}</textarea></label><label>Botón final<input name="button_label" value="${e(p.button_label||'Continuar')}"></label><label>Estilo<select name="style"><option value="standard" ${p.style==='standard'?'selected':''}>Normal</option><option value="popular" ${p.style==='popular'?'selected':''}>Popular</option><option value="club" ${p.style==='club'?'selected':''}>Club / oscuro</option></select></label><label style="grid-column:1/-1">Producto asociado<select name="product_target">${productOptions(p.target_url||'')}</select></label><label>Etiqueta<input name="badge" value="${e(p.badge||'')}"></label><label><span><input type="checkbox" name="active" ${p.active?'checked':''}> Visible en Home</span></label><button class="btn btn-primary" type="submit">Guardar tarjeta</button><button class="mini-btn mc-delete" type="button" data-delete-home-program="${p.id}">Eliminar tarjeta</button></form></div></details>`}

  function bindHomeAdmin(){
    const main=document.getElementById('home-main-form');if(main)main.onsubmit=async ev=>{ev.preventDefault();const f=new FormData(main);try{await api('/api/admin/home',{method:'PUT',body:{hero_title:f.get('hero_title'),hero_text:f.get('hero_text'),video_url:f.get('video_url'),video_poster:f.get('video_poster'),programs_title:f.get('programs_title'),programs_text:f.get('programs_text')}});toast('Inicio actualizado')}catch(x){toast(x.message)}};
    const nf=document.getElementById('new-home-program');if(nf)nf.onsubmit=async ev=>{ev.preventDefault();const f=new FormData(nf);try{await api('/api/admin/home/programs',{method:'POST',body:formProgram(f)});toast('Tarjeta agregada');loadAdminTab()}catch(x){toast(x.message)}};
    document.querySelectorAll('.home-program-form').forEach(form=>form.onsubmit=async ev=>{ev.preventDefault();const f=new FormData(form);try{await api(`/api/admin/home/programs/${form.dataset.homeProgram}`,{method:'PUT',body:formProgram(f)});toast('Tarjeta actualizada');loadAdminTab()}catch(x){toast(x.message)}});
    document.querySelectorAll('[data-delete-home-program]').forEach(b=>b.onclick=async()=>{if(!confirm('¿Eliminar esta tarjeta de la Home?'))return;try{await api(`/api/admin/home/programs/${b.dataset.deleteHomeProgram}`,{method:'DELETE'});toast('Tarjeta eliminada');loadAdminTab()}catch(x){toast(x.message)}})
  }
  function formProgram(f){return{title:f.get('title'),description:f.get('description'),price:Number(f.get('price')),currency:f.get('currency'),button_label:f.get('button_label'),target_url:f.get('product_target')||'/campus.html#courses',badge:f.get('badge'),style:f.get('style'),active:!!f.get('active'),sort_order:Number(f.get('sort_order'))}}
})();
