// Runtime configuration for the app
window.APP_CONFIG = {
  // API URL - dynamically set based on hostname
  apiUrl: (function() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Production domains
    if (hostname === 'bosniaranking.lonercorp.com') {
      return 'https://apibosniaranking.lonercorp.com/api';
    }
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    
    // Default fallback (for other environments)
    return protocol + '//' + hostname + ':5000/api';
  })()
};