# iglconsulting-site

Site institucional da **IGL Consulting** — Igor Lachowski.

🔗 **Produção:** https://iglconsulting.com.br

## Stack

HTML e CSS estáticos, sem build e sem dependências. Um único JS inline por página.
As únicas requisições externas são as fontes do Google Fonts.

## Estrutura

| Arquivo | Página |
|---|---|
| `index.html` | Site principal — Sobre, Atuação, Expertise, Trajetória, Gravity, Contato |
| `dati.html` | `/dati` — vitrine dos módulos do Gravity |
| `agendar.html` | `/agendar` — agendamento de reuniões |
| `og-image.png` | Imagem de preview para WhatsApp, LinkedIn e afins |

## Deploy

Vercel, automático a cada push na `main`. Output Directory `./`.
`vercel.json` liga `cleanUrls`, então as URLs não levam `.html`.

> ⚠️ Não existe ambiente de staging: **todo push na `main` vai direto para produção.**

## Desenvolvimento

Não há passo de build — basta abrir o arquivo no navegador:

```bash
start index.html      # Windows
```
