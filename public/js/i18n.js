/**
 * Internationalization (i18n) Module
 * Supports Chinese (zh-CN) and English (en-US)
 */

const translations = {
  'zh-CN': {
    // App title
    'app.title': '与Qiao对话',
    'app.title.login': '与Qiao对话 - 登录',
    'app.tagline': '多模型 AI 对话界面',
    
    // Header
    'header.admin': '管理面板',
    'header.clearChat': '清空对话',
    'header.logout': '退出登录',
    'header.language': '语言',
    
    // Welcome message
    'welcome.title': '欢迎使用与Qiao对话',
    'welcome.subtitle': '选择一个模型开始对话，您可以随时切换模型。',
    'welcome.gpt.desc': '最强大的推理和编码能力',
    'welcome.gemini.desc': '快速高效的多模态响应',
    
    // Chat input
    'chat.placeholder': '输入您的消息...',
    'chat.currentModel': '当前模型：',
    
    // Prompt Builder
    'promptBuilder.title': '提示词构建器',
    'promptBuilder.toggle': '提示词构建器',
    'promptBuilder.clear': '清空',
    'promptBuilder.generate': '生成提示词',
    'promptBuilder.optional': '（可选）',
    
    // Prompt Builder Fields
    'promptBuilder.persona.hint': '定义AI的角色和专业领域',
    'promptBuilder.persona.placeholder': '例如：你是一位拥有10年全栈开发经验的资深软件工程师，精通React、Node.js和云架构设计。',
    'promptBuilder.task.hint': '描述您需要完成的具体任务',
    'promptBuilder.task.placeholder': '例如：我需要你帮我设计一个支持深色模式的响应式导航组件，要求代码简洁、可复用。',
    'promptBuilder.context.hint': '提供背景信息和目标受众',
    'promptBuilder.context.placeholder': '例如：背景：这是一个使用React和Tailwind CSS的现代Web应用。\n受众：负责维护代码的前端开发者。',
    'promptBuilder.format.hint': '指定输出格式、长度和风格（可选）',
    'promptBuilder.format.placeholder': '例如：输出格式：带注释的代码\n长度：约200行\n风格：专业且清晰',
    'promptBuilder.references.hint': '提供参考示例或期望的风格（可选）',
    'promptBuilder.references.placeholder': '例如：以下是我期望的效果示例：\n[粘贴示例代码或描述期望的风格]',
    
    // Validation
    'promptBuilder.validation': '请填写所有必填字段：[PERSONA]、[TASK] 和 [CONTEXT]',
    'promptBuilder.clearConfirm': '确定要清空所有字段吗？',
    
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
    'login.footer': '仅限邀请访问 • 由 GPT 和 Gemini 驱动',
    
    // Confirmations
    'confirm.logout': '确定要退出登录吗？',
    'confirm.clearChat': '确定要清空所有消息吗？',
    
    // Errors
    'error.prefix': '错误：',
  },
  
  'en-US': {
    // App title
    'app.title': 'Talk to Qiao',
    'app.title.login': 'Talk to Qiao - Login',
    'app.tagline': 'Multi-model AI Chat Interface',
    
    // Header
    'header.admin': 'Admin Panel',
    'header.clearChat': 'Clear Chat',
    'header.logout': 'Logout',
    'header.language': 'Language',
    
    // Welcome message
    'welcome.title': 'Welcome to Talk to Qiao',
    'welcome.subtitle': 'Select a model to start chatting. You can switch models anytime.',
    'welcome.gpt.desc': 'Most powerful reasoning and coding',
    'welcome.gemini.desc': 'Fast and efficient multimodal responses',
    
    // Chat input
    'chat.placeholder': 'Type your message...',
    'chat.currentModel': 'Current model: ',
    
    // Prompt Builder
    'promptBuilder.title': 'Prompt Builder',
    'promptBuilder.toggle': 'Prompt Builder',
    'promptBuilder.clear': 'Clear',
    'promptBuilder.generate': 'Generate Prompt',
    'promptBuilder.optional': '(optional)',
    
    // Prompt Builder Fields
    'promptBuilder.persona.hint': 'Define the AI\'s role and expertise',
    'promptBuilder.persona.placeholder': 'E.g., You are a senior software engineer with 10 years of full-stack development experience, proficient in React, Node.js, and cloud architecture.',
    'promptBuilder.task.hint': 'Describe the specific task you need completed',
    'promptBuilder.task.placeholder': 'E.g., I need you to design a responsive navigation component with dark mode support. The code should be clean and reusable.',
    'promptBuilder.context.hint': 'Provide background info and target audience',
    'promptBuilder.context.placeholder': 'E.g., Background: This is for a modern web app using React and Tailwind CSS.\nAudience: Frontend developers who will maintain this code.',
    'promptBuilder.format.hint': 'Specify output format, length, and tone (optional)',
    'promptBuilder.format.placeholder': 'E.g., Output format: Code with comments\nLength: ~200 lines\nTone: Professional and clear',
    'promptBuilder.references.hint': 'Provide reference examples or desired style (optional)',
    'promptBuilder.references.placeholder': 'E.g., Here\'s an example of what I\'m looking for:\n[Paste example code or describe desired style]',
    
    // Validation
    'promptBuilder.validation': 'Please fill in all required fields: [PERSONA], [TASK], and [CONTEXT]',
    'promptBuilder.clearConfirm': 'Are you sure you want to clear all fields?',
    
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
    'login.footer': 'Invite-only access • Powered by GPT and Gemini',
    
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
    
    // Update language button display
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
      const langSpan = langBtn.querySelector('span');
      if (langSpan) {
        langSpan.textContent = this.currentLang === 'zh-CN' ? 'EN' : '中';
      }
    }
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

