// app.js — lógica principal

// Navegação entre páginas
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('page-' + btn.dataset.page).classList.add('active');
  });
});

// Enter nas inputs de ticker
['ticker-analise', 'ticker-hist'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      if (id === 'ticker-analise') rodarAnalise();
      else rodarHistorico();
    }
  });
});

// Botões
document.getElementById('btn-analise').addEventListener('click', rodarAnalise);
document.getElementById('btn-hist').addEventListener('click', rodarHistorico);
document.getElementById('btn-screener').addEventListener('click', rodarScreener);
document.getElementById('btn-macro').addEventListener('click', rodarMacro);

// Carregar uso ao iniciar
carregarUso();

async function carregarUso() {
  try {
    const me = await API.usage();
    const u = me.usage || {};
    document.getElementById('uso-info').textContent =
      `${u.used_today ?? '—'}/${u.daily_limit ?? '—'} req hoje`;
  } catch (_) {}
}

/* ─── ANÁLISE ─── */
async function rodarAnalise() {
  const ticker = document.getElementById('ticker-analise').value.trim().toUpperCase();
  if (!ticker) return;
  const out = document.getElementById('out-analise');
  loading(out);

  try {
    const [quote, fund, divData] = await Promise.all([
      API.quote(ticker),
      API.fundamentals(ticker),
      API.dividends(ticker).catch(() => ({ dividends: [] }))
    ]);

    const divs = divData.dividends || divData || [];

    // Calcular variação estimada
    const varDia = quote.open ? ((quote.close - quote.open) / quote.open) : null;
    const dyPct  = fund.dividend_yield != null ? (fund.dividend_yield * 100).toFixed(2) + '%' : '—';
    const roePct = fund.roe != null ? (fund.roe * 100).toFixed(2) + '%' : '—';
    const mgPct  = fund.net_margin != null ? (fund.net_margin * 100).toFixed(2) + '%' : '—';

    // Últimos dividendos
    const divRows = divs.slice(0, 8).map(d => [
      d.event_type || d.type || '—',
      fmtDate(d.ex_date || d.ex_dividend_date),
      fmtDate(d.payment_date),
      `<span class="pos">R$ ${fmt(d.value || d.amount)}</span>`
    ]);

    // Recomendação IA
    let iaHtml = '<div class="loading">🤖 Analisando com IA...</div>';
    out.innerHTML = `
      <div class="ticker-label">${ticker}</div>
      ${renderCards([
        { label: 'Fechamento',    value: 'R$ ' + fmt(quote.close) },
        { label: 'Abertura',      value: 'R$ ' + fmt(quote.open) },
        { label: 'Máxima',        value: 'R$ ' + fmt(quote.high), cls: 'pos' },
        { label: 'Mínima',        value: 'R$ ' + fmt(quote.low),  cls: 'neg' },
        { label: 'Var. no dia',   value: varDia != null ? (varDia>=0?'+':'')+pct(varDia).replace('+','') : '—', cls: varColor(varDia) },
        { label: 'Volume',        value: Number(quote.volume).toLocaleString('pt-BR'), sub: 'negócios' },
      ])}
      <hr class="divider" />
      <p class="section-title">Fundamentos</p>
      ${renderCards([
        { label: 'P/L',           value: fmt(fund.pe_ratio) },
        { label: 'P/VP',          value: fmt(fund.pb_ratio) },
        { label: 'EV/EBITDA',     value: fmt(fund.ev_ebitda) },
        { label: 'ROE',           value: roePct, cls: fund.roe > 0.1 ? 'pos' : '' },
        { label: 'Margem Líq.',   value: mgPct },
        { label: 'Div. Yield',    value: dyPct, cls: fund.dividend_yield > 0.05 ? 'pos' : '' },
        { label: 'Dívida/PL',     value: fmt(fund.debt_to_equity) },
        { label: 'Market Cap',    value: fund.market_cap ? 'R$ ' + (fund.market_cap/1e9).toFixed(1)+'bi' : '—' },
      ])}
      <hr class="divider" />
      <p class="section-title">Recomendação IA (perfil conservador)</p>
      <div id="ia-resultado">${iaHtml}</div>
      ${divRows.length ? `
        <hr class="divider" />
        <p class="section-title">Histórico de proventos</p>
        ${renderTabela(['Tipo','Ex-Data','Pagamento','Valor'], divRows)}
      ` : ''}`;

    // Chamar IA
    try {
      const ia = await analisarComIA(ticker, quote, fund, divs);
      document.getElementById('ia-resultado').innerHTML = renderRecomendacao(ia);
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
    const highs   = prices.map(p => p.high);
    const lows    = prices.map(p => p.low);
    const volumes = prices.map(p => p.volume);

    const first = closes[0], last = closes[closes.length - 1];
    const var30 = ((last - first) / first * 100);
    const min   = Math.min(...lows);
    const max   = Math.max(...highs);

    out.innerHTML = `
      <div class="ticker-label">${ticker}</div>
      ${renderCards([
        { label: 'Último preço',  value: 'R$ ' + fmt(last) },
        { label: 'Variação período', value: (var30>=0?'+':'')+var30.toFixed(2)+'%', cls: var30>=0?'pos':'neg' },
        { label: 'Mínima período', value: 'R$ ' + fmt(min), cls: 'neg' },
        { label: 'Máxima período', value: 'R$ ' + fmt(max), cls: 'pos' },
      ])}
      <div class="chart-box">
        <div class="chart-title">Fechamento — últimos ${prices.length} pregões</div>
        <div class="chart-wrap"><canvas id="chart-preco"></canvas></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">Volume negociado</div>
        <div class="chart-wrap" style="height:140px"><canvas id="chart-vol"></canvas></div>
      </div>
      <hr class="divider" />
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
  loading(out);

  // Tickers blue chips conservadores para análise
  const candidatos = ['PETR4','ITUB4','BBDC4','VALE3','WEGE3','TAEE11','EGIE3','TRPL4','CSMG3','VIVT3','BBSE3','ENGIE3'];

  try {
    out.innerHTML = `<div class="loading">🔍 Analisando ${candidatos.length} ações...</div>`;
    const resultados = [];

    for (const ticker of candidatos) {
      try {
        const fund = await API.fundamentals(ticker);
        const quote = await API.quote(ticker);
        const dy = fund.dividend_yield ? fund.dividend_yield * 100 : 0;
        const roe = fund.roe ? fund.roe * 100 : 0;
        const pl = fund.pe_ratio || 999;
        const pvp = fund.pb_ratio || 999;
        // Score conservador: DY alto, P/L razoável, ROE positivo
        const score = (dy * 3) + (roe * 0.5) + (pl < 20 ? 10 : 0) + (pvp < 3 ? 5 : 0);
        resultados.push({ ticker, close: quote.close, dy, roe, pl, pvp, score, fund });
      } catch (_) {}
    }

    resultados.sort((a, b) => b.score - a.score);
    const top = resultados.slice(0, 8);

    const rows = top.map((r, i) => [
      `<strong>${i+1}. ${r.ticker}</strong>`,
      'R$ ' + fmt(r.close),
      r.dy > 5 ? `<span class="pos">${r.dy.toFixed(2)}%</span>` : r.dy.toFixed(2) + '%',
      fmt(r.pl),
      fmt(r.pvp),
      r.roe > 10 ? `<span class="pos">${r.roe.toFixed(1)}%</span>` : r.roe.toFixed(1) + '%',
      r.score > 40 ? `<span class="pos">★ Alto</span>` : r.score > 20 ? `<span class="neutral">Médio</span>` : `<span class="neg">Baixo</span>`
    ]);

    out.innerHTML = `
      <p class="section-title">Top ações para perfil conservador</p>
      <p style="font-size:12px; color:var(--text3); margin-bottom:1rem;">Score baseado em dividend yield, ROE, P/L e P/VP</p>
      ${renderTabela(['Ação','Preço','Div. Yield','P/L','P/VP','ROE','Potencial'], rows)}
      <p style="font-size:11px; color:var(--text3); margin-top:1rem;">⚠️ Isto não é recomendação de investimento. Faça sua própria análise.</p>`;

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

    const ultimo = (d) => d?.data?.[d.data.length - 1];
    const selicAtual = ultimo(selic);
    const ipcaAtual  = ultimo(ipca);
    const cdiAtual   = ultimo(cdi);

    out.innerHTML = `
      <div class="macro-grid">
        <div class="macro-card">
          <div class="m-label">SELIC</div>
          <div class="m-value pos">${selicAtual ? fmt(selicAtual.value) + '%' : '—'}</div>
          <div class="m-sub">${selicAtual ? fmtDate(selicAtual.date) : 'Indisponível'}</div>
        </div>
        <div class="macro-card">
          <div class="m-label">IPCA</div>
          <div class="m-value neutral">${ipcaAtual ? fmt(ipcaAtual.value) + '%' : '—'}</div>
          <div class="m-sub">${ipcaAtual ? fmtDate(ipcaAtual.date) : 'Indisponível'}</div>
        </div>
        <div class="macro-card">
          <div class="m-label">CDI</div>
          <div class="m-value pos">${cdiAtual ? fmt(cdiAtual.value) + '%' : '—'}</div>
          <div class="m-sub">${cdiAtual ? fmtDate(cdiAtual.date) : 'Indisponível'}</div>
        </div>
      </div>
      ${selic?.data ? `
        <div class="chart-box">
          <div class="chart-title">Histórico SELIC</div>
          <div class="chart-wrap"><canvas id="chart-selic"></canvas></div>
        </div>` : ''}
      <p style="font-size:12px; color:var(--text3); margin-top:1rem;">⚠️ Dados via Bolsai API · Fonte: Banco Central do Brasil</p>`;

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
