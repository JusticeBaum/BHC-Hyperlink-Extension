(function() {
  'use strict';
  
  console.log('Brightree-specific functionality loaded');

  // Function to remove styling from col-lg-9 elements
  function removeColLg9Styling() {
    const colLg9Elements = document.querySelectorAll('div.col-lg-9');
    console.log(`Found ${colLg9Elements.length} div.col-lg-9 elements`);
    
    colLg9Elements.forEach(element => {
      // Remove all inline styles
      element.removeAttribute('style');
      
      // Remove all class attributes except col-lg-9
      const currentClasses = element.className.split(' ');
      element.className = currentClasses.filter(cls => cls === 'col-lg-9').join(' ');
      
      console.log('Removed styling from col-lg-9 element');
    });
  }

  // Function to add Today button to transport manager pages
  function addTodayButton() {
    // Find the col-lg-6 div that contains a text input
    const colLg6Divs = document.querySelectorAll('div.col-lg-6');
    
    colLg6Divs.forEach(div => {
      const textInput = div.querySelector('input[type="text"]');
      if (textInput && !div.querySelector('.today-button')) {
        console.log('Found text input in col-lg-6, adding Today button');
        
        // Create the Today button
        const todayButton = document.createElement('button');
        todayButton.textContent = 'Today';
        todayButton.className = 'btn btn-primary btn-xs today-button';
        todayButton.type = 'button';
        
        todayButton.style.marginTop = '5px';
        todayButton.style.display = 'block';
        
        todayButton.addEventListener('click', function() {
          const today = new Date();
          const formattedDate = today.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit', 
            year: 'numeric'
          });
          textInput.value = formattedDate;
          
          const changeEvent = new Event('change', { bubbles: true });
          textInput.dispatchEvent(changeEvent);
          
          console.log('Today button clicked, set date to:', formattedDate);
        });
        
        textInput.parentNode.insertBefore(todayButton, textInput.nextSibling);
        
        console.log('Today button added successfully');
      }
    });
  }

  function handleTransportManagerPages() {
    if (window.location.href.match(/https:\/\/mobiledelivery\.brightree\.net\/transportmanager\/.*/)) {
      console.log('Transport Manager page detected');
      
      addTodayButton();
    }
  }

  function processBrightreeModifications() {
    console.log('Processing Brightree modifications');
    
    removeColLg9Styling();
    
    handleTransportManagerPages();
  }

  function handleBrightreeMutations(mutations) {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the added node or its descendants contain col-lg-9 elements
          if (node.classList && node.classList.contains('col-lg-9') && node.tagName.toLowerCase() === 'div') {
            removeColLg9Styling();
          } else if (node.querySelectorAll) {
            const colLg9InNode = node.querySelectorAll('div.col-lg-9');
            if (colLg9InNode.length > 0) {
              removeColLg9Styling();
            }
          }
          
          // Handle transport manager mutations if on transport manager page
          if (window.location.href.match(/https:\/\/mobiledelivery\.brightree\.net\/transportmanager\/.*/)) {
            if (node.classList && node.classList.contains('col-lg-6')) {
              setTimeout(() => addTodayButton(), 100);
            } else if (node.querySelectorAll) {
              const colLg6InNode = node.querySelectorAll('div.col-lg-6');
              if (colLg6InNode.length > 0) {
                setTimeout(() => addTodayButton(), 100);
              }
            }
          }
        }
      });
    });
  }

  // Initialize Brightree functionality
  function initBrightreeFunctionality() {
    processBrightreeModifications();
    
    // Set up mutation observer for Brightree-specific changes
    const observer = new MutationObserver(handleBrightreeMutations);
    
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: false
      });
    }
    
    // Periodic cleanup for Brightree modifications
    setInterval(() => {
      processBrightreeModifications();
    }, 3000);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
      observer.disconnect();
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBrightreeFunctionality);
  } else {
    initBrightreeFunctionality();
  }

})();