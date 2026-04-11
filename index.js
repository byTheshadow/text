// ============================================
// 🦴 骨与血 (Bone & Blood) v0.7.0
// SillyTavern 沉浸式风味增强与记忆手账插件
// By SHADOW<安息之影> © 2026
// ============================================

import { extension_settings, getContext } from '../../../extensions.js';
import { saveSettingsDebounced, eventSource, event_types } from '../../../../script.js';

const EXTENSION_NAME = 'third-party/SillyTavern-BoneandBloodbyshadow';
const VERSION = '0.6.0';

//============================================
// 风格预设
// ============================================

const STYLE_PRESETS = {
  modern: {
    home: '🏠 主页', scrapbook: '🌟唱片机', diary: '📖 日记本',
    npc: '🧑‍🤝‍🧑 情报站', weather: '☁️ 环境雷达', vibe: '❤️ 氛围心电图',
    parallel: '🦋 平行宇宙', fate: '🎲 命运盘', ooc: '💬 Burning Star',
    world: '📻 世界频段', achievements: '🏆 成就殿堂',
    gallery: '🖼️ 画廊', couple: '💕 情侣空间',},
  ancient: {
    home: '🏮 归处', scrapbook: '📜拾遗录', diary: '🖋️ 手札',
    npc: '👤 人物志', weather: '🌸 时节录', vibe: '💭 心境图',
    parallel: '🌀镜花水月', fate: '🎴卦象台', ooc: '💌 私语阁',
    world: '📰 江湖传闻', achievements: '🎖️ 功绩榜',
    gallery: '🎨 丹青阁', couple: '🌙鸳鸯谱',
  },
  gothic: {
    home: '🕯️ 庭院', scrapbook: '🦴 骸骨之语', diary: '🩸 血迹手记',
    npc: '👻 幽影名录', weather: '⚰️ 天气', vibe: '🕷️ 血脉共鸣',
    parallel: '🌑 暗面分支', fate: '🗡️ 命运之骰', ooc: '🚪 Burning Star',
    world: '📡亡者电台', achievements: '💀 死亡勋章',
    gallery: '🖤暗影画廊', couple: '🥀 血契空间',
  },
};

// ============================================
// 主页布局定义
// ============================================

const HOME_LAYOUTS = {
  together: { name: '🎧 一起听', desc: '仿音乐软件一起听界面' },
  dashboard: { name: '📊 仪表盘', desc: '数据概览+快捷功能' },
  minimalist: { name: '✨ 极简', desc: '大头像居中+纯净界面' },
};

// ============================================
// 生图提供商配置
// ============================================

const IMAGE_PROVIDERS = {
  placeholder: {
    name: '占位图片（测试用）',
    endpoint: 'picsum',
    fields: {},},
  novelai: {
    name: 'NovelAI',
    endpoint: 'https://image.novelai.net/ai/generate-image',
    authType: 'Bearer',
    fields: {
      model: { label: '模型', default: 'nai-diffusion-3' },
      width: { label: '宽度', default: 512 },
      height: { label: '高度', default: 768 },
      steps: { label: '采样步数', default: 28 },
      scale: { label: 'CFG Scale', default: 11 },
      sampler: { label: '采样器', default: 'k_euler' },
    },
  },
  stablediffusion: {
    name: 'Stable Diffusion WebUI',
    endpoint: 'http://127.0.0.1:7860/sdapi/v1/txt2img',
    authType: 'None',
    fields: {
      steps: { label: '采样步数', default: 20 },
      width: { label: '宽度', default: 512 },
      height: { label: '高度', default: 768 },
      cfg_scale: { label: 'CFG Scale', default: 7 },
      sampler_name: { label: '采样器', default: 'Euler a' },
    },
  },
};

// ============================================
// 默认设置
// ============================================

const defaultSettings = {
  enabled: true,
  api_base: '',
  api_key: '',
  api_model: '',
  auto_diary_enabled: true,
  diary_trigger_count: 30,
  message_counter: 0,

  style_preset: 'gothic',
  custom_names: {},
  home_layout: 'together', // together|dashboard|minimalist

  prompt_presets: [
    {
      name: '默认预设',
      global: '请用简洁、有情感张力的叙事风格回应。避免过度说教和空洞抒情。',
      prompts: {
        diary: '根据以下对话，以角色第一人称写一篇简短日记（100-200字）。带有时间感和情感细节。',
        summary: '用简洁的故事进度总结风格，概括主要事件、关系变化、未解决的线索（100-150字）。',
        weather: '推断当前场景的环境信息：时间、天气、地点、氛围（50-100字）。',
        vibe: '分析对话的情感氛围和关系状态。用诗意短评（50-100字），包含情感基调、张力指数（1-10）、关键词。',
        npc: '描述NPC当前状态：外貌、情绪、行为动向、与主角关系（80-150字）。',
        fate: '生成一个突发随机事件（可好可坏可离谱），简短有力（50-100字），可直接融入RP，带戏剧性。',
        butterfly: '基于用户选择的消息，生成一个平行宇宙分支剧情（150-300字）。风格应与原对话一致但走向不同。',
        ooc: '你作为角色，与用户进行跨越次元的沟通。用户可以和你讨论剧情、角色塑造等元层面问题，也可以只是闲聊。诚恳、温柔地回应。',
        world: '根据当前剧情背景，生成1-2条世界背景"噪音"信息（路人八卦/新闻/世界观彩蛋），每条30-50字。',
      },
      blacklist: [],
    },
  ],
  active_preset: 0,

  // 破墙聊天室独立预设
  ooc_presets: [
    {
      name: '默认OOC预设',
      system_prompt: `你正在与用户进行一场跨越次元的对话。这是一个安全的空间，用户可以：
- 和你聊聊生活中的小事
- 分享今天的心情和感受
- 讨论剧情走向和角色想法
- 寻求情感支持和温暖陪伴
请用温柔、真诚、治愈的语气回应。`,
      temperature: 0.8,
      max_tokens: 500,
    },
  ],
  active_ooc_preset: 0,

  custom_css: '',

  // 生图配置
  img_provider: 'placeholder',
  img_api_key: '',
  img_api_base: '',
  img_artist_tags: '',
  img_negative_prompt: 'nsfw, ugly, blurry, low quality, deformed',
  img_prompt_template: '基于以下内容生成一张插画：\n{content}\n画风：{artist_tags}',
  img_auto_generate: false,

  // 语录海报配置
  poster_bg_url: '',
  poster_font_url: '',
  poster_font_name: 'Noto Serif SC',
  poster_text_color: '#ffffff',
};

// ============================================
// 运行时数据
// ============================================

let pluginData = {
  records_bone: [],
  diary_blood: [],
  summaries: [],
  weather: '',
  npc_status: {},
  chaos_event: '',
  vibe: '',
  parallel_universes: [],

  home_config: {
    user_avatar: '',
    char_avatar: '',
    link_emoji: '💕',
    user_bubble: '今天也要开心鸭~',
    char_bubble: '嗯，一起加油！',
    radio_text: '骨与血电台',
    background_url: '',
  },

  fate_history: [],
  world_feed: [],
  achievements: [],
  ooc_chat: [],

  // v0.6.0 新增
  sticker_packs: [
    {
      id: 'default',
      name: '默认表情包',
      stickers: [],
    },
  ],

  gallery: [], // { id, url, prompt, source, timestamp }

  couple_space: {
    messages: [],
    love_letters: [],
    anniversaries: [],
    photo_wall: [],
  },
};

let butterflySession = {
  active: false,
  originFloor: null,
  originText: '',
  history: [],
};

let oocSession = {
  active: false,
  history: [],
};

// ============================================
// 工具函数
// ============================================

function getSettings() {
  return extension_settings[EXTENSION_NAME];
}

function saveSettings() {
  saveSettingsDebounced();
}

function esc(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getRecentChat(count = 20) {
  const ctx = getContext();
  if (!ctx.chat || ctx.chat.length === 0) return [];
  return ctx.chat.slice(-count);
}

function fmt(messages) {
  const ctx = getContext();
  return messages
    .map((m) => {
      const speaker = m.is_user ? ctx.name1 || '用户' : m.name || ctx.name2 || '角色';
      return `${speaker}: ${m.mes}`;
    })
    .join('\n\n');
}

function dl(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

//简易HTML渲染（安全过滤）
function renderSafeHTML(text) {
  if (!text) return '';
  // 先转义
  let html = esc(text);
  // 支持基础markdown
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  html = html.replace(/\n/g, '<br>');
  // 替换表情包标记[sticker:id]
  html = html.replace(/\[sticker:(\w+)\]/g, (match, id) => {
    const sticker = findStickerById(id);
    if (sticker) {
      return `<img src="${esc(sticker.url)}" alt="${esc(sticker.alt || id)}" class="bb-sticker-img" style="max-width:120px;max-height:120px;border-radius:8px;vertical-align:middle;" />`;
    }
    return match;
  });
  return html;
}

function findStickerById(id) {
  for (const pack of pluginData.sticker_packs) {
    const found = pack.stickers.find((s) => s.id === id);
    if (found) return found;
  }
  return null;
}

//============================================
// 数据持久化 (localStorage)
// ============================================

function getChatDataKey() {
  const ctx = getContext();
  return ctx.chatId ? `bb_data_${ctx.chatId}` : null;
}

function saveChatData() {
  const key = getChatDataKey();
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(pluginData));
  } catch (e) {
    console.error('[骨与血] 保存数据失败:', e);// localStorage可能满了，尝试清理gallery中的base64
    if (e.name === 'QuotaExceededError') {
      toastr.warning('存储空间不足，请清理画廊中的图片');
    }
  }
}

function loadChatData() {
  resetPluginData();
  const key = getChatDataKey();
  if (!key) return;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      pluginData = Object.assign({}, pluginData, saved);
      // 确保新字段存在
      if (!pluginData.sticker_packs) pluginData.sticker_packs = [{ id: 'default', name: '默认表情包', stickers: [] }];
      if (!pluginData.gallery) pluginData.gallery = [];
      if (!pluginData.couple_space) pluginData.couple_space = { messages: [], love_letters: [], anniversaries: [], photo_wall: [] };
      console.log(`[骨与血] 📂 已加载数据: ${key}`);
    }
  } catch (e) {
    console.error('[骨与血] 加载数据失败:', e);
  }

  // 重新加载OOC历史到session
  if (pluginData.ooc_chat && pluginData.ooc_chat.length > 0) {
    oocSession.history = pluginData.ooc_chat.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  renderAll();
}

function resetPluginData() {
  pluginData = {
    records_bone: [],
    diary_blood: [],
    summaries: [],
    weather: '',
    npc_status: {},
    chaos_event: '',
    vibe: '',
    parallel_universes: [],
    home_config: {
      user_avatar: '', char_avatar: '', link_emoji: '💕',
      user_bubble: '今天也要开心鸭~', char_bubble: '嗯，一起加油！',
      radio_text: '骨与血电台', background_url: '',
    },
    fate_history: [],
    world_feed: [],
    achievements: [],
    ooc_chat: [],
    sticker_packs: [{ id: 'default', name: '默认表情包', stickers: [] }],
    gallery: [],
    couple_space: { messages: [], love_letters: [], anniversaries: [], photo_wall: [] },
  };
  oocSession = { active: false, history: [] };
}

// ============================================
// API 调用
// ============================================

async function testAPIConnection() {
  const s = getSettings();
  const base = s.api_base.replace(/\/+$/, '');
  const key = s.api_key;

  if (!base || !key) {
    toastr.warning('请先填写 API Base和 Key');
    return;
  }

  $('#bb-api-status').html('<span style="color:orange;">⏳ 连接中...</span>');

  try {
    const url = base.includes('/v1') ? `${base}/models` : `${base}/v1/models`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const json = await res.json();
    const models = json.data || json.models || [];

    if (models.length === 0) throw new Error('未找到可用模型');

    $('#bb-api-model').empty();
    models.forEach((m) => {
      const id = m.id || m;
      $('#bb-api-model').append(`<option value="${id}">${id}</option>`);
    });

    s.api_model = models[0].id || models[0];
    $('#bb-api-model').val(s.api_model);
    saveSettings();

    $('#bb-api-status').html(`<span style="color:green;">✅ 连接成功！获取到 ${models.length} 个模型</span>`);
    toastr.success(`🔗 已连接，默认模型: ${s.api_model}`);
  } catch (err) {
    $('#bb-api-status').html(`<span style="color:red;">❌ 连接失败: ${err.message}</span>`);
    toastr.error(`连接失败: ${err.message}`);
  }
}

async function callSubAPI(messages, maxTokens = 500, temperature = 0.85) {
  const s = getSettings();
  const base = s.api_base.replace(/\/+$/, '');
  const key = s.api_key;
  const model = s.api_model;

  if (!base || !key || !model) {
    toastr.error('请先配置并测试副API');
    return null;
  }

  const preset = getActivePreset();
  if (preset.global) {
    messages = [{ role: 'system', content: preset.global }, ...messages];
  }

  try {
    const url = base.includes('/v1') ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
    });

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const json = await res.json();
    let content = json.choices?.[0]?.message?.content || '';

    if (preset.blacklist && preset.blacklist.length > 0) {
      preset.blacklist.forEach((word) => {
        const reg = new RegExp(word, 'gi');
        content = content.replace(reg, '***');
      });
    }

    return content.trim();
  } catch (err) {
    toastr.error(`API 调用失败: ${err.message}`);
    return null;
  }
}

// ============================================
// 生图API
// ============================================

async function callImgAPI(prompt) {
  const s = getSettings();
  const provider = s.img_provider || 'placeholder';

  // 占位图
  if (provider === 'placeholder') {
    const seed = encodeURIComponent(prompt).substring(0, 20) + Date.now();
    return `https://picsum.photos/seed/${seed}/512/768`;
  }

  const providerConfig = IMAGE_PROVIDERS[provider];
  if (!providerConfig) {
    toastr.error('未知的生图提供商');
    return null;
  }

  const apiKey = s.img_api_key;
  const apiBase = s.img_api_base || providerConfig.endpoint;

  if (!apiKey && providerConfig.authType !== 'None') {
    toastr.error('请先配置生图 API Key');
    return null;
  }

  try {
    if (provider === 'novelai') {
      return await callNovelAI(apiBase, apiKey, prompt, s);
    } else if (provider === 'stablediffusion') {
      return await callStableDiffusion(apiBase, prompt, s);
    }
  } catch (err) {
    console.error('[骨与血] 生图失败:', err);
    toastr.error(`生图失败: ${err.message}`);
    return null;
  }
}

async function callNovelAI(endpoint, apiKey, prompt, settings) {
  const fullPrompt = settings.img_artist_tags
    ? `${prompt}, ${settings.img_artist_tags}`
    : prompt;

  const payload = {
    input: fullPrompt,
    model: 'nai-diffusion-3',
    action: 'generate',
    parameters: {
      width: 512,
      height: 768,
      scale: 11,
      sampler: 'k_euler',
      steps: 28,
      n_samples: 1,
      ucPreset: 0,
      qualityToggle: true,
      negative_prompt: settings.img_negative_prompt || '',
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`NovelAI: ${res.status} ${res.statusText}`);

  // NovelAI 返回 zip 格式，需要解压
  const blob = await res.blob();
  // 简化处理：尝试直接读取为图片
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  return `data:image/png;base64,${base64}`;
}

async function callStableDiffusion(endpoint, prompt, settings) {
  const fullPrompt = settings.img_artist_tags
    ? `${prompt}, ${settings.img_artist_tags}`
    : prompt;

  const payload = {
    prompt: fullPrompt,
    negative_prompt: settings.img_negative_prompt || '',
    steps: 20,
    width: 512,
    height: 768,
    cfg_scale: 7,
    sampler_name: 'Euler a',
    n_iter: 1,
    batch_size: 1,
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`SD WebUI: ${res.status} ${res.statusText}`);

  const json = await res.json();
  if (json.images && json.images[0]) {
    return `data:image/png;base64,${json.images[0]}`;
  }
  throw new Error('SD WebUI 未返回图片');
}

// 生成图片并保存到画廊
async function generateAndSaveImage(prompt, source = 'manual') {
  toastr.info('🎨 正在生成图片...');
  const imageUrl = await callImgAPI(prompt);
  if (!imageUrl) return null;

  const entry = {
    id: generateId(),
    url: imageUrl,
    prompt: prompt,
    source: source,
    timestamp: new Date().toLocaleString('zh-CN'),
  };

  pluginData.gallery.push(entry);
  saveChatData();
  renderGallery();
  toastr.success('🖼️ 图片已生成并保存到画廊！');
  return entry;
}

// ============================================
// 预设管理
// ============================================

function getActivePreset() {
  const s = getSettings();
  return s.prompt_presets[s.active_preset] || s.prompt_presets[0];
}

function getActiveOOCPreset() {
  const s = getSettings();
  if (!s.ooc_presets || s.ooc_presets.length === 0) {
    s.ooc_presets = [defaultSettings.ooc_presets[0]];
  }
  return s.ooc_presets[s.active_ooc_preset || 0] || s.ooc_presets[0];
}

function refreshPresetSelector() {
  const s = getSettings();
  const sel = $('#bb-active-preset');
  sel.empty();
  s.prompt_presets.forEach((p, i) => {
    sel.append(`<option value="${i}">${esc(p.name)}</option>`);
  });
  sel.val(s.active_preset);
}

function refreshOOCPresetSelector() {
  const s = getSettings();
  if (!s.ooc_presets) s.ooc_presets = [defaultSettings.ooc_presets[0]];
  const sel = $('#bb-active-ooc-preset');
  sel.empty();
  s.ooc_presets.forEach((p, i) => {
    sel.append(`<option value="${i}">${esc(p.name)}</option>`);
  });
  sel.val(s.active_ooc_preset || 0);
}

function createNewPreset() {
  const name = prompt('预设名称:', `新预设 ${Date.now()}`);
  if (!name) return;
  const s = getSettings();
  s.prompt_presets.push({
    name,
    global: '',
    prompts: { ...defaultSettings.prompt_presets[0].prompts },
    blacklist: [],
  });
  s.active_preset = s.prompt_presets.length - 1;
  saveSettings();
  refreshPresetSelector();
  toastr.success(`➕ 已创建预设: ${name}`);
}

function deleteCurrentPreset() {
  const s = getSettings();
  if (s.prompt_presets.length === 1) {
    toastr.warning('至少保留一个预设');
    return;
  }
  if (!confirm(`确认删除预设: ${getActivePreset().name}?`)) return;
  s.prompt_presets.splice(s.active_preset, 1);
  s.active_preset = 0;
  saveSettings();
  refreshPresetSelector();
  toastr.success('🗑️ 预设已删除');
}

function importPreset() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        const s = getSettings();
        s.prompt_presets.push(imported);
        s.active_preset = s.prompt_presets.length - 1;
        saveSettings();
        refreshPresetSelector();
        toastr.success(`📥 已导入: ${imported.name}`);
      } catch (err) {
        toastr.error('JSON 格式错误');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function exportPreset() {
  const preset = getActivePreset();
  dl(`bb_preset_${preset.name}_${Date.now()}.json`, JSON.stringify(preset, null, 2), 'application/json');
  toastr.success(`📤 已导出: ${preset.name}`);
}

// OOC预设管理
function createNewOOCPreset() {
  const name = prompt('OOC预设名称:', `OOC预设 ${Date.now()}`);
  if (!name) return;
  const s = getSettings();
  if (!s.ooc_presets) s.ooc_presets = [];
  s.ooc_presets.push({
    name,
    system_prompt: defaultSettings.ooc_presets[0].system_prompt,
    temperature: 0.8,
    max_tokens: 500,
  });
  s.active_ooc_preset = s.ooc_presets.length - 1;
  saveSettings();
  refreshOOCPresetSelector();
  toastr.success(`➕ 已创建OOC预设: ${name}`);
}

function deleteCurrentOOCPreset() {
  const s = getSettings();
  if (!s.ooc_presets || s.ooc_presets.length <= 1) {
    toastr.warning('至少保留一个OOC预设');
    return;
  }
  if (!confirm(`确认删除OOC预设: ${getActiveOOCPreset().name}?`)) return;
  s.ooc_presets.splice(s.active_ooc_preset, 1);
  s.active_ooc_preset = 0;
  saveSettings();
  refreshOOCPresetSelector();
  toastr.success('🗑️ OOC预设已删除');
}

function importOOCPreset() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        const s = getSettings();
        if (!s.ooc_presets) s.ooc_presets = [];
        s.ooc_presets.push(imported);
        s.active_ooc_preset = s.ooc_presets.length - 1;
        saveSettings();
        refreshOOCPresetSelector();
        toastr.success(`📥 已导入OOC预设: ${imported.name}`);
      } catch (err) {
        toastr.error('JSON 格式错误');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function exportOOCPreset() {
  const preset = getActiveOOCPreset();
  dl(`bb_ooc_preset_${preset.name}_${Date.now()}.json`, JSON.stringify(preset, null, 2), 'application/json');
  toastr.success(`📤 已导出OOC预设: ${preset.name}`);
}

// 预设编辑器
function loadPresetToEditor() {
  const preset = getActivePreset();
  $('#bb-preset-name').val(preset.name);
  $('#bb-preset-global').val(preset.global || '');
  $('#bb-preset-blacklist').val((preset.blacklist || []).join(','));
  const keys = ['diary', 'summary', 'weather', 'vibe', 'npc', 'fate', 'butterfly', 'ooc', 'world'];
  keys.forEach((k) => $(`#bb-preset-${k}`).val(preset.prompts[k] || ''));
}

function savePresetFromEditor() {
  const s = getSettings();
  const idx = s.active_preset;
  s.prompt_presets[idx] = {
    name: $('#bb-preset-name').val() || '未命名预设',
    global: $('#bb-preset-global').val(),
    blacklist: $('#bb-preset-blacklist').val().split(',').map((w) => w.trim()).filter(Boolean),
    prompts: {
      diary: $('#bb-preset-diary').val(),
      summary: $('#bb-preset-summary').val(),
      weather: $('#bb-preset-weather').val(),
      vibe: $('#bb-preset-vibe').val(),
      npc: $('#bb-preset-npc').val(),
      fate: $('#bb-preset-fate').val(),
      butterfly: $('#bb-preset-butterfly').val(),
      ooc: $('#bb-preset-ooc').val(),
      world: $('#bb-preset-world').val(),
    },
  };
  saveSettings();
  refreshPresetSelector();
  toastr.success('💾 预设已保存');
}

function loadCustomNames() {
  const s = getSettings();
  const defaultPreset = STYLE_PRESETS.gothic;
  $('.bb-custom-name').each(function () {
    const key = $(this).data('key');
    $(this).val(s.custom_names[key] || defaultPreset[key] || '');
  });
}

function applyCustomCSS() {
  const s = getSettings();
  $('#bb-custom-style').remove();
  if (s.custom_css) {
    $('head').append(`<style id="bb-custom-style">${s.custom_css}</style>`);
  }
}

function getTabNames() {
  const s = getSettings();
  const preset = s.style_preset;
  if (preset === 'custom' && Object.keys(s.custom_names).length > 0) {
    return s.custom_names;
  }
  return STYLE_PRESETS[preset] || STYLE_PRESETS.gothic;
}
// ============================================
// 设置面板 HTML
// ============================================

function buildSettingsPanelHTML() {
  return `
  <div id="bb-extension-settings">
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <b>🦴 骨与血(Bone & Blood) v${VERSION}</b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>
      <div class="inline-drawer-content"><div style="margin:6px 0;">
          <label class="checkbox_label" for="bb-enabled">
            <input id="bb-enabled" type="checkbox" />
            <span>启用插件</span>
          </label>
        </div>

        <hr /><h4style="margin:8px 0 4px;">📡 副API 配置</h4>

        <div style="margin:6px 0;">
          <label for="bb-api-base" style="font-size:13px;display:block;margin-bottom:2px;">API Base URL:</label>
          <input id="bb-api-base" type="text" class="text_pole" placeholder="https://api.openai.com/v1" style="width:100%;" /><small style="color:#888;font-size:11px;">填到 /v1 即可</small>
        </div>

        <div style="margin:6px 0;">
          <label for="bb-api-key" style="font-size:13px;display:block;margin-bottom:2px;">API Key:</label>
          <input id="bb-api-key" type="password" class="text_pole" placeholder="sk-..." style="width:100%;" /></div>

        <div style="margin:8px 0;">
          <input id="bb-btn-test-api" class="menu_button" type="button" value="🔗 测试连接 & 获取模型" style="width:100%;" /><div id="bb-api-status" style="margin-top:4px;font-size:13px;min-height:20px;"></div>
        </div>

        <div style="margin:6px 0;">
          <label for="bb-api-model" style="font-size:13px;display:block;margin-bottom:2px;">选择模型:</label>
          <select id="bb-api-model" class="text_pole" style="width:100%;padding:6px;">
            <option value="">-- 请先测试连接 --</option>
          </select>
        </div>

        <hr />
        <h4 style="margin:8px 0 4px;">⚙️ 自动生成</h4>

        <div style="margin:6px 0;">
          <label for="bb-diary-trigger" style="font-size:13px;">每隔多少条消息自动生成:</label>
          <input id="bb-diary-trigger" type="number" class="text_pole" min="10" max="200" value="30" style="width:80px;" />
        </div>

        <div style="margin:6px 0;">
          <label class="checkbox_label" for="bb-auto-diary">
            <input id="bb-auto-diary" type="checkbox" />
            <span>启用自动日记/总结</span>
          </label>
        </div>

        <hr />
        <h4 style="margin:8px 0 4px;">🎨 风格预设</h4>
        <div style="margin:6px 0;">
          <label for="bb-style-preset" style="font-size:13px;">选择风格:</label>
          <select id="bb-style-preset" class="text_pole" style="width:100%;padding:6px;">
            <option value="modern">🌃 现代风</option>
            <option value="ancient">🏯 古风</option>
            <option value="gothic">🦇 哥特风</option>
            <option value="custom">✏️ 自定义</option>
          </select>
        </div>
        <div id="bb-custom-style-names" style="display:none;margin-top:12px;padding:12px;background:#222;border:1px solid #444;border-radius:6px;">
          <p style="font-size:12px;color:#aaa;margin-bottom:10px;">自定义各模块名称（支持emoji）:</p>
          <div style="display:grid;grid-template-columns:1fr 2fr;gap:8px;font-size:11px;">
            <label>首页:</label><input type="text" class="text_pole bb-custom-name" data-key="home" style="padding:4px;" />
            <label>唱片机:</label><input type="text" class="text_pole bb-custom-name" data-key="scrapbook" style="padding:4px;" />
            <label>日记本:</label><input type="text" class="text_pole bb-custom-name" data-key="diary" style="padding:4px;" />
            <label>NPC:</label><input type="text" class="text_pole bb-custom-name" data-key="npc" style="padding:4px;" />
            <label>环境雷达:</label><input type="text" class="text_pole bb-custom-name" data-key="weather" style="padding:4px;" />
            <label>氛围心电图:</label><input type="text" class="text_pole bb-custom-name" data-key="vibe" style="padding:4px;" />
            <label>平行宇宙:</label><input type="text" class="text_pole bb-custom-name" data-key="parallel" style="padding:4px;" />
            <label>命运盘:</label><input type="text" class="text_pole bb-custom-name" data-key="fate" style="padding:4px;" />
            <label>Burning Star:</label><input type="text" class="text_pole bb-custom-name" data-key="ooc" style="padding:4px;" />
            <label>世界频段:</label><input type="text" class="text_pole bb-custom-name" data-key="world" style="padding:4px;" />
            <label>成就殿堂:</label><input type="text" class="text_pole bb-custom-name" data-key="achievements" style="padding:4px;" />
            <label>画廊:</label><input type="text" class="text_pole bb-custom-name" data-key="gallery" style="padding:4px;" />
            <label>情侣空间:</label><input type="text" class="text_pole bb-custom-name" data-key="couple" style="padding:4px;" />
          </div>
          <button id="bb-save-custom-names" class="menu_button" style="width:100%;margin-top:10px;">💾 保存自定义名称</button>
        </div>

        <hr />
        <h4 style="margin:8px 0 4px;">🏠 主页布局</h4>
        <div style="margin:6px 0;">
          <select id="bb-home-layout" class="text_pole" style="width:100%;padding:6px;">
            <option value="together">🎧 一起听</option>
            <option value="dashboard">📊 仪表盘</option>
            <option value="minimalist">✨ 极简</option>
          </select>
        </div>

        <hr />
        <h4 style="margin:8px 0 4px;">📝 预设管理</h4>
        <div style="margin:6px 0;">
          <label for="bb-active-preset" style="font-size:13px;">当前预设:</label>
          <select id="bb-active-preset" class="text_pole" style="width:100%;padding:6px;"></select>
        </div>
        <div style="display:flex;gap:4px;margin:6px 0;">
          <input id="bb-btn-new-preset" class="menu_button" type="button" value="➕ 新建" style="flex:1;" />
          <input id="bb-btn-del-preset" class="menu_button" type="button" value="🗑️ 删除" style="flex:1;" />
        </div>
        <div style="display:flex;gap:4px;margin:6px 0;">
          <input id="bb-btn-import-preset" class="menu_button" type="button" value="📥 导入JSON" style="flex:1;" />
          <input id="bb-btn-export-preset" class="menu_button" type="button" value="📤 导出JSON" style="flex:1;" />
        </div>

        <div style="margin-top:12px;">
          <button id="bb-toggle-preset-editor" class="menu_button" style="width:100%;">✏️ 展开预设编辑器</button>
        </div>

        <div id="bb-preset-editor" style="display:none;margin-top:12px;padding:12px;background:#222;border:1px solid #444;border-radius:6px;">
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;color:#aaa;">预设名称:</label>
            <input id="bb-preset-name" type="text" class="text_pole" style="width:100%;padding:6px;" />
          </div>
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;color:#aaa;">全局指导:</label>
            <textarea id="bb-preset-global" class="text_pole" rows="3" style="width:100%;font-size:12px;"></textarea>
          </div>
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;color:#aaa;">禁词列表（逗号分隔）:</label>
            <input id="bb-preset-blacklist" type="text" class="text_pole" style="width:100%;padding:6px;" placeholder="词1,词2,词3" />
          </div>
          <details style="margin-bottom:10px;">
            <summary style="cursor:pointer;color:var(--bb-primary);font-size:13px;font-weight:bold;">📖 提示词模板（点击展开）</summary>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px;">
              <div><label style="font-size:11px;color:#888;">日记:</label><textarea id="bb-preset-diary" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea></div>
              <div><label style="font-size:11px;color:#888;">总结:</label><textarea id="bb-preset-summary" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea></div>
              <div><label style="font-size:11px;color:#888;">环境:</label><textarea id="bb-preset-weather" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea></div>
              <div><label style="font-size:11px;color:#888;">氛围:</label><textarea id="bb-preset-vibe" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea></div>
              <div><label style="font-size:11px;color:#888;">NPC:</label><textarea id="bb-preset-npc" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea></div>
              <div><label style="font-size:11px;color:#888;">命运:</label><textarea id="bb-preset-fate" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea></div>
              <div><label style="font-size:11px;color:#888;">平行宇宙:</label><textarea id="bb-preset-butterfly" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea></div>
              <div><label style="font-size:11px;color:#888;">Burning Star:</label><textarea id="bb-preset-ooc" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea></div>
              <div><label style="font-size:11px;color:#888;">世界频段:</label><textarea id="bb-preset-world" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea></div>
            </div>
          </details><button id="bb-save-preset-editor" class="menu_button" style="width:100%;background:#8b0000;color:#fff;font-weight:bold;">💾 保存当前预设</button>
        </div>

        <hr />
        <h4 style="margin:8px 0 4px;">🚪Burning Star Chat预设</h4>
        <div style="margin:6px 0;">
          <label for="bb-active-ooc-preset" style="font-size:13px;">当前OOC预设:</label>
          <select id="bb-active-ooc-preset" class="text_pole" style="width:100%;padding:6px;"></select>
        </div>
        <div style="display:flex;gap:4px;margin:6px 0;">
          <input id="bb-btn-new-ooc-preset" class="menu_button" type="button" value="➕ 新建" style="flex:1;" />
          <input id="bb-btn-del-ooc-preset" class="menu_button" type="button" value="🗑️ 删除" style="flex:1;" />
        </div>
        <div style="display:flex;gap:4px;margin:6px 0;">
          <input id="bb-btn-import-ooc-preset" class="menu_button" type="button" value="📥 导入" style="flex:1;" />
          <input id="bb-btn-export-ooc-preset" class="menu_button" type="button" value="📤 导出" style="flex:1;" />
        </div>
        <div style="margin-top:8px;">
          <button id="bb-toggle-ooc-editor" class="menu_button" style="width:100%;">✏️ 编辑OOC预设</button>
        </div>
        <div id="bb-ooc-preset-editor" style="display:none;margin-top:12px;padding:12px;background:#222;border:1px solid #444;border-radius:6px;">
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;color:#aaa;">预设名称:</label>
            <input id="bb-ooc-preset-name" type="text" class="text_pole" style="width:100%;padding:6px;" />
          </div>
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;color:#aaa;">系统提示词:</label>
            <textarea id="bb-ooc-system-prompt" class="text_pole" rows="5" style="width:100%;font-size:12px;"></textarea>
          </div>
          <div style="margin-bottom:10px;display:flex;gap:12px;">
            <div style="flex:1;">
              <label style="font-size:12px;color:#aaa;">温度:</label>
              <input id="bb-ooc-temperature" type="number" class="text_pole" min="0" max="2" step="0.1" style="width:100%;padding:6px;" />
            </div>
            <div style="flex:1;">
              <label style="font-size:12px;color:#aaa;">最大Token:</label>
              <input id="bb-ooc-max-tokens" type="number" class="text_pole" min="100" max="2000" style="width:100%;padding:6px;" />
            </div></div>
          <button id="bb-save-ooc-preset" class="menu_button" style="width:100%;background:#8b0000;color:#fff;font-weight:bold;">💾 保存OOC预设</button>
        </div>

        <hr />
        <h4 style="margin:8px 0 4px;">🖼️ 生图 API配置</h4>
        <div style="margin:6px 0;">
          <label for="bb-img-provider" style="font-size:13px;">生图提供商:</label>
          <select id="bb-img-provider" class="text_pole" style="width:100%;padding:6px;">
            <option value="placeholder">🎨 占位图片（测试用）</option>
            <option value="novelai">🎨 NovelAI</option>
            <option value="stablediffusion">🎨 Stable Diffusion WebUI</option>
          </select>
        </div>
        <div id="bb-img-api-fields" style="margin:6px 0;">
          <div style="margin:6px 0;">
            <label style="font-size:13px;display:block;margin-bottom:2px;">生图 API Key:</label>
            <input id="bb-img-api-key" type="password" class="text_pole" placeholder="生图API密钥..." style="width:100%;" />
          </div>
          <div style="margin:6px 0;">
            <label style="font-size:13px;display:block;margin-bottom:2px;">生图 API Base（可选）:</label>
            <input id="bb-img-api-base" type="text" class="text_pole" placeholder="留空使用默认端点" style="width:100%;" />
          </div>
        </div>
        <div style="margin:6px 0;">
          <label style="font-size:13px;display:block;margin-bottom:2px;">画师串（Artist Tags）:</label>
          <input id="bb-img-artist-tags" type="text" class="text_pole" placeholder="by Greg Rutkowski, by Alphonse Mucha" style="width:100%;" />
        </div>
        <div style="margin:6px 0;">
          <label style="font-size:13px;display:block;margin-bottom:2px;">负面提示词:</label>
          <input id="bb-img-negative" type="text" class="text_pole" placeholder="nsfw, ugly, blurry, low quality" style="width:100%;" />
        </div>
        <div style="margin:8px 0;">
          <input id="bb-btn-test-img" class="menu_button" type="button" value="🎨 测试生图" style="width:100%;" />
        </div>

        <hr />
        <h4 style="margin:8px 0 4px;">🎨 主题管理</h4>
        <div style="margin:6px 0;">
          <label for="bb-custom-css" style="font-size:13px;display:block;margin-bottom:2px;">自定义 CSS:</label>
          <textarea id="bb-custom-css" class="text_pole" placeholder="粘贴 CSS 代码..." style="width:100%;min-height:100px;font-family:monospace;font-size:12px;"></textarea>
        </div>
        <div style="display:flex;gap:4px;margin:6px 0;">
          <input id="bb-btn-apply-css" class="menu_button" type="button" value="🎨 应用" />
          <input id="bb-btn-reset-css" class="menu_button" type="button" value="🔄 重置" /><input id="bb-btn-upload-css" class="menu_button" type="button" value="📁 上传.css" />
        </div>
        <input type="file" id="bb-css-file-input" accept=".css" style="display:none;" />

        <hr />
        <h4 style="margin:8px 0 4px;">🔧 手动操作</h4>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          <input id="bb-btn-diary" class="menu_button" type="button" value="📖 生成日记" />
          <input id="bb-btn-summary" class="menu_button" type="button" value="📜 生成总结" />
          <input id="bb-btn-weather" class="menu_button" type="button" value="☁️ 刷新环境" />
          <input id="bb-btn-vibe" class="menu_button" type="button" value="❤️ 分析氛围" />
        </div>

        <hr />
        <div style="color:#888;font-size:11px;padding:8px 0;text-align:center;">
          💡 点击右下角 🦴 打开主面板<br/>
          © 2026SHADOW &lt;安息之影&gt;
        </div>
      </div>
    </div>
  </div>`;
}

// ============================================
// 设置面板事件绑定
// ============================================

function loadSettingsToForm() {
  const s = getSettings();
  $('#bb-enabled').prop('checked', s.enabled);
  $('#bb-api-base').val(s.api_base);
  $('#bb-api-key').val(s.api_key);
  $('#bb-diary-trigger').val(s.diary_trigger_count);
  $('#bb-auto-diary').prop('checked', s.auto_diary_enabled);
  $('#bb-style-preset').val(s.style_preset);
  $('#bb-home-layout').val(s.home_layout || 'together');
  $('#bb-custom-css').val(s.custom_css || '');

  // 生图设置
  $('#bb-img-provider').val(s.img_provider || 'placeholder');
  $('#bb-img-api-key').val(s.img_api_key || '');
  $('#bb-img-api-base').val(s.img_api_base || '');
  $('#bb-img-artist-tags').val(s.img_artist_tags || '');
  $('#bb-img-negative').val(s.img_negative_prompt || '');

  if (s.api_model) {
    $('#bb-api-model').empty().append(`<option value="${s.api_model}" selected>${s.api_model}</option>`);
  }

  refreshPresetSelector();
  refreshOOCPresetSelector();

  // 自定义名称面板
  if (s.style_preset === 'custom') {
    $('#bb-custom-style-names').show();
    loadCustomNames();
  }
}

function bindSettingsPanelEvents() {
  $('#bb-enabled').on('change', function () {
    getSettings().enabled = $(this).is(':checked');
    saveSettings();
  });

  $('#bb-api-base').on('input', function () {
    getSettings().api_base = $(this).val().replace(/\/+$/, '');
    saveSettings();
  });

  $('#bb-api-key').on('input', function () {
    getSettings().api_key = $(this).val();
    saveSettings();
  });

  $('#bb-btn-test-api').on('click', testAPIConnection);

  $('#bb-api-model').on('change', function () {
    getSettings().api_model = $(this).val();
    saveSettings();
  });

  $('#bb-diary-trigger').on('change', function () {
    getSettings().diary_trigger_count = parseInt($(this).val()) || 30;
    saveSettings();
  });

  $('#bb-auto-diary').on('change', function () {
    getSettings().auto_diary_enabled = $(this).is(':checked');
    saveSettings();
  });

  // 风格预设
  $('#bb-style-preset').on('change', function () {
    const val = $(this).val();
    getSettings().style_preset = val;
    saveSettings();
    if (val === 'custom') {
      $('#bb-custom-style-names').slideDown();
      loadCustomNames();
    } else {
      $('#bb-custom-style-names').slideUp();
    }
    refreshFloatingUI();
  });

  // 主页布局
  $('#bb-home-layout').on('change', function () {
    getSettings().home_layout = $(this).val();
    saveSettings();
    refreshFloatingUI();
  });

  // 保存自定义名称
  $('#bb-save-custom-names').on('click', function () {
    const s = getSettings();
    s.custom_names = {};
    $('.bb-custom-name').each(function () {
      const key = $(this).data('key');
      const val = $(this).val().trim();
      if (val) s.custom_names[key] = val;
    });
    saveSettings();
    refreshFloatingUI();
    toastr.success('✅ 自定义名称已保存');
  });

  $('#bb-active-preset').on('change', function () {
    getSettings().active_preset = parseInt($(this).val());
    saveSettings();
  });

  $('#bb-btn-new-preset').on('click', createNewPreset);
  $('#bb-btn-del-preset').on('click', deleteCurrentPreset);
  $('#bb-btn-import-preset').on('click', importPreset);
  $('#bb-btn-export-preset').on('click', exportPreset);

  // OOC预设
  $('#bb-active-ooc-preset').on('change', function () {
    const s = getSettings();
    s.active_ooc_preset = parseInt($(this).val());
    saveSettings();
  });

  $('#bb-btn-new-ooc-preset').on('click', createNewOOCPreset);
  $('#bb-btn-del-ooc-preset').on('click', deleteCurrentOOCPreset);
  $('#bb-btn-import-ooc-preset').on('click', importOOCPreset);
  $('#bb-btn-export-ooc-preset').on('click', exportOOCPreset);

  $('#bb-toggle-ooc-editor').on('click', function () {
    const editor = $('#bb-ooc-preset-editor');
    if (editor.is(':visible')) {
      editor.slideUp();
      $(this).text('✏️ 编辑OOC预设');
    } else {
      const p = getActiveOOCPreset();
      $('#bb-ooc-preset-name').val(p.name);
      $('#bb-ooc-system-prompt').val(p.system_prompt);
      $('#bb-ooc-temperature').val(p.temperature || 0.8);
      $('#bb-ooc-max-tokens').val(p.max_tokens || 500);
      editor.slideDown();
      $(this).text('🔼 收起编辑器');
    }
  });

  $('#bb-save-ooc-preset').on('click', function () {
    const s = getSettings();
    const idx = s.active_ooc_preset || 0;
    s.ooc_presets[idx] = {
      name: $('#bb-ooc-preset-name').val() || '未命名OOC预设',
      system_prompt: $('#bb-ooc-system-prompt').val(),
      temperature: parseFloat($('#bb-ooc-temperature').val()) || 0.8,
      max_tokens: parseInt($('#bb-ooc-max-tokens').val()) || 500,};
    saveSettings();
    refreshOOCPresetSelector();
    toastr.success('💾 OOC预设已保存');
  });

  // 生图设置
  $('#bb-img-provider').on('change', function () {
    getSettings().img_provider = $(this).val();
    saveSettings();
  });
  $('#bb-img-api-key').on('input', function () {
    getSettings().img_api_key = $(this).val();
    saveSettings();
  });
  $('#bb-img-api-base').on('input', function () {
    getSettings().img_api_base = $(this).val();
    saveSettings();
  });
  $('#bb-img-artist-tags').on('input', function () {
    getSettings().img_artist_tags = $(this).val();
    saveSettings();
  });
  $('#bb-img-negative').on('input', function () {
    getSettings().img_negative_prompt = $(this).val();
    saveSettings();
  });
  $('#bb-btn-test-img').on('click', async function () {
    await generateAndSaveImage('beautiful landscape, sunset, mountains', 'test');
  });

  // CSS
  $('#bb-btn-apply-css').on('click', () => {
    getSettings().custom_css = $('#bb-custom-css').val();
    saveSettings();
    applyCustomCSS();
    toastr.success('🎨 CSS 已应用');
  });

  $('#bb-btn-reset-css').on('click', () => {
    getSettings().custom_css = '';
    $('#bb-custom-css').val('');
    saveSettings();
    applyCustomCSS();
    toastr.success('🔄 已重置为默认样式');
  });

  $('#bb-btn-upload-css').on('click', () => $('#bb-css-file-input').click());

  $('#bb-css-file-input').on('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const css = e.target.result;
      $('#bb-custom-css').val(css);
      getSettings().custom_css = css;
      saveSettings();
      applyCustomCSS();
      toastr.success(`📁 已加载 ${file.name}`);
    };
    reader.readAsText(file);
  });

  // 手动操作按钮
  $('#bb-btn-diary').on('click', generateDiary);
  $('#bb-btn-summary').on('click', generateSummary);
  $('#bb-btn-weather').on('click', generateWeather);
  $('#bb-btn-vibe').on('click', generateVibe);

  // 预设编辑器
  $('#bb-toggle-preset-editor').on('click', function () {
    const editor = $('#bb-preset-editor');
    if (editor.is(':visible')) {
      editor.slideUp();
      $(this).text('✏️ 展开预设编辑器');
    } else {
      loadPresetToEditor();
      editor.slideDown();
      $(this).text('🔼 收起编辑器');
    }
  });

  $('#bb-save-preset-editor').on('click', savePresetFromEditor);
}

// ============================================
// 悬浮UI（主面板）— 修复：初始隐藏
// ============================================

function injectFloatingUI() {
  if ($('#bb-float-btn').length > 0) return;

  //悬浮按钮
  $('body').append(`
    <div id="bb-float-btn" title="骨与血">🦴</div>
  `);

  // 关键修复：点击悬浮按钮切换主面板
  $('#bb-float-btn').on('click', function (e) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    toggleMainPanel();
    return false;
  });

  // 主面板 — 初始 display:none
  $('body').append(buildMainPanelHTML());
  // 确保主面板初始隐藏
  $('#bb-main-panel').hide();

  bindMainPanelEvents();
  renderAll();
}

function toggleMainPanel() {
  const $panel = $('#bb-main-panel');
  if ($panel.is(':visible')) {
    $panel.fadeOut(200);} else {
    $panel.fadeIn(200);
    // 关闭SillyTavern所有已打开的drawer
    try {
      $('.drawer-content.openDrawer').removeClass('openDrawer');
      $('.openIcon').removeClass('openIcon');
    } catch (e) {}
  }
}

function refreshFloatingUI() {
  const wasVisible = $('#bb-main-panel').is(':visible');
  $('#bb-main-panel').remove();
  $('body').append(buildMainPanelHTML());
  if (!wasVisible) {
    $('#bb-main-panel').hide();
  }bindMainPanelEvents();
  renderAll();
}

// ============================================
// 主面板 HTML构建
// ============================================

function buildMainPanelHTML() {
  const names = getTabNames();
  const layout = getSettings().home_layout || 'together';

  return `
    <div id="bb-main-panel" style="display:none;">

      <!-- 标题栏 -->
      <div class="bb-header">
        <div>🦴 骨与血</div>
        <button id="bb-close-btn">✖</button>
      </div>

      <!-- Tab导航 -->
      <div class="bb-nav">
        <div class="bb-tab active" data-tab="home">${names.home || '🕯️ 庭院'}</div>
        <div class="bb-tab" data-tab="scrapbook">${names.scrapbook || '🦴 骸骨之语'}</div>
        <div class="bb-tab" data-tab="diary">${names.diary || '🩸 血迹手记'}</div>
        <div class="bb-tab" data-tab="npc">${names.npc || '👻幽影名录'}</div>
        <div class="bb-tab" data-tab="weather">${names.weather || '⚰️ 天气'}</div>
        <div class="bb-tab" data-tab="vibe">${names.vibe || '🕷️ 血脉共鸣'}</div>
        <div class="bb-tab" data-tab="parallel">${names.parallel || '🌑暗面分支'}</div>
        <div class="bb-tab" data-tab="fate">${names.fate || '🗡️ 命运之骰'}</div>
        <div class="bb-tab" data-tab="ooc">${names.ooc || '🚪Burning Star'}</div>
        <div class="bb-tab" data-tab="world">${names.world || '📡亡者电台'}</div>
        <div class="bb-tab" data-tab="gallery">${names.gallery || '🖼️ 画廊'}</div>
        <div class="bb-tab" data-tab="couple">${names.couple || '💕 情侣空间'}</div>
        <div class="bb-tab" data-tab="achievements">${names.achievements || '💀 死亡勋章'}</div>
      </div>

      <!-- 内容区 -->
      <div class="bb-content">

        <!-- 🏠 首页 -->
        <div id="bb-tab-home" class="bb-tab-panel active">
          ${buildHomeLayout(layout)}
        </div>

        <!-- 🌟唱片机 -->
        <div id="bb-tab-scrapbook" class="bb-tab-panel" style="display:none;">
          <div class="bb-export-bar" style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;">
            <button class="bb-sm-btn" id="bb-btn-export-md">📄 导出MD</button>
            <button class="bb-sm-btn" id="bb-btn-export-json">📦 导出JSON</button>
            <button class="bb-sm-btn" id="bb-btn-export-poster">🖼️ 导出海报</button>
          </div>
          <div id="bb-scrap-empty" class="bb-empty">暂无收藏的语录<br/>点击消息旁的 🌟 收藏</div>
          <div id="bb-records-list"></div>
        </div>

        <!-- 📖 日记本 -->
        <div id="bb-tab-diary" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;">
            <button class="bb-sm-btn" id="bb-btn-gen-diary-tab">📖 生成日记</button>
            <button class="bb-sm-btn" id="bb-btn-gen-diary-img">🎨 为最新日记配图</button>
          </div>
          <div id="bb-diary-empty" class="bb-empty">暂无日记<br/>点击上方按钮生成</div>
          <div id="bb-diary-list"></div>
        </div>

        <!-- NPC动态 -->
        <div id="bb-tab-npc" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;">
            <button class="bb-sm-btn" id="bb-btn-add-npc">➕ 添加NPC</button>
            <button class="bb-sm-btn" id="bb-btn-auto-npc">🎲 随机窥探</button>
          </div>
          <div id="bb-npc-box"></div>
        </div>

        <!-- 环境雷达 -->
        <div id="bb-tab-weather" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;">
            <button class="bb-sm-btn" id="bb-btn-gen-weather-tab">☁️ 扫描环境</button>
          </div>
          <div class="bb-box" id="bb-weather-box">未检测</div>
        </div>

        <!-- 氛围心电图 -->
        <div id="bb-tab-vibe" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;">
            <button class="bb-sm-btn" id="bb-btn-gen-vibe-tab">❤️ 分析氛围</button>
          </div>
          <div class="bb-box" id="bb-vibe-box">未检测</div>
        </div>

        <!-- 平行宇宙 -->
        <div id="bb-tab-parallel" class="bb-tab-panel" style="display:none;">
          <div id="bb-par-empty" class="bb-empty">暂无平行宇宙记录<br/>点击消息旁的 🦋 开启分支</div>
          <div id="bb-par-list"></div>
        </div>

        <!-- 命运盘 -->
        <div id="bb-tab-fate" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:center;">
            <button class="bb-big-btn" id="bb-btn-roll-fate">🎲 转动命运之轮</button>
          </div>
          <div id="bb-fate-result" class="bb-box" style="text-align:center;">点击上方按钮，让命运降临...</div>
          <div style="margin-top:20px;">
            <h4style="color:var(--bb-primary);margin-bottom:12px;border-bottom:1px solid var(--bb-border);padding-bottom:8px;">📜 命运历史</h4>
            <div id="bb-fate-history-list"></div>
          </div>
        </div>

        <!-- Burning Star Chat -->
        <div id="bb-tab-ooc" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
            <button class="bb-sm-btn" id="bb-btn-open-ooc-win">💬 打开对话窗口</button>
            <button class="bb-sm-btn" id="bb-btn-export-ooc">📤 导出聊天</button>
            <button class="bb-sm-btn" id="bb-btn-clear-ooc">🗑️ 清空历史</button>
          </div>
          <div id="bb-ooc-preview" class="bb-box" style="min-height:200px;max-height:400px;overflow-y:auto;">
            <div class="bb-empty">这里是跨越次元的聊天窗口<br/>点击上方按钮，和ta聊聊剧本之外的故事吧！</div>
          </div>
        </div>

        <!-- 世界频段 -->
        <div id="bb-tab-world" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;">
            <button class="bb-sm-btn" id="bb-btn-add-feed">➕ 添加消息</button>
            <button class="bb-sm-btn" id="bb-btn-gen-feed">🎲 生成消息</button>
            <button class="bb-sm-btn" id="bb-btn-clear-feed">🗑️ 清空</button>
          </div>
          <div class="bb-marquee-container">
            <div id="bb-marquee">🌍 世界频段广播中...</div>
          </div>
          <div id="bb-world-feed-list" style="max-height:400px;overflow-y:auto;"></div>
        </div>

        <!-- 🖼️ 画廊 -->
        <div id="bb-tab-gallery" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
            <button class="bb-sm-btn" id="bb-btn-gen-gallery-img">🎨 手动生图</button>
            <button class="bb-sm-btn" id="bb-btn-clear-gallery">🗑️ 清空画廊</button>
          </div>
          <div id="bb-gallery-empty" class="bb-empty">暂无图片<br/>通过日记配图、破墙聊天等功能生成图片</div>
          <div id="bb-gallery-grid" class="bb-gallery-grid"></div>
        </div>

        <!-- 💕 情侣空间 -->
        <div id="bb-tab-couple" class="bb-tab-panel" style="display:none;">
          ${buildCoupleSpaceHTML()}
        </div>

        <!-- 🏆 成就殿堂 -->
        <div id="bb-tab-achievements" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;text-align:center;">
            <div style="font-size:14px;color:var(--bb-text-muted);">已解锁 <span id="bb-ach-count" style="color:var(--bb-primary);font-weight:bold;">0</span> /<span id="bb-ach-total">12</span></div>
          </div>
          <div id="bb-ach-list"></div>
        </div>

      </div>
    </div>
  `;
}

// ============================================
// 主页布局构建（3种布局）
// ============================================

function buildHomeLayout(layout) {
  switch (layout) {
    case 'dashboard':
      return buildHomeDashboard();
    case 'minimalist':
      return buildHomeMinimalist();
    case 'together':
    default:
      return buildHomeTogether();
  }
}

//布局1：一起听（原版）
function buildHomeTogether() {
  return `
    <div class="bb-home-card bb-home-together" id="bb-home-card">
      <!--顶部：头像 + 链接 + 名字 -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="bb-home-avatar bb-avatar-clickable" id="bb-home-user-avatar" title="点击更换头像">👤</div>
          <div>
            <div id="bb-home-user-name" style="font-size:16px;font-weight:bold;color:var(--bb-text-bright);">用户名</div></div>
        </div><div id="bb-home-link-emoji" contenteditable="true" style="font-size:40px;cursor:pointer;user-select:none;" title="点击编辑">💕</div>

        <div style="display:flex;align-items:center;gap:12px;">
          <div style="text-align:right;">
            <div id="bb-home-char-name" style="font-size:16px;font-weight:bold;color:var(--bb-text-bright);">角色名</div>
          </div>
          <div class="bb-home-avatar bb-avatar-clickable" id="bb-home-char-avatar" title="点击更换头像">🎭</div>
        </div>
      </div>

      <!-- 气泡对话 -->
      <div style="margin-bottom:20px;">
        <div style="display:flex;justify-content:flex-start;margin-bottom:12px;">
          <div id="bb-home-user-bubble" contenteditable="true" title="点击编辑">今天也要开心鸭~</div>
        </div>
        <div style="display:flex;justify-content:flex-end;">
          <div id="bb-home-char-bubble" contenteditable="true" title="点击编辑">嗯，一起加油！</div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="bb-home-stats">
        <div style="display:flex;justify-content:space-around;text-align:center;">
          <div>
            <div id="bb-home-msg-count" class="bb-stat-number">0</div>
            <div class="bb-stat-label">💬 已聊天</div>
          </div>
          <div>
            <div id="bb-home-time-count" class="bb-stat-number">0</div>
            <div class="bb-stat-label">⏱️ 分钟</div>
          </div>
        </div>
        <div style="margin-top:16px;text-align:center;">
          <div style="font-size:14px;color:var(--bb-text-muted);">🎵 正在一起听</div>
          <div id="bb-home-radio-text" contenteditable="true" style="font-size:18px;color:var(--bb-text-bright);margin-top:8px;cursor:text;text-align:center;" title="点击编辑">骨与血电台</div>
        </div>
      </div>

      <!-- 背景图设置 + 保存 -->
      <div style="margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <button class="bb-sm-btn" id="bb-btn-set-home-bg">🖼️ 设置背景图</button>
        <button class="bb-sm-btn" id="bb-btn-save-home">💾 保存首页配置</button>
      </div>
    </div>
  `;
}

// 布局2：仪表盘
function buildHomeDashboard() {
  return `
    <div class="bb-home-card bb-home-dashboard" id="bb-home-card">
      <!-- 顶部概览 -->
      <div class="bb-dashboard-header">
        <div class="bb-dashboard-avatar-row">
          <div class="bb-home-avatar bb-avatar-clickable" id="bb-home-user-avatar" title="点击更换头像">👤</div>
          <div id="bb-home-link-emoji" contenteditable="true" style="font-size:32px;cursor:pointer;" title="点击编辑">💕</div>
          <div class="bb-home-avatar bb-avatar-clickable" id="bb-home-char-avatar" title="点击更换头像">🎭</div>
        </div>
        <div style="text-align:center;margin-top:8px;">
          <span id="bb-home-user-name" style="font-weight:bold;color:var(--bb-text-bright);">用户名</span><span style="color:var(--bb-text-muted);margin:0 8px;">&</span>
          <span id="bb-home-char-name" style="font-weight:bold;color:var(--bb-text-bright);">角色名</span>
        </div>
      </div>

      <!-- 数据卡片网格 -->
      <div class="bb-dashboard-grid">
        <div class="bb-dash-card">
          <div class="bb-dash-icon">💬</div>
          <div id="bb-home-msg-count" class="bb-dash-value">0</div>
          <div class="bb-dash-label">聊天消息</div>
        </div>
        <div class="bb-dash-card">
          <div class="bb-dash-icon">⏱️</div>
          <div id="bb-home-time-count" class="bb-dash-value">0</div>
          <div class="bb-dash-label">分钟</div>
        </div>
        <div class="bb-dash-card">
          <div class="bb-dash-icon">🌟</div>
          <div id="bb-home-scrap-count" class="bb-dash-value">0</div>
          <div class="bb-dash-label">收藏语录</div>
        </div>
        <div class="bb-dash-card">
          <div class="bb-dash-icon">📖</div>
          <div id="bb-home-diary-count" class="bb-dash-value">0</div>
          <div class="bb-dash-label">日记篇数</div>
        </div></div>

      <!-- 快捷功能区 -->
      <div class="bb-dashboard-quick">
        <h4 style="color:var(--bb-primary);margin-bottom:10px;">⚡ 快捷操作</h4>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="bb-sm-btn bb-quick-action" data-action="diary">📖 写日记</button>
          <button class="bb-sm-btn bb-quick-action" data-action="fate">🎲 命运骰</button>
          <button class="bb-sm-btn bb-quick-action" data-action="ooc">💬 聊天</button>
          <button class="bb-sm-btn bb-quick-action" data-action="weather">☁️ 环境</button>
          <button class="bb-sm-btn bb-quick-action" data-action="vibe">❤️ 氛围</button>
          <button class="bb-sm-btn bb-quick-action" data-action="genimg">🎨 生图</button>
        </div>
      </div>

      <!-- 最近日记预览 -->
      <div class="bb-dashboard-recent">
        <h4 style="color:var(--bb-primary);margin-bottom:10px;">📖 最近日记</h4>
        <div id="bb-home-recent-diary" style="color:var(--bb-text-muted);font-size:13px;">暂无日记</div></div>

      <!-- 气泡（可编辑） -->
      <div style="margin-top:16px;">
        <div style="display:flex;justify-content:flex-start;margin-bottom:8px;">
          <div id="bb-home-user-bubble" contenteditable="true" title="点击编辑">今天也要开心鸭~</div>
        </div>
        <div style="display:flex;justify-content:flex-end;">
          <div id="bb-home-char-bubble" contenteditable="true" title="点击编辑">嗯，一起加油！</div>
        </div>
      </div><div style="margin-top:12px;text-align:center;">
        <div style="font-size:13px;color:var(--bb-text-muted);">🎵 正在一起听</div>
        <div id="bb-home-radio-text" contenteditable="true" style="font-size:16px;color:var(--bb-text-bright);margin-top:4px;" title="点击编辑">骨与血电台</div>
      </div><div style="margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <button class="bb-sm-btn" id="bb-btn-set-home-bg">🖼️ 设置背景图</button>
        <button class="bb-sm-btn" id="bb-btn-save-home">💾 保存首页配置</button>
      </div>
    </div>
  `;
}

// 布局3：极简
function buildHomeMinimalist() {
  return `
    <div class="bb-home-card bb-home-minimalist" id="bb-home-card">
      <div class="bb-mini-center">
        <div class="bb-mini-avatars">
          <div class="bb-home-avatar bb-avatar-clickable bb-mini-avatar-large" id="bb-home-user-avatar" title="点击更换头像">👤</div>
          <div id="bb-home-link-emoji" contenteditable="true" class="bb-mini-link" title="点击编辑">💕</div>
          <div class="bb-home-avatar bb-avatar-clickable bb-mini-avatar-large" id="bb-home-char-avatar" title="点击更换头像">🎭</div>
        </div>

        <div class="bb-mini-names">
          <span id="bb-home-user-name">用户名</span>
          <span class="bb-mini-sep">×</span>
          <span id="bb-home-char-name">角色名</span>
        </div>

        <div class="bb-mini-stats">
          <span><span id="bb-home-msg-count">0</span> 条对话</span>
          <span>·</span>
          <span><span id="bb-home-time-count">0</span> 分钟</span>
        </div>

        <div id="bb-home-radio-text" contenteditable="true" class="bb-mini-radio" title="点击编辑">骨与血电台</div>

        <!--隐藏的气泡（保留数据兼容性） -->
        <div style="display:none;">
          <div id="bb-home-user-bubble" contenteditable="true">今天也要开心鸭~</div>
          <div id="bb-home-char-bubble" contenteditable="true">嗯，一起加油！</div>
        </div>
      </div>

      <div style="margin-top:24px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <button class="bb-sm-btn" id="bb-btn-set-home-bg">🖼️ 设置背景图</button>
        <button class="bb-sm-btn" id="bb-btn-save-home">💾 保存配置</button>
      </div>
    </div>
  `;
}

// ============================================
// 情侣空间 HTML
// ============================================

function buildCoupleSpaceHTML() {
  return `
    <div class="bb-couple-container">
      <!-- 情侣空间子Tab -->
      <div class="bb-couple-tabs">
        <div class="bb-couple-tab active" data-ctab="messages">💌 留言板</div>
        <div class="bb-couple-tab" data-ctab="letters">💝 情书</div>
        <div class="bb-couple-tab" data-ctab="anniversaries">📅 纪念日</div>
        <div class="bb-couple-tab" data-ctab="photos">📸 照片墙</div>
      </div>

      <!-- 留言板 -->
      <div id="bb-couple-messages" class="bb-couple-panel active">
        <div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="bb-sm-btn" id="bb-btn-couple-msg">✏️ 写留言</button>
          <button class="bb-sm-btn" id="bb-btn-couple-ai-msg">🤖 让TA留言</button>
        </div>
        <div id="bb-couple-msg-list" class="bb-couple-list"><div class="bb-empty">还没有留言哦~<br/>写下第一条留言吧 💕</div>
        </div>
      </div>

      <!-- 情书 -->
      <div id="bb-couple-letters" class="bb-couple-panel" style="display:none;">
        <div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="bb-sm-btn" id="bb-btn-write-letter">✏️ 写情书</button>
          <button class="bb-sm-btn" id="bb-btn-ai-letter">🤖 让TA写情书</button>
        </div>
        <div id="bb-couple-letter-list" class="bb-couple-list">
          <div class="bb-empty">还没有情书~<br/>写下你的心意吧 💝</div>
        </div>
      </div>

      <!-- 纪念日 -->
      <div id="bb-couple-anniversaries" class="bb-couple-panel" style="display:none;">
        <div style="margin-bottom:12px;display:flex;gap:8px;">
          <button class="bb-sm-btn" id="bb-btn-add-anniversary">➕ 添加纪念日</button>
        </div>
        <div id="bb-couple-anni-list" class="bb-couple-list">
          <div class="bb-empty">还没有纪念日~<br/>记录你们的重要时刻吧 📅</div>
        </div>
      </div>

      <!-- 照片墙 -->
      <div id="bb-couple-photos" class="bb-couple-panel" style="display:none;">
        <div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="bb-sm-btn" id="bb-btn-couple-upload-photo">📷 上传照片</button>
          <button class="bb-sm-btn" id="bb-btn-couple-gen-photo">🎨 AI生成照片</button>
        </div>
        <div id="bb-couple-photo-grid" class="bb-gallery-grid">
          <div class="bb-empty">还没有照片~<br/>上传或生成你们的回忆吧 📸</div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// 表情包系统
// ============================================

function showStickerPicker(targetInputId) {
  // 移除已有的选择器
  $('#bb-sticker-picker').remove();

  const packs = pluginData.sticker_packs || [];

  let tabsHtml = packs
    .map(
      (pack, i) =>
        `<div class="bb-sticker-tab ${i === 0 ? 'active' : ''}" data-pack-idx="${i}">${esc(pack.name)}</div>`,
    )
    .join('');
  tabsHtml += `<div class="bb-sticker-tab" data-action="manage-stickers">⚙️</div>`;

  const firstPack = packs[0];
  let gridHtml = '';
  if (firstPack && firstPack.stickers.length > 0) {
    gridHtml = firstPack.stickers
      .map(
        (s) =>
          `<div class="bb-sticker-item" data-sticker-id="${esc(s.id)}" title="${esc(s.alt || s.id)}">
            <img src="${esc(s.url)}" alt="${esc(s.alt || s.id)}" />
          </div>`,
      )
      .join('');
  } else {
    gridHtml = '<div class="bb-empty" style="padding:20px;">暂无表情包<br/>点击 ⚙️ 管理</div>';
  }

  const $picker = $(`
    <div id="bb-sticker-picker" class="bb-sticker-picker">
      <div class="bb-sticker-tabs-row">${tabsHtml}</div>
      <div class="bb-sticker-grid" id="bb-sticker-grid-content">${gridHtml}</div>
    </div>
  `);

  // 插入到目标输入框附近
  $(`#${targetInputId}`).parent().append($picker);

  // Tab切换
  $picker.on('click', '.bb-sticker-tab', function () {
    const action = $(this).data('action');
    if (action === 'manage-stickers') {
      showStickerManager();
      return;
    }

    const idx = $(this).data('pack-idx');
    $picker.find('.bb-sticker-tab').removeClass('active');
    $(this).addClass('active');

    const pack = packs[idx];
    let html = '';
    if (pack && pack.stickers.length > 0) {
      html = pack.stickers
        .map(
          (s) =>
            `<div class="bb-sticker-item" data-sticker-id="${esc(s.id)}" title="${esc(s.alt || s.id)}">
              <img src="${esc(s.url)}" alt="${esc(s.alt || s.id)}" />
            </div>`,
        )
        .join('');
    } else {
      html = '<div class="bb-empty" style="padding:20px;">此表情包为空</div>';
    }
    $('#bb-sticker-grid-content').html(html);
  });

  // 点击表情包插入
  $picker.on('click', '.bb-sticker-item', function () {
    const stickerId = $(this).data('sticker-id');
    const $input = $(`#${targetInputId}`);
    const current = $input.val();
    $input.val(current + `[sticker:${stickerId}]`);$picker.remove();
  });

  // 点击外部关闭
  setTimeout(() => {
    $(document).one('click', function (e) {
      if (!$(e.target).closest('#bb-sticker-picker').length) {
        $('#bb-sticker-picker').remove();
      }
    });
  }, 100);
}

function showStickerManager() {
  $('#bb-sticker-picker').remove();

  const modal = $(`
    <div class="bb-modal-overlay">
      <div class="bb-modal-content" style="max-width:500px;max-height:80vh;overflow-y:auto;">
        <h3 style="color:var(--bb-primary);margin:0 0 16px;text-align:center;">😀 表情包管理</h3>

        <div style="margin-bottom:16px;">
          <h4 style="color:var(--bb-text);font-size:14px;margin-bottom:8px;">添加表情包</h4>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <input id="bb-sticker-url" type="text" class="text_pole" placeholder="表情包图片URL" style="width:100%;padding:6px;" />
            <input id="bb-sticker-alt" type="text" class="text_pole" placeholder="表情包名称/描述" style="width:100%;padding:6px;" />
            <div style="display:flex;gap:8px;">
              <button class="bb-sm-btn" id="bb-btn-add-sticker" style="flex:1;">➕ 添加</button>
              <button class="bb-sm-btn" id="bb-btn-add-sticker-file" style="flex:1;">📁 上传文件</button>
            </div>
            <input type="file" id="bb-sticker-file-input" accept="image/*" style="display:none;" />
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <h4 style="color:var(--bb-text);font-size:14px;margin-bottom:8px;">批量导入（JSON）</h4>
          <textarea id="bb-sticker-batch" class="text_pole" rows="3" placeholder='[{"url":"https://...","alt":"开心"},...]' style="width:100%;font-size:11px;"></textarea>
          <button class="bb-sm-btn" id="bb-btn-batch-sticker" style="width:100%;margin-top:4px;">📥 批量导入</button>
        </div>

        <div style="margin-bottom:16px;">
          <h4 style="color:var(--bb-text);font-size:14px;margin-bottom:8px;">当前表情包</h4>
          <div id="bb-sticker-manager-list" style="display:flex;flex-wrap:wrap;gap:8px;"></div>
        </div>

        <button class="bb-sm-btn" id="bb-sticker-manager-close" style="width:100%;background:var(--bb-bg-card);">关闭</button>
      </div>
    </div>
  `);

  $('body').append(modal);
  refreshStickerManagerList();

  // 添加单个表情包
  modal.find('#bb-btn-add-sticker').on('click', function () {
    const url = $('#bb-sticker-url').val().trim();
    const alt = $('#bb-sticker-alt').val().trim();
    if (!url) {
      toastr.warning('请输入表情包URL');
      return;
    }
    addSticker(url, alt ||'sticker');
    $('#bb-sticker-url').val('');
    $('#bb-sticker-alt').val('');refreshStickerManagerList();
  });

  // 文件上传
  modal.find('#bb-btn-add-sticker-file').on('click', () => $('#bb-sticker-file-input').click());
  modal.find('#bb-sticker-file-input').on('change', function () {
    const file = this.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toastr.error('表情包文件不能超过2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      addSticker(e.target.result, file.name.replace(/\.[^.]+$/, ''));
      refreshStickerManagerList();
      toastr.success('表情包已添加');
    };
    reader.readAsDataURL(file);
  });

  // 批量导入
  modal.find('#bb-btn-batch-sticker').on('click', function () {
    try {
      const arr = JSON.parse($('#bb-sticker-batch').val());
      if (!Array.isArray(arr)) throw new Error('格式错误');
      arr.forEach((item) => {
        if (item.url) addSticker(item.url, item.alt || 'sticker');
      });
      refreshStickerManagerList();
      $('#bb-sticker-batch').val('');
      toastr.success(`已导入 ${arr.length} 个表情包`);
    } catch (e) {
      toastr.error('JSON格式错误，请检查');
    }
  });

  // 关闭
  modal.find('#bb-sticker-manager-close').on('click', () => modal.remove());
  modal.on('click', function (e) {
    if ($(e.target).hasClass('bb-modal-overlay')) modal.remove();
  });
}

function addSticker(url, alt) {
  const pack = pluginData.sticker_packs[0]; // 默认包
  const id = 'stk_' + generateId();
  pack.stickers.push({ id, url, alt });
  saveChatData();
}

function removeSticker(stickerId) {
  pluginData.sticker_packs.forEach((pack) => {
    pack.stickers = pack.stickers.filter((s) => s.id !== stickerId);
  });
  saveChatData();
}

function refreshStickerManagerList() {
  const $list = $('#bb-sticker-manager-list');
  $list.empty();

  const allStickers = [];
  pluginData.sticker_packs.forEach((pack) => {
    pack.stickers.forEach((s) => allStickers.push(s));
  });

  if (allStickers.length === 0) {
    $list.html('<div class="bb-empty" style="width:100%;padding:20px;">暂无表情包</div>');
    return;
  }

  allStickers.forEach((s) => {
    $list.append(`
      <div class="bb-sticker-manage-item" data-sticker-id="${esc(s.id)}">
        <img src="${esc(s.url)}" alt="${esc(s.alt)}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;" />
        <div style="font-size:10px;color:var(--bb-text-muted);text-align:center;margin-top:2px;">${esc(s.alt || s.id)}</div><span class="bb-sticker-del" data-sticker-id="${esc(s.id)}" title="删除">✖</span>
      </div>
    `);
  });

  $list.find('.bb-sticker-del').on('click', function (e) {
    e.stopPropagation();
    const id = $(this).data('sticker-id');
    removeSticker(id);
    refreshStickerManagerList();
    toastr.info('已删除表情包');
  });
}

// 获取表情包列表文本（用于AI系统提示词）
function getStickerListForPrompt() {
  const allStickers = [];
  pluginData.sticker_packs.forEach((pack) => {
    pack.stickers.forEach((s) => allStickers.push(s));
  });

  if (allStickers.length === 0) return '';

  return (
    '\n\n可用表情包列表（你可以在回复中用[sticker:id] 来发送表情包）：\n' +
    allStickers.map((s) => `[sticker:${s.id}] - ${s.alt || '表情'}`).join('\n')
  );
}
// ============================================
// 主面板事件绑定
// ============================================

function bindMainPanelEvents() {
  // 关闭按钮
  $('#bb-close-btn').on('click', () => $('#bb-main-panel').fadeOut(200));

  // Tab切换
  $(document).off('click.bbtab').on('click.bbtab', '.bb-tab', function () {
    const tab = $(this).data('tab');
    $('.bb-tab').removeClass('active');
    $(this).addClass('active');
    $('.bb-tab-panel').hide();
    $(`#bb-tab-${tab}`).show();
  });

  // 情侣空间子Tab切换
  $(document).off('click.bbctab').on('click.bbctab', '.bb-couple-tab', function () {
    const ctab = $(this).data('ctab');
    $('.bb-couple-tab').removeClass('active');
    $(this).addClass('active');
    $('.bb-couple-panel').hide();
    $(`#bb-couple-${ctab}`).show();
  });

  // 首页：头像点击（委托事件，无按钮）
  $(document).off('click.bbavatar').on('click.bbavatar', '.bb-avatar-clickable', function () {
    const avatarEl = $(this);
    const isUser = $(this).attr('id') === 'bb-home-user-avatar';

    const modal = $(`
      <div class="bb-modal-overlay">
        <div class="bb-modal-content">
          <h3 style="color:var(--bb-primary);margin:0 0 16px;text-align:center;">设置${isUser ? '用户' : '角色'}头像</h3>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <button class="bb-big-btn" id="bb-avatar-url" style="width:100%;">🔗 输入URL</button>
            <button class="bb-big-btn" id="bb-avatar-file" style="width:100%;">📁 上传文件</button>
            <button class="bb-sm-btn" id="bb-avatar-cancel" style="width:100%;background:var(--bb-bg-card);">取消</button>
          </div>
        </div>
      </div>
    `);

    $('body').append(modal);

    modal.find('#bb-avatar-url').on('click', function () {
      modal.remove();
      const url = prompt('请输入头像URL:');
      if (url) {
        avatarEl.html(`<img src="${url}" style="width:100%;height:100%;object-fit:cover;" />`);
        if (isUser) pluginData.home_config.user_avatar = url;
        else pluginData.home_config.char_avatar = url;
        saveChatData();
        toastr.success('头像已更新');
      }
    });

    modal.find('#bb-avatar-file').on('click', function () {
      modal.remove();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          toastr.error('文件过大，请选择小于5MB的图片');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataURL = ev.target.result;
          avatarEl.html(`<img src="${dataURL}" style="width:100%;height:100%;object-fit:cover;" />`);
          if (isUser) pluginData.home_config.user_avatar = dataURL;
          else pluginData.home_config.char_avatar = dataURL;
          saveChatData();
          toastr.success('头像已上传');
        };
        reader.readAsDataURL(file);
      };
      input.click();
    });

    modal.find('#bb-avatar-cancel').on('click', () => modal.remove());
    modal.on('click', function (e) {
      if ($(e.target).hasClass('bb-modal-overlay')) modal.remove();
    });
  });

  // 首页：设置背景图
  $(document).off('click.bbbg').on('click.bbbg', '#bb-btn-set-home-bg', function () {
    const modal = $(`
      <div class="bb-modal-overlay">
        <div class="bb-modal-content">
          <h3 style="color:var(--bb-primary);margin:0 0 16px;text-align:center;">🖼️ 设置首页背景图</h3>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <input id="bb-home-bg-url" type="text" class="text_pole" placeholder="输入背景图URL..." style="width:100%;padding:8px;" value="${esc(pluginData.home_config.background_url || '')}" />
            <button class="bb-big-btn" id="bb-home-bg-apply" style="width:100%;">✅ 应用</button>
            <button class="bb-sm-btn" id="bb-home-bg-clear" style="width:100%;">🗑️ 清除背景</button>
            <button class="bb-sm-btn" id="bb-home-bg-cancel" style="width:100%;background:var(--bb-bg-card);">取消</button>
          </div>
        </div>
      </div>
    `);

    $('body').append(modal);

    modal.find('#bb-home-bg-apply').on('click', function () {
      const url = $('#bb-home-bg-url').val().trim();
      pluginData.home_config.background_url = url;
      saveChatData();
      applyHomeBackground();
      modal.remove();
      toastr.success('背景图已设置');
    });

    modal.find('#bb-home-bg-clear').on('click', function () {
      pluginData.home_config.background_url = '';
      saveChatData();
      applyHomeBackground();
      modal.remove();
      toastr.info('背景图已清除');
    });

    modal.find('#bb-home-bg-cancel').on('click', () => modal.remove());
    modal.on('click', function (e) {
      if ($(e.target).hasClass('bb-modal-overlay')) modal.remove();
    });
  });

  // 首页：保存配置
  $(document).off('click.bbsavehome').on('click.bbsavehome', '#bb-btn-save-home', function () {
    pluginData.home_config.link_emoji = $('#bb-home-link-emoji').text();
    pluginData.home_config.user_bubble = $('#bb-home-user-bubble').text();
    pluginData.home_config.char_bubble = $('#bb-home-char-bubble').text();
    pluginData.home_config.radio_text = $('#bb-home-radio-text').text();
    saveChatData();
    toastr.success('💾 首页配置已保存');
  });

  // 仪表盘快捷操作
  $(document).off('click.bbquick').on('click.bbquick', '.bb-quick-action', function () {
    const action = $(this).data('action');
    switch (action) {
      case 'diary': generateDiary(); break;
      case 'fate': rollFate(); break;
      case 'ooc': $('#bb-ooc-win').show(); break;
      case 'weather': generateWeather(); break;
      case 'vibe': generateVibe(); break;
      case 'genimg':
        const p = prompt('输入生图提示词:');
        if (p) generateAndSaveImage(p, 'manual');
        break;
    }
  });

  // 导出按钮
  $(document).off('click.bbexmd').on('click.bbexmd', '#bb-btn-export-md', exportAsMarkdown);
  $(document).off('click.bbexjson').on('click.bbexjson', '#bb-btn-export-json', exportAsJSON);
  $(document).off('click.bbexposter').on('click.bbexposter', '#bb-btn-export-poster', showPosterEditor);

  // 生成按钮
  $(document).off('click.bbgendiary').on('click.bbgendiary', '#bb-btn-gen-diary-tab', generateDiary);
  $(document).off('click.bbgendiaryimg').on('click.bbgendiaryimg', '#bb-btn-gen-diary-img', async function () {
    if (pluginData.diary_blood.length === 0) {
      toastr.warning('请先生成日记');
      return;
    }
    const lastDiary = pluginData.diary_blood[pluginData.diary_blood.length - 1];
    await generateAndSaveImage(lastDiary.content.substring(0, 200), 'diary');
  });

  $(document).off('click.bbaddnpc').on('click.bbaddnpc', '#bb-btn-add-npc', () => {
    const name = prompt('输入NPC名称:');
    if (!name) return;
    if (pluginData.npc_status[name]) {
      toastr.info('该NPC已存在');
      return;
    }
    pluginData.npc_status[name] = { description: '等待窥探...', lastUpdate: '' };
    saveChatData();
    renderIntel();
    toastr.success(`➕ 已添加NPC: ${name}`);
  });

  $(document).off('click.bbautonpc').on('click.bbautonpc', '#bb-btn-auto-npc', autoNPCPeek);
  $(document).off('click.bbgenweather').on('click.bbgenweather', '#bb-btn-gen-weather-tab', generateWeather);
  $(document).off('click.bbgenvibe').on('click.bbgenvibe', '#bb-btn-gen-vibe-tab', generateVibe);
  $(document).off('click.bbrollfate').on('click.bbrollfate', '#bb-btn-roll-fate', rollFate);

  // 破墙聊天室
  $(document).off('click.bbopenooc').on('click.bbopenooc', '#bb-btn-open-ooc-win', () => $('#bb-ooc-win').show());
  $(document).off('click.bbexportooc').on('click.bbexportooc', '#bb-btn-export-ooc', exportOOCChat);
  $(document).off('click.bbclearooc').on('click.bbclearooc', '#bb-btn-clear-ooc', () => {
    if (!confirm('确认清空Burning Star Chat历史?')) return;
    pluginData.ooc_chat = [];
    oocSession.history = [];
    saveChatData();
    renderOOCPreview();
    toastr.info('🗑️ 已清空');
  });

  // 世界频段
  $(document).off('click.bbaddfeed').on('click.bbaddfeed', '#bb-btn-add-feed', () => {
    const content = prompt('输入消息内容:');
    if (!content) return;
    pluginData.world_feed.push({
      type: 'custom',
      content,
      timestamp: new Date().toLocaleString('zh-CN'),});
    saveChatData();
    renderWorldFeed();
    updateMarquee();
  });

  $(document).off('click.bbgenfeed').on('click.bbgenfeed', '#bb-btn-gen-feed', generateWorldFeed);
  $(document).off('click.bbclearfeed').on('click.bbclearfeed', '#bb-btn-clear-feed', () => {
    if (!confirm('确认清空世界频段?')) return;
    pluginData.world_feed = [];
    saveChatData();
    renderWorldFeed();
    updateMarquee();
    toastr.info('🗑️ 已清空');
  });

  // 画廊
  $(document).off('click.bbgenimg').on('click.bbgenimg', '#bb-btn-gen-gallery-img', async function () {
    const p = prompt('输入生图提示词:');
    if (p) await generateAndSaveImage(p, 'manual');
  });$(document).off('click.bbcleargallery').on('click.bbcleargallery', '#bb-btn-clear-gallery', () => {
    if (!confirm('确认清空画廊?')) return;
    pluginData.gallery = [];
    saveChatData();
    renderGallery();
    toastr.info('🗑️ 画廊已清空');
  });

  // 情侣空间事件
  bindCoupleSpaceEvents();
}

// ============================================
// 首页背景图
// ============================================

function applyHomeBackground() {
  const url = pluginData.home_config.background_url;
  const $card = $('#bb-home-card');
  if (url) {
    $card.css({
      'background-image': `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${url})`,
      'background-size': 'cover',
      'background-position': 'center',
    });
  } else {
    $card.css({
      'background-image': 'none',
      'background': 'var(--bb-bg-secondary)',
    });
  }
}

// ============================================
// 蝴蝶窗口（平行宇宙）— 修复初始隐藏
// ============================================

function injectButterflyWindow() {
  if ($('#bb-bf-win').length > 0) return;

  $('body').append(`
    <div id="bb-bf-win" class="bb-sub-window" style="display:none;">
      <div class="bb-bf-header">
        <div style="font-size:16px;font-weight:bold;">🦋 平行宇宙</div>
        <button id="bb-bf-close">✖</button>
      </div>
      <div id="bb-bf-origin" style="background:var(--bb-bg-secondary);padding:12px;border-bottom:1px solid var(--bb-border);color:var(--bb-text-muted);font-size:13px;max-height:80px;overflow-y:auto;"></div>
      <div id="bb-bf-chat" style="flex:1;overflow-y:auto;padding:12px;"></div>
      <div style="background:var(--bb-bg-secondary);padding:12px;border-top:1px solid var(--bb-border);display:flex;gap:8px;">
        <input id="bb-bf-input" type="text" placeholder="输入消息..." style="flex:1;padding:8px;background:var(--bb-bg-card);border:1px solid var(--bb-border-light);color:var(--bb-text);border-radius:4px;" />
        <button id="bb-bf-send" class="bb-sm-btn" style="background:var(--bb-primary);color:#fff;">发送</button>
        <button id="bb-bf-export" class="bb-sm-btn" title="导出对话">📄</button>
      </div>
    </div>
  `);

  // 确保隐藏
  $('#bb-bf-win').hide();

  $('#bb-bf-close').on('click', () => $('#bb-bf-win').hide());
  $('#bb-bf-send').on('click', sendBfMsg);
  $('#bb-bf-input').on('keypress', (e) => { if (e.which === 13) sendBfMsg(); });
  $('#bb-bf-export').on('click', exportBfChat);
}

function openBfWin(messageId) {
  const ctx = getContext();
  const msg = ctx.chat[messageId];
  if (!msg) { toastr.error('未找到消息'); return; }

  butterflySession = {
    active: true,
    originFloor: messageId,
    originText: msg.mes,
    history: [],
  };

  $('#bb-bf-origin').html(`<b>原文(#${messageId}):</b> ${esc(msg.mes.substring(0, 200))}${msg.mes.length > 200 ? '...' : ''}`);
  $('#bb-bf-chat').empty();
  $('#bb-bf-win').show();
  toastr.info('🦋 平行宇宙已开启，输入你的选择...');
}

async function sendBfMsg() {
  const input = $('#bb-bf-input');
  const userMsg = input.val().trim();
  if (!userMsg) return;

  input.val('');
  addBfBubble('user', userMsg);
  butterflySession.history.push({ role: 'user', content: userMsg });

  if (butterflySession.history.length === 1) {
    await genBfFirst(userMsg);
  } else {
    const preset = getActivePreset();
    const aiReply = await callSubAPI([
      { role: 'system', content: preset.prompts.butterfly },
      ...butterflySession.history,
    ], 500);
    if (aiReply) {
      addBfBubble('assistant', aiReply);
      butterflySession.history.push({ role: 'assistant', content: aiReply });
    }
  }
}

async function genBfFirst(userChoice) {
  toastr.info('🦋 生成平行宇宙中...');
  const preset = getActivePreset();
  const p = `${preset.prompts.butterfly}\n\n原文:\n${butterflySession.originText}\n\n用户选择:\n${userChoice}`;
  const result = await callSubAPI([{ role: 'system', content: p }], 600);

  if (result) {
    addBfBubble('assistant', result);
    butterflySession.history.push({ role: 'assistant', content: result });pluginData.parallel_universes.push({
      floor: butterflySession.originFloor,
      origin: butterflySession.originText,
      content: result,
      date: new Date().toLocaleString('zh-CN'),
    });
    saveChatData();
    renderParallel();
    toastr.success('🦋 平行宇宙已生成！');
  }
}

function addBfBubble(role, text) {
  const isUser = role === 'user';
  const bubble = `
    <div style="display:flex;justify-content:${isUser ? 'flex-end' : 'flex-start'};margin-bottom:12px;">
      <div class="bb-chat-bubble ${isUser ? 'bb-bubble-user' : 'bb-bubble-ai'}">${renderSafeHTML(text)}</div>
    </div>
  `;
  $('#bb-bf-chat').append(bubble);$('#bb-bf-chat').scrollTop($('#bb-bf-chat')[0].scrollHeight);
}

function exportBfChat() {
  if (butterflySession.history.length === 0) {
    toastr.warning('暂无对话');
    return;
  }
  let md = `# 🦋 平行宇宙对话\n\n## 原文 (#${butterflySession.originFloor})\n${butterflySession.originText}\n\n## 对话记录\n\n`;
  butterflySession.history.forEach(m => {
    md += `**${m.role === 'user' ? '你' : '角色'}:** ${m.content}\n\n`;
  });
  dl(`butterfly_${butterflySession.originFloor}_${Date.now()}.md`, md, 'text/markdown');
  toastr.success('📄 已导出蝴蝶对话');
}

// ============================================
// 破墙聊天室（Burning Star Chat）— 修复初始隐藏 + HTML渲染 + 表情包+ 导出
// ============================================

function injectOOCWindow() {
  if ($('#bb-ooc-win').length > 0) return;

  $('body').append(`
    <div id="bb-ooc-win" class="bb-sub-window" style="display:none;">
      <div class="bb-ooc-header">
        <div style="font-size:16px;font-weight:bold;">⭐ Burning Star Chat</div>
        <button id="bb-ooc-close">✖</button>
      </div>
      <div id="bb-ooc-chat" style="flex:1;overflow-y:auto;padding:12px;"></div>
      <div style="background:var(--bb-bg-secondary);padding:12px;border-top:1px solid var(--bb-border);display:flex;gap:8px;align-items:center;">
        <button id="bb-ooc-sticker-btn" class="bb-sm-btn" title="表情包" style="padding:8px;font-size:18px;">😀</button>
        <input id="bb-ooc-input" type="text" placeholder="在这里，你可以和TA聊聊剧本之外的故事..." style="flex:1;padding:8px;background:var(--bb-bg-card);border:1px solid var(--bb-border-light);color:var(--bb-text);border-radius:4px;" />
        <button id="bb-ooc-send" class="bb-sm-btn" style="background:var(--bb-primary);color:#fff;padding:8px 16px;">发送</button>
        <button id="bb-ooc-gen-img" class="bb-sm-btn" title="生成配图" style="padding:8px;">🎨</button>
      </div>
    </div>
  `);

  // 确保隐藏
  $('#bb-ooc-win').hide();

  $('#bb-ooc-close').on('click', () => $('#bb-ooc-win').hide());
  $('#bb-ooc-send').on('click', sendOOCMsg);
  $('#bb-ooc-input').on('keypress', (e) => { if (e.which === 13) sendOOCMsg(); });

  // 表情包按钮
  $('#bb-ooc-sticker-btn').on('click', function (e) {
    e.stopPropagation();
    showStickerPicker('bb-ooc-input');
  });

  // 生成配图
  $('#bb-ooc-gen-img').on('click', async function () {
    if (pluginData.ooc_chat.length === 0) {
      toastr.warning('请先进行对话');
      return;
    }
    const lastMsg = pluginData.ooc_chat[pluginData.ooc_chat.length - 1];
    const entry = await generateAndSaveImage(lastMsg.content.substring(0, 150), 'ooc');
    if (entry) {
      addOOCBubble('system', `<img src="${esc(entry.url)}" class="bb-chat-img" style="max-width:200px;border-radius:8px;" />`);
    }
  });

  renderOOCChat();
}

async function sendOOCMsg() {
  const input = $('#bb-ooc-input');
  const userMsg = input.val().trim();
  if (!userMsg) return;

  input.val('');

  pluginData.ooc_chat.push({
    role: 'user',
    content: userMsg,
    timestamp: new Date().toLocaleString('zh-CN'),
  });
  oocSession.history.push({ role: 'user', content: userMsg });

  addOOCBubble('user', userMsg);
  saveChatData();

  // 使用OOC独立预设
  const ctx = getContext();
  const oocPreset = getActiveOOCPreset();

  const systemPrompt = `${oocPreset.system_prompt}

当前角色名: ${ctx.name2|| '角色'}
用户名: ${ctx.name1 || '用户'}
真实时间: ${new Date().toLocaleString('zh-CN')}
${getStickerListForPrompt()}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...oocSession.history,
  ];

  const aiReply = await callSubAPI(
    messages,
    oocPreset.max_tokens || 500,
    oocPreset.temperature || 0.8
  );

  if (aiReply) {
    pluginData.ooc_chat.push({
      role: 'assistant',
      content: aiReply,
      timestamp: new Date().toLocaleString('zh-CN'),
    });
    oocSession.history.push({ role: 'assistant', content: aiReply });

    addOOCBubble('assistant', aiReply);
    saveChatData();
    renderOOCPreview();
  }
}

function addOOCBubble(role, text) {
  const isUser = role === 'user';
  const isSystem = role === 'system';
  let content;

  if (isSystem) {
    // 系统消息（如图片）直接渲染HTML
    content = text;
  } else {
    // 用户和AI消息用安全HTML渲染（支持markdown+表情包）
    content = renderSafeHTML(text);
  }

  const bubble = `
    <div style="display:flex;justify-content:${isSystem ? 'center' : (isUser ? 'flex-end' : 'flex-start')};margin-bottom:12px;">
      <div class="bb-chat-bubble ${isUser ? 'bb-bubble-user' : (isSystem ? 'bb-bubble-system' : 'bb-bubble-ai')}">${content}</div>
    </div>
  `;
  $('#bb-ooc-chat').append(bubble);
  $('#bb-ooc-chat').scrollTop($('#bb-ooc-chat')[0].scrollHeight);
}

function renderOOCChat() {
  $('#bb-ooc-chat').empty();
  pluginData.ooc_chat.forEach(m => {
    addOOCBubble(m.role, m.content);
  });
}

function renderOOCPreview() {
  const preview = $('#bb-ooc-preview');
  preview.empty();

  if (pluginData.ooc_chat.length === 0) {
    preview.html(`<div class="bb-empty">这里是跨越次元的聊天窗口<br/>点击上方按钮，和ta聊聊剧本之外的故事吧！</div>`);
    return;
  }

  pluginData.ooc_chat.slice(-5).forEach(m => {
    const isUser = m.role === 'user';
    preview.append(`
      <div style="display:flex;justify-content:${isUser ? 'flex-end' : 'flex-start'};margin-bottom:10px;">
        <div class="bb-chat-bubble ${isUser ? 'bb-bubble-user' : 'bb-bubble-ai'}" style="font-size:13px;">${renderSafeHTML(m.content)}</div>
      </div>
    `);
  });

  if (pluginData.ooc_chat.length > 5) {
    preview.prepend(`<div style="text-align:center;color:var(--bb-text-muted);font-size:12px;margin-bottom:12px;">... 仅显示最近5条，点击打开查看全部</div>`);
  }
}

function exportOOCChat() {
  if (pluginData.ooc_chat.length === 0) {
    toastr.warning('暂无聊天记录');
    return;
  }
  const ctx = getContext();
  const data = {
    exportTime: new Date().toISOString(),
    character: ctx.name2 || '角色',
    user: ctx.name1 || '用户',
    chatId: ctx.chatId,
    messages: pluginData.ooc_chat,
  };
  dl(`burning_star_chat_${Date.now()}.json`, JSON.stringify(data, null, 2), 'application/json');
  toastr.success('📤Burning Star Chat 已导出为JSON');
}

// ============================================
// 情侣空间逻辑
// ============================================

function bindCoupleSpaceEvents() {
  // 留言板
  $(document).off('click.bbcouplemsg').on('click.bbcouplemsg', '#bb-btn-couple-msg', function () {
    const msg = prompt('写下你的留言:');
    if (!msg) return;
    pluginData.couple_space.messages.push({
      from: 'user',
      content: msg,
      timestamp: new Date().toLocaleString('zh-CN'),
    });
    saveChatData();
    renderCoupleMessages();
    toastr.success('💌 留言已发送');
  });

  $(document).off('click.bbcoupleaimsg').on('click.bbcoupleaimsg', '#bb-btn-couple-ai-msg', async function () {
    const ctx = getContext();
    toastr.info(`💌 ${ctx.name2|| '角色'}正在写留言...`);
    const result = await callSubAPI([
      { role: 'system', content: `你是"${ctx.name2 || '角色'}"，给"${ctx.name1 || '用户'}"的情侣空间留言板写一条温暖的短消息（30-80字）。可以分享日常、表达思念、或者说些甜蜜的话。` },
    ], 200);
    if (result) {
      pluginData.couple_space.messages.push({
        from: 'char',
        content: result,
        timestamp: new Date().toLocaleString('zh-CN'),isAuto: true,
      });
      saveChatData();
      renderCoupleMessages();
      toastr.success(`💌 ${ctx.name2 || '角色'}留言了！`);
    }
  });

  // 情书
  $(document).off('click.bbwriteletter').on('click.bbwriteletter', '#bb-btn-write-letter', function () {
    showLetterEditor('user');
  });

  $(document).off('click.bbailetter').on('click.bbailetter', '#bb-btn-ai-letter', async function () {
    const ctx = getContext();
    toastr.info(`💝 ${ctx.name2 || '角色'}正在写情书...`);
    const result = await callSubAPI([
      { role: 'system', content: `你是"${ctx.name2 || '角色'}"，给"${ctx.name1 || '用户'}"写一封真挚的情书（100-300字）。用角色的语气和性格来写，要有真情实感。` },
    ], 600);
    if (result) {
      pluginData.couple_space.love_letters.push({
        id: generateId(),
        from: 'char',
        to: 'user',
        content: result,
        timestamp: new Date().toLocaleString('zh-CN'),
        reply: '',});
      saveChatData();
      renderCoupleLetters();
      toastr.success(`💝 收到${ctx.name2 || '角色'}的情书！`);
    }
  });

  // 纪念日
  $(document).off('click.bbaddanni').on('click.bbaddanni', '#bb-btn-add-anniversary', function () {
    const name = prompt('纪念日名称（如：认识纪念日）:');
    if (!name) return;
    const date = prompt('日期（格式：2026-01-15）:');
    if (!date) return;
    pluginData.couple_space.anniversaries.push({
      id: generateId(),
      name,
      date,
    });
    saveChatData();
    renderCoupleAnniversaries();
    toastr.success(`📅 已添加纪念日: ${name}`);
  });

  // 照片墙
  $(document).off('click.bbcouplephoto').on('click.bbcouplephoto', '#bb-btn-couple-upload-photo', function () {
    const modal = $(`
      <div class="bb-modal-overlay">
        <div class="bb-modal-content">
          <h3 style="color:var(--bb-primary);margin:0 0 16px;text-align:center;">📷 上传照片</h3>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <input id="bb-couple-photo-url" type="text" class="text_pole" placeholder="输入图片URL..." style="width:100%;padding:8px;" />
            <input id="bb-couple-photo-caption" type="text" class="text_pole" placeholder="照片说明（可选）" style="width:100%;padding:8px;" />
            <button class="bb-big-btn" id="bb-couple-photo-url-ok" style="width:100%;">🔗 通过URL添加</button>
            <button class="bb-big-btn" id="bb-couple-photo-file-btn" style="width:100%;">📁 上传文件</button>
            <input type="file" id="bb-couple-photo-file" accept="image/*" style="display:none;" />
            <button class="bb-sm-btn" id="bb-couple-photo-cancel" style="width:100%;background:var(--bb-bg-card);">取消</button>
          </div>
        </div>
      </div>
    `);

    $('body').append(modal);

    modal.find('#bb-couple-photo-url-ok').on('click', function () {
      const url = $('#bb-couple-photo-url').val().trim();
      if (!url) { toastr.warning('请输入URL'); return; }
      const caption = $('#bb-couple-photo-caption').val().trim();
      pluginData.couple_space.photo_wall.push({
        id: generateId(),
        url,
        caption: caption || '',
        timestamp: new Date().toLocaleString('zh-CN'),
      });
      saveChatData();
      renderCouplePhotos();
      modal.remove();
      toastr.success('📷 照片已添加');
    });

    modal.find('#bb-couple-photo-file-btn').on('click', () => $('#bb-couple-photo-file').click());
    modal.find('#bb-couple-photo-file').on('change', function () {
      const file = this.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toastr.error('文件过大，请选择小于5MB的图片');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const caption = $('#bb-couple-photo-caption').val().trim();
        pluginData.couple_space.photo_wall.push({
          id: generateId(),
          url: e.target.result,
          caption: caption || file.name,
          timestamp: new Date().toLocaleString('zh-CN'),
        });
        saveChatData();
        renderCouplePhotos();
        modal.remove();
        toastr.success('📷 照片已上传');
      };
      reader.readAsDataURL(file);
    });

    modal.find('#bb-couple-photo-cancel').on('click', () => modal.remove());
    modal.on('click', function (e) {
      if ($(e.target).hasClass('bb-modal-overlay')) modal.remove();
    });
  });

  $(document).off('click.bbcouplegenphoto').on('click.bbcouplegenphoto', '#bb-btn-couple-gen-photo', async function () {
    const ctx = getContext();
    const p = prompt('描述你想生成的照片:', `${ctx.name1 || '用户'}和${ctx.name2 || '角色'}的温馨合照`);
    if (!p) return;
    const entry = await generateAndSaveImage(p, 'couple');
    if (entry) {
      pluginData.couple_space.photo_wall.push({
        id: generateId(),
        url: entry.url,
        caption: p,
        timestamp: new Date().toLocaleString('zh-CN'),
      });
      saveChatData();
      renderCouplePhotos();
    }
  });
}

function showLetterEditor(from) {
  const modal = $(`
    <div class="bb-modal-overlay">
      <div class="bb-modal-content" style="max-width:500px;">
        <h3 style="color:var(--bb-primary);margin:0 0 16px;text-align:center;">💝 写情书</h3>
        <textarea id="bb-letter-content" class="text_pole" rows="8" placeholder="写下你的心意..." style="width:100%;font-size:14px;line-height:1.8;"></textarea>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="bb-big-btn" id="bb-letter-send" style="flex:1;">💌 发送</button>
          <button class="bb-sm-btn" id="bb-letter-cancel" style="flex:1;background:var(--bb-bg-card);">取消</button>
        </div>
      </div>
    </div>
  `);

  $('body').append(modal);

  modal.find('#bb-letter-send').on('click', function () {
    const content = $('#bb-letter-content').val().trim();
    if (!content) { toastr.warning('请写些什么吧~'); return; }
    pluginData.couple_space.love_letters.push({
      id: generateId(),
      from: from,
      to: from === 'user' ? 'char' : 'user',
      content,
      timestamp: new Date().toLocaleString('zh-CN'),reply: '',
    });
    saveChatData();
    renderCoupleLetters();
    modal.remove();
    toastr.success('💝 情书已发送');
  });

  modal.find('#bb-letter-cancel').on('click', () => modal.remove());
  modal.on('click', function (e) {
    if ($(e.target).hasClass('bb-modal-overlay')) modal.remove();
  });
}

// ============================================
// 情侣空间渲染
// ============================================

function renderCoupleMessages() {
  const $list = $('#bb-couple-msg-list');
  $list.empty();
  const msgs = pluginData.couple_space.messages || [];

  if (msgs.length === 0) {
    $list.html('<div class="bb-empty">还没有留言哦~<br/>写下第一条留言吧 💕</div>');
    return;
  }

  msgs.forEach((m, idx) => {
    const isUser = m.from === 'user';
    const ctx = getContext();
    const name = isUser ? (ctx.name1 || '用户') : (ctx.name2 || '角色');
    $list.append(`
      <div class="bb-couple-msg-item" style="display:flex;justify-content:${isUser ? 'flex-end' : 'flex-start'};margin-bottom:12px;">
        <div style="max-width:80%;">
          <div style="font-size:11px;color:var(--bb-text-muted);margin-bottom:4px;text-align:${isUser ? 'right' : 'left'};">${esc(name)} · ${m.timestamp}</div>
          <div class="bb-chat-bubble ${isUser ? 'bb-bubble-user' : 'bb-bubble-ai'}">${renderSafeHTML(m.content)}</div>
          <div style="text-align:${isUser ? 'right' : 'left'};margin-top:4px;">
            <span class="bb-couple-msg-del" data-idx="${idx}" style="cursor:pointer;font-size:12px;color:var(--bb-text-dim);">🗑️</span>
          </div>
        </div>
      </div>
    `);
  });

  $list.find('.bb-couple-msg-del').on('click', function () {
    const idx = $(this).data('idx');
    pluginData.couple_space.messages.splice(idx, 1);
    saveChatData();
    renderCoupleMessages();
  });
}

function renderCoupleLetters() {
  const $list = $('#bb-couple-letter-list');
  $list.empty();
  const letters = pluginData.couple_space.love_letters || [];

  if (letters.length === 0) {
    $list.html('<div class="bb-empty">还没有情书~<br/>写下你的心意吧 💝</div>');
    return;
  }

  const ctx = getContext();

  letters.forEach((letter, idx) => {
    const fromName = letter.from === 'user' ? (ctx.name1 || '用户') : (ctx.name2 || '角色');
    const toName = letter.to === 'user' ? (ctx.name1 || '用户') : (ctx.name2 || '角色');

    $list.append(`
      <div class="bb-letter-card">
        <div class="bb-letter-header">
          <span style="color:var(--bb-primary);font-weight:bold;">💝 来自 ${esc(fromName)} → ${esc(toName)}</span>
          <span style="display:flex;gap:8px;align-items:center;">
            <span style="font-size:12px;color:var(--bb-text-muted);">${letter.timestamp}</span>
            <span class="bb-letter-del" data-idx="${idx}" style="cursor:pointer;font-size:14px;">🗑️</span>
          </span>
        </div>
        <div class="bb-letter-body">${renderSafeHTML(letter.content)}</div>
        ${letter.reply ? `
          <div class="bb-letter-reply">
            <div style="font-size:12px;color:var(--bb-primary);margin-bottom:4px;">💌 回信:</div>
            <div>${renderSafeHTML(letter.reply)}</div>
          </div>
        ` : `
          <button class="bb-sm-btn bb-letter-reply-btn" data-idx="${idx}" style="margin-top:8px;">✏️ 回信</button>
          <button class="bb-sm-btn bb-letter-ai-reply-btn" data-idx="${idx}" style="margin-top:8px;">🤖 让TA回信</button>
        `}
      </div>
    `);
  });

  $list.find('.bb-letter-del').on('click', function () {
    const idx = $(this).data('idx');
    if (!confirm('确认删除这封情书?')) return;
    pluginData.couple_space.love_letters.splice(idx, 1);
    saveChatData();
    renderCoupleLetters();
  });

  $list.find('.bb-letter-reply-btn').on('click', function () {
    const idx = $(this).data('idx');
    const reply = prompt('写下你的回信:');
    if (!reply) return;
    pluginData.couple_space.love_letters[idx].reply = reply;
    saveChatData();
    renderCoupleLetters();
    toastr.success('💌 回信已发送');
  });

  $list.find('.bb-letter-ai-reply-btn').on('click', async function () {
    const idx = $(this).data('idx');
    const letter = pluginData.couple_space.love_letters[idx];
    const ctx = getContext();
    const replyFrom = letter.to === 'user' ? ctx.name1 : ctx.name2;
    toastr.info(`💌 ${replyFrom || '对方'}正在回信...`);

    const result = await callSubAPI([
      { role: 'system', content: `你是"${replyFrom || '角色'}"，收到了一封情书，请写一封真挚的回信（80-200字）。\n\n收到的情书内容：\n${letter.content}` },
    ], 400);

    if (result) {
      pluginData.couple_space.love_letters[idx].reply = result;
      saveChatData();
      renderCoupleLetters();
      toastr.success(`💌 ${replyFrom || '对方'}回信了！`);
    }
  });
}

function renderCoupleAnniversaries() {
  const $list = $('#bb-couple-anni-list');
  $list.empty();
  const annis = pluginData.couple_space.anniversaries || [];

  if (annis.length === 0) {
    $list.html('<div class="bb-empty">还没有纪念日~<br/>记录你们的重要时刻吧 📅</div>');
    return;
  }

  annis.forEach((a, idx) => {
    const daysAgo = Math.floor((Date.now() - new Date(a.date).getTime()) / (1000 * 60 * 60 * 24));
    const daysText = daysAgo >= 0 ? `已经${daysAgo} 天` : `还有 ${Math.abs(daysAgo)} 天`;

    $list.append(`
      <div class="bb-anni-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="color:var(--bb-primary);font-weight:bold;font-size:16px;">📅 ${esc(a.name)}</div>
            <div style="color:var(--bb-text-muted);font-size:13px;margin-top:4px;">${a.date} · ${daysText}</div>
          </div>
          <span class="bb-anni-del" data-idx="${idx}" style="cursor:pointer;font-size:14px;">🗑️</span>
        </div>
      </div>
    `);
  });

  $list.find('.bb-anni-del').on('click', function () {
    const idx = $(this).data('idx');
    pluginData.couple_space.anniversaries.splice(idx, 1);
    saveChatData();
    renderCoupleAnniversaries();
  });
}

function renderCouplePhotos() {
  const $grid = $('#bb-couple-photo-grid');
  $grid.empty();
  const photos = pluginData.couple_space.photo_wall || [];

  if (photos.length === 0) {
    $grid.html('<div class="bb-empty">还没有照片~<br/>上传或生成你们的回忆吧 📸</div>');
    return;
  }

  photos.forEach((p, idx) => {
    $grid.append(`
      <div class="bb-gallery-item">
        <img src="${esc(p.url)}" alt="${esc(p.caption)}" loading="lazy" />
        <div class="bb-gallery-caption">${esc(p.caption || '')}</div>
        <div class="bb-gallery-actions">
          <span class="bb-couple-photo-del" data-idx="${idx}" style="cursor:pointer;">🗑️</span>
        </div>
      </div>
    `);
  });

  $grid.find('.bb-couple-photo-del').on('click', function () {
    const idx = $(this).data('idx');
    if (!confirm('确认删除这张照片?')) return;
    pluginData.couple_space.photo_wall.splice(idx, 1);
    saveChatData();
    renderCouplePhotos();
  });
}

// ============================================
// 画廊渲染
// ============================================

function renderGallery() {
  const $grid = $('#bb-gallery-grid');
  const $empty = $('#bb-gallery-empty');
  $grid.empty();

  if (pluginData.gallery.length === 0) {
    $empty.show();
    return;
  }

  $empty.hide();

  pluginData.gallery.forEach((item, idx) => {
    $grid.append(`
      <div class="bb-gallery-item">
        <img src="${esc(item.url)}" alt="${esc(item.prompt || '')}" loading="lazy" />
        <div class="bb-gallery-caption">${esc(item.source || '')} · ${item.timestamp}</div>
        <div class="bb-gallery-actions">
          <span class="bb-gallery-reroll" data-idx="${idx}" style="cursor:pointer;" title="重新生成">🔄</span>
          <span class="bb-gallery-del" data-idx="${idx}" style="cursor:pointer;" title="删除">🗑️</span>
        </div>
      </div>
    `);
  });

  $grid.find('.bb-gallery-del').on('click', function () {
    const idx = $(this).data('idx');
    if (!confirm('确认删除这张图片?')) return;
    pluginData.gallery.splice(idx, 1);
    saveChatData();
    renderGallery();
    toastr.info('已删除图片');
  });

  $grid.find('.bb-gallery-reroll').on('click', async function () {
    const idx = $(this).data('idx');
    const item = pluginData.gallery[idx];
    if (!item || !item.prompt) {
      toastr.warning('无法重新生成：缺少提示词');
      return;
    }
    toastr.info('🔄 重新生成中...');
    const newUrl = await callImgAPI(item.prompt);
    if (newUrl) {
      pluginData.gallery[idx].url = newUrl;
      pluginData.gallery[idx].timestamp = new Date().toLocaleString('zh-CN');
      saveChatData();
      renderGallery();
      toastr.success('🖼️ 已重新生成');
    }
  });
}

// ============================================
// 语录导出海报
// ============================================

function showPosterEditor() {
  if (pluginData.records_bone.length === 0) {
    toastr.warning('暂无收藏的语录');
    return;
  }

  const s = getSettings();

  // 构建语录选择列表
  let recordOptions = pluginData.records_bone.map((r, i) =>
    `<option value="${i}">${esc(r.character)}: ${esc(r.text.substring(0, 40))}...</option>`
  ).join('');

  const modal = $(`
    <div class="bb-modal-overlay">
      <div class="bb-modal-content" style="max-width:550px;max-height:85vh;overflow-y:auto;">
        <h3 style="color:var(--bb-primary);margin:0 0 16px;text-align:center;">🖼️ 语录海报生成器</h3>

        <div style="margin-bottom:12px;">
          <label style="font-size:13px;color:var(--bb-text);">选择语录:</label>
          <select id="bb-poster-record" class="text_pole" style="width:100%;padding:6px;">${recordOptions}</select>
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:13px;color:var(--bb-text);">背景图URL:</label>
          <input id="bb-poster-bg" type="text" class="text_pole" placeholder="输入背景图URL（留空使用默认）" style="width:100%;padding:6px;" value="${esc(s.poster_bg_url || '')}" />
          <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap;">
            <button class="bb-sm-btn bb-poster-bg-preset" data-url="https://picsum.photos/seed/poster1/800/1200" style="font-size:11px;">🌄 风景</button>
            <button class="bb-sm-btn bb-poster-bg-preset" data-url="https://picsum.photos/seed/poster2/800/1200" style="font-size:11px;">🌃 城市</button>
            <button class="bb-sm-btn bb-poster-bg-preset" data-url="https://picsum.photos/seed/poster3/800/1200" style="font-size:11px;">🌸 花朵</button>
            <button class="bb-sm-btn bb-poster-bg-preset" data-url="https://picsum.photos/seed/poster4/800/1200" style="font-size:11px;">🌊 海洋</button>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:13px;color:var(--bb-text);">字体URL（可选，留空使用默认）:</label>
          <input id="bb-poster-font-url" type="text" class="text_pole" placeholder="https://fonts.googleapis.com/css2?family=..." style="width:100%;padding:6px;" value="${esc(s.poster_font_url || '')}" />
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:13px;color:var(--bb-text);">字体名称:</label>
          <input id="bb-poster-font-name" type="text" class="text_pole" placeholder="Noto Serif SC" style="width:100%;padding:6px;" value="${esc(s.poster_font_name || 'Noto Serif SC')}" />
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:13px;color:var(--bb-text);">文字颜色:</label>
          <input id="bb-poster-color" type="color" value="${s.poster_text_color || '#ffffff'}" style="width:60px;height:36px;border:none;cursor:pointer;" />
        </div>

        <!-- 预览区 -->
        <div id="bb-poster-preview" style="width:100%;aspect-ratio:2/3;background:#333;border-radius:8px;overflow:hidden;position:relative;margin-bottom:12px;">
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#888;">预览区域</div>
        </div>

        <div style="display:flex;gap:8px;">
          <button class="bb-sm-btn" id="bb-poster-preview-btn" style="flex:1;">👁️ 预览</button>
          <button class="bb-big-btn" id="bb-poster-download" style="flex:1;">📥 下载海报</button>
        </div><button class="bb-sm-btn" id="bb-poster-cancel" style="width:100%;margin-top:8px;background:var(--bb-bg-card);">关闭</button>
      </div>
    </div>
  `);

  $('body').append(modal);

  // 背景预设
  modal.find('.bb-poster-bg-preset').on('click', function () {
    $('#bb-poster-bg').val($(this).data('url'));
    updatePosterPreview();
  });

  // 预览
  modal.find('#bb-poster-preview-btn').on('click', updatePosterPreview);
  modal.find('#bb-poster-record, #bb-poster-bg, #bb-poster-font-name, #bb-poster-color').on('change input', debounce(updatePosterPreview, 300));

  // 下载
  modal.find('#bb-poster-download').on('click', downloadPoster);

  // 关闭
  modal.find('#bb-poster-cancel').on('click', () => modal.remove());modal.on('click', function (e) {
    if ($(e.target).hasClass('bb-modal-overlay')) modal.remove();
  });

  // 初始预览
  setTimeout(updatePosterPreview, 200);
}

function updatePosterPreview() {
  const idx = parseInt($('#bb-poster-record').val()) || 0;
  const record = pluginData.records_bone[idx];
  if (!record) return;

  const bgUrl = $('#bb-poster-bg').val().trim();
  const fontName = $('#bb-poster-font-name').val().trim() || 'Noto Serif SC';
  const textColor = $('#bb-poster-color').val() || '#ffffff';

  const $preview = $('#bb-poster-preview');
  $preview.html(`
    <div style="position:absolute;inset:0;${bgUrl ? `background-image:url(${bgUrl});background-size:cover;background-position:center;` : 'background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);'}"></div>
    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);"></div>
    <div style="position:relative;z-index:1;padding:24px;display:flex;flex-direction:column;justify-content:center;height:100%;">
      <div style="font-size:14px;color:${textColor};font-family:'${fontName}',serif;line-height:1.8;text-align:center;word-wrap:break-word;text-shadow:0 2px 4px rgba(0,0,0,0.8);">
        "${esc(record.text.substring(0, 200))}"
      </div><div style="margin-top:16px;text-align:center;">
        <div style="font-size:11px;color:${textColor};opacity:0.7;font-family:'${fontName}',serif;">— ${esc(record.character)}</div>
        <div style="font-size:9px;color:${textColor};opacity:0.5;margin-top:4px;">骨与血· Bone & Blood</div>
      </div>
    </div>
  `);
}

function downloadPoster() {
  const idx = parseInt($('#bb-poster-record').val()) || 0;
  const record = pluginData.records_bone[idx];
  if (!record) return;

  const bgUrl = $('#bb-poster-bg').val().trim();
  const fontName = $('#bb-poster-font-name').val().trim() || 'Noto Serif SC';
  const textColor = $('#bb-poster-color').val() || '#ffffff';

  // 保存设置
  const s = getSettings();
  s.poster_bg_url = bgUrl;
  s.poster_font_name = fontName;
  s.poster_text_color = textColor;
  s.poster_font_url = $('#bb-poster-font-url').val().trim();
  saveSettings();

  // 使用Canvas生成
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1200;
  const ctx2d = canvas.getContext('2d');

  const drawText = () => {
    // 半透明遮罩
    ctx2d.fillStyle = 'rgba(0,0,0,0.5)';
    ctx2d.fillRect(0, 0,800, 1200);

    // 文字
    ctx2d.fillStyle = textColor;
    ctx2d.font = `24px "${fontName}", serif`;
    ctx2d.textAlign = 'center';
    ctx2d.shadowColor = 'rgba(0,0,0,0.8)';
    ctx2d.shadowBlur = 4;

    // 自动换行
    const text = `"${record.text.substring(0, 300)}"`;
    const words = text.split('');
    let line = '';
    let y = 400;
    const maxWidth = 700;
    const lineHeight = 40;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = ctx2d.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx2d.fillText(line, 400, y);
        line = words[i];
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx2d.fillText(line, 400, y);

    // 署名
    ctx2d.font = `18px "${fontName}", serif`;
    ctx2d.globalAlpha = 0.7;
    ctx2d.fillText(`— ${record.character}`, 400, y + 60);

    ctx2d.font = '14px sans-serif';
    ctx2d.globalAlpha = 0.5;
    ctx2d.fillText('骨与血 · Bone & Blood', 400, y + 90);ctx2d.globalAlpha = 1;

    // 下载
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bone_blood_poster_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);toastr.success('🖼️ 海报已下载');
    });
  };

  if (bgUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx2d.drawImage(img, 0, 0, 800, 1200);
      drawText();
    };
    img.onerror = () => {
      // 背景加载失败，使用渐变
      const gradient = ctx2d.createLinearGradient(0, 0, 800, 1200);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1, '#0f3460');
      ctx2d.fillStyle = gradient;
      ctx2d.fillRect(0, 0, 800, 1200);
      drawText();
    };
    img.src = bgUrl;
  } else {
    const gradient = ctx2d.createLinearGradient(0, 0, 800, 1200);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx2d.fillStyle = gradient;
    ctx2d.fillRect(0, 0, 800, 1200);
    drawText();
  }
}

// ============================================
// 渲染函数
// ============================================

function renderAll() {
  renderScrapbook();
  renderDiary();
  renderIntel();
  renderParallel();
  renderFateHistory();
  renderWorldFeed();
  renderAchievements();
  renderOOCPreview();
  renderGallery();
  renderCoupleMessages();
  renderCoupleLetters();
  renderCoupleAnniversaries();
  renderCouplePhotos();
  updateCharInfo();
  updateMarquee();
  applyHomeBackground();
}

function updateCharInfo() {
  const ctx = getContext();
  $('#bb-home-user-name').text(ctx.name1|| '用户名');
  $('#bb-home-char-name').text(ctx.name2 || '角色名');

  const msgCount = ctx.chat ? ctx.chat.length : 0;
  $('#bb-home-msg-count').text(msgCount);
  $('#bb-home-time-count').text(msgCount * 2);

  //仪表盘额外数据
  $('#bb-home-scrap-count').text(pluginData.records_bone.length);
  $('#bb-home-diary-count').text(pluginData.diary_blood.length);

  // 最近日记预览（仪表盘用）
  if (pluginData.diary_blood.length > 0) {
    const last = pluginData.diary_blood[pluginData.diary_blood.length - 1];
    $('#bb-home-recent-diary').html(`<div style="color:var(--bb-text);font-size:13px;line-height:1.6;">${esc(last.content.substring(0, 150))}...</div><div style="font-size:11px;color:var(--bb-text-dim);margin-top:4px;">${last.date}</div>`);
  }

  // 加载首页配置
  if (pluginData.home_config.user_avatar) {
    $('#bb-home-user-avatar').html(`<img src="${pluginData.home_config.user_avatar}" style="width:100%;height:100%;object-fit:cover;" />`);
  }
  if (pluginData.home_config.char_avatar) {
    $('#bb-home-char-avatar').html(`<img src="${pluginData.home_config.char_avatar}" style="width:100%;height:100%;object-fit:cover;" />`);
  }

  $('#bb-home-link-emoji').text(pluginData.home_config.link_emoji || '💕');
  $('#bb-home-user-bubble').text(pluginData.home_config.user_bubble || '今天也要开心鸭~');
  $('#bb-home-char-bubble').text(pluginData.home_config.char_bubble || '嗯，一起加油！');
  $('#bb-home-radio-text').text(pluginData.home_config.radio_text || '骨与血电台');
}

function renderScrapbook() {
  const list = $('#bb-records-list');
  list.empty();

  if (pluginData.records_bone.length === 0) {
    $('#bb-scrap-empty').show();
    $('.bb-export-bar').hide();
    return;
  }

  $('#bb-scrap-empty').hide();
  $('.bb-export-bar').show();

  pluginData.records_bone.forEach((r, idx) => {
    list.append(`
      <div class="bb-record-item">
        <div class="bb-record-header">
          <span class="bb-record-char">${esc(r.character)}</span>
          <span style="display:flex;gap:8px;align-items:center;">
            <span class="bb-record-time">${r.timestamp}</span>
            <span class="bb-record-del" data-idx="${idx}" title="删除">🗑️</span>
          </span>
        </div>
        <div class="bb-record-text">${esc(r.text)}</div>
      </div>
    `);
  });

  list.find('.bb-record-del').on('click', function () {
    const idx = $(this).data('idx');
    if (!confirm('确认删除该语录?')) return;
    pluginData.records_bone.splice(idx, 1);
    saveChatData();
    renderScrapbook();
    toastr.info('已删除语录');
  });
}

function renderDiary() {
  const list = $('#bb-diary-list');
  list.empty();

  if (pluginData.diary_blood.length === 0) {
    $('#bb-diary-empty').show();
    return;
  }

  $('#bb-diary-empty').hide();

  pluginData.diary_blood.forEach((d, idx) => {
    const hasImg = pluginData.gallery.some(g => g.source === 'diary');
    list.append(`
      <div class="bb-diary-item">
        <div class="bb-diary-header">
          <span>📅 ${d.date}</span>
          <span class="bb-diary-del" data-idx="${idx}" title="删除">🗑️</span>
        </div>
        <div class="bb-diary-body">${esc(d.content)}</div>
      </div>
    `);});

  list.find('.bb-diary-del').on('click', function () {
    const idx = $(this).data('idx');
    if (!confirm('确认删除该日记?')) return;
    pluginData.diary_blood.splice(idx, 1);
    saveChatData();
    renderDiary();
    toastr.info('已删除日记');
  });
}

function renderIntel() {
  const npcBox = $('#bb-npc-box');
  npcBox.empty();
  const npcNames = Object.keys(pluginData.npc_status);

  if (npcNames.length === 0) {
    npcBox.html('<p class="bb-empty">暂无追踪的 NPC<br/>点击上方添加</p>');
    return;
  }

  npcNames.forEach(name => {
    const info = pluginData.npc_status[name];
    npcBox.append(`
      <div class="bb-npc-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="color:var(--bb-primary);font-weight:bold;font-size:15px;">🧑‍🤝‍🧑 ${esc(name)}</span>
          <span style="display:flex;gap:6px;">
            <button class="bb-sm-btn bb-npc-peek" data-name="${esc(name)}" title="窥探" style="padding:4px 8px;font-size:12px;">🔍</button>
            <button class="bb-sm-btn bb-npc-del" data-name="${esc(name)}" title="移除" style="padding:4px 8px;font-size:12px;">🗑️</button>
          </span>
        </div>
        <div class="bb-npc-body">${esc(info.description || '等待窥探...')}</div>
        <div class="bb-npc-time">${info.lastUpdate || ''}</div>
      </div>
    `);
  });

  npcBox.find('.bb-npc-peek').on('click', function () { generateNPCStatus($(this).data('name')); });
  npcBox.find('.bb-npc-del').on('click', function () {
    const n = $(this).data('name');
    if (!confirm(`确认移除NPC: ${n}?`)) return;
    delete pluginData.npc_status[n];
    saveChatData();
    renderIntel();
    toastr.info(`已移除 ${n}`);
  });
}

function renderParallel() {
  const list = $('#bb-par-list');
  list.empty();

  if (pluginData.parallel_universes.length === 0) {
    $('#bb-par-empty').show();
    return;
  }

  $('#bb-par-empty').hide();

  pluginData.parallel_universes.forEach((p, idx) => {
    list.append(`
      <div class="bb-par-item">
        <div class="bb-par-header">
          <span style="color:var(--bb-primary);font-weight:bold;">🦋 #${p.floor} — ${p.date}</span>
          <span class="bb-par-del" data-idx="${idx}" title="删除">🗑️</span>
        </div>
        <div class="bb-par-origin"><b>原文:</b> ${esc((p.origin || '').substring(0, 60))}...</div>
        <div class="bb-par-body">${esc(p.content)}</div>
      </div>
    `);
  });

  list.find('.bb-par-del').on('click', function () {
    const idx = $(this).data('idx');
    if (!confirm('确认删除该平行宇宙记录?')) return;
    pluginData.parallel_universes.splice(idx, 1);
    saveChatData();
    renderParallel();
    toastr.info('已删除平行宇宙记录');
  });
}

function renderFateHistory() {
  const list = $('#bb-fate-history-list');
  list.empty();

  if (pluginData.fate_history.length === 0) {
    list.html('<div class="bb-empty" style="padding:20px;">暂无命运历史</div>');
    return;
  }

  pluginData.fate_history.slice(-5).reverse().forEach((f, idx) => {
    list.append(`
      <div class="bb-record-item">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="color:var(--bb-primary);font-size:13px;">[${f.timestamp}] #${f.floor}</span>
          <span class="bb-fate-del" data-idx="${pluginData.fate_history.length - 1 - idx}" title="删除">🗑️</span>
        </div>
        <div style="color:var(--bb-text);line-height:1.5;">${esc(f.content)}</div>
      </div>
    `);
  });

  if (pluginData.fate_history.length > 5) {
    list.prepend(`<div style="text-align:center;color:var(--bb-text-muted);font-size:12px;margin-bottom:12px;">仅显示最近5条</div>`);
  }

  list.find('.bb-fate-del').on('click', function () {
    const idx = $(this).data('idx');
    pluginData.fate_history.splice(idx, 1);
    saveChatData();
    renderFateHistory();
    toastr.info('已删除命运记录');
  });
}

function renderWorldFeed() {
  const list = $('#bb-world-feed-list');
  list.empty();

  if (pluginData.world_feed.length === 0) {
    list.html('<div class="bb-empty">暂无世界频段消息</div>');
    return;
  }

  pluginData.world_feed.forEach((f, idx) => {
    const icon = f.type === 'gossip' ? '💬' : f.type === 'news' ? '📰' : '✨';
    list.append(`
      <div class="bb-record-item">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="color:var(--bb-primary);">${icon} ${f.timestamp}</span>
          <span class="bb-feed-del" data-idx="${idx}" title="删除">🗑️</span>
        </div>
        <div style="color:var(--bb-text);line-height:1.5;">${esc(f.content)}</div>
      </div>
    `);
  });

  list.find('.bb-feed-del').on('click', function () {
    const idx = $(this).data('idx');
    pluginData.world_feed.splice(idx, 1);
    saveChatData();
    renderWorldFeed();
    updateMarquee();
    toastr.info('已删除消息');
  });
}

function renderAchievements() {
  const list = $('#bb-ach-list');
  list.empty();

  const allAchievements = [
    { id: 'chat_100', name: '初见倾心', desc: '聊天达到100条', icon: '💬', check: () => (getContext().chat?.length || 0) >= 100 },
    { id: 'chat_500', name: '相知相伴', desc: '聊天达到500条', icon: '💕', check: () => (getContext().chat?.length || 0) >= 500 },
    { id: 'chat_1000', name: '生死相依', desc: '聊天达到1000条', icon: '💍', check: () => (getContext().chat?.length || 0) >= 1000 },
    { id: 'scrap_10', name: '拾荒者', desc: '收藏10条语录', icon: '🌟', check: () => pluginData.records_bone.length >= 10 },
    { id: 'scrap_50', name: '收藏家', desc: '收藏50条语录', icon: '📚', check: () => pluginData.records_bone.length >= 50 },
    { id: 'scrap_100', name: '记忆宝库', desc: '收藏100条语录', icon: '💎', check: () => pluginData.records_bone.length >= 100 },
    { id: 'diary_5', name: '日记新手', desc: '生成5篇日记', icon: '📖', check: () => pluginData.diary_blood.length >= 5 },
    { id: 'diary_20', name: '日记达人', desc: '生成20篇日记', icon: '🖋️', check: () => pluginData.diary_blood.length >= 20 },
    { id: 'parallel_1', name: '破壁者', desc: '开启1次平行宇宙', icon: '🦋', check: () => pluginData.parallel_universes.length >= 1 },
    { id: 'parallel_10', name: '多元旅者', desc: '开启10次平行宇宙', icon: '🌌', check: () => pluginData.parallel_universes.length >= 10 },
    { id: 'fate_lucky', name: '幸运眷顾', desc: '命运骰子出现"幸运"关键词', icon: '🍀', check: () => pluginData.fate_history.some(f => f.content.includes('幸运')) },
    { id: 'fate_crisis', name: '劫后余生', desc: '命运骰子出现"危机"关键词', icon: '⚠️', check: () => pluginData.fate_history.some(f => f.content.includes('危机')) },
  ];

  let unlockedCount = 0;

  allAchievements.forEach(ach => {
    const unlocked = ach.check();
    const saved = pluginData.achievements.find(a => a.id === ach.id);
    if (unlocked) unlockedCount++;

    list.append(`
      <div class="bb-ach-card ${unlocked ? 'bb-ach-unlocked' : 'bb-ach-locked'}">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="font-size:32px;">${unlocked ? ach.icon : '🔒'}</div>
          <div style="flex:1;">
            <div style="color:${unlocked ? 'var(--bb-primary)' : 'var(--bb-text-dim)'};font-weight:bold;font-size:15px;">${ach.name}</div>
            <div style="color:var(--bb-text-muted);font-size:13px;">${ach.desc}</div>
            ${saved ? `<div style="color:var(--bb-text-dim);font-size:11px;margin-top:4px;">解锁于: ${saved.date}</div>` : ''}
          </div>
        </div>
      </div>
    `);
  });

  $('#bb-ach-count').text(unlockedCount);
  $('#bb-ach-total').text(allAchievements.length);
}

// ============================================
// AI 生成功能
// ============================================

async function generateDiary() {
  const ctx = getContext();
  const cn = ctx.name2|| '角色';
  toastr.info(`📖 ${cn} 正在写日记...`);

  const recent = getRecentChat(30);
  if (recent.length === 0) { toastr.warning('没有聊天记录'); return; }

  const preset = getActivePreset();
  const result = await callSubAPI([
    { role: 'system', content: `你是"${cn}"。${preset.prompts.diary}` },
    { role: 'user', content: fmt(recent) },
  ], 600);

  if (result) {
    pluginData.diary_blood.push({
      date: new Date().toLocaleString('zh-CN'),
      content: result,
      character: cn,
    });
    saveChatData();
    renderDiary();
    toastr.success(`📖 ${cn} 的日记已更新！`);
    checkAchievements();
  }
}

async function generateSummary() {
  toastr.info('📜 正在生成阿卡夏记录...');
  const recent = getRecentChat(40);
  if (recent.length === 0) { toastr.warning('没有聊天记录'); return; }

  const preset = getActivePreset();
  const result = await callSubAPI([
    { role: 'system', content: preset.prompts.summary },
    { role: 'user', content: fmt(recent) },
  ], 500);

  if (result) {
    pluginData.summaries.push({
      date: new Date().toLocaleString('zh-CN'),
      content: result,
    });
    saveChatData();
    toastr.success('📜 阿卡夏记录已更新！');
  }
}

async function generateWeather() {
  toastr.info('☁️ 正在扫描环境...');
  const recent = getRecentChat(20);
  if (recent.length === 0) { toastr.warning('没有聊天记录'); return; }

  const preset = getActivePreset();
  const result = await callSubAPI([
    { role: 'system', content: preset.prompts.weather },
    { role: 'user', content: fmt(recent) },
  ], 300);

  if (result) {
    pluginData.weather = result;
    saveChatData();
    $('#bb-weather-box').html(esc(result));
    toastr.success('☁️ 环境雷达已更新！');
  }
}

async function generateVibe() {
  toastr.info('❤️ 正在分析氛围...');
  const recent = getRecentChat(20);
  if (recent.length === 0) { toastr.warning('没有聊天记录'); return; }

  const preset = getActivePreset();
  const result = await callSubAPI([
    { role: 'system', content: preset.prompts.vibe },
    { role: 'user', content: fmt(recent) },
  ], 300);

  if (result) {
    pluginData.vibe = result;
    saveChatData();
    $('#bb-vibe-box').html(esc(result));
    toastr.success('❤️ 氛围心电图已更新！');
  }
}

async function generateNPCStatus(name) {
  toastr.info(`🔍 正在窥探 ${name}...`);
  const recent = getRecentChat(30);
  const preset = getActivePreset();
  const result = await callSubAPI([
    { role: 'system', content: `${preset.prompts.npc}\nNPC名称: ${name}` },
    { role: 'user', content: fmt(recent) },
  ], 400);

  if (result) {
    pluginData.npc_status[name] = {
      description: result,
      lastUpdate: new Date().toLocaleString('zh-CN'),
    };
    saveChatData();
    renderIntel();
    toastr.success(`🔍 ${name} 的情报已更新！`);
  }
}

async function autoNPCPeek() {
  toastr.info('🎲 分析剧情中的NPC...');
  const recent = getRecentChat(40);
  if (recent.length === 0) { toastr.warning('没有聊天记录'); return; }

  const ctx = getContext();
  const result = await callSubAPI([
    { role: 'system', content: `分析以下对话，提取出1-2个出现过的NPC名字（不包括用户"${ctx.name1}"和主角"${ctx.name2}"）。只返回名字，用逗号分隔，不要其他内容。如果没有NPC，返回"无"。` },
    { role: 'user', content: fmt(recent) },
  ], 100);

  if (!result || result === '无') {
    toastr.warning('未检测到NPC');
    return;
  }

  const names = result.split(/[,，、]/).map(n => n.trim()).filter(Boolean).slice(0, 2);
  for (const name of names) {
    if (!pluginData.npc_status[name]) {
      pluginData.npc_status[name] = { description: '等待窥探...', lastUpdate: '' };
    }
    await generateNPCStatus(name);
  }
  saveChatData();
  renderIntel();
}

async function rollFate() {
  toastr.info('🎲 命运之轮转动中...');
  const ctx = getContext();
  const cn = ctx.name2 || '角色';
  const recent = getRecentChat(15);

  const preset = getActivePreset();
  const result = await callSubAPI([
    { role: 'system', content: `${preset.prompts.fate}\n角色名：${cn}` },
    { role: 'user', content: recent.length > 0 ? fmt(recent) : '（新的冒险刚刚开始）' },
  ], 300);

  if (result) {
    pluginData.chaos_event = result;
    const floor = ctx.chat ? ctx.chat.length : 0;
    pluginData.fate_history.push({
      content: result,
      floor: floor,
      timestamp: new Date().toLocaleString('zh-CN'),
    });

    $('#bb-fate-result').html(`
      <div style="font-size:18px;margin-bottom:16px;">🎲</div>
      <div style="color:var(--bb-text);line-height:1.6;margin-bottom:16px;">${esc(result)}</div>
      <div style="font-size:12px;color:var(--bb-text-muted);border-top:1px solid var(--bb-border);padding-top:12px;margin-top:12px;">
        使用宏<code>{{bb_chaos_event}}</code> 插入到对话中<br/>
        （宏读取后会自动清空，只能使用一次）
      </div>
    `);

    saveChatData();
    renderFateHistory();
    toastr.success('🎲 命运已降临！');
    checkAchievements();
  }
}

async function generateWorldFeed() {
  toastr.info('📻 生成世界频段消息中...');
  const recent = getRecentChat(25);
  const preset = getActivePreset();

  const result = await callSubAPI([
    { role: 'system', content: `${preset.prompts.world}\n当前场景背景请根据对话推断。` },
    { role: 'user', content: recent.length > 0 ? fmt(recent) : '（新的世界刚刚展开）' },
  ], 300);

  if (result) {
    const messages = result.split('\n').filter(line => line.trim());
    messages.forEach(msg => {
      const type = msg.includes('八卦') || msg.includes('传闻') ? 'gossip': msg.includes('新闻') || msg.includes('突发') ? 'news'
                 : 'lore';
      pluginData.world_feed.push({
        type,
        content: msg.replace(/^[🌍📰💬✨\-\*\d\.]+\s*/, ''),
        timestamp: new Date().toLocaleString('zh-CN'),
      });
    });
    saveChatData();
    renderWorldFeed();
    updateMarquee();
    toastr.success(`📻 已生成 ${messages.length} 条消息`);
  }
}

// ============================================
// 世界频段跑马灯
// ============================================

function startWorldFeed() {
  updateMarquee();
  setInterval(() => updateMarquee(), 30000);
}

function updateMarquee() {
  const marquee = $('#bb-marquee');
  if (pluginData.world_feed.length === 0) {
    marquee.text('🌍 世界频段广播中...暂无消息');
    return;
  }
  const samples = pluginData.world_feed.slice(-10).sort(() => Math.random() - 0.5).slice(0, 3);
  const text = samples.map(f => {
    const icon = f.type === 'gossip' ? '💬' : f.type === 'news' ? '📰' : '✨';
    return `${icon} ${f.content}`;
  }).join('|   ');
  marquee.text(text || '🌍 世界频段广播中...');
}

// ============================================
// 成就系统
// ============================================

function checkAchievements() {
  const allAchievements = [
    { id: 'chat_100', name: '初见倾心', desc: '聊天达到100条', icon: '💬', check: () => (getContext().chat?.length || 0) >= 100 },
    { id: 'chat_500', name: '相知相伴', desc: '聊天达到500条', icon: '💕', check: () => (getContext().chat?.length || 0) >= 500 },
    { id: 'chat_1000', name: '生死相依', desc: '聊天达到1000条', icon: '💍', check: () => (getContext().chat?.length || 0) >= 1000 },
    { id: 'scrap_10', name: '拾荒者', desc: '收藏10条语录', icon: '🌟', check: () => pluginData.records_bone.length >= 10 },
    { id: 'scrap_50', name: '收藏家', desc: '收藏50条语录', icon: '📚', check: () => pluginData.records_bone.length >= 50 },
    { id: 'scrap_100', name: '记忆宝库', desc: '收藏100条语录', icon: '💎', check: () => pluginData.records_bone.length >= 100 },
    { id: 'diary_5', name: '日记新手', desc: '生成5篇日记', icon: '📖', check: () => pluginData.diary_blood.length >= 5 },
    { id: 'diary_20', name: '日记达人', desc: '生成20篇日记', icon: '🖋️', check: () => pluginData.diary_blood.length >= 20 },
    { id: 'parallel_1', name: '破壁者', desc: '开启1次平行宇宙', icon: '🦋', check: () => pluginData.parallel_universes.length >= 1 },
    { id: 'parallel_10', name: '多元旅者', desc: '开启10次平行宇宙', icon: '🌌', check: () => pluginData.parallel_universes.length >= 10 },
    { id: 'fate_lucky', name: '幸运眷顾', desc: '命运骰子出现"幸运"关键词', icon: '🍀', check: () => pluginData.fate_history.some(f => f.content.includes('幸运')) },
    { id: 'fate_crisis', name: '劫后余生', desc: '命运骰子出现"危机"关键词', icon: '⚠️', check: () => pluginData.fate_history.some(f => f.content.includes('危机')) },
  ];

  allAchievements.forEach(ach => {
    if (ach.check()) {
      const alreadyUnlocked = pluginData.achievements.some(a => a.id === ach.id);
      if (!alreadyUnlocked) {
        unlockAchievement(ach);
      }
    }
  });
  renderAchievements();
}

function unlockAchievement(ach) {
  pluginData.achievements.push({
    id: ach.id,
    unlocked: true,
    date: new Date().toLocaleString('zh-CN'),
  });
  saveChatData();
  showAchievementPopup(ach);
  toastr.success(`🏆 解锁成就：${ach.name}`, '', { timeOut: 5000 });
}

function showAchievementPopup(ach) {
  const popup = $(`
    <div class="bb-achievement-popup">
      <div style="font-size:64px;margin-bottom:16px;">${ach.icon}</div>
      <div style="color:var(--bb-primary);font-size:24px;font-weight:bold;margin-bottom:8px;">🏆 成就解锁</div>
      <div style="color:var(--bb-text-bright);font-size:20px;margin-bottom:8px;">${ach.name}</div>
      <div style="color:var(--bb-text-muted);font-size:14px;">${ach.desc}</div></div>
  `);

  $('body').append(popup);
  setTimeout(() => popup.css('transform', 'translate(-50%,-50%) scale(1)'), 50);
  setTimeout(() => {
    popup.css('transform', 'translate(-50%,-50%) scale(0)');
    setTimeout(() => popup.remove(), 300);
  }, 3000);
}

// ============================================
// 消息计数& 自动触发
// ============================================

function incrementMessageCounter() {
  const s = getSettings();
  s.message_counter = (s.message_counter || 0) + 1;
  saveSettings();

  if (s.auto_diary_enabled && s.message_counter >= s.diary_trigger_count) {
    s.message_counter = 0;
    saveSettings();
    autoGenerate();
  }
  checkAchievements();
}

async function autoGenerate() {
  console.log('[骨与血]🔄 触发自动生成...');
  toastr.info('🔄 自动生成日记和总结中...');
  await generateDiary();
  await generateSummary();
}

// ============================================
// 事件监听
// ============================================

function registerEventListeners() {
  eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (msgId) => {
    if (!getSettings().enabled) return;
    injectMessageButtons(msgId);
    incrementMessageCounter();
  });

  eventSource.on(event_types.USER_MESSAGE_RENDERED, (msgId) => {
    if (!getSettings().enabled) return;
    injectMessageButtons(msgId);
  });

  eventSource.on(event_types.CHAT_CHANGED, () => {
    loadChatData();
    getSettings().message_counter = 0;
    saveSettings();
    updateCharInfo();
    setTimeout(() => injectButtonsToExistingMessages(), 500);
  });
}

// ============================================
// 按钮注入
// ============================================

function injectButtonsToExistingMessages() {
  const ctx = getContext();
  if (!ctx.chat) return;
  ctx.chat.forEach((_, idx) => injectMessageButtons(idx));
  console.log(`[骨与血] 已为${ctx.chat.length} 条消息注入按钮`);
}

function injectMessageButtons(messageId) {
  const mesEl = $(`.mes[mesid="${messageId}"]`);
  if (mesEl.length === 0) return;
  if (mesEl.find('.bb-msg-btns').length > 0) return;

  const btnHtml = `<span class="bb-msg-btns">
    <span class="bb-btn-star" title="🌟 收藏语录" data-mid="${messageId}">🌟</span>
    <span class="bb-btn-butterfly" title="🦋 平行宇宙" data-mid="${messageId}">🦋</span>
  </span>`;

  const targets = [
    mesEl.find('.extraMesButtons'),
    mesEl.find('.mes_buttons'),
    mesEl.find('.mes_block'),
    mesEl,
  ];

  let injected = false;
  for (const target of targets) {
    if (target.length > 0) {
      target.first().append(btnHtml);
      injected = true;
      break;
    }
  }
  if (!injected) return;

  mesEl.find('.bb-btn-star').off('click').on('click', function () {
    collectMessage($(this).data('mid'));
  });
  mesEl.find('.bb-btn-butterfly').off('click').on('click', function () {
    openBfWin($(this).data('mid'));
  });
}

function collectMessage(messageId) {
  const ctx = getContext();
  const msg = ctx.chat[messageId];
  if (!msg) { toastr.error('未找到消息'); return; }

  const exists = pluginData.records_bone.some(r => r.messageId === messageId);
  if (exists) { toastr.info('已收藏过该条语录'); return; }

  pluginData.records_bone.push({
    messageId,
    character: msg.name || (msg.is_user ? ctx.name1 : ctx.name2),
    text: msg.mes,
    timestamp: new Date().toLocaleString('zh-CN'),
    isUser: msg.is_user,
  });

  saveChatData();
  renderScrapbook();
  toastr.success(`🌟 已收藏 #${messageId}`);
  checkAchievements();
}

// ============================================
// 导出功能
// ============================================

function exportAsMarkdown() {
  const ctx = getContext();
  const cn = ctx.name2 || '角色';
  const un = ctx.name1 || '用户';
  let md = `# 🦴骨与血 — ${cn} & ${un}\n\n> 导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

  if (pluginData.records_bone.length > 0) {
    md += `## 🌟 唱片机（语录收藏）\n\n`;
    pluginData.records_bone.forEach(r => { md += `**${r.character}** (${r.timestamp}):\n> ${r.text}\n\n`; });
  }
  if (pluginData.diary_blood.length > 0) {
    md += `## 📖 日记本\n\n`;
    pluginData.diary_blood.forEach(d => { md += `### ${d.date}\n${d.content}\n\n`; });
  }
  if (pluginData.summaries.length > 0) {
    md += `## 📜阿卡夏记录\n\n`;
    pluginData.summaries.forEach(s => { md += `### ${s.date}\n${s.content}\n\n`; });
  }
  if (pluginData.weather) md += `## ☁️ 环境\n${pluginData.weather}\n\n`;
  if (pluginData.vibe) md += `## ❤️ 氛围\n${pluginData.vibe}\n\n`;

  const npcNames = Object.keys(pluginData.npc_status);
  if (npcNames.length > 0) {
    md += `##🗺️ NPC 动态\n\n`;
    npcNames.forEach(n => { md += `### ${n}\n${pluginData.npc_status[n].description || '未知'}\n*更新时间: ${pluginData.npc_status[n].lastUpdate}*\n\n`; });
  }
  if (pluginData.parallel_universes.length > 0) {
    md += `##🦋 平行宇宙\n\n`;
    pluginData.parallel_universes.forEach(p => { md += `### #${p.floor} — ${p.date}\n> **原文:** ${p.origin}\n\n${p.content}\n\n`; });
  }
  if (pluginData.fate_history.length > 0) {
    md += `## 🎲 命运之轮\n\n`;
    pluginData.fate_history.forEach(f => { md += `**[#${f.floor} ${f.timestamp}]** ${f.content}\n\n`; });
  }
  if (pluginData.world_feed.length > 0) {
    md += `## 📻 世界频段\n\n`;
    pluginData.world_feed.forEach(f => {
      const icon = f.type === 'gossip' ? '💬' : f.type === 'news' ? '📰' : '✨';
      md += `${icon} **[${f.timestamp}]** ${f.content}\n\n`;
    });
  }
  if (pluginData.achievements.length > 0) {
    md += `## 🏆 成就殿堂\n\n`;
    pluginData.achievements.forEach(a => { md += `- ${a.id} (${a.date})\n`; });
  }

  md += `\n---\n*© 2026SHADOW<安息之影>*\n`;
  dl(`bone_blood_${cn}_${Date.now()}.md`, md, 'text/markdown');
  toastr.success('📄Markdown 已导出！');
}

function exportAsJSON() {
  const ctx = getContext();
  const cn = ctx.name2 || '角色';
  const data = {
    exportTime: new Date().toISOString(),
    character: cn,
    user: ctx.name1,
    chatId: ctx.chatId,
    pluginData: pluginData,
  };
  dl(`bone_blood_${cn}_${Date.now()}.json`, JSON.stringify(data, null, 2), 'application/json');
  toastr.success('📦 JSON 已导出！');
}

// ============================================
// 宏注册
// ============================================

function registerAllMacros() {
  try {
    if (typeof MacrosParser !== 'undefined' && MacrosParser.registerMacro) {
      MacrosParser.registerMacro('bb_diary', () => {
        if (pluginData.diary_blood.length === 0) return '(暂无日记)';
        return pluginData.diary_blood[pluginData.diary_blood.length - 1].content;
      });
      MacrosParser.registerMacro('bb_summary', () => {
        if (pluginData.summaries.length === 0) return '(暂无总结)';
        return pluginData.summaries[pluginData.summaries.length - 1].content;
      });
      MacrosParser.registerMacro('bb_weather', () => pluginData.weather || '(环境未知)');
      MacrosParser.registerMacro('bb_chaos_event', () => {
        const evt = pluginData.chaos_event;
        if (!evt) return '(无事件)';
        pluginData.chaos_event = '';
        saveChatData();
        return evt;
      });
      MacrosParser.registerMacro('bb_vibe', () => pluginData.vibe || '(氛围未知)');
      MacrosParser.registerMacro('bb_npc_status', () => {
        const names = Object.keys(pluginData.npc_status);
        if (names.length === 0) return '(无NPC追踪)';
        return names.map(n => `【${n}】${pluginData.npc_status[n].description || '未知'}`).join('\n');
      });
      console.log('[骨与血]📝 6个宏已注册');
    } else {
      console.warn('[骨与血] 未找到宏系统');
    }
  } catch (e) {
    console.error('[骨与血] 宏注册失败:', e);
  }
}

// ============================================
// 移动端入口（修复版）
// ============================================

function createMobileFloatingButton() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isNarrowScreen = window.innerWidth <= 768;

  if (!isMobile && !isNarrowScreen) {
    $('#bb-mobile-float').remove();
    return;
  }

  if ($('#bb-mobile-float').length > 0) {
    $('#bb-mobile-float').css('display', 'flex');
    return;
  }

  const $float = $(`<div id="bb-mobile-float" title="打开骨与血面板">🦴</div>`);

  // 关键：直接用inline style强制显示
  $float.css({
    'display': 'flex',
    'position': 'fixed',
    'bottom': '100px',
    'right': '20px',
    'width': '56px',
    'height': '56px',
    'background':'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'border-radius': '50%',
    'align-items': 'center',
    'justify-content': 'center',
    'font-size': '28px',
    'box-shadow': '0 4px 15px rgba(0,0,0,0.4)',
    'cursor': 'pointer',
    'z-index': '99999',
    'user-select': 'none',
    '-webkit-user-select': 'none',
    '-webkit-tap-highlight-color': 'transparent',
  });

  $('body').append($float);

  // 触摸事件（区分点击和拖拽）
  let isDragging = false;
  let hasMoved = false;
  let startX, startY, floatStartRight, floatStartBottom;
  let clickStartTime;

  $float.on('touchstart', function (e) {
    isDragging = true;
    hasMoved = false;
    clickStartTime = Date.now();
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    floatStartRight = parseInt($float.css('right')) || 20;
    floatStartBottom = parseInt($float.css('bottom')) || 100;
  });

  $(document).on('touchmove.bbfloat', function (e) {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = -(touch.clientY - startY);

    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
      hasMoved = true;
    }

    if (hasMoved) {
      e.preventDefault();
      $float.css({
        'right': Math.max(5, Math.min(window.innerWidth - 62, floatStartRight - deltaX)) + 'px',
        'bottom': Math.max(60, Math.min(window.innerHeight - 62, floatStartBottom + deltaY)) + 'px','transition': 'none',
      });
    }
  });

  $(document).on('touchend.bbfloat', function () {
    if (!isDragging) return;
    isDragging = false;

    if (!hasMoved && (Date.now() - clickStartTime< 300)) {
      toggleMainPanel();
    } else if (hasMoved) {
      const currentRight = parseInt($float.css('right'));
      const halfScreen = (window.innerWidth - 56) / 2;
      $float.css('transition', 'right 0.3s ease');
      if (currentRight < halfScreen) {
        $float.css('right', '15px');
      } else {
        $float.css('right', (window.innerWidth - 71) + 'px');
      }
      try {
        localStorage.setItem('bb_float_pos', JSON.stringify({
          right: $float.css('right'),
          bottom: $float.css('bottom'),
        }));
      } catch (e) {}
    }
    hasMoved = false;
  });

  //鼠标事件（电脑端窄窗测试）
  $float.on('click', function (e) {
    e.stopPropagation();
    toggleMainPanel();
  });

  //恢复位置
  try {
    const saved = localStorage.getItem('bb_float_pos');
    if (saved) {
      const pos = JSON.parse(saved);
      $float.css({ 'right': pos.right, 'bottom': pos.bottom });
    }
  } catch (e) {}

  // 延迟添加动画
  setTimeout(() => {
    $float.css('animation', 'bb-float-pulse 2.5s infinite ease-in-out');
  }, 500);

  console.log('[骨与血] 📱 悬浮球已创建（inline style）');
}

function injectToNavBar() {
  if ($('#bb-nav-button').length > 0) return true;

  const $topBar = $('#top-bar');
  const $topSettings = $('#top-settings-holder');

  // 创建完全独立的按钮（不使用SillyTavern的任何class）
  const $navBtn = $(`<div id="bb-nav-button" title="骨与血"><i class="fa-solid fa-bone"></i></div>`);

  // 关键：阻止事件冒泡
  $navBtn.on('click', function (e) {
    e.stopPropagation();
    e.stopImmediatePropagation();e.preventDefault();
    toggleMainPanel();
    return false;
  });

  $navBtn.on('mousedown mouseup touchstart touchend', function (e) {
    e.stopPropagation();
    e.stopImmediatePropagation();
  });

  if ($topBar.length > 0) {
    $topBar.append($navBtn);
    console.log('[骨与血] 📌 导航栏按钮已注入到#top-bar');
    return true;
  } else if ($topSettings.length > 0) {
    $topSettings.prepend($navBtn);
    console.log('[骨与血] 📌 导航栏按钮已注入到 #top-settings-holder');
    return true;
  }

  console.warn('[骨与血] ⚠️ 未找到导航栏容器');
  return false;
}

function initMobileEntrance() {
  injectToNavBar();
  createMobileFloatingButton();

  let resizeTimer;
  $(window).on('resize.bbmobile', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      createMobileFloatingButton();
    }, 300);
  });

  console.log('[骨与血] ✅ 移动端入口初始化完成');
}

// ============================================
// 动态注入CSS（跑马灯+基础样式）
// ============================================

function injectDynamicCSS() {
  if ($('#bb-dynamic-style').length > 0) return;
  $('head').append(`
    <style id="bb-dynamic-style">
      @keyframes bb-scroll {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
      @keyframes bb-float-pulse {
        0%, 100% { box-shadow: 0 4px 15px rgba(0,0,0,0.4), 0 0 0 0 rgba(102,126,234,0.5); }
        50% { box-shadow: 0 4px 15px rgba(0,0,0,0.4), 0 0 0 12px rgba(102,126,234,0); }
      }
    </style>
  `);
}

// ============================================
// 入口
// ============================================

jQuery(async () => {
  console.log(`[骨与血] 🦴 v${VERSION} 开始加载...`);

  // 1. 初始化设置
  if (!extension_settings[EXTENSION_NAME]) {
    extension_settings[EXTENSION_NAME] = {};
  }
  extension_settings[EXTENSION_NAME] = Object.assign(
    {},
    defaultSettings,
    extension_settings[EXTENSION_NAME],
  );

  // 2. 注入动态CSS
  injectDynamicCSS();

  // 3. 注入设置面板
  $('#extensions_settings').append(buildSettingsPanelHTML());

  // 4. 填入已保存设置
  loadSettingsToForm();

  // 5.绑定设置面板事件
  bindSettingsPanelEvents();

  // 6. 应用自定义 CSS
  applyCustomCSS();

  // 7. 注入悬浮UI（主面板初始隐藏）
  injectFloatingUI();

  // 8. 注入蝴蝶窗口（初始隐藏）
  injectButterflyWindow();

  // 9. 注入破墙窗口（初始隐藏）
  injectOOCWindow();

  // 10. 注册事件
  registerEventListeners();

  // 11. 注册宏
  registerAllMacros();

  // 12. 加载聊天数据
  loadChatData();

  // 13. 为已有消息注入按钮
  setTimeout(() => injectButtonsToExistingMessages(), 800);

  // 14. 启动世界频段
  startWorldFeed();

  // 15. 检查成就
  checkAchievements();

  // 16. 初始化移动端入口
  setTimeout(() => initMobileEntrance(), 1000);

  // 17. 确保所有弹窗初始隐藏
  $('#bb-main-panel').hide();
  $('#bb-bf-win').hide();
  $('#bb-ooc-win').hide();

  console.log(`[骨与血] ✅ v${VERSION} 加载完成！`);
});

console.log(`[骨与血] 🦴 index.js v${VERSION} 完整加载`);









