/* =========================================================
   CALCULADORA MATEMÁTICA
   main.js
   ========================================================= */

/* =========================================================
   ELEMENTOS
   ========================================================= */

const loading = document.getElementById("loading");
const progress = document.getElementById("progress");
const percent = document.getElementById("percent");
const statusText = document.getElementById("status");

const app = document.getElementById("app");

const typeSelect = document.getElementById("type");
const functionInput = document.getElementById("functionInput");

const procedure = document.getElementById("procedure");
const result = document.getElementById("result");
const graph = document.getElementById("graph");

const settingsOverlay = document.getElementById("settingsOverlay");


/* =========================================================
   ESTADO
   ========================================================= */

let currentFunction = null;
let currentFunctionText = "";
let currentType = "linear";

let graphState = {
    minX: -10,
    maxX: 10,
    minY: -10,
    maxY: 10
};

let loadingInterval = null;


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const defaultSettings = {
    theme: "dark",
    color: "red",
    font: "arial",
    borders: true,
    neon: true,
    size: "normal"
};


/* =========================================================
   INICIO / LOADING
   ========================================================= */

function startLoading() {

    let value = 0;

    const messages = [
        "Iniciando calculadora...",
        "Preparando módulos matemáticos...",
        "Cargando sistema de gráficas...",
        "Preparando funciones...",
        "Inicializando interfaz...",
        "Sistema listo."
    ];

    let messageIndex = 0;

    if (progress) progress.style.width = "0%";
    if (percent) percent.textContent = "0%";
    if (statusText) statusText.textContent = messages[0];

    loadingInterval = setInterval(() => {

        value += Math.floor(Math.random() * 4) + 1;

        if (value >= 100) {
            value = 100;
        }

        if (progress) {
            progress.style.width = `${value}%`;
        }

        if (percent) {
            percent.textContent = `${value}%`;
        }

        const newIndex = Math.min(
            Math.floor(value / 20),
            messages.length - 1
        );

        if (newIndex !== messageIndex) {
            messageIndex = newIndex;

            if (statusText) {
                statusText.textContent = messages[messageIndex];
            }
        }

        if (value >= 100) {

    clearInterval(loadingInterval);
    loadingInterval = null;

    setTimeout(() => {

        /* Ocultar pantalla de carga */
        if (loading) {
            loading.style.display = "none";
            loading.classList.add("hidden");
        }

        /* Mostrar calculadora */
        if (app) {
            app.style.display = "block";
            app.style.visibility = "visible";
            app.style.opacity = "1";
            app.classList.add("visible");
        }

        /* Dibujar gráfica */
        setTimeout(() => {
            drawGraph();
        }, 100);

    }, 500);
}

    }, 55);
}


/* =========================================================
   CONFIGURACIÓN - VENTANA
   ========================================================= */

function openSettings() {

    if (!settingsOverlay) return;

    settingsOverlay.classList.add("open");
}

function closeSettings() {

    if (!settingsOverlay) return;

    settingsOverlay.classList.remove("open");
}

function closeSettingsOutside(event) {

    if (
        settingsOverlay &&
        event.target === settingsOverlay
    ) {
        closeSettings();
    }
}


/* =========================================================
   CONFIGURACIÓN - TEMA
   ========================================================= */

function setTheme(theme) {

    if (theme !== "dark" && theme !== "light") {
        theme = "dark";
    }

    document.body.classList.remove("light-theme");

    if (theme === "light") {
        document.body.classList.add("light-theme");
    }

    saveSetting("theme", theme);

    updateActiveSettings();

    setTimeout(drawGraph, 50);
}


/* =========================================================
   CONFIGURACIÓN - COLOR
   ========================================================= */

function setColor(color) {

    const colors = [
        "red",
        "gold",
        "blue",
        "green",
        "purple"
    ];

    if (!colors.includes(color)) {
        color = "red";
    }

    document.body.classList.remove(
        "theme-red",
        "theme-gold",
        "theme-blue",
        "theme-green",
        "theme-purple"
    );

    document.body.classList.add(`theme-${color}`);

    saveSetting("color", color);

    updateActiveSettings();

    setTimeout(drawGraph, 50);
}


/* =========================================================
   CONFIGURACIÓN - FUENTE
   ========================================================= */

function setFont(font) {

    const fonts = [
        "arial",
        "segoe",
        "consolas",
        "courier",
        "verdana"
    ];

    if (!fonts.includes(font)) {
        font = "arial";
    }

    document.body.classList.remove(
        "font-arial",
        "font-segoe",
        "font-consolas",
        "font-courier",
        "font-verdana"
    );

    document.body.classList.add(`font-${font}`);

    saveSetting("font", font);

    updateActiveSettings();
}


/* =========================================================
   CONFIGURACIÓN - BORDES
   ========================================================= */

function toggleBorders() {

    const checkbox = document.getElementById("borderToggle");

    const enabled = checkbox
        ? checkbox.checked
        : true;

    document.body.classList.toggle(
        "no-borders",
        !enabled
    );

    saveSetting("borders", enabled);
}


/* =========================================================
   CONFIGURACIÓN - NEÓN
   ========================================================= */

function toggleNeon() {

    const checkbox = document.getElementById("neonToggle");

    const enabled = checkbox
        ? checkbox.checked
        : true;

    document.body.classList.toggle(
        "no-neon",
        !enabled
    );

    saveSetting("neon", enabled);
}


/* =========================================================
   CONFIGURACIÓN - TAMAÑO
   ========================================================= */

function setSize(size) {

    const sizes = [
        "compact",
        "normal",
        "large"
    ];

    if (!sizes.includes(size)) {
        size = "normal";
    }

    document.body.classList.remove(
        "size-compact",
        "size-normal",
        "size-large"
    );

    document.body.classList.add(`size-${size}`);

    if (size === "compact") {
        document.body.style.fontSize = "92%";
    }

    else if (size === "large") {
        document.body.style.fontSize = "108%";
    }

    else {
        document.body.style.fontSize = "100%";
    }

    saveSetting("size", size);

    updateActiveSettings();
}


/* =========================================================
   CONFIGURACIÓN - GUARDAR
   ========================================================= */

function saveSetting(key, value) {

    localStorage.setItem(
        `calculator_${key}`,
        String(value)
    );
}


/* =========================================================
   CONFIGURACIÓN - CARGAR
   ========================================================= */

function loadSettings() {

    const settings = {

        theme:
            localStorage.getItem("calculator_theme")
            || defaultSettings.theme,

        color:
            localStorage.getItem("calculator_color")
            || defaultSettings.color,

        font:
            localStorage.getItem("calculator_font")
            || defaultSettings.font,

        borders:
            localStorage.getItem("calculator_borders") !== null
                ? localStorage.getItem("calculator_borders") === "true"
                : defaultSettings.borders,

        neon:
            localStorage.getItem("calculator_neon") !== null
                ? localStorage.getItem("calculator_neon") === "true"
                : defaultSettings.neon,

        size:
            localStorage.getItem("calculator_size")
            || defaultSettings.size
    };


    setTheme(settings.theme);
    setColor(settings.color);
    setFont(settings.font);
    setSize(settings.size);


    document.body.classList.toggle(
        "no-borders",
        !settings.borders
    );

    document.body.classList.toggle(
        "no-neon",
        !settings.neon
    );


    const borderToggle =
        document.getElementById("borderToggle");

    const neonToggle =
        document.getElementById("neonToggle");


    if (borderToggle) {
        borderToggle.checked = settings.borders;
    }

    if (neonToggle) {
        neonToggle.checked = settings.neon;
    }


    updateActiveSettings();
}


/* =========================================================
   CONFIGURACIÓN - BOTONES ACTIVOS
   ========================================================= */

function updateActiveSettings() {

    document
        .querySelectorAll(".option-button")
        .forEach(button => {
            button.classList.remove("active");
        });

    document
        .querySelectorAll(".color-option")
        .forEach(button => {
            button.classList.remove("active");
        });


    const theme =
        localStorage.getItem("calculator_theme")
        || defaultSettings.theme;

    const color =
        localStorage.getItem("calculator_color")
        || defaultSettings.color;

    const font =
        localStorage.getItem("calculator_font")
        || defaultSettings.font;

    const size =
        localStorage.getItem("calculator_size")
        || defaultSettings.size;


    const themeButton =
        document.getElementById(
            theme === "light"
                ? "themeLight"
                : "themeDark"
        );

    if (themeButton) {
        themeButton.classList.add("active");
    }


    const colorButton =
        document.querySelector(
            `.color-option[data-color="${color}"]`
        );

    if (colorButton) {
        colorButton.classList.add("active");
    }


    const fontButton =
        document.querySelector(
            `.option-button[data-font="${font}"]`
        );

    if (fontButton) {
        fontButton.classList.add("active");
    }


    const sizeButton =
        document.querySelector(
            `.option-button[data-size="${size}"]`
        );

    if (sizeButton) {
        sizeButton.classList.add("active");
    }
}


/* =========================================================
   RESTABLECER CONFIGURACIÓN
   ========================================================= */

function resetSettings() {

    Object.keys(defaultSettings).forEach(key => {
        localStorage.removeItem(`calculator_${key}`);
    });

    loadSettings();
}


/* =========================================================
   NORMALIZAR EXPRESIONES
   ========================================================= */

function normalizeExpression(expression) {

    let exp = String(expression || "")
        .trim()
        .toLowerCase();


    if (!exp) {
        throw new Error("Debes ingresar una función.");
    }


    exp = exp
        .replace(/\s+/g, "")
        .replace(/π/g, "pi")
        .replace(/²/g, "^2")
        .replace(/³/g, "^3")
        .replace(/⁴/g, "^4")
        .replace(/⁵/g, "^5")
        .replace(/sen/g, "sin");


    /* Caracteres permitidos */

    if (!/^[0-9a-z+\-*/^().,]+$/i.test(exp)) {
        throw new Error(
            "La expresión contiene caracteres no permitidos."
        );
    }


    /* Bloqueo de palabras peligrosas */

    const forbidden = [
        "constructor",
        "prototype",
        "window",
        "document",
        "globalthis",
        "eval",
        "function",
        "fetch",
        "alert",
        "localstorage"
    ];


    for (const word of forbidden) {

        if (exp.includes(word)) {
            throw new Error(
                "La expresión contiene una instrucción no válida."
            );
        }
    }


    /* Multiplicación implícita */

    exp = exp.replace(
        /(\d|\)|x|pi)(?=(x|pi|\(|sin\(|cos\(|tan\(|sqrt\(|abs\(|ln\(|log\())/g,
        "$1*"
    );


    /* Funciones matemáticas */

    exp = exp
        .replace(/\bpi\b/g, "Math.PI")
        .replace(/\bsin\(/g, "Math.sin(")
        .replace(/\bcos\(/g, "Math.cos(")
        .replace(/\btan\(/g, "Math.tan(")
        .replace(/\bsqrt\(/g, "Math.sqrt(")
        .replace(/\babs\(/g, "Math.abs(")
        .replace(/\bln\(/g, "Math.log(")
        .replace(/\blog\(/g, "Math.log10(")
        .replace(/\^/g, "**");


    /*
       Después de reemplazar las funciones,
       comprobamos que no hayan quedado letras
       desconocidas.
    */

const leftovers = exp
    .replace(
        /Math\.(PI|sin|cos|tan|sqrt|abs|log|log10)/g,
        ""
    )
    .replace(/\bx\b/g, "");

if (/[a-zA-Z_]/.test(leftovers)) {
    throw new Error(
        "La función contiene una variable o palabra no válida."
    );
}


    return exp;
}


/* =========================================================
   CREAR FUNCIÓN
   ========================================================= */

function createFunction(expression) {

    const normalized = normalizeExpression(expression);


    let compiled;

    try {

        compiled = new Function(
            "x",
            `"use strict"; return (${normalized});`
        );

    } catch (error) {

        throw new Error(
            "No se pudo interpretar la función."
        );
    }


    return function (x) {

        try {

            const value = compiled(x);

            if (!Number.isFinite(value)) {
                return NaN;
            }

            return Number(value);

        } catch (error) {
            return NaN;
        }
    };
}


/* =========================================================
   RESOLVER PRINCIPAL
   ========================================================= */

function solve() {

    const expression =
        functionInput
            ? functionInput.value.trim()
            : "";


    if (!expression) {

        showError(
            "Ingresa una función antes de resolver."
        );

        return;
    }


    try {

        currentFunction = createFunction(expression);
        currentFunctionText = expression;
        currentType =
            typeSelect
                ? typeSelect.value
                : "linear";


        graphState = {
            minX: -10,
            maxX: 10,
            minY: -10,
            maxY: 10
        };


        switch (currentType) {

            case "linear":
                solveLinear();
                break;

            case "quadratic":
                solveQuadratic();
                break;

            case "polynomial":
                solvePolynomial();
                break;

            case "rational":
                solveRational();
                break;

            case "trigonometric":
                solveTrigonometric();
                break;

            default:
                throw new Error(
                    "Tipo de función no reconocido."
                );
        }


        drawGraph();

    } catch (error) {

        showError(
            error.message ||
            "Ocurrió un error al resolver la función."
        );
    }
}


/* =========================================================
   FUNCIÓN LINEAL
   ========================================================= */

function solveLinear() {

    const f = currentFunction;


    const y0 = f(0);
    const y1 = f(1);
    const y2 = f(2);


    if (
        !Number.isFinite(y0) ||
        !Number.isFinite(y1)
    ) {
        throw new Error(
            "La función no puede analizarse como lineal."
        );
    }


    const b = y0;
    const m = y1 - y0;


    if (Math.abs(m) < 1e-10) {

        procedure.innerHTML =
            `<pre>
f(x) = ${escapeHTML(currentFunctionText)}

Evaluamos:

f(0) = ${formatNumber(y0)}
f(1) = ${formatNumber(y1)}

Pendiente:

m = f(1) - f(0)
m = ${formatNumber(m)}

La pendiente es 0.
</pre>`;


        result.innerHTML =
            `<pre>
La función es constante.

No existe una única solución para f(x) = 0.
</pre>`;

        graphState = {
            minX: -10,
            maxX: 10,
            minY: -10,
            maxY: 10
        };

        return;
    }


    const root = -b / m;


    procedure.innerHTML =
        `<pre>
f(x) = ${escapeHTML(currentFunctionText)}

Forma lineal:

f(x) = mx + b

Calculamos:

f(0) = ${formatNumber(y0)}
f(1) = ${formatNumber(y1)}

Pendiente:

m = f(1) - f(0)
m = ${formatNumber(m)}

Intercepto:

b = ${formatNumber(b)}

Por lo tanto:

f(x) = ${formatNumber(m)}x ${b >= 0 ? "+" : "-"} ${formatNumber(Math.abs(b))}

Para encontrar la raíz:

0 = mx + b

x = -b / m

x = ${formatNumber(root)}
</pre>`;


    result.innerHTML =
        `<pre>
Raíz:

x = ${formatNumber(root)}

Intercepto con el eje Y:

(0, ${formatNumber(b)})

Pendiente:

m = ${formatNumber(m)}
</pre>`;


    const range = Math.max(5, Math.abs(root) + 3);

    graphState = {
        minX: -range,
        maxX: range,
        minY: -10,
        maxY: 10
    };
}


/* =========================================================
   FUNCIÓN CUADRÁTICA
   ========================================================= */

function solveQuadratic() {

    const f = currentFunction;


    const c = f(0);
    const f1 = f(1);
    const fm1 = f(-1);
    const f2 = f(2);


    if (
        !Number.isFinite(c) ||
        !Number.isFinite(f1) ||
        !Number.isFinite(fm1)
    ) {
        throw new Error(
            "No se pudo analizar la función cuadrática."
        );
    }


    const a =
        (f1 + fm1 - 2 * c) / 2;

    const b =
        (f1 - fm1) / 2;


    if (Math.abs(a) < 1e-10) {

        solveLinear();
        return;
    }


    const discriminant =
        b * b - 4 * a * c;


    const vertexX =
        -b / (2 * a);

    const vertexY =
        f(vertexX);


    let rootsText = "";


    if (discriminant > 1e-10) {

        const sqrtD =
            Math.sqrt(discriminant);

        const x1 =
            (-b + sqrtD) / (2 * a);

        const x2 =
            (-b - sqrtD) / (2 * a);


        rootsText =
            `x₁ = ${formatNumber(x1)}
x₂ = ${formatNumber(x2)}`;


        const range =
            Math.max(
                6,
                Math.abs(x1) + 3,
                Math.abs(x2) + 3
            );


        graphState = {
            minX: -range,
            maxX: range,
            minY: -10,
            maxY: 10
        };

    }

    else if (Math.abs(discriminant) <= 1e-10) {

        const x =
            -b / (2 * a);


        rootsText =
            `x = ${formatNumber(x)}`;


        const range =
            Math.max(6, Math.abs(x) + 3);


        graphState = {
            minX: -range,
            maxX: range,
            minY: -10,
            maxY: 10
        };

    }

    else {

        const real =
            -b / (2 * a);

        const imaginary =
            Math.sqrt(-discriminant) /
            Math.abs(2 * a);


        rootsText =
            `x₁ = ${formatNumber(real)} + ${formatNumber(imaginary)}i
x₂ = ${formatNumber(real)} - ${formatNumber(imaginary)}i`;


        graphState = {
            minX: -10,
            maxX: 10,
            minY: -10,
            maxY: 10
        };
    }


    procedure.innerHTML =
        `<pre>
f(x) = ${escapeHTML(currentFunctionText)}

Forma:

f(x) = ax² + bx + c

Evaluamos:

f(0) = ${formatNumber(c)}
f(1) = ${formatNumber(f1)}
f(-1) = ${formatNumber(fm1)}

Coeficiente a:

a = (f(1) + f(-1) - 2f(0)) / 2

a = ${formatNumber(a)}

Coeficiente b:

b = (f(1) - f(-1)) / 2

b = ${formatNumber(b)}

Coeficiente c:

c = ${formatNumber(c)}

Discriminante:

Δ = b² - 4ac

Δ = ${formatNumber(discriminant)}

Vértice:

xᵥ = -b / 2a
xᵥ = ${formatNumber(vertexX)}

yᵥ = ${formatNumber(vertexY)}
</pre>`;


    result.innerHTML =
        `<pre>
Raíces:

${rootsText}

Vértice:

(${formatNumber(vertexX)}, ${formatNumber(vertexY)})

Discriminante:

Δ = ${formatNumber(discriminant)}

${discriminant > 0
    ? "La función tiene dos raíces reales."
    : discriminant === 0
        ? "La función tiene una raíz real doble."
        : "La función no tiene raíces reales."
}
</pre>`;
}


/* =========================================================
   FUNCIÓN POLINOMIAL
   ========================================================= */

function solvePolynomial() {

    const roots =
        findRoots(
            currentFunction,
            -20,
            20,
            0.05
        );


    const uniqueRoots =
        uniqueNumbers(roots, 1e-5);


    const degree =
        estimateDegree(currentFunction);


    let rootsText;


    if (uniqueRoots.length === 0) {

        rootsText =
            "No se encontraron raíces reales en el intervalo analizado.";

    }

    else {

        rootsText =
            uniqueRoots
                .map(
                    (root, index) =>
                        `x${index + 1} = ${formatNumber(root)}`
                )
                .join("\n");
    }


    procedure.innerHTML =
        `<pre>
f(x) = ${escapeHTML(currentFunctionText)}

Tipo:

Polinomio

Se analiza el comportamiento de la función
mediante evaluación numérica.

Intervalo utilizado:

[-20, 20]

Paso de búsqueda:

0.05

Grado estimado:

${degree}
</pre>`;


    result.innerHTML =
        `<pre>
Raíces reales encontradas:

${rootsText}

Cantidad de raíces reales detectadas:

${uniqueRoots.length}
</pre>`;


    graphState = {
        minX: -10,
        maxX: 10,
        minY: -10,
        maxY: 10
    };


    if (uniqueRoots.length > 0) {

        const maxRoot =
            Math.max(
                ...uniqueRoots.map(
                    root => Math.abs(root)
                )
            );


        const range =
            Math.max(10, maxRoot + 3);


        graphState.minX = -range;
        graphState.maxX = range;
    }
}


/* =========================================================
   FUNCIÓN RACIONAL
   ========================================================= */

function solveRational() {

    const parts =
        splitTopLevelDivision(
            currentFunctionText
        );


    let denominatorFunction = null;
    let denominatorText = "";


    if (parts) {

        denominatorText =
            parts.denominator;

        try {

            denominatorFunction =
                createFunction(
                    parts.denominator
                );

        } catch (error) {

            denominatorFunction = null;
        }
    }


    const roots =
        findRoots(
            currentFunction,
            -20,
            20,
            0.05
        );


    const uniqueRoots =
        uniqueNumbers(roots, 1e-5);


    let asymptotes = [];


    if (denominatorFunction) {

        asymptotes =
            findRoots(
                denominatorFunction,
                -20,
                20,
                0.05
            );


        asymptotes =
            uniqueNumbers(
                asymptotes,
                1e-4
            );
    }


    const rootsText =
        uniqueRoots.length
            ? uniqueRoots
                .map(
                    (root, index) =>
                        `x${index + 1} = ${formatNumber(root)}`
                )
                .join("\n")
            : "No se encontraron raíces reales.";


    const asymptoteText =
        asymptotes.length
            ? asymptotes
                .map(
                    value =>
                        `x = ${formatNumber(value)}`
                )
                .join("\n")
            : "No se detectaron asíntotas verticales.";


    procedure.innerHTML =
        `<pre>
f(x) = ${escapeHTML(currentFunctionText)}

Tipo:

Función racional

${denominatorText
    ? `Denominador detectado:

${escapeHTML(denominatorText)}

Se buscan los valores donde:

denominador = 0`
    : "No se pudo separar automáticamente un denominador."
}
</pre>`;


    result.innerHTML =
        `<pre>
Raíces:

${rootsText}

Asíntotas verticales:

${asymptoteText}
</pre>`;


    graphState = {
        minX: -10,
        maxX: 10,
        minY: -10,
        maxY: 10
    };
}


/* =========================================================
   FUNCIÓN TRIGONOMÉTRICA
   ========================================================= */

function solveTrigonometric() {

    const roots =
        findRoots(
            currentFunction,
            -2 * Math.PI,
            2 * Math.PI,
            0.01
        );


    const uniqueRoots =
        uniqueNumbers(roots, 1e-5);


    let rootsText;


    if (uniqueRoots.length === 0) {

        rootsText =
            "No se encontraron raíces en el intervalo analizado.";

    }

    else {

        rootsText =
            uniqueRoots
                .map(
                    (root, index) =>
                        `x${index + 1} = ${formatNumber(root)}
   ≈ ${formatNumber(toDegrees(root))}°`
                )
                .join("\n");
    }


    procedure.innerHTML =
        `<pre>
f(x) = ${escapeHTML(currentFunctionText)}

Tipo:

Función trigonométrica

Unidad utilizada:

Radianes

Intervalo:

[-2π, 2π]

Aproximadamente:

[-${formatNumber(2 * Math.PI)},
 ${formatNumber(2 * Math.PI)}]
</pre>`;


    result.innerHTML =
        `<pre>
Raíces:

${rootsText}

El gráfico utiliza radianes en el eje X.
</pre>`;


    graphState = {
        minX: -2 * Math.PI,
        maxX: 2 * Math.PI,
        minY: -5,
        maxY: 5
    };
}


/* =========================================================
   SEPARAR FRACCIÓN
   ========================================================= */

function splitTopLevelDivision(expression) {

    let depth = 0;


    for (let i = 0; i < expression.length; i++) {

        const char = expression[i];


        if (char === "(") {
            depth++;
        }

        else if (char === ")") {
            depth--;
        }

        else if (
            char === "/" &&
            depth === 0
        ) {

            return {
                numerator:
                    expression.slice(0, i),

                denominator:
                    expression.slice(i + 1)
            };
        }
    }


    return null;
}


/* =========================================================
   BÚSQUEDA DE RAÍCES
   ========================================================= */

function findRoots(
    func,
    min,
    max,
    step = 0.05
) {

    const roots = [];


    let previousX = min;
    let previousY;


    try {
        previousY = func(previousX);
    } catch {
        previousY = NaN;
    }


    for (
        let x = min + step;
        x <= max;
        x += step
    ) {

        let y;


        try {
            y = func(x);
        } catch {
            y = NaN;
        }


        /* Punto cercano a cero */

        if (
            Number.isFinite(y) &&
            Math.abs(y) < 1e-7
        ) {

            roots.push(x);
        }


        /* Cambio de signo */

        if (
            Number.isFinite(previousY) &&
            Number.isFinite(y) &&
            previousY * y < 0
        ) {

            const root =
                bisect(
                    func,
                    previousX,
                    x
                );


            if (Number.isFinite(root)) {
                roots.push(root);
            }
        }


        previousX = x;
        previousY = y;
    }


    return roots;
}


/* =========================================================
   BISECCIÓN
   ========================================================= */

function bisect(
    func,
    left,
    right
) {

    let fLeft = func(left);
    let fRight = func(right);


    if (
        !Number.isFinite(fLeft) ||
        !Number.isFinite(fRight)
    ) {
        return NaN;
    }


    if (
        Math.abs(fLeft) < 1e-12
    ) {
        return left;
    }


    if (
        Math.abs(fRight) < 1e-12
    ) {
        return right;
    }


    if (fLeft * fRight > 0) {
        return NaN;
    }


    for (let i = 0; i < 60; i++) {

        const middle =
            (left + right) / 2;

        const fMiddle =
            func(middle);


        if (
            !Number.isFinite(fMiddle)
        ) {
            return NaN;
        }


        if (
            Math.abs(fMiddle) < 1e-10
        ) {
            return middle;
        }


        if (fLeft * fMiddle <= 0) {

            right = middle;
            fRight = fMiddle;

        }

        else {

            left = middle;
            fLeft = fMiddle;
        }
    }


    return (left + right) / 2;
}


/* =========================================================
   ELIMINAR RAÍCES DUPLICADAS
   ========================================================= */

function uniqueNumbers(
    numbers,
    tolerance = 1e-5
) {

    const sorted =
        [...numbers]
            .filter(Number.isFinite)
            .sort((a, b) => a - b);


    const result = [];


    for (const number of sorted) {

        if (
            result.length === 0 ||
            Math.abs(
                number -
                result[result.length - 1]
            ) > tolerance
        ) {

            result.push(number);
        }
    }


    return result;
}


/* =========================================================
   ESTIMAR GRADO DEL POLINOMIO
   ========================================================= */

function estimateDegree(func) {

    const values = [];


    for (let x = -4; x <= 4; x++) {

        const value = func(x);

        if (!Number.isFinite(value)) {
            return "No determinado";
        }

        values.push(value);
    }


    let current = values;


    for (let degree = 0; degree <= 6; degree++) {

        const variation =
            Math.max(...current) -
            Math.min(...current);


        if (variation < 1e-6) {
            return degree;
        }


        const next = [];


        for (
            let i = 0;
            i < current.length - 1;
            i++
        ) {

            next.push(
                current[i + 1] -
                current[i]
            );
        }


        current = next;
    }


    return "Mayor a 6";
}


/* =========================================================
   GRÁFICA - PREPARAR CANVAS
   ========================================================= */

function prepareCanvas() {

    if (!graph) return null;


    const rect =
        graph.getBoundingClientRect();


    const width =
        Math.max(300, rect.width);

    const height =
        Math.max(250, rect.height);


    const dpr =
        window.devicePixelRatio || 1;


    graph.width =
        Math.floor(width * dpr);

    graph.height =
        Math.floor(height * dpr);


    const ctx =
        graph.getContext("2d");


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    return {
        ctx,
        width,
        height
    };
}


/* =========================================================
   MAPEO DE COORDENADAS
   ========================================================= */

function mapX(
    x,
    width
) {

    return (
        (x - graphState.minX) /
        (graphState.maxX - graphState.minX)
    ) * width;
}


function mapY(
    y,
    height
) {

    return (
        1 -
        (y - graphState.minY) /
        (graphState.maxY - graphState.minY)
    ) * height;
}


/* =========================================================
   GRÁFICA PRINCIPAL
   ========================================================= */

function drawGraph() {

    if (!graph) return;


    const prepared =
        prepareCanvas();


    if (!prepared) return;


    const {
        ctx,
        width,
        height
    } = prepared;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const styles =
        getComputedStyle(
            document.body
        );


    const gridColor =
        styles.getPropertyValue(
            "--grid"
        ).trim() ||
        "rgba(255,255,255,0.08)";


    const textColor =
        styles.getPropertyValue(
            "--muted"
        ).trim() ||
        "#888";


    const accentColor =
        styles.getPropertyValue(
            "--accent"
        ).trim() ||
        "#ff3030";


    const goldColor =
        styles.getPropertyValue(
            "--gold"
        ).trim() ||
        "#ffd700";


    /* Fondo */

    ctx.fillStyle =
        styles.getPropertyValue(
            "--panel"
        ).trim() ||
        "#111";


    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    /* Cuadrícula */

    drawGrid(
        ctx,
        width,
        height,
        gridColor
    );


    /* Ejes */

    drawAxes(
        ctx,
        width,
        height,
        textColor
    );


    /* Función */

    if (currentFunction) {

        drawFunction(
            ctx,
            width,
            height,
            accentColor
        );


        /* Asíntotas */

        if (
            currentType === "rational"
        ) {

            drawRationalAsymptotes(
                ctx,
                width,
                height,
                goldColor
            );
        }
    }


    /* Texto cuando no hay función */

    if (!currentFunction) {

        ctx.fillStyle = textColor;
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            "Ingresa una función para comenzar",
            width / 2,
            height / 2
        );
    }
}


/* =========================================================
   CUADRÍCULA
   ========================================================= */

function drawGrid(
    ctx,
    width,
    height,
    color
) {

    ctx.save();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;


    const xStep =
        calculateGridStep(
            graphState.maxX -
            graphState.minX
        );


    const yStep =
        calculateGridStep(
            graphState.maxY -
            graphState.minY
        );


    let startX =
        Math.ceil(
            graphState.minX / xStep
        ) * xStep;


    for (
        let x = startX;
        x <= graphState.maxX;
        x += xStep
    ) {

        const px =
            mapX(x, width);


        ctx.beginPath();

        ctx.moveTo(
            px,
            0
        );

        ctx.lineTo(
            px,
            height
        );

        ctx.stroke();
    }


    let startY =
        Math.ceil(
            graphState.minY / yStep
        ) * yStep;


    for (
        let y = startY;
        y <= graphState.maxY;
        y += yStep
    ) {

        const py =
            mapY(y, height);


        ctx.beginPath();

        ctx.moveTo(
            0,
            py
        );

        ctx.lineTo(
            width,
            py
        );

        ctx.stroke();
    }


    ctx.restore();
}


/* =========================================================
   EJES
   ========================================================= */

function drawAxes(
    ctx,
    width,
    height,
    color
) {

    ctx.save();

    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    ctx.lineWidth = 1.5;


    /* Eje X */

    if (
        graphState.minY <= 0 &&
        graphState.maxY >= 0
    ) {

        const y =
            mapY(0, height);


        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            width,
            y
        );

        ctx.stroke();
    }


    /* Eje Y */

    if (
        graphState.minX <= 0 &&
        graphState.maxX >= 0
    ) {

        const x =
            mapX(0, width);


        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            height
        );

        ctx.stroke();
    }


    /* Etiquetas */

    ctx.font = "11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";


    const stepX =
        calculateGridStep(
            graphState.maxX -
            graphState.minX
        );


    if (
        graphState.minY <= 0 &&
        graphState.maxY >= 0
    ) {

        const y =
            mapY(0, height);


        for (
            let x = Math.ceil(graphState.minX / stepX) * stepX;
            x <= graphState.maxX;
            x += stepX
        ) {

            if (Math.abs(x) < 1e-10) {
                continue;
            }


            const px =
                mapX(x, width);


            ctx.fillText(
                formatAxisNumber(x),
                px,
                y + 5
            );
        }
    }


    ctx.restore();
}


/* =========================================================
   DIBUJAR FUNCIÓN
   ========================================================= */

function drawFunction(
    ctx,
    width,
    height,
    color
) {

    const samples =
        Math.max(
            700,
            Math.floor(width * 2)
        );


    const step =
        (
            graphState.maxX -
            graphState.minX
        ) / samples;


    ctx.save();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    ctx.shadowBlur =
        document.body.classList.contains(
            "no-neon"
        )
            ? 0
            : 10;

    ctx.shadowColor = color;


    let previous = null;


    for (let i = 0; i <= samples; i++) {

        const x =
            graphState.minX +
            i * step;


        let y;

        try {
            y = currentFunction(x);
        } catch {
            y = NaN;
        }


        if (!Number.isFinite(y)) {

            previous = null;
            continue;
        }


        const px =
            mapX(x, width);

        const py =
            mapY(y, height);


        if (
            py < -height * 5 ||
            py > height * 6
        ) {

            previous = null;
            continue;
        }


        if (
            previous &&
            Math.abs(py - previous.py) >
                height * 1.5
        ) {

            previous = null;
        }


        if (!previous) {

            ctx.beginPath();

            ctx.moveTo(
                px,
                py
            );

        }

        else {

            ctx.lineTo(
                px,
                py
            );
        }


        previous = {
            px,
            py
        };


        if (
            i === samples
        ) {
            ctx.stroke();
        }
    }


    ctx.stroke();

    ctx.restore();
}


/* =========================================================
   ASÍNTOTAS RACIONALES
   ========================================================= */

function drawRationalAsymptotes(
    ctx,
    width,
    height,
    color
) {

    const parts =
        splitTopLevelDivision(
            currentFunctionText
        );


    if (!parts) return;


    let denominator;


    try {

        denominator =
            createFunction(
                parts.denominator
            );

    } catch {
        return;
    }


    const asymptotes =
        uniqueNumbers(
            findRoots(
                denominator,
                graphState.minX,
                graphState.maxX,
                0.03
            ),
            1e-4
        );


    ctx.save();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    ctx.setLineDash([
        7,
        6
    ]);


    asymptotes.forEach(x => {

        if (
            x < graphState.minX ||
            x > graphState.maxX
        ) {
            return;
        }


        const px =
            mapX(x, width);


        ctx.beginPath();

        ctx.moveTo(
            px,
            0
        );

        ctx.lineTo(
            px,
            height
        );

        ctx.stroke();
    });


    ctx.restore();
}


/* =========================================================
   GRID STEP
   ========================================================= */

function calculateGridStep(range) {

    if (range <= 10) return 1;
    if (range <= 20) return 2;
    if (range <= 50) return 5;
    if (range <= 100) return 10;
    if (range <= 200) return 20;
    if (range <= 500) return 50;

    return Math.pow(
        10,
        Math.floor(Math.log10(range / 10))
    );
}


/* =========================================================
   PLACEHOLDER
   ========================================================= */

function updatePlaceholder() {

    currentFunction = null;
    currentFunctionText = "";

    if (procedure) {

        procedure.innerHTML =
            `<pre>
Selecciona un tipo de función e ingresa
una expresión matemática.

Ejemplos:

Lineal:
2x + 3

Cuadrática:
x² - 5x + 6

Polinomial:
x³ - 2x² - x + 2

Racional:
(x + 1) / (x - 2)

Trigonométrica:
sin(x)
</pre>`;
    }


    if (result) {

        result.innerHTML =
            `<pre>
Aquí aparecerán las soluciones,
raíces y resultados matemáticos.
</pre>`;
    }


    graphState = {
        minX: -10,
        maxX: 10,
        minY: -10,
        maxY: 10
    };


    drawGraph();
}


/* =========================================================
   ERROR
   ========================================================= */

function showError(message) {

    if (procedure) {

        procedure.innerHTML =
            `<pre>
No se pudo resolver la función.

${escapeHTML(message)}
</pre>`;
    }


    if (result) {

        result.innerHTML =
            `<pre>
Revisa la expresión e inténtalo nuevamente.
</pre>`;
    }


    currentFunction = null;


    graphState = {
        minX: -10,
        maxX: 10,
        minY: -10,
        maxY: 10
    };


    drawGraph();
}


/* =========================================================
   UTILIDADES
   ========================================================= */

function formatNumber(value) {

    if (!Number.isFinite(value)) {
        return "No definido";
    }


    if (Math.abs(value) < 1e-10) {
        value = 0;
    }


    return Number(
        value.toFixed(8)
    ).toString();
}


function formatAxisNumber(value) {

    if (Math.abs(value) < 1e-10) {
        return "0";
    }


    return Number(
        value.toFixed(3)
    ).toString();
}


function toDegrees(radians) {

    return radians *
        180 /
        Math.PI;
}


function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   CAMBIO DE TIPO
   ========================================================= */

if (typeSelect) {

    typeSelect.addEventListener(
        "change",
        () => {

            currentType =
                typeSelect.value;

            updatePlaceholder();
        }
    );
}


/* =========================================================
   ENTER PARA RESOLVER
   ========================================================= */

if (functionInput) {

    functionInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                solve();
            }
        }
    );
}


/* =========================================================
   REDIBUJAR AL CAMBIAR TAMAÑO
   ========================================================= */

window.addEventListener(
    "resize",
    () => {

        drawGraph();
    }
);


/* =========================================================
   ESCAPE PARA CERRAR CONFIGURACIÓN
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            settingsOverlay &&
            settingsOverlay.classList.contains("open")
        ) {

            closeSettings();
        }
    }
);


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadSettings();

        updatePlaceholder();

        startLoading();
    }
);