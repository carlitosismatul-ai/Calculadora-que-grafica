/* =========================================================
   Solver — recibe una expresión o ecuación escrita libremente
   y arma una explicación paso a paso, reutilizando MathEngine
   para evaluar numéricamente (funciona con casi cualquier
   expresión, no sólo con plantillas fijas).
   ========================================================= */
(function (global) {
  const M = global.MathEngine;
  const normalizeInput = M.normalizeInput || M.normalize;
  const fmt = (n, d = 6) => {
    if (!Number.isFinite(n)) return '—';
    const r = Math.round(n * 10 ** d) / 10 ** d;
    return Object.is(r, -0) ? '0' : String(r);
  };
  const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
  const isIntish = (n) => near(n, Math.round(n), 1e-6);

  function signTerm(c, term, first = false) {
    if (near(c, 0)) return '';
    const abs = Math.abs(c);
    const coef = (abs === 1 && term) ? '' : fmt(abs);
    const piece = `${coef}${term}`;
    if (first) return c < 0 ? `−${piece}` : piece;
    return c < 0 ? ` − ${piece}` : ` + ${piece}`;
  }
  function polyString(a, b, c) {
    let s = '';
    s += signTerm(a, 'x²', true);
    s += signTerm(b, 'x', s === '');
    s += signTerm(c, '', s === '');
    return s || '0';
  }

  function sampleDegree(fn) {
    // Compara diferencias finitas para adivinar si fn se comporta como
    // grado 0, 1 ó 2 en un entorno razonable de x.
    const f = (x) => fn.at(x);
    const f0 = f(0), f1 = f(1), fm1 = f(-1), f2 = f(2);
    if (![f0, f1, fm1, f2].every(Number.isFinite)) return { degree: NaN };
    const a2 = (f1 + fm1 - 2 * f0) / 2;               // coef. cuadrático estimado
    const b2 = (f1 - fm1) / 2;                        // coef. lineal estimado (si a2≈0 es la pendiente real)
    const c2 = f0;
    // verifica el ajuste también en x=2 para confirmar que es realmente polinomio grado<=2
    const predicted2 = a2 * 4 + b2 * 2 + c2;
    const fits2 = near(predicted2, f2, Math.max(1e-4, Math.abs(f2) * 1e-4));
    if (!fits2) return { degree: null };               // no es polinomio simple: se resolverá numéricamente
    if (Math.abs(a2) > 1e-7) return { degree: 2, a: a2, b: b2, c: c2 };
    if (Math.abs(b2) > 1e-9) return { degree: 1, a: b2, b: c2 };
    return { degree: 0, value: c2 };
  }

  function solveLinearSteps(a, b, leftStr, rightStr) {
    // a x + b = 0  →  x = -b/a
    const steps = [];
    steps.push(`Ecuación equivalente: <b>${leftStr} = ${rightStr}</b>`);
    steps.push(`Pasamos todo a un solo lado: (${leftStr}) − (${rightStr}) = 0`);
    steps.push(`Esa diferencia se reduce a la forma lineal: ${polyString(0, a, b)} = 0`);
    if (Math.abs(a) < 1e-9) {
      if (Math.abs(b) < 1e-9) steps.push('Se cumple para <b>cualquier</b> valor de x → infinitas soluciones (identidad).');
      else steps.push('Queda una contradicción (una constante distinta de 0 = 0) → <b>no hay solución</b>.');
      return { steps, roots: [] };
    }
    steps.push(`Despejamos x: x = ${b >= 0 ? '−' + fmt(b) : fmt(-b)} / ${fmt(a)}`);
    const x = -b / a;
    steps.push(`<b>Resultado: x = ${fmt(x)}</b>`);
    return { steps, roots: [x] };
  }

  function solveQuadraticSteps(a, b, c) {
    const steps = [];
    steps.push(`Forma estándar: <b>${polyString(a, b, c)} = 0</b>, con a=${fmt(a)}, b=${fmt(b)}, c=${fmt(c)}`);
    steps.push(`Fórmula general: x = (−b ± √(b² − 4ac)) / (2a)`);
    const disc = b * b - 4 * a * c;
    steps.push(`Discriminante: Δ = (${fmt(b)})² − 4(${fmt(a)})(${fmt(c)}) = ${fmt(disc)}`);
    let roots = [];
    if (disc > 1e-9) {
      const sq = Math.sqrt(disc);
      steps.push(`Como Δ > 0, hay dos raíces reales. √Δ = ${fmt(sq)}`);
      const r1 = (-b + sq) / (2 * a), r2 = (-b - sq) / (2 * a);
      roots = [r1, r2].sort((x, y) => x - y);
      steps.push(`x₁ = (−(${fmt(b)}) + ${fmt(sq)}) / (2·${fmt(a)}) = ${fmt(r1)}`);
      steps.push(`x₂ = (−(${fmt(b)}) − ${fmt(sq)}) / (2·${fmt(a)}) = ${fmt(r2)}`);
      steps.push(`<b>Resultado: x₁ = ${fmt(roots[0])}, x₂ = ${fmt(roots[1])}</b>`);
      if (isIntish(roots[0]) && isIntish(roots[1]) && isIntish(a)) {
        steps.push(`Forma factorizada: ${fmt(a)}(x − (${fmt(roots[0])}))(x − (${fmt(roots[1])})) = 0`);
      }
    } else if (Math.abs(disc) <= 1e-9) {
      const r = -b / (2 * a);
      roots = [r];
      steps.push(`Como Δ = 0, hay una raíz doble: x = −(${fmt(b)}) / (2·${fmt(a)}) = ${fmt(r)}`);
      steps.push(`<b>Resultado: x = ${fmt(r)} (raíz doble)</b>`);
    } else {
      const re = -b / (2 * a), im = Math.sqrt(-disc) / (2 * a);
      steps.push(`Como Δ < 0, las raíces son complejas (no reales).`);
      steps.push(`<b>Resultado: x = ${fmt(re)} ± ${fmt(im)}i</b>`);
    }
    return { steps, roots };
  }

  function solveNumeric(diffFn, leftStr, rightStr) {
    const steps = [];
    steps.push(`Reescribimos como una sola función: g(x) = (${leftStr}) − (${rightStr})`);
    steps.push('No es un polinomio simple de grado ≤ 2, así que buscamos dónde g(x) = 0 numéricamente (barrido + bisección).');
    let roots = M.findRoots(diffFn, -25, 25, 8000);
    roots = roots.sort((x, y) => Math.abs(x) - Math.abs(y)).slice(0, 8).sort((x, y) => x - y);
    if (roots.length) {
      steps.push(`Se detectaron cambios de signo cerca de: ${roots.map(r => fmt(r, 4)).join(', ')}`);
      steps.push(`<b>Solución(es) aproximada(s) más cercanas a 0: x ≈ ${roots.map(r => fmt(r, 4)).join(', ')}</b>`);
    } else {
      steps.push('<b>No se encontraron soluciones reales en el rango [−50, 50].</b>');
    }
    return { steps, roots };
  }

  function evaluateExpressionSteps(exprStr, xVal) {
    const clean = normalizeInput(exprStr);
    const fn = M.compile(clean);
    const steps = [];
    const hasX = /(^|[^a-z])x([^a-z]|$)/i.test(clean.toLowerCase());
    steps.push(`Expresión: f(x) = ${exprStr}`);
    if (hasX) {
      if (!Number.isFinite(xVal)) throw new Error('Esta expresión tiene x: escribe también el valor de x a evaluar.');
      steps.push(`Sustituimos x = ${fmt(xVal)} en la expresión.`);
      const val = fn.at(xVal);
      steps.push(`<b>Resultado: f(${fmt(xVal)}) = ${fmt(val)}</b>`);
      return { steps, value: val };
    }
    const val = fn.at(0);
    steps.push('No tiene variable x: se evalúa directamente respetando la jerarquía de operaciones (paréntesis → potencias → multiplicación/división → suma/resta).');
    steps.push(`<b>Resultado: ${fmt(val)}</b>`);
    return { steps, value: val };
  }

  // Punto de entrada principal
  function solve(input, xVal) {
    if (!input || !input.trim()) throw new Error('Escribe una expresión o ecuación.');
    const raw = normalizeInput(input);
    if (raw.includes('=')) {
      const [leftRaw, rightRaw] = raw.split('=');
      if (rightRaw === undefined || !leftRaw.trim() || !rightRaw.trim()) throw new Error('Ecuación incompleta.');
      const left = M.compile(leftRaw);
      const right = M.compile(rightRaw);
      const diff = { at: (x) => left.at(x) - right.at(x) };
      const info = sampleDegree(diff);
      if (info.degree === 2) return { type: 'Ecuación cuadrática', ...solveQuadraticSteps(info.a, info.b, info.c) };
      if (info.degree === 1) return { type: 'Ecuación lineal', ...solveLinearSteps(info.a, info.b, leftRaw.trim(), rightRaw.trim()) };
      if (info.degree === 0) {
        const steps = [near(info.value, 0) ? 'Ambos lados son iguales siempre → infinitas soluciones.' : 'Los lados nunca son iguales → no hay solución.'];
        return { type: 'Ecuación constante', steps, roots: [] };
      }
      return { type: 'Ecuación (numérica)', ...solveNumeric(diff, leftRaw.trim(), rightRaw.trim()) };
    }
    return { type: 'Evaluación / simplificación', ...evaluateExpressionSteps(input, xVal) };
  }

  global.Solver = { solve };
})(window);
