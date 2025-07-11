javascript:(function(){
  /* BV SHOP 條碼列印排版器 - 響應式完整版（支援 iPad） */
  
  /* 更精確的裝置偵測 */
  const userAgent = navigator.userAgent;
  const isIPad = /iPad/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) && !isIPad;
  const isTablet = isIPad || /Android(?!.*Mobile)/i.test(userAgent);
  
  /* 針對 iPad 的特殊處理 */
  const deviceType = isIPad ? 'tablet' : (isMobile ? 'mobile' : 'desktop');
  const shouldUseMobileLayout = isMobile || (isIPad && window.innerWidth < 768);
  
  /* 檢查是否在 iframe 中（某些 iPad 瀏覽器的限制） */
  if (window.self !== window.top) {
    try {
      window.top.location.href = window.self.location.href;
    } catch (e) {
      alert('請在新分頁中開啟此功能');
      return;
    }
  }
  
  // 只在條碼列印頁面上執行
  if (!document.querySelector('.print_barcode_area')) {
    alert('請在 BV SHOP 條碼列印頁面使用此工具');
    return;
  }

  /* 載入思源黑體 */
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap';
  document.head.appendChild(fontLink);

  /* 載入 Material Icons */
  const iconLink = document.createElement('link');
  iconLink.rel = 'stylesheet';
  iconLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
  document.head.appendChild(iconLink);

  /* 字體選項 */
  const fontOptions = [
    { name: '系統預設', value: 'Arial, sans-serif' },
    { name: '微軟正黑體', value: 'Microsoft JhengHei, 微軟正黑體, sans-serif' },
    { name: '蘋方體', value: 'PingFang TC, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif' },
    { name: '思源黑體', value: '"Noto Sans TC", sans-serif' }
  ];

  /* 建立基本樣式 */
  const style = document.createElement('style');
  style.innerHTML = `
    /* 響應式預設顯示 */
    body {
      zoom: ${shouldUseMobileLayout ? 1 : 2};
      -moz-transform: scale(${shouldUseMobileLayout ? 1 : 2});
      -moz-transform-origin: 0 0;
      -webkit-transform: scale(${shouldUseMobileLayout ? 1 : 2});
      -webkit-transform-origin: 0 0;
      background: #f8f9fa;
      margin: 0;
      padding: ${shouldUseMobileLayout ? '60px 10px 20px 10px' : '40px 20px 20px 20px'};
    }
    
    /* iPad 特殊調整 */
    ${isIPad ? `
      body {
        -webkit-text-size-adjust: 100%;
        touch-action: manipulation;
      }
      
      input[type="range"] {
        -webkit-appearance: none;
      }
      
      /* 防止 iPad 上的彈跳效果 */
      body {
        position: fixed;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      
      .print_barcode_area {
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        height: calc(100vh - 80px);
      }
    ` : ''}
    
    /* 隱藏原本的列印按鈕 */
    body > button.no-print {
      display: none !important;
    }
    
    /* 移除中間層包裝，直接設定標籤樣式 */
    .print_barcode_area {
      margin-top: 20px;
    }
    
    /* 為每個標籤添加效果 */
    .print_sample {
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid #e8e8e8;
      position: relative;
      transition: all 0.2s ease;
      margin-bottom: 10px;
      border-radius: 4px;
      overflow: hidden;
    }
    
    /* 標籤懸停效果 - 桌面版才有 */
    @media (hover: hover) and (pointer: fine) {
      .print_sample:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }
    }
    
    /* iPad 觸控優化 */
    ${isIPad ? `
      .print_sample:active {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        transform: scale(0.98);
      }
    ` : ''}
    
    @media print {
      body {
        zoom: 1 !important;
        -moz-transform: scale(1) !important;
        -webkit-transform: scale(1) !important;
        background: white !important;
        padding: 0 !important;
        position: static !important;
        overflow: visible !important;
      }
      
      .print_barcode_area {
        margin-top: 0 !important;
        height: auto !important;
        overflow: visible !important;
      }
      
      .print_sample {
        box-shadow: none !important;
        border: none !important;
        margin-bottom: 0 !important;
        border-radius: 0 !important;
        transform: none !important;
      }
      
      #barcode-control-panel {
        display: none !important;
      }
      
      .barcode-notification {
        display: none !important;
      }
    }
  
    #barcode-control-panel {
      position: fixed;
      ${shouldUseMobileLayout ? `
        bottom: 0;
        left: 0;
        right: 0;
        top: auto;
        width: 100%;
        max-height: 80vh;
        border-radius: 20px 20px 0 0;
        zoom: 1;
        -moz-transform: scale(1);
        -webkit-transform: scale(1);
      ` : `
        ${isIPad ? `
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          max-width: 90vw;
          max-height: 90vh;
          border-radius: 20px;
        ` : `
          top: 20px;
          right: 20px;
          width: 400px;
          max-height: 90vh;
          border-radius: 20px;
          zoom: 0.5;
          -moz-transform: scale(0.5);
          -moz-transform-origin: top right;
        `}
      `}
      z-index: 99999;
      background: #ffffff;
      border: none;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06);
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", "Helvetica Neue", Arial, sans-serif;
      font-size: ${isIPad ? '16px' : '14px'};
      overflow: hidden;
      color: #1a1a1a;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      -webkit-backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
    }
    
    #barcode-control-panel:hover {
      box-shadow: 0 12px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08);
    }
    
    /* iPad 觸控區域優化 */
    ${isIPad ? `
      button, .icon-button, .bold-button, input[type="range"] {
        min-height: 44px;
        min-width: 44px;
      }
      
      input[type="range"]::-webkit-slider-thumb {
        width: 30px !important;
        height: 30px !important;
      }
      
      .value-badge {
        padding: 8px 16px;
        font-size: 14px;
      }
    ` : ''}
    
    .panel-header {
      background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
      color: white;
      padding: ${shouldUseMobileLayout ? '20px 24px' : '24px 28px'};
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: ${shouldUseMobileLayout ? '20px 20px 0 0' : '20px 20px 0 0'};
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(88, 101, 242, 0.2);
      ${isIPad ? 'cursor: move;' : ''}
    }
    
    .panel-header h3 {
      margin: 0;
      font-size: ${shouldUseMobileLayout ? '17px' : (isIPad ? '20px' : '19px')};
      font-weight: 600;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    /* 關閉按鈕 - iPad 也顯示 */
    .panel-close {
      display: ${shouldUseMobileLayout || isIPad ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      width: ${isIPad ? '44px' : '32px'};
      height: ${isIPad ? '44px' : '32px'};
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      -webkit-tap-highlight-color: transparent;
    }
    
    .panel-close:hover, .panel-close:active {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .panel-close .material-icons {
      font-size: ${isIPad ? '24px' : '20px'};
      color: white;
    }
    
    .panel-body {
      padding: ${shouldUseMobileLayout ? '20px' : '28px'};
      overflow-y: auto;
      flex: 1;
      max-height: ${shouldUseMobileLayout ? 'calc(80vh - 180px)' : 'calc(90vh - 220px)'};
      -webkit-overflow-scrolling: touch;
    }
    
    /* 其餘樣式保持不變，但針對 iPad 增加觸控區域 */
    ${isIPad ? `
      .control-label {
        min-height: 44px;
        align-items: center;
      }
      
      select, input[type="text"] {
        font-size: 16px; /* 防止 iOS 自動縮放 */
      }
      
      .action-button {
        min-height: 50px;
      }
    ` : ''}
  `;
  
  /* 繼續添加其餘的樣式... */
  style.innerHTML += `
    /* 固定在底部的列印按鈕區域 */
    .panel-footer {
      background: linear-gradient(to top, #fafbfc, #ffffff);
      padding: ${shouldUseMobileLayout ? '16px 20px' : '20px 28px'};
      border-top: 1px solid #eef0f2;
      border-radius: 0 0 ${shouldUseMobileLayout ? '0 0' : '20px 20px'};
      flex-shrink: 0;
    }
    
    .preset-section {
      background: linear-gradient(135deg, #f8f9ff 0%, #f5f6ff 100%);
      border-radius: 14px;
      padding: ${shouldUseMobileLayout ? '14px' : '18px'};
      margin-bottom: ${shouldUseMobileLayout ? '20px' : '28px'};
      border: 1px solid rgba(88, 101, 242, 0.08);
    }
    
    .preset-row {
      display: flex;
      gap: ${shouldUseMobileLayout ? '8px' : '10px'};
      align-items: center;
      flex-wrap: ${shouldUseMobileLayout ? 'wrap' : 'nowrap'};
    }
    
    #preset-select {
      flex-grow: 1;
      background: white;
      border: 2px solid #e8eaed;
      border-radius: 10px;
      padding: ${shouldUseMobileLayout ? '10px 12px' : '11px 14px'};
      font-size: ${isIPad ? '16px' : '14px'};
      color: #24292e;
      transition: all 0.2s ease;
      font-weight: 500;
      min-width: ${shouldUseMobileLayout ? '100%' : 'auto'};
      margin-bottom: ${shouldUseMobileLayout ? '8px' : '0'};
      -webkit-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 20px;
      padding-right: 40px;
    }
    
    #preset-select:hover {
      border-color: #7289DA;
    }
    
    #preset-select:focus {
      outline: none;
      border-color: #5865F2;
      box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.1);
    }
    
    .icon-button {
      background: white;
      border: 2px solid #e8eaed;
      border-radius: 10px;
      padding: ${isIPad ? '12px' : '9px'};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      width: ${isIPad ? '50px' : '40px'};
      height: ${isIPad ? '50px' : '40px'};
      flex-shrink: 0;
      -webkit-tap-highlight-color: transparent;
    }
    
    .icon-button:hover, .icon-button:active {
      background: #f8f9ff;
      border-color: #7289DA;
      transform: translateY(-1px);
    }
    
    .icon-button:active {
      transform: translateY(0);
    }
    
    .icon-button .material-icons {
      font-size: ${isIPad ? '24px' : '20px'};
      color: #5865F2;
    }
    
    /* 清除格式按鈕特殊樣式 */
    .icon-button.reset-button:hover {
      background: #fff5f5;
      border-color: #f04747;
    }
    
    .icon-button.reset-button .material-icons {
      color: #f04747;
    }
    
    /* 粗體按鈕樣式 */
    .bold-button {
      background: white;
      border: 2px solid #e8eaed;
      border-radius: 8px;
      padding: ${isIPad ? '10px 18px' : '6px 14px'};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: ${isIPad ? '18px' : '16px'};
      font-weight: 700;
      color: #6c757d;
      user-select: none;
      min-width: ${isIPad ? '50px' : '36px'};
      -webkit-tap-highlight-color: transparent;
    }
    
    .bold-button:hover, .bold-button:active {
      background: #f8f9ff;
      border-color: #7289DA;
      color: #5865F2;
    }
    
    .bold-button.active {
      background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
      color: white;
      border-color: transparent;
      box-shadow: 0 2px 6px rgba(88, 101, 242, 0.3);
    }
    
    .bold-button.active:hover, .bold-button.active:active {
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(88, 101, 242, 0.35);
    }
    
    .section {
      margin-bottom: 0;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: ${shouldUseMobileLayout ? '12px 16px' : (isIPad ? '16px 20px' : '14px 18px')};
      background: #f8f9fa;
      border-radius: 12px;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
      margin-bottom: ${shouldUseMobileLayout ? '14px' : '18px'};
      border: 1px solid transparent;
      -webkit-tap-highlight-color: transparent;
    }
    
    .section-header:hover, .section-header:active {
      background: #f0f2f5;
      border-color: #e8eaed;
    }
    
    .section-header h4 {
      margin: 0;
      font-size: ${shouldUseMobileLayout ? '14px' : (isIPad ? '16px' : '15px')};
      font-weight: 600;
      color: #24292e;
      display: flex;
      align-items: center;
      gap: ${shouldUseMobileLayout ? '8px' : '10px'};
    }
    
    .section-icon {
      font-size: ${shouldUseMobileLayout ? '20px' : (isIPad ? '24px' : '22px')};
      background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .section-toggle {
      color: #6c757d;
      transition: transform 0.3s ease;
      font-size: ${shouldUseMobileLayout ? '22px' : '24px'};
    }
    
    .section-header.collapsed .section-toggle {
      transform: rotate(-90deg);
    }
    
    .section-content {
      max-height: 2000px;
      overflow: hidden;
      transition: max-height 0.3s ease, opacity 0.3s ease, margin-bottom 0.3s ease;
      opacity: 1;
      margin-bottom: ${shouldUseMobileLayout ? '20px' : '24px'};
    }
    
    .section-content.collapsed {
      max-height: 0;
      opacity: 0;
      margin-bottom: 0;
    }
    
    .control-group {
      background: #fafbfc;
      border-radius: 14px;
      padding: ${shouldUseMobileLayout ? '16px' : (isIPad ? '24px' : '20px')};
      margin-bottom: ${shouldUseMobileLayout ? '14px' : '18px'};
      border: 1px solid #eef0f2;
    }
    
    .control-group:last-child {
      margin-bottom: 0;
    }
    
    .control-group-title {
      font-size: ${shouldUseMobileLayout ? '12px' : (isIPad ? '14px' : '13px')};
      font-weight: 700;
      background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: ${shouldUseMobileLayout ? '14px' : '16px'};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .control-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: ${shouldUseMobileLayout ? '12px' : '14px'};
      font-weight: 500;
      color: #24292e;
      font-size: ${shouldUseMobileLayout ? '13px' : (isIPad ? '15px' : '14px')};
      min-height: ${isIPad ? '30px' : 'auto'};
    }
    
    .control-label-with-button {
      display: flex;
      align-items: center;
      gap: ${shouldUseMobileLayout ? '10px' : '12px'};
    }
    
    .value-badge {
      background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
      color: white;
      padding: ${isIPad ? '8px 16px' : '5px 12px'};
      border-radius: 20px;
      font-size: ${isIPad ? '14px' : '12px'};
      font-weight: 600;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      min-width: ${isIPad ? '60px' : '50px'};
      text-align: center;
      box-shadow: 0 2px 4px rgba(88, 101, 242, 0.2);
    }
    
    .value-badge.negative {
      background: linear-gradient(135deg, #f04747 0%, #e74c3c 100%);
    }
    
    .value-badge.warning {
      background: linear-gradient(135deg, #faa61a 0%, #f59e0b 100%);
    }
    
    input[type="range"] {
      width: 100%;
      height: ${isIPad ? '8px' : '6px'};
      background: #e8eaed;
      border-radius: ${isIPad ? '4px' : '3px'};
      outline: none;
      -webkit-appearance: none;
      appearance: none;
      margin: ${isIPad ? '20px 0 12px 0' : '16px 0 8px 0'};
      position: relative;
    }
    
    /* 為滑軌添加漸層效果 */
    input[type="range"]:before {
      content: '';
      position: absolute;
      height: ${isIPad ? '8px' : '6px'};
      border-radius: ${isIPad ? '4px' : '3px'};
      background: linear-gradient(90deg, #5865F2 0%, #7289DA 100%);
      width: var(--value, 0%);
      pointer-events: none;
    }
    
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: ${isIPad ? '30px' : (shouldUseMobileLayout ? '26px' : '22px')};
      height: ${isIPad ? '30px' : (shouldUseMobileLayout ? '26px' : '22px')};
      background: white;
      border: 3px solid #5865F2;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(88, 101, 242, 0.3);
      transition: all 0.2s ease;
      position: relative;
      z-index: 1;
    }
    
    input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.15);
      box-shadow: 0 4px 12px rgba(88, 101, 242, 0.4);
      border-color: #7289DA;
    }
    
    input[type="range"]::-moz-range-thumb {
      width: ${isIPad ? '30px' : (shouldUseMobileLayout ? '26px' : '22px')};
      height: ${isIPad ? '30px' : (shouldUseMobileLayout ? '26px' : '22px')};
      background: white;
      border: 3px solid #5865F2;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(88, 101, 242, 0.3);
      transition: all 0.2s ease;
    }
    
    select {
      width: 100%;
      padding: ${shouldUseMobileLayout ? '10px 12px' : (isIPad ? '14px 16px' : '11px 14px')};
      border: 2px solid #e8eaed;
      border-radius: 10px;
      background: white;
      color: #24292e;
      font-size: ${isIPad ? '16px' : '14px'};
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
      -webkit-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 20px;
      padding-right: 40px;
    }
    
    select:hover {
      border-color: #7289DA;
    }
    
    select:focus {
      outline: none;
      border-color: #5865F2;
      box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.1);
    }
    
    .action-button {
      width: 100%;
      background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
      color: white;
      border: none;
      padding: ${shouldUseMobileLayout ? '14px 20px' : (isIPad ? '18px 24px' : '16px 24px')};
      border-radius: 12px;
      font-size: ${shouldUseMobileLayout ? '15px' : (isIPad ? '18px' : '16px')};
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: 0 4px 14px rgba(88, 101, 242, 0.3);
      position: relative;
      overflow: hidden;
      -webkit-tap-highlight-color: transparent;
    }
    
    .action-button:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #7289DA 0%, #8ea1e1 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .action-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(88, 101, 242, 0.4);
    }
    
    .action-button:hover:before {
      opacity: 1;
    }
    
    .action-button:active {
      transform: translateY(0);
    }
    
    .action-button .material-icons {
      font-size: ${shouldUseMobileLayout ? '22px' : '24px'};
      position: relative;
      z-index: 1;
    }
    
    .action-button span {
      position: relative;
      z-index: 1;
    }
    
    /* 輸入框樣式 */
    input[type="text"] {
      width: 100%;
      padding: ${shouldUseMobileLayout ? '10px 12px' : (isIPad ? '14px 16px' : '11px 14px')};
      border: 2px solid #e8eaed;
      border-radius: 10px;
      font-size: ${isIPad ? '16px' : '14px'};
      transition: all 0.2s ease;
      font-weight: 500;
      -webkit-appearance: none;
      appearance: none;
    }
    
    input[type="text"]:focus {
      outline: none;
      border-color: #5865F2;
      box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.1);
    }
    
    /* 小按鈕樣式 */
    .small-button {
      padding: ${shouldUseMobileLayout ? '7px 16px' : (isIPad ? '10px 20px' : '8px 18px')};
      background: white;
      border: 2px solid #e8eaed;
      border-radius: 8px;
      font-size: ${isIPad ? '14px' : '13px'};
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      -webkit-tap-highlight-color: transparent;
    }
    
    .small-button:hover, .small-button:active {
      background: #f8f9ff;
      border-color: #7289DA;
      color: #5865F2;
    }
    
    .small-button.primary {
      background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
      color: white;
      border-color: transparent;
      box-shadow: 0 2px 6px rgba(88, 101, 242, 0.3);
    }
    
    .small-button.primary:hover, .small-button.primary:active {
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(88, 101, 242, 0.35);
    }
    
    /* 滾動條樣式 */
    .panel-body::-webkit-scrollbar {
      width: ${shouldUseMobileLayout ? '6px' : '10px'};
    }
    
    .panel-body::-webkit-scrollbar-track {
      background: #f8f9fa;
      border-radius: 5px;
    }
    
    .panel-body::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #d4d7dd 0%, #c1c4cb 100%);
      border-radius: 5px;
    }
    
    .panel-body::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #b8bcc4 0%, #a8abb3 100%);
    }
    
    /* 動畫效果 */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: ${shouldUseMobileLayout ? 'translateY(100%)' : (isIPad ? 'translate(-50%, -45%)' : 'translateX(20px)')};
      }
      to {
        opacity: 1;
        transform: ${shouldUseMobileLayout ? 'translateY(0)' : (isIPad ? 'translate(-50%, -50%)' : 'translateX(0)')};
      }
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(88, 101, 242, 0.4);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(88, 101, 242, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(88, 101, 242, 0);
      }
    }
    
    #barcode-control-panel {
      animation: slideIn 0.3s ease-out;
    }
    
    /* 真實的條碼圖示 */
    .barcode-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${shouldUseMobileLayout ? '24px' : '28px'};
      height: ${shouldUseMobileLayout ? '24px' : '28px'};
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 4px;
    }
    
    .barcode-icon svg {
      width: ${shouldUseMobileLayout ? '16px' : '20px'};
      height: ${shouldUseMobileLayout ? '16px' : '20px'};
      fill: white;
    }
    
    /* 分隔線樣式 */
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #e8eaed 50%, transparent 100%);
      margin: ${shouldUseMobileLayout ? '14px 0' : '18px 0'};
    }
    
    /* 提示文字 */
    .control-hint {
      font-size: ${isIPad ? '13px' : '12px'};
      color: #6c757d;
      margin-top: 6px;
      font-style: italic;
    }
    
    /* 底圖上傳樣式 */
    .logo-upload-area {
      border: 2px dashed #d4d7dd;
      border-radius: 12px;
      padding: ${shouldUseMobileLayout ? '20px' : (isIPad ? '28px' : '24px')};
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: linear-gradient(135deg, #fafbff 0%, #f5f6ff 100%);
      margin-bottom: 16px;
      position: relative;
      overflow: hidden;
      -webkit-tap-highlight-color: transparent;
    }
    
    .logo-upload-area:before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent 30%, rgba(88, 101, 242, 0.05) 50%, transparent 70%);
      transform: rotate(45deg);
      transition: all 0.6s ease;
      opacity: 0;
    }
    
    .logo-upload-area:hover, .logo-upload-area:active {
      border-color: #7289DA;
      background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
    }
    
    .logo-upload-area:hover:before {
      opacity: 1;
      transform: rotate(45deg) translateY(100%);
    }
    
    .logo-upload-area.has-logo {
      border-style: solid;
      padding: ${isIPad ? '20px' : '16px'};
      background: white;
    }
    
    .logo-preview {
      max-width: 100%;
      max-height: ${shouldUseMobileLayout ? '80px' : (isIPad ? '120px' : '100px')};
      margin: 0 auto;
      display: block;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    
    .upload-hint {
      color: #6c757d;
      font-size: ${shouldUseMobileLayout ? '12px' : (isIPad ? '14px' : '13px')};
      margin-top: 10px;
      font-weight: 500;
    }
    
    .logo-controls {
      display: none;
    }
    
    .logo-controls.active {
      display: block;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .remove-logo-btn {
      background: linear-gradient(135deg, #f04747 0%, #e74c3c 100%);
      color: white;
      border: none;
      padding: ${shouldUseMobileLayout ? '9px 18px' : (isIPad ? '12px 24px' : '10px 20px')};
      border-radius: 8px;
      font-size: ${isIPad ? '14px' : '13px'};
      font-weight: 600;
      cursor: pointer;
      margin-top: 16px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(240, 71, 71, 0.3);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      -webkit-tap-highlight-color: transparent;
    }
    
    .remove-logo-btn:hover, .remove-logo-btn:active {
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(240, 71, 71, 0.35);
    }
    
    /* 底圖在標籤上的樣式 */
    .print_sample {
      position: relative !important;
    }
    
    .label-background-logo {
      position: absolute !important;
      z-index: 1 !important;
      pointer-events: none;
      object-fit: contain !important;
    }
    
    /* 確保內容在底圖上方 */
    .print_sample > *:not(.label-background-logo) {
      position: relative !important;
      z-index: 2 !important;
    }
    
    /* 新增載入動畫 */
    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* 改善通知樣式 - 修正置中和大小問題 */
    .barcode-notification {
      position: fixed !important;
      top: ${shouldUseMobileLayout ? '60px' : '20px'} !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      z-index: 100000 !important;
      ${!shouldUseMobileLayout && !isIPad ? `
        zoom: 0.5;
        -moz-transform: scale(0.5) translateX(-100%);
        -moz-transform-origin: center top;
        -webkit-transform: scale(0.5) translateX(-100%);
        -webkit-transform-origin: center top;
      ` : ''}
    }
    
    .notification {
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .notification.success {
      border-left: 4px solid #10b981;
      color: #059669;
    }
    
    .notification.warning {
      border-left: 4px solid #f59e0b;
      color: #d97706;
    }
    
    /* 手機版開啟按鈕 */
    .mobile-toggle-btn {
      display: ${shouldUseMobileLayout ? 'flex' : 'none'};
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
      border-radius: 50%;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(88, 101, 242, 0.4);
      cursor: pointer;
      z-index: 99998;
      transition: all 0.3s ease;
      -webkit-tap-highlight-color: transparent;
    }
    
    .mobile-toggle-btn:hover, .mobile-toggle-btn:active {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(88, 101, 242, 0.5);
    }
    
    .mobile-toggle-btn .material-icons {
      color: white;
      font-size: 28px;
    }
    
    /* 手機版面板隱藏狀態 */
    #barcode-control-panel.hidden {
      transform: ${shouldUseMobileLayout ? 'translateY(100%)' : 'translateX(100%)'};
    }
    
    /* iPad 特定調整 */
    ${isIPad ? `
      /* 防止 iPad 上的雙擊縮放 */
      * {
        touch-action: manipulation;
      }
      
      /* 調整面板在 iPad 上的陰影效果 */
      #barcode-control-panel {
        box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 5px 20px rgba(0,0,0,0.08);
      }
      
      /* 加強 iPad 上的視覺反饋 */
      button:active, .icon-button:active, .bold-button:active, 
      .section-header:active, .logo-upload-area:active {
        opacity: 0.8;
      }
    ` : ''}
  `;
  document.head.appendChild(style);

  /* 建立控制面板的其餘部分保持不變，但需要確保正確的設備檢測 */
  /* ... 其餘程式碼保持相同，只是將 isMobile 替換為 shouldUseMobileLayout ... */
  
  /* 為 iPad 添加特殊的事件處理 */
  if (isIPad) {
    // 防止 iPad Safari 的彈性滾動
    document.addEventListener('touchmove', function(e) {
      if (e.target.closest('.panel-body')) {
        // 允許面板內部滾動
        return;
      }
      e.preventDefault();
    }, { passive: false });
    
    // 改善觸控響應
    document.addEventListener('touchstart', function() {}, { passive: true });
  }
  
  /* 初始化函數需要檢查執行環境 */
  function initializeApp() {
    try {
      // 檢查是否可以使用 localStorage
      const testKey = 'bvShopBarcode_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (e) {
      console.warn('localStorage 不可用，某些功能可能受限');
      // 可以考慮使用其他儲存方式或降級處理
    }
    
    // 繼續原本的初始化流程...
    createControlPanel();
  }
  
  /* 建立控制面板函數 */
  function createControlPanel() {
    setTimeout(() => {
      const panel = document.createElement('div');
      panel.id = 'barcode-control-panel';
      panel.className = shouldUseMobileLayout ? 'hidden' : '';
      
      // 這裡繼續使用原本的 innerHTML 內容，但注意要使用 shouldUseMobileLayout 而非 isMobile
      panel.innerHTML = `
        <div class="panel-header">
          <h3>
            <div class="barcode-icon">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="6" width="1" height="12"/>
                <rect x="4" y="6" width="1" height="12"/>
                <rect x="6" y="6" width="2" height="12"/>
                <rect x="9" y="6" width="1" height="12"/>
                <rect x="11" y="6" width="2" height="12"/>
                <rect x="14" y="6" width="1" height="12"/>
                <rect x="16" y="6" width="1" height="12"/>
                <rect x="18" y="6" width="2" height="12"/>
                <rect x="21" y="6" width="1" height="12"/>
              </svg>
            </div>
            BV SHOP 條碼列印排版器
          </h3>
          ${(shouldUseMobileLayout || isIPad) ? `
            <div class="panel-close">
              <span class="material-icons">close</span>
            </div>
          ` : ''}
        </div>
        
        <div class="panel-body">
          <div class="preset-section">
            <div class="preset-row">
              <select id="preset-select">
                <option value="">-- 選擇設定檔 --</option>
              </select>
              <button class="icon-button" id="save-preset" title="儲存設定">
                <span class="material-icons">save</span>
              </button>
              <button class="icon-button" id="delete-preset" title="刪除設定">
                <span class="material-icons">delete</span>
              </button>
              <button class="icon-button reset-button" id="reset-format" title="清除格式">
                <span class="material-icons">restart_alt</span>
              </button>
            </div>
            <div class="preset-row" id="save-preset-row" style="display:none; margin-top: 10px;">
              <input type="text" id="new-preset-name" placeholder="輸入設定檔名稱" style="width: 100%; margin-bottom: ${shouldUseMobileLayout ? '8px' : '0'};">
              <button class="small-button primary" id="confirm-save">確認</button>
              <button class="small-button" id="cancel-save">取消</button>
            </div>
          </div>
          
          <!-- 基本設定區塊 -->
          <div class="section">
            <div class="section-header" data-section="basic">
              <h4>
                <span class="material-icons section-icon">tune</span>
                基本設定
              </h4>
              <span class="material-icons section-toggle">expand_more</span>
            </div>
            <div class="section-content" id="basic-content">
              <!-- 標籤尺寸 -->
              <div class="control-group">
                <div class="control-group-title">標籤紙張設定</div>
                <div class="control-label">
                  <span>標籤寬度</span>
                  <span class="value-badge" id="label-width">40mm</span>
                </div>
                <input type="range" id="label-width-slider" min="30" max="60" value="40">
                
                <div class="control-label" style="margin-top: 20px;">
                  <span>標籤高度</span>
                  <span class="value-badge" id="label-height">30mm</span>
                </div>
                <input type="range" id="label-height-slider" min="20" max="40" value="30">
                
                <div class="control-label" style="margin-top: 20px;">
                  <span>內部邊距</span>
                  <span class="value-badge" id="label-padding">1mm</span>
                </div>
                <input type="range" id="label-padding-slider" min="0" max="5" step="0.5" value="1">
              </div>
              
              <!-- 字體設定 -->
              <div class="control-group">
                <div class="control-group-title">字體設定</div>
                <div class="control-label">
                  <span>字體類型</span>
                </div>
                <select id="font-family-select">
                  ${fontOptions.map(font => `<option value="${font.value}">${font.name}</option>`).join('')}
                </select>
                
                <div class="control-label" style="margin-top: 20px;">
                  <span>對齊方式</span>
                </div>
                <select id="text-align">
                  <option value="left">靠左對齊</option>
                  <option value="center">置中對齊</option>
                  <option value="right">靠右對齊</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- 文字設定區塊 -->
          <div class="section">
            <div class="section-header" data-section="text">
              <h4>
                <span class="material-icons section-icon">text_fields</span>
                文字設定
              </h4>
              <span class="material-icons section-toggle">expand_more</span>
            </div>
            <div class="section-content" id="text-content">
              <div class="control-group">
                <div class="control-group-title">文字大小與樣式</div>
                
                <div class="control-label">
                  <span class="control-label-with-button">
                    商品名稱
                    <button class="bold-button active" id="main-bold-btn" title="粗體">B</button>
                  </span>
                  <span class="value-badge" id="main-size">10px</span>
                </div>
                <input type="range" id="main-slider" min="8" max="20" value="10">
                
                <div class="divider"></div>
                
                <div class="control-label">
                  <span class="control-label-with-button">
                    規格/編號/價格
                    <button class="bold-button active" id="sub-bold-btn" title="粗體">B</button>
                  </span>
                  <span class="value-badge" id="sub-size">8px</span>
                </div>
                <input type="range" id="sub-slider" min="6" max="16" value="8">
                
                <div class="divider"></div>
                
                <div class="control-label">
                  <span class="control-label-with-button">
                    條碼數字
                    <button class="bold-button" id="barcode-text-bold-btn" title="粗體">B</button>
                  </span>
                  <span class="value-badge" id="barcode-text-size">8px</span>
                </div>
                <input type="range" id="barcode-text-slider" min="6" max="16" value="8">
              </div>
            </div>
          </div>
          
          <!-- 版面配置區塊 -->
          <div class="section">
            <div class="section-header" data-section="layout">
              <h4>
                <span class="material-icons section-icon">dashboard</span>
                版面配置
              </h4>
              <span class="material-icons section-toggle">expand_more</span>
            </div>
            <div class="section-content" id="layout-content">
              <!-- 條碼設定 -->
              <div class="control-group">
                <div class="control-group-title">條碼圖案設定</div>
                <div class="control-label">
                  <span>條碼高度</span>
                  <span class="value-badge" id="barcode-height">10mm</span>
                </div>
                <input type="range" id="barcode-height-slider" min="6" max="15" value="10">
                
                <div class="control-label" style="margin-top: 20px;">
                  <span>條碼寬度${shouldUseMobileLayout ? '' : '（相對標籤寬度）'}</span>
                  <span class="value-badge" id="barcode-width">75%</span>
                </div>
                <input type="range" id="barcode-width-slider" min="50" max="100" value="75">
              </div>
              
              <!-- 間距設定 -->
              <div class="control-group">
                <div class="control-group-title">間距設定</div>
                <div class="control-label">
                  <span>商品名稱與其他資訊間距</span>
                  <span class="value-badge" id="main-gap">1px</span>
                </div>
                <input type="range" id="main-gap-slider" min="0" max="10" step="0.5" value="1">
                
                <div class="control-label" style="margin-top: 20px;">
                  <span>文字區域佔比</span>
                  <span class="value-badge" id="text-area-ratio">60%</span>
                </div>
                <input type="range" id="text-area-ratio-slider" min="30" max="80" value="60">
                <div class="control-hint" id="area-hint">文字區：60% / 條碼區：40%</div>
              </div>
            </div>
          </div>
          
          <!-- 底圖設定區塊 -->
          <div class="section">
            <div class="section-header" data-section="logo">
              <h4>
                <span class="material-icons section-icon">image</span>
                底圖設定
              </h4>
              <span class="material-icons section-toggle">expand_more</span>
            </div>
            <div class="section-content" id="logo-content">
              <div class="control-group">
                <div class="control-group-title">底圖上傳與設定</div>
                
                <div class="logo-upload-area" id="logo-upload-area">
                  <input type="file" id="logo-input" accept="image/png,image/jpeg,image/jpg" style="display:none;">
                  <img id="logo-preview" class="logo-preview" style="display:none;">
                  <div id="upload-prompt">
                    <span class="material-icons" style="font-size:36px; background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">add_photo_alternate</span>
                    <div class="upload-hint">點擊上傳底圖（支援 PNG/JPG）</div>
                  </div>
                </div>
                
                <div class="logo-controls" id="logo-controls">
                  <div class="control-label">
                    <span>底圖大小${shouldUseMobileLayout ? '' : '（相對標籤高度）'}</span>
                    <span class="value-badge" id="logo-size">30%</span>
                  </div>
                  <input type="range" id="logo-size-slider" min="10" max="100" value="30">
                  
                  <div class="control-label" style="margin-top: 20px;">
                    <span>水平位置</span>
                    <span class="value-badge" id="logo-x">50%</span>
                  </div>
                  <input type="range" id="logo-x-slider" min="0" max="100" value="50">
                  
                  <div class="control-label" style="margin-top: 20px;">
                    <span>垂直位置</span>
                    <span class="value-badge" id="logo-y">50%</span>
                  </div>
                  <input type="range" id="logo-y-slider" min="0" max="100" value="50">
                  
                  <div class="control-label" style="margin-top: 20px;">
                    <span>淡化程度</span>
                    <span class="value-badge" id="logo-opacity">20%</span>
                  </div>
                  <input type="range" id="logo-opacity-slider" min="0" max="100" value="20">
                  
                  <button class="remove-logo-btn" id="remove-logo-btn">
                    <span class="material-icons" style="font-size: 16px;">delete</span>
                    移除底圖
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 固定在底部的列印按鈕 -->
        <div class="panel-footer">
          <button class="action-button" id="apply-print">
            <span class="material-icons">print</span>
            <span>套用並列印</span>
          </button>
        </div>
      `;
      document.body.appendChild(panel);

      /* 手機版浮動按鈕 */
      if (shouldUseMobileLayout) {
        const toggleBtn = document.createElement('div');
        toggleBtn.className = 'mobile-toggle-btn';
        toggleBtn.innerHTML = '<span class="material-icons">tune</span>';
        document.body.appendChild(toggleBtn);
        
        toggleBtn.addEventListener('click', () => {
          panel.classList.toggle('hidden');
        });
      }
      
      /* 關閉按鈕事件 */
      const closeBtn = panel.querySelector('.panel-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (shouldUseMobileLayout) {
            panel.classList.add('hidden');
          } else if (isIPad) {
            // iPad 可以選擇隱藏或最小化
            if (confirm('是否要關閉排版器？')) {
              panel.style.display = 'none';
              // 添加一個重新開啟的按鈕
              const reopenBtn = document.createElement('button');
              reopenBtn.className = 'reopen-btn';
              reopenBtn.innerHTML = '<span class="material-icons">tune</span> 開啟排版器';
              reopenBtn.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                z-index: 99998;
              `;
              document.body.appendChild(reopenBtn);
              
              reopenBtn.addEventListener('click', () => {
                panel.style.display = 'flex';
                reopenBtn.remove();
              });
            }
          }
        });
      }
      
      /* 為 iPad 添加拖動功能 */
      if (isIPad && !shouldUseMobileLayout) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        const header = panel.querySelector('.panel-header');
        
        function dragStart(e) {
          if (e.target.closest('.panel-close')) return;
          
          if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
          } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
          }
          
          if (e.target === header || header.contains(e.target)) {
            isDragging = true;
          }
        }
        
        function dragEnd(e) {
          initialX = currentX;
          initialY = currentY;
          isDragging = false;
        }
        
        function drag(e) {
          if (isDragging) {
            e.preventDefault();
            
            if (e.type === "touchmove") {
              currentX = e.touches[0].clientX - initialX;
              currentY = e.touches[0].clientY - initialY;
            } else {
              currentX = e.clientX - initialX;
              currentY = e.clientY - initialY;
            }
            
            xOffset = currentX;
            yOffset = currentY;
            
            panel.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
          }
        }
        
        // 添加事件監聽器
        header.addEventListener('touchstart', dragStart, { passive: false });
        header.addEventListener('touchend', dragEnd, { passive: false });
        header.addEventListener('touchmove', drag, { passive: false });
        
        header.addEventListener('mousedown', dragStart);
        header.addEventListener('mouseup', dragEnd);
        header.addEventListener('mousemove', drag);
      }

      /* 建立動態樣式元素 */
      const dynamicStyle = document.createElement('style');
      document.head.appendChild(dynamicStyle);
      
      /* Logo 相關變數 */
      let logoDataUrl = null;
      let logoAspectRatio = 1;
      
      /* 為 range input 添加動態值更新 */
      function updateRangeProgress(input) {
        const value = (input.value - input.min) / (input.max - input.min) * 100;
        input.style.setProperty('--value', value + '%');
      }
      
      /* 延遲初始化所有控制項 */
      setTimeout(() => {
        /* Logo 上傳功能 */
        const logoUploadArea = document.getElementById('logo-upload-area');
        const logoInput = document.getElementById('logo-input');
        const logoPreview = document.getElementById('logo-preview');
        const uploadPrompt = document.getElementById('upload-prompt');
        const logoControls = document.getElementById('logo-controls');
        const removeLogoBtn = document.getElementById('remove-logo-btn');
        
        /* Logo 控制項 */
        const logoSizeSlider = document.getElementById('logo-size-slider');
        const logoXSlider = document.getElementById('logo-x-slider');
        const logoYSlider = document.getElementById('logo-y-slider');
        const logoOpacitySlider = document.getElementById('logo-opacity-slider');
        
        /* Logo 上傳事件 */
        if (logoUploadArea) {
          logoUploadArea.addEventListener('click', function() {
            logoInput.click();
          });
        }
        
        if (logoInput) {
          logoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
              const reader = new FileReader();
              reader.onload = function(event) {
                logoDataUrl = event.target.result;
                
                /* 創建臨時圖片來獲取原始尺寸 */
                const img = new Image();
                img.onload = function() {
                  /* 計算並保存寬高比 */
                  logoAspectRatio = img.width / img.height;
                  
                  logoPreview.src = logoDataUrl;
                  logoPreview.style.display = 'block';
                  uploadPrompt.style.display = 'none';
                  logoUploadArea.classList.add('has-logo');
                  logoControls.classList.add('active');
                  updateStyles();
                };
                img.src = logoDataUrl;
              };
              reader.readAsDataURL(file);
            } else {
              showNotification('請上傳 PNG 或 JPG 格式的圖片', 'warning');
            }
          });
        }
        
        /* 移除 Logo */
        if (removeLogoBtn) {
          removeLogoBtn.addEventListener('click', function() {
            logoDataUrl = null;
            logoAspectRatio = 1;
            logoPreview.style.display = 'none';
            uploadPrompt.style.display = 'block';
            logoUploadArea.classList.remove('has-logo');
            logoControls.classList.remove('active');
            logoInput.value = '';
            updateStyles();
          });
        }
        
        /* 折疊面板功能 */
        const sectionHeaders = panel.querySelectorAll('.section-header');
        sectionHeaders.forEach(header => {
          header.addEventListener('click', function() {
            const section = this.dataset.section;
            const content = document.getElementById(section + '-content');
            
            this.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
          });
        });
        
        /* 獲取所有需要的控制項元素 */
        const mainSize = document.getElementById('main-slider');
        const mainBoldBtn = document.getElementById('main-bold-btn');
        const mainGap = document.getElementById('main-gap-slider');
        
        const subSize = document.getElementById('sub-slider');
        const subBoldBtn = document.getElementById('sub-bold-btn');
        
        const barcodeTextSize = document.getElementById('barcode-text-slider');
        const barcodeTextBoldBtn = document.getElementById('barcode-text-bold-btn');
        const barcodeHeight = document.getElementById('barcode-height-slider');
        const barcodeWidth = document.getElementById('barcode-width-slider');
        
        const labelWidth = document.getElementById('label-width-slider');
        const labelHeight = document.getElementById('label-height-slider');
        const labelPadding = document.getElementById('label-padding-slider');
        const textAlign = document.getElementById('text-align');
        const fontFamily = document.getElementById('font-family-select');
        
        const textAreaRatio = document.getElementById('text-area-ratio-slider');
        
        /* BV SHOP 原始預設值 */
        const bvShopDefaults = {
          mainSize: 10,
          mainBold: true,
          mainGap: 1,
          subSize: 8,
          subBold: true,
          barcodeTextSize: 8,
          barcodeTextBold: false,
          barcodeHeight: 10,
          barcodeWidth: 75,
          labelWidth: 40,
          labelHeight: 30,
          labelPadding: 1,
          textAlign: 'left',
          fontFamily: fontOptions[0].value,
          textAreaRatio: 60,
          logoSize: 30,
          logoX: 50,
          logoY: 50,
          logoOpacity: 20,
          logoAspectRatio: 1
        };
        
        /* 預設值設置（與 BV SHOP 原始值相同） */
        const defaultSettings = { ...bvShopDefaults };

        /* 粗體按鈕點擊事件 */
        function setupBoldButton(button, updateCallback) {
          if (button) {
            button.addEventListener('click', function() {
              this.classList.toggle('active');
              updateCallback();
            });
          }
        }

        setupBoldButton(mainBoldBtn, updateStyles);
        setupBoldButton(subBoldBtn, updateStyles);
        setupBoldButton(barcodeTextBoldBtn, updateStyles);

        /* 計算行高（字體大小 * 1.2，最小值為字體大小 + 1） */
        function calculateLineHeight(fontSize) {
          const size = parseInt(fontSize);
          return Math.max(Math.round(size * 1.2), size + 1);
        }

        /* 更新樣式函數 */
        function updateStyles() {
          if (!mainSize || !subSize) return; /* 確保元素存在 */
          
          /* 計算行高 */
          const mainLineHeight = calculateLineHeight(mainSize.value);
          const subLineHeight = calculateLineHeight(subSize.value);
          
          /* 獲取字體粗細值 */
          const mainFontWeight = mainBoldBtn && mainBoldBtn.classList.contains('active') ? 700 : 500;
          const subFontWeight = subBoldBtn && subBoldBtn.classList.contains('active') ? 700 : 500;
          const barcodeTextFontWeight = barcodeTextBoldBtn && barcodeTextBoldBtn.classList.contains('active') ? 700 : 500;
          
          /* 更新顯示值 */
          document.getElementById('main-size').textContent = mainSize.value + 'px';
          document.getElementById('main-gap').textContent = mainGap.value + 'px';
          document.getElementById('sub-size').textContent = subSize.value + 'px';
          
          document.getElementById('barcode-text-size').textContent = barcodeTextSize.value + 'px';
          document.getElementById('barcode-height').textContent = barcodeHeight.value + 'mm';
          document.getElementById('barcode-width').textContent = barcodeWidth.value + '%';
          document.getElementById('label-width').textContent = labelWidth.value + 'mm';
          document.getElementById('label-height').textContent = labelHeight.value + 'mm';
          document.getElementById('label-padding').textContent = labelPadding.value + 'mm';
          
          /* 進階版面設定顯示值更新 */
          const textRatio = parseInt(textAreaRatio.value);
          const barcodeRatio = 100 - textRatio;
          document.getElementById('text-area-ratio').textContent = textRatio + '%';
          document.getElementById('area-hint').textContent = `文字區：${textRatio}% / 條碼區：${barcodeRatio}%`;
          
          /* 計算實際高度 */
          const totalHeight = parseFloat(labelHeight.value);
          const padding = parseFloat(labelPadding.value) * 2;
          const availableHeight = totalHeight - padding;
          const specInfoHeight = (availableHeight * textRatio / 100).toFixed(1);
          const specBarcodeHeight = (availableHeight * barcodeRatio / 100).toFixed(1);
          
          /* Logo 顯示值更新 */
          if (logoSizeSlider) {
            document.getElementById('logo-size').textContent = logoSizeSlider.value + '%';
            document.getElementById('logo-x').textContent = logoXSlider.value + '%';
            document.getElementById('logo-y').textContent = logoYSlider.value + '%';
            document.getElementById('logo-opacity').textContent = logoOpacitySlider.value + '%';
          }
          
          /* 計算條碼實際寬度 */
          const barcodeActualWidth = (parseFloat(labelWidth.value) * parseFloat(barcodeWidth.value) / 100).toFixed(1);
          
          /* 計算基於百分比的logo高度（相對於標籤高度） */
          const logoHeightMM = logoSizeSlider ? parseFloat(labelHeight.value) * parseFloat(logoSizeSlider.value) / 100 : 0;
          const logoWidthMM = logoHeightMM * logoAspectRatio;
          
          /* 套用樣式 */
          dynamicStyle.innerHTML = `
            /* 調整條碼標籤整體尺寸 */
            .print_barcode_area {
              width: ${labelWidth.value}mm !important;
            }
            
            /* 調整單個標籤的尺寸 - 保持固定高度 */
            html .print_barcode_area .print_sample,
            body .print_barcode_area .print_sample {
              height: ${labelHeight.value}mm !important;
              padding: ${labelPadding.value}mm !important;
              box-sizing: border-box !important;
            }
            
            /* 文字區域高度 - 使用計算的百分比高度 */
            html .print_barcode_area .print_sample .spec_info,
            body .print_barcode_area .print_sample .spec_info {
              height: ${specInfoHeight}mm !important;
              margin-bottom: 0 !important;
            }
            
            /* 條碼區域高度 - 使用計算的百分比高度 */
            html .print_barcode_area .print_sample .spec_barcode,
            body .print_barcode_area .print_sample .spec_barcode {
              height: ${specBarcodeHeight}mm !important;
            }
            
            /* 確保字體套用到所有元素 */
            .print_barcode_area .print_sample,
            .print_barcode_area .print_sample .spec_info,
            .print_barcode_area .print_sample .spec_info ul,
            .print_barcode_area .print_sample .spec_info li,
            .print_barcode_area .print_sample .spec_barcode {
              font-family: ${fontFamily.value} !important;
            }
            
            /* 商品資訊對齊方式 */
            .print_barcode_area .print_sample .spec_info {
              text-align: ${textAlign.value} !important;
            }
            
            /* 商品名稱樣式 */
            .print_barcode_area .print_sample .spec_info .main {
              font-size: ${mainSize.value}px !important;
              line-height: ${mainLineHeight}px !important;
              font-weight: ${mainFontWeight} !important;
              margin-bottom: ${mainGap.value}px !important;
              white-space: normal !important; /* 允許自動換行 */
              word-break: break-all !important; /* 單字太長也會換行 */
              overflow: visible !important;     /* 顯示全部內容 */
            }
            
            /* 規格/編號/價格樣式 - 統一設定 */
            .print_barcode_area .print_sample .spec_info .sub {
              font-size: ${subSize.value}px !important;
              line-height: ${subLineHeight}px !important;
              font-weight: ${subFontWeight} !important;
              white-space: normal !important;
              word-break: break-all !important;
              overflow: visible !important;
            }
            
            /* 多行文字處理 */
            .main.show-multi-line.two-lines {
              height: ${mainLineHeight * 2}px !important;
              line-height: ${mainLineHeight}px !important;
            }
            
            /* 條碼下方數字樣式 */
            .print_barcode_area .print_sample .spec_barcode .sub {
              font-size: ${barcodeTextSize.value}px !important;
              font-weight: ${barcodeTextFontWeight} !important;
            }
            
            /* 條碼圖片高度和寬度 - 使用百分比寬度 */
            .print_barcode_area .print_sample .spec_barcode img {
              height: ${barcodeHeight.value}mm !important;
              width: ${barcodeActualWidth}mm !important;
              max-width: 100% !important;
              object-fit: fill !important;
            }
            
            /* 確保條碼容器能適應條碼大小 */
            .print_barcode_area .print_sample .spec_barcode {
              overflow: hidden !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
            }
            
            /* 確保字體覆蓋所有可能的元素 */
            .print_barcode_area * {
              font-family: ${fontFamily.value};
            }
            
            /* 底圖樣式 - 保持原始寬高比 */
            .label-background-logo {
              width: ${logoWidthMM}mm !important;
              height: ${logoHeightMM}mm !important;
              left: ${logoXSlider ? logoXSlider.value : 50}% !important;
              top: ${logoYSlider ? logoYSlider.value : 50}% !important;
              transform: translate(-50%, -50%) !important;
              opacity: ${logoOpacitySlider ? (100 - logoOpacitySlider.value) / 100 : 0.8} !important;
            }
          `;
          
          /* 更新所有標籤的底圖 */
          updateLogos();
          
          /* 自動保存當前設定為臨時設定 */
          saveSettingsToLocal('_current_temp_settings', saveCurrentSettings());
        }
        
        /* 更新所有標籤的底圖 */
        function updateLogos() {
          /* 移除現有的底圖 */
          document.querySelectorAll('.label-background-logo').forEach(logo => logo.remove());
          
          /* 如果有底圖，添加到每個標籤 */
          if (logoDataUrl) {
            document.querySelectorAll('.print_sample').forEach(sample => {
              const logo = document.createElement('img');
              logo.className = 'label-background-logo';
              logo.src = logoDataUrl;
              sample.insertBefore(logo, sample.firstChild); // 插入到最前面，確保在底層
            });
          }
        }
        
        /* 添加事件監聽器 */
        const controls = [
          mainSize, mainGap,
          subSize,
          barcodeTextSize, barcodeHeight, barcodeWidth,
          labelWidth, labelHeight, labelPadding, textAlign, fontFamily,
          textAreaRatio,
          logoSizeSlider, logoXSlider, logoYSlider, logoOpacitySlider
        ];
        
        controls.forEach(control => {
          if(control) {
            control.addEventListener('input', updateStyles);
            control.addEventListener('change', updateStyles);
            
            /* 如果是 range input，更新進度條 */
            if(control.type === 'range') {
              updateRangeProgress(control);
              control.addEventListener('input', () => updateRangeProgress(control));
            }
          }
        });
        
        /* 列印按鈕功能 - 設定標記允許列印 */
        const applyPrintBtn = document.getElementById('apply-print');
        if (applyPrintBtn) {
          applyPrintBtn.addEventListener('click', function() {
            window.allowPrint = true;
            window.print();
          });
        }
        
        /* 清除格式按鈕功能 */
        const resetFormatBtn = document.getElementById('reset-format');
        if (resetFormatBtn) {
          resetFormatBtn.addEventListener('click', function() {
            if (confirm('確定要將所有設定重置為 BV SHOP 原始預設值嗎？\n\n此操作無法復原。')) {
              /* 清除底圖 */
              if (logoDataUrl) {
                logoDataUrl = null;
                logoAspectRatio = 1;
                if (logoPreview) {
                  logoPreview.style.display = 'none';
                }
                if (uploadPrompt) {
                  uploadPrompt.style.display = 'block';
                }
                if (logoUploadArea) {
                  logoUploadArea.classList.remove('has-logo');
                }
                if (logoControls) {
                  logoControls.classList.remove('active');
                }
                if (logoInput) {
                  logoInput.value = '';
                }
              }
              
              /* 套用 BV SHOP 原始預設值 */
              applySavedSettings(bvShopDefaults);
              
              /* 清除預設檔選擇 */
              const presetSelect = document.getElementById('preset-select');
              if (presetSelect) {
                presetSelect.value = '';
              }
              
              /* 清除最後選擇的預設檔記錄 */
              try {
                localStorage.removeItem('bvShopBarcode_lastSelectedPreset');
              } catch (e) {
                console.warn('無法清除 localStorage');
              }
              
              showNotification('已重置為 BV SHOP 原始預設值');
            }
          });
        }
        
        /* 儲存設定功能 */
        function saveCurrentSettings() {
          if (!mainSize || !subSize) return {}; /* 確保元素存在 */
          
          const settings = {
            mainSize: mainSize.value,
            mainBold: mainBoldBtn ? mainBoldBtn.classList.contains('active') : true,
            mainGap: mainGap.value,
            subSize: subSize.value,
            subBold: subBoldBtn ? subBoldBtn.classList.contains('active') : true,
            barcodeTextSize: barcodeTextSize.value,
            barcodeTextBold: barcodeTextBoldBtn ? barcodeTextBoldBtn.classList.contains('active') : false,
            barcodeHeight: barcodeHeight.value,
            barcodeWidth: barcodeWidth.value,
            labelWidth: labelWidth.value,
            labelHeight: labelHeight.value,
            labelPadding: labelPadding.value,
            textAlign: textAlign.value,
            fontFamily: fontFamily.value,
            textAreaRatio: textAreaRatio.value,
            logoDataUrl: logoDataUrl,
            logoSize: logoSizeSlider ? logoSizeSlider.value : 30,
            logoX: logoXSlider ? logoXSlider.value : 50,
            logoY: logoYSlider ? logoYSlider.value : 50,
            logoOpacity: logoOpacitySlider ? logoOpacitySlider.value : 20,
            logoAspectRatio: logoAspectRatio
          };
          return settings;
        }
        
        function applySavedSettings(settings) {
          if (!settings || !mainSize || !subSize) return; /* 確保元素存在 */
          
          mainSize.value = settings.mainSize || defaultSettings.mainSize;
          if (mainBoldBtn) {
            mainBoldBtn.classList.toggle('active', settings.mainBold !== undefined ? settings.mainBold : defaultSettings.mainBold);
          }
          mainGap.value = settings.mainGap || defaultSettings.mainGap;
          
          subSize.value = settings.subSize || defaultSettings.subSize;
          if (subBoldBtn) {
            subBoldBtn.classList.toggle('active', settings.subBold !== undefined ? settings.subBold : defaultSettings.subBold);
          }
          
          barcodeTextSize.value = settings.barcodeTextSize || defaultSettings.barcodeTextSize;
          if (barcodeTextBoldBtn) {
            barcodeTextBoldBtn.classList.toggle('active', settings.barcodeTextBold !== undefined ? settings.barcodeTextBold : defaultSettings.barcodeTextBold);
          }
          
          barcodeHeight.value = settings.barcodeHeight || defaultSettings.barcodeHeight;
          barcodeWidth.value = settings.barcodeWidth || defaultSettings.barcodeWidth;
          
          labelWidth.value = settings.labelWidth || defaultSettings.labelWidth;
          labelHeight.value = settings.labelHeight || defaultSettings.labelHeight;
          labelPadding.value = settings.labelPadding || defaultSettings.labelPadding;
          textAlign.value = settings.textAlign || defaultSettings.textAlign;
          fontFamily.value = settings.fontFamily || defaultSettings.fontFamily;
          
          textAreaRatio.value = settings.textAreaRatio || defaultSettings.textAreaRatio;
          
          /* 底圖設定 */
          if (settings.logoDataUrl) {
            logoDataUrl = settings.logoDataUrl;
            logoAspectRatio = settings.logoAspectRatio || 1;
            if (logoPreview) {
              logoPreview.src = logoDataUrl;
              logoPreview.style.display = 'block';
            }
            if (uploadPrompt) {
              uploadPrompt.style.display = 'none';
            }
            if (logoUploadArea) {
              logoUploadArea.classList.add('has-logo');
            }
            if (logoControls) {
              logoControls.classList.add('active');
            }
          }
          
          if (logoSizeSlider) {
            logoSizeSlider.value = settings.logoSize || defaultSettings.logoSize;
          }
          if (logoXSlider) {
            logoXSlider.value = settings.logoX || defaultSettings.logoX;
          }
          if (logoYSlider) {
            logoYSlider.value = settings.logoY || defaultSettings.logoY;
          }
          if (logoOpacitySlider) {
            logoOpacitySlider.value = settings.logoOpacity || defaultSettings.logoOpacity;
          }
          
          /* 更新所有 range 的進度條 */
          document.querySelectorAll('input[type="range"]').forEach(updateRangeProgress);
          
          updateStyles();
        }
        
        /* 儲存/讀取設定相關函數 */
        function saveSettingsToLocal(name, settings) {
          try {
            localStorage.setItem('bvShopBarcode_' + name, JSON.stringify(settings));
          } catch (e) {
            console.error('無法儲存設定：', e);
            // 對於 iPad Safari 私密瀏覽模式，可能需要使用其他儲存方式
            try {
              // 嘗試使用 sessionStorage
              sessionStorage.setItem('bvShopBarcode_' + name, JSON.stringify(settings));
            } catch (e2) {
              console.error('sessionStorage 也無法使用');
            }
          }
        }
        
        function getSettingsFromLocal(name) {
          try {
            let settingsStr = localStorage.getItem('bvShopBarcode_' + name);
            if (!settingsStr) {
              // 嘗試從 sessionStorage 讀取
              settingsStr = sessionStorage.getItem('bvShopBarcode_' + name);
            }
            return settingsStr ? JSON.parse(settingsStr) : null;
          } catch (e) {
            console.error('無法讀取設定：', e);
            return null;
          }
        }
        
        /* 載入設定檔清單 */
        function loadPresetList() {
          const presetSelect = document.getElementById('preset-select');
          if (!presetSelect) return;
          
          const allPresets = getSettingsFromLocal('presetList') || [];
          const lastSelected = getSettingsFromLocal('lastSelectedPreset');
          
          /* 清空現有選項 */
          while (presetSelect.options.length > 1) {
            presetSelect.remove(1);
          }
          
          /* 添加所有設定檔 */
          allPresets.forEach(presetName => {
            const option = document.createElement('option');
            option.value = presetName;
            option.textContent = presetName;
            presetSelect.appendChild(option);
            
            /* 如果是上次選擇的設定檔，預設選中 */
            if (presetName === lastSelected) {
              option.selected = true;
            }
          });
        }
        
        /* 初始化設定檔系統 */
        function initPresetSystem() {
          const presetSelect = document.getElementById('preset-select');
          const savePresetBtn = document.getElementById('save-preset');
          const deletePresetBtn = document.getElementById('delete-preset');
          const savePresetRow = document.getElementById('save-preset-row');
          const newPresetName = document.getElementById('new-preset-name');
          const confirmSaveBtn = document.getElementById('confirm-save');
          const cancelSaveBtn = document.getElementById('cancel-save');
          
          if (!presetSelect) return;
          
          /* 載入預設檔列表 */
          loadPresetList();
          
          /* 選擇設定檔時載入設定 */
          presetSelect.addEventListener('change', function() {
            const selectedPreset = presetSelect.value;
            if (selectedPreset) {
              const settings = getSettingsFromLocal('preset_' + selectedPreset);
              if (settings) {
                applySavedSettings(settings);
                saveSettingsToLocal('lastSelectedPreset', selectedPreset);
                showNotification(`已載入設定檔「${selectedPreset}」`);
              }
            }
          });
          
          /* 儲存設定按鈕 */
          if (savePresetBtn) {
            savePresetBtn.addEventListener('click', function() {
              if (savePresetRow) {
                savePresetRow.style.display = 'flex';
              }
              if (newPresetName) {
                newPresetName.value = presetSelect.value || '';
                newPresetName.focus();
              }
            });
          }
          
          /* 確認儲存 */
          if (confirmSaveBtn) {
            confirmSaveBtn.addEventListener('click', function() {
              if (!newPresetName) return;
              
              const presetName = newPresetName.value.trim();
              if (!presetName) {
                showNotification('請輸入設定檔名稱', 'warning');
                return;
              }
              
              const settings = saveCurrentSettings();
              saveSettingsToLocal('preset_' + presetName, settings);
              
              /* 更新設定檔清單 */
              const allPresets = getSettingsFromLocal('presetList') || [];
              if (!allPresets.includes(presetName)) {
                allPresets.push(presetName);
                saveSettingsToLocal('presetList', allPresets);
              }
              
              /* 更新最後選擇的設定檔 */
              saveSettingsToLocal('lastSelectedPreset', presetName);
              
              /* 重新載入設定檔列表 */
              loadPresetList();
              if (savePresetRow) {
                savePresetRow.style.display = 'none';
              }
              
              showNotification(`設定檔「${presetName}」已儲存`);
            });
          }
          
          /* 取消儲存 */
          if (cancelSaveBtn) {
            cancelSaveBtn.addEventListener('click', function() {
              if (savePresetRow) {
                savePresetRow.style.display = 'none';
              }
            });
          }
          
          /* 刪除設定檔 */
          if (deletePresetBtn) {
            deletePresetBtn.addEventListener('click', function() {
              const selectedPreset = presetSelect.value;
              if (!selectedPreset) {
                showNotification('請先選擇一個設定檔', 'warning');
                return;
              }
              
              if (confirm(`確定要刪除設定檔「${selectedPreset}」嗎？`)) {
                /* 從設定檔清單中移除 */
                const allPresets = getSettingsFromLocal('presetList') || [];
                const updatedPresets = allPresets.filter(name => name !== selectedPreset);
                saveSettingsToLocal('presetList', updatedPresets);
                
                /* 刪除設定檔數據 */
                try {
                  localStorage.removeItem('bvShopBarcode_preset_' + selectedPreset);
                  sessionStorage.removeItem('bvShopBarcode_preset_' + selectedPreset);
                } catch (e) {
                  console.error('刪除設定時發生錯誤');
                }
                
                /* 如果刪除的是最後選擇的設定檔，清除最後選擇記錄 */
                if (getSettingsFromLocal('lastSelectedPreset') === selectedPreset) {
                  try {
                    localStorage.removeItem('bvShopBarcode_lastSelectedPreset');
                    sessionStorage.removeItem('bvShopBarcode_lastSelectedPreset');
                  } catch (e) {
                    console.error('清除記錄時發生錯誤');
                  }
                }
                
                /* 重新載入設定檔列表 */
                loadPresetList();
                showNotification(`設定檔「${selectedPreset}」已刪除`);
              }
            });
          }
          
          /* Enter 鍵儲存設定檔 */
          if (newPresetName) {
            newPresetName.addEventListener('keypress', function(e) {
              if (e.key === 'Enter' && confirmSaveBtn) {
                confirmSaveBtn.click();
              }
            });
          }
        }
        
        /* 顯示通知訊息 - 修正縮放和置中問題 */
        function showNotification(message, type = 'success') {
          /* 移除現有的通知 */
          const existingNotification = document.querySelector('.barcode-notification');
          if (existingNotification) {
            existingNotification.remove();
          }
          
          const notification = document.createElement('div');
          notification.className = `barcode-notification notification ${type}`;
          notification.style.cssText = `
            position: fixed;
            top: ${shouldUseMobileLayout ? '60px' : '20px'};
            left: 50%;
            transform: translateX(-50%);
            z-index: 100000;
            ${!shouldUseMobileLayout && !isIPad ? 'zoom: 0.5;' : ''}
            ${!shouldUseMobileLayout && !isIPad ? '-moz-transform: scale(0.5) translateX(-100%);' : ''}
            ${!shouldUseMobileLayout && !isIPad ? '-moz-transform-origin: center top;' : ''}
            ${!shouldUseMobileLayout && !isIPad ? '-webkit-transform: scale(0.5) translateX(-100%);' : ''}
            ${!shouldUseMobileLayout && !isIPad ? '-webkit-transform-origin: center top;' : ''}
            background: ${type === 'success' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
            color: ${type === 'success' ? '#059669' : '#d97706'};
            padding: ${shouldUseMobileLayout ? '14px 24px' : (isIPad ? '18px 32px' : '28px 48px')};
            border-radius: 20px;
            font-size: ${shouldUseMobileLayout ? '14px' : (isIPad ? '16px' : '28px')};
            font-weight: 500;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            animation: slideDown 0.3s ease-out;
            border-left: ${shouldUseMobileLayout ? '4px' : '8px'} solid ${type === 'success' ? '#10b981' : '#f59e0b'};
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            gap: ${shouldUseMobileLayout ? '10px' : '20px'};
            white-space: nowrap;
          `;
          
          /* 添加圖標 */
          const icon = document.createElement('span');
          icon.className = 'material-icons';
          icon.style.fontSize = shouldUseMobileLayout ? '20px' : (isIPad ? '24px' : '40px');
          icon.textContent = type === 'success' ? 'check_circle' : 'warning';
          
          notification.appendChild(icon);
          notification.appendChild(document.createTextNode(message));
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
          }, 3000);
        }
        
        /* 新增動畫關鍵幀 */
        const animationStyle = document.createElement('style');
        animationStyle.innerHTML = `
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
          
          @keyframes slideUp {
            from {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
            to {
              opacity: 0;
              transform: translateX(-50%) translateY(-20px);
            }
          }
          
          /* 針對 Firefox 的動畫 */
          @-moz-keyframes slideDown {
            from {
              opacity: 0;
              -moz-transform: scale(${!shouldUseMobileLayout && !isIPad ? '0.5' : '1'}) translateX(${!shouldUseMobileLayout && !isIPad ? '-100%' : '-50%'}) translateY(-20px);
            }
            to {
              opacity: 1;
              -moz-transform: scale(${!shouldUseMobileLayout && !isIPad ? '0.5' : '1'}) translateX(${!shouldUseMobileLayout && !isIPad ? '-100%' : '-50%'}) translateY(0);
            }
          }
          
          @-moz-keyframes slideUp {
            from {
              opacity: 1;
              -moz-transform: scale(${!shouldUseMobileLayout && !isIPad ? '0.5' : '1'}) translateX(${!shouldUseMobileLayout && !isIPad ? '-100%' : '-50%'}) translateY(0);
            }
            to {
              opacity: 0;
              -moz-transform: scale(${!shouldUseMobileLayout && !isIPad ? '0.5' : '1'}) translateX(${!shouldUseMobileLayout && !isIPad ? '-100%' : '-50%'}) translateY(-20px);
            }
          }
          
          /* Webkit 動畫 */
          @-webkit-keyframes slideDown {
            from {
              opacity: 0;
              -webkit-transform: ${!shouldUseMobileLayout && !isIPad ? 'scale(0.5) translateX(-100%)' : 'translateX(-50%)'} translateY(-20px);
            }
            to {
              opacity: 1;
              -webkit-transform: ${!shouldUseMobileLayout && !isIPad ? 'scale(0.5) translateX(-100%)' : 'translateX(-50%)'} translateY(0);
            }
          }
          
          @-webkit-keyframes slideUp {
            from {
              opacity: 1;
              -webkit-transform: ${!shouldUseMobileLayout && !isIPad ? 'scale(0.5) translateX(-100%)' : 'translateX(-50%)'} translateY(0);
            }
            to {
              opacity: 0;
              -webkit-transform: ${!shouldUseMobileLayout && !isIPad ? 'scale(0.5) translateX(-100%)' : 'translateX(-50%)'} translateY(-20px);
            }
          }
        `;
        document.head.appendChild(animationStyle);
        
        /* 載入上次設定或預設設定 */
        function loadInitialSettings() {
          /* 嘗試載入上次選擇的設定檔 */
          const lastSelected = getSettingsFromLocal('lastSelectedPreset');
          if (lastSelected) {
            const settings = getSettingsFromLocal('preset_' + lastSelected);
            if (settings) {
              applySavedSettings(settings);
              /* 不顯示載入訊息 */
              return;
            }
          }
          
          /* 嘗試載入最後的臨時設定 */
          const tempSettings = getSettingsFromLocal('_current_temp_settings');
          if (tempSettings) {
            applySavedSettings(tempSettings);
            return;
          }
          
          /* 使用預設設定 */
          applySavedSettings(defaultSettings);
        }
        
        /* 快捷鍵支援 */
        document.addEventListener('keydown', function(e) {
          /* Ctrl/Cmd + S 儲存設定 */
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const saveBtn = document.getElementById('save-preset');
            if (saveBtn) {
              saveBtn.click();
            }
          }
          
          /* Ctrl/Cmd + P 列印 */
          if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            const printBtn = document.getElementById('apply-print');
            if (printBtn) {
              printBtn.click();
            }
          }
        });
        
        /* 防止標籤文字被選取（改善列印效果） */
        const preventSelectionStyle = document.createElement('style');
        preventSelectionStyle.innerHTML = `
          .print_sample * {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
        `;
        document.head.appendChild(preventSelectionStyle);
        
        /* 初始化所有 range input 的進度條 */
        document.querySelectorAll('input[type="range"]').forEach(updateRangeProgress);
        
        /* 初始化 */
        initPresetSystem();
        loadInitialSettings();
        updateStyles();
        
        /* 將函數掛載到 window 物件，讓外部可以訪問 */
        window.barcodeEditor = {
          updateStyles,
          saveCurrentSettings,
          applySavedSettings,
          showNotification,
          updateLogos
        };
      }, 100); /* 延遲 100ms 確保所有元素都已載入 */
    }, 0); /* 延遲執行確保 DOM 載入完成 */
  }
  
  /* 開始初始化 */
  initializeApp();
})();
