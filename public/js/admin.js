/**
 * Admin Panel Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication and admin status
  if (!window.API?.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const user = await window.API.getCurrentUser();
    if (!user.isAdmin) {
      alert('Admin access required');
      window.location.href = '/';
      return;
    }
  } catch (err) {
    console.error('Auth check failed:', err);
    window.location.href = '/login.html';
    return;
  }

  const generateForm = document.getElementById('generate-form');
  const codeCountInput = document.getElementById('code-count');
  const generateError = document.getElementById('generate-error');
  const inviteList = document.getElementById('invite-list');
  const statsDiv = document.getElementById('stats');
  const logoutBtn = document.getElementById('logout-btn');

  // Load invites on page load
  await loadInvites();

  // Generate codes
  generateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const count = parseInt(codeCountInput.value) || 1;

    generateError.textContent = '';
    const submitBtn = generateForm.querySelector('button');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Generating...';

    try {
      const data = await window.API.generateInviteCodes(count);
      codeCountInput.value = '1';
      await loadInvites();
      alert(`Generated ${data.count} invite code(s)!`);
    } catch (err) {
      generateError.textContent = err.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Generate';
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    if (confirm('Logout?')) {
      window.API.logout();
    }
  });

  async function loadInvites() {
    try {
      const data = await window.API.getInviteCodes();
      renderStats(data.stats);
      renderInvites(data.codes);
    } catch (err) {
      console.error('Failed to load invites:', err);
      inviteList.innerHTML = `<div class="error-message">Failed to load invite codes: ${err.message}</div>`;
    }
  }

  function renderStats(stats) {
    statsDiv.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${stats.total}</div>
        <div class="stat-label">Total Codes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.unused}</div>
        <div class="stat-label">Unused</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.used}</div>
        <div class="stat-label">Used</div>
      </div>
    `;
  }

  function renderInvites(codes) {
    if (codes.length === 0) {
      inviteList.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No invite codes yet</p>';
      return;
    }

    inviteList.innerHTML = codes.map(code => {
      const isUsed = !!code.used_by_id;
      const usedBy = code.used_by_username || 'Unknown';
      const createdAt = new Date(code.created_at).toLocaleString();
      const usedAt = code.used_at ? new Date(code.used_at).toLocaleString() : '';

      return `
        <div class="invite-item ${isUsed ? 'used' : ''}">
          <div>
            <span class="invite-code">${code.code}</span>
            <div class="invite-status">
              Created: ${createdAt}
              ${isUsed ? ` • Used by: ${usedBy} (${usedAt})` : ' • Available'}
            </div>
          </div>
          ${!isUsed ? `
            <button class="btn-delete" onclick="deleteCode(${code.id})">Delete</button>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  // Global function for delete
  window.deleteCode = async function(id) {
    if (!confirm('Delete this invite code?')) return;

    try {
      await window.API.deleteInviteCode(id);
      await loadInvites();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };
});

