// Gestión de la Home pública: video principal y programas comprables.
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
    if(state.adminTab==='home')html=html.replace('<h1>Resumen y ventas</h1><p>Mirá cómo viene funcionando tu campus.</p>','<h1>Inicio</h1><p>Gestioná el video principal y los programas que se compran directamente desde la Home.</p>');
    return html
  };

  const baseLoadAdminHome=loadAdminTab;
  loadAdminTab=async function(){
    if(state.adminTab!=='home'){
      await baseLoadAdminHome();
      return
    }
    const box=document.getElementById('admin-content');if(!box)return;
    try{const d=await api('/api/admin/home');box.innerHTML=homeAdminHtml(d);bindHomeAdmin(d)}catch(x){box.innerHTML=`<div class="panel"><p>${e(x.message)}</p></div>`}
  };

  function homeAdminHtml(d){const s=d.settings||{},programs=d.programs||[];return `
    <section class="panel"><div class="mc-panel-heading"><div><p class="mc-kicker">PÁGINA PÚBLICA</p><h3>Video y encabezado de inicio</h3><p>El botón ▶ de la Home reproduce este video.</p></div><a class="mini-btn" href="/" target="_blank" rel="noopener">Ver Home</a></div>
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
    <section class="panel"><div class="mc-panel-heading"><div><p class="mc-kicker">NUEVO PROGRAMA</p><h3>Agregar opción a la Home</h3><p>Al crearla, también se crea automáticamente su espacio de clases, videos y PDFs. La clienta verá un botón Comprar y, después del pago, entrará directamente a ese programa.</p></div></div>
      <form id="new-home-program" class="form-grid">
        <label>Título<input name="title" required maxlength="120" placeholder="Ej: Mentoría Consciente"></label><label>Precio<input name="price" type="number" min="0" step="1" value="0"></label>
        <label>Moneda<select name="currency"><option>EUR</option><option>USD</option></select></label><label>Orden<input name="sort_order" type="number" value="0"></label>
        <label style="grid-column:1/-1">Descripción<textarea name="description" rows="4" maxlength="700" placeholder="Explicá brevemente qué incluye."></textarea></label>
        <label>Estilo<select name="style"><option value="standard">Normal</option><option value="popular">Popular</option><option value="club">Club / oscuro</option></select></label><label>Etiqueta opcional<input name="badge" maxlength="30" placeholder="POPULAR"></label>
        <label><span><input type="checkbox" name="active" checked> Visible en Home</span></label>
        <button class="btn btn-primary" type="submit">+ Crear programa</button>
      </form>
    </section>
    <div class="mc-course-list-heading"><h2>Programas de la Home</h2><span>${programs.length} en total</span></div>
    ${programs.length?programs.map(homeProgramEditor).join(''):'<div class="panel"><p>No hay programas todavía.</p></div>'}`}

  function homeProgramEditor(p){return `<details class="mc-manage-course" open><summary><div><span class="mc-course-state ${p.active?'live':'draft'}">${p.active?'VISIBLE':'OCULTA'}</span><h3>${e(p.title)}</h3><p>${fmtMoney(p.price,p.currency)} · botón Comprar</p></div><span class="mc-open-label">Gestionar ▾</span></summary><div class="mc-manage-body"><form class="form-grid home-program-form" data-home-program="${p.id}"><label>Título<input name="title" value="${e(p.title)}" required></label><label>Precio<input name="price" type="number" min="0" step="1" value="${Number(p.price||0)}"></label><label>Moneda<select name="currency"><option ${p.currency==='EUR'?'selected':''}>EUR</option><option ${p.currency==='USD'?'selected':''}>USD</option></select></label><label>Orden<input name="sort_order" type="number" value="${Number(p.sort_order||0)}"></label><label style="grid-column:1/-1">Descripción<textarea name="description" rows="4">${e(p.description||'')}</textarea></label><label>Estilo<select name="style"><option value="standard" ${p.style==='standard'?'selected':''}>Normal</option><option value="popular" ${p.style==='popular'?'selected':''}>Popular</option><option value="club" ${p.style==='club'?'selected':''}>Club / oscuro</option></select></label><label>Etiqueta<input name="badge" value="${e(p.badge||'')}"></label><label><span><input type="checkbox" name="active" ${p.active?'checked':''}> Visible en Home</span></label><div style="grid-column:1/-1;display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" type="submit">Guardar programa</button><a class="mini-btn" href="#admin/courses">Gestionar clases y PDFs</a><button class="mini-btn mc-delete" type="button" data-delete-home-program="${p.id}">Ocultar de Home</button></div></form></div></details>`}

  function bindHomeAdmin(){
    const main=document.getElementById('home-main-form');if(main)main.onsubmit=async ev=>{ev.preventDefault();const f=new FormData(main);try{await api('/api/admin/home',{method:'PUT',body:{hero_title:f.get('hero_title'),hero_text:f.get('hero_text'),video_url:f.get('video_url'),video_poster:f.get('video_poster'),programs_title:f.get('programs_title'),programs_text:f.get('programs_text')}});toast('Inicio actualizado')}catch(x){toast(x.message)}};
    const nf=document.getElementById('new-home-program');if(nf)nf.onsubmit=async ev=>{ev.preventDefault();const f=new FormData(nf);try{await api('/api/admin/home/programs',{method:'POST',body:formProgram(f)});await reloadCatalog();toast('Programa creado. Ya podés cargar sus clases y PDFs.');loadAdminTab()}catch(x){toast(x.message)}};
    document.querySelectorAll('.home-program-form').forEach(form=>form.onsubmit=async ev=>{ev.preventDefault();const f=new FormData(form);try{await api(`/api/admin/home/programs/${form.dataset.homeProgram}`,{method:'PUT',body:formProgram(f)});await reloadCatalog();toast('Programa actualizado');loadAdminTab()}catch(x){toast(x.message)}});
    document.querySelectorAll('[data-delete-home-program]').forEach(b=>b.onclick=async()=>{if(!confirm('¿Ocultar este programa de la Home? Las alumnas que ya lo compraron conservarán su acceso.'))return;try{await api(`/api/admin/home/programs/${b.dataset.deleteHomeProgram}`,{method:'DELETE'});toast('Programa ocultado de la Home');loadAdminTab()}catch(x){toast(x.message)}})
  }
  function formProgram(f){return{title:f.get('title'),description:f.get('description'),price:Number(f.get('price')),currency:f.get('currency'),badge:f.get('badge'),style:f.get('style'),active:!!f.get('active'),sort_order:Number(f.get('sort_order'))}}
})();
