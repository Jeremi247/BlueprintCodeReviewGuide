// Copyright 2026 Jeremiasz Kacprzak. All Rights Reserved.
// Draws the Blueprint graph of every figure.graph[data-graph] on a guide page, from the definitions in G below.
(function () {
  // Pin colors as in the Blueprint editor.
  var PIN = {
    exec: '#eaeaea', bool: '#b32121', int: '#2fd3a6', float: '#9fe25a', string: '#e542c4', name: '#c08cf0',
    text: '#e07a9f', obj: '#3fa9f5', struct: '#3a72e0', vector: '#f2c230', enumv: '#2a8c74', delegate: '#ff5b5b'
  };
  var HEAD = {
    event: '#8a2121', call: '#24527f', pure: '#2f6b3a', flow: '#575d64', macro: '#575d64',
    cast: '#1c6b6b', entry: '#6a2c8a', set: '#40444a'
  };

  function parsePin(spec) {
    if (spec.charAt(0) === '>') return { exec: true, label: spec.slice(1), color: PIN.exec };
    var c = spec.indexOf(':');
    var label = spec.slice(0, c), rest = spec.slice(c + 1), def = '';
    var e = rest.indexOf('=');
    if (e >= 0) { def = rest.slice(e + 1); rest = rest.slice(0, e); }
    var arr = /\[\]$/.test(rest);
    var type = rest.replace('[]', '');
    return { exec: false, label: label, def: def, arr: arr, delegate: type === 'delegate', color: PIN[type] || '#bbbbbb' };
  }

  function N(id, kind, x, y, title, ins, outs, opt) {
    opt = opt || {};
    return { id: id, kind: kind, x: x, y: y, title: title, ins: ins.map(parsePin), outs: outs.map(parsePin),
      dis: !!opt.dis, sub: opt.sub || '', latent: !!opt.latent, bubble: opt.bubble || '' };
  }

  var CW = 6.6; // approximate character width of 11px labels
  function layout(n) {
    var compact = n.kind === 'var' || n.kind === 'op' || n.kind === 'conv';
    n.head = compact ? 0 : (n.sub ? 38 : 26);
    var rows = Math.max(n.ins.length, n.outs.length, 1);
    if (n.kind === 'var') {
      n.w = Math.max(70, n.title.length * CW + 40); n.h = 26;
    } else if (n.kind === 'op') {
      n.w = 58; n.h = rows * 20 + 12;
    } else if (n.kind === 'conv') {
      n.w = 26; n.h = 18;
    } else {
      var li = 0, lo = 0;
      n.ins.forEach(function (p) { li = Math.max(li, (p.label + (p.def ? '  ' + p.def : '')).length); });
      n.outs.forEach(function (p) { lo = Math.max(lo, p.label.length); });
      n.w = Math.max(96, n.title.length * 7.4 + 40 + (n.dis ? 56 : 0), n.sub.length * 6 + 24, (li + lo) * CW + 56);
      n.h = n.head + rows * 20 + 10;
    }
  }
  function pinPos(n, dir, i) {
    if (n.kind === 'var') return { x: dir === 'in' ? n.x : n.x + n.w, y: n.y + 13 };
    if (n.kind === 'conv') return { x: dir === 'in' ? n.x : n.x + n.w, y: n.y + 9 };
    if (n.kind === 'op' && dir === 'out') return { x: n.x + n.w, y: n.y + n.h / 2 };
    var base = n.kind === 'op' ? n.y + 16 : n.y + n.head + 14;
    return { x: dir === 'in' ? n.x : n.x + n.w, y: base + i * 20 };
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function pinGlyph(p, x, y, dir) {
    if (p.exec) {
      var d = dir === 'in' ? 1 : -1, bx = x + d * 9;
      // A small arrow pointing right, like the editor's exec pins.
      var x0 = bx - 4, pts = [[x0, y - 5], [x0 + 5, y - 5], [x0 + 9, y], [x0 + 5, y + 5], [x0, y + 5]];
      return '<polygon points="' + pts.map(function (q) { return q.join(','); }).join(' ') + '" fill="' + p.color + '"/>';
    }
    var cx = x + (dir === 'in' ? 9 : -9);
    if (p.delegate) return '<rect x="' + (cx - 4) + '" y="' + (y - 4) + '" width="8" height="8" fill="' + p.color + '"/>';
    if (p.arr) return '<rect x="' + (cx - 4) + '" y="' + (y - 4) + '" width="8" height="8" fill="none" stroke="' + p.color + '" stroke-width="2"/>';
    return '<circle cx="' + cx + '" cy="' + y + '" r="4.2" fill="' + p.color + '"/>';
  }

  function renderNode(n) {
    var s = '<g' + (n.dis ? ' opacity="0.45"' : '') + '>';
    if (n.bubble) {
      var bw = n.bubble.length * CW + 18;
      s += '<rect x="' + n.x + '" y="' + (n.y - 30) + '" width="' + bw + '" height="22" rx="4" fill="#e9e3b8"/>' +
        '<text x="' + (n.x + 9) + '" y="' + (n.y - 15) + '" fill="#2a2a2a" font-size="11">' + esc(n.bubble) + '</text>';
    }
    if (n.kind === 'var') {
      var col = (n.outs[0] || n.ins[0]).color;
      s += '<rect x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="13" fill="#1b1d20" stroke="' + col + '" stroke-opacity="0.55"/>';
      s += '<text x="' + (n.x + n.w / 2) + '" y="' + (n.y + 17) + '" fill="#e6e6e6" font-size="11.5" text-anchor="middle">' + esc(n.title) + '</text>';
      if (n.ins.length) s += pinGlyph(n.ins[0], n.x, n.y + 13, 'in');
      if (n.outs.length) s += pinGlyph(n.outs[0], n.x + n.w, n.y + 13, 'out');
      return s + '</g>';
    }
    if (n.kind === 'conv') {
      s += '<rect x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="9" fill="#1b1d20" stroke="#6b7280"/>';
      s += '<circle cx="' + (n.x + 7) + '" cy="' + (n.y + 9) + '" r="3.4" fill="' + n.ins[0].color + '"/>';
      s += '<circle cx="' + (n.x + n.w - 7) + '" cy="' + (n.y + 9) + '" r="3.4" fill="' + n.outs[0].color + '"/>';
      return s + '</g>';
    }
    s += '<rect x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="6" fill="#16181b" fill-opacity="0.94" stroke="#0a0a0a"/>';
    if (n.kind === 'op') {
      s += '<text x="' + (n.x + n.w / 2) + '" y="' + (n.y + n.h / 2 + 8) + '" fill="#cfd3d8" font-size="22" text-anchor="middle">' + esc(n.title) + '</text>';
    } else {
      s += '<path d="M' + n.x + ',' + (n.y + n.head) + ' v-' + (n.head - 6) + ' a6,6 0 0 1 6,-6 h' + (n.w - 12) + ' a6,6 0 0 1 6,6 v' + (n.head - 6) + ' z" fill="' + HEAD[n.kind] + '"/>';
      s += '<text x="' + (n.x + 10) + '" y="' + (n.y + 17) + '" fill="#ffffff" font-size="12" font-weight="600">' + esc(n.title) + (n.latent ? '  \u25F7' : '') + '</text>';
      if (n.sub) s += '<text x="' + (n.x + 10) + '" y="' + (n.y + 31) + '" fill="#c9cdd2" font-size="10" font-style="italic">' + esc(n.sub) + '</text>';
      if (n.dis) s += '<text x="' + (n.x + n.w - 8) + '" y="' + (n.y + 17) + '" fill="#ffd27a" font-size="10" text-anchor="end">Disabled</text>';
    }
    n.ins.forEach(function (p, i) {
      var q = pinPos(n, 'in', i);
      s += pinGlyph(p, q.x, q.y, 'in');
      var t = p.label;
      if (t || p.def) {
        s += '<text x="' + (q.x + 19) + '" y="' + (q.y + 4) + '" fill="#d8dbdf" font-size="11">' + esc(t) +
          (p.def ? '<tspan fill="#8f969e">' + (t ? '  ' : '') + esc(p.def) + '</tspan>' : '') + '</text>';
      }
    });
    n.outs.forEach(function (p, i) {
      var q = pinPos(n, 'out', i);
      s += pinGlyph(p, q.x, q.y, 'out');
      if (p.label) s += '<text x="' + (q.x - 19) + '" y="' + (q.y + 4) + '" fill="#d8dbdf" font-size="11" text-anchor="end">' + esc(p.label) + '</text>';
    });
    return s + '</g>';
  }

  function renderGraph(def) {
    var byId = {};
    def.nodes.forEach(function (n) { layout(n); byId[n.id] = n; });
    var maxX = 0, maxY = 0, minY = 0;
    def.nodes.forEach(function (n) {
      maxX = Math.max(maxX, n.x + n.w); maxY = Math.max(maxY, n.y + n.h);
      if (n.bubble) minY = Math.min(minY, n.y - 34);
    });
    (def.comments || []).forEach(function (c) { maxX = Math.max(maxX, c.x + c.w); maxY = Math.max(maxY, c.y + c.h); minY = Math.min(minY, c.y); });
    var W = Math.ceil(maxX + 8), H = Math.ceil(maxY - minY + 8);
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 ' + minY + ' ' + W + ' ' + H + '" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Blueprint graph">';
    (def.comments || []).forEach(function (c) {
      s += '<rect x="' + c.x + '" y="' + c.y + '" width="' + c.w + '" height="' + c.h + '" rx="4" fill="#ffffff" fill-opacity="0.07" stroke="#ffffff" stroke-opacity="0.25"/>';
      s += '<rect x="' + c.x + '" y="' + c.y + '" width="' + c.w + '" height="22" rx="4" fill="#ffffff" fill-opacity="0.16"/>';
      s += '<text x="' + (c.x + 8) + '" y="' + (c.y + 15) + '" fill="#f0f0f0" font-size="12" font-weight="600">' + esc(c.title) + '</text>';
    });
    def.wires.forEach(function (w) {
      var m = /^(\w+)\.(\d+)>(\w+)\.(\d+)$/.exec(w);
      var a = byId[m[1]], b = byId[m[3]];
      var pa = pinPos(a, 'out', +m[2]), pb = pinPos(b, 'in', +m[4]);
      var pin = a.outs[+m[2]];
      var dx = Math.max(50, Math.abs(pb.x - pa.x) * 0.5);
      var x1 = pa.x - (a.kind === 'var' || a.kind === 'conv' ? 0 : 0), x2 = pb.x;
      s += '<path d="M' + x1 + ',' + pa.y + ' C' + (x1 + dx) + ',' + pa.y + ' ' + (x2 - dx) + ',' + pb.y + ' ' + x2 + ',' + pb.y + '" fill="none" stroke="' + pin.color + '" stroke-width="' + (pin.exec ? 2.6 : 1.8) + '"/>';
    });
    def.nodes.forEach(function (n) { s += renderNode(n); });
    return s + '</svg>';
  }

  var G = {
    function: {
      nodes: [
        N('e', 'entry', 10, 20, 'Apply Damage', [], ['>', 'Amount:float']),
        N('h', 'var', 20, 130, 'Health', [], [':float']),
        N('m', 'op', 160, 110, '\u2212', [':float', ':float'], [':float']),
        N('s', 'set', 260, 20, 'SET', ['>', 'Health:float'], ['>', ':float']),
        N('r', 'entry', 430, 20, 'Return Node', ['>', 'New Health:float'], [])
      ],
      wires: ['e.0>s.0', 'h.0>m.0', 'e.1>m.1', 'm.0>s.1', 's.0>r.0', 's.1>r.1']
    },
    events: {
      nodes: [
        N('b', 'event', 10, 10, 'Event BeginPlay', [], ['>']),
        N('p', 'call', 230, 10, 'Play Intro', ['>'], ['>']),
        N('c', 'event', 10, 110, 'ServerFire', [], ['>', 'Spread:float'], { sub: 'Run on server · Reliable' }),
        N('f', 'call', 230, 110, 'Fire Weapon', ['>', 'Spread:float'], ['>'], { sub: 'Target is self' })
      ],
      wires: ['b.0>p.0', 'c.0>f.0', 'c.1>f.1']
    },
    let: {
      nodes: [
        N('e', 'event', 10, 10, 'On Fire', [], ['>']),
        N('ts', 'var', 10, 120, 'Trace Start', [], [':vector']),
        N('te', 'var', 10, 160, 'Trace End', [], [':vector']),
        N('lt', 'call', 160, 10, 'Line Trace By Channel', ['>', 'Start:vector', 'End:vector'], ['>', 'Out Hit:struct', 'Return Value:bool']),
        N('br', 'flow', 400, 10, 'Branch', ['>', 'Condition:bool'], ['>True', '>False']),
        N('bh', 'pure', 400, 120, 'Break Hit Result', ['Hit:struct'], ['Location:vector', 'Normal:vector']),
        N('si', 'call', 620, 10, 'Spawn Impact', ['>', 'Location:vector'], ['>'])
      ],
      wires: ['e.0>lt.0', 'ts.0>lt.1', 'te.0>lt.2', 'lt.0>br.0', 'lt.2>br.1', 'lt.1>bh.0', 'br.0>si.0', 'bh.0>si.1']
    },
    latent: {
      nodes: [
        N('e', 'event', 10, 10, 'On Died', [], ['>']),
        N('d', 'call', 170, 10, 'Delay', ['>', 'Duration:float=2.0'], ['>Completed'], { latent: true }),
        N('r', 'call', 380, 10, 'Respawn', ['>'], ['>'])
      ],
      wires: ['e.0>d.0', 'd.0>r.0']
    },
    async: {
      nodes: [
        N('e', 'event', 10, 10, 'On Interact', [], ['>']),
        N('i', 'var', 40, 110, 'Icon', [], [':obj']),
        N('a', 'call', 170, 10, 'Async Load Asset', ['>', 'Asset:obj'], ['>', '>Completed', 'Object:obj'], { latent: true }),
        N('h', 'call', 400, 0, 'Update Hud', ['>'], ['>']),
        N('s', 'call', 400, 90, 'Show Asset', ['>', 'Asset:obj'], ['>'])
      ],
      wires: ['e.0>a.0', 'i.0>a.1', 'a.0>h.0', 'a.1>s.0', 'a.2>s.1']
    },
    delegate: {
      nodes: [
        N('e', 'event', 10, 10, 'Event BeginPlay', [], ['>']),
        N('en', 'var', 30, 110, 'Enemy', [], [':obj']),
        N('bd', 'call', 220, 10, 'Bind Event to On Death', ['>', 'Target:obj', 'Event:delegate'], ['>']),
        N('ce', 'event', 10, 170, 'OnEnemyDied', [], [':delegate', '>']),
        N('as', 'call', 220, 170, 'Add Score', ['>', 'Points:int=100'], ['>'])
      ],
      wires: ['e.0>bd.0', 'en.0>bd.1', 'ce.0>bd.2', 'ce.1>as.0']
    },
    branch: {
      nodes: [
        N('e', 'event', 10, 10, 'On Hit', [], ['>']),
        N('v', 'var', 30, 110, 'Is Dead', [], [':bool']),
        N('b', 'flow', 170, 10, 'Branch', ['>', 'Condition:bool'], ['>True', '>False']),
        N('pd', 'call', 360, 0, 'Play Death', ['>'], ['>']),
        N('th', 'call', 360, 90, 'Take Hit', ['>'], ['>'])
      ],
      wires: ['e.0>b.0', 'v.0>b.1', 'b.0>pd.0', 'b.1>th.0']
    },
    isvalid: {
      nodes: [
        N('e', 'event', 10, 10, 'On Interact', [], ['>', 'Target:obj']),
        N('iv', 'macro', 190, 10, '? Is Valid', ['>Exec', 'Input Object:obj'], ['>Is Valid', '>Is Not Valid']),
        N('u', 'call', 450, 0, 'Use', ['>', 'Target:obj'], ['>']),
        N('w', 'call', 450, 100, 'Show Hint', ['>', 'Text:string="Nothing to use"'], ['>'])
      ],
      wires: ['e.0>iv.0', 'e.1>iv.1', 'iv.0>u.0', 'e.1>u.1', 'iv.1>w.0']
    },
    cast: {
      nodes: [
        N('e', 'event', 10, 10, 'On Overlap', [], ['>', 'Other Actor:obj']),
        N('c', 'cast', 200, 10, 'Cast To BP_Enemy', ['>', 'Object:obj'], ['>', '>Cast Failed', 'As BP Enemy:obj']),
        N('t', 'call', 440, 10, 'Take Hit', ['>', 'Target:obj', 'Damage:float=10.0'], ['>'])
      ],
      wires: ['e.0>c.0', 'e.1>c.1', 'c.0>t.0', 'c.2>t.1']
    },
    sequence: {
      nodes: [
        N('e', 'event', 10, 10, 'On Open', [], ['>']),
        N('s', 'flow', 160, 10, 'Sequence', ['>'], ['>Then 0', '>Then 1']),
        N('o', 'call', 350, 0, 'Open Door', ['>'], ['>']),
        N('p', 'call', 350, 90, 'Play Sound 2D', ['>', 'Sound:obj=DoorCreak'], ['>'])
      ],
      wires: ['e.0>s.0', 's.0>o.0', 's.1>p.0']
    },
    inputs: {
      nodes: [
        N('a', 'event', 10, 10, 'On Step', [], ['>']),
        N('b', 'event', 10, 130, 'On Lever', [], ['>']),
        N('g', 'macro', 200, 10, 'Gate', ['>Enter', '>Open', '>Close', 'Start Closed:bool=true'], ['>Exit']),
        N('d', 'call', 420, 10, 'Open Door', ['>'], ['>'])
      ],
      wires: ['a.0>g.0', 'b.0>g.1', 'g.0>d.0']
    },
    timeline: {
      nodes: [
        N('a', 'event', 10, 10, 'On Open', [], ['>']),
        N('b', 'event', 10, 90, 'On Close', [], ['>']),
        N('t', 'flow', 190, 10, 'DoorTimeline', ['>Play', '>Reverse'], ['>Update', '>Finished', 'Direction:enumv', 'Alpha:float']),
        N('m', 'call', 420, 0, 'Set Door Angle', ['>', 'Angle:float'], ['>']),
        N('f', 'call', 420, 120, 'Play Sound 2D', ['>', 'Sound:obj=DoorClosed'], ['>'])
      ],
      wires: ['a.0>t.0', 'b.0>t.1', 't.0>m.0', 't.3>m.1', 't.1>f.0']
    },
    goto: {
      nodes: [
        N('e', 'event', 10, 10, 'On Target Hit', [], ['>', 'Headshot:bool']),
        N('b', 'flow', 200, 10, 'Branch', ['>', 'Condition:bool'], ['>True', '>False']),
        N('a', 'call', 380, 0, 'Add Score', ['>', 'Points:int=50'], ['>']),
        N('p', 'call', 580, 70, 'Play Sound 2D', ['>', 'Sound:obj=Ping'], ['>'])
      ],
      wires: ['e.0>b.0', 'e.1>b.1', 'b.0>a.0', 'a.0>p.0', 'b.1>p.0']
    },
    foreach: {
      nodes: [
        N('e', 'event', 10, 10, 'Clear Wave', [], ['>']),
        N('a', 'var', 20, 120, 'Enemies', [], [':obj[]']),
        N('l', 'macro', 160, 10, 'For Each Loop', ['>Exec', 'Array:obj[]'], ['>Loop Body', 'Array Element:obj', 'Array Index:int', '>Completed']),
        N('d', 'call', 420, 0, 'Destroy Actor', ['>', 'Target:obj'], ['>']),
        N('p', 'call', 420, 110, 'Show Hint', ['>', 'Text:string="Cleared"'], ['>'])
      ],
      wires: ['e.0>l.0', 'a.0>l.1', 'l.0>d.0', 'l.1>d.1', 'l.3>p.0']
    },
    break: {
      nodes: [
        N('a', 'var', 10, 80, 'Enemies', [], [':obj[]']),
        N('l', 'macro', 130, 30, 'For Each Loop with Break', ['>Exec', 'Array:obj[]', '>Break'], ['>Loop Body', 'Array Element:obj', 'Array Index:int', '>Completed']),
        N('g', 'var', 400, 150, 'Is Boss', ['Target:obj'], [':bool']),
        N('b', 'flow', 440, 30, 'Branch', ['>', 'Condition:bool'], ['>True', '>False']),
        N('s', 'call', 630, 100, 'Stun', ['>', 'Target:obj'], ['>'])
      ],
      wires: ['a.0>l.1', 'l.0>b.0', 'l.1>g.0', 'g.0>b.1', 'b.1>s.0', 'l.1>s.1', 'b.0>l.2']
    },
    expr: {
      nodes: [
        N('e', 'event', 10, 10, 'Event Tick', [], ['>', 'Delta Seconds:float']),
        N('d', 'var', 20, 120, 'Distance', [], [':float']),
        N('m', 'op', 150, 108, '\u00D7', [':float', ':float=2.0'], [':float']),
        N('c', 'conv', 250, 124, '', [':float'], [':int']),
        N('s', 'set', 320, 10, 'SET', ['>', 'Score:int'], ['>', ':int'])
      ],
      wires: ['e.0>s.0', 'd.0>m.0', 'm.0>c.0', 'c.0>s.1']
    },
    shared: {
      nodes: [
        N('e', 'event', 10, 10, 'On Hit', [], ['>', 'Base Damage:float']),
        N('dm', 'var', 10, 140, 'Damage Multiplier', [], [':float']),
        N('m', 'op', 200, 96, '\u00D7', [':float', ':float'], [':float']),
        N('hv', 'var', 290, 40, 'Health', [], [':float']),
        N('sub', 'op', 400, 50, '\u2212', [':float', ':float'], [':float']),
        N('s', 'set', 500, 10, 'SET', ['>', 'Health:float'], ['>', ':float']),
        N('c', 'conv', 600, 140, '', [':float'], [':string']),
        N('p', 'call', 680, 10, 'Show Hint', ['>', 'Text:string'], ['>'])
      ],
      wires: ['e.0>s.0', 'e.1>m.0', 'dm.0>m.1', 'hv.0>sub.0', 'm.0>sub.1', 'sub.0>s.1', 's.0>p.0', 'm.0>c.0', 'c.0>p.1']
    },
    struct: {
      nodes: [
        N('e', 'event', 10, 10, 'Upgrade', [], ['>']),
        N('st', 'var', 10, 130, 'Stats', [], [':struct']),
        N('bk', 'pure', 110, 110, 'Break S_WeaponStats', ['S_WeaponStats:struct'], ['Damage:float', 'Fire Rate:float']),
        N('a', 'call', 330, 10, 'Apply Damage', ['>', 'Amount:float'], ['>']),
        N('mk', 'pure', 330, 120, 'Make S_WeaponStats', ['Damage:float=25.0', 'Fire Rate:float=0.1'], ['S_WeaponStats:struct']),
        N('s', 'set', 560, 10, 'SET', ['>', 'Stats:struct'], ['>', ':struct'])
      ],
      wires: ['e.0>a.0', 'st.0>bk.0', 'bk.0>a.1', 'a.0>s.0', 'mk.0>s.1']
    },
    comments: {
      comments: [{ x: 150, y: 0, w: 330, h: 160, title: 'Damage handling' }],
      nodes: [
        N('e', 'event', 10, 50, 'On Hit', [], ['>', 'Amount:float']),
        N('h', 'var', 170, 120, 'Health', [], [':float']),
        N('m', 'op', 260, 100, '\u2212', [':float', ':float'], [':float']),
        N('s', 'set', 360, 50, 'SET', ['>', 'Health:float'], ['>', ':float'], { bubble: 'clamp later?' })
      ],
      wires: ['e.0>s.0', 'h.0>m.0', 'e.1>m.1', 'm.0>s.1']
    },
    dead: {
      comments: [{ x: 200, y: 120, w: 200, h: 130, title: 'Old ping test' }],
      nodes: [
        N('e', 'event', 10, 10, 'Event BeginPlay', [], ['>']),
        N('p', 'call', 190, 10, 'Play Intro', ['>'], ['>'], { dis: true }),
        N('d', 'call', 400, 10, 'Print String', ['>', 'In String:string="debug"'], ['>'], { sub: 'Development Only' }),
        N('o', 'call', 210, 160, 'Play Sound 2D', ['>', 'Sound:obj=Ping'], ['>'])
      ],
      wires: ['e.0>p.0', 'p.0>d.0']
    }
  };

  // A graph shrinks with its column down to three quarters of its size; below that its figure scrolls.
  document.querySelectorAll('figure.graph[data-graph]').forEach(function (fig) {
    var def = G[fig.getAttribute('data-graph')];
    if (!def) return;
    fig.innerHTML = renderGraph(def);
    var svg = fig.firstChild, w = +svg.getAttribute('width');
    svg.style.maxWidth = w + 'px';
    svg.style.minWidth = Math.round(w * 0.75) + 'px';
    // The figure's column in Guide.css is as wide as the graph and its padding.
    fig.parentNode.style.setProperty('--graph-w', (w + 24) + 'px');
  });
})();
