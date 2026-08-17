// Flujo final de alumnas: sólo programas comprados, sin catálogo ni pantallas intermedias.
(function(){
  campusHtml=async function(){
    if(!state.me?.user)return gateHtml();
    const d=await api('/api/my/courses');
    const first=state.me.user.name.split(' ')[0];
    const enriched=await Promise.all(d.courses.map(async c=>{try{const x=await api(`/api/my/course/${encodeURIComponent(c.slug)}`);const total=x.lessons.length,done=x.lessons.filter(l=>l.completed).length;return{...c,total,done,pct:total?Math.round(done*100/total):0}}catch{return{...c,total:0,done:0,pct:0}}}));
    return `<section class="mc-portal">${mcSidebar('dashboard')}<main class="mc-portal-main"><header class="mc-welcome"><div><p class="mc-kicker">BIENVENIDA</p><h1>${e(first)}</h1><p>Estos son los programas que tenés habilitados en tu cuenta.</p></div><a class="mc-outline-action" href="/">Ver página principal</a></header><section class="mc-progress-area"><div class="mc-section-row"><h2>Mis programas</h2><span>${enriched.length} habilitados</span></div>${enriched.length?`<div class="mc-progress-cards">${enriched.map((c,i)=>`<article class="mc-progress-card"><div class="mc-mini-cover">${c.cover_url?`<img src="${e(c.cover_url)}" alt="">`:`<span>${String(i+1).padStart(2,'0')}</span>`}</div><div class="mc-course-status">${c.pct>0?'En curso':'Listo para empezar'}</div><h3>${e(c.title)}</h3><p>${e(c.subtitle||c.description||'')}</p><div class="mc-progress-bar"><i style="width:${c.pct}%"></i></div><div class="mc-progress-meta"><span>${c.pct}% completado</span><span>${c.total} clases</span></div><a class="mc-course-cta" href="#course/${encodeURIComponent(c.slug)}">${c.pct?'Continuar':'Entrar'}</a></article>`).join('')}</div>`:`<div class="mc-empty"><h3>Todavía no tenés programas habilitados.</h3><p>Elegí uno en la página principal y, cuando el pago quede confirmado, aparecerá acá automáticamente.</p><a class="mc-course-cta" href="/">Ver programas</a></div>`}</section></main></section>`
  };

  courseHtml=async function(slug,previewRank=null){
    if(!state.me?.user)return gateHtml();
    try{
      const suffix=previewRank===null?'':`?previewRank=${previewRank}`;
      const d=await api(`/api/my/course/${encodeURIComponent(slug)}${suffix}`),first=d.lessons[0],done=d.lessons.filter(l=>l.completed).length,pct=d.lessons.length?Math.round(done*100/d.lessons.length):0;
      return `<section class="mc-course-page"><div class="mc-course-top"><a class="mc-course-logo" href="/">Mentora Consciente</a><nav><a href="/">Inicio</a><a class="active" href="#campus">Mi campus</a><a href="#community">Comunidad</a></nav><div><a href="#campus">Mis programas</a></div></div><div class="mc-course-workspace"><aside class="mc-lesson-nav"><h2>${e(d.course.title)}</h2><div class="mc-course-percent"><i style="width:${pct}%"></i></div><small>${pct}% completado</small><div class="mc-search">⌕ Buscar clase…</div><h4>Clases</h4>${d.lessons.map((l,i)=>`<button class="mc-lesson-button ${i===0?'active':''}" data-lesson-id="${l.id}"><span>${l.completed?'●':i===0?'◉':'○'}</span><b>${e(l.title)}</b>${l.completed?'<small>Completada</small>':''}</button>`).join('')}</aside><main class="mc-lesson-content"><p class="mc-course-caption">${e(d.course.title)}</p><div id="lesson-main">${first?lessonDetail(first,d.assets):'<div class="mc-empty"><h2>Próximamente</h2><p>Este programa todavía no tiene clases publicadas.</p></div>'}</div></main></div>${d.preview?'<div class="preview-ribbon">Vista como alumna · así se verá este programa</div>':''}</section>`
    }catch(x){return `<section class="auth-gate"><h2>Este programa no está habilitado.</h2><p>${e(x.message)}</p><a class="btn btn-primary" href="/">Volver al inicio</a></section>`}
  };

  lessonDetail=function(l,assets=[]){
    const source=window.mcVideoSource?window.mcVideoSource(l.video_url):null;
    let player='<div class="mc-player"><div class="mc-player-placeholder"><span>▶</span><small>VIDEO DE LA CLASE</small></div></div>';
    if(source?.kind==='video')player=`<div class="mc-player"><video controls playsinline preload="metadata" src="${e(source.src)}" aria-label="${e(l.title)}"></video></div>`;
    else if(source?.kind==='iframe')player=`<div class="mc-player"><iframe src="${e(source.src)}" title="${e(l.title)}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;
    else{const video=normalizeVideo(l.video_url);if(video)player=`<div class="mc-player"><iframe src="${e(video)}" title="${e(l.title)}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`}
    const lessonAssets=assets.filter(a=>Number(a.lesson_id)===Number(l.id)),generalAssets=assets.filter(a=>!a.lesson_id);
    const resources=(items,title)=>items.length?`<section class="mc-resources"><h2>${title}</h2><div class="mc-resource-grid">${items.map(a=>`<div class="mc-resource ${a.can_download?'':'locked'}"><span class="mc-file-icon">▣</span><div><strong>${e(a.title)}</strong><small>${(a.bytes/1024/1024).toFixed(2)} MB</small></div>${a.can_download?`<a href="/api/assets/${a.id}/download">⇩</a>`:'<span>🔒</span>'}</div>`).join('')}</div></section>`:'';
    return `${player}<div class="mc-lesson-toolbar"><div><span>♡ Guardar</span><span data-mc-share>↗ Compartir</span></div><label class="mc-complete"><input type="checkbox" data-progress="${l.id}" ${l.completed?'checked':''}> <span>✓ ${l.completed?'Clase completada':'Completar clase'}</span></label></div><div class="mc-lesson-copy"><h1>${e(l.title)}</h1><p>${e(l.body||'')}</p></div>${resources(lessonAssets,'Material de esta clase')}${resources(generalAssets,'Recursos generales del programa')}`
  };
})();
