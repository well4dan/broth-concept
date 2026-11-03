# FASE 1 - BRIEFING E PROJETO (BROTH CONCEPT)

## 1. Negócio e Objetivo
- **Marca:** Broth Concept (`@brothconcept`) - *"Moda by Creative BROTHers"*.
- **Atuação:** Estúdio e marca autoral que desenha, modela, fabrica e vende roupas conceituais e looks sob medida voltados para o público LGBT+, artistas de palco, performers e pessoas que buscam moda agênero de expressão forte.
- **Localização Física (Atelier):** Espaço `@casacriou` - R. Ibiporã, 720 - Aurora, Londrina - PR, CEP 86060-510.
- **Contato Oficial:** WhatsApp `+55 (43) 98834-1414` (`https://wa.me/5543988341414`).
- **Objetivo Mensurável:** Converter visitantes do Instagram e buscas orgânicas em vendas diretas na vitrine e-commerce (com cálculo de cupom e pedido integrado) e agendamentos de projetos sob medida para artistas e eventos.

## 2. Público-Alvo e Atores
- **Cliente Comprador (LGBT+, Artistas, Performers, Criativos):** Busca peças autorais com caimento impecável, transparências em renda guipure, malha metálica (mesh), alfaiataria wide-leg desconstruída e acessórios de correntes que não existem no varejo tradicional.
- **Cliente Sob Medida (Palco / Shows / Editorial):** Precisa encomendar figurinos exclusivos com envio de medidas ou prova presencial no atelier em Londrina.
- **Administrador da Loja (Creative BROTHers):** Gerencia o catálogo da vitrine (cadastra peças, código SKU, descrição, preço, preço promocional, categoria, tamanhos e foto), publica banners promocionais de campanha e cria/ativa cupons de desconto.

## 3. Oferta e Diferenciais Verificáveis
- **Criação e Fabricação Própria:** Do croqui à costura final no atelier em Londrina.
- **Coleção Conceitual Pronta-Entrega & Série Limitada:** Peças catalogadas por código (ex.: `BC-001` a `BC-009`).
- **Looks Sob Medida:** Ajustados exatamente às medidas corporais de cada cliente ou artista, sem restrição de gênero.

## 4. Mapa de Seções da Vitrine (`index.html`)
1. **Top Promo Bar Dinâmica:** Faixa de campanha com cupom copiável em 1 clique (sincronizada com o Admin).
2. **Header Fluid Island:** Navegação flutuante em vidro escuro botânico com logo vetorial, links, alternador de tema, atalho para o Painel Admin e botão da Sacola com contador ao vivo.
3. **Hero Editorial Split:** Headline curta de 2 linhas, proposta clara, 1 CTA primário (*Explorar Vitrine*) + 1 CTA secundário (*Sob Medida*), e tríptico com fotos reais do editorial da marca em moldura *Double-Bezel*.
4. **Marquee Único de Manifesto:** Faixa tipográfica contínua destacando criação própria, moda sem gênero e atelier em Londrina.
5. **Vitrine E-commerce Interativa:** Filtros por coleção (*Todas*, *Palco & Glam*, *Alfaiataria*, *Renda & Mesh*, *Sob Medida*), busca por nome ou código da peça (`BC-001`...), ordenação por preço e grid de produtos com seleção de tamanho, visualização rápida em modal e adição à sacola.
6. **Banner de Promoção Editorial:** Seção de campanha configurável pelo Painel Admin com aplicação direta de cupom na sacola.
7. **O Atelier & Processo Sob Medida (Bento Assimétrico):** 4 blocos detalhando desenho autoral, modelagem agênero, materiais nobres e atendimento em Londrina / envio nacional.
8. **Lookbook Editorial:** Apresentação das 3 séries fotográficas reais da marca (*Neon Glam*, *Alfaiataria & Correntes*, *Noir Lace & Mesh*).
9. **FAQ Objetivo:** Perguntas reais sobre prazos de peças sob medida, tabela de medidas, envios, trocas e uso de cupons.
10. **Rodapé Completo:** Endereço em Londrina (NAP consistente), WhatsApp, Instagram, links rápidos e acesso ao Painel Admin.

## 5. Regras de Negócio Testáveis (E-commerce + Admin)
1. **RN-01 (Código Único e Preço):** Toda peça da vitrine possui código SKU obrigatório (ex.: `BC-001`), nome, descrição, categoria e preço em reais (`> 0`). Se houver preço promocional válido (`< preço original`), a vitrine exibe o desconto automaticamente.
2. **RN-02 (Sincronização Admin -> Vitrine):** Qualquer peça adicionada, editada ou ocultada no Painel Admin (`admin.html`), bem como banners e cupons, reflete imediatamente na vitrine (`index.html`) via armazenamento estruturado e canal de sincronização (`BroadcastChannel` + `storage`).
3. **RN-03 (Motor de Cupons de Desconto):** Um cupom só é aplicado se estiver com status `Ativo` e se o subtotal da sacola atingir o `Valor Mínimo` configurado no cupom. O desconto percentual (`%`) ou fixo (`R$`) nunca pode resultar em total negativo.
4. **RN-04 (Segurança de Dados e LGPD):** Nenhum dado sensível de cartão é armazenado; o checkout valida campos apenas após interação (`:user-invalid`), possui proteção anti-bot (honeypot) e exige ciência da Política de Privacidade.
