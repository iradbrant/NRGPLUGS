// Desktop tutorial engine v5 (1920x1080)
// - Tooltip outside zoom-wrapper so it NEVER clips
// - Positioned in story-space relative to screen center after zoom

function initDesktopTutorial(config) {
  const story = document.getElementById('story');
  const W = 1920, H = 1080;

  function scaleStory() {
    story.style.transform = `scale(${Math.min(window.innerWidth / W, window.innerHeight / H)})`;
  }
  scaleStory();
  window.addEventListener('resize', scaleStory);

  const accent = config.accent || '#ffc864';
  const accentDim = config.accentDim || '#a07820';

  const uiContainer = document.getElementById('plugin-container');
  const uiFrame = document.getElementById('plugin-frame');
  const pw = config.pluginWidth || 1100;
  const ph = config.pluginHeight || 700;
  const maxW = 1700, maxH = 850;
  const fitScale = Math.min(maxW / pw, maxH / ph);
  const scaledW = pw * fitScale;
  const uiLeft = (W - scaledW) / 2;
  const uiTop = config.uiTop || 120;

  uiContainer.style.cssText = `
    width:${pw}px; height:${ph}px; transform:scale(${fitScale});
    transform-origin:top left; position:absolute; left:${uiLeft}px; top:${uiTop}px;
    border-radius:12px; overflow:hidden;
    box-shadow:0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px rgba(0,0,0,0.5);
  `;
  uiFrame.style.cssText = `width:${pw}px; height:${ph}px; border:none; pointer-events:none;`;

  const uiSrc = uiFrame.getAttribute('src');
  if (uiSrc) {
    uiFrame.removeAttribute('src');
    fetch(uiSrc)
      .then(r => r.text())
      .then(html => { uiFrame.srcdoc = html; })
      .catch(() => { uiFrame.src = uiSrc; });
  }

  function ui2s(ux, uy) {
    return { x: uiLeft + ux * fitScale, y: uiTop + uy * fitScale };
  }

  function queryIframe(selector) {
    try {
      const doc = uiFrame.contentDocument || uiFrame.contentWindow.document;
      if (!doc || !doc.body) return null;
      let el = null;
      if (selector.startsWith('#')) el = doc.getElementById(selector.slice(1));
      if (!el) el = doc.querySelector(selector);
      if (!el) {
        for (const c of doc.querySelectorAll('button, [class*=knob], [class*=btn], canvas, [id*=knob]')) {
          if (c.textContent.trim().toUpperCase() === selector.toUpperCase()) { el = c; break; }
        }
      }
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    } catch (e) { return null; }
  }

  // Camera
  const zoomWrapper = document.getElementById('zoom-wrapper');
  const zoomIn = config.zoomScale || 2.2;
  zoomWrapper.style.cssText = `
    transition: transform 1.4s cubic-bezier(0.4,0,0.15,1);
    transform-origin:top left; position:absolute; top:0; left:0; width:${W}px; height:${H}px;
  `;

  let camState = { x: 0, y: 0, z: 1 };
  function setCam(x, y, z) {
    camState = { x, y, z };
    zoomWrapper.style.transform = `translate(${W/2 - x*z}px, ${H/2 - y*z}px) scale(${z})`;
  }
  function resetCam() {
    camState = { x: 0, y: 0, z: 1 };
    zoomWrapper.style.transform = 'translate(0,0) scale(1)';
  }

  // Cursor (inside zoom-wrapper)
  const cursor = document.createElement('div');
  cursor.id = 'tutorial-cursor';
  cursor.style.opacity = '0';
  cursor.innerHTML = '<div class="cursor-ring"></div><div class="cursor-dot"></div>';
  zoomWrapper.appendChild(cursor);

  // Tooltip (OUTSIDE zoom-wrapper — story-space, never clips)
  const tooltip = document.createElement('div');
  tooltip.id = 'tutorial-tooltip';
  tooltip.innerHTML = '<div class="tt-name"></div><div class="tt-desc"></div>';
  story.appendChild(tooltip);

  // Overview label
  const overviewLabel = document.createElement('div');
  overviewLabel.id = 'overview-label';
  overviewLabel.textContent = config.overviewText || 'Full Plugin Overview';
  story.appendChild(overviewLabel);

  const sty = document.createElement('style');
  sty.textContent = `
    #tutorial-cursor {
      position:absolute; pointer-events:none; z-index:100;
      transition: left 0.9s cubic-bezier(0.4,0,0.2,1), top 0.9s cubic-bezier(0.4,0,0.2,1), opacity 0.4s;
    }
    .cursor-ring {
      width:46px; height:46px; border:2.5px solid ${accent}; border-radius:50%;
      position:absolute; top:-23px; left:-23px;
      animation: cpulse 1.4s ease-in-out infinite;
      box-shadow: 0 0 20px ${accent}55, inset 0 0 10px ${accent}22;
    }
    .cursor-dot {
      width:8px; height:8px; background:${accent}; border-radius:50%;
      position:absolute; top:-4px; left:-4px; box-shadow:0 0 12px ${accent};
    }
    @keyframes cpulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.12);opacity:1} }

    #tutorial-tooltip {
      position:absolute; pointer-events:none; z-index:200;
      background:rgba(6,6,6,0.97); border:2px solid ${accent}77;
      border-radius:12px; padding:16px 22px;
      width: 400px;
      backdrop-filter:blur(16px); opacity:0;
      transition: opacity 0.4s;
      box-shadow:0 10px 36px rgba(0,0,0,0.7);
      overflow: visible;
      word-wrap: break-word;
    }
    #tutorial-tooltip.visible { opacity:1; }
    .tt-name {
      font-family:'Space Mono',monospace; font-size:20px; font-weight:700;
      color:${accent}; margin-bottom:4px; letter-spacing:1px;
      white-space: normal; word-wrap: break-word;
    }
    .tt-desc {
      font-size:15px; color:#ccc; line-height:1.4;
      white-space: normal; word-wrap: break-word;
    }

    #overview-label {
      position:absolute; top:30px; left:0; width:100%; text-align:center;
      font-family:'Space Mono',monospace; font-size:24px; font-weight:700;
      color:${accent}; letter-spacing:4px; text-transform:uppercase;
      opacity:0; transition:opacity 0.8s; z-index:150;
      text-shadow:0 2px 12px rgba(0,0,0,0.7);
    }
    #overview-label.visible { opacity:1; }
    #overview-label.hidden { opacity:0; }

    .click-ripple {
      position:absolute; width:46px; height:46px;
      border:2px solid ${accent}; border-radius:50%;
      top:-23px; left:-23px;
      animation: rout 0.6s ease-out forwards; pointer-events:none;
    }
    @keyframes rout { 0%{transform:scale(0.4);opacity:1} 100%{transform:scale(2.2);opacity:0} }
  `;
  document.head.appendChild(sty);

  // Tooltip in story-space — centered below where knob appears on screen
  function placeTooltip() {
    const screenX = W / 2;
    const screenY = H / 2;
    const ttW = 400;
    const pad = 60;

    let tx = screenX - ttW / 2;
    tx = Math.max(30, Math.min(W - ttW - 30, tx));

    let ty = screenY + pad;
    if (ty + 130 > H - 30) {
      ty = screenY - pad - 130;
    }
    ty = Math.max(30, Math.min(H - 160, ty));

    tooltip.style.left = tx + 'px';
    tooltip.style.top = ty + 'px';
  }

  let resolved = [], iframeReady = false;
  function resolve() {
    resolved = config.knobs.map(k => {
      let pos = null;
      if (k.selector && iframeReady) {
        const ep = queryIframe(k.selector);
        if (ep) {
          pos = ui2s(ep.x, ep.y);
          console.log(`[OK] ${k.name}: (${ep.x.toFixed(0)},${ep.y.toFixed(0)}) → (${pos.x.toFixed(0)},${pos.y.toFixed(0)})`);
        } else {
          console.log(`[MISS] ${k.name}: "${k.selector}" not found`);
        }
      }
      if (!pos && k.uiX !== undefined) pos = ui2s(k.uiX, k.uiY);
      if (!pos && k.x !== undefined) pos = { x: k.x, y: k.y };
      return { ...k, sx: pos ? pos.x : W/2, sy: pos ? pos.y : H/2 };
    });
  }

  let step = -1, isOverview = true;
  function showOverview() {
    isOverview = true; resetCam();
    cursor.style.opacity = '0';
    tooltip.classList.remove('visible');
    overviewLabel.classList.add('visible');
    overviewLabel.classList.remove('hidden');
  }
  function zoomToKnob(k) {
    isOverview = false;
    overviewLabel.classList.remove('visible');
    overviewLabel.classList.add('hidden');
    setCam(k.sx, k.sy, zoomIn);
    cursor.style.opacity = '1';
    cursor.style.left = k.sx + 'px';
    cursor.style.top = k.sy + 'px';
    tooltip.classList.remove('visible');

    setTimeout(() => {
      tooltip.querySelector('.tt-name').textContent = k.name;
      tooltip.querySelector('.tt-desc').textContent = k.desc;
      placeTooltip();
      tooltip.classList.add('visible');
      const r = document.createElement('div');
      r.className = 'click-ripple';
      cursor.appendChild(r);
      setTimeout(() => r.remove(), 600);
    }, 1600);
  }
  function nextStep() {
    step++;
    if (step >= resolved.length) { step = -1; showOverview(); return; }
    if (step === 0) resolve();
    zoomToKnob(resolved[step]);
  }

  uiFrame.addEventListener('load', () => {
    iframeReady = true;
    setTimeout(() => { resolve(); console.log(`[Desktop] Iframe ready, ${resolved.length} knobs`); }, 800);
  });

  resolve();
  resetCam();
  setTimeout(() => overviewLabel.classList.add('visible'), 800);
  setTimeout(() => { if (!iframeReady) resolve(); nextStep(); setInterval(nextStep, config.stepInterval || 4500); }, config.overviewDuration || 4000);
}
