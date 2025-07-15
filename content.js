javascript:(function(){
  /* BV SHOP 條碼列印排版器 - Liquid Glass 風格版本 */
  
  /* 檢查是否為行動裝置 */
  const userAgent = navigator.userAgent;
  const isIPad = /iPad/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) && !isIPad;
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  const shouldUseMobileLayout = isMobile || (isIPad && window.innerWidth < 768);
  
  // 只在條碼列印頁面上執行
  if (!document.querySelector('.print_barcode_area')) return;

  /* 載入思源黑體 */
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap';
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

  /* 初始頁面樣式儲存變數 */
  let initialPageSettings = null;
  let isPanelMinimized = false;

  /* 完整的預設值物件 - 確保內容在畫面內 */
  const completeDefaultSettings = {
    mainSize: 9,          // 縮小主要文字
    mainBold: true,
    mainGap: 0,
    mainLineHeight: 11,   // 適當的行高
    subSize: 7,           // 縮小次要文字
    subBold: true,
    subLineHeight: 9,
    barcodeTextSize: 7,
    barcodeTextBold: false,
    barcodeHeight: 70,    // 縮小條碼高度避免溢出
    barcodeWidth: 85,     // 稍微縮小寬度
    barcodeYPosition: 50,
    labelWidth: 40,
    labelHeight: 26,
    labelPadding: 1,
    textAlign: 'left',
    fontFamily: 'Arial, sans-serif',
    logoSize: 30,
    logoX: 50,
    logoY: 50,
    logoOpacity: 20
  };

  /* 動態抓取 BV SHOP 原生樣式 */
  function getBVShopNativeSettings() {
    try {
      const sample = document.querySelector('.print_sample');
      if (!sample) return null;
      
      // 偵測樣式類型
      const detectLayoutType = () => {
        const specInfo = sample.querySelector('.spec_info');
        const specBarcode = sample.querySelector('.spec_barcode');
        
        // 樣式八：純條碼（print_sample 有 flex 樣式）
        if (sample.style.display === 'flex' && sample.style.justifyContent === 'center') {
          return 'style8';
        }
        
        // 樣式三、四：條碼在 spec_info 內的 ul 裡面
        if (specInfo && specInfo.querySelector('ul .spec_barcode')) {
          const hasSpecialPrice = specInfo.innerHTML.includes('特價');
          return hasSpecialPrice ? 'style3' : 'style4';
        }
        
        // 樣式六：條碼在 spec_info 內，但有 <br> 標籤
        if (specInfo && specInfo.querySelector('.spec_barcode') && specInfo.innerHTML.includes('<br>')) {
          return 'style6';
        }
        
        // 樣式五、七：價格在條碼區
        if (specBarcode && specBarcode.querySelector('span.sub b')) {
          const hasProductCode = specInfo && (specInfo.innerHTML.includes('cat-') || specInfo.querySelector('.sub:last-child')?.textContent?.includes('-'));
          return hasProductCode ? 'style7' : 'style5';
        }
        
        // 樣式一、二：標準版
        if (specInfo) {
          const hasSpecialPrice = specInfo.innerHTML.includes('特價');
          return hasSpecialPrice ? 'style1' : 'style2';
        }
        
        return 'style1';
      };
      
      const layoutType = detectLayoutType();
      console.log('偵測到的樣式類型:', layoutType);
      
      // CSS 實際預設值
      const cssDefaults = {
        containerWidth: 40,
        labelHeight: 26,
        labelPadding: 1,
        mainFontSize: 10,
        mainLineHeight: 11,
        subFontSize: 8,
        subLineHeight: 9,
        barcodeFontSize: 8,
        fontFamily: 'Arial, 微軟正黑體, sans-serif',
        fontWeight: 700
      };
      
      // 根據不同樣式設定預設值 - 確保適合顯示
      let presetValues = {
        // 基本文字設定
        mainSize: cssDefaults.mainFontSize - 1,  // 稍微縮小確保不溢出
        mainBold: true,
        mainGap: 0,
        mainLineHeight: cssDefaults.mainLineHeight,
        subSize: cssDefaults.subFontSize - 1,
        subBold: true,
        subLineHeight: cssDefaults.subLineHeight,
        barcodeTextSize: cssDefaults.barcodeFontSize - 1,
        barcodeTextBold: false,
        
        // 標籤尺寸
        labelWidth: cssDefaults.containerWidth,
        labelHeight: cssDefaults.labelHeight,
        labelPadding: cssDefaults.labelPadding,
        
        // 預設值
        textAlign: 'left',
        fontFamily: cssDefaults.fontFamily,
        
        // Logo 預設值
        logoSize: 30,
        logoX: 50,
        logoY: 50,
        logoOpacity: 20,
        logoAspectRatio: 1
      };
      
      // 根據樣式調整特定設定 - 確保內容不溢出
      switch(layoutType) {
        case 'style1':
        case 'style2':
          presetValues.barcodeHeight = 70;  // 降低高度
          presetValues.barcodeWidth = 85;
          presetValues.barcodeYPosition = 50;
          break;
          
        case 'style3':
        case 'style4':
          presetValues.barcodeHeight = 35;  // 條碼在文字區內，需要更小
          presetValues.barcodeWidth = 80;
          presetValues.barcodeYPosition = 50;
          break;
          
        case 'style5':
        case 'style7':
          presetValues.barcodeHeight = 60;  // 價格在條碼區，適度縮小
          presetValues.barcodeWidth = 85;
          presetValues.barcodeYPosition = 55;
          break;
          
        case 'style6':
          presetValues.barcodeHeight = 30;  // 特殊間距版本，更小的條碼
          presetValues.barcodeWidth = 85;
          presetValues.barcodeYPosition = 50;
          break;
          
        case 'style8':
          presetValues.barcodeHeight = 55;  // 純條碼也要避免太大
          presetValues.barcodeWidth = 90;
          presetValues.barcodeYPosition = 50;
          presetValues.textAlign = 'center';
          break;
          
        default:
          presetValues.barcodeHeight = 70;
          presetValues.barcodeWidth = 85;
          presetValues.barcodeYPosition = 50;
          break;
      }
      
      // 記錄樣式類型
      presetValues.layoutType = layoutType;
      
      return presetValues;
    } catch (e) {
      console.error('無法抓取原生樣式:', e);
      return null;
    }
  }
  
  /* 驗證行高合理性 */
  function validateLineHeight(fontSize, lineHeight) {
    const minLineHeight = Math.ceil(fontSize * 1.1);
    return Math.max(parseInt(lineHeight), minLineHeight);
  }
  
  /* 計算建議的行高 */
  function calculateSuggestedLineHeight(fontSize) {
    const size = parseInt(fontSize);
    let ratio;
    if (size <= 10) {
      ratio = 1.25;  // 小字體用較小的行高比例
    } else if (size <= 14) {
      ratio = 1.2;
    } else {
      ratio = 1.15;
    }
    return Math.round(size * ratio);
  }
  
  /* 建立基本樣式 - Liquid Glass 風格 */
  const style = document.createElement('style');
  style.innerHTML = `
    /* 移除所有 focus outline */
    * {
      outline: none !important;
    }
    
    *:focus,
    *:focus-visible,
    *:focus-within,
    *:active {
      outline: none !important;
      box-shadow: none !important;
    }
    
    /* 響應式預設顯示 - 只放大預覽區域 */
    body {
      zoom: ${isMobile ? 1 : 2};
      -moz-transform: scale(${isMobile ? 1 : 2});
      -moz-transform-origin: 0 0;
      background: #f8f9fa;
      margin: 0;
      padding: ${isMobile ? '60px 10px 20px 10px' : '40px 20px 20px 20px'};
    }
    
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
    @media (hover: hover) {
      .print_sample:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }
    }
    
    @media print {
      body {
        zoom: 1 !important;
        -moz-transform: scale(1) !important;
        background: white !important;
        padding: 0 !important;
      }
      
      .print_barcode_area {
        margin-top: 0 !important;
      }
      
      .print_sample {
        box-shadow: none !important;
        border: none !important;
        margin-bottom: 0 !important;
        border-radius: 0 !important;
        transform: none !important;
      }
      
      #bv-barcode-control-panel {
        display: none !important;
      }
      
      .bv-floating-button {
        display: none !important;
      }
      
      .bv-notification {
        display: none !important;
      }
    }
  
    /* 主面板 - Liquid Glass 風格 - 保持原始大小 */
    #bv-barcode-control-panel {
      position: fixed;
      right: 20px;
      top: 20px;
      bottom: 20px;
      width: 340px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Noto Sans TC', sans-serif;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      /* 重要：讓面板保持原始大小 */
      zoom: ${isMobile ? 1 : 0.5} !important;
      -moz-transform: scale(${isMobile ? 1 : 0.5}) !important;
      -moz-transform-origin: top right !important;
    }
    
    ${shouldUseMobileLayout ? `
      #bv-barcode-control-panel {
        bottom: 0;
        left: 0;
        right: 0;
        top: auto;
        width: 100%;
        max-height: 80vh;
        zoom: 1 !important;
        -moz-transform: scale(1) !important;
      }
    ` : ''}
    
    .bv-glass-panel {
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.08),
        0 0 0 1px rgba(0, 0, 0, 0.05),
        inset 0 0 0 1px rgba(255, 255, 255, 0.5);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    /* 最小化狀態 */
    #bv-barcode-control-panel.minimized {
      height: auto;
      bottom: auto;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    #bv-barcode-control-panel.minimized .bv-glass-panel {
      height: auto;
    }
    
    #bv-barcode-control-panel.minimized .bv-panel-content-wrapper {
      display: none;
    }
    
    /* 浮動按鈕 */
    .bv-floating-button {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 56px;
      height: 56px;
      background: rgba(81, 138, 255, 0.9);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: white;
      border: none;
      border-radius: 50%;
      box-shadow: 
        0 4px 24px rgba(81, 138, 255, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.2),
        inset 0 0 0 1px rgba(255, 255, 255, 0.3);
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .bv-floating-button:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 
        0 8px 32px rgba(81, 138, 255, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.3),
        inset 0 0 0 1px rgba(255, 255, 255, 0.4);
    }
    
    .bv-floating-button:active {
      transform: scale(1.02);
    }
    
    .bv-floating-button .material-icons {
      font-size: 24px;
    }
    
    #bv-barcode-control-panel.minimized ~ .bv-floating-button {
      display: flex;
    }
    
    /* 面板標題 */
    .bv-panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      background: rgba(255, 255, 255, 0.5);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      cursor: move;
      user-select: none;
    }
    
    .bv-header-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }
    
    .bv-icon-wrapper {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #518aff 0%, #0040ff 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 
        0 2px 8px rgba(81, 138, 255, 0.25),
        inset 0 0 0 1px rgba(255, 255, 255, 0.2);
    }
    
    .bv-icon-wrapper .material-icons {
      font-size: 20px;
    }
    
    .bv-title-group {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    
    .bv-panel-title {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #1a1a1a;
      letter-spacing: -0.01em;
    }
    
    .bv-panel-subtitle {
      font-size: 12px;
      color: #86868b;
      font-weight: 400;
    }
    
    /* Glass 按鈕 */
    .bv-glass-button {
      width: 28px;
      height: 28px;
      background: rgba(0, 0, 0, 0.04);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #424245;
    }
    
    .bv-glass-button:hover {
      background: rgba(0, 0, 0, 0.08);
      transform: scale(1.05);
    }
    
    .bv-glass-button:active {
      transform: scale(0.95);
    }
    
    .bv-glass-button .material-icons {
      font-size: 18px;
    }
    
    .bv-glass-button.bv-primary {
      background: rgba(81, 138, 255, 0.1);
      color: #518aff;
      border-color: rgba(81, 138, 255, 0.2);
    }
    
    .bv-glass-button.bv-primary:hover {
      background: rgba(81, 138, 255, 0.15);
    }
    
    /* 內容區域 */
    .bv-panel-content-wrapper {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }
    
    .bv-panel-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
      -webkit-overflow-scrolling: touch;
    }
    
    /* 主要操作區 */
    .bv-primary-section {
      margin-bottom: 20px;
    }
    
    .bv-primary-button {
      width: 100%;
      padding: 0;
      background: linear-gradient(135deg, #518aff 0%, #0040ff 100%);
      border: none;
      border-radius: 14px;
      cursor: pointer;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      box-shadow: 
        0 4px 16px rgba(81, 138, 255, 0.25),
        inset 0 0 0 1px rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      color: white;
    }
    
    .bv-primary-button:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 8px 24px rgba(81, 138, 255, 0.35),
        inset 0 0 0 1px rgba(255, 255, 255, 0.3);
    }
    
    .bv-primary-button:active {
      transform: translateY(0);
    }
    
    .bv-button-icon {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .bv-button-icon .material-icons {
      font-size: 24px;
    }
    
    .bv-button-content {
      flex: 1;
      text-align: left;
    }
    
    .bv-button-title {
      display: block;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 1px;
    }
    
    .bv-button-subtitle {
      display: block;
      font-size: 12px;
      opacity: 0.85;
    }
    
    /* 設定卡片 */
    .bv-settings-card {
      background: rgba(246, 246, 248, 0.5);
      border: 1px solid rgba(0, 0, 0, 0.04);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 14px;
      backdrop-filter: blur(10px);
    }
    
    .bv-card-title {
      margin: 0 0 14px 0;
      font-size: 13px;
      font-weight: 600;
      color: #1a1a1a;
      display: flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    
    .bv-card-title .material-icons {
      font-size: 16px;
      color: #86868b;
    }
    
    /* 設定項目 */
    .bv-setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    }
    
    .bv-setting-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .bv-setting-item:first-child {
      padding-top: 0;
    }
    
    .bv-setting-info {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }
    
    .bv-setting-info .material-icons {
      font-size: 18px;
      color: #86868b;
    }
    
    .bv-setting-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    
    .bv-setting-label {
      font-size: 13px;
      font-weight: 500;
      color: #1a1a1a;
    }
    
    .bv-setting-desc {
      font-size: 11px;
      color: #86868b;
    }
    
    /* Glass 開關 */
    .bv-glass-switch {
      position: relative;
      display: inline-block;
      width: 42px;
      height: 26px;
      cursor: pointer;
    }
    
    .bv-glass-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .bv-switch-slider {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 26px;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      backdrop-filter: blur(10px);
    }
    
    .bv-switch-slider:before {
      position: absolute;
      content: "";
      height: 22px;
      width: 22px;
      left: 2px;
      bottom: 2px;
      background: white;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      box-shadow: 
        0 2px 8px rgba(0, 0, 0, 0.15),
        0 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    .bv-glass-switch input:checked + .bv-switch-slider {
      background: linear-gradient(135deg, #518aff 0%, #0040ff 100%);
    }
    
    .bv-glass-switch input:checked + .bv-switch-slider:before {
      transform: translateX(16px);
    }
    
    /* Glass Slider */
    .bv-slider-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .bv-slider-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .bv-slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }
    
    .bv-value-label {
      background: rgba(81, 138, 255, 0.1);
      color: #518aff;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      font-family: 'SF Mono', monospace;
      min-width: 40px;
      text-align: center;
    }
    
    .bv-glass-slider {
      -webkit-appearance: none;
      width: 100%;
      height: 5px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2.5px;
      outline: none;
      position: relative;
      cursor: pointer;
    }
    
    .bv-glass-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 
        0 2px 8px rgba(0, 0, 0, 0.15),
        0 1px 2px rgba(0, 0, 0, 0.1),
        inset 0 0 0 1px rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;
      position: relative;
      z-index: 1;
    }
    
    .bv-glass-slider::-webkit-slider-thumb:hover {
      transform: scale(1.1);
      box-shadow: 
        0 4px 12px rgba(0, 0, 0, 0.2),
        0 2px 4px rgba(0, 0, 0, 0.15),
        inset 0 0 0 1px rgba(0, 0, 0, 0.06);
    }
    
    .bv-glass-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 
        0 2px 8px rgba(0, 0, 0, 0.15),
        0 1px 2px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
      border: none;
    }
    
    /* Glass Select */
    .bv-glass-select {
      width: 100%;
      height: 32px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      padding: 0 10px;
      font-size: 12px;
      color: #1a1a1a;
      cursor: pointer;
      transition: all 0.2s ease;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2386868b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      padding-right: 28px;
    }
    
    .bv-glass-select:hover {
      background-color: rgba(255, 255, 255, 0.9);
      border-color: rgba(0, 0, 0, 0.12);
    }
    
    .bv-glass-select:focus {
      background-color: white;
      border-color: #518aff;
      box-shadow: 0 0 0 3px rgba(81, 138, 255, 0.1);
    }
    
    /* 粗體按鈕 */
    .bv-bold-button {
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      padding: 6px 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 16px;
      font-weight: 700;
      color: #86868b;
      user-select: none;
      min-width: 36px;
    }
    
    .bv-bold-button:hover {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(0, 0, 0, 0.12);
      color: #518aff;
    }
    
    .bv-bold-button.active {
      background: linear-gradient(135deg, #518aff 0%, #0040ff 100%);
      color: white;
      border-color: transparent;
      box-shadow: 
        0 2px 8px rgba(81, 138, 255, 0.25),
        inset 0 0 0 1px rgba(255, 255, 255, 0.2);
    }
    
    .bv-bold-button.active:hover {
      transform: scale(1.05);
      box-shadow: 
        0 4px 12px rgba(81, 138, 255, 0.35),
        inset 0 0 0 1px rgba(255, 255, 255, 0.3);
    }
    
    /* 預設管理 */
    .bv-preset-controls {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    
    .bv-preset-select-wrapper {
      flex: 1;
    }
    
    .bv-preset-buttons {
      display: flex;
      gap: 4px;
    }
    
    .bv-preset-save-row {
      display: flex;
      gap: 6px;
      margin-top: 10px;
    }
    
    .bv-glass-input {
      flex: 1;
      height: 32px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      padding: 0 10px;
      font-size: 12px;
      color: #1a1a1a;
      transition: all 0.2s ease;
    }
    
    .bv-glass-input::placeholder {
      color: #86868b;
    }
    
    .bv-glass-input:hover {
      background-color: rgba(255, 255, 255, 0.9);
      border-color: rgba(0, 0, 0, 0.12);
    }
    
    .bv-glass-input:focus {
      background-color: white;
      border-color: #518aff;
      box-shadow: 0 0 0 3px rgba(81, 138, 255, 0.1);
    }
    
    /* 底部區域 */
    .bv-panel-footer {
      padding: 14px 20px 20px;
      background: rgba(255, 255, 255, 0.5);
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      flex-shrink: 0;
    }
    
    .bv-glass-action-button {
      width: 100%;
      height: 42px;
      background: linear-gradient(135deg, #518aff 0%, #0040ff 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      box-shadow: 
        0 4px 16px rgba(81, 138, 255, 0.25),
        inset 0 0 0 1px rgba(255, 255, 255, 0.2);
    }
    
    .bv-glass-action-button:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 8px 24px rgba(81, 138, 255, 0.35),
        inset 0 0 0 1px rgba(255, 255, 255, 0.3);
    }
    
    .bv-glass-action-button:active {
      transform: translateY(0);
    }
    
    .bv-glass-action-button .material-icons {
      font-size: 20px;
    }
    
    /* 滾動條 */
    .bv-panel-body::-webkit-scrollbar {
      width: 8px;
    }
    
    .bv-panel-body::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .bv-panel-body::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    
    .bv-panel-body::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.25);
      background-clip: padding-box;
    }
    
    /* 通知 */
    .bv-notification {
      position: fixed;
      top: 28px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.12),
        0 0 0 1px rgba(0, 0, 0, 0.05),
        inset 0 0 0 1px rgba(255, 255, 255, 0.5);
      z-index: 100001;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideDown 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .bv-notification.success {
      color: #059669;
    }
    
    .bv-notification.warning {
      color: #d97706;
    }
    
    .bv-notification .material-icons {
      font-size: 18px;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translate(-50%, -20px);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    }
    
    @keyframes slideUp {
      from {
        opacity: 1;
        transform: translate(-50%, 0);
      }
      to {
        opacity: 0;
        transform: translate(-50%, -20px);
      }
    }
    
    /* 底圖上傳樣式 */
    .bv-logo-upload-area {
      border: 2px dashed rgba(0, 0, 0, 0.12);
      border-radius: 12px;
      padding: ${shouldUseMobileLayout ? '20px' : '24px'};
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(246, 246, 248, 0.3);
      margin-bottom: 16px;
      position: relative;
      overflow: hidden;
    }
    
    .bv-logo-upload-area:hover {
      border-color: #518aff;
      background: rgba(81, 138, 255, 0.05);
    }
    
    .bv-logo-upload-area.has-logo {
      border-style: solid;
      padding: 16px;
      background: rgba(255, 255, 255, 0.8);
    }
    
    .bv-logo-upload-area .material-icons {
      vertical-align: middle;
      line-height: 1;
    }
    
    .bv-logo-preview {
      max-width: 100%;
      max-height: ${shouldUseMobileLayout ? '80px' : '100px'};
      margin: 0 auto;
      display: block;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    
    .bv-upload-hint {
      color: #86868b;
      font-size: ${shouldUseMobileLayout ? '12px' : '13px'};
      margin-top: 10px;
      font-weight: 500;
    }
    
    .bv-logo-controls {
      display: none;
    }
    
    .bv-logo-controls.active {
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
    
    .bv-remove-logo-btn {
      background: linear-gradient(135deg, #f04747 0%, #e74c3c 100%);
      color: white;
      border: none;
      padding: ${shouldUseMobileLayout ? '9px 18px' : '10px 20px'};
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 16px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(240, 71, 71, 0.3);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    
    .bv-remove-logo-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(240, 71, 71, 0.35);
    }
    
    .bv-remove-logo-btn .material-icons {
      font-size: 16px;
      vertical-align: middle;
      line-height: 1;
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
    
    /* 防止 iOS 將數字識別為電話號碼 */
    .print_sample * {
      -webkit-touch-callout: none !important;
      -webkit-user-select: none !important;
      user-select: none !important;
    }
    
    .spec_barcode .sub {
      pointer-events: none !important;
      -webkit-text-decoration: none !important;
      text-decoration: none !important;
      color: inherit !important;
      -webkit-text-size-adjust: 100%;
      -webkit-tap-highlight-color: transparent;
    }
  `;
  document.head.appendChild(style);

  /* 建立控制面板 - 延遲執行確保 DOM 載入完成 */
  setTimeout(() => {
    const panel = document.createElement('div');
    panel.id = 'bv-barcode-control-panel';
    panel.className = shouldUseMobileLayout ? 'minimized' : '';
    panel.innerHTML = `
      <div class="bv-glass-panel">
        <div class="bv-panel-header">
          <div class="bv-header-content">
            <div class="bv-icon-wrapper">
              <span class="material-icons">barcode</span>
            </div>
            <div class="bv-title-group">
              <h3 class="bv-panel-title">BV SHOP 條碼列印</h3>
              <span class="bv-panel-subtitle">排版控制面板</span>
            </div>
          </div>
          <button class="bv-glass-button bv-minimize-btn" id="bv-minimize-btn">
            <span class="material-icons">remove</span>
          </button>
        </div>
        
        <div class="bv-panel-content-wrapper">
          <div class="bv-panel-body">
            <!-- 主要操作區 -->
            <div class="bv-primary-section">
              <button id="bv-transform-btn" class="bv-primary-button">
                <div class="bv-button-icon">
                  <span class="material-icons">auto_fix_high</span>
                </div>
                <div class="bv-button-content">
                  <span class="bv-button-title">智能最佳化</span>
                  <span class="bv-button-subtitle">自動調整最佳排版</span>
                </div>
              </button>
            </div>
            
            <!-- 預設管理 -->
            <div class="bv-settings-card">
              <h4 class="bv-card-title">
                <span class="material-icons">bookmark</span>
                預設管理
              </h4>
              
              <div class="bv-preset-controls">
                <div class="bv-preset-select-wrapper">
                  <select id="bv-preset-select" class="bv-glass-select">
                    <option value="">選擇預設...</option>
                  </select>
                </div>
                <div class="bv-preset-buttons">
                  <button class="bv-glass-button" id="bv-save-preset" title="儲存">
                    <span class="material-icons">save</span>
                  </button>
                  <button class="bv-glass-button" id="bv-delete-preset" title="刪除">
                    <span class="material-icons">delete</span>
                  </button>
                  <button class="bv-glass-button" id="bv-reset-format" title="還原預設值">
                    <span class="material-icons">restart_alt</span>
                  </button>
                </div>
              </div>
              
              <div class="bv-preset-save-row" id="bv-save-preset-row" style="display:none;">
                <input type="text" id="bv-new-preset-name" class="bv-glass-input" placeholder="輸入預設名稱...">
                <div class="bv-preset-buttons">
                  <button class="bv-glass-button bv-primary" id="bv-confirm-save">
                    <span class="material-icons">check</span>
                  </button>
                  <button class="bv-glass-button" id="bv-cancel-save">
                    <span class="material-icons">close</span>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- 基本設定區塊 -->
            <div class="bv-settings-card">
              <h4 class="bv-card-title">
                <span class="material-icons">tune</span>
                基本設定
              </h4>
              
              <!-- 標籤尺寸 -->
              <div class="bv-slider-group">
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>標籤寬度</span>
                    <span class="bv-value-label" id="label-width">40mm</span>
                  </div>
                  <input type="range" id="label-width-slider" min="30" max="60" value="40" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>標籤高度</span>
                    <span class="bv-value-label" id="label-height">26mm</span>
                  </div>
                  <input type="range" id="label-height-slider" min="20" max="40" value="26" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>內部邊距</span>
                    <span class="bv-value-label" id="label-padding">1mm</span>
                  </div>
                  <input type="range" id="label-padding-slider" min="0" max="5" step="0.5" value="1" class="bv-glass-slider">
                </div>
              </div>
              
              <!-- 字體設定 -->
              <div style="margin-top: 20px;">
                <div class="bv-setting-item" style="padding-bottom: 10px;">
                  <span class="bv-setting-label">字體類型</span>
                </div>
                <select id="font-family-select" class="bv-glass-select">
                  ${fontOptions.map(font => `<option value="${font.value}">${font.name}</option>`).join('')}
                </select>
                
                <div class="bv-setting-item" style="margin-top: 15px; padding-bottom: 10px;">
                  <span class="bv-setting-label">對齊方式</span>
                </div>
                <select id="text-align" class="bv-glass-select">
                  <option value="left">靠左對齊</option>
                  <option value="center">置中對齊</option>
                  <option value="right">靠右對齊</option>
                </select>
              </div>
            </div>
            
            <!-- 文字設定區塊 -->
            <div class="bv-settings-card">
              <h4 class="bv-card-title">
                <span class="material-icons">text_fields</span>
                文字設定
              </h4>
              
              <div class="bv-slider-group">
                <!-- 商品名稱 -->
                <div class="bv-setting-item">
                  <div class="bv-setting-info">
                    <span class="bv-setting-label">商品名稱</span>
                  </div>
                  <button class="bv-bold-button active" id="main-bold-btn" title="粗體">B</button>
                </div>
                
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>文字大小</span>
                    <span class="bv-value-label" id="main-size">10px</span>
                  </div>
                  <input type="range" id="main-slider" min="8" max="20" value="10" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>行高</span>
                    <span class="bv-value-label" id="main-line-height">11px</span>
                  </div>
                  <input type="range" id="main-line-height-slider" min="8" max="30" value="11" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>商品名稱與其他資訊間距</span>
                    <span class="bv-value-label" id="main-gap">0px</span>
                  </div>
                  <input type="range" id="main-gap-slider" min="0" max="10" step="0.5" value="0" class="bv-glass-slider">
                </div>
                
                <!-- 分隔線 -->
                <div style="height: 1px; background: rgba(0, 0, 0, 0.06); margin: 16px 0;"></div>
                
                <!-- 規格/編號/價格 -->
                <div class="bv-setting-item">
                  <div class="bv-setting-info">
                    <span class="bv-setting-label">規格/編號/價格</span>
                  </div>
                  <button class="bv-bold-button active" id="sub-bold-btn" title="粗體">B</button>
                </div>
                
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>文字大小</span>
                    <span class="bv-value-label" id="sub-size">8px</span>
                  </div>
                  <input type="range" id="sub-slider" min="6" max="16" value="8" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>行高</span>
                    <span class="bv-value-label" id="sub-line-height">9px</span>
                  </div>
                  <input type="range" id="sub-line-height-slider" min="6" max="20" value="9" class="bv-glass-slider">
                </div>
                
                <!-- 分隔線 -->
                <div style="height: 1px; background: rgba(0, 0, 0, 0.06); margin: 16px 0;"></div>
                
                <!-- 條碼數字 -->
                <div class="bv-setting-item">
                  <div class="bv-setting-info">
                    <span class="bv-setting-label">條碼數字</span>
                  </div>
                  <button class="bv-bold-button" id="barcode-text-bold-btn" title="粗體">B</button>
                </div>
                
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>文字大小</span>
                    <span class="bv-value-label" id="barcode-text-size">8px</span>
                  </div>
                  <input type="range" id="barcode-text-slider" min="6" max="16" value="8" class="bv-glass-slider">
                </div>
              </div>
            </div>
            
            <!-- 版面配置區塊 -->
            <div class="bv-settings-card">
              <h4 class="bv-card-title">
                <span class="material-icons">dashboard</span>
                版面配置
              </h4>
              
              <div class="bv-slider-group">
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>條碼圖片高度</span>
                    <span class="bv-value-label" id="barcode-height">83%</span>
                  </div>
                  <input type="range" id="barcode-height-slider" min="20" max="100" value="83" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>條碼圖片寬度</span>
                    <span class="bv-value-label" id="barcode-width">90%</span>
                  </div>
                  <input type="range" id="barcode-width-slider" min="50" max="100" value="90" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>條碼垂直位置</span>
                    <span class="bv-value-label" id="barcode-y-position">50%</span>
                  </div>
                  <input type="range" id="barcode-y-position-slider" min="0" max="100" value="50" class="bv-glass-slider">
                </div>
              </div>
            </div>
            
            <!-- 底圖設定區塊 -->
            <div class="bv-settings-card">
              <h4 class="bv-card-title">
                <span class="material-icons">image</span>
                底圖設定
              </h4>
              
              <div class="bv-logo-upload-area" id="logo-upload-area">
                <input type="file" id="logo-input" accept="image/png,image/jpeg,image/jpg" style="display:none;">
                <img id="logo-preview" class="bv-logo-preview" style="display:none;">
                <div id="upload-prompt">
                  <span class="material-icons" style="font-size:36px; color: #86868b;">add_photo_alternate</span>
                  <div class="bv-upload-hint">點擊上傳底圖（支援 PNG/JPG）</div>
                </div>
              </div>
              
              <div class="bv-logo-controls" id="logo-controls">
                <div class="bv-slider-group">
                  <div class="bv-slider-item">
                    <div class="bv-slider-header">
                      <span>底圖大小</span>
                      <span class="bv-value-label" id="logo-size">30%</span>
                    </div>
                    <input type="range" id="logo-size-slider" min="10" max="100" value="30" class="bv-glass-slider">
                  </div>
                  
                  <div class="bv-slider-item">
                    <div class="bv-slider-header">
                      <span>水平位置</span>
                      <span class="bv-value-label" id="logo-x">50%</span>
                    </div>
                    <input type="range" id="logo-x-slider" min="0" max="100" value="50" class="bv-glass-slider">
                  </div>
                  
                  <div class="bv-slider-item">
                    <div class="bv-slider-header">
                      <span>垂直位置</span>
                      <span class="bv-value-label" id="logo-y">50%</span>
                    </div>
                    <input type="range" id="logo-y-slider" min="0" max="100" value="50" class="bv-glass-slider">
                  </div>
                  
                  <div class="bv-slider-item">
                    <div class="bv-slider-header">
                      <span>淡化程度</span>
                      <span class="bv-value-label" id="logo-opacity">20%</span>
                    </div>
                    <input type="range" id="logo-opacity-slider" min="0" max="100" value="20" class="bv-glass-slider">
                  </div>
                </div>
                
                <button class="bv-remove-logo-btn" id="remove-logo-btn">
                  <span class="material-icons">delete</span>
                  移除底圖
                </button>
              </div>
            </div>
          </div>
          
          <div class="bv-panel-footer">
            <button class="bv-glass-action-button" id="bv-apply-print">
              <span class="material-icons">print</span>
              <span>套用並列印</span>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    /* 手機版浮動按鈕 */
    const floatingButton = document.createElement('button');
    floatingButton.className = 'bv-floating-button';
    floatingButton.id = 'bv-floating-print';
    floatingButton.innerHTML = '<span class="material-icons">print</span>';
    document.body.appendChild(floatingButton);
    
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
      // 使用背景漸層來顯示進度
      input.style.background = `linear-gradient(to right, #518aff 0%, #7289DA ${value}%, rgba(0, 0, 0, 0.1) ${value}%, rgba(0, 0, 0, 0.1) 100%)`;
    }
    
    /* 延遲初始化所有控制項 */
    setTimeout(() => {
      /* 先抓取並儲存初始頁面樣式 */
      initialPageSettings = getBVShopNativeSettings();
      console.log('初始頁面樣式已儲存:', initialPageSettings);
      
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
              
              const img = new Image();
              img.onload = function() {
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
      
      /* 最小化按鈕 */
      const minimizeBtn = document.getElementById('bv-minimize-btn');
      if (minimizeBtn) {
        minimizeBtn.addEventListener('click', function() {
          const panel = document.getElementById('bv-barcode-control-panel');
          const icon = this.querySelector('.material-icons');
          
          if (isPanelMinimized) {
            panel.classList.remove('minimized');
            icon.textContent = 'remove';
            isPanelMinimized = false;
          } else {
            panel.classList.add('minimized');
            icon.textContent = 'add';
            isPanelMinimized = true;
          }
          
          chrome.storage.local.set({ bvPanelMinimized: isPanelMinimized });
        });
      }
      
      /* 浮動列印按鈕 */
      const floatingPrint = document.getElementById('bv-floating-print');
      if (floatingPrint) {
        floatingPrint.addEventListener('click', function() {
          window.allowPrint = true;
          window.print();
        });
      }
      
      /* 智能最佳化按鈕 */
      const transformBtn = document.getElementById('bv-transform-btn');
      if (transformBtn) {
        transformBtn.addEventListener('click', function() {
          optimizeLayoutForLabelSize();
        });
      }
      
      /* 初始化拖曳功能 */
      initDragFunction();
      
      /* 獲取所有需要的控制項元素 */
      const mainSize = document.getElementById('main-slider');
      const mainBoldBtn = document.getElementById('main-bold-btn');
      const mainGap = document.getElementById('main-gap-slider');
      const mainLineHeightSlider = document.getElementById('main-line-height-slider');
      
      const subSize = document.getElementById('sub-slider');
      const subBoldBtn = document.getElementById('sub-bold-btn');
      const subLineHeightSlider = document.getElementById('sub-line-height-slider');
      
      const barcodeTextSize = document.getElementById('barcode-text-slider');
      const barcodeTextBoldBtn = document.getElementById('barcode-text-bold-btn');
      const barcodeHeight = document.getElementById('barcode-height-slider');
      const barcodeWidth = document.getElementById('barcode-width-slider');
      const barcodeYPosition = document.getElementById('barcode-y-position-slider');
      
      const labelWidth = document.getElementById('label-width-slider');
      const labelHeight = document.getElementById('label-height-slider');
      const labelPadding = document.getElementById('label-padding-slider');
      const textAlign = document.getElementById('text-align');
      const fontFamily = document.getElementById('font-family-select');
      
      /* 備用預設值 */
      const defaultSettings = initialPageSettings || completeDefaultSettings;
      
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

      /* 字體大小改變時，自動調整行高 */
      if (mainSize) {
        mainSize.addEventListener('input', function() {
          if (mainLineHeightSlider) {
            const suggestedLineHeight = calculateSuggestedLineHeight(this.value);
            
            if (!mainLineHeightSlider.dataset.userModified) {
              mainLineHeightSlider.value = suggestedLineHeight;
              updateRangeProgress(mainLineHeightSlider);
            }
            
            const minLineHeight = Math.ceil(this.value * 1.1);
            mainLineHeightSlider.min = minLineHeight;
            if (parseInt(mainLineHeightSlider.value) < minLineHeight) {
              mainLineHeightSlider.value = minLineHeight;
              updateRangeProgress(mainLineHeightSlider);
            }
          }
          updateStyles();
        });
      }

      if (subSize) {
        subSize.addEventListener('input', function() {
          if (subLineHeightSlider) {
            const suggestedLineHeight = calculateSuggestedLineHeight(this.value);
            
            if (!subLineHeightSlider.dataset.userModified) {
              subLineHeightSlider.value = suggestedLineHeight;
              updateRangeProgress(subLineHeightSlider);
            }
            
            const minLineHeight = Math.ceil(this.value * 1.1);
            subLineHeightSlider.min = minLineHeight;
            if (parseInt(subLineHeightSlider.value) < minLineHeight) {
              subLineHeightSlider.value = minLineHeight;
              updateRangeProgress(subLineHeightSlider);
            }
          }
          updateStyles();
        });
      }

      // 標記使用者手動調整過行高
      if (mainLineHeightSlider) {
        mainLineHeightSlider.addEventListener('input', function() {
          this.dataset.userModified = 'true';
          updateStyles();
        });
      }

      if (subLineHeightSlider) {
        subLineHeightSlider.addEventListener('input', function() {
          this.dataset.userModified = 'true';
          updateStyles();
        });
      }

      /* 智能最佳化函數 */
      function optimizeLayoutForLabelSize() {
        const labelWidthMM = parseFloat(labelWidth.value);
        const labelHeightMM = parseFloat(labelHeight.value);
        const paddingMM = parseFloat(labelPadding.value);
        
        // 可用空間
        const availableWidth = labelWidthMM - (paddingMM * 2);
        const availableHeight = labelHeightMM - (paddingMM * 2);
        
        // 計算寬高比
        const aspectRatio = labelWidthMM / labelHeightMM;
        
        // 根據標籤尺寸計算最佳設定
        let optimizedSettings = {};
        
        // 根據寬度分類
        if (labelWidthMM <= 30) {
          // 超小標籤
          optimizedSettings = {
            mainSize: 7,
            mainLineHeight: 9,
            mainGap: 0,
            subSize: 6,
            subLineHeight: 7,
            barcodeTextSize: 6,
            barcodeHeight: 65,
            barcodeWidth: 90,
            barcodeYPosition: 50,
            textAlign: 'center',
            labelPadding: Math.min(paddingMM, 0.5)
          };
        } else if (labelWidthMM <= 35) {
          // 小標籤
          optimizedSettings = {
            mainSize: 8,
            mainLineHeight: 10,
            mainGap: 0,
            subSize: 7,
            subLineHeight: 8,
            barcodeTextSize: 6,
            barcodeHeight: 68,
            barcodeWidth: 88,
            barcodeYPosition: 50,
            textAlign: 'center',
            labelPadding: Math.min(paddingMM, 0.8)
          };
        } else if (labelWidthMM <= 40) {
          // 標準標籤
          optimizedSettings = {
            mainSize: 9,
            mainLineHeight: 11,
            mainGap: 0.5,
            subSize: 7,
            subLineHeight: 9,
            barcodeTextSize: 7,
            barcodeHeight: 70,
            barcodeWidth: 85,
            barcodeYPosition: 50,
            textAlign: 'left',
            labelPadding: paddingMM
          };
        } else if (labelWidthMM <= 50) {
          // 中型標籤
          optimizedSettings = {
            mainSize: 10,
            mainLineHeight: 12,
            mainGap: 1,
            subSize: 8,
            subLineHeight: 10,
            barcodeTextSize: 8,
            barcodeHeight: 72,
            barcodeWidth: 85,
            barcodeYPosition: 50,
            textAlign: 'left',
            labelPadding: paddingMM
          };
        } else {
          // 大標籤
          optimizedSettings = {
            mainSize: 11,
            mainLineHeight: 14,
            mainGap: 1.5,
            subSize: 9,
            subLineHeight: 11,
            barcodeTextSize: 9,
            barcodeHeight: 75,
            barcodeWidth: 82,
            barcodeYPosition: 50,
            textAlign: 'left',
            labelPadding: paddingMM
          };
        }
        
        // 根據高度微調
        if (labelHeightMM <= 20) {
          // 超矮標籤
          optimizedSettings.mainSize = Math.max(optimizedSettings.mainSize - 2, 6);
          optimizedSettings.subSize = Math.max(optimizedSettings.subSize - 2, 5);
          optimizedSettings.barcodeHeight = Math.max(optimizedSettings.barcodeHeight - 15, 50);
          optimizedSettings.mainGap = 0;
          optimizedSettings.mainLineHeight = Math.ceil(optimizedSettings.mainSize * 1.2);
          optimizedSettings.subLineHeight = Math.ceil(optimizedSettings.subSize * 1.2);
        } else if (labelHeightMM <= 25) {
          // 矮標籤
          optimizedSettings.mainSize = Math.max(optimizedSettings.mainSize - 1, 7);
          optimizedSettings.subSize = Math.max(optimizedSettings.subSize - 1, 6);
          optimizedSettings.barcodeHeight = Math.max(optimizedSettings.barcodeHeight - 5, 60);
          optimizedSettings.mainGap = Math.min(optimizedSettings.mainGap, 0.5);
        } else if (labelHeightMM >= 35) {
          // 高標籤
          optimizedSettings.mainGap = Math.min(optimizedSettings.mainGap + 0.5, 2);
          optimizedSettings.barcodeHeight = Math.min(optimizedSettings.barcodeHeight + 5, 80);
        }
        
        // 根據寬高比進一步調整
        if (aspectRatio < 1.2) {
          // 接近正方形的標籤
          optimizedSettings.textAlign = 'center';
          optimizedSettings.barcodeWidth = Math.min(optimizedSettings.barcodeWidth, 80);
        } else if (aspectRatio > 2) {
          // 特別寬的標籤
          optimizedSettings.barcodeWidth = Math.max(optimizedSettings.barcodeWidth - 10, 70);
        }
        
        // 計算預期的文字高度
        const pxToMm = 0.264583;
        const estimatedTextHeight = (
          (optimizedSettings.mainLineHeight * 2 + optimizedSettings.mainGap) * pxToMm +
          (optimizedSettings.subLineHeight * 2) * pxToMm
        );
        
        // 確保有足夠空間給條碼
        const minimumBarcodeHeight = 6; // 最少需要 6mm 給條碼
        if (availableHeight - estimatedTextHeight < minimumBarcodeHeight) {
          // 空間不足，進一步縮小文字
          const scaleFactor = 0.8;
          optimizedSettings.mainSize = Math.round(optimizedSettings.mainSize * scaleFactor);
          optimizedSettings.subSize = Math.round(optimizedSettings.subSize * scaleFactor);
          optimizedSettings.mainLineHeight = Math.ceil(optimizedSettings.mainSize * 1.2);
          optimizedSettings.subLineHeight = Math.ceil(optimizedSettings.subSize * 1.2);
          optimizedSettings.mainGap = 0;
        }
        
        // 套用最佳化設定
        applyOptimizedSettings(optimizedSettings);
        
        // 顯示詳細通知
        const layoutType = initialPageSettings?.layoutType || 'style1';
        showNotification(
          `已針對 ${labelWidthMM}×${labelHeightMM}mm 標籤最佳化 (樣式${layoutType.replace('style', '')})`
        );
      }

      /* 套用最佳化設定 */
      function applyOptimizedSettings(settings) {
        // 套用標籤內距（如果有設定）
        if (labelPadding && settings.labelPadding !== undefined) {
          labelPadding.value = settings.labelPadding;
          updateRangeProgress(labelPadding);
        }
        
        // 套用文字大小
        if (mainSize && settings.mainSize !== undefined) {
          mainSize.value = settings.mainSize;
          updateRangeProgress(mainSize);
        }
        
        if (mainLineHeightSlider && settings.mainLineHeight !== undefined) {
          mainLineHeightSlider.value = settings.mainLineHeight;
          mainLineHeightSlider.dataset.userModified = 'false';
          updateRangeProgress(mainLineHeightSlider);
        }
        
        if (mainGap && settings.mainGap !== undefined) {
          mainGap.value = settings.mainGap;
          updateRangeProgress(mainGap);
        }
        
        if (subSize && settings.subSize !== undefined) {
          subSize.value = settings.subSize;
          updateRangeProgress(subSize);
        }
        
        if (subLineHeightSlider && settings.subLineHeight !== undefined) {
          subLineHeightSlider.value = settings.subLineHeight;
          subLineHeightSlider.dataset.userModified = 'false';
          updateRangeProgress(subLineHeightSlider);
        }
        
        if (barcodeTextSize && settings.barcodeTextSize !== undefined) {
          barcodeTextSize.value = settings.barcodeTextSize;
          updateRangeProgress(barcodeTextSize);
        }
        
        if (barcodeHeight && settings.barcodeHeight !== undefined) {
          barcodeHeight.value = settings.barcodeHeight;
          updateRangeProgress(barcodeHeight);
        }
        
        if (barcodeWidth && settings.barcodeWidth !== undefined) {
          barcodeWidth.value = settings.barcodeWidth;
          updateRangeProgress(barcodeWidth);
        }
        
        if (barcodeYPosition && settings.barcodeYPosition !== undefined) {
          barcodeYPosition.value = settings.barcodeYPosition;
          updateRangeProgress(barcodeYPosition);
        }
        
        if (textAlign && settings.textAlign !== undefined) {
          textAlign.value = settings.textAlign;
        }
        
        // 立即更新樣式
        updateStyles();
      }

      /* 更新樣式函數 - 確保內容不溢出 */
      function updateStyles() {
        if (!mainSize || !subSize) return;
        
        const mainLineHeight = mainLineHeightSlider ? mainLineHeightSlider.value : 11;
        const subLineHeight = subLineHeightSlider ? subLineHeightSlider.value : 9;
        const justifyContent = 'space-between';
        
        // 動態計算文字區域所需高度
        const mainFontSizePx = parseFloat(mainSize.value);
        const mainLineHeightPx = parseFloat(mainLineHeight);
        const mainGapPx = parseFloat(mainGap.value);
        const subLineHeightPx = parseFloat(subLineHeight);
        
        // 計算實際需要的文字區域高度
        const layoutType = initialPageSettings?.layoutType || 'style1';
        const showSpecInfo = layoutType !== 'style8';
        
        // 根據不同樣式計算行數
        let mainTextLines = 2; // 預設2行
        let subTextLines = 2;  // 預設2行
        
        // 特殊樣式調整
        if (layoutType === 'style3' || layoutType === 'style4' || layoutType === 'style6') {
          // 這些樣式條碼在文字區內，需要更多空間
          mainTextLines = 1;
          subTextLines = 1;
        }
        
        // 計算文字區域高度 (px to mm)
        const pxToMm = 0.264583;
        const mainTextHeightMm = (mainLineHeightPx * mainTextLines) * pxToMm;
        const gapMm = mainGapPx * pxToMm;
        const subTextHeightMm = (subLineHeightPx * subTextLines) * pxToMm;
        
        // 總文字區域高度，加上一些餘量
        const infoHeight = Math.ceil(mainTextHeightMm + gapMm + subTextHeightMm + 2);
        
        // 計算可用高度和條碼區域高度
        const totalHeight = parseFloat(labelHeight.value);
        const paddingValue = parseFloat(labelPadding.value);
        const availableHeight = totalHeight - (paddingValue * 2);
        const barcodeAreaHeight = Math.max(availableHeight - infoHeight, 5); // 至少5mm
        
        // 如果空間不足，調整文字區域高度
        const finalInfoHeight = availableHeight > infoHeight + 5 ? infoHeight : availableHeight * 0.5;
        const finalBarcodeHeight = availableHeight - finalInfoHeight;
        
        const validatedMainLineHeight = validateLineHeight(mainSize.value, mainLineHeight);
        const validatedSubLineHeight = validateLineHeight(subSize.value, subLineHeight);
        
        const mainFontWeight = mainBoldBtn && mainBoldBtn.classList.contains('active') ? 700 : 500;
        const subFontWeight = subBoldBtn && subBoldBtn.classList.contains('active') ? 700 : 500;
        const barcodeTextFontWeight = barcodeTextBoldBtn && barcodeTextBoldBtn.classList.contains('active') ? 700 : 500;
        
        const totalWidth = parseFloat(labelWidth.value);
        const availableWidth = totalWidth - (paddingValue * 2);
        
        const barcodeActualHeight = (finalBarcodeHeight * parseFloat(barcodeHeight.value) / 100).toFixed(1);
        const barcodeActualWidth = (availableWidth * parseFloat(barcodeWidth.value) / 100).toFixed(1);
        
        const barcodeYPercent = barcodeYPosition ? parseFloat(barcodeYPosition.value) : 50;
        
        /* 更新顯示值 */
        document.getElementById('main-size').textContent = mainSize.value + 'px';
        document.getElementById('main-gap').textContent = mainGap.value + 'px';
        document.getElementById('sub-size').textContent = subSize.value + 'px';
        
        document.getElementById('barcode-text-size').textContent = barcodeTextSize.value + 'px';
        document.getElementById('barcode-height').textContent = barcodeHeight.value + '%';
        document.getElementById('barcode-width').textContent = barcodeWidth.value + '%';
        if (document.getElementById('barcode-y-position')) {
          document.getElementById('barcode-y-position').textContent = barcodeYPercent + '%';
        }
        document.getElementById('label-width').textContent = labelWidth.value + 'mm';
        document.getElementById('label-height').textContent = labelHeight.value + 'mm';
        document.getElementById('label-padding').textContent = labelPadding.value + 'mm';
        
        if (document.getElementById('main-line-height')) {
          document.getElementById('main-line-height').textContent = validatedMainLineHeight + 'px';
        }
        if (document.getElementById('sub-line-height')) {
          document.getElementById('sub-line-height').textContent = validatedSubLineHeight + 'px';
        }
        
        if (logoSizeSlider) {
          document.getElementById('logo-size').textContent = logoSizeSlider.value + '%';
          document.getElementById('logo-x').textContent = logoXSlider.value + '%';
          document.getElementById('logo-y').textContent = logoYSlider.value + '%';
          document.getElementById('logo-opacity').textContent = logoOpacitySlider.value + '%';
        }
        
        const logoHeightMM = logoSizeSlider ? parseFloat(labelHeight.value) * parseFloat(logoSizeSlider.value) / 100 : 0;
        const logoWidthMM = logoHeightMM * logoAspectRatio;
        
        /* 更新所有滑桿的進度條 */
        [mainSize, mainGap, mainLineHeightSlider, subSize, subLineHeightSlider, 
         barcodeTextSize, barcodeHeight, barcodeWidth, barcodeYPosition,
         labelWidth, labelHeight, labelPadding,
         logoSizeSlider, logoXSlider, logoYSlider, logoOpacitySlider].forEach(control => {
          if (control && control.type === 'range') {
            updateRangeProgress(control);
          }
        });
        
        /* 套用樣式 - 確保內容不溢出 */
        dynamicStyle.innerHTML = `
          /* 調整條碼標籤整體尺寸 */
          .print_barcode_area {
            width: ${labelWidth.value}mm !important;
          }
          
          /* 調整單個標籤的尺寸 */
          html .print_barcode_area .print_sample,
          body .print_barcode_area .print_sample {
            height: ${labelHeight.value}mm !important;
            padding: ${labelPadding.value}mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: ${justifyContent} !important;
            overflow: hidden !important;
          }
          
          /* 文字區域 - 固定高度 */
          ${showSpecInfo ? `
          .print_barcode_area .print_sample .spec_info {
            flex: 0 0 ${finalInfoHeight}mm !important;
            height: ${finalInfoHeight}mm !important;
            margin-bottom: 0 !important;
            overflow: hidden !important;
            display: block !important;
          }` : `
          .print_barcode_area .print_sample .spec_info {
            display: none !important;
          }`}
          
          /* 條碼區域 - 使用剩餘空間 */
          .print_barcode_area .print_sample > .spec_barcode {
            flex: 1 1 auto !important;
            height: ${finalBarcodeHeight}mm !important;
            min-height: 5mm !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            overflow: hidden !important;
            position: relative !important;
            justify-content: ${
              barcodeYPercent <= 20 ? 'flex-start' :
              barcodeYPercent >= 80 ? 'flex-end' : 'center'
            } !important;
          }
          
          /* 樣式八特殊處理 */
          ${layoutType === 'style8' ? `
          .print_barcode_area .print_sample {
            justify-content: center !important;
            align-items: center !important;
          }
          .print_barcode_area .print_sample > .spec_barcode {
            height: auto !important;
          }
          ` : ''}
          
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
          
          /* 商品名稱樣式 - 自適應行數 */
          .print_barcode_area .print_sample .spec_info .main {
            font-size: ${mainSize.value}px !important;
            line-height: ${validatedMainLineHeight}px !important;
            font-weight: ${mainFontWeight} !important;
            margin-bottom: ${mainGap.value}px !important;
            white-space: normal !important;
            word-break: break-word !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            hyphens: auto !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            display: -webkit-box !important;
            -webkit-line-clamp: ${mainTextLines} !important;
            -webkit-box-orient: vertical !important;
          }
          
          /* 規格/編號/價格樣式 - 包含行高 */
          .print_barcode_area .print_sample .spec_info .sub {
            font-size: ${subSize.value}px !important;
            line-height: ${validatedSubLineHeight}px !important;
            font-weight: ${subFontWeight} !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          
          /* 條碼下方數字樣式 */
          .print_barcode_area .print_sample .spec_barcode .sub {
            font-size: ${barcodeTextSize.value}px !important;
            font-weight: ${barcodeTextFontWeight} !important;
            pointer-events: none !important;
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            user-select: none !important;
            text-decoration: none !important;
            color: inherit !important;
            white-space: nowrap !important;
          }
          
          /* 條碼圖片 - 確保在區域內 */
          .print_barcode_area .print_sample .spec_barcode img {
            max-height: calc(${finalBarcodeHeight}mm * ${barcodeHeight.value / 100}) !important;
            width: ${barcodeActualWidth}mm !important;
            max-width: calc(100% * ${barcodeWidth.value / 100}) !important;
            height: auto !important;
            object-fit: contain !important;
            display: block !important;
            margin: 0 auto !important;
            position: relative !important;
            ${barcodeYPosition ? `
              transform: translateY(${(barcodeYPercent - 50) * 0.1}mm) !important;
            ` : ''}
          }
          
          /* 特殊樣式處理：條碼在 spec_info 內 */
          .print_barcode_area .print_sample .spec_info .spec_barcode {
            height: auto !important;
            margin: 5px 0 !important;
          }
          
          .print_barcode_area .print_sample .spec_info .spec_barcode img {
            height: ${Math.min(parseFloat(barcodeActualHeight), 8)}mm !important;
            width: ${Math.min(parseFloat(barcodeActualWidth), 30)}mm !important;
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
          
          /* 防止任何連結樣式 */
          .print_barcode_area a {
            text-decoration: none !important;
            color: inherit !important;
            pointer-events: none !important;
          }
        `;
        
        /* 更新所有標籤的底圖 */
        updateLogos();
        
        /* 自動保存當前設定為臨時設定 */
        saveSettingsToLocal('_current_temp_settings', saveCurrentSettings());
      }
      
      /* 更新所有標籤的底圖 */
      function updateLogos() {
        document.querySelectorAll('.label-background-logo').forEach(logo => logo.remove());
        
        if (logoDataUrl) {
          document.querySelectorAll('.print_sample').forEach(sample => {
            const logo = document.createElement('img');
            logo.className = 'label-background-logo';
            logo.src = logoDataUrl;
            sample.insertBefore(logo, sample.firstChild);
          });
        }
      }
      
      /* 添加事件監聽器 */
      const controls = [
        mainSize, mainGap, mainLineHeightSlider,
        subSize, subLineHeightSlider,
        barcodeTextSize, barcodeHeight, barcodeWidth, barcodeYPosition,
        labelWidth, labelHeight, labelPadding, textAlign, fontFamily,
        logoSizeSlider, logoXSlider, logoYSlider, logoOpacitySlider
      ];
      
      controls.forEach(control => {
        if(control) {
          control.addEventListener('input', updateStyles);
          control.addEventListener('change', updateStyles);
          
          if(control.type === 'range') {
            updateRangeProgress(control);
            control.addEventListener('input', () => updateRangeProgress(control));
          }
        }
      });
      
      /* 列印按鈕功能 */
      const applyPrintBtn = document.getElementById('bv-apply-print');
      if (applyPrintBtn) {
        applyPrintBtn.addEventListener('click', function() {
          window.allowPrint = true;
          window.print();
        });
      }
      
      /* 清除格式按鈕功能 */
      const resetFormatBtn = document.getElementById('bv-reset-format');
      if (resetFormatBtn) {
        resetFormatBtn.addEventListener('click', function() {
          if (confirm('確定要將所有設定還原到預設值嗎？\n\n此操作無法復原。')) {
            if (logoDataUrl) {
              logoDataUrl = null;
              logoAspectRatio = 1;
              if (logoPreview) logoPreview.style.display = 'none';
              if (uploadPrompt) uploadPrompt.style.display = 'block';
              if (logoUploadArea) logoUploadArea.classList.remove('has-logo');
              if (logoControls) logoControls.classList.remove('active');
              if (logoInput) logoInput.value = '';
            }
            
            if (mainLineHeightSlider) mainLineHeightSlider.dataset.userModified = 'false';
            if (subLineHeightSlider) subLineHeightSlider.dataset.userModified = 'false';
            
            const resetSettings = initialPageSettings || completeDefaultSettings;
            
            if (!initialPageSettings) {
              resetSettings.mainLineHeight = calculateSuggestedLineHeight(resetSettings.mainSize);
              resetSettings.subLineHeight = calculateSuggestedLineHeight(resetSettings.subSize);
            }
            
            applySavedSettings(resetSettings);
            
            const presetSelect = document.getElementById('bv-preset-select');
            if (presetSelect) presetSelect.value = '';
            
            try {
              localStorage.removeItem('bvShopBarcode_lastSelectedPreset');
              localStorage.removeItem('bvShopBarcode__current_temp_settings');
            } catch (e) {
              console.warn('無法清除記錄');
            }
            
            showNotification('已還原到預設值');
          }
        });
      }
      
      /* 儲存設定功能 */
      function saveCurrentSettings() {
        if (!mainSize || !subSize) return {};
        
        const settings = {
          mainSize: mainSize.value,
          mainBold: mainBoldBtn ? mainBoldBtn.classList.contains('active') : true,
          mainGap: mainGap.value,
          mainLineHeight: mainLineHeightSlider ? mainLineHeightSlider.value : 11,
          subSize: subSize.value,
          subBold: subBoldBtn ? subBoldBtn.classList.contains('active') : true,
          subLineHeight: subLineHeightSlider ? subLineHeightSlider.value : 9,
          barcodeTextSize: barcodeTextSize.value,
          barcodeTextBold: barcodeTextBoldBtn ? barcodeTextBoldBtn.classList.contains('active') : false,
          barcodeHeight: barcodeHeight.value,
          barcodeWidth: barcodeWidth.value,
          barcodeYPosition: barcodeYPosition ? barcodeYPosition.value : 50,
          labelWidth: labelWidth.value,
          labelHeight: labelHeight.value,
          labelPadding: labelPadding.value,
          textAlign: textAlign.value,
          fontFamily: fontFamily.value,
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
        if (!settings || !mainSize || !subSize) return;
        
        mainSize.value = settings.mainSize !== undefined ? settings.mainSize : completeDefaultSettings.mainSize;
        if (mainBoldBtn) {
          mainBoldBtn.classList.toggle('active', settings.mainBold !== undefined ? settings.mainBold : completeDefaultSettings.mainBold);
        }
        mainGap.value = settings.mainGap !== undefined ? settings.mainGap : completeDefaultSettings.mainGap;
        if (mainLineHeightSlider) {
          mainLineHeightSlider.value = settings.mainLineHeight !== undefined ? settings.mainLineHeight : completeDefaultSettings.mainLineHeight;
        }
        
        subSize.value = settings.subSize !== undefined ? settings.subSize : completeDefaultSettings.subSize;
        if (subBoldBtn) {
          subBoldBtn.classList.toggle('active', settings.subBold !== undefined ? settings.subBold : completeDefaultSettings.subBold);
        }
        if (subLineHeightSlider) {
          subLineHeightSlider.value = settings.subLineHeight !== undefined ? settings.subLineHeight : completeDefaultSettings.subLineHeight;
        }
        
        barcodeTextSize.value = settings.barcodeTextSize !== undefined ? settings.barcodeTextSize : completeDefaultSettings.barcodeTextSize;
        if (barcodeTextBoldBtn) {
          barcodeTextBoldBtn.classList.toggle('active', settings.barcodeTextBold !== undefined ? settings.barcodeTextBold : completeDefaultSettings.barcodeTextBold);
        }
        
        barcodeHeight.value = settings.barcodeHeight !== undefined ? settings.barcodeHeight : completeDefaultSettings.barcodeHeight;
        barcodeWidth.value = settings.barcodeWidth !== undefined ? settings.barcodeWidth : completeDefaultSettings.barcodeWidth;
        if (barcodeYPosition) {
          barcodeYPosition.value = settings.barcodeYPosition !== undefined ? settings.barcodeYPosition : completeDefaultSettings.barcodeYPosition;
        }
        
        labelWidth.value = settings.labelWidth !== undefined ? settings.labelWidth : completeDefaultSettings.labelWidth;
        labelHeight.value = settings.labelHeight !== undefined ? settings.labelHeight : completeDefaultSettings.labelHeight;
        labelPadding.value = settings.labelPadding !== undefined ? settings.labelPadding : completeDefaultSettings.labelPadding;
        
        textAlign.value = settings.textAlign || completeDefaultSettings.textAlign;
        fontFamily.value = settings.fontFamily || completeDefaultSettings.fontFamily;
        
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
          logoSizeSlider.value = settings.logoSize !== undefined ? settings.logoSize : completeDefaultSettings.logoSize;
        }
        if (logoXSlider) {
          logoXSlider.value = settings.logoX !== undefined ? settings.logoX : completeDefaultSettings.logoX;
        }
        if (logoYSlider) {
          logoYSlider.value = settings.logoY !== undefined ? settings.logoY : completeDefaultSettings.logoY;
        }
        if (logoOpacitySlider) {
          logoOpacitySlider.value = settings.logoOpacity !== undefined ? settings.logoOpacity : completeDefaultSettings.logoOpacity;
        }
        
        document.querySelectorAll('input[type="range"]').forEach(updateRangeProgress);
        
        updateStyles();
      }
      
      /* 儲存/讀取設定相關函數 */
      function saveSettingsToLocal(name, settings) {
        try {
          localStorage.setItem('bvShopBarcode_' + name, JSON.stringify(settings));
        } catch (e) {
          console.error('無法儲存設定：', e);
          try {
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
        const presetSelect = document.getElementById('bv-preset-select');
        if (!presetSelect) return;
        
        const allPresets = getSettingsFromLocal('presetList') || [];
        const lastSelected = getSettingsFromLocal('lastSelectedPreset');
        
        while (presetSelect.options.length > 1) {
          presetSelect.remove(1);
        }
        
        allPresets.forEach(presetName => {
          const option = document.createElement('option');
          option.value = presetName;
          option.textContent = presetName;
          presetSelect.appendChild(option);
          
          if (presetName === lastSelected) {
            option.selected = true;
          }
        });
      }
      
      /* 初始化設定檔系統 */
      function initPresetSystem() {
        const presetSelect = document.getElementById('bv-preset-select');
        const savePresetBtn = document.getElementById('bv-save-preset');
        const deletePresetBtn = document.getElementById('bv-delete-preset');
        const savePresetRow = document.getElementById('bv-save-preset-row');
        const newPresetName = document.getElementById('bv-new-preset-name');
        const confirmSaveBtn = document.getElementById('bv-confirm-save');
        const cancelSaveBtn = document.getElementById('bv-cancel-save');
        
        if (!presetSelect) return;
        
        loadPresetList();
        
        presetSelect.addEventListener('change', function() {
          const selectedPreset = presetSelect.value;
          if (selectedPreset) {
            const settings = getSettingsFromLocal('preset_' + selectedPreset);
            if (settings) {
              applySavedSettings(settings);
              saveSettingsToLocal('lastSelectedPreset', selectedPreset);
              showNotification(`已載入預設「${selectedPreset}」`);
            }
          }
        });
        
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
            
            const allPresets = getSettingsFromLocal('presetList') || [];
            if (!allPresets.includes(presetName)) {
              allPresets.push(presetName);
              saveSettingsToLocal('presetList', allPresets);
            }
            
            saveSettingsToLocal('lastSelectedPreset', presetName);
            
            loadPresetList();
            if (savePresetRow) {
              savePresetRow.style.display = 'none';
            }
            
            showNotification(`預設「${presetName}」已儲存`);
          });
        }
        
        if (cancelSaveBtn) {
          cancelSaveBtn.addEventListener('click', function() {
            if (savePresetRow) {
              savePresetRow.style.display = 'none';
            }
          });
        }
        
        if (deletePresetBtn) {
          deletePresetBtn.addEventListener('click', function() {
            const selectedPreset = presetSelect.value;
            if (!selectedPreset) {
              showNotification('請先選擇一個預設', 'warning');
              return;
            }
            
            if (confirm(`確定要刪除預設「${selectedPreset}」嗎？`)) {
              const allPresets = getSettingsFromLocal('presetList') || [];
              const updatedPresets = allPresets.filter(name => name !== selectedPreset);
              saveSettingsToLocal('presetList', updatedPresets);
              
              try {
                localStorage.removeItem('bvShopBarcode_preset_' + selectedPreset);
                sessionStorage.removeItem('bvShopBarcode_preset_' + selectedPreset);
              } catch (e) {
                console.error('刪除設定時發生錯誤');
              }
              
              if (getSettingsFromLocal('lastSelectedPreset') === selectedPreset) {
                try {
                  localStorage.removeItem('bvShopBarcode_lastSelectedPreset');
                  sessionStorage.removeItem('bvShopBarcode_lastSelectedPreset');
                } catch (e) {
                  console.error('清除記錄時發生錯誤');
                }
              }
              
              loadPresetList();
              showNotification(`預設「${selectedPreset}」已刪除`);
            }
          });
        }
        
        if (newPresetName) {
          newPresetName.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && confirmSaveBtn) {
              confirmSaveBtn.click();
            }
          });
        }
      }
      
      /* 顯示通知訊息 */
      function showNotification(message, type = 'success') {
        const existingNotification = document.querySelector('.bv-notification');
        if (existingNotification) {
          existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `bv-notification ${type}`;
        
        const icon = document.createElement('span');
        icon.className = 'material-icons';
        icon.textContent = type === 'success' ? 'check_circle' : 'warning';
        
        notification.appendChild(icon);
        notification.appendChild(document.createTextNode(message));
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.animation = 'slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          setTimeout(() => notification.remove(), 400);
        }, 3000);
      }
      
      /* 載入儲存的面板狀態 */
      chrome.storage.local.get(['bvPanelMinimized'], (result) => {
        if (result.bvPanelMinimized !== undefined) {
          isPanelMinimized = result.bvPanelMinimized;
          const panel = document.getElementById('bv-barcode-control-panel');
          const minimizeBtn = document.getElementById('bv-minimize-btn');
          
          if (isPanelMinimized && panel && minimizeBtn) {
            panel.classList.add('minimized');
            minimizeBtn.querySelector('.material-icons').textContent = 'add';
          }
        }
      });
      
      /* 載入上次設定或預設設定 */
      function loadInitialSettings() {
        const lastSelected = getSettingsFromLocal('lastSelectedPreset');
        if (lastSelected) {
          const settings = getSettingsFromLocal('preset_' + lastSelected);
          if (settings) {
            applySavedSettings(settings);
            return;
          }
        }
        
        const tempSettings = getSettingsFromLocal('_current_temp_settings');
        if (tempSettings) {
          applySavedSettings(tempSettings);
          return;
        }
        
        applySavedSettings(defaultSettings);
      }
      
      /* 防止標籤文字被選取 */
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
      
      /* 將函數掛載到 window 物件 */
      window.barcodeEditor = {
        updateStyles,
        saveCurrentSettings,
        applySavedSettings,
        showNotification,
        updateLogos,
        initialPageSettings
      };
    }, 100);
  }, 0);
  
  /* 初始化拖曳功能 */
  function initDragFunction() {
    const panel = document.getElementById('bv-barcode-control-panel');
    const header = panel.querySelector('.bv-panel-header');
    
    if (!panel || !header) return;
    
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    const transform = panel.style.transform;
    if (transform) {
      const match = transform.match(/translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/);
      if (match) {
        xOffset = parseFloat(match[1]);
        yOffset = parseFloat(match[2]);
      }
    }
    
    function dragStart(e) {
      if (e.target.closest('.bv-glass-button') || e.target.closest('.bv-minimize-btn')) return;
      
      if (e.type === "touchstart") {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
      } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
      }
      
      if (e.target === header || (header.contains(e.target) && !e.target.closest('.bv-glass-button'))) {
        isDragging = true;
        panel.style.transition = 'none';
        e.preventDefault();
      }
    }
    
    function dragEnd(e) {
      if (!isDragging) return;
      
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      panel.style.transition = '';
      
      chrome.storage.local.set({
        bvPanelPosition: {
          x: xOffset,
          y: yOffset
        }
      });
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
        
        setTranslate(currentX, currentY, panel);
      }
    }
    
    function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }
    
    chrome.storage.local.get(['bvPanelPosition'], (result) => {
      if (result.bvPanelPosition) {
        xOffset = result.bvPanelPosition.x;
        yOffset = result.bvPanelPosition.y;
        setTranslate(xOffset, yOffset, panel);
      }
    });
    
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    header.addEventListener('touchstart', dragStart, { passive: false });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', dragEnd);
  }
})();
