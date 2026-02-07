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
  const headerLogo = document.getElementById('header-logo');
  const welcomeUsagePill = document.getElementById('welcome-usage-pill');
  const welcomeUsagePillText = document.getElementById('welcome-usage-pill-text');

  // Usage Counter Elements
  const headerLeft = document.querySelector('.header-left');
  const usageCounter = document.getElementById('usage-counter');
  const usageText = document.getElementById('usage-text');

  // Prompt Builder Elements
  const promptBuilder = document.getElementById('prompt-builder');
  const backToMainBtn = document.getElementById('back-to-main-btn');
  const promptForm = document.getElementById('prompt-form');
  const personaInput = document.getElementById('persona-input');
  const taskInput = document.getElementById('task-input');
  const contextInput = document.getElementById('context-input');
  const formatInput = document.getElementById('format-input');
  const referencesInput = document.getElementById('references-input');
  const sendPromptBtn = document.getElementById('send-prompt');
  const clearPromptFormBtn = document.getElementById('clear-prompt-form');

  // File Upload Elements
  const fileUploadArea = document.getElementById('file-upload-area');
  const fileUploadZone = document.getElementById('file-upload-zone');
  const fileInput = document.getElementById('file-input');
  const filePreviewList = document.getElementById('file-preview-list');
  const fileCountDisplay = document.getElementById('file-count');
  const fileProgressBar = document.getElementById('file-upload-progress-bar');
  const fileProgressText = document.getElementById('file-upload-progress-text');

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

  // Usage Confirmation Modal Elements (shown before each prompt for limited users)
  const usageConfirmationModal = document.getElementById('usage-confirmation-modal');
  const usageConfirmationCount = document.getElementById('usage-confirmation-count');
  const usageConfirmationAfterCount = document.getElementById('usage-confirmation-after-count');
  const usageConfirmationCancelBtn = document.getElementById('usage-confirmation-cancel');
  const usageConfirmationConfirmBtn = document.getElementById('usage-confirmation-confirm');

  // Apply Unlimited Button (next to usage counter)
  const applyUnlimitedBtn = document.getElementById('apply-unlimited-btn');

  // Skills Modal Elements
  const skillsBtn = document.getElementById('skills-btn');
  const skillsModal = document.getElementById('skills-modal');
  const closeSkillsModalBtn = document.getElementById('close-skills-modal');
  const closeSkillsBtn = document.getElementById('close-skills-btn');
  const skillsCount = document.getElementById('skills-count');
  const skillsTokenWarning = document.getElementById('skills-token-warning');

  // State
  let chatHistory = [];
  let isStreaming = false;
  let currentStreamingMessage = null;
  let currentStreamAbortController = null;
  let currentStreamFullResponse = '';

  // File Upload State and Configuration
  let uploadedFiles = []; // Array of { file, name, mimeType, data (base64), previewUrl }
  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  // Skills State and Configuration
  const SKILLS_TOKEN_WARNING_THRESHOLD = 2000; // characters
  let skillsStatusTimeout = null;

  // Generate Skill Modal Elements
  const generateSkillModal = document.getElementById('generate-skill-modal');
  const closeGenerateSkillModalBtn = document.getElementById('close-generate-skill-modal');
  const cancelGenerateSkillBtn = document.getElementById('cancel-generate-skill');
  const retryGenerateSkillBtn = document.getElementById('retry-generate-skill');
  const saveGeneratedSkillBtn = document.getElementById('save-generated-skill');
  const generateSkillLoading = document.getElementById('generate-skill-loading');
  const generateSkillPreview = document.getElementById('generate-skill-preview');
  const generateSkillError = document.getElementById('generate-skill-error');
  const generateSkillErrorText = document.getElementById('generate-skill-error-text');
  const generatedSkillName = document.getElementById('generated-skill-name');
  const generatedSkillDescription = document.getElementById('generated-skill-description');
  const generatedSkillCategory = document.getElementById('generated-skill-category');
  const generatedSkillTags = document.getElementById('generated-skill-tags');
  const generatedSkillContent = document.getElementById('generated-skill-content');

  // Current generation source (prompt + assistant answer)
  let currentSkillGenerationSource = null;

  // Skills Tab Elements
  const skillsTabMySkills = document.getElementById('skills-tab-my-skills');
  const skillsServerList = document.getElementById('skills-server-list');
  const skillsSearchInput = document.getElementById('skills-search-input');
  const skillsCategoryFilter = document.getElementById('skills-category-filter');
  const skillsTagFilter = document.getElementById('skills-tag-filter');
  const clearSkillsFiltersBtn = document.getElementById('skills-clear-filters');
  const skillsTagsDatalist = document.getElementById('skills-tags-datalist');
  const exportAllSkillsBtn = document.getElementById('skills-export-all');
  const exportEnabledSkillsBtn = document.getElementById('skills-export-enabled');
  const skillsStatus = document.getElementById('skills-status');

  // Edit Skill Modal Elements
  const editSkillModal = document.getElementById('edit-skill-modal');
  const closeEditSkillModalBtn = document.getElementById('close-edit-skill-modal');
  const cancelEditSkillBtn = document.getElementById('cancel-edit-skill');
  const saveEditSkillBtn = document.getElementById('save-edit-skill');
  const deleteSkillBtn = document.getElementById('delete-skill-btn');
  const editSkillId = document.getElementById('edit-skill-id');
  const editSkillName = document.getElementById('edit-skill-name');
  const editSkillDescription = document.getElementById('edit-skill-description');
  const editSkillCategory = document.getElementById('edit-skill-category');
  const editSkillTags = document.getElementById('edit-skill-tags');
  const editSkillContent = document.getElementById('edit-skill-content');

  // Server skills state
  let serverSkills = [];
  let serverSkillsLoaded = false;
  let enabledServerSkills = [];
  let enabledServerSkillsLoaded = false;
  let skillsCategories = [];
  let skillsTags = [];
  let skillsFiltersLoaded = false;

  // Supported file types
  const SUPPORTED_TYPES = {
    images: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    all: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  // Document types that need text extraction (work with all models)
  const DOCUMENT_TYPES = {
    pdf: 'application/pdf',
    txt: 'text/plain',
    md: 'text/markdown',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };

  // Max extracted text length (to prevent context overflow)
  const MAX_EXTRACTED_TEXT_LENGTH = 50000;

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
    chatgpt: 'ChatGPT'
  };

  // Model icons
  const modelIcons = {
    chatgpt: '<img src="/icons/qiao.png" alt="Qiao" class="avatar-img">'
  };
  const defaultAssistantIcon = '<img src="/icons/qiao.png" alt="Qiao" class="avatar-img">';

  // Track whether we should show welcome modal (check AFTER API call)
  const shouldShowWelcome = !sessionStorage.getItem('welcomeShown');
  let hasStartedPromptFlow = false;
  let welcomeModalSource = null; // Track where welcome modal was opened from ('pill' or 'auto')

  // Initialize
  init();

  async function init() {
    // IMPORTANT: Set correct initial state IMMEDIATELY to prevent flash
    // Load sessions first (synchronous) to determine initial view state
    loadSessions();
    const savedSessionId = localStorage.getItem('current_session_id');
    const hasChatHistory = savedSessionId && sessions[savedSessionId] && sessions[savedSessionId].messages?.length > 0;

    // Set initial state before any async operations to prevent flash
    if (hasChatHistory) {
      // User has chat history - show minimized prompt builder immediately
      if (appContainer) {
        appContainer.classList.remove('landing-state');
        appContainer.classList.add('prompt-minimized-state');
      }
    }
    // If no history, keep the landing-state that's already in HTML

    // Check if user is admin FIRST (before showing any modals)
    try {
      const user = await window.API.getCurrentUser();
      userIsAdmin = !!user.isAdmin;

      if (user.isAdmin && adminLink) {
        adminLink.style.display = 'flex';
      }
    } catch (err) {
      console.error('Failed to get current user:', err);
    }

    // Fetch usage status (always attempt, even if getCurrentUser failed)
    await fetchUsageStatus();

    // Decide whether to show the welcome modal later (AFTER we know user type)
    const isLimitedUser = !userIsAdmin && !usageInfo.is_unlimited;

    if (shouldShowWelcome && !isLimitedUser) {
      // Mark as shown for admin/unlimited users without displaying
      sessionStorage.setItem('welcomeShown', 'true');
    }

    // Load current session or create new one
    if (savedSessionId && sessions[savedSessionId]) {
      currentSessionId = savedSessionId;
      chatHistory = sessions[savedSessionId].messages || [];
    } else {
      startNewSession();
    }

    renderChatHistory();
    renderHistoryList();

    // Update view state if needed (should already be correct from above)
    if (chatHistory.length === 0 && !appContainer?.classList.contains('landing-state')) {
      showLanding();
    }

    // Update model label
    updateModelLabel();

    // Set up event listeners
    setupEventListeners();

    // Keep skill badge/token status synced from server-managed skills
    refreshEnabledServerSkills();
    updateSkillsUI();

    // Reveal app after initialization is complete (prevents flash)
    if (appContainer) {
      appContainer.classList.add('app-ready');
    }
  }

  async function fetchUsageStatus() {
    try {
      const data = await window.API.getUsageStatus();
      usageInfo = data.usage;

      // Check for pending extension request
      if (data.extension?.has_pending) {
        // User has a pending request
        console.log('User has pending extension request');
      }
    } catch (err) {
      console.error('Failed to fetch usage status:', err);
      // Keep default usageInfo values on error
    }
    // ALWAYS update display - even on API error, show default (0/5)
    updateUsageDisplay();
  }

  function updateUsageDisplay() {
    if (!usageCounter || !usageText) return;

    const isLanding = appContainer?.classList.contains('landing-state');
    if (isLanding) {
      usageText.textContent = '';
      usageCounter.classList.remove('visible', 'usage-warning');
      if (headerLeft) {
        headerLeft.classList.add('hidden');
      }
      return;
    }

    const hideUsage = usageInfo.is_unlimited || userIsAdmin;

    if (hideUsage) {
      // Hide entire header-left for unlimited users/admins (and clear text)
      usageText.textContent = '';
      usageCounter.classList.remove('visible');
      if (headerLeft) {
        headerLeft.classList.add('hidden');
      }
    } else {
      // Show usage counter for limited users
      if (headerLeft) {
        headerLeft.classList.remove('hidden');
      }
      usageCounter.classList.add('visible');
      // Compact format: just show "0/5"
      usageText.textContent = `${usageInfo.count}/${usageInfo.limit}`;

      // Add warning class if close to limit
      if (usageInfo.remaining <= 1) {
        usageCounter.classList.add('usage-warning');
      } else {
        usageCounter.classList.remove('usage-warning');
      }
    }

    updateWelcomeUsagePill();
  }

  function updateWelcomeUsagePill(forceShow = false) {
    if (!welcomeUsagePill || !welcomeUsagePillText) return;

    const isLimitedUser = !userIsAdmin && !usageInfo.is_unlimited;
    if (!isLimitedUser) {
      welcomeUsagePill.classList.remove('visible');
      return;
    }

    if (usageInfo.is_unlimited) {
      welcomeUsagePillText.textContent = '∞';
    } else {
      const used = usageInfo.count ?? 0;
      const limit = usageInfo.limit ?? 0;
      welcomeUsagePillText.textContent = `${used}/${limit}`;
    }
    welcomeUsagePill.classList.add('visible');
  }

  // App container for managing minimized prompt state
  const appContainer = document.getElementById('app');

  // Minimized prompt bar elements
  const promptMinimized = document.getElementById('prompt-minimized');
  const expandPromptBtn = document.getElementById('expand-prompt-btn');

  function animateIconBetweenRects(iconEl, startRect, endRect, onDone) {
    if (!iconEl || !startRect || !endRect) return false;
    if (startRect.width === 0 || startRect.height === 0) return false;

    const targetSize = Math.max(24, Math.min(endRect.width, startRect.width));
    const scale = targetSize / startRect.width;
    // Center the icon on the target element
    const targetX = endRect.left + (endRect.width / 2) - (startRect.width * scale / 2);
    const targetY = endRect.top + (endRect.height / 2) - (startRect.height * scale / 2);

    const clone = iconEl.cloneNode(true);
    clone.classList.add('landing-icon-fly');
    clone.style.position = 'fixed';
    clone.style.left = `${startRect.left}px`;
    clone.style.top = `${startRect.top}px`;
    clone.style.width = `${startRect.width}px`;
    clone.style.height = `${startRect.height}px`;
    clone.style.setProperty('--fly-x', `${targetX - startRect.left}px`);
    clone.style.setProperty('--fly-y', `${targetY - startRect.top}px`);
    clone.style.setProperty('--fly-scale', `${scale}`);

    document.body.appendChild(clone);
    requestAnimationFrame(() => {
      clone.classList.add('landing-icon-fly-active');
    });

    clone.addEventListener('transitionend', () => {
      clone.remove();
      if (onDone) onDone();
    }, { once: true });

    return true;
  }

  function animateIconToHeader(iconEl, onDone) {
    const header = document.querySelector('.chat-header');
    const targetEl = headerLogo || header;
    if (!iconEl || !targetEl) return false;

    const targetRect = targetEl.getBoundingClientRect();
    const iconRect = iconEl.getBoundingClientRect();
    return animateIconBetweenRects(iconEl, iconRect, targetRect, onDone);
  }

  function animateIconToPill(iconEl, onDone) {
    // Animate icon to the usage pill button
    if (!iconEl || !welcomeUsagePill) return false;

    const targetRect = welcomeUsagePill.getBoundingClientRect();
    const iconRect = iconEl.getBoundingClientRect();
    return animateIconBetweenRects(iconEl, iconRect, targetRect, onDone);
  }

  function animateLandingIconToHeader() {
    const icon = messagesContainer?.querySelector('.welcome-icon');
    const didAnimate = animateIconToHeader(icon, () => {
      // No-op: header logo is always visible outside landing.
    });
    return didAnimate;
  }

  function animateHeaderLogoToLandingIcon(startRect = null) {
    if (!headerLogo) return false;
    const landingIcon = messagesContainer?.querySelector('.welcome-icon');
    if (!landingIcon) return false;

    const iconRect = startRect || headerLogo.getBoundingClientRect();
    const landingRect = landingIcon.getBoundingClientRect();
    landingIcon.classList.add('welcome-icon-hidden');

    return animateIconBetweenRects(headerLogo, iconRect, landingRect, () => {
      landingIcon.classList.remove('welcome-icon-hidden');
    });
  }

  function bindLandingActions() {
    const welcomeIcon = messagesContainer?.querySelector('.welcome-icon');
    if (welcomeIcon && !welcomeIcon.dataset.bound) {
      welcomeIcon.dataset.bound = 'true';
      welcomeIcon.addEventListener('click', () => {
        // Reset to initial state without page reload
        chatHistory = [];
        renderChatHistory();
        showLanding();
      });
    }

    const startBtn = document.getElementById('mission-start-btn');
    if (startBtn && !startBtn.dataset.bound) {
      startBtn.dataset.bound = 'true';
      startBtn.addEventListener('click', () => {
        hasStartedPromptFlow = true;
        animateLandingIconToHeader();
        expandPromptBuilder();
        scrollToBottom();
      });
    }

    const skillsBtn = document.getElementById('mission-skills-btn');
    if (skillsBtn && !skillsBtn.dataset.bound) {
      skillsBtn.dataset.bound = 'true';
      skillsBtn.addEventListener('click', () => {
        showSkillsModal();
      });
    }
  }

  function setupEventListeners() {
    // Model selection
    modelSelect?.addEventListener('change', () => {
      updateModelLabel();
      checkFileCompatibility();
    });

    // Minimized prompt bar - expand on click
    if (promptMinimized) {
      promptMinimized.addEventListener('click', expandPromptBuilder);
    }
    if (expandPromptBtn) {
      expandPromptBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        expandPromptBuilder();
      });
    }

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

    // Landing CTA -> open prompt builder / skills
    bindLandingActions();

    // Prompt Builder - Send button (main action)
    if (sendPromptBtn) {
      sendPromptBtn.addEventListener('click', sendPrompt);
    }
    if (clearPromptFormBtn) {
      clearPromptFormBtn.addEventListener('click', clearPromptForm);
    }
    if (backToMainBtn) {
      backToMainBtn.addEventListener('click', () => {
        if (isStreaming) return;
        if (chatHistory.length === 0) {
          showLanding();
          scrollToBottom();
        } else {
          minimizePromptBuilder();
        }
      });
    }
    if (headerLogo) {
      headerLogo.addEventListener('click', () => {
        if (isStreaming) return;
        const startRect = headerLogo.getBoundingClientRect();
        showLanding();
        scrollToBottom();
        animateHeaderLogoToLandingIcon(startRect);
      });
    }
    if (welcomeUsagePill) {
      welcomeUsagePill.addEventListener('click', () => {
        showWelcomeModal('pill'); // Opened from usage pill button
      });
    }

    // New Chat Button - goes back to model selection
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        if (isStreaming) return;
        startNewSession();
        renderChatHistory();
        renderHistoryList();
        clearPromptFormFields();
        expandPromptBuilder();
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

    // Usage Confirmation Modal (for limited users before each prompt)
    if (usageConfirmationCancelBtn) {
      usageConfirmationCancelBtn.addEventListener('click', hideUsageConfirmationModal);
    }
    if (usageConfirmationConfirmBtn) {
      usageConfirmationConfirmBtn.addEventListener('click', () => {
        // Set confirmation flag and hide modal
        window._usageConfirmed = true;
        hideUsageConfirmationModal();
        // Call sendPrompt again, which will now proceed with the actual send
        sendPrompt();
      });
    }
    if (usageConfirmationModal) {
      usageConfirmationModal.querySelector('.modal-overlay')?.addEventListener('click', hideUsageConfirmationModal);
    }

    // File Upload Event Listeners
    setupFileUploadListeners();

    // Skills Event Listeners
    setupSkillsListeners();

    // Generate Skill Modal Event Listeners
    setupGenerateSkillListeners();

    // Skills Tab Event Listeners
    setupSkillsTabListeners();

    // Skills Filters Event Listeners
    setupSkillsFilterListeners();

    // Skills Export/Import Actions
    setupSkillsActionsListeners();

    // Edit Skill Modal Event Listeners
    setupEditSkillListeners();
  }

  // ============================================
  // File Upload Functions
  // ============================================

  function setupFileUploadListeners() {
    if (!fileUploadZone || !fileInput) return;

    // Click to select files
    fileUploadZone.addEventListener('click', () => {
      fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      handleFileSelection(e.target.files);
      fileInput.value = ''; // Reset to allow selecting same file again
    });

    // Drag and drop
    fileUploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileUploadZone.classList.add('drag-over');
    });

    fileUploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileUploadZone.classList.remove('drag-over');
    });

    fileUploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileUploadZone.classList.remove('drag-over');
      handleFileSelection(e.dataTransfer.files);
    });

    // Clipboard paste support for images
    document.addEventListener('paste', async (e) => {
      // Only handle paste when not typing in a text field (except the context textarea which allows paste)
      const target = e.target;
      const isInPromptBuilder = target.closest('.prompt-builder');
      const isTextInput = target.tagName === 'INPUT' ||
        (target.tagName === 'TEXTAREA' && target.id !== 'context-input');

      if (isTextInput && !isInPromptBuilder) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            // Generate a name for pasted images
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const ext = file.type.split('/')[1] || 'png';
            Object.defineProperty(file, 'name', {
              writable: true,
              value: `pasted-image-${timestamp}.${ext}`
            });
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFileSelection(imageFiles);
      }
    });

    // Keyboard accessibility - make file zone focusable and respond to Enter/Space
    fileUploadZone.setAttribute('tabindex', '0');
    fileUploadZone.setAttribute('role', 'button');
    fileUploadZone.setAttribute('aria-label', window.i18n ? window.i18n.t('fileUpload.dropzone') : 'Drop files here, or click to select');

    fileUploadZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
  }

  async function handleFileSelection(files) {
    if (!files || files.length === 0) return;

    // Show loading state
    if (fileUploadZone) {
      fileUploadZone.classList.add('loading');
    }

    // Documents work with all models; image support is ChatGPT-only formats
    const supportedImageTypes = SUPPORTED_TYPES.images;
    const supportedTypes = [...supportedImageTypes, ...Object.values(DOCUMENT_TYPES)];

    for (const file of files) {
      // Check if max files reached
      if (uploadedFiles.length >= MAX_FILES) {
        const msg = window.i18n ? window.i18n.t('fileUpload.maxFilesReached') : `最多只能上传 ${MAX_FILES} 个文件`;
        alert(msg);
        break;
      }

      // Detect MIME type - handle common extensions for better compatibility
      let mimeType = file.type;
      if (!mimeType || mimeType === 'application/octet-stream') {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext === 'txt') mimeType = 'text/plain';
        else if (ext === 'md' || ext === 'markdown') mimeType = 'text/markdown';
        else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === 'pdf') mimeType = 'application/pdf';
      }

      // Validate file type
      if (!supportedTypes.includes(mimeType)) {
        const msg = window.i18n
          ? window.i18n.t('fileUpload.unsupportedType', { type: mimeType })
          : `不支持的文件类型: ${mimeType}`;
        alert(msg);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const msg = window.i18n
          ? window.i18n.t('fileUpload.fileTooLarge', { name: file.name })
          : `文件过大: ${file.name} (最大 20MB)`;
        alert(msg);
        continue;
      }

      // Process file based on type
      try {
        // Reset progress bar
        if (fileProgressBar) fileProgressBar.style.width = '0%';
        if (fileProgressText) fileProgressText.textContent = '0%';

        let fileObj;
        const isDocument = isDocumentType(mimeType);

        if (isDocument) {
          // Extract text from documents
          if (fileProgressText) fileProgressText.textContent = window.i18n ? window.i18n.t('fileUpload.extracting') : '提取中...';

          const { extractedText, truncated, isEmpty } = await extractDocumentText(file, mimeType);

          if (isEmpty) {
            const msg = window.i18n
              ? window.i18n.t('fileUpload.emptyDocument', { name: file.name })
              : `文档内容为空或无法提取文本: ${file.name}`;
            alert(msg);
            continue;
          }

          if (truncated) {
            const msg = window.i18n
              ? window.i18n.t('fileUpload.textTruncated', { name: file.name })
              : `文档 ${file.name} 内容过长，已截断至 ${MAX_EXTRACTED_TEXT_LENGTH} 字符`;
            alert(msg);
          }

          fileObj = {
            file: file,
            name: file.name,
            mimeType: mimeType,
            data: null, // No base64 for documents - we use extracted text
            extractedText: extractedText,
            isDocument: true,
            previewUrl: null
          };
        } else {
          // Process images as before
          let processedFile = file;
          if (mimeType.startsWith('image/')) {
            processedFile = await compressImage(file);
          }

          const base64Data = await fileToBase64(processedFile, (percent) => {
            if (fileProgressBar) fileProgressBar.style.width = `${percent}%`;
            if (fileProgressText) fileProgressText.textContent = `${percent}%`;
          });

          fileObj = {
            file: processedFile,
            name: file.name,
            mimeType: processedFile.type,
            data: base64Data,
            extractedText: null,
            isDocument: false,
            previewUrl: processedFile.type.startsWith('image/') ? URL.createObjectURL(processedFile) : null
          };
        }

        uploadedFiles.push(fileObj);
      } catch (err) {
        console.error('Failed to process file:', err);
        const msg = window.i18n
          ? window.i18n.t('fileUpload.processingError', { name: file.name })
          : `处理文件失败: ${file.name}`;
        alert(msg);
      }
    }

    // Hide loading state and reset progress
    if (fileUploadZone) {
      fileUploadZone.classList.remove('loading');
    }
    if (fileProgressBar) fileProgressBar.style.width = '0%';
    if (fileProgressText) fileProgressText.textContent = '0%';

    renderFilePreviewList();
    updateFileCount();
  }

  function fileToBase64(file, onProgress) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Extract base64 data (remove data:mime/type;base64, prefix)
        const base64 = reader.result.split(',')[1];
        if (onProgress) onProgress(100);
        resolve(base64);
      };
      reader.onerror = reject;
      reader.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Compress large images to reduce payload size
  const IMAGE_COMPRESS_THRESHOLD = 2 * 1024 * 1024; // 2MB
  const MAX_IMAGE_DIMENSION = 2048; // Max width or height

  async function compressImage(file) {
    // Only compress if image is larger than threshold
    if (file.size <= IMAGE_COMPRESS_THRESHOLD) {
      return file;
    }

    // Only compress supported image types (not HEIC/HEIF)
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      return file;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Calculate new dimensions
        let { width, height } = img;
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = file.type === 'image/png' ? undefined : 0.85;

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file); // Fallback to original if compression fails
            return;
          }

          // Create new file with compressed data
          const compressedFile = new File([blob], file.name, {
            type: outputType,
            lastModified: file.lastModified
          });

          // Only use compressed if it's actually smaller
          if (compressedFile.size < file.size) {
            console.log(`Compressed ${file.name}: ${Math.round(file.size / 1024)}KB → ${Math.round(compressedFile.size / 1024)}KB`);
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, outputType, quality);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file); // Fallback to original on error
      };

      img.src = url;
    });
  }

  // ============================================
  // Document Text Extraction Functions
  // ============================================

  /**
   * Check if a file is a document type that needs text extraction
   */
  function isDocumentType(mimeType) {
    return Object.values(DOCUMENT_TYPES).includes(mimeType);
  }

  /**
   * Extract text from a PDF file using pdf.js
   */
  async function extractTextFromPDF(arrayBuffer) {
    try {
      // Lazy load pdf.js
      if (!window.pdfjsLib) {
        await window.loadPdfJs();
      }

      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText.trim();
    } catch (err) {
      console.error('PDF text extraction failed:', err);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from a DOCX file using mammoth.js
   */
  async function extractTextFromDOCX(arrayBuffer) {
    try {
      if (!window.mammoth) {
        throw new Error('Mammoth.js not loaded');
      }

      const result = await window.mammoth.extractRawText({ arrayBuffer });
      return result.value.trim();
    } catch (err) {
      console.error('DOCX text extraction failed:', err);
      throw new Error('Failed to extract text from DOCX');
    }
  }

  /**
   * Extract text from plain text files (.txt, .md)
   */
  async function extractTextFromPlainText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Main dispatcher for document text extraction
   * Returns { extractedText, truncated }
   */
  async function extractDocumentText(file, mimeType) {
    let text = '';

    try {
      if (mimeType === DOCUMENT_TYPES.pdf) {
        const arrayBuffer = await file.arrayBuffer();
        text = await extractTextFromPDF(arrayBuffer);
      } else if (mimeType === DOCUMENT_TYPES.docx) {
        const arrayBuffer = await file.arrayBuffer();
        text = await extractTextFromDOCX(arrayBuffer);
      } else if (mimeType === DOCUMENT_TYPES.txt || mimeType === DOCUMENT_TYPES.md) {
        text = await extractTextFromPlainText(file);
      } else {
        throw new Error('Unsupported document type');
      }

      // Check for empty text (e.g., scanned PDF)
      if (!text || text.trim().length === 0) {
        return { extractedText: '', truncated: false, isEmpty: true };
      }

      // Truncate if too long
      const truncated = text.length > MAX_EXTRACTED_TEXT_LENGTH;
      if (truncated) {
        text = text.substring(0, MAX_EXTRACTED_TEXT_LENGTH) + '\n\n[... Text truncated due to length ...]';
      }

      return { extractedText: text, truncated, isEmpty: false };
    } catch (err) {
      console.error('Document extraction error:', err);
      throw err;
    }
  }

  function renderFilePreviewList() {
    if (!filePreviewList) return;

    filePreviewList.innerHTML = '';

    uploadedFiles.forEach((fileObj, index) => {
      const item = document.createElement('div');
      item.className = `file-preview-item ${fileObj.previewUrl ? 'image-preview' : ''} ${fileObj.isDocument ? 'document-preview' : ''}`;

      if (fileObj.previewUrl) {
        // Image preview - use safe DOM methods
        const img = document.createElement('img');
        img.src = fileObj.previewUrl;
        img.alt = escapeHtml(fileObj.name);
        img.className = 'file-preview-thumbnail';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'file-preview-name';
        nameSpan.title = fileObj.name;
        nameSpan.textContent = truncateFileName(fileObj.name, 12);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'file-preview-remove';
        removeBtn.dataset.index = index;
        removeBtn.textContent = '×';

        item.appendChild(img);
        item.appendChild(nameSpan);
        item.appendChild(removeBtn);
      } else if (fileObj.isDocument && fileObj.extractedText) {
        // Document preview with text excerpt - use safe DOM methods
        const iconDiv = document.createElement('div');
        iconDiv.className = 'file-preview-icon';
        iconDiv.innerHTML = getFileIcon(fileObj.mimeType); // SVG is safe

        const infoDiv = document.createElement('div');
        infoDiv.className = 'file-preview-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'file-preview-name';
        nameSpan.title = fileObj.name;
        nameSpan.textContent = truncateFileName(fileObj.name, 15);

        const textPreview = fileObj.extractedText.substring(0, 100).replace(/\n/g, ' ').trim();
        const excerptSpan = document.createElement('span');
        excerptSpan.className = 'file-preview-excerpt';
        excerptSpan.title = textPreview + '...';
        excerptSpan.textContent = textPreview.substring(0, 50) + '...';

        const charCount = fileObj.extractedText.length.toLocaleString();
        const charsSpan = document.createElement('span');
        charsSpan.className = 'file-preview-chars';
        charsSpan.textContent = `${charCount} ${window.i18n ? window.i18n.t('fileUpload.chars') : '字符'}`;

        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(excerptSpan);
        infoDiv.appendChild(charsSpan);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'file-preview-remove';
        removeBtn.dataset.index = index;
        removeBtn.textContent = '×';

        item.appendChild(iconDiv);
        item.appendChild(infoDiv);
        item.appendChild(removeBtn);
      } else {
        // Generic file preview - use safe DOM methods
        const iconDiv = document.createElement('div');
        iconDiv.className = 'file-preview-icon';
        iconDiv.innerHTML = getFileIcon(fileObj.mimeType); // SVG is safe

        const infoDiv = document.createElement('div');
        infoDiv.className = 'file-preview-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'file-preview-name';
        nameSpan.title = fileObj.name;
        nameSpan.textContent = truncateFileName(fileObj.name, 15);

        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'file-preview-size';
        sizeSpan.textContent = formatFileSize(fileObj.file.size);

        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(sizeSpan);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'file-preview-remove';
        removeBtn.dataset.index = index;
        removeBtn.textContent = '×';

        item.appendChild(iconDiv);
        item.appendChild(infoDiv);
        item.appendChild(removeBtn);
      }

      filePreviewList.appendChild(item);

      // Add remove button listener
      const removeBtn = item.querySelector('.file-preview-remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFile(index);
      });
    });
  }

  function removeFile(index) {
    const fileObj = uploadedFiles[index];
    if (fileObj.previewUrl) {
      URL.revokeObjectURL(fileObj.previewUrl);
    }
    uploadedFiles.splice(index, 1);
    renderFilePreviewList();
    updateFileCount();
  }

  function updateFileCount() {
    if (!fileCountDisplay) return;

    fileCountDisplay.textContent = `${uploadedFiles.length}/${MAX_FILES}`;

    // Update styling based on count
    fileCountDisplay.classList.remove('file-count-warning', 'file-count-full');
    if (uploadedFiles.length >= MAX_FILES) {
      fileCountDisplay.classList.add('file-count-full');
    } else if (uploadedFiles.length >= MAX_FILES - 1) {
      fileCountDisplay.classList.add('file-count-warning');
    }
  }

  function checkFileCompatibility() {
    // Single-model setup: keep compatibility marker cleanup only.
    if (filePreviewList) {
      Array.from(filePreviewList.children).forEach(item => {
        item.classList.remove('incompatible');
      });
    }
  }

  function clearUploadedFiles() {
    uploadedFiles.forEach(fileObj => {
      if (fileObj.previewUrl) {
        URL.revokeObjectURL(fileObj.previewUrl);
      }
    });
    uploadedFiles = [];
    renderFilePreviewList();
    updateFileCount();
  }

  function truncateFileName(name, maxLength) {
    if (name.length <= maxLength) return name;
    const ext = name.split('.').pop();
    const nameWithoutExt = name.substring(0, name.length - ext.length - 1);
    const truncated = nameWithoutExt.substring(0, maxLength - ext.length - 4) + '...' + ext;
    return truncated;
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getFileIcon(mimeType) {
    if (mimeType === 'application/pdf') {
      // PDF icon (red tinted)
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><text x="7" y="18" font-size="6" fill="#e53935" stroke="none">PDF</text></svg>';
    }
    if (mimeType === 'text/plain') {
      // TXT icon
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#607d8b" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></svg>';
    }
    if (mimeType === 'text/markdown') {
      // Markdown icon
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5c6bc0" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><text x="6" y="18" font-size="5" fill="#5c6bc0" stroke="none">MD</text></svg>';
    }
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // DOCX icon (blue tinted like Word)
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1976d2" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><text x="5" y="18" font-size="5" fill="#1976d2" stroke="none">DOC</text></svg>';
    }
    // Default file icon
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>';
  }

  // ============================================
  // Skills Management Functions
  // ============================================

  function setupSkillsListeners() {
    // Open skills modal
    if (skillsBtn) {
      skillsBtn.addEventListener('click', showSkillsModal);
    }

    // Close skills modal
    if (closeSkillsModalBtn) {
      closeSkillsModalBtn.addEventListener('click', hideSkillsModal);
    }
    if (closeSkillsBtn) {
      closeSkillsBtn.addEventListener('click', hideSkillsModal);
    }
    if (skillsModal) {
      skillsModal.querySelector('.modal-overlay')?.addEventListener('click', hideSkillsModal);
    }
  }

  function showSkillsModal() {
    if (!skillsModal) return;
    skillsModal.style.display = 'flex';

    // Load server skills if not already loaded
    if (!serverSkillsLoaded) {
      loadServerSkills();
    } else {
      renderServerSkillsList();
    }

    // Load categories/tags filters
    if (!skillsFiltersLoaded) {
      loadSkillsFilters();
    } else {
      renderSkillsFilters();
    }

    refreshEnabledServerSkills();
  }

  function hideSkillsModal() {
    if (!skillsModal) return;
    skillsModal.style.display = 'none';
  }

  // Tab switching
  function setupSkillsTabListeners() {
    // Search input
    if (skillsSearchInput) {
      skillsSearchInput.addEventListener('input', debounce(() => {
        renderServerSkillsList(skillsSearchInput.value.trim());
      }, 300));
    }
  }

  function setupSkillsFilterListeners() {
    if (skillsCategoryFilter) {
      skillsCategoryFilter.addEventListener('change', () => {
        renderServerSkillsList(skillsSearchInput?.value.trim() || '');
      });
    }
    if (skillsTagFilter) {
      skillsTagFilter.addEventListener('change', () => {
        renderServerSkillsList(skillsSearchInput?.value.trim() || '');
      });
    }
    if (clearSkillsFiltersBtn) {
      clearSkillsFiltersBtn.addEventListener('click', () => {
        if (skillsSearchInput) {
          skillsSearchInput.value = '';
        }
        if (skillsCategoryFilter) {
          skillsCategoryFilter.value = '';
        }
        if (skillsTagFilter) {
          skillsTagFilter.value = '';
        }
        renderServerSkillsList('');
      });
    }
  }

  function setupSkillsActionsListeners() {
    if (exportAllSkillsBtn) {
      exportAllSkillsBtn.addEventListener('click', () => {
        exportSkills(false);
      });
    }

    if (exportEnabledSkillsBtn) {
      exportEnabledSkillsBtn.addEventListener('click', () => {
        exportSkills(true);
      });
    }
  }

  async function exportSkills(enabledOnly) {
    try {
      if (exportAllSkillsBtn) exportAllSkillsBtn.disabled = true;
      if (exportEnabledSkillsBtn) exportEnabledSkillsBtn.disabled = true;

      const data = await window.API.exportSkills({ enabled: enabledOnly, bundle: true });
      if (typeof data?.content !== 'string') {
        showSkillsStatus(window.i18n ? window.i18n.t('skills.exportError') : 'Export failed', 'error');
        return;
      }

      const filename = data.filename || 'skills_export.md';
      downloadTextFile(filename, data.content);
      showSkillsStatus(window.i18n ? window.i18n.t('skills.exportSuccess') : 'Export ready', 'success');
    } catch (err) {
      console.error('Export skills error:', err);
      showSkillsStatus(err.message || (window.i18n ? window.i18n.t('skills.exportError') : 'Export failed'), 'error');
    } finally {
      if (exportAllSkillsBtn) exportAllSkillsBtn.disabled = false;
      if (exportEnabledSkillsBtn) exportEnabledSkillsBtn.disabled = false;
    }
  }

  function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function loadSkillsFilters() {
    if (!skillsCategoryFilter && !skillsTagFilter && !skillsTagsDatalist) return;

    try {
      const [categoriesData, tagsData] = await Promise.all([
        window.API.getCategories(),
        window.API.getTags()
      ]);

      const categoryNames = categoriesData?.all_category_names || categoriesData?.categories?.map(c => c.name) || [];
      skillsCategories = categoryNames.filter(Boolean).sort((a, b) => a.localeCompare(b));
      skillsTags = (tagsData?.tags || []).filter(Boolean).sort((a, b) => a.localeCompare(b));
      skillsFiltersLoaded = true;

      renderSkillsFilters();
      updateTagsDatalist();
      renderServerSkillsList(skillsSearchInput?.value.trim() || '');
    } catch (err) {
      console.error('Failed to load skills filters:', err);
    }
  }

  function showSkillsStatus(message, type = 'success') {
    if (!skillsStatus) return;
    skillsStatus.textContent = message;
    skillsStatus.classList.remove('success', 'error');
    skillsStatus.classList.add(type);
    skillsStatus.style.display = 'block';

    if (skillsStatusTimeout) {
      clearTimeout(skillsStatusTimeout);
    }
    skillsStatusTimeout = setTimeout(() => {
      if (!skillsStatus) return;
      skillsStatus.style.display = 'none';
    }, 5000);
  }

  function renderSkillsFilters() {
    if (skillsCategoryFilter) {
      const selectedCategory = skillsCategoryFilter.value;
      const allCategoriesLabel = window.i18n ? window.i18n.t('skills.filters.allCategories') : 'All categories';
      const categoryOptions = [
        `<option value="">${allCategoriesLabel}</option>`,
        ...skillsCategories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
      ];
      skillsCategoryFilter.innerHTML = categoryOptions.join('');
      if (selectedCategory && skillsCategories.includes(selectedCategory)) {
        skillsCategoryFilter.value = selectedCategory;
      }
    }

    if (skillsTagFilter) {
      const selectedTag = skillsTagFilter.value;
      const allTagsLabel = window.i18n ? window.i18n.t('skills.filters.allTags') : 'All tags';
      const tagOptions = [
        `<option value="">${allTagsLabel}</option>`,
        ...skillsTags.map(tag => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`)
      ];
      skillsTagFilter.innerHTML = tagOptions.join('');
      if (selectedTag && skillsTags.includes(selectedTag)) {
        skillsTagFilter.value = selectedTag;
      }
    }
  }

  function updateTagsDatalist() {
    if (!skillsTagsDatalist) return;
    skillsTagsDatalist.innerHTML = skillsTags
      .map(tag => `<option value="${escapeHtml(tag)}"></option>`)
      .join('');
  }

  // Load skills from server
  async function loadServerSkills() {
    if (!skillsServerList) return;

    // Show loading
    skillsServerList.innerHTML = `
      <div class="skills-loading">
        <div class="skills-loading-spinner"></div>
        <span>${window.i18n ? window.i18n.t('skills.loading') : '加载中...'}</span>
      </div>
    `;

    try {
      const data = await window.API.getSkills();
      serverSkills = data.skills || [];
      serverSkillsLoaded = true;
      renderServerSkillsList();
      updateSkillsUI();
      loadSkillsFilters();
      refreshEnabledServerSkills();
    } catch (err) {
      console.error('Failed to load skills:', err);
      skillsServerList.innerHTML = `
        <div class="skills-empty">
          <span>${window.i18n ? window.i18n.t('skills.loadError') : '加载失败，请重试'}</span>
        </div>
      `;
    }
  }

  // Render server skills list
  function renderServerSkillsList(searchQuery = '') {
    if (!skillsServerList) return;

    let filteredSkills = serverSkills;

    const selectedCategory = skillsCategoryFilter?.value || '';
    const selectedTag = skillsTagFilter?.value || '';

    if (selectedCategory) {
      filteredSkills = filteredSkills.filter(skill => skill.category === selectedCategory);
    }

    if (selectedTag) {
      filteredSkills = filteredSkills.filter(skill => skill.tags?.includes(selectedTag));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredSkills = filteredSkills.filter(skill =>
        skill.name.toLowerCase().includes(query) ||
        skill.description?.toLowerCase().includes(query) ||
        skill.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filteredSkills.length === 0) {
      const hasFilters = !!searchQuery || !!selectedCategory || !!selectedTag;
      const emptyText = hasFilters
        ? (window.i18n ? window.i18n.t('skills.noResults') : '没有找到匹配的技能')
        : (window.i18n ? window.i18n.t('skills.emptyServer') : '还没有保存的技能');
      skillsServerList.innerHTML = `<div class="skills-empty">${emptyText}</div>`;
      return;
    }

    skillsServerList.innerHTML = filteredSkills.map(skill => `
      <div class="skill-server-item ${skill.enabled ? '' : 'disabled'}" data-skill-id="${skill.id}">
        <label class="skill-server-toggle skill-toggle">
          <input type="checkbox" ${skill.enabled ? 'checked' : ''}>
          <span class="skill-toggle-slider"></span>
        </label>
        <div class="skill-server-content">
          <div class="skill-server-name">${escapeHtml(skill.name)}</div>
          <div class="skill-server-description">${escapeHtml(skill.description || '')}</div>
          ${skill.category || (skill.tags && skill.tags.length > 0) ? `
            <div class="skill-server-meta">
              ${skill.category ? `<span class="skill-server-category">${escapeHtml(skill.category)}</span>` : ''}
              ${skill.tags?.slice(0, 3).map(tag => `<span class="skill-server-tag">${escapeHtml(tag)}</span>`).join('') || ''}
            </div>
          ` : ''}
        </div>
        <div class="skill-server-actions">
          <button type="button" class="btn-edit" title="${window.i18n ? window.i18n.t('skills.edit.title') : '编辑'}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button type="button" class="btn-delete" title="${window.i18n ? window.i18n.t('skills.delete') : '删除'}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    // Add event listeners
    skillsServerList.querySelectorAll('.skill-server-item').forEach(item => {
      const skillId = item.dataset.skillId;

      // Toggle
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.addEventListener('change', () => toggleServerSkill(skillId));
      }

      // Edit
      const editBtn = item.querySelector('.btn-edit');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditSkillModal(skillId);
        });
      }

      // Delete
      const deleteBtn = item.querySelector('.btn-delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteServerSkill(skillId);
        });
      }
    });

    updateSkillsTokenWarning();
  }

  // Toggle server skill enabled status
  async function toggleServerSkill(skillId) {
    try {
      const result = await window.API.toggleSkill(skillId);
      // Update local state
      const skill = serverSkills.find(s => s.id === skillId);
      if (skill) {
        skill.enabled = result.enabled;
      }
      updateSkillsUI();
      refreshEnabledServerSkills();
    } catch (err) {
      console.error('Failed to toggle skill:', err);
      // Revert checkbox
      renderServerSkillsList();
    }
  }

  // Delete server skill
  async function deleteServerSkill(skillId) {
    const msg = window.i18n ? window.i18n.t('skills.deleteConfirm') : '确定要删除这个技能吗？';
    if (!confirm(msg)) return;

    try {
      await window.API.deleteSkill(skillId);
      // Remove from local state
      serverSkills = serverSkills.filter(s => s.id !== skillId);
      renderServerSkillsList();
      updateSkillsUI();
      loadSkillsFilters();
      refreshEnabledServerSkills();
    } catch (err) {
      console.error('Failed to delete skill:', err);
      alert(err.message || 'Failed to delete skill');
    }
  }

  // Open edit skill modal
  async function openEditSkillModal(skillId) {
    if (!editSkillModal) return;

    try {
      // Fetch full skill data
      const data = await window.API.getSkill(skillId);
      const skill = data.skill;

      // Populate form
      editSkillId.value = skill.id;
      editSkillName.value = skill.name || '';
      editSkillDescription.value = skill.description || '';
      editSkillCategory.value = skill.category || '';
      editSkillTags.value = skill.tags?.join(', ') || '';
      editSkillContent.value = skill.content || '';

      // Show modal
      editSkillModal.style.display = 'flex';
    } catch (err) {
      console.error('Failed to load skill:', err);
      alert(err.message || 'Failed to load skill');
    }
  }

  function closeEditSkillModal() {
    if (!editSkillModal) return;
    editSkillModal.style.display = 'none';
  }

  async function saveEditedSkill() {
    const skillId = editSkillId?.value;
    if (!skillId) return;

    const name = editSkillName?.value.trim();
    const description = editSkillDescription?.value.trim();
    const category = editSkillCategory?.value.trim() || null;
    const tagsInput = editSkillTags?.value.trim();
    const content = editSkillContent?.value.trim();

    if (!name || !content) {
      alert(window.i18n ? window.i18n.t('skills.generate.validation') : '请填写技能名称和内容');
      return;
    }

    const tags = tagsInput
      ? tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
      : [];

    try {
      saveEditSkillBtn.disabled = true;
      saveEditSkillBtn.textContent = window.i18n ? window.i18n.t('common.saving') : '保存中...';

      await window.API.updateSkill(skillId, {
        name,
        description,
        content,
        category,
        tags
      });

      // Update local state
      const skill = serverSkills.find(s => s.id === skillId);
      if (skill) {
        skill.name = name;
        skill.description = description;
        skill.category = category;
        skill.tags = tags;
      }

      closeEditSkillModal();
      renderServerSkillsList();
      loadSkillsFilters();
      refreshEnabledServerSkills();
    } catch (err) {
      console.error('Failed to save skill:', err);
      alert(err.message || 'Failed to save skill');
    } finally {
      saveEditSkillBtn.disabled = false;
      saveEditSkillBtn.textContent = window.i18n ? window.i18n.t('skills.edit.save') : '保存';
    }
  }

  async function deleteSkillFromEditModal() {
    const skillId = editSkillId?.value;
    if (!skillId) return;

    const msg = window.i18n ? window.i18n.t('skills.deleteConfirm') : '确定要删除这个技能吗？';
    if (!confirm(msg)) return;

    try {
      await window.API.deleteSkill(skillId);
      serverSkills = serverSkills.filter(s => s.id !== skillId);
      closeEditSkillModal();
      renderServerSkillsList();
      updateSkillsUI();
      loadSkillsFilters();
      refreshEnabledServerSkills();
    } catch (err) {
      console.error('Failed to delete skill:', err);
      alert(err.message || 'Failed to delete skill');
    }
  }

  function setupEditSkillListeners() {
    if (closeEditSkillModalBtn) {
      closeEditSkillModalBtn.addEventListener('click', closeEditSkillModal);
    }
    if (cancelEditSkillBtn) {
      cancelEditSkillBtn.addEventListener('click', closeEditSkillModal);
    }
    if (saveEditSkillBtn) {
      saveEditSkillBtn.addEventListener('click', saveEditedSkill);
    }
    if (deleteSkillBtn) {
      deleteSkillBtn.addEventListener('click', deleteSkillFromEditModal);
    }
    if (editSkillModal) {
      editSkillModal.querySelector('.modal-overlay')?.addEventListener('click', closeEditSkillModal);
    }
  }

  async function refreshEnabledServerSkills() {
    try {
      const data = await window.API.getEnabledSkills();
      enabledServerSkills = data.skills || [];
      enabledServerSkillsLoaded = true;
      updateSkillsUI();
      updateSkillsTokenWarning();
    } catch (err) {
      console.error('Failed to fetch enabled skills:', err);
    }
  }

  // Update token warning based on enabled skills content length
  function updateSkillsTokenWarning() {
    if (!skillsTokenWarning) return;

    let totalLength = 0;

    if (enabledServerSkillsLoaded) {
      totalLength += enabledServerSkills.reduce((sum, s) => sum + (s.content?.length || 0), 0);
    } else if (serverSkills.some(s => s.enabled)) {
      // Fallback if server content isn't loaded yet
      const totalEnabled = serverSkills.filter(s => s.enabled).length;
      if (totalEnabled > 3) {
        skillsTokenWarning.style.display = 'flex';
        return;
      }
    }

    if (totalLength > SKILLS_TOKEN_WARNING_THRESHOLD) {
      skillsTokenWarning.style.display = 'flex';
    } else {
      skillsTokenWarning.style.display = 'none';
    }
  }

  // Debounce helper
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function updateSkillsUI() {
    const enabledServerCount = serverSkillsLoaded
      ? serverSkills.filter(s => s.enabled).length
      : enabledServerSkills.length;
    const enabledCount = enabledServerCount;

    // Update badge count
    if (skillsCount) {
      skillsCount.textContent = enabledCount;
    }

    // Update button state
    if (skillsBtn) {
      if (enabledCount > 0) {
        skillsBtn.classList.add('has-active');
      } else {
        skillsBtn.classList.remove('has-active');
      }
    }

    // Update token warning
    updateSkillsTokenWarning();
  }

  /**
   * Build the skills prefix to prepend to prompts
   * Returns empty string if no skills are enabled
   */
  async function buildSkillsPrefix() {
    let enabledServerSkillsForPrompt = [];

    try {
      const data = await window.API.getEnabledSkills();
      enabledServerSkillsForPrompt = data.skills || [];
      enabledServerSkills = enabledServerSkillsForPrompt;
      enabledServerSkillsLoaded = true;
      updateSkillsTokenWarning();
    } catch (err) {
      console.error('Failed to load enabled skills:', err);
    }

    const allEnabledSkills = enabledServerSkillsForPrompt.map(s => ({
      name: s.name,
      content: s.content
    }));

    if (allEnabledSkills.length === 0) return '';

    let prefix = '[SKILLS]\n';
    allEnabledSkills.forEach(skill => {
      prefix += `--- ${skill.name} ---\n${skill.content}\n\n`;
    });

    return prefix;
  }

  // ============================================
  // Generate Skill Functions
  // ============================================

  function addSaveAsSkillButton(messageTextElement, source) {
    // Find the message-bubble parent
    const messageBubble = messageTextElement?.closest('.message-bubble');
    if (!messageBubble) return;

    // Check if button already exists
    if (messageBubble.querySelector('.save-as-skill-btn')) return;

    // Create the button
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'save-as-skill-btn';
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      <span>${window.i18n ? window.i18n.t('skills.buildFromPrompt') : '从本次提示词创建技能'}</span>
    `;

    btn.addEventListener('click', () => {
      openGenerateSkillModal(source);
    });

    messageBubble.appendChild(btn);
  }

  function openGenerateSkillModal(source) {
    if (!generateSkillModal || !source) return;
    currentSkillGenerationSource = source;

    // Reset modal state
    generateSkillLoading.style.display = 'flex';
    generateSkillPreview.style.display = 'none';
    generateSkillError.style.display = 'none';
    saveGeneratedSkillBtn.style.display = 'none';
    retryGenerateSkillBtn.style.display = 'none';

    // Show modal
    generateSkillModal.style.display = 'flex';

    // Generate the skill
    generateSkillFromCurrentPrompt();
  }

  function closeGenerateSkillModal() {
    if (!generateSkillModal) return;
    generateSkillModal.style.display = 'none';
    currentSkillGenerationSource = null;
  }

  async function generateSkillFromCurrentPrompt() {
    if (!currentSkillGenerationSource) {
      showGenerateSkillError(window.i18n ? window.i18n.t('skills.generate.noPrompt') : '没有可用的提示词');
      return;
    }

    try {
      const result = await window.API.generateSkill(currentSkillGenerationSource);

      if (result.success && result.skill) {
        // Show preview
        generatedSkillName.value = result.skill.name || '';
        generatedSkillDescription.value = result.skill.description || '';
        generatedSkillCategory.value = '';
        generatedSkillTags.value = '';
        generatedSkillContent.value = result.skill.content || '';

        generateSkillLoading.style.display = 'none';
        generateSkillPreview.style.display = 'flex';
        saveGeneratedSkillBtn.style.display = 'inline-flex';
      } else {
        showGenerateSkillError(result.error || 'Failed to generate skill');
      }
    } catch (err) {
      console.error('Generate skill error:', err);
      showGenerateSkillError(err.message || 'Failed to generate skill');
    }
  }

  function showGenerateSkillError(message) {
    generateSkillLoading.style.display = 'none';
    generateSkillPreview.style.display = 'none';
    generateSkillError.style.display = 'flex';
    generateSkillErrorText.textContent = message;
    retryGenerateSkillBtn.style.display = 'inline-flex';
    saveGeneratedSkillBtn.style.display = 'none';
  }

  async function saveGeneratedSkill() {
    const name = generatedSkillName?.value.trim();
    const description = generatedSkillDescription?.value.trim();
    const category = generatedSkillCategory?.value.trim() || null;
    const tagsInput = generatedSkillTags?.value.trim();
    const content = generatedSkillContent?.value.trim();

    if (!name || !content) {
      alert(window.i18n ? window.i18n.t('skills.generate.validation') : '请填写技能名称和内容');
      return;
    }

    // Parse tags
    const tags = tagsInput
      ? tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
      : [];

    try {
      saveGeneratedSkillBtn.disabled = true;
      saveGeneratedSkillBtn.textContent = window.i18n ? window.i18n.t('common.saving') : '保存中...';

      await window.API.createSkill({
        name,
        description,
        content,
        category,
        tags,
        enabled: true,
        source_prompt: JSON.stringify(currentSkillGenerationSource)
      });

      // Success
      closeGenerateSkillModal();
      alert(window.i18n ? window.i18n.t('skills.generate.success') : '技能保存成功！');

      // Refresh server skills list and filters
      serverSkillsLoaded = false;
      await loadServerSkills();
    } catch (err) {
      console.error('Save skill error:', err);
      alert(err.message || 'Failed to save skill');
    } finally {
      saveGeneratedSkillBtn.disabled = false;
      saveGeneratedSkillBtn.textContent = window.i18n ? window.i18n.t('skills.generate.save') : '保存技能';
    }
  }

  function setupGenerateSkillListeners() {
    if (closeGenerateSkillModalBtn) {
      closeGenerateSkillModalBtn.addEventListener('click', closeGenerateSkillModal);
    }
    if (cancelGenerateSkillBtn) {
      cancelGenerateSkillBtn.addEventListener('click', closeGenerateSkillModal);
    }
    if (retryGenerateSkillBtn) {
      retryGenerateSkillBtn.addEventListener('click', () => {
        generateSkillLoading.style.display = 'flex';
        generateSkillError.style.display = 'none';
        retryGenerateSkillBtn.style.display = 'none';
        generateSkillFromCurrentPrompt();
      });
    }
    if (saveGeneratedSkillBtn) {
      saveGeneratedSkillBtn.addEventListener('click', saveGeneratedSkill);
    }
    if (generateSkillModal) {
      generateSkillModal.querySelector('.modal-overlay')?.addEventListener('click', closeGenerateSkillModal);
    }
  }

  function updateModelLabel() {
    const model = 'chatgpt';
    // Update label if element exists (removed from UI for cleaner look)
    if (currentModelLabel) {
      currentModelLabel.textContent = modelNames[model] || model;
    }
  }

  // Main send function - builds prompt and sends
  async function sendPrompt() {
    if (isStreaming) return;

    const shouldShowWelcomeModal = hasStartedPromptFlow &&
      !userIsAdmin &&
      !usageInfo.is_unlimited &&
      sessionStorage.getItem('welcomeShown') !== 'true';
    if (shouldShowWelcomeModal) {
      showWelcomeModal();
      return;
    }

    // Check usage limit first
    if (!usageInfo.is_unlimited && usageInfo.remaining <= 0) {
      showExtensionModal();
      return;
    }

    // For limited users: show usage confirmation modal before sending
    // (Skip if already confirmed in this session)
    const isLimitedUser = !usageInfo.is_unlimited && !userIsAdmin;
    const needsConfirmation = isLimitedUser && !window._usageConfirmed;

    if (needsConfirmation) {
      window._usageConfirmed = false; // Reset flag
      showUsageConfirmationModal();
      return; // Wait for user confirmation
    }

    // Reset confirmation flag for next prompt
    window._usageConfirmed = false;

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

    const promptContext = { persona, task, context, format, references };

    // Build structured prompt with skills prefix
    const skillsPrefix = await buildSkillsPrefix();
    let message = skillsPrefix;
    message += `[PERSONA]\n${persona}\n\n[TASK]\n${task}\n\n[CONTEXT]\n${context}`;
    if (format) {
      message += `\n\n[FORMAT]\n${format}`;
    }
    if (references) {
      message += `\n\n[REFERENCES]\n${references}`;
    }

    const model = 'chatgpt';

    // Hide welcome message
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    // Add user message to UI (with file count indicator)
    addMessage('user', message, null, uploadedFiles.length);

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

    // Prepare files for API (if any)
    const files = uploadedFiles.length > 0
      ? uploadedFiles.map(f => ({
        name: f.name,
        mimeType: f.mimeType,
        data: f.data, // base64 for images, null for documents
        extractedText: f.extractedText || null, // Text content for documents
        isDocument: f.isDocument || false
      }))
      : null;

    // Create abort controller
    currentStreamAbortController = new AbortController();

    try {
      await window.API.sendMessage(
        message,
        model,
        apiHistory,
        files,
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

          // Add "Build Skill from this Prompt" button after the response
          if (currentStreamFullResponse.trim().length >= 10) {
            const skillSource = {
              ...promptContext,
              answer: currentStreamFullResponse
            };
            addSaveAsSkillButton(currentStreamingMessage, skillSource);
          }

          // Clear prompt builder after successful send and minimize it
          clearPromptFormFields();
          minimizePromptBuilder();

          isStreaming = false;
          sendPromptBtn.disabled = false;
          currentStreamingMessage = null;
          currentStreamAbortController = null;
          currentStreamFullResponse = '';
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

  function addMessage(role, content, model = null, fileCount = 0) {
    const message = document.createElement('div');
    message.className = `message ${role}`;

    const avatarClass = model === 'chatgpt' ? 'openai' : '';
    const avatarIcon = role === 'user' ? '👤' : modelIcons[model] || defaultAssistantIcon;
    const modelLabel = model ? modelNames[model] : '';

    // Build file attachment indicator for user messages
    let fileIndicator = '';
    if (role === 'user' && fileCount > 0) {
      const fileLabel = window.i18n
        ? window.i18n.t('fileUpload.attachedCount', { count: fileCount })
        : `${fileCount} 个文件`;
      fileIndicator = `
        <div class="message-files-indicator">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
          </svg>
          <span>${fileLabel}</span>
        </div>
      `;
    }

    message.innerHTML = `
      <div class="message-avatar ${avatarClass}">${avatarIcon}</div>
      <div class="message-content">
        <div class="message-bubble">
          ${fileIndicator}
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
    if (fileCount > 0) historyEntry.fileCount = fileCount;
    chatHistory.push(historyEntry);
    saveChatHistory();

    return message;
  }

  function renderChatHistory() {
    messagesContainer.innerHTML = '';

    if (chatHistory.length === 0) {
      const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;
      const missionTitle = t('home.mission.title');
      const missionDescription1 = t('home.mission.description1');
      const missionDescription2 = t('home.mission.description2');
      const missionStart = t('home.mission.start');
      const missionSkills = t('home.mission.skills');
      const stepPromptTitle = t('home.steps.promptTitle');
      const stepPromptDesc = t('home.steps.promptDesc');
      const stepSkillTitle = t('home.steps.skillTitle');
      const stepSkillDesc = t('home.steps.skillDesc');

      messagesContainer.innerHTML = `
        <div class="welcome-message mission-message">
          <img class="welcome-icon" src="/icons/qiao.png" alt="Qiao">
          <h2>${missionTitle}</h2>
          <p>${missionDescription1}</p>
          <p>${missionDescription2}</p>
          <div class="mission-cta">
            <button id="mission-start-btn" class="btn-primary btn-mission">${missionStart}</button>
            <button id="mission-skills-btn" class="btn-tertiary">${missionSkills}</button>
          </div>
          <div class="mission-steps">
            <div class="mission-step">
              <span class="mission-step-number">1</span>
              <div>
                <h4>${stepPromptTitle}</h4>
                <p>${stepPromptDesc}</p>
              </div>
            </div>
            <div class="mission-step">
              <span class="mission-step-number">2</span>
              <div>
                <h4>${stepSkillTitle}</h4>
                <p>${stepSkillDesc}</p>
              </div>
            </div>
          </div>
        </div>
      `;
      if (appContainer?.classList.contains('prompt-active')) {
        bindLandingActions();
      } else {
        showLanding();
      }
      return;
    }

    // Render each message
    chatHistory.forEach(msg => {
      const message = document.createElement('div');
      message.className = `message ${msg.role}`;

      const model = msg.model;
      const avatarClass = model === 'chatgpt' ? 'openai' : '';
      const avatarIcon = msg.role === 'user' ? '👤' : modelIcons[model] || defaultAssistantIcon;
      const modelLabel = model ? modelNames[model] : '';

      // Build file attachment indicator for user messages
      let fileIndicator = '';
      if (msg.role === 'user' && msg.fileCount > 0) {
        const fileLabel = window.i18n
          ? window.i18n.t('fileUpload.attachedCount', { count: msg.fileCount })
          : `${msg.fileCount} 个文件`;
        fileIndicator = `
          <div class="message-files-indicator">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
            </svg>
            <span>${fileLabel}</span>
          </div>
        `;
      }

      message.innerHTML = `
        <div class="message-avatar ${avatarClass}">${avatarIcon}</div>
        <div class="message-content">
          <div class="message-bubble">
            ${fileIndicator}
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

    if (chatHistory.length > 0) {
      minimizePromptBuilder(); // Show chat with minimized bar
    } else {
      showLanding(); // Landing page for empty sessions
    }
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
    clearUploadedFiles();
  }

  function clearPromptForm() {
    const msg = window.i18n ? window.i18n.t('promptBuilder.clearConfirm') : '确定要清空所有字段吗？';
    if (confirm(msg)) {
      clearPromptFormFields();
      personaInput?.focus();
    }
  }

  function showLanding() {
    if (!appContainer) return;
    appContainer.classList.remove('prompt-active', 'prompt-minimized-state');
    appContainer.classList.add('landing-state');
    updateUsageDisplay();
    bindLandingActions();
  }

  // Prompt builder visibility controls
  function showPromptBuilder() {
    if (!appContainer) return;
    appContainer.classList.add('prompt-active');
    appContainer.classList.remove('prompt-minimized-state', 'landing-state');
    updateUsageDisplay();
    personaInput?.focus();
  }

  function hidePromptBuilder() {
    if (!appContainer) return;
    appContainer.classList.remove('prompt-active');
    appContainer.classList.add('prompt-minimized-state');
    appContainer.classList.remove('landing-state');
    updateUsageDisplay();
  }
  
  function minimizePromptBuilder() {
    if (!appContainer) return;
    appContainer.classList.remove('prompt-active');
    appContainer.classList.add('prompt-minimized-state');
    appContainer.classList.remove('landing-state');
    updateUsageDisplay();
    scrollToBottom();
  }

  function expandPromptBuilder() {
    if (!appContainer) return;
    showPromptBuilder();
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

  function setupWelcomeModalHandlers() {
    if (!welcomeModal) return;

    // Setup acknowledge button
    if (welcomeAckBtn) {
      welcomeAckBtn.addEventListener('click', () => hideWelcomeModal(false), { once: true });
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
      overlay.addEventListener('click', () => hideWelcomeModal(false), { once: true });
    }
  }

  function showWelcomeModal(source = 'auto') {
    if (!welcomeModal) return;

    // Track where modal was opened from
    welcomeModalSource = source;

    // Update the usage count display
    if (welcomeUsageCount) {
      if (usageInfo.is_unlimited) {
        welcomeUsageCount.textContent = '∞';
      } else {
        const used = usageInfo.count ?? 0;
        const limit = usageInfo.limit ?? 0;
        welcomeUsageCount.textContent = `${used}/${limit}`;
      }
    }

    welcomeModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    setupWelcomeModalHandlers();
  }

  function hideWelcomeModal(skipHighlight = false) {
    if (!welcomeModal) return;

    // Mark as shown for this session
    sessionStorage.setItem('welcomeShown', 'true');

    // Get positions for shrink animation
    const modalContent = welcomeModal.querySelector('.welcome-modal-content');
    const modalIcon = welcomeModal.querySelector('.welcome-modal-icon img');

    // Determine animation target based on where modal was opened from
    const animateToTarget = welcomeModalSource === 'pill' ? welcomeUsagePill : headerLogo;
    const canAnimateIcon = !skipHighlight && modalIcon && animateToTarget && modalContent;

    if (canAnimateIcon) {
      if (appContainer && welcomeModalSource !== 'pill') {
        appContainer.classList.add('header-logo-visible');
      }
      welcomeModal.classList.add('fading-out');

      // Choose animation function based on target
      const animateFunc = welcomeModalSource === 'pill'
        ? animateIconToPill
        : animateIconToHeader;

      const didAnimate = animateFunc(modalIcon, () => {
        welcomeModal.style.display = 'none';
        welcomeModal.classList.remove('fading-out');
        document.body.style.overflow = '';
        if (welcomeModalSource === 'pill') {
          updateWelcomeUsagePill(true);
        } else {
          updateWelcomeUsagePill(true);
        }
      });

      if (didAnimate) return;
    }

    // Fallback: just fade out
    welcomeModal.classList.add('fading-out');
    setTimeout(() => {
      welcomeModal.style.display = 'none';
      welcomeModal.classList.remove('fading-out');
      document.body.style.overflow = '';
      updateWelcomeUsagePill(true);
    }, 300);
  }

  // ==========================================
  // Usage Confirmation Modal (for limited users before each prompt)
  // ==========================================

  function showUsageConfirmationModal() {
    if (!usageConfirmationModal) return;

    // Update counts
    const currentRemaining = usageInfo.remaining ?? 0;
    const afterSending = Math.max(0, currentRemaining - 1);

    if (usageConfirmationCount) {
      usageConfirmationCount.textContent = currentRemaining;
    }
    if (usageConfirmationAfterCount) {
      usageConfirmationAfterCount.textContent = afterSending;
    }

    // Show modal
    usageConfirmationModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function hideUsageConfirmationModal() {
    if (!usageConfirmationModal) return;
    usageConfirmationModal.style.display = 'none';
    document.body.style.overflow = '';
  }
});
