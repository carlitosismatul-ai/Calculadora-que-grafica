/* =========================================================
   Calculator — análisis matemático según el tipo de función
   ========================================================= */
(function (global) {
  const M = global.MathEngine;

  function fmt(n, d = 4) {
    if (!Number.isFinite(n)) return '—';
    const r = Math.round(n * 10 ** d) / 10 ** d;
    return Object.is(r, -0) ? '0' : String(r);
  }

  // -------- Lineal: f(x) = a x + b --------
  function analyzeLinear(fn) {
    const b = fn.at(0);
    const a = fn.at(1) - b;
    const items = [
      { label: 'Pendiente (m)', value: fmt(a) },
      { label: 'Intersección en Y', value: `(0, ${fmt(b)})` },
    ];
    if (Math.abs(a) > 1e-9) {
      const root = -b / a;
      items.push({ label: 'Raíz (intersección en X)', value: `(${fmt(root)}, 0)` });
    } else {
      items.push({ label: 'Raíz', value: a === 0 && b === 0 ? 'Infinitas soluciones' : 'No tiene (recta horizontal)' });
    }
    items.push({ label: 'Tipo de pendiente', value: a > 0 ? 'Creciente' : a < 0 ? 'Decreciente' : 'Constante' });
    return { items, roots: Math.abs(a) > 1e-9 ? [-b / a] : [] };
  }

  // -------- Cuadrática: f(x) = a x^2 + b x + c --------
  function analyzeQuadratic(fn) {
    const f0 = fn.at(0), f1 = fn.at(1), fm1 = fn.at(-1);
    const a = (f1 + fm1 - 2 * f0) / 2;
    const b = (f1 - fm1) / 2;
    const c = f0;
    const disc = b * b - 4 * a * c;
    const items = [
      { label: 'Coeficientes', value: `a=${fmt(a)}, b=${fmt(b)}, c=${fmt(c)}` },
      { label: 'Discriminante (Δ)', value: fmt(disc) },
    ];
    let roots = [];
    if (Math.abs(a) < 1e-9) {
      items.push({ label: 'Aviso', value: 'a ≈ 0: se comporta como función lineal' });
      return { ...analyzeLinear(fn), items: [...items] };
    }
    if (disc > 1e-9) {
      const r1 = (-b + Math.sqrt(disc)) / (2 * a);
      const r2 = (-b - Math.sqrt(disc)) / (2 * a);
      roots = [r1, r2].sort((x, y) => x - y);
      items.push({ label: 'Raíces reales', value: `x₁=${fmt(r1)}, x₂=${fmt(r2)}` });
    } else if (Math.abs(disc) <= 1e-9) {
      const r = -b / (2 * a);
      roots = [r];
      items.push({ label: 'Raíz doble', value: `x=${fmt(r)}` });
    } else {
      const re = -b / (2 * a), im = Math.sqrt(-disc) / (2 * a);
      items.push({ label: 'Raíces complejas', value: `${fmt(re)} ± ${fmt(im)}i` });
    }
    const vx = -b / (2 * a), vy = fn.at(vx);
    items.push({ label: 'Vértice', value: `(${fmt(vx)}, ${fmt(vy)})` });
    items.push({ label: 'Concavidad', value: a > 0 ? 'Hacia arriba (mínimo)' : 'Hacia abajo (máximo)' });
    items.push({ label: 'Eje de simetría', value: `x = ${fmt(vx)}` });
    return { items, roots, vertex: { x: vx, y: vy } };
  }

  // -------- Polinomial genérica --------
  function analyzePolynomial(fn, xMin = -20, xMax = 20) {
    const roots = M.findRoots(fn, xMin, xMax, 6000);
    const f0 = fn.at(0);
    const items = [
      { label: 'Valor en x=0', value: fmt(f0) },
      { label: 'Raíces encontradas en rango', value: roots.length ? roots.map(r => fmt(r)).join(', ') : 'Ninguna en el rango visible' },
      { label: 'Comportamiento en +∞', value: fn.at(xMax) > fn.at(xMax - 1) ? 'Tiende a crecer' : 'Tiende a decrecer' },
      { label: 'Comportamiento en −∞', value: fn.at(xMin) > fn.at(xMin + 1) ? 'Tiende a crecer' : 'Tiende a decrecer' },
    ];
    return { items, roots };
  }

  // -------- Racional: p(x) / q(x) --------
  function analyzeRational(pFn, qFn, xMin = -20, xMax = 20) {
    const numRoots = M.findRoots(pFn, xMin, xMax, 6000);
    const denRoots = M.findRoots(qFn, xMin, xMax, 6000);
    // filtra raíces del numerador que no anulen también el denominador (evita 0/0)
    const roots = numRoots.filter(r => Math.abs(qFn.at(r)) > 1e-6);
    // asíntota horizontal: compara crecimiento relativo en valores grandes
    const big = 1e5;
    const ratioBig = pFn.at(big) / qFn.at(big);
    const ratioBig2 = pFn.at(big * 10) / qFn.at(big * 10);
    let horizontal;
    if (Number.isFinite(ratioBig) && Number.isFinite(ratioBig2) && Math.abs(ratioBig - ratioBig2) < Math.abs(ratioBig) * 0.05 + 1e-6) {
      horizontal = `y = ${fmt(ratioBig, 3)}`;
    } else if (Math.abs(ratioBig2) > Math.abs(ratioBig) * 5) {
      horizontal = 'No tiene (crece sin límite → posible asíntota oblicua)';
    } else {
      horizontal = 'y = 0';
    }
    const items = [
      { label: 'Raíces (numerador ≠ 0)', value: roots.length ? roots.map(r => fmt(r)).join(', ') : 'Ninguna en el rango' },
      { label: 'Asíntotas verticales', value: denRoots.length ? denRoots.map(r => `x = ${fmt(r)}`).join(', ') : 'Ninguna en el rango' },
      { label: 'Asíntota horizontal (aprox.)', value: horizontal },
      { label: 'Dominio', value: denRoots.length ? `ℝ − {${denRoots.map(r => fmt(r)).join(', ')}}` : 'ℝ' },
    ];
    return { items, roots, asymptotes: denRoots };
  }

  // -------- Trigonométrica: A·fn(B x + C) + D --------
  function analyzeTrig(kind, A, B, C, D) {
    const period = kind === 'tan' ? Math.PI / Math.abs(B) : (2 * Math.PI) / Math.abs(B);
    const amplitude = kind === 'tan' ? null : Math.abs(A);
    const phaseShift = -C / B;
    const exprStr = `${A}*${kind}(${B}*x+${C})+${D}`;
    const fn = M.compile(exprStr);
    const roots = M.findRoots(fn, -2 * Math.PI * 3, 2 * Math.PI * 3, 8000);
    const items = [
      { label: 'Amplitud', value: amplitude === null ? 'No definida (tangente)' : fmt(amplitude) },
      { label: 'Periodo', value: `${fmt(period)} rad ≈ ${fmt(period * 180 / Math.PI, 1)}°` },
      { label: 'Desfase horizontal', value: fmt(phaseShift) },
      { label: 'Desplazamiento vertical', value: fmt(D) },
      { label: 'Raíces cercanas a 0 (múltiples)', value: roots.slice(0, 6).map(r => fmt(r)).join(', ') || '—' },
    ];
    return { items, roots, exprStr, fn };
  }

  global.Calculator = { analyzeLinear, analyzeQuadratic, analyzePolynomial, analyzeRational, analyzeTrig, fmt };
})(window);
