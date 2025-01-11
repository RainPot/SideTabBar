let timeout;
let isVisible = false;
let updateInterval;

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

    updateTabs();
    // 存储 interval ID 以便清理
    updateInterval = setInterval(updateTabs, 1000);

    // 添加错误处理
    window.addEventListener('error', handleError);
  } catch (error) {
    console.error('初始化错误:', error);
    cleanup();
  }
}

function handleMouseMove(e) {
  try {
    if (e.clientX <= 10 && !isVisible) {
      clearTimeout(timeout);
      showTabManager();
    } else if (e.clientX > 310 && isVisible) {
      timeout = setTimeout(hideTabManager, 500);
    }
  } catch (error) {
    console.error('鼠标移动处理错误:', error);
    cleanup();
  }
}

function showTabManager() {
  try {
    isVisible = true;
    const tabManager = document.getElementById('tab-manager');
    if (tabManager) {
      tabManager.classList.add('visible');
    }
  } catch (error) {
    console.error('显示标签管理器错误:', error);
  }
}

function hideTabManager() {
  try {
    isVisible = false;
    const tabManager = document.getElementById('tab-manager');
    if (tabManager) {
      tabManager.classList.remove('visible');
    }
  } catch (error) {
    console.error('隐藏标签管理器错误:', error);
  }
}

function updateTabs() {
  try {
    chrome.runtime.sendMessage({ action: 'getTabs' }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('获取标签页错误:', chrome.runtime.lastError);
        cleanup();
        return;
      }

      if (!tabs) return;
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
          try {
            chrome.runtime.sendMessage({ 
              action: 'switchTab', 
              tabId: tab.id,
              windowId: tab.windowId 
            });
          } catch (error) {
            console.error('切换标签页错误:', error);
          }
        });

        tabsList.appendChild(li);
      });
    });
  } catch (error) {
    console.error('更新标签页错误:', error);
    cleanup();
  }
}

function handleError(error) {
  console.error('扩展错误:', error);
  cleanup();
}

function cleanup() {
  try {
    // 清理所有事件监听器和定时器
    clearInterval(updateInterval);
    clearTimeout(timeout);
    document.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('error', handleError);

    // 移除 DOM 元素
    const tabManager = document.getElementById('tab-manager');
    if (tabManager) {
      tabManager.remove();
    }
  } catch (error) {
    console.error('清理错误:', error);
  }
}

// 初始化
init();

// 添加重新连接逻辑
chrome.runtime.connect().onDisconnect.addListener(() => {
  console.log('扩展已断开连接，正在清理...');
  cleanup();
}); 