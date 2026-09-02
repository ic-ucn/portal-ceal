(() => {
  'use strict';

  const accountText = [
    'CUENTA CEAL',
    'Belén Alessandra Astudillo Díaz',
    'RUT: 21.010.841-6',
    'Banco: Mercado Pago',
    'Tipo de cuenta: Cuenta Vista',
    'Número de cuenta: 1062801369',
    'Correo: belen.astu24@gmail.com'
  ].join('\n');

  const toast = document.querySelector('.copy-toast');
  let toastTimer = 0;

  function showToast(message, isError = false) {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.toggle('is-error', isError);
    toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 2200);
  }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        return;
      } catch {}
    }

    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    field.style.pointerEvents = 'none';
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, field.value.length);
    const copied = document.execCommand('copy');
    field.remove();
    if (!copied) throw new Error('copy-failed');
  }

  async function handleCopy(button, value, label, successMessage = `${label} copiado`) {
    try {
      await copyText(value);
      showToast(successMessage);
    } catch {
      showToast('No se pudo copiar. Mantén presionado el dato.', true);
    }
  }

  document.querySelectorAll('[data-copy-value]').forEach(button => {
    button.addEventListener('click', () => {
      handleCopy(button, button.dataset.copyValue || '', button.dataset.copyLabel || 'Dato');
    });
  });

  const copyAllButton = document.querySelector('[data-copy-all]');
  copyAllButton?.addEventListener('click', () => {
    handleCopy(copyAllButton, accountText, 'Datos de transferencia', 'Datos de transferencia copiados');
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
      .catch(() => {});
  }

  if ('caches' in window) {
    window.caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('portal-')).map(key => window.caches.delete(key))))
      .catch(() => {});
  }
})();
