// ui.js — helpers de renderização

function fmt(n, dec = 2) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function pct(n) {
  if (n == null || isNaN(n)) return '—';
  const v = Number(n) * 100;
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
}

function varColor(n) {
  if (n == null) return '';
  return Number(n) >= 0 ? 'pos' : 'neg';
}

function loading(el) {
  el.innerHTML = '<div class="loading">⏳ Carregando...</div>';
}

function erro(el, msg) {
  el.innerHTML = `<div class="error-msg">⚠️ ${msg}</div>`;
}

function renderCards(items) {
  return `<div class="cards-grid">${items.map(i => `
    <div class="card">
      <div class="label">${i.label}</div>
      <div class="value ${i.cls || ''}">${i.value}</div>
      ${i.sub ? `<div class="sub">${i.sub}</div>` : ''}
    </div>`).join('')}</div>`;
}

function renderTabela(cols, rows) {
  return `<div class="table-box"><table>
    <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

function renderRecomendacao(ia) {
  const cls = ia.recomendacao === 'COMPRAR' ? 'comprar'
            : ia.recomendacao === 'AGUARDAR' ? 'aguardar' : 'evitar';
  const pontos = (ia.pontos || []).map(p => `<div class="rec-ponto">${p}</div>`).join('');
  const extras = [];
  if (ia.preco_teto) extras.push(`<div class="card"><div class="label">Preço teto</div><div class="value">R$ ${fmt(ia.preco_teto)}</div></div>`);
  if (ia.dy_projetado) extras.push(`<div class="card"><div class="label">DY projetado</div><div class="value pos">${ia.dy_projetado}</div></div>`);

  return `<div class="rec-box ${cls}">
    <div class="rec-header">
      <span class="rec-badge">${ia.recomendacao}</span>
      <span class="rec-title">${ia.titulo}</span>
    </div>
    <div class="rec-body">${ia.resumo}</div>
    <div class="rec-pontos">${pontos}</div>
  </div>
  ${extras.length ? `<div class="cards-grid" style="max-width:320px">${extras.join('')}</div>` : ''}`;
}

let chartInstance = null;

function renderGrafico(canvasId, labels, datasets, tipo = 'line') {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  const ctx = document.getElementById(canvasId).getContext('2d');
  chartInstance = new Chart(ctx, {
    type: tipo,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: datasets.length > 1, labels: { color: '#8b92a8', font: { size: 11 } } },
        tooltip: { backgroundColor: '#1e2535', titleColor: '#e8eaf0', bodyColor: '#8b92a8', borderColor: 'rgba(255,255,255,0.07)', borderWidth: 1 }
      },
      scales: {
        x: { ticks: { color: '#555e77', font: { size: 10 }, maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#555e77', font: { size: 10 }, callback: v => 'R$ ' + v.toFixed(2) }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
}

function renderGraficoVolume(canvasId, labels, volumes) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Volume',
        data: volumes,
        backgroundColor: 'rgba(74,158,255,0.3)',
        borderColor: 'rgba(74,158,255,0.6)',
        borderWidth: 1,
        borderRadius: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#555e77', font: { size: 10 }, maxTicksLimit: 8 }, grid: { display: false } },
        y: { ticks: { color: '#555e77', font: { size: 10 }, callback: v => (v/1e6).toFixed(0)+'M' }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
}
