// PromptBridge UI Widget with detailed logging
class PromptBridgeWidget {
  static instance = null;
  static isVisible = false;
  static isDragging = false;
  static debugMode = true; // Enable for development

  static create(productData, analysis = null) {
    try {
      PromptBridgeHelpers.log('🎨 Creating PromptBridge widget...');
      
      // Remove existing widget if present
      this.remove();

      const widget = document.createElement('div');
      widget.id = 'promptbridge-widget';
      widget.className = 'promptbridge-widget animate-in';
      
      widget.innerHTML = this.generateWidgetHTML(productData, analysis);
      
      document.body.appendChild(widget);
      this.instance = widget;
      this.isVisible = true;
      
      // Setup event listeners
      this.setupEventListeners(widget);
      
      // Make draggable
      this.makeDraggable(widget);
      
      PromptBridgeHelpers.log('✅ Widget created successfully', {
        hasAnalysis: !!analysis,
        widgetId: widget.id,
        position: { top: '20px', right: '20px' }
      });

      return widget;
    } catch (error) {
      PromptBridgeHelpers.error('❌ Widget creation failed', error);
      return null;
    }
  }

  static generateWidgetHTML(productData, analysis) {
    const hasAnalysis = analysis && !analysis.error;
    
    return `
      <div class="promptbridge-header">
        <h3 class="promptbridge-title">🛍️ PromptBridge</h3>
        <div class="promptbridge-controls">
          ${this.debugMode ? '<button class="promptbridge-btn" id="pb-debug-toggle">Debug</button>' : ''}
          <button class="promptbridge-btn" id="pb-minimize">−</button>
          <button class="promptbridge-btn" id="pb-close">×</button>
        </div>
      </div>
      <div class="promptbridge-content" id="pb-content">
        ${this.generateProductSection(productData)}
        ${hasAnalysis ? this.generateAnalysisSection(analysis) : this.generateLoadingSection()}
        ${this.generateActionsSection()}
        ${this.debugMode ? this.generateDebugSection(productData, analysis) : ''}
      </div>
    `;
  }

  static generateProductSection(productData) {
    const priceDisplay = productData.originalPrice 
      ? `<span class="promptbridge-product-price">$${productData.price}</span><span class="promptbridge-product-original-price">$${productData.originalPrice}</span>`
      : `<span class="promptbridge-product-price">$${productData.price}</span>`;

    const ratingDisplay = productData.rating 
      ? `<div class="promptbridge-product-rating">
           <span class="promptbridge-stars">${'★'.repeat(Math.floor(productData.rating))}${'☆'.repeat(5 - Math.floor(productData.rating))}</span>
           <span>${productData.rating}/5 ${productData.reviewCount ? `(${productData.reviewCount} reviews)` : ''}</span>
         </div>`
      : '';

    return `
      <div class="promptbridge-section">
        <div class="promptbridge-product-title">${productData.title || 'Product Title'}</div>
        ${productData.price ? priceDisplay : '<div class="promptbridge-error">Price not available</div>'}
        ${ratingDisplay}
        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-top: 8px;">
          From ${productData.source.site} • ${productData.productType}
        </div>
      </div>
    `;
  }

  static generateAnalysisSection(analysis) {
    const valueClass = `value-${analysis.valueAssessment || 'unknown'}`;
    
    return `
      <div class="promptbridge-section">
        <div class="promptbridge-section-title">AI Analysis</div>
        <div class="promptbridge-recommendation">
          ${analysis.recommendation || 'Analysis in progress...'}
        </div>
        ${analysis.valueAssessment ? `
          <div style="margin-top: 8px;">
            <span class="promptbridge-value-badge ${valueClass}">${analysis.valueAssessment} value</span>
          </div>
        ` : ''}
      </div>
      
      ${analysis.pros && analysis.cons ? `
        <div class="promptbridge-section">
          <div class="promptbridge-section-title">Pros & Cons</div>
          <div class="promptbridge-pros-cons">
            <div class="promptbridge-pros">
              <div class="promptbridge-pros-title">✓ Pros</div>
              <ul class="promptbridge-list">
                ${analysis.pros.map(pro => `<li>${pro}</li>`).join('')}
              </ul>
            </div>
            <div class="promptbridge-cons">
              <div class="promptbridge-cons-title">⚠ Cons</div>
              <ul class="promptbridge-list">
                ${analysis.cons.map(con => `<li>${con}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      ` : ''}

      ${analysis.keyInsights && analysis.keyInsights.length > 0 ? `
        <div class="promptbridge-section">
          <div class="promptbridge-section-title">Key Insights</div>
          <ul class="promptbridge-list">
            ${analysis.keyInsights.map(insight => `<li>${insight}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    `;
  }

  static generateLoadingSection() {
    return `
      <div class="promptbridge-loading">
        <div class="promptbridge-spinner"></div>
        <div>Analyzing product with AI...</div>
        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-top: 4px;">
          This may take a few seconds
        </div>
      </div>
    `;
  }

  static generateActionsSection() {
    return `
      <div class="promptbridge-actions">
        <button class="promptbridge-action-btn" id="pb-refresh">🔄 Refresh</button>
        <button class="promptbridge-action-btn" id="pb-compare">⚖️ Compare</button>
        <button class="promptbridge-action-btn" id="pb-save">💾 Save</button>
      </div>
    `;
  }

  static generateDebugSection(productData, analysis) {
    const extractionSuccess = productData.extractionLog 
      ? productData.extractionLog.filter(log => log.success).length
      : 0;
    
    const extractionTotal = productData.extractionLog 
      ? productData.extractionLog.length
      : 0;

    return `
      <div class="promptbridge-debug-panel" id="pb-debug-panel" style="display: none;">
        <div class="promptbridge-debug-title">Debug Information</div>
        <div class="promptbridge-debug-item">Extraction: ${extractionSuccess}/${extractionTotal} successful</div>
        <div class="promptbridge-debug-item">Site: ${productData.source?.site || 'Unknown'}</div>
        <div class="promptbridge-debug-item">Product Type: ${productData.productType || 'Unknown'}</div>
        <div class="promptbridge-debug-item">ASIN: ${productData.asin || 'N/A'}</div>
        ${analysis ? `
          <div class="promptbridge-debug-item">AI Processing: ${analysis.metadata?.processingTime || 'N/A'}ms</div>
          <div class="promptbridge-debug-item">Analysis Quality: ${analysis.error ? 'Error' : 'Success'}</div>
        ` : ''}
      </div>
    `;
  }

  static setupEventListeners(widget) {
    try {
      PromptBridgeHelpers.log('🔗 Setting up widget event listeners...');

      // Close button
      const closeBtn = widget.querySelector('#pb-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          PromptBridgeHelpers.log('👆 Close button clicked');
          this.remove();
        });
      }

      // Minimize button
      const minimizeBtn = widget.querySelector('#pb-minimize');
      if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
          PromptBridgeHelpers.log('👆 Minimize button clicked');
          this.toggle();
        });
      }

      // Debug toggle
      const debugToggle = widget.querySelector('#pb-debug-toggle');
      if (debugToggle) {
        debugToggle.addEventListener('click', () => {
          PromptBridgeHelpers.log('👆 Debug toggle clicked');
          this.toggleDebugPanel();
        });
      }

      // Action buttons
      const refreshBtn = widget.querySelector('#pb-refresh');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          PromptBridgeHelpers.log('👆 Refresh button clicked');
          this.handleRefresh();
        });
      }

      const compareBtn = widget.querySelector('#pb-compare');
      if (compareBtn) {
        compareBtn.addEventListener('click', () => {
          PromptBridgeHelpers.log('👆 Compare button clicked');
          this.handleCompare();
        });
      }

      const saveBtn = widget.querySelector('#pb-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          PromptBridgeHelpers.log('👆 Save button clicked');
          this.handleSave();
        });
      }

      PromptBridgeHelpers.log('✅ Event listeners setup completed');
    } catch (error) {
      PromptBridgeHelpers.error('❌ Event listener setup failed', error);
    }
  }

  static makeDraggable(widget) {
    try {
      const header = widget.querySelector('.promptbridge-header');
      if (!header) return;

      let isDragging = false;
      let currentX = 0;
      let currentY = 0;
      let initialX = 0;
      let initialY = 0;

      header.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return; // Don't drag when clicking buttons
        
        isDragging = true;
        header.style.cursor = 'grabbing';
        
        const rect = widget.getBoundingClientRect();
        initialX = e.clientX - rect.left;
        initialY = e.clientY - rect.top;
        
        PromptBridgeHelpers.log('🖱️ Drag started');
      });

      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        // Keep widget within viewport
        const maxX = window.innerWidth - widget.offsetWidth;
        const maxY = window.innerHeight - widget.offsetHeight;
        
        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));

        widget.style.left = currentX + 'px';
        widget.style.top = currentY + 'px';
        widget.style.right = 'auto';
      });

      document.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          header.style.cursor = 'move';
          PromptBridgeHelpers.log('🖱️ Drag ended', { x: currentX, y: currentY });
        }
      });

      header.style.cursor = 'move';
    } catch (error) {
      PromptBridgeHelpers.error('❌ Make draggable failed', error);
    }
  }

  static update(analysis) {
    try {
      if (!this.instance) return;

      PromptBridgeHelpers.log('🔄 Updating widget with analysis results...');

      const content = this.instance.querySelector('#pb-content');
      if (!content) return;

      // Find and replace the loading section
      const loadingSection = content.querySelector('.promptbridge-loading');
      if (loadingSection && analysis) {
        const analysisHTML = this.generateAnalysisSection(analysis);
        loadingSection.outerHTML = analysisHTML;
        
        PromptBridgeHelpers.log('✅ Widget updated successfully', {
          hasRecommendation: !!analysis.recommendation,
          prosCount: analysis.pros?.length || 0,
          consCount: analysis.cons?.length || 0
        });
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ Widget update failed', error);
    }
  }

  static toggle() {
    if (!this.instance) return;

    try {
      const content = this.instance.querySelector('.promptbridge-content');
      const minimizeBtn = this.instance.querySelector('#pb-minimize');

      if (this.instance.classList.contains('minimized')) {
        this.instance.classList.remove('minimized');
        content.style.display = 'block';
        minimizeBtn.textContent = '−';
        PromptBridgeHelpers.log('📖 Widget expanded');
      } else {
        this.instance.classList.add('minimized');
        content.style.display = 'none';
        minimizeBtn.textContent = '+';
        PromptBridgeHelpers.log('📕 Widget minimized');
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ Widget toggle failed', error);
    }
  }

  static toggleDebugPanel() {
    if (!this.instance) return;

    try {
      const debugPanel = this.instance.querySelector('#pb-debug-panel');
      if (debugPanel) {
        const isVisible = debugPanel.style.display !== 'none';
        debugPanel.style.display = isVisible ? 'none' : 'block';
        PromptBridgeHelpers.log(`🐛 Debug panel ${isVisible ? 'hidden' : 'shown'}`);
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ Debug panel toggle failed', error);
    }
  }

  static handleRefresh() {
    try {
      PromptBridgeHelpers.log('🔄 Handling refresh action...');
      
      // Trigger a re-analysis
      if (window.PromptBridgeMain && window.PromptBridgeMain.currentProductData) {
        window.PromptBridgeMain.analyzeCurrentProduct();
      } else {
        PromptBridgeHelpers.error('❌ No product data available for refresh');
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ Refresh action failed', error);
    }
  }

  static handleCompare() {
    try {
      PromptBridgeHelpers.log('⚖️ Handling compare action...');
      
      // Placeholder for future comparison functionality
      alert('Product comparison feature coming soon! This will search for similar products and provide side-by-side analysis.');
    } catch (error) {
      PromptBridgeHelpers.error('❌ Compare action failed', error);
    }
  }

  static async handleSave() {
    try {
      PromptBridgeHelpers.log('💾 Handling save action...');
      
      if (window.PromptBridgeMain && window.PromptBridgeMain.currentProductData) {
        const saved = await PromptBridgeHelpers.saveToStorage(
          `product_${Date.now()}`, 
          window.PromptBridgeMain.currentProductData
        );
        
        if (saved) {
          PromptBridgeHelpers.log('✅ Product saved successfully');
          // Show temporary feedback
          const saveBtn = this.instance.querySelector('#pb-save');
          if (saveBtn) {
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '✓ Saved';
            setTimeout(() => {
              saveBtn.textContent = originalText;
            }, 2000);
          }
        }
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ Save action failed', error);
    }
  }

  static remove() {
    try {
      if (this.instance) {
        PromptBridgeHelpers.log('🗑️ Removing widget...');
        this.instance.remove();
        this.instance = null;
        this.isVisible = false;
        PromptBridgeHelpers.log('✅ Widget removed successfully');
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ Widget removal failed', error);
    }
  }

  static isPresent() {
    return this.instance !== null && this.isVisible;
  }
}

// Make widget available globally
window.PromptBridgeWidget = PromptBridgeWidget;