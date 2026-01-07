/**
 * Main Chat Application
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
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const modelSelect = document.getElementById('model-select');
  const currentModelLabel = document.getElementById('current-model-label');
  const charCount = document.getElementById('char-count');
  const clearChatBtn = document.getElementById('clear-chat');
  const logoutBtn = document.getElementById('logout-btn');
  const adminLink = document.getElementById('admin-link');
  const langToggleBtn = document.getElementById('lang-toggle');
  
  // Prompt Builder Elements
  const promptBuilderBtn = document.getElementById('prompt-builder-btn');
  const promptBuilder = document.getElementById('prompt-builder');
  const closePromptBuilderBtn = document.getElementById('close-prompt-builder');
  const promptForm = document.getElementById('prompt-form');
  const personaInput = document.getElementById('persona-input');
  const taskInput = document.getElementById('task-input');
  const contextInput = document.getElementById('context-input');
  const formatInput = document.getElementById('format-input');
  const referencesInput = document.getElementById('references-input');
  const generatePromptBtn = document.getElementById('generate-prompt');
  const clearPromptFormBtn = document.getElementById('clear-prompt-form');

  // History Sidebar Elements
  const newChatBtn = document.getElementById('new-chat-btn');
  const historyBtn = document.getElementById('history-btn');
  const historySidebar = document.getElementById('history-sidebar');
  const closeHistoryBtn = document.getElementById('close-history');
  const historyList = document.getElementById('history-list');
  const historyOverlay = document.getElementById('history-overlay');

  // State
  let chatHistory = [];
  let isStreaming = false;
  let currentStreamingMessage = null;
  let currentStreamAbortController = null;
  let currentStreamFullResponse = '';
  
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
    chatgpt: '◈',
    gemini: '◇'
  };

  // Initialize
  init();

  async function init() {
    // Check if user is admin
    try {
      const user = await window.API.getCurrentUser();
      if (user.isAdmin && adminLink) {
        adminLink.style.display = 'flex';
      }
    } catch (err) {
      console.error('Failed to check admin status:', err);
    }

    // Load sessions from local storage
    loadSessions();
    
    // Load current session or create new one
    const savedSessionId = localStorage.getItem('current_session_id');
    if (savedSessionId && sessions[savedSessionId]) {
      currentSessionId = savedSessionId;
      chatHistory = sessions[savedSessionId].messages || [];
    } else {
      // Create a new session
      startNewSession();
    }
    
    renderChatHistory();
    renderHistoryList();

    // Update model label
    updateModelLabel();

    // Set up event listeners
    setupEventListeners();

    // Focus input
    messageInput.focus();
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
          messageInput.focus();
        }
      });
    });

    // Message input
    messageInput.addEventListener('input', handleInputChange);
    messageInput.addEventListener('keydown', handleKeyDown);

    // Form submit
    chatForm.addEventListener('submit', handleSubmit);

    // Clear chat
    clearChatBtn.addEventListener('click', clearChat);

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
          // Re-render chat history to update welcome message if visible
          if (chatHistory.length === 0) {
            renderChatHistory();
          }
        }
      });
    }

    // Prompt Builder
    if (promptBuilderBtn) {
      promptBuilderBtn.addEventListener('click', togglePromptBuilder);
    }
    if (closePromptBuilderBtn) {
      closePromptBuilderBtn.addEventListener('click', togglePromptBuilder);
    }
    if (generatePromptBtn) {
      generatePromptBtn.addEventListener('click', generatePrompt);
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
        messageInput.focus();
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
  }

  function updateModelLabel() {
    const model = modelSelect.value;
    currentModelLabel.textContent = modelNames[model] || model;
  }

  function handleInputChange() {
    // Auto-resize textarea
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';

    // Update character count
    const length = messageInput.value.length;
    charCount.textContent = `${length} / 32000`;

    // Enable/disable send button
    sendBtn.disabled = !messageInput.value.trim() || isStreaming;
  }

  function handleKeyDown(e) {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (messageInput.value.trim() && !isStreaming) {
        handleSubmit(e);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const message = messageInput.value.trim();
    if (!message) return;

    // If currently streaming, cancel it and combine messages
    if (isStreaming && currentStreamAbortController) {
      // Cancel current stream
      currentStreamAbortController.abort();
      
      // Remove incomplete assistant message
      if (currentStreamingMessage) {
        const assistantMsgElement = currentStreamingMessage.closest('.message');
        if (assistantMsgElement) {
          assistantMsgElement.remove();
        }
        // Remove from history
        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'assistant') {
          chatHistory.pop();
        }
      }
      
      // Combine last user message with new message
      if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
        const lastUserMsg = chatHistory[chatHistory.length - 1].content;
        const combinedMessage = lastUserMsg + '\n\n' + message;
        chatHistory[chatHistory.length - 1].content = combinedMessage;
        
        // Update the last user message in UI
        const lastUserElement = messagesContainer.querySelector('.message.user:last-child');
        if (lastUserElement) {
          const bubble = lastUserElement.querySelector('.message-text');
          if (bubble) {
            bubble.innerHTML = formatMessage(combinedMessage);
          }
        }
      } else {
        // No previous user message, just add new one
        addMessage('user', message);
      }
      
      // Reset streaming state
      isStreaming = false;
      currentStreamingMessage = null;
      currentStreamAbortController = null;
      currentStreamFullResponse = '';
    } else if (isStreaming) {
      // Already streaming and can't cancel, ignore
      return;
    }

    const model = modelSelect.value;

    // Clear input
    messageInput.value = '';
    handleInputChange();

    // Hide welcome message
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    // Add user message (if we combined messages above, it's already added)
    // Check if last message in history is the one we just combined
    const wasCombined = chatHistory.length > 0 && 
                       chatHistory[chatHistory.length - 1].role === 'user' &&
                       chatHistory[chatHistory.length - 1].content.includes('\n\n');
    
    if (!wasCombined) {
      addMessage('user', message);
    }

    // Add assistant message placeholder
    const assistantMessage = addMessage('assistant', '', model);
    currentStreamingMessage = assistantMessage.querySelector('.message-text');

    // Start streaming
    isStreaming = true;
    sendBtn.disabled = true;
    currentStreamFullResponse = '';

    // Show typing indicator
    currentStreamingMessage.innerHTML = `
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    // Build history for API (exclude the incomplete assistant message if exists)
    const apiHistory = chatHistory
      .filter(msg => msg.role !== 'assistant' || msg.content) // Remove empty assistant messages
      .slice(0, -1) // Exclude the user message we just added
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Create abort controller for this stream
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
        () => {
          if (!currentStreamingMessage) return;
          
          // Update chat history with full response
          const lastAssistantMsg = chatHistory[chatHistory.length - 1];
          if (lastAssistantMsg && lastAssistantMsg.role === 'assistant') {
            lastAssistantMsg.content = currentStreamFullResponse;
          }
          saveChatHistory();
          
          isStreaming = false;
          sendBtn.disabled = !messageInput.value.trim();
          currentStreamingMessage = null;
          currentStreamAbortController = null;
          currentStreamFullResponse = '';
          messageInput.focus();
        },
        // onError
        (error) => {
          console.error('Chat error:', error);
          
          if (!currentStreamingMessage) return;
          
          // Don't show error if it was aborted
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
          sendBtn.disabled = !messageInput.value.trim();
          currentStreamingMessage = null;
          currentStreamAbortController = null;
          currentStreamFullResponse = '';
        }
      );
    } catch (err) {
      // Handle abort or other errors
      if (err.name !== 'AbortError') {
        console.error('Send message error:', err);
        if (currentStreamingMessage) {
          currentStreamingMessage.innerHTML = `
            <span style="color: var(--error)">错误：${err.message}</span>
          `;
        }
      }
      
      isStreaming = false;
      sendBtn.disabled = !messageInput.value.trim();
      currentStreamingMessage = null;
      currentStreamAbortController = null;
      currentStreamFullResponse = '';
    }
  }

  function addMessage(role, content, model = null) {
    const message = document.createElement('div');
    message.className = `message ${role}`;

    const avatarClass = model ? (model === 'chatgpt' ? 'openai' : 'google') : '';
    const avatarIcon = role === 'user' ? '👤' : modelIcons[model] || '◈';
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
    // Clear container (except welcome message)
    messagesContainer.innerHTML = '';

    if (chatHistory.length === 0) {
      // Get translations
      const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;
      const welcomeTitle = t('welcome.title');
      const welcomeSubtitle = t('welcome.subtitle');
      const gptDesc = t('welcome.gpt.desc');
      const geminiDesc = t('welcome.gemini.desc');
      
      // Show welcome message
      messagesContainer.innerHTML = `
        <div class="welcome-message">
          <div class="welcome-icon">◈</div>
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
            messageInput.focus();
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
      const avatarIcon = msg.role === 'user' ? '👤' : modelIcons[model] || '◈';
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

    // Escape HTML
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Format code blocks
    formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    // Format inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Format bold
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Format italic
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Format line breaks
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
    
    // Update current session
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
    
    // Save sessions to localStorage
    saveSessions();
  }
  
  // Session Management Functions
  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  function getSessionTitle(messages) {
    // Get first user message as title
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (firstUserMsg && firstUserMsg.content) {
      // Truncate to first 50 characters
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
    
    // Migrate old chat_history if exists
    const oldHistory = localStorage.getItem('chat_history');
    if (oldHistory && Object.keys(sessions).length === 0) {
      try {
        const messages = JSON.parse(oldHistory);
        if (messages && messages.length > 0) {
          const migrationId = generateSessionId();
          sessions[migrationId] = {
            id: migrationId,
            title: getSessionTitle(messages),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: messages
          };
          currentSessionId = migrationId;
          chatHistory = messages;
          saveSessions();
          localStorage.removeItem('chat_history'); // Remove old format
        }
      } catch (e) {
        console.error('Failed to migrate old history:', e);
      }
    }
  }
  
  function saveSessions() {
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    localStorage.setItem('current_session_id', currentSessionId);
  }
  
  function startNewSession() {
    // Save current session first if it has messages
    if (currentSessionId && chatHistory.length > 0) {
      saveChatHistory();
    }
    
    // Create new session
    currentSessionId = generateSessionId();
    chatHistory = [];
    saveSessions();
  }
  
  function switchToSession(sessionId) {
    if (isStreaming) return;
    if (!sessions[sessionId]) return;
    
    // Save current session
    if (currentSessionId && chatHistory.length > 0) {
      saveChatHistory();
    }
    
    // Switch to selected session
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
    
    // If deleting current session, start a new one
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
    
    // Group by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const groups = {
      today: [],
      yesterday: [],
      earlier: []
    };
    
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
    
    // Add click handlers
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
      const icon = modelIcons[model] || '◈';
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

  function clearChat() {
    if (isStreaming) return;

    const msg = window.i18n ? window.i18n.t('confirm.clearChat') : '确定要清空所有消息吗？';
    if (chatHistory.length === 0 || confirm(msg)) {
      chatHistory = [];
      if (currentSessionId && sessions[currentSessionId]) {
        delete sessions[currentSessionId];
      }
      startNewSession();
      saveSessions();
      renderChatHistory();
      renderHistoryList();
    }
  }

  // Prompt Builder Functions
  function togglePromptBuilder() {
    if (promptBuilder) {
      const isVisible = promptBuilder.style.display !== 'none';
      promptBuilder.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        // Focus first input when opening
        setTimeout(() => {
          personaInput?.focus();
        }, 100);
      }
    }
  }

  function generatePrompt() {
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

    // Build prompt based on template
    let prompt = `[PERSONA]\n${persona}\n\n[TASK]\n${task}\n\n[CONTEXT]\n${context}`;

    if (format) {
      prompt += `\n\n[FORMAT]\n${format}`;
    }

    if (references) {
      prompt += `\n\n[REFERENCES]\n${references}`;
    }

    // Populate main input
    if (messageInput) {
      messageInput.value = prompt;
      handleInputChange();
      
      // Close prompt builder
      togglePromptBuilder();
      
      // Focus main input
      messageInput.focus();
      
      // Scroll to input
      messageInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function clearPromptForm() {
    const msg = window.i18n ? window.i18n.t('promptBuilder.clearConfirm') : '确定要清空所有字段吗？';
    if (confirm(msg)) {
      if (personaInput) personaInput.value = '';
      if (taskInput) taskInput.value = '';
      if (contextInput) contextInput.value = '';
      if (formatInput) formatInput.value = '';
      if (referencesInput) referencesInput.value = '';
      
      // Focus first input
      personaInput?.focus();
    }
  }
});

