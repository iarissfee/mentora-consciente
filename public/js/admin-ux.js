const previousAdminLoadTab = loadAdminTab;
const previousAdminBindCourses = bindAdminCourses;

mcSidebar=function(active='dashboard'){
  const u=state.me?.user,first=u?.name?.split(' ')[0]||'Cuenta';
  if(u?.role==='admin'){
    return `<aside class="mc-sidebar mc-admin-sidebar">
      <a class="mc-side-brand" href="/"><span>Mentora</span><strong>Consciente</strong></a>
      <div class="mc-profile"><div class="mc-avatar">${e(first.slice(0,1).toUpperCase())}</div><div><strong>${e(u.name)}</strong><small>Administración</small></div></div>
      <nav class="mc-side-nav">
        <a class="${state.adminTab==='dashboard'?'active':''}" href="#admin/dashboard"><span>▦</span> Resumen y ventas</a>
        <a class="${state.adminTab==='students'?'active':''}" href="#admin/students"><span>♙</span> Alumnas</a>
        <a class="${state.adminTab==='courses'?'active':''}" href="#admin/courses"><span>◇</span> Programas</a>
        <a class="${state.adminTab==='community'?'active':''}" href="#admin/community"><span>♧</span> Comunidad</a>
        <a class="${state.adminTab==='settings'?'active':''}" href="#admin/settings"><span>⚙</span> Ajustes</a>
      </nav>
      <div class="mc-side-bottom"><a class="mc-session-btn" href="/">Ver página pública</a><button>↪ Cerrar Sesión</button></div>
    </aside>`
  }
  return `<aside class="mc-sidebar"><a class="mc-side-brand" href="/"><span>Campus</span><strong>Consciente</strong></a><div class="mc-profile"><div class="mc-avatar">${e(first.slice(0,1).toUpperCase())}</div><div><strong>${e(u?.name||'Mi cuenta')}</strong><small>Alumna</small></div></div><nav class="mc-side-nav"><a class="${active==='dashboard'?'active':''}" href="#campus"><span>▦</span> Mi campus</a><a href="#campus"><span>◇</span> Mis programas</a><a class="${active==='community'?'active':''}" href="#community"><span>♧</span> Comunidad</a></nav><div class="mc-side-bottom"><a class="mc-session-btn" href="/">Ver programas</a><button>↪ Cerrar Sesión</button></div></aside>`
};

adminHtml=async function(){
  if(state.me?.user?.role!=='admin')return gateHtml();
  const t=state.adminTab;
  const titles={dashboard:['Resumen y ventas','Mirá cómo viene funcionando tu campus.'],students:['Alumnas','Gestioná los accesos de cada alumna.'],courses:['Programas y contenidos','Gestioná las opciones que aparecen en la Home: clases, videos, precios y PDFs.'],community:['Comunidad','Publicá como mentora y moderá las publicaciones.'],settings:['Ajustes','Configurá textos y estado de pagos.']};
  const [title,sub]=titles[t]||titles.dashboard;
  return `<section class="mc-portal mc-admin-portal">${mcSidebar('admin')}<main class="mc-portal-main mc-admin-main"><header class="mc-admin-head"><div><p class="mc-kicker">PANEL DE CONTROL</p><h1>${e(title)}</h1><p>${e(sub)}</p></div>${t==='courses'?'<a class="mc-primary-action" href="#admin/home">+ Crear programa</a>':'<a class="mc-outline-action" href="/">Ver página pública</a>'}</header><div class="admin-tabs mc-admin-tabs"><button data-admin-tab="dashboard" class="${t==='dashboard'?'active':''}">Resumen</button><button data-admin-tab="students" class="${t==='students'?'active':''}">Alumnas</button><button data-admin-tab="courses" class="${t==='courses'?'active':''}">Programas</button><button data-admin-tab="community" class="${t==='community'?'active':''}">Comunidad</button><button data-admin-tab="settings" class="${t==='settings'?'active':''}">Ajustes</button></div><div id="admin-content">Cargando…</div></main></section>`
};

adminCoursesHtml=function(d){
  const intro=`<section class="panel mc-create-course"><div class="mc-panel-heading"><div><p class="mc-kicker">CONTENIDO DE LA HOME</p><h3>Gestioná tus programas</h3><p>Cada programa de esta pantalla corresponde a una tarjeta de la Home. Para agregar uno nuevo, crealo desde Inicio; automáticamente aparecerá acá para cargar clases, videos y materiales.</p></div><a class="btn btn-primary" href="#admin/home">+ Crear programa en Inicio</a></div></section>`;
  const list=d.courses.length?d.courses.map(c=>`<details class="mc-manage-course" open><summary><div><span class="mc-course-state ${c.published?'live':'draft'}">${c.published?'PUBLICADO':'BORRADOR'}</span><h3>${e(c.title)}</h3><p>${fmtMoney(c.price,c.currency)} · ${c.lessons.length} clases · ${c.assets.length} PDFs</p></div><span class="mc-open-label">Gestionar ▾</span></summary><div class="mc-manage-body"><form class="form-grid edit-course-form" data-course-id="${c.id}"><h4 class="mc-form-title">Datos del programa</h4><label>Título<input name="title" value="${e(c.title)}" required></label><label>URL<input name="slug" value="${e(c.slug)}" required></label><label>Precio<input type="number" min="0" step="1" name="price" value="${c.price}"></label><label>Moneda<select name="currency"><option value="USD" ${c.currency==='USD'?'selected':''}>USD</option><option value="EUR" ${c.currency==='EUR'?'selected':''}>EUR</option></select></label><label>Orden<input type="number" name="sort_order" value="${c.sort_order||0}"></label><label><span><input type="checkbox" name="published" ${c.published?'checked':''}> Publicado</span></label><label style="grid-column:1/-1">Subtítulo<input name="subtitle" value="${e(c.subtitle||'')}"></label><label style="grid-column:1/-1">Descripción<textarea name="description" rows="3">${e(c.description||'')}</textarea></label><label style="grid-column:1/-1">Portada (URL)<input name="cover_url" value="${e(c.cover_url||'')}"></label><button class="btn btn-primary" type="submit">Guardar cambios</button></form><div class="mc-content-columns"><section class="mc-course-block"><div class="mc-block-title"><h4>Clases</h4><span>${c.lessons.length}</span></div>${c.lessons.length?c.lessons.map((l,i)=>`<div class="mc-admin-list-row"><div><b>${i+1}. ${e(l.title)}</b><small>${l.video_url?'Video cargado':'Sin video todavía'}</small></div><button class="mini-btn mc-delete" data-delete-lesson="${l.id}">Eliminar</button></div>`).join(''):'<p class="mc-empty-note">Todavía no agregaste clases.</p>'}<form class="form-stack add-lesson-form mc-add-box" data-course-id="${c.id}"><h5>+ Agregar clase</h5><label>Título<input name="title" placeholder="Ej: Introducción" required></label><label>Texto de la clase<textarea name="body" rows="3"></textarea></label><label>Video<input name="video_url" placeholder="YouTube, Vimeo, Flowplayer/Wowza o R2"></label><button class="mini-btn mc-strong-btn" type="submit">Agregar clase</button></form></section><section class="mc-course-block"><div class="mc-block-title"><h4>Materiales PDF</h4><span>${c.assets.length}</span></div>${c.assets.length?c.assets.map(a=>{const lesson=c.lessons.find(l=>Number(l.id)===Number(a.lesson_id));return`<div class="mc-admin-list-row"><div><b>${e(a.title)}</b><small>${lesson?`Clase: ${e(lesson.title)}`:'Recurso general'} · ${(a.bytes/1024/1024).toFixed(2)} MB</small></div><button class="mini-btn mc-delete" data-delete-asset="${a.id}">Eliminar</button></div>`}).join(''):'<p class="mc-empty-note">Todavía no subiste PDFs.</p>'}<form class="form-stack upload-pdf-form mc-add-box" data-course-id="${c.id}"><h5>+ Agregar material PDF</h5><label>Nombre<input name="title" placeholder="Ej: Guía de ejercicios"></label><label>Archivo PDF<input type="file" name="pdf" accept="application/pdf,.pdf" required></label><input type="hidden" name="required_rank" value="0"><button class="mini-btn mc-strong-btn" type="submit">Subir PDF</button></form></section></div><div class="mc-course-footer-actions"><a class="mini-btn" href="#preview/${encodeURIComponent(c.slug)}/0">Vista como alumna</a></div></div></details>`).join(''):`<div class="panel"><p>No hay programas todavía. Creá el primero desde <a href="#admin/home"><strong>Inicio</strong></a>.</p></div>`;
  return intro+`<div class="mc-course-list-heading"><h2>Tus programas</h2><span>${d.courses.length} en total</span></div>`+list
};

bindAdminCourses=function(d){
  previousAdminBindCourses(d);
  $$('.edit-course-form').forEach(form=>form.onsubmit=async ev=>{ev.preventDefault();const fd=new FormData(form);try{await api(`/api/admin/courses/${form.dataset.courseId}`,{method:'PUT',body:{title:fd.get('title'),slug:fd.get('slug'),price:Number(fd.get('price')),currency:fd.get('currency'),required_rank:0,allow_direct_purchase:true,sort_order:Number(fd.get('sort_order')),subtitle:fd.get('subtitle'),description:fd.get('description'),cover_url:fd.get('cover_url'),published:!!fd.get('published')}});await reloadCatalog();toast('Programa actualizado');loadAdminTab()}catch(x){toast(x.message)}})
};

loadAdminTab=async function(){
  await previousAdminLoadTab();
  const box=$('#admin-content');if(!box)return;
  if(state.adminTab==='dashboard'){
    box.insertAdjacentHTML('afterbegin',`<div class="mc-admin-quick"><a href="#admin/home"><strong>+ Crear o editar programa</strong><span>Las opciones que aparecen en la Home</span></a><a href="#admin/courses"><strong>Clases y materiales</strong><span>Videos, PDFs y vista como alumna</span></a><a href="#admin/students"><strong>Ver alumnas</strong><span>Accesos habilitados</span></a><a href="#admin/community"><strong>Gestionar comunidad</strong><span>Posts y moderación</span></a></div>`)
  }
};
