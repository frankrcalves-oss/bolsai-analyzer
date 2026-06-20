// ia.js — Analista CNPI via proxy

async function analisarComIA(ticker, quote, fund, divs, history) {
  const dyPct  = fund.dividend_yield != null ? (fund.dividend_yield * 100).toFixed(2) + '%' : 'N/D';
  const roePct = fund.roe != null ? (fund.roe * 100).toFixed(2) + '%' : 'N/D';
  const mgPct  = fund.net_margin != null ? (fund.net_margin * 100).toFixed(2) + '%' : 'N/D';

  const ultimosDivs = (divs || []).slice(0, 6).map(d =>
    `${d.ex_date || d.ex_dividend_date || '-'}: R$${Number(d.value || d.amount || 0).toFixed(4)}`
  ).join(', ') || 'N/D';

  const prompt = `Analise a ação ${ticker} da B3 como um Analista CNPI Sênior.

DADOS:
Preço: R$${Number(quote.close).toFixed(2)} | Máx: R$${Number(quote.high).toFixed(2)} | Mín: R$${Number(quote.low).toFixed(2)}
P/L: ${fund.pe_ratio ?? 'N/D'} | P/VP: ${fund.pb_ratio ?? 'N/D'} | ROE: ${roePct} | DY: ${dyPct}
Market Cap: ${fund.market_cap ? 'R$' + (fund.market_cap/1e9).toFixed(1) + 'bi' : 'N/D'}
Dividendos: ${ultimosDivs}

Responda SOMENTE com o JSON abaixo preenchido, sem nenhum texto antes ou depois:
{"resumo_executivo":{"classificacao":"","emoji":"","setor":"","descricao":""},"analise_dividendos":{"dy_atual":"","dy_12m":"","tendencia":"","frequencia":"","ultimo_valor":"","analise":""},"calendario":{"proximo_anuncio":"","data_com":"","data_ex":"","data_pagamento":"","valor_proximo":""},"qualidade_dividendos":{"classificacao":"","payout_ratio":"","fluxo_caixa":"","analise":""},"valuation":{"situacao":"","pl":"","pvp":"","ev_ebitda":"","analise":""},"potencial":{"preco_justo":0,"potencial_alta":"","potencial_baixa":"","cenario_conservador":"","cenario_base":"","cenario_otimista":""},"risco":{"score_geral":0,"endividamento":0,"governanca":0,"commodities":0,"juros":0,"liquidez":0,"analise":""},"score_final":{"pontuacao":0,"estrelas":0,"classificacao":"","dividendos_score":0,"valuation_score":0,"crescimento_score":0,"saude_score":0,"liquidez_score":0,"conclusao":""}}`;

  const res = await fetch('/ia/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) throw new Error(`Erro IA: ${res.status}`);
  const data = await res.json();
  const text = data.content.map(b => b.text || '').join('');

  // Extrai o JSON mesmo se houver texto ao redor
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSON não encontrado na resposta');
  return JSON.parse(match[0]);
}
