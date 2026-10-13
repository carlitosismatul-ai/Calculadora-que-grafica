/* ==========================================================
   Math Arcade 3.0
   Retos matemáticos, soluciones explicadas y XP.
   Compatible con app.js de MathGraph Studio.
   ========================================================== */

(function (global) {
  'use strict';

  /* =========================
     UTILIDADES
     ========================= */

  const rnd = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const nz = (min, max) => {
    let value;

    do {
      value = rnd(min, max);
    } while (value === 0);

    return value;
  };

  const sign = value =>
    value >= 0
      ? `+ ${value}`
      : `− ${Math.abs(value)}`;

  const gcd = (a, b) => {
    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {
      [a, b] = [b, a % b];
    }

    return a || 1;
  };

  const fraction = (numerator, denominator) => {
    if (denominator === 0) {
      return [numerator, denominator];
    }

    const divisor = gcd(numerator, denominator);

    if (denominator < 0) {
      numerator = -numerator;
      denominator = -denominator;
    }

    return [
      numerator / divisor,
      denominator / divisor
    ];
  };

  const formatNumber = value => {
    if (!Number.isFinite(value)) return String(value);

    return String(Number(value.toFixed(8)));
  };

  /* =========================
     1. ECUACIONES LINEALES
     ========================= */

  function linear(level = 1) {
    const range =
      level === 1 ? 9 :
      level === 2 ? 18 : 35;

    const a = nz(
      -Math.floor(range / 2),
      Math.floor(range / 2)
    );

    const x = rnd(-range, range);
    const b = rnd(-range, range);
    const result = a * x + b;

    return {
      category: 'Álgebra · ecuación lineal',

      question: `Resuelve: ${a}x ${sign(b)} = ${result}`,
      prompt: `Resuelve: ${a}x ${sign(b)} = ${result}`,

      answer: x,
      tolerance: 1e-6,
      mode: 'functions',

      steps: [
        `Partimos de ${a}x ${sign(b)} = ${result}.`,

        b >= 0
          ? `Restamos ${b} en ambos lados: ${a}x = ${result - b}.`
          : `Sumamos ${Math.abs(b)} en ambos lados: ${a}x = ${result - b}.`,

        `Dividimos entre ${a}: x = ${result - b}/${a}.`,

        `Resultado: x = ${x}.`
      ]
    };
  }

  /* =========================
     2. ECUACIONES CUADRÁTICAS
     ========================= */

  function quadratic(level = 1) {
    const range =
      level === 1 ? 5 :
      level === 2 ? 9 : 14;

    const root1 = nz(-range, range);
    const root2 = nz(-range, range);

    const b = -(root1 + root2);
    const c = root1 * root2;

    const discriminant = b * b - 4 * c;

    const roots = [
      Math.min(root1, root2),
      Math.max(root1, root2)
    ];

    const equation =
      `x² ${sign(b)}x ${sign(c)} = 0`;

    return {
      category: 'Álgebra · cuadrática',

      question: `Encuentra las raíces: ${equation}`,
      prompt: `Encuentra las raíces: ${equation}`,

      answer: roots,
      isPair: true,
      tolerance: 1e-6,
      mode: 'functions',

      steps: [
        `Identificamos los coeficientes: a = 1, b = ${b}, c = ${c}.`,

        `Calculamos el discriminante: Δ = b² − 4ac = ${discriminant}.`,

        `La raíz del discriminante es √Δ = ${Math.sqrt(discriminant)}.`,

        `Aplicamos la fórmula general: x = (−b ± √Δ)/(2a).`,

        `Primera raíz: x₁ = ${roots[0]}.`,

        `Segunda raíz: x₂ = ${roots[1]}.`
      ]
    };
  }

  /* =========================
     3. CÁLCULO MENTAL
     ========================= */

  function mental(level = 1) {
    const range =
      level === 1 ? 9 :
      level === 2 ? 20 : 50;

    const a = rnd(2, range);
    const b = rnd(2, range);

    const operations = ['+', '−', '×'];
    const operation = operations[rnd(0, 2)];

    let answer;

    if (operation === '+') {
      answer = a + b;
    } else if (operation === '−') {
      answer = a - b;
    } else {
      answer = a * b;
    }

    return {
      category: 'Cálculo mental',

      question: `Calcula: ${a} ${operation} ${b}`,
      prompt: `Calcula: ${a} ${operation} ${b}`,

      answer,
      tolerance: 1e-9,
      mode: 'mental',

      steps: [
        `Identifica la operación: ${operation}.`,
        `Calcula ${a} ${operation} ${b}.`,
        `Resultado: ${answer}.`
      ]
    };
  }

  /* =========================
     4. PORCENTAJES
     ========================= */

  function percent(level = 1) {
    const maxBase =
      level === 1 ? 100 :
      level === 2 ? 300 : 1000;

    const base = rnd(20, maxBase);
    const percentage = rnd(
      5,
      level === 1 ? 25 :
      level === 2 ? 50 : 80
    );

    const answer = base * percentage / 100;

    return {
      category: 'Porcentajes',

      question: `¿Cuánto es el ${percentage}% de ${base}?`,
      prompt: `¿Cuánto es el ${percentage}% de ${base}?`,

      answer,
      tolerance: 1e-6,
      mode: 'percent',

      steps: [
        `Convertimos el porcentaje a decimal: ${percentage}/100 = ${percentage / 100}.`,

        `Multiplicamos ${base} × ${percentage / 100}.`,

        `Resultado: ${formatNumber(answer)}.`
      ]
    };
  }

  /* =========================
     5. PENDIENTE DE UNA RECTA
     ========================= */

  function slope(level = 1) {
    const range =
      level === 1 ? 7 :
      level === 2 ? 15 : 30;

    const x1 = rnd(-range, range);

    let x2;

    do {
      x2 = rnd(-range, range);
    } while (x1 === x2);

    const y1 = rnd(-range, range);
    const y2 = rnd(-range, range);

    const numerator = y2 - y1;
    const denominator = x2 - x1;

    const [n, d] = fraction(numerator, denominator);
    const answer = n / d;

    return {
      category: 'Geometría analítica · pendiente',

      question:
        `Calcula la pendiente entre (${x1}, ${y1}) y (${x2}, ${y2}).`,

      prompt:
        `Calcula la pendiente entre (${x1}, ${y1}) y (${x2}, ${y2}).`,

      answer,
      tolerance: 1e-6,
      mode: 'functions',

      steps: [
        'Usamos la fórmula m = (y₂ − y₁)/(x₂ − x₁).',

        `Sustituimos: m = (${y2} − ${y1})/(${x2} − ${x1}).`,

        `Simplificamos: m = ${numerator}/${denominator} = ${n}/${d}.`,

        `Resultado: m = ${formatNumber(answer)}.`
      ]
    };
  }

  /* =========================
     6. EVALUACIÓN DE FUNCIONES
     ========================= */

  function evaluate(level = 1) {
    const a = nz(-5, 5);
    const b = rnd(-8, 8);
    const x = rnd(-5, 5);

    const answer = a * x + b;

    const expression =
      `f(x) = ${a}x ${sign(b)}`;

    return {
      category: 'Funciones · evaluación',

      question:
        `Si ${expression}, calcula f(${x}).`,

      prompt:
        `Si ${expression}, calcula f(${x}).`,

      answer,
      tolerance: 1e-6,
      mode: 'functions',

      steps: [
        `La función es ${expression}.`,

        `Sustituimos x = ${x}.`,

        `Obtenemos f(${x}) = ${a}(${x}) ${sign(b)}.`,

        `Resultado: f(${x}) = ${answer}.`
      ]
    };
  }

  /* =========================
     7. SECUENCIAS NUMÉRICAS
     ========================= */

  function sequence(level = 1) {
    const start = rnd(1, 10);

    const step = rnd(
      2,
      level === 1 ? 5 :
      level === 2 ? 10 : 20
    );

    const values = [0, 1, 2, 3, 4].map(
      index => start + index * step
    );

    const answer = values[4] + step;

    return {
      category: 'Secuencias',

      question:
        `Completa la secuencia: ${values.join(', ')}, ¿qué sigue?`,

      prompt:
        `Completa la secuencia: ${values.join(', ')}, ¿qué sigue?`,

      answer,
      tolerance: 1e-9,
      mode: 'sequence',

      steps: [
        `Observamos la secuencia: ${values.join(', ')}.`,

        `La diferencia entre cada término es ${step}.`,

        `Sumamos ${step} al último término: ${values[4]} + ${step}.`,

        `Resultado: ${answer}.`
      ]
    };
  }

  /* =========================
     8. LÓGICA MATEMÁTICA
     ========================= */

  function logic(level = 1) {
    const a = rnd(
      2,
      level === 1 ? 9 :
      level === 2 ? 20 : 40
    );

    const increment = rnd(
      2,
      level === 1 ? 5 :
      level === 2 ? 9 : 15
    );

    const b = a + increment;
    const c = b + increment;
    const answer = c + increment;

    return {
      category: 'Lógica · patrones',

      question:
        `Completa el patrón: ${a}, ${b}, ${c}, ¿qué número sigue?`,

      prompt:
        `Completa el patrón: ${a}, ${b}, ${c}, ¿qué número sigue?`,

      answer,
      tolerance: 1e-9,
      mode: 'logic',

      steps: [
        `Primer incremento: ${b} − ${a} = ${increment}.`,

        `Segundo incremento: ${c} − ${b} = ${increment}.`,

        `El patrón suma ${increment} en cada paso.`,

        `Calculamos ${c} + ${increment} = ${answer}.`
      ]
    };
  }

  /* =========================
     9. TRIGONOMETRÍA
     ========================= */

  function trigonometry() {
    const questions = [
      {
        expression: 'sin(0°)',
        answer: 0
      },
      {
        expression: 'cos(0°)',
        answer: 1
      },
      {
        expression: 'sin(90°)',
        answer: 1
      },
      {
        expression: 'cos(180°)',
        answer: -1
      },
      {
        expression: 'sin(30°)',
        answer: 0.5
      },
      {
        expression: 'cos(60°)',
        answer: 0.5
      },
      {
        expression: 'tan(45°)',
        answer: 1
      }
    ];

    const selected = questions[
      rnd(0, questions.length - 1)
    ];

    return {
      category: 'Trigonometría',

      question: `Evalúa ${selected.expression}.`,
      prompt: `Evalúa ${selected.expression}.`,

      answer: selected.answer,
      tolerance: 0.02,
      mode: 'trig',

      steps: [
        'Recordamos los valores notables del círculo unitario.',

        `Buscamos el valor de ${selected.expression}.`,

        `Resultado: ${selected.answer}.`
      ]
    };
  }

  /* =========================
     GENERADOR DE RETOS
     ========================= */

  const ALL = [
    linear,
    quadratic,
    mental,
    percent,
    slope,
    evaluate,
    sequence,
    logic,
    trigonometry
  ];

  function randomProblem(level = 1, mode = 'mixed') {
    level = Number(level);

    if (![1, 2, 3].includes(level)) {
      level = 1;
    }

    const generatorsByMode = {
      functions: [linear, quadratic, slope, evaluate],
      mental: [mental],
      percent: [percent],
      sequence: [sequence],
      logic: [logic],
      trig: [trigonometry]
    };

    let pool;

    if (mode === 'mixed') {
      pool = ALL;
    } else {
      pool = generatorsByMode[mode] || ALL;
    }

    const generator = pool[rnd(0, pool.length - 1)];

    return generator(level);
  }

  /* =========================
     COMPROBACIÓN DE RESPUESTAS
     ========================= */

  function parseNumericAnswer(value) {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : NaN;
    }

    let text = String(value ?? '')
      .trim()
      .replace(/,/g, '.');

    if (!text) return NaN;

    // Admite fracciones sencillas, por ejemplo 3/4.
    const fractionMatch = text.match(
      /^([+-]?\d+(?:\.\d+)?)\s*\/\s*([+-]?\d+(?:\.\d+)?)$/
    );

    if (fractionMatch) {
      const numerator = Number(fractionMatch[1]);
      const denominator = Number(fractionMatch[2]);

      if (denominator === 0) return NaN;

      return numerator / denominator;
    }

    // Admite una respuesta escrita como x = 5.
    text = text.replace(/^[a-z]\s*=\s*/i, '');

    const numberValue = Number(text);

    return Number.isFinite(numberValue)
      ? numberValue
      : NaN;
  }

  function checkAnswer(first, second) {
    /*
     * app.js llama:
     * checkAnswer(respuestaDelJugador, problema)
     *
     * También aceptamos el orden antiguo:
     * checkAnswer(problema, respuestaDelJugador)
     */
    let problem;
    let input;

    if (
      first &&
      typeof first === 'object' &&
      !Array.isArray(first)
    ) {
      problem = first;
      input = second;
    } else {
      input = first;
      problem = second;
    }

    if (!problem || typeof problem !== 'object') {
      return false;
    }

    const tolerance = Number.isFinite(problem.tolerance)
      ? Math.max(0, problem.tolerance)
      : 1e-6;

    // Ejercicios que requieren dos raíces.
    if (
      problem.isPair ||
      Array.isArray(problem.answer)
    ) {
      const expected = Array.isArray(problem.answer)
        ? problem.answer
        : [];

      if (expected.length !== 2) return false;

      let actual;

      if (Array.isArray(input)) {
        actual = input.map(parseNumericAnswer);
      } else {
        /*
         * Se admiten formatos como:
         * -2, 3
         * -2 3
         * x1=-2, x2=3
         */
        const text = String(input ?? '')
          .trim()
          .replace(/x\s*[12]\s*=/gi, '')
          .replace(/[()]/g, '');

        actual = text
          .split(/[;\s,]+/)
          .filter(Boolean)
          .map(parseNumericAnswer);
      }

      if (
        actual.length !== 2 ||
        actual.some(value => !Number.isFinite(value))
      ) {
        return false;
      }

      actual.sort((a, b) => a - b);

      const sortedExpected = [...expected].sort(
        (a, b) => a - b
      );

      return (
        Math.abs(actual[0] - sortedExpected[0]) <= tolerance &&
        Math.abs(actual[1] - sortedExpected[1]) <= tolerance
      );
    }

    const actual = parseNumericAnswer(input);
    const expected = parseNumericAnswer(problem.answer);

    if (
      !Number.isFinite(actual) ||
      !Number.isFinite(expected)
    ) {
      return false;
    }

    return Math.abs(actual - expected) <= tolerance;
  }

  /* =========================
     API PÚBLICA
     ========================= */

  global.Games = {
    randomProblem,
    checkAnswer
  };

})(window);

