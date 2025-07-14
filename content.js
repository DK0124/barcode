javascript:(function(){
  /* BV SHOP 條碼列印排版器 - 響應式完整版（底圖版本） */
  
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

  /* 初始頁面樣式儲存變數 */
  let initialPageSettings = null;

  /* 動態抓取 BV SHOP 原生樣式 - 改進版本 */
  function getBVShopNativeSettings() {
    try {
      const sample = document.querySelector('.print_sample');
      if (!sample) return null;
      
      // 抓取實際的計算樣式
      const getComputedValue = (element, property) => {
        if (!element) return null;
        return window.getComputedStyle(element)[property];
      };
      
      // 轉換像素到 mm
      const pxToMm = (px) => {
        const dpi = 96; // 標準螢幕 DPI
        const bodyZoom = parseFloat(getComputedValue(document.body, 'zoom')) || 1;
        return (px * 25.4) / dpi / bodyZoom;
      };
      
      const info = sample.querySelector('.spec_info');
      const main = info?.querySelector('.main');
      const sub = info?.querySelector('.sub');
      const barcodeArea = sample.querySelector('.spec_barcode');
      const barcodeImg = barcodeArea?.querySelector('img');
      const barcodeText = barcodeArea?.querySelector('.sub');
      
      // 取得實際的標籤尺寸
      const sampleStyles = window.getComputedStyle(sample);
      const sampleWidth = parseFloat(sampleStyles.width);
      const sampleHeight = parseFloat(sampleStyles.height);
      const samplePaddingTop = parseFloat(sampleStyles.paddingTop);
      const samplePaddingRight = parseFloat(sampleStyles.paddingRight);
      const samplePaddingBottom = parseFloat(sampleStyles.paddingBottom);
      const samplePaddingLeft = parseFloat(sampleStyles.paddingLeft);
      
      // 計算平均內距
      const avgPadding = (samplePaddingTop + samplePaddingRight + samplePaddingBottom + samplePaddingLeft) / 4;
      
      // 取得實際條碼尺寸
      let barcodeHeightPercent = 40; // 預設值
      let barcodeWidthPercent = 90;  // 預設值
      
      if (barcodeImg) {
        const barcodeImgStyles = window.getComputedStyle(barcodeImg);
        const barcodeImgHeight = parseFloat(barcodeImgStyles.height);
        const barcodeImgWidth = parseFloat(barcodeImgStyles.width);
        
        // 計算可用空間
        const availableHeight = sampleHeight - samplePaddingTop - samplePaddingBottom;
        const availableWidth = sampleWidth - samplePaddingLeft - samplePaddingRight;
        
        // 計算百分比
        if (availableHeight > 0) {
          barcodeHeightPercent = Math.round((barcodeImgHeight / availableHeight) * 100);
        }
        if (availableWidth > 0) {
          barcodeWidthPercent = Math.round((barcodeImgWidth / availableWidth) * 100);
        }
      }
      
      // 取得字體相關樣式
      const mainStyles = main ? window.getComputedStyle(main) : null;
      const subStyles = sub ? window.getComputedStyle(sub) : null;
      const barcodeTextStyles = barcodeText ? window.getComputedStyle(barcodeText) : null;
      
      // 提取字體家族
      const extractFontFamily = (computedFont) => {
        // 移除引號並清理字體字串
        return computedFont ? computedFont.replace(/['"]/g, '').trim() : 'Arial, sans-serif';
      };
      
      return {
        mainSize: mainStyles ? parseInt(mainStyles.fontSize) : 10,
        mainBold: mainStyles ? parseInt(mainStyles.fontWeight) >= 600 : true,
        mainGap: mainStyles ? parseInt(mainStyles.marginBottom) : 0,
        subSize: subStyles ? parseInt(subStyles.fontSize) : 8,
        subBold: subStyles ? parseInt(subStyles.fontWeight) >= 600 : true,
        barcodeTextSize: barcodeTextStyles ? parseInt(barcodeTextStyles.fontSize) : 8,
        barcodeTextBold: barcodeTextStyles ? parseInt(barcodeTextStyles.fontWeight) >= 600 : false,
        barcodeHeight: barcodeHeightPercent,
        barcodeWidth: barcodeWidthPercent,
        barcodeYPosition: 50, // 預設置中
        labelWidth: Math.round(pxToMm(sampleWidth)),
        labelHeight: Math.round(pxToMm(sampleHeight)),
        labelPadding: Math.round(pxToMm(avgPadding) * 10) / 10, // 保留一位小數
        textAlign: info ? getComputedValue(info, 'textAlign') : 'left',
        fontFamily: mainStyles ? extractFontFamily(mainStyles.fontFamily) : 'Arial, sans-serif',
        logoSize: 30,
        logoX: 50,
        logoY: 50,
        logoOpacity: 20,
        logoAspectRatio: 1
      };
    } catch (e) {
      console.error('無法抓取原生樣式:', e);
      return null;
    }
  }
  
  /* 建立基本樣式 */
  const style = document.createElement('style');
  style.innerHTML = `
    /* 響應式預設顯示 */
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
      overflow: hidden; /* 確保底圖不會超出邊界 */
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
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
      z-index: 99999;
      background: #ffffff;
      border: none;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06);
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", "Helvetica Neue", Arial, sans-serif;
      font-size: 14px;
      overflow: hidden;
      color: #1a1a1a;
      display: flex;
      flex-direction: column;
    }
    
    /* 手機版滑動把手 */
    .panel-drag-handle {
      display: ${shouldUseMobileLayout ? 'block' : 'none'};
      width: 100%;
      height: 30px;
      position: absolute;
      top: 0;
      left: 0;
      cursor: grab;
      z-index: 10;
      touch-action: pan-y;
    }
    
    .panel-drag-handle::before {
      content: '';
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 4px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 2px;
    }
    
    #barcode-control-panel:hover {
      box-shadow: 0 12px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08);
    }
    
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
      position: relative;
    }
    
    .panel-header h3 {
      margin: 0;
      font-size: ${shouldUseMobileLayout ? '17px' : '19px'};
      font-weight: 600;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    /* 手機版關閉按鈕 */
    .panel-close {
      display: ${shouldUseMobileLayout || isIPad ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .panel-close:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .panel-close .material-icons {
      font-size: 20px;
      color: white;
      vertical-align: middle;
      line-height: 1;
    }
    
    .panel-body {
      padding: ${shouldUseMobileLayout ? '20px' : '28px'};
      overflow-y: auto;
      flex: 1;
      max-height: ${shouldUseMobileLayout ? 'calc(80vh - 180px)' : 'calc(90vh - 220px)'};
      -webkit-overflow-scrolling: touch;
    }
    
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
      padding: ${shouldUseMobileLayout ? '10px 35px 10px 12px' : '11px 35px 11px 14px'};
      font-size: 14px;
      color: #24292e;
      transition: all 0.2s ease;
      font-weight: 500;
      min-width: ${shouldUseMobileLayout ? '100%' : 'auto'};
      margin-bottom: ${shouldUseMobileLayout ? '8px' : '0'};
      -webkit-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 20px;
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
      padding: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      width: 40px;
      height: 40px;
      flex-shrink: 0;
    }
    
    .icon-button:hover {
      background: #f8f9ff;
      border-color: #7289DA;
      transform: translateY(-1px);
    }
    
    .icon-button:active {
      transform: translateY(0);
    }
    
    .icon-button .material-icons {
      font-size: 20px;
      color: #5865F2;
      vertical-align: middle;
      line-height: 1;
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
      padding: 6px 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 16px;
      font-weight: 700;
      color: #6c757d;
      user-select: none;
      min-width: 36px;
    }
    
    .bold-button:hover {
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
    
    .bold-button.active:hover {
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
      padding: ${shouldUseMobileLayout ? '12px 16px' : '14px 18px'};
      background: #f8f9fa;
      border-radius: 12px;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
      margin-bottom: ${shouldUseMobileLayout ? '14px' : '18px'};
      border: 1px solid transparent;
    }
    
    .section-header:hover {
      background: #f0f2f5;
      border-color: #e8eaed;
    }
    
    .section-header h4 {
      margin: 0;
      font-size: ${shouldUseMobileLayout ? '14px' : '15px'};
      font-weight: 600;
      color: #24292e;
      display: flex;
      align-items: center;
      gap: ${shouldUseMobileLayout ? '8px' : '10px'};
    }
    
    /* Material Icons 對齊修正 */
    .section-icon {
      font-size: ${shouldUseMobileLayout ? '20px' : '22px'};
      background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      vertical-align: middle;
      line-height: 1;
      display: inline-flex;
      align-items: center;
    }
    
    .section-toggle {
      color: #6c757d;
      transition: transform 0.3s ease;
      font-size: ${shouldUseMobileLayout ? '22px' : '24px'};
      vertical-align: middle;
      line-height: 1;
      display: inline-flex;
      align-items: center;
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
      padding: ${shouldUseMobileLayout ? '16px' : '20px'};
      margin-bottom: ${shouldUseMobileLayout ? '14px' : '18px'};
      border: 1px solid #eef0f2;
    }
    
    .control-group:last-child {
      margin-bottom: 0;
    }
    
    .control-group-title {
      font-size: ${shouldUseMobileLayout ? '12px' : '13px'};
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
      font-size: ${shouldUseMobileLayout ? '13px' : '14px'};
    }
    
    .control-label-with-button {
      display: flex;
      align-items: center;
      gap: ${shouldUseMobileLayout ? '10px' : '12px'};
    }
    
    .value-badge {
      background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
      color: white;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      min-width: 50px;
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
      height: 6px;
      background: #e8eaed;
      border-radius: 3px;
      outline: none;
      -webkit-appearance: none;
      margin: 16px 0 8px 0;
      position: relative;
    }
    
    /* 為滑軌添加漸層效果 */
    input[type="range"]:before {
      content: '';
      position: absolute;
      height: 6px;
      border-radius: 3px;
      background: linear-gradient(90deg, #5865F2 0%, #7289DA 100%);
      width: var(--value, 0%);
      pointer-events: none;
    }
    
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: ${shouldUseMobileLayout ? '26px' : '22px'};
      height: ${shouldUseMobileLayout ? '26px' : '22px'};
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
      width: ${shouldUseMobileLayout ? '26px' : '22px'};
      height: ${shouldUseMobileLayout ? '26px' : '22px'};
      background: white;
      border: 3px solid #5865F2;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(88, 101, 242, 0.3);
      transition: all 0.2s ease;
      border: none;
    }
    
    select {
      width: 100%;
      padding: ${shouldUseMobileLayout ? '10px 35px 10px 12px' : '11px 35px 11px 14px'};
      border: 2px solid #e8eaed;
      border-radius: 10px;
      background: white;
      color: #24292e;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
      -webkit-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 20px;
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
      padding: ${shouldUseMobileLayout ? '14px 20px' : '16px 24px'};
      border-radius: 12px;
      font-size: ${shouldUseMobileLayout ? '15px' : '16px'};
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
      vertical-align: middle;
      line-height: 1;
    }
    
    .action-button span {
      position: relative;
      z-index: 1;
    }
    
    /* 輸入框樣式 */
    input[type="text"] {
      width: 100%;
      padding: ${shouldUseMobileLayout ? '10px 12px' : '11px 14px'};
      border: 2px solid #e8eaed;
      border-radius: 10px;
      font-size: 14px;
      transition: all 0.2s ease;
      font-weight: 500;
    }
    
    input[type="text"]:focus {
      outline: none;
      border-color: #5865F2;
      box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.1);
    }
    
    /* 小按鈕樣式 */
    .small-button {
      padding: ${shouldUseMobileLayout ? '7px 16px' : '8px 18px'};
      background: white;
      border: 2px solid #e8eaed;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .small-button:hover {
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
    
    .small-button.primary:hover {
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
        transform: ${shouldUseMobileLayout ? 'translateY(100%)' : 'translateX(20px)'};
      }
      to {
        opacity: 1;
        transform: ${shouldUseMobileLayout ? 'translateY(0)' : 'translateX(0)'};
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
      vertical-align: middle;
    }
    
    /* 分隔線樣式 */
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #e8eaed 50%, transparent 100%);
      margin: ${shouldUseMobileLayout ? '14px 0' : '18px 0'};
    }
    
    /* 提示文字 */
    .control-hint {
      font-size: 12px;
      color: #6c757d;
      margin-top: 6px;
      font-style: italic;
    }
    
    /* 底圖上傳樣式 */
    .logo-upload-area {
      border: 2px dashed #d4d7dd;
      border-radius: 12px;
      padding: ${shouldUseMobileLayout ? '20px' : '24px'};
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: linear-gradient(135deg, #fafbff 0%, #f5f6ff 100%);
      margin-bottom: 16px;
      position: relative;
      overflow: hidden;
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
    
    .logo-upload-area:hover {
      border-color: #7289DA;
      background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
    }
    
    .logo-upload-area:hover:before {
      opacity: 1;
      transform: rotate(45deg) translateY(100%);
    }
    
    .logo-upload-area.has-logo {
      border-style: solid;
      padding: 16px;
      background: white;
    }
    
    .logo-upload-area .material-icons {
      vertical-align: middle;
      line-height: 1;
    }
    
    .logo-preview {
      max-width: 100%;
      max-height: ${shouldUseMobileLayout ? '80px' : '100px'};
      margin: 0 auto;
      display: block;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    
    .upload-hint {
      color: #6c757d;
      font-size: ${shouldUseMobileLayout ? '12px' : '13px'};
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
    
    .remove-logo-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(240, 71, 71, 0.35);
    }
    
    .remove-logo-btn .material-icons {
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
      z-index: 1 !important; /* 在最底層 */
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
      ${!shouldUseMobileLayout ? `
        zoom: 0.5;
        -moz-transform: scale(0.5) translateX(-100%);
        -moz-transform-origin: center top;
      ` : ''}
    }
    
    .notification {
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(0, 0, 0, 0.1);
      padding: ${shouldUseMobileLayout ? '14px 24px' : '28px 48px'};
      border-radius: 20px;
      font-size: ${shouldUseMobileLayout ? '14px' : '28px'};
      font-weight: 500;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      animation: slideDown 0.3s ease-out;
      display: flex;
      align-items: center;
      gap: ${shouldUseMobileLayout ? '10px' : '20px'};
      white-space: nowrap;
    }
    
    .notification.success {
      border-left: 4px solid #10b981;
      color: #059669;
    }
    
    .notification.warning {
      border-left: 4px solid #f59e0b;
      color: #d97706;
    }
    
    .notification .material-icons {
      font-size: ${shouldUseMobileLayout ? '20px' : '40px'};
      vertical-align: middle;
      line-height: 1;
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
    }
    
    .mobile-toggle-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(88, 101, 242, 0.5);
    }
    
    .mobile-toggle-btn .material-icons {
      color: white;
      font-size: 28px;
      vertical-align: middle;
      line-height: 1;
    }
    
    /* 手機版面板隱藏狀態 */
    #barcode-control-panel.hidden {
      transform: ${shouldUseMobileLayout ? 'translateY(100%)' : 'translateX(100%)'};
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
    panel.id = 'barcode-control-panel';
    panel.className = shouldUseMobileLayout ? 'hidden' : '';
    panel.innerHTML = `
      ${shouldUseMobileLayout ? '<div class="panel-drag-handle"></div>' : ''}
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
            <button class="icon-button reset-button" id="reset-format" title="還原頁面原始樣式">
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
                <span>條碼圖片高度${shouldUseMobileLayout ? '' : '（相對可用高度）'}</span>
                <span class="value-badge" id="barcode-height">40%</span>
              </div>
              <input type="range" id="barcode-height-slider" min="20" max="80" value="40">
              
              <div class="control-label" style="margin-top: 20px;">
                <span>條碼圖片寬度${shouldUseMobileLayout ? '' : '（相對可用寬度）'}</span>
                <span class="value-badge" id="barcode-width">90%</span>
              </div>
              <input type="range" id="barcode-width-slider" min="50" max="100" value="90">
              
              <div class="control-label" style="margin-top: 20px;">
                <span>條碼垂直位置</span>
                <span class="value-badge" id="barcode-y-position">50%</span>
              </div>
              <input type="range" id="barcode-y-position-slider" min="0" max="100" value="50">
              <div class="control-hint">在可用空間內調整：0% = 最上方，100% = 最下方</div>
            </div>
            
            <!-- 間距設定 -->
            <div class="control-group">
              <div class="control-group-title">間距設定</div>
              <div class="control-label">
                <span>商品名稱與其他資訊間距</span>
                <span class="value-badge" id="main-gap">1px</span>
              </div>
              <input type="range" id="main-gap-slider" min="0" max="10" step="0.5" value="1">
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
                  <span class="material-icons">delete</span>
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
        }
      });
    }

    /* 手機版滑動關閉功能 */
    if (shouldUseMobileLayout) {
      const dragHandle = panel.querySelector('.panel-drag-handle');
      let startY = 0;
      let currentY = 0;
      let isDragging = false;

      dragHandle.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
        panel.style.transition = 'none';
      });

      dragHandle.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        if (deltaY > 0) {
          panel.style.transform = `translateY(${deltaY}px)`;
        }
      });

      dragHandle.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        panel.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        const deltaY = currentY - startY;
        if (deltaY > 100) {
          panel.classList.add('hidden');
          panel.style.transform = '';
        } else {
          panel.style.transform = '';
        }
      });
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
          
          /* 儲存折疊狀態 */
          saveSectionState(section, this.classList.contains('collapsed'));
        });
      });
      
      /* 載入折疊狀態 */
      function loadSectionStates() {
        const states = getSettingsFromLocal('sectionStates') || {};
        Object.keys(states).forEach(section => {
          const header = document.querySelector(`[data-section="${section}"]`);
          const content = document.getElementById(section + '-content');
          if (header && content && states[section]) {
            header.classList.add('collapsed');
            content.classList.add('collapsed');
          }
        });
      }
      
      function saveSectionState(section, collapsed) {
        const states = getSettingsFromLocal('sectionStates') || {};
        states[section] = collapsed;
        saveSettingsToLocal('sectionStates', states);
      }
      
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
      const barcodeYPosition = document.getElementById('barcode-y-position-slider');
      
      const labelWidth = document.getElementById('label-width-slider');
      const labelHeight = document.getElementById('label-height-slider');
      const labelPadding = document.getElementById('label-padding-slider');
      const textAlign = document.getElementById('text-align');
      const fontFamily = document.getElementById('font-family-select');
      
      /* 預設值：使用初始頁面樣式或備用預設值 */
      const defaultSettings = initialPageSettings || {
        mainSize: 10,
        mainBold: true,
        mainGap: 0,
        subSize: 8,
        subBold: true,
        barcodeTextSize: 8,
        barcodeTextBold: false,
        barcodeHeight: 40,
        barcodeWidth: 90,
        barcodeYPosition: 50,
        labelWidth: 40,
        labelHeight: 26,
        labelPadding: 1,
        textAlign: 'left',
        fontFamily: 'Arial, sans-serif',
        logoSize: 30,
        logoX: 50,
        logoY: 50,
        logoOpacity: 20,
        logoAspectRatio: 1
      };

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
        if (!mainSize || !subSize) return;
        
        /* 計算行高 */
        const mainLineHeight = calculateLineHeight(mainSize.value);
        const subLineHeight = calculateLineHeight(subSize.value);
        
        /* 獲取字體粗細值 */
        const mainFontWeight = mainBoldBtn && mainBoldBtn.classList.contains('active') ? 700 : 500;
        const subFontWeight = subBoldBtn && subBoldBtn.classList.contains('active') ? 700 : 500;
        const barcodeTextFontWeight = barcodeTextBoldBtn && barcodeTextBoldBtn.classList.contains('active') ? 700 : 500;
        
        /* 計算可用空間（扣除內距） */
        const totalWidth = parseFloat(labelWidth.value);
        const totalHeight = parseFloat(labelHeight.value);
        const paddingValue = parseFloat(labelPadding.value);
        const availableWidth = totalWidth - (paddingValue * 2);
        const availableHeight = totalHeight - (paddingValue * 2);
        
        /* 計算條碼實際尺寸（基於可用空間的百分比） */
        const barcodeActualHeight = (availableHeight * parseFloat(barcodeHeight.value) / 100).toFixed(1);
        const barcodeActualWidth = (availableWidth * parseFloat(barcodeWidth.value) / 100).toFixed(1);
        
        /* 計算條碼Y軸位置 */
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
        
        /* Logo 顯示值更新 */
        if (logoSizeSlider) {
          document.getElementById('logo-size').textContent = logoSizeSlider.value + '%';
          document.getElementById('logo-x').textContent = logoXSlider.value + '%';
          document.getElementById('logo-y').textContent = logoYSlider.value + '%';
          document.getElementById('logo-opacity').textContent = logoOpacitySlider.value + '%';
        }
        
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
          
          /* 文字區域高度 - 使用自動高度 */
          html .print_barcode_area .print_sample .spec_info,
          body .print_barcode_area .print_sample .spec_info {
            height: auto !important;
            margin-bottom: 0 !important;
            overflow: visible !important;
            display: block !important;
          }
          
          /* 條碼區域 - 使用 flexbox 來控制位置 */
          html .print_barcode_area .print_sample .spec_barcode,
          body .print_barcode_area .print_sample .spec_barcode {
            height: auto !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            overflow: visible !important;
            position: relative !important;
            /* 根據 Y 位置調整對齊 */
            justify-content: ${
              barcodeYPercent <= 20 ? 'flex-start' :
              barcodeYPercent >= 80 ? 'flex-end' : 'center'
            } !important;
          }
          
          /* 確保整體使用 flexbox 佈局 */
          .print_barcode_area .print_sample {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
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
            white-space: normal !important;
            word-break: break-all !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
          }
          
          /* 規格/編號/價格樣式 - 統一設定 */
          .print_barcode_area .print_sample .spec_info .sub {
            font-size: ${subSize.value}px !important;
            line-height: ${subLineHeight}px !important;
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
          
          /* 條碼圖片 - 直接拉伸圖片尺寸 */
          .print_barcode_area .print_sample .spec_barcode img {
            height: ${barcodeActualHeight}mm !important;
            width: ${barcodeActualWidth}mm !important;
            max-width: none !important;
            max-height: none !important;
            object-fit: fill !important; /* 強制拉伸到指定尺寸 */
            display: block !important;
            margin: 0 auto !important;
            position: relative !important;
            /* 微調 Y 軸位置 */
            ${barcodeYPosition ? `
              transform: translateY(${(barcodeYPercent - 50) * 0.1}mm) !important;
            ` : ''}
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
        barcodeTextSize, barcodeHeight, barcodeWidth, barcodeYPosition,
        labelWidth, labelHeight, labelPadding, textAlign, fontFamily,
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
      
      /* 清除格式按鈕功能 - 還原到頁面初始樣式 */
      const resetFormatBtn = document.getElementById('reset-format');
      if (resetFormatBtn) {
        resetFormatBtn.addEventListener('click', function() {
          if (confirm('確定要將所有設定還原到此頁面的原始樣式嗎？\n\n此操作無法復原。')) {
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
            
            /* 使用儲存的初始頁面樣式 */
            if (initialPageSettings) {
              applySavedSettings(initialPageSettings);
              showNotification('已還原到此頁面的原始樣式');
            } else {
              /* 如果沒有初始樣式，嘗試重新抓取 */
              const currentNativeSettings = getBVShopNativeSettings();
              if (currentNativeSettings) {
                applySavedSettings(currentNativeSettings);
                showNotification('已還原到當前頁面樣式');
              } else {
                /* 使用備用預設值 */
                applySavedSettings(defaultSettings);
                showNotification('已還原到預設值');
              }
            }
            
            /* 清除預設檔選擇 */
            const presetSelect = document.getElementById('preset-select');
            if (presetSelect) {
              presetSelect.value = '';
            }
            
            /* 清除最後選擇的預設檔記錄 */
            try {
              localStorage.removeItem('bvShopBarcode_lastSelectedPreset');
              sessionStorage.removeItem('bvShopBarcode_lastSelectedPreset');
            } catch (e) {
              console.warn('無法清除記錄');
            }
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
          subSize: subSize.value,
          subBold: subBoldBtn ? subBoldBtn.classList.contains('active') : true,
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
        if (barcodeYPosition) {
          barcodeYPosition.value = settings.barcodeYPosition || defaultSettings.barcodeYPosition || 50;
        }
        
        labelWidth.value = settings.labelWidth || defaultSettings.labelWidth;
        labelHeight.value = settings.labelHeight || defaultSettings.labelHeight;
        labelPadding.value = settings.labelPadding || defaultSettings.labelPadding;
        textAlign.value = settings.textAlign || defaultSettings.textAlign;
        fontFamily.value = settings.fontFamily || defaultSettings.fontFamily;
        
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
        
        const icon = document.createElement('span');
        icon.className = 'material-icons';
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
      loadSectionStates();
      loadInitialSettings();
      updateStyles();
      
      /* 將函數掛載到 window 物件，讓外部可以訪問 */
      window.barcodeEditor = {
        updateStyles,
        saveCurrentSettings,
        applySavedSettings,
        showNotification,
        updateLogos,
        initialPageSettings
      };
    }, 100); /* 延遲 100ms 確保所有元素都已載入 */
  }, 0); /* 延遲執行確保 DOM 載入完成 */
})();
