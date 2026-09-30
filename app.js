/* Eduquest — Laboratorio Matemático Inmersivo
   Aplicación de funciones y derivadas para grado 10.
   Compatible con GitHub Pages: inicialización segura y sin eval().
*/
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function showToast(message) {
    const toast = $('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    clearTimeout(window.__eduquestToast);
    window.__eduquestToast = setTimeout(() => {
      toast.style.display = 'none';
    }, 2600);
  }

  function go(id) {
    if (!id) return;
    qsa('section').forEach(section => {
      section.classList.toggle('active', section.id === id);
    });
    qsa('nav button').forEach(button => {
      button.classList.toggle('active', button.dataset.go === id);
    });
    const menu = $('contentMenu');
    if (menu) menu.value = id;
    const sidebar = $('sidebar');
    if (sidebar) sidebar.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function compile(expr) {
    const text = String(expr || '').trim();
    if (!text) return null;
    if (typeof window.math === 'undefined') {
      throw new Error('La biblioteca matemática todavía no está disponible. Recarga la página.');
    }
    const forbidden = /[;{}\[\]<>]|\bimport\b|\bfunction\b|\bprocess\b|\bwindow\b|\bdocument\b/i;
    if (forbidden.test(text)) throw new Error('Expresión no permitida. Usa una expresión matemática como x^2, sin(x) o 1/x.');
    return window.math.compile(text);
  }

  function evaluateCompiled(compiled, x) {
    try {
      const value = compiled.evaluate({ x });
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    } catch (_) {
      return null;
    }
  }

  function values(expr, xs) {
    const compiled = compile(expr);
    return xs.map(x => evaluateCompiled(compiled, x));
  }

  function derivative(expr, x) {
    const d = window.math.derivative(expr, 'x');
    const value = d.evaluate({ x });
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('La derivada no está definida en ese punto.');
    }
    return value;
  }

  function numericDerivative(expr, x, h = 0.0001) {
    const compiled = compile(expr);
    const plus = evaluateCompiled(compiled, x + h);
    const minus = evaluateCompiled(compiled, x - h);
    if (plus === null || minus === null) return null;
    return (plus - minus) / (2 * h);
  }

  function roots(expr, a, b, n = 700) {
    const compiled = compile(expr);
    const result = [];
    let previousX = a;
    let previousY = evaluateCompiled(compiled, previousX);

    for (let i = 1; i <= n; i++) {
      const x = a + (b - a) * i / n;
      const y = evaluateCompiled(compiled, x);

      if (y !== null && Math.abs(y) < 1e-7) {
        result.push(x);
      }

      if (previousY !== null && y !== null && previousY * y < 0) {
        let lo = previousX;
        let hi = x;
        let flo = previousY;

        for (let k = 0; k < 45; k++) {
          const mid = (lo + hi) / 2;
          const fmid = evaluateCompiled(compiled, mid);
          if (fmid === null) break;
          if (flo * fmid <= 0) {
            hi = mid;
          } else {
            lo = mid;
            flo = fmid;
          }
        }
        result.push((lo + hi) / 2);
      }

      previousX = x;
      previousY = y;
    }

    const unique = [];
    for (const value of result) {
      if (!Number.isFinite(value)) continue;
      if (!unique.some(v => Math.abs(v - value) < 1e-3)) unique.push(value);
    }
    return unique.slice(0, 10).map(v => fmt(v));
  }

  function fmt(value) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
    return Number(value).toFixed(5).replace(/\.?0+$/, '');
  }

  let lastData = [];

  function renderTable(expr, xs) {
    const table = $('table');
    if (!table) return;
    const ys = values(expr, xs);
    table.innerHTML = '<table><thead><tr><th>x</th><th>f(x)</th><th>f′(x) aprox.</th></tr></thead><tbody>' +
      xs.map((x, i) => {
        const numeric = ys[i] === null ? null : numericDerivative(expr, x);
        return `<tr><td>${fmt(x)}</td><td>${fmt(ys[i])}</td><td>${fmt(numeric)}</td></tr>`;
      }).join('') +
      '</tbody></table>';
  }

  function graph() {
    try {
      if (typeof window.Plotly === 'undefined' || typeof window.math === 'undefined') {
        throw new Error('Plotly o math.js todavía no está disponible. Espera un momento y vuelve a intentar.');
      }

      const inputIds = ['f1', 'f2', 'f3'];
      const exprs = inputIds.map(id => $(id)?.value.trim()).filter(Boolean);
      if (!exprs.length) throw new Error('Escribe al menos una función para graficar.');

      const xmin = Number($('xmin')?.value ?? -10);
      const xmax = Number($('xmax')?.value ?? 10);
      const requestedSamples = Number($('samples')?.value ?? 300);
      const samples = Math.min(1000, Math.max(50, Math.floor(requestedSamples)));
      if (!(xmin < xmax)) throw new Error('El intervalo debe ser válido: xmin debe ser menor que xmax.');

      exprs.forEach(expr => compile(expr));

      const xs = Array.from({ length: samples }, (_, i) => xmin + (xmax - xmin) * i / (samples - 1));
      const traces = [];
      const allValues = [];

      exprs.forEach((expr, index) => {
        const y = values(expr, xs);
        const dy = xs.map((x, i) => i === 0 ? null : numericDerivative(expr, x));
        allValues.push(y);
        traces.push({
          x: xs,
          y,
          name: `f${index + 1}(x)`,
          mode: 'lines',
          connectgaps: false
        });
        traces.push({
          x: xs,
          y: dy,
          name: `f′${index + 1}(x)`,
          mode: 'lines',
          connectgaps: false,
          line: { dash: 'dot' }
        });
      });

      const tangentSelect = $('tangentFn');
      const tangentIndex = Math.max(0, Math.min(exprs.length - 1, Number(tangentSelect?.value || 1) - 1));
      const tangentExpr = exprs[tangentIndex];
      const x0 = Number($('x0')?.value ?? 0);
      const y0 = window.math.evaluate(tangentExpr, { x: x0 });
      const slope = derivative(tangentExpr, x0);
      const intercept = y0 - slope * x0;

      if (Number.isFinite(y0) && Number.isFinite(slope)) {
        const tangentX = Array.from({ length: 180 }, (_, i) => xmin + (xmax - xmin) * i / 179);
        traces.push({
          x: tangentX,
          y: tangentX.map(x => slope * x + intercept),
          name: 'Tangente',
          mode: 'lines',
          line: { dash: 'dash', width: 3 }
        });
      }

      const plot = $('plot');
      if (!plot) return;

      window.Plotly.newPlot(plot, traces, {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { color: '#f7fbff' },
        hovermode: 'x unified',
        margin: { t: 30, r: 20, b: 50, l: 55 },
        xaxis: { gridcolor: '#1d3a59', zerolinecolor: '#567' },
        yaxis: { gridcolor: '#1d3a59', zerolinecolor: '#567' },
        legend: { orientation: 'h' }
      }, {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
      });

      const metrics = $('metrics');
      if (metrics) {
        metrics.innerHTML = exprs.map((expr, index) => {
          const f = window.math.evaluate(expr, { x: x0 });
          let d = null;
          try { d = derivative(expr, x0); } catch (_) { d = null; }
          return `<div class="metric"><b>f${index + 1}</b><br>f(${fmt(x0)}) = ${fmt(f)}<br>f′(${fmt(x0)}) = ${fmt(d)}</div>`;
        }).join('');
      }

      const rootsBox = $('roots');
      if (rootsBox) {
        rootsBox.innerHTML = exprs.map((expr, index) => {
          const found = roots(expr, xmin, xmax);
          return `f${index + 1}: ${found.length ? found.join(', ') : 'sin raíces aproximadas'}`;
        }).join('<br>');
      }

      const rangeBox = $('range');
      if (rangeBox) {
        rangeBox.innerHTML = exprs.map((expr, index) => {
          const finite = allValues[index].filter(v => v !== null && Number.isFinite(v));
          if (!finite.length) return `f${index + 1}: no hay valores finitos en el intervalo`;
          return `f${index + 1}: [${fmt(Math.min(...finite))}, ${fmt(Math.max(...finite))}]`;
        }).join('<br>');
      }

      const tableXs = xs.slice(0, Math.min(40, xs.length));
      lastData = tableXs.map((x, i) => ({ x, f1: allValues[0][i] }));
      renderTable(exprs[0], tableXs);
      showToast('Gráfica actualizada');
    } catch (error) {
      showToast(error?.message || 'No se pudo interpretar la expresión.');
    }
  }

  function numericRoots(expr, a, b, n = 1000) {
    const compiled = compile(expr);
    const result = [];
    const xs = Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
    const ys = xs.map(x => evaluateCompiled(compiled, x));

    const add = value => {
      if (!Number.isFinite(value) || value < a - 1e-6 || value > b + 1e-6) return;
      const clamped = Math.max(a, Math.min(b, value));
      if (!result.some(v => Math.abs(v - clamped) < Math.max(1e-4, (b - a) / n * 1.5))) result.push(clamped);
    };

    // Raíces con cambio de signo.
    for (let i = 1; i <= n; i++) {
      const y1 = ys[i - 1], y2 = ys[i];
      if (y1 === null || y2 === null) continue;
      if (Math.abs(y1) < 1e-9) add(xs[i - 1]);
      if (y1 * y2 < 0) {
        let lo = xs[i - 1], hi = xs[i], flo = y1;
        for (let k = 0; k < 50; k++) {
          const mid = (lo + hi) / 2;
          const fm = evaluateCompiled(compiled, mid);
          if (fm === null) break;
          if (Math.abs(fm) < 1e-10) { lo = hi = mid; break; }
          if (flo * fm <= 0) hi = mid;
          else { lo = mid; flo = fm; }
        }
        add((lo + hi) / 2);
      }
    }

    // Raíces que tocan el eje sin cambiar de signo (por ejemplo x² en x=0).
    const finiteAbs = ys.filter(y => y !== null).map(Math.abs);
    const scale = Math.max(1, ...finiteAbs);
    const tolerance = Math.max(1e-6, scale * 1e-4);
    for (let i = 1; i < n; i++) {
      if (ys[i - 1] === null || ys[i] === null || ys[i + 1] === null) continue;
      const ay = Math.abs(ys[i]);
      if (ay <= Math.abs(ys[i - 1]) && ay <= Math.abs(ys[i + 1]) && ay < tolerance) {
        let x = xs[i];
        for (let k = 0; k < 12; k++) {
          const fx = evaluateCompiled(compiled, x);
          const h = Math.max(1e-5, Math.abs(b - a) * 1e-6);
          const fp = evaluateCompiled(compiled, x + h);
          const fm = evaluateCompiled(compiled, x - h);
          if (fx === null || fp === null || fm === null) break;
          const slope = (fp - fm) / (2 * h);
          if (!Number.isFinite(slope) || Math.abs(slope) < 1e-12) break;
          const next = x - fx / slope;
          if (!Number.isFinite(next) || next < a || next > b) break;
          if (Math.abs(next - x) < 1e-8) { x = next; break; }
          x = next;
        }
        if (Math.abs(evaluateCompiled(compiled, x) ?? Infinity) < tolerance * 2) add(x);
      }
    }
    return result.sort((x, y) => x - y).slice(0, 30);
  }

  function derivativeExpression(expr, order = 1) {
    let node = window.math.parse(expr);
    for (let i = 0; i < order; i++) node = window.math.derivative(node, 'x');
    return node;
  }

  function trigModule() {
    const out = $('trigOut');
    try {
      const expr = $('trigExpr')?.value.trim();
      const x0 = Number($('trigX')?.value ?? 0);
      if (!expr) throw new Error('Escribe una función trigonométrica.');
      compile(expr);
      const d = window.math.derivative(expr, 'x');
      const value = d.evaluate({ x: x0 });
      const fValue = window.math.evaluate(expr, { x: x0 });
      if (out) out.innerHTML = `<b>f(x)</b> = ${expr}<br><b>f′(x)</b> = ${d.toString()}<br><b>En x₀ = ${fmt(x0)}</b>: f(x₀) = ${fmt(fValue)} y f′(x₀) = ${fmt(value)}`;

      const plot = $('trigPlot');
      if (plot && typeof window.Plotly !== 'undefined') {
        const xs = Array.from({ length: 500 }, (_, i) => -2 * Math.PI + 4 * Math.PI * i / 499);
        window.Plotly.newPlot(plot, [
          { x: xs, y: values(expr, xs), name: 'f(x)', mode: 'lines' },
          { x: xs, y: xs.map(x => { try { return d.evaluate({ x }); } catch (_) { return null; } }), name: 'f′(x)', mode: 'lines', line: { dash: 'dot' } },
          { x: [x0], y: [fValue], name: 'Punto x₀', mode: 'markers', marker: { size: 10 } }
        ], { paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#f7fbff' }, margin: { t: 30, r: 20, b: 50, l: 55 }, xaxis: { gridcolor: '#1d3a59' }, yaxis: { gridcolor: '#1d3a59' }, legend: { orientation: 'h' } }, { responsive: true, displaylogo: false });
      }
    } catch (error) {
      if (out) out.textContent = error?.message || 'No se pudo calcular la derivada trigonométrica.';
    }
  }

  function chainModule() {
    const out = $('chainOut');
    try {
      const expr = $('chainExpr')?.value.trim();
      const x0 = Number($('chainX')?.value ?? 0);
      if (!expr) throw new Error('Escribe una función compuesta.');
      compile(expr);
      const d = window.math.derivative(expr, 'x');
      const fValue = window.math.evaluate(expr, { x: x0 });
      const dValue = d.evaluate({ x: x0 });
      if (out) out.innerHTML = `<b>f(x)</b> = ${expr}<br><b>f′(x)</b> = ${d.toString()}<br><b>En x₀ = ${fmt(x0)}</b>: f(x₀) = ${fmt(fValue)} y f′(x₀) = ${fmt(dValue)}<br><br><span class="muted">La derivación simbólica aplica las reglas necesarias de composición; en funciones compuestas, esto corresponde a la regla de la cadena.</span>`;
    } catch (error) {
      if (out) out.textContent = error?.message || 'No se pudo aplicar la regla de la cadena.';
    }
  }

  function analysisModule() {
    const criticalOut = $('criticalOut');
    const extremaOut = $('extremaOut');
    const inflectionOut = $('inflectionOut');
    const summary = $('analysisSummary');
    try {
      const expr = $('analysisExpr')?.value.trim();
      const a = Number($('analysisMin')?.value ?? -4);
      const b = Number($('analysisMax')?.value ?? 4);
      const n = Math.min(2000, Math.max(100, Number($('analysisSamples')?.value ?? 800)));
      if (!expr) throw new Error('Escribe una función.');
      if (!(a < b)) throw new Error('El intervalo debe cumplir x mínimo < x máximo.');
      compile(expr);

      const d1 = derivativeExpression(expr, 1);
      const d2 = derivativeExpression(expr, 2);
      const d1s = d1.toString();
      const d2s = d2.toString();
      const critical = numericRoots(d1s, a, b, n);
      const inflections = numericRoots(d2s, a, b, n).filter(x => {
        const delta = Math.max(1e-4, (b - a) * 0.002);
        const left = evaluateCompiled(compile(d2s), x - delta);
        const right = evaluateCompiled(compile(d2s), x + delta);
        return left !== null && right !== null && left * right < 0;
      });

      const extrema = [];
      const criticalRows = [];
      for (const x of critical) {
        const fx = evaluateCompiled(compile(expr), x);
        const delta = Math.max(1e-4, (b - a) * 0.002);
        const left = evaluateCompiled(compile(d1s), x - delta);
        const right = evaluateCompiled(compile(d1s), x + delta);
        let type = 'Punto crítico (clasificación no concluyente)';
        if (left !== null && right !== null) {
          if (left > 0 && right < 0) type = 'Máximo local';
          else if (left < 0 && right > 0) type = 'Mínimo local';
        }
        criticalRows.push(`x = ${fmt(x)}, f(x) = ${fmt(fx)} → ${type}`);
        if (type.includes('Máximo') || type.includes('Mínimo')) extrema.push(`(${fmt(x)}, ${fmt(fx)}) → ${type}`);
      }

      if (criticalOut) criticalOut.innerHTML = criticalRows.length ? criticalRows.join('<br>') : 'No se detectaron puntos críticos en el intervalo.';
      if (extremaOut) extremaOut.innerHTML = extrema.length ? extrema.join('<br>') : 'No se clasificaron máximos o mínimos locales en el intervalo.';
      if (inflectionOut) inflectionOut.innerHTML = inflections.length ? inflections.map(x => `(${fmt(x)}, ${fmt(evaluateCompiled(compile(expr), x))}) → cambio de concavidad`).join('<br>') : 'No se detectaron puntos de inflexión por cambio de concavidad en el intervalo.';
      if (summary) summary.innerHTML = `<div class="metric"><b>f′(x)</b><br>${d1s}</div><div class="metric"><b>f″(x)</b><br>${d2s}</div><div class="metric"><b>Resultados</b><br>${critical.length} críticos · ${extrema.length} extremos · ${inflections.length} inflexiones</div>`;

      const plot = $('analysisPlot');
      if (plot && typeof window.Plotly !== 'undefined') {
        const xs = Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
        const ys = values(expr, xs);
        const criticalY = critical.map(x => evaluateCompiled(compile(expr), x));
        const inflY = inflections.map(x => evaluateCompiled(compile(expr), x));
        window.Plotly.newPlot(plot, [
          { x: xs, y: ys, name: 'f(x)', mode: 'lines' },
          { x: critical, y: criticalY, name: 'Puntos críticos', mode: 'markers', marker: { size: 10, symbol: 'diamond' } },
          { x: inflections, y: inflY, name: 'Puntos de inflexión', mode: 'markers', marker: { size: 10, symbol: 'x' } }
        ], { paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#f7fbff' }, hovermode: 'x unified', margin: { t: 30, r: 20, b: 50, l: 55 }, xaxis: { gridcolor: '#1d3a59', zerolinecolor: '#567' }, yaxis: { gridcolor: '#1d3a59', zerolinecolor: '#567' }, legend: { orientation: 'h' } }, { responsive: true, displaylogo: false });
      }
      showToast('Análisis completado');
    } catch (error) {
      if (criticalOut) criticalOut.textContent = error?.message || 'No se pudo analizar la función.';
      if (extremaOut) extremaOut.textContent = '—';
      if (inflectionOut) inflectionOut.textContent = '—';
      if (summary) summary.innerHTML = '';
    }
  }

  function rule(uId, vId, outputId, quotient) {
    const output = $(outputId);
    try {
      const u = $(uId)?.value.trim();
      const v = $(vId)?.value.trim();
      if (!u || !v) throw new Error('Completa ambas funciones.');
      compile(u);
      compile(v);
      const du = window.math.derivative(u, 'x').toString();
      const dv = window.math.derivative(v, 'x').toString();
      if (quotient) {
        output.textContent = `u′ = ${du}, v′ = ${dv}\n(u/v)′ = [(${du})(${v}) − (${u})(${dv})] / (${v})²`;
      } else {
        output.textContent = `u′ = ${du}, v′ = ${dv}\n(u·v)′ = (${du})(${v}) + (${u})(${dv})`;
      }
    } catch (error) {
      if (output) output.textContent = error?.message || 'No se pudo calcular la regla.';
    }
  }

  function tangentModule() {
    try {
      if (typeof window.Plotly === 'undefined' || typeof window.math === 'undefined') {
        throw new Error('Las bibliotecas matemáticas todavía no están disponibles.');
      }
      const expr = $('tanF')?.value.trim();
      const x0 = Number($('tanX')?.value ?? 0);
      const h = Math.abs(Number($('h')?.value ?? 0.0001));
      if (!expr) throw new Error('Escribe una función.');
      if (!(h > 0)) throw new Error('h debe ser mayor que 0.');
      compile(expr);

      const y0 = window.math.evaluate(expr, { x: x0 });
      const slope = numericDerivative(expr, x0, h);
      if (!Number.isFinite(y0) || slope === null) throw new Error('No se puede calcular la tangente en ese punto.');

      const a = x0 - 5;
      const b = x0 + 5;
      const x = Array.from({ length: 180 }, (_, i) => a + (b - a) * i / 179);
      const y = values(expr, x);
      const tangentY = x.map(z => y0 + slope * (z - x0));
      const plot = $('tanPlot');

      if (plot) {
        window.Plotly.newPlot(plot, [
          { x, y, name: 'f(x)', mode: 'lines', connectgaps: false },
          { x, y: tangentY, name: 'Tangente', mode: 'lines', line: { dash: 'dash', width: 3 } },
          { x: [x0], y: [y0], mode: 'markers', name: 'x₀' }
        ], {
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { color: '#fff' },
          margin: { t: 30, r: 20, b: 50, l: 55 },
          xaxis: { gridcolor: '#1d3a59' },
          yaxis: { gridcolor: '#1d3a59' }
        }, { responsive: true, displaylogo: false });
      }

      const info = $('tanInfo');
      if (info) {
        info.textContent = `f(${fmt(x0)}) = ${fmt(y0)}\nf′(${fmt(x0)}) ≈ ${fmt(slope)}\ny − ${fmt(y0)} = ${fmt(slope)}(x − ${fmt(x0)})`;
      }
    } catch (error) {
      showToast(error?.message || 'No se pudo calcular la tangente.');
    }
  }

  function lessonData() {
    return {
      title: $('lessonTitle')?.value.trim() || '',
      level: $('lessonLevel')?.value.trim() || '',
      time: $('lessonTime')?.value.trim() || '',
      obj: $('lessonObj')?.value.trim() || '',
      q: $('lessonQ')?.value.trim() || '',
      e: $('lessonE')?.value.trim() || ''
    };
  }

  function escHTML(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[char]));
  }

  function renderLesson(data) {
    const output = $('lessonOutput');
    if (!output) return;
    output.innerHTML = `
      <h3>${escHTML(data.title)}</h3>
      <p><b>Nivel educativo:</b> ${escHTML(data.level || 'Grado décimo')} · <b>Duración:</b> ${escHTML(data.time || 'Por definir')}</p>
      <div class="step"><strong>1. Observar.</strong> Analiza gráficas de f(x) y f′(x). Identifica dónde aumenta, disminuye o cambia la pendiente.</div>
      <div class="step"><strong>2. Calcular.</strong> ${escHTML(data.obj)}</div>
      <div class="step"><strong>3. Explicar.</strong> Responde y argumenta: ${escHTML(data.q)}</div>
      <div class="step"><strong>4. Transferir.</strong> Presenta como evidencia: ${escHTML(data.e)}</div>
      <hr>
      <h3>Rúbrica · 100 puntos</h3>
      <div class="rubric">
        <div><span>Exactitud matemática</span><b>35</b></div>
        <div><span>Argumentación</span><b>30</b></div>
        <div><span>Diseño XR</span><b>20</b></div>
        <div><span>Inclusión</span><b>15</b></div>
        <div class="rubric-total"><span>Total</span><b>100</b></div>
      </div>`;
  }

  function generateLesson() {
    const data = lessonData();
    const status = $('lessonStatus');
    if (!data.title || !data.obj || !data.q || !data.e) {
      if (status) status.textContent = 'Completa título, objetivo didáctico, pregunta retadora y evidencia de aprendizaje.';
      return false;
    }
    renderLesson(data);
    if (status) status.textContent = 'Secuencia didáctica generada correctamente.';
    return true;
  }

  function saveLesson() {
    localStorage.setItem('eduquestLesson', JSON.stringify(lessonData()));
    const status = $('lessonStatus');
    if (status) status.textContent = 'Proyecto guardado en este dispositivo.';
    showToast('Proyecto guardado');
  }

  async function copyLesson() {
    const output = $('lessonOutput');
    if (!output) return;
    if (!output.innerText.trim() || output.innerText.includes('Aquí aparecerá')) {
      if (!generateLesson()) return;
    }
    const text = output.innerText.trim();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      const status = $('lessonStatus');
      if (status) status.textContent = 'Guion copiado al portapapeles.';
      showToast('Guion copiado');
    } catch (_) {
      const status = $('lessonStatus');
      if (status) status.textContent = 'No fue posible copiar automáticamente; selecciona el texto del guion.';
    }
  }

  function exportLesson() {
    const payload = {
      app: 'Eduquest',
      type: 'secuencia-didactica',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: lessonData()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'eduquest-secuencia-didactica.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    showToast('JSON exportado');
  }

  function importLesson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const data = payload.data || payload;
        $('lessonTitle').value = data.title || '';
        $('lessonLevel').value = data.level || '';
        $('lessonTime').value = data.time || '';
        $('lessonObj').value = data.obj || '';
        $('lessonQ').value = data.q || '';
        $('lessonE').value = data.e || '';
        if (!generateLesson()) throw new Error('Faltan campos obligatorios.');
        const status = $('lessonStatus');
        if (status) status.textContent = 'Proyecto JSON importado correctamente.';
      } catch (_) {
        const status = $('lessonStatus');
        if (status) status.textContent = 'El archivo JSON no es válido o está incompleto.';
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  function restoreLesson() {
    try {
      const saved = localStorage.getItem('eduquestLesson');
      if (!saved) return;
      const data = JSON.parse(saved);
      if (!data || typeof data !== 'object') return;
      if ($('lessonTitle')) $('lessonTitle').value = data.title || '';
      if ($('lessonLevel')) $('lessonLevel').value = data.level || '';
      if ($('lessonTime')) $('lessonTime').value = data.time || '';
      if ($('lessonObj')) $('lessonObj').value = data.obj || '';
      if ($('lessonQ')) $('lessonQ').value = data.q || '';
      if ($('lessonE')) $('lessonE').value = data.e || '';
      if (data.title && data.obj && data.q && data.e) renderLesson(data);
    } catch (_) {
      localStorage.removeItem('eduquestLesson');
    }
  }

  function setupWelcomeScreen() {
    const overlay = $('welcomeOverlay');
    const welcomeImage = $('welcomeImage');
    const coverImage = qs('.cover-image');
    const startButton = $('startLab');
    if (!overlay || !welcomeImage || !coverImage) return;

    // Reutiliza la misma imagen que ya usa la portada del laboratorio.
    welcomeImage.src = coverImage.currentSrc || coverImage.src;
    document.documentElement.style.setProperty(
      '--welcome-bg',
      `url("${welcomeImage.src.replace(/"/g, '\\"')}")`
    );
    document.body.classList.add('welcome-open');

    const enter = () => {
      overlay.classList.add('is-hidden');
      document.body.classList.remove('welcome-open');

      // Al entrar, deja visible la portada principal de Eduquest.
      // Desde allí el usuario puede elegir el contenido del laboratorio.
      go('inicio');

      window.setTimeout(() => {
        overlay.remove();
      }, 650);
    };

    startButton?.addEventListener('click', enter, { once:true });
  }

  function bindEvents() {
    document.addEventListener('click', event => {
      const button = event.target.closest('[data-go]');
      if (button) go(button.dataset.go);
    });

    $('contentMenu')?.addEventListener('change', event => go(event.target.value));
    $('hamb')?.addEventListener('click', () => $('sidebar')?.classList.toggle('open'));
    $('contrast')?.addEventListener('click', () => document.body.classList.toggle('hiContrast'));

    $('graphBtn')?.addEventListener('click', graph);
    $('pngBtn')?.addEventListener('click', () => {
      if (typeof window.Plotly === 'undefined') return showToast('Plotly no está disponible.');
      const plot = $('plot');
      if (!plot || !plot.data) return showToast('Primero genera una gráfica.');
      window.Plotly.downloadImage(plot, { format: 'png', filename: 'eduquest-derivadas', width: 1400, height: 800 });
    });
    $('csvBtn')?.addEventListener('click', () => {
      if (!lastData.length) return showToast('Primero genera una gráfica.');
      const rows = [['x', 'f1'], ...lastData.map(row => [row.x, row.f1 ?? ''])];
      const csv = rows.map(row => row.join(',')).join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'eduquest-valores.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    });
    $('speakBtn')?.addEventListener('click', () => {
      if (!('speechSynthesis' in window)) return showToast('La síntesis de voz no está disponible en este navegador.');
      const text = `${$('metrics')?.innerText || ''} ${$('roots')?.innerText || ''}`.trim();
      if (!text) return showToast('Primero genera una gráfica.');
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    });

    $('prodBtn')?.addEventListener('click', () => rule('prodU', 'prodV', 'prodOut', false));
    $('quotBtn')?.addEventListener('click', () => rule('quotU', 'quotV', 'quotOut', true));
    $('trigBtn')?.addEventListener('click', trigModule);
    $('chainBtn')?.addEventListener('click', chainModule);
    $('analysisBtn')?.addEventListener('click', analysisModule);
    $('tanBtn')?.addEventListener('click', tangentModule);

    $('genLesson')?.addEventListener('click', generateLesson);
    $('saveLesson')?.addEventListener('click', saveLesson);
    $('copyLesson')?.addEventListener('click', copyLesson);
    $('exportLesson')?.addEventListener('click', exportLesson);
    $('importLesson')?.addEventListener('change', importLesson);
  }

  async function waitForLibraries(attempt = 0) {
    if (typeof window.math !== 'undefined' && typeof window.Plotly !== 'undefined') return true;
    if (attempt >= 30) return false;
    await wait(100);
    return waitForLibraries(attempt + 1);
  }

  async function init() {
    setupWelcomeScreen();
    bindEvents();
    restoreLesson();

    const ready = await waitForLibraries();
    if (!ready) {
      showToast('No se pudieron cargar Plotly y math.js. Revisa tu conexión a internet.');
      return;
    }

    // Genera una gráfica inicial solo si existe una función escrita.
    if ($('f1')?.value.trim()) graph();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
