/* =========================================================
   Lessons — contenido estático de lecciones paso a paso
   ========================================================= */
(function (global) {
  const lessons = [
    {
      id: 'lineal',
      title: 'Ecuaciones lineales',
      tag: 'Álgebra · Nivel 1',
      summary: 'Cómo despejar x en una ecuación de la forma ax + b = c.',
      steps: [
        'Identifica los términos con x y los términos independientes (números solos) a cada lado del signo igual.',
        'Usa la suma o resta para mover todos los términos con x a un lado y los números al otro lado.',
        'Simplifica ambos lados sumando términos semejantes.',
        'Divide ambos lados entre el coeficiente que acompaña a x para dejarla sola.',
        'Comprueba tu respuesta sustituyendo el valor encontrado en la ecuación original.'
      ],
      example: { text: 'Resuelve: 3x + 5 = 20', work: ['3x + 5 = 20', '3x = 20 − 5', '3x = 15', 'x = 15 / 3', 'x = 5'] }
    },
    {
      id: 'cuadratica',
      title: 'Ecuaciones cuadráticas',
      tag: 'Álgebra · Nivel 2',
      summary: 'La fórmula general y cómo interpretar el discriminante.',
      steps: [
        'Escribe la ecuación en su forma estándar: ax² + bx + c = 0.',
        'Identifica los valores de a, b y c.',
        'Calcula el discriminante: Δ = b² − 4ac.',
        'Si Δ > 0 hay dos raíces reales distintas; si Δ = 0 hay una raíz doble; si Δ < 0 las raíces son complejas.',
        'Sustituye en la fórmula general: x = (−b ± √Δ) / (2a) y simplifica.'
      ],
      example: { text: 'Resuelve: x² − 5x + 6 = 0', work: ['a=1, b=−5, c=6', 'Δ = (−5)² − 4(1)(6) = 1', '√Δ = 1', 'x = (5 ± 1) / 2', 'x₁ = 3, x₂ = 2'] }
    },
    {
      id: 'factorizacion',
      title: 'Factorización rápida',
      tag: 'Álgebra · Nivel 2',
      summary: 'Trinomios de la forma x² + bx + c usando dos números clave.',
      steps: [
        'Busca dos números que multiplicados den c y sumados den b.',
        'Escribe el trinomio como (x + p)(x + q), usando esos dos números p y q.',
        'Verifica expandiendo el producto para confirmar que regresa al trinomio original.',
        'Las raíces de la ecuación son los valores que hacen cero cada paréntesis: x = −p y x = −q.'
      ],
      example: { text: 'Factoriza: x² + 7x + 12', work: ['Buscamos dos números que den 12 al multiplicar y 7 al sumar', '3 × 4 = 12  y  3 + 4 = 7', '(x + 3)(x + 4)', 'Raíces: x = −3, x = −4'] }
    },
    {
      id: 'sistemas',
      title: 'Sistemas de dos ecuaciones',
      tag: 'Álgebra · Nivel 3',
      summary: 'Método de sustitución para dos ecuaciones lineales con x, y.',
      steps: [
        'Despeja una variable en una de las dos ecuaciones (la que te resulte más simple).',
        'Sustituye esa expresión en la otra ecuación, dejando una sola variable.',
        'Resuelve la ecuación resultante (queda una ecuación lineal de una variable).',
        'Sustituye el valor encontrado en cualquiera de las ecuaciones originales para hallar la otra variable.',
        'Comprueba ambos valores en las dos ecuaciones originales.'
      ],
      example: { text: 'x + y = 10,  x − y = 2', work: ['De la primera: x = 10 − y', 'Sustituye en la segunda: (10 − y) − y = 2', '10 − 2y = 2  →  y = 4', 'x = 10 − 4 = 6'] }
    },
    {
      id: 'dominio',
      title: 'Dominio de una función',
      tag: 'Funciones · Nivel 2',
      summary: 'Qué valores de x están permitidos según el tipo de función.',
      steps: [
        'Si la función es polinomial (sin fracciones ni raíces), el dominio son todos los reales.',
        'Si hay una fracción, excluye los valores de x que hacen cero el denominador.',
        'Si hay una raíz cuadrada, exige que el contenido de la raíz sea mayor o igual a cero.',
        'Si hay un logaritmo, exige que el argumento sea estrictamente mayor que cero.',
        'Combina todas las restricciones anteriores para escribir el dominio final.'
      ],
      example: { text: 'Dominio de f(x) = 1 / (x − 3)', work: ['El denominador no puede ser 0', 'x − 3 ≠ 0  →  x ≠ 3', 'Dominio: ℝ − {3}'] }
    },
    {
      id: 'trig-notables',
      title: 'Ángulos notables',
      tag: 'Trigonometría · Nivel 1',
      summary: 'Valores de seno, coseno y tangente en 0°, 30°, 45°, 60° y 90°.',
      steps: [
        'Dibuja o imagina el círculo unitario y ubica el ángulo pedido.',
        'Recuerda que sen(θ) es la coordenada y del punto, y cos(θ) es la coordenada x.',
        'Usa la tabla de valores notables (0, 1/2, √2/2, √3/2, 1) según el ángulo.',
        'tan(θ) siempre es sen(θ) / cos(θ); ten cuidado cuando cos(θ) = 0 (no está definida).'
      ],
      example: { text: 'Evalúa sen(30°) y cos(60°)', work: ['sen(30°) = 1/2', 'cos(60°) = 1/2', 'Ambos coinciden porque 30° y 60° son complementarios'] }
    },
    {
      id: 'racional-asintotas',
      title: 'Asíntotas de funciones racionales',
      tag: 'Funciones · Nivel 3',
      summary: 'Cómo encontrar asíntotas verticales y horizontales.',
      steps: [
        'Las asíntotas verticales están en los valores de x que anulan el denominador (y no el numerador al mismo tiempo).',
        'Compara el grado del numerador con el del denominador para la asíntota horizontal.',
        'Si el grado del numerador es menor, la asíntota horizontal es y = 0.',
        'Si los grados son iguales, la asíntota horizontal es el cociente de los coeficientes principales.',
        'Si el grado del numerador es mayor, no hay asíntota horizontal (puede haber una oblicua).'
      ],
      example: { text: 'f(x) = (2x) / (x − 4)', work: ['Denominador cero en x = 4 → asíntota vertical x = 4', 'Mismo grado arriba y abajo (1 y 1)', 'Asíntota horizontal: y = 2/1 = 2'] }
    },
    {
      id: 'pendiente',
      title: 'Pendiente entre dos puntos',
      tag: 'Geometría analítica · Nivel 1',
      summary: 'La fórmula m = (y₂ − y₁)/(x₂ − x₁) explicada paso a paso.',
      steps: [
        'Identifica las coordenadas de los dos puntos: (x₁, y₁) y (x₂, y₂).',
        'Resta las coordenadas y: y₂ − y₁.',
        'Resta las coordenadas x en el mismo orden: x₂ − x₁.',
        'Divide el primer resultado entre el segundo para obtener la pendiente m.',
        'Si m > 0 la recta sube, si m < 0 baja, si m = 0 es horizontal.'
      ],
      example: { text: 'Puntos (1, 2) y (4, 11)', work: ['m = (11 − 2) / (4 − 1)', 'm = 9 / 3', 'm = 3'] }
    }
  ];

  global.Lessons = { lessons };
})(window);
