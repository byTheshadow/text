// 导入 ST 提供的内置模块和事件系统
import { extension_settings, getContext } from "../../../extensions.js";
import { eventSource, event_types } from "../../../../script.js";

// 1. 初始化UI
async function initUI() {
    // 读取我们写的 html 文件
    const htmlResponse = await fetch('scripts/extensions/third-party/SillyTavern-DynamicMemoryCore/index.html');
    const htmlText = await htmlResponse.text();
    
    // 把我们的UI插入到ST的扩展设置面板中
    $('#extensions_settings').append(htmlText);

    // 绑定按钮点击事件
    $('#dmc-btn-test').on('click', () => {
        toastr.success("记忆核心前端已激活！"); // ST 内置的提示框
    });
}

// 2. 拦截并修改 Prompt (实现计划书 4.2 节)
async function onPromptReady(eventData) {
    // 假设从后端获取的记忆数据如下 (目前硬编码，后面替换为真实API)
    const mockMemory = "【记忆碎片：角色正在感到极度饥饿，并且对刚才发生的事情感到困惑。】";

    // 检查发给AI的最终Prompt中是否包含占位符
    if (eventData.prompt && eventData.prompt.includes('{{memory_inject}}')) {
        // 替换占位符
        eventData.prompt = eventData.prompt.replace('{{memory_inject}}', mockMemory);
        console.log("🧠 动态记忆核心：已成功注入记忆到Prompt中。");
    }
}

// 3. 插件的入口函数，ST启动时会调用这个
jQuery(async () => {
    // 初始化界面
    await initUI();

    // 监听核心事件：CHAT_COMPLETION_PROMPT_READY
    // 当 ST 组合完所有的提示词，准备发送给大模型时触发
    eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, onPromptReady);
});
