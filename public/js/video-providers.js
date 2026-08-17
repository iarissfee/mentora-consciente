(()=>{
  const adminTabs=new Set(['dashboard','students','courses','community','settings']);

  function youtubeId(u){
    if(u.hostname==='youtu.be')return u.pathname.split('/').filter(Boolean)[0]||'';
    if(u.hostname.includes('youtube.com')){
      if(u.pathname.startsWith('/embed/'))return u.pathname.split('/')[2]||'';
      if(u.pathname.startsWith('/shorts/'))return u.pathname.split('/')[2]||'';
      return u.searchParams.get('v')||'';
    }
    return '';
  }
  function resolveVideoSource(raw){
    const value=String(raw||'').trim();if(!value)return null;
    try{
      const u=new URL(value);if(u.protocol!=='https:'&&u.protocol!=='http:')return null;
      const yid=youtubeId(u);if(yid)return{kind:'iframe',src:`https://www.youtube-nocookie.com/embed/${encodeURIComponent(yid)}`,provider:'YouTube'};
      if(u.hostname.includes('vimeo.com')){
        if(u.hostname==='player.vimeo.com')return{kind:'iframe',src:value,provider:'Vimeo'};
        const id=u.pathname.split('/').filter(Boolean).findLast?.(x=>/^\d+$/.test(x))||u.pathname.split('/').filter(Boolean).reverse().find(x=>/^\d+$/.test(x));
        if(id)return{kind:'iframe',src:`https://player.vimeo.com/video/${encodeURIComponent(id)}`,provider:'Vimeo'};
      }
      if(/(^|\.)flowplayer\.com$/i.test(u.hostname)||/(^|\.)flowplayer\.org$/i.test(u.hostname)||/(^|\.)wowza\.com$/i.test(u.hostname))return{kind:'iframe',src:value,provider:'Flowplayer / Wowza'};
      if(/\.(mp4|webm)(?:$|\?)/i.test(value)||u.hostname.endsWith('.r2.dev')||u.hostname.includes('.r2.cloudflarestorage.com'))return{kind:'video',src:value,provider:'Cloudflare R2 / MP4'};
    }catch{}
    return null;
  }
  window.mcResolveVideoSource=resolveVideoSource;

  normalizeVideo=function(url){const s=resolveVideoSource(url);return s?.kind==='iframe'?s.src:''};

  const currentLessonDetail=lessonDetail;
  lessonDetail=function(l,assets=[]){
    const s=resolveVideoSource(l.video_url);
    if(!s||s.kind!=='video')return currentLessonDetail(l,assets);
    const base=currentLessonDetail({...l,video_url:''},assets);
    const player=`<div class="mc-player"><video controls playsinline preload="metadata" src="${e(s.src)}" aria-label="${e(l.title)}"></video></div>`;
    return base.replace(/<div class="mc-player"><div class="mc-player-placeholder">[\s\S]*?<\/div><\/div>/,player);
  };

  const currentAdminCoursesHtml=adminCoursesHtml;
  adminCoursesHtml=function(d){
    const html=currentAdminCoursesHtml(d);
    const doc=new DOMParser().parseFromString(`<div id="mc-root">${html}</div>`,'text/html');
    const root=doc.getElementById('mc-root');
    const details=[...root.querySelectorAll('.mc-manage-course')];
    details.forEach((detail,ci)=>{
      const course=d.courses[ci];if(!course)return;
      const form=detail.querySelector('.add-lesson-form');
      if(form){
        const videoInput=form.querySelector('input[name="video_url"]');
        if(videoInput){
          const oldLabel=videoInput.closest('label');
          oldLabel.childNodes[0].textContent='Enlace del video ';
          videoInput.placeholder='Pegá acá el enlace del video';
          const provider=document.createElement('label');
          provider.className='mc-video-provider-label';
          provider.innerHTML=`Plataforma de video<select name="video_provider" class="mc-video-provider"><option value="youtube">YouTube</option><option value="vimeo">Vimeo</option><option value="flowplayer">Flowplayer / Wowza</option><option value="r2">Cloudflare R2 / MP4</option></select><small class="mc-provider-help">Elegí dónde está alojado el video. El curso guarda el enlace y lo reproduce dentro del campus.</small>`;
          form.insertBefore(provider,oldLabel);
        }
      }
      const lessonRows=[...detail.querySelectorAll('.mc-course-block:first-of-type .mc-admin-list-row')];
      lessonRows.forEach((row,li)=>{
        const lesson=course.lessons[li];if(!lesson?.video_url)return;
        const actions=row.querySelector('button')?.parentElement===row?row:row;
        const btn=document.createElement('button');btn.type='button';btn.className='mini-btn mc-preview-video';btn.dataset.videoPreview=lesson.video_url;btn.dataset.videoTitle=lesson.title;btn.textContent='▶ Ver video';
        const del=row.querySelector('[data-delete-lesson]');if(del)row.insertBefore(btn,del);else actions.appendChild(btn);
      });
    });
    return root.innerHTML;
  };

  function ensurePreviewDialog(){
    let d=document.getElementById('mc-video-preview-dialog');if(d)return d;
    d=document.createElement('dialog');d.id='mc-video-preview-dialog';d.className='mc-video-preview-dialog';
    d.innerHTML=`<button type="button" class="mc-video-close" aria-label="Cerrar">×</button><div class="mc-video-preview-head"><small>PREVISUALIZACIÓN</small><h3 id="mc-video-preview-title">Video</h3></div><div id="mc-video-preview-stage"></div><p id="mc-video-preview-provider"></p>`;
    document.body.appendChild(d);d.querySelector('.mc-video-close').onclick=()=>d.close();d.addEventListener('close',()=>{d.querySelector('#mc-video-preview-stage').innerHTML='' });return d;
  }
  function openPreview(raw,title){
    const s=resolveVideoSource(raw);if(!s){toast('Ese enlace de video no es compatible todavía.');return}
    const d=ensurePreviewDialog(),stage=d.querySelector('#mc-video-preview-stage');d.querySelector('#mc-video-preview-title').textContent=title||'Video';d.querySelector('#mc-video-preview-provider').textContent=`Fuente: ${s.provider}`;
    stage.innerHTML=s.kind==='video'?`<video controls autoplay playsinline src="${e(s.src)}"></video>`:`<iframe src="${e(s.src)}" title="${e(title||'Video')}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    d.showModal();
  }

  document.addEventListener('change',ev=>{
    const select=ev.target.closest('.mc-video-provider');if(!select)return;
    const form=select.closest('.add-lesson-form'),input=form?.querySelector('input[name="video_url"]'),help=form?.querySelector('.mc-provider-help');if(!input)return;
    const map={youtube:['https://youtu.be/...','Gratis: usá un video público o no listado.'],vimeo:['https://vimeo.com/...','Pegá el enlace del video de Vimeo.'],flowplayer:['https://...flowplayer...','Pegá la URL de reproducción/iframe de Flowplayer o Wowza.'],r2:['https://.../clase.mp4','Pegá la URL HTTPS del MP4 guardado en Cloudflare R2.']};const [ph,txt]=map[select.value]||map.youtube;input.placeholder=ph;if(help)help.textContent=txt;
  });

  document.addEventListener('click',ev=>{
    const preview=ev.target.closest('[data-video-preview]');if(preview){ev.preventDefault();openPreview(preview.dataset.videoPreview,preview.dataset.videoTitle);return}
    const link=ev.target.closest('.mc-admin-sidebar a[href^="#admin/"]');if(!link)return;
    ev.preventDefault();const tab=(link.getAttribute('href').split('/')[1]||'dashboard');if(!adminTabs.has(tab))return;
    state.adminTab=tab;history.replaceState(null,'',`#admin/${tab}`);renderRoute();
  });
})();