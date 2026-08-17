// Correcciones de navegación admin + previsualización de video.
(function(){
  function adminTabFromHref(href){
    const m=String(href||'').match(/^#admin\/(dashboard|students|courses|community|settings)$/);
    return m?m[1]:null;
  }

  document.addEventListener('click',async ev=>{
    const side=ev.target.closest('.mc-admin-sidebar a[href^="#admin/"]');
    if(side){
      ev.preventDefault();
      const tab=adminTabFromHref(side.getAttribute('href'));
      if(!tab)return;
      state.adminTab=tab;
      history.replaceState(null,'',`#admin/${tab}`);
      await renderRoute();
      return;
    }

    const preview=ev.target.closest('[data-video-preview-url]');
    if(preview){
      ev.preventDefault();
      const raw=preview.dataset.videoPreviewUrl||'';
      const src=normalizeVideo(raw);
      if(!src){toast('Ese enlace de video no es compatible. Usá YouTube o Vimeo.');return}
      let dlg=document.getElementById('admin-video-preview');
      if(!dlg){
        dlg=document.createElement('dialog');
        dlg.id='admin-video-preview';
        dlg.className='mc-video-dialog';
        dlg.innerHTML='<button class="mc-video-close" type="button" aria-label="Cerrar">×</button><div class="mc-video-frame"></div><div class="mc-video-note"><strong>Vista previa de la clase</strong><span>Así lo verá la alumna dentro del campus.</span></div>';
        document.body.appendChild(dlg);
        dlg.querySelector('.mc-video-close').onclick=()=>{dlg.close();dlg.querySelector('.mc-video-frame').innerHTML=''};
        dlg.addEventListener('click',e=>{if(e.target===dlg){dlg.close();dlg.querySelector('.mc-video-frame').innerHTML=''}});
      }
      dlg.querySelector('.mc-video-frame').innerHTML=`<iframe src="${e(src)}" title="Vista previa de video" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      dlg.showModal();
    }
  });

  const originalBindAdminCourses=bindAdminCourses;
  bindAdminCourses=function(d){
    originalBindAdminCourses(d);
    const cards=[...document.querySelectorAll('.mc-manage-course')];
    d.courses.forEach((course,ci)=>{
      const card=cards[ci];
      if(!card)return;
      const lessonRows=[...card.querySelectorAll('.mc-course-block:first-of-type .mc-admin-list-row')];
      course.lessons.forEach((lesson,li)=>{
        if(!lesson.video_url||!lessonRows[li])return;
        const actions=lessonRows[li];
        if(actions.querySelector('[data-video-preview-url]'))return;
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='mini-btn mc-video-preview-btn';
        btn.dataset.videoPreviewUrl=lesson.video_url;
        btn.textContent='▶ Ver video';
        const del=actions.querySelector('[data-delete-lesson]');
        if(del)actions.insertBefore(btn,del);else actions.appendChild(btn);
      });
      card.querySelectorAll('.add-lesson-form').forEach(form=>{
        const video=form.querySelector('input[name="video_url"]');
        if(video&&!form.querySelector('.mc-video-help')){
          const help=document.createElement('small');
          help.className='mc-video-help';
          help.textContent='Recomendado gratis: subí el video a YouTube como “No listado” y pegá acá el enlace.';
          video.insertAdjacentElement('afterend',help);
        }
      });
    });
  };
})();
