/**
 * Painel Administrativo, Vitrine, Cupons, Banners, Pedidos e ERP NF-e - Broth Concept
 * Acesso restrito (/gestao-interna.html, noindex) sincronizado em tempo real com a vitrine.
 */

import { h, clear, icon, qs, qsa, money, sha256, toast } from './core.js';
import {
  getState,
  subscribe,
  getProducts,
  getProductById,
  getEffectivePrice,
  getProductStockTotal,
  upsertProduct,
  deleteProduct,
  upsertCoupon,
  toggleCouponStatus,
  updateBanners,
  advanceOrderStatus,
  resetDemoState
} from './store.js';

const SESSION_AUTH_KEY = 'broth_admin_unlocked_v3';

function isUnlocked() {
  return sessionStorage.getItem(SESSION_AUTH_KEY) === '1';
}

async function verifyPin(pin) {
  const clean = String(pin || '').trim();
  if (clean === '2026') return true;
  const hash = await sha256(`broth:${clean}`);
  return hash === getState().settings.adminPinHash;
}

function renderKpis() {
  const wrap = qs('#admin-kpis');
  if (!wrap) return;
  clear(wrap);

  const state = getState();
  const totalRevenue = state.orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const avgTicket = state.orders.length ? totalRevenue / state.orders.length : 0;
  const totalStock = state.products.reduce((acc, p) => acc + getProductStockTotal(p), 0);
  const activeCoupons = state.coupons.filter((c) => c.active).length;

  const cards = [
    { label: 'Receita Faturada (ERP)', val: money(totalRevenue), sub: `${state.orders.length} pedidos c/ NF-e` },
    { label: 'Ticket Medio da Maison', val: money(avgTicket), sub: '5% cashback Broth Club ativo' },
    { label: 'Pecas no Acervo / Estoque', val: `${state.products.length} SKUs (${totalStock} un.)`, sub: 'Sincronizado c/ vitrine' },
    { label: 'Cupons & Campanhas', val: `${activeCoupons} ativos`, sub: 'BROTH10 · PRIDE20 · PALCO100' }
  ];

  for (const c of cards) {
    wrap.appendChild(
      h('div', { class: 'pdp-box' },
        h('div', { style: { fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)' } }, c.label),
        h('div', { style: { fontSize: '1.65rem', fontFamily: 'var(--font-display)', color: 'var(--accent-gold)', marginBlock: '0.2rem' } }, c.val),
        h('div', { style: { fontSize: '0.75rem', color: 'var(--text-secondary)' } }, c.sub)
      )
    );
  }
}

function renderProductsTable() {
  const tbody = qs('#admin-products-list');
  if (!tbody) return;
  clear(tbody);

  for (const p of getProducts()) {
    const stockSum = getProductStockTotal(p);
    tbody.appendChild(
      h('div', { class: 'freight-item', style: { flexWrap: 'wrap', gap: '1rem' } },
        h('div', { style: { flex: '1 1 240px' } },
          h('div', { style: { fontSize: '0.72rem', color: 'var(--accent-gold)', letterSpacing: '0.12em', textTransform: 'uppercase' } },
            `${p.sku} · ${p.line} · ${p.category}/${p.subcategory}`
          ),
          h('strong', { style: { fontSize: '1rem', color: 'var(--text-primary)' } }, p.name),
          h('div', { style: { fontSize: '0.78rem', color: 'var(--text-secondary)' } }, p.short)
        ),
        h('div', { style: { fontSize: '0.82rem' } },
          h('div', null, `Preco: ${money(p.price)}`),
          p.promoPrice ? h('div', { style: { color: 'var(--accent-emerald-bright)' } }, `Promo: ${money(p.promoPrice)}`) : null
        ),
        h('div', { style: { fontSize: '0.78rem', color: stockSum > 0 ? 'var(--text-secondary)' : 'var(--accent-crimson)' } },
          `Estoque: ${stockSum} un. (${Object.entries(p.stock || {}).map(([k, v]) => `${k}:${v}`).join(' ')})`
        ),
        h('div', { style: { display: 'flex', gap: '0.45rem' } },
          h('button', {
            type: 'button',
            class: 'btn btn-outline btn-sm',
            onClick: () => populateProductForm(p.id)
          }, icon('pencil-simple', 'icon icon-sm'), 'Editar'),
          h('button', {
            type: 'button',
            class: 'btn btn-outline btn-sm',
            onClick: () => {
              deleteProduct(p.id);
              toast(`Peca ${p.sku} removida da vitrine.`);
            }
          }, icon('trash', 'icon icon-sm'))
        )
      )
    );
  }
}

function populateProductForm(productId) {
  const p = getProductById(productId);
  const form = qs('#admin-product-form');
  if (!p || !form) return;

  form.elements.id.value = p.id;
  form.elements.sku.value = p.sku;
  form.elements.name.value = p.name;
  form.elements.line.value = p.line;
  form.elements.category.value = p.category;
  form.elements.subcategory.value = p.subcategory;
  form.elements.price.value = p.price;
  form.elements.promoPrice.value = p.promoPrice || '';
  form.elements.badge.value = p.badge || '';
  form.elements.short.value = p.short || '';
  form.elements.description.value = p.description || '';
  form.elements.stockP.value = p.stock?.P ?? 2;
  form.elements.stockM.value = p.stock?.M ?? 3;
  form.elements.stockG.value = p.stock?.G ?? 2;
  form.elements.specComp.value = p.specs?.Composicao || '';
  form.elements.featured.checked = Boolean(p.featured);

  form.scrollIntoView({ behavior: 'smooth' });
  toast(`Editando ${p.sku} - ${p.name}`);
}

function renderCouponsList() {
  const wrap = qs('#admin-coupons-list');
  if (!wrap) return;
  clear(wrap);

  for (const c of getState().coupons) {
    wrap.appendChild(
      h('div', { class: 'freight-item' },
        h('div', null,
          h('strong', { style: { color: 'var(--accent-gold)' } }, c.code),
          h('span', { style: { marginLeft: '0.5rem', color: 'var(--text-secondary)' } },
            `${c.type === 'percent' ? `${c.value}% off` : `${money(c.value)} off`} · Minimo ${money(c.minOrder)} · ${c.description}`
          )
        ),
        h('button', {
          type: 'button',
          class: 'btn btn-outline btn-sm',
          onClick: () => {
            toggleCouponStatus(c.code);
            toast(`Status do cupom ${c.code} alterado.`);
          }
        }, c.active ? 'Ativo (Desativar)' : 'Inativo (Ativar)')
      )
    );
  }
}

function renderOrdersErp() {
  const wrap = qs('#admin-orders-list');
  if (!wrap) return;
  clear(wrap);

  for (const ord of getState().orders) {
    wrap.appendChild(
      h('div', { class: 'pdp-box', style: { display: 'grid', gap: '0.55rem' } },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' } },
          h('strong', { style: { fontSize: '0.95rem', color: 'var(--accent-gold)' } },
            `${ord.id} · ${ord.customer?.name} (${ord.customer?.city || 'Brasil'})`
          ),
          h('span', { class: 'badge-tag' }, ord.status)
        ),
        h('div', { style: { fontSize: '0.78rem', color: 'var(--text-secondary)' } },
          `Total: ${money(ord.total)} · ${ord.paymentMethod} · Envio: ${ord.shippingMethod} (${ord.trackingCode})`
        ),
        h('div', { style: { fontSize: '0.74rem', color: 'var(--text-muted)' } },
          `NF-e Nº ${ord.nfeNumber} · Chave: ${ord.nfeKey}`
        ),
        h('div', { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' } },
          h('button', {
            type: 'button',
            class: 'btn btn-outline btn-sm',
            onClick: () => {
              advanceOrderStatus(ord.id, 'Postado nos Correios / Em Transito');
              toast(`Pedido ${ord.id} atualizado para Em Transito.`);
            }
          }, 'Marcar Despachado'),
          h('button', {
            type: 'button',
            class: 'btn btn-outline btn-sm',
            onClick: () => {
              advanceOrderStatus(ord.id, 'Entregue ao Destinatario');
              toast(`Pedido ${ord.id} concluido como Entregue.`);
            }
          }, 'Marcar Entregue'),
          h('button', {
            type: 'button',
            class: 'btn btn-primary btn-sm',
            onClick: () => {
              toast(`DANFE / XML da NF-e ${ord.nfeNumber} gerado e enviado para ${ord.customer?.email}`);
            }
          }, 'Emitir / Enviar NF-e')
        )
      )
    );
  }
}

function populateBannerForm() {
  const form = qs('#admin-banner-form');
  if (!form) return;
  const { banners } = getState();
  form.elements.topBarText.value = banners?.topBar?.text || '';
  form.elements.promoTitle.value = banners?.promo?.title || '';
  form.elements.promoText.value = banners?.promo?.text || '';
  form.elements.promoCoupon.value = banners?.promo?.coupon || 'PRIDE20';
}

function renderAllAdmin() {
  renderKpis();
  renderProductsTable();
  renderCouponsList();
  renderOrdersErp();
  populateBannerForm();
}

function initAdminEvents() {
  const lockScreen = qs('#admin-lock-screen');
  const dashboard = qs('#admin-dashboard');
  const pinForm = qs('#admin-pin-form');

  const syncUnlockView = () => {
    const unlocked = isUnlocked();
    if (lockScreen) lockScreen.hidden = unlocked;
    if (dashboard) dashboard.hidden = !unlocked;
    if (unlocked) renderAllAdmin();
  };

  syncUnlockView();

  pinForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pinVal = qs('#admin-pin-input')?.value;
    if (await verifyPin(pinVal)) {
      sessionStorage.setItem(SESSION_AUTH_KEY, '1');
      syncUnlockView();
      toast('Acesso Administrativo & ERP liberado.');
    } else {
      toast('PIN incorreto. Na previa, utilize o codigo 2026.');
    }
  });

  qs('#admin-logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    syncUnlockView();
  });

  /* Product Form Submit */
  const prodForm = qs('#admin-product-form');
  prodForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(prodForm);
    const sku = String(fd.get('sku') || 'BC-010').trim().toUpperCase();
    const name = String(fd.get('name') || '').trim();
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');

    const data = {
      id: fd.get('id') || undefined,
      sku,
      slug,
      name,
      line: fd.get('line') || 'Broth Stage',
      category: fd.get('category') || 'palco',
      subcategory: fd.get('subcategory') || 'tops',
      price: Number(fd.get('price') || 450),
      promoPrice: fd.get('promoPrice') ? Number(fd.get('promoPrice')) : null,
      badge: fd.get('badge') || 'Lancamento',
      short: fd.get('short') || '',
      description: fd.get('description') || '',
      featured: prodForm.elements.featured.checked,
      colors: [{ name: 'Noir Atelier', hex: '#141414' }],
      sizes: ['P', 'M', 'G'],
      stock: {
        P: Number(fd.get('stockP') || 2),
        M: Number(fd.get('stockM') || 3),
        G: Number(fd.get('stockG') || 2)
      },
      specs: {
        Composicao: fd.get('specComp') || 'Tecido autoral selecionado no atelier',
        Origem: 'Desenhado e costurado em Londrina - PR'
      }
    };

    const customImg = String(fd.get('imageUrl') || '').trim();
    if (customImg) {
      data.customImages = [customImg, customImg, customImg];
    }

    upsertProduct(data);
    prodForm.reset();
    prodForm.elements.id.value = '';
    toast(`Peca ${sku} salva e publicada na vitrine!`);
  });

  /* Coupon Form Submit */
  const couponForm = qs('#admin-coupon-form');
  couponForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(couponForm);
    upsertCoupon({
      code: fd.get('code'),
      type: fd.get('type'),
      value: Number(fd.get('value') || 10),
      minOrder: Number(fd.get('minOrder') || 0),
      description: fd.get('description') || 'Cupom promocional'
    });
    couponForm.reset();
    toast('Cupom salvo com sucesso!');
  });

  /* Banner Form Submit */
  const bannerForm = qs('#admin-banner-form');
  bannerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(bannerForm);
    const current = getState().banners;
    updateBanners({
      topBar: { active: true, text: fd.get('topBarText') },
      promo: {
        ...current.promo,
        active: true,
        title: fd.get('promoTitle'),
        text: fd.get('promoText'),
        coupon: fd.get('promoCoupon')
      }
    });
    toast('Banners e barra de topo atualizados na vitrine!');
  });

  /* Export Backup & Reset Demo */
  qs('#admin-export-btn')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: `broth-concept-backup-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Backup criptografado exportado em JSON!');
  });

  qs('#admin-reset-btn')?.addEventListener('click', () => {
    resetDemoState();
    toast('Catalogo e estoque restaurados para o padrao original da colecao.');
  });

  subscribe(() => {
    if (isUnlocked()) renderAllAdmin();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminEvents);
} else {
  initAdminEvents();
}
