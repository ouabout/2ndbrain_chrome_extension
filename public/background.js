chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "bg_selectionChanged") {
    console.log("Background: Received selectionChanged message", message);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const currentTab = tabs[0];
        const currentUrl = currentTab.url;
        chrome.storage.local.set({
          lastSelectedText: message.payload.selectedText,
          pageTitle: message.payload.title,
          lastSelectedTextSrc: currentUrl,
        });
      }
    });

    chrome.runtime.sendMessage({
      type: "selectionChanged",
      payload: {},
    });
  }
});
