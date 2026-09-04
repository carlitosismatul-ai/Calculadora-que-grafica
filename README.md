# Calculadora-que-grafica
## Descripción

Desarrollar una calculadora matemática capaz de **resolver y graficar diferentes tipos de funciones**, mostrando los resultados de manera clara e interactiva.

El proyecto será desarrollado utilizando **HTML, CSS y JavaScript**, trabajando desde **Visual Studio Code** y utilizando **Git/GitHub** para el control de versiones y trabajo colaborativo.

---

##  Objetivo

Crear una aplicación web que permita al usuario ingresar una función matemática, seleccionar su tipo y obtener:

* ✅ Procedimiento o resolución de la función.
* ✅ Resultado matemático.
* ✅ Gráfica de la función.
* ✅ Valores importantes de la función cuando corresponda.
* ✅ Interfaz sencilla y fácil de utilizar.
* ✅ Validación de los datos ingresados.

---

#  Tipos de funciones

La calculadora debe trabajar, como mínimo, con los siguientes tipos:

### 1.  Funciones lineales

Forma general:

`f(x) = mx + b`

Debe permitir:

* Ingresar `m` y `b`.
* Calcular la función.
* Encontrar la pendiente.
* Encontrar la intersección con el eje Y.
* Encontrar la raíz/intersección con el eje X.
* Graficar la recta.

**Ejemplo:**

`f(x) = 2x + 3`

---

### 2.  Funciones cuadráticas

Forma general:

`f(x) = ax² + bx + c`

Debe permitir:

* Ingresar `a`, `b` y `c`.
* Calcular las raíces.
* Calcular el discriminante.
* Encontrar el vértice.
* Encontrar el eje de simetría.
* Determinar si la parábola abre hacia arriba o hacia abajo.
* Graficar la función.

**Ejemplo:**

`f(x) = x² - 4x + 3`

---

### 3. Funciones polinomiales

Ejemplo:

`f(x) = x³ - 2x² + x - 5`

Debe permitir:

* Ingresar polinomios de diferentes grados.
* Evaluar la función.
* Buscar/calcular raíces cuando sea posible.
* Mostrar información relevante.
* Graficar el polinomio.

Se debe procurar que el sistema soporte polinomios de distintos grados.

---

### 4. ➗ Funciones racionales

Forma general:

`f(x) = P(x) / Q(x)`

Debe permitir:

* Ingresar numerador y denominador.
* Evaluar la función.
* Detectar valores donde el denominador sea cero.
* Identificar restricciones del dominio.
* Mostrar asíntotas cuando sea posible.
* Graficar la función.

**Ejemplo:**

`f(x) = (x + 1) / (x - 2)`

---

### 5.  Funciones trigonométricas

Debe incluir funciones como:

* `sin(x)`
* `cos(x)`
* `tan(x)`

Debe permitir:

* Ingresar la función.
* Evaluar valores.
* Trabajar correctamente con ángulos.
* Mostrar características importantes.
* Graficar la función.
* Considerar el comportamiento periódico.
* Mostrar correctamente las discontinuidades de funciones como `tan(x)`.

**Ejemplos:**

`f(x) = sin(x)`

`f(x) = cos(x)`

`f(x) = tan(x)`

---

# Gráficas

La calculadora debe contar con un sistema de gráficas que permita visualizar las funciones.

La gráfica debería incluir:

* Eje X.
* Eje Y.
* Escala.
* Cuadrícula.
* Nombre o expresión de la función.
* Zoom cuando sea posible.
* Valores positivos y negativos.
* Manejo correcto de discontinuidades.

Se puede utilizar una biblioteca de JavaScript para facilitar la generación de gráficas.

---

# Sistema de resolución

La aplicación no debe limitarse a mostrar únicamente el resultado.

Cuando sea posible, debe mostrar el **procedimiento matemático**, por ejemplo:

```text
f(x) = 2x + 4

2x + 4 = 0

2x = -4

x = -2
```

La cantidad de procedimiento dependerá del tipo de función.

---

#  Interfaz

La interfaz debe ser:

* Moderna.
* Intuitiva.
* Responsive.
* Fácil de utilizar.
* Compatible con computadora y celular.


#  Resultado esperado

Al finalizar, tendremos una **calculadora matemática web completa** capaz de resolver y representar gráficamente:

**Lineales → Cuadráticas → Polinomiales → Racionales → Trigonométricas**

con una interfaz sencilla, resultados matemáticos y representación gráfica.
