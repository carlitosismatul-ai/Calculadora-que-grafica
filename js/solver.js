/* =========================================================
   MathGraph Studio — Solver mejorado
   Solución paso a paso con selección de operación.
   Compatible con MathEngine.compile().at(x)
========================================================= */

(function (global) {
    'use strict';

    const M = global.MathEngine;

    if (!M || typeof M.compile !== 'function') {
        console.error('Solver: MathEngine no está disponible.');
        return;
    }

    const normalizeInput = M.normalizeInput || M.normalize;
    const EPS = 1e-9;
    const ROOT_EPS = 1e-6;

    // ---------------------------------------------------------
    // UTILIDADES
    // ---------------------------------------------------------

    function fmt(n, decimals = 6) {
        if (!Number.isFinite(n)) return '—';

        if (Math.abs(n) < 0.5 * 10 ** -decimals) {
            n = 0;
        }

        const result = Number(n.toFixed(decimals));

        return Object.is(result, -0) ? '0' : String(result);
    }

    function near(a, b, tolerance = 1e-7) {
        return Number.isFinite(a) &&
            Number.isFinite(b) &&
            Math.abs(a - b) <= tolerance *
            Math.max(1, Math.abs(a), Math.abs(b));
    }

    function escapeHTML(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function compile(expression) {
        const result = M.compile(expression);

        if (!result || typeof result.at !== 'function') {
            throw new Error(
                'No se pudo interpretar la expresión matemática.'
            );
        }

        return result;
    }

    function safeAt(fn, x) {
        try {
            const result = fn.at(x);
            return Number.isFinite(result) ? result : NaN;
        } catch {
            return NaN;
        }
    }

    function uniqueRoots(roots) {
        const result = [];

        roots
            .filter(Number.isFinite)
            .sort((a, b) => a - b)
            .forEach(root => {
                if (!result.some(existing =>
                    Math.abs(existing - root) < ROOT_EPS
                )) {
                    result.push(root);
                }
            });

        return result;
    }

    function signTerm(coefficient, variable, first = false) {
        if (Math.abs(coefficient) < EPS) return '';

        const absolute = Math.abs(coefficient);

        const number = variable && near(absolute, 1)
            ? ''
            : fmt(absolute);

        const term = `${number}${variable}`;

        if (first) {
            return coefficient < 0 ? `−${term}` : term;
        }

        return coefficient < 0
            ? ` − ${term}`
            : ` + ${term}`;
    }

    function polynomialString(a, b, c) {
        let result = '';

        result += signTerm(a, 'x²', true);
        result += signTerm(b, 'x', result === '');
        result += signTerm(c, '', result === '');

        return result || '0';
    }

    function validateInput(input) {
        if (typeof input !== 'string' || !input.trim()) {
            throw new Error('Escribe una expresión o ecuación.');
        }

        if (typeof normalizeInput !== 'function') {
            throw new Error(
                'MathEngine no proporciona una función de normalización.'
            );
        }

        const normalized = normalizeInput(input);

        if (typeof normalized !== 'string' || !normalized.trim()) {
            throw new Error('La expresión está vacía o no es válida.');
        }

        return normalized;
    }

    function hasEquality(input) {
        return input.includes('=');
    }

    function splitEquation(input) {
        const index = input.indexOf('=');

        if (index === -1) {
            throw new Error(
                'Escribe una ecuación utilizando el signo =.'
            );
        }

        if (input.indexOf('=', index + 1) !== -1) {
            throw new Error('Escribe una sola igualdad.');
        }

        const left = input.slice(0, index).trim();
        const right = input.slice(index + 1).trim();

        if (!left || !right) {
            throw new Error(
                'Completa ambos lados de la ecuación.'
            );
        }

        return { left, right };
    }

    // ---------------------------------------------------------
    // DETECCIÓN APROXIMADA DE POLINOMIOS
    //
    // Identifica polinomios de grado 0, 1 o 2 mediante muestras.
    // No constituye una prueba simbólica general.
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

        const matches = points.every((x, index) => {
            const predicted = a * x * x + b * x + c;

            return near(predicted, values[index], 1e-7);
        });

        if (!matches) {
            return { degree: null };
        }

        if (Math.abs(a) > EPS) {
            return { degree: 2, a, b, c };
        }

        if (Math.abs(b) > EPS) {
            return { degree: 1, a: b, b: c };
        }

        return { degree: 0, value: c };
    }

    function getEquationInfo(input) {
        const { left, right } = splitEquation(input);

        const leftFn = compile(left);
        const rightFn = compile(right);

        const difference = {
            at(x) {
                const leftValue = safeAt(leftFn, x);
                const rightValue = safeAt(rightFn, x);

                if (
                    !Number.isFinite(leftValue) ||
                    !Number.isFinite(rightValue)
                ) {
                    return NaN;
                }

                return leftValue - rightValue;
            }
        };

        return {
            left,
            right,
            difference,
            degreeInfo: sampleDegree(difference)
        };
    }

    // ---------------------------------------------------------
    // ECUACIONES LINEALES
    // ax + b = 0
    // ---------------------------------------------------------

    function solveLinear(a, b, left, right) {
        const steps = [];

        steps.push(`Ecuación original: ${left} = ${right}.`);

        steps.push(
            'Restamos el lado derecho al izquierdo para escribir la ecuación igualada a cero.'
        );

        steps.push(
            `Forma estándar: ${polynomialString(0, a, b)} = 0.`
        );

        if (Math.abs(a) < EPS) {
            if (Math.abs(b) < EPS) {
                steps.push(
                    'Ambos lados son equivalentes para cualquier valor de x.'
                );

                steps.push(
                    'Resultado: infinitas soluciones reales.'
                );

                return {
                    type: 'Ecuación constante',
                    steps,
                    roots: [],
                    infinitelyManySolutions: true
                };
            }

            steps.push(
                `La ecuación se reduce a ${fmt(b)} = 0, lo cual es imposible.`
            );

            steps.push(
                'Resultado: la ecuación no tiene soluciones.'
            );

            return {
                type: 'Ecuación constante',
                steps,
                roots: [],
                noSolutions: true
            };
        }

        steps.push(
            `Restamos ${fmt(b)} a ambos lados: ${fmt(a)}x = ${fmt(-b)}.`
        );

        steps.push(
            `Dividimos ambos lados entre ${fmt(a)}.`
        );

        const root = -b / a;

        if (!Number.isFinite(root)) {
            throw new Error(
                'No se pudo representar la solución como un número finito.'
            );
        }

        steps.push(`Resultado: x = ${fmt(root)}.`);

        return {
            type: 'Ecuación lineal',
            steps,
            roots: [root]
        };
    }

    // ---------------------------------------------------------
    // ECUACIONES CUADRÁTICAS
    // ax² + bx + c = 0
    // ---------------------------------------------------------

    function solveQuadratic(a, b, c) {
        if (Math.abs(a) < EPS) {
            return solveLinear(
                b,
                c,
                polynomialString(0, b, c),
                '0'
            );
        }

        const steps = [];

        steps.push(
            `Forma estándar: ${polynomialString(a, b, c)} = 0.`
        );

        steps.push(
            `Identificamos los coeficientes: a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}.`
        );

        steps.push(
            'Utilizamos la fórmula general: x = (−b ± √(b² − 4ac)) / (2a).'
        );

        const discriminant = b * b - 4 * a * c;

        steps.push(
            `Calculamos el discriminante: Δ = b² − 4ac = ${fmt(discriminant)}.`
        );

        let roots = [];

        if (discriminant > EPS) {
            const sqrtD = Math.sqrt(discriminant);

            steps.push(
                'Como el discriminante es positivo, existen dos raíces reales distintas.'
            );

            steps.push(
                `La raíz cuadrada del discriminante es ${fmt(sqrtD)}.`
            );

            // Fórmula numéricamente más estable para calcular las raíces.
            const q = -0.5 * (
                b + Math.sign(b || 1) * sqrtD
            );

            const r1 = q / a;

            const r2 = Math.abs(q) > EPS
                ? c / q
                : (-b - sqrtD) / (2 * a);

            roots = uniqueRoots([r1, r2]);

            steps.push(`Primera raíz: x₁ = ${fmt(roots[0])}.`);
            steps.push(`Segunda raíz: x₂ = ${fmt(roots[1])}.`);

            steps.push(
                `Resultado: x₁ = ${fmt(roots[0])} y x₂ = ${fmt(roots[1])}.`
            );
        } else if (Math.abs(discriminant) <= EPS) {
            const root = -b / (2 * a);

            roots = [root];

            steps.push(
                'Como el discriminante es cero, existe una raíz real doble.'
            );

            steps.push(
                `Aplicamos x = −b / (2a) y obtenemos x = ${fmt(root)}.`
            );

            steps.push(
                `Resultado: x = ${fmt(root)} (raíz doble).`
            );
        } else {
            const real = -b / (2 * a);
            const imaginary = Math.sqrt(-discriminant) / (2 * Math.abs(a));

            steps.push(
                'Como el discriminante es negativo, no existen raíces reales.'
            );

            steps.push(
                'En los números complejos, las soluciones tienen una parte real y una parte imaginaria.'
            );

            steps.push(
                `Resultado complejo: x = ${fmt(real)} ± ${fmt(imaginary)}i.`
            );
        }

        return {
            type: 'Ecuación cuadrática',
            steps,
            roots,
            discriminant
        };
    }

    // ---------------------------------------------------------
    // MODO AUTOMÁTICO PARA ECUACIONES
    // ---------------------------------------------------------

    function solveEquationAuto(input) {
        const info = getEquationInfo(input);
        const degree = info.degreeInfo;

        if (degree.degree === 2) {
            return solveQuadratic(
                degree.a,
                degree.b,
                degree.c
            );
        }

        if (degree.degree === 1) {
            return solveLinear(
                degree.a,
                degree.b,
                info.left,
                info.right
            );
        }

        if (degree.degree === 0) {
            if (near(degree.value, 0)) {
                return {
                    type: 'Ecuación constante',
                    steps: [
                        'Al restar ambos lados, obtenemos cero.',
                        'La igualdad se cumple para todos los valores reales de x.'
                    ],
                    roots: [],
                    infinitelyManySolutions: true
                };
            }

            return {
                type: 'Ecuación constante',
                steps: [
                    `La diferencia entre ambos lados es ${fmt(degree.value)}.`,
                    'Como esta constante no es cero, la ecuación no tiene soluciones.'
                ],
                roots: [],
                noSolutions: true
            };
        }

        throw new Error(
            'No se pudo clasificar esta ecuación como lineal o cuadrática. Este solucionador todavía no garantiza la resolución simbólica de ecuaciones de mayor grado o no polinómicas.'
        );
    }

    // ---------------------------------------------------------
    // EVALUACIÓN DE EXPRESIONES
    // ---------------------------------------------------------

    function evaluateExpression(input, xValue, mode) {
        const expression = normalizeInput(input);
        const fn = compile(expression);
        const steps = [];

        const isFunctionMode = mode === 'function';

        // Detectamos variables como tokens, no dentro de nombres de funciones.
        const containsVariable =
            /(?:^|[^a-zA-Z])(?:x|t|theta)(?=$|[^a-zA-Z])/i.test(expression);

        steps.push(`Expresión ingresada: ${input}.`);

        if (isFunctionMode && !containsVariable) {
            steps.push(
                'La expresión no contiene una variable reconocida. Se evaluará como una constante.'
            );
        }

        if (containsVariable) {
            if (!Number.isFinite(xValue)) {
                throw new Error(
                    'Esta expresión contiene una variable. Introduce un valor numérico para evaluarla.'
                );
            }

            steps.push(
                `Sustituimos la variable por ${fmt(xValue)}.`
            );

            const result = safeAt(fn, xValue);

            if (!Number.isFinite(result)) {
                throw new Error(
                    'La expresión no produce un resultado real finito para ese valor. Comprueba el dominio.'
                );
            }

            steps.push(
                `Resultado: f(${fmt(xValue)}) = ${fmt(result)}.`
            );

            return {
                type: isFunctionMode
                    ? 'Evaluación de función'
                    : 'Evaluación aritmética',
                steps,
                value: result
            };
        }

        const result = safeAt(fn, 0);

        if (!Number.isFinite(result)) {
            throw new Error(
                'La expresión no produce un resultado real finito.'
            );
        }

        steps.push(
            'Evaluamos las operaciones respetando los paréntesis, los exponentes, las multiplicaciones, las divisiones y las demás operaciones.'
        );

        steps.push(`Resultado final: ${fmt(result)}.`);

        return {
            type: 'Evaluación aritmética',
            steps,
            value: result
        };
    }

    // ---------------------------------------------------------
    // ANÁLISIS DE POLINOMIOS
    // ---------------------------------------------------------

    function analyzePolynomial(input) {
        if (hasEquality(input)) {
            const info = getEquationInfo(input);
            const degree = info.degreeInfo;

            if (degree.degree === 1 || degree.degree === 2) {
                const a = degree.degree === 2 ? degree.a : 0;
                const b = degree.degree === 2 ? degree.b : degree.a;
                const c = degree.degree === 2 ? degree.c : degree.b;

                return {
                    type: 'Análisis de polinomio',
                    steps: [
                        `Ecuación ingresada: ${info.left} = ${info.right}.`,
                        'Restamos el lado derecho al izquierdo para obtener una expresión igualada a cero.',
                        `Polinomio resultante: ${polynomialString(a, b, c)}.`,
                        `Coeficiente de x²: ${fmt(a)}.`,
                        `Coeficiente de x: ${fmt(b)}.`,
                        `Término independiente: ${fmt(c)}.`,
                        `Grado identificado: ${degree.degree}.`
                    ]
                };
            }

            throw new Error(
                'Por ahora, el análisis de polinomios admite ecuaciones de grado uno o dos.'
            );
        }

        const fn = compile(input);
        const degree = sampleDegree(fn);

        if (degree.degree === null) {
            throw new Error(
                'No se pudo confirmar que esta expresión sea un polinomio de grado uno o dos.'
            );
        }

        const a = degree.degree === 2 ? degree.a : 0;

        const b = degree.degree === 2
            ? degree.b
            : degree.degree === 1
                ? degree.a
                : 0;

        const c = degree.degree === 2
            ? degree.c
            : degree.degree === 1
                ? degree.b
                : degree.value;

        return {
            type: 'Análisis de polinomio',
            steps: [
                `Expresión analizada: ${input}.`,
                `Forma polinómica identificada: ${polynomialString(a, b, c)}.`,
                `Coeficiente de x²: ${fmt(a)}.`,
                `Coeficiente de x: ${fmt(b)}.`,
                `Término independiente: ${fmt(c)}.`,
                `Grado identificado: ${degree.degree}.`,
                'Este análisis identifica el grado y los coeficientes; no realiza todavía una simplificación simbólica general.'
            ]
        };
    }

    // ---------------------------------------------------------
    // FACTORIZACIÓN CUADRÁTICA
    // ---------------------------------------------------------

    function factorQuadratic(input) {
        const info = getEquationInfo(input);
        const degree = info.degreeInfo;

        if (degree.degree !== 2) {
            throw new Error(
                'La factorización implementada actualmente necesita una ecuación cuadrática reconocible, por ejemplo x^2 - 5x + 6 = 0.'
            );
        }

        const { a, b, c } = degree;
        const result = solveQuadratic(a, b, c);
        const roots = result.roots || [];

        const steps = [
            `Ecuación original: ${info.left} = ${info.right}.`,
            `Forma estándar: ${polynomialString(a, b, c)} = 0.`,
            'Calculamos las raíces de la ecuación cuadrática para construir sus factores.'
        ];

        if (result.discriminant < -EPS) {
            steps.push(
                'El discriminante es negativo: no se puede factorizar en dos factores lineales reales.'
            );

            return {
                type: 'Factorización cuadrática',
                steps: steps.concat(result.steps.slice(3)),
                roots: []
            };
        }

        if (roots.length === 1) {
            const root = roots[0];

            steps.push(
                `La raíz doble es x = ${fmt(root)}.`
            );

            steps.push(
                `Sobre los números reales, la factorización es ${fmt(a)}(x − (${fmt(root)}))² = 0.`
            );
        } else if (roots.length === 2) {
            steps.push(
                `Las raíces son x₁ = ${fmt(roots[0])} y x₂ = ${fmt(roots[1])}.`
            );

            steps.push(
                'Usamos la forma a(x − x₁)(x − x₂).'
            );

            steps.push(
                `Factorización: ${fmt(a)}(x − (${fmt(roots[0])}))(x − (${fmt(roots[1])})) = 0.`
            );
        }

        return {
            type: 'Factorización cuadrática',
            steps,
            roots
        };
    }

    // ---------------------------------------------------------
    // RESOLUCIÓN NUMÉRICA DE RESPALDO
    // ---------------------------------------------------------

    function solveNumeric(input) {
        if (typeof M.findRoots !== 'function') {
            throw new Error(
                'La búsqueda numérica de raíces no está disponible.'
            );
        }

        const info = getEquationInfo(input);

        const steps = [
            `Ecuación original: ${info.left} = ${info.right}.`,
            `Definimos g(x) = (${info.left}) − (${info.right}).`,
            'Buscamos aproximaciones de los valores para los cuales g(x) = 0.',
            'La búsqueda se realiza en el intervalo [−25, 25].'
        ];

        let roots = [];

        try {
            roots = uniqueRoots(
                M.findRoots(info.difference, -25, 25, 12000)
            );
        } catch {
            roots = [];
        }

        if (roots.length) {
            steps.push(
                `Raíces aproximadas encontradas: ${roots.map(root => fmt(root, 5)).join(', ')}.`
            );

            steps.push(
                `Resultado aproximado: ${roots.map(root => `x ≈ ${fmt(root, 5)}`).join('; ')}.`
            );

            steps.push(
                'La búsqueda numérica puede omitir raíces fuera del intervalo o raíces que no crucen el eje horizontal.'
            );
        } else {
            steps.push(
                'No se encontraron raíces mediante la búsqueda numérica en [−25, 25].'
            );

            steps.push(
                'Esto no demuestra que la ecuación carezca de soluciones.'
            );
        }

        return {
            type: 'Resolución numérica',
            steps,
            roots,
            interval: { min: -25, max: 25 }
        };
    }

    // ---------------------------------------------------------
    // PUNTO DE ENTRADA
    //
    // mode:
    // auto, arithmetic, linear, quadratic, polynomial,
    // factor, powers, function, numeric
    // ---------------------------------------------------------

    function solve(input, xValue, mode = 'auto') {
        const raw = validateInput(input);
        const selectedMode = mode || 'auto';

        switch (selectedMode) {
            case 'auto':
                if (hasEquality(raw)) {
                    return solveEquationAuto(raw);
                }

                return evaluateExpression(
                    raw,
                    xValue,
                    'arithmetic'
                );

            case 'arithmetic':
                if (hasEquality(raw)) {
                    throw new Error(
                        'El modo aritmético espera una operación sin signo igual.'
                    );
                }

                return evaluateExpression(
                    raw,
                    xValue,
                    'arithmetic'
                );

            case 'linear': {
                const info = getEquationInfo(raw);

                if (info.degreeInfo.degree !== 1) {
                    throw new Error(
                        'El modo lineal necesita una ecuación de primer grado, por ejemplo 2x + 7 = 19.'
                    );
                }

                return solveLinear(
                    info.degreeInfo.a,
                    info.degreeInfo.b,
                    info.left,
                    info.right
                );
            }

            case 'quadratic': {
                const info = getEquationInfo(raw);

                if (info.degreeInfo.degree !== 2) {
                    throw new Error(
                        'El modo cuadrático necesita una ecuación de segundo grado, por ejemplo x^2 - 5x + 6 = 0.'
                    );
                }

                return solveQuadratic(
                    info.degreeInfo.a,
                    info.degreeInfo.b,
                    info.degreeInfo.c
                );
            }

            case 'polynomial':
                return analyzePolynomial(raw);

            case 'factor':
                return factorQuadratic(raw);

            case 'powers':
                if (hasEquality(raw)) {
                    throw new Error(
                        'El modo de potencias y raíces espera una expresión sin signo igual.'
                    );
                }

                return evaluateExpression(
                    raw,
                    xValue,
                    'arithmetic'
                );

            case 'function':
                if (hasEquality(raw)) {
                    throw new Error(
                        'Para evaluar una función, escribe una expresión como x^2 + 3x y utiliza el campo del valor de x.'
                    );
                }

                return evaluateExpression(
                    raw,
                    xValue,
                    'function'
                );

            case 'numeric':
                if (!hasEquality(raw)) {
                    throw new Error(
                        'Escribe una ecuación con signo igual para buscar raíces numéricamente.'
                    );
                }

                return solveNumeric(raw);

            default:
                throw new Error(
                    'Selecciona un tipo de operación válido.'
                );
        }
    }

    global.Solver = {
        solve,
        sampleDegree
    };

})(window);

