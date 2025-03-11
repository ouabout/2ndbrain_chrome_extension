const getTabContent = async () => {
  try {
    console.log("background.js: getTabContent() called");
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    console.log("background.js: Active tab:", tab);
    
    if (!tab || tab.id === undefined) {
      console.log("background.js: No active tab found.");
      return;
    }
    
    // Skip chrome:// URLs and extension pages
    if (!tab.url || 
        tab.url.startsWith("chrome://") || 
        tab.url.startsWith("chrome-extension://") || 
        tab.url === "about:blank") {
      console.log("background.js: Skipping restricted URL:", tab.url);
      return;
    }
    
    // Execute script in the tab to get content
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.documentElement.outerHTML,
      });
      
      if (!result || result.length === 0) {
        console.log("background.js: No result from executeScript");
        return;
      }
      
      const content = result[0].result;
      console.log("background.js: Got content from page:", content.substring(0, 50), "...");
      
      chrome.runtime.sendMessage({
        type: "selectionChanged",
        payload: {
          content: content,
          title: tab.title,
          source: tab.url,
        },
      });      
      // Save content to storage
/*      await chrome.storage.local.set({
        content: content,
        source: tab.url,
        title: tab.title,
        timestamp: Date.now()
      });
      console.log("background.js: Data saved to storage");
      
      // Notify popup if open
      chrome.runtime.sendMessage({
        type: "ContentUpdated",
      }).catch(error => {
        // This error is normal if popup is not open
        if (!error.message.includes("Could not establish connection")) {
          console.error("Error sending update message:", error);
        }
      });
      console.log("background.js: ContentUpdated Message sent to popup")
      */
    } catch (error) {
      console.log(`background.js: Cannot access contents of tab ${tab.id} (${tab.url}):`, error.message);
    }
  } catch (error) {
    console.error("Error getting content:", error);
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "PopupReady"){
    console.log("background.js: Popup is ready")
    getTabContent();
  } else if (request.type === "CONTENT_SCRIPT_LOADED"){
    console.log("background.js: Content script loaded")
  }
});