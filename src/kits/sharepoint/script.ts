/**
 * The few behaviours that need script in Preview and in exported pages: menus, the mobile menu
 * button and collapsible sections. Plain JavaScript with no dependencies, using one delegated
 * listener per document, so `SPK.init()` is safe to call again after the content changes.
 */
export const SP_JS = `(function(){
  if (window.SPK) return;
  var doc = document;
  function closeMenus(except){
    var open = doc.querySelectorAll('.sp-nav__item.is-open');
    for (var i = 0; i < open.length; i++) {
      if (!except || !open[i].contains(except)) open[i].classList.remove('is-open');
    }
  }
  function closest(el, sel){ return el && el.closest ? el.closest(sel) : null; }
  doc.addEventListener('click', function(e){
    var t = e.target;
    var step = closest(t, '[data-sp-prev],[data-sp-next]');
    if (step) {
      var dir = step.hasAttribute('data-sp-next') ? 1 : -1;
      var carousel = closest(step, '[data-sp-carousel]');
      if (carousel) {
        var slides = carousel.querySelectorAll('.sp-carousel__slide');
        var dots = carousel.querySelectorAll('.sp-carousel__dot');
        var current = 0;
        for (var s = 0; s < slides.length; s++) if (slides[s].classList.contains('is-active')) current = s;
        var next = (current + dir + slides.length) % slides.length;
        for (var k = 0; k < slides.length; k++) slides[k].classList.toggle('is-active', k === next);
        for (var d = 0; d < dots.length; d++) dots[d].classList.toggle('is-active', d === next);
        return;
      }
      var strip = closest(step, '[data-sp-strip]');
      var track = strip && strip.querySelector('.sp-strip__track');
      if (track) track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' });
      return;
    }
    var collapse = closest(t, '[data-sp-collapse-toggle]');
    if (collapse) {
      var section = closest(collapse, '.sp-section');
      var collapsed = section.classList.toggle('is-collapsed');
      collapse.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      return;
    }
    var burger = closest(t, '[data-sp-nav-toggle]');
    if (burger) {
      var header = closest(burger, '.sp-header');
      if (header) header.classList.toggle('is-menu-open');
      return;
    }
    var toggle = closest(t, '[data-sp-menu-toggle]');
    var link = closest(t, '.sp-nav__link');
    var item = closest(toggle || link, '.sp-nav__item.has-children');
    if (item && (toggle || (link && link.parentNode === item))) {
      e.preventDefault();
      var wasOpen = item.classList.contains('is-open');
      closeMenus(item);
      item.classList.toggle('is-open', !wasOpen);
      var b = item.querySelector('[data-sp-menu-toggle]');
      if (b) b.setAttribute('aria-expanded', wasOpen ? 'false' : 'true');
      return;
    }
    if (!closest(t, '.sp-nav')) closeMenus(null);
  });
  doc.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeMenus(null); });
  window.SPK = { init: function(){} };
})();`;
