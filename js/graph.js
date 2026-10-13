/* =========================================================
MathGraph Studio — Graph Engine 2.0
Renderizado, navegación e interacción optimizados.
Compatible con app.js y la API Graph existente.
========================================================= */

(function (global) {
'use strict';

class Graph {
constructor(canvas, opts = {}) {
if (!canvas || typeof canvas.getContext !== 'function') {
throw new TypeError('Graph necesita un elemento canvas válido.');
}


  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');

  if (!this.ctx) {
    throw new Error('No se pudo obtener el contexto 2D del canvas.');
  }

  this.scale = Number.isFinite(opts.scale) && opts.scale > 0
    ? opts.scale
    : 32;

  this.minScale = 4;
  this.maxScale = 500;

  this.offsetX = 0;
  this.offsetY = 0;

  this.curves = [];
  this.parametrics = [];
  this.points = [];
  this.asymptotes = [];

  this.onDraw = null;
  this.onPointer = null;

  this.dragging = false;
  this._activePointerId = null;
  this._lastPointer = null;
  this._resizeObserver = null;
  this._framePending = false;
  this._destroyed = false;

  this.canvas.style.touchAction = 'none';

  this._bind();
  this.resize();
}

/* =========================
   EVENTOS E INTERACCIÓN
   ========================= */

_bind() {
  const canvas = this.canvas;

  canvas.addEventListener('pointerdown', event => {
    if (this._destroyed || !event.isPrimary) return;

    if (
      this._onPointDrag &&
      this._onPointDrag(event, 'start')
    ) {
      this._activePointerId = event.pointerId;
      return;
    }

    this.dragging = true;
    this._activePointerId = event.pointerId;

    this._lastPointer = {
      x: event.clientX,
      y: event.clientY
    };

    try {
      canvas.setPointerCapture(event.pointerId);
    } catch (_) {
      // Algunos navegadores pueden no admitir la captura.
    }

    event.preventDefault();
  });

  canvas.addEventListener('pointermove', event => {
    if (this._destroyed) return;

    const rect = canvas.getBoundingClientRect();

    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;

    const inside =
      px >= 0 &&
      py >= 0 &&
      px <= rect.width &&
      py <= rect.height;

    if (inside && typeof this.onPointer === 'function') {
      this.onPointer(this.screenToWorld(px, py), event);
    }

    if (
      this._activePointerId !== null &&
      event.pointerId !== this._activePointerId
    ) {
      return;
    }

    if (
      this._onPointDrag &&
      this._activePointerId !== null
    ) {
      const handled = this._onPointDrag(event, 'move');

      if (handled) return;
    }

    if (!this.dragging || !this._lastPointer) return;

    const dx = event.clientX - this._lastPointer.x;
    const dy = event.clientY - this._lastPointer.y;

    this.offsetX += dx / this.scale;
    this.offsetY -= dy / this.scale;

    this._lastPointer = {
      x: event.clientX,
      y: event.clientY
    };

    this._scheduleDraw();
  });

  const finishPointer = event => {
    if (
      this._activePointerId !== null &&
      event.pointerId !== this._activePointerId
    ) {
      return;
    }

    this.dragging = false;
    this._lastPointer = null;
    this._activePointerId = null;

    if (this._onPointDrag) {
      this._onPointDrag(event, 'end');
    }
  };

  canvas.addEventListener('pointerup', finishPointer);
  canvas.addEventListener('pointercancel', finishPointer);
  canvas.addEventListener('lostpointercapture', finishPointer);

  canvas.addEventListener('wheel', event => {
    if (this._destroyed) return;

    event.preventDefault();

    const before = this.screenToWorld(
      event.offsetX,
      event.offsetY
    );

    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;

    this.scale = Math.max(
      this.minScale,
      Math.min(this.maxScale, this.scale * factor)
    );

    const after = this.screenToWorld(
      event.offsetX,
      event.offsetY
    );

    // Conserva la posición matemática bajo el cursor.
    this.offsetX += before.x - after.x;
    this.offsetY += before.y - after.y;

    this._scheduleDraw();
  }, { passive: false });

  window.addEventListener('resize', () => {
    if (!this._destroyed) this.resize();
  });

  if (typeof ResizeObserver !== 'undefined') {
    this._resizeObserver = new ResizeObserver(() => {
      if (!this._destroyed) this.resize();
    });

    this._resizeObserver.observe(canvas);
  }
}

_scheduleDraw() {
  if (this._framePending || this._destroyed) return;

  this._framePending = true;

  requestAnimationFrame(() => {
    this._framePending = false;

    if (!this._destroyed) this.draw();
  });
}

/* =========================
   TAMAÑO Y COORDENADAS
   ========================= */

resize() {
  if (this._destroyed) return;

  const rect = this.canvas.getBoundingClientRect();

  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);

  const dpr = Math.max(
    1,
    Math.min(window.devicePixelRatio || 1, 3)
  );

  this.w = width;
  this.h = height;

  this.originX = width / 2;
  this.originY = height / 2;

  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));

  if (
    this.canvas.width !== pixelWidth ||
    this.canvas.height !== pixelHeight
  ) {
    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;
  }

  this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  this.draw();
}

worldToScreen(x, y) {
  return {
    x: this.originX + (x + this.offsetX) * this.scale,
    y: this.originY - (y + this.offsetY) * this.scale
  };
}

screenToWorld(px, py) {
  return {
    x: (px - this.originX) / this.scale - this.offsetX,
    y: -(py - this.originY) / this.scale - this.offsetY
  };
}

reset() {
  this.offsetX = 0;
  this.offsetY = 0;
  this.scale = 32;
  this.draw();
}

fitToContent() {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const scan = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };

  for (const curve of this.curves) {
    for (let i = 0; i <= 400; i++) {
      const x = -10 + 20 * i / 400;
      scan(x, curve.fn(x));
    }
  }

  for (const parametric of this.parametrics) {
    for (let i = 0; i <= 400; i++) {
      const t = parametric.tMin +
        (parametric.tMax - parametric.tMin) * i / 400;

      scan(
        parametric.fnx(t),
        parametric.fny(t)
      );
    }
  }

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxY)
  ) {
    this.draw();
    return;
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const rangeX = Math.max(maxX - minX, 1);
  const rangeY = Math.max(maxY - minY, 1);

  const padding = 1.18;

  const scaleX = this.w / (rangeX * padding);
  const scaleY = this.h / (rangeY * padding);

  this.scale = Math.max(
    this.minScale,
    Math.min(this.maxScale, Math.min(scaleX, scaleY))
  );

  this.offsetX = -centerX;
  this.offsetY = -centerY;

  this.draw();
}

/* =========================
   API DE CURVAS Y ELEMENTOS
   ========================= */

clearCurves() {
  this.curves = [];
}

addCurve(fn, color = '#5dd8ff', width = 2.7) {
  if (typeof fn !== 'function') {
    throw new TypeError('La curva necesita una función válida.');
  }

  this.curves.push({ fn, color, width });
}

clearParametrics() {
  this.parametrics = [];
}

addParametric(
  fnx,
  fny,
  tMin,
  tMax,
  color = '#8a5cff',
  width = 2.7,
  close = false
) {
  if (typeof fnx !== 'function' || typeof fny !== 'function') {
    throw new TypeError(
      'La curva paramétrica necesita funciones x(t) e y(t).'
    );
  }

  if (
    !Number.isFinite(tMin) ||
    !Number.isFinite(tMax) ||
    tMax <= tMin
  ) {
    throw new RangeError(
      'Los límites paramétricos no son válidos.'
    );
  }

  this.parametrics.push({
    fnx,
    fny,
    tMin,
    tMax,
    color,
    width,
    close
  });
}

clearPoints() {
  this.points = [];
}

addPoint(
  x,
  y,
  color = '#ff2fba',
  radius = 5,
  label = ''
) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;

  this.points.push({
    x,
    y,
    color,
    radius,
    label
  });
}

/* =========================
   RENDERIZADO PRINCIPAL
   ========================= */

draw() {
  if (this._destroyed || !this.ctx) return;

  const { ctx, w, h } = this;

  ctx.clearRect(0, 0, w, h);

  this._grid();
  this._axes();
  this._asymptotes();

  for (const curve of this.curves) {
    this._function(curve);
  }

  for (const parametric of this.parametrics) {
    this._parametric(parametric);
  }

  for (const point of this.points) {
    this._point(point);
  }

  if (typeof this.onDraw === 'function') {
    this.onDraw(this);
  }
}

/* =========================
   CUADRÍCULA
   ========================= */

_nice() {
  const raw = 65 / this.scale;

  if (!Number.isFinite(raw) || raw <= 0) return 1;

  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / power;

  const multiplier =
    normalized < 1.5 ? 1 :
    normalized < 3.5 ? 2 :
    normalized < 7.5 ? 5 : 10;

  return multiplier * power;
}

_grid() {
  const { ctx, w, h } = this;
  const step = this._nice();

  const styles = getComputedStyle(document.documentElement);

  ctx.save();

  ctx.strokeStyle =
    styles.getPropertyValue('--grid-line').trim() ||
    'rgba(90,150,230,.12)';

  ctx.lineWidth = 1;
  ctx.beginPath();

  const left = this.screenToWorld(0, 0).x;
  const right = this.screenToWorld(w, 0).x;
  const top = this.screenToWorld(0, 0).y;
  const bottom = this.screenToWorld(0, h).y;

  const firstX = Math.floor(left / step);
  const lastX = Math.ceil(right / step);

  const firstY = Math.floor(bottom / step);
  const lastY = Math.ceil(top / step);

  // Protección ante escalas o dimensiones anormales.
  const maxLines = 2000;

  for (
    let i = firstX;
    i <= lastX && i - firstX < maxLines;
    i++
  ) {
    const x = i * step;
    const screen = this.worldToScreen(x, 0);

    ctx.moveTo(screen.x, 0);
    ctx.lineTo(screen.x, h);
  }

  for (
    let i = firstY;
    i <= lastY && i - firstY < maxLines;
    i++
  ) {
    const y = i * step;
    const screen = this.worldToScreen(0, y);

    ctx.moveTo(0, screen.y);
    ctx.lineTo(w, screen.y);
  }

  ctx.stroke();

  ctx.fillStyle =
    styles.getPropertyValue('--muted').trim() || '#8094b4';

  ctx.font = '10px JetBrains Mono, monospace';

  for (
    let i = firstX;
    i <= lastX && i - firstX < maxLines;
    i++
  ) {
    const x = i * step;
    if (Math.abs(x) < 1e-10) continue;

    const screen = this.worldToScreen(x, 0);

    if (screen.x > 0 && screen.x < w - 15) {
      const axisY = this.worldToScreen(0, 0).y;

      const labelY = Math.max(
        12,
        Math.min(h - 3, axisY + 13)
      );

      ctx.fillText(this._fmt(x), screen.x + 3, labelY);
    }
  }

  for (
    let i = firstY;
    i <= lastY && i - firstY < maxLines;
    i++
  ) {
    const y = i * step;
    if (Math.abs(y) < 1e-10) continue;

    const screen = this.worldToScreen(0, y);

    if (screen.y > 12 && screen.y < h - 2) {
      const axisX = this.worldToScreen(0, 0).x;

      const labelX = Math.max(
        3,
        Math.min(w - 35, axisX + 5)
      );

      ctx.fillText(
        this._fmt(y),
        labelX,
        screen.y - 3
      );
    }
  }

  ctx.restore();
}

_fmt(value) {
  if (!Number.isFinite(value)) return '';

  const rounded = Number(value.toPrecision(5));

  return Object.is(rounded, -0) || Math.abs(rounded) < 1e-10
    ? '0'
    : String(rounded);
}

/* =========================
   EJES
   ========================= */

_axes() {
  const { ctx, w, h } = this;

  const styles = getComputedStyle(document.documentElement);
  const origin = this.worldToScreen(0, 0);

  ctx.save();

  ctx.strokeStyle =
    styles.getPropertyValue('--axis-color').trim() ||
    '#7890b0';

  ctx.lineWidth = 1.5;

  ctx.beginPath();

  if (origin.x >= 0 && origin.x <= w) {
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, h);
  }

  if (origin.y >= 0 && origin.y <= h) {
    ctx.moveTo(0, origin.y);
    ctx.lineTo(w, origin.y);
  }

  ctx.stroke();

  ctx.fillStyle =
    styles.getPropertyValue('--cyan').trim() || '#5dd8ff';

  ctx.font = '700 10px JetBrains Mono, monospace';

  if (origin.x >= -10 && origin.x <= w) {
    ctx.fillText('y', origin.x + 6, 12);
  }

  if (origin.y >= 10 && origin.y <= h + 7) {
    ctx.fillText('x', w - 13, origin.y - 7);
  }

  ctx.restore();
}

/* =========================
   ASÍNTOTAS VERTICALES
   ========================= */

_asymptotes() {
  if (!Array.isArray(this.asymptotes) || !this.asymptotes.length) {
    return;
  }

  const { ctx, h } = this;

  ctx.save();

  ctx.strokeStyle = '#ff5577';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 6]);

  for (const value of this.asymptotes) {
    if (!Number.isFinite(value)) continue;

    const screen = this.worldToScreen(value, 0);

    if (screen.x < 0 || screen.x > this.w) continue;

    ctx.beginPath();
    ctx.moveTo(screen.x, 0);
    ctx.lineTo(screen.x, h);
    ctx.stroke();
  }

  ctx.restore();
}

/* =========================
   FUNCIONES CARTESIANAS
   ========================= */

_function(curve) {
  const { ctx, w, h } = this;

  const fn = curve.fn;

  if (typeof fn !== 'function') return;

  ctx.save();

  ctx.shadowBlur = 8;
  ctx.shadowColor = curve.color;
  ctx.strokeStyle = curve.color;
  ctx.lineWidth = curve.width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();

  let started = false;
  let previousX = null;
  let previousY = null;

  // Evita conectar muestras a través de saltos grandes.
  const jumpLimit = Math.max(30, h * 0.8);

  for (let px = 0; px <= w; px++) {
    const x = this.screenToWorld(px, 0).x;

    let y;

    try {
      y = fn(x);
    } catch (_) {
      y = NaN;
    }

    if (!Number.isFinite(y)) {
      started = false;
      previousX = null;
      previousY = null;
      continue;
    }

    const screen = this.worldToScreen(x, y);

    if (!Number.isFinite(screen.y)) {
      started = false;
      previousX = null;
      previousY = null;
      continue;
    }

    // Valores extremadamente alejados del lienzo no necesitan
    // ser dibujados. Se conserva la posibilidad de volver a entrar.
    if (screen.y < -h * 4 || screen.y > h * 5) {
      started = false;
      previousX = null;
      previousY = null;
      continue;
    }

    if (
      previousY !== null &&
      (
        Math.abs(screen.y - previousY) > jumpLimit ||
        Math.abs(screen.x - previousX) > 3
      )
    ) {
      started = false;
    }

    if (!started) {
      ctx.moveTo(screen.x, screen.y);
      started = true;
    } else {
      ctx.lineTo(screen.x, screen.y);
    }

    previousX = screen.x;
    previousY = screen.y;
  }

  ctx.stroke();
  ctx.restore();
}

/* =========================
   CURVAS PARAMÉTRICAS
   ========================= */

_parametric(parametric) {
  const { ctx, w, h } = this;

  ctx.save();

  ctx.shadowBlur = 8;
  ctx.shadowColor = parametric.color;
  ctx.strokeStyle = parametric.color;
  ctx.lineWidth = parametric.width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();

  let started = false;
  let previous = null;

  // Mantiene la compatibilidad con la API actual.
  const steps = 1200;

  const jumpLimit = Math.max(w, h) * 0.5;

  for (let i = 0; i <= steps; i++) {
    const t = parametric.tMin +
      (parametric.tMax - parametric.tMin) * i / steps;

    let x;
    let y;

    try {
      x = parametric.fnx(t);
      y = parametric.fny(t);
    } catch (_) {
      x = NaN;
      y = NaN;
    }

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      started = false;
      previous = null;
      continue;
    }

    const screen = this.worldToScreen(x, y);

    if (
      !Number.isFinite(screen.x) ||
      !Number.isFinite(screen.y) ||
      Math.abs(screen.x) > w * 10 ||
      Math.abs(screen.y) > h * 10
    ) {
      started = false;
      previous = null;
      continue;
    }

    if (
      previous &&
      Math.hypot(
        screen.x - previous.x,
        screen.y - previous.y
      ) > jumpLimit
    ) {
      started = false;
    }

    if (!started) {
      ctx.moveTo(screen.x, screen.y);
      started = true;
    } else {
      ctx.lineTo(screen.x, screen.y);
    }

    previous = screen;
  }

  if (parametric.close && started) {
    ctx.closePath();
  }

  ctx.stroke();
  ctx.restore();
}

/* =========================
   PUNTOS Y ETIQUETAS
   ========================= */

_point(point) {
  const { ctx } = this;

  const screen = this.worldToScreen(point.x, point.y);

  if (
    !Number.isFinite(screen.x) ||
    !Number.isFinite(screen.y) ||
    screen.x < -50 ||
    screen.x > this.w + 50 ||
    screen.y < -50 ||
    screen.y > this.h + 50
  ) {
    return;
  }

  ctx.save();

  ctx.fillStyle = point.color;
  ctx.shadowBlur = 10;
  ctx.shadowColor = point.color;

  ctx.beginPath();

  ctx.arc(
    screen.x,
    screen.y,
    point.radius,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (point.label) {
    ctx.fillStyle =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--text')
        .trim() || '#ffffff';

    ctx.font = '600 10px Inter, sans-serif';

    ctx.fillText(
      point.label,
      screen.x + 8,
      screen.y - 8
    );
  }

  ctx.restore();
}

/* =========================
   LIMPIEZA
   ========================= */

destroy() {
  if (this._destroyed) return;

  this._destroyed = true;

  if (this._resizeObserver) {
    this._resizeObserver.disconnect();
    this._resizeObserver = null;
  }

  this.curves = [];
  this.parametrics = [];
  this.points = [];
  this.asymptotes = [];

  this.onDraw = null;
  this.onPointer = null;
  this._onPointDrag = null;
}


}

global.Graph = Graph;
})(window);
