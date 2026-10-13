/* =========================================================
   Solver — solucionador matemático paso a paso
   Compatible con MathEngine y app.js
   ========================================================= */
(function (global) {
  'use strict';

  const M = global.MathEngine;

  if (!M || typeof M.compile !== 'function' || typeof M.findRoots !== 'function') {
    console.error('Solver: MathEngine no está disponible.');
    return;
  }

  const normalizeInput = M.normalizeInput || M.normalize;
  const EPS = 1e-9;
  const ROOT_EPS = 1e-6;

  // ---------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------

  function fmt(n, d = 6) {
    if (!Number.isFinite(n)) return '—';

    if (Math.abs(n) < 0.5 * 10 ** -d) n = 0;

    const r = Math.round(n * 10 ** d) / 10 ** d;
    return Object.is(r, -0) ? '0' : String(r);
  }

  function near(a, b, eps = 1e-6) {
    return Number.isFinite(a) &&
      Number.isFinite(b) &&
      Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function isIntish(n) {
    return Number.isFinite(n) && near(n, Math.round(n), 1e-6);
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeAt(fn, x) {
    try {
      const value = fn.at(x);
      return Number.isFinite(value) ? value : NaN;
    } catch {
      return NaN;
    }
  }

  function signTerm(c, term, first = false) {
    if (Math.abs(c) < EPS) return '';

    const abs = Math.abs(c);
    const coef = term && near(abs, 1) ? '' : fmt(abs);
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

  function uniqueRoots(roots, tolerance = ROOT_EPS) {
    const result = [];

    for (const root of roots.filter(Number.isFinite).sort((a, b) => a - b)) {
      if (!result.some(existing => Math.abs(existing - root) < tolerance)) {
        result.push(root);
      }
    }

    return result;
  }

  function numericRoots(fn, min = -25, max = 25, steps = 12000) {
    try {
      return uniqueRoots(
        M.findRoots(fn, min, max, steps).filter(Number.isFinite)
      );
    } catch (error) {
      console.warn('Solver: error durante la búsqueda numérica.', error);
      return [];
    }
  }

  // ---------------------------------------------------------
  // Detección aproximada de polinomios de grado 0, 1 o 2
  // ---------------------------------------------------------

  function sampleDegree(fn) {
    const points = [-3, -2, -1, 0, 1, 2, 3];
    const values = points.map(x => safeAt(fn, x));

    if (!values.every(Number.isFinite)) {
      return { degree: null };
    }

    const f0 = safeAt(fn, 0);
    const f1 = safeAt(fn, 1);
    const fm1 = safeAt(fn, -1);

    const a = (f1 + fm1 - 2 * f0) / 2;
    const b = (f1 - fm1) / 2;
    const c = f0;

    const fits = points.every((x, i) => {
      const predicted = a * x * x + b * x + c;
      return near(predicted, values[i], 1e-7);
    });

    if (!fits) return { degree: null };

    if (Math.abs(a) > EPS) {
      return { degree: 2, a, b, c };
    }

    if (Math.abs(b) > EPS) {
      return { degree: 1, a: b, b: c };
    }

    return { degree: 0, value: c };
  }

  // ---------------------------------------------------------
  // Ecuaciones lineales
  // ax + b = 0
  // ---------------------------------------------------------

  function solveLinearSteps(a, b, leftStr, rightStr) {
    const steps = [];

    steps.push(
      `Ecuación original: <b>${escapeHTML(leftStr)} = ${escapeHTML(rightStr)}</b>`
    );

    steps.push('Restamos el lado derecho a ambos lados para obtener una ecuación igualada a cero.');

    steps.push(
      `Forma estándar: <b>${escapeHTML(polyString(0, a, b))} = 0</b>`
    );

    if (Math.abs(a) < EPS) {
      if (Math.abs(b) < EPS) {
        steps.push('La igualdad se cumple para cualquier valor de x.');
        steps.push('<b>Resultado: infinitas soluciones reales.</b>');
      } else {
        steps.push(`Obtenemos ${fmt(b)} = 0, lo cual es una contradicción.`);
        steps.push('<b>Resultado: no hay soluciones.</b>');
      }

      return { steps, roots: [] };
    }

    steps.push(`Restamos ${fmt(b)} a ambos lados: ${fmt(a)}x = ${fmt(-b)}.`);

    steps.push(
      `Dividimos ambos lados entre ${fmt(a)}: x = ${fmt(-b)} / ${fmt(a)}.`
    );

    const x = -b / a;

    if (!Number.isFinite(x)) {
      steps.push('<b>No se pudo representar la solución como un número finito.</b>');
      return { steps, roots: [] };
    }

    steps.push(`<b>Resultado: x = ${fmt(x)}</b>`);

    return { steps, roots: [x] };
  }

  // ---------------------------------------------------------
  // Ecuaciones cuadráticas
  // ax² + bx + c = 0
  // ---------------------------------------------------------

  function solveQuadraticSteps(a, b, c) {
    const steps = [];

    steps.push(
      `Forma estándar: <b>${escapeHTML(polyString(a, b, c))} = 0</b>`
    );

    steps.push(`Coeficientes: a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}.`);

    if (Math.abs(a) < EPS) {
      steps.push('El coeficiente de x² es cero, así que la ecuación no es cuadrática.');

      const linear = solveLinearSteps(b, c, polyString(0, b, c), '0');

      return { steps: [...steps, ...linear.steps], roots: linear.roots };
    }

    steps.push('Usamos la fórmula general:');

    steps.push('x = (−b ± √(b² − 4ac)) / (2a).');

    const disc = b * b - 4 * a * c;

    steps.push(
      `Discriminante: Δ = (${fmt(b)})² − 4(${fmt(a)})(${fmt(c)}) = ${fmt(disc)}.`
    );

    let roots = [];

    if (disc > EPS) {
      const sqrtD = Math.sqrt(disc);

      steps.push('Como Δ > 0, existen dos raíces reales distintas.');

      steps.push(`Calculamos √Δ = ${fmt(sqrtD)}.`);

      // Fórmula numéricamente estable para una de las raíces.
      const q = -0.5 * (b + Math.sign(b || 1) * sqrtD);
      const r1 = q / a;
      const r2 = Math.abs(q) > EPS ? c / q : (-b - sqrtD) / (2 * a);

      roots = uniqueRoots([r1, r2]);

      steps.push(`Primera raíz: x₁ = ${fmt(roots[0])}.`);
      steps.push(`Segunda raíz: x₂ = ${fmt(roots[1])}.`);

      steps.push(
        `<b>Resultado: x₁ = ${fmt(roots[0])}, x₂ = ${fmt(roots[1])}</b>`
      );

      if (roots.length === 2 && roots.every(isIntish)) {
        steps.push(
          `Comprobación por factorización aproximada: ` +
          `(x − (${fmt(roots[0])}))(x − (${fmt(roots[1])})) = 0.`
        );
      }
    } else if (Math.abs(disc) <= EPS) {
      const root = -b / (2 * a);

      roots = [root];

      steps.push('Como Δ = 0, existe una raíz real doble.');

      steps.push(`x = −b / (2a) = ${fmt(root)}.`);

      steps.push(`<b>Resultado: x = ${fmt(root)} (raíz doble).</b>`);
    } else {
      const real = -b / (2 * a);
      const imaginary = Math.sqrt(-disc) / (2 * a);

      steps.push('Como Δ < 0, no existen raíces reales.');

      steps.push('La ecuación tiene dos soluciones complejas conjugadas.');

      steps.push(
        `<b>Resultado: x = ${fmt(real)} ± ${fmt(Math.abs(imaginary))}i.</b>`
      );
    }

    return { steps, roots, discriminant: disc };
  }

  // ---------------------------------------------------------
  // Ecuaciones que requieren búsqueda numérica
  // ---------------------------------------------------------

  function solveNumeric(diffFn, leftStr, rightStr) {
    const steps = [];

    steps.push(
      `Definimos g(x) = (${escapeHTML(leftStr)}) − (${escapeHTML(rightStr)}).`
    );

    steps.push('Buscamos los valores de x para los cuales g(x) = 0.');

    steps.push(
      'Se utiliza una búsqueda numérica en el intervalo [−25, 25]. Los resultados son aproximaciones.'
    );

    const roots = numericRoots(diffFn, -25, 25, 12000);

    if (roots.length) {
      steps.push(
        `Raíces aproximadas encontradas: ${roots.map(r => fmt(r, 5)).join(', ')}.`
      );

      steps.push(
        '<b>Resultado aproximado: ' +
        roots.map(r => `x ≈ ${fmt(r, 5)}`).join('; ') +
        '.</b>'
      );

      steps.push(
        'La búsqueda numérica puede no detectar raíces que no crucen el eje x o raíces fuera del intervalo.'
      );
    } else {
      steps.push(
        '<b>No se encontraron raíces mediante la búsqueda numérica en [−25, 25].</b>'
      );

      steps.push(
        'Esto no demuestra que la ecuación carezca de soluciones reales; podrían existir soluciones fuera del intervalo o raíces que el método no detecte.'
      );
    }

    return { steps, roots, interval: { min: -25, max: 25 } };
  }

  // ---------------------------------------------------------
  // Evaluación de expresiones
  // ---------------------------------------------------------

  function evaluateExpressionSteps(exprStr, xVal) {
    const clean = normalizeInput(exprStr);
    const fn = M.compile(clean);
    const steps = [];

    if (!fn || typeof fn.at !== 'function') {
      throw new Error('No se pudo interpretar la expresión.');
    }

    // El parser admite x, t y theta. En este módulo de evaluación
    // libre, xVal se aplica a cualquiera de esas variables.
    const hasVariable = /(?:x|t|theta)/i.test(clean);

    steps.push(`Expresión ingresada: f(x) = ${escapeHTML(exprStr)}.`);

    if (hasVariable) {
      if (!Number.isFinite(xVal)) {
        throw new Error(
          'La expresión contiene una variable. Escribe también el valor que deseas evaluar.'
        );
      }

      steps.push(`Sustituimos la variable por ${fmt(xVal)}.`);

      const value = fn.at(xVal);

      if (!Number.isFinite(value)) {
        throw new Error(
          'La expresión no produce un resultado real finito para ese valor. Revisa el dominio.'
        );
      }

      steps.push(`<b>Resultado: f(${fmt(xVal)}) = ${fmt(value)}</b>`);

      return { steps, value };
    }

    const value = fn.at(0);

    if (!Number.isFinite(value)) {
      throw new Error('La expresión no produce un resultado real finito.');
    }

    steps.push(
      'Evaluamos la expresión respetando los paréntesis, las potencias, la multiplicación, la división y las operaciones restantes.'
    );

    steps.push(`<b>Resultado: ${fmt(value)}</b>`);

    return { steps, value };
  }

  // ---------------------------------------------------------
  // Punto de entrada principal
  // ---------------------------------------------------------

  function solve(input, xVal) {
    if (typeof input !== 'string' || !input.trim()) {
      throw new Error('Escribe una expresión o ecuación.');
    }

    const raw = normalizeInput(input);

    if (!raw) {
      throw new Error('La expresión está vacía después de normalizarla.');
    }

    if (raw.includes('=')) {
      const equalIndex = raw.indexOf('=');

      // Rechaza ecuaciones con más de un signo igual.
      if (raw.indexOf('=', equalIndex + 1) !== -1) {
        throw new Error('Escribe una sola igualdad, por ejemplo: 2x + 4 = 10.');
      }

      const leftRaw = raw.slice(0, equalIndex).trim();
      const rightRaw = raw.slice(equalIndex + 1).trim();

      if (!leftRaw || !rightRaw) {
        throw new Error('La ecuación está incompleta. Escribe ambos lados de la igualdad.');
      }

      const left = M.compile(leftRaw);
      const right = M.compile(rightRaw);

      const diff = {
        at(x) {
          return left.at(x) - right.at(x);
        }
      };

      const info = sampleDegree(diff);

      if (info.degree === 2) {
        return {
          type: 'Ecuación cuadrática',
          ...solveQuadraticSteps(info.a, info.b, info.c)
        };
      }

      if (info.degree === 1) {
        return {
          type: 'Ecuación lineal',
          ...solveLinearSteps(info.a, info.b, leftRaw, rightRaw)
        };
      }

      if (info.degree === 0) {
        const steps = [];

        if (near(info.value, 0)) {
          steps.push('La diferencia entre ambos lados es cero.');
          steps.push('<b>Resultado: la igualdad se cumple para todos los valores reales de x.</b>');

          return {
            type: 'Ecuación constante',
            steps,
            roots: [],
            infinitelyManySolutions: true
          };
        }

        steps.push(`La diferencia entre ambos lados es ${fmt(info.value)}, una constante distinta de cero.`);
        steps.push('<b>Resultado: la ecuación no tiene soluciones.</b>');

        return {
          type: 'Ecuación constante',
          steps,
          roots: [],
          noSolutions: true
        };
      }

      return {
        type: 'Ecuación (numérica)',
        ...solveNumeric(diff, leftRaw, rightRaw)
      };
    }

    return {
      type: 'Evaluación / simplificación',
      ...evaluateExpressionSteps(input, xVal)
    };
  }

  global.Solver = { solve };

})(window);

