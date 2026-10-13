/* =========================================================
   Calculator — análisis matemático mejorado
   Compatible con MathEngine y app.js
   ========================================================= */
(function (global) {
  'use strict';

  const M = global.MathEngine;

  if (!M || typeof M.compile !== 'function' || typeof M.findRoots !== 'function') {
    console.error('Calculator: MathEngine no está disponible.');
    return;
  }

  const EPS = 1e-9;
  const ROOT_EPS = 1e-6;

  // ---------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------

  function fmt(n, d = 4) {
    if (!Number.isFinite(n)) return '—';

    const threshold = 0.5 * 10 ** -d;
    if (Math.abs(n) < threshold) n = 0;

    const r = Math.round(n * 10 ** d) / 10 ** d;
    return Object.is(r, -0) ? '0' : String(r);
  }

  function finiteAt(fn, x) {
    try {
      const value = fn.at(x);
      return Number.isFinite(value) ? value : NaN;
    } catch {
      return NaN;
    }
  }

  function safeRoots(fn, min, max, steps = 6000) {
    try {
      return M.findRoots(fn, min, max, steps)
        .filter(Number.isFinite)
        .sort((a, b) => a - b);
    } catch (error) {
      console.warn('Calculator: no se pudieron calcular las raíces.', error);
      return [];
    }
  }

  function uniqueRoots(roots, tolerance = ROOT_EPS) {
    const result = [];

    for (const root of roots.filter(Number.isFinite).sort((a, b) => a - b)) {
      if (!result.some(previous => Math.abs(previous - root) < tolerance)) {
        result.push(root);
      }
    }

    return result;
  }

  function validateFunction(fn) {
    if (!fn || typeof fn.at !== 'function') {
      throw new TypeError('Se necesita una función válida con el método at(x).');
    }
  }

  function approximatelyZero(n, tolerance = EPS) {
    return Number.isFinite(n) && Math.abs(n) < tolerance;
  }

  function resultMessage(label, value) {
    return { label, value };
  }

  // ---------------------------------------------------------
  // Análisis lineal: f(x) = ax + b
  // ---------------------------------------------------------

  function analyzeLinear(fn) {
    validateFunction(fn);

    const f0 = finiteAt(fn, 0);
    const f1 = finiteAt(fn, 1);
    const fm1 = finiteAt(fn, -1);

    if (![f0, f1, fm1].every(Number.isFinite)) {
      return {
        items: [
          resultMessage('Error', 'La función no está definida en los puntos necesarios para analizarla.')
        ],
        roots: []
      };
    }

    const b = f0;
    const a = f1 - b;

    // Comprueba puntos adicionales para detectar funciones
    // que no son lineales, como x² o sin(x).
    const testPoints = [-3, -2, 2, 3];
    const isLinear = testPoints.every(x => {
      const actual = finiteAt(fn, x);
      const expected = a * x + b;

      return Number.isFinite(actual) &&
        Math.abs(actual - expected) <= 1e-7 * Math.max(1, Math.abs(actual), Math.abs(expected));
    });

    if (!isLinear) {
      return {
        items: [
          resultMessage('Aviso', 'La expresión no parece ser lineal. Selecciona el tipo de función adecuado.'),
          resultMessage('Valor en x = 0', fmt(b))
        ],
        roots: []
      };
    }

    const items = [
      resultMessage('Pendiente (m)', fmt(a)),
      resultMessage('Intersección en Y', `(0, ${fmt(b)})`)
    ];

    let roots = [];

    if (Math.abs(a) > EPS) {
      const root = -b / a;
      roots = [root];
      items.push(resultMessage('Raíz (intersección en X)', `(${fmt(root)}, 0)`));
    } else {
      items.push(
        resultMessage(
          'Raíz',
          Math.abs(b) <= EPS
            ? 'Infinitas soluciones'
            : 'No tiene (recta horizontal)'
        )
      );
    }

    items.push(
      resultMessage(
        'Tipo de pendiente',
        a > EPS ? 'Creciente' : a < -EPS ? 'Decreciente' : 'Constante'
      )
    );

    return { items, roots, slope: a, intercept: b };
  }

  // ---------------------------------------------------------
  // Análisis cuadrático: f(x) = ax² + bx + c
  // ---------------------------------------------------------

  function analyzeQuadratic(fn) {
    validateFunction(fn);

    const f0 = finiteAt(fn, 0);
    const f1 = finiteAt(fn, 1);
    const fm1 = finiteAt(fn, -1);

    if (![f0, f1, fm1].every(Number.isFinite)) {
      return {
        items: [
          resultMessage('Error', 'La función no está definida en los puntos necesarios para analizarla.')
        ],
        roots: []
      };
    }

    const a = (f1 + fm1 - 2 * f0) / 2;
    const b = (f1 - fm1) / 2;
    const c = f0;

    const testPoints = [-3, -2, 2, 3];

    const isQuadratic = testPoints.every(x => {
      const actual = finiteAt(fn, x);
      const expected = a * x * x + b * x + c;

      return Number.isFinite(actual) &&
        Math.abs(actual - expected) <= 1e-7 * Math.max(1, Math.abs(actual), Math.abs(expected));
    });

    if (!isQuadratic) {
      return {
        items: [
          resultMessage('Aviso', 'La expresión no parece ser cuadrática. Selecciona el tipo de función adecuado.')
        ],
        roots: []
      };
    }

    if (Math.abs(a) < EPS) {
      const linear = analyzeLinear(fn);

      return {
        ...linear,
        items: [
          resultMessage('Aviso', 'El coeficiente cuadrático es cero; la función se comporta como una función lineal.'),
          ...linear.items
        ]
      };
    }

    const discriminant = b * b - 4 * a * c;

    const items = [
      resultMessage('Coeficientes', `a=${fmt(a)}, b=${fmt(b)}, c=${fmt(c)}`),
      resultMessage('Discriminante (Δ)', fmt(discriminant))
    ];

    let roots = [];

    if (discriminant > EPS) {
      const sqrtD = Math.sqrt(discriminant);

      // Fórmula estable para evitar pérdida de precisión.
      const q = -0.5 * (b + Math.sign(b || 1) * sqrtD);
      const r1 = q / a;
      const r2 = q !== 0 ? c / q : (-b - sqrtD) / (2 * a);

      roots = uniqueRoots([r1, r2]);

      items.push(
        resultMessage('Raíces reales', `x₁=${fmt(roots[0])}, x₂=${fmt(roots[1])}`)
      );
    } else if (Math.abs(discriminant) <= EPS) {
      const root = -b / (2 * a);
      roots = [root];

      items.push(resultMessage('Raíz doble', `x = ${fmt(root)}`));
    } else {
      const real = -b / (2 * a);
      const imaginary = Math.sqrt(-discriminant) / (2 * a);

      items.push(
        resultMessage(
          'Raíces complejas',
          `${fmt(real)} ± ${fmt(Math.abs(imaginary))}i`
        )
      );
    }

    const vx = -b / (2 * a);
    const vy = finiteAt(fn, vx);

    items.push(
      resultMessage('Vértice', `(${fmt(vx)}, ${fmt(vy)})`),
      resultMessage(
        'Concavidad',
        a > 0 ? 'Hacia arriba (mínimo)' : 'Hacia abajo (máximo)'
      ),
      resultMessage('Eje de simetría', `x = ${fmt(vx)}`),
      resultMessage('Intersección en Y', `(0, ${fmt(c)})`)
    );

    return {
      items,
      roots,
      vertex: { x: vx, y: vy },
      coefficients: { a, b, c },
      discriminant
    };
  }

  // ---------------------------------------------------------
  // Análisis polinomial genérico
  // ---------------------------------------------------------

  function analyzePolynomial(fn, xMin = -20, xMax = 20) {
    validateFunction(fn);

    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin >= xMax) {
      throw new RangeError('El intervalo de análisis no es válido.');
    }

    const roots = uniqueRoots(safeRoots(fn, xMin, xMax, 6000));
    const f0 = finiteAt(fn, 0);

    const leftValue = finiteAt(fn, xMin);
    const leftNext = finiteAt(fn, xMin + Math.min(1, (xMax - xMin) / 100));
    const rightValue = finiteAt(fn, xMax);
    const rightPrevious = finiteAt(fn, xMax - Math.min(1, (xMax - xMin) / 100));

    const leftBehavior = Number.isFinite(leftValue) && Number.isFinite(leftNext)
      ? leftValue > leftNext ? 'Mayor al avanzar hacia la derecha desde el extremo izquierdo' : 'Menor al avanzar hacia la derecha desde el extremo izquierdo'
      : 'No se pudo determinar';

    const rightBehavior = Number.isFinite(rightValue) && Number.isFinite(rightPrevious)
      ? rightValue > rightPrevious ? 'Crece cerca del extremo derecho' : 'Decrece cerca del extremo derecho'
      : 'No se pudo determinar';

    const items = [
      resultMessage('Valor en x = 0', fmt(f0)),
      resultMessage(
        'Raíces encontradas',
        roots.length ? roots.map(root => fmt(root)).join(', ') : 'No se encontraron raíces en el intervalo analizado'
      ),
      resultMessage('Intervalo analizado', `[${fmt(xMin)}, ${fmt(xMax)}]`),
      resultMessage('Comportamiento cerca del extremo izquierdo', leftBehavior),
      resultMessage('Comportamiento cerca del extremo derecho', rightBehavior)
    ];

    return { items, roots, interval: { min: xMin, max: xMax } };
  }

  // ---------------------------------------------------------
  // Análisis racional: f(x) = p(x) / q(x)
  // ---------------------------------------------------------

  function analyzeRational(pFn, qFn, xMin = -20, xMax = 20) {
    validateFunction(pFn);
    validateFunction(qFn);

    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin >= xMax) {
      throw new RangeError('El intervalo de análisis no es válido.');
    }

    const numRoots = uniqueRoots(safeRoots(pFn, xMin, xMax, 6000));
    const denRoots = uniqueRoots(safeRoots(qFn, xMin, xMax, 6000));

    // Excluye raíces del numerador donde el denominador también
    // es cero. Esos puntos requieren un análisis de discontinuidad.
    const roots = numRoots.filter(root => {
      const denominator = finiteAt(qFn, root);
      return Number.isFinite(denominator) && Math.abs(denominator) > ROOT_EPS;
    });

    // Las raíces de q(x) son candidatos a discontinuidades.
    // No se garantiza que todos sean asíntotas verticales:
    // podría haber factores comunes o discontinuidades removibles.
    const candidates = denRoots.filter(root => {
      const denominator = finiteAt(qFn, root);
      return !Number.isFinite(denominator) || Math.abs(denominator) < ROOT_EPS;
    });

    let horizontal = 'No se pudo determinar numéricamente';
    let ratioBig = NaN;
    let ratioBig2 = NaN;

    // Evaluar en valores grandes puede desbordar algunas funciones.
    // Por eso se comprueba la validez de cada resultado.
    try {
      const big = 1e3;
      const p1 = finiteAt(pFn, big);
      const q1 = finiteAt(qFn, big);
      const p2 = finiteAt(pFn, big * 2);
      const q2 = finiteAt(qFn, big * 2);

      ratioBig = q1 !== 0 ? p1 / q1 : NaN;
      ratioBig2 = q2 !== 0 ? p2 / q2 : NaN;

      if (Number.isFinite(ratioBig) && Number.isFinite(ratioBig2)) {
        const scale = Math.max(1, Math.abs(ratioBig), Math.abs(ratioBig2));

        if (Math.abs(ratioBig - ratioBig2) < 0.02 * scale) {
          horizontal = `Posible asíntota horizontal: y ≈ ${fmt((ratioBig + ratioBig2) / 2, 3)}`;
        } else if (Math.abs(ratioBig2) > Math.abs(ratioBig) * 2 + 1) {
          horizontal = 'No parece tener asíntota horizontal; podría existir una oblicua u otro comportamiento';
        } else {
          horizontal = 'No se pudo confirmar una asíntota horizontal';
        }
      }
    } catch {
      horizontal = 'No se pudo determinar numéricamente';
    }

    const items = [
      resultMessage(
        'Raíces de la función',
        roots.length ? roots.map(root => fmt(root)).join(', ') : 'No se encontraron raíces en el intervalo'
      ),
      resultMessage(
        'Candidatos a asíntotas verticales',
        candidates.length
          ? candidates.map(root => `x ≈ ${fmt(root)}`).join(', ')
          : 'No se encontraron candidatos en el intervalo'
      ),
      resultMessage('Asíntota horizontal (estimación)', horizontal),
      resultMessage(
        'Dominio',
        candidates.length
          ? `Excluir los puntos problemáticos detectados: ${candidates.map(root => fmt(root)).join(', ')}. Verifica posibles discontinuidades removibles.`
          : 'No se detectaron puntos problemáticos en el intervalo; esto no garantiza que el dominio sea todo ℝ.'
      )
    ];

    return {
      items,
      roots,
      asymptotes: candidates,
      interval: { min: xMin, max: xMax },
      horizontalAsymptote: horizontal
    };
  }

  // ---------------------------------------------------------
  // Análisis trigonométrico:
  // f(x) = A · trig(Bx + C) + D
  // ---------------------------------------------------------

  function analyzeTrig(kind, A, B, C, D) {
    const supported = ['sin', 'cos', 'tan'];

    if (!supported.includes(kind)) {
      throw new TypeError('Función trigonométrica no compatible: usa sin, cos o tan.');
    }

    A = Number(A);
    B = Number(B);
    C = Number(C);
    D = Number(D);

    if (![A, B, C, D].every(Number.isFinite)) {
      throw new TypeError('Los parámetros trigonométricos deben ser números finitos.');
    }

    const exprStr = `${A}*${kind}(${B}*x+${C})+${D}`;
    const fn = M.compile(exprStr);

    // Si B = 0, la expresión es constante y no tiene período
    // fundamental definido.
    if (Math.abs(B) < EPS) {
      const constantValue = A * Math[kind](C) + D;

      return {
        items: [
          resultMessage('Tipo', 'Función constante respecto a x'),
          resultMessage('Valor constante', fmt(constantValue)),
          resultMessage('Periodo', 'No definido para esta función constante'),
          resultMessage('Desfase horizontal', 'No definido cuando B = 0'),
          resultMessage('Desplazamiento vertical (D)', fmt(D))
        ],
        roots: Math.abs(constantValue) < EPS ? [0] : [],
        exprStr,
        fn
      };
    }

    const period = kind === 'tan'
      ? Math.PI / Math.abs(B)
      : (2 * Math.PI) / Math.abs(B);

    const amplitude = kind === 'tan' ? null : Math.abs(A);
    const phaseShift = -C / B;

    const roots = uniqueRoots(
      safeRoots(fn, -6 * Math.PI, 6 * Math.PI, 8000)
    );

    const items = [
      resultMessage(
        'Amplitud',
        amplitude === null ? 'No definida para la tangente' : fmt(amplitude)
      ),
      resultMessage(
        'Periodo',
        `${fmt(period)} rad ≈ ${fmt(period * 180 / Math.PI, 2)}°`
      ),
      resultMessage('Desfase horizontal', fmt(phaseShift)),
      resultMessage('Desplazamiento vertical (D)', fmt(D)),
      resultMessage(
        'Raíces aproximadas en el intervalo',
        roots.length ? roots.slice(0, 8).map(root => fmt(root)).join(', ') : 'No se encontraron raíces'
      )
    ];

    return { items, roots, exprStr, fn, period, amplitude, phaseShift };
  }

  // ---------------------------------------------------------
  // API pública
  // ---------------------------------------------------------

  global.Calculator = {
    analyzeLinear,
    analyzeQuadratic,
    analyzePolynomial,
    analyzeRational,
    analyzeTrig,
    fmt
  };

})(window);

