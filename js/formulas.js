/* Formula Vault — reference cards for MathGraph Studio */
(function(global){
 const formulas=[
  {cat:'algebra',name:'Ecuación lineal',formula:'ax + b = 0  →  x = −b/a',note:'Úsala cuando la variable aparece con exponente 1.'},
  {cat:'algebra',name:'Fórmula cuadrática',formula:'x = (−b ± √(b² − 4ac)) / 2a',note:'Para ax² + bx + c = 0.'},
  {cat:'algebra',name:'Discriminante',formula:'Δ = b² − 4ac',note:'Δ>0: dos raíces reales · Δ=0: raíz doble · Δ<0: raíces complejas.'},
  {cat:'algebra',name:'Diferencia de cuadrados',formula:'a² − b² = (a−b)(a+b)',note:'Una factorización esencial.'},
  {cat:'algebra',name:'Binomio al cuadrado',formula:'(a+b)² = a² + 2ab + b²',note:'También: (a−b)² = a² − 2ab + b².'},
  {cat:'functions',name:'Función lineal',formula:'f(x)=mx+b',note:'m es la pendiente y b la intersección con el eje y.'},
  {cat:'functions',name:'Pendiente',formula:'m = (y₂−y₁)/(x₂−x₁)',note:'Mide cuánto cambia y por cada unidad de x.'},
  {cat:'functions',name:'Vértice de una parábola',formula:'xᵥ = −b/(2a) · yᵥ=f(xᵥ)',note:'Permite localizar el máximo o mínimo de una cuadrática.'},
  {cat:'functions',name:'Dominio de una racional',formula:'denominador ≠ 0',note:'Los ceros del denominador quedan fuera del dominio.'},
  {cat:'functions',name:'Asíntota horizontal',formula:'grado(P)<grado(Q) → y=0 · grados iguales → y=aₙ/bₙ',note:'Para funciones racionales.'},
  {cat:'geometry',name:'Distancia entre dos puntos',formula:'d = √((x₂−x₁)² + (y₂−y₁)²)',note:'Es Pitágoras aplicado al plano cartesiano.'},
  {cat:'geometry',name:'Punto medio',formula:'M=((x₁+x₂)/2,(y₁+y₂)/2)',note:'Centro del segmento que une dos puntos.'},
  {cat:'geometry',name:'Área del círculo',formula:'A=πr²',note:'r es el radio.'},
  {cat:'geometry',name:'Longitud de circunferencia',formula:'C=2πr',note:'También C=πd.'},
  {cat:'geometry',name:'Área del triángulo',formula:'A=bh/2',note:'b es la base y h la altura perpendicular.'},
  {cat:'trig',name:'Identidad pitagórica',formula:'sin²θ + cos²θ = 1',note:'Conecta seno y coseno en el círculo unitario.'},
  {cat:'trig',name:'Tangente',formula:'tanθ = sinθ/cosθ',note:'No está definida cuando cosθ=0.'},
  {cat:'trig',name:'Ley de senos',formula:'a/sin A = b/sin B = c/sin C',note:'Útil en triángulos no rectángulos.'},
  {cat:'trig',name:'Ley de cosenos',formula:'c²=a²+b²−2ab cos C',note:'Generaliza Pitágoras.'},
  {cat:'calculus',name:'Derivada de una potencia',formula:'d/dx[xⁿ] = n·xⁿ⁻¹',note:'Regla de la potencia.'},
  {cat:'calculus',name:'Derivada de seno',formula:'d/dx[sin x]=cos x',note:'Suponiendo x en radianes.'},
  {cat:'calculus',name:'Derivada de coseno',formula:'d/dx[cos x]=−sin x',note:'Suponiendo x en radianes.'},
  {cat:'calculus',name:'Integral de una potencia',formula:'∫xⁿ dx = xⁿ⁺¹/(n+1)+C',note:'Válida para n≠−1.'}
 ];
 global.Formulas={formulas};
})(window);