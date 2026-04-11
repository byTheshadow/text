// ============================================
// 🦴 骨与血 (Bone & Blood) - SillyTavern 插件
// ============================================

import { extension_settings, getContext } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';
import { eventSource, event_types } from '../../../../script.js';

// 插件标识
const EXTENSION_NAME = 'bone-and-blood';

// 默认设置
const defaultSettings = {
  // 副API配置
  api_endpoint: '',
  api_key: '',
  api_model: 'gpt-4o-mini',
  
  // 功能开关
  auto_diary_enabled: true,
  diary_trigger_count: 30,
  
  // 主题
  theme: 'default_dark',
  
  // 当前消息计数
  message_counter: 0,
};

// 数据存储结构
let pluginData = {
  records_bone: [],  // 收藏的语录
  diary_blood: [],   // 生成的日记
  summaries: [],     // 阿卡夏总结
  weather: '',       // 当前环境
  npc_status: {},    // NPC状态
  chaos_event: '',   // 突发事件
  vibe: '',          // 氛围
};

// ============================================
// 初始化
// ============================================

jQuery(async () => {
  console.log(`[${EXTENSION_NAME}] 🦴 骨与血插件加载中...`);
  
  // 加载设置
  loadSettings();
  
  // 注入UI
  await injectUI();
  
  // 注册事件监听
  registerEventListeners();
  
  // 注册宏
  registerMacros();
  
  console.log(`[${EXTENSION_NAME}] ✅ 插件加载完成！`);
});

// ============================================
// 设置管理
// ============================================

function loadSettings() {
  // 初始化插件设置
  if (!extension_settings[EXTENSION_NAME]) {
    extension_settings[EXTENSION_NAME] = {};
  }
  
  // 合并默认设置
  extension_settings[EXTENSION_NAME] = Object.assign(
    {},
    defaultSettings,
    extension_settings[EXTENSION_NAME]
  );
}

function getSettings() {
  return extension_settings[EXTENSION_NAME];
}

function saveSettings() {
  saveSettingsDebounced();
}

// ============================================
// UI 注入
// ============================================

async function injectUI() {
  // 1. 注入悬浮按钮
  const floatButton = $(`
    <div id="bb-float-button" title="骨与血">
      🦴
    </div>
  `);
  $('body').append(floatButton);
  
  // 2. 注入主面板
  const mainPanel = $(`
    <div id="bb-panel" class="bb-panel-hidden">
      <div class="bb-panel-header">
        <span class="bb-panel-title">🦴 骨与血</span>
        <button class="bb-panel-close">✕</button>
      </div>
      
      <div class="bb-panel-content">
        <div class="bb-tab-content" id="bb-tab-scrapbook">
          <h3>🌟 唱片机</h3>
          <p class="bb-empty-hint">还没有收藏任何语录哦~</p>
          <div class="bb-records-list"></div>
        </div>
        
        <div class="bb-tab-content bb-hidden" id="bb-tab-diary">
          <h3>📖 日记本</h3>
          <p class="bb-empty-hint">角色还没有写日记...</p>
          <div class="bb-diary-list"></div>
        </div>
        
        <div class="bb-tab-content bb-hidden" id="bb-tab-intel">
          <h3>📻 情报站</h3>
          <div class="bb-intel-section">
            <h4>📜 阿卡夏记录</h4>
            <div class="bb-summary-content">暂无总结</div>
          </div>
          <div class="bb-intel-section">
            <h4>🗺️ 活点地图</h4>
            <div class="bb-npc-list">暂无NPC追踪</div>
          </div>
          <div class="bb-intel-section">
            <h4>☁️ 环境雷达</h4>
            <div class="bb-weather-content">未检测</div>
          </div>
        </div>
        
        <div class="bb-tab-content bb-hidden" id="bb-tab-parallel">
          <h3>🦋 观测站</h3>
          <p class="bb-empty-hint">点击消息旁的🦋按钮生成平行宇宙</p>
          <div class="bb-parallel-list"></div>
        </div>
        
        <div class="bb-tab-content bb-hidden" id="bb-tab-fate">
          <h3>🃏 命运盘</h3>
          <button id="bb-roll-fate" class="bb-big-button">🎲 摇骰子</button>
          <div class="bb-fate-result"></div>
        </div>
        
        <div class="bb-tab-content bb-hidden" id="bb-tab-settings">
          <h3>⚙️ 设置</h3>
          <div class="bb-settings-form">
            <label>
              <span>API Endpoint:</span>
              <input type="text" id="bb-api-endpoint" placeholder="https://api.openai.com/v1/chat/completions">
            </label>
            <label>
              <span>API Key:</span>
              <input type="password" id="bb-api-key" placeholder="sk-...">
            </label>
            <label>
              <span>Model:</span>
              <input type="text" id="bb-api-model" placeholder="gpt-4o-mini">
            </label>
            <label>
              <span>自动日记触发消息数:</span>
              <input type="number" id="bb-diary-trigger" min="10" max="100" value="30">
            </label>
            <button id="bb-save-settings" class="bb-button">保存设置</button>
          </div>
        </div>
      </div>
      
      <div class="bb-panel-nav">
        <button class="bb-nav-btn bb-nav-active" data-tab="scrapbook">🌟</button>
        <button class="bb-nav-btn" data-tab="diary">📖</button>
        <button class="bb-nav-btn" data-tab="intel">📻</button>
        <button class="bb-nav-btn" data-tab="parallel">🦋</button>
        <button class="bb-nav-btn" data-tab="fate">🃏</button>
        <button class="bb-nav-btn" data-tab="settings">⚙️</button>
      </div>
    </div>
  `);
  $('body').append(mainPanel);
  
  // 3. 绑定UI事件
  bindUIEvents();
  
  // 4. 加载设置到表单
  loadSettingsToForm();
}

function bindUIEvents() {
  // 悬浮按钮点击 - 打开/关闭面板
  $('#bb-float-button').on('click', () => {
    $('#bb-panel').toggleClass('bb-panel-hidden');
  });
  
  // 关闭按钮
  $('.bb-panel-close').on('click', () => {
    $('#bb-panel').addClass('bb-panel-hidden');
  });
  
  // 导航栏切换
  $('.bb-nav-btn').on('click', function() {
    const tab = $(this).data('tab');
    
    // 更新按钮状态
    $('.bb-nav-btn').removeClass('bb-nav-active');
    $(this).addClass('bb-nav-active');
    
    // 切换内容
    $('.bb-tab-content').addClass('bb-hidden');
    $(`#bb-tab-${tab}`).removeClass('bb-hidden');
  });
  
  // 保存设置
  $('#bb-save-settings').on('click', () => {
    saveSettingsFromForm();
    alert('设置已保存！');
  });
  
  // 命运骰子
  $('#bb-roll-fate').on('click', () => {
    rollFate();
  });
}

function loadSettingsToForm() {
  const settings = getSettings();
  $('#bb-api-endpoint').val(settings.api_endpoint);
  $('#bb-api-key').val(settings.api_key);
  $('#bb-api-model').val(settings.api_model);
  $('#bb-diary-trigger').val(settings.diary_trigger_count);
}

function saveSettingsFromForm() {
  const settings = getSettings();
  settings.api_endpoint = $('#bb-api-endpoint').val();
  settings.api_key = $('#bb-api-key').val();
  settings.api_model = $('#bb-api-model').val();
  settings.diary_trigger_count = parseInt($('#bb-diary-trigger').val()) || 30;
  saveSettings();
}

// ============================================
// 事件监听
// ============================================

function registerEventListeners() {
  // 监听消息渲染完成 - 注入收藏按钮
  eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (messageId) => {
    injectMessageButtons(messageId);
    incrementMessageCounter();
  });
  
  eventSource.on(event_types.USER_MESSAGE_RENDERED, (messageId) => {
    injectMessageButtons(messageId);
  });
  
  // 监听聊天切换 - 加载对应数据
  eventSource.on(event_types.CHAT_CHANGED, () => {
    loadChatData();
    resetMessageCounter();
  });
}

// 在消息旁注入按钮
function injectMessageButtons(messageId) {
  const messageElement = $(`.mes[mesid="${messageId}"]`);
  if (messageElement.length === 0) return;
  
  // 检查是否已注入
  if (messageElement.find('.bb-msg-buttons').length > 0) return;
  
  const buttonsHtml = $(`
    <div class="bb-msg-buttons">
      <button class="bb-msg-btn bb-collect-btn" title="收藏这句话">🌟</button>
      <button class="bb-msg-btn bb-butterfly-btn" title="平行宇宙">🦋</button>
    </div>
  `);
  
  // 注入到消息操作区
  messageElement.find('.mes_buttons').prepend(buttonsHtml);
  
  // 绑定事件
  buttonsHtml.find('.bb-collect-btn').on('click', () => {
    collectMessage(messageId);
  });
  
  buttonsHtml.find('.bb-butterfly-btn').on('click', () => {
    generateParallelUniverse(messageId);
  });
}

// ============================================
// 核心功能
// ============================================

// 收藏消息
function collectMessage(messageId) {
  const context = getContext();
  const chat = context.chat;
  const message = chat[messageId];
  
  if (!message) {
    console.error('找不到消息:', messageId);
    return;
  }
  
  // 获取上下文（前一条消息）
  const prevMessage = messageId > 0 ? chat[messageId - 1] : null;
  
  const record = {
    id: `rec-${Date.now()}`,
    who: message.name,
    text: message.mes,
    context: prevMessage ? prevMessage.mes : '',
    floor: messageId,
    date: new Date().toLocaleString('zh-CN'),
    is_user: message.is_user,
  };
  
  pluginData.records_bone.push(record);
  saveChatData();
  renderScrapbook();
  
  // 视觉反馈
  const btn = $(`.mes[mesid="${messageId}"] .bb-collect-btn`);

