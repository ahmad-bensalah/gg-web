(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const bestEl = document.getElementById('best');
  const startBtn = document.getElementById('start');

  const W = canvas.width, H = canvas.height;
  const player = { x: W / 2, y: H - 30, w: 70, h: 12, speed: 6 };
  const keys = {};
  let items = [], score = 0, lives = 3, running = false, spawnTimer = 0, elapsed = 0;
  let best = Number(localStorage.getItem('orb-best') || 0);
  bestEl.textContent = best;

  function reset() {
    items = []; score = 0; lives = 3; spawnTimer = 0; elapsed = 0;
    player.x = W / 2;
    updateHud();
  }

  function updateHud() {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    bestEl.textContent = best;
  }

  function spawn() {
    const spike = Math.random() < Math.min(0.15 + elapsed / 6000, 0.4);
    items.push({
      x: 15 + Math.random() * (W - 30),
      y: -15,
      r: spike ? 11 : 9,
      vy: 2 + Math.random() * 1.5 + elapsed / 2500,
      spike,
    });
  }

  function update() {
    elapsed++;
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x));

    if (--spawnTimer <= 0) {
      spawn();
      spawnTimer = Math.max(18, 50 - elapsed / 120);
    }

    for (const it of items) {
      it.y += it.vy;
      const hit = it.y + it.r >= player.y && it.y - it.r <= player.y + player.h &&
        Math.abs(it.x - player.x) <= player.w / 2 + it.r;
      if (hit) {
        it.dead = true;
        if (it.spike) lives--; else score++;
      } else if (it.y - it.r > H) {
        it.dead = true;
        if (!it.spike) lives--;
      }
    }
    items = items.filter(it => !it.dead);
    updateHud();

    if (lives <= 0) gameOver();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const it of items) {
      ctx.beginPath();
      if (it.spike) {
        ctx.fillStyle = '#ff4d6d';
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI / 4) * i;
          const r = i % 2 ? it.r * 0.5 : it.r;
          ctx.lineTo(it.x + Math.cos(a) * r, it.y + Math.sin(a) * r);
        }
        ctx.closePath();
      } else {
        ctx.fillStyle = '#7cf7c8';
        ctx.shadowColor = '#7cf7c8';
        ctx.shadowBlur = 12;
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = '#6c7cff';
    ctx.beginPath();
    ctx.roundRect(player.x - player.w / 2, player.y, player.w, player.h, 6);
    ctx.fill();

    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 26px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(score || lives <= 0 ? 'Game over' : 'Ready?', W / 2, H / 2 - 10);
      ctx.font = '16px system-ui';
      ctx.fillText('Press Start or Space', W / 2, H / 2 + 20);
    }
  }

  function loop() {
    if (running) update();
    draw();
    requestAnimationFrame(loop);
  }

  function start() {
    reset();
    running = true;
    startBtn.textContent = 'Restart';
  }

  function gameOver() {
    running = false;
    if (score > best) {
      best = score;
      localStorage.setItem('orb-best', best);
    }
    updateHud();
  }

  addEventListener('keydown', e => {
    keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = true;
    if (e.code === 'Space') { e.preventDefault(); if (!running) start(); }
  });
  addEventListener('keyup', e => {
    keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' && e.buttons === 0) return;
    const rect = canvas.getBoundingClientRect();
    player.x = (e.clientX - rect.left) * (W / rect.width);
  });
  startBtn.addEventListener('click', start);

  loop();
})();
