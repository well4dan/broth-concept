/**
 * Storefront Application - Broth Concept Luxury E-Commerce
 * Interatividade completa: Catalogo, Busca, PDP com Zoom e Frete, Sacola, Checkout, Conta, Rastreio e Concierge.
 */

import {
  h,
  clear,
  icon,
  qs,
  qsa,
  money,
  dateBR,
  maskCep,
  maskPhone,
  maskCpf,
  maskCard,
  maskExp,
  cardBrand,
  luhn,
  toast,
  stars,
  prefersReducedMotion,
  params,
  openModal
} from './core.js';

import {
  getState,
  subscribe,
  getProducts,
  getProductById,
  getEffectivePrice,
  getProductImages,
  getProductRating,
  getProductStockTotal,
  markViewed,
  getRecentlyViewed,
  toggleWishlist,
  isWishlisted,
  addToCart,
  updateCartQty,
  removeFromCart,
  applyCoupon,
  getCartSummary,
  lookupCep,
  calculateFreightOptions,
  selectShippingQuote,
  addReview,
  addQuestion,
  loginCustomer,
  logoutCustomer,
  createOrder,
  findOrder,
  createSupportTicket,
  subscribeNewsletter,
  acceptCookies
} from './store.js';

/* Filter State */
const filterState = {
  q: '',
  category: 'all',
  subcategory: 'all',
  line: 'all',
  maxPrice: 1000,
  onlyInStock: false,
  sort: 'featured'
};

let heroSlideIndex = 0;
let heroTimer = null;

function initSmoothScroll() {
  if (prefersReducedMotion() || typeof window.Lenis !== 'function') return;
  try {
    const lenis = new window.Lenis({
      duration: 1.15,
      smoothWheel: true
    });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  } catch (_) {
    /* fallback nativo */
  }
}

/* ==========================================================================
   HEADER, ANNOUNCEMENT BAR, SEARCH AUTOCOMPLETE & BREADCRUMBS
   ========================================================================== */

function renderAnnouncementBar() {
  const { banners } = getState();
  const textEl = qs('#announcement-text');
  if (textEl && banners?.topBar?.text) {
    textEl.textContent = banners.topBar.text;
  }
}

function updateHeaderBadges() {
  const state = getState();
  const summary = getCartSummary();
  const cartBadge = qs('#cart-count-badge');
  const wishBadge = qs('#wishlist-count-badge');
  const accountLabel = qs('#account-btn-label');

  if (cartBadge) cartBadge.textContent = String(summary.count);
  if (wishBadge) wishBadge.textContent = String(state.wishlist.length);
  if (accountLabel) {
    accountLabel.textContent = state.customer ? state.customer.name.split(' ')[0] : 'Conta';
  }
}

function updateBreadcrumbs() {
  const list = qs('#breadcrumbs-list');
  if (!list) return;
  clear(list);

  const homeLi = h('li', null, h('a', {
    href: '#topo',
    onClick: (e) => {
      e.preventDefault();
      resetCatalogFilters();
    }
  }, 'Inicio'));
  list.appendChild(homeLi);

  const colLi = h('li', null, h('a', {
    href: '#catalogo',
    onClick: (e) => {
      e.preventDefault();
      resetCatalogFilters();
      qs('#catalogo')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, 'Colecao Autoral'));
  list.appendChild(colLi);

  if (filterState.category !== 'all') {
    const catObj = getState().categories.find((c) => c.slug === filterState.category);
    if (catObj) {
      list.appendChild(
        h('li', { class: filterState.subcategory === 'all' ? 'breadcrumbs-current' : '' }, catObj.name)
      );
      if (filterState.subcategory !== 'all') {
        const subObj = catObj.subs?.find((s) => s.slug === filterState.subcategory);
        if (subObj) {
          list.appendChild(h('li', { class: 'breadcrumbs-current' }, subObj.name));
        }
      }
    }
  } else if (filterState.q) {
    list.appendChild(h('li', { class: 'breadcrumbs-current' }, `Busca: "${filterState.q}"`));
  }
}

function initSearchAutocomplete() {
  const input = qs('#search-input');
  const dropdown = qs('#search-dropdown');
  if (!input || !dropdown) return;

  const renderSuggestions = (query) => {
    clear(dropdown);
    const clean = query.trim().toLowerCase();
    if (!clean) {
      dropdown.hidden = true;
      return;
    }

    const matches = getProducts().filter((p) => {
      const hay = `${p.name} ${p.sku} ${p.line} ${p.category} ${p.short} ${p.description}`.toLowerCase();
      return hay.includes(clean);
    }).slice(0, 5);

    if (!matches.length) {
      dropdown.appendChild(
        h('div', { style: { padding: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' } },
          'Nenhuma peca encontrada. Tente "renda", "casaco", "wide-leg" ou "palco".'
        )
      );
      dropdown.hidden = false;
      return;
    }

    for (const p of matches) {
      const imgs = getProductImages(p);
      const itemBtn = h('button', {
        type: 'button',
        class: 'search-suggestion-item',
        onClick: () => {
          dropdown.hidden = true;
          openProductModal(p.id);
        }
      },
      h('img', {
        src: imgs[0],
        alt: p.name,
        width: '42',
        height: '56',
        class: 'search-suggestion-thumb',
        loading: 'lazy'
      }),
      h('div', { style: { flex: '1' } },
        h('div', { style: { fontSize: '0.7rem', color: 'var(--accent-gold)', letterSpacing: '0.12em', textTransform: 'uppercase' } }, `${p.sku} | ${p.line}`),
        h('div', { style: { fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' } }, p.name),
        h('div', { style: { fontSize: '0.8rem', color: 'var(--text-secondary)' } }, money(getEffectivePrice(p)))
      ));
      dropdown.appendChild(itemBtn);
    }

    const seeAllBtn = h('button', {
      type: 'button',
      class: 'search-suggestion-item',
      style: { justifyContent: 'center', color: 'var(--accent-gold)', fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase' },
      onClick: () => {
        filterState.q = query.trim();
        dropdown.hidden = true;
        renderCatalog();
        updateBreadcrumbs();
        qs('#catalogo')?.scrollIntoView({ behavior: 'smooth' });
      }
    }, `Filtrar vitrine por "${query.trim()}"`);
    dropdown.appendChild(seeAllBtn);
    dropdown.hidden = false;
  };

  input.addEventListener('input', (e) => {
    filterState.q = e.target.value;
    renderSuggestions(e.target.value);
    renderCatalog();
    updateBreadcrumbs();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      dropdown.hidden = true;
    }
  });
}

/* ==========================================================================
   HERO SLIDER
   ========================================================================== */

function initHeroSlider() {
  const slides = qsa('.hero-slide');
  const dots = qsa('.slider-dot');
  if (!slides.length) return;

  const setSlide = (idx) => {
    const heroSlides = getState().banners?.heroSlides || [];
    heroSlideIndex = (idx + slides.length) % slides.length;
    slides.forEach((el, i) => el.classList.toggle('is-active', i === heroSlideIndex));
    dots.forEach((el, i) => {
      el.classList.toggle('is-active', i === heroSlideIndex);
      el.setAttribute('aria-selected', i === heroSlideIndex ? 'true' : 'false');
    });

    const data = heroSlides[heroSlideIndex];
    if (data) {
      const eyeEl = qs('#hero-eyebrow');
      const titleEl = qs('#hero-headline');
      const leadEl = qs('#hero-lead');
      const ctaEl = qs('#hero-primary-cta');
      if (eyeEl) eyeEl.textContent = data.eyebrow;
      if (titleEl) titleEl.textContent = data.title;
      if (leadEl) leadEl.textContent = data.text;
      if (ctaEl) ctaEl.textContent = data.cta;
    }
  };

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      setSlide(idx);
      restartHeroTimer();
    });
  });

  const restartHeroTimer = () => {
    if (heroTimer) clearInterval(heroTimer);
    if (!prefersReducedMotion()) {
      heroTimer = setInterval(() => setSlide(heroSlideIndex + 1), 6500);
    }
  };

  restartHeroTimer();
}

/* ==========================================================================
   CATEGORIES, SUBCATEGORIES & FACETED PRODUCT CATALOG
   ========================================================================== */

function resetCatalogFilters() {
  filterState.q = '';
  filterState.category = 'all';
  filterState.subcategory = 'all';
  filterState.line = 'all';
  filterState.maxPrice = 1000;
  filterState.onlyInStock = false;
  filterState.sort = 'featured';
  const searchInput = qs('#search-input');
  if (searchInput) searchInput.value = '';
  syncFilterControls();
  renderCatalog();
  updateBreadcrumbs();
}

function syncFilterControls() {
  qsa('[data-cat-filter]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.catFilter === filterState.category);
  });
  const catSelect = qs('#filter-category');
  const subSelect = qs('#filter-subcategory');
  const lineSelect = qs('#filter-line');
  const sortSelect = qs('#filter-sort');
  const stockCheck = qs('#filter-instock');

  if (catSelect) catSelect.value = filterState.category;
  populateSubcategorySelect();
  if (subSelect) subSelect.value = filterState.subcategory;
  if (lineSelect) lineSelect.value = filterState.line;
  if (sortSelect) sortSelect.value = filterState.sort;
  if (stockCheck) stockCheck.checked = filterState.onlyInStock;
}

function populateSubcategorySelect() {
  const subSelect = qs('#filter-subcategory');
  if (!subSelect) return;
  clear(subSelect);
  subSelect.appendChild(h('option', { value: 'all' }, 'Todas as subcategorias'));

  const cats = getState().categories || [];
  const relevantCats = filterState.category === 'all'
    ? cats
    : cats.filter((c) => c.slug === filterState.category);

  for (const cat of relevantCats) {
    for (const sub of cat.subs || []) {
      subSelect.appendChild(h('option', { value: sub.slug }, `${sub.name} (${cat.name})`));
    }
  }
}

function buildProductCard(product) {
  const imgs = getProductImages(product);
  const effective = getEffectivePrice(product);
  const hasPromo = product.promoPrice && Number(product.promoPrice) < Number(product.price);
  const ratingInfo = getProductRating(product.id);
  const wished = isWishlisted(product.id);
  const installmentVal = effective / 6;

  const badgeWrap = h('div', { class: 'product-badges' });
  if (product.badge) {
    badgeWrap.appendChild(h('span', { class: 'badge-tag' }, product.badge));
  }
  if (hasPromo) {
    const pct = Math.round(((product.price - effective) / product.price) * 100);
    badgeWrap.appendChild(h('span', { class: 'badge-tag is-promo' }, `-${pct}%`));
  }

  const wishBtn = h('button', {
    type: 'button',
    class: `wishlist-toggle ${wished ? 'is-active' : ''}`,
    'aria-label': `Salvar ${product.name} nos favoritos`,
    onClick: (e) => {
      e.stopPropagation();
      const nowWished = toggleWishlist(product.id);
      wishBtn.classList.toggle('is-active', nowWished);
      clear(wishBtn);
      wishBtn.appendChild(icon(nowWished ? 'heart-fill' : 'heart', 'icon icon-sm'));
      toast(nowWished ? `${product.name} salvo na Lista de Desejos.` : 'Removido da Lista de Desejos.');
    }
  }, icon(wished ? 'heart-fill' : 'heart', 'icon icon-sm'));

  const media = h('div', {
    class: 'product-media',
    style: { cursor: 'pointer' },
    onClick: () => openProductModal(product.id)
  },
  badgeWrap,
  wishBtn,
  h('img', {
    src: imgs[0],
    alt: `${product.name} - Vista Frontal`,
    width: '600',
    height: '800',
    class: 'img-primary',
    loading: 'lazy'
  }),
  imgs[1] ? h('img', {
    src: imgs[1],
    alt: `${product.name} - Detalhe de Acabamento`,
    width: '600',
    height: '800',
    class: 'img-secondary',
    loading: 'lazy'
  }) : null);

  const colorDots = h('div', { class: 'swatch-row', style: { marginTop: '0.25rem' } },
    ...(product.colors || []).map((c) =>
      h('span', {
        title: c.name,
        style: {
          display: 'inline-block',
          width: '0.75rem',
          height: '0.75rem',
          borderRadius: '999px',
          backgroundColor: c.hex,
          border: '1px solid rgba(236,234,227,0.35)'
        }
      })
    ),
    h('span', { style: { fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.25rem' } },
      (product.sizes || []).join(' · ')
    )
  );

  const body = h('div', { class: 'product-body' },
    h('div', { class: 'product-meta-top' },
      h('span', null, `${product.line} · ${product.sku}`),
      h('span', { class: 'product-rating-row' },
        icon('star-fill', 'icon icon-sm'),
        `${ratingInfo.average.toFixed(1)} (${ratingInfo.count})`
      )
    ),
    h('h3', { class: 'product-title' },
      h('a', {
        href: `?produto=${product.slug}`,
        onClick: (e) => {
          e.preventDefault();
          openProductModal(product.id);
        }
      }, product.name)
    ),
    h('p', { class: 'product-sub' }, product.short),
    colorDots,
    h('div', { class: 'product-price-block' },
      h('div', null,
        hasPromo ? h('span', { class: 'price-old' }, money(product.price)) : null,
        h('span', { class: 'price-current' }, money(effective)),
        h('div', { class: 'price-installments' },
          `${money(effective * 0.95)} no Pix ou 6x de ${money(installmentVal)}`
        )
      )
    ),
    h('div', { class: 'product-actions' },
      h('button', {
        type: 'button',
        class: 'btn btn-primary btn-sm',
        onClick: () => openProductModal(product.id)
      }, 'Ver Detalhes & Provador'),
      h('button', {
        type: 'button',
        class: 'btn btn-outline btn-sm',
        'aria-label': `Adicionar ${product.name} na sacola`,
        onClick: () => {
          const defaultSize = product.sizes?.find((s) => (product.stock?.[s] || 0) > 0) || 'M';
          addToCart({ productId: product.id, size: defaultSize });
          toast(`${product.name} (${defaultSize}) adicionado na sacola.`);
          openCartDrawer();
        }
      }, icon('bag', 'icon icon-sm'))
    )
  );

  return h('article', { class: 'product-card', dataset: { sku: product.sku } }, media, body);
}

function renderCatalog() {
  const grid = qs('#catalog-grid');
  const countEl = qs('#catalog-results-count');
  if (!grid) return;

  let list = [...getProducts()];

  if (filterState.category !== 'all') {
    list = list.filter((p) => p.category === filterState.category);
  }
  if (filterState.subcategory !== 'all') {
    list = list.filter((p) => p.subcategory === filterState.subcategory);
  }
  if (filterState.line !== 'all') {
    list = list.filter((p) => p.line === filterState.line);
  }
  if (filterState.maxPrice < 1000) {
    list = list.filter((p) => getEffectivePrice(p) <= filterState.maxPrice);
  }
  if (filterState.onlyInStock) {
    list = list.filter((p) => getProductStockTotal(p) > 0);
  }
  if (filterState.q.trim()) {
    const q = filterState.q.trim().toLowerCase();
    list = list.filter((p) =>
      `${p.name} ${p.sku} ${p.line} ${p.short} ${p.description} ${p.category} ${p.subcategory}`
        .toLowerCase()
        .includes(q)
    );
  }

  if (filterState.sort === 'bestsellers') {
    list.sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
  } else if (filterState.sort === 'price-asc') {
    list.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
  } else if (filterState.sort === 'price-desc') {
    list.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
  } else if (filterState.sort === 'newest') {
    list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  } else if (filterState.sort === 'rating') {
    list.sort((a, b) => getProductRating(b.id).average - getProductRating(a.id).average);
  } else {
    list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }

  clear(grid);
  if (countEl) {
    countEl.textContent = `${list.length} ${list.length === 1 ? 'peca autoral encontrada' : 'pecas autorais encontradas'}`;
  }

  if (!list.length) {
    grid.appendChild(
      h('div', {
        style: {
          gridColumn: '1 / -1',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-elevated)'
        }
      },
      h('p', { style: { fontSize: '1.15rem', marginBottom: '1rem' } }, 'Nenhuma peca corresponde aos filtros selecionados.'),
      h('button', {
        type: 'button',
        class: 'btn btn-outline btn-sm',
        onClick: resetCatalogFilters
      }, 'Limpar Filtros e Ver Toda a Colecao'))
    );
    return;
  }

  for (const product of list) {
    grid.appendChild(buildProductCard(product));
  }
}

function renderRecentlyViewedSection() {
  const container = qs('#recently-viewed-grid');
  if (!container) return;
  clear(container);
  const recent = getRecentlyViewed().slice(0, 3);
  for (const p of recent) {
    container.appendChild(buildProductCard(p));
  }
}

function renderJournalSection() {
  const grid = qs('#journal-grid');
  if (!grid) return;
  clear(grid);
  const posts = getState().posts || [];
  for (const post of posts) {
    grid.appendChild(
      h('article', { class: 'product-card' },
        h('div', {
          class: 'product-media',
          style: { aspectRatio: '4 / 3', cursor: 'pointer' },
          onClick: () => openPostModal(post.slug)
        },
        h('img', {
          src: post.image,
          alt: post.title,
          width: '960',
          height: '720',
          loading: 'lazy'
        })),
        h('div', { class: 'product-body' },
          h('div', { class: 'product-meta-top' },
            h('span', { style: { color: 'var(--accent-gold)' } }, post.category),
            h('span', null, post.readTime || dateBR(post.date))
          ),
          h('h3', { class: 'product-title' }, post.title),
          h('p', { class: 'product-sub' }, post.excerpt),
          h('div', { style: { marginTop: 'auto', paddingTop: '0.85rem' } },
            h('button', {
              type: 'button',
              class: 'btn btn-outline btn-sm',
              onClick: () => openPostModal(post.slug)
            }, 'Ler Artigo Completo')
          )
        )
      )
    );
  }
}

/* ==========================================================================
   PRODUCT DETAIL MODAL (PDP: MULTI-ANGLE ZOOM, VIDEO REEL, FREIGHT, BUNDLE, REVIEWS, Q&A)
   ========================================================================== */

export function openProductModal(productIdOrSlug) {
  const product = getProductById(productIdOrSlug);
  const dialog = qs('#pdp-modal');
  const body = qs('#pdp-modal-body');
  const titleBar = qs('#pdp-modal-title');
  if (!product || !dialog || !body) return;

  markViewed(product.id);
  renderRecentlyViewedSection();

  if (titleBar) titleBar.textContent = `${product.name} (${product.sku})`;
  clear(body);

  const imgs = getProductImages(product);
  const effective = getEffectivePrice(product);
  const pixPrice = effective * 0.95;
  const ratingInfo = getProductRating(product.id);
  let selectedColor = product.colors?.[0]?.name || 'Noir';
  let selectedSize = product.sizes?.find((s) => (product.stock?.[s] || 0) > 0) || product.sizes?.[0] || 'M';
  let useCustomMeasure = false;

  /* Gallery Stage with Zoom Lens & Simulated Stage Light Reel */
  const mainImg = h('img', {
    src: imgs[0],
    alt: `${product.name} em alta resolucao`,
    width: '900',
    height: '1200'
  });

  const stageVideoOverlay = h('div', {
    hidden: true,
    style: {
      position: 'absolute',
      inset: '0',
      backgroundColor: 'rgba(10, 14, 9, 0.92)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      textAlign: 'center',
      gap: '1rem'
    }
  },
  h('span', { class: 'eyebrow' }, 'Simulacao de Iluminacao de Palco (Reel 4K)'),
  h('img', {
    src: imgs[0],
    alt: `Teste de luz de palco - ${product.name}`,
    width: '360',
    height: '480',
    style: {
      maxHeight: '62%',
      width: 'auto',
      border: '1px solid var(--accent-gold)',
      filter: 'contrast(1.18) saturate(1.22)'
    }
  }),
  h('p', { style: { fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '38ch' } },
    'Acabamento testado sob refletor quente (3200K) e strobe frio (5600K) para evitar transparencia indesejada em camera.'
  ),
  h('button', {
    type: 'button',
    class: 'btn btn-outline btn-sm',
    onClick: () => {
      stageVideoOverlay.hidden = true;
    }
  }, 'Voltar para Fotos em Alta Resolucao'));

  const mainStage = h('div', {
    class: 'pdp-main-stage',
    title: 'Clique para aplicar super-zoom nos detalhes de costura',
    onClick: (e) => {
      if (!stageVideoOverlay.hidden) return;
      mainStage.classList.toggle('is-zoomed');
      const rect = mainStage.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImg.style.transformOrigin = `${x}% ${y}%`;
    },
    onMousemove: (e) => {
      if (!mainStage.classList.contains('is-zoomed')) return;
      const rect = mainStage.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImg.style.transformOrigin = `${x}% ${y}%`;
    }
  }, mainImg, stageVideoOverlay);

  const thumbButtons = imgs.map((src, idx) =>
    h('button', {
      type: 'button',
      class: `pdp-thumb-btn ${idx === 0 ? 'is-active' : ''}`,
      onClick: () => {
        stageVideoOverlay.hidden = true;
        mainStage.classList.remove('is-zoomed');
        mainImg.src = src;
        thumbButtons.forEach((b, i) => b.classList.toggle('is-active', i === idx));
      }
    },
    h('img', { src, alt: `${product.name} angulo ${idx + 1}`, width: '240', height: '320' }))
  );

  const videoReelBtn = h('button', {
    type: 'button',
    class: 'pdp-thumb-btn',
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.35rem',
      backgroundColor: 'var(--bg-obsidian)',
      padding: '0.5rem',
      fontSize: '0.68rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--accent-gold)'
    },
    onClick: () => {
      stageVideoOverlay.hidden = false;
    }
  }, icon('play-fill', 'icon'), h('span', null, 'Video Palco'));

  const galleryCol = h('div', { class: 'pdp-gallery' },
    mainStage,
    h('div', { class: 'pdp-thumbs' }, ...thumbButtons, videoReelBtn),
    h('p', { style: { fontSize: '0.72rem', color: 'var(--text-muted)' } },
      'Dica: Clique na imagem principal para ativar a lente de zoom sobre a textura do tecido e aviamentos.'
    )
  );

  /* Stock indicator & Variations */
  const stockStatusEl = h('div', { style: { fontSize: '0.78rem', color: 'var(--accent-emerald-bright)', marginTop: '0.35rem' } });
  const updateStockStatus = () => {
    const qty = Number(product.stock?.[selectedSize] || 0);
    if (useCustomMeasure) {
      stockStatusEl.textContent = 'Confeccao Sob Medida no Atelier: envio em 7 a 10 dias uteis.';
      stockStatusEl.style.color = 'var(--accent-gold)';
    } else if (qty > 0) {
      stockStatusEl.textContent = `Pronta-entrega imediata: ${qty} ${qty === 1 ? 'unidade disponivel' : 'unidades disponiveis'} no tamanho ${selectedSize}.`;
      stockStatusEl.style.color = 'var(--accent-emerald-bright)';
    } else {
      stockStatusEl.textContent = 'Tamanho esgotado na pronta-entrega. Selecione "Sob Medida" para encomendar.';
      stockStatusEl.style.color = 'var(--accent-warning)';
    }
  };

  const colorRow = h('div', { class: 'swatch-row' });
  const colorLabelEl = h('span', { style: { color: 'var(--text-primary)', fontWeight: '500' } }, selectedColor);

  (product.colors || []).forEach((c, idx) => {
    const btn = h('button', {
      type: 'button',
      class: `color-swatch ${idx === 0 ? 'is-selected' : ''}`,
      title: c.name,
      style: { backgroundColor: c.hex },
      onClick: () => {
        selectedColor = c.name;
        colorLabelEl.textContent = c.name;
        qsa('.color-swatch', colorRow).forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
      }
    });
    colorRow.appendChild(btn);
  });

  const customMeasureBox = h('div', {
    class: 'pdp-box',
    hidden: true,
    style: { marginTop: '0.65rem' }
  },
  h('p', { style: { fontSize: '0.76rem', color: 'var(--accent-gold)', marginBottom: '0.5rem' } },
    'Informe suas medidas aproximadas (ou deixe em branco para validar por video no WhatsApp):'
  ),
  h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' } },
    h('input', { type: 'text', id: 'pdp-measure-bust', class: 'form-input', placeholder: 'Torax / Busto (cm)' }),
    h('input', { type: 'text', id: 'pdp-measure-waist', class: 'form-input', placeholder: 'Cintura (cm)' }),
    h('input', { type: 'text', id: 'pdp-measure-hip', class: 'form-input', placeholder: 'Quadril (cm)' }),
    h('input', { type: 'text', id: 'pdp-measure-height', class: 'form-input', placeholder: 'Estatura (ex: 1,76m)' })
  ));

  const sizeRow = h('div', { class: 'size-row' });
  (product.sizes || ['P', 'M', 'G']).forEach((sz) => {
    const available = Number(product.stock?.[sz] ?? 1) > 0;
    const btn = h('button', {
      type: 'button',
      class: `size-btn ${sz === selectedSize ? 'is-selected' : ''}`,
      disabled: !available,
      onClick: () => {
        useCustomMeasure = false;
        customMeasureBox.hidden = true;
        selectedSize = sz;
        qsa('.size-btn', sizeRow).forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        updateStockStatus();
      }
    }, sz);
    sizeRow.appendChild(btn);
  });

  const sobMedidaBtn = h('button', {
    type: 'button',
    class: 'size-btn',
    onClick: () => {
      useCustomMeasure = true;
      selectedSize = 'Sob Medida';
      customMeasureBox.hidden = false;
      qsa('.size-btn', sizeRow).forEach((b) => b.classList.remove('is-selected'));
      sobMedidaBtn.classList.add('is-selected');
      updateStockStatus();
    }
  }, 'Sob Medida');
  sizeRow.appendChild(sobMedidaBtn);
  updateStockStatus();

  /* Real-time Freight Calculator inside PDP */
  const pdpCepInput = h('input', {
    type: 'text',
    class: 'form-input',
    placeholder: '00000-000',
    inputmode: 'numeric',
    maxlength: '9',
    value: getState().customer?.savedAddress?.cep || '86060-510',
    style: { maxWidth: '160px' },
    onInput: (e) => {
      e.target.value = maskCep(e.target.value);
    }
  });
  const pdpFreightResults = h('div', { class: 'freight-list' });

  const runPdpFreight = async () => {
    const cepVal = pdpCepInput.value;
    const loc = await lookupCep(cepVal);
    clear(pdpFreightResults);
    if (!loc.ok) {
      pdpFreightResults.appendChild(h('p', { class: 'field-error' }, loc.message));
      return;
    }
    const options = calculateFreightOptions(cepVal, effective);
    pdpFreightResults.appendChild(
      h('div', { style: { fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' } },
        `Destino: ${loc.street ? `${loc.street}, ` : ''}${loc.city} - ${loc.uf}`
      )
    );
    for (const opt of options) {
      pdpFreightResults.appendChild(
        h('div', { class: 'freight-item' },
          h('div', null,
            h('strong', { style: { color: 'var(--text-primary)', display: 'block' } }, opt.carrier),
            h('span', { style: { color: 'var(--text-muted)' } }, opt.days)
          ),
          h('strong', { style: { color: opt.price === 0 ? 'var(--accent-emerald-bright)' : 'var(--accent-gold)' } },
            opt.price === 0 ? 'Gratis' : money(opt.price)
          )
        )
      );
    }
  };

  /* Compre Junto (Buy Together Bundle) */
  const companion = getProductById(product.bundleWith) || getProducts().find((p) => p.id !== product.id);
  let bundleBox = null;
  if (companion) {
    const comboRaw = effective + getEffectivePrice(companion);
    const comboPrice = comboRaw * 0.95;
    bundleBox = h('div', { class: 'pdp-box' },
      h('div', { style: { fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent-gold)', marginBottom: '0.55rem' } },
        'Compre Junto (Styling Completo com 5% Off Adicional)'
      ),
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' } },
        h('div', { style: { fontSize: '0.84rem' } },
          h('div', null, `1x ${product.name} + 1x ${companion.name}`),
          h('div', { style: { color: 'var(--accent-emerald-bright)', fontWeight: '600', marginTop: '0.2rem' } },
            `De ${money(comboRaw)} por ${money(comboPrice)}`
          )
        ),
        h('button', {
          type: 'button',
          class: 'btn btn-outline btn-sm',
          onClick: () => {
            addToCart({ productId: product.id, size: selectedSize, color: selectedColor });
            addToCart({ productId: companion.id, size: 'M' });
            toast('Look completo adicionado na sacola!');
            dialog.close();
            openCartDrawer();
          }
        }, 'Levar os 2 Looks')
      )
    );
  }

  /* Technical Datasheet (Ficha Tecnica) */
  const specsList = h('dl', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '0.75rem',
      marginTop: '0.75rem'
    }
  });
  for (const [k, v] of Object.entries(product.specs || {})) {
    specsList.appendChild(
      h('div', { class: 'pdp-box' },
        h('dt', { style: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)' } }, k),
        h('dd', { style: { fontSize: '0.86rem', color: 'var(--text-primary)', marginTop: '0.2rem' } }, v)
      )
    );
  }

  /* Info Column */
  const infoCol = h('div', { class: 'pdp-info' },
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' } },
      h('span', { class: 'eyebrow' }, `${product.line} · SKU ${product.sku}`),
      h('button', {
        type: 'button',
        class: 'icon-btn',
        title: 'Compartilhar peca',
        onClick: async () => {
          const shareUrl = `${window.location.origin}/?produto=${product.slug}`;
          if (navigator.share) {
            try {
              await navigator.share({ title: product.name, text: product.short, url: shareUrl });
              return;
            } catch (_) {
              /* fallback copy */
            }
          }
          try {
            await navigator.clipboard.writeText(shareUrl);
            toast('Link da peca copiado para a area de transferencia!');
          } catch (_) {
            toast(`Link: ${shareUrl}`);
          }
        }
      }, icon('share-network', 'icon icon-sm'), h('span', { style: { fontSize: '0.72rem' } }, 'Compartilhar'))
    ),
    h('h2', { style: { fontSize: 'clamp(1.75rem, 2.5vw, 2.4rem)' } }, product.name),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.82rem' } },
      stars(ratingInfo.average),
      h('span', { style: { color: 'var(--text-secondary)' } },
        `${ratingInfo.average.toFixed(1)} (${ratingInfo.count} avaliacoes verificadas) · ${product.sold} pecas entregues`
      )
    ),
    h('div', { class: 'pdp-box' },
      product.promoPrice
        ? h('div', { style: { fontSize: '0.84rem', color: 'var(--text-muted)', textDecoration: 'line-through' } }, `De ${money(product.price)}`)
        : null,
      h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '0.85rem', flexWrap: 'wrap' } },
        h('span', { style: { fontSize: '1.85rem', fontWeight: '600', color: 'var(--text-primary)' } }, money(effective)),
        h('span', { style: { fontSize: '0.85rem', color: 'var(--accent-emerald-bright)', fontWeight: '500' } },
          `${money(pixPrice)} no Pix (5% off imediato)`
        )
      ),
      h('div', { style: { fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' } },
        `Ou em ate 10x de ${money(effective / 10)} sem juros no cartao · Ganhe ${money(effective * 0.05)} de cashback Broth Club`
      )
    ),
    h('p', { style: { fontSize: '0.94rem', color: 'var(--text-secondary)' } }, product.description),
    h('div', null,
      h('div', { style: { fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.4rem', color: 'var(--text-secondary)' } },
        'Cor selecionada: ', colorLabelEl
      ),
      colorRow
    ),
    h('div', null,
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' } },
        h('span', { style: { fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-secondary)' } }, 'Tamanho / Modelagem'),
        h('button', {
          type: 'button',
          style: { fontSize: '0.74rem', color: 'var(--accent-gold)', textDecoration: 'underline' },
          onClick: () => openPostModal('guia-de-medidas-sob-medida')
        }, 'Tabela de Medidas & Guia')
      ),
      sizeRow,
      stockStatusEl,
      customMeasureBox
    ),
    h('div', { style: { display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.65rem', marginTop: '0.35rem' } },
      h('button', {
        type: 'button',
        class: 'btn btn-primary',
        onClick: () => {
          const customNote = useCustomMeasure
            ? [
                qs('#pdp-measure-bust')?.value,
                qs('#pdp-measure-waist')?.value,
                qs('#pdp-measure-hip')?.value,
                qs('#pdp-measure-height')?.value
              ].filter(Boolean).join(' / ') || 'Sob medida a confirmar'
            : '';
          addToCart({
            productId: product.id,
            size: selectedSize,
            color: selectedColor,
            qty: 1,
            customMeasure: customNote
          });
          toast(`${product.name} (${selectedSize}) adicionado na sacola!`);
          dialog.close();
          openCartDrawer();
        }
      }, icon('bag', 'icon'), 'Adicionar a Sacola'),
      h('button', {
        type: 'button',
        class: 'btn btn-emerald',
        onClick: () => {
          addToCart({ productId: product.id, size: selectedSize, color: selectedColor, qty: 1 });
          dialog.close();
          openCheckoutModal();
        }
      }, 'Comprar Agora')
    ),
    /* Freight Calculator Box */
    h('div', { class: 'pdp-box' },
      h('label', { class: 'field-hint', for: 'pdp-cep-field' },
        'Simular Frete e Prazo de Entrega (Correios, Jadlog e Retirada Atelier):'
      ),
      h('div', { style: { display: 'flex', gap: '0.5rem', alignItems: 'center' } },
        pdpCepInput,
        h('button', { type: 'button', class: 'btn btn-outline btn-sm', onClick: runPdpFreight }, 'Calcular Prazo')
      ),
      pdpFreightResults
    ),
    bundleBox
  );

  /* Reviews, Q&A & Related Products Tabs below main PDP grid */
  const reviewsContainer = h('div', { style: { display: 'grid', gap: '0.85rem', marginTop: '1rem' } });
  const renderPdpReviews = () => {
    clear(reviewsContainer);
    const revs = getState().reviews.filter((r) => r.productId === product.id && r.approved !== false);
    if (!revs.length) {
      reviewsContainer.appendChild(h('p', { style: { fontSize: '0.85rem', color: 'var(--text-muted)' } }, 'Seja a primeira pessoa a avaliar esta peca.'));
    }
    for (const r of revs) {
      reviewsContainer.appendChild(
        h('div', { class: 'pdp-box' },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' } },
            h('strong', { style: { fontSize: '0.9rem' } }, `${r.title} · ${r.name} (${r.city})`),
            stars(r.rating)
          ),
          h('p', { style: { fontSize: '0.84rem', color: 'var(--text-secondary)' } }, r.text),
          h('div', { style: { fontSize: '0.7rem', color: 'var(--accent-emerald-bright)', marginTop: '0.35rem' } },
            `Compra Verificada · Tamanho escolhido: ${r.size} · ${dateBR(r.date)}`
          )
        )
      );
    }
  };
  renderPdpReviews();

  const reviewForm = h('form', {
    class: 'pdp-box',
    style: { marginTop: '1rem', display: 'grid', gap: '0.65rem' },
    onSubmit: (e) => {
      e.preventDefault();
      const fd = new FormData(reviewForm);
      addReview({
        productId: product.id,
        name: fd.get('name'),
        city: fd.get('city'),
        size: fd.get('size'),
        rating: fd.get('rating'),
        title: fd.get('title'),
        text: fd.get('text')
      });
      reviewForm.reset();
      renderPdpReviews();
      toast('Avaliacao publicada com sucesso!');
    }
  },
  h('h4', { style: { fontSize: '1.1rem' } }, 'Registrar Avaliacao de Cliente'),
  h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' } },
    h('input', { name: 'name', required: true, class: 'form-input', placeholder: 'Seu nome' }),
    h('input', { name: 'city', required: true, class: 'form-input', placeholder: 'Cidade - UF' }),
    h('select', { name: 'size', class: 'form-select' },
      h('option', { value: 'P' }, 'Veste P'),
      h('option', { value: 'M' }, 'Veste M'),
      h('option', { value: 'G' }, 'Veste G'),
      h('option', { value: 'Sob Medida' }, 'Sob Medida')
    ),
    h('select', { name: 'rating', class: 'form-select' },
      h('option', { value: '5' }, '5 Estrelas - Impecavel'),
      h('option', { value: '4' }, '4 Estrelas - Muito Bom')
    )
  ),
  h('input', { name: 'title', required: true, class: 'form-input', placeholder: 'Titulo (ex: Caimento perfeito no palco)' }),
  h('textarea', { name: 'text', required: true, rows: '2', class: 'form-textarea', placeholder: 'Conte como foi sua experiencia com o tecido e modelagem...' }),
  h('button', { type: 'submit', class: 'btn btn-outline btn-sm' }, 'Publicar Avaliacao'));

  /* Questions & Answers */
  const qaContainer = h('div', { style: { display: 'grid', gap: '0.75rem', marginTop: '1rem' } });
  const renderPdpQuestions = () => {
    clear(qaContainer);
    const qsList = getState().questions.filter((q) => q.productId === product.id || q.productId === 'p4');
    for (const q of qsList) {
      qaContainer.appendChild(
        h('div', { class: 'pdp-box' },
          h('div', { style: { fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' } }, `P: ${q.question} (${q.name})`),
          h('div', { style: { fontSize: '0.84rem', color: 'var(--accent-gold)', marginTop: '0.35rem' } }, `Atelier Broth Concept: ${q.answer}`)
        )
      );
    }
  };
  renderPdpQuestions();

  const qaForm = h('form', {
    class: 'pdp-box',
    style: { marginTop: '0.85rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
    onSubmit: (e) => {
      e.preventDefault();
      const fd = new FormData(qaForm);
      addQuestion({
        productId: product.id,
        name: fd.get('name'),
        question: fd.get('question')
      });
      qaForm.reset();
      renderPdpQuestions();
      toast('Pergunta respondida pelo Concierge do Atelier!');
    }
  },
  h('input', { name: 'name', required: true, class: 'form-input', placeholder: 'Seu nome', style: { flex: '1 1 140px' } }),
  h('input', { name: 'question', required: true, class: 'form-input', placeholder: 'Tire sua duvida sobre tecido, medidas ou prazo...', style: { flex: '2 1 260px' } }),
  h('button', { type: 'submit', class: 'btn btn-outline btn-sm' }, 'Enviar Pergunta'));

  /* Related Products */
  const related = getProducts().filter((p) => p.id !== product.id && (p.category === product.category || p.line === product.line)).slice(0, 3);
  const relatedGrid = h('div', { class: 'product-grid', style: { marginTop: '1rem' } },
    ...related.map((rp) => buildProductCard(rp))
  );

  body.appendChild(
    h('div', null,
      h('div', { class: 'pdp-layout' }, galleryCol, infoCol),
      h('div', { class: 'pdp-tabs' },
        h('h3', { style: { fontSize: '1.5rem' } }, 'Ficha Tecnica & Especificacoes de Atelier'),
        specsList
      ),
      h('div', { class: 'pdp-tabs' },
        h('h3', { style: { fontSize: '1.5rem' } }, 'Avaliacoes Verificadas de Clientes & Artistas'),
        reviewsContainer,
        reviewForm
      ),
      h('div', { class: 'pdp-tabs' },
        h('h3', { style: { fontSize: '1.5rem' } }, 'Perguntas e Respostas sobre a Peca'),
        qaContainer,
        qaForm
      ),
      h('div', { class: 'pdp-tabs' },
        h('h3', { style: { fontSize: '1.5rem' } }, 'Pecas Relacionadas da Colecao'),
        relatedGrid
      )
    )
  );

  openModal(dialog);
  runPdpFreight();
}

/* ==========================================================================
   EDITABLE SHOPPING BAG DRAWER (#cart-drawer)
   ========================================================================== */

export function openCartDrawer() {
  const drawer = qs('#cart-drawer');
  if (!drawer) return;
  renderCartDrawer();
  openModal(drawer);
}

function renderCartDrawer() {
  const body = qs('#cart-drawer-body');
  if (!body) return;
  clear(body);

  const state = getState();
  const summary = getCartSummary('pix');
  const progressPct = Math.min(100, Math.round((summary.subtotal / summary.freeShippingMin) * 100));

  /* Free shipping progress bar */
  const shipBar = h('div', { class: 'pdp-box', style: { marginBottom: '1.15rem' } },
    h('div', { style: { fontSize: '0.78rem', marginBottom: '0.45rem', color: summary.qualifiesFreeShipping ? 'var(--accent-emerald-bright)' : 'var(--text-secondary)' } },
      summary.qualifiesFreeShipping
        ? 'Voce desbloqueou Frete Gratis Segurado para todo o Brasil!'
        : `Faltam ${money(summary.freeShippingRemaining)} para liberar Frete Gratis Segurado.`
    ),
    h('div', { style: { height: '4px', backgroundColor: 'rgba(236,234,227,0.1)', overflow: 'hidden' } },
      h('div', { style: { height: '100%', width: `${progressPct}%`, backgroundColor: 'var(--accent-gold)' } })
    )
  );
  body.appendChild(shipBar);

  if (!state.cart.length) {
    body.appendChild(
      h('div', { style: { textAlign: 'center', padding: '3rem 1rem' } },
        h('p', { style: { color: 'var(--text-secondary)', marginBottom: '1.25rem' } }, 'Sua sacola da Maison esta vazia.'),
        h('button', {
          type: 'button',
          class: 'btn btn-primary btn-sm',
          onClick: () => qs('#cart-drawer')?.close()
        }, 'Explorar Vitrine Autoral')
      )
    );
    return;
  }

  const list = h('div', { style: { display: 'grid', gap: '0.85rem', marginBottom: '1.25rem' } });
  for (const item of state.cart) {
    list.appendChild(
      h('div', { class: 'pdp-box', style: { display: 'grid', gridTemplateColumns: '68px 1fr', gap: '0.85rem', alignItems: 'center' } },
        h('img', { src: item.image, alt: item.name, width: '68', height: '90', style: { borderRadius: '2px' } }),
        h('div', null,
          h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '0.5rem' } },
            h('strong', { style: { fontSize: '0.9rem' } }, item.name),
            h('button', {
              type: 'button',
              class: 'icon-btn',
              'aria-label': `Remover ${item.name}`,
              onClick: () => removeFromCart(item.key)
            }, icon('trash', 'icon icon-sm'))
          ),
          h('div', { style: { fontSize: '0.75rem', color: 'var(--text-muted)' } },
            `SKU ${item.sku} · Cor: ${item.color} · Tam: ${item.size}`
          ),
          item.customMeasure
            ? h('div', { style: { fontSize: '0.72rem', color: 'var(--accent-gold)' } }, `Medidas: ${item.customMeasure}`)
            : null,
          h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.55rem' } },
            h('div', { style: { display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-subtle)' } },
              h('button', { type: 'button', style: { padding: '0.2rem 0.55rem' }, onClick: () => updateCartQty(item.key, -1) }, '-'),
              h('span', { class: 'num-tabular', style: { padding: '0.2rem 0.55rem', fontSize: '0.8rem' } }, String(item.qty)),
              h('button', { type: 'button', style: { padding: '0.2rem 0.55rem' }, onClick: () => updateCartQty(item.key, 1) }, '+')
            ),
            h('strong', { class: 'num-tabular' }, money(item.price * item.qty))
          )
        )
      )
    );
  }
  body.appendChild(list);

  /* Coupon Box */
  const couponInput = h('input', {
    type: 'text',
    class: 'form-input',
    placeholder: 'Cupom (BROTH10, PRIDE20, PALCO100)',
    value: state.couponCode || '',
    style: { flex: '1' }
  });

  const couponBox = h('div', { class: 'pdp-box', style: { marginBottom: '1.15rem' } },
    h('div', { style: { display: 'flex', gap: '0.5rem' } },
      couponInput,
      h('button', {
        type: 'button',
        class: 'btn btn-outline btn-sm',
        onClick: () => {
          const res = applyCoupon(couponInput.value);
          toast(res.message);
          renderCartDrawer();
        }
      }, 'Aplicar')
    ),
    h('div', { style: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.55rem' } },
      ...state.coupons.filter((c) => c.active).map((c) =>
        h('button', {
          type: 'button',
          class: 'cat-pill',
          style: { fontSize: '0.65rem' },
          onClick: () => {
            const res = applyCoupon(c.code);
            toast(res.message);
            renderCartDrawer();
          }
        }, `${c.code} (${c.type === 'percent' ? `${c.value}%` : money(c.value)})`)
      )
    )
  );
  body.appendChild(couponBox);

  /* Summary & Actions */
  const totalsBox = h('div', { class: 'pdp-box', style: { display: 'grid', gap: '0.45rem', fontSize: '0.85rem' } },
    h('div', { style: { display: 'flex', justifyContent: 'space-between' } },
      h('span', { style: { color: 'var(--text-secondary)' } }, 'Subtotal'),
      h('span', { class: 'num-tabular' }, money(summary.subtotal))
    ),
    summary.couponDiscount > 0
      ? h('div', { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--accent-gold)' } },
          h('span', null, `Desconto Cupom (${state.couponCode})`),
          h('span', { class: 'num-tabular' }, `- ${money(summary.couponDiscount)}`)
        )
      : null,
    h('div', { style: { display: 'flex', justifyContent: 'space-between', color: 'var(--accent-emerald-bright)' } },
      h('span', null, 'Desconto Pix (5% off)'),
      h('span', { class: 'num-tabular' }, `- ${money(summary.pixDiscount)}`)
    ),
    h('div', { style: { display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '1.05rem', fontWeight: '600' } },
      h('span', null, 'Total no Pix'),
      h('span', { class: 'num-tabular', style: { color: 'var(--accent-gold)' } }, money(summary.total))
    ),
    h('div', { style: { fontSize: '0.73rem', color: 'var(--text-muted)' } },
      `Cashback Broth Club acumulado nesta compra: + ${money(summary.cashback)}`
    ),
    h('button', {
      type: 'button',
      class: 'btn btn-primary btn-block',
      style: { marginTop: '0.65rem' },
      onClick: () => {
        qs('#cart-drawer')?.close();
        openCheckoutModal();
      }
    }, 'Ir para Checkout Seguro'),
    h('button', {
      type: 'button',
      class: 'btn btn-outline btn-block btn-sm',
      onClick: () => {
        const itemsTxt = state.cart.map((i) => `${i.qty}x ${i.name} (${i.size} / ${i.color})`).join(', ');
        const msg = encodeURIComponent(`Ola Broth Concept! Gostaria de finalizar ou salvar minha sacola: ${itemsTxt}. Total: ${money(summary.total)}`);
        window.open(`https://wa.me/${state.settings.whatsapp}?text=${msg}`, '_blank', 'noopener,noreferrer');
      }
    }, icon('whatsapp-logo', 'icon icon-sm'), 'Salvar Sacola / Fechar pelo WhatsApp')
  );
  body.appendChild(totalsBox);
}

/* ==========================================================================
   EXPRESS CHECKOUT MODAL (GUEST OR LOGGED-IN, VIACEP, PIX, CARD LUHN, BOLETO, WALLETS)
   ========================================================================== */

export function openCheckoutModal() {
  const dialog = qs('#checkout-modal');
  const body = qs('#checkout-modal-body');
  if (!dialog || !body) return;

  const state = getState();
  if (!state.cart.length) {
    toast('Adicione ao menos uma peca na sacola antes de abrir o checkout.');
    return;
  }

  let selectedPayment = 'pix';
  const savedAddr = state.customer?.savedAddress || {
    cep: '86060-510',
    street: 'R. Ibipora, 720',
    neighborhood: 'Aurora',
    city: 'Londrina',
    uf: 'PR'
  };

  const renderCheckout = () => {
    clear(body);
    const summary = getCartSummary(selectedPayment);
    const freightOpts = calculateFreightOptions(savedAddr.cep, summary.subtotal);
    if (!state.shippingQuote && freightOpts.length) {
      selectShippingQuote(freightOpts[0]);
    }

    /* Form Fields with Modern Web Guidance validate-input-after-interaction */
    const cepField = h('input', {
      type: 'text',
      name: 'cep',
      id: 'chk-cep',
      required: true,
      class: 'form-input',
      value: savedAddr.cep,
      placeholder: '00000-000',
      onInput: async (e) => {
        e.target.value = maskCep(e.target.value);
        if (e.target.value.length === 9) {
          const res = await lookupCep(e.target.value);
          if (res.ok) {
            savedAddr.cep = maskCep(res.cep);
            savedAddr.street = res.street;
            savedAddr.neighborhood = res.neighborhood;
            savedAddr.city = res.city;
            savedAddr.uf = res.uf;
            const stEl = qs('#chk-street');
            const cEl = qs('#chk-city');
            if (stEl) stEl.value = `${res.street} - ${res.neighborhood}`;
            if (cEl) cEl.value = `${res.city} - ${res.uf}`;
            toast(`Endereco preenchido automaticamente: ${res.city} - ${res.uf}`);
          }
        }
      }
    });

    /* Payment Specific View */
    const paymentPanel = h('div', { class: 'pdp-box' });
    if (selectedPayment === 'pix') {
      const pixCode = '00020126580014BR.GOV.BCB.PIX0136brothconcept-atelier-londrina-pr5204000053039865802BR5920BROTH CONCEPT MAISON6008LONDRINA62070503***6304ABCD';
      paymentPanel.appendChild(
        h('div', { style: { display: 'grid', gap: '0.75rem' } },
          h('div', { style: { color: 'var(--accent-emerald-bright)', fontWeight: '600', fontSize: '0.9rem' } },
            `Pix com 5% de Desconto Imediato: ${money(summary.total)}`
          ),
          h('p', { style: { fontSize: '0.8rem', color: 'var(--text-secondary)' } },
            'Aprovacao instantanea. Copie o codigo Pix Copia e Cola abaixo ou finalize para gerar o comprovante:'
          ),
          h('div', { style: { display: 'flex', gap: '0.5rem' } },
            h('input', { type: 'text', readonly: true, class: 'form-input', value: pixCode, style: { flex: '1', fontSize: '0.72rem' } }),
            h('button', {
              type: 'button',
              class: 'btn btn-outline btn-sm',
              onClick: async () => {
                try {
                  await navigator.clipboard.writeText(pixCode);
                } catch (_) {
                  /* ignore */
                }
                toast('Codigo Pix Copia e Cola copiado!');
              }
            }, icon('copy', 'icon icon-sm'), 'Copiar Pix')
          )
        )
      );
    } else if (selectedPayment === 'card') {
      const brandBadge = h('span', { style: { color: 'var(--accent-gold)', fontSize: '0.75rem' } }, 'Visa / Mastercard / Elo / Amex');
      const cardError = h('span', { class: 'field-error', hidden: true }, 'Numero de cartao invalido pela verificacao Luhn.');
      paymentPanel.appendChild(
        h('div', { style: { display: 'grid', gap: '0.65rem' } },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            h('span', { class: 'field-hint' }, 'Digite os 16 digitos do cartao (Checkout Seguro PCI-DSS):'),
            brandBadge
          ),
          h('input', {
            type: 'text',
            name: 'cardNumber',
            class: 'form-input',
            placeholder: '4532 1190 8842 0019',
            inputmode: 'numeric',
            onInput: (e) => {
              e.target.value = maskCard(e.target.value);
              const b = cardBrand(e.target.value);
              brandBadge.textContent = b ? `Bandeira detectada: ${b}` : 'Visa / Mastercard / Elo / Amex';
            },
            onBlur: (e) => {
              const valid = e.target.value.length >= 16 && luhn(e.target.value);
              e.target.setAttribute('aria-invalid', valid ? 'false' : 'true');
              cardError.hidden = valid;
            }
          }),
          cardError,
          h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 110px 90px', gap: '0.5rem' } },
            h('input', { type: 'text', name: 'cardHolder', class: 'form-input', placeholder: 'Nome impresso no cartao' }),
            h('input', {
              type: 'text',
              name: 'cardExp',
              class: 'form-input',
              placeholder: 'MM/AA',
              onInput: (e) => { e.target.value = maskExp(e.target.value); }
            }),
            h('input', { type: 'text', name: 'cardCvv', class: 'form-input', placeholder: 'CVV', maxlength: '4' })
          ),
          h('select', { name: 'installments', class: 'form-select' },
            ...Array.from({ length: 10 }, (_, i) => i + 1).map((n) =>
              h('option', { value: String(n) }, `${n}x de ${money(summary.total / n)} sem juros`)
            )
          )
        )
      );
    } else if (selectedPayment === 'boleto') {
      const linhaDigitavel = '23793.38128 60088.419026 34000.063305 8 98940000059000';
      paymentPanel.appendChild(
        h('div', { style: { display: 'grid', gap: '0.6rem' } },
          h('div', { style: { fontSize: '0.85rem', color: 'var(--text-primary)' } }, 'Boleto Bancario Registrado (Vencimento em 2 dias uteis)'),
          h('input', { type: 'text', readonly: true, class: 'form-input', value: linhaDigitavel, style: { fontSize: '0.75rem' } }),
          h('button', {
            type: 'button',
            class: 'btn btn-outline btn-sm',
            onClick: () => toast('Linha digitavel do boleto copiada!')
          }, icon('barcode', 'icon icon-sm'), 'Copiar Linha Digitavel')
        )
      );
    } else {
      paymentPanel.appendChild(
        h('div', { style: { display: 'grid', gap: '0.6rem' } },
          h('div', { style: { fontSize: '0.85rem', color: 'var(--text-primary)' } },
            'Carteiras Digitais Criptografadas (Apple Pay / Google Pay / Mercado Pago)'
          ),
          h('p', { style: { fontSize: '0.78rem', color: 'var(--text-secondary)' } },
            'Autenticacao biometrica pronta para confirmacao em 1 clique.'
          )
        )
      );
    }

    const checkoutForm = h('form', {
      class: 'checkout-grid',
      onSubmit: (e) => {
        e.preventDefault();
        const fd = new FormData(checkoutForm);
        const order = createOrder({
          customerData: {
            name: fd.get('name') || 'Cliente Broth Concept',
            email: fd.get('email') || 'cliente@brothconcept.com.br',
            phone: fd.get('phone') || '(43) 99999-0000',
            cpf: fd.get('cpf') || '000.000.000-00',
            cep: fd.get('cep') || savedAddr.cep,
            street: fd.get('street') || savedAddr.street,
            city: fd.get('city') || `${savedAddr.city} - ${savedAddr.uf}`
          },
          paymentMethod: selectedPayment,
          shippingQuote: getState().shippingQuote || freightOpts[0]
        });

        /* Render Order Confirmation Screen with Tracking & NF-e */
        clear(body);
        body.appendChild(
          h('div', { class: 'pdp-box', style: { padding: '2rem', textAlign: 'center', display: 'grid', gap: '1rem' } },
            h('span', { class: 'eyebrow', style: { marginInline: 'auto' } }, 'Pedido Confirmado & NF-e Emitida'),
            h('h3', { style: { fontSize: '2rem' } }, `Obrigado, ${order.customer.name}!`),
            h('p', { style: { color: 'var(--text-secondary)', maxWidth: '52ch', marginInline: 'auto' } },
              `Seu pedido ${order.id} foi registrado no ERP do atelier. O codigo de rastreio e a Nota Fiscal Eletronica ja estao disponiveis abaixo.`
            ),
            h('div', { class: 'pdp-box', style: { textAlign: 'left', maxWidth: '560px', marginInline: 'auto', width: '100%', display: 'grid', gap: '0.45rem', fontSize: '0.84rem' } },
              h('div', null, h('strong', null, 'Pedido: '), order.id),
              h('div', null, h('strong', null, 'Codigo de Rastreio: '), h('span', { style: { color: 'var(--accent-gold)' } }, order.trackingCode)),
              h('div', null, h('strong', null, 'Modalidade de Envio: '), order.shippingMethod),
              h('div', null, h('strong', null, 'Pagamento: '), `${order.paymentMethod} (${money(order.total)})`),
              h('div', null, h('strong', null, 'Chave NF-e: '), h('span', { style: { fontSize: '0.72rem', color: 'var(--text-muted)' } }, order.nfeKey)),
              h('div', { style: { color: 'var(--accent-emerald-bright)' } }, `Cashback Broth Club creditado: + ${money(order.cashbackEarned)}`)
            ),
            h('div', { style: { display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' } },
              h('button', {
                type: 'button',
                class: 'btn btn-primary btn-sm',
                onClick: () => {
                  dialog.close();
                  openTrackingModal(order.id);
                }
              }, 'Acompanhar Rastreio do Pedido'),
              h('button', {
                type: 'button',
                class: 'btn btn-outline btn-sm',
                onClick: () => dialog.close()
              }, 'Voltar para a Loja')
            )
          )
        );
      }
    },
    /* Left Column: Guest/Customer Identification, CEP & Payment */
    h('div', { style: { display: 'grid', gap: '1.15rem' } },
      h('div', { class: 'pdp-box', style: { display: 'grid', gap: '0.65rem' } },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          h('h4', { style: { fontSize: '1.15rem' } }, '1. Identificacao (Compra sem Cadastro ou Conta)'),
          h('span', { style: { fontSize: '0.7rem', color: 'var(--accent-emerald-bright)' } }, 'Ambiente Criptografado SSL')
        ),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.55rem' } },
          h('div', null,
            h('label', { class: 'field-hint', for: 'chk-name' }, 'Nome Completo ou Artistico'),
            h('input', { id: 'chk-name', name: 'name', required: true, class: 'form-input', style: { width: '100%' }, value: state.customer?.name || '', placeholder: 'Ex: Theo Santoro' })
          ),
          h('div', null,
            h('label', { class: 'field-hint', for: 'chk-email' }, 'E-mail para envio da NF-e'),
            h('input', { id: 'chk-email', type: 'email', name: 'email', required: true, class: 'form-input', style: { width: '100%' }, value: state.customer?.email || '', placeholder: 'voce@exemplo.com.br' })
          ),
          h('div', null,
            h('label', { class: 'field-hint', for: 'chk-phone' }, 'WhatsApp com DDD'),
            h('input', {
              id: 'chk-phone',
              name: 'phone',
              required: true,
              class: 'form-input',
              style: { width: '100%' },
              placeholder: '(43) 98834-1414',
              onInput: (e) => { e.target.value = maskPhone(e.target.value); }
            })
          ),
          h('div', null,
            h('label', { class: 'field-hint', for: 'chk-cpf' }, 'CPF para Nota Fiscal'),
            h('input', {
              id: 'chk-cpf',
              name: 'cpf',
              required: true,
              class: 'form-input',
              style: { width: '100%' },
              placeholder: '000.000.000-00',
              onInput: (e) => { e.target.value = maskCpf(e.target.value); }
            })
          )
        )
      ),
      h('div', { class: 'pdp-box', style: { display: 'grid', gap: '0.65rem' } },
        h('h4', { style: { fontSize: '1.15rem' } }, '2. Endereco de Entrega (Preenchimento Automatico por CEP) & Logistica'),
        h('div', { style: { display: 'grid', gridTemplateColumns: '140px 1fr 180px', gap: '0.55rem' } },
          h('div', null,
            h('label', { class: 'field-hint', for: 'chk-cep' }, 'CEP (8 digitos)'),
            cepField
          ),
          h('div', null,
            h('label', { class: 'field-hint', for: 'chk-street' }, 'Logradouro, Numero e Bairro'),
            h('input', { id: 'chk-street', name: 'street', required: true, class: 'form-input', style: { width: '100%' }, value: `${savedAddr.street} - ${savedAddr.neighborhood}` })
          ),
          h('div', null,
            h('label', { class: 'field-hint', for: 'chk-city' }, 'Cidade / UF'),
            h('input', { id: 'chk-city', name: 'city', required: true, class: 'form-input', style: { width: '100%' }, value: `${savedAddr.city} - ${savedAddr.uf}` })
          )
        ),
        h('div', { class: 'freight-list' },
          ...freightOpts.map((opt) =>
            h('label', { class: 'freight-item', style: { cursor: 'pointer' } },
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '0.55rem' } },
                h('input', {
                  type: 'radio',
                  name: 'shippingCarrier',
                  checked: (getState().shippingQuote?.code || 'PAC') === opt.code,
                  onChange: () => {
                    selectShippingQuote(opt);
                    renderCheckout();
                  }
                }),
                h('div', null,
                  h('strong', { style: { display: 'block', color: 'var(--text-primary)' } }, opt.carrier),
                  h('span', { style: { color: 'var(--text-muted)' } }, opt.days)
                )
              ),
              h('strong', { style: { color: opt.price === 0 ? 'var(--accent-emerald-bright)' : 'var(--accent-gold)' } },
                opt.price === 0 ? 'Gratis' : money(opt.price)
              )
            )
          )
        )
      ),
      h('div', { class: 'pdp-box', style: { display: 'grid', gap: '0.65rem' } },
        h('h4', { style: { fontSize: '1.15rem' } }, '3. Forma de Pagamento'),
        h('div', { class: 'pay-tabs' },
          ...[
            { id: 'pix', label: 'Pix (-5%)' },
            { id: 'card', label: 'Cartao (10x)' },
            { id: 'boleto', label: 'Boleto' },
            { id: 'wallet', label: 'Carteiras' }
          ].map((tab) =>
            h('button', {
              type: 'button',
              class: `pay-tab ${selectedPayment === tab.id ? 'is-active' : ''}`,
              onClick: () => {
                selectedPayment = tab.id;
                renderCheckout();
              }
            }, tab.label)
          )
        ),
        paymentPanel
      )
    ),
    /* Right Column: Order Summary */
    h('div', { class: 'pdp-box', style: { display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'fit-content' } },
      h('h4', { style: { fontSize: '1.2rem' } }, 'Resumo do Pedido'),
      ...state.cart.map((item) =>
        h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' } },
          h('span', null, `${item.qty}x ${item.name} (${item.size})`),
          h('strong', { class: 'num-tabular' }, money(item.price * item.qty))
        )
      ),
      h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' } },
        h('span', { style: { color: 'var(--text-secondary)' } }, 'Subtotal'),
        h('span', { class: 'num-tabular' }, money(summary.subtotal))
      ),
      h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' } },
        h('span', { style: { color: 'var(--text-secondary)' } }, 'Frete e Seguro'),
        h('span', { class: 'num-tabular', style: { color: summary.shipping === 0 ? 'var(--accent-emerald-bright)' : 'inherit' } },
          summary.shipping === 0 ? 'Gratis' : money(summary.shipping)
        )
      ),
      summary.couponDiscount > 0
        ? h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--accent-gold)' } },
            h('span', null, `Cupom (${state.couponCode})`),
            h('span', { class: 'num-tabular' }, `- ${money(summary.couponDiscount)}`)
          )
        : null,
      summary.pixDiscount > 0
        ? h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--accent-emerald-bright)' } },
            h('span', null, 'Desconto Pix (5%)'),
            h('span', { class: 'num-tabular' }, `- ${money(summary.pixDiscount)}`)
          )
        : null,
      h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '600', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' } },
        h('span', null, 'Total Final'),
        h('span', { class: 'num-tabular', style: { color: 'var(--accent-gold)' } }, money(summary.total))
      ),
      h('button', { type: 'submit', class: 'btn btn-primary btn-block', style: { marginTop: '0.5rem' } },
        icon('shield-check', 'icon'), 'Confirmar Compra Segura'
      ),
      h('p', { style: { fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' } },
        'Garantia de 7 dias para troca ou arrependimento (CDC) · Primeira ajuste ou troca por nossa conta.'
      )
    ));

    body.appendChild(checkoutForm);
  };

  renderCheckout();
  openModal(dialog);
}

/* ==========================================================================
   CUSTOMER ACCOUNT, WISHLIST, ORDER TRACKING & CONCIERGE MODALS
   ========================================================================== */

export function openAccountModal() {
  const dialog = qs('#account-modal');
  const body = qs('#account-modal-body');
  if (!dialog || !body) return;

  const renderAccount = () => {
    clear(body);
    const state = getState();

    if (!state.customer) {
      const loginForm = h('form', {
        class: 'pdp-box',
        style: { display: 'grid', gap: '0.75rem', maxWidth: '460px', marginInline: 'auto' },
        onSubmit: (e) => {
          e.preventDefault();
          const fd = new FormData(loginForm);
          loginCustomer({ name: fd.get('name'), email: fd.get('email'), provider: 'Email' });
          toast('Sessao iniciada com sucesso!');
          renderAccount();
        }
      },
      h('h3', { style: { fontSize: '1.5rem' } }, 'Entrar ou Criar Conta Broth Club'),
      h('p', { style: { fontSize: '0.82rem', color: 'var(--text-secondary)' } },
        'Acompanhe pedidos em tempo real, salve medidas de atelier, gerencie favoritos e acumule 5% de cashback.'
      ),
      h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' } },
        h('button', {
          type: 'button',
          class: 'btn btn-outline btn-sm',
          onClick: () => {
            loginCustomer({ name: 'Artista Broth', email: 'artista@gmail.com', provider: 'Google' });
            toast('Conectado via Conta Google!');
            renderAccount();
          }
        }, 'Entrar com Google'),
        h('button', {
          type: 'button',
          class: 'btn btn-outline btn-sm',
          onClick: () => {
            loginCustomer({ name: 'Cliente VIP', email: 'vip@meta.com', provider: 'Facebook' });
            toast('Conectado via Facebook!');
            renderAccount();
          }
        }, 'Entrar com Facebook')
      ),
      h('input', { name: 'name', required: true, class: 'form-input', placeholder: 'Seu nome completo ou artistico' }),
      h('input', { type: 'email', name: 'email', required: true, class: 'form-input', placeholder: 'Seu e-mail' }),
      h('input', { type: 'password', name: 'password', required: true, class: 'form-input', placeholder: 'Sua senha' }),
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' } },
        h('button', {
          type: 'button',
          style: { color: 'var(--accent-gold)', textDecoration: 'underline' },
          onClick: () => toast('Link de redefinicao de senha enviado para o seu e-mail!')
        }, 'Esqueci minha senha'),
        h('span', { style: { color: 'var(--text-muted)' } }, 'Protegido por LGPD')
      ),
      h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Acessar Minha Conta'));

      body.appendChild(loginForm);
      return;
    }

    const usr = state.customer;
    body.appendChild(
      h('div', { style: { display: 'grid', gap: '1.25rem' } },
        h('div', { class: 'pdp-box', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' } },
          h('div', null,
            h('span', { class: 'eyebrow' }, `Membro Broth Club (${usr.provider})`),
            h('h3', { style: { fontSize: '1.6rem' } }, usr.name),
            h('p', { style: { fontSize: '0.82rem', color: 'var(--text-secondary)' } }, usr.email)
          ),
          h('div', { style: { textAlign: 'right' } },
            h('div', { style: { fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' } }, 'Saldo Cashback (5%)'),
            h('div', { style: { fontSize: '1.4rem', color: 'var(--accent-emerald-bright)', fontWeight: '600' } }, money(usr.cashbackBalance)),
            h('button', {
              type: 'button',
              class: 'btn btn-outline btn-sm',
              style: { marginTop: '0.4rem' },
              onClick: () => {
                logoutCustomer();
                renderAccount();
              }
            }, 'Encerrar Sessao')
          )
        ),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' } },
          h('div', { class: 'pdp-box' },
            h('h4', { style: { fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--accent-gold)' } }, 'Endereco Padrao Salvo'),
            h('p', { style: { fontSize: '0.85rem', color: 'var(--text-secondary)' } },
              `${usr.savedAddress.street} - ${usr.savedAddress.neighborhood}, ${usr.savedAddress.city}/${usr.savedAddress.uf} (${usr.savedAddress.cep})`
            )
          ),
          h('div', { class: 'pdp-box' },
            h('h4', { style: { fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--accent-gold)' } }, 'Forma de Pagamento Salva'),
            ...usr.savedCards.map((c) =>
              h('p', { style: { fontSize: '0.85rem', color: 'var(--text-secondary)' } },
                `${c.brand} final ${c.last4} · Validade ${c.exp}`
              )
            )
          )
        ),
        h('div', { class: 'pdp-box' },
          h('h4', { style: { fontSize: '1.2rem', marginBottom: '0.75rem' } }, 'Historico de Pedidos & Notas Fiscais'),
          ...state.orders.map((ord) =>
            h('div', { class: 'freight-item', style: { marginBottom: '0.5rem', flexWrap: 'wrap' } },
              h('div', null,
                h('strong', { style: { color: 'var(--text-primary)' } }, `${ord.id} · ${ord.status}`),
                h('div', { style: { color: 'var(--text-muted)' } }, `Rastreio: ${ord.trackingCode} · NF-e ${ord.nfeNumber}`)
              ),
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '0.65rem' } },
                h('strong', { style: { color: 'var(--accent-gold)' } }, money(ord.total)),
                h('button', {
                  type: 'button',
                  class: 'btn btn-outline btn-sm',
                  onClick: () => {
                    dialog.close();
                    openTrackingModal(ord.id);
                  }
                }, 'Rastrear')
              )
            )
          )
        )
      )
    );
  };

  renderAccount();
  openModal(dialog);
}

export function openWishlistDrawer() {
  const drawer = qs('#wishlist-drawer');
  const body = qs('#wishlist-drawer-body');
  if (!drawer || !body) return;
  clear(body);

  const wishIds = getState().wishlist;
  if (!wishIds.length) {
    body.appendChild(h('p', { style: { color: 'var(--text-secondary)', padding: '2rem 0' } }, 'Sua Lista de Desejos esta vazia.'));
  } else {
    for (const id of wishIds) {
      const p = getProductById(id);
      if (!p) continue;
      const imgs = getProductImages(p);
      body.appendChild(
        h('div', { class: 'pdp-box', style: { display: 'grid', gridTemplateColumns: '64px 1fr', gap: '0.85rem', marginBottom: '0.75rem', alignItems: 'center' } },
          h('img', { src: imgs[0], alt: p.name, width: '64', height: '86' }),
          h('div', null,
            h('strong', { style: { fontSize: '0.92rem', display: 'block' } }, p.name),
            h('span', { style: { fontSize: '0.82rem', color: 'var(--accent-gold)' } }, money(getEffectivePrice(p))),
            h('div', { style: { display: 'flex', gap: '0.5rem', marginTop: '0.45rem' } },
              h('button', {
                type: 'button',
                class: 'btn btn-primary btn-sm',
                onClick: () => {
                  drawer.close();
                  openProductModal(p.id);
                }
              }, 'Abrir Peca'),
              h('button', {
                type: 'button',
                class: 'btn btn-outline btn-sm',
                onClick: () => {
                  toggleWishlist(p.id);
                  openWishlistDrawer();
                }
              }, 'Remover')
            )
          )
        )
      );
    }
  }
  openModal(drawer);
}

export function openTrackingModal(initialCode = '') {
  const dialog = qs('#tracking-modal');
  const body = qs('#tracking-modal-body');
  if (!dialog || !body) return;

  const renderTracking = (queryVal) => {
    clear(body);
    const ord = findOrder(queryVal);
    const searchInput = h('input', {
      type: 'text',
      class: 'form-input',
      value: queryVal || ord?.id || 'PED-2026-8841',
      placeholder: 'Ex: PED-2026-8841 ou BR884190234BC',
      style: { flex: '1' }
    });

    body.appendChild(
      h('div', { style: { display: 'grid', gap: '1.15rem' } },
        h('div', { class: 'pdp-box', style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' } },
          searchInput,
          h('button', {
            type: 'button',
            class: 'btn btn-primary btn-sm',
            onClick: () => renderTracking(searchInput.value)
          }, 'Consultar Rastreio')
        ),
        ord
          ? h('div', { class: 'pdp-box', style: { display: 'grid', gap: '0.85rem' } },
              h('div', { style: { display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' } },
                h('div', null,
                  h('span', { class: 'eyebrow' }, ord.shippingMethod),
                  h('h4', { style: { fontSize: '1.35rem' } }, `${ord.id} · Objeto ${ord.trackingCode}`)
                ),
                h('span', { class: 'badge-tag' }, ord.status)
              ),
              h('div', { style: { display: 'grid', gap: '0.65rem' } },
                ...(ord.timeline || []).map((step) =>
                  h('div', { style: { display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: step.done ? '1' : '0.5' } },
                    icon(step.done ? 'check-circle-fill' : 'clock', 'icon'),
                    h('div', null,
                      h('div', { style: { fontSize: '0.74rem', color: 'var(--accent-gold)' } }, step.date),
                      h('div', { style: { fontSize: '0.88rem' } }, step.title)
                    )
                  )
                )
              )
            )
          : h('p', { style: { color: 'var(--text-secondary)' } }, 'Pedido nao localizado. Tente o codigo PED-2026-8841.')
      )
    );
  };

  renderTracking(initialCode);
  openModal(dialog);
}

export function openConciergeModal() {
  const dialog = qs('#concierge-modal');
  const body = qs('#concierge-modal-body');
  if (!dialog || !body) return;
  clear(body);

  const state = getState();
  const chatHistory = h('div', { style: { display: 'grid', gap: '0.65rem', maxHeight: '220px', overflowY: 'auto', padding: '0.5rem 0' } },
    h('div', { class: 'pdp-box' },
      h('strong', { style: { color: 'var(--accent-gold)', fontSize: '0.76rem', display: 'block' } }, 'Concierge Broth Concept (Online)'),
      h('p', { style: { fontSize: '0.85rem' } }, 'Ola! Posso ajudar com sugestao de tamanho, encomenda de figurino para show/clipe, status de entrega ou protocolo de troca.')
    )
  );

  const chatInput = h('input', {
    type: 'text',
    class: 'form-input',
    placeholder: 'Escreva sua mensagem para o Concierge...',
    style: { flex: '1' }
  });

  const sendChatMessage = (text) => {
    const clean = String(text || '').trim();
    if (!clean) return;
    chatHistory.appendChild(
      h('div', { class: 'pdp-box', style: { borderColor: 'var(--border-gold)', textAlign: 'right' } },
        h('p', { style: { fontSize: '0.85rem' } }, clean)
      )
    );
    let reply = 'Nosso estilista recebeu sua mensagem! Para atendimento por video ou envio de croqui, também atendemos no WhatsApp +55 (43) 98834-1414.';
    if (/frete|prazo|entrega/i.test(clean)) {
      reply = 'Enviamos para todo o Brasil via Correios SEDEX e Jadlog Porta-Terno, com frete gratis acima de R$ 900 ou retirada em 24h no Atelier Londrina.';
    } else if (/troca|devolu/i.test(clean)) {
      reply = 'Voce tem 7 dias corridos apos o recebimento para devolucao integral (CDC) e 30 dias para primeira troca ou ajuste de barra gratuito.';
    } else if (/medida|palco|show|cantor/i.test(clean)) {
      reply = 'Desenvolvemos figurinos sob medida para shows, clipes e turnes em 7 a 15 dias uteis, com conferencia de medidas por video.';
    }
    setTimeout(() => {
      chatHistory.appendChild(
        h('div', { class: 'pdp-box' },
          h('strong', { style: { color: 'var(--accent-gold)', fontSize: '0.76rem', display: 'block' } }, 'Concierge Broth Concept'),
          h('p', { style: { fontSize: '0.85rem' } }, reply)
        )
      );
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }, 320);
  };

  const ticketForm = h('form', {
    class: 'pdp-box',
    style: { display: 'grid', gap: '0.6rem', marginTop: '1rem' },
    onSubmit: (e) => {
      e.preventDefault();
      const fd = new FormData(ticketForm);
      const t = createSupportTicket({
        name: fd.get('name'),
        email: fd.get('email'),
        subject: fd.get('subject'),
        message: fd.get('message')
      });
      toast(`Chamado ${t.id} aberto com sucesso!`);
      openConciergeModal();
    }
  },
  h('h4', { style: { fontSize: '1.1rem' } }, 'Abrir Chamado na Central de Ajuda (Trocas, Sob Medida ou Suporte)'),
  h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' } },
    h('input', { name: 'name', required: true, class: 'form-input', placeholder: 'Seu nome' }),
    h('input', { type: 'email', name: 'email', required: true, class: 'form-input', placeholder: 'Seu e-mail' })
  ),
  h('input', { name: 'subject', required: true, class: 'form-input', placeholder: 'Assunto (ex: Solicitar codigo de postagem reversa / Troca)' }),
  h('textarea', { name: 'message', required: true, rows: '2', class: 'form-textarea', placeholder: 'Detalhes da solicitacao...' }),
  h('button', { type: 'submit', class: 'btn btn-outline btn-sm' }, 'Registrar Protocolo de Atendimento'));

  body.appendChild(
    h('div', null,
      chatHistory,
      h('div', { style: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem' } },
        chatInput,
        h('button', {
          type: 'button',
          class: 'btn btn-primary btn-sm',
          onClick: () => {
            sendChatMessage(chatInput.value);
            chatInput.value = '';
          }
        }, 'Enviar')
      ),
      ticketForm,
      h('div', { style: { marginTop: '1rem', display: 'grid', gap: '0.5rem' } },
        h('h4', { style: { fontSize: '1rem', color: 'var(--accent-gold)' } }, 'Chamados Recentes'),
        ...(state.tickets || []).map((tk) =>
          h('div', { class: 'freight-item' },
            h('div', null,
              h('strong', null, `${tk.id} · ${tk.subject}`),
              h('div', { style: { color: 'var(--text-muted)' } }, tk.reply)
            ),
            h('span', { class: 'badge-tag' }, tk.status)
          )
        )
      )
    )
  );

  openModal(dialog);
}

export function openPostModal(slug) {
  const post = (getState().posts || []).find((p) => p.slug === slug);
  const dialog = qs('#post-modal');
  const body = qs('#post-modal-body');
  const titleEl = qs('#post-modal-title');
  if (!post || !dialog || !body) return;

  if (titleEl) titleEl.textContent = post.category;
  clear(body);
  body.appendChild(
    h('article', { style: { display: 'grid', gap: '1.15rem', maxWidth: '720px', marginInline: 'auto' } },
      h('h2', { style: { fontSize: '2rem' } }, post.title),
      h('div', { style: { fontSize: '0.78rem', color: 'var(--accent-gold)' } }, `${dateBR(post.date)} · ${post.readTime || 'Leitura Editorial'}`),
      h('img', { src: post.image, alt: post.title, width: '960', height: '720', style: { width: '100%', borderRadius: '4px' } }),
      ...(post.body || []).map((para) =>
        h('p', { style: { fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.75' } }, para)
      )
    )
  );
  openModal(dialog);
}

/* ==========================================================================
   SECRET ADMIN ACCESS & GLOBAL EVENT BINDINGS
   ========================================================================== */

function initSecretAdminAccess() {
  /* Secret Keyboard Shortcut: Ctrl + Shift + A */
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      window.location.href = '/gestao-interna.html';
    }
  });

  /* Secret 4-click trigger on footer copyright year */
  let clicks = 0;
  let timer = null;
  const triggerEl = qs('#secret-copyright-trigger');
  if (triggerEl) {
    triggerEl.addEventListener('click', () => {
      clicks += 1;
      clearTimeout(timer);
      if (clicks >= 4) {
        clicks = 0;
        window.location.href = '/gestao-interna.html';
      } else {
        timer = setTimeout(() => { clicks = 0; }, 1400);
      }
    });
  }
}

function initDomEvents() {
  /* Category & Subcategory Filter Triggers */
  qsa('[data-cat-filter]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      filterState.category = el.dataset.catFilter || 'all';
      filterState.subcategory = el.dataset.subFilter || 'all';
      syncFilterControls();
      renderCatalog();
      updateBreadcrumbs();
      qs('#catalogo')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  qs('#filter-category')?.addEventListener('change', (e) => {
    filterState.category = e.target.value;
    filterState.subcategory = 'all';
    populateSubcategorySelect();
    syncFilterControls();
    renderCatalog();
    updateBreadcrumbs();
  });

  qs('#filter-subcategory')?.addEventListener('change', (e) => {
    filterState.subcategory = e.target.value;
    renderCatalog();
    updateBreadcrumbs();
  });

  qs('#filter-line')?.addEventListener('change', (e) => {
    filterState.line = e.target.value;
    renderCatalog();
  });

  qs('#filter-sort')?.addEventListener('change', (e) => {
    filterState.sort = e.target.value;
    renderCatalog();
  });

  qs('#filter-instock')?.addEventListener('change', (e) => {
    filterState.onlyInStock = e.target.checked;
    renderCatalog();
  });

  /* Header Action Buttons */
  qs('#open-cart-btn')?.addEventListener('click', openCartDrawer);
  qs('#open-wishlist-btn')?.addEventListener('click', openWishlistDrawer);
  qs('#open-account-btn')?.addEventListener('click', openAccountModal);
  qs('#open-tracking-btn')?.addEventListener('click', () => openTrackingModal());
  qs('#open-concierge-btn')?.addEventListener('click', openConciergeModal);
  qs('#floating-concierge-btn')?.addEventListener('click', openConciergeModal);

  qsa('[data-open-tracking]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.preventDefault();
      openTrackingModal();
    })
  );

  qsa('[data-open-concierge]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.preventDefault();
      openConciergeModal();
    })
  );

  qsa('[data-open-account]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.preventDefault();
      openAccountModal();
    })
  );

  qsa('[data-apply-coupon]').forEach((b) =>
    b.addEventListener('click', () => {
      const code = b.dataset.applyCoupon;
      applyCoupon(code);
      toast(`Cupom ${code} ativado! Adicione pecas na sacola para utilizar.`);
      qs('#catalogo')?.scrollIntoView({ behavior: 'smooth' });
    })
  );

  /* Close buttons inside native <dialog> elements */
  qsa('[data-close-dialog]').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.closest('dialog')?.close();
    });
  });

  /* Newsletter Form */
  const newsForm = qs('#newsletter-form');
  if (newsForm) {
    newsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = qs('#newsletter-email')?.value;
      const res = subscribeNewsletter(email);
      if (res.ok) {
        applyCoupon(res.coupon);
        newsForm.reset();
        toast('Inscricao confirmada! Cupom BROTH10 (10% off) ativado na sua sacola.');
      } else {
        toast(res.message);
      }
    });
  }

  /* Cookie Consent Banner */
  const cookieBanner = qs('#cookie-banner');
  if (cookieBanner && !getState().cookieConsent) {
    cookieBanner.hidden = false;
  }
  qs('#accept-cookies-btn')?.addEventListener('click', () => {
    acceptCookies();
    if (cookieBanner) cookieBanner.hidden = true;
  });

  /* Deep link support (?produto=slug) */
  const prodSlug = params().get('produto');
  if (prodSlug) {
    setTimeout(() => openProductModal(prodSlug), 200);
  }
}

function bootstrap() {
  initSmoothScroll();
  renderAnnouncementBar();
  updateHeaderBadges();
  populateSubcategorySelect();
  updateBreadcrumbs();
  initSearchAutocomplete();
  initHeroSlider();
  renderCatalog();
  renderRecentlyViewedSection();
  renderJournalSection();
  initDomEvents();
  initSecretAdminAccess();

  subscribe(() => {
    renderAnnouncementBar();
    updateHeaderBadges();
    renderCatalog();
    renderRecentlyViewedSection();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
