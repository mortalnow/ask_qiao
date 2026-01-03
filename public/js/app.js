/**
 * Main Chat Application
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  if (!window.API?.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
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

  // State
  let chatHistory = [];
  let isStreaming = false;
  let currentStreamingMessage = null;
  let currentStreamAbortController = null;
  let currentStreamFullResponse = '';

  // Model display names
  const modelNames = {
    chatgpt: 'GPT-4o',
    gemini: 'Gemini 1.5 Flash'
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

    // Load chat history from local storage
    const savedHistory = localStorage.getItem('chat_history');
    if (savedHistory) {
      try {
        chatHistory = JSON.parse(savedHistory);
        renderChatHistory();
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }

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
      if (confirm('确定要退出登录吗？')) {
        window.API.logout();
      }
    });
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
      // Show welcome message
      messagesContainer.innerHTML = `
        <div class="welcome-message">
          <div class="welcome-icon">◈</div>
          <h2>欢迎使用与Qiao对话</h2>
          <p>选择一个模型开始对话，您可以随时切换模型。</p>
          <div class="model-cards">
            <div class="model-card" data-model="chatgpt">
              <span class="model-badge openai">OpenAI</span>
              <h3>GPT-4o</h3>
              <p>强大的推理与视觉能力</p>
            </div>
            <div class="model-card" data-model="gemini">
              <span class="model-badge google">Google</span>
              <h3>Gemini 1.5 Flash</h3>
              <p>快速的多模态响应</p>
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
    localStorage.setItem('chat_history', JSON.stringify(chatHistory));
  }

  function clearChat() {
    if (isStreaming) return;

    if (chatHistory.length === 0 || confirm('确定要清空所有消息吗？')) {
      chatHistory = [];
      saveChatHistory();
      renderChatHistory();
    }
  }
});

