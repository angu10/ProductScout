// PromptBridge Popup Script with detailed logging
class PopupController {
  static isInitialized = false;
  static currentTab = null;
  static activityLog = [];

  static async initialize() {
    try {
      console.log('[PromptBridge Popup] 🚀 Initializing popup...');
      
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      
      console.log('[PromptBridge Popup] 📋 Current tab:', {
        id: tab.id,
        url: tab.url,
        title: tab.title
      });

      // Setup event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadInitialData();
      
      // Show main content
      document.getElementById('loading-state').classList.add('hidden');
      document.getElementById('main-content').classList.remove('hidden');
      
      this.isInitialized = true;
      this.logActivity('Popup initialized successfully');
      
      console.log('[PromptBridge Popup] ✅ Popup initialization completed');
      
    } catch (error) {
      console.error('[PromptBridge Popup] ❌ Popup initialization failed:', error);
      this.showError('Failed to initialize popup: ' + error.message);
    }
  }

  static setupEventListeners() {
    try {
      console.log('[PromptBridge Popup] 🔗 Setting up event listeners...');

      // Analyze current page
      document.getElementById('analyze-current').addEventListener('click', async () => {
        try {
          this.logActivity('Analyze current page clicked');
          await this.analyzeCurrentPage();
        } catch (error) {
          this.showError('Analysis failed: ' + error.message);
        }
      });

      // View history
      document.getElementById('view-history').addEventListener('click', async () => {
        try {
          this.logActivity('View history clicked');
          await this.viewHistory();
        } catch (error) {
          this.showError('Failed to load history: ' + error.message);
        }
      });

      // Clear data
      document.getElementById('clear-data').addEventListener('click', async () => {
        try {
          if (confirm('Are you sure you want to clear all saved data?')) {
            this.logActivity('Clear data confirmed');
            await this.clearData();
          }
        } catch (error) {
          this.showError('Failed to clear data: ' + error.message);
        }
      });

      // Toggle debug mode
      document.getElementById('toggle-debug').addEventListener('click', async () => {
        try {
          this.logActivity('Toggle debug mode clicked');
          await this.toggleDebugMode();
        } catch (error) {
          this.showError('Failed to toggle debug mode: ' + error.message);
        }
      });

      console.log('[PromptBridge Popup] ✅ Event listeners setup completed');
    } catch (error) {
      console.error('[PromptBridge Popup] ❌ Event listener setup failed:', error);
    }
  }

  static async loadInitialData() {
    try {
      console.log('[PromptBridge Popup] 📊 Loading initial data...');

      // Check extension status
      await this.updateStatus();
      
      // Load statistics
      await this.updateStatistics();
      
      // Load recent activity
      await this.updateActivityLog();

      console.log('[PromptBridge Popup] ✅ Initial data loaded successfully');
    } catch (error) {
      console.error('[PromptBridge Popup] ❌ Failed to load initial data:', error);
    }
  }

  static async updateStatus() {
    try {
      const statusIndicator = document.getElementById('status-indicator');
      const statusText = document.getElementById('status-text');

      // Check if current page is supported
      const supportedSites = ['amazon.com', 'ebay.com', 'walmart.com', 'target.com'];
      const isSupportedSite = supportedSites.some(site => this.currentTab.url.includes(site));

      if (isSupportedSite) {
        // Try to ping content script
        try {
          const response = await chrome.tabs.sendMessage(this.currentTab.id, { action: 'ping' });
          if (response && response.status === 'pong') {
            statusIndicator.className = 'status-indicator';
            statusText.textContent = 'Active on supported site';
            console.log('[PromptBridge Popup] ✅ Content script active');
          } else {
            statusIndicator.className = 'status-indicator warning';
            statusText.textContent = 'Supported site, initializing...';
            console.log('[PromptBridge Popup] ⚠️ Content script not responding');
          }
        } catch (error) {
          statusIndicator.className = 'status-indicator warning';
          statusText.textContent = 'Loading on supported site...';
          console.log('[PromptBridge Popup] ⚠️ Content script not available yet');
        }
      } else {
        statusIndicator.className = 'status-indicator error';
        statusText.textContent = 'Not on a supported shopping site';
        console.log('[PromptBridge Popup] ❌ Unsupported site');
      }
    } catch (error) {
      console.error('[PromptBridge Popup] ❌ Status update failed:', error);
    }
  }

  static async updateStatistics() {
    try {
      // Get analysis history from background
      const response = await chrome.runtime.sendMessage({ action: 'getHistory' });
      
      if (response.status === 'success') {
        const analysesCount = response.data.length;
        const uniqueProducts = new Set(
          response.data.map(item => item.productData?.title).filter(Boolean)
        ).size;

        document.getElementById('analyses-count').textContent = analysesCount;
        document.getElementById('products-saved').textContent = uniqueProducts;

        console.log('[PromptBridge Popup] 📊 Statistics updated:', {
          analyses: analysesCount,
          products: uniqueProducts
        });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('[PromptBridge Popup] ❌ Statistics update failed:', error);
      document.getElementById('analyses-count').textContent = '?';
      document.getElementById('products-saved').textContent = '?';
    }
  }

  static async updateActivityLog() {
    try {
      const logContainer = document.getElementById('activity-log');
      
      // Get recent activity logs
      const storage = await chrome.storage.local.get('activity_logs');
      const logs = storage.activity_logs || [];
      
      // Show last 5 entries
      const recentLogs = logs.slice(-5).reverse();
      
      if (recentLogs.length > 0) {
        logContainer.innerHTML = recentLogs.map(log => 
          `<div class="log-entry">${this.formatLogEntry(log)}</div>`
        ).join('');
      } else {
        logContainer.innerHTML = '<div class="log-entry">No recent activity</div>';
      }

      console.log('[PromptBridge Popup] 📝 Activity log updated:', recentLogs.length, 'entries');
    } catch (error) {
      console.error('[PromptBridge Popup] ❌ Activity log update failed:', error);
    }
  }

  static formatLogEntry(log) {
    const time = new Date(log.timestamp).toLocaleTimeString();
    return `${time} - ${log.message || log.action || 'Activity'}`;
  }

  static async analyzeCurrentPage() {
    try {
      console.log('[PromptBridge Popup] 🧠 Starting current page analysis...');
      
      // Update button to show loading state
      const button = document.getElementById('analyze-current');
      const originalText = button.textContent;
      button.textContent = '🔄 Analyzing...';
      button.disabled = true;

      // Send message to content script
      const response = await chrome.tabs.sendMessage(this.currentTab.id, { 
        action: 'triggerAnalysis',
        timestamp: Date.now()
      });

      console.log('[PromptBridge Popup] ✅ Analysis triggered:', response);
      
      // Show success feedback
      button.textContent = '✅ Analysis Started';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);

      // Log activity
      await chrome.runtime.sendMessage({
        action: 'logActivity',
        data: {
          action: 'manual_analysis_triggered',
          message: 'Manual analysis triggered from popup',
          url: this.currentTab.url
        }
      });

      // Update statistics after a delay
      setTimeout(() => this.updateStatistics(), 3000);

    } catch (error) {
      console.error('[PromptBridge Popup] ❌ Analysis failed:', error);
      
      // Reset button
      const button = document.getElementById('analyze-current');
      button.textContent = '❌ Analysis Failed';
      button.disabled = false;
      
      setTimeout(() => {
        button.textContent = '🧠 Analyze Current Page';
      }, 3000);
      
      throw error;
    }
  }

  static async viewHistory() {
    try {
      console.log('[PromptBridge Popup] 📚 Loading analysis history...');

      const response = await chrome.runtime.sendMessage({ action: 'getHistory' });
      
      if (response.status === 'success') {
        const history = response.data;
        
        if (history.length === 0) {
          alert('No analysis history found. Analyze some products first!');
          return;
        }

        // Create a simple history display
        const historyText = history.slice(0, 10).map((item, index) => {
          const date = new Date(item.savedAt).toLocaleString();
          const title = item.productData?.title?.substring(0, 50) || 'Unknown Product';
          const site = item.productData?.source?.site || 'Unknown Site';
          return `${index + 1}. ${title}... (${site}) - ${date}`;
        }).join('\n\n');

        alert(`Analysis History (Last 10):\n\n${historyText}`);
        
        console.log('[PromptBridge Popup] ✅ History displayed:', history.length, 'items');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('[PromptBridge Popup] ❌ History loading failed:', error);
      throw error;
    }
  }

  static async clearData() {
    try {
      console.log('[PromptBridge Popup] 🗑️ Clearing all data...');

      const response = await chrome.runtime.sendMessage({ action: 'clearHistory' });
      
      if (response.status === 'cleared') {
        // Update UI
        await this.updateStatistics();
        await this.updateActivityLog();
        
        // Show success feedback
        const button = document.getElementById('clear-data');
        const originalText = button.textContent;
        button.textContent = '✅ Data Cleared';
        
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);

        console.log('[PromptBridge Popup] ✅ Data cleared successfully');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('[PromptBridge Popup] ❌ Data clearing failed:', error);
      throw error;
    }
  }

  static async toggleDebugMode() {
    try {
      console.log('[PromptBridge Popup] 🐛 Toggling debug mode...');

      // Get current settings
      const storage = await chrome.storage.local.get('settings');
      const settings = storage.settings || {};
      
      // Toggle debug mode
      settings.debugMode = !settings.debugMode;
      
      // Save settings
      await chrome.storage.local.set({ settings });

      // Show feedback
      const button = document.getElementById('toggle-debug');
      button.textContent = settings.debugMode ? '🐛 Debug: ON' : '🐛 Debug: OFF';
      
      setTimeout(() => {
        button.textContent = '🐛 Toggle Debug Mode';
      }, 2000);

      console.log('[PromptBridge Popup] ✅ Debug mode toggled:', settings.debugMode);
    } catch (error) {
      console.error('[PromptBridge Popup] ❌ Debug mode toggle failed:', error);
      throw error;
    }
  }

  static logActivity(message) {
    this.activityLog.push({
      message,
      timestamp: Date.now()
    });
    
    // Keep only last 10 entries
    if (this.activityLog.length > 10) {
      this.activityLog.shift();
    }

    console.log('[PromptBridge Popup] 📝 Activity logged:', message);
  }

  static showError(message) {
    console.error('[PromptBridge Popup] ❌ Error:', message);
    alert(`PromptBridge Error: ${message}`);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('[PromptBridge Popup] 📦 Popup DOM loaded');
  PopupController.initialize();
});

console.log('[PromptBridge Popup] 📦 Popup script loaded');