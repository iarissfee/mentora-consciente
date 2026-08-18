// Navegación real de alumna: Mi campus, Mis programas y Mis ebooks.
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .mc-student-library{padding-bottom:44px}.mc-student-library .mc-section-row{margin-bottom:20px}
    .mc-student-library-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
    .mc-student-library-card{background:#fff;border:1px solid #ddd8d2;padding:18px;min-width:0}
    .mc-student-library-card img{width:100%;aspect-ratio:3/4;object-fit:cover;background:#f1ede8;display:block}
    .mc-student-library-card .mc-lib-cover-empty{width:100%;aspect-ratio:3/4;background:#f1ede8;display:grid;place-items:center;font-family:"Bodoni Moda",Georgia,serif;font-size:48px;color:#173a27}
    .mc-student-library-card h3{font-family:"Bodoni Moda",Georgia,serif;color:#173a27;font-size:27px;line-height:1.05;margin:15px 0 6px}
    .mc-student-library-card p{color:#6b6965;font-size:13px;min-height:38px}
    .mc-student-library-card .mc-lib-action{display:block;margin-top:14px;background:#173a27;color:#fff;padding:12px;text-align:center;font-weight:700;text-decoration:none}
    .mc-student-library-card .mc-lib-action.disabled{background:#ddd8d2;color:#777;pointer-events:none}
    .mc-student-empty{background:#fff;border:1px solid #ddd8d2;padding:28px}.mc-student-empty h3{font-family:"Bodoni Moda",Georgia,serif;color:#173a27;font-size:30px;margin:0 0 8px}
    @media(max-width:900px){.mc-student-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:560px){.mc-student-library-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const baseSidebar=mcSidebar;
  mcSidebar=function(active='dashboard'){
    let html=baseSidebar(active);
    if(state.me?.user?.role==='admin')return html;
    html=html.replace(/href="#campus"><span>◇<\/span>\s*Mis programas<\/a>/i,'href="#my-programs"><span>◇</span> Mis programas</a>');
    if(!html.includes('#my-ebooks'))html=html.replace(/(<a[^>]*href="#my-programs"[^>]*><span>◇<\/span>\s*Mis programas<\/a>)/i,'$1<a href="#my-ebooks"><span>▣</span> Mis ebooks</a>');
    if(active==='programs'){
      html=html.replace(/class="active" href="#campus"/,'href="#campus"');
      html=html.replace(/<a([^>]*?)href="#my-programs"/i,'<a class="active"$1href="#my-programs"')
    }
    if(active==='ebooks'){
      html=html.replace(/class="active" href="#campus"/,'href="#campus"');
      html=html.replace(/<a([^>]*?)href="#my-ebooks"/i,'<a class="active"$1href="#my-ebooks"')
    }
    return html
  };

  async function studentProgramsHtml(){
    const d=await api('/api/my/courses'),courses=d.courses||[],first=state.me.user.name.split(' ')[0];
    return `<section class="mc-portal">${mcSidebar('programs')}<main class="mc-portal-main mc-student-library"><header class="mc-welcome"><div><p class="mc-kicker">TU BIBLIOTECA</p><h1>Mis programas</h1><p>${e(first)}, acá tenés todos los programas habilitados en tu cuenta.</p></div><a class="mc-outline-action" href="#campus">Volver a Mi campus</a></header><section><div class="mc-section-row"><h2>Programas habilitados</h2><span>${courses.length}</span></div>${courses.length?`<div class="mc-student-library-grid">${courses.map((c,i)=>`<article class="mc-student-library-card"><div class="mc-lib-cover-empty">${String(i+1).padStart(2,'0')}</div><h3>${e(c.title)}</h3><p>${e(c.subtitle||c.description||'Programa de Mentora Consciente')}</p><a class="mc-lib-action" href="#course/${encodeURIComponent(c.slug)}">Entrar al programa</a></article>`).join('')}</div>`:`<div class="mc-student-empty"><h3>Todavía no tenés programas.</h3><p>Cuando compres o te asignen uno, va a aparecer acá.</p><a class="mc-lib-action" href="/">Ver programas</a></div>`}</section></main></section>`
  }

  async function studentEbooksHtml(){
    const d=await api('/api/my/ebooks'),ebooks=d.ebooks||[],first=state.me.user.name.split(' ')[0];
    return `<section class="mc-portal">${mcSidebar('ebooks')}<main class="mc-portal-main mc-student-library"><header class="mc-welcome"><div><p class="mc-kicker">TU BIBLIOTECA</p><h1>Mis ebooks</h1><p>${e(first)}, estos son los ebooks comprados o asignados a tu cuenta.</p></div><a class="mc-outline-action" href="#campus">Volver a Mi campus</a></header><section><div class="mc-section-row"><h2>Ebooks habilitados</h2><span>${ebooks.length}</span></div>${ebooks.length?`<div class="mc-student-library-grid">${ebooks.map((x,i)=>`<article class="mc-student-library-card">${x.cover_url?`<img src="${e(x.cover_url)}" alt="${e(x.title)}">`:`<div class="mc-lib-cover-empty">${String(i+1).padStart(2,'0')}</div>`}<h3>${e(x.title)}</h3><p>${e(x.subtitle||'Ebook Digital')}</p>${x.ready?`<a class="mc-lib-action" href="/api/ebooks/${Number(x.id)}/download">Descargar PDF</a>`:`<span class="mc-lib-action disabled">PDF todavía no cargado</span>`}</article>`).join('')}</div>`:`<div class="mc-student-empty"><h3>Todavía no tenés ebooks.</h3><p>Cuando compres o te asignen uno, va a aparecer acá automáticamente.</p><a class="mc-lib-action" href="/#libreria">Ver ebooks</a></div>`}</section></main></section>`
  }

  const baseRenderRoute=renderRoute;
  renderRoute=async function(){
    const route=(location.hash||'#home').slice(1).split('/')[0];
    if((route==='my-programs'||route==='my-ebooks')&&state.me?.user?.role!=='admin'){
      if(!state.me?.user){location.hash='#home';return}
      try{$('#app').innerHTML=route==='my-programs'?await studentProgramsHtml():await studentEbooksHtml();$('#app').focus({preventScroll:true})}
      catch(x){$('#app').innerHTML=`<section class="auth-gate"><h2>No se pudo abrir tu biblioteca.</h2><p>${e(x.message)}</p><a class="btn btn-primary" href="#campus">Volver a Mi campus</a></section>`}
      return
    }
    return await baseRenderRoute()
  };

  // Refuerzo para navegadores que ya registraron el listener anterior de hashchange.
  window.addEventListener('hashchange',()=>{
    const route=(location.hash||'').slice(1).split('/')[0];
    if(route==='my-programs'||route==='my-ebooks')setTimeout(()=>renderRoute(),0)
  });
})();
