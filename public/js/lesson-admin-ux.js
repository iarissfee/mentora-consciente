// Edición completa de clases desde Administración.
(function(){
  const previousBindAdminCourses=bindAdminCourses;
  bindAdminCourses=function(d){
    previousBindAdminCourses(d);
    const cards=[...document.querySelectorAll('.mc-manage-course')];
    d.courses.forEach((course,ci)=>{
      const card=cards[ci];if(!card)return;
      const rows=[...card.querySelectorAll('.mc-course-block:first-of-type .mc-admin-list-row')];
      course.lessons.forEach((lesson,li)=>{
        const row=rows[li];if(!row||row.querySelector('[data-edit-lesson]'))return;
        const btn=document.createElement('button');
        btn.type='button';btn.className='mini-btn';btn.dataset.editLesson=String(lesson.id);btn.textContent='Editar';
        btn.onclick=()=>openLessonEditor(lesson);
        const del=row.querySelector('[data-delete-lesson]');if(del)row.insertBefore(btn,del);else row.appendChild(btn)
      })
    })
  };

  function openLessonEditor(lesson){
    let dlg=document.getElementById('lesson-editor-dialog');
    if(!dlg){dlg=document.createElement('dialog');dlg.id='lesson-editor-dialog';dlg.className='mc-lesson-editor-dialog';document.body.appendChild(dlg)}
    dlg.innerHTML=`<button class="mc-video-close" type="button" aria-label="Cerrar">×</button><form id="lesson-editor-form" class="form-stack"><div><p class="mc-kicker">EDITAR CLASE</p><h3>${e(lesson.title)}</h3></div><label>Título<input name="title" value="${e(lesson.title)}" maxlength="140" required></label><label>Texto de la clase<textarea name="body" rows="6" maxlength="6000">${e(lesson.body||'')}</textarea></label><label>Video<input name="video_url" type="url" value="${e(lesson.video_url||'')}" placeholder="YouTube, Vimeo, Flowplayer/Wowza o R2/MP4"></label><label>Orden<input name="sort_order" type="number" value="${Number(lesson.sort_order||0)}"></label><label><span><input name="published" type="checkbox" ${lesson.published?'checked':''}> Publicada para alumnas</span></label><div class="mc-lesson-editor-actions">${lesson.video_url?`<button type="button" class="mini-btn" data-video-preview-url="${e(lesson.video_url)}">▶ Ver video</button>`:''}<button class="btn btn-primary" type="submit">Guardar clase</button></div></form>`;
    dlg.querySelector('.mc-video-close').onclick=()=>dlg.close();
    const form=dlg.querySelector('#lesson-editor-form');
    form.onsubmit=async ev=>{ev.preventDefault();const f=new FormData(form);try{await api(`/api/admin/lessons/${lesson.id}`,{method:'PUT',body:{title:f.get('title'),body:f.get('body'),video_url:f.get('video_url'),sort_order:Number(f.get('sort_order')),published:!!f.get('published')}});dlg.close();toast('Clase actualizada');loadAdminTab()}catch(x){toast(x.message)}};
    dlg.showModal()
  }
})();
