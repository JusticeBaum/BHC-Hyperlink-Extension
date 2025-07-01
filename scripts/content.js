(function() {
  'use strict';
  
  console.log('PU/SO Link Converter extension loaded');

  const patterns = [
  {
    regex: /\b(pick\s*up|pickup|pick-up|pu\/ex|puex|pu)\s?:?#?-?\s?(\d{6,})\b/gi,
    urlTemplate: (prefix, number) => `https://brightree.net/OrderEntry/frmPuExPopup.aspx?PuExKey=${number}&Edit=1`,
    linkText: (prefix, number) => `${prefix.toUpperCase()} ${number}`
  },

  {
    regex: /\b(SO|sales order)\s?#?:?-?\s?(\d{7,})\b/gi,
    urlTemplate: (prefix, number) => `https://brightree.net/OrderEntry/frmSOOrder.aspx?SalesOrderKey=${number}&Edit=1&ShowAck=1`,
    linkText: (prefix, number) => {
        const normalizedPrefix = prefix.toLowerCase();
        if (normalizedPrefix === 'sales order') {
          return `Sales Order ${number}`;
        } else {
          return `${prefix.toUpperCase()} ${number}`;
        }
      }
  },
  {
    regex:/\b(CO|connect order|connect)\s?#?:?-?\s?(\d{6,})\b/gi,
    urlTemplate: (prefix, number) => `https://bhcconnect.com/app/orders/${number}`,
    linkText: (prefix, number) => {
        const normalizedPrefix = prefix.toLowerCase();
        if (normalizedPrefix != 'CO') {
          return `${prefix} ${number}`;
        } else {
          return `${prefix.toUpperCase()} ${number}`;
        }
      }
  }
];

  function shouldProcessElement(element) {
    if (!element || !element.tagName) return false;
    
    const tagName = element.tagName.toLowerCase();
    
    // Skip noncontent elements
    if (['script', 'style', 'noscript', 'iframe', 'object', 'embed'].includes(tagName)) {
      return false;
    }
    
    // Skip elements that are already links
    if (element.closest('a')) {
      return false;
    }
    
    // Skip input fields and textareas to avoid interfering with user input
    if (['input', 'textarea', 'select'].includes(tagName)) {
      return false;
    }
    
    return true;
  }

  function replaceTextWithLinks(textNode) {
    const text = textNode.textContent;
    let hasMatches = false;
    
    patterns.forEach(pattern => {
      const testRegex = new RegExp(pattern.regex.source, pattern.regex.flags);
      if (testRegex.test(text)) {
        hasMatches = true;
      }
    });
    
    if (!hasMatches) return;
    
    console.log('Processing text with matches:', text);
    
    const parent = textNode.parentNode;
    const fragment = document.createDocumentFragment();
    let remainingText = text;
    let lastIndex = 0;
    
    const allMatches = [];
    patterns.forEach((pattern, patternIndex) => {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        allMatches.push({
          match: match,
          index: match.index,
          patternIndex: patternIndex,
          fullMatch: match[0],
          prefix: match[1],
          number: match[2]
        });
      }
    });
    
    allMatches.sort((a, b) => a.index - b.index);
    
    allMatches.forEach(matchInfo => {
      const pattern = patterns[matchInfo.patternIndex];
      
      if (matchInfo.index > lastIndex) {
        const textBefore = text.substring(lastIndex, matchInfo.index);
        fragment.appendChild(document.createTextNode(textBefore));
      }
      
      // Create the link element
      const link = document.createElement('a');
      const url = pattern.urlTemplate(matchInfo.prefix, matchInfo.number);
      const linkText = pattern.linkText(matchInfo.prefix, matchInfo.number);
      
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = linkText;
      
      // Traditional hyperlink styling
      link.style.color = 'blue';
      link.style.textDecoration = 'underline';
      link.style.cursor = 'pointer';
      
      console.log('Creating clickable link:', linkText, 'to:', url);
      fragment.appendChild(link);
      
      lastIndex = matchInfo.index + matchInfo.fullMatch.length;
    });
    
    // add leftover text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      fragment.appendChild(document.createTextNode(remainingText));
    }
    
    parent.insertBefore(fragment, textNode);
    parent.removeChild(textNode);
  }

  function processTextNodes(element) {
    if (!element || !shouldProcessElement(element)) {
      return;
    }

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          if (!node.textContent || !node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          
          let parent = node.parentElement;
          while (parent) {
            if (!shouldProcessElement(parent)) {
              return NodeFilter.FILTER_REJECT;
            }
            parent = parent.parentElement;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      try {
        replaceTextWithLinks(textNode);
      } catch (error) {
        console.log('Error processing text node:', error);
      }
    });
  }

  function processDocument() {
    console.log('Processing document');
    processPage();
  }

  function handleMutations(mutations) {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          processTextNodes(node);
        } else if (node.nodeType === Node.TEXT_NODE) {
          try {
            replaceTextWithLinks(node);
          } catch (error) {
            console.log('Error processing added text node:', error);
          }
        }
      });
      
      if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
        try {
          replaceTextWithLinks(mutation.target);
        } catch (error) {
          console.log('Error processing modified text node:', error);
        }
      }
    });
  }

  const observer = new MutationObserver(handleMutations);
  
  function startObserving() {
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }
  
  function processPage() {
    console.log('Processing page for PU/SO patterns');
    if (document.body) {
      processTextNodes(document.body);
    }
    
    const emailSubjects = document.querySelectorAll('[class*="subject"], [id*="subject"], [data-testid*="subject"]');
    emailSubjects.forEach(element => {
      processTextNodes(element);
    });
    
    const emailElements = document.querySelectorAll('.email-subject, .message-subject, .subject-line, [role="gridcell"]');
    emailElements.forEach(element => {
      processTextNodes(element);
    });

    const chatMessages = document.querySelectorAll('[data-message-text], div[role="listitem"] div[dir="auto"], div[aria-label][dir]');
    chatMessages.forEach(processTextNodes);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      processPage();
      startObserving();
    });
  } else {
    processPage();
    startObserving();
  }
  
  setInterval(() => {
    processPage();
  }, 3000);

  window.addEventListener('beforeunload', function() {
    observer.disconnect();
  });
})();