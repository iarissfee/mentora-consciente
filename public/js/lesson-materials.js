// Materiales PDF por clase: muestra únicamente los recursos de la lección actual,
// y mantiene aparte los recursos generales del curso para compatibilidad.
(function(){
  lessonDetail=function(l,assets=[]){
    const video=normalizeVideo(l.video_url);
    const lessonAssets=assets.filter(a=>Number(a.lesson_id)===Number(l.id));
    const generalAssets=assets.filter(a=>!a.lesson_id);
    const resourceRows=(items,label)=>items.length?`<div class="resources"><p class="eyebrow">${label}</p>${items.map(a=>`<div class="resource ${a.can_download?'':'locked'}"><div><strong>${e(a.title)}</strong><small>${(a.bytes/1024/1024).toFixed(2)} MB · ${a.required_rank>=2?'Premium':a.required_rank>=1?'Esencial':'Incluido con el acceso'}</small></div>${a.can_download?`<a class="mini-btn" href="/api/assets/${a.id}/download">Descargar PDF</a>`:'<span class="tag">BLOQUEADO</span>'}</div>`).join('')}</div>`:'';
    return `${video?`<div class="video-box"><iframe src="${e(video)}" title="${e(l.title)}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`:`<div class="video-box"><span>VIDEO / MATERIAL DE CLASE</span></div>`}<p class="eyebrow">CLASE</p><h2>${e(l.title)}</h2><div class="lesson-body">${e(l.body)}</div><div class="lesson-actions"><label><input type="checkbox" data-progress="${l.id}" ${l.completed?'checked':''}> Marcar como completada</label></div>${resourceRows(lessonAssets,'MATERIAL DE ESTA CLASE')}${resourceRows(generalAssets,'RECURSOS GENERALES DEL CURSO')}`
  };
})();
