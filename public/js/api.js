/**
 * API Client for Ask Qiao
 * Handles all communication with the backend
 */

const API_BASE = '/api';

/**
 * Get stored auth token
 */
function getToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Set auth token
 */
function setToken(token) {
  localStorage.setItem('auth_token', token);
}

/**
 * Clear auth token
 */
function clearToken() {
  localStorage.removeItem('auth_token');
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return !!getToken();
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    // Include signal if provided
    ...(options.signal && { signal: options.signal }),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  // Handle 401 - clear token and redirect to login
  if (response.status === 401) {
    clearToken();
    window.location.href = '/login.html';
    throw new Error('Session expired');
  }
  
  // Handle 403 - could be usage limit exceeded, let caller handle it
  // Don't auto-redirect for 403

  return response;
}

/**
 * Register new account with username and password (open registration)
 */
async function register(username, password) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  setToken(data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  // Clear welcome modal flag so it shows for new registration
  sessionStorage.removeItem('welcomeShown');

  return data;
}

/**
 * Login with username and password
 */
async function login(username, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  setToken(data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  // Clear welcome modal flag so it shows on each login
  sessionStorage.removeItem('welcomeShown');

  return data;
}

/**
 * Get current user info
 */
async function getCurrentUser() {
  const response = await apiRequest('/auth/me');
  
  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to get user');
  }
  
  return data.user;
}

/**
 * Get available models
 */
async function getModels() {
  const response = await apiRequest('/chat/models');
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to get models');
  }
  
  return data.models;
}

/**
 * Send chat message with streaming response
 * @param {string} message - User message
 * @param {string} model - Model ID (chatgpt or gemini)
 * @param {Array} history - Conversation history
 * @param {Array|null} files - Optional array of file objects { name, mimeType, data (base64) }
 * @param {AbortSignal|null} signal - Optional abort signal to cancel the request
 * @param {Function} onChunk - Callback for each streamed chunk
 * @param {Function} onDone - Callback when complete (receives usage info)
 * @param {Function} onError - Callback for errors
 * @param {Function} onUsageLimitExceeded - Callback when usage limit is exceeded
 */
async function sendMessage(message, model, history, files = null, signal = null, onChunk, onDone, onError, onUsageLimitExceeded) {
  let reader = null;

  try {
    const requestBody = { message, model, history };
    if (files && files.length > 0) {
      requestBody.files = files;
    }

    const response = await apiRequest('/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      signal: signal, // Pass abort signal
    });

    if (!response.ok) {
      const data = await response.json();
      
      // Handle usage limit exceeded
      if (response.status === 403 && data.error === 'usage_limit_exceeded') {
        if (onUsageLimitExceeded) {
          onUsageLimitExceeded(data);
        } else {
          throw new Error('You have used all your free prompts. Please request an extension.');
        }
        return;
      }
      
      throw new Error(data.error || 'Chat request failed');
    }

    // Read the stream
    reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      // Check if aborted
      if (signal?.aborted) {
        reader.cancel();
        throw new DOMException('The operation was aborted.', 'AbortError');
      }

      const { done, value } = await reader.read();
      
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (signal?.aborted) {
          reader.cancel();
          throw new DOMException('The operation was aborted.', 'AbortError');
        }

        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'chunk') {
              onChunk(data.content);
            } else if (data.type === 'done') {
              // Pass usage info to onDone callback
              onDone(data.usage || null);
              return;
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (e) {
            if (e.message !== 'Unexpected end of JSON input' && e.name !== 'AbortError') {
              console.error('Parse error:', e);
            }
          }
        }
      }
    }
    
    onDone(null);
  } catch (err) {
    // Cancel reader if still active
    if (reader && !signal?.aborted) {
      try {
        reader.cancel();
      } catch (e) {
        // Ignore cancel errors
      }
    }
    
    // Only call onError if not aborted
    if (err.name !== 'AbortError') {
      onError(err);
    }
  }
}

/**
 * Logout - clear session
 */
function logout() {
  clearToken();
  localStorage.removeItem('user');
  localStorage.removeItem('chat_history');
  // Clear welcome modal flag so it shows again on next login
  sessionStorage.removeItem('welcomeShown');
  window.location.href = '/login.html';
}

/**
 * Admin: Generate invite codes
 */
async function generateInviteCodes(count) {
  const response = await apiRequest('/admin/invites', {
    method: 'POST',
    body: JSON.stringify({ count }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate invite codes');
  }

  return data;
}

/**
 * Admin: Get all invite codes
 */
async function getInviteCodes() {
  const response = await apiRequest('/admin/invites');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get invite codes');
  }

  return data;
}

/**
 * Admin: Delete invite code
 */
async function deleteInviteCode(id) {
  const response = await apiRequest(`/admin/invites/${id}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete invite code');
  }

  return data;
}

// ============================================
// Extension Request Functions
// ============================================

/**
 * Get user's usage status and extension request info
 */
async function getUsageStatus() {
  const response = await apiRequest('/extension/status');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get usage status');
  }

  return data;
}

/**
 * Submit extension request for more prompts
 * @param {string} reason - Reason for requesting extension
 * @param {number|null} requestedAmount - Number of prompts requested (null for unlimited)
 */
async function requestExtension(reason, requestedAmount = null) {
  const response = await apiRequest('/extension/request', {
    method: 'POST',
    body: JSON.stringify({ reason, requested_amount: requestedAmount }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to submit extension request');
  }

  return data;
}

// ============================================
// Admin Extension Management Functions
// ============================================

/**
 * Admin: Get all extension requests
 * @param {string} status - Optional filter: 'pending', 'approved', 'rejected'
 */
async function getExtensionRequests(status = null) {
  const url = status ? `/admin/extensions?status=${status}` : '/admin/extensions';
  const response = await apiRequest(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get extension requests');
  }

  return data;
}

/**
 * Admin: Approve extension request
 * @param {string} id - Request ID
 * @param {number|null} grantedAmount - Number of prompts to grant (null if unlimited)
 * @param {boolean} grantUnlimited - Whether to grant unlimited access
 * @param {string} adminResponse - Optional response message
 */
async function approveExtension(id, grantedAmount, grantUnlimited = false, adminResponse = '') {
  const response = await apiRequest(`/admin/extensions/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ 
      granted_amount: grantedAmount, 
      grant_unlimited: grantUnlimited,
      admin_response: adminResponse 
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to approve extension request');
  }

  return data;
}

/**
 * Admin: Reject extension request
 * @param {string} id - Request ID
 * @param {string} adminResponse - Reason for rejection
 */
async function rejectExtension(id, adminResponse = '') {
  const response = await apiRequest(`/admin/extensions/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ admin_response: adminResponse }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to reject extension request');
  }

  return data;
}

/**
 * Admin: Get all users with usage stats
 */
async function getUsers() {
  const response = await apiRequest('/admin/users');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get users');
  }

  return data;
}

// ============================================
// Skills Management Functions
// ============================================

/**
 * Get user's skills list
 * @param {Object} options - Query options { category, tag, enabled, search, page, limit }
 */
async function getSkills(options = {}) {
  const params = new URLSearchParams();
  if (options.category) params.set('category', options.category);
  if (options.tag) params.set('tag', options.tag);
  if (options.enabled !== undefined) params.set('enabled', options.enabled);
  if (options.search) params.set('search', options.search);
  if (options.page) params.set('page', options.page);
  if (options.limit) params.set('limit', options.limit);

  const queryString = params.toString();
  const url = queryString ? `/skills?${queryString}` : '/skills';

  const response = await apiRequest(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get skills');
  }

  return data;
}

/**
 * Get a single skill by ID
 */
async function getSkill(id) {
  const response = await apiRequest(`/skills/${id}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get skill');
  }

  return data;
}

/**
 * Create a new skill
 * @param {Object} skill - { name, description, content, category, tags, enabled }
 */
async function createSkill(skill) {
  const response = await apiRequest('/skills', {
    method: 'POST',
    body: JSON.stringify(skill),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create skill');
  }

  return data;
}

/**
 * Update an existing skill
 * @param {string} id - Skill ID
 * @param {Object} updates - Fields to update
 */
async function updateSkill(id, updates) {
  const response = await apiRequest(`/skills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update skill');
  }

  return data;
}

/**
 * Delete a skill
 */
async function deleteSkill(id) {
  const response = await apiRequest(`/skills/${id}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete skill');
  }

  return data;
}

/**
 * Toggle a skill's enabled status
 */
async function toggleSkill(id) {
  const response = await apiRequest(`/skills/${id}/toggle`, {
    method: 'PATCH',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to toggle skill');
  }

  return data;
}

/**
 * Generate a skill from a structured prompt using AI
 * @param {Object} prompt - { persona, task, context, format, references }
 * @returns {Object} - { success, skill: { name, description, content }, source_prompt }
 */
async function generateSkill(prompt) {
  const response = await apiRequest('/skills/generate', {
    method: 'POST',
    body: JSON.stringify(prompt),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate skill');
  }

  return data;
}

/**
 * Get all enabled skills with content (for prompt building)
 */
async function getEnabledSkills() {
  const response = await apiRequest('/skills/enabled/list');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get enabled skills');
  }

  return data;
}

/**
 * Get user's categories
 */
async function getCategories() {
  const response = await apiRequest('/skills/categories/list');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get categories');
  }

  return data;
}

/**
 * Create a new category
 */
async function createCategory(name, color = null) {
  const response = await apiRequest('/skills/categories', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create category');
  }

  return data;
}

/**
 * Delete a category
 */
async function deleteCategory(id) {
  const response = await apiRequest(`/skills/categories/${id}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete category');
  }

  return data;
}

/**
 * Get all unique tags
 */
async function getTags() {
  const response = await apiRequest('/skills/tags/list');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get tags');
  }

  return data;
}

/**
 * Export skills as markdown (bundle or per-skill)
 * @param {Object} options - { enabled, bundle }
 */
async function exportSkills(options = {}) {
  const params = new URLSearchParams();
  if (options.enabled !== undefined) params.set('enabled', options.enabled);
  if (options.bundle !== undefined) params.set('bundle', options.bundle);

  const queryString = params.toString();
  const url = queryString ? `/skills/export?${queryString}` : '/skills/export';

  const response = await apiRequest(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to export skills');
  }

  return data;
}

/**
 * Import skills from markdown files
 * @param {Array} files - [{ name, content }]
 * @param {boolean} overwrite
 */
async function importSkills(files, overwrite = false) {
  const response = await apiRequest('/skills/import', {
    method: 'POST',
    body: JSON.stringify({ files, overwrite }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to import skills');
  }

  return data;
}

// Export for use in other scripts
window.API = {
  getToken,
  setToken,
  clearToken,
  isAuthenticated,
  register,
  login,
  getCurrentUser,
  getModels,
  sendMessage,
  logout,
  // Extension functions
  getUsageStatus,
  requestExtension,
  // Admin extension functions
  getExtensionRequests,
  approveExtension,
  rejectExtension,
  getUsers,
  // Skills functions
  getSkills,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  toggleSkill,
  generateSkill,
  getEnabledSkills,
  getCategories,
  createCategory,
  deleteCategory,
  getTags,
  exportSkills,
  importSkills,
};
