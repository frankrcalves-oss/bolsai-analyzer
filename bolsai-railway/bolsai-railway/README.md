# Bolsai Analyzer

Painel de análise de ações da B3 com IA (Claude).

## Deploy no Railway

1. Crie conta em railway.app
2. Clique em "New Project" → "Deploy from GitHub repo"
3. Faça upload desta pasta ou conecte ao GitHub
4. Adicione a variável de ambiente:
   - Nome: `BOLSAI_API_KEY`
   - Valor: sua chave da Bolsai API
5. Railway detecta o Procfile e sobe automaticamente

## Rodar local

```bash
BOLSAI_API_KEY=sua_chave python proxy.py
```

## Estrutura

- `proxy.py` — servidor + proxy da API
- `api.js` — chamadas à API
- `ia.js` — análise via Claude AI
- `app.js` — lógica das páginas
- `style.css` — visual dark mode
- `index.html` — interface
