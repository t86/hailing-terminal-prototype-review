'use strict';

// This layer owns modal focus only; business handlers still own every action.
(() => {
  if (window.terminalModalAccessibility) return;
  const root = document.getElementById('modal-root');
  if (!root) return;
  window.terminalModalAccessibility = true;

  const focusable = 'button, a[href], input, select, textarea, [tabindex]';
  let dialog = null, opener = null, lastTrigger = null, previousOverflow = '';
  const inertStates = new Map();

  const usable = element => !element.disabled && element.tabIndex >= 0 &&
    !element.closest('[hidden], [inert]') && element.getClientRects().length > 0 &&
    getComputedStyle(element).visibility !== 'hidden';
  const tabStops = () => [...dialog.querySelectorAll(focusable)].filter(usable);
  const focus = element => element?.focus({preventScroll:true});

  function canClose() {
    const scope = dialog.closest('.modal-overlay') || dialog;
    if (scope.querySelector('[data-dismissible="false"], [data-cancellable="false"]') ||
        scope.matches('[data-dismissible="false"], [data-cancellable="false"]')) return false;
    if (scope.querySelector('[data-allow-close="true"]') || scope.matches('[data-allow-close="true"]')) return true;
    return !scope.querySelector('[aria-busy="true"], [data-busy="true"], [data-phase="submitting"], [data-phase="noncancellable"]') &&
      !scope.matches('[aria-busy="true"], [data-busy="true"], [data-phase="submitting"], [data-phase="noncancellable"]');
  }

  function restoreFocus() {
    if (opener?.isConnected) focus(opener);
    else if (opener) {
      const action = opener.getAttribute('onclick');
      const replacement = opener.id ? document.getElementById(opener.id) :
        [...document.querySelectorAll('button, a[href]')].find(element =>
          action && element.getAttribute('onclick') === action && element.textContent === opener.textContent);
      focus(replacement);
    }
    opener = null;
  }

  function syncDialog() {
    const next = root.querySelector('.modal');
    if (next === dialog) return;
    if (!next) {
      dialog = null;
      document.body.style.overflow = previousOverflow;
      for (const [element, wasInert] of inertStates) element.inert = wasInert;
      inertStates.clear();
      restoreFocus();
      return;
    }
    if (!dialog) {
      const active = document.activeElement;
      opener = active && active !== document.body && !root.contains(active) ? active : lastTrigger;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      for (const id of ['app', 'reviewbar']) {
        const element = document.getElementById(id);
        if (element) { inertStates.set(element, element.inert); element.inert = true; }
      }
    }
    dialog = next;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    const title = dialog.querySelector('.modal-head h2');
    if (title) {
      title.tabIndex = -1;
      if (!title.id) title.id = 'active-modal-title';
      dialog.setAttribute('aria-labelledby', title.id);
    }
    const firstField = [...dialog.querySelectorAll('input:not([type="hidden"]), select, textarea')]
      .find(element => usable(element) && !element.readOnly);
    dialog.tabIndex = -1;
    focus(firstField || title || dialog);
  }

  document.addEventListener('pointerdown', event => {
    if (!root.contains(event.target)) lastTrigger = event.target.closest('button, a[href], [tabindex]');
  }, true);

  document.addEventListener('keydown', event => {
    if (!dialog) return;
    if (event.key === 'Escape') {
      // Capture blocks the legacy unconditional Escape listener in app.js.
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.isComposing && canClose()) window.C?.closeModal();
    } else if (event.key === 'Tab') {
      const stops = tabStops();
      const first = stops[0], last = stops.at(-1), active = document.activeElement;
      if (!stops.length) { event.preventDefault(); focus(dialog); }
      else if (event.shiftKey && (active === first || !stops.includes(active))) {
        event.preventDefault(); focus(last);
      } else if (!event.shiftKey && (active === last || !stops.includes(active))) {
        event.preventDefault(); focus(first);
      }
    }
  }, true);

  root.addEventListener('click', event => {
    if (!dialog || canClose()) return;
    const button = event.target.closest('button');
    if (event.target.classList.contains('modal-overlay') ||
        button?.getAttribute('onclick')?.includes('C.closeModal(')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  new MutationObserver(syncDialog).observe(root, {childList:true, subtree:true});
  syncDialog();
})();
