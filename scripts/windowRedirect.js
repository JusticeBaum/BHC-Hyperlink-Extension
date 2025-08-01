(function() {
  'use strict';
  
  if (window.BTPopupInterceptor) return;
  window.BTPopupInterceptor = true;
  
  const originalWindowOpen = window.open;
  
  // Override window.open globally
  window.open = function(url, target, features) {
    if (features && typeof features === 'string') {
      const popupFeatures = [
        'width=', 'height=', 'left=', 'top=',
        'toolbar=', 'menubar=', 'scrollbars=',
        'resizable=', 'location=', 'status=',
        'popup', 'modal', 'dialog'
      ];
      
      const hasPopupFeatures = popupFeatures.some(feature => 
        features.toLowerCase().includes(feature.toLowerCase())
      );
      
      if (hasPopupFeatures) {
        return originalWindowOpen.call(this, url, '_blank');
      }
    }
    
    return originalWindowOpen.call(this, url, target, features);
  };
  

  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    
    if (tagName.toLowerCase() === 'a') {
      const originalClick = element.click;
      element.click = function() {
        const onclick = this.getAttribute('onclick');
        if (onclick && onclick.includes('window.open')) {
          // Extract URL from onclick if possible and open as tab
          const urlMatch = onclick.match(/window\.open\s*\(\s*['"`]([^'"`]+)['"`]/);
          if (urlMatch) {
            window.open(urlMatch[1], '_blank');
            return false;
          }
        }
        return originalClick.call(this);
      };
    }
    
    return element;
  };
  
  console.log('BT Extension: Popup interceptor loaded');
})();
