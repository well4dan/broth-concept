# Plano de Implementação - Broth Concept E-commerce & Admin

**Perfil:** S2/S3 + P1 - E-commerce autoral com atelier local e painel administrativo · **Direção de design:** `high-end-visual-design` · Dials V8/M7/D3 · **Hospedagem:** Vercel / Netlify / Cloudflare Pages

## Resumo
Criar a identidade visual vetorizada/HD da Broth Concept, a vitrine e-commerce de alta-costura nas cores botânicas da logo do Instagram (usando as 9 fotos reais extraídas do perfil `@brothconcept`) e o Painel Admin completo para gerenciamento de peças (descrição, código SKU, preço), banners promocionais e cupons de desconto.

## Etapas
| # | Etapa | Objetivo | Arquivos | Depende de | Pronto quando | Risco | Reverter |
|---|---|---|---|---|---|---|---|
| 1 | Identidade Visual HD & Vetores | Recriar a logo em SVG vetorial (5 versões) e PNG HD/4K (5 versões) + extrair as 9 fotos reais do Instagram | `logo/*.svg`, `logo/hd/*.png`, `img/*.webp`, `favicon.*`, `og-image.jpg` | - | Arquivos gerados e nítidos na pasta `logo/` e `img/` | baixo | regenerar via script |
| 2 | Base + Segurança + SEO Raiz | Configurar cabeçalhos HTTP, `robots.txt`, `sitemap.xml`, `llms.txt`, `site.webmanifest`, `404.html` e `politica-de-privacidade.html` | arquivos de raiz e configs | 1 | Todos os 9 arquivos de raiz e cabeçalhos presentes | baixo | remover arquivos |
| 3 | Design System & CSS | Criar tokens botânicos da marca, tipografia fluida, Double-Bezel, botões pílula, modais `<dialog>` e layout responsivo | `css/tokens.css`, `css/base.css`, `css/layout.css`, `css/components.css` | 2 | Contraste AA/AAA, zero scroll horizontal em 360px | baixo | reverter CSS |
| 4 | Camada de Dados, Motion e Interação | Implementar `store.js` (catálogo inicial real, banners, cupons, sacola), `motion.js`, `cards.js`, `main.js` e `admin.js` | `js/store.js`, `js/motion.js`, `js/cards.js`, `js/main.js`, `js/admin.js` | 3 | Sincronização em tempo real entre Admin e Vitrine, zero `innerHTML` inseguro | médio | restaurar estado padrão |
| 5 | Vitrine E-commerce & Painel Admin | Construir `index.html` (Hero, Vitrine com busca/filtros, Banner Promo, Atelier, Lookbook, Sacola com Cupons, Checkout) e `admin.html` | `index.html`, `admin.html` | 4 | Fluxo completo de compra + cadastro de peça/banner/cupom funcionando | médio | revisar HTML |
| 6 | Revisão Adversarial e Auditoria | Rodar `validar_site.py`, inspecionar em navegador real (desktop/mobile/admin) e gerar relatório `docs/03-auditoria.md` | `docs/03-auditoria.md` | 5 | Zero falhas no validador, zero erro de console, Score >= 90 | baixo | corrigir apontamentos |

## Mídia (em paralelo)
- Script de imagens: `docs/script-imagens.md` (12 imagens documentadas)
- Script de vídeo Flow: `docs/script-video-flow.md` (3 cenas para hero e redes)

## Fora desta rodada
- Integração com gateway bancário de produção com chave privada (requer credenciais da conta jurídica do cliente final após aprovação comercial da prévia).
