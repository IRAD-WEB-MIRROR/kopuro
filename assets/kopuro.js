/* kopuro child theme scripts */
(function(){
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var b=$('#burger'),nav=$('.head nav');
  if(b&&nav)b.onclick=function(){nav.classList.toggle('open')};
  $$('.topbar .soon').forEach(function(a){a.onclick=function(e){e.preventDefault();var n=$('#langnote');n.style.display=n.style.display=='block'?'none':'block'}});
  $$('.topbar .soc').forEach(function(a){a.onclick=function(e){e.preventDefault()}});
  // back to top
  var t=$('#totop');
  if(t){window.addEventListener('scroll',function(){t.classList.toggle('show',window.scrollY>500)});t.onclick=function(e){e.preventDefault();window.scrollTo(0,0)}}
  // slider
  var sl=$('#slider');
  if(sl){
    var slides=$$('.slide',sl),dots=$$('.dots button',sl),i=0,timer;
    function go(n){slides[i].classList.remove('on');dots[i].classList.remove('on');i=(n+slides.length)%slides.length;slides[i].classList.add('on');dots[i].classList.add('on')}
    function play(){clearInterval(timer);if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(function(){go(i+1)},6000)}
    dots.forEach(function(d,n){d.onclick=function(){go(n);play()}});play();
  }
  // days left on grant notices
  var today=new Date();today.setHours(0,0,0,0);
  $$('[data-deadline]').forEach(function(el){
    var d=new Date(el.getAttribute('data-deadline')+'T00:00:00'),left=Math.round((d-today)/864e5),h;
    if(left<0)h='<span class="tag closed">closed</span>';
    else if(left==0)h='<span class="tag soon">last day</span>';
    else if(left<=10)h='<span class="tag soon">'+left+' days left</span>';
    else h='<span class="tag open">open &middot; '+left+' days left</span>';
    var s=el.querySelector('.left');if(s)s.innerHTML=h;
    if(left<0)el.classList.add('closed');
  });
  // directory filter
  var tbl=$('#dir');
  if(tbl){
    var rows=$$('tbody tr',tbl),q=$('#q'),sec=$('#sec'),city=$('#city'),cnt=$('#cnt');
    try{var p=new URLSearchParams(location.search);if(p.get('q'))q.value=p.get('q')}catch(e){}
    function f(){var v=q.value.toLowerCase(),s=sec.value,ci=city.value,n=0;
      rows.forEach(function(r){var ok=(!v||r.textContent.toLowerCase().indexOf(v)>-1)&&(!s||r.getAttribute('data-sec')==s)&&(!ci||r.getAttribute('data-city')==ci);
        r.style.display=ok?'':'none';if(ok)n++});cnt.textContent=n}
    [q,sec,city].forEach(function(e){e.oninput=f;e.onchange=f});f();
  }
  // forms that never quite worked
  $$('form.dead').forEach(function(fm){fm.onsubmit=function(e){e.preventDefault();var er=fm.querySelector('.err');if(er)er.style.display='block'}});
})();
