// PromptBridge Content Script - Main orchestration with Agent Workflow
class PromptBridgeMain {
  static currentProductData = null;
  static currentAnalysis = null;
  static isInitialized = false;
  static initAttempts = 0;
  static maxInitAttempts = 3;
  static useAgentWorkflow = true; // Toggle agent mode

  static async initialize() {
    try {
      this.initAttempts++;
      PromptBridgeHelpers.log('🚀 PromptBridge initializing...', {
        attempt: this.initAttempts,
        url: window.location.href,
        agentMode: this.useAgentWorkflow,
        timestamp: new Date().toISOString()
      });

      // Wait for page to be fully loaded
      if (document.readyState === 'loading') {
        PromptBridgeHelpers.log('🔄 Page still loading, waiting...');
        document.addEventListener('DOMContentLoaded', () => this.initialize());
        return;
      }

      // Detect if this is a product page
      const detectionResult = await ProductDetector.detectAndInit();
      if (!detectionResult) {
        PromptBridgeHelpers.log('❌ Not a supported product page, skipping initialization');
        return;
      }

      PromptBridgeHelpers.log('✅ Product page detected, proceeding with initialization', {
        site: detectionResult.config.name,
        productType: detectionResult.productType
      });

      // Extract product data
      this.currentProductData = await ProductExtractor.extractProductData(detectionResult);
      
      // Validate extracted data
      const validation = ProductExtractor.validateExtractedData(this.currentProductData);
      if (!validation.isValid) {
        PromptBridgeHelpers.error('❌ Product data validation failed', validation);
        if (this.initAttempts < this.maxInitAttempts) {
          PromptBridgeHelpers.log('🔄 Retrying initialization in 2 seconds...');
          setTimeout(() => this.initialize(), 2000);
          return;
        } else {
          PromptBridgeHelpers.error('❌ Max initialization attempts reached, showing error widget');
          this.showErrorWidget('Failed to extract product data after multiple attempts');
          return;
        }
      }

      // Create initial widget
      const widget = PromptBridgeWidget.create(this.currentProductData);
      if (!widget) {
        PromptBridgeHelpers.error('❌ Failed to create widget');
        return;
      }

      // Start AI analysis (with or without agent workflow)
      this.analyzeCurrentProduct();
      
      this.isInitialized = true;
      PromptBridgeHelpers.log('🎉 PromptBridge initialization completed successfully', {
        dataCompleteness: `${validation.completeness.toFixed(1)}%`,
        extractedFields: Object.keys(this.currentProductData).filter(key => 
          this.currentProductData[key] !== null && key !== 'extractionLog'
        ).length,
        agentModeEnabled: this.useAgentWorkflow
      });

      // Setup page change monitoring
      this.setupPageChangeMonitoring();

    } catch (error) {
      PromptBridgeHelpers.error('❌ PromptBridge initialization failed', error);
      
      if (this.initAttempts < this.maxInitAttempts) {
        PromptBridgeHelpers.log('🔄 Retrying initialization in 3 seconds...');
        setTimeout(() => this.initialize(), 3000);
      } else {
        this.showErrorWidget(`Initialization failed: ${error.message}`);
      }
    }
  }

  static async analyzeCurrentProduct() {
    try {
      if (!this.currentProductData) {
        throw new Error('No product data available for analysis');
      }

      // Set analyzing state
      PromptBridgeWidget.setAnalyzingState(true);

      PromptBridgeHelpers.log('🧠 Starting AI analysis of current product...', {
        productTitle: this.currentProductData.title,
        price: this.currentProductData.price,
        site: this.currentProductData.source.site,
        agentMode: this.useAgentWorkflow,
        currentLanguage: PromptBridgeWidget.getCurrentLanguage()
      });

      // Choose analysis method: Agent Workflow vs. Simple Analysis
      if (this.useAgentWorkflow && window.AgentWorkflowOrchestrator) {
        PromptBridgeHelpers.log('🤖 Using AGENT WORKFLOW for analysis...');
        this.currentAnalysis = await AgentWorkflowOrchestrator.executeAgentWorkflow(
          this.currentProductData
        );
      } else {
        PromptBridgeHelpers.log('📊 Using SIMPLE analysis (no agent)...');
        this.currentAnalysis = await PromptProcessor.analyzeProduct(
          this.currentProductData
        );
      }
      
      if (this.currentAnalysis.error) {
        PromptBridgeHelpers.error('❌ AI analysis completed with errors', this.currentAnalysis.error);
      } else {
        PromptBridgeHelpers.log('✅ AI analysis completed successfully', {
          hasRecommendation: !!this.currentAnalysis.recommendation,
          valueAssessment: this.currentAnalysis.valueAssessment,
          processingTime: this.currentAnalysis.metadata?.processingTime,
          isAgentBased: this.currentAnalysis.isAgentBased || false,
          agentSteps: this.currentAnalysis.agentWorkflow?.steps?.length || 0,
          currentLanguage: PromptBridgeWidget.getCurrentLanguage()
        });
      }

      // Update widget with analysis results
      PromptBridgeWidget.update(this.currentAnalysis);

      // Save analysis to storage for future reference
      await PromptBridgeHelpers.saveToStorage(
        `analysis_${this.currentProductData.source.url.split('/').pop()}`, 
        {
          productData: this.currentProductData,
          analysis: this.currentAnalysis,
          timestamp: new Date().toISOString(),
          language: PromptBridgeWidget.getCurrentLanguage()
        }
      );

    } catch (error) {
      PromptBridgeHelpers.error('❌ Product analysis failed', error);
      
      const errorAnalysis = {
        error: error.message,
        recommendation: 'Unable to analyze this product due to an AI processing error. Product data extraction was successful, but AI analysis failed.',
        pros: ['Product information extracted'],
        cons: ['AI analysis unavailable'],
        valueAssessment: 'unknown'
      };
      
      PromptBridgeWidget.update(errorAnalysis);
    } finally {
      // Clear analyzing state
      PromptBridgeWidget.setAnalyzingState(false);
    }
  }

  static setupPageChangeMonitoring() {
    try {
      PromptBridgeHelpers.log('👀 Setting up page change monitoring...');

      // Monitor URL changes (for SPAs)
      let currentUrl = window.location.href;
      
      const checkUrlChange = () => {
        if (window.location.href !== currentUrl) {
          PromptBridgeHelpers.log('🔄 URL changed detected', {
            from: currentUrl,
            to: window.location.href
          });
          
          currentUrl = window.location.href;
          
          // Clean up current state
          this.cleanup();
          
          // Reinitialize after a short delay
          setTimeout(() => this.initialize(), 1000);
        }
      };

      // Check every 2 seconds for URL changes
      setInterval(checkUrlChange, 2000);

      // Monitor DOM changes that might indicate page updates
      const observer = new MutationObserver((mutations) => {
        const significantChanges = mutations.some(mutation => 
          mutation.type === 'childList' && 
          mutation.addedNodes.length > 0 &&
          Array.from(mutation.addedNodes).some(node => 
            node.nodeType === Node.ELEMENT_NODE && 
            (node.id || node.className)
          )
        );

        if (significantChanges) {
          PromptBridgeHelpers.log('🔄 Significant DOM changes detected, checking if reinitialization needed');
          
          // Check if our widget is still present and product data is still valid
          if (!PromptBridgeWidget.isPresent() || !this.validateCurrentContext()) {
            PromptBridgeHelpers.log('🔄 Context validation failed, reinitializing...');
            setTimeout(() => this.initialize(), 500);
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      PromptBridgeHelpers.log('✅ Page change monitoring setup completed');
    } catch (error) {
      PromptBridgeHelpers.error('❌ Page change monitoring setup failed', error);
    }
  }

  static validateCurrentContext() {
    try {
      // Check if we're still on a product page
      const detection = ProductDetector.isProductPage();
      if (!detection) {
        return false;
      }

      // Check if key product elements are still present
      const { config } = detection;
      const titleElement = document.querySelector(config.selectors.title);
      const priceElement = document.querySelector(config.selectors.price);
      
      return !!(titleElement && priceElement);
    } catch (error) {
      PromptBridgeHelpers.error('❌ Context validation failed', error);
      return false;
    }
  }

  static showErrorWidget(errorMessage) {
    try {
      PromptBridgeHelpers.log('⚠️ Showing error widget', { error: errorMessage });
      
      const errorData = {
        title: 'PromptBridge Error',
        price: null,
        source: { site: 'Error', url: window.location.href },
        productType: 'error',
        extractionLog: []
      };

      const errorAnalysis = {
        error: errorMessage,
        recommendation: errorMessage,
        pros: [],
        cons: ['Extension error occurred'],
        valueAssessment: 'unknown'
      };

      PromptBridgeWidget.create(errorData, errorAnalysis);
    } catch (error) {
      PromptBridgeHelpers.error('❌ Failed to show error widget', error);
    }
  }

  static cleanup() {
    try {
      PromptBridgeHelpers.log('🧹 Cleaning up PromptBridge state...');
      
      // Remove widget
      PromptBridgeWidget.remove();
      
      // Clear current data
      this.currentProductData = null;
      this.currentAnalysis = null;
      this.isInitialized = false;
      this.initAttempts = 0;
      
      // Cleanup AI session
      PromptProcessor.cleanup();
      
      PromptBridgeHelpers.log('✅ Cleanup completed');
    } catch (error) {
      PromptBridgeHelpers.error('❌ Cleanup failed', error);
    }
  }

  static async getProductHistory() {
    try {
      const storage = await chrome.storage.local.get(null);
      const products = Object.entries(storage)
        .filter(([key]) => key.startsWith('product_') || key.startsWith('analysis_'))
        .map(([key, value]) => ({ key, ...value }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      PromptBridgeHelpers.log('📚 Retrieved product history', {
        totalProducts: products.length
      });
      
      return products;
    } catch (error) {
      PromptBridgeHelpers.error('❌ Failed to retrieve product history', error);
      return [];
    }
  }

  // Debug method to toggle agent mode
  static toggleAgentMode() {
    this.useAgentWorkflow = !this.useAgentWorkflow;
    PromptBridgeHelpers.log('🔄 Agent mode toggled', {
      agentMode: this.useAgentWorkflow
    });
    return this.useAgentWorkflow;
  }
}

// Global initialization
PromptBridgeHelpers.log('📦 PromptBridge content script loaded');

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => PromptBridgeMain.initialize(), 1000);
  });
} else {
  // DOM already loaded
  setTimeout(() => PromptBridgeMain.initialize(), 1000);
}

// Handle page focus (when switching back to tab)
window.addEventListener('focus', () => {
  PromptBridgeHelpers.log('👁️ Page focus detected');
  if (!PromptBridgeMain.isInitialized && ProductDetector.isProductPage()) {
    PromptBridgeHelpers.log('🔄 Page focused and not initialized, reinitializing...');
    setTimeout(() => PromptBridgeMain.initialize(), 500);
  }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    PromptBridgeHelpers.log('👁️ Page became visible');
    if (!PromptBridgeMain.isInitialized && ProductDetector.isProductPage()) {
      PromptBridgeHelpers.log('🔄 Page visible and not initialized, reinitializing...');
      setTimeout(() => PromptBridgeMain.initialize(), 500);
    }
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  PromptBridgeHelpers.log('👋 Page unloading, cleaning up...');
  PromptBridgeMain.cleanup();
});

// Make main class available globally for debugging
window.PromptBridgeMain = PromptBridgeMain;