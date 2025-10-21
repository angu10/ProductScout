// Enhanced Widget with Agent Thinking Visualization and Language Support
class PromptBridgeWidget {
  static widgetId = 'promptbridge-widget';
  static currentWidget = null;
  static currentLanguage = 'en';
  static isAnalyzing = false;

  static create(productData, analysisData = null) {
    try {
      PromptBridgeHelpers.log('🎨 Creating widget...', {
        hasProductData: !!productData,
        hasAnalysis: !!analysisData
      });

      // Remove existing widget if present
      this.remove();

      // Create widget container
      const widget = document.createElement('div');
      widget.id = this.widgetId;
      widget.className = 'promptbridge-widget';
      
      // Widget HTML structure
      widget.innerHTML = `
        <div class="pb-header">
          <span class="pb-logo">🤖 PromptBridge AI</span>
          <div class="pb-language-selector">
            <select id="pb-language-select" ${this.isAnalyzing ? 'disabled' : ''}>
              <option value="en" ${this.currentLanguage === 'en' ? 'selected' : ''}>🇺🇸 English</option>
              <option value="fr" ${this.currentLanguage === 'fr' ? 'selected' : ''}>🇫🇷 Français</option>
            </select>
          </div>
          <button class="pb-close" aria-label="Close">&times;</button>
        </div>
        
        <div class="pb-content">
          <div class="pb-product-info">
            <h3 class="pb-product-title">${this.truncate(productData.title, 60)}</h3>
            <div class="pb-product-meta">
              <span class="pb-price">$${productData.price}</span>
              ${productData.rating ? `
                <span class="pb-rating">
                  ⭐ ${productData.rating}/5
                  ${productData.reviewCount ? `(${productData.reviewCount.toLocaleString()} reviews)` : ''}
                </span>
              ` : ''}
            </div>
          </div>

          ${analysisData ? this.renderAnalysis(analysisData) : this.renderLoading()}
        </div>
      `;

      // Add to page
      document.body.appendChild(widget);
      this.currentWidget = widget;

      // Setup event listeners
      this.setupEventListeners(widget);

      PromptBridgeHelpers.log('✅ Widget created successfully', {
        hasAnalysis: !!analysisData,
        widgetId: this.widgetId,
        position: this.getPosition()
      });

      return widget;
    } catch (error) {
      PromptBridgeHelpers.error('❌ Widget creation failed', error);
      return null;
    }
  }

  static renderLoading() {
    const loadingMessages = {
      'en': {
        analyzing: '🧠 AI Agent analyzing product...',
        status: 'Initializing agent workflow'
      },
      'fr': {
        analyzing: '🧠 Agent IA analysant le produit...',
        status: 'Initialisation du flux de travail de l\'agent'
      }
    };

    const messages = loadingMessages[this.currentLanguage] || loadingMessages['en'];

    return `
      <div class="pb-loading">
        <div class="pb-spinner"></div>
        <p>${messages.analyzing}</p>
        <div class="pb-agent-status">
          <div class="pb-thinking-dots">
            <span>.</span><span>.</span><span>.</span>
          </div>
          <p class="pb-status-text">${messages.status}</p>
        </div>
      </div>
    `;
  }

  static renderAnalysis(analysis) {
    const isAgentBased = analysis.isAgentBased && analysis.agentWorkflow;
    
    const labels = {
      'en': {
        recommendation: '💡 Recommendation',
        valueAssessment: '💰 Value Assessment',
        pros: '✅ Pros',
        cons: '⚠️ Cons',
        keyInsights: '🔍 Key Insights',
        nextSteps: '📋 Agent Suggested Next Steps',
        agentDecision: 'Agent Decision:',
        confidence: 'confidence'
      },
      'fr': {
        recommendation: '💡 Recommandation',
        valueAssessment: '💰 Évaluation de la Valeur',
        pros: '✅ Avantages',
        cons: '⚠️ Inconvénients',
        keyInsights: '🔍 Idées Clés',
        nextSteps: '📋 Étapes Suggérées par l\'Agent',
        agentDecision: 'Décision de l\'Agent:',
        confidence: 'confiance'
      }
    };

    const currentLabels = labels[this.currentLanguage] || labels['en'];
    
    return `
      ${isAgentBased ? this.renderAgentThinking(analysis.agentWorkflow) : ''}
      
      <div class="pb-analysis">
        <div class="pb-section pb-recommendation">
          <h4>${currentLabels.recommendation}</h4>
          <p>${analysis.recommendation}</p>
          ${analysis.agentWorkflow?.results?.finalRecommendation ? `
            <div class="pb-agent-decision">
              <strong>${currentLabels.agentDecision}</strong> 
              <span class="pb-decision-badge pb-decision-${analysis.agentWorkflow.results.finalRecommendation.decision}">
                ${analysis.agentWorkflow.results.finalRecommendation.decision.toUpperCase()}
              </span>
              <span class="pb-confidence">
                (${Math.round(analysis.agentWorkflow.results.finalRecommendation.confidence * 100)}% ${currentLabels.confidence})
              </span>
            </div>
          ` : ''}
        </div>

        <div class="pb-section pb-value">
          <h4>${currentLabels.valueAssessment}</h4>
          <span class="pb-badge pb-badge-${analysis.valueAssessment}">${analysis.valueAssessment}</span>
        </div>

        <div class="pb-section pb-pros-cons">
          <div class="pb-pros">
            <h4>${currentLabels.pros}</h4>
            <ul>
              ${analysis.pros.map(pro => `<li>${pro}</li>`).join('')}
            </ul>
          </div>
          <div class="pb-cons">
            <h4>${currentLabels.cons}</h4>
            <ul>
              ${analysis.cons.map(con => `<li>${con}</li>`).join('')}
            </ul>
          </div>
        </div>

        ${analysis.keyInsights && analysis.keyInsights.length > 0 ? `
          <div class="pb-section pb-insights">
            <h4>${currentLabels.keyInsights}</h4>
            <ul>
              ${analysis.keyInsights.map(insight => `<li>${insight}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${isAgentBased && analysis.agentWorkflow?.results?.finalRecommendation?.nextSteps ? `
          <div class="pb-section pb-next-steps">
            <h4>${currentLabels.nextSteps}</h4>
            <ol>
              ${analysis.agentWorkflow.results.finalRecommendation.nextSteps.map(step => 
                `<li>${step}</li>`
              ).join('')}
            </ol>
          </div>
        ` : ''}
      </div>

      ${this.renderMetadata(analysis)}
    `;
  }

  static renderAgentThinking(workflow) {
    if (!workflow || !workflow.steps) return '';

    return `
      <div class="pb-agent-thinking">
        <button class="pb-thinking-toggle" onclick="this.parentElement.classList.toggle('expanded')">
          🧠 Agent Thinking Process 
          <span class="pb-toggle-icon">▼</span>
        </button>
        
        <div class="pb-thinking-content">
          <div class="pb-thinking-steps">
            <h5>🔄 Execution Steps:</h5>
            <div class="pb-steps-list">
              ${workflow.steps.map((step, index) => `
                <div class="pb-step">
                  <span class="pb-step-number">${index + 1}</span>
                  <span class="pb-step-name">${this.formatStepName(step)}</span>
                  <span class="pb-step-status">✓</span>
                </div>
              `).join('')}
            </div>
          </div>

          ${workflow.decisions && workflow.decisions.length > 0 ? `
            <div class="pb-thinking-decisions">
              <h5>🤔 Agent Decisions:</h5>
              ${workflow.decisions.map(decision => `
                <div class="pb-decision-card">
                  <div class="pb-decision-header">
                    <strong>${this.formatDecisionName(decision.decision)}</strong>
                    <span class="pb-decision-result ${decision.result ? 'yes' : 'no'}">
                      ${decision.result ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div class="pb-decision-reasoning">
                    ${Array.isArray(decision.reasoning) 
                      ? `<ul>${decision.reasoning.map(r => `<li>${r}</li>`).join('')}</ul>`
                      : `<p>${decision.reasoning}</p>`
                    }
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${workflow.results?.searchTerms ? `
            <div class="pb-thinking-search">
              <h5>🔍 Generated Search Terms:</h5>
              <div class="pb-search-terms">
                ${workflow.results.searchTerms.map(term => 
                  `<span class="pb-search-term">${term}</span>`
                ).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  static formatStepName(step) {
    return step
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  static formatDecisionName(decision) {
    return decision
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + '?';
  }

  static renderMetadata(analysis) {
    if (!analysis.metadata) return '';
    
    return `
      <div class="pb-metadata">
        <small>
          ⏱️ Processed in ${analysis.metadata.processingTime}ms
          ${analysis.isAgentBased ? ' | 🤖 Agent Mode' : ' | 📊 Simple Mode'}
        </small>
      </div>
    `;
  }

  static update(analysisData) {
    try {
      PromptBridgeHelpers.log('🔄 Updating widget with analysis...', {
        hasAgentWorkflow: !!(analysisData.agentWorkflow),
        agentSteps: analysisData.agentWorkflow?.steps?.length || 0
      });

      const widget = document.getElementById(this.widgetId);
      if (!widget) {
        PromptBridgeHelpers.error('❌ Widget not found for update');
        return false;
      }

      const contentDiv = widget.querySelector('.pb-content');
      if (!contentDiv) {
        PromptBridgeHelpers.error('❌ Content div not found');
        return false;
      }

      // Get product info from existing widget
      const productInfoDiv = contentDiv.querySelector('.pb-product-info');
      const productInfoHTML = productInfoDiv ? productInfoDiv.outerHTML : '';

      // Update content with analysis
      contentDiv.innerHTML = productInfoHTML + this.renderAnalysis(analysisData);

      PromptBridgeHelpers.log('✅ Widget updated successfully', {
        isAgentBased: analysisData.isAgentBased
      });

      return true;
    } catch (error) {
      PromptBridgeHelpers.error('❌ Widget update failed', error);
      return false;
    }
  }

  static setupEventListeners(widget) {
    // Close button
    const closeBtn = widget.querySelector('.pb-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.remove());
    }

    // Language selector
    const languageSelect = widget.querySelector('#pb-language-select');
    if (languageSelect) {
      languageSelect.addEventListener('change', async (e) => {
        const newLanguage = e.target.value;
        await this.handleLanguageChange(newLanguage);
      });
    }

    // Make widget draggable (optional)
    this.makeDraggable(widget);
  }

  static makeDraggable(widget) {
    const header = widget.querySelector('.pb-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    header.style.cursor = 'move';

    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('pb-close')) return;
      
      isDragging = true;
      initialX = e.clientX - widget.offsetLeft;
      initialY = e.clientY - widget.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      widget.style.left = currentX + 'px';
      widget.style.top = currentY + 'px';
      widget.style.right = 'auto';
      widget.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  static remove() {
    const widget = document.getElementById(this.widgetId);
    if (widget) {
      widget.remove();
      this.currentWidget = null;
      PromptBridgeHelpers.log('🗑️ Widget removed');
    }
  }

  static isPresent() {
    return !!document.getElementById(this.widgetId);
  }

  static getPosition() {
    const widget = document.getElementById(this.widgetId);
    if (!widget) return null;
    
    const rect = widget.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  }

  static async handleLanguageChange(newLanguage) {
    try {
      PromptBridgeHelpers.log('🌐 Language change requested:', {
        from: this.currentLanguage,
        to: newLanguage
      });

      if (newLanguage === this.currentLanguage) {
        return; // No change needed
      }

      // Disable language selector during translation
      const languageSelect = document.getElementById('pb-language-select');
      if (languageSelect) {
        languageSelect.disabled = true;
      }

      // Show loading state
      this.showTranslationLoading();

      // Get current analysis data from PromptBridgeMain
      const currentAnalysis = PromptBridgeMain.currentAnalysis;
      const currentProductData = PromptBridgeMain.currentProductData;

      if (!currentAnalysis) {
        throw new Error('No analysis data available for translation');
      }

      // Translate existing analysis data for any language change
      await this.translateAnalysisData(currentAnalysis, newLanguage);

    } catch (error) {
      PromptBridgeHelpers.error('❌ Language change failed', error);
      this.showTranslationError(error.message);
    } finally {
      // Re-enable language selector
      const languageSelect = document.getElementById('pb-language-select');
      if (languageSelect) {
        languageSelect.disabled = false;
      }
    }
  }

  static async translateAnalysisData(analysisData, targetLanguage) {
    try {
      PromptBridgeHelpers.log('🔄 Translating analysis data...', { targetLanguage });

      // Initialize translator if needed
      if (!PromptBridgeTranslator.isInitialized) {
        await PromptBridgeTranslator.initialize();
      }

      // Translate the analysis data
      const translatedAnalysis = await PromptBridgeTranslator.translateAnalysisData(analysisData, targetLanguage);

      // Update current language
      this.currentLanguage = targetLanguage;
      PromptBridgeTranslator.setCurrentLanguage(targetLanguage);

      // Update the widget with translated content
      this.update(translatedAnalysis);

      PromptBridgeHelpers.log('✅ Analysis translation completed', { targetLanguage });

    } catch (error) {
      PromptBridgeHelpers.error('❌ Analysis translation failed', error);
      throw error;
    }
  }


  static showTranslationLoading() {
    const contentDiv = document.querySelector('.pb-content');
    if (contentDiv) {
      const productInfoDiv = contentDiv.querySelector('.pb-product-info');
      const productInfoHTML = productInfoDiv ? productInfoDiv.outerHTML : '';

      const loadingMessages = {
        'en': '🔄 Translating content...',
        'fr': '🔄 Traduction du contenu...'
      };

      contentDiv.innerHTML = productInfoHTML + `
        <div class="pb-loading">
          <div class="pb-spinner"></div>
          <p>${loadingMessages[this.currentLanguage] || loadingMessages['en']}</p>
        </div>
      `;
    }
  }


  static showTranslationError(errorMessage) {
    const contentDiv = document.querySelector('.pb-content');
    if (contentDiv) {
      const productInfoDiv = contentDiv.querySelector('.pb-product-info');
      const productInfoHTML = productInfoDiv ? productInfoDiv.outerHTML : '';

      contentDiv.innerHTML = productInfoHTML + `
        <div class="pb-error">
          <h4>⚠️ Translation Error</h4>
          <p>${errorMessage}</p>
          <button onclick="location.reload()" class="pb-retry-btn">Retry</button>
        </div>
      `;
    }
  }

  static setAnalyzingState(isAnalyzing) {
    this.isAnalyzing = isAnalyzing;
    const languageSelect = document.getElementById('pb-language-select');
    if (languageSelect) {
      languageSelect.disabled = isAnalyzing;
    }
  }

  static getCurrentLanguage() {
    return this.currentLanguage;
  }

  static setCurrentLanguage(language) {
    this.currentLanguage = language;
    PromptBridgeTranslator.setCurrentLanguage(language);
  }

  static truncate(text, length) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
}

window.PromptBridgeWidget = PromptBridgeWidget;