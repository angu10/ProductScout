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
    const currentLanguage = PromptBridgeTranslator.getCurrentLanguage();

    return `
      <div class="promptbridge-header">
        <h3 class="promptbridge-title">🛍️ PromptBridge</h3>
        <div class="promptbridge-controls">
          <div class="promptbridge-language-selector">
            <select id="pb-language-select" class="promptbridge-language-dropdown">
              <option value="en" ${currentLanguage === 'en' ? 'selected' : ''}>🇺🇸 English</option>
              <option value="es" ${currentLanguage === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
            </select>
          </div>
          ${this.debugMode ? '<button class="promptbridge-btn" id="pb-debug-toggle">Debug</button>' : ''}
          <button class="promptbridge-btn" id="pb-minimize">−</button>
          <button class="promptbridge-btn" id="pb-close">×</button>
        </div>
      </div>
      <div class="promptbridge-content" id="pb-content">
        ${this.generateProductSection(productData)}
  ${hasAnalysis ? this.generateAnalysisSection(analysis) : `<div id="pb-analysis-section">${this.generateLoadingSection()}</div>`}
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
    const currentLanguage = PromptBridgeTranslator.getCurrentLanguage();

    // Wrap the entire analysis content in a dedicated container so updates and
    // language-change loading replace the same DOM node (prevents duplication)
    return `
      <div id="pb-analysis-section" class="promptbridge-analysis">
        <div class="promptbridge-section">
          <div class="promptbridge-section-title">${PromptBridgeTranslator.getLocalizedText('ai_analysis', currentLanguage)}</div>
          <div class="promptbridge-recommendation">
            ${analysis.recommendation || 'Analysis in progress...'}
          </div>
          ${analysis.valueAssessment ? `
            <div style="margin-top: 8px;">
              <span class="promptbridge-value-badge ${valueClass}">${PromptBridgeTranslator.getLocalizedText(analysis.valueAssessment, currentLanguage)} ${PromptBridgeTranslator.getLocalizedText('value_assessment', currentLanguage)}</span>
            </div>
          ` : ''}
        </div>

        ${analysis.pros && analysis.cons ? `
          <div class="promptbridge-section">
            <div class="promptbridge-section-title">${PromptBridgeTranslator.getLocalizedText('pros_cons', currentLanguage)}</div>
            <div class="promptbridge-pros-cons">
              <div class="promptbridge-pros">
                <div class="promptbridge-pros-title">✓ ${PromptBridgeTranslator.getLocalizedText('pros', currentLanguage)}</div>
                <ul class="promptbridge-list">
                  ${analysis.pros.map(pro => `<li>${pro}</li>`).join('')}
                </ul>
              </div>
              <div class="promptbridge-cons">
                <div class="promptbridge-cons-title">⚠ ${PromptBridgeTranslator.getLocalizedText('cons', currentLanguage)}</div>
                <ul class="promptbridge-list">
                  ${analysis.cons.map(con => `<li>${con}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        ` : ''}

        ${analysis.keyInsights && analysis.keyInsights.length > 0 ? `
          <div class="promptbridge-section">
            <div class="promptbridge-section-title">${PromptBridgeTranslator.getLocalizedText('key_insights', currentLanguage)}</div>
            <ul class="promptbridge-list">
              ${analysis.keyInsights.map(insight => `<li>${insight}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  static generateLoadingSection() {
    const currentLanguage = PromptBridgeTranslator.getCurrentLanguage();

    return `
      <div class="promptbridge-loading">
        <div class="promptbridge-spinner"></div>
        <div>${PromptBridgeTranslator.getLocalizedText('analyzing', currentLanguage)}</div>
        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-top: 4px;">
          ${PromptBridgeTranslator.getLocalizedText('loading', currentLanguage)}
        </div>
        <div class="translation-download-progress" style="font-size: 11px; color: rgba(255, 255, 255, 0.6); margin-top: 8px; display: none;">
          Downloading translation models...
        </div>
      </div>
    `;
  }

  static generateActionsSection() {
    const currentLanguage = PromptBridgeTranslator.getCurrentLanguage();

    return `
      <div class="promptbridge-actions">
        <button class="promptbridge-action-btn" id="pb-refresh">🔄 ${PromptBridgeTranslator.getLocalizedText('refresh', currentLanguage)}</button>
        <button class="promptbridge-action-btn" id="pb-compare">⚖️ ${PromptBridgeTranslator.getLocalizedText('compare', currentLanguage)}</button>
        <button class="promptbridge-action-btn" id="pb-save">💾 ${PromptBridgeTranslator.getLocalizedText('save', currentLanguage)}</button>
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

      // Language selector
      const languageSelect = widget.querySelector('#pb-language-select');
      if (languageSelect) {
        languageSelect.addEventListener('change', async (e) => {
          PromptBridgeHelpers.log('🌐 Language changed to:', e.target.value);
          await this.handleLanguageChange(e.target.value);
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

      // Replace the dedicated analysis container so partial updates don't
      // duplicate sections when language changes or when multiple updates occur.
      const analysisContainer = content.querySelector('#pb-analysis-section');
      if (analysisContainer && analysis) {
        const analysisHTML = this.generateAnalysisSection(analysis);
        analysisContainer.outerHTML = analysisHTML;

        PromptBridgeHelpers.log('✅ Widget updated successfully', {
          hasRecommendation: !!analysis.recommendation,
          prosCount: analysis.pros?.length || 0,
          consCount: analysis.cons?.length || 0
        });
        // Re-enable language selector when analysis is finished
        this.enableLanguageSelector();
        return;
      }

      // Fallback: if analysis container isn't present, try replacing loading
      const loadingSection = content.querySelector('.promptbridge-loading');
      if (loadingSection && analysis) {
        const analysisHTML = this.generateAnalysisSection(analysis);
        loadingSection.outerHTML = analysisHTML;

        PromptBridgeHelpers.log('✅ Widget updated successfully (fallback)', {
          hasRecommendation: !!analysis.recommendation
        });
        this.enableLanguageSelector();
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
        // Show loading state and then trigger analysis
        this.showLoadingState();
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

  static async handleLanguageChange(newLanguage) {
    try {
      PromptBridgeHelpers.log('🌐 Handling language change to:', newLanguage);

      // Update the translator language
      await PromptBridgeTranslator.setLanguage(newLanguage);

      // Show loading state
      const languageSelect = this.instance.querySelector('#pb-language-select');
      if (languageSelect) {
        languageSelect.disabled = true;
        languageSelect.style.opacity = '0.6';
      }

      // Update UI elements immediately
      this.updateLanguageElements();

      // Check if we have existing analysis to translate, or need fresh analysis
      if (window.PromptBridgeMain && window.PromptBridgeMain.currentAnalysis) {
        const currentAnalysis = window.PromptBridgeMain.currentAnalysis;
        const currentAnalysisLanguage = currentAnalysis.translationLanguage || 'en';

        if (currentAnalysisLanguage !== newLanguage) {
          // LANGUAGE SWITCH: Translate existing analysis
          PromptBridgeHelpers.log('🔄 LANGUAGE SWITCH: Translating existing analysis', {
            fromLanguage: currentAnalysisLanguage,
            toLanguage: newLanguage,
            hasExistingAnalysis: true
          });

          // Show loading state
          this.showLoadingState();

          // Translate existing analysis
          const translatedAnalysis = await PromptBridgeTranslator.translateAnalysis(currentAnalysis);

          // If translation failed (analysis did not change), trigger fresh analysis in new language
          const translationFailed = (
            translatedAnalysis === currentAnalysis ||
            (translatedAnalysis.recommendation === currentAnalysis.recommendation &&
              JSON.stringify(translatedAnalysis.pros) === JSON.stringify(currentAnalysis.pros) &&
              JSON.stringify(translatedAnalysis.cons) === JSON.stringify(currentAnalysis.cons))
          );

          if (translationFailed) {
            PromptBridgeHelpers.log('⚠️ Translation not possible for this direction, triggering fresh analysis in new language');
            // Show loading state and trigger fresh analysis
            this.showLoadingState();
            await window.PromptBridgeMain.analyzeCurrentProduct();
            return;
          }

          // Also translate displayed product data
          if (window.PromptBridgeMain.currentProductData) {
            const pd = window.PromptBridgeMain.currentProductData;
            const translatedTitle = await PromptBridgeTranslator.translateText(pd.title || '');
            const translatedBrand = pd.brand ? await PromptBridgeTranslator.translateText(pd.brand) : '';
            const translatedDescription = pd.description ? await PromptBridgeTranslator.translateText(pd.description) : '';
            const translatedProductType = pd.productType ? await PromptBridgeTranslator.translateText(pd.productType) : '';

            // Update productData preview used in the widget
            const translatedProductData = {
              ...pd,
              title: translatedTitle || pd.title,
              brand: translatedBrand || pd.brand,
              description: translatedDescription || pd.description,
              productType: translatedProductType || pd.productType
            };

            // Update the product section in the widget
            this.updateProductSection(translatedProductData);
          }

          // Update widget with translated analysis
          PromptBridgeWidget.update(translatedAnalysis);

          // Update main analysis
          window.PromptBridgeMain.currentAnalysis = translatedAnalysis;

          PromptBridgeHelpers.log('✅ LANGUAGE SWITCH COMPLETE: Analysis translated successfully');
        } else {
          PromptBridgeHelpers.log('ℹ️ Same language selected, no translation needed');
        }
      } else if (window.PromptBridgeMain && window.PromptBridgeMain.currentProductData) {
        // NO EXISTING ANALYSIS: Generate fresh analysis in new language
        PromptBridgeHelpers.log('🔄 FRESH ANALYSIS: Generating new analysis in', {
          newLanguage: newLanguage,
          hasProductData: true,
          hasExistingAnalysis: false
        });

        // Show loading state in widget
        this.showLoadingState();

        // Translate product data for the new language before triggering analysis
        const pd = window.PromptBridgeMain.currentProductData;
        const translatedTitle = pd.title ? await PromptBridgeTranslator.translateText(pd.title) : pd.title;
        const translatedBrand = pd.brand ? await PromptBridgeTranslator.translateText(pd.brand) : pd.brand;
        const translatedDescription = pd.description ? await PromptBridgeTranslator.translateText(pd.description) : pd.description;
        const translatedProductType = pd.productType ? await PromptBridgeTranslator.translateText(pd.productType) : pd.productType;

        const translatedProductData = {
          ...pd,
          title: translatedTitle || pd.title,
          brand: translatedBrand || pd.brand,
          description: translatedDescription || pd.description,
          productType: translatedProductType || pd.productType
        };

        this.updateProductSection(translatedProductData);

        // Trigger fresh analysis (the PromptProcessor may produce output in English which will then be translated)
        await window.PromptBridgeMain.analyzeCurrentProduct();
      } else {
        PromptBridgeHelpers.log('⚠️ No product data available for analysis');
      }

      // Re-enable language selector after a delay
      setTimeout(() => {
        if (languageSelect) {
          languageSelect.disabled = false;
          languageSelect.style.opacity = '1';
        }
      }, 3000); // Increased delay to allow for analysis completion

    } catch (error) {
      PromptBridgeHelpers.error('❌ Language change failed', error);

      // Re-enable language selector on error
      const languageSelect = this.instance.querySelector('#pb-language-select');
      if (languageSelect) {
        languageSelect.disabled = false;
        languageSelect.style.opacity = '1';
      }
    }
  }

  static updateProductSection(productData) {
    try {
      if (!this.instance) return;

      const productSection = this.instance.querySelector('.promptbridge-section');
      if (!productSection) return;

      // Replace only the product section markup using generateProductSection
      const newProductHTML = this.generateProductSection(productData);
      productSection.outerHTML = newProductHTML;

      PromptBridgeHelpers.log('✅ Product section updated for language change', { title: productData.title });
    } catch (error) {
      PromptBridgeHelpers.error('❌ Failed to update product section', error);
    }
  }

  static showLoadingState() {
    try {
      if (!this.instance) return;

      const content = this.instance.querySelector('#pb-content');
      if (!content) return;

      // Replace the dedicated analysis container with a loading section
      const analysisContainer = content.querySelector('#pb-analysis-section');
      const loadingHTML = `<div id="pb-analysis-section">${this.generateLoadingSection()}</div>`;

      if (analysisContainer) {
        analysisContainer.outerHTML = loadingHTML;
        PromptBridgeHelpers.log('✅ Loading state shown for language change');
        // Disable language selector while analysis is in progress
        this.disableLanguageSelector();
        return;
      }

      // Fallback: replace the first analysis-like section
      const analysisSection = content.querySelector('.promptbridge-section');
      if (analysisSection) {
        analysisSection.outerHTML = loadingHTML;
        PromptBridgeHelpers.log('✅ Loading state shown for language change (fallback)');
        this.disableLanguageSelector();
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ Failed to show loading state', error);
    }
  }

  static disableLanguageSelector() {
    try {
      if (!this.instance) return;
      const languageSelect = this.instance.querySelector('#pb-language-select');
      if (languageSelect) {
        languageSelect.disabled = true;
        languageSelect.style.opacity = '0.6';
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ Failed to disable language selector', error);
    }
  }

  static enableLanguageSelector() {
    try {
      if (!this.instance) return;
      const languageSelect = this.instance.querySelector('#pb-language-select');
      if (languageSelect) {
        languageSelect.disabled = false;
        languageSelect.style.opacity = '1';
      }
    } catch (error) {
      PromptBridgeHelpers.error('❌ Failed to enable language selector', error);
    }
  }

  static updateLanguageElements() {
    try {
      if (!this.instance) return;

      const currentLanguage = PromptBridgeTranslator.getCurrentLanguage();
      PromptBridgeHelpers.log('🔄 Updating UI elements for language:', currentLanguage);

      // Update action buttons
      const refreshBtn = this.instance.querySelector('#pb-refresh');
      if (refreshBtn) {
        refreshBtn.textContent = `🔄 ${PromptBridgeTranslator.getLocalizedText('refresh', currentLanguage)}`;
      }

      const compareBtn = this.instance.querySelector('#pb-compare');
      if (compareBtn) {
        compareBtn.textContent = `⚖️ ${PromptBridgeTranslator.getLocalizedText('compare', currentLanguage)}`;
      }

      const saveBtn = this.instance.querySelector('#pb-save');
      if (saveBtn) {
        saveBtn.textContent = `💾 ${PromptBridgeTranslator.getLocalizedText('save', currentLanguage)}`;
      }

      // Update debug button if present
      const debugBtn = this.instance.querySelector('#pb-debug-toggle');
      if (debugBtn) {
        debugBtn.textContent = PromptBridgeTranslator.getLocalizedText('debug', currentLanguage);
      }

      PromptBridgeHelpers.log('✅ UI elements updated for language:', currentLanguage);

    } catch (error) {
      PromptBridgeHelpers.error('❌ Failed to update language elements', error);
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