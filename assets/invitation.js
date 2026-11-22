'use strict';
(() => {
  const status = document.getElementById('status');
  const open = document.getElementById('open-app');
  const retry = document.getElementById('retry');
  const edition = document.getElementById('edition');
  const parts = location.pathname.split('/').filter(Boolean);
  const environment = parts[1];
  const validPath = parts.length === 3 && parts[0] === 'vukhora' && parts[2] === 'buddy'
    && ['local', 'staging', 'release'].includes(environment);
  const tokens = new URLSearchParams(location.hash.slice(1)).getAll('token');
  const token = tokens.length === 1 && /^[0-9a-f]{64}$/.test(tokens[0]) ? tokens[0] : null;
  if (environment === 'staging' || environment === 'local') edition.textContent = 'TEST BUILD';
  if (!validPath || !token) {
    if (location.pathname !== '/') status.textContent = 'This link is incomplete. Ask for a new invitation.';
    return;
  }
  const scheme = environment === 'staging' ? 'vukhora-staging' : 'vukhora';
  const deepLink = `${scheme}://buddy#token=${token}`;
  function enableOpen(enabled) {
    open.setAttribute('aria-disabled', String(!enabled));
    open.tabIndex = enabled ? 0 : -1;
    if (enabled) open.href = deepLink;
    else open.removeAttribute('href');
  }
  async function check() {
    enableOpen(false);
    retry.hidden = true;
    if (environment !== 'staging') {
      status.textContent = 'Open Vukhora to check this invitation and choose whether to accept.';
      enableOpen(true);
      return;
    }
    status.textContent = 'Checking your invitation…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch('https://tlhgztyzmpsamdhlavvn.supabase.co/functions/v1/buddy_invite_status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }), signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer'
      });
      if (!response.ok) throw new Error('status unavailable');
      const result = await response.json();
      switch (result.status) {
        case 'pending': status.textContent = 'Your invitation is ready. Open Vukhora, sign in and choose Accept invitation.'; enableOpen(true); break;
        case 'expired': status.textContent = 'This invitation has expired. Ask for a new link.'; break;
        case 'revoked': status.textContent = 'This invitation was revoked. Ask for a new link.'; break;
        case 'accepted': status.textContent = 'This invitation has already been accepted. Open Vukhora to see your buddy.'; enableOpen(true); break;
        default: status.textContent = 'This invitation is no longer available. Ask for a new link.';
      }
    } catch {
      status.textContent = 'Open Vukhora to check the invitation, or try again here.';
      enableOpen(true);
      retry.hidden = false;
    } finally { clearTimeout(timeout); }
  }
  retry.addEventListener('click', check);
  check();
})();
