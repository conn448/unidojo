// Unidojo Supabase browser configuration.
// This is the public browser key. Security is enforced by Supabase Row Level Security.
window.UNIDOJO_SUPABASE_URL = 'https://uhqhcteynuypeegilfbk.supabase.co';
window.UNIDOJO_SUPABASE_KEY = 'sb_publishable_eo92IwdrBeSUwAyv7W29dQ_R3LKr3xC';

// Load the adaptive Brain without document.write. document.write can interfere with
// the HTML parser and leave the whole app blank on some browsers.
(function loadBrain(){
  var s = document.createElement('script');
  s.src = 'brain.js';
  s.async = true;
  document.head.appendChild(s);
})();
