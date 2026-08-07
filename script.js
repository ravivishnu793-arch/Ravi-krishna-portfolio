(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================
     SCROLL PROGRESS RAIL
     ============================================ */
  const railFill = document.getElementById('railFill');
  function updateRail(){
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const height = h.scrollHeight - h.clientHeight;
    const pct = height > 0 ? (scrolled / height) * 100 : 0;
    railFill.style.width = pct + '%';
  }
  document.addEventListener('scroll', updateRail, { passive: true });
  updateRail();

  /* ============================================
     3D TILT — project cards & cert rows
     Re-attached every time content re-renders.
     ============================================ */
  function attachTilt(el, strength){
    if (reduceMotion || el.dataset.tiltBound) return;
    el.dataset.tiltBound = '1';
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const rx = (0.5 - y) * strength;
      const ry = (x - 0.5) * strength;
      el.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(4px)`;
      el.style.setProperty('--mx', (x * 100) + '%');
      el.style.setProperty('--my', (y * 100) + '%');
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    });
  }

  function initTilt(){
    document.querySelectorAll('.card.tilt').forEach(el => attachTilt(el, 8));
    document.querySelectorAll('.cert.tilt').forEach(el => attachTilt(el, 4));
  }

  /* ============================================
     REVEAL ON SCROLL
     ============================================ */
  function initReveal(){
    const targets = document.querySelectorAll('.section:not(.reveal-bound), .card:not(.reveal-bound), .timeline-item:not(.reveal-bound), .cert:not(.reveal-bound)');
    targets.forEach(elm => {
      elm.classList.add('reveal', 'reveal-bound');
      if (reduceMotion || !('IntersectionObserver' in window)){
        elm.classList.add('reveal-in');
      }
    });
    if (!reduceMotion && 'IntersectionObserver' in window){
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting){
            entry.target.classList.add('reveal-in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      targets.forEach(elm => io.observe(elm));
    }
  }

  /* ============================================
     HERO SIGNATURE — skill network canvas
     Nodes come from the current skill list (editable).
     ============================================ */
  const canvas = document.getElementById('net');
  const ctx = canvas ? canvas.getContext('2d') : null;

  let width, height, dpr;
  let nodes = [];
  let pointer = { x: -9999, y: -9999 };
  let hoveredNode = null;
  let rafStarted = false;

  function resize(){
    const hero = document.querySelector('.hero');
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initNodes(labels){
    const source = (labels && labels.length) ? labels : ['Python', 'Machine Learning', 'Data Analytics'];
    nodes = source.map((label, i) => ({
      label,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: 2.4 + (i % 3),
    }));
  }

  function step(){
    ctx.clearRect(0, 0, width, height);

    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    });

    const linkDist = Math.min(width, height) * 0.22;
    for (let i = 0; i < nodes.length; i++){
      for (let j = i + 1; j < nodes.length; j++){
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDist){
          const alpha = (1 - dist / linkDist) * 0.35;
          ctx.strokeStyle = `rgba(47,166,162,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    hoveredNode = null;
    let closestDist = 60;
    nodes.forEach(n => {
      const dx = n.x - pointer.x, dy = n.y - pointer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist){
        closestDist = dist;
        hoveredNode = n;
      }
    });

    nodes.forEach(n => {
      const isNear = n === hoveredNode;
      ctx.beginPath();
      ctx.arc(n.x, n.y, isNear ? n.r + 2.5 : n.r, 0, Math.PI * 2);
      ctx.fillStyle = isNear ? '#E8A33D' : 'rgba(199,204,222,0.75)';
      ctx.fill();
      if (isNear){
        ctx.shadowColor = 'rgba(232,163,61,0.9)';
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    if (hoveredNode){
      ctx.font = '500 13px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#EDEFF7';
      const label = hoveredNode.label;
      const tw = ctx.measureText(label).width;
      let lx = hoveredNode.x + 14;
      if (lx + tw > width - 12) lx = hoveredNode.x - tw - 14;
      ctx.fillText(label, lx, hoveredNode.y - 12);
    }

    if (!reduceMotion){
      requestAnimationFrame(step);
    }
  }

  function pointerMove(e){
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  }
  function pointerLeave(){
    pointer.x = -9999; pointer.y = -9999;
  }

  function initCanvas(labels){
    if (!canvas) return;
    resize();
    initNodes(labels);
    if (!rafStarted){
      canvas.addEventListener('mousemove', pointerMove);
      canvas.addEventListener('mouseleave', pointerLeave);
      canvas.addEventListener('touchmove', (e) => {
        if (e.touches[0]) pointerMove(e.touches[0]);
      }, { passive: true });
      window.addEventListener('resize', () => { resize(); });
      rafStarted = true;
      if (reduceMotion) step(); else requestAnimationFrame(step);
    }
  }

  /* ============================================
     Public hook — called after every render
     ============================================ */
  window.PortfolioInteractive = { initTilt, initReveal, initCanvas };

  document.addEventListener('content:rendered', (e) => {
    initTilt();
    initReveal();
    initCanvas(e.detail.skillLabels);
  });
})();
