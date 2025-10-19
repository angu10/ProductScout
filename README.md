# 🛍️ Agent-Powered PromptBridge - Phase 1 MVP

## Overview

Agent-Powered PromptBridge is an intelligent Chrome extension that combines browser automation with Chrome's Built-in AI APIs to create an autonomous e-commerce product analysis system. This Phase 1 MVP focuses on Amazon product detection, data extraction, and AI-powered analysis.

## 🚀 Phase 1 Features

### ✅ Completed Features
- **Product Page Detection**: Automatically detects Amazon product pages
- **Data Extraction**: Extracts title, price, rating, reviews, images, and descriptions
- **Chrome Built-in AI Integration**: Uses Prompt API for intelligent product analysis
- **Smart UI Widget**: Floating, draggable widget with product insights
- **Detailed Logging**: Comprehensive development and debugging logs
- **Background Processing**: Service worker for state management
- **Extension Popup**: Control panel with statistics and actions

### 🎯 Supported Sites (Phase 1)
- Amazon.com (primary focus)
- Basic support for eBay, Walmart, Target (detection only)

## 📁 Project Structure

```
promptbridge/
├── manifest.json              # Extension manifest with AI permissions
├── background.js              # Service worker coordination  
├── content.js                # Main orchestration script
├── popup.html/js             # Extension popup interface
├── agents/
│   ├── detector.js           # E-commerce site detection
│   └── extractor.js          # Product data extraction
├── ai/
│   └── prompt-processor.js   # Chrome Built-in AI integration
├── ui/
│   ├── widget.js             # Floating interface
│   └── styles.css            # UI styling
├── utils/
│   └── helpers.js            # Utility functions
└── assets/icons/             # Extension icons
```

## 🧪 Testing Instructions

### Prerequisites
1. **Chrome Canary** (required for Built-in AI APIs)
2. **AI Origin Trial** access (register at Chrome Built-in AI Early Preview Program)
3. **Developer Mode** enabled in Chrome Extensions

### Step 1: Load the Extension

1. Open Chrome Canary
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select the `/Users/angu/Documents/GitHub/chrome-agent/` directory

### Step 2: Test on Amazon

1. Navigate to any Amazon product page, for example:
   - https://www.amazon.com/dp/B08N5WRWNW (Example product)
   - https://www.amazon.com/dp/B0B1VQ1ZQY (Another example)

2. **Expected Behavior:**
   - Extension should auto-detect the product page
   - Floating widget appears in top-right corner
   - Product data extraction begins automatically
   - AI analysis starts (may take 3-5 seconds)
   - Widget updates with analysis results

### Step 3: Monitor Console Logs

Open Developer Tools (`F12`) and check console for detailed logs:

```bash
# Expected log sequence:
[PromptBridge] 🚀 PromptBridge initializing...
[PromptBridge] 🔍 Starting product detection...
[PromptBridge] ✅ Product page detected on Amazon
[PromptBridge] 📝 Extracting product title...
[PromptBridge] 💰 Extracting product pricing...
[PromptBridge] 🤖 Initializing Chrome Built-in AI Prompt API...
[PromptBridge] 🧠 Starting AI analysis of current product...
[PromptBridge] ✅ Widget created successfully
```

### Step 4: Test Extension Popup

1. Click the PromptBridge extension icon in Chrome toolbar
2. **Expected Features:**
   - Status indicator (green = active, yellow = loading, red = error)
   - Statistics showing analysis count
   - Action buttons (Analyze, History, Clear Data, Debug)
   - Recent activity log

### Step 5: Test Widget Interactions

1. **Dragging**: Click and drag the widget header to move it around
2. **Minimize**: Click the "−" button to collapse/expand
3. **Actions**: Test the Refresh, Compare, and Save buttons
4. **Debug Mode**: Click "Debug" to see extraction details (if enabled)

## 🐛 Debugging Guide

### Common Issues and Solutions

#### 1. "AI API not available" Error
```bash
# Solution: Ensure you're using Chrome Canary with AI features enabled
# Register for Chrome Built-in AI Early Preview Program
# Enable experimental AI features in chrome://flags/
```

#### 2. Widget Not Appearing
```bash
# Check console for errors:
[PromptBridge] ❌ Not a supported product page, skipping initialization

# Solution: Ensure you're on a supported Amazon product page
# URL should match pattern: /dp/[A-Z0-9]{10}
```

#### 3. Data Extraction Failures
```bash
# Check extraction logs:
[PromptBridge] ❌ Title extraction failed - element not found

# Solution: Amazon may have updated their HTML structure
# Check agents/detector.js selectors for current page structure
```

#### 4. AI Processing Errors
```bash
# Check AI initialization:
[PromptBridge] ❌ AI model not ready. Status: not-available

# Solution: Wait for model download or check AI feature availability
```

### Debug Mode Features

Enable debug mode through popup or set `debugMode: true` in widget.js:

- **Extraction Log**: Detailed extraction attempt logs
- **Processing Times**: AI processing performance metrics  
- **Data Validation**: Completeness scoring for extracted data
- **Element Detection**: Which CSS selectors successfully found elements

## 📊 Expected Test Results

### Successful Amazon Product Analysis

**Product Detection:**
- Site: Amazon detected ✅
- Product URL pattern matched ✅  
- Required elements found (title, price) ✅

**Data Extraction (typical completeness: 80-95%):**
- Title: ✅ "Amazon Product Title Here"
- Price: ✅ $29.99
- Rating: ✅ 4.3/5 (1,234 reviews)
- Images: ✅ 3-5 product images
- Description: ✅ Key features extracted
- Availability: ✅ "In Stock"

**AI Analysis:**
- Processing Time: 2-4 seconds
- Recommendation: ✅ Generated
- Pros/Cons: ✅ 3-5 items each
- Value Assessment: ✅ excellent|good|fair|poor
- Key Insights: ✅ 2-3 insights

## 🚨 Known Limitations (Phase 1)

1. **Single Site Focus**: Primarily optimized for Amazon
2. **No Cross-Site Comparison**: Phase 2 feature
3. **Basic UI**: Minimal styling, no advanced interactions
4. **Limited AI Context**: Simple product analysis only
5. **No Price History**: Single-point-in-time analysis
6. **Manual Icon Files**: Placeholder icons only

## 🔄 Testing Workflow

### Complete Test Sequence

1. **Load Extension** → Check developer console for load errors
2. **Navigate to Amazon** → Verify automatic detection  
3. **Wait for Widget** → Should appear within 2-3 seconds
4. **Check Data Extraction** → Verify product info display
5. **Wait for AI Analysis** → Loading → Analysis results
6. **Test Interactions** → Drag, minimize, actions
7. **Check Popup** → Statistics and controls
8. **Test Multiple Products** → Verify consistency

### Performance Benchmarks

- **Detection Time**: < 500ms
- **Data Extraction**: < 2s  
- **AI Processing**: < 5s
- **Widget Rendering**: < 200ms
- **Memory Usage**: < 50MB per tab

## 📈 Success Metrics

### Functional Testing
- [ ] Extension loads without errors
- [ ] Amazon products auto-detected (>95% success rate)
- [ ] Data extraction completes (>90% success rate)  
- [ ] AI analysis generates results (>95% success rate)
- [ ] Widget displays and functions correctly
- [ ] Popup interface works as expected

### Performance Testing  
- [ ] Page load impact: < 100ms additional
- [ ] Memory usage: Reasonable for analysis complexity
- [ ] No memory leaks over multiple product visits
- [ ] Smooth widget animations and interactions

## 🚀 Next Steps (Phase 2 Preview)

After successful Phase 1 testing:
- Multi-site product comparison
- Automated competitor search  
- Price monitoring and alerts
- Enhanced AI with multiple API usage
- Improved UI/UX design
- Mobile-responsive features

## 📞 Support

For testing issues:
1. Check console logs for detailed error information
2. Verify Chrome Canary version and AI feature availability
3. Test on different Amazon product pages
4. Clear extension data and reload if needed

---

**Happy Testing! 🛍️✨**

*Phase 1 MVP - Chrome Built-in AI Challenge 2025*