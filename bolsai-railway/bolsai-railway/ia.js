// ia.js — Analista CNPI Sênior via Claude API

async function analisarComIA(ticker, quote, fund, divs, history) {
  const dyPct  = fund.dividend_yield != null ? (fund.dividend_yield * 100).toFixed(2) + '%' : 'Dado não disponível';
  const roePct = fund.roe != null ? (fund.roe * 100).toFixed(2) + '%' : 'Dado não disponível';
  const mgPct  = fund.net_margin != null ? (fund.net_margin * 100).toFixed(2) + '%' : 'Dado não disponível';
  const roaPct = fund.roa != null ? (fund.roa * 100).toFixed(2) + '%' : 'Dado não disponível';

  const precos = (history || []).slice(0, 30).map(p =>
    `${p.trade_date}: Abertura R$${p.open} | Máx R$${p.high} | Mín R$${p.low} | Fechamento R$${p.close} | Volume ${p.volume}`
  ).join('\n') || 'Dado não disponível';

  const ultimosDivs = (divs || []).slice(0, 12).map(d =>
    `Tipo: ${d.event_type || d.type || '—'} | Ex-Data: ${d.ex_date || d.ex_dividend_date || '—'} | Pagamento: ${d.payment_date || '—'} | Valor: R$ ${Number(d.value || d.amount || 0).toFixed(4)}`
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

---

Gere o relatório completo em JSON válido, sem markdown, no formato exato abaixo:

{
  "resumo_executivo": {
    "classificacao": "Excelente" | "Boa" | "Evitar",
    "emoji": "🟢" | "🟡" | "🔴",
    "setor": "nome do setor",
    "descricao": "2-3 frases sobre a empresa e seu negócio"
  },
  "analise_dividendos": {
    "dy_atual": "X.XX%",
    "dy_12m": "X.XX% ou Dado não disponível",
    "tendencia": "Crescente" | "Estável" | "Decrescente",
    "frequencia": "Mensal | Trimestral | Semestral | Anual | Irregular",
    "ultimo_valor": "R$ X.XXXX",
    "analise": "parágrafo explicando qualidade dos dividendos"
  },
  "calendario": {
    "proximo_anuncio": "DD/MM/AAAA ou Nenhum dividendo anunciado até o momento",
    "data_com": "DD/MM/AAAA ou —",
    "data_ex": "DD/MM/AAAA ou —",
    "data_pagamento": "DD/MM/AAAA ou —",
    "valor_proximo": "R$ X.XXXX ou —"
  },
  "qualidade_dividendos": {
    "classificacao": "Excelente" | "Boa" | "Regular" | "Fraca",
    "payout_ratio": "XX% ou Dado não disponível",
    "fluxo_caixa": "Positivo | Negativo | Dado não disponível",
    "analise": "parágrafo sobre sustentabilidade dos dividendos"
  },
  "valuation": {
    "situacao": "Subavaliada" | "Justa" | "Sobreavaliada",
    "pl": "X.XX ou Dado não disponível",
    "pvp": "X.XX ou Dado não disponível",
    "ev_ebitda": "X.XX ou Dado não disponível",
    "analise": "parágrafo comparando com média do setor e histórico"
  },
  "potencial": {
    "preco_justo": número ou null,
    "potencial_alta": "XX%",
    "potencial_baixa": "XX%",
    "cenario_conservador": "descrição",
    "cenario_base": "descrição",
    "cenario_otimista": "descrição"
  },
  "risco": {
    "score_geral": número de 0 a 10,
    "endividamento": número de 0 a 10,
    "governanca": número de 0 a 10,
    "commodities": número de 0 a 10,
    "juros": número de 0 a 10,
    "liquidez": número de 0 a 10,
    "analise": "parágrafo sobre os principais riscos"
  },
  "score_final": {
    "pontuacao": número de 0 a 100,
    "estrelas": número de 1 a 5,
    "classificacao": "Compra Forte" | "Compra" | "Manter" | "Evitar" | "Venda",
    "dividendos_score": número de 0 a 30,
    "valuation_score": número de 0 a 25,
    "crescimento_score": número de 0 a 20,
    "saude_score": número de 0 a 15,
    "liquidez_score": número de 0 a 10,
    "conclusao": "parágrafo final em linguagem de gestor profissional de patrimônio"
  }
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) throw new Error('Erro na API de IA');
  const data = await res.json();
  const text = data.content.map(b => b.text || '').join('');
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
