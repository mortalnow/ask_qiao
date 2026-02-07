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
    'welcome.subtitle': '通过结构化提示词练习，获取更高质量回答。',
    'welcome.gpt.desc': '最强大的推理和编码能力',

    // Home mission copy
    'home.mission.title': '学会更好地提问，得到更好的答案',
    'home.mission.line1': '这里是一个提示词训练场，帮助您用结构化方式向大模型提问。',
    'home.mission.line2': '先发送提示词，再用 AI 把本次提示词和回答沉淀成可复用的 Markdown 技能。',
    
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
    'promptBuilder.changeModel': '切换模型',
    'promptBuilder.backToModels': '返回选择',
    'promptBuilder.minimized.text': '提问已发送',
    'promptBuilder.minimized.hint': '点击展开继续提问',
    
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
    'extension.amount5': '5 次',
    'extension.amount10': '10 次',
    'extension.amount20': '20 次',
    'extension.amountUnlimited': '无限制',
    'extension.reasonLabel': '申请理由 *',
    'extension.reasonPlaceholder': '请说明您申请更多次数的原因（至少10个字符）...',
    'extension.reasonHint': '请简要说明您的使用目的和申请原因',
    'extension.submit': '提交申请',
    'extension.submitSuccess': '申请已提交，请等待管理员审核',
    'extension.reasonMinLength': '申请理由至少需要10个字符',
    'extension.statusTitle': '申请状态',

    // File Upload
    'fileUpload.dropzone': '拖拽文件到此处，或点击选择',
    'fileUpload.formats': '支持: PNG, JPG, PDF, TXT, MD, DOCX',
    'fileUpload.sizeLimit': '单文件最大 20MB',
    'fileUpload.maxFilesReached': '最多只能上传 5 个文件',
    'fileUpload.unsupportedType': '不支持的文件类型: {type}',
    'fileUpload.fileTooLarge': '文件过大: {name} (最大 20MB)',
    'fileUpload.processingError': '处理文件失败: {name}',
    'fileUpload.incompatibleWarning': '注意：部分文件将被忽略。',
    'fileUpload.attachedCount': '{count} 个文件',
    'fileUpload.pasteHint': '也可以直接粘贴图片',
    'fileUpload.ariaLabel': '拖拽文件到此处，或点击/按回车选择文件',
    'fileUpload.extracting': '提取文本中...',
    'fileUpload.emptyDocument': '文档内容为空或无法提取文本: {name}',
    'fileUpload.textTruncated': '文档 {name} 内容过长，已截断',
    'fileUpload.chars': '字符',

    // Common
    'common.cancel': '取消',
    'common.submitting': '提交中...',
    'common.close': '关闭',

    // Skills
    'skills.title': '技能',
    'skills.button': '技能',
    'skills.buildFromPrompt': '从本次提示词创建技能',
    'skills.modalTitle': '技能管理',
    'skills.info': '先发送提示词，再用 AI 基于提示词与回答生成可复用技能。',
    'skills.uploadPrompt': '技能上传已移除',
    'skills.uploadHint': '请使用“从本次提示词创建技能”',
    'skills.listTitle': '已保存技能',
    'skills.clearAll': '清空全部',
    'skills.empty': '暂无保存的技能',
    'skills.tokenWarning': '选中的技能内容较长，可能影响响应质量',
    'skills.delete': '删除',
    'skills.deleteConfirm': '确定要删除这个技能吗？',
    'skills.clearConfirm': '确定要删除所有技能吗？',
    'skills.invalidType': '只支持 Markdown 文件 (.md)',
    'skills.duplicate': '技能 "{name}" 已存在',
    'skills.readError': '读取文件失败: {name}',
    'skills.saveAsSkill': '保存为技能',
    'skills.generate.title': '保存为技能',
    'skills.generate.analyzing': '正在分析您的提示词，生成可复用技能...',
    'skills.generate.name': '技能名称',
    'skills.generate.description': '简短描述',
    'skills.generate.category': '分类（可选）',
    'skills.generate.tags': '标签（可选，用逗号分隔）',
    'skills.generate.content': '技能内容',
    'skills.generate.save': '保存技能',
    'skills.generate.retry': '重试',
    'skills.generate.error': '生成失败，请重试',
    'skills.generate.noPrompt': '没有可用的提示词',
    'skills.generate.validation': '请填写技能名称和内容',
    'skills.generate.success': '技能保存成功！',

    // Skills tabs and server skills
    'skills.tabs.mySkills': '我的技能',
    'skills.tabs.import': '已移除',
    'skills.searchPlaceholder': '搜索技能...',
    'skills.loading': '加载中...',
    'skills.loadError': '加载失败，请重试',
    'skills.emptyServer': '还没有保存的技能',
    'skills.noResults': '没有找到匹配的技能',
    'skills.serverError': '加载技能失败',
    'skills.toggleError': '切换技能状态失败',
    'skills.deleteError': '删除技能失败',
    'skills.filters.category': '分类',
    'skills.filters.tag': '标签',
    'skills.filters.allCategories': '所有分类',
    'skills.filters.allTags': '所有标签',
    'skills.filters.clear': '清除筛选',
    'skills.exportAll': '导出全部技能',
    'skills.exportEnabled': '导出已启用技能',
    'skills.importToServer': '导入已移除',
    'skills.importing': '导入已移除',
    'skills.importSuccess': '导入已移除',
    'skills.importError': '导入已移除',
    'skills.importEmpty': '导入已移除',
    'skills.exportError': '导出失败，请重试',
    'skills.exportSuccess': '导出已就绪',
    'skills.migrationError': '技能同步失败，请稍后重试',

    // Skills edit modal
    'skills.edit.title': '编辑技能',
    'skills.edit.name': '名称',
    'skills.edit.description': '描述',
    'skills.edit.category': '分类',
    'skills.edit.tags': '标签（用逗号分隔）',
    'skills.edit.content': '内容',
    'skills.edit.save': '保存',
    'skills.edit.saveError': '保存失败',
    'skills.edit.deleteConfirm': '确定要删除这个技能吗？此操作无法撤销。',

    // Common (additions)
    'common.saving': '保存中...',

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
    'login.footer': '由 ChatGPT 5.2 驱动',
    
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
    'welcome.subtitle': 'Practice structured prompting to get higher-quality answers.',
    'welcome.gpt.desc': 'Most powerful reasoning and coding',

    // Home mission copy
    'home.mission.title': 'Prompt Better, Get Better Answers',
    'home.mission.line1': 'This is a prompt coaching workspace for structured requests to large language models.',
    'home.mission.line2': 'Send your prompt first, then use AI to turn that prompt + answer into reusable markdown skills.',
    
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
    'promptBuilder.changeModel': 'Change Model',
    'promptBuilder.backToModels': 'Back to models',
    'promptBuilder.minimized.text': 'Prompt Sent',
    'promptBuilder.minimized.hint': 'Click to expand and continue',
    
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
    'extension.amount5': '5 prompts',
    'extension.amount10': '10 prompts',
    'extension.amount20': '20 prompts',
    'extension.amountUnlimited': 'Unlimited',
    'extension.reasonLabel': 'Reason *',
    'extension.reasonPlaceholder': 'Please explain why you need more prompts (at least 10 characters)...',
    'extension.reasonHint': 'Briefly explain your purpose and reason for requesting more prompts',
    'extension.submit': 'Submit Request',
    'extension.submitSuccess': 'Request submitted successfully. Please wait for admin review.',
    'extension.reasonMinLength': 'Reason must be at least 10 characters',
    'extension.statusTitle': 'Request Status',

    // File Upload
    'fileUpload.dropzone': 'Drop files here, or click to select',
    'fileUpload.formats': 'Supported: PNG, JPG, PDF, TXT, MD, DOCX',
    'fileUpload.sizeLimit': 'Max 20MB per file',
    'fileUpload.maxFilesReached': 'Maximum 5 files allowed',
    'fileUpload.unsupportedType': 'Unsupported file type: {type}',
    'fileUpload.fileTooLarge': 'File too large: {name} (max 20MB)',
    'fileUpload.processingError': 'Failed to process file: {name}',
    'fileUpload.incompatibleWarning': 'Warning: some files will be ignored.',
    'fileUpload.attachedCount': '{count} file(s)',
    'fileUpload.pasteHint': 'You can also paste images directly',
    'fileUpload.ariaLabel': 'Drop files here, or click/press Enter to select files',
    'fileUpload.extracting': 'Extracting text...',
    'fileUpload.emptyDocument': 'Document is empty or text could not be extracted: {name}',
    'fileUpload.textTruncated': 'Document {name} was too long and has been truncated',
    'fileUpload.chars': 'chars',

    // Common
    'common.cancel': 'Cancel',
    'common.submitting': 'Submitting...',
    'common.close': 'Close',

    // Skills
    'skills.title': 'Skills',
    'skills.button': 'Skills',
    'skills.buildFromPrompt': 'Build Skill from this Prompt',
    'skills.modalTitle': 'Skills Manager',
    'skills.info': 'Send a prompt first, then use AI to generate reusable skills from prompt + answer.',
    'skills.uploadPrompt': 'Skill upload removed',
    'skills.uploadHint': 'Use "Build Skill from this Prompt"',
    'skills.listTitle': 'Saved Skills',
    'skills.clearAll': 'Clear All',
    'skills.empty': 'No saved skills yet',
    'skills.tokenWarning': 'Selected skills are lengthy and may affect response quality',
    'skills.delete': 'Delete',
    'skills.deleteConfirm': 'Are you sure you want to delete this skill?',
    'skills.clearConfirm': 'Are you sure you want to delete all skills?',
    'skills.invalidType': 'Only Markdown files (.md) are supported',
    'skills.duplicate': 'Skill "{name}" already exists',
    'skills.readError': 'Failed to read file: {name}',
    'skills.saveAsSkill': 'Save as Skill',
    'skills.generate.title': 'Save as Skill',
    'skills.generate.analyzing': 'Analyzing your prompt to generate a reusable skill...',
    'skills.generate.name': 'Skill Name',
    'skills.generate.description': 'Short Description',
    'skills.generate.category': 'Category (optional)',
    'skills.generate.tags': 'Tags (optional, comma-separated)',
    'skills.generate.content': 'Skill Content',
    'skills.generate.save': 'Save Skill',
    'skills.generate.retry': 'Retry',
    'skills.generate.error': 'Generation failed. Please try again.',
    'skills.generate.noPrompt': 'No prompt available',
    'skills.generate.validation': 'Please fill in skill name and content',
    'skills.generate.success': 'Skill saved successfully!',

    // Skills tabs and server skills
    'skills.tabs.mySkills': 'My Skills',
    'skills.tabs.import': 'Removed',
    'skills.searchPlaceholder': 'Search skills...',
    'skills.loading': 'Loading...',
    'skills.loadError': 'Failed to load skills',
    'skills.emptyServer': 'No saved skills yet',
    'skills.noResults': 'No matching skills found',
    'skills.serverError': 'Failed to load skills',
    'skills.toggleError': 'Failed to toggle skill',
    'skills.deleteError': 'Failed to delete skill',
    'skills.filters.category': 'Category',
    'skills.filters.tag': 'Tag',
    'skills.filters.allCategories': 'All categories',
    'skills.filters.allTags': 'All tags',
    'skills.filters.clear': 'Clear filters',
    'skills.exportAll': 'Export All Skills',
    'skills.exportEnabled': 'Export Enabled Skills',
    'skills.importToServer': 'Import removed',
    'skills.importing': 'Import removed',
    'skills.importSuccess': 'Import removed',
    'skills.importError': 'Import removed',
    'skills.importEmpty': 'Import removed',
    'skills.exportError': 'Export failed. Please try again.',
    'skills.exportSuccess': 'Export ready',
    'skills.migrationError': 'Skill sync failed. Please try again.',

    // Skills edit modal
    'skills.edit.title': 'Edit Skill',
    'skills.edit.name': 'Name',
    'skills.edit.description': 'Description',
    'skills.edit.category': 'Category',
    'skills.edit.tags': 'Tags (comma-separated)',
    'skills.edit.content': 'Content',
    'skills.edit.save': 'Save',
    'skills.edit.saveError': 'Failed to save',
    'skills.edit.deleteConfirm': 'Are you sure you want to delete this skill? This cannot be undone.',

    // Common (additions)
    'common.saving': 'Saving...',

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
    'login.footer': 'Powered by ChatGPT 5.2',
    
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
