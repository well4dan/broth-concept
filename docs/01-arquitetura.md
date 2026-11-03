# FASE 2 - ARQUITETURA, DESIGN SYSTEM E SEGURANÇA (BROTH CONCEPT)

## 1. Classificação e Direção de Design
- **Perfil:** `S2 + S3` (Negócio local com atelier físico em Londrina + Catálogo e-commerce) combinado com `P1` (Gestão de vitrine, banners, cupons e sacola de compras).
- **Design Read:** *"Reading this as: High-fashion avant-garde e-commerce & lookbook for LGBT+ community, stage artists, and fashion-forward consumers, with an Editorial Luxury & Botanical Dark Couture language, leaning toward custom semantic CSS tokens + GSAP/ScrollTrigger + Lenis fluid choreography."*
- **Direção Estética:** `high-end-visual-design` (Arquétipo *Editorial Luxury* em paleta Botânica Escura + Layout *The Editorial Split* & *The Asymmetrical Bento*).
- **Dials:** `DESIGN_VARIANCE: 8` · `MOTION_INTENSITY: 7` · `VISUAL_DENSITY: 3` (Vitrine) / `VISUAL_DENSITY: 6` (Painel Admin).

## 2. Sistema de Tokens (`css/tokens.css`)
Extraídos diretamente da logo oficial do Instagram `@brothconcept`:
- `--bg-primary`: `#111710` (Botanical Obsidian - nunca `#000000` puro)
- `--bg-elevated`: `#182117` (Deep Leaf Green)
- `--bg-card`: `#1E291C` (Canopy Surface)
- `--bg-glass`: `rgba(24, 33, 23, 0.78)` (usado exclusivamente no header fixo e modais)
- `--text-primary`: `#EBF0E8` (Mineral Mist - contraste 13.8:1 sobre `--bg-primary`, AAA)
- `--text-secondary`: `#B6C4B2` (Sage Mist - contraste 7.9:1 sobre `--bg-primary`, AAA)
- `--text-muted`: `#8A9B86` (contraste 4.8:1, AA)
- `--accent`: `#6E9968` (Botanical Emerald - acento único travado em toda a aplicação)
- `--accent-bright`: `#8AB883` (hover/foco visível)
- `--border-subtle`: `rgba(235, 240, 232, 0.11)`
- `--border-strong`: `rgba(235, 240, 232, 0.24)`
- `--radius-shell`: `2rem` (`32px` - Double-Bezel externo)
- `--radius-core`: `calc(2rem - 0.375rem)` (`26px` - Double-Bezel interno)
- `--radius-pill`: `9999px` (Botões interativos com ícone aninhado)
- `--ease-out`: `cubic-bezier(0.16, 1, 0.3, 1)`
- `--ease-luxury`: `cubic-bezier(0.32, 0.72, 0, 1)`

## 3. Arquitetura de Dados (Catálogo, Banners, Cupons e Sacola)
Módulo central `js/store.js` com validação estrita de tipos e sanitização:
- **`products[]`:** `{ id, code, name, category, price, promoPrice, description, sizes[], badge, imageWebp, imageJpg, featured, active }`
- **`banners`:**
  - `topBar`: `{ active, text, couponCode }`
  - `promoBanner`: `{ active, eyebrow, title, description, ctaText, couponCode, discountLabel, imageWebp, imageJpg }`
- **`coupons[]`:** `{ code, type ('percent' | 'fixed'), value, minOrder, description, active }`
- **`orders[]`:** `{ id, createdAt, customerName, customerWhatsapp, deliveryType, paymentMethod, items[], subtotal, discount, couponUsed, total }`

## 4. Plano de Motion e Interatividade
- **Scroll Suave & Coreografia:** Motor em `js/motion.js` usando `IntersectionObserver` e interpolação com `requestAnimationFrame` + suporte a GSAP/Lenis, animando exclusivamente `transform` e `opacity`.
- **Fallback Obrigatório (`prefers-reduced-motion: reduce`):** Desativa transições de deslocamento, marquee contínuo e parallax, exibindo todo o conteúdo instantaneamente.
- **Cards Interativos (`js/cards.js`):** Efeito Spotlight radial via variáveis CSS `--mx` e `--my` + micro-inclinação 3D em dispositivos com ponteiro fino (`pointer: fine`), com estado `:focus-visible` equivalente para navegação por teclado.

## 5. Segurança Web e SEO Técnico
- **Cabeçalhos HTTP (`vercel.json`, `_headers`, `.htaccess`):** `Content-Security-Policy` sem `unsafe-eval`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy`.
- **Prevenção de XSS:** Toda renderização dinâmica do catálogo, cupons e sacola usa criação segura de nós DOM (`document.createElement` e `textContent`), zero `innerHTML` com dados externos.
- **Pacote de Descoberta na Raiz:** `robots.txt`, `sitemap.xml`, `llms.txt`, `site.webmanifest`, `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `og-image.jpg`, `404.html`.
