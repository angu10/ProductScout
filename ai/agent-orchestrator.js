// Agent-like workflow orchestrator for PromptBridge
class AgentWorkflowOrchestrator {
  static async executeAgentWorkflow(productData) {
    try {
      PromptBridgeHelpers.log('🤖 Starting AGENT WORKFLOW...');
      
      // Agent Decision Tree
      const workflow = {
        steps: [],
        decisions: [],
        results: {}
      };

      // STEP 1: Analyze current product
      workflow.steps.push('analyze_current_product');
      PromptBridgeHelpers.log('📊 Step 1: Analyzing current product...');
      const analysis = await PromptProcessor.analyzeProduct(productData);
      workflow.results.currentProductAnalysis = analysis;
      
      // AGENT DECISION: Should we search for alternatives?
      const shouldSearchAlternatives = this.decideShouldSearchAlternatives(
        productData, 
        analysis
      );
      
      workflow.decisions.push({
        decision: 'search_alternatives',
        result: shouldSearchAlternatives.should,
        reasoning: shouldSearchAlternatives.reasoning
      });

      PromptBridgeHelpers.log('🧠 Agent Decision: Search Alternatives?', {
        decision: shouldSearchAlternatives.should,
        reasoning: shouldSearchAlternatives.reasoning
      });

      // STEP 2: Execute alternative search (always plan, even if not executing now)
      workflow.steps.push('plan_alternative_search');
      PromptBridgeHelpers.log('🔍 Step 2: Planning alternative search strategy...');
      
      const searchTerms = await this.generateSmartSearchTerms(productData, analysis);
      workflow.results.searchTerms = searchTerms;
      workflow.results.alternativeSearchPlanned = shouldSearchAlternatives.should;
      
      PromptBridgeHelpers.log('✅ Search terms generated:', searchTerms);

      // STEP 3: Decide if we need deeper analysis (always yes for thorough agent)
      workflow.steps.push('deeper_analysis');
      const needsDeeperAnalysis = this.decideNeedsDeeperAnalysis(analysis);
      
      workflow.decisions.push({
        decision: 'deeper_analysis',
        result: needsDeeperAnalysis.should,
        reasoning: needsDeeperAnalysis.reasoning
      });

      PromptBridgeHelpers.log('🔬 Step 3: Conducting deeper analysis...');
      const deeperAnalysis = await this.executeDeeperAnalysis(
        productData, 
        analysis,
        needsDeeperAnalysis.focus
      );
      
      workflow.results.deeperAnalysis = deeperAnalysis;

      // STEP 4: Generate final recommendation with reasoning
      workflow.steps.push('generate_final_recommendation');
      PromptBridgeHelpers.log('💭 Step 4: Generating final recommendation...');
      const finalRecommendation = await this.generateFinalRecommendation(
        productData,
        workflow.results
      );
      
      workflow.results.finalRecommendation = finalRecommendation;

      PromptBridgeHelpers.log('✅ Agent workflow completed', {
        totalSteps: workflow.steps.length,
        decisions: workflow.decisions.length,
        finalDecision: finalRecommendation.decision,
        confidence: finalRecommendation.confidence,
        workflow: workflow
      });

      return {
        ...analysis,
        agentWorkflow: workflow,
        isAgentBased: true
      };

    } catch (error) {
      PromptBridgeHelpers.error('❌ Agent workflow failed', error);
      return {
        error: error.message,
        agentWorkflow: { failed: true }
      };
    }
  }

  // AGENT DECISION LOGIC 1: Should we search for alternatives?
  static decideShouldSearchAlternatives(productData, analysis) {
    const reasons = [];
    let should = false;

    // UPDATED: More proactive search criteria
    // Always search if value is not excellent
    if (analysis.valueAssessment === 'poor' || analysis.valueAssessment === 'fair') {
      should = true;
      reasons.push('Value assessment is not excellent - alternatives may offer better value');
    }

    // Always search for products with limited reviews
    if (productData.reviewCount < 500) {
      should = true;
      reasons.push('Limited customer feedback - comparing with more established products');
    }

    // Search if rating is below 4.5
    if (productData.rating && productData.rating < 4.5) {
      should = true;
      reasons.push('Rating below 4.5 - exploring higher-rated alternatives');
    }

    // Search if there are significant cons
    if (analysis.cons && analysis.cons.length > analysis.pros.length) {
      should = true;
      reasons.push('More concerns than benefits - worth exploring alternatives');
    }

    // Be proactive: search even for good products to ensure best deal
    if (!should && analysis.valueAssessment === 'excellent') {
      should = true;
      reasons.push('Proactively searching to confirm this is the best option available');
    }

    return {
      should,
      reasoning: should ? reasons : ['Product exceptional - search not critical'],
      confidence: should ? 0.85 : 0.95
    };
  }

  // AGENT DECISION LOGIC 2: Do we need deeper analysis?
  static decideNeedsDeeperAnalysis(analysis) {
    const reasons = [];
    let should = false;
    let focus = [];

    // UPDATED: More thorough analysis criteria
    // Always do deeper analysis - agent should be thorough
    should = true;

    // Check if recommendation needs expansion
    if (!analysis.recommendation || analysis.recommendation.length < 150) {
      focus.push('recommendation_depth');
      reasons.push('Expanding recommendation with detailed insights');
    }

    // Check if we need more specific targeting
    if (!analysis.targetAudience || analysis.targetAudience === 'General consumers') {
      focus.push('target_audience_specificity');
      reasons.push('Identifying specific user personas who would benefit most');
    }

    // Always justify value assessment
    if (analysis.valueAssessment && analysis.valueAssessment !== 'unknown') {
      focus.push('value_justification');
      reasons.push('Providing detailed value justification');
    }

    // If no specific focus areas, still do general deeper analysis
    if (focus.length === 0) {
      focus.push('general_insights');
      reasons.push('Conducting comprehensive product analysis');
    }

    return {
      should,
      reasoning: reasons,
      focus,
      confidence: 0.9
    };
  }

  // AGENT ACTION: Generate smart search terms
  static async generateSmartSearchTerms(productData, analysis) {
    const prompt = `You are a shopping research agent. Based on this product analysis, generate 3 strategic search terms that would help find BETTER alternatives.

CURRENT PRODUCT:
- Title: ${productData.title}
- Price: $${productData.price}
- Rating: ${productData.rating}/5 (${productData.reviewCount} reviews)
- Value Assessment: ${analysis.valueAssessment}

ANALYSIS INSIGHTS:
Pros: ${analysis.pros.join(', ')}
Cons: ${analysis.cons.join(', ')}

Generate search terms that address the CONS while maintaining the PROS. Return ONLY a JSON array:
["search term 1", "search term 2", "search term 3"]

Focus on:
1. Higher-rated alternatives in same category
2. Better value for money options
3. Products that solve the identified cons`;

    const response = await PromptProcessor.session.prompt(prompt);
    
    try {
      const terms = JSON.parse(response);
      return Array.isArray(terms) ? terms : this.generateFallbackSearchTerms(productData);
    } catch {
      return this.generateFallbackSearchTerms(productData);
    }
  }

  static generateFallbackSearchTerms(productData) {
    return [
      `best ${productData.productType} under $${Math.round(productData.price * 1.2)}`,
      `${productData.productType} alternatives 2025`,
      `top rated ${productData.productType}`
    ];
  }

  // AGENT ACTION: Execute deeper analysis
  static async executeDeeperAnalysis(productData, analysis, focusAreas) {
    PromptBridgeHelpers.log('🔬 Agent executing deeper analysis', { focusAreas });

    const deeperInsights = {};

    for (const focus of focusAreas) {
      switch (focus) {
        case 'recommendation_depth':
          deeperInsights.detailedRecommendation = await this.getDeeperRecommendation(
            productData, 
            analysis
          );
          break;
          
        case 'target_audience_specificity':
          deeperInsights.specificAudience = await this.getSpecificAudience(
            productData,
            analysis
          );
          break;
          
        case 'value_justification':
          deeperInsights.valueJustification = await this.getValueJustification(
            productData,
            analysis
          );
          break;
      }
    }

    return deeperInsights;
  }

  static async getDeeperRecommendation(productData, analysis) {
    const prompt = `Provide a detailed 4-5 sentence shopping recommendation for this product:

Product: ${productData.title}
Price: $${productData.price}
Rating: ${productData.rating}/5
Initial Assessment: ${analysis.valueAssessment}

Consider: target use case, price justification, quality indicators, and specific buyer scenarios.`;

    return await PromptProcessor.session.prompt(prompt);
  }

  static async getSpecificAudience(productData, analysis) {
    const prompt = `Who SPECIFICALLY would benefit most from this product? Be detailed.

Product: ${productData.title}
Type: ${productData.productType}
Price: $${productData.price}
Pros: ${analysis.pros.join(', ')}

Provide 2-3 specific user personas/scenarios.`;

    return await PromptProcessor.session.prompt(prompt);
  }

  static async getValueJustification(productData, analysis) {
    const prompt = `Justify the value assessment for this product:

Product: ${productData.title}
Price: $${productData.price}
Rating: ${productData.rating}/5 (${productData.reviewCount} reviews)

Explain if the price is justified based on quality indicators, reviews, and category standards.`;

    return await PromptProcessor.session.prompt(prompt);
  }

  // AGENT ACTION: Generate final recommendation with chain-of-thought
  static async generateFinalRecommendation(productData, workflowResults) {
    // UPDATED: Smarter decision logic based on actual data
    const analysis = workflowResults.currentProductAnalysis;
    
    // Calculate decision based on multiple factors
    let decision = 'consider';
    let confidence = 0.5;
    let reasoning = '';
    let nextSteps = [];

    // Rating quality check
    const hasGoodRating = productData.rating >= 4.5;
    const hasDecentRating = productData.rating >= 4.0;
    const hasHighReviewCount = productData.reviewCount >= 1000;
    const hasExcellentValue = analysis.valueAssessment === 'excellent';
    const hasGoodValue = analysis.valueAssessment === 'good';

    // Decision tree
    if (hasGoodRating && hasHighReviewCount && (hasExcellentValue || hasGoodValue)) {
      decision = 'buy';
      confidence = 0.9;
      reasoning = `Strong recommendation based on: excellent ${productData.rating}/5 rating from ${productData.reviewCount.toLocaleString()} verified customers, ${analysis.valueAssessment} value assessment, and ${analysis.pros.length} key benefits identified.`;
      nextSteps = [
        'Add to cart - this is a well-reviewed product',
        'Check if there are any active coupon codes',
        'Review shipping options and delivery timeline'
      ];
    } else if (hasDecentRating && hasHighReviewCount) {
      decision = 'buy';
      confidence = 0.75;
      reasoning = `Good option with ${productData.rating}/5 rating from ${productData.reviewCount.toLocaleString()} customers. The ${analysis.valueAssessment} value and strong customer feedback support purchasing.`;
      nextSteps = [
        'Review the specific cons mentioned to ensure they don\'t apply to your use case',
        'Consider purchasing - solid choice based on customer feedback',
        'Check return policy for peace of mind'
      ];
    } else if (hasDecentRating && productData.reviewCount >= 100) {
      decision = 'consider';
      confidence = 0.65;
      reasoning = `Reasonable option with ${productData.rating}/5 stars. Consider comparing with alternatives to ensure best value.`;
      nextSteps = [
        'Compare with similar products in this price range',
        'Read detailed customer reviews to understand cons',
        'Decide based on your specific needs and budget'
      ];
    } else if (productData.rating < 4.0 || analysis.valueAssessment === 'poor') {
      decision = 'skip';
      confidence = 0.8;
      reasoning = `Concerns about quality or value. ${productData.rating ? `Rating of ${productData.rating}/5` : 'Limited rating data'} and ${analysis.cons.length} significant drawbacks identified. Better alternatives likely available.`;
      nextSteps = [
        'Search for higher-rated alternatives',
        'Compare features and prices with top-rated products',
        'Consider products with 4.5+ stars and more reviews'
      ];
    } else {
      decision = 'consider';
      confidence = 0.6;
      reasoning = `Mixed signals - ${analysis.pros.length} pros vs ${analysis.cons.length} cons. Additional research recommended.`;
      nextSteps = [
        'Read detailed customer reviews',
        'Compare with 2-3 alternative products',
        'Evaluate based on your specific requirements'
      ];
    }

    return {
      decision,
      confidence,
      reasoning,
      nextSteps
    };
  }
}

// Make available globally
window.AgentWorkflowOrchestrator = AgentWorkflowOrchestrator;