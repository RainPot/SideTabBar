let timeout;
let isVisible = false;
let updateInterval;
let port;

function connectToExtension() {
  try {
    port = chrome.runtime.connect({ name: "tabManager" });
    port.onDisconnect.addListener(() => {
      console.log('与扩展的连接已断开，正在重新连接...');
      setTimeout(connectToExtension, 1000); // 1秒后尝试重新连接
    });
    
    port.onMessage.addListener((message) => {
      if (message.type === 'tabsUpdated') {
        updateTabsList(message.tabs);
      }
    });
  } catch (error) {
    console.error('连接扩展错误:', error);
    setTimeout(connectToExtension, 1000);
  }
}

function init() {
  try {
    const container = document.createElement('div');
    container.id = 'tab-manager';
    container.innerHTML = `
      <div class="tabs-container">
        <ul id="tabs-list"></ul>
      </div>
    `;
    document.body.appendChild(container);

    document.addEventListener('mousemove', handleMouseMove);
    connectToExtension();
    
    // 定期请求更新标签列表
    updateInterval = setInterval(() => {
      if (port) {
        port.postMessage({ action: 'getTabs' });
      }
    }, 1000);
  } catch (error) {
    console.error('初始化错误:', error);
    cleanup();
  }
}

function handleMouseMove(e) {
  if (e.clientX <= 10 && !isVisible) {
    clearTimeout(timeout);
    showTabManager();
  } else if (e.clientX > 300 && isVisible) {
    hideTabManager();
  }
}

function showTabManager() {
  isVisible = true;
  const tabManager = document.getElementById('tab-manager');
  if (tabManager) {
    clearTimeout(timeout);
    tabManager.classList.add('visible');
  }
}

function hideTabManager() {
  isVisible = false;
  const tabManager = document.getElementById('tab-manager');
  if (tabManager) {
    clearTimeout(timeout);
    tabManager.classList.remove('visible');
  }
}

function updateTabsList(tabs) {
  const tabsList = document.getElementById('tabs-list');
  if (!tabsList) return;
  
  tabsList.innerHTML = '';

  tabs.forEach(tab => {
    const li = document.createElement('li');
    li.className = 'tab-item';
    
    const favicon = document.createElement('img');
    favicon.className = 'tab-favicon';
    favicon.src = tab.favIconUrl || chrome.runtime.getURL('icons/icon.png');
    
    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = tab.title;

    li.appendChild(favicon);
    li.appendChild(title);
    
    li.addEventListener('click', () => {
      if (port) {
        port.postMessage({ 
          action: 'switchTab', 
          tabId: tab.id,
          windowId: tab.windowId 
        });
      }
    });

    tabsList.appendChild(li);
  });
}

function cleanup() {
  clearInterval(updateInterval);
  clearTimeout(timeout);
  document.removeEventListener('mousemove', handleMouseMove);
  
  const tabManager = document.getElementById('tab-manager');
  if (tabManager) {
    tabManager.remove();
  }
  
  if (port) {
    port.disconnect();
  }
}

// 初始化
init();

// 页面卸载时清理
window.addEventListener('unload', cleanup); 