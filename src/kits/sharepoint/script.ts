/**
 * The few behaviours that need script in Preview and in exported pages (collapsible sections,
 * carousels, menus). Plain JavaScript with no dependencies. `SPK.init()` is safe to call again
 * after the content changes.
 */
export const SP_JS = `(function(){
  window.SPK = { init: function(){} };
})();`;
