const UNWANTED_SELECTORS = [
  "nav",
  "header",
  "footer",
  "aside",
  "script",
  "style",
  "noscript",
  "iframe",
  ".ad",
  ".ads",
  ".advert",
  ".sidebar",
  ".navbar",
  ".footer",
  ".cookie-banner",
  "#ads",
  "#ad",
  "#sidebar",
  "#header",
  "#footer",
  "#navigation",
  '[role="navigation"]',
  '[role="banner"]',
  '[role="complementary"]',
  '[aria-label="ads"]',
];

document.addEventListener("selectionchange", processDocumentData);
document.addEventListener("DOMContentLoaded", processDocumentData);

function processDocumentData() {
  let selectedText = document.getSelection()?.toString().trim();
  if (!selectedText) {
    const cloneOfDocument = document.cloneNode(true);

    UNWANTED_SELECTORS.forEach((selector) => {
      cloneOfDocument.body
        .querySelectorAll(selector)
        .forEach((element) => element.remove());
    });

    selectedText = cloneOfDocument.body.innerHTML;
  }
  chrome.runtime.sendMessage({
    type: "bg_selectionChanged",
    payload: { selectedText, title: document.title },
  });
}
