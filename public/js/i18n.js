/**
 * Internationalization (i18n) Module
 * Supports Chinese (zh-CN) and English (en-US)
 */

const translations = {
  'zh-CN': {
    // App title
    'app.title': '问Qiao',
    'app.title.login': '问Qiao - 登录',
    'app.tagline': '学习高效AI沟通',
    
    // Header
    'header.admin': '管理面板',
    'header.newChat': '新对话',
    'header.history': '历史记录',
    'header.clearChat': '清空对话',
    'header.logout': '退出登录',
    'header.language': '语言',
    
    // History sidebar
    'history.title': '对话历史',
    'history.empty': '暂无历史对话',
    'history.delete': '删除',
    'history.today': '今天',
    'history.yesterday': '昨天',
    'history.earlier': '更早',
    'history.deleteConfirm': '确定要删除这个对话吗？',
    
    // Welcome message
    'welcome.title': '欢迎使用问Qiao',
    'welcome.subtitle': '选择一个模型开始对话，您可以随时切换模型。',
    'welcome.gpt.desc': '最强大的推理和编码能力',
    'welcome.gemini.desc': '快速高效的多模态响应',
    
    // Welcome modal
    'welcome.modal.title': '欢迎使用问Qiao',
    'welcome.modal.description': '这是一个结构化提问学习平台，通过填写表单与AI对话，学习高效沟通技巧。',
    'welcome.modal.remaining': '剩余提问次数',
    'welcome.modal.gotIt': '我知道了',
    'welcome.modal.applyUnlimited': '申请无限次数',
    
    // Chat input
    'chat.placeholder': '输入您的消息...',
    'chat.currentModel': '当前模型：',
    
    // Prompt Builder
    'promptBuilder.title': '问题构建器',
    'promptBuilder.toggle': '问题构建器',
    'promptBuilder.desc': '填表来问，获得更好的AI回复',
    'promptBuilder.clear': '清空',
    'promptBuilder.generate': '生成提示词',
    'promptBuilder.optional': '（可选）',
    
    // Prompt Builder Fields
    'promptBuilder.persona.hint': '定义AI的角色和专业领域',
    'promptBuilder.persona.placeholder': '例如：你是一位经验丰富的写作助手，擅长帮助用户撰写清晰、有条理的文章。',
    'promptBuilder.task.hint': '描述您需要完成的具体任务',
    'promptBuilder.task.placeholder': '例如：请帮我写一封给客户的感谢邮件，表达对他们支持的感激之情。',
    'promptBuilder.context.hint': '提供背景信息和目标受众',
    'promptBuilder.context.placeholder': '例如：背景：客户刚刚完成了一笔大订单。\n受众：长期合作的商业客户。',
    'promptBuilder.format.hint': '指定输出格式、长度和风格（可选）',
    'promptBuilder.format.placeholder': '例如：输出格式：正式邮件\n长度：200-300字\n风格：专业但友好',
    'promptBuilder.references.hint': '提供参考示例或期望的风格（可选）',
    'promptBuilder.references.placeholder': '例如：参考风格：简洁大方，避免过于正式的措辞',
    
    // Validation
    'promptBuilder.validation': '请填写所有必填字段：[PERSONA]、[TASK] 和 [CONTEXT]',
    'promptBuilder.clearConfirm': '确定要清空所有字段吗？',
    'promptBuilder.send': '发送提问',
    'promptBuilder.subtitle': '通过结构化提问学习与AI高效沟通',
    
    // Usage Counter
    'usage.prompts': '次提问',
    'usage.counter': '已使用',
    'usage.unlimited': '无限制',
    'usage.applyUnlimited': '申请无限次数',
    
    // Extension Requests
    'extension.modalTitle': '申请更多提问次数',
    'extension.limitReached': '您已用完免费提问次数。请填写以下表单申请更多次数。',
    'extension.pendingNotice': '您已有一个待处理的申请，请等待管理员审核。',
    'extension.amountLabel': '申请次数',
    'extension.reasonLabel': '申请理由 *',
    'extension.reasonPlaceholder': '请说明您申请更多次数的原因（至少10个字符）...',
    'extension.reasonHint': '请简要说明您的使用目的和申请原因',
    'extension.submit': '提交申请',
    'extension.submitSuccess': '申请已提交，请等待管理员审核',
    'extension.reasonMinLength': '申请理由至少需要10个字符',
    'extension.statusTitle': '申请状态',
    
    // Common
    'common.cancel': '取消',
    'common.submitting': '提交中...',
    
    // Login page
    'login.tab.login': '登录',
    'login.tab.register': '注册',
    'login.username': '用户名',
    'login.username.placeholder': '输入用户名',
    'login.password': '密码',
    'login.password.placeholder': '••••••••',
    'login.submit': '登录',
    'login.inviteCode': '邀请码',
    'login.inviteCode.placeholder': 'ABC123-XYZ789',
    'login.inviteCode.hint': '格式：XXXXXX-XXXXXX',
    'login.chooseUsername': '选择用户名',
    'login.password.hint': '至少 6 个字符',
    'login.createAccount': '创建账户',
    'login.footer': '由 GPT 和 Gemini 驱动',
    
    // Confirmations
    'confirm.logout': '确定要退出登录吗？',
    'confirm.clearChat': '确定要清空所有消息吗？',
    
    // Errors
    'error.prefix': '错误：',
  },
  
  'en-US': {
    // App title
    'app.title': 'Ask Qiao',
    'app.title.login': 'Ask Qiao - Login',
    'app.tagline': 'Learn Effective AI Communication',
    
    // Header
    'header.admin': 'Admin Panel',
    'header.newChat': 'New Chat',
    'header.history': 'History',
    'header.clearChat': 'Clear Chat',
    'header.logout': 'Logout',
    'header.language': 'Language',
    
    // History sidebar
    'history.title': 'Chat History',
    'history.empty': 'No conversations yet',
    'history.delete': 'Delete',
    'history.today': 'Today',
    'history.yesterday': 'Yesterday',
    'history.earlier': 'Earlier',
    'history.deleteConfirm': 'Are you sure you want to delete this conversation?',
    
    // Welcome message
    'welcome.title': 'Welcome to Ask Qiao',
    'welcome.subtitle': 'Select a model to start chatting. You can switch models anytime.',
    'welcome.gpt.desc': 'Most powerful reasoning and coding',
    'welcome.gemini.desc': 'Fast and efficient multimodal responses',
    
    // Welcome modal
    'welcome.modal.title': 'Welcome to Ask Qiao',
    'welcome.modal.description': 'This is a structured prompt learning platform. Learn effective AI communication by filling out forms to interact with AI.',
    'welcome.modal.remaining': 'Prompts remaining',
    'welcome.modal.gotIt': 'Got it',
    'welcome.modal.applyUnlimited': 'Apply for unlimited',
    
    // Chat input
    'chat.placeholder': 'Type your message...',
    'chat.currentModel': 'Current model: ',
    
    // Prompt Builder
    'promptBuilder.title': 'Prompt Builder',
    'promptBuilder.toggle': 'Prompt Builder',
    'promptBuilder.desc': 'Build structured prompts for better AI responses',
    'promptBuilder.clear': 'Clear',
    'promptBuilder.generate': 'Generate Prompt',
    'promptBuilder.optional': '(optional)',
    
    // Prompt Builder Fields
    'promptBuilder.persona.hint': 'Define the AI\'s role and expertise',
    'promptBuilder.persona.placeholder': 'E.g., You are a helpful writing assistant skilled at crafting clear, well-organized content.',
    'promptBuilder.task.hint': 'Describe the specific task you need completed',
    'promptBuilder.task.placeholder': 'E.g., Please help me write a thank-you email to a customer expressing gratitude for their support.',
    'promptBuilder.context.hint': 'Provide background info and target audience',
    'promptBuilder.context.placeholder': 'E.g., Background: The customer just completed a large order.\nAudience: A long-term business partner.',
    'promptBuilder.format.hint': 'Specify output format, length, and tone (optional)',
    'promptBuilder.format.placeholder': 'E.g., Output format: Formal email\nLength: 200-300 words\nTone: Professional but friendly',
    'promptBuilder.references.hint': 'Provide reference examples or desired style (optional)',
    'promptBuilder.references.placeholder': 'E.g., Style reference: Keep it concise and warm, avoid overly formal language',
    
    // Validation
    'promptBuilder.validation': 'Please fill in all required fields: [PERSONA], [TASK], and [CONTEXT]',
    'promptBuilder.clearConfirm': 'Are you sure you want to clear all fields?',
    'promptBuilder.send': 'Send Prompt',
    'promptBuilder.subtitle': 'Learn effective AI communication through structured prompts',
    
    // Usage Counter
    'usage.prompts': 'prompts',
    'usage.counter': 'Used',
    'usage.unlimited': 'Unlimited',
    'usage.applyUnlimited': 'Apply for unlimited',
    
    // Extension Requests
    'extension.modalTitle': 'Request More Prompts',
    'extension.limitReached': 'You have used all your free prompts. Please fill out the form below to request more.',
    'extension.pendingNotice': 'You already have a pending request. Please wait for admin review.',
    'extension.amountLabel': 'Requested Amount',
    'extension.reasonLabel': 'Reason *',
    'extension.reasonPlaceholder': 'Please explain why you need more prompts (at least 10 characters)...',
    'extension.reasonHint': 'Briefly explain your purpose and reason for requesting more prompts',
    'extension.submit': 'Submit Request',
    'extension.submitSuccess': 'Request submitted successfully. Please wait for admin review.',
    'extension.reasonMinLength': 'Reason must be at least 10 characters',
    'extension.statusTitle': 'Request Status',
    
    // Common
    'common.cancel': 'Cancel',
    'common.submitting': 'Submitting...',
    
    // Login page
    'login.tab.login': 'Login',
    'login.tab.register': 'Register',
    'login.username': 'Username',
    'login.username.placeholder': 'Enter username',
    'login.password': 'Password',
    'login.password.placeholder': '••••••••',
    'login.submit': 'Login',
    'login.inviteCode': 'Invite Code',
    'login.inviteCode.placeholder': 'ABC123-XYZ789',
    'login.inviteCode.hint': 'Format: XXXXXX-XXXXXX',
    'login.chooseUsername': 'Choose Username',
    'login.password.hint': 'At least 6 characters',
    'login.createAccount': 'Create Account',
    'login.footer': 'Powered by GPT and Gemini',
    
    // Confirmations
    'confirm.logout': 'Are you sure you want to logout?',
    'confirm.clearChat': 'Are you sure you want to clear all messages?',
    
    // Errors
    'error.prefix': 'Error: ',
  }
};

// i18n Module
const i18n = {
  currentLang: 'zh-CN',
  
  // Initialize language from localStorage or browser preference
  init() {
    const savedLang = localStorage.getItem('language');
    if (savedLang && translations[savedLang]) {
      this.currentLang = savedLang;
    } else {
      // Detect browser language
      const browserLang = navigator.language || navigator.userLanguage;
      if (browserLang.startsWith('zh')) {
        this.currentLang = 'zh-CN';
      } else {
        this.currentLang = 'en-US';
      }
    }
    this.updatePageLanguage();
    return this.currentLang;
  },
  
  // Get translation by key
  t(key) {
    return translations[this.currentLang][key] || translations['en-US'][key] || key;
  },
  
  // Set language
  setLanguage(lang) {
    if (translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('language', lang);
      this.updatePageLanguage();
      // Update HTML lang attribute
      document.documentElement.lang = lang === 'zh-CN' ? 'zh-CN' : 'en';
    }
  },
  
  // Toggle between languages
  toggleLanguage() {
    const newLang = this.currentLang === 'zh-CN' ? 'en-US' : 'zh-CN';
    this.setLanguage(newLang);
    return newLang;
  },
  
  // Update all elements with data-i18n attribute
  updatePageLanguage() {
    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
    
    // Update titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });
    
    // Update page title
    const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
    if (titleKey) {
      document.title = this.t(titleKey);
    }
    
    // Update language button display (main page and login page)
    const langBtns = [
      document.getElementById('lang-toggle'),
      document.getElementById('lang-toggle-login')
    ];
    
    langBtns.forEach(langBtn => {
      if (langBtn) {
        const langSpan = langBtn.querySelector('span');
        if (langSpan) {
          langSpan.textContent = this.currentLang === 'zh-CN' ? 'EN' : '中';
        }
      }
    });
  },
  
  // Get current language
  getLang() {
    return this.currentLang;
  },
  
  // Get all available languages
  getLanguages() {
    return Object.keys(translations);
  }
};

// Export for use in other modules
window.i18n = i18n;

