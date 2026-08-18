// Comunidad privada: sólo para alumnas con acceso directo al programa Club de Alumnos.
(function(){
  function communityCourse(){
    const courses=state.catalog?.courses||[];
    return courses.find(c=>/club/.test(`${c.slug||''} ${c.title||''}`.toLowerCase()))||null;
  }
  function hasCommunityAccess(){
    if(state.me?.user?.role==='admin')return true;
    const club=communityCourse();
    if(!club)return false;
    return (state.me?.directCourseIds||[]).some(id=>Number(id)===Number(club.id));
  }

  const previousSidebar=mcSidebar;
  mcSidebar=function(active='dashboard'){
    const html=previousSidebar(active);
    if(hasCommunityAccess())return html;
    return html.replace(/<a([^>]*?)href="#community"([^>]*)><span>♧<\/span>\s*Comunidad<\/a>/i,'<span class="disabled"><span>♧</span> Comunidad <em>requiere Club</em></span>');
  };

  const previousCommunityHtml=communityHtml;
  communityHtml=async function(){
    if(!state.me?.user)return gateHtml();
    if(state.me.user.role!=='admin'){
      try{await refreshMe()}catch{}
      if(!hasCommunityAccess()){
        return `<section class="auth-gate"><p class="eyebrow">COMUNIDAD PRIVADA</p><h2>Comunidad es un programa aparte.</h2><p>Este espacio se habilita únicamente cuando tenés acceso a <strong>Club de Alumnos</strong>. Comprar otro programa no habilita la Comunidad.</p><a class="btn btn-primary" href="/#programas">Ver Club de Alumnos</a><a class="btn btn-outline" href="#campus">Volver a mi campus</a></section>`;
      }
    }
    return previousCommunityHtml();
  };
})();
