/* ==========================================================
   MathGraph Studio — Formula Vault
   Biblioteca ampliada de fórmulas matemáticas.
   ========================================================== */

(function (global) {
  'use strict';

  const formulas = [
    // ======================================================
    // ÁLGEBRA
    // ======================================================

    {
      cat: 'algebra',
      name: 'Ecuación lineal',
      formula: 'ax + b = 0  →  x = -b/a',
      note: 'Para a distinto de cero.'
    },
    {
      cat: 'algebra',
      name: 'Fórmula cuadrática',
      formula: 'x = (-b ± √(b² - 4ac)) / (2a)',
      note: 'Resuelve ecuaciones de la forma ax² + bx + c = 0.'
    },
    {
      cat: 'algebra',
      name: 'Discriminante',
      formula: 'Δ = b² - 4ac',
      note: 'Δ > 0: dos raíces reales; Δ = 0: raíz doble; Δ < 0: raíces complejas.'
    },
    {
      cat: 'algebra',
      name: 'Suma de cuadrados en un binomio',
      formula: '(a + b)² = a² + 2ab + b²',
      note: 'Cuadrado del primero, más el doble producto, más el cuadrado del segundo.'
    },
    {
      cat: 'algebra',
      name: 'Cuadrado de una diferencia',
      formula: '(a - b)² = a² - 2ab + b²',
      note: 'El término del medio es negativo.'
    },
    {
      cat: 'algebra',
      name: 'Diferencia de cuadrados',
      formula: 'a² - b² = (a - b)(a + b)',
      note: 'Permite factorizar una resta de dos cuadrados perfectos.'
    },
    {
      cat: 'algebra',
      name: 'Suma de cubos',
      formula: 'a³ + b³ = (a + b)(a² - ab + b²)',
      note: 'Identidad para factorizar una suma de cubos.'
    },
    {
      cat: 'algebra',
      name: 'Diferencia de cubos',
      formula: 'a³ - b³ = (a - b)(a² + ab + b²)',
      note: 'Identidad para factorizar una diferencia de cubos.'
    },
    {
      cat: 'algebra',
      name: 'Cubo de una suma',
      formula: '(a + b)³ = a³ + 3a²b + 3ab² + b³',
      note: 'Desarrollo del cubo de un binomio.'
    },
    {
      cat: 'algebra',
      name: 'Producto de binomios conjugados',
      formula: '(a - b)(a + b) = a² - b²',
      note: 'Elimina los términos cruzados.'
    },
    {
      cat: 'algebra',
      name: 'Propiedad distributiva',
      formula: 'a(b + c) = ab + ac',
      note: 'Multiplica el factor exterior por cada término.'
    },
    {
      cat: 'algebra',
      name: 'Potencia de una potencia',
      formula: '(aᵐ)ⁿ = aᵐⁿ',
      note: 'Se multiplican los exponentes.'
    },
    {
      cat: 'algebra',
      name: 'Producto de potencias',
      formula: 'aᵐ · aⁿ = aᵐ⁺ⁿ',
      note: 'Se suman los exponentes cuando la base es la misma.'
    },
    {
      cat: 'algebra',
      name: 'Cociente de potencias',
      formula: 'aᵐ / aⁿ = aᵐ⁻ⁿ',
      note: 'Para a distinto de cero.'
    },
    {
      cat: 'algebra',
      name: 'Exponente cero',
      formula: 'a⁰ = 1',
      note: 'Para a distinto de cero.'
    },
    {
      cat: 'algebra',
      name: 'Exponente negativo',
      formula: 'a⁻ⁿ = 1/aⁿ',
      note: 'Convierte una potencia negativa en su recíproco.'
    },
    {
      cat: 'algebra',
      name: 'Producto de radicales',
      formula: '√a · √b = √(ab)',
      note: 'Para radicandos no negativos.'
    },
    {
      cat: 'algebra',
      name: 'Logaritmo de un producto',
      formula: 'log(ab) = log(a) + log(b)',
      note: 'Para a y b positivos.'
    },
    {
      cat: 'algebra',
      name: 'Logaritmo de un cociente',
      formula: 'log(a/b) = log(a) - log(b)',
      note: 'Para a y b positivos.'
    },
    {
      cat: 'algebra',
      name: 'Logaritmo de una potencia',
      formula: 'log(aⁿ) = n log(a)',
      note: 'Para a positivo.'
    },

    // ======================================================
    // ECUACIONES
    // ======================================================

    {
      cat: 'equations',
      name: 'Ecuación de primer grado',
      formula: 'ax + b = c  →  x = (c - b)/a',
      note: 'Para a distinto de cero.'
    },
    {
      cat: 'equations',
      name: 'Sistema de dos ecuaciones',
      formula: 'a₁x + b₁y = c₁; a₂x + b₂y = c₂',
      note: 'Puede resolverse por sustitución, eliminación o métodos matriciales.'
    },
    {
      cat: 'equations',
      name: 'Regla de Cramer para x',
      formula: 'x = (c₁b₂ - b₁c₂)/(a₁b₂ - b₁a₂)',
      note: 'Para un sistema de dos ecuaciones cuando el determinante es distinto de cero.'
    },
    {
      cat: 'equations',
      name: 'Regla de Cramer para y',
      formula: 'y = (a₁c₂ - c₁a₂)/(a₁b₂ - b₁a₂)',
      note: 'Se aplica bajo la misma condición de determinante no nulo.'
    },
    {
      cat: 'equations',
      name: 'Ecuación cuadrática incompleta',
      formula: 'ax² + c = 0  →  x = ±√(-c/a)',
      note: 'Las soluciones reales dependen de que -c/a sea no negativo.'
    },
    {
      cat: 'equations',
      name: 'Relación entre raíces y coeficientes',
      formula: 'x₁ + x₂ = -b/a;  x₁x₂ = c/a',
      note: 'Relaciones de Viète para ax² + bx + c = 0.'
    },

    // ======================================================
    // FUNCIONES Y GRÁFICAS
    // ======================================================

    {
      cat: 'functions',
      name: 'Función lineal',
      formula: 'y = mx + b',
      note: 'm es la pendiente y b la intersección con el eje Y.'
    },
    {
      cat: 'functions',
      name: 'Pendiente entre dos puntos',
      formula: 'm = (y₂ - y₁)/(x₂ - x₁)',
      note: 'Requiere x₂ distinto de x₁.'
    },
    {
      cat: 'functions',
      name: 'Ecuación punto-pendiente',
      formula: 'y - y₁ = m(x - x₁)',
      note: 'Recta de pendiente m que pasa por (x₁, y₁).'
    },
    {
      cat: 'functions',
      name: 'Ecuación de una recta vertical',
      formula: 'x = a',
      note: 'Todos los puntos de la recta tienen la misma coordenada x.'
    },
    {
      cat: 'functions',
      name: 'Vértice de una parábola',
      formula: 'xᵥ = -b/(2a);  yᵥ = f(xᵥ)',
      note: 'Localiza el mínimo o máximo de una función cuadrática.'
    },
    {
      cat: 'functions',
      name: 'Eje de simetría',
      formula: 'x = -b/(2a)',
      note: 'La recta vertical que atraviesa el vértice de la parábola.'
    },
    {
      cat: 'functions',
      name: 'Forma de vértice',
      formula: 'y = a(x - h)² + k',
      note: 'El vértice de la parábola es (h, k).'
    },
    {
      cat: 'functions',
      name: 'Función exponencial',
      formula: 'f(x) = aˣ',
      note: 'Para a positivo y distinto de uno.'
    },
    {
      cat: 'functions',
      name: 'Función logarítmica',
      formula: 'f(x) = logₐ(x)',
      note: 'Inversa de la función exponencial, con a positivo y distinto de uno.'
    },
    {
      cat: 'functions',
      name: 'Dominio de una función racional',
      formula: 'Denominador ≠ 0',
      note: 'Los valores que anulan el denominador quedan excluidos.'
    },
    {
      cat: 'functions',
      name: 'Asíntota horizontal racional',
      formula: 'grado(P) < grado(Q)  →  y = 0',
      note: 'Para una función racional P(x)/Q(x). Si los grados son iguales, se usa el cociente de coeficientes principales.'
    },
    {
      cat: 'functions',
      name: 'Composición de funciones',
      formula: '(f ∘ g)(x) = f(g(x))',
      note: 'Primero se evalúa g y después f.'
    },
    {
      cat: 'functions',
      name: 'Función inversa',
      formula: 'f⁻¹(f(x)) = x',
      note: 'La inversa deshace la operación de la función original cuando existe.'
    },

    // ======================================================
    // GEOMETRÍA PLANA
    // ======================================================

    {
      cat: 'geometry',
      name: 'Área del cuadrado',
      formula: 'A = l²',
      note: 'l es la longitud de un lado.'
    },
    {
      cat: 'geometry',
      name: 'Perímetro del cuadrado',
      formula: 'P = 4l',
      note: 'Suma de sus cuatro lados iguales.'
    },
    {
      cat: 'geometry',
      name: 'Área del rectángulo',
      formula: 'A = bh',
      note: 'Base por altura.'
    },
    {
      cat: 'geometry',
      name: 'Perímetro del rectángulo',
      formula: 'P = 2b + 2h',
      note: 'Dos veces la base más dos veces la altura.'
    },
    {
      cat: 'geometry',
      name: 'Área del triángulo',
      formula: 'A = bh/2',
      note: 'b es la base y h la altura perpendicular.'
    },
    {
      cat: 'geometry',
      name: 'Teorema de Pitágoras',
      formula: 'c² = a² + b²',
      note: 'c es la hipotenusa de un triángulo rectángulo.'
    },
    {
      cat: 'geometry',
      name: 'Área del círculo',
      formula: 'A = πr²',
      note: 'r es el radio.'
    },
    {
      cat: 'geometry',
      name: 'Longitud de circunferencia',
      formula: 'C = 2πr = πd',
      note: 'd es el diámetro y r es el radio.'
    },
    {
      cat: 'geometry',
      name: 'Área del trapecio',
      formula: 'A = ((B + b)h)/2',
      note: 'B y b son las bases paralelas.'
    },
    {
      cat: 'geometry',
      name: 'Área del rombo',
      formula: 'A = (D · d)/2',
      note: 'D y d son las diagonales.'
    },
    {
      cat: 'geometry',
      name: 'Suma de ángulos interiores',
      formula: 'S = (n - 2) · 180°',
      note: 'Suma de los ángulos interiores de un polígono de n lados.'
    },
    {
      cat: 'geometry',
      name: 'Área de un polígono regular',
      formula: 'A = (P · ap)/2',
      note: 'P es el perímetro y ap es la apotema.'
    },

    // ======================================================
    // GEOMETRÍA DEL ESPACIO
    // ======================================================

    {
      cat: 'solid',
      name: 'Volumen del cubo',
      formula: 'V = l³',
      note: 'l es la longitud de una arista.'
    },
    {
      cat: 'solid',
      name: 'Volumen del prisma',
      formula: 'V = A_base · h',
      note: 'Área de la base multiplicada por la altura.'
    },
    {
      cat: 'solid',
      name: 'Volumen del cilindro',
      formula: 'V = πr²h',
      note: 'r es el radio y h es la altura.'
    },
    {
      cat: 'solid',
      name: 'Volumen de la esfera',
      formula: 'V = (4/3)πr³',
      note: 'r es el radio.'
    },
    {
      cat: 'solid',
      name: 'Área de la esfera',
      formula: 'A = 4πr²',
      note: 'Área de la superficie esférica.'
    },
    {
      cat: 'solid',
      name: 'Volumen del cono',
      formula: 'V = (1/3)πr²h',
      note: 'Un tercio del volumen de un cilindro con la misma base y altura.'
    },
    {
      cat: 'solid',
      name: 'Volumen de la pirámide',
      formula: 'V = (1/3)A_base · h',
      note: 'Un tercio del área de la base por la altura.'
    },

    // ======================================================
    // GEOMETRÍA ANALÍTICA
    // ======================================================

    {
      cat: 'analytic',
      name: 'Distancia entre dos puntos',
      formula: 'd = √((x₂ - x₁)² + (y₂ - y₁)²)',
      note: 'Distancia euclidiana en el plano cartesiano.'
    },
    {
      cat: 'analytic',
      name: 'Punto medio',
      formula: 'M = ((x₁ + x₂)/2, (y₁ + y₂)/2)',
      note: 'Coordenadas del punto medio de un segmento.'
    },
    {
      cat: 'analytic',
      name: 'Circunferencia centrada en el origen',
      formula: 'x² + y² = r²',
      note: 'r es el radio.'
    },
    {
      cat: 'analytic',
      name: 'Circunferencia con centro (h, k)',
      formula: '(x - h)² + (y - k)² = r²',
      note: 'Forma estándar de una circunferencia.'
    },
    {
      cat: 'analytic',
      name: 'Pendiente perpendicular',
      formula: 'm₁m₂ = -1',
      note: 'Para rectas perpendiculares con pendientes definidas.'
    },
    {
      cat: 'analytic',
      name: 'Rectas paralelas',
      formula: 'm₁ = m₂',
      note: 'Dos rectas distintas con la misma pendiente son paralelas.'
    },

    // ======================================================
    // TRIGONOMETRÍA
    // ======================================================

    {
      cat: 'trig',
      name: 'Razón seno',
      formula: 'sin θ = cateto opuesto / hipotenusa',
      note: 'En un triángulo rectángulo.'
    },
    {
      cat: 'trig',
      name: 'Razón coseno',
      formula: 'cos θ = cateto adyacente / hipotenusa',
      note: 'En un triángulo rectángulo.'
    },
    {
      cat: 'trig',
      name: 'Razón tangente',
      formula: 'tan θ = cateto opuesto / cateto adyacente',
      note: 'En un triángulo rectángulo.'
    },
    {
      cat: 'trig',
      name: 'Identidad pitagórica',
      formula: 'sin² θ + cos² θ = 1',
      note: 'Identidad fundamental de seno y coseno.'
    },
    {
      cat: 'trig',
      name: 'Tangente como cociente',
      formula: 'tan θ = sin θ / cos θ',
      note: 'Siempre que cos θ sea distinto de cero.'
    },
    {
      cat: 'trig',
      name: 'Ley de senos',
      formula: 'a/sin A = b/sin B = c/sin C',
      note: 'Relaciona lados y ángulos de cualquier triángulo.'
    },
    {
      cat: 'trig',
      name: 'Ley de cosenos',
      formula: 'c² = a² + b² - 2ab cos C',
      note: 'Generaliza el teorema de Pitágoras.'
    },
    {
      cat: 'trig',
      name: 'Seno de una suma',
      formula: 'sin(A + B) = sin A cos B + cos A sin B',
      note: 'Identidad para sumar dos ángulos.'
    },
    {
      cat: 'trig',
      name: 'Coseno de una suma',
      formula: 'cos(A + B) = cos A cos B - sin A sin B',
      note: 'Identidad para sumar dos ángulos.'
    },

    // ======================================================
    // ESTADÍSTICA Y PROBABILIDAD
    // ======================================================

    {
      cat: 'statistics',
      name: 'Media aritmética',
      formula: 'x̄ = (x₁ + x₂ + ... + xₙ)/n',
      note: 'Suma de los datos dividida entre la cantidad de datos.'
    },
    {
      cat: 'statistics',
      name: 'Rango',
      formula: 'R = valor máximo - valor mínimo',
      note: 'Mide la amplitud entre los extremos de los datos.'
    },
    {
      cat: 'statistics',
      name: 'Varianza poblacional',
      formula: 'σ² = Σ(xᵢ - μ)²/N',
      note: 'Mide la dispersión respecto de la media poblacional.'
    },
    {
      cat: 'statistics',
      name: 'Desviación estándar poblacional',
      formula: 'σ = √σ²',
      note: 'Raíz cuadrada de la varianza poblacional.'
    },
    {
      cat: 'statistics',
      name: 'Probabilidad clásica',
      formula: 'P(A) = casos favorables / casos posibles',
      note: 'Se aplica cuando todos los resultados son igualmente probables.'
    },
    {
      cat: 'statistics',
      name: 'Probabilidad complementaria',
      formula: 'P(Aᶜ) = 1 - P(A)',
      note: 'Probabilidad de que no ocurra A.'
    },
    {
      cat: 'statistics',
      name: 'Permutaciones',
      formula: 'P(n) = n!',
      note: 'Número de ordenamientos de n elementos distintos.'
    },
    {
      cat: 'statistics',
      name: 'Combinaciones',
      formula: 'C(n, r) = n! / (r!(n-r)!)',
      note: 'Número de maneras de elegir r elementos de n sin importar el orden.'
    },

    // ======================================================
    // CÁLCULO
    // ======================================================

    {
      cat: 'calculus',
      name: 'Derivada de una constante',
      formula: 'd/dx[c] = 0',
      note: 'La derivada de una constante es cero.'
    },
    {
      cat: 'calculus',
      name: 'Regla de la potencia',
      formula: 'd/dx[xⁿ] = n·xⁿ⁻¹',
      note: 'Multiplica por el exponente y reduce el exponente en uno.'
    },
    {
      cat: 'calculus',
      name: 'Derivada de una suma',
      formula: '(f + g)′ = f′ + g′',
      note: 'La derivada de una suma es la suma de las derivadas.'
    },
    {
      cat: 'calculus',
      name: 'Regla del producto',
      formula: '(fg)′ = f′g + fg′',
      note: 'Deriva un factor a la vez y suma los productos.'
    },
    {
      cat: 'calculus',
      name: 'Regla del cociente',
      formula: '(f/g)′ = (f′g - fg′)/g²',
      note: 'Válida donde g es distinto de cero.'
    },
    {
      cat: 'calculus',
      name: 'Regla de la cadena',
      formula: '(f(g(x)))′ = f′(g(x)) · g′(x)',
      note: 'Derivada de una función compuesta.'
    },
    {
      cat: 'calculus',
      name: 'Derivada del seno',
      formula: 'd/dx[sin x] = cos x',
      note: 'Con x expresado en radianes.'
    },
    {
      cat: 'calculus',
      name: 'Derivada del coseno',
      formula: 'd/dx[cos x] = -sin x',
      note: 'Con x expresado en radianes.'
    },
    {
      cat: 'calculus',
      name: 'Derivada exponencial',
      formula: 'd/dx[eˣ] = eˣ',
      note: 'La función exponencial natural es su propia derivada.'
    },
    {
      cat: 'calculus',
      name: 'Derivada del logaritmo natural',
      formula: 'd/dx[ln x] = 1/x',
      note: 'Para x positivo.'
    },
    {
      cat: 'calculus',
      name: 'Integral de una constante',
      formula: '∫k dx = kx + C',
      note: 'C es la constante de integración.'
    },
    {
      cat: 'calculus',
      name: 'Integral de una potencia',
      formula: '∫xⁿ dx = xⁿ⁺¹/(n+1) + C',
      note: 'Para n distinto de -1.'
    },
    {
      cat: 'calculus',
      name: 'Integral de uno sobre x',
      formula: '∫(1/x) dx = ln|x| + C',
      note: 'Válida en intervalos donde x no sea cero.'
    },
    {
      cat: 'calculus',
      name: 'Integral del coseno',
      formula: '∫cos x dx = sin x + C',
      note: 'Con x expresado en radianes.'
    },
    {
      cat: 'calculus',
      name: 'Integral del seno',
      formula: '∫sin x dx = -cos x + C',
      note: 'Con x expresado en radianes.'
    }
  ];

  global.Formulas = {
    formulas
  };

})(window); 