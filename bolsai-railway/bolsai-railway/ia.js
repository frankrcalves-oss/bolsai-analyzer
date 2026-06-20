// ia.js — Analista CNPI Sênior via proxy

async function analisarComIA(ticker, quote, fund, divs, history) {
  const dyPct  = fund.dividend_yield != null ? (fund.dividend_yield * 100).toFixed(2) + '%' : 'N/D';
  const roePct = fund.roe != null ? (fund.roe * 100).toFixed(2) + '%' : 'N/D';
  const mgPct  = fund.net_margin != null ? (fund.net_margin * 100).toFixed(2) + '%' : 'N/D';

  const ultimosDivs = (divs || []).slice(0, 6).map(d =>
    `${d.ex_date || d.ex_dividend_date || '-'}: R$${Number(d.value || d.amount || 0).toFixed(4)}`
  ).join(', ') || 'N/D';

  const prompt = `Você é um Analista CNPI Sênior da B3. Analise ${ticker} e retorne APENAS um JSON válido e completo, sem texto extra.

DADOS:
Preço: R$${Number(quote.close).toFixed(2)} | Máx: R$${Number(quote.high).toFixed(2)} | Mín: R$${Number(quote.low).toFixed(2)} | Volume: ${Number(quote.volume).toLocaleString('pt-BR')}
P/L: ${fund.pe_ratio ?? 'N/D'} | P/VP: ${fund.pb_ratio ?? 'N/D'} | EV/EBITDA: ${fund.ev_ebitda ?? 'N/D'}
ROE: ${roePct} | Margem: ${mgPct} | DY: ${dyPct} | Dívida/PL: ${fund.debt_to_equity ?? 'N/D'}
Market Cap: ${fund.market_cap ? 'R$' + (fund.market_cap/1e9).toFixed(1) + 'bi' : 'N/D'}
Dividendos recentes: ${ultimosDivs}

Retorne exatamente este JSON (substitua os valores, mantenha a estrutura):
{"resumo_executivo":{"classificacao":"Excelente","emoji":"🟢","setor":"Energia","descricao":"Texto de 2 frases."},"analise_dividendos":{"dy_atual":"X%","dy_12m":"X%","tendencia":"Estável","frequencia":"Trimestral","ultimo_valor":"R$0.00","analise":"Texto de 2 frases."},"calendario":{"proximo_anuncio":"Nenhum anunciado","data_com":"-","data_ex":"-","data_pagamento":"-","valor_proximo":"-"},"qualidade_dividendos":{"classificacao":"Boa","payout_ratio":"X%","fluxo_caixa":"Positivo","analise":"Texto de 2 frases."},"valuation":{"situacao":"Justa","pl":"X","pvp":"X","ev_ebitda":"X","analise":"Texto de 2 frases."},"potencial":{"preco_justo":0.00,"potencial_alta":"X%","potencial_baixa":"X%","cenario_conservador":"Texto.","cenario_base":"Texto.","cenario_otimista":"Texto."},"risco":{"score_geral":5,"endividamento":4,"governanca":3,"commodities":7,"juros":3,"liquidez":2,"analise":"Texto de 2 frases."},"score_final":{"pontuacao":75,"estrelas":4,"classificacao":"Compra","dividendos_score":20,"valuation_score":18,"crescimento_score":15,"saude_score":12,"liquidez_score":10,"conclusao":"Texto de 3 frases."}}`;

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
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
