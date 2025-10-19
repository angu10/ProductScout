// Utility functions for PromptBridge
class PromptBridgeHelpers {
  static log(message, data = null) {
    if (data) {
      console.log(`[PromptBridge] ${message}`, data);
    } else {
      console.log(`[PromptBridge] ${message}`);
    }
  }

  static error(message, error = null) {
    if (error) {
      console.error(`[PromptBridge ERROR] ${message}`, error);
    } else {
      console.error(`[PromptBridge ERROR] ${message}`);
    }
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static sanitizeText(text) {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ').replace(/[^\w\s.-]/g, '');
  }

  static parsePrice(priceText) {
    if (!priceText) return null;
    
    const cleanPrice = priceText.replace(/[^\d.,]/g, '');
    const price = parseFloat(cleanPrice.replace(',', ''));
    
    return isNaN(price) ? null : price;
  }

  static extractCurrency(priceText) {
    if (!priceText) return 'USD';
    
    const currencySymbols = {
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY',
      '₹': 'INR'
    };
    
    for (const [symbol, currency] of Object.entries(currencySymbols)) {
      if (priceText.includes(symbol)) {
        return currency;
      }
    }
    
    return 'USD';
  }

  static async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  static generateId() {
    return 'pb_' + Math.random().toString(36).substr(2, 9);
  }

  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  static async saveToStorage(key, data) {
    try {
      await chrome.storage.local.set({ [key]: data });
      return true;
    } catch (error) {
      PromptBridgeHelpers.error('Failed to save to storage', error);
      return false;
    }
  }

  static async getFromStorage(key) {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] || null;
    } catch (error) {
      PromptBridgeHelpers.error('Failed to get from storage', error);
      return null;
    }
  }
}

// Make helpers available globally
window.PromptBridgeHelpers = PromptBridgeHelpers;