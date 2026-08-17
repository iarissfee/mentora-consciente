function mcSidebar(active='dashboard'){
  const u=state.me?.user;
  const first=u?.name?.split(' ')[0]||'Alumna';
  return `<aside class="mc-sidebar">
    <a class="mc-side-brand" href="/"><span>Campus</span><strong>Consciente</strong></a>
    <div class="mc-profile"><div class="mc-avatar">${e(first.slice(0,1).toUpperCase())}</div><div><strong>${e(u?.name||'Mi cuenta')}</strong><small>${u?.role==='admin'?'Administración':(state.me?.membership?.plan_name?`Estudiante ${e(state.me.membership.plan_name)}`:'Estudiante')}</small></div></div>
    <nav class="mc-side-nav">
      <a class="${active==='dashboard'?'active':''}" href="#campus"><span>▦</span> Dashboard</a>
      <a class="${active==='courses'?'active':''}" href="#campus"><span>◇</span> Mis Cursos</a>
      <span class="disabled"><span>♧</span> Meditaciones <em>próx.</em></span>
      <span class="disabled"><span>♧</span> Comunidad <em>próx.</em></span>
      <span class="disabled"><span>▣</span> Recursos <em>próx.</em></span>
      ${u?.role==='admin'?'<a class="'+(active==='admin'?'active':'')+'" href="#admin"><span>◉</span> Admin Panel</a>':''}
    </nav>
    <div class="mc-side-bottom"><a class="mc-session-btn" href="/#programas">+ Nueva Sesión</a><button onclick="document.getElementById('auth-button').click()">↪ Cerrar Sesión</button></div>
  </aside>`
}

campusHtml = async function(){
  if(!state.me?.user)return gateHtml();
  const d=await api('/api/my/courses');
  const enriched=await Promise.all(d.courses.map(async c=>{try{const x=await api(`/api/my/course/${encodeURIComponent(c.slug)}`);const total=x.lessons.length,done=x.lessons.filter(l=>l.completed).length;return{...c,total,done,pct:total?Math.round(done*100/total):0}}catch{return{...c,total:0,done:0,pct:0}}}));
  const first=state.me.user.name.split(' ')[0];
  const visible=enriched.slice(0,2);
  const locked=state.catalog.courses.filter(c=>!hasAccess(c)).slice(0,4);
  return `<section class="mc-portal">
    ${mcSidebar('dashboard')}
    <main class="mc-portal-main">
      <header class="mc-welcome"><div><p class="mc-kicker">BIENVENIDA DE NUEVO</p><h1>${e(first)}</h1><p>Tu espacio personal para cultivar claridad, aprendizaje y desarrollo consciente.</p></div><a class="mc-outline-action" href="mailto:${e(state.config.settings?.support_email||'')}?subject=Tutoría Mentora Consciente">▣ Agendar Tutoría</a></header>
      <div class="mc-dashboard-grid">
        <div class="mc-progress-area"><div class="mc-section-row"><h2>Mi Progreso</h2><a href="#campus">Ver todos</a></div>
          ${visible.length?`<div class="mc-progress-cards">${visible.map((c,i)=>`<article class="mc-progress-card"><div class="mc-mini-cover">${c.cover_url?`<img src="${e(c.cover_url)}" alt="">`:`<span>${String(i+1).padStart(2,'0')}</span>`}</div><div class="mc-course-status">${c.pct>0?'En curso':'Pendiente'}</div><h3>${e(c.title)}</h3><p>${e(c.subtitle||c.description||'')}</p><div class="mc-progress-bar"><i style="width:${c.pct}%"></i></div><div class="mc-progress-meta"><span>${c.pct}% Completado</span><span>${c.total?`${Math.max(0,c.total-c.done)} lecciones`:'Listo para empezar'}</span></div><a class="mc-course-cta ${i===0?'light':''}" href="#course/${encodeURIComponent(c.slug)}">${c.pct?'Continuar Lección':'Iniciar Curso'}</a></article>`).join('')}</div>`:`<div class="mc-empty"><h3>Tu campus está listo.</h3><p>Todavía no tenés cursos habilitados.</p><a class="mc-course-cta" href="#memberships">Ver membresías</a></div>`}
          ${enriched[2]?`<a class="mc-horizontal-course" href="#course/${encodeURIComponent(enriched[2].slug)}"><div class="mc-horizontal-thumb"></div><div><h3>${e(enriched[2].title)}</h3><p>${e(enriched[2].subtitle||'Continuá tu recorrido')}</p><small>◷ ${enriched[2].total||'—'} lecciones</small></div><b>▷</b></a>`:''}
        </div>
        <aside class="mc-focus-column"><div class="mc-daily-card"><img src="https://lh3.googleusercontent.com/aida/AP1WRLvGP5eItSrIGiXkzuZdmcEG__33_RacGYiMKz5Uk8IPE3rs0BOx1ZgeIvCnyr9c07KGnFW9CXX3SVw994vbbJ8D7pL-e9sbEQ7guZzOlQUQWvMvj5bmCx683Qsptw63IuxpsPS33pmR0W3cFO-CPz4tOzM6zfa2k_4K9HVZ32jJWCAqDES0KeMnl63uN3NgXE8SyYJUtnO2IB15diakTtgSdXljY4B90UIEpfD9OfdANKKYmxnJYdZrTQe0" alt=""><div><small>INTENCIÓN DIARIA</small><strong>“La pausa no es el vacío, es el espacio donde reside la claridad.”</strong><span>— Mentora Consciente</span></div></div><div class="mc-zen-card"><h3>Acceso Zen Rápido</h3><p>Volvé a tu práctica desde cualquier dispositivo.</p><div class="mc-qr">MC</div><small>MEDITACIÓN · CLARIDAD MATUTINA</small></div></aside>
      </div>
      <section class="mc-next"><h2>Próximos Módulos Abiertos</h2><div class="mc-next-grid">${(locked.length?locked:state.catalog.courses.slice(0,4)).map((c,i)=>`<article><span class="mc-module-icon">${['◉','◈','□','◇'][i%4]}</span><h3>${e(c.title)}</h3><p>${e(c.subtitle||c.description||'Próximo contenido del campus.')}</p><small>${hasAccess(c)?'Disponible ahora':'▢ Se habilita según tu acceso'}</small></article>`).join('')}</div></section>
    </main>
  </section>`
}

courseHtml = async function(slug,previewRank=null){
  if(!state.me?.user)return gateHtml();
  try{
    const suffix=previewRank===null?'':`?previewRank=${previewRank}`;
    const d=await api(`/api/my/course/${encodeURIComponent(slug)}${suffix}`);
    const first=d.lessons[0];
    const done=d.lessons.filter(l=>l.completed).length;
    const pct=d.lessons.length?Math.round(done*100/d.lessons.length):0;
    return `<section class="mc-course-page">
      <div class="mc-course-top"><a class="mc-course-logo" href="/">Mentora Consciente</a><nav><a href="/#programas">Programs</a><a href="/#libreria">Library</a><a href="/#programas">Mentoring</a><a class="active" href="#campus">Campus</a></nav><div><a href="#campus">Mi Campus</a></div></div>
      <div class="mc-course-workspace">
        <aside class="mc-lesson-nav"><h2>${e(d.course.title)}</h2><div class="mc-course-percent"><i style="width:${pct}%"></i></div><small>${pct}% Completado</small><div class="mc-search">⌕ Buscar lección…</div><h4>Módulo · Recorrido</h4>${d.lessons.map((l,i)=>`<button class="mc-lesson-button ${i===0?'active':''}" data-lesson-id="${l.id}"><span>${l.completed?'●':i===0?'◉':'○'}</span><b>${e(l.title)}</b>${l.completed?'<small>Completada</small>':''}</button>`).join('')}</aside>
        <main class="mc-lesson-content"><p class="mc-course-caption">${e(d.course.title)}</p><div id="lesson-main">${first?lessonDetail(first,d.assets):'<div class="mc-empty"><h2>Próximamente</h2><p>Este curso todavía no tiene clases publicadas.</p></div>'}</div></main>
      </div>
      ${d.preview?`<div class="preview-ribbon">Vista previa alumno · nivel ${d.previewRank===0?'sin membresía':d.previewRank===1?'Esencial':d.previewRank===2?'Premium':'administrador'}</div>`:''}
    </section>`
  }catch(x){return `<section class="auth-gate"><h2>Este contenido no está habilitado.</h2><p>${e(x.message)}</p><a class="btn btn-primary" href="#memberships">Ver membresías</a></section>`}
}

lessonDetail = function(l,assets=[]){
  const video=normalizeVideo(l.video_url);
  return `<div class="mc-player">${video?`<iframe src="${e(video)}" title="${e(l.title)}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`:`<div class="mc-player-placeholder"><span>▶</span><small>VIDEO DE LA LECCIÓN</small></div>`}</div>
    <div class="mc-lesson-toolbar"><div><span>♡ Guardar</span><span>↗ Compartir</span></div><label class="mc-complete"><input type="checkbox" data-progress="${l.id}" ${l.completed?'checked':''}> <span>✓ ${l.completed?'Lección completada':'Completar Lección'}</span></label></div>
    <div class="mc-lesson-copy"><h1>${e(l.title)}</h1><p>${e(l.body||'')}</p></div>
    ${assets.length?`<section class="mc-resources"><h2>Recursos Descargables</h2><div class="mc-resource-grid">${assets.map(a=>`<div class="mc-resource ${a.can_download?'':'locked'}"><span class="mc-file-icon">▣</span><div><strong>${e(a.title)}</strong><small>${(a.bytes/1024/1024).toFixed(2)} MB · ${a.required_rank>=2?'Premium':a.required_rank>=1?'Esencial':'Incluido'}</small></div>${a.can_download?`<a href="/api/assets/${a.id}/download">⇩</a>`:'<span>🔒</span>'}</div>`).join('')}</div></section>`:''}`
}

adminHtml = async function(){
  if(state.me?.user?.role!=='admin')return gateHtml();
  const t=state.adminTab;
  return `<section class="mc-portal mc-admin-portal">${mcSidebar('admin')}<main class="mc-portal-main"><header class="mc-admin-head"><div><p class="mc-kicker">GESTIÓN DEL CAMPUS</p><h1>Panel de Administración</h1><p>Gestioná tus cursos, estudiantes y métricas de impacto.</p></div><a class="mc-outline-action" href="#campus">◉ Vista de Estudiante</a></header><div class="admin-tabs mc-admin-tabs"><button data-admin-tab="dashboard" class="${t==='dashboard'?'active':''}">Dashboard</button><button data-admin-tab="students" class="${t==='students'?'active':''}">Estudiantes</button><button data-admin-tab="courses" class="${t==='courses'?'active':''}">Mis Cursos</button><button data-admin-tab="settings" class="${t==='settings'?'active':''}">Ajustes</button></div><div id="admin-content">Cargando…</div></main></section>`
}
