const state = {
  products: [],
  cart: new Map(),
  category: 'Todos',
  search: '',
  paymentMode: 'test'
};

const elements = {
  categoryTabs: document.querySelector('#category-tabs'),
  productGrid: document.querySelector('#product-grid'),
  search: document.querySelector('#product-search'),
  clear: document.querySelector('#clear-cart'),
  cartItems: document.querySelector('#cart-items'),
  mobileCartItems: document.querySelector('#mobile-cart-items'),
  total: document.querySelector('#cart-total'),
  mobileTotal: document.querySelector('#mobile-total'),
  mobileDialogTotal: document.querySelector('#mobile-dialog-total'),
  mobileCount: document.querySelector('#mobile-count'),
  checkout: document.querySelector('#checkout-button'),
  mobileCheckout: document.querySelector('#mobile-checkout-button'),
  openCart: document.querySelector('#open-cart'),
  customDialog: document.querySelector('#custom-dialog'),
  cartDialog: document.querySelector('#cart-dialog'),
  paymentDialog: document.querySelector('#payment-dialog'),
  paymentTotal: document.querySelector('#payment-total'),
  paymentQr: document.querySelector('#payment-qr'),
  openPayment: document.querySelector('#open-payment'),
  toast: document.querySelector('#toast')
};

const money = value => new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0
}).format(value);

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'No se pudo completar la operación.');
  return payload;
}

function toast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => elements.toast.classList.remove('visible'), 2200);
}

function productLineTotal(item) {
  if (!item.product.bundleSize) return item.product.price * item.quantity;
  const bundles = Math.floor(item.quantity / item.product.bundleSize);
  return (bundles * item.product.bundlePrice) + ((item.quantity % item.product.bundleSize) * item.product.price);
}

function cartTotal() {
  return [...state.cart.values()].reduce((sum, item) => sum + productLineTotal(item), 0);
}

function cartCount() {
  return [...state.cart.values()].reduce((sum, item) => sum + item.quantity, 0);
}

function addProduct(product) {
  const key = product.cartKey || product.id;
  const existing = state.cart.get(key);
  if (existing) existing.quantity += 1;
  else state.cart.set(key, { product, quantity: 1 });
  renderProducts();
  renderCart();
}

function updateQuantity(key, delta) {
  const item = state.cart.get(key);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity < 1) state.cart.delete(key);
  renderProducts();
  renderCart();
}

function renderCategories() {
  const categories = ['Todos', ...new Set(state.products.map(product => product.category))];
  elements.categoryTabs.replaceChildren(...categories.map(category => {
    const button = document.createElement('button');
    button.className = 'category-tab';
    button.type = 'button';
    button.textContent = category;
    button.setAttribute('aria-pressed', String(state.category === category));
    button.addEventListener('click', () => {
      state.category = category;
      renderCategories();
      renderProducts();
    });
    return button;
  }));
}

function renderProducts() {
  const query = state.search.toLocaleLowerCase('es');
  const products = state.products.filter(product => (
    (state.category === 'Todos' || product.category === state.category)
    && (!query || product.name.toLocaleLowerCase('es').includes(query))
  ));
  if (!products.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-cart';
    empty.textContent = 'No hay productos que coincidan.';
    elements.productGrid.replaceChildren(empty);
    return;
  }
  elements.productGrid.replaceChildren(...products.map(product => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'product-button';
    const quantity = state.cart.get(product.id)?.quantity || 0;
    if (quantity) {
      const badge = document.createElement('span');
      badge.className = 'product-quantity';
      badge.textContent = quantity;
      button.append(badge);
    }
    const name = document.createElement('span');
    name.className = 'product-name';
    name.textContent = product.name;
    const priceWrap = document.createElement('span');
    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = money(product.price);
    const promo = document.createElement('small');
    promo.className = 'product-promo';
    promo.textContent = product.bundleSize ? `${product.bundleSize} por ${money(product.bundlePrice)}` : '';
    priceWrap.append(price, promo);
    button.append(name, priceWrap);
    button.addEventListener('click', () => addProduct(product));
    return button;
  }));
}

function cartLineNode(key, item) {
  const line = document.createElement('div');
  line.className = 'cart-line';
  const info = document.createElement('div');
  info.className = 'line-info';
  const name = document.createElement('strong');
  name.textContent = item.product.name;
  const detail = document.createElement('small');
  detail.textContent = item.product.bundleSize
    ? `${money(item.product.price)} c/u · promoción aplicada automáticamente`
    : `${money(item.product.price)} c/u`;
  info.append(name, detail);
  const controls = document.createElement('div');
  controls.className = 'line-controls';
  const total = document.createElement('span');
  total.className = 'line-total';
  total.textContent = money(productLineTotal(item));
  const stepper = document.createElement('div');
  stepper.className = 'stepper';
  const minus = document.createElement('button');
  minus.type = 'button';
  minus.setAttribute('aria-label', `Quitar ${item.product.name}`);
  minus.textContent = '−';
  minus.addEventListener('click', () => updateQuantity(key, -1));
  const count = document.createElement('span');
  count.textContent = item.quantity;
  const plus = document.createElement('button');
  plus.type = 'button';
  plus.setAttribute('aria-label', `Agregar ${item.product.name}`);
  plus.textContent = '+';
  plus.addEventListener('click', () => updateQuantity(key, 1));
  stepper.append(minus, count, plus);
  controls.append(total, stepper);
  line.append(info, controls);
  return line;
}

function emptyCartNode() {
  const empty = document.createElement('div');
  empty.className = 'empty-cart';
  const title = document.createElement('strong');
  title.textContent = 'El pedido está vacío';
  const text = document.createElement('span');
  text.textContent = 'Toca un producto para agregarlo';
  empty.append(title, text);
  return empty;
}

function renderCartList(container) {
  if (!state.cart.size) {
    container.replaceChildren(emptyCartNode());
    return;
  }
  container.replaceChildren(...[...state.cart.entries()].map(([key, item]) => cartLineNode(key, item)));
}

function renderCart() {
  renderCartList(elements.cartItems);
  renderCartList(elements.mobileCartItems);
  const total = cartTotal();
  const count = cartCount();
  elements.total.textContent = money(total);
  elements.mobileTotal.textContent = money(total);
  elements.mobileDialogTotal.textContent = money(total);
  elements.mobileCount.textContent = `${count} ${count === 1 ? 'producto' : 'productos'}`;
  elements.checkout.disabled = count === 0;
  elements.openCart.disabled = count === 0;
  elements.mobileCheckout.disabled = count === 0;
  elements.clear.disabled = count === 0;
}

function closeDialog(id) {
  const dialog = document.querySelector(`#${id}`);
  if (dialog?.open) dialog.close();
}

async function checkout() {
  if (!state.cart.size) return;
  const buttons = [elements.checkout, elements.mobileCheckout];
  buttons.forEach(button => { button.disabled = true; button.textContent = 'Preparando…'; });
  try {
    const items = [...state.cart.values()].map(({ product, quantity }) => product.id === 'custom'
      ? { id: 'custom', name: product.name, unitPrice: product.price, quantity }
      : { id: product.id, quantity });
    const payload = await api('/api/caja/orders', { method: 'POST', body: JSON.stringify({ items }) });
    closeDialog('cart-dialog');
    elements.paymentTotal.textContent = money(payload.order.total);
    elements.paymentQr.src = payload.qrDataUrl;
    elements.openPayment.href = payload.paymentUrl;
    elements.paymentDialog.showModal();
  } catch (error) {
    toast(error.message);
  } finally {
    buttons.forEach(button => { button.textContent = 'Generar cobro'; });
    renderCart();
  }
}

document.querySelectorAll('[data-close-dialog]').forEach(button => {
  button.addEventListener('click', () => closeDialog(button.dataset.closeDialog));
});

elements.search.addEventListener('input', event => {
  state.search = event.target.value.trim();
  renderProducts();
});
elements.clear.addEventListener('click', () => {
  state.cart.clear();
  renderProducts();
  renderCart();
});
elements.openCart.addEventListener('click', () => elements.cartDialog.showModal());
elements.checkout.addEventListener('click', checkout);
elements.mobileCheckout.addEventListener('click', checkout);
document.querySelector('#custom-charge').addEventListener('click', () => {
  document.querySelector('#custom-form').reset();
  document.querySelector('#custom-error').textContent = '';
  elements.customDialog.showModal();
  setTimeout(() => document.querySelector('#custom-name').focus(), 0);
});
document.querySelector('#custom-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = document.querySelector('#custom-name').value.trim();
  const price = Number(document.querySelector('#custom-price').value.replace(/\D/g, ''));
  if (!name || !Number.isInteger(price) || price < 100 || price > 500000) {
    document.querySelector('#custom-error').textContent = 'Indica un nombre y un monto entre $100 y $500.000.';
    return;
  }
  const randomKey = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  addProduct({ id: 'custom', cartKey: `custom-${randomKey}`, name, category: 'Adicional', price });
  closeDialog('custom-dialog');
});
document.querySelector('#new-sale').addEventListener('click', () => {
  state.cart.clear();
  renderProducts();
  renderCart();
  closeDialog('payment-dialog');
  toast('Lista para una nueva venta');
});

for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
}

async function initialize() {
  try {
    const payload = await api('/api/caja/catalog');
    state.products = payload.products;
    state.paymentMode = payload.paymentMode;
    document.querySelector('#environment-note').hidden = payload.paymentMode !== 'test';
    renderCategories();
    renderProducts();
    renderCart();
  } catch (error) {
    elements.productGrid.replaceChildren(emptyCartNode());
    toast(error.message);
  }
}

initialize();
