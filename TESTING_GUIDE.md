# 🧪 PromptBridge Testing Guide

## Quick Start Testing Steps

### 1. Load Extension in Chrome Canary

1. Open **Chrome Canary** (not regular Chrome!)
2. Go to `chrome://extensions/`
3. Turn ON "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Navigate to and select: `/Users/angu/Documents/GitHub/chrome-agent/`
6. The extension should appear with a shopping bag icon 🛍️

### 2. Test on Amazon

Open these test pages in Chrome Canary:

**Test Page 1 - Electronics:**
```
https://www.amazon.com/dp/B08N5WRWNW
```

**Test Page 2 - Books:**
```
https://www.amazon.com/dp/B073NPBX9W
```

**Or any Amazon product URL with pattern:**
```
https://www.amazon.com/dp/[10-character-code]
```

### 3. What Should Happen

**Immediate (0-2 seconds):**
- Small notification in console: "PromptBridge initializing..."
- Extension detects it's on Amazon
- Starts extracting product data

**Within 3-5 seconds:**
- Purple gradient widget appears in top-right corner
- Shows product title and price
- "Analyzing product with AI..." loading message

**Within 5-10 seconds:**
- AI analysis completes
- Widget shows recommendation, pros/cons
- Value assessment badge appears

### 4. Check Developer Console

**Open DevTools (F12) → Console tab to see detailed logs:**

```bash
# Expected successful sequence:
[PromptBridge] 🚀 PromptBridge initializing...
[PromptBridge] 🔍 Starting product detection...
[PromptBridge] ✅ Product page detected on Amazon
[PromptBridge] 📝 Extracting product title...
[PromptBridge] ✅ Title extracted successfully
[PromptBridge] 💰 Extracting product pricing...
[PromptBridge] ✅ Pricing extracted successfully
[PromptBridge] 🤖 Initializing Chrome Built-in AI Prompt API...
[PromptBridge] ✅ AI session created successfully
[PromptBridge] 🧠 Starting AI analysis...
[PromptBridge] ✅ AI analysis completed successfully
[PromptBridge] 🎨 Creating PromptBridge widget...
[PromptBridge] ✅ Widget created successfully
```

### 5. Test Extension Popup

1. Click the PromptBridge extension icon in Chrome toolbar
2. Should show:
   - Status indicator (green dot = working)
   - Statistics (number of analyses)
   - Action buttons
   - Recent activity log

### 6. Test Widget Features

**Widget should have:**
- 🖱️ **Draggable** - Click header and drag around screen
- 📖 **Minimizable** - Click "−" button to collapse
- 🐛 **Debug mode** - Click "Debug" to see extraction details
- 🔄 **Actions** - Refresh, Compare, Save buttons

## 🚨 Troubleshooting

### Problem 1: "AI API not available" Error

**Console shows:**
```
❌ Chrome Built-in AI API not available
```

**Solutions:**
1. Make sure you're using Chrome **Canary** (not regular Chrome)
2. Enable AI flags: `chrome://flags/` → Search "Prompt API" → Enable
3. Register for Early Preview Program (link above)
4. Restart Chrome Canary completely

### Problem 2: Widget Doesn't Appear

**Console shows:**
```
❌ Not a supported product page
```

**Solutions:**
1. Make sure URL has pattern: `amazon.com/dp/XXXXXXXXXX`
2. Try these working test URLs:
   - https://www.amazon.com/dp/B08N5WRWNW
   - https://www.amazon.com/dp/B073NPBX9W
3. Refresh the page and wait 5 seconds

### Problem 3: Extension Won't Load

**Error in chrome://extensions/:**

**Solutions:**
<<<<<<< HEAD
1. Check file path is correct: `/Users/angu/Documents/GitHub/chrome-agent/`
=======
1. Check file path is correct: `/Users/angu/Documents/GitHub/google-chrome-agent/`
>>>>>>> c84caf50405e71ab559d359986bb8f09a767f671
2. Verify `manifest.json` exists in that folder
3. Try "Reload" button in extensions page
4. Check console for specific error messages

### Problem 4: Data Extraction Fails

**Console shows:**
```
❌ Title extraction failed - element not found
```

**Solutions:**
1. Amazon may have changed their HTML structure
2. Try different product pages
3. Check if page is fully loaded (wait 3-5 seconds)
4. Refresh page and try again

## 📊 Expected Test Results

### Successful Test Run:

```
✅ Extension loads without errors
✅ Amazon product page detected  
✅ Product data extracted (title, price, rating)
✅ AI analysis generates recommendation
✅ Widget appears and functions
✅ Extension popup shows statistics
✅ Console logs show success messages
```

### Performance Benchmarks:

- **Detection**: < 1 second
- **Data extraction**: < 3 seconds
- **AI analysis**: < 8 seconds  
- **Total time to results**: < 10 seconds

## 📋 Testing Checklist

### Basic Functionality
- [ ] Extension loads in Chrome Canary
- [ ] Detects Amazon product pages
- [ ] Extracts product title and price
- [ ] AI analysis runs without errors
- [ ] Widget appears and displays results
- [ ] Extension popup works

### Advanced Features  
- [ ] Widget is draggable
- [ ] Minimize/expand works
- [ ] Debug mode shows extraction details
- [ ] Action buttons respond (even if not fully implemented)
- [ ] Console shows detailed logging
- [ ] No JavaScript errors in console

### Error Handling
- [ ] Graceful handling if AI fails
- [ ] Retry logic works for extraction failures  
- [ ] Clear error messages in console
- [ ] Widget shows error states appropriately

## 🎯 Test Pages That Work Well

These Amazon pages are known to work reliably:

1. **Electronics**: https://www.amazon.com/dp/B08N5WRWNW
2. **Books**: https://www.amazon.com/dp/B073NPBX9W  
3. **Home & Kitchen**: https://www.amazon.com/dp/B00FLYWNYQ
4. **Health**: https://www.amazon.com/dp/B000GG2I9O

## 🔧 Development Testing

### Enable Debug Mode:
1. Open `ui/widget.js` 
2. Find `static debugMode = true;` (already enabled)
3. Or click "Debug" button in widget

### Console Commands for Testing:
```javascript
// Check if extension is loaded
window.PromptBridgeMain

// Manually trigger analysis  
PromptBridgeMain.analyzeCurrentProduct()

// Check current product data
console.log(PromptBridgeMain.currentProductData)

// Check AI analysis results
console.log(PromptBridgeMain.currentAnalysis)
```

---

## 🆘 Still Having Issues?

1. **Check Chrome version**: Must be Canary, not regular Chrome
2. **Clear extension data**: chrome://extensions/ → PromptBridge → "Clear all data"  
3. **Reload extension**: chrome://extensions/ → PromptBridge → "Reload"
4. **Try incognito mode**: Sometimes helps with permissions
5. **Check console logs**: F12 → Console for detailed error info

**The extension should work on any standard Amazon product page within 10 seconds!** 🚀