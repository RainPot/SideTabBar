chrome.runtime.onConnect.addListener((port) => {
  console.log('新的连接已建立');
  
  port.onMessage.addListener(async (message) => {
    if (message.action === 'getTabs') {
      try {
        const tabs = await chrome.tabs.query({});
        port.postMessage({ type: 'tabsUpdated', tabs });
      } catch (error) {
        console.error('获取标签页错误:', error);
      }
    }
    
    if (message.action === 'switchTab') {
      try {
        await chrome.tabs.update(message.tabId, { active: true });
        await chrome.windows.update(message.windowId, { focused: true });
      } catch (error) {
        console.error('切换标签页错误:', error);
      }
    }
  });
  
  port.onDisconnect.addListener(() => {
    console.log('连接已断开');
  });
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('标签页管理器已安装');
}); 