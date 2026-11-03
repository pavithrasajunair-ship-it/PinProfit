(function () {
  var K = 'pinprofit.theme', r = document.documentElement;
  function get() { try { var v = localStorage.getItem(K); return v === 'light' || v === 'dark' ? v : 'auto'; } catch (e) { return 'auto'; } }
  function apply(v) { if (v === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', v); }
  apply(get());
  window.PPTheme = { get: get, set: function (v) { try { if (v === 'auto') localStorage.removeItem(K); else localStorage.setItem(K, v); } catch (e) { /* storage blocked: applies for this visit only */ } apply(v); } };
})();
