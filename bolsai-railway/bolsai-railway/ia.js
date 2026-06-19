// ia.js — Analista CNPI Sênior (chamada via proxy local)

async function analisarComIA(ticker, quote, fund, divs, history) {
  const dyPct  = fund.dividend_yield != null ? (fund.dividend_yield * 100).toFixed(2) + '%' : 'Dado não disponível';
  const roePct = fund.roe != null ? (fund.roe * 100).toFixed(2) + '%' : 'Dado não disponível';
  const mgPct  = fund.net_margin != null ? (fund.net_margin * 100).toFixed(2) + '%' : 'Dado não disponível';
  const roaPct = fund.roa != null ? (fund.roa * 100).toFixed(2) + '%' : 'Dado não disponível';

  const precos = (history || []).slice(0, 30).map(p =>
    `${p.trade_date}: Abertura R$${p.open} | Máx R$${p.high} | Mín R$${p.low} | Fechamento R$${p.close} | Volume ${p.volume}`
  ).join('\n') || 'Dado não disponível';

  const ultimosDivs = (divs || []).slice(0, 12).map(d =>
    `Tipo: ${d.event_type || d.type || '-'} | Ex-Data: ${d.ex_date || d.ex_dividend_date || '-'} | Pagamento: ${d.payment_date || '-'} | Valor: R$ ${Number(d.value || d.amount || 0).toFixed(4)}`
  ).join('\n') || 'Dado não disponível';

  const prompt = `Você é um Analista CNPI Sênior especializado em Dividend Investing, Value Investing e Small Caps da Bolsa Brasileira (B3). Produza um relatório profissional completo para um cliente com patrimônio acima de R$ 5 milhões.

DADOS DO ATIVO ${ticker}:

COTAÇÃO ATUAL:
- Fechamento: R$ ${Number(quote.close).toFixed(2)}
- Abertura: R$ ${Number(quote.open).toFixed(2)}
- Máxima do dia: R$ ${Number(quote.high).toFixed(2)}
- Mínima do dia: R$ ${Number(quote.low).toFixed(2)}
- Volume: ${Number(quote.volume).toLocaleString('pt-BR')}
- Negócios: ${Number(quote.num_trades || 0).toLocaleString('pt-BR')}

FUNDAMENTOS:
- P/L: ${fund.pe_ratio ?? 'Dado não disponível'}
- P/VP: ${fund.pb_ratio ?? 'Dado não disponível'}
- EV/EBITDA: ${fund.ev_ebitda ?? 'Dado não disponível'}
- ROE: ${roePct}
- ROA: ${roaPct}
- Margem Líquida: ${mgPct}
- Dividend Yield: ${dyPct}
- Dívida/PL: ${fund.debt_to_equity ?? 'Dado não disponível'}
- Market Cap: ${fund.market_cap ? 'R$ ' + (fund.market_cap / 1e9).toFixed(2) + ' bilhões' : 'Dado não disponível'}

HISTÓRICO DE PREÇOS (últimos 30 pregões):
${precos}

HISTÓRICO DE PROVENTOS (últimos 12):
${ultimosDivs}

Gere o relatório em JSON válido, sem markdown:

{
  "resumo_executivo": {
    "classificacao": "Excelente",
    "emoji": "🟢",
    "setor": "nome do setor",
    "descricao": "2-3 frases sobre a empresa"
  },
  "analise_dividendos": {
    "dy_atual": "X.XX%",
    "dy_12m": "X.XX%",
    "tendencia": "Crescente",
    "frequencia": "Trimestral",
    "ultimo_valor": "R$ X.XXXX",
    "analise": "paragrafo sobre dividendos"
  },
  "calendario": {
    "proximo_anuncio": "Nenhum dividendo anunciado até o momento",
    "data_com": "-",
    "data_ex": "-",
    "data_pagamento": "-",
    "valor_proximo": "-"
  },
  "qualidade_dividendos": {
    "classificacao": "Boa",
    "payout_ratio": "XX%",
    "fluxo_caixa": "Positivo",
    "analise": "paragrafo sobre sustentabilidade"
  },
  "valuation": {
    "situacao": "Justa",
    "pl": "X.XX",
    "pvp": "X.XX",
    "ev_ebitda": "X.XX",
    "analise": "paragrafo sobre valuation"
  },
  "potencial": {
    "preco_justo": 45.00,
    "potencial_alta": "XX%",
    "potencial_baixa": "XX%",
    "cenario_conservador": "descricao",
    "cenario_base": "descricao",
    "cenario_otimista": "descricao"
  },
  "risco": {
    "score_geral": 4,
    "endividamento": 3,
    "governanca": 4,
    "commodities": 7,
    "juros": 3,
    "liquidez": 2,
    "analise": "paragrafo sobre riscos"
  },
  "score_final": {
    "pontuacao": 75,
    "estrelas": 4,
    "classificacao": "Compra",
    "dividendos_score": 22,
    "valuation_score": 18,
    "crescimento_score": 15,
    "saude_score": 12,
    "liquidez_score": 8,
    "conclusao": "paragrafo final profissional"
  }
}`;

  // Chamada via proxy local (evita CORS)
  const res = await fetch('/ia/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) throw new Error(`Erro IA: ${res.status}`);
  const data = await res.json();
  const text = data.content.map(b => b.text || '').join('');
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
