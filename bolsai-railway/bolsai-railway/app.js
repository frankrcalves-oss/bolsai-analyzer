// app.js — lógica principal

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('page-' + btn.dataset.page).classList.add('active');
  });
});

['ticker-analise', 'ticker-hist'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') { id === 'ticker-analise' ? rodarAnalise() : rodarHistorico(); }
  });
});

document.getElementById('btn-analise').addEventListener('click', rodarAnalise);
document.getElementById('btn-hist').addEventListener('click', rodarHistorico);
document.getElementById('btn-screener').addEventListener('click', rodarScreener);
document.getElementById('btn-macro').addEventListener('click', rodarMacro);

carregarUso();

async function carregarUso() {
  try {
    const me = await API.usage();
    const u = me.usage || {};
    document.getElementById('uso-info').textContent = `${u.used_today ?? '—'}/${u.daily_limit ?? '—'} req hoje`;
  } catch (_) {}
}

function estrelas(n) {
  return '⭐'.repeat(n) + '☆'.repeat(5 - n);
}

function barraScore(valor, max, cor) {
  const pct = Math.min(100, (valor / max) * 100);
  return `<div style="background:var(--bg3);border-radius:4px;height:6px;margin-top:4px;">
    <div style="width:${pct}%;height:6px;border-radius:4px;background:${cor};transition:width 0.5s;"></div>
  </div>`;
}

function renderRelatorio(ticker, ia) {
  const recCls = ia.score_final.classificacao === 'Compra Forte' || ia.score_final.classificacao === 'Compra' ? 'comprar'
               : ia.score_final.classificacao === 'Manter' ? 'aguardar' : 'evitar';

  const riscoColor = n => n <= 3 ? 'var(--green)' : n <= 6 ? 'var(--amber)' : 'var(--red)';

  return `
  <div class="ticker-label">${ticker}</div>

  <!-- RESUMO EXECUTIVO -->
  <div class="rel-section">
    <div class="rel-header">${ia.resumo_executivo.emoji} Resumo Executivo</div>
    <div class="cards-grid">
      <div class="card"><div class="label">Classificação</div><div class="value ${recCls === 'comprar' ? 'pos' : recCls === 'aguardar' ? 'neutral' : 'neg'}">${ia.resumo_executivo.classificacao}</div></div>
      <div class="card"><div class="label">Setor</div><div class="value" style="font-size:14px">${ia.resumo_executivo.setor}</div></div>
      <div class="card"><div class="label">Preço Atual</div><div class="value">R$ ${fmt(parseFloat(ia.potencial.preco_justo) ? undefined : undefined) || 'R$ ' + fmt(parseFloat(String(ia.potencial.preco_justo)))}</div></div>
    </div>
    <div class="rel-text">${ia.resumo_executivo.descricao}</div>
  </div>

  <!-- SCORE FINAL -->
  <div class="rec-box ${recCls}" style="margin-bottom:1.25rem">
    <div class="rec-header">
      <span class="rec-badge">${ia.score_final.classificacao}</span>
      <span class="rec-title">${estrelas(ia.score_final.estrelas)} Score: ${ia.score_final.pontuacao}/100</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin:12px 0">
      <div><div style="font-size:11px;color:var(--text3)">Dividendos (30%)</div><div style="font-size:13px;font-weight:500">${ia.score_final.dividendos_score}/30</div>${barraScore(ia.score_final.dividendos_score,30,'var(--green)')}</div>
      <div><div style="font-size:11px;color:var(--text3)">Valuation (25%)</div><div style="font-size:13px;font-weight:500">${ia.score_final.valuation_score}/25</div>${barraScore(ia.score_final.valuation_score,25,'var(--blue)')}</div>
      <div><div style="font-size:11px;color:var(--text3)">Crescimento (20%)</div><div style="font-size:13px;font-weight:500">${ia.score_final.crescimento_score}/20</div>${barraScore(ia.score_final.crescimento_score,20,'var(--amber)')}</div>
      <div><div style="font-size:11px;color:var(--text3)">Saúde Fin. (15%)</div><div style="font-size:13px;font-weight:500">${ia.score_final.saude_score}/15</div>${barraScore(ia.score_final.saude_score,15,'var(--green)')}</div>
      <div><div style="font-size:11px;color:var(--text3)">Liquidez (10%)</div><div style="font-size:13px;font-weight:500">${ia.score_final.liquidez_score}/10</div>${barraScore(ia.score_final.liquidez_score,10,'var(--blue)')}</div>
    </div>
    <div class="rec-body">${ia.score_final.conclusao}</div>
  </div>

  <!-- DIVIDENDOS -->
  <div class="rel-section">
    <div class="rel-header">💰 Análise de Dividendos</div>
    <div class="cards-grid">
      <div class="card"><div class="label">DY Atual</div><div class="value pos">${ia.analise_dividendos.dy_atual}</div></div>
      <div class="card"><div class="label">DY 12 meses</div><div class="value pos">${ia.analise_dividendos.dy_12m}</div></div>
      <div class="card"><div class="label">Tendência</div><div class="value ${ia.analise_dividendos.tendencia === 'Crescente' ? 'pos' : ia.analise_dividendos.tendencia === 'Estável' ? 'neutral' : 'neg'}">${ia.analise_dividendos.tendencia}</div></div>
      <div class="card"><div class="label">Frequência</div><div class="value" style="font-size:14px">${ia.analise_dividendos.frequencia}</div></div>
      <div class="card"><div class="label">Último Valor</div><div class="value pos">${ia.analise_dividendos.ultimo_valor}</div></div>
    </div>
    <div class="rel-text">${ia.analise_dividendos.analise}</div>
  </div>

  <!-- CALENDÁRIO -->
  <div class="rel-section">
    <div class="rel-header">📅 Calendário de Dividendos</div>
    ${renderTabela(
      ['Evento','Data'],
      [
        ['Data COM', ia.calendario.data_com],
        ['Data EX', ia.calendario.data_ex],
        ['Data de Pagamento', ia.calendario.data_pagamento],
        ['Valor por Ação', `<span class="pos">${ia.calendario.valor_proximo}</span>`],
        ['Próximo Anúncio', ia.calendario.proximo_anuncio],
      ]
    )}
  </div>

  <!-- QUALIDADE DIVIDENDOS -->
  <div class="rel-section">
    <div class="rel-header">📊 Qualidade dos Dividendos</div>
    <div class="cards-grid">
      <div class="card"><div class="label">Classificação</div><div class="value ${ia.qualidade_dividendos.classificacao === 'Excelente' || ia.qualidade_dividendos.classificacao === 'Boa' ? 'pos' : 'neg'}">${ia.qualidade_dividendos.classificacao}</div></div>
      <div class="card"><div class="label">Payout Ratio</div><div class="value">${ia.qualidade_dividendos.payout_ratio}</div></div>
      <div class="card"><div class="label">Fluxo de Caixa</div><div class="value ${ia.qualidade_dividendos.fluxo_caixa === 'Positivo' ? 'pos' : 'neg'}">${ia.qualidade_dividendos.fluxo_caixa}</div></div>
    </div>
    <div class="rel-text">${ia.qualidade_dividendos.analise}</div>
  </div>

  <!-- VALUATION -->
  <div class="rel-section">
    <div class="rel-header">📈 Análise de Valuation</div>
    <div class="cards-grid">
      <div class="card"><div class="label">Situação</div><div class="value ${ia.valuation.situacao === 'Subavaliada' ? 'pos' : ia.valuation.situacao === 'Justa' ? 'neutral' : 'neg'}">${ia.valuation.situacao}</div></div>
      <div class="card"><div class="label">P/L</div><div class="value">${ia.valuation.pl}</div></div>
      <div class="card"><div class="label">P/VP</div><div class="value">${ia.valuation.pvp}</div></div>
      <div class="card"><div class="label">EV/EBITDA</div><div class="value">${ia.valuation.ev_ebitda}</div></div>
    </div>
    <div class="rel-text">${ia.valuation.analise}</div>
  </div>

  <!-- POTENCIAL -->
  <div class="rel-section">
    <div class="rel-header">🎯 Potencial de Valorização</div>
    <div class="cards-grid">
      <div class="card"><div class="label">Preço Justo</div><div class="value pos">${ia.potencial.preco_justo ? 'R$ ' + fmt(ia.potencial.preco_justo) : '—'}</div></div>
      <div class="card"><div class="label">Potencial Alta</div><div class="value pos">▲ ${ia.potencial.potencial_alta}</div></div>
      <div class="card"><div class="label">Potencial Baixa</div><div class="value neg">▼ ${ia.potencial.potencial_baixa}</div></div>
    </div>
    ${renderTabela(
      ['Cenário','Descrição'],
      [
        ['🐻 Conservador', ia.potencial.cenario_conservador],
        ['📊 Base', ia.potencial.cenario_base],
        ['🚀 Otimista', ia.potencial.cenario_otimista],
      ]
    )}
  </div>

  <!-- RISCO -->
  <div class="rel-section">
    <div class="rel-header">⚠️ Análise de Risco</div>
    <div class="cards-grid">
      <div class="card"><div class="label">Risk Score Geral</div><div class="value" style="color:${riscoColor(ia.risco.score_geral)}">${ia.risco.score_geral}/10</div></div>
      <div class="card"><div class="label">Endividamento</div><div class="value" style="color:${riscoColor(ia.risco.endividamento)}">${ia.risco.endividamento}/10</div></div>
      <div class="card"><div class="label">Governança</div><div class="value" style="color:${riscoColor(ia.risco.governanca)}">${ia.risco.governanca}/10</div></div>
      <div class="card"><div class="label">Commodities</div><div class="value" style="color:${riscoColor(ia.risco.commodities)}">${ia.risco.commodities}/10</div></div>
      <div class="card"><div class="label">Juros</div><div class="value" style="color:${riscoColor(ia.risco.juros)}">${ia.risco.juros}/10</div></div>
      <div class="card"><div class="label">Liquidez</div><div class="value" style="color:${riscoColor(ia.risco.liquidez)}">${ia.risco.liquidez}/10</div></div>
    </div>
    <div class="rel-text">${ia.risco.analise}</div>
  </div>

  <p style="font-size:11px;color:var(--text3);margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border)">
    ⚠️ Este relatório é gerado por IA com base em dados públicos e não constitui recomendação de investimento. Consulte um assessor financeiro certificado antes de investir.
  </p>`;
}

/* ─── ANÁLISE ─── */
async function rodarAnalise() {
  const ticker = document.getElementById('ticker-analise').value.trim().toUpperCase();
  if (!ticker) return;
  const out = document.getElementById('out-analise');
  loading(out);

  try {
    const [quote, fund, divData, histData] = await Promise.all([
      API.quote(ticker),
      API.fundamentals(ticker).catch(() => ({})),
      API.dividends(ticker).catch(() => ({ dividends: [] })),
      API.history(ticker, 30).catch(() => ({ prices: [] }))
    ]);

    const divs = divData.dividends || divData || [];
    const hist = (histData.prices || []).slice().reverse();

    // Cotação rápida enquanto IA processa
    out.innerHTML = `
      <div class="ticker-label">${ticker}</div>
      ${renderCards([
        { label: 'Fechamento', value: 'R$ ' + fmt(quote.close) },
        { label: 'Abertura',   value: 'R$ ' + fmt(quote.open) },
        { label: 'Máxima',     value: 'R$ ' + fmt(quote.high), cls: 'pos' },
        { label: 'Mínima',     value: 'R$ ' + fmt(quote.low),  cls: 'neg' },
        { label: 'Volume',     value: Number(quote.volume).toLocaleString('pt-BR') },
        { label: 'Negócios',   value: Number(quote.num_trades || 0).toLocaleString('pt-BR') },
      ])}
      <hr class="divider"/>
      <div id="ia-resultado"><div class="loading">🤖 Analisando com IA — gerando relatório profissional completo...</div></div>`;

    try {
      const ia = await analisarComIA(ticker, quote, fund, divs, hist);
      document.getElementById('ia-resultado').innerHTML = renderRelatorio(ticker, ia);
    } catch (e) {
      document.getElementById('ia-resultado').innerHTML =
        `<div class="error-msg">IA indisponível: ${e.message}</div>`;
    }

    carregarUso();
  } catch (e) {
    erro(out, e.message);
  }
}

/* ─── HISTÓRICO ─── */
async function rodarHistorico() {
  const ticker = document.getElementById('ticker-hist').value.trim().toUpperCase();
  const limit  = parseInt(document.getElementById('periodo-hist').value);
  if (!ticker) return;
  const out = document.getElementById('out-hist');
  loading(out);

  try {
    const data   = await API.history(ticker, limit);
    const prices = (data.prices || []).slice().reverse();
    if (!prices.length) { out.innerHTML = '<div class="empty-state">Sem dados de histórico</div>'; return; }

    const labels  = prices.map(p => fmtDate(p.trade_date));
    const closes  = prices.map(p => p.close);
    const volumes = prices.map(p => p.volume);
    const first = closes[0], last = closes[closes.length - 1];
    const var30 = ((last - first) / first * 100);
    const min = Math.min(...prices.map(p => p.low));
    const max = Math.max(...prices.map(p => p.high));

    out.innerHTML = `
      <div class="ticker-label">${ticker}</div>
      ${renderCards([
        { label: 'Último preço',     value: 'R$ ' + fmt(last) },
        { label: 'Variação período', value: (var30>=0?'+':'')+var30.toFixed(2)+'%', cls: var30>=0?'pos':'neg' },
        { label: 'Mínima período',   value: 'R$ ' + fmt(min), cls: 'neg' },
        { label: 'Máxima período',   value: 'R$ ' + fmt(max), cls: 'pos' },
      ])}
      <div class="chart-box">
        <div class="chart-title">Fechamento — últimos ${prices.length} pregões</div>
        <div class="chart-wrap"><canvas id="chart-preco"></canvas></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">Volume negociado</div>
        <div class="chart-wrap" style="height:140px"><canvas id="chart-vol"></canvas></div>
      </div>
      <hr class="divider"/>
      <p class="section-title">Tabela de preços</p>
      ${renderTabela(
        ['Data','Abertura','Máxima','Mínima','Fechamento','Volume'],
        prices.slice(-20).reverse().map(p => [
          fmtDate(p.trade_date),
          'R$ ' + fmt(p.open),
          `<span class="pos">R$ ${fmt(p.high)}</span>`,
          `<span class="neg">R$ ${fmt(p.low)}</span>`,
          'R$ ' + fmt(p.close),
          Number(p.volume).toLocaleString('pt-BR')
        ])
      )}`;

    renderGrafico('chart-preco', labels, [{
      label: 'Fechamento',
      data: closes,
      borderColor: var30 >= 0 ? '#1fca8e' : '#f05252',
      backgroundColor: var30 >= 0 ? 'rgba(31,202,142,0.07)' : 'rgba(240,82,82,0.07)',
      borderWidth: 2, pointRadius: 0, fill: true, tension: 0.3
    }]);
    renderGraficoVolume('chart-vol', labels, volumes);
    carregarUso();
  } catch (e) {
    erro(out, e.message);
  }
}

/* ─── SCREENER ─── */
async function rodarScreener() {
  const out = document.getElementById('out-screener');
  const candidatos = ['PETR4','ITUB4','BBDC4','VALE3','WEGE3','TAEE11','EGIE3','TRPL4','CSMG3','VIVT3','BBSE3','ENGIE3'];
  out.innerHTML = `<div class="loading">🔍 Analisando ${candidatos.length} ações...</div>`;

  try {
    const resultados = [];
    for (const ticker of candidatos) {
      try {
        const [fund, quote] = await Promise.all([
          API.fundamentals(ticker).catch(() => ({})),
          API.quote(ticker)
        ]);
        const dy  = fund.dividend_yield ? fund.dividend_yield * 100 : 0;
        const roe = fund.roe ? fund.roe * 100 : 0;
        const pl  = fund.pe_ratio || 999;
        const pvp = fund.pb_ratio || 999;
        const score = (dy * 3) + (roe * 0.5) + (pl < 20 ? 10 : 0) + (pvp < 3 ? 5 : 0);
        resultados.push({ ticker, close: quote.close, dy, roe, pl, pvp, score });
      } catch (_) {}
    }

    resultados.sort((a, b) => b.score - a.score);
    const top = resultados.slice(0, 8);

    out.innerHTML = `
      <p class="section-title">Top ações para perfil conservador</p>
      <p style="font-size:12px;color:var(--text3);margin-bottom:1rem">Score: dividend yield (30%), ROE (20%), P/L (25%), P/VP (25%)</p>
      ${renderTabela(
        ['#','Ação','Preço','Div. Yield','P/L','P/VP','ROE','Potencial'],
        top.map((r, i) => [
          `<strong>${i+1}</strong>`,
          `<strong>${r.ticker}</strong>`,
          'R$ ' + fmt(r.close),
          r.dy > 5 ? `<span class="pos">${r.dy.toFixed(2)}%</span>` : r.dy.toFixed(2)+'%',
          fmt(r.pl),
          fmt(r.pvp),
          r.roe > 10 ? `<span class="pos">${r.roe.toFixed(1)}%</span>` : r.roe.toFixed(1)+'%',
          r.score > 40 ? `<span class="pos">★ Alto</span>` : r.score > 20 ? `<span class="neutral">Médio</span>` : `<span class="neg">Baixo</span>`
        ])
      )}
      <p style="font-size:11px;color:var(--text3);margin-top:1rem">⚠️ Não é recomendação de investimento. Faça sua própria análise.</p>`;

    carregarUso();
  } catch (e) {
    erro(out, e.message);
  }
}

/* ─── MACRO ─── */
async function rodarMacro() {
  const out = document.getElementById('out-macro');
  loading(out);

  try {
    const [selic, ipca, cdi] = await Promise.all([
      API.macro('selic').catch(() => null),
      API.macro('ipca').catch(() => null),
      API.macro('cdi').catch(() => null),
    ]);

    const ultimo = d => d?.data?.[d.data.length - 1];
    const s = ultimo(selic), ip = ultimo(ipca), c = ultimo(cdi);

    out.innerHTML = `
      <div class="macro-grid">
        <div class="macro-card"><div class="m-label">SELIC</div><div class="m-value pos">${s ? fmt(s.value)+'%' : '—'}</div><div class="m-sub">${s ? fmtDate(s.date) : 'Indisponível'}</div></div>
        <div class="macro-card"><div class="m-label">IPCA</div><div class="m-value neutral">${ip ? fmt(ip.value)+'%' : '—'}</div><div class="m-sub">${ip ? fmtDate(ip.date) : 'Indisponível'}</div></div>
        <div class="macro-card"><div class="m-label">CDI</div><div class="m-value pos">${c ? fmt(c.value)+'%' : '—'}</div><div class="m-sub">${c ? fmtDate(c.date) : 'Indisponível'}</div></div>
      </div>
      ${selic?.data ? `
        <div class="chart-box">
          <div class="chart-title">Histórico SELIC</div>
          <div class="chart-wrap"><canvas id="chart-selic"></canvas></div>
        </div>` : ''}
      <p style="font-size:12px;color:var(--text3);margin-top:1rem">⚠️ Dados via Bolsai API · Fonte: Banco Central do Brasil</p>`;

    if (selic?.data) {
      const pts = selic.data.slice(-24);
      renderGrafico('chart-selic',
        pts.map(p => fmtDate(p.date)),
        [{ label: 'SELIC %', data: pts.map(p => p.value),
           borderColor: '#1fca8e', backgroundColor: 'rgba(31,202,142,0.07)',
           borderWidth: 2, pointRadius: 2, fill: true, tension: 0.3 }]
      );
    }
    carregarUso();
  } catch (e) {
    erro(out, e.message);
  }
}
