// ia.js — análise e recomendação usando Claude (Anthropic API)

async function analisarComIA(ticker, quote, fund, divs) {
  const dyPct = fund.dividend_yield != null ? (fund.dividend_yield * 100).toFixed(2) + '%' : 'N/D';
  const roePct = fund.roe != null ? (fund.roe * 100).toFixed(2) + '%' : 'N/D';
  const margemPct = fund.net_margin != null ? (fund.net_margin * 100).toFixed(2) + '%' : 'N/D';

  const ultimosDivs = (divs || []).slice(0, 5).map(d =>
    `${d.ex_date || d.ex_dividend_date || '—'}: R$ ${Number(d.value || d.amount || 0).toFixed(4)}`
  ).join('\n') || 'Sem dados';

  const prompt = `Você é um analista de investimentos conservador focado no mercado brasileiro (B3).
Analise a ação ${ticker} com base nos dados abaixo e dê uma recomendação objetiva para um investidor conservador que prioriza dividendos e estabilidade.

COTAÇÃO ATUAL:
- Fechamento: R$ ${Number(quote.close).toFixed(2)}
- Abertura: R$ ${Number(quote.open).toFixed(2)}
- Máxima do dia: R$ ${Number(quote.high).toFixed(2)}
- Mínima do dia: R$ ${Number(quote.low).toFixed(2)}
- Volume: ${Number(quote.volume).toLocaleString('pt-BR')}

FUNDAMENTOS:
- P/L: ${fund.pe_ratio ?? 'N/D'}
- P/VP: ${fund.pb_ratio ?? 'N/D'}
- EV/EBITDA: ${fund.ev_ebitda ?? 'N/D'}
- ROE: ${roePct}
- Margem Líquida: ${margemPct}
- Dividend Yield: ${dyPct}
- Dívida/PL: ${fund.debt_to_equity ?? 'N/D'}
- Market Cap: ${fund.market_cap ? 'R$ ' + (fund.market_cap / 1e9).toFixed(1) + ' bi' : 'N/D'}

ÚLTIMOS PROVENTOS:
${ultimosDivs}

Responda APENAS em JSON válido, sem markdown, no formato:
{
  "recomendacao": "COMPRAR" | "AGUARDAR" | "EVITAR",
  "titulo": "frase curta de 5-8 palavras sobre a ação",
  "resumo": "parágrafo de 2-3 frases explicando a recomendação",
  "pontos": ["ponto positivo ou negativo 1", "ponto 2", "ponto 3"],
  "preco_teto": número ou null,
  "dy_projetado": "ex: 8.5% ao ano" ou null
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) throw new Error('Erro na API de IA');
  const data = await res.json();
  const text = data.content.map(b => b.text || '').join('');
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
