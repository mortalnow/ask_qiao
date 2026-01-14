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

  // Invite Code Elements
  const generateForm = document.getElementById('generate-form');
  const codeCountInput = document.getElementById('code-count');
  const generateError = document.getElementById('generate-error');
  const inviteList = document.getElementById('invite-list');
  const statsDiv = document.getElementById('stats');
  const logoutBtn = document.getElementById('logout-btn');
  
  // Extension Request Elements
  const extensionList = document.getElementById('extension-list');
  const extensionStatsDiv = document.getElementById('extension-stats');
  const filterTabs = document.querySelectorAll('.filter-tab');
  
  // State
  let currentFilter = 'pending';
  let extensionRequests = [];

  // Load data on page load
  await Promise.all([loadInvites(), loadExtensions()]);

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

  // Global function for delete invite code
  window.deleteCode = async function(id) {
    if (!confirm('Delete this invite code?')) return;

    try {
      await window.API.deleteInviteCode(id);
      await loadInvites();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  // ============================================
  // Extension Request Management
  // ============================================

  // Filter tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderExtensions();
    });
  });

  async function loadExtensions() {
    try {
      const data = await window.API.getExtensionRequests();
      extensionRequests = data.requests;
      renderExtensionStats(data.stats);
      renderExtensions();
    } catch (err) {
      console.error('Failed to load extensions:', err);
      extensionList.innerHTML = `<div class="error-message">Failed to load extension requests: ${err.message}</div>`;
    }
  }

  function renderExtensionStats(stats) {
    extensionStatsDiv.innerHTML = `
      <div class="stat-card">
        <div class="stat-value" style="color: var(--warning)">${stats.pending}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--success)">${stats.approved}</div>
        <div class="stat-label">Approved</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--error)">${stats.rejected}</div>
        <div class="stat-label">Rejected</div>
      </div>
    `;
  }

  function renderExtensions() {
    const filtered = currentFilter === 'all' 
      ? extensionRequests 
      : extensionRequests.filter(r => r.status === currentFilter);

    if (filtered.length === 0) {
      extensionList.innerHTML = `<div class="empty-state">No ${currentFilter === 'all' ? '' : currentFilter} extension requests</div>`;
      return;
    }

    extensionList.innerHTML = filtered.map(req => {
      const createdAt = new Date(req.created_at).toLocaleString();
      const resolvedAt = req.resolved_at ? new Date(req.resolved_at).toLocaleString() : '';
      const requestedText = req.requested_amount ? `${req.requested_amount} prompts` : 'Unlimited';
      const grantedText = req.granted_unlimited ? 'Unlimited' : (req.granted_amount ? `${req.granted_amount} prompts` : '-');
      
      return `
        <div class="extension-item ${req.status}">
          <div class="extension-user">
            ${req.user.username}
            <span class="status-badge ${req.status}">${req.status}</span>
          </div>
          <div class="extension-meta">
            Usage: ${req.user.usage_count}/${req.user.is_unlimited ? '∞' : req.user.usage_limit} prompts
            • Requested: ${requestedText}
            • Created: ${createdAt}
            ${resolvedAt ? `• Resolved: ${resolvedAt}` : ''}
          </div>
          <div class="extension-reason">"${escapeHtml(req.reason)}"</div>
          ${req.status === 'pending' ? `
            <div class="extension-actions">
              <select id="grant-amount-${req.id}">
                <option value="5">Grant 5 prompts</option>
                <option value="10">Grant 10 prompts</option>
                <option value="20">Grant 20 prompts</option>
                <option value="unlimited">Grant Unlimited</option>
              </select>
              <button class="btn-approve" onclick="approveRequest('${req.id}')">Approve</button>
              <button class="btn-reject" onclick="rejectRequest('${req.id}')">Reject</button>
            </div>
          ` : `
            <div class="extension-meta">
              ${req.status === 'approved' ? `Granted: ${grantedText}` : ''}
              ${req.admin_response ? `• Response: "${escapeHtml(req.admin_response)}"` : ''}
            </div>
          `}
        </div>
      `;
    }).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Global function for approving extension
  window.approveRequest = async function(id) {
    const selectEl = document.getElementById(`grant-amount-${id}`);
    const value = selectEl?.value;
    
    if (!value) {
      alert('Please select an amount to grant');
      return;
    }
    
    const isUnlimited = value === 'unlimited';
    const amount = isUnlimited ? null : parseInt(value);
    
    if (!confirm(`Approve this request and grant ${isUnlimited ? 'unlimited access' : amount + ' prompts'}?`)) {
      return;
    }

    try {
      await window.API.approveExtension(id, amount, isUnlimited);
      await loadExtensions();
    } catch (err) {
      alert('Failed to approve: ' + err.message);
    }
  };

  // Global function for rejecting extension
  window.rejectRequest = async function(id) {
    const reason = prompt('Reason for rejection (optional):');
    
    if (!confirm('Reject this extension request?')) {
      return;
    }

    try {
      await window.API.rejectExtension(id, reason || '');
      await loadExtensions();
    } catch (err) {
      alert('Failed to reject: ' + err.message);
    }
  };
});

