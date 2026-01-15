/**
 * Main Chat Application - Prompt-Based Education Service
 * Users must use the prompt builder to send messages
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  if (!window.API?.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  // Initialize i18n
  if (window.i18n) {
    window.i18n.init();
  }

  // DOM Elements
  const messagesContainer = document.getElementById('chat-messages');
  const modelSelect = document.getElementById('model-select');
  const currentModelLabel = document.getElementById('current-model-label');
  const logoutBtn = document.getElementById('logout-btn');
  const adminLink = document.getElementById('admin-link');
  const langToggleBtn = document.getElementById('lang-toggle');
  
  // Usage Counter Elements
  const headerLeft = document.querySelector('.header-left');
  const usageCounter = document.getElementById('usage-counter');
  const usageText = document.getElementById('usage-text');
  
  // Prompt Builder Elements
  const promptBuilder = document.getElementById('prompt-builder');
  const promptForm = document.getElementById('prompt-form');
  const personaInput = document.getElementById('persona-input');
  const taskInput = document.getElementById('task-input');
  const contextInput = document.getElementById('context-input');
  const formatInput = document.getElementById('format-input');
  const referencesInput = document.getElementById('references-input');
  const sendPromptBtn = document.getElementById('send-prompt');
  const clearPromptFormBtn = document.getElementById('clear-prompt-form');

  // History Sidebar Elements
  const newChatBtn = document.getElementById('new-chat-btn');
  const historyBtn = document.getElementById('history-btn');
  const historySidebar = document.getElementById('history-sidebar');
  const closeHistoryBtn = document.getElementById('close-history');
  const historyList = document.getElementById('history-list');
  const historyOverlay = document.getElementById('history-overlay');
  
  // Extension Modal Elements
  const extensionModal = document.getElementById('extension-modal');
  const closeExtensionModalBtn = document.getElementById('close-extension-modal');
  const extensionForm = document.getElementById('extension-form');
  const extensionAmountSelect = document.getElementById('extension-amount');
  const extensionReasonInput = document.getElementById('extension-reason');
  const cancelExtensionBtn = document.getElementById('cancel-extension');
  const submitExtensionBtn = document.getElementById('submit-extension');
  const extensionPendingNotice = document.getElementById('extension-pending-notice');
  const extensionStatus = document.getElementById('extension-status');
  
  // Welcome Modal Elements
  const welcomeModal = document.getElementById('welcome-modal');
  const welcomeAckBtn = document.getElementById('welcome-ack-btn');
  const welcomeUsageCount = document.getElementById('welcome-usage-count');
  const welcomeApplyUnlimitedBtn = document.getElementById('welcome-apply-unlimited');
  
  // Apply Unlimited Button (next to usage counter)
  const applyUnlimitedBtn = document.getElementById('apply-unlimited-btn');

  // State
  let chatHistory = [];
  let isStreaming = false;
  let currentStreamingMessage = null;
  let currentStreamAbortController = null;
  let currentStreamFullResponse = '';
  
  // Usage state
  let usageInfo = {
    count: 0,
    limit: 5,
    remaining: 5,
    is_unlimited: false
  };
  // Admin state
  let userIsAdmin = false;
  
  // Session management
  let currentSessionId = null;
  let sessions = {};

  // Model display names
  const modelNames = {
    chatgpt: 'GPT-5.2',
    gemini: 'Gemini 3 Flash'
  };

  // Model icons
  const modelIcons = {
    chatgpt: '<img src="/icons/qiao.png" alt="Qiao" class="avatar-img">',
    gemini: '<img src="/icons/qiao.png" alt="Qiao" class="avatar-img">'
  };
  const defaultAssistantIcon = '<img src="/icons/qiao.png" alt="Qiao" class="avatar-img">';

  // Initialize
  init();

  async function init() {
    // Check if user is admin and fetch usage status
    try {
      const user = await window.API.getCurrentUser();
      userIsAdmin = !!user.isAdmin;

      if (user.isAdmin && adminLink) {
        adminLink.style.display = 'flex';
      }
      
      // Fetch usage status
      await fetchUsageStatus();
      
      // Show welcome modal only for limited users (not admin, not unlimited), once per session
      const isLimitedUser = !userIsAdmin && !usageInfo.is_unlimited;
      if (isLimitedUser && !sessionStorage.getItem('welcomeShown')) {
        showWelcomeModal();
      }
    } catch (err) {
      console.error('Failed to initialize:', err);
    }

    // Load sessions from local storage
    loadSessions();
    
    // Load current session or create new one
    const savedSessionId = localStorage.getItem('current_session_id');
    if (savedSessionId && sessions[savedSessionId]) {
      currentSessionId = savedSessionId;
      chatHistory = sessions[savedSessionId].messages || [];
    } else {
      startNewSession();
    }
    
    renderChatHistory();
    renderHistoryList();

    // Update model label
    updateModelLabel();

    // Set up event listeners
    setupEventListeners();

    // Focus first prompt builder input
    personaInput?.focus();
  }
  
  async function fetchUsageStatus() {
    try {
      const data = await window.API.getUsageStatus();
      usageInfo = data.usage;
      updateUsageDisplay();
      
      // Check for pending extension request
      if (data.extension?.has_pending) {
        // User has a pending request
        console.log('User has pending extension request');
      }
    } catch (err) {
      console.error('Failed to fetch usage status:', err);
    }
  }
  
  function updateUsageDisplay() {
    if (!usageCounter || !usageText) return;

    const hideUsage = usageInfo.is_unlimited || userIsAdmin;

    if (hideUsage) {
      // Hide entire header-left for unlimited users/admins (and clear text)
      usageText.textContent = '';
      usageCounter.style.setProperty('display', 'none', 'important');
      if (headerLeft) {
        headerLeft.style.setProperty('display', 'none', 'important');
      }
    } else {
      // Show usage counter for limited users
      if (headerLeft) {
        headerLeft.style.removeProperty('display');
        headerLeft.style.display = 'flex';
      }
      usageCounter.style.removeProperty('display');
      usageCounter.style.display = 'flex';
      // Compact format: just show "0/5"
      usageText.textContent = `${usageInfo.count}/${usageInfo.limit}`;

      // Add warning class if close to limit
      if (usageInfo.remaining <= 1) {
        usageCounter.classList.add('usage-warning');
      } else {
        usageCounter.classList.remove('usage-warning');
      }
    }
  }

  function setupEventListeners() {
    // Model selection
    modelSelect.addEventListener('change', updateModelLabel);

    // Model card clicks (welcome screen)
    document.querySelectorAll('.model-card').forEach(card => {
      card.addEventListener('click', () => {
        const model = card.dataset.model;
        if (model) {
          modelSelect.value = model;
          updateModelLabel();
          personaInput?.focus();
        }
      });
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
      const msg = window.i18n ? window.i18n.t('confirm.logout') : '确定要退出登录吗？';
      if (confirm(msg)) {
        window.API.logout();
      }
    });

    // Language toggle
    if (langToggleBtn) {
      langToggleBtn.addEventListener('click', () => {
        if (window.i18n) {
          window.i18n.toggleLanguage();
          updateUsageDisplay();
          if (chatHistory.length === 0) {
            renderChatHistory();
          }
        }
      });
    }

    // Prompt Builder - Send button (main action)
    if (sendPromptBtn) {
      sendPromptBtn.addEventListener('click', sendPrompt);
    }
    if (clearPromptFormBtn) {
      clearPromptFormBtn.addEventListener('click', clearPromptForm);
    }
    
    // New Chat Button
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        if (isStreaming) return;
        startNewSession();
        renderChatHistory();
        renderHistoryList();
        clearPromptFormFields();
        personaInput?.focus();
      });
    }
    
    // History Sidebar
    if (historyBtn) {
      historyBtn.addEventListener('click', toggleHistorySidebar);
    }
    if (closeHistoryBtn) {
      closeHistoryBtn.addEventListener('click', toggleHistorySidebar);
    }
    if (historyOverlay) {
      historyOverlay.addEventListener('click', toggleHistorySidebar);
    }
    
    // Extension Modal
    if (closeExtensionModalBtn) {
      closeExtensionModalBtn.addEventListener('click', hideExtensionModal);
    }
    if (cancelExtensionBtn) {
      cancelExtensionBtn.addEventListener('click', hideExtensionModal);
    }
    if (extensionForm) {
      extensionForm.addEventListener('submit', handleExtensionSubmit);
    }
    if (extensionModal) {
      extensionModal.querySelector('.modal-overlay')?.addEventListener('click', hideExtensionModal);
    }
    
    // Apply Unlimited Button (next to usage counter)
    if (applyUnlimitedBtn) {
      applyUnlimitedBtn.addEventListener('click', () => {
        showExtensionModal(true); // Pre-select unlimited
      });
    }
  }

  function updateModelLabel() {
    const model = modelSelect.value;
    currentModelLabel.textContent = modelNames[model] || model;
  }

  // Main send function - builds prompt and sends
  async function sendPrompt() {
    if (isStreaming) return;
    
    // Check usage limit first
    if (!usageInfo.is_unlimited && usageInfo.remaining <= 0) {
      showExtensionModal();
      return;
    }
    
    // Get required fields
    const persona = personaInput?.value.trim() || '';
    const task = taskInput?.value.trim() || '';
    const context = contextInput?.value.trim() || '';

    // Validate required fields
    if (!persona || !task || !context) {
      const msg = window.i18n ? window.i18n.t('promptBuilder.validation') : '请填写所有必填字段：[PERSONA]、[TASK] 和 [CONTEXT]';
      alert(msg);
      return;
    }

    // Get optional fields
    const format = formatInput?.value.trim() || '';
    const references = referencesInput?.value.trim() || '';

    // Build structured prompt
    let message = `[PERSONA]\n${persona}\n\n[TASK]\n${task}\n\n[CONTEXT]\n${context}`;
    if (format) {
      message += `\n\n[FORMAT]\n${format}`;
    }
    if (references) {
      message += `\n\n[REFERENCES]\n${references}`;
    }

    const model = modelSelect.value;

    // Hide welcome message
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    // Add user message to UI
    addMessage('user', message);

    // Add assistant message placeholder
    const assistantMessage = addMessage('assistant', '', model);
    currentStreamingMessage = assistantMessage.querySelector('.message-text');

    // Start streaming
    isStreaming = true;
    sendPromptBtn.disabled = true;
    currentStreamFullResponse = '';

    // Show typing indicator
    currentStreamingMessage.innerHTML = `
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    // Build history for API
    const apiHistory = chatHistory
      .filter(msg => msg.role !== 'assistant' || msg.content)
      .slice(0, -1)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Create abort controller
    currentStreamAbortController = new AbortController();

    try {
      await window.API.sendMessage(
        message,
        model,
        apiHistory,
        currentStreamAbortController.signal,
        // onChunk
        (chunk) => {
          if (!currentStreamingMessage) return;
          
          if (currentStreamingMessage.querySelector('.typing-indicator')) {
            currentStreamingMessage.innerHTML = '';
          }
          currentStreamFullResponse += chunk;
          currentStreamingMessage.innerHTML = formatMessage(currentStreamFullResponse);
          scrollToBottom();
        },
        // onDone
        (usage) => {
          if (!currentStreamingMessage) return;
          
          // Update usage info if provided
          if (usage) {
            usageInfo.count = usage.count;
            usageInfo.limit = usage.limit;
            usageInfo.is_unlimited = usage.is_unlimited;
            usageInfo.remaining = usage.is_unlimited ? null : Math.max(0, usage.limit - usage.count);
            updateUsageDisplay();
          }
          
          // Update chat history with full response
          const lastAssistantMsg = chatHistory[chatHistory.length - 1];
          if (lastAssistantMsg && lastAssistantMsg.role === 'assistant') {
            lastAssistantMsg.content = currentStreamFullResponse;
          }
          saveChatHistory();
          
          // Clear prompt builder after successful send
          clearPromptFormFields();
          
          isStreaming = false;
          sendPromptBtn.disabled = false;
          currentStreamingMessage = null;
          currentStreamAbortController = null;
          currentStreamFullResponse = '';
          personaInput?.focus();
        },
        // onError
        (error) => {
          console.error('Chat error:', error);
          
          if (!currentStreamingMessage) return;
          
          if (error.name === 'AbortError') {
            return;
          }
          
          currentStreamingMessage.innerHTML = `
            <span style="color: var(--error)">错误：${error.message}</span>
          `;
          
          // Remove failed message from history
          if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'assistant') {
            chatHistory.pop();
          }
          saveChatHistory();
          
          isStreaming = false;
          sendPromptBtn.disabled = false;
          currentStreamingMessage = null;
          currentStreamAbortController = null;
          currentStreamFullResponse = '';
        },
        // onUsageLimitExceeded
        (data) => {
          // Remove the user message and placeholder we added
          const messages = messagesContainer.querySelectorAll('.message');
          if (messages.length >= 2) {
            messages[messages.length - 1].remove(); // Remove assistant placeholder
            messages[messages.length - 2].remove(); // Remove user message
          }
          
          // Remove from history
          if (chatHistory.length >= 2) {
            chatHistory.pop(); // assistant
            chatHistory.pop(); // user
          }
          
          // Update usage info
          usageInfo.count = data.usage_count;
          usageInfo.limit = data.usage_limit;
          usageInfo.remaining = 0;
          updateUsageDisplay();
          
          isStreaming = false;
          sendPromptBtn.disabled = false;
          currentStreamingMessage = null;
          currentStreamAbortController = null;
          currentStreamFullResponse = '';
          
          // Show extension modal
          showExtensionModal();
        }
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Send message error:', err);
        if (currentStreamingMessage) {
          currentStreamingMessage.innerHTML = `
            <span style="color: var(--error)">错误：${err.message}</span>
          `;
        }
      }
      
      isStreaming = false;
      sendPromptBtn.disabled = false;
      currentStreamingMessage = null;
      currentStreamAbortController = null;
      currentStreamFullResponse = '';
    }
  }

  function addMessage(role, content, model = null) {
    const message = document.createElement('div');
    message.className = `message ${role}`;

    const avatarClass = model ? (model === 'chatgpt' ? 'openai' : 'google') : '';
    const avatarIcon = role === 'user' ? '👤' : modelIcons[model] || defaultAssistantIcon;
    const modelLabel = model ? modelNames[model] : '';

    message.innerHTML = `
      <div class="message-avatar ${avatarClass}">${avatarIcon}</div>
      <div class="message-content">
        <div class="message-bubble">
          <span class="message-text">${formatMessage(content)}</span>
        </div>
        <div class="message-meta">
          ${modelLabel ? `<span class="model-name">${modelLabel}</span>` : ''}
          <span class="timestamp">${formatTime(new Date())}</span>
        </div>
      </div>
    `;

    messagesContainer.appendChild(message);
    scrollToBottom();

    // Save to history
    const historyEntry = { role, content };
    if (model) historyEntry.model = model;
    chatHistory.push(historyEntry);
    saveChatHistory();

    return message;
  }

  function renderChatHistory() {
    messagesContainer.innerHTML = '';

    if (chatHistory.length === 0) {
      const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;
      const welcomeTitle = t('welcome.title');
      const welcomeSubtitle = t('welcome.subtitle');
      const gptDesc = t('welcome.gpt.desc');
      const geminiDesc = t('welcome.gemini.desc');
      
      messagesContainer.innerHTML = `
        <div class="welcome-message">
          <img class="welcome-icon" src="/icons/qiao.png" alt="Qiao">
          <h2>${welcomeTitle}</h2>
          <p>${welcomeSubtitle}</p>
          <div class="model-cards">
            <div class="model-card" data-model="chatgpt">
              <span class="model-badge openai">OpenAI</span>
              <h3>GPT-5.2</h3>
              <p>${gptDesc}</p>
            </div>
            <div class="model-card" data-model="gemini">
              <span class="model-badge google">Google</span>
              <h3>Gemini 3 Flash</h3>
              <p>${geminiDesc}</p>
            </div>
          </div>
        </div>
      `;
      
      // Re-attach model card listeners
      document.querySelectorAll('.model-card').forEach(card => {
        card.addEventListener('click', () => {
          const model = card.dataset.model;
          if (model) {
            modelSelect.value = model;
            updateModelLabel();
            personaInput?.focus();
          }
        });
      });
      return;
    }

    // Render each message
    chatHistory.forEach(msg => {
      const message = document.createElement('div');
      message.className = `message ${msg.role}`;

      const model = msg.model;
      const avatarClass = model ? (model === 'chatgpt' ? 'openai' : 'google') : '';
      const avatarIcon = msg.role === 'user' ? '👤' : modelIcons[model] || defaultAssistantIcon;
      const modelLabel = model ? modelNames[model] : '';

      message.innerHTML = `
        <div class="message-avatar ${avatarClass}">${avatarIcon}</div>
        <div class="message-content">
          <div class="message-bubble">
            <span class="message-text">${formatMessage(msg.content)}</span>
          </div>
          <div class="message-meta">
            ${modelLabel ? `<span class="model-name">${modelLabel}</span>` : ''}
          </div>
        </div>
      `;

      messagesContainer.appendChild(message);
    });

    scrollToBottom();
  }

  function formatMessage(text) {
    if (!text) return '';

    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function saveChatHistory() {
    if (!currentSessionId) return;
    
    if (!sessions[currentSessionId]) {
      sessions[currentSessionId] = {
        id: currentSessionId,
        title: getSessionTitle(chatHistory),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: chatHistory
      };
    } else {
      sessions[currentSessionId].messages = chatHistory;
      sessions[currentSessionId].updatedAt = Date.now();
      sessions[currentSessionId].title = getSessionTitle(chatHistory);
    }
    
    saveSessions();
  }
  
  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  function getSessionTitle(messages) {
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (firstUserMsg && firstUserMsg.content) {
      // Extract task from structured prompt if possible
      const taskMatch = firstUserMsg.content.match(/\[TASK\]\n([^\[]+)/);
      if (taskMatch) {
        const task = taskMatch[1].trim().substring(0, 50);
        return task.length < taskMatch[1].trim().length ? task + '...' : task;
      }
      const title = firstUserMsg.content.substring(0, 50);
      return title.length < firstUserMsg.content.length ? title + '...' : title;
    }
    return window.i18n ? window.i18n.t('header.newChat') : '新对话';
  }
  
  function loadSessions() {
    const savedSessions = localStorage.getItem('chat_sessions');
    if (savedSessions) {
      try {
        sessions = JSON.parse(savedSessions);
      } catch (e) {
        console.error('Failed to load sessions:', e);
        sessions = {};
      }
    }
  }
  
  function saveSessions() {
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    localStorage.setItem('current_session_id', currentSessionId);
  }
  
  function startNewSession() {
    if (currentSessionId && chatHistory.length > 0) {
      saveChatHistory();
    }
    
    currentSessionId = generateSessionId();
    chatHistory = [];
    saveSessions();
  }
  
  function switchToSession(sessionId) {
    if (isStreaming) return;
    if (!sessions[sessionId]) return;
    
    if (currentSessionId && chatHistory.length > 0) {
      saveChatHistory();
    }
    
    currentSessionId = sessionId;
    chatHistory = sessions[sessionId].messages || [];
    saveSessions();
    
    renderChatHistory();
    toggleHistorySidebar();
  }
  
  function deleteSession(sessionId, event) {
    event.stopPropagation();
    
    const msg = window.i18n ? window.i18n.t('history.deleteConfirm') : '确定要删除这个对话吗？';
    if (!confirm(msg)) return;
    
    delete sessions[sessionId];
    
    if (sessionId === currentSessionId) {
      startNewSession();
      renderChatHistory();
    }
    
    saveSessions();
    renderHistoryList();
  }
  
  function toggleHistorySidebar() {
    if (historySidebar) {
      historySidebar.classList.toggle('open');
    }
    if (historyOverlay) {
      historyOverlay.classList.toggle('visible');
    }
  }
  
  function renderHistoryList() {
    if (!historyList) return;
    
    const sessionArray = Object.values(sessions)
      .filter(s => s.messages && s.messages.length > 0)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    
    if (sessionArray.length === 0) {
      const emptyText = window.i18n ? window.i18n.t('history.empty') : '暂无历史对话';
      historyList.innerHTML = `<div class="history-empty">${emptyText}</div>`;
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const groups = { today: [], yesterday: [], earlier: [] };
    
    sessionArray.forEach(session => {
      const sessionDate = new Date(session.updatedAt);
      sessionDate.setHours(0, 0, 0, 0);
      
      if (sessionDate.getTime() === today.getTime()) {
        groups.today.push(session);
      } else if (sessionDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(session);
      } else {
        groups.earlier.push(session);
      }
    });
    
    const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;
    let html = '';
    
    if (groups.today.length > 0) {
      html += renderHistoryGroup(t('history.today'), groups.today);
    }
    if (groups.yesterday.length > 0) {
      html += renderHistoryGroup(t('history.yesterday'), groups.yesterday);
    }
    if (groups.earlier.length > 0) {
      html += renderHistoryGroup(t('history.earlier'), groups.earlier);
    }
    
    historyList.innerHTML = html;
    
    historyList.querySelectorAll('.history-item').forEach(item => {
      const sessionId = item.dataset.sessionId;
      item.addEventListener('click', () => switchToSession(sessionId));
      
      const deleteBtn = item.querySelector('.history-item-delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => deleteSession(sessionId, e));
      }
    });
  }
  
  function renderHistoryGroup(title, sessions) {
    let html = `<div class="history-group">
      <div class="history-group-title">${title}</div>`;
    
    sessions.forEach(session => {
      const isActive = session.id === currentSessionId;
      const model = session.messages.find(m => m.model)?.model || 'chatgpt';
      const icon = modelIcons[model] || defaultAssistantIcon;
      const time = new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      html += `
        <div class="history-item ${isActive ? 'active' : ''}" data-session-id="${session.id}">
          <div class="history-item-icon">${icon}</div>
          <div class="history-item-content">
            <div class="history-item-title">${escapeHtml(session.title)}</div>
            <div class="history-item-meta">${time}</div>
          </div>
          <button class="history-item-delete" title="${window.i18n ? window.i18n.t('history.delete') : '删除'}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
            </svg>
          </button>
        </div>`;
    });
    
    html += '</div>';
    return html;
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Prompt Builder Functions
  function clearPromptFormFields() {
    if (personaInput) personaInput.value = '';
    if (taskInput) taskInput.value = '';
    if (contextInput) contextInput.value = '';
    if (formatInput) formatInput.value = '';
    if (referencesInput) referencesInput.value = '';
  }

  function clearPromptForm() {
    const msg = window.i18n ? window.i18n.t('promptBuilder.clearConfirm') : '确定要清空所有字段吗？';
    if (confirm(msg)) {
      clearPromptFormFields();
      personaInput?.focus();
    }
  }
  
  // Extension Modal Functions
  function showExtensionModal(requestUnlimited = false) {
    if (!extensionModal) return;
    
    // Check for pending request first
    checkPendingExtensionRequest();
    
    // Pre-select unlimited if requested
    if (requestUnlimited && extensionAmountSelect) {
      extensionAmountSelect.value = '';
    }

    extensionModal.style.display = 'flex';
  }
  
  function hideExtensionModal() {
    if (!extensionModal) return;
    extensionModal.style.display = 'none';
    
    // Reset form
    if (extensionAmountSelect) extensionAmountSelect.value = '5';
    if (extensionReasonInput) extensionReasonInput.value = '';
  }
  
  async function checkPendingExtensionRequest() {
    try {
      const data = await window.API.getUsageStatus();
      
      if (data.extension?.has_pending) {
        // Show pending notice, hide form
        if (extensionPendingNotice) extensionPendingNotice.style.display = 'block';
        if (extensionForm) extensionForm.style.display = 'none';
        
        // Show status of last request
        if (extensionStatus && data.extension.pending_request) {
          extensionStatus.style.display = 'block';
          const req = data.extension.pending_request;
          const amountText = req.requested_amount ? `${req.requested_amount} 次` : '无限制';
          extensionStatus.querySelector('#extension-status-content').innerHTML = `
            <p><strong>申请次数:</strong> ${amountText}</p>
            <p><strong>申请时间:</strong> ${new Date(req.created_at).toLocaleString()}</p>
            <p><strong>状态:</strong> <span class="status-pending">待审核</span></p>
          `;
        }
      } else {
        // Show form, hide pending notice
        if (extensionPendingNotice) extensionPendingNotice.style.display = 'none';
        if (extensionForm) extensionForm.style.display = 'block';
        if (extensionStatus) extensionStatus.style.display = 'none';
      }
    } catch (err) {
      console.error('Failed to check pending request:', err);
    }
  }
  
  async function handleExtensionSubmit(e) {
    e.preventDefault();

    const amount = extensionAmountSelect?.value;
    const reason = extensionReasonInput?.value.trim();

    if (!reason || reason.length < 10) {
      alert(window.i18n ? window.i18n.t('extension.reasonMinLength') : '申请理由至少需要10个字符');
      return;
    }

    try {
      submitExtensionBtn.disabled = true;
      submitExtensionBtn.textContent = window.i18n ? window.i18n.t('common.submitting') : '提交中...';

      const requestedAmount = amount === '' ? null : parseInt(amount);
      await window.API.requestExtension(reason, requestedAmount);

      alert(window.i18n ? window.i18n.t('extension.submitSuccess') : '申请已提交，请等待管理员审核');
      hideExtensionModal();

      // Refresh usage status
      await fetchUsageStatus();
    } catch (err) {
      alert(err.message || '提交失败，请稍后重试');
    } finally {
      submitExtensionBtn.disabled = false;
      submitExtensionBtn.textContent = window.i18n ? window.i18n.t('extension.submit') : '提交申请';
    }
  }

  // ============================================
  // Welcome Modal Functions
  // ============================================

  function showWelcomeModal() {
    if (!welcomeModal) return;
    
    // Update the usage count display
    if (welcomeUsageCount) {
      welcomeUsageCount.textContent = usageInfo.is_unlimited ? '∞' : usageInfo.remaining;
    }
    
    welcomeModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Setup acknowledge button
    if (welcomeAckBtn) {
      welcomeAckBtn.addEventListener('click', hideWelcomeModal, { once: true });
    }
    // Setup apply unlimited button (only for limited users)
    if (welcomeApplyUnlimitedBtn) {
      if (usageInfo.is_unlimited) {
        welcomeApplyUnlimitedBtn.style.display = 'none';
      } else {
        welcomeApplyUnlimitedBtn.style.display = 'inline-flex';
        welcomeApplyUnlimitedBtn.addEventListener('click', () => {
          hideWelcomeModal(true);
          // Open extension modal pre-filled as unlimited after slight delay
          setTimeout(() => showExtensionModal(true), 200);
        }, { once: true });
      }
    }
    
    // Close on overlay click
    const overlay = welcomeModal.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', hideWelcomeModal, { once: true });
    }
  }

  function hideWelcomeModal(skipHighlight = false) {
    if (!welcomeModal) return;
    
    // Mark as shown for this session
    sessionStorage.setItem('welcomeShown', 'true');
    
    // Get positions for shrink animation
    const usageCounterRect = usageCounter?.getBoundingClientRect();
    const modalContent = welcomeModal.querySelector('.welcome-modal-content');
    
    // If unlimited or no counter visible, just fade out without shrink
    const canAnimateToCounter = !skipHighlight && usageCounterRect && modalContent && usageCounter?.style.display !== 'none' && headerLeft?.style.display !== 'none';

    if (canAnimateToCounter) {
      // Calculate the offset to shrink towards the usage counter
      const modalRect = modalContent.getBoundingClientRect();
      const centerX = modalRect.left + modalRect.width / 2;
      const centerY = modalRect.top + modalRect.height / 2;
      const targetX = usageCounterRect.left + usageCounterRect.width / 2;
      const targetY = usageCounterRect.top + usageCounterRect.height / 2;
      
      // Set CSS variables for animation target
      modalContent.style.setProperty('--shrink-x', `${targetX - centerX}px`);
      modalContent.style.setProperty('--shrink-y', `${targetY - centerY}px`);
      
      // Add shrinking class to trigger animation
      welcomeModal.classList.add('shrinking');
      
      // After animation, hide modal and highlight usage counter
      setTimeout(() => {
        welcomeModal.style.display = 'none';
        welcomeModal.classList.remove('shrinking');
        document.body.style.overflow = '';
        
        // Highlight the usage counter
        if (usageCounter) {
          usageCounter.classList.add('highlight');
          setTimeout(() => {
            usageCounter.classList.remove('highlight');
          }, 600);
        }
      }, 500);
    } else {
      // Fallback: just hide without animation
      welcomeModal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }
});
