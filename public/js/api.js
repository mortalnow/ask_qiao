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
  
  // Handle 401/403 - clear token and redirect to login
  if (response.status === 401 || response.status === 403) {
    clearToken();
    window.location.href = '/login.html';
    throw new Error('Session expired');
  }

  return response;
}

/**
 * Verify invite code and create account with password
 */
async function verifyInviteCode(code, username, password) {
  const response = await fetch(`${API_BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, username, password }),
  });

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Verification failed');
  }

  setToken(data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
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
 * @param {AbortSignal|null} signal - Optional abort signal to cancel the request
 * @param {Function} onChunk - Callback for each streamed chunk
 * @param {Function} onDone - Callback when complete
 * @param {Function} onError - Callback for errors
 */
async function sendMessage(message, model, history, signal = null, onChunk, onDone, onError) {
  let reader = null;
  
  try {
    const response = await apiRequest('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, model, history }),
      signal: signal, // Pass abort signal
    });

    if (!response.ok) {
      const data = await response.json();
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
              onDone();
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
    
    onDone();
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

// Export for use in other scripts
window.API = {
  getToken,
  setToken,
  clearToken,
  isAuthenticated,
  verifyInviteCode,
  login,
  getCurrentUser,
  getModels,
  sendMessage,
  logout,
  generateInviteCodes,
  getInviteCodes,
  deleteInviteCode,
};

