/* ==========================================================
   MathGraph Studio
   Aplicación principal
   Cinco módulos: calculadora, graficador, solucionador,
   fórmulas y juegos matemáticos.
   Compatible con MathEngine.compile() -> objeto con .at(x)
   ========================================================== */

(function () {
  'use strict';

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const M = window.MathEngine;
  const C = window.Calculator;
  const G = window.Graph;
  const S = window.Solver;
  const F = window.Formulas;
  const GM = window.Games;

  const $id = id => document.getElementById(id);

  const state = {
    calcType: 'linear',
    formulaCategory: 'all',
    gameLevel: 1,
    gameMode: 'mixed',
    currentProblem: null,
    gameLocked: false,
    correct: 0,
    wrong: 0,
    streak: 0,
    xp: 0
  };

  let calcGraph = null;
  let universalGraph = null;

  /* =========================
     UTILIDADES GENERALES
     ========================= */

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function number(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function fmt(value, decimals = 4) {
    if (!Number.isFinite(value)) return '—';

    const result = Number(value.toFixed(decimals));

    return Object.is(result, -0) ? '0' : String(result);
  }

  /*
   * El motor matemático devuelve un objeto CompiledExpr.
   * Para evaluarlo se utiliza compiled.at(x), no compiled(x).
   */
  function compile(expression) {
    if (!M || typeof M.compile !== 'function') {
      throw new Error('El motor matemático no está disponible.');
    }

    const compiled = M.compile(String(expression));

    if (!compiled || typeof compiled.at !== 'function') {
      throw new Error('No se pudo compilar la expresión matemática.');
    }

    return compiled;
  }

  /*
   * Adaptador para Graph.addCurve(), que espera una función
   * normal: x => y.
   */
  function asGraphFunction(compiled) {
    return x => {
      try {
        return compiled.at(x);
      } catch (error) {
        return NaN;
      }
    };
  }

  function toast(message) {
    const element = $id('toast');
    if (!element) return;

    element.textContent = message;
    element.classList.add('show');

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
      element.classList.remove('show');
    }, 2600);
  }

  function showError(element, message) {
    if (!element) return;

    element.textContent = message;
    element.classList.toggle('visible', Boolean(message));
  }

  function clearError(element) {
    showError(element, '');
  }

  function safeRun(callback, errorElement, prefix = 'Error') {
    try {
      clearError(errorElement);
      return callback();
    } catch (error) {
      console.error(prefix + ':', error);

      showError(
        errorElement,
        error && error.message
          ? error.message
          : 'Ocurrió un error inesperado.'
      );

      return null;
    }
  }

  function setText(id, value) {
    const element = $id(id);
    if (element) element.textContent = String(value ?? '');
  }

  function setHTML(id, value) {
    const element = $id(id);
    if (element) element.innerHTML = value;
  }

  /* =========================
     CAMBIO DE TEMA
     ========================= */

  const themeToggle = $id('themeToggle');

  function updateThemeButton() {
    if (!themeToggle) return;

    const dark =
      document.documentElement.getAttribute('data-theme') !== 'light';

    themeToggle.setAttribute(
      'aria-label',
      dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
    );

    themeToggle.title =
      dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const root = document.documentElement;
      const current = root.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';

      root.setAttribute('data-theme', next);
      updateThemeButton();

      if (calcGraph) calcGraph.draw();
      if (universalGraph) universalGraph.draw();

      toast(next === 'light'
        ? 'Tema claro activado'
        : 'Tema oscuro activado');
    });
  }

  updateThemeButton();

  /* =========================
     NAVEGACIÓN
     ========================= */

  const validViews = new Set([
    'calc',
    'graphing',
    'solver',
    'formulas',
    'games'
  ]);

  function activateView(name) {
    if (!validViews.has(name)) return;

    $$('.view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${name}`);
    });

    $$('.tab-btn').forEach(button => {
      button.classList.toggle(
        'active',
        button.dataset.view === name
      );
    });

    requestAnimationFrame(() => {
      if (name === 'calc' && calcGraph) calcGraph.resize();
      if (name === 'graphing' && universalGraph) universalGraph.resize();
    });

    if (name === 'formulas') renderFormulas();
  }

  $$('.tab-btn[data-view]').forEach(button => {
    button.addEventListener('click', () => {
      activateView(button.dataset.view);
    });
  });

  /* =========================
     GRÁFICAS
     ========================= */

  function createGraph(canvasId) {
    const canvas = $id(canvasId);

    if (!canvas || typeof G !== 'function') {
      console.warn(`No se pudo crear la gráfica: ${canvasId}`);
      return null;
    }

    try {
      return new G(canvas);
    } catch (error) {
      console.error(`Error al iniciar ${canvasId}:`, error);
      return null;
    }
  }

  calcGraph = createGraph('calcCanvas');
  universalGraph = createGraph('universalCanvas');

  function bindGraphControls(graph, controls) {
    if (!graph) return;

    const zoomIn = $id(controls.zoomIn);
    const zoomOut = $id(controls.zoomOut);
    const reset = $id(controls.reset);

    if (zoomIn) {
      zoomIn.addEventListener('click', () => {
        graph.scale = Math.min(500, graph.scale * 1.25);
        graph.draw();
      });
    }

    if (zoomOut) {
      zoomOut.addEventListener('click', () => {
        graph.scale = Math.max(4, graph.scale / 1.25);
        graph.draw();
      });
    }

    if (reset) {
      reset.addEventListener('click', () => graph.reset());
    }
  }

  bindGraphControls(calcGraph, {
    zoomIn: 'calcZoomIn',
    zoomOut: 'calcZoomOut',
    reset: 'calcReset'
  });

  bindGraphControls(universalGraph, {
    zoomIn: 'univZoomIn',
    zoomOut: 'univZoomOut',
    reset: 'univReset'
  });

  if (calcGraph) {
    calcGraph.onPointer = point => {
      setText(
        'graphReadout',
        `x: ${fmt(point.x, 2)} · y: ${fmt(point.y, 2)}`
      );
    };
  }

  /* =========================
     CALCULADORA
     ========================= */

  const calcError = $id('calcError');

  function selectCalcType(type) {
    const validTypes = [
      'linear',
      'quadratic',
      'polynomial',
      'rational',
      'trig'
    ];

    if (!validTypes.includes(type)) return;

    state.calcType = type;

    $$('.type-chip[data-type]').forEach(button => {
      button.classList.toggle(
        'active',
        button.dataset.type === type
      );
    });

    $$('.type-panel').forEach(panel => {
      panel.classList.toggle(
        'hidden',
        panel.id !== `inputs-${type}`
      );
    });
  }

  $$('.type-chip[data-type]').forEach(button => {
    button.addEventListener('click', () => {
      selectCalcType(button.dataset.type);
    });
  });

  function renderResults(items) {
    const container = $id('resultsList');
    if (!container) return;

    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="result-item">
        <span>${escapeHTML(item.label ?? 'Resultado')}</span>
        <b>${escapeHTML(item.value ?? '—')}</b>
      </div>
    `).join('');
  }

  function analyzeCalculation() {
    return safeRun(() => {
      if (!C || !calcGraph) {
        throw new Error('La calculadora o su gráfica no están disponibles.');
      }

      const xValue = number($id('eval-x')?.value, NaN);

      if (!Number.isFinite(xValue)) {
        throw new Error('Introduce un valor numérico válido para x.');
      }

      let compiled = null;
      let graphFunction = null;
      let analysis;
      let expression = '';

      switch (state.calcType) {
        case 'linear': {
          expression = $id('lin-expr')?.value.trim() || '';

          if (!expression) {
            throw new Error('Escribe una función lineal.');
          }

          compiled = compile(expression);
          graphFunction = asGraphFunction(compiled);
          analysis = C.analyzeLinear(compiled);
          break;
        }

        case 'quadratic': {
          expression = $id('quad-expr')?.value.trim() || '';

          if (!expression) {
            throw new Error('Escribe una función cuadrática.');
          }

          compiled = compile(expression);
          graphFunction = asGraphFunction(compiled);
          analysis = C.analyzeQuadratic(compiled);
          break;
        }

        case 'polynomial': {
          expression = $id('poly-expr')?.value.trim() || '';

          if (!expression) {
            throw new Error('Escribe una función polinomial.');
          }

          compiled = compile(expression);
          graphFunction = asGraphFunction(compiled);
          analysis = C.analyzePolynomial(compiled);
          break;
        }

        case 'rational': {
          const numerator = $id('rat-num')?.value.trim() || '';
          const denominator = $id('rat-den')?.value.trim() || '';

          if (!numerator || !denominator) {
            throw new Error('Escribe el numerador y el denominador.');
          }

          const pFn = compile(numerator);
          const qFn = compile(denominator);

          graphFunction = x => {
            const denominatorValue = qFn.at(x);

            if (
              !Number.isFinite(denominatorValue) ||
              Math.abs(denominatorValue) < 1e-12
            ) {
              return NaN;
            }

            return pFn.at(x) / denominatorValue;
          };

          analysis = C.analyzeRational(pFn, qFn);
          expression = `(${numerator}) / (${denominator})`;
          break;
        }

        case 'trig': {
          const kind = $id('trig-kind')?.value || 'sin';

          const A = number($id('trig-a')?.value, NaN);
          const B = number($id('trig-b')?.value, NaN);
          const Cvalue = number($id('trig-c')?.value, NaN);
          const D = number($id('trig-d')?.value, NaN);

          if (![A, B, Cvalue, D].every(Number.isFinite)) {
            throw new Error(
              'Los parámetros trigonométricos deben ser números.'
            );
          }

          if (B === 0) {
            throw new Error('El parámetro B no puede ser cero.');
          }

          analysis = C.analyzeTrig(kind, A, B, Cvalue, D);

          if (!analysis || !analysis.fn) {
            throw new Error(
              'No se pudo construir la función trigonométrica.'
            );
          }

          /*
           * El analizador trigonométrico puede devolver una función
           * normal o un objeto compilado. Admitimos ambos formatos.
           */
          if (typeof analysis.fn.at === 'function') {
            compiled = analysis.fn;
            graphFunction = asGraphFunction(compiled);
          } else if (typeof analysis.fn === 'function') {
            graphFunction = analysis.fn;
          } else {
            throw new Error(
              'El analizador trigonométrico devolvió una función incompatible.'
            );
          }

          expression = analysis.exprStr || `${kind}(x)`;
          break;
        }

        default:
          throw new Error('Selecciona un tipo de función válido.');
      }

      if (!analysis || typeof graphFunction !== 'function') {
        throw new Error('No se pudo construir la función.');
      }

      const evaluated = graphFunction(xValue);

      if (Number.isFinite(evaluated)) {
        analysis.items.push({
          label: `f(${fmt(xValue)})`,
          value: fmt(evaluated)
        });
      } else {
        analysis.items.push({
          label: `f(${fmt(xValue)})`,
          value: 'No definida en este punto'
        });
      }

      calcGraph.clearCurves();
      calcGraph.clearPoints();
      calcGraph.asymptotes = [];

      calcGraph.addCurve(graphFunction);

      if (Array.isArray(analysis.roots)) {
        analysis.roots.forEach(root => {
          if (Number.isFinite(root)) {
            calcGraph.addPoint(
              root,
              0,
              '#ff2fba',
              4,
              `x=${fmt(root)}`
            );
          }
        });
      }

      if (analysis.vertex) {
        calcGraph.addPoint(
          analysis.vertex.x,
          analysis.vertex.y,
          '#8a5cff',
          5,
          'Vértice'
        );
      }

      if (Array.isArray(analysis.asymptotes)) {
        calcGraph.asymptotes =
          analysis.asymptotes.filter(Number.isFinite);
      }

      renderResults(analysis.items);
      calcGraph.draw();

      toast('Función analizada correctamente');

      return analysis;
    }, calcError, 'Calculadora');
  }

  const analyzeButton = $id('btnAnalyze');

  if (analyzeButton) {
    analyzeButton.addEventListener('click', analyzeCalculation);
  }

  [
    'lin-expr',
    'quad-expr',
    'poly-expr',
    'rat-num',
    'rat-den',
    'trig-a',
    'trig-b',
    'trig-c',
    'trig-d',
    'eval-x'
  ].forEach(id => {
    const input = $id(id);

    if (input) {
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') analyzeCalculation();
      });
    }
  });

  /* =========================
     GRAFICADOR UNIVERSAL
     ========================= */

  function normalizeEquation(expression) {
    let text = String(expression || '').trim();

    if (M && typeof M.normalize === 'function') {
      text = M.normalize(text);
    }

    return text
      .replace(/θ/g, 'theta')
      .replace(/π/g, 'pi')
      .replace(/[−–—]/g, '-')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/⁴/g, '^4')
      .replace(/·/g, '*')
      .replace(/×/g, '*')
      .replace(/÷/g, '/');
  }

  function evaluateParameter(text, fallback) {
    const source = String(text ?? '').trim();

    if (!source) return fallback;

    const compiled = compile(source);
    const value = compiled.at(0);

    if (!Number.isFinite(value)) {
      throw new Error(`No se pudo interpretar el límite: ${source}`);
    }

    return value;
  }


function parseUniversal() {
  return safeRun(() => {
    if (!universalGraph) {
      throw new Error('La gráfica universal no está disponible.');
    }

    const raw = $id('universalExpr')?.value.trim() || '';

    if (!raw) {
      throw new Error('Escribe una función o ecuación para graficar.');
    }

    const expression = normalizeEquation(raw);
    const requestedMode = $id('graphMode')?.value || 'auto';

    let mode = requestedMode;

    // Detectar automáticamente el tipo de expresión.
    if (mode === 'auto') {
      if (/^\s*x\s*=/.test(expression) && /,\s*y\s*=/.test(expression)) {
        mode = 'parametric';
      } else if (/^\s*r\s*\^?\s*2\s*=/.test(expression) || /^\s*r\s*=/.test(expression)) {
        mode = 'polar';
      } else {
        mode = 'cartesian';
      }
    }

    if (!['cartesian', 'polar', 'parametric'].includes(mode)) {
      throw new Error('Selecciona un modo de gráfica válido.');
    }

    // Leer y validar los límites.
    let min = evaluateParameter($id('graphMin')?.value, -10);
    let max = evaluateParameter($id('graphMax')?.value, 10);

    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
      if (mode === 'polar' || mode === 'parametric') {
        min = 0;
        max = 2 * Math.PI;
      } else {
        min = -10;
        max = 10;
      }
    }

    const minInput = $id('graphMin');
    const maxInput = $id('graphMax');

    if (minInput) minInput.value = String(min);
    if (maxInput) maxInput.value = String(max);

    const quality = Math.max(
      300,
      Math.min(3000, number($id('graphQuality')?.value, 1200))
    );

// Limpiar la gráfica anterior.
universalGraph.clearCurves();
universalGraph.clearParametrics();
universalGraph.clearPoints();

if (typeof universalGraph.clearImplicit === 'function') {
  universalGraph.clearImplicit();
}

universalGraph.asymptotes = [];

    // -----------------------------------------
    // MODO CARTESIANO
    // -----------------------------------------
    if (mode === 'cartesian') {
      let source = expression;
      let equationLabel = '';
      let findEquationRoots = false;

      // Función explícita: y = f(x).
      const yEquation = source.match(/^\s*y\s*=\s*(.+)\s*$/);

      if (yEquation) {
        source = yEquation[1].trim();
      } else {
        const equalIndex = source.indexOf('=');

        // Ecuación general de una variable: izquierda = derecha.
        if (equalIndex !== -1) {
          if (source.indexOf('=', equalIndex + 1) !== -1) {
            throw new Error('Utiliza una sola igualdad.');
          }

          const left = source.slice(0, equalIndex).trim();
          const right = source.slice(equalIndex + 1).trim();

          if (!left || !right) {
            throw new Error('Completa ambos lados de la ecuación.');
          }

// Detectar ecuaciones implícitas que contienen la variable y.
if (/\by\b/i.test(left) || /\by\b/i.test(right)) {
  const compiledLeft = compile(left);
  const compiledRight = compile(right);

  if (
    typeof universalGraph.addImplicit !== 'function' ||
    typeof compiledLeft.evaluate !== 'function' ||
    typeof compiledRight.evaluate !== 'function'
  ) {
    throw new Error(
      'El motor de gráficas implícitas no está disponible. Revisa graph.js y parser.js.'
    );
  }

  universalGraph.addImplicit(
    (x, y) => {
      try {
        return (
          compiledLeft.evaluate({ x, y }) -
          compiledRight.evaluate({ x, y })
        );
      } catch (error) {
        return NaN;
      }
    },
    '#5dd8ff',
    2.7
  );

setText('universalInfo', `Ecuación implícita: ${left} = ${right}`);
setText('qualityValue', quality);
setText('universalMode', mode.toUpperCase());

universalGraph.draw();

toast('Gráfica actualizada');
return true;

}

source = `((${left})-(${right}))`;
equationLabel = `${left} = ${right}`;
findEquationRoots = true;
        }
      }

      if (!source || source.includes('=')) {
        throw new Error(
          'Escribe una función como y=sin(x) o una ecuación como x^2-4=0.'
        );
      }

      const compiled = compile(source);
      const graphFunction = asGraphFunction(compiled);

      if (findEquationRoots) {
        if (!M || typeof M.findRoots !== 'function') {
          throw new Error('El buscador de raíces no está disponible.');
        }

        // Las ecuaciones se muestran como raíces sobre el eje X,
        // no como una curva adicional.
const roots = M.findRoots(
  x => compiled.at(x),
  min,
  max,
  quality
).filter(Number.isFinite);

        roots.forEach(root => {
          universalGraph.addPoint(
            root,
            0,
            '#ff2fba',
            5,
            `x=${fmt(root, 4)}`
          );
        });

        setText(
          'universalInfo',
          roots.length
            ? `${equationLabel} · Raíces encontradas: ${roots.map(root => fmt(root, 4)).join(', ')}`
            : `${equationLabel} · No se encontraron raíces en el intervalo.`
        );
      } else {
        // Comprobar que la expresión puede evaluarse al menos
        // en algún punto del intervalo antes de dibujarla.
        let validSamples = 0;
        const sampleCount = 20;

        for (let i = 0; i <= sampleCount; i++) {
          const x = min + (max - min) * i / sampleCount;
          const y = graphFunction(x);

          if (Number.isFinite(y)) validSamples++;
        }

        if (validSamples === 0) {
          throw new Error(
            'La función no produjo valores válidos en el intervalo seleccionado.'
          );
        }

        universalGraph.addCurve(graphFunction);

        setText('universalInfo', `y = ${source}`);
      }
    }

    // -----------------------------------------
    // MODO POLAR
    // -----------------------------------------
    else if (mode === 'polar') {
      const squared = expression.match(/^\s*r\s*\^?\s*2\s*=\s*(.+)\s*$/);
      const ordinary = expression.match(/^\s*r\s*=\s*(.+)\s*$/);

      let radialSource;
      let isSquared = false;

      if (squared) {
        radialSource = squared[1].trim();
        isSquared = true;
      } else if (ordinary) {
        radialSource = ordinary[1].trim();
      } else {
        throw new Error(
          'En modo polar, escribe r=expresión o r^2=expresión.'
        );
      }

      if (!radialSource || radialSource.includes('=')) {
        throw new Error('La expresión polar no es válida.');
      }

      const radialFn = compile(radialSource);

      function radius(theta, sign = 1) {
        const value = radialFn.evaluate({ theta, t: theta });

        if (!Number.isFinite(value)) return NaN;

        if (isSquared) {
          if (value < 0) return NaN;
          return sign * Math.sqrt(value);
        }

        return value;
      }

      universalGraph.addParametric(
        theta => radius(theta) * Math.cos(theta),
        theta => radius(theta) * Math.sin(theta),
        min,
        max,
        '#8a5cff',
        2.7
      );

      if (isSquared) {
        universalGraph.addParametric(
          theta => radius(theta, -1) * Math.cos(theta),
          theta => radius(theta, -1) * Math.sin(theta),
          min,
          max,
          '#ff2fba',
          2.3
        );
      }

      setText('universalInfo', `${isSquared ? 'r²' : 'r'} = ${radialSource}`);
    }

    // -----------------------------------------
    // MODO PARAMÉTRICO
    // -----------------------------------------
    else if (mode === 'parametric') {
      const match = expression.match(
        /^\s*x\s*=\s*(.+?)\s*,\s*y\s*=\s*(.+?)\s*$/
      );

      if (!match) {
        throw new Error(
          'Formato incorrecto. Ejemplo: x=3cos(t), y=2sin(t).'
        );
      }

      const xSource = match[1].trim();
      const ySource = match[2].trim();

      if (!xSource || !ySource || xSource.includes('=') || ySource.includes('=')) {
        throw new Error('Comprueba las expresiones de x(t) e y(t).');
      }

      const xFn = compile(xSource);
      const yFn = compile(ySource);

      universalGraph.addParametric(
        t => xFn.evaluate({ t }),
        t => yFn.evaluate({ t }),
        min,
        max,
        '#8a5cff',
        2.7
      );

      setText('universalInfo', `x(t) = ${xSource} · y(t) = ${ySource}`);
    }

    setText('qualityValue', quality);
    setText('universalMode', mode.toUpperCase());

    universalGraph.draw();

    toast('Gráfica actualizada');
    return true;
  }, null, 'Graficador universal');
}


/* =========================================
AYUDA DEL GRAFICADOR UNIVERSAL
========================================= */
const graphHelpToggle = document.getElementById('graphHelpToggle');
const graphHelpCard = document.getElementById('graphHelpCard');
const graphHelpClose = document.getElementById('graphHelpClose');

if (graphHelpToggle && graphHelpCard && graphHelpClose) {
const setGraphHelpVisibility = (visible) => {
graphHelpCard.hidden = !visible;
graphHelpToggle.setAttribute('aria-expanded', String(visible));
};


graphHelpToggle.addEventListener('click', () => {
    setGraphHelpVisibility(graphHelpCard.hidden);
});

graphHelpClose.addEventListener('click', () => {
    setGraphHelpVisibility(false);
    graphHelpToggle.focus();
});

// La guía empieza cerrada para no interrumpir al usuario.
setGraphHelpVisibility(false);


}


  const plotButton = $id('universalPlot');

  if (plotButton) {
    plotButton.addEventListener('click', parseUniversal);
  }

  const clearUniversalButton = $id('universalClear');

if (clearUniversalButton) {
  clearUniversalButton.addEventListener('click', () => {
    if (!universalGraph) return;

    universalGraph.clearCurves();
    universalGraph.clearParametrics();
    universalGraph.clearPoints();

    if (typeof universalGraph.clearImplicit === 'function') {
      universalGraph.clearImplicit();
    }

    universalGraph.asymptotes = [];
    universalGraph.draw();

    setText('universalInfo', 'Gráfica limpiada.');
    toast('Lienzo limpiado');
  });
}

  $$('.mini-chip[data-expr]').forEach(button => {
    button.addEventListener('click', () => {
      const input = $id('universalExpr');
      if (!input) return;

      input.value = button.dataset.expr || '';
      parseUniversal();
    });
  });

  const graphModeSelect = $id('graphMode');

  if (graphModeSelect) {
    graphModeSelect.addEventListener('change', () => {
      setText('universalMode', graphModeSelect.value.toUpperCase());
    });
  }

  const graphQuality = $id('graphQuality');

  if (graphQuality) {
    graphQuality.addEventListener('input', () => {
      setText('qualityValue', graphQuality.value);
    });
  }

  /* =========================
     SOLUCIONADOR PASO A PASO
     ========================= */

  function normalizeSolverResult(result) {
    if (typeof result === 'string') {
      return {
        title: 'Solución',
        steps: [result]
      };
    }

    if (Array.isArray(result)) {
      return {
        title: 'Solución paso a paso',
        steps: result
      };
    }

    if (result && typeof result === 'object') {
      const steps =
        result.steps ??
        result.pasos ??
        result.items ??
        result.explanation ??
        result.solutions ??
        [];

      return {
        title: result.title ?? result.titulo ?? result.name ?? 'Solución',
        steps: Array.isArray(steps) ? steps : [steps],
        message: result.message ?? result.mensaje ?? ''
      };
    }

    return {
      title: 'Resultado',
      steps: ['El solucionador no devolvió pasos que se puedan mostrar.']
    };
  }

  function renderSolverSteps(result) {
    const container = $id('solverSteps');
    if (!container) return;

    const normalized = normalizeSolverResult(result);

    setText('solverTitle', normalized.title);

    const steps = normalized.steps.filter(
      step => step !== null && step !== undefined && step !== ''
    );

    if (!steps.length) {
      container.innerHTML = `
        <div class="empty-state">
          <b>No hay pasos disponibles</b>
          <small>Prueba con otra expresión.</small>
        </div>
      `;
      return;
    }

    container.innerHTML = steps.map((step, index) => {
      let content;

      if (typeof step === 'object') {
        const label = step.title ?? step.label ?? step.name ?? '';
        const description =
          step.description ??
          step.text ??
          step.content ??
          step.value ??
          JSON.stringify(step);

        content = `
          ${label ? `<b>${escapeHTML(label)}</b>` : ''}
          <div>${escapeHTML(description)}</div>
        `;
      } else {
        content = escapeHTML(step);
      }

      return `
        <div class="step-item">
          <span class="step-number">${index + 1}</span>
          <div class="step-content">${content}</div>
        </div>
      `;
    }).join('');

    if (normalized.message) {
      container.insertAdjacentHTML(
        'beforeend',
        `<div class="solver-result">${escapeHTML(normalized.message)}</div>`
      );
    }
  }

  function runSolver() {
    return safeRun(() => {
      if (!S || typeof S.solve !== 'function') {
        throw new Error('El solucionador no está disponible.');
      }

      const input = $id('solverInput')?.value.trim() || '';

      if (!input) {
        throw new Error('Escribe una operación o ecuación.');
      }

      const result = S.solve(input);

      renderSolverSteps(result);

      return result;
    }, $id('solverError'), 'Solucionador');
  }

  const solverRunButton = $id('solverRun');

  if (solverRunButton) {
    solverRunButton.addEventListener('click', runSolver);
  }

  $$('.mini-chip[data-solve]').forEach(button => {
    button.addEventListener('click', () => {
      const input = $id('solverInput');
      if (!input) return;

      input.value = button.dataset.solve || '';
      runSolver();
    });
  });

  const solverInput = $id('solverInput');

  if (solverInput) {
    solverInput.addEventListener('keydown', event => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        runSolver();
      }
    });
  }

  /* =========================
     BIBLIOTECA DE FÓRMULAS
     ========================= */

  function getFormulaList() {
    if (!F) return [];

    const list = F.formulas ?? F.list ?? F.items ?? [];

    return Array.isArray(list) ? list : [];
  }

  function formulaValue(formula, keys, fallback = '') {
    for (const key of keys) {
      if (
        formula &&
        formula[key] !== undefined &&
        formula[key] !== null
      ) {
        return formula[key];
      }
    }

    return fallback;
  }

  function renderFormulas() {
    const container = $id('formulaGrid');
    if (!container) return;

    const query = ($id('formulaSearch')?.value || '')
      .trim()
      .toLowerCase();

    const formulas = getFormulaList().filter(formula => {
      const category = String(
        formulaValue(formula, ['category', 'categoria', 'cat'], 'algebra')
      ).toLowerCase();

      const title = String(
        formulaValue(formula, ['name', 'nombre', 'title', 'titulo'], '')
      );

      const expression = String(
        formulaValue(
          formula,
          ['formula', 'expression', 'expresion', 'equation'],
          ''
        )
      );

      const description = String(
  formulaValue(
    formula,
    ['description', 'descripcion', 'desc', 'detail', 'note', 'nota'],
    ''
  )
);

      const matchesCategory =
        state.formulaCategory === 'all' ||
        category === state.formulaCategory;

      const searchable =
        `${title} ${expression} ${description} ${category}`.toLowerCase();

      return matchesCategory && searchable.includes(query);
    });

    if (!formulas.length) {
      container.innerHTML = `
        <div class="empty-state">
          <b>No se encontraron fórmulas</b>
          <small>Prueba con otra búsqueda o categoría.</small>
        </div>
      `;
      return;
    }

    container.innerHTML = formulas.map(formula => {
      const title = formulaValue(
        formula,
        ['name', 'nombre', 'title', 'titulo'],
        'Fórmula'
      );

      const expression = formulaValue(
        formula,
        ['formula', 'expression', 'expresion', 'equation'],
        ''
      );

      const description = formulaValue(
        formula,
        ['description', 'descripcion', 'desc', 'detail', 'note', 'nota'],
        ''
      );

      const category = formulaValue(
        formula,
        ['category', 'categoria', 'cat'],
        'algebra'
      );

      return `
        <article class="formula-card">
          <span class="formula-category">${escapeHTML(category)}</span>
          <h3>${escapeHTML(title)}</h3>
          <div class="formula-expression">${escapeHTML(expression)}</div>
          <p>${escapeHTML(description)}</p>
        </article>
      `;
    }).join('');
  }

  const formulaSearch = $id('formulaSearch');

  if (formulaSearch) {
    formulaSearch.addEventListener('input', renderFormulas);
  }

  $$('[data-formula-cat]').forEach(button => {
    button.addEventListener('click', () => {
      state.formulaCategory = button.dataset.formulaCat || 'all';

      $$('[data-formula-cat]').forEach(item => {
        item.classList.toggle('active', item === button);
      });

      renderFormulas();
    });
  });

  /* =========================
     JUEGOS MATEMÁTICOS
     ========================= */

  function updateScoreboard() {
    setText('scoreCorrect', state.correct);
    setText('scoreWrong', state.wrong);
    setText('scoreStreak', state.streak);
    setText('scoreXP', state.xp);
  }

  function getProblemText(problem) {
    if (typeof problem === 'string') return problem;

    if (!problem || typeof problem !== 'object') {
      return 'No se pudo generar el problema.';
    }

    return (
      problem.question ??
      problem.pregunta ??
      problem.problem ??
      problem.text ??
      problem.expression ??
      problem.enunciado ??
      'Resuelve el siguiente reto.'
    );
  }

  function getProblemCategory(problem) {
    if (!problem || typeof problem !== 'object') return 'RETO';

    return (
      problem.category ??
      problem.categoria ??
      problem.type ??
      problem.tipo ??
      'RETO'
    );
  }

  function renderGameProblem(problem) {
    state.currentProblem = problem;
    state.gameLocked = false;

    setText('gameProblem', getProblemText(problem));
    setText(
      'gameCategory',
      String(getProblemCategory(problem)).toUpperCase()
    );

    setText('gameFeedback', '');
    setText('gameSteps', '');

    const answer = $id('gameAnswer');

    if (answer) {
      answer.value = '';
      answer.disabled = false;
    }

    const submit = $id('gameSubmit');

    if (submit) {
      submit.disabled = false;
      submit.textContent = 'Verificar';
    }
  }

  function newGameProblem() {
    if (!GM || typeof GM.randomProblem !== 'function') {
      toast('El generador de retos no está disponible.');
      return;
    }

    try {
      const problem = GM.randomProblem(
        state.gameLevel,
        state.gameMode
      );

      if (!problem) {
        throw new Error('No se pudo generar un problema.');
      }

      renderGameProblem(problem);
    } catch (error) {
      console.error('Error generando reto:', error);
      setText(
        'gameFeedback',
        'No se pudo generar el reto. Inténtalo de nuevo.'
      );
    }
  }

  function compareAnswers(userAnswer, expectedAnswer) {
    const user = String(userAnswer).trim().replace(',', '.');
    const expected = String(expectedAnswer ?? '').trim().replace(',', '.');

    if (user === expected) return true;

    const userNumber = Number(user);
    const expectedNumber = Number(expected);

    if (
      Number.isFinite(userNumber) &&
      Number.isFinite(expectedNumber)
    ) {
      return Math.abs(userNumber - expectedNumber) < 1e-6;
    }

    return user.toLowerCase() === expected.toLowerCase();
  }

  function checkGameAnswer() {
    if (!state.currentProblem || state.gameLocked) return;

    const input = $id('gameAnswer');
    if (!input) return;

    const answer = input.value.trim();

    if (!answer) {
      setText('gameFeedback', 'Escribe una respuesta primero.');
      return;
    }

    let correct = false;

    try {
      if (GM && typeof GM.checkAnswer === 'function') {
        const result = GM.checkAnswer(answer, state.currentProblem);

        if (typeof result === 'boolean') {
          correct = result;
        } else if (result && typeof result === 'object') {
          correct = Boolean(
            result.correct ??
            result.isCorrect ??
            result.ok
          );
        } else {
          correct = Boolean(result);
        }
      } else {
        const expected =
          state.currentProblem.answer ??
          state.currentProblem.respuesta ??
          state.currentProblem.correctAnswer;

        correct = compareAnswers(answer, expected);
      }
    } catch (error) {
      console.error('Error verificando respuesta:', error);

      setText(
        'gameFeedback',
        'No se pudo verificar la respuesta. Inténtalo otra vez.'
      );

      return;
    }

    state.gameLocked = true;
    input.disabled = true;

    const submit = $id('gameSubmit');

    if (submit) submit.disabled = true;

    if (correct) {
      state.correct++;
      state.streak++;
      state.xp += 10 * state.gameLevel;

      setText('gameFeedback', '¡Correcto! +XP');
      toast('¡Respuesta correcta!');
    } else {
      state.wrong++;
      state.streak = 0;

      setText(
        'gameFeedback',
        'No es correcto. Puedes consultar la solución.'
      );
    }

    updateScoreboard();
  }

 
  function showGameSolution() {
    const problem = state.currentProblem;

    if (!problem) {
      setText('gameFeedback', 'Genera un problema primero.');
      return;
    }

    const container = $id('gameSteps');

    if (!container) {
      console.error('No se encontró el elemento #gameSteps.');
      setText(
        'gameFeedback',
        'No se encontró el espacio para mostrar la solución.'
      );
      return;
    }

    // Recuperar la explicación del reto.
    let steps =
      problem.steps ??
      problem.pasos ??
      problem.solution ??
      problem.solucion ??
      problem.explanation ??
      problem.explicacion;

    // Convertir el texto en pasos individuales cuando corresponda.
    if (typeof steps === 'string') {
      steps = steps
        .split(/\r?\n/)
        .map(step => step.trim())
        .filter(Boolean);
    }

    // Limpiar el contenido anterior.
    container.replaceChildren();

    // Forzar que el contenedor sea visible.
    container.hidden = false;
    container.removeAttribute('hidden');
    container.style.setProperty('display', 'block', 'important');
    container.style.setProperty('visibility', 'visible', 'important');
    container.style.setProperty('opacity', '1', 'important');
    container.style.setProperty('height', 'auto', 'important');
    container.style.setProperty('max-height', 'none', 'important');
    container.style.setProperty('overflow', 'visible', 'important');

    // Encabezado.
    const title = document.createElement('h3');
    title.textContent = 'Solución paso a paso';
    title.style.display = 'block';
    title.style.marginBottom = '12px';
    container.appendChild(title);

    // Pasos de la explicación.
    if (Array.isArray(steps) && steps.length > 0) {
      const list = document.createElement('ol');

      list.style.display = 'block';
      list.style.paddingLeft = '28px';

      steps.forEach(step => {
        const item = document.createElement('li');

        if (step && typeof step === 'object') {
          item.textContent =
            step.text ??
            step.description ??
            step.content ??
            step.value ??
            step.title ??
            JSON.stringify(step);
        } else {
          item.textContent = String(step);
        }

        item.style.display = 'list-item';
        item.style.marginBottom = '10px';
        item.style.lineHeight = '1.7';

        list.appendChild(item);
      });

      container.appendChild(list);
    } else {
      const message = document.createElement('p');

      message.textContent =
        'Este reto no incluye pasos detallados. Consulta la respuesta correcta a continuación.';

      container.appendChild(message);
    }

    // Mostrar la respuesta correcta.
    const answer =
      problem.answer ??
      problem.respuesta ??
      problem.correctAnswer ??
      problem.correct_answer;

    const answerBox = document.createElement('div');

    answerBox.className = 'game-correct-answer';
    answerBox.style.display = 'block';
    answerBox.style.visibility = 'visible';
    answerBox.style.opacity = '1';
    answerBox.style.marginTop = '16px';
    answerBox.style.padding = '14px';
    answerBox.style.borderRadius = '10px';
    answerBox.style.fontWeight = 'bold';
    answerBox.style.lineHeight = '1.7';

    let answerText = 'No disponible';

    if (answer !== undefined && answer !== null) {
      answerText = Array.isArray(answer)
        ? answer.join(', ')
        : typeof answer === 'object'
          ? JSON.stringify(answer)
          : String(answer);
    }

    answerBox.textContent = 'Respuesta correcta: ' + answerText;
    container.appendChild(answerBox);

    // Confirmación.
    setText('gameFeedback', '¡Solución revelada!');

    // Bloquear el reto después de revelar la respuesta.
    if (!state.gameLocked) {
      state.gameLocked = true;
      state.streak = 0;
      updateScoreboard();
    }

    const answerInput = $id('gameAnswer');
    if (answerInput) answerInput.disabled = true;

    const submitButton = $id('gameSubmit');
    if (submitButton) submitButton.disabled = true;

    // Llevar la solución a la vista.
    container.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });

    console.info('Solución del juego mostrada:', problem);
  }


  const gameSubmit = $id('gameSubmit');

  if (gameSubmit) {
    gameSubmit.addEventListener('click', checkGameAnswer);
  }

  const gameNew = $id('gameNew');

  if (gameNew) {
    gameNew.addEventListener('click', newGameProblem);
  }

  const gameGiveUp = $id('gameGiveUp');

  if (gameGiveUp) {
    gameGiveUp.addEventListener('click', showGameSolution);
  }

  const gameAnswer = $id('gameAnswer');

  if (gameAnswer) {
    gameAnswer.addEventListener('keydown', event => {
      if (event.key === 'Enter') checkGameAnswer();
    });
  }

  $$('[data-level]').forEach(button => {
    button.addEventListener('click', () => {
      state.gameLevel = number(button.dataset.level, 1);

      $$('[data-level]').forEach(item => {
        item.classList.toggle('active', item === button);
      });

      newGameProblem();
    });
  });

  $$('[data-game-mode]').forEach(button => {
    button.addEventListener('click', () => {
      state.gameMode = button.dataset.gameMode || 'mixed';

      $$('[data-game-mode]').forEach(item => {
        item.classList.toggle('active', item === button);
      });

      newGameProblem();
    });
  });

  /* =========================
     INICIALIZACIÓN
     ========================= */

  function initialize() {
    selectCalcType('linear');

    renderFormulas();
    updateScoreboard();

    if (calcGraph) calcGraph.resize();
    if (universalGraph) universalGraph.resize();

    // Primera gráfica de la calculadora.
    analyzeCalculation();

    // Primera expresión del graficador universal.
    if ($id('universalExpr')?.value.trim()) {
      parseUniversal();
    }

    // Primer reto matemático.
    newGameProblem();

    console.info('MathGraph Studio iniciado correctamente.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }
})();

