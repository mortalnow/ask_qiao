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
  
  // Apply Unlimited Button (next to usage counter)
  const applyUnlimitedBtn = document.getElementById('apply-unlimited-btn');

  // Skills Modal Elements
  const skillsBtn = document.getElementById('skills-btn');
  const skillsModal = document.getElementById('skills-modal');
  const closeSkillsModalBtn = document.getElementById('close-skills-modal');
  const closeSkillsBtn = document.getElementById('close-skills-btn');
  const skillsUploadZone = document.getElementById('skills-upload-zone');
  const skillsFileInput = document.getElementById('skills-file-input');
  const skillsList = document.getElementById('skills-list');
  const skillsCount = document.getElementById('skills-count');
  const clearAllSkillsBtn = document.getElementById('clear-all-skills');
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
  let skills = []; // Array of { id, name, description, content, enabled, addedAt }
  const SKILLS_STORAGE_KEY = 'ask_qiao_skills';
  const SKILLS_MIGRATED_KEY = 'ask_qiao_skills_migrated';
  const SKILLS_MIGRATION_ERROR_KEY = 'ask_qiao_skills_migration_error';
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

  // Last sent prompt (for skill generation)
  let lastSentPrompt = null;

  // Skills Tab Elements
  const skillsTabs = document.querySelectorAll('.skills-tab');
  const skillsTabMySkills = document.getElementById('skills-tab-my-skills');
  const skillsTabImport = document.getElementById('skills-tab-import');
  const skillsServerList = document.getElementById('skills-server-list');
  const skillsSearchInput = document.getElementById('skills-search-input');
  const skillsCategoryFilter = document.getElementById('skills-category-filter');
  const skillsTagFilter = document.getElementById('skills-tag-filter');
  const clearSkillsFiltersBtn = document.getElementById('skills-clear-filters');
  const skillsTagsDatalist = document.getElementById('skills-tags-datalist');
  const exportAllSkillsBtn = document.getElementById('skills-export-all');
  const exportEnabledSkillsBtn = document.getElementById('skills-export-enabled');
  const importServerSkillsBtn = document.getElementById('skills-import-server-btn');
  const skillsServerFileInput = document.getElementById('skills-server-file-input');
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

  // Supported file types by model
  const SUPPORTED_TYPES = {
    // Common to both OpenAI and Gemini (images)
    common: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    // Gemini-only image formats
    gemini: ['image/heic', 'image/heif'],
    // All supported types (images + documents)
    all: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
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
    chatgpt: 'GPT-5.2',
    gemini: 'Gemini 3 Flash'
  };

  // Model icons
  const modelIcons = {
    chatgpt: '<img src="/icons/qiao.png" alt="Qiao" class="avatar-img">',
    gemini: '<img src="/icons/qiao.png" alt="Qiao" class="avatar-img">'
  };
  const defaultAssistantIcon = '<img src="/icons/qiao.png" alt="Qiao" class="avatar-img">';

  // Track whether we should show welcome modal (check AFTER API call)
  const shouldShowWelcome = !sessionStorage.getItem('welcomeShown');

  // Initialize
  init();

  async function init() {
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
    
    // Now decide whether to show the welcome modal (AFTER we know user type)
    const isLimitedUser = !userIsAdmin && !usageInfo.is_unlimited;
    
    if (shouldShowWelcome && welcomeModal && isLimitedUser) {
      // Only show welcome modal for limited users
      welcomeModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (welcomeUsageCount) {
        welcomeUsageCount.textContent = usageInfo.remaining;
      }
      setupWelcomeModalHandlers();
    } else if (shouldShowWelcome) {
      // Mark as shown for admin/unlimited users without displaying
      sessionStorage.setItem('welcomeShown', 'true');
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

    // If there's chat history, show prompt builder immediately
    if (chatHistory.length > 0) {
      showPromptBuilder();
    }

    // Initialize skills from localStorage
    loadSkills();
    updateSkillsUI();
    migrateLocalSkillsToServer();
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

  // App container for adding/removing prompt-active class
  const appContainer = document.getElementById('app');
  const backToModelsBtn = document.getElementById('back-to-models');

  function setupEventListeners() {
    // Model selection
    modelSelect.addEventListener('change', () => {
      updateModelLabel();
      checkFileCompatibility();
    });

    // Model card clicks (welcome screen) - show prompt builder full page
    document.querySelectorAll('.model-card').forEach(card => {
      card.addEventListener('click', () => {
        const model = card.dataset.model;
        if (model) {
          modelSelect.value = model;
          updateModelLabel();
          showPromptBuilder();
        }
      });
    });

    // Back to models button
    if (backToModelsBtn) {
      backToModelsBtn.addEventListener('click', hidePromptBuilder);
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

    // Prompt Builder - Send button (main action)
    if (sendPromptBtn) {
      sendPromptBtn.addEventListener('click', sendPrompt);
    }
    if (clearPromptFormBtn) {
      clearPromptFormBtn.addEventListener('click', clearPromptForm);
    }
    
    // New Chat Button - goes back to model selection
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        if (isStreaming) return;
        startNewSession();
        renderChatHistory();
        renderHistoryList();
        clearPromptFormFields();
        hidePromptBuilder();
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

    const currentModel = modelSelect.value;
    // Documents work with all models, images have model-specific support
    const supportedImageTypes = currentModel === 'gemini'
      ? [...SUPPORTED_TYPES.common, ...SUPPORTED_TYPES.gemini]
      : SUPPORTED_TYPES.common;
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
        // Check if it's a Gemini-only image format
        const isGeminiOnly = SUPPORTED_TYPES.gemini.includes(mimeType);
        let msg;
        if (isGeminiOnly && currentModel !== 'gemini') {
          msg = window.i18n
            ? window.i18n.t('fileUpload.geminiOnlyFormat', { type: mimeType })
            : `${mimeType} 格式仅 Gemini 模型支持。请切换到 Gemini 或选择其他文件。`;
        } else {
          msg = window.i18n
            ? window.i18n.t('fileUpload.unsupportedType', { type: mimeType })
            : `不支持的文件类型: ${mimeType}`;
        }
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
            console.log(`Compressed ${file.name}: ${Math.round(file.size/1024)}KB → ${Math.round(compressedFile.size/1024)}KB`);
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
    // Check if any uploaded files are Gemini-only image formats when OpenAI is selected
    // Note: Documents (PDF, TXT, MD, DOCX) work with all models via text extraction
    const currentModel = modelSelect.value;

    // First, clear all incompatible markers
    if (filePreviewList) {
      Array.from(filePreviewList.children).forEach(item => {
        item.classList.remove('incompatible');
      });
    }

    // If using Gemini or no files, nothing more to check
    if (currentModel === 'gemini' || uploadedFiles.length === 0) return;

    // Only check for Gemini-only IMAGE formats (HEIC, HEIF)
    // Documents are NOT incompatible since we extract text
    const incompatibleFiles = uploadedFiles.filter(f =>
      SUPPORTED_TYPES.gemini.includes(f.mimeType) && !f.isDocument
    );

    if (incompatibleFiles.length > 0) {
      const fileNames = incompatibleFiles.map(f => f.name).join(', ');
      const msg = window.i18n
        ? window.i18n.t('fileUpload.incompatibleWarning', { files: fileNames })
        : `注意：${fileNames} 仅 Gemini 支持，使用 GPT 时将被忽略。`;
      alert(msg);

      // Mark incompatible files in the UI
      incompatibleFiles.forEach(f => {
        const index = uploadedFiles.indexOf(f);
        const previewItem = filePreviewList?.children[index];
        if (previewItem) {
          previewItem.classList.add('incompatible');
        }
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

    // Skills file upload
    if (skillsUploadZone && skillsFileInput) {
      skillsUploadZone.addEventListener('click', () => {
        skillsFileInput.click();
      });

      skillsFileInput.addEventListener('change', (e) => {
        handleSkillsFileSelection(e.target.files);
        skillsFileInput.value = '';
      });

      // Drag and drop
      skillsUploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        skillsUploadZone.classList.add('drag-over');
      });

      skillsUploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        skillsUploadZone.classList.remove('drag-over');
      });

      skillsUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        skillsUploadZone.classList.remove('drag-over');
        handleSkillsFileSelection(e.dataTransfer.files);
      });

      // Keyboard accessibility
      skillsUploadZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          skillsFileInput.click();
        }
      });
    }

    // Clear all skills
    if (clearAllSkillsBtn) {
      clearAllSkillsBtn.addEventListener('click', () => {
        const msg = window.i18n ? window.i18n.t('skills.clearConfirm') : '确定要删除所有技能吗？';
        if (confirm(msg)) {
          skills = [];
          saveSkills();
          updateSkillsUI();
        }
      });
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

    // Also render local skills for import tab
    renderSkillsList();

    showMigrationStatusIfNeeded();
  }

  function hideSkillsModal() {
    if (!skillsModal) return;
    skillsModal.style.display = 'none';
  }

  // Tab switching
  function setupSkillsTabListeners() {
    skillsTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        switchSkillsTab(tabName);
      });
    });

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

    if (importServerSkillsBtn && skillsServerFileInput) {
      importServerSkillsBtn.addEventListener('click', () => {
        skillsServerFileInput.click();
      });

      skillsServerFileInput.addEventListener('change', async (e) => {
        const files = e.target.files;
        await importSkillsFromFiles(files);
        skillsServerFileInput.value = '';
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

  async function importSkillsFromFiles(fileList) {
    if (!fileList || fileList.length === 0) {
      showSkillsStatus(window.i18n ? window.i18n.t('skills.importEmpty') : 'Select files to import', 'error');
      return;
    }

    const files = Array.from(fileList);
    const invalid = files.find(file => !file.name.endsWith('.md') && !file.name.endsWith('.markdown'));
    if (invalid) {
      const msg = window.i18n ? window.i18n.t('skills.invalidType') : 'Only Markdown files are supported';
      showSkillsStatus(msg, 'error');
      return;
    }

    try {
      if (importServerSkillsBtn) {
        importServerSkillsBtn.disabled = true;
        importServerSkillsBtn.textContent = window.i18n ? window.i18n.t('skills.importing') : 'Importing...';
      }

      const payload = [];
      for (const file of files) {
        const content = await readFileAsText(file);
        payload.push({ name: file.name, content });
      }

      const data = await window.API.importSkills(payload);
      const results = data.results || {};
      const msg = window.i18n
        ? window.i18n.t('skills.importSuccess', {
            created: results.created || 0,
            updated: results.updated || 0,
            skipped: results.skipped || 0
          })
        : `Import complete: ${results.created || 0} created, ${results.updated || 0} updated, ${results.skipped || 0} skipped`;
      showSkillsStatus(msg, 'success');

      serverSkillsLoaded = false;
      skillsFiltersLoaded = false;
      await loadServerSkills();
    } catch (err) {
      console.error('Import skills error:', err);
      showSkillsStatus(err.message || (window.i18n ? window.i18n.t('skills.importError') : 'Import failed'), 'error');
    } finally {
      if (importServerSkillsBtn) {
        importServerSkillsBtn.disabled = false;
        importServerSkillsBtn.textContent = window.i18n ? window.i18n.t('skills.importToServer') : 'Import to Server';
      }
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

  function showMigrationStatusIfNeeded() {
    if (!skillsStatus) return;
    try {
      const raw = localStorage.getItem(SKILLS_MIGRATION_ERROR_KEY);
      if (!raw) return;
      const info = JSON.parse(raw);
      if (!info?.message) return;
      showSkillsStatus(info.message, 'error');
      localStorage.removeItem(SKILLS_MIGRATION_ERROR_KEY);
    } catch (err) {
      console.error('Failed to read migration status:', err);
    }
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

  function switchSkillsTab(tabName) {
    // Update tab buttons
    skillsTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    if (skillsTabMySkills) {
      skillsTabMySkills.style.display = tabName === 'my-skills' ? 'block' : 'none';
      skillsTabMySkills.classList.toggle('active', tabName === 'my-skills');
    }
    if (skillsTabImport) {
      skillsTabImport.style.display = tabName === 'import' ? 'block' : 'none';
      skillsTabImport.classList.toggle('active', tabName === 'import');
    }
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
      updateSkillsTokenWarning();
    } catch (err) {
      console.error('Failed to fetch enabled skills:', err);
    }
  }

  // Update token warning based on enabled skills content length
  function updateSkillsTokenWarning() {
    if (!skillsTokenWarning) return;

    const enabledLocalSkills = skills.filter(s => s.enabled);
    let totalLength = enabledLocalSkills.reduce((sum, s) => sum + (s.content?.length || 0), 0);

    if (enabledServerSkillsLoaded) {
      totalLength += enabledServerSkills.reduce((sum, s) => sum + (s.content?.length || 0), 0);
    } else if (serverSkills.some(s => s.enabled)) {
      // Fallback if server content isn't loaded yet
      const totalEnabled = enabledLocalSkills.length + serverSkills.filter(s => s.enabled).length;
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

  async function handleSkillsFileSelection(files) {
    if (!files || files.length === 0) return;

    for (const file of files) {
      // Validate file type
      if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
        const msg = window.i18n 
          ? window.i18n.t('skills.invalidType') 
          : '只支持 Markdown 文件 (.md)';
        alert(msg);
        continue;
      }

      // Check for duplicates
      const existingSkill = skills.find(s => s.name === file.name.replace(/\.(md|markdown)$/, ''));
      if (existingSkill) {
        const msg = window.i18n 
          ? window.i18n.t('skills.duplicate', { name: existingSkill.name }) 
          : `技能 "${existingSkill.name}" 已存在`;
        alert(msg);
        continue;
      }

      try {
        const content = await readFileAsText(file);
        const parsedSkill = parseSkillFile(content, file.name);
        
        skills.push({
          id: generateSkillId(),
          name: parsedSkill.name,
          description: parsedSkill.description,
          content: parsedSkill.content,
          enabled: true,
          addedAt: Date.now()
        });
      } catch (err) {
        console.error('Failed to read skill file:', err);
        const msg = window.i18n 
          ? window.i18n.t('skills.readError', { name: file.name }) 
          : `读取文件失败: ${file.name}`;
        alert(msg);
      }
    }

    saveSkills();
    updateSkillsUI();
    renderSkillsList();
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function buildMarkdownFromLocalSkill(skill) {
    const name = skill.name || 'Skill';
    const description = skill.description || '';
    return `---\nname: ${name}\ndescription: ${description}\n---\n\n${skill.content || ''}`.trim();
  }

  function computeSkillsFingerprint(skillsList) {
    const normalized = skillsList
      .map(skill => ({
        name: skill.name || '',
        description: skill.description || '',
        content: skill.content || ''
      }))
      .sort((a, b) => {
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
        const descCompare = a.description.localeCompare(b.description);
        if (descCompare !== 0) return descCompare;
        return a.content.localeCompare(b.content);
      });

    const json = JSON.stringify(normalized);
    let hash = 5381;
    for (let i = 0; i < json.length; i += 1) {
      hash = ((hash << 5) + hash) + json.charCodeAt(i);
      hash >>>= 0;
    }
    return `${json.length}-${hash}`;
  }

  function getSkillsMigrationInfo() {
    try {
      const raw = localStorage.getItem(SKILLS_MIGRATED_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed to read migration info:', err);
      return null;
    }
  }

  function setSkillsMigrationInfo(info) {
    try {
      localStorage.setItem(SKILLS_MIGRATED_KEY, JSON.stringify(info));
    } catch (err) {
      console.error('Failed to store migration info:', err);
    }
  }

  async function migrateLocalSkillsToServer() {
    if (!skills.length) return;

    const fingerprint = computeSkillsFingerprint(skills);
    const migrationInfo = getSkillsMigrationInfo();
    if (migrationInfo?.fingerprint === fingerprint) {
      return;
    }

    try {
      const payload = skills.map(skill => ({
        name: `${skill.name || 'skill'}.md`,
        content: buildMarkdownFromLocalSkill(skill)
      }));

      await window.API.importSkills(payload, false);
      serverSkillsLoaded = false;
      skillsFiltersLoaded = false;
      setSkillsMigrationInfo({ count: skills.length, fingerprint, migrated_at: Date.now() });
    } catch (err) {
      console.error('Failed to migrate local skills:', err);
      try {
        const message = window.i18n
          ? window.i18n.t('skills.migrationError')
          : 'Local skills sync failed';
        localStorage.setItem(SKILLS_MIGRATION_ERROR_KEY, JSON.stringify({ message, at: Date.now() }));
      } catch (storageErr) {
        console.error('Failed to store migration error:', storageErr);
      }
    }
  }

  /**
   * Parse a skill markdown file to extract name, description, and content
   * Supports YAML frontmatter and fallbacks to filename/first heading
   */
  function parseSkillFile(content, filename) {
    let name = filename.replace(/\.(md|markdown)$/, '');
    let description = '';
    let skillContent = content;

    // Try to parse YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      skillContent = frontmatterMatch[2].trim();

      // Extract name from frontmatter
      const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
      if (nameMatch) {
        name = nameMatch[1].trim().replace(/^["']|["']$/g, '');
      }

      // Extract description from frontmatter
      const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
      if (descMatch) {
        description = descMatch[1].trim().replace(/^["']|["']$/g, '');
      }
    }

    // If no frontmatter name, try first H1 heading
    if (name === filename.replace(/\.(md|markdown)$/, '')) {
      const h1Match = skillContent.match(/^#\s+(.+)$/m);
      if (h1Match) {
        name = h1Match[1].trim();
      }
    }

    // If no description, use first non-heading paragraph
    if (!description) {
      const paragraphMatch = skillContent.match(/^(?!#)(.+)$/m);
      if (paragraphMatch) {
        description = paragraphMatch[1].trim().substring(0, 150);
        if (paragraphMatch[1].length > 150) {
          description += '...';
        }
      }
    }

    return { name, description, content: skillContent };
  }

  function generateSkillId() {
    return 'skill_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function loadSkills() {
    try {
      const savedSkills = localStorage.getItem(SKILLS_STORAGE_KEY);
      if (savedSkills) {
        skills = JSON.parse(savedSkills);
      }
    } catch (err) {
      console.error('Failed to load skills:', err);
      skills = [];
    }
  }

  function saveSkills() {
    try {
      localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(skills));
    } catch (err) {
      console.error('Failed to save skills:', err);
    }
  }

  function toggleSkill(skillId) {
    const skill = skills.find(s => s.id === skillId);
    if (skill) {
      skill.enabled = !skill.enabled;
      saveSkills();
      updateSkillsUI();
      renderSkillsList();
    }
  }

  function deleteSkill(skillId) {
    const index = skills.findIndex(s => s.id === skillId);
    if (index !== -1) {
      skills.splice(index, 1);
      saveSkills();
      updateSkillsUI();
      renderSkillsList();
    }
  }

  function updateSkillsUI() {
    const enabledLocalCount = skills.filter(s => s.enabled).length;
    const enabledServerCount = serverSkills.filter(s => s.enabled).length;
    const enabledCount = enabledLocalCount + enabledServerCount;
    
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

  function renderSkillsList() {
    if (!skillsList) return;

    if (skills.length === 0) {
      const emptyText = window.i18n ? window.i18n.t('skills.empty') : '暂无上传的技能';
      skillsList.innerHTML = `<div class="skills-empty">${emptyText}</div>`;
      return;
    }

    skillsList.innerHTML = skills.map(skill => `
      <div class="skill-item ${skill.enabled ? 'enabled' : ''}" data-skill-id="${skill.id}">
        <label class="skill-toggle">
          <input type="checkbox" ${skill.enabled ? 'checked' : ''}>
          <span class="skill-toggle-slider"></span>
        </label>
        <div class="skill-content">
          <div class="skill-name">${escapeHtml(skill.name)}</div>
          <div class="skill-description">${escapeHtml(skill.description || '')}</div>
        </div>
        <button type="button" class="skill-delete" title="${window.i18n ? window.i18n.t('skills.delete') : '删除'}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
          </svg>
        </button>
      </div>
    `).join('');

    // Add event listeners
    skillsList.querySelectorAll('.skill-item').forEach(item => {
      const skillId = item.dataset.skillId;
      
      // Toggle checkbox
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.addEventListener('change', () => toggleSkill(skillId));
      }

      // Delete button
      const deleteBtn = item.querySelector('.skill-delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const msg = window.i18n ? window.i18n.t('skills.deleteConfirm') : '确定要删除这个技能吗？';
          if (confirm(msg)) {
            deleteSkill(skillId);
          }
        });
      }
    });

    updateSkillsTokenWarning();
  }

  /**
   * Build the skills prefix to prepend to prompts
   * Returns empty string if no skills are enabled
   */
  async function buildSkillsPrefix() {
    // Combine localStorage skills and server skills
    const enabledLocalSkills = skills.filter(s => s.enabled);
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

    const allEnabledSkills = [
      ...enabledServerSkillsForPrompt.map(s => ({ name: s.name, content: s.content })),
      ...enabledLocalSkills.map(s => ({ name: s.name, content: s.content }))
    ];

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

  function addSaveAsSkillButton(messageTextElement) {
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
      <span>${window.i18n ? window.i18n.t('skills.saveAsSkill') : '保存为技能'}</span>
    `;

    btn.addEventListener('click', () => {
      openGenerateSkillModal();
    });

    messageBubble.appendChild(btn);
  }

  function openGenerateSkillModal() {
    if (!generateSkillModal || !lastSentPrompt) return;

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
  }

  async function generateSkillFromCurrentPrompt() {
    if (!lastSentPrompt) {
      showGenerateSkillError(window.i18n ? window.i18n.t('skills.generate.noPrompt') : '没有可用的提示词');
      return;
    }

    try {
      const result = await window.API.generateSkill(lastSentPrompt);

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
        source_prompt: JSON.stringify(lastSentPrompt)
      });

      // Success
      closeGenerateSkillModal();
      alert(window.i18n ? window.i18n.t('skills.generate.success') : '技能保存成功！');

      // Refresh server skills list and filters
      serverSkillsLoaded = false;
      await loadServerSkills();

      // Clear lastSentPrompt
      lastSentPrompt = null;
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
    const model = modelSelect.value;
    // Update label if element exists (removed from UI for cleaner look)
    if (currentModelLabel) {
      currentModelLabel.textContent = modelNames[model] || model;
    }
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

    // Store prompt for potential skill generation
    lastSentPrompt = { persona, task, context, format, references };

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

    const model = modelSelect.value;

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

          // Add "Save as Skill" button after the response
          if (lastSentPrompt) {
            addSaveAsSkillButton(currentStreamingMessage);
          }

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

  function addMessage(role, content, model = null, fileCount = 0) {
    const message = document.createElement('div');
    message.className = `message ${role}`;

    const avatarClass = model ? (model === 'chatgpt' ? 'openai' : 'google') : '';
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
            showPromptBuilder();
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
    
    // Show prompt builder if session has messages
    if (chatHistory.length > 0) {
      showPromptBuilder();
    } else {
      hidePromptBuilder();
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

  // Show/Hide Full Page Prompt Builder
  function showPromptBuilder() {
    if (!appContainer) return;
    appContainer.classList.remove('prompt-closing');
    appContainer.classList.add('prompt-active');
    // Focus first input after animation
    setTimeout(() => {
      personaInput?.focus();
    }, 500);
  }

  function hidePromptBuilder() {
    if (!appContainer) return;
    // Add closing class for slide-down animation
    appContainer.classList.add('prompt-closing');
    // After animation, remove both classes
    setTimeout(() => {
      appContainer.classList.remove('prompt-active', 'prompt-closing');
    }, 400);
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

  function showWelcomeModal() {
    if (!welcomeModal) return;
    
    // Update the usage count display
    if (welcomeUsageCount) {
      welcomeUsageCount.textContent = usageInfo.is_unlimited ? '∞' : usageInfo.remaining;
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
    const usageCounterRect = usageCounter?.getBoundingClientRect();
    const modalContent = welcomeModal.querySelector('.welcome-modal-content');
    
    // Check if we can animate to the counter
    const counterVisible = usageCounter && 
      usageCounter.offsetParent !== null && 
      headerLeft && 
      headerLeft.offsetParent !== null;
    
    const canAnimateToCounter = !skipHighlight && usageCounterRect && modalContent && counterVisible;

    if (canAnimateToCounter) {
      // Calculate the offset to shrink towards the usage counter
      const modalRect = modalContent.getBoundingClientRect();
      const centerX = modalRect.left + modalRect.width / 2;
      const centerY = modalRect.top + modalRect.height / 2;
      const targetX = usageCounterRect.left + usageCounterRect.width / 2;
      const targetY = usageCounterRect.top + usageCounterRect.height / 2;
      
      // Calculate translation needed (scale factor is 0.15 at end of animation)
      // In CSS, transform: scale(s) translate(x, y) applies translate first, then scale
      // So final_position = original_center + (translate * scale)
      // We need: translate = (target - center) / scale
      const scale = 0.15;
      const translateX = (targetX - centerX) / scale;
      const translateY = (targetY - centerY) / scale;
      
      // Set CSS variables for animation target
      modalContent.style.setProperty('--shrink-x', `${translateX}px`);
      modalContent.style.setProperty('--shrink-y', `${translateY}px`);
      
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
          }, 800);
        }
      }, 600);
    } else {
      // Fallback: just fade out
      welcomeModal.classList.add('fading-out');
      setTimeout(() => {
        welcomeModal.style.display = 'none';
        welcomeModal.classList.remove('fading-out');
        document.body.style.overflow = '';
      }, 300);
    }
  }
});
