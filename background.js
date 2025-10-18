// PromptBridge Background Service Worker with detailed logging
class PromptBridgeBackground {
  static isInitialized = false;
  static activeTabs = new Set();

  static async initialize() {
    try {
      console.log('[PromptBridge Background] 🚀 Initializing background service worker...');
      
      // Setup message listeners
      this.setupMessageListeners();
      
      // Setup tab event listeners
      this.setupTabListeners();
      
      // Setup context menu (optional for debugging)
      this.setupContextMenu();
      
      this.isInitialized = true;
      console.log('[PromptBridge Background] ✅ Background service worker initialized successfully');
      
    } catch (error) {
      console.error('[PromptBridge Background] ❌ Background initialization failed:', error);
    }
  }

  static setupMessageListeners() {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[PromptBridge Background] 📨 Message received:', {
          action: message.action,
          tabId: sender.tab?.id,
          url: sender.tab?.url
        });

        switch (message.action) {
          case 'ping':
            sendResponse({ status: 'pong', timestamp: Date.now() });
            break;

          case 'logActivity':
            this.logActivity(message.data, sender.tab?.id);
            sendResponse({ status: 'logged' });
            break;

          case 'saveAnalysis':
            this.saveAnalysis(message.data, sender.tab?.id)
              .then(result => sendResponse({ status: 'saved', result }))
              .catch(error => sendResponse({ status: 'error', error: error.message }));
            return true; // Keep message channel open for async response

          case 'getHistory':
            this.getAnalysisHistory()
              .then(history => sendResponse({ status: 'success', data: history }))
              .catch(error => sendResponse({ status: 'error', error: error.message }));
            return true; // Keep message channel open for async response

          case 'clearHistory':
            this.clearAnalysisHistory()
              .then(() => sendResponse({ status: 'cleared' }))
              .catch(error => sendResponse({ status: 'error', error: error.message }));
            return true; // Keep message channel open for async response

          default:
            console.log('[PromptBridge Background] ⚠️ Unknown message action:', message.action);
            sendResponse({ status: 'error', error: 'Unknown action' });
        }
      });

      console.log('[PromptBridge Background] ✅ Message listeners setup completed');
    } catch (error) {
      console.error('[PromptBridge Background] ❌ Message listener setup failed:', error);
    }
  }

  static setupTabListeners() {
    try {
      // Track active tabs
      chrome.tabs.onActivated.addListener((activeInfo) => {
        console.log('[PromptBridge Background] 📋 Tab activated:', activeInfo.tabId);
        this.activeTabs.add(activeInfo.tabId);
        
        // Clean up old tabs from the set (keep only last 10)
        if (this.activeTabs.size > 10) {
          const oldestTab = this.activeTabs.values().next().value;
          this.activeTabs.delete(oldestTab);
        }
      });

      // Handle tab updates
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
          console.log('[PromptBridge Background] 🔄 Tab updated:', {
            tabId,
            url: tab.url,
            title: tab.title
          });

          // Check if it's a supported e-commerce site
          const supportedSites = [
            'amazon.com',
            'ebay.com', 
            'walmart.com',
            'target.com'
          ];

          const isSupportedSite = supportedSites.some(site => tab.url.includes(site));
          
          if (isSupportedSite) {
            console.log('[PromptBridge Background] 🛍️ Supported e-commerce site detected');
            
            // Optionally inject content script if not already present
            this.ensureContentScriptInjected(tabId);
          }
        }
      });

      // Handle tab removal
      chrome.tabs.onRemoved.addListener((tabId) => {
        console.log('[PromptBridge Background] 🗑️ Tab removed:', tabId);
        this.activeTabs.delete(tabId);
      });

      console.log('[PromptBridge Background] ✅ Tab listeners setup completed');
    } catch (error) {
      console.error('[PromptBridge Background] ❌ Tab listener setup failed:', error);
    }
  }

  static setupContextMenu() {
    try {
      // Remove any existing context menu items
      chrome.contextMenus.removeAll(() => {
        // Create context menu for debugging/testing
        chrome.contextMenus.create({
          id: 'promptbridge-analyze',
          title: 'Analyze with PromptBridge',
          contexts: ['page'],
          documentUrlPatterns: [
            'https://www.amazon.com/*',
            'https://amazon.com/*',
            'https://www.ebay.com/*',
            'https://ebay.com/*',
            'https://www.walmart.com/*',
            'https://walmart.com/*',
            'https://www.target.com/*',
            'https://target.com/*'
          ]
        });

        chrome.contextMenus.create({
          id: 'promptbridge-debug',
          title: 'PromptBridge Debug Info',
          contexts: ['page']
        });
      });

      // Handle context menu clicks
      chrome.contextMenus.onClicked.addListener((info, tab) => {
        console.log('[PromptBridge Background] 📋 Context menu clicked:', info.menuItemId);
        
        switch (info.menuItemId) {
          case 'promptbridge-analyze':
            this.triggerAnalysis(tab.id);
            break;
          case 'promptbridge-debug':
            this.showDebugInfo(tab.id);
            break;
        }
      });

      console.log('[PromptBridge Background] ✅ Context menu setup completed');
    } catch (error) {
      console.error('[PromptBridge Background] ❌ Context menu setup failed:', error);
    }
  }

  static async ensureContentScriptInjected(tabId) {
    try {
      // Test if content script is already injected by sending a ping
      const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      console.log('[PromptBridge Background] ✅ Content script already active:', response);
    } catch (error) {
      // Content script not present, inject it
      console.log('[PromptBridge Background] 📦 Injecting content script...');
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [
            'utils/helpers.js',
            'agents/detector.js', 
            'agents/extractor.js',
            'ai/prompt-processor.js',
            'ui/widget.js',
            'content.js'
          ]
        });

        await chrome.scripting.insertCSS({
          target: { tabId },
          files: ['ui/styles.css']
        });

        console.log('[PromptBridge Background] ✅ Content script injected successfully');
      } catch (injectError) {
        console.error('[PromptBridge Background] ❌ Content script injection failed:', injectError);
      }
    }
  }

  static async triggerAnalysis(tabId) {
    try {
      console.log('[PromptBridge Background] 🧠 Triggering analysis for tab:', tabId);
      
      const response = await chrome.tabs.sendMessage(tabId, { 
        action: 'triggerAnalysis',
        timestamp: Date.now()
      });
      
      console.log('[PromptBridge Background] ✅ Analysis triggered:', response);
    } catch (error) {
      console.error('[PromptBridge Background] ❌ Failed to trigger analysis:', error);
    }
  }

  static async showDebugInfo(tabId) {
    try {
      console.log('[PromptBridge Background] 🐛 Showing debug info for tab:', tabId);
      
      const response = await chrome.tabs.sendMessage(tabId, { 
        action: 'showDebugInfo',
        timestamp: Date.now()
      });
      
      console.log('[PromptBridge Background] ✅ Debug info shown:', response);
    } catch (error) {
      console.error('[PromptBridge Background] ❌ Failed to show debug info:', error);
    }
  }

  static async logActivity(data, tabId) {
    try {
      const logEntry = {
        ...data,
        tabId,
        timestamp: Date.now(),
        date: new Date().toISOString()
      };

      // Store activity log
      const existingLogs = await chrome.storage.local.get('activity_logs');
      const logs = existingLogs.activity_logs || [];
      
      logs.push(logEntry);
      
      // Keep only last 100 entries
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      await chrome.storage.local.set({ activity_logs: logs });
      
      console.log('[PromptBridge Background] 📝 Activity logged:', logEntry);
    } catch (error) {
      console.error('[PromptBridge Background] ❌ Failed to log activity:', error);
    }
  }

  static async saveAnalysis(data, tabId) {
    try {
      const analysisEntry = {
        ...data,
        tabId,
        savedAt: Date.now(),
        date: new Date().toISOString()
      };

      const key = `analysis_${Date.now()}_${tabId}`;
      await chrome.storage.local.set({ [key]: analysisEntry });
      
      console.log('[PromptBridge Background] 💾 Analysis saved:', {
        key,
        productTitle: data.productData?.title,
        site: data.productData?.source?.site
      });
      
      return { key, savedAt: analysisEntry.savedAt };
    } catch (error) {
      console.error('[PromptBridge Background] ❌ Failed to save analysis:', error);
      throw error;
    }
  }

  static async getAnalysisHistory() {
    try {
      const storage = await chrome.storage.local.get(null);
      const analyses = Object.entries(storage)
        .filter(([key]) => key.startsWith('analysis_'))
        .map(([key, value]) => ({ key, ...value }))
        .sort((a, b) => b.savedAt - a.savedAt)
        .slice(0, 50); // Return last 50 analyses

      console.log('[PromptBridge Background] 📚 Retrieved analysis history:', {
        count: analyses.length
      });

      return analyses;
    } catch (error) {
      console.error('[PromptBridge Background] ❌ Failed to get analysis history:', error);
      throw error;
    }
  }

  static async clearAnalysisHistory() {
    try {
      const storage = await chrome.storage.local.get(null);
      const keysToRemove = Object.keys(storage).filter(key => 
        key.startsWith('analysis_') || key.startsWith('product_')
      );

      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log('[PromptBridge Background] 🗑️ Analysis history cleared:', {
          removedKeys: keysToRemove.length
        });
      }
    } catch (error) {
      console.error('[PromptBridge Background] ❌ Failed to clear analysis history:', error);
      throw error;
    }
  }
}

// Initialize background service worker
console.log('[PromptBridge Background] 📦 Background script loaded');
PromptBridgeBackground.initialize();

// Handle extension install/startup
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[PromptBridge Background] 🎉 Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    console.log('[PromptBridge Background] 👋 First install - setting up defaults');
    
    // Set default settings
    chrome.storage.local.set({
      settings: {
        debugMode: true,
        autoAnalyze: true,
        showNotifications: true,
        installedAt: Date.now()
      }
    });
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('[PromptBridge Background] 🔄 Extension startup detected');
  PromptBridgeBackground.initialize();
});

// Keep service worker alive
setInterval(() => {
  console.log('[PromptBridge Background] 💓 Service worker heartbeat');
}, 30000); // Every 30 seconds