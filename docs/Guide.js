// Copyright 2026 Jeremiasz Kacprzak. All Rights Reserved.
// Every guide page's shell: the sidebar of pages with this page's sections, the previous and next links,
// and the colors of the pseudocode blocks. A new page is added to PAGES and to the topics on Guide.html.
(function () {
  var PAGES = [
    { group: '', pages: [['Guide.html', 'Overview']] },
    { group: 'Using the plugin', pages: [
      ['GettingText.html', 'Getting the text'],
      ['SwarmSetup.html', 'Swarm setup']] },
    { group: 'Reading a Blueprint', pages: [
      ['FileLayout.html', 'File layout'],
      ['Declarations.html', 'Variables and components'],
      ['ViewBindings.html', 'View bindings (MVVM)'],
      ['Functions.html', 'Functions and events'],
      ['Latent.html', 'Latent and async nodes'],
      ['Flow.html', 'Execution flow'],
      ['Loops.html', 'Loops'],
      ['Values.html', 'Values and expressions'],
      ['Literals.html', 'Literals'],
      ['Comments.html', 'Comments and dead code']] },
    { group: 'Other assets', pages: [
      ['StringTables.html', 'String tables'],
      ['StateTrees.html', 'State Trees']] }
  ];

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  var here = (decodeURIComponent(location.pathname.split('/').pop()) || 'Guide.html').toLowerCase();
  var flat = [], at = -1;

  function sections() {
    var heads = document.querySelectorAll('main h2[id]');
    if (!heads.length) return '';
    var s = '<ul class="sub">';
    for (var i = 0; i < heads.length; i++) s += '<li><a href="#' + heads[i].id + '">' + esc(heads[i].textContent) + '</a></li>';
    return s + '</ul>';
  }

  var side = document.querySelector('nav.side');
  if (side) {
    var h = '<details open><summary>Guide contents</summary>';
    PAGES.forEach(function (g) {
      if (g.group) h += '<div class="side-group">' + esc(g.group) + '</div>';
      h += '<ul>';
      g.pages.forEach(function (p) {
        var current = p[0].toLowerCase() === here;
        if (current) at = flat.length;
        flat.push(p);
        h += '<li><a class="page-link" href="' + p[0] + '"' + (current ? ' aria-current="page"' : '') + '>' + esc(p[1]) + '</a>' +
          (current ? sections() : '') + '</li>';
      });
      h += '</ul>';
    });
    side.innerHTML = h + '</details>';

    // Wide, the list is always open and its toggle hidden; narrow, it folds above the page.
    var details = side.querySelector('details'), wide = window.matchMedia('(min-width: 961px)');
    var fit = function () { details.open = wide.matches; };
    fit();
    if (wide.addEventListener) wide.addEventListener('change', fit); else wide.addListener(fit);
  }

  var main = document.querySelector('main.page');
  if (main && at >= 0) {
    var prev = flat[at - 1], next = flat[at + 1], s = '';
    if (prev) s += '<a class="prev" href="' + prev[0] + '"><span class="dir">Previous</span><span class="title">' + esc(prev[1]) + '</span></a>';
    if (next) s += '<a class="next" href="' + next[0] + '"><span class="dir">Next</span><span class="title">' + esc(next[1]) + '</span></a>';
    var pager = document.createElement('nav');
    pager.className = 'pager';
    pager.setAttribute('aria-label', 'Previous and next page');
    pager.innerHTML = s;
    main.appendChild(pager);
  }

  // Syntax colors for the pseudocode blocks.
  var KW = /^(function|event|if|else|for|in|while|return|goto|break|local|var|component|class|extends|implements|macro|dispatcher|on|to|reverse|override|inherited|attached)$/;
  function highlightCode(line) {
    var out = '', i = 0, q = false, cut = -1;
    for (i = 0; i < line.length; i++) {
      var ch = line.charAt(i);
      if (q) { if (ch === '\\') i++; else if (ch === '"') q = false; continue; }
      if (ch === '"') { q = true; continue; }
      if (ch === '/' && line.charAt(i + 1) === '/') { cut = i; break; }
    }
    var code = cut >= 0 ? line.slice(0, cut) : line;
    var cmt = cut >= 0 ? line.slice(cut) : '';
    var re = /("(?:[^"\\]|\\.)*")|(\bfn_\w+)|(\bL_\w+:?)|(\[[^\]]*\])|([A-Za-z_]\w*)/g, m, last = 0;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      if (m[1]) out += '<span class="hl-str">' + esc(m[1]) + '</span>';
      else if (m[2]) out += '<span class="hl-fn">' + esc(m[2]) + '</span>';
      else if (m[3]) out += '<span class="hl-lbl">' + esc(m[3]) + '</span>';
      else if (m[4]) out += '<span class="hl-ann">' + esc(m[4]) + '</span>';
      else if (KW.test(m[5])) out += '<span class="hl-kw">' + esc(m[5]) + '</span>';
      else out += esc(m[5]);
      last = re.lastIndex;
    }
    out += esc(code.slice(last));
    if (cmt) out += '<span class="hl-cmt">' + esc(cmt) + '</span>';
    return out;
  }
  document.querySelectorAll('pre.code[data-hl]').forEach(function (pre) {
    pre.innerHTML = pre.textContent.split('\n').map(highlightCode).join('\n');
  });
})();
