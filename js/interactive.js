/* =========================================================
   Interactive — interpolación de Lagrange para reconstruir
   la función a partir de puntos de control arrastrables
   ========================================================= */
(function (global) {
  // Evalúa el polinomio de Lagrange que pasa exactamente por 'points' en x
  function lagrangeAt(points, x) {
    let total = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      let term = points[i].y;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        term *= (x - points[j].x) / (points[i].x - points[j].x);
      }
      total += term;
    }
    return total;
  }

  // Expande el polinomio de Lagrange a coeficientes [c0, c1, c2, ...] (c0 + c1 x + c2 x^2 ...)
  function lagrangeCoefficients(points) {
    const n = points.length;
    let coeffs = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      // construye el polinomio base L_i(x) como arreglo de coeficientes
      let base = [1];
      let denom = 1;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        denom *= (points[i].x - points[j].x);
        // multiplica base por (x - xj)
        const next = new Array(base.length + 1).fill(0);
        for (let k = 0; k < base.length; k++) {
          next[k] += base[k] * (-points[j].x);
          next[k + 1] += base[k];
        }
        base = next;
      }
      const scale = points[i].y / denom;
      for (let k = 0; k < base.length; k++) coeffs[k] += base[k] * scale;
    }
    return coeffs; // índice = grado
  }

  function coeffsToString(coeffs, precision = 3) {
    const round = (v) => {
      const r = Math.round(v * 10 ** precision) / 10 ** precision;
      return Object.is(r, -0) ? 0 : r;
    };
    let parts = [];
    for (let deg = coeffs.length - 1; deg >= 0; deg--) {
      const c = round(coeffs[deg]);
      if (Math.abs(c) < 10 ** -precision) continue;
      const absC = Math.abs(c);
      const coefStr = absC === 1 && deg > 0 ? '' : `${absC}`;
      let term;
      if (deg === 0) term = `${absC}`;
      else if (deg === 1) term = `${coefStr}x`;
      else term = `${coefStr}x^${deg}`;
      parts.push({ c, term });
    }
    if (!parts.length) return '0';
    let out = (parts[0].c < 0 ? '-' : '') + parts[0].term;
    for (let i = 1; i < parts.length; i++) {
      out += (parts[i].c < 0 ? ' - ' : ' + ') + parts[i].term;
    }
    return out;
  }

  global.Interactive = { lagrangeAt, lagrangeCoefficients, coeffsToString };
})(window);
