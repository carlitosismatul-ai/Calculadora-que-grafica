/* ==========================================================
   MathGraph Studio — MathEngine
   Parser matemático sin dependencias externas.
   Compatible con calculator.js, graph.js y solver.js.
   ========================================================== */

(function (global) {
    'use strict';

    // ======================================================
    // 1. FUNCIONES MATEMÁTICAS
    // ======================================================

    const FUNCTIONS = Object.freeze({
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        asin: Math.asin,
        acos: Math.acos,
        atan: Math.atan,
        sinh: Math.sinh,
        cosh: Math.cosh,
        tanh: Math.tanh,
        sqrt: Math.sqrt,
        abs: Math.abs,
        exp: Math.exp,
        log: Math.log10,
        ln: Math.log,
        floor: Math.floor,
        ceil: Math.ceil,
        round: Math.round,
        sign: Math.sign
    });

    // ======================================================
    // 2. CONSTANTES MATEMÁTICAS
    // ======================================================

    const CONSTANTS = Object.freeze({
        pi: Math.PI,
        e: Math.E,
        tau: Math.PI * 2
    });

    // ======================================================
    // 3. NORMALIZACIÓN
    // ======================================================

    function normalize(expression) {
        return String(expression ?? '')
            .replace(/[−–—]/g, '-')
            .replace(/[×·]/g, '*')
            .replace(/÷/g, '/')
            .replace(/²/g, '^2')
            .replace(/³/g, '^3')
            .replace(/⁴/g, '^4')
            .replace(/√/g, 'sqrt')
            .replace(/π/g, 'pi')
            .replace(/[θΘ]/g, 'theta')
            .replace(/[\[\]]/g, character =>
                character === '[' ? '(' : ')'
            )
            .replace(/\s+/g, '')
            .toLowerCase();
    }

    // ======================================================
    // 4. TOKENIZACIÓN
    // ======================================================

    function tokenize(expression) {
        const source = normalize(expression);
        const tokens = [];

        if (!source) {
            throw new Error('Escribe una expresión matemática.');
        }

        let index = 0;

        while (index < source.length) {
            const character = source[index];

            // Números, decimales y notación científica.
            if (/[0-9.]/.test(character)) {
                const match = source.slice(index).match(
                    /^(?:(?:\d+\.?\d*)|(?:\.\d+))(?:e[+-]?\d+)?/
                );

                if (!match) {
                    throw new Error(
                        'Número inválido cerca de: ' +
                        source.slice(index)
                    );
                }

                const raw = match[0];
                const value = Number(raw);

                if (!Number.isFinite(value)) {
                    throw new Error('El número está fuera de rango.');
                }

                tokens.push({ type: 'num', value });
                index += raw.length;
                continue;
            }

            // Funciones, constantes y variables.
            if (/[a-z]/.test(character)) {
                let end = index;

                while (
                    end < source.length &&
                    /[a-z]/.test(source[end])
                ) {
                    end++;
                }

                const word = source.slice(index, end);

                if (Object.prototype.hasOwnProperty.call(FUNCTIONS, word)) {
                    tokens.push({ type: 'func', value: word });
                } else if (Object.prototype.hasOwnProperty.call(CONSTANTS, word)) {
                    tokens.push({ type: 'num', value: CONSTANTS[word] });
                } else if (['x', 't', 'theta'].includes(word)) {
                    tokens.push({ type: 'var', value: word });
                } else {
                    throw new Error('Símbolo no reconocido: ' + word);
                }

                index = end;
                continue;
            }

            // Operadores y delimitadores.
            if ('+-*/^%(),'.includes(character)) {
                let type = 'op';

                if (character === '(') type = 'lparen';
                if (character === ')') type = 'rparen';
                if (character === ',') type = 'comma';

                tokens.push({ type, value: character });
                index++;
                continue;
            }

            throw new Error('Carácter inválido: ' + character);
        }

        // Multiplicación implícita:
        // 2x, 3(x+1), (x+1)(x-1), 2pi y 2sin(x).
        const output = [];

        for (let i = 0; i < tokens.length; i++) {
            const current = tokens[i];
            const previous = tokens[i - 1];

            if (previous) {
                const leftCanMultiply = [
                    'num', 'var', 'rparen'
                ].includes(previous.type);

                const rightCanMultiply = [
                    'num', 'var', 'func', 'lparen'
                ].includes(current.type);

                if (leftCanMultiply && rightCanMultiply) {
                    output.push({ type: 'op', value: '*' });
                }
            }

            output.push(current);
        }

        return output;
    }

    // ======================================================
    // 5. PRECEDENCIA
    // ======================================================

    const PRECEDENCE = Object.freeze({
        '+': 2,
        '-': 2,
        '*': 3,
        '/': 3,
        '%': 3,
        'u+': 4,
        'u-': 4,
        '^': 5
    });

    const RIGHT_ASSOCIATIVE = new Set([
        'u+', 'u-', '^'
    ]);

    // ======================================================
    // 6. VALIDACIÓN SINTÁCTICA
    // ======================================================

    function validateTokens(tokens) {
        if (!tokens.length) {
            throw new Error('La expresión está vacía.');
        }

        let parentheses = 0;
        let expectsValue = true;
        let previous = null;

        for (const token of tokens) {
            if (token.type === 'num' || token.type === 'var') {
                if (!expectsValue) {
                    throw new Error(
                        'Falta un operador entre los valores.'
                    );
                }

                expectsValue = false;
            } else if (token.type === 'func') {
                if (!expectsValue) {
                    throw new Error(
                        'Falta un operador antes de la función.'
                    );
                }

                expectsValue = true;
            } else if (token.type === 'lparen') {
                if (!expectsValue) {
                    throw new Error(
                        'Falta un operador antes del paréntesis.'
                    );
                }

                parentheses++;
                expectsValue = true;
            } else if (token.type === 'rparen') {
                if (parentheses <= 0) {
                    throw new Error('Paréntesis desbalanceados.');
                }

                if (expectsValue) {
                    throw new Error(
                        'Hay un paréntesis vacío o una operación incompleta.'
                    );
                }

                parentheses--;
                expectsValue = false;
            } else if (token.type === 'comma') {
                throw new Error(
                    'Las funciones admiten un solo argumento.'
                );
            } else if (token.type === 'op') {
                const operator = token.value;

                if (expectsValue) {
                    if (operator !== '+' && operator !== '-') {
                        throw new Error(
                            'Falta un número o una variable antes de "' +
                            operator + '".'
                        );
                    }
                } else if (
                    operator === '+' ||
                    operator === '-' ||
                    operator === '*' ||
                    operator === '/' ||
                    operator === '%' ||
                    operator === '^'
                ) {
                    // Se espera otro valor después del operador.
                }

                expectsValue = true;
            }

            previous = token;
        }

        if (parentheses !== 0) {
            throw new Error('Paréntesis desbalanceados.');
        }

        if (expectsValue) {
            throw new Error(
                'La expresión termina con una operación incompleta.'
            );
        }

        if (previous && previous.type === 'func') {
            throw new Error('Falta el argumento de la función.');
        }
    }

    // ======================================================
    // 7. CONVERSIÓN A NOTACIÓN POSTFIJA (RPN)
    // ======================================================

    function toRPN(tokens) {
        validateTokens(tokens);

        const output = [];
        const stack = [];
        let previous = null;

        for (const token of tokens) {
            if (token.type === 'num' || token.type === 'var') {
                output.push(token);
            } else if (token.type === 'func') {
                stack.push(token);
            } else if (token.type === 'op') {
                let operator = token.value;

                const unaryPosition =
                    previous === null ||
                    previous.type === 'op' ||
                    previous.type === 'lparen';

                if (unaryPosition && operator === '-') {
                    operator = 'u-';
                } else if (unaryPosition && operator === '+') {
                    operator = 'u+';
                }

                // Los operadores unarios no deben sacar la potencia
                // de la pila: -2^2 debe evaluarse como -(2^2).
                while (stack.length) {
                    const top = stack[stack.length - 1];

                    if (top.type !== 'op') break;

                    const currentPrecedence = PRECEDENCE[operator];
                    const topPrecedence = PRECEDENCE[top.value];

                    const shouldPop = RIGHT_ASSOCIATIVE.has(operator)
                        ? topPrecedence > currentPrecedence
                        : topPrecedence >= currentPrecedence;

                    if (!shouldPop) break;

                    output.push(stack.pop());
                }

                stack.push({ type: 'op', value: operator });
            } else if (token.type === 'lparen') {
                stack.push(token);
            } else if (token.type === 'rparen') {
                while (
                    stack.length &&
                    stack[stack.length - 1].type !== 'lparen'
                ) {
                    output.push(stack.pop());
                }

                if (!stack.length) {
                    throw new Error('Paréntesis desbalanceados.');
                }

                stack.pop();

                if (
                    stack.length &&
                    stack[stack.length - 1].type === 'func'
                ) {
                    output.push(stack.pop());
                }
            }

            previous = token;
        }

        while (stack.length) {
            const token = stack.pop();

            if (token.type === 'lparen' || token.type === 'rparen') {
                throw new Error('Paréntesis desbalanceados.');
            }

            output.push(token);
        }

        return output;
    }

    // ======================================================
    // 8. EVALUACIÓN RPN
    // ======================================================

    function evalRPN(rpn, x) {
        const stack = [];

        for (const token of rpn) {
            if (token.type === 'num') {
                stack.push(token.value);
                continue;
            }

            if (token.type === 'var') {
                stack.push(x);
                continue;
            }

            if (token.type === 'func') {
                if (stack.length < 1) return NaN;

                const argument = stack.pop();
                const fn = FUNCTIONS[token.value];

                if (typeof fn !== 'function') return NaN;

                stack.push(fn(argument));
                continue;
            }

            if (token.type === 'op') {
                if (token.value === 'u-' || token.value === 'u+') {
                    if (stack.length < 1) return NaN;

                    const value = stack.pop();
                    stack.push(token.value === 'u-' ? -value : value);
                    continue;
                }

                if (stack.length < 2) return NaN;

                const b = stack.pop();
                const a = stack.pop();
                let result;

                switch (token.value) {
                    case '+': result = a + b; break;
                    case '-': result = a - b; break;
                    case '*': result = a * b; break;
                    case '/': result = a / b; break;
                    case '%': result = a % b; break;
                    case '^': result = Math.pow(a, b); break;
                    default: return NaN;
                }

                stack.push(result);
            }
        }

        return stack.length === 1 ? stack[0] : NaN;
    }

    // ======================================================
    // 9. EXPRESIÓN COMPILADA
    // ======================================================

    class CompiledExpr {
        constructor(source) {
            this.source = String(source ?? '');
            this.rpn = toRPN(tokenize(this.source));
        }

        at(x) {
            try {
                const value = evalRPN(this.rpn, Number(x));
                return Number.isFinite(value) ? value : NaN;
            } catch (error) {
                return NaN;
            }
        }
    }

    // ======================================================
    // 10. COMPILAR
    // ======================================================

    function compile(expression) {
        return new CompiledExpr(expression);
    }

    // ======================================================
    // 11. BÚSQUEDA NUMÉRICA DE RAÍCES
    // ======================================================

    function findRoots(fn, min, max, steps = 4000) {
        if (!fn || typeof fn.at !== 'function') {
            throw new TypeError(
                'Se necesita una expresión compilada.'
            );
        }

        min = Number(min);
        max = Number(max);
        steps = Math.floor(Number(steps));

        if (
            !Number.isFinite(min) ||
            !Number.isFinite(max) ||
            min >= max
        ) {
            throw new RangeError(
                'El intervalo de búsqueda no es válido.'
            );
        }

        if (!Number.isFinite(steps) || steps < 1) {
            throw new RangeError(
                'El número de pasos debe ser positivo.'
            );
        }

        steps = Math.min(steps, 100000);

        const roots = [];
        const dx = (max - min) / steps;
        const zeroTolerance = 1e-8;

        function addRoot(root) {
            if (!Number.isFinite(root)) return;

            if (!roots.some(existing => Math.abs(existing - root) < 1e-5)) {
                roots.push(root);
            }
        }

        let previousX = min;
        let previousY = fn.at(previousX);

        for (let i = 1; i <= steps; i++) {
            const currentX = min + i * dx;
            const currentY = fn.at(currentX);

            if (Number.isFinite(currentY)) {
                if (Math.abs(currentY) < zeroTolerance) {
                    addRoot(currentX);
                }

                if (
                    Number.isFinite(previousY) &&
                    previousY * currentY < 0
                ) {
                    let a = previousX;
                    let b = currentX;
                    let fa = previousY;

                    for (let iteration = 0; iteration < 60; iteration++) {
                        const middle = (a + b) / 2;
                        const fm = fn.at(middle);

                        if (!Number.isFinite(fm)) break;

                        if (
                            Math.abs(fm) < zeroTolerance ||
                            Math.abs(b - a) < 1e-10
                        ) {
                            a = middle;
                            b = middle;
                            break;
                        }

                        if (fa * fm <= 0) {
                            b = middle;
                        } else {
                            a = middle;
                            fa = fm;
                        }
                    }

                    addRoot((a + b) / 2);
                }
            }

            previousX = currentX;
            previousY = currentY;
        }

        roots.sort((a, b) => a - b);

        return roots.map(root => Math.round(root * 1e6) / 1e6);
    }

    // ======================================================
    // 12. API PÚBLICA
    // ======================================================

    global.MathEngine = {
        compile,
        findRoots,
        FUNCTIONS,
        CONSTANTS,
        normalize,
        normalizeInput: normalize
    };

})(window);

