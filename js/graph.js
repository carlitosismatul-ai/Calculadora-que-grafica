/* =========================================================
   MathGraph Studio — Graph Engine 2.1
   - Gráficas cartesianas
   - Curvas paramétricas
   - Curvas implícitas mediante Marching Squares
   - Puntos, asíntotas, zoom y desplazamiento
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
            this.implicitCurves = [];
            this.points = [];
            this.asymptotes = [];

            this.onDraw = null;
            this.onPointer = null;

            this.dragging = false;
            this.lastPointer = null;
            this.destroyed = false;
            this.framePending = false;

            this.canvas.style.touchAction = 'none';

            this._bindEvents();
            this.resize();

            if (typeof ResizeObserver !== 'undefined') {
                this.resizeObserver = new ResizeObserver(() => {
                    if (!this.destroyed) this.resize();
                });

                this.resizeObserver.observe(this.canvas);
            }
        }

        /* ==========================================
           EVENTOS
        ========================================== */

        _bindEvents() {
            this._handlePointerDown = event => {
                if (this.destroyed || !event.isPrimary) return;

                this.dragging = true;
                this.lastPointer = {
                    x: event.clientX,
                    y: event.clientY
                };

                try {
                    this.canvas.setPointerCapture(event.pointerId);
                } catch (_) {
                    // La captura puede no estar disponible en algunos entornos.
                }

                event.preventDefault();
            };

            this._handlePointerMove = event => {
                if (this.destroyed) return;

                const rect = this.canvas.getBoundingClientRect();
                const px = event.clientX - rect.left;
                const py = event.clientY - rect.top;

                if (
                    typeof this.onPointer === 'function' &&
                    px >= 0 && py >= 0 &&
                    px <= rect.width && py <= rect.height
                ) {
                    this.onPointer(this.screenToWorld(px, py), event);
                }

                if (!this.dragging || !this.lastPointer) return;

                const dx = event.clientX - this.lastPointer.x;
                const dy = event.clientY - this.lastPointer.y;

                this.offsetX += dx / this.scale;
                this.offsetY -= dy / this.scale;

                this.lastPointer = {
                    x: event.clientX,
                    y: event.clientY
                };

                this._scheduleDraw();
            };

            this._handlePointerUp = () => {
                this.dragging = false;
                this.lastPointer = null;
            };

            this._handleWheel = event => {
                if (this.destroyed) return;

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

                // Mantiene fijo el punto situado debajo del cursor.
                this.offsetX += before.x - after.x;
                this.offsetY += before.y - after.y;

                this._scheduleDraw();
            };

            this.canvas.addEventListener(
                'pointerdown',
                this._handlePointerDown
            );

            this.canvas.addEventListener(
                'pointermove',
                this._handlePointerMove
            );

            this.canvas.addEventListener(
                'pointerup',
                this._handlePointerUp
            );

            this.canvas.addEventListener(
                'pointercancel',
                this._handlePointerUp
            );

            this.canvas.addEventListener(
                'lostpointercapture',
                this._handlePointerUp
            );

            this.canvas.addEventListener(
                'wheel',
                this._handleWheel,
                { passive: false }
            );

            this._handleWindowResize = () => {
                if (!this.destroyed) this.resize();
            };

            window.addEventListener('resize', this._handleWindowResize);
        }

        _scheduleDraw() {
            if (this.framePending || this.destroyed) return;

            this.framePending = true;

            requestAnimationFrame(() => {
                this.framePending = false;

                if (!this.destroyed) {
                    this.draw();
                }
            });
        }

        /* ==========================================
           TAMAÑO Y COORDENADAS
        ========================================== */

        resize() {
            if (this.destroyed) return;

            const rect = this.canvas.getBoundingClientRect();

            this.w = Math.max(1, rect.width);
            this.h = Math.max(1, rect.height);

            this.originX = this.w / 2;
            this.originY = this.h / 2;

            const dpr = Math.max(
                1,
                Math.min(window.devicePixelRatio || 1, 3)
            );

            this.canvas.width = Math.round(this.w * dpr);
            this.canvas.height = Math.round(this.h * dpr);

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

        /* ==========================================
           CURVAS CARTESIANAS
        ========================================== */

        clearCurves() {
            this.curves = [];
        }

        addCurve(fn, color = '#2d9cff', width = 2.5) {
            if (typeof fn !== 'function') {
                throw new TypeError('La curva necesita una función.');
            }

            this.curves.push({ fn, color, width });
            return this;
        }

        /* ==========================================
           CURVAS PARAMÉTRICAS
        ========================================== */

        clearParametrics() {
            this.parametrics = [];
        }

        addParametric(
            fnx,
            fny,
            tMin,
            tMax,
            color = '#2d9cff',
            width = 2.5,
            close = false
        ) {
            if (
                typeof fnx !== 'function' ||
                typeof fny !== 'function'
            ) {
                throw new TypeError(
                    'La curva paramétrica necesita funciones para x e y.'
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

            return this;
        }

        /* ==========================================
           CURVAS IMPLÍCITAS

           Una curva implícita se representa como:

               F(x, y) = 0

           Ejemplos:
               x² + y² - 25 = 0
               x² - y² - 1 = 0
               y² - x³ + 2x = 0

           El método Marching Squares busca los cruces
           de F(x,y) = 0 dentro de pequeñas celdas.
        ========================================== */

        clearImplicit() {
            this.implicitCurves = [];
        }

        addImplicit(
            fn,
            color = '#21d4fd',
            width = 2.5
        ) {
            if (typeof fn !== 'function') {
                throw new TypeError(
                    'La curva implícita necesita una función F(x, y).'
                );
            }

            this.implicitCurves.push({
                fn,
                color,
                width
            });

            return this;
        }

        _safeEvaluate(fn, x, y) {
            try {
                const value = fn(x, y);

                return Number.isFinite(value)
                    ? value
                    : NaN;
            } catch (_) {
                return NaN;
            }
        }

        _interpolateEdge(a, b, va, vb) {
            const denominator = va - vb;

            let t = Math.abs(denominator) < 1e-14
                ? 0.5
                : va / denominator;

            t = Math.max(0, Math.min(1, t));

            return {
                x: a.x + (b.x - a.x) * t,
                y: a.y + (b.y - a.y) * t
            };
        }

        _implicit(curve) {
            const ctx = this.ctx;

            // Cada celda mide unos 7 píxeles.
            // Así se mantiene un equilibrio entre detalle y rendimiento.
            const cellSize = 7;

            const columns = Math.ceil(this.w / cellSize);
            const rows = Math.ceil(this.h / cellSize);

            // Evita un cálculo desmesurado en pantallas extraordinarias.
            if (columns * rows > 180000) return;

            const cache = new Map();

            const evaluateScreenPoint = (px, py) => {
                const key = `${px},${py}`;

                if (cache.has(key)) {
                    return cache.get(key);
                }

                const world = this.screenToWorld(px, py);
                const value = this._safeEvaluate(
                    curve.fn,
                    world.x,
                    world.y
                );

                cache.set(key, value);
                return value;
            };

            ctx.save();
            ctx.strokeStyle = curve.color;
            ctx.lineWidth = curve.width;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            ctx.beginPath();

            for (let row = 0; row < rows; row++) {
                const y0 = row * cellSize;
                const y1 = Math.min((row + 1) * cellSize, this.h);

                for (let column = 0; column < columns; column++) {
                    const x0 = column * cellSize;
                    const x1 = Math.min(
                        (column + 1) * cellSize,
                        this.w
                    );

                    const corners = [
                        { x: x0, y: y0 },
                        { x: x1, y: y0 },
                        { x: x1, y: y1 },
                        { x: x0, y: y1 }
                    ];

                    const values = corners.map(point =>
                        evaluateScreenPoint(point.x, point.y)
                    );

                    if (values.some(value => !Number.isFinite(value))) {
                        continue;
                    }

                    const intersections = [];

                    // Aristas: arriba, derecha, abajo e izquierda.
                    const edges = [
                        [0, 1],
                        [1, 2],
                        [2, 3],
                        [3, 0]
                    ];

                    for (const [ia, ib] of edges) {
                        const va = values[ia];
                        const vb = values[ib];

                        if (
                            (va < 0 && vb > 0) ||
                            (va > 0 && vb < 0) ||
                            (va === 0 && vb !== 0) ||
                            (vb === 0 && va !== 0)
                        ) {
                            intersections.push(
                                this._interpolateEdge(
                                    corners[ia],
                                    corners[ib],
                                    va,
                                    vb
                                )
                            );
                        }
                    }

                    if (intersections.length === 2) {
                        ctx.moveTo(
                            intersections[0].x,
                            intersections[0].y
                        );

                        ctx.lineTo(
                            intersections[1].x,
                            intersections[1].y
                        );
                    } else if (intersections.length === 4) {
                        // En celdas ambiguas, usamos el centro para
                        // decidir una conexión consistente.
                        const centerValue = evaluateScreenPoint(
                            (x0 + x1) / 2,
                            (y0 + y1) / 2
                        );

                        const centerSign = Number.isFinite(centerValue)
                            ? centerValue >= 0
                            : values[0] >= 0;

                        if ((values[0] >= 0) === centerSign) {
                            ctx.moveTo(
                                intersections[0].x,
                                intersections[0].y
                            );
                            ctx.lineTo(
                                intersections[3].x,
                                intersections[3].y
                            );

                            ctx.moveTo(
                                intersections[1].x,
                                intersections[1].y
                            );
                            ctx.lineTo(
                                intersections[2].x,
                                intersections[2].y
                            );
                        } else {
                            ctx.moveTo(
                                intersections[0].x,
                                intersections[0].y
                            );
                            ctx.lineTo(
                                intersections[1].x,
                                intersections[1].y
                            );

                            ctx.moveTo(
                                intersections[2].x,
                                intersections[2].y
                            );
                            ctx.lineTo(
                                intersections[3].x,
                                intersections[3].y
                            );
                        }
                    }
                }
            }

            ctx.stroke();
            ctx.restore();
        }

        /* ==========================================
           PUNTOS
        ========================================== */

        clearPoints() {
            this.points = [];
        }

        addPoint(
            x,
            y,
            color = '#ff2fba',
            radius = 4,
            label = ''
        ) {
            this.points.push({
                x,
                y,
                color,
                radius,
                label
            });

            return this;
        }

        /* ==========================================
           ASÍNTOTAS
        ========================================== */

        clearAsymptotes() {
            this.asymptotes = [];
        }

        addAsymptote(
            type,
            value,
            color = 'rgba(255, 100, 100, 0.8)'
        ) {
            this.asymptotes.push({ type, value, color });
            return this;
        }

        /* ==========================================
           DIBUJO DE LA CUADRÍCULA
        ========================================== */

        _drawGrid() {
            const ctx = this.ctx;
            const step = this._gridStep();

            ctx.save();
            ctx.lineWidth = 1;

            ctx.strokeStyle = 'rgba(120, 145, 160, 0.13)';
            ctx.beginPath();

            const topLeft = this.screenToWorld(0, 0);
            const bottomRight = this.screenToWorld(this.w, this.h);

            const startX = Math.floor(topLeft.x / step) * step;
            const endX = Math.ceil(bottomRight.x / step) * step;

            for (let x = startX; x <= endX; x += step) {
                const sx = this.worldToScreen(x, 0).x;

                ctx.moveTo(Math.round(sx) + 0.5, 0);
                ctx.lineTo(Math.round(sx) + 0.5, this.h);
            }

            const minY = Math.min(topLeft.y, bottomRight.y);
            const maxY = Math.max(topLeft.y, bottomRight.y);

            const startY = Math.floor(minY / step) * step;
            const endY = Math.ceil(maxY / step) * step;

            for (let y = startY; y <= endY; y += step) {
                const sy = this.worldToScreen(0, y).y;

                ctx.moveTo(0, Math.round(sy) + 0.5);
                ctx.lineTo(this.w, Math.round(sy) + 0.5);
            }

            ctx.stroke();

            this._drawAxes();

            ctx.restore();
        }

        _gridStep() {
            const pixelsPerUnit = this.scale;
            const options = [
                0.1, 0.2, 0.5, 1, 2, 5,
                10, 20, 50, 100, 200, 500
            ];

            for (const step of options) {
                if (step * pixelsPerUnit >= 35) {
                    return step;
                }
            }

            return 500;
        }

        _drawAxes() {
            const ctx = this.ctx;

            const axisX = this.worldToScreen(0, 0).x;
            const axisY = this.worldToScreen(0, 0).y;

            ctx.strokeStyle = 'rgba(190, 210, 225, 0.7)';
            ctx.fillStyle = 'rgba(190, 210, 225, 0.85)';
            ctx.lineWidth = 1.4;

            ctx.beginPath();

            if (axisY >= 0 && axisY <= this.h) {
                ctx.moveTo(0, axisY);
                ctx.lineTo(this.w, axisY);
            }

            if (axisX >= 0 && axisX <= this.w) {
                ctx.moveTo(axisX, 0);
                ctx.lineTo(axisX, this.h);
            }

            ctx.stroke();

            ctx.font = '11px Inter, Arial, sans-serif';

            const step = this._gridStep();
            const left = this.screenToWorld(0, 0).x;
            const right = this.screenToWorld(this.w, 0).x;

            if (axisY >= 0 && axisY <= this.h) {
                for (
                    let x = Math.ceil(left / step) * step;
                    x <= right;
                    x += step
                ) {
                    if (Math.abs(x) < 1e-10) continue;

                    const sx = this.worldToScreen(x, 0).x;

                    ctx.beginPath();
                    ctx.moveTo(sx, axisY - 3);
                    ctx.lineTo(sx, axisY + 3);
                    ctx.stroke();

                    ctx.textAlign = 'center';

                    const labelY = axisY + 14 < this.h
                        ? axisY + 14
                        : axisY - 6;

                    ctx.fillText(
                        Number(x.toPrecision(5)).toString(),
                        sx,
                        labelY
                    );
                }
            }

            const top = this.screenToWorld(0, 0).y;
            const bottom = this.screenToWorld(0, this.h).y;

            if (axisX >= 0 && axisX <= this.w) {
                for (
                    let y = Math.ceil(bottom / step) * step;
                    y <= top;
                    y += step
                ) {
                    if (Math.abs(y) < 1e-10) continue;

                    const sy = this.worldToScreen(0, y).y;

                    ctx.beginPath();
                    ctx.moveTo(axisX - 3, sy);
                    ctx.lineTo(axisX + 3, sy);
                    ctx.stroke();

                    ctx.textAlign = axisX + 7 < this.w
                        ? 'left'
                        : 'right';

                    const labelX = axisX + 7 < this.w
                        ? axisX + 6
                        : axisX - 6;

                    ctx.fillText(
                        Number(y.toPrecision(5)).toString(),
                        labelX,
                        sy - 5
                    );
                }
            }
        }

        /* ==========================================
           DIBUJO DE CURVAS
        ========================================== */

        _function(curve) {
            const ctx = this.ctx;

            ctx.save();
            ctx.strokeStyle = curve.color;
            ctx.lineWidth = curve.width;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();

            let drawing = false;
            let previousY = null;

            for (let px = 0; px <= this.w; px += 1) {
                const world = this.screenToWorld(px, 0);
                let y;

                try {
                    y = curve.fn(world.x);
                } catch (_) {
                    y = NaN;
                }

                if (!Number.isFinite(y)) {
                    drawing = false;
                    previousY = null;
                    continue;
                }

                const py = this.worldToScreen(world.x, y).y;

                if (!Number.isFinite(py)) {
                    drawing = false;
                    previousY = null;
                    continue;
                }

                // Evita conectar saltos enormes, por ejemplo en asíntotas.
                if (
                    previousY !== null &&
                    Math.abs(py - previousY) > this.h * 0.75
                ) {
                    drawing = false;
                }

                if (!drawing) {
                    ctx.moveTo(px, py);
                    drawing = true;
                } else {
                    ctx.lineTo(px, py);
                }

                previousY = py;
            }

            ctx.stroke();
            ctx.restore();
        }

        _parametric(curve) {
            const ctx = this.ctx;
            const samples = Math.max(
                500,
                Math.min(2200, Math.ceil(this.w * 2))
            );

            ctx.save();
            ctx.strokeStyle = curve.color;
            ctx.lineWidth = curve.width;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();

            let drawing = false;
            let firstPoint = null;
            let lastPoint = null;

            for (let i = 0; i <= samples; i++) {
                const t = curve.tMin +
                    (curve.tMax - curve.tMin) * i / samples;

                let x, y;

                try {
                    x = curve.fnx(t);
                    y = curve.fny(t);
                } catch (_) {
                    x = NaN;
                    y = NaN;
                }

                if (!Number.isFinite(x) || !Number.isFinite(y)) {
                    drawing = false;
                    continue;
                }

                const point = this.worldToScreen(x, y);

                if (
                    !Number.isFinite(point.x) ||
                    !Number.isFinite(point.y)
                ) {
                    drawing = false;
                    continue;
                }

                if (
                    lastPoint &&
                    Math.hypot(
                        point.x - lastPoint.x,
                        point.y - lastPoint.y
                    ) > Math.max(this.w, this.h) * 0.35
                ) {
                    drawing = false;
                }

                if (!drawing) {
                    ctx.moveTo(point.x, point.y);
                    drawing = true;

                    if (!firstPoint) firstPoint = point;
                } else {
                    ctx.lineTo(point.x, point.y);
                }

                lastPoint = point;
            }

            if (curve.close && firstPoint && lastPoint) {
                ctx.lineTo(firstPoint.x, firstPoint.y);
            }

            ctx.stroke();
            ctx.restore();
        }

        _drawAsymptotes() {
            const ctx = this.ctx;

            ctx.save();
            ctx.setLineDash([7, 6]);
            ctx.lineWidth = 1.4;

            for (const asymptote of this.asymptotes) {
                ctx.strokeStyle = asymptote.color;

                ctx.beginPath();

                if (
                    asymptote.type === 'vertical' ||
                    asymptote.type === 'x'
                ) {
                    const x = this.worldToScreen(asymptote.value, 0).x;
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, this.h);
                } else if (
                    asymptote.type === 'horizontal' ||
                    asymptote.type === 'y'
                ) {
                    const y = this.worldToScreen(0, asymptote.value).y;
                    ctx.moveTo(0, y);
                    ctx.lineTo(this.w, y);
                }

                ctx.stroke();
            }

            ctx.restore();
        }

        _drawPoints() {
            const ctx = this.ctx;

            for (const point of this.points) {
                if (
                    !Number.isFinite(point.x) ||
                    !Number.isFinite(point.y)
                ) continue;

                const screen = this.worldToScreen(point.x, point.y);

                if (
                    screen.x < -20 ||
                    screen.x > this.w + 20 ||
                    screen.y < -20 ||
                    screen.y > this.h + 20
                ) continue;

                ctx.save();

                ctx.beginPath();
                ctx.arc(
                    screen.x,
                    screen.y,
                    point.radius || 4,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle = point.color || '#ff2fba';
                ctx.fill();

                ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                ctx.lineWidth = 1;
                ctx.stroke();

                if (point.label) {
                    ctx.font = '12px Inter, Arial, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillStyle = point.color || '#ff2fba';
                    ctx.fillText(
                        point.label,
                        screen.x + 8,
                        screen.y - 8
                    );
                }

                ctx.restore();
            }
        }

        /* ==========================================
           RENDERIZADO PRINCIPAL
        ========================================== */

        draw() {
            if (this.destroyed || !this.ctx) return;

            const ctx = this.ctx;

            ctx.clearRect(0, 0, this.w, this.h);

            this._drawGrid();
            this._drawAsymptotes();

            for (const curve of this.curves) {
                this._function(curve);
            }

            for (const curve of this.parametrics) {
                this._parametric(curve);
            }

            // Se dibujan después de las curvas tradicionales.
            for (const curve of this.implicitCurves) {
                this._implicit(curve);
            }

            this._drawPoints();

            if (typeof this.onDraw === 'function') {
                this.onDraw(this);
            }
        }

        /* ==========================================
           AJUSTAR VISTA
        ========================================== */

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

                    try {
                        scan(x, curve.fn(x));
                    } catch (_) {
                        // Ignorar puntos no evaluables.
                    }
                }
            }

            for (const curve of this.parametrics) {
                for (let i = 0; i <= 400; i++) {
                    const t = curve.tMin +
                        (curve.tMax - curve.tMin) * i / 400;

                    try {
                        scan(curve.fnx(t), curve.fny(t));
                    } catch (_) {
                        // Ignorar puntos no evaluables.
                    }
                }
            }

            for (const point of this.points) {
                scan(point.x, point.y);
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

            this.scale = Math.max(
                this.minScale,
                Math.min(
                    this.maxScale,
                    Math.min(
                        this.w / (rangeX * 1.2),
                        this.h / (rangeY * 1.2)
                    )
                )
            );

            this.offsetX = -centerX;
            this.offsetY = -centerY;

            this.draw();
        }

        /* ==========================================
           DESTRUIR INSTANCIA
        ========================================== */

        destroy() {
            if (this.destroyed) return;

            this.destroyed = true;

            this.canvas.removeEventListener(
                'pointerdown',
                this._handlePointerDown
            );

            this.canvas.removeEventListener(
                'pointermove',
                this._handlePointerMove
            );

            this.canvas.removeEventListener(
                'pointerup',
                this._handlePointerUp
            );

            this.canvas.removeEventListener(
                'pointercancel',
                this._handlePointerUp
            );

            this.canvas.removeEventListener(
                'lostpointercapture',
                this._handlePointerUp
            );

            this.canvas.removeEventListener(
                'wheel',
                this._handleWheel
            );

            window.removeEventListener(
                'resize',
                this._handleWindowResize
            );

            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }

            this.curves = [];
            this.parametrics = [];
            this.implicitCurves = [];
            this.points = [];
            this.asymptotes = [];
        }
    }

    global.Graph = Graph;

})(window);

