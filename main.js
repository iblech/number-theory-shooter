"use strict";

function onLoad() {
  var canvas = document.getElementById("game-canvas")
  var ctx = canvas.getContext("2d");
  var dim = 800;
  var surface =
    { canvas: canvas
    , ctx: ctx
    , dim: dim
    , center: {x: 0, y: 0}
    };
  canvas.width = dim;
  canvas.height = dim;
  ctx.font = (dim*0.06)+"px DUMMY";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  var game =
    { targets: []
    , newTargets: []
    , spawningTargets: []
    , spawning: {phase: 0, nextValue: 2}
    , me:
      { pos: {x: 0, y: 0}
      , v: {x: 0, y: 0}
      }
    };

  var input =
    { keysDown: {}
    , keyCodes:
      { up: 87     // 87 is W
      , down: 83   // 83 is S
      , left: 65   // 65 is A
      , right: 68  // 68 is D
      }
    , clicks: []
    };

  document.addEventListener("keydown",
    function(e) {onKeyDown(input, e);} );
  document.addEventListener("keyup",
    function(e) {onKeyUp(input, e);} );
  canvas.addEventListener("mousedown",
    function(e) {onMouseDown(game, surface, input, e);} );

  timer(game, surface, input);
}

function onKeyDown(input, e) {
  input.keysDown[e.keyCode] = true;
}
function onKeyUp(input, e) {
  input.keysDown[e.keyCode] = false;
}
function onMouseDown(g, s, input, e) {
  if (e.button==0) {
    // save click position relative to me.pos
    var p = fromPixelPos(s, [e.offsetX, e.offsetY]);
    p = normalizePos(diffPos(s.center, p));
    var mp = normalizePos(diffPos(s.center, g.me.pos));
    input.clicks.push(diffPos(mp, p));
  }
}

function timer(game, surface, input) {
  tick(game, input);
  surface.center = lerp(surface.center, game.me.pos, 0.1);
  draw(surface, game);

  setTimeout(function() {timer(game, surface, input);}, 30);
}

function tick(g, input) {
  var tars = g.targets;
  var stars = g.spawningTargets;

  g.me.v = addPos(g.me.v, scalePos(inputMovement(input), 0.01));
  g.me.v = scalePos(g.me.v, 0.8);
  g.me.pos = addPos(g.me.pos, g.me.v);

  input.clicks.forEach(function(v) {shoot(g, v);});
  input.clicks = [];

  for (var i=0; i<tars.length; i++) {
    var tar = tars[i];
    tar.flashPhase += 0.1232;
    while (tar.flashPhase >= tar.primeFactors.length) {
      tar.flashPhase -= tar.primeFactors.length;
    }
  }

  for (var i=0; i<stars.length; i++) {
    var star = stars[i];
    star.flashPhase += 0.13;
    while (star.flashPhase >= 1) {
      star.flashPhase -= 1;
    }
    star.age += 1;
    if (star.age >= 30) {
      star.delete = true;
      newTarget(g, star.value, star.pos);
    }
  }

  // target-target collisions
  for (var i=0; i<tars.length; i++) {
    var tar1 = tars[i];
    if (tar1.delete == true) continue;
    for (var j=i+1; j<tars.length; j++) {
      var tar2 = tars[j];
      if (tar2.delete == true) continue;
      if (dist(tar1.pos, tar2.pos) <= 0.18) {
        mergeTargets(g, tar1, tar2);
      }
    }
  }

  g.spawning.phase += 0.02;
  if (g.spawning.phase >= 1) {
    g.spawning.phase -= 1;
    newSpawningTarget(g, g.spawning.nextValue, randomPos());
    g.spawning.nextValue += 1;
  }

  purgeList(tars);
  purgeList(stars);

  g.targets = tars.concat(g.newTargets);
  g.newTargets = [];
}

function inputMovement(input) {
  var k = input.keysDown;
  var c = input.keyCodes;
  return (
    { x: (k[c.left]==true ? -1 : 0) + (k[c.right]==true ? 1 : 0)
    , y: (k[c.up  ]==true ? -1 : 0) + (k[c.down ]==true ? 1 : 0)
    } );
}

function shoot(g, v) {
  var l = lengthPos(v);
  if (l > 0.001) {
    v = scalePos(v, 1/l);
    console.log(v);
    // TODO: go on here
  }
}

function newTarget(g, value, pos) {
  var primes = primeFactors(value);
  g.newTargets.push(
    { value: value
    , primeFactors: primes
    , isPrime: primes.length==1
    , pos: pos
    , flashPhase: 0 } );
}
function newSpawningTarget(g, value, pos) {
  g.spawningTargets.push(
    { value: value
    , pos: pos
    , flashPhase: 0
    , age: 0 } );
}

function mergeTargets(g, tar1, tar2) {
  tar1.delete = true;
  tar2.delete = true;
  newTarget(g, tar1.value+tar2.value, lerp(tar1.pos, tar2.pos, 0.5));
}

function randomPos() {
  return {x: Math.random()-0.5, y: Math.random()-0.5};
}

function addPos(pos, v) {
  return {x: pos.x+v.x, y: pos.y+v.y};
}
function scalePos(v, s) {
  return {x: v.x*s, y: v.y*s};
}
function diffPos(p1, p2) {
  return {x: p2.x-p1.x, y: p2.y-p1.y};
}
function lerp(p1, p2, t) {
  var d = normalizePos(diffPos(p1, p2));
  return addPos(p1, scalePos(d, t));
}
function dist(p1, p2) {
  return lengthPos(normalizePos(diffPos(p1, p2)));
}
function normalizePos(pos) {
  return ( { x: pos.x-Math.floor(pos.x+0.5)
           , y: pos.y-Math.floor(pos.y+0.5) } );
}
function lengthPos(v) {
  return Math.sqrt(v.x*v.x + v.y*v.y);
}

function normalizedPoses(pos) {
  var npos = normalizePos(pos);
  var x = npos.x, y = npos.y;
  var xx = x>0 ? x-1 : x+1;
  var yy = y>0 ? y-1 : y+1;
  return (
    [ {x: x , y: y }
    , {x: x , y: yy}
    , {x: xx, y: y }
    , {x: xx, y: yy} ] );
}

function purgeList(l) {
  for (var i=0; i<l.length; i++) {
    if (l[i].delete == true) {
      l.splice(i, 1);
      i--;
    }
  }
}

function primeFactors(n) {
  var ps = [];
  var p = 1;
  while (n>1) {
    p += 1;
    if (n % p == 0) {
      ps.push(p);
      n = n/p;
      p = 1;
    }
  }
  return ps;
}

function draw(s, g) {
  s.ctx.fillStyle = toRGBAString([0.15, 0.15, 0.15, 1]);
  s.ctx.fillRect(0, 0, s.dim, s.dim);

  for (var i=0; i<g.targets.length; i++) {
    drawTarget(s, g.targets[i]);
  }
  for (var i=0; i<g.spawningTargets.length; i++) {
    drawSpawningTarget(s, g.spawningTargets[i]);
  }

  drawMe(s, g.me);

  // hueColorTest(s, 100);
}

function hueColorTest(s, n) {
  var d = s.dim;
  for (var i=0; i<n; i++) {
    s.ctx.fillStyle = toRGBAString(colorFromHue(i/n));
    s.ctx.fillRect(d/n*i, 0, d/n, d/8);
  }
}

function drawTarget(s, tar) {
  if (tar.isPrime) {
    var color = primeColor(tar.value);
    spotlightAt(s, tar.pos, 0.1, withAlpha(color, 0.3));

    s.ctx.fillStyle = toRGBAString(mixColors(color, white, 0.2));
    textAt(s, tar.pos, tar.value);
  }
  else {
    var i = Math.floor(tar.flashPhase);
    var t = tar.flashPhase - i;
    var lightRadius = 0.07 + 0.03*Math.sin(t*Math.PI);
    var color = primeColor(tar.primeFactors[i]);

    spotlightAt(s, tar.pos, lightRadius, color);

    s.ctx.fillStyle = toRGBAString(white);
    textAt(s, tar.pos, tar.value);
  }
}
function drawSpawningTarget(s, star) {
  if (star.flashPhase <= 0.5) {
    s.ctx.fillStyle = toRGBAString(white);
    textAt(s, star.pos, star.value);
  }
}
function drawMe(s, me) {
  s.ctx.strokeStyle = toRGBAString(white);
  circleAt(s, me.pos, 0.06);
}

function spotlightAt(s, pos, radius, color) {
  var xys = toPixelPoses(s, pos);
  var r = toPixelLength(s, radius);
  var transparent = withAlpha(color, 0);

  xys.forEach(function(xy) {
    var grad =
      s.ctx.createRadialGradient(xy[0], xy[1], 0, xy[0], xy[1], r);
    grad.addColorStop(0, toRGBAString(color));
    grad.addColorStop(1, toRGBAString(transparent));
    s.ctx.fillStyle = grad;
    s.ctx.fillRect(xy[0]-r, xy[1]-r, 2*r, 2*r);
  });
}
function textAt(s, pos, text) {
  var xys = toPixelPoses(s, pos);
  xys.forEach(function(xy) {
    s.ctx.fillText(text, xy[0], xy[1]);
  });
}
function circleAt(s, pos, radius) {
  var xys = toPixelPoses(s, pos);
  var r = toPixelLength(s, radius);
  xys.forEach(function(xy) {
    s.ctx.beginPath();
    s.ctx.arc(xy[0], xy[1], r, 0, 2*Math.PI);
    s.ctx.stroke();
  });
}

function toPixelPoses(s, pos) {
  var nps = normalizedPoses(diffPos(s.center, pos));
  return nps.map(
    function(p) {return [(p.x+0.5)*s.dim, (p.y+0.5)*s.dim];} );
}
function toPixelLength(s, l) {
  return l*s.dim;
}
function fromPixelPos(s, xy) {
  return addPos(s.center, { x: xy[0]/s.dim - 0.5
                          , y: xy[1]/s.dim - 0.5 });
}

function primeColor(p) {
  var hue = p*goldenRatio;
  hue = hue - Math.floor(hue);
  return colorFromHue(hue);
}

var goldenRatio = (1 + Math.sqrt(5)) / 2

// 0 <= hue < 1
function colorFromHue(hue) {
  var cs =
    [ [1, 0, 0, 1]
    , [1, 1, 0, 1]
    , [0, 1, 0, 1]
    , [0, 1, 1, 1]
    , [0, 0, 1, 1]
    , [1, 0, 1, 1]
    , [1, 0, 0, 1]
    ];
  var n = cs.length - 1;
  var i = Math.floor(n*hue);
  var t = n*hue - i;
  return mixColors(cs[i], cs[i+1], t);
}

var white = [1, 1, 1, 1];
var black = [0, 0, 0, 1];

function mixColors(c1, c2, t) {
  var c = [0, 0, 0, 0]
  for (var i=0; i<4; i++) {
    c[i] = (1-t)*c1[i] + t*c2[i];
  }
  return c;
}
function withAlpha(c, alpha) {
  return [c[0], c[1], c[2], alpha];
}

function toRGBAString(color) {
  return ("rgba("+color[0]*255+", "+color[1]*255+", "+color[2]*255+
    ", "+color[3]+")");
}
