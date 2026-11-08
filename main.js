/**
 * Vaulty - Modular Application Bootstrap & Entry Point
 * main.js
 *
 * Orchestrates component lifecycle, initializes stores, and activates the initial view.
 */

(function () {
  'use strict';

  function bootstrap() {
    console.log('[Vaulty] Bootstrapping component-based modular architecture...');

    const V = window.Vaulty || {};

    // 1. Initialize State & Data Stores
    if (V.State && typeof V.State.init === 'function') {
      try {
        V.State.init();
        console.log('[Vaulty] State store initialized.');
      } catch (err) {
        console.error('[Vaulty] Error initializing State:', err);
      }
    }

    // 2. Initialize Navigation & Sidebar
    if (V.Sidebar && typeof V.Sidebar.init === 'function') {
      try {
        V.Sidebar.init();
        console.log('[Vaulty] Sidebar component initialized.');
      } catch (err) {
        console.error('[Vaulty] Error initializing Sidebar:', err);
      }
    }

    // 3. Initialize Interactive Cards & Wallet
    if (V.Cards && typeof V.Cards.init === 'function') {
      try {
        V.Cards.init();
        console.log('[Vaulty] Cards component initialized.');
      } catch (err) {
        console.error('[Vaulty] Error initializing Cards:', err);
      }
    }

    // 4. Initialize Data Tables
    if (V.Tables && typeof V.Tables.init === 'function') {
      try {
        V.Tables.init();
        console.log('[Vaulty] Tables component initialized.');
      } catch (err) {
        console.error('[Vaulty] Error initializing Tables:', err);
      }
    }

    // 5. Initialize Charts & Visualizations
    if (V.Charts && typeof V.Charts.init === 'function') {
      try {
        V.Charts.init();
        console.log('[Vaulty] Charts component initialized.');
      } catch (err) {
        console.error('[Vaulty] Error initializing Charts:', err);
      }
    }

    // 6. Initialize Form Modals & Payment Desks
    const NT = V.NewTransaction || V.Modals?.NewTransaction;
    if (NT && typeof NT.init === 'function') {
      try {
        NT.init();
      } catch (err) {
        console.error('[Vaulty] Error initializing NewTransaction modal:', err);
      }
    }

    const DPD = V.DebtPayDesk || V.Modals?.DebtPayDesk;
    if (DPD && typeof DPD.init === 'function') {
      try {
        DPD.init();
      } catch (err) {
        console.error('[Vaulty] Error initializing DebtPayDesk:', err);
      }
    }

    const AM = V.AccountModals || V.Modals?.AccountModals;
    if (AM && typeof AM.init === 'function') {
      try {
        AM.init();
      } catch (err) {
        console.error('[Vaulty] Error initializing AccountModals:', err);
      }
    }

    // 6b. Initialize Recurring Transactions Engine
    const RE = V.RecurringEngine;
    if (RE && typeof RE.init === 'function') {
      try {
        RE.init();
        console.log('[Vaulty] RecurringEngine initialized.');
      } catch (err) {
        console.error('[Vaulty] Error initializing RecurringEngine:', err);
      }
    }

    // 7. Initialize Views
    if (V.Views) {
      if (V.Views.Overview && typeof V.Views.Overview.init === 'function') {
        try {
          V.Views.Overview.init();
        } catch (err) {
          console.error('[Vaulty] Error initializing Overview view:', err);
        }
      }
      if (V.Views.Transactions && typeof V.Views.Transactions.init === 'function') {
        try {
          V.Views.Transactions.init();
        } catch (err) {
          console.error('[Vaulty] Error initializing Transactions view:', err);
        }
      }
      if (V.Views.Debts && typeof V.Views.Debts.init === 'function') {
        try {
          V.Views.Debts.init();
        } catch (err) {
          console.error('[Vaulty] Error initializing Debts view:', err);
        }
      }
      if (V.Views.Assets && typeof V.Views.Assets.init === 'function') {
        try {
          V.Views.Assets.init();
        } catch (err) {
          console.error('[Vaulty] Error initializing Assets view:', err);
        }
      }
      if (V.Views.Calendar && typeof V.Views.Calendar.init === 'function') {
        try {
          V.Views.Calendar.init();
        } catch (err) {
          console.error('[Vaulty] Error initializing Calendar view:', err);
        }
      }
    }

    // 8. Global Keyboard, Input Hygiene & Action Delegation Events
    if (V.Events && typeof V.Events.init === 'function') {
      try {
        V.Events.init();
      } catch (err) {
        console.error('[Vaulty] Error initializing Events:', err);
      }
    }

    // 9. Initial View Activation
    try {
      if (V.Sidebar && typeof V.Sidebar.activateNavItem === 'function') {
        V.Sidebar.activateNavItem('dashboard');
      } else if (V.Views?.Overview?.render) {
        V.Views.Overview.render();
      }
    } catch (err) {
      console.error('[Vaulty] Error activating initial view:', err);
    }

    // 10. Ensure no modal or overlay has lingering blocking pointers
    document.querySelectorAll('.modal-overlay').forEach((el) => {
      if (!el.classList.contains('is-open')) {
        el.setAttribute('hidden', '');
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
      }
    });

    console.log('[Vaulty] All modules initialized and dashboard rendered.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();

