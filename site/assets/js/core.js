/**
 * Utilitarios centrais - Broth Concept
 * Criacao segura de nos DOM via createElement/textContent, formatacao pt-BR, icones e feedback.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Cria elementos com props seguras. Texto sempre vira TextNode. */
export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'class') el.className = value;
      else if (key === 'dataset') Object.assign(el.dataset, value);
      else if (key === 'style' && typeof value === 'object') {
        for (const [prop, v] of Object.entries(value)) el.style.setProperty(prop, v);
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'text') el.textContent = value;
      else if (value === true) el.setAttribute(key, '');
      else el.setAttribute(key, String(value));
    }
  }
  append(el, children);
  return el;
}

export function append(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

export function clear(el) {
  if (!el) return el;
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

/** Icone do sprite Phosphor Light local. */
export function icon(name, cls = 'icon') {
  const symbolId = String(name).startsWith('i-') ? name : `i-${name}`;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `/assets/icons.svg#${symbolId}`);
  svg.appendChild(use);
  return svg;
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const money = (v) => brl.format(Number(v) || 0);
export const dateBR = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const dateTimeBR = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const onlyDigits = (s) => String(s || '').replace(/\D/g, '');
export const maskCep = (s) => onlyDigits(s).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
export const maskPhone = (s) => {
  const d = onlyDigits(s).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3').replace(/[-\s]$/, '');
  return d.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
};
export const maskCpf = (s) => onlyDigits(s).slice(0, 11)
  .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
export const maskCard = (s) => onlyDigits(s).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
export const maskExp = (s) => onlyDigits(s).slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');

export function cardBrand(number) {
  const d = onlyDigits(number);
  if (/^4/.test(d)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(d)) return 'Elo';
  return d.length ? 'Cartao' : '';
}

/** Validacao de Luhn (simulacao de checagem antifraude no cliente). */
export function luhn(number) {
  const d = onlyDigits(number);
  if (d.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i -= 1) {
    let n = Number(d[i]);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function toast(message) {
  let region = document.getElementById('toast-stack');
  if (!region) {
    region = h('div', { id: 'toast-stack', class: 'toast-stack', 'aria-live': 'polite', role: 'status' });
    document.body.appendChild(region);
  }
  const item = h('div', { class: 'toast' }, icon('sparkle', 'icon icon-sm'), h('span', null, message));
  region.appendChild(item);
  setTimeout(() => {
    item.classList.add('is-leaving');
    setTimeout(() => item.remove(), 350);
  }, 3600);
}

export function stars(rating, cls = 'icon icon-sm') {
  const wrap = h('span', { class: 'stars', role: 'img', 'aria-label': `${Number(rating).toFixed(1)} de 5 estrelas` });
  for (let i = 1; i <= 5; i += 1) {
    wrap.appendChild(icon(rating >= i - 0.25 ? 'star-fill' : 'star', cls));
  }
  return wrap;
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function params() {
  return new URLSearchParams(window.location.search);
}

/** Fallback de light-dismiss para <dialog closedby="any"> (Safari). */
export function enableLightDismiss(dialog) {
  if (!dialog || ('closedBy' in HTMLDialogElement.prototype)) return;
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    const inside = r.top <= event.clientY && event.clientY <= r.bottom && r.left <= event.clientX && event.clientX <= r.right;
    if (!inside) dialog.close();
  });
}

/** Abre um <dialog> com suporte a light-dismiss. */
export function openModal(dialog) {
  if (!dialog) return;
  enableLightDismiss(dialog);
  if (!dialog.open) dialog.showModal();
}
