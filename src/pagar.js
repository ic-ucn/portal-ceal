const params = new URLSearchParams(location.search);
const orderId = params.get('orden') || '';
const resultParam = params.get('resultado') || '';
const toastElement = document.querySelector('#toast');
const localHost = /^(localhost|127\.0\.0\.1|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(location.hostname);
const apiBase = localHost ? '' : 'https://portal-ceic-api.onrender.com';
let order;
const account = Object.freeze({
  holder: 'Belén Alessandra Astudillo Díaz',
  rut: '21.010.841-6',
  bank: 'Mercado Pago',
  accountType: 'Cuenta Vista',
  accountNumber: '1062801369',
  email: 'belen.astu24@gmail.com'
});

const money = value => new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0
}).format(value);

async function api(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'No se pudo completar la operación.');
  return payload;
}

function toast(message) {
  toastElement.textContent = message;
  toastElement.classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toastElement.classList.remove('visible'), 2200);
}

async function copyText(text, message = 'Dato copiado') {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement('textarea');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.append(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }
  toast(message);
}

function accountFields() {
  return [
    ['Titular', account.holder],
    ['RUT', account.rut],
    ['Banco', account.bank],
    ['Tipo', account.accountType],
    ['N° de cuenta', account.accountNumber],
    ['Correo', account.email]
  ];
}

function renderAccount() {
  const list = document.querySelector('#account-data');
  list.replaceChildren(...accountFields().map(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'account-row';
    const term = document.createElement('dt');
    term.textContent = label;
    const detail = document.createElement('dd');
    detail.textContent = value;
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'copy-row';
    copy.textContent = 'Copiar';
    copy.addEventListener('click', () => copyText(value));
    row.append(term, detail, copy);
    return row;
  }));
}

function renderSummary() {
  const lines = document.querySelector('#summary-lines');
  lines.replaceChildren(...order.items.map(item => {
    const row = document.createElement('div');
    row.className = 'summary-line';
    const name = document.createElement('span');
    name.textContent = `${item.quantity} × ${item.name}`;
    const total = document.createElement('strong');
    total.textContent = money(item.total);
    row.append(name, total);
    return row;
  }));
}

function showResult() {
  const status = document.querySelector('#payment-status');
  const paid = order.status === 'paid' || resultParam === 'pagado';
  const rejected = ['rejected', 'cancelled'].includes(order.status) || ['rechazado', 'cancelado'].includes(resultParam);
  if (!paid && !rejected) return;
  status.hidden = false;
  status.className = `payment-status ${paid ? 'success' : 'warning'}`;
  status.textContent = paid
    ? 'Pago autorizado. Puede mostrar esta confirmación en el puesto.'
    : resultParam === 'cancelado' || order.status === 'cancelled'
      ? 'El pago con Webpay fue cancelado. Puede intentarlo nuevamente o transferir.'
      : 'El pago no fue autorizado. Puede intentarlo nuevamente o transferir.';
  if (paid) document.querySelector('.payment-methods').hidden = true;
}

document.querySelector('#summary-toggle').addEventListener('click', event => {
  const lines = document.querySelector('#summary-lines');
  const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
  event.currentTarget.setAttribute('aria-expanded', String(!expanded));
  event.currentTarget.lastElementChild.textContent = expanded ? '+' : '−';
  lines.hidden = expanded;
});

document.querySelector('#copy-all').addEventListener('click', () => {
  const text = [
    `Monto: ${money(order.total)}`,
    ...accountFields().map(([label, value]) => `${label}: ${value}`)
  ].join('\n');
  copyText(text, 'Datos de transferencia copiados');
});

document.querySelector('#webpay-button').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = 'Abriendo Webpay…';
  try {
    const payload = await api(`/api/caja/orders/${encodeURIComponent(order.id)}/webpay`, {
      method: 'POST',
      body: '{}'
    });
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = payload.url;
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'token_ws';
    input.value = payload.token;
    form.append(input);
    document.body.append(form);
    form.submit();
  } catch (error) {
    toast(error.message);
    button.disabled = false;
    button.textContent = 'Pagar con Webpay';
  }
});

async function initialize() {
  if (!orderId) {
    document.querySelector('#payment-content').hidden = true;
    document.querySelector('#not-found').hidden = false;
    return;
  }
  try {
    const [orderPayload, catalogPayload] = await Promise.all([
      api(`/api/caja/orders/${encodeURIComponent(orderId)}`),
      api('/api/caja/catalog')
    ]);
    order = orderPayload.order;
    document.querySelector('#customer-total').textContent = money(order.total);
    document.querySelector('#test-details').hidden = catalogPayload.paymentMode !== 'test';
    renderSummary();
    renderAccount();
    showResult();
  } catch {
    document.querySelector('#payment-content').hidden = true;
    document.querySelector('#not-found').hidden = false;
  }
}

initialize();
