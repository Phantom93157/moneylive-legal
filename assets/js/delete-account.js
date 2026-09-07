/*
 * MoneyLive — external, public account-deletion flow.
 *
 * WHAT THIS DOES: re-authenticates the visitor directly against Supabase
 * Auth (the same backend the app itself uses) to obtain a short-lived
 * session token, then sends that token to MoneyLive's existing
 * account-deletion Cloudflare Worker (source: server/account-delete in the
 * app repo), exactly the way the app's own "Delete Account" screen does.
 * The Worker verifies the token itself with Supabase and only then deletes
 * the underlying auth.users row (profile/leaderboard rows cascade). This
 * page never touches the Supabase service-role key — it only ever holds
 * the public anon/publishable key, which is safe to expose in a client (the
 * same key already ships inside the MoneyLive app).
 *
 * CONFIGURATION: this file intentionally ships with ACCOUNT_DELETE_PROXY_URL
 * left empty. Until the Worker in server/account-delete is deployed
 * (`wrangler deploy`) and its printed URL is pasted in below, this page
 * shows an honest "needs backend configuration" notice instead of a live
 * form — it never pretends deletion works when it doesn't. Once deployed,
 * set the two constants below and redeploy this static site; no other code
 * changes are needed.
 */
(function () {
  'use strict';

  // ---- Configuration -------------------------------------------------
  // Same values as EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  // in the app's .env — public by design, RLS enforces real access control.
  var SUPABASE_URL = 'https://dradxzjrweddxztbqpfy.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_-t7Xtmm9WBqUQObYeA00Lg_fIV2nN56';

  // Deployed Sept 2026 (account-deletion productionization pass) — same
  // value as EXPO_PUBLIC_ACCOUNT_DELETE_PROXY_URL in the app's .env. Not a
  // secret: it's a public endpoint URL, protected by the caller's own
  // Supabase session token, not by being unknown.
  var ACCOUNT_DELETE_PROXY_URL = 'https://moneylive-account-delete.currencyly.workers.dev';
  // TODO(optional): matching value if `wrangler secret put APP_SHARED_SECRET`
  // was set on the Worker (same value as EXPO_PUBLIC_ACCOUNT_DELETE_PROXY_SECRET
  // in the app). This is a bot filter, not a real secret boundary — see the
  // Worker's own source comments.
  var ACCOUNT_DELETE_PROXY_SECRET = '';
  // ---------------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', function () {
    var notConfigured = document.getElementById('notConfigured');
    var form = document.getElementById('deleteForm');
    var msg = document.getElementById('dlMsg');
    var submitBtn = document.getElementById('dlSubmit');

    var configured = !!ACCOUNT_DELETE_PROXY_URL;
    if (!configured) {
      if (form) { form.style.display = 'none'; }
      return;
    }
    if (notConfigured) { notConfigured.style.display = 'none'; }

    function showMsg(kind, textEn, textDe) {
      if (!msg) return;
      msg.className = 'form-msg show ' + kind;
      var lang = document.documentElement.lang === 'de' ? textDe : textEn;
      msg.textContent = lang;
    }

    function setBusy(busy) {
      if (!submitBtn) return;
      submitBtn.disabled = busy;
      submitBtn.style.opacity = busy ? '0.7' : '';
    }

    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('dlEmail').value.trim();
      var password = document.getElementById('dlPassword').value;
      var confirmed = document.getElementById('dlConfirm').checked;

      if (!email || !password) {
        showMsg('error', 'Please enter your email and password.', 'Bitte gib E-Mail und Passwort ein.');
        return;
      }
      if (!confirmed) {
        showMsg('error', 'Please confirm you understand this cannot be undone.', 'Bitte bestätige, dass dies nicht rückgängig gemacht werden kann.');
        return;
      }

      setBusy(true);
      showMsg('pending', 'Verifying your account…', 'Konto wird verifiziert…');

      fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: email, password: password }),
      })
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (result) {
          if (!result.ok || !result.data || !result.data.access_token) {
            setBusy(false);
            showMsg('error', 'Invalid email or password.', 'E-Mail oder Passwort ist falsch.');
            return null;
          }
          showMsg('pending', 'Deleting your account…', 'Konto wird gelöscht…');
          var headers = { Authorization: 'Bearer ' + result.data.access_token };
          if (ACCOUNT_DELETE_PROXY_SECRET) headers['x-app-secret'] = ACCOUNT_DELETE_PROXY_SECRET;
          return fetch(ACCOUNT_DELETE_PROXY_URL + '/delete-account', { method: 'POST', headers: headers });
        })
        .then(function (delRes) {
          if (!delRes) return; // already handled (bad credentials)
          setBusy(false);
          if (delRes.ok) {
            form.reset();
            form.querySelectorAll('input,button').forEach(function (el) { el.disabled = true; });
            showMsg('success',
              'Your MoneyLive account has been permanently deleted.',
              'Dein MoneyLive-Konto wurde dauerhaft gelöscht.');
          } else if (delRes.status === 429) {
            showMsg('error', 'Too many attempts — please try again in a minute.', 'Zu viele Versuche — bitte versuche es in einer Minute erneut.');
          } else {
            showMsg('error',
              'Deletion failed. Please try again, or email moneylivesupport@gmail.com.',
              'Löschung fehlgeschlagen. Bitte versuche es erneut oder schreibe an moneylivesupport@gmail.com.');
          }
        })
        .catch(function () {
          setBusy(false);
          showMsg('error',
            'Network error. Please try again, or email moneylivesupport@gmail.com.',
            'Netzwerkfehler. Bitte versuche es erneut oder schreibe an moneylivesupport@gmail.com.');
        });
    });
  });
})();
