javascript:(function(){
  /* BV SHOP 條碼列印排版器 - 可拖曳調整版 v6 */
  
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
    { name: '思源黑體', value: '"Noto Sans TC", sans-serif' },
    { name: '系統預設', value: 'Arial, sans-serif' },
    { name: '微軟正黑體', value: 'Microsoft JhengHei, 微軟正黑體, sans-serif' },
    { name: '蘋方體', value: 'PingFang TC, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif' }
  ];

  /* 預設尺寸選項及對應的優化設定 */
  const presetSizes = [
    { 
      name: '40×30mm', 
      width: 40, 
      height: 30,
      type: 'standard',
      settings: {
        mainSize: 10,
        subSize: 8,
        barcodeTextSize: 8,
        barcodeTextLineHeight: 10,
        barcodeHeight: 100,
        barcodeWidth: 100,
        mainLineHeight: 11,
        subLineHeight: 9
      }
    },
    { 
      name: '60×30mm', 
      width: 60, 
      height: 30,
      type: 'standard',
      settings: {
        mainSize: 11,
        subSize: 9,
        barcodeTextSize: 9,
        barcodeTextLineHeight: 11,
        barcodeHeight: 100,
        barcodeWidth: 100,
        mainLineHeight: 12,
        subLineHeight: 10
      }
    },
    { 
      name: 'Brother大標籤', 
      width: 42, 
      height: 29,
      type: 'brother',
      settings: {
        mainSize: 10,
        subSize: 8,
        barcodeTextSize: 8,
        barcodeTextLineHeight: 10,
        barcodeHeight: 110,
        barcodeWidth: 100,
        mainLineHeight: 11,
        subLineHeight: 9
      }
    },
    { 
      name: 'Brother小標籤', 
      width: 29, 
      height: 20,
      type: 'brother',
      settings: {
        mainSize: 4,
        subSize: 4,
        barcodeTextSize: 4,
        barcodeTextLineHeight: 4,
        barcodeHeight: 35,
        barcodeWidth: 100,
        mainLineHeight: 4,
        subLineHeight: 4
      }
    }
  ];

  /* 初始變數 */
  let isDragMode = false;
  let isPanelMinimized = false;
  let collapsedSections = {};
  let selectedElement = null;
  let draggedElement = null;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let elementPositions = {}; // 儲存每個元素的位置

  /* 預設值物件 */
  const completeDefaultSettings = {
    mainSize: 10,
    mainBold: true,
    mainGap: 0,
    mainLineHeight: 11,
    subSize: 8,
    subBold: true,
    subLineHeight: 9,
    barcodeTextSize: 8,
    barcodeTextBold: true,
    barcodeTextLineHeight: 10,
    barcodeHeight: 100,
    barcodeWidth: 100,
    barcodeYPosition: 70,
    priceGap: 0,
    labelWidth: 40,
    labelHeight: 30,
    fontFamily: 'Arial, sans-serif',
    logoSize: 30,
    logoX: 50,
    logoY: 50,
    logoOpacity: 20
  };

  /* 儲存原始資料 */
  let productData = [];
  
  /* 建立動態樣式元素 */
  const dynamicStyle = document.createElement('style');
  document.head.appendChild(dynamicStyle);

  /* Logo 相關變數 */
  let logoDataUrl = null;
  let logoAspectRatio = 1;

  /* 抓取頁面資料 */
  function extractProductData() {
    productData = [];
    
    document.querySelectorAll('.print_sample').forEach((sample, index) => {
      const data = {
        productName: '',
        spec: '',
        price: '',
        specialPrice: '',
        productCode: '',
        sku: '',
        barcodeImage: '',
        barcodeNumber: ''
      };
      
      // 抓取商品名稱
      const mainElement = sample.querySelector('.spec_info .main, .main');
      if (mainElement) {
        data.productName = mainElement.textContent.trim();
      }
      
      // 抓取所有 sub 元素
      const subElements = sample.querySelectorAll('.sub');
      let specFound = false;
      let priceFound = false;
      
      subElements.forEach((sub) => {
        const text = sub.textContent.trim();
        
        // 檢查是否為條碼數字
        if (sub.closest('.spec_barcode')) {
          if (/\d{5,}/.test(text) && !text.includes('$')) {
            data.barcodeNumber = text;
          } else if (text.includes('售價') || text.includes('特價')) {
            if (text.includes('特價')) {
              data.specialPrice = text;
            } else {
              data.price = text;
            }
            priceFound = true;
          }
        } else {
          // 不在條碼區域的 sub 元素
          if (!specFound && text.includes('/') && !text.includes('$')) {
            data.spec = text;
            specFound = true;
          } 
          else if (!data.sku && text !== data.spec && 
                   text.match(/^[A-Za-z0-9\-_]{3,20}$/) && 
                   !text.includes('$') && 
                   !text.includes('售價') && 
                   !text.includes('特價') &&
                   !text.includes('/') &&
                   !/^\d{10,}$/.test(text)) {
            data.sku = text;
            data.productCode = text;
          }
          else if (!priceFound) {
            if (text.includes('特價')) {
              data.specialPrice = text;
            } else if (text.includes('售價')) {
              data.price = text;
            }
          }
        }
      });
      
      // 抓取條碼圖片
      const barcodeImg = sample.querySelector('.spec_barcode img, img[alt="barcode"]');
      if (barcodeImg) {
        data.barcodeImage = barcodeImg.src;
      }
      
      productData.push(data);
    });
  }
  
  /* 驗證行高合理性 */
  function validateLineHeight(fontSize, lineHeight) {
    const minLineHeight = Math.ceil(fontSize * 1.0);
    return Math.max(parseInt(lineHeight), minLineHeight);
  }
  
  /* 計算建議的行高 */
  function calculateSuggestedLineHeight(fontSize) {
    const size = parseInt(fontSize);
    if (size <= 5) {
      return size;
    } else if (size <= 6) {
      return Math.round(size * 1.1);
    } else if (size <= 8) {
      return Math.round(size * 1.15);
    } else {
      return Math.round(size * 1.2);
    }
  }
  
  /* 建立基本樣式 */
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
    
    /* 預覽區域容器 */
    .bv-preview-container {
      transform: scale(2);
      transform-origin: top left;
      width: 50%;
      margin: 0;
      padding: 20px;
      background: #f0f0f0;
    }
    
    /* body 保持原始大小 */
    body {
      margin: 0;
      padding: 0;
      background: #f0f0f0;
      overflow-x: auto;
    }
    
    /* 隱藏原本的列印按鈕 */
    body > button.no-print {
      display: none !important;
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
      overflow: hidden !important;
    }
    
    /* 拖曳模式樣式 */
    body.bv-drag-mode {
      cursor: move;
    }
    
    body.bv-drag-mode .print_sample {
      border: 2px dashed #518aff;
    }
    
    /* 可拖曳元素 */
    .bv-draggable {
      position: absolute !important;
      cursor: move;
      transition: none !important;
      z-index: 10;
    }
    
    .bv-draggable:hover {
      outline: 2px solid #518aff;
      outline-offset: 2px;
    }
    
    .bv-draggable.dragging {
      opacity: 0.8;
      z-index: 1000;
      cursor: grabbing;
    }
    
    .bv-draggable.selected {
      outline: 2px solid #0071e3;
      outline-offset: 2px;
    }
    
    /* 參考線 */
    .bv-guide-line {
      position: absolute;
      background: #0071e3;
      opacity: 0.5;
      pointer-events: none;
      z-index: 999;
    }
    
    .bv-guide-line.horizontal {
      height: 1px;
      left: 0;
      right: 0;
    }
    
    .bv-guide-line.vertical {
      width: 1px;
      top: 0;
      bottom: 0;
    }
    
    /* 邊界指示器 */
    .bv-margin-indicator {
      position: absolute;
      border: 1px dashed #ff3b30;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    body.bv-drag-mode .bv-margin-indicator {
      opacity: 0.5;
    }
    
    /* 座標提示 */
    .bv-position-tooltip {
      position: absolute;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      pointer-events: none;
      z-index: 10000;
      white-space: nowrap;
      display: none;
    }
    
    /* 對齊按鈕群組 */
    .bv-align-buttons {
      display: flex;
      gap: 4px;
      margin-top: 12px;
      padding: 8px;
      background: rgba(248, 250, 252, 0.8);
      border-radius: 8px;
    }
    
    .bv-align-btn {
      flex: 1;
      padding: 8px;
      background: rgba(255, 255, 255, 0.8);
      border: 0.5px solid rgba(0, 0, 0, 0.12);
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    
    .bv-align-btn:hover {
      background: rgba(81, 138, 255, 0.1);
      border-color: rgba(81, 138, 255, 0.3);
    }
    
    .bv-align-btn .material-icons {
      font-size: 18px;
      color: #666;
    }
    
    /* 拖曳模式切換按鈕 */
    .bv-drag-mode-toggle {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s;
      margin-bottom: 16px;
      box-shadow: 0 3px 12px rgba(255, 107, 107, 0.3);
    }
    
    .bv-drag-mode-toggle:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
    }
    
    .bv-drag-mode-toggle.active {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: 0 3px 12px rgba(16, 185, 129, 0.3);
    }
    
    .bv-drag-mode-toggle.active:hover {
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    }
    
    .bv-drag-mode-toggle .material-icons {
      font-size: 20px;
    }
    
    @media print {
      .bv-preview-container {
        transform: scale(1) !important;
        width: 100% !important;
        padding: 0 !important;
        background: white !important;
      }
      
      body {
        background: white !important;
      }
      
      .print_sample {
        box-shadow: none !important;
        border: none !important;
        margin-bottom: 0 !important;
        border-radius: 0 !important;
        transform: none !important;
      }
      
      .bv-draggable {
        outline: none !important;
      }
      
      .bv-guide-line,
      .bv-margin-indicator,
      .bv-position-tooltip {
        display: none !important;
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
  
    /* 主面板樣式 */
    #bv-barcode-control-panel {
      position: fixed;
      right: 24px;
      top: 24px;
      bottom: 24px;
      width: 360px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Noto Sans TC', sans-serif;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .bv-glass-panel {
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(24px) saturate(140%);
      -webkit-backdrop-filter: blur(24px) saturate(140%);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.75);
      box-shadow: 
        0 10px 40px rgba(0, 0, 0, 0.05),
        0 0 0 0.5px rgba(255, 255, 255, 0.6) inset,
        0 0 60px rgba(255, 255, 255, 0.4);
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
      bottom: 32px;
      right: 32px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #518aff 0%, #0040ff 100%);
      color: white;
      border: none;
      border-radius: 30px;
      box-shadow: 
        0 4px 24px rgba(81, 138, 255, 0.3),
        0 0 0 0.5px rgba(255, 255, 255, 0.2),
        inset 0 0 0 0.5px rgba(255, 255, 255, 0.3);
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .bv-floating-button:hover {
      transform: scale(1.05) translateY(-2px);
      box-shadow: 
        0 8px 32px rgba(81, 138, 255, 0.4),
        0 0 0 0.5px rgba(255, 255, 255, 0.3),
        inset 0 0 0 0.5px rgba(255, 255, 255, 0.4);
    }
    
    .bv-floating-button:active {
      transform: scale(0.98);
    }
    
    .bv-floating-button .material-icons {
      font-size: 26px;
    }
    
    #bv-barcode-control-panel.minimized ~ .bv-floating-button {
      display: flex;
    }
    
    /* 面板標題 */
    .bv-panel-header {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
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
      gap: 16px;
      flex: 1;
    }
    
    .bv-icon-wrapper {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #518aff 0%, #0040ff 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 
        0 2px 8px rgba(81, 138, 255, 0.2),
        inset 0 0 0 0.5px rgba(255, 255, 255, 0.2);
    }
    
    .bv-icon-wrapper .material-icons {
      font-size: 22px;
    }
    
    .bv-title-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .bv-panel-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #000;
      letter-spacing: -0.02em;
    }
    
    .bv-panel-subtitle {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.5);
      font-weight: 400;
    }
    
    /* Glass 按鈕 */
    .bv-glass-button {
      width: 32px;
      height: 32px;
      background: rgba(0, 0, 0, 0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      color: rgba(0, 0, 0, 0.7);
    }
    
    .bv-glass-button:hover {
      background: rgba(0, 0, 0, 0.05);
      transform: scale(1.04);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    
    .bv-glass-button:active {
      transform: scale(0.96);
    }
    
    .bv-glass-button .material-icons {
      font-size: 20px;
    }
    
    .bv-glass-button.bv-primary {
      background: rgba(81, 138, 255, 0.08);
      color: #518aff;
      border-color: rgba(81, 138, 255, 0.15);
    }
    
    .bv-glass-button.bv-primary:hover {
      background: rgba(81, 138, 255, 0.12);
    }
    
    /* 內容區域 */
    .bv-panel-content-wrapper {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }
    
    .bv-panel-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
      -webkit-overflow-scrolling: touch;
    }
    
    /* 主要操作區 */
    .bv-primary-section {
      margin-bottom: 28px;
    }
    
    .bv-reset-button {
      width: 100%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      box-shadow: 
        0 3px 12px rgba(16, 185, 129, 0.25),
        inset 0 0 0 0.5px rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      color: white;
      margin-bottom: 16px;
    }
    
    .bv-reset-button:hover {
      transform: translateY(-1px);
      box-shadow: 
        0 6px 20px rgba(16, 185, 129, 0.35),
        inset 0 0 0 0.5px rgba(255, 255, 255, 0.3);
    }
    
    .bv-reset-button:active {
      transform: translateY(0);
    }
    
    .bv-button-icon {
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .bv-button-icon .material-icons {
      font-size: 26px;
    }
    
    .bv-button-content {
      flex: 1;
      text-align: left;
    }
    
    .bv-button-title {
      display: block;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 2px;
      letter-spacing: -0.01em;
    }
    
    .bv-button-subtitle {
      display: block;
      font-size: 13px;
      opacity: 0.8;
    }
    
    /* 設定卡片 */
    .bv-settings-card {
      background: rgba(248, 250, 252, 0.5);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }
    
    .bv-settings-card:hover {
      background: rgba(248, 250, 252, 0.7);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    }
    
    .bv-settings-card.collapsed {
      padding-bottom: 20px;
    }
    
    .bv-settings-card.collapsed .bv-card-content {
      display: none;
    }
    
    .bv-card-title {
      margin: 0 0 20px 0;
      font-size: 14px;
      font-weight: 600;
      color: #000;
      display: flex;
      align-items: center;
      gap: 8px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      cursor: pointer;
      user-select: none;
    }
    
    .bv-settings-card.collapsed .bv-card-title {
      margin-bottom: 0;
    }
    
    .bv-card-title .material-icons {
      font-size: 18px;
      color: rgba(0, 0, 0, 0.5);
    }
    
    .bv-card-title .bv-collapse-icon {
      margin-left: auto;
      transition: transform 0.3s ease;
    }
    
    .bv-settings-card.collapsed .bv-card-title .bv-collapse-icon {
      transform: rotate(-90deg);
    }
    
    .bv-card-content {
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
    
    /* 預設尺寸按鈕 */
    .bv-preset-sizes {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    
    .bv-preset-size-btn {
      flex: 1;
      min-width: calc(50% - 4px);
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      border: 0.5px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.8);
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }
    
    .bv-preset-size-btn[data-type="brother"] {
      background: rgba(1, 72, 152, 0.08);
      border-color: rgba(1, 72, 152, 0.15);
      color: #014898;
    }
    
    .bv-preset-size-btn:hover {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(0, 0, 0, 0.16);
      color: #518aff;
    }
    
    .bv-preset-size-btn[data-type="brother"]:hover {
      background: rgba(1, 72, 152, 0.12);
      border-color: rgba(1, 72, 152, 0.2);
    }
    
    .bv-preset-size-btn.active {
      background: linear-gradient(135deg, #518aff 0%, #0040ff 100%);
      color: white;
      border-color: transparent;
      box-shadow: 
        0 2px 8px rgba(81, 138, 255, 0.25),
        inset 0 0 0 0.5px rgba(255, 255, 255, 0.2);
    }
    
    .bv-preset-size-btn[data-type="brother"].active {
      background: linear-gradient(135deg, #014898 0%, #003070 100%);
      box-shadow: 
        0 2px 8px rgba(1, 72, 152, 0.25),
        inset 0 0 0 0.5px rgba(255, 255, 255, 0.2);
    }
    
    /* Glass Slider */
    .bv-slider-group {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .bv-slider-item {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .bv-slider-item.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
    
    .bv-slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: #000;
    }
    
    .bv-value-label {
      background: rgba(81, 138, 255, 0.08);
      color: #518aff;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', monospace;
      min-width: 48px;
      text-align: center;
    }
    
    .bv-glass-slider {
      -webkit-appearance: none;
      width: 100%;
      height: 6px;
      background: rgba(0, 0, 0, 0.06);
      border-radius: 3px;
      outline: none;
      position: relative;
      cursor: pointer;
      margin: 12px 0;
    }
    
    .bv-glass-slider:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    
    .bv-glass-slider:before {
      content: '';
      position: absolute;
      height: 6px;
      border-radius: 3px;
      background: #518aff;
      width: var(--value, 0%);
      pointer-events: none;
    }
    
    .bv-glass-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 
        0 1px 4px rgba(0, 0, 0, 0.15),
        0 0 0 0.5px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
      position: relative;
      z-index: 1;
    }
    
    .bv-glass-slider:disabled::-webkit-slider-thumb {
      cursor: not-allowed;
    }
    
    .bv-glass-slider::-webkit-slider-thumb:hover {
      transform: scale(1.1);
      box-shadow: 
        0 2px 8px rgba(0, 0, 0, 0.2),
        0 0 0 0.5px rgba(0, 0, 0, 0.08);
    }
    
    .bv-glass-slider:disabled::-webkit-slider-thumb:hover {
      transform: scale(1);
    }
    
    .bv-glass-slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
      border: none;
    }
    
    /* Glass Select */
    .bv-glass-select {
      width: 100%;
      height: 36px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      border: 0.5px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      padding: 0 12px;
      font-size: 14px;
      color: #000;
      cursor: pointer;
      transition: all 0.2s ease;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23666666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 32px;
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
      backdrop-filter: blur(20px);
      border: 0.5px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      padding: 8px 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 16px;
      font-weight: 700;
      color: rgba(0, 0, 0, 0.5);
      user-select: none;
      min-width: 40px;
    }
    
    .bv-bold-button:hover {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(0, 0, 0, 0.16);
      color: #518aff;
    }
    
    .bv-bold-button.active {
      background: linear-gradient(135deg, #518aff 0%, #0040ff 100%);
      color: white;
      border-color: transparent;
      box-shadow: 
        0 2px 8px rgba(81, 138, 255, 0.25),
        inset 0 0 0 0.5px rgba(255, 255, 255, 0.2);
    }
    
    .bv-bold-button.active:hover {
      transform: scale(1.05);
      box-shadow: 
        0 4px 12px rgba(81, 138, 255, 0.35),
        inset 0 0 0 0.5px rgba(255, 255, 255, 0.3);
    }
    
    /* 設定項目 */
    .bv-setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 0;
      border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
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
      gap: 12px;
      flex: 1;
    }
    
    .bv-setting-label {
      font-size: 14px;
      font-weight: 500;
      color: #000;
      letter-spacing: -0.01em;
    }
    
    /* 預設管理 */
    .bv-preset-controls {
      display: flex;
      gap: 8px;
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
      gap: 8px;
      margin-top: 12px;
    }
    
    .bv-glass-input {
      flex: 1;
      height: 36px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      border: 0.5px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      padding: 0 12px;
      font-size: 14px;
      color: #000;
      transition: all 0.2s ease;
    }
    
    .bv-glass-input::placeholder {
      color: rgba(0, 0, 0, 0.4);
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
      padding: 16px 24px 24px;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px);
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      flex-shrink: 0;
    }
    
    .bv-glass-action-button {
      width: 100%;
      height: 48px;
      background: linear-gradient(135deg, #518aff 0%, #0040ff 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      box-shadow: 
        0 3px 12px rgba(81, 138, 255, 0.25),
        inset 0 0 0 0.5px rgba(255, 255, 255, 0.2);
      letter-spacing: -0.01em;
    }
    
    .bv-glass-action-button:hover {
      transform: translateY(-1px);
      box-shadow: 
        0 6px 20px rgba(81, 138, 255, 0.35),
        inset 0 0 0 0.5px rgba(255, 255, 255, 0.3);
    }
    
    .bv-glass-action-button:active {
      transform: translateY(0);
    }
    
    .bv-glass-action-button .material-icons {
      font-size: 22px;
    }
    
    /* 滾動條 */
    .bv-panel-body::-webkit-scrollbar {
      width: 6px;
    }
    
    .bv-panel-body::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .bv-panel-body::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 6px;
      transition: background 0.2s ease;
    }
    
    .bv-panel-body::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.25);
    }
    
    /* 通知 */
    .bv-notification {
      position: fixed;
      top: 32px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(50px) saturate(180%);
      -webkit-backdrop-filter: blur(50px) saturate(180%);
      padding: 16px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.12),
        0 0 0 0.5px rgba(0, 0, 0, 0.05),
        inset 0 0 0 0.5px rgba(255, 255, 255, 0.9);
      z-index: 100001;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideDown 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      letter-spacing: -0.01em;
    }
    
    .bv-notification.success {
      color: #248A3D;
    }
    
    .bv-notification.warning {
      color: #C04C00;
    }
    
    .bv-notification .material-icons {
      font-size: 20px;
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
      border: 2px dashed rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(248, 250, 252, 0.3);
      margin-bottom: 20px;
      position: relative;
      overflow: hidden;
    }
    
    .bv-logo-upload-area:hover {
      border-color: #518aff;
      background: rgba(81, 138, 255, 0.02);
    }
    
    .bv-logo-upload-area.has-logo {
      border-style: solid;
      padding: 20px;
      background: rgba(255, 255, 255, 0.6);
    }
    
    .bv-logo-upload-area .material-icons {
      vertical-align: middle;
      line-height: 1;
    }
    
    .bv-logo-preview {
      max-width: 100%;
      max-height: 120px;
      margin: 0 auto;
      display: block;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    
    .bv-upload-hint {
      color: rgba(0, 0, 0, 0.5);
      font-size: 14px;
      margin-top: 12px;
      font-weight: 500;
    }
    
    .bv-logo-controls {
      display: none;
    }
    
    .bv-logo-controls.active {
      display: block;
      animation: fadeIn 0.3s ease;
    }
    
    .bv-remove-logo-btn {
      background: linear-gradient(135deg, #FF3B30 0%, #D70015 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 20px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);
      display: inline-flex;
      align-items: center;
      gap: 8px;
      letter-spacing: -0.01em;
    }
    
    .bv-remove-logo-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 59, 48, 0.4);
    }
    
    .bv-remove-logo-btn .material-icons {
      font-size: 18px;
      vertical-align: middle;
      line-height: 1;
    }
    
    /* 底圖在標籤上的樣式 */
    .label-background-logo {
      position: absolute !important;
      z-index: 1 !important;
      pointer-events: none;
      object-fit: contain !important;
    }
    
    /* 防止選取 */
    .print_sample * {
      -webkit-touch-callout: none !important;
      -webkit-user-select: none !important;
      user-select: none !important;
    }
  `;
  document.head.appendChild(style);

  /* 包裝預覽區域 */
  const printBarcodeArea = document.querySelector('.print_barcode_area');
  if (printBarcodeArea) {
    const previewContainer = document.createElement('div');
    previewContainer.className = 'bv-preview-container';
    printBarcodeArea.parentNode.insertBefore(previewContainer, printBarcodeArea);
    previewContainer.appendChild(printBarcodeArea);
  }

  /* 建立座標提示 */
  const positionTooltip = document.createElement('div');
  positionTooltip.className = 'bv-position-tooltip';
  document.body.appendChild(positionTooltip);

  /* 初始化拖曳功能 */
  function initDragFeatures() {
    // 為每個標籤添加邊界指示器
    document.querySelectorAll('.print_sample').forEach((sample, index) => {
      const marginIndicator = document.createElement('div');
      marginIndicator.className = 'bv-margin-indicator';
      
      // 計算邊界
      const labelWidth = parseFloat(window.getComputedStyle(sample).width);
      const labelHeight = parseFloat(window.getComputedStyle(sample).height);
      const isBrother = labelWidth < 120; // 小於120px可能是Brother標籤
      const leftMargin = isBrother ? 15 : 11; // 4mm : 3mm (約略值)
      const otherMargin = 11; // 3mm
      
      marginIndicator.style.top = `${otherMargin}px`;
      marginIndicator.style.left = `${leftMargin}px`;
      marginIndicator.style.right = `${otherMargin}px`;
      marginIndicator.style.bottom = `${otherMargin}px`;
      
      sample.appendChild(marginIndicator);
    });
  }

  /* 使元素可拖曳 */
  function makeElementDraggable(element, sampleIndex) {
    if (!element) return;
    
    const elementId = `${element.className}_${sampleIndex}`;
    
    // 恢復儲存的位置
    if (elementPositions[elementId]) {
      element.style.position = 'absolute';
      element.style.left = elementPositions[elementId].x + 'px';
      element.style.top = elementPositions[elementId].y + 'px';
    }
    
    element.classList.add('bv-draggable');
    element.dataset.elementId = elementId;
    
    element.addEventListener('mousedown', function(e) {
      if (!isDragMode) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      selectedElement = element;
      element.classList.add('selected');
      
      // 移除其他選中狀態
      document.querySelectorAll('.bv-draggable').forEach(el => {
        if (el !== element) el.classList.remove('selected');
      });
      
      isDragging = true;
      element.classList.add('dragging');
      
      const rect = element.getBoundingClientRect();
      const parentRect = element.parentElement.getBoundingClientRect();
      
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      
      // 顯示座標提示
      positionTooltip.style.display = 'block';
      updatePositionTooltip(e.clientX, e.clientY, rect.left - parentRect.left, rect.top - parentRect.top);
      
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
    });
  }

  /* 處理拖曳 */
  function handleDrag(e) {
    if (!isDragging || !selectedElement) return;
    
    e.preventDefault();
    
    const parent = selectedElement.parentElement;
    const parentRect = parent.getBoundingClientRect();
    const marginIndicator = parent.querySelector('.bv-margin-indicator');
    const marginRect = marginIndicator ? marginIndicator.getBoundingClientRect() : parentRect;
    
    let newX = e.clientX - parentRect.left - startX;
    let newY = e.clientY - parentRect.top - startY;
    
    // 限制在邊界內
    const minX = marginRect.left - parentRect.left;
    const minY = marginRect.top - parentRect.top;
    const maxX = marginRect.right - parentRect.left - selectedElement.offsetWidth;
    const maxY = marginRect.bottom - parentRect.top - selectedElement.offsetHeight;
    
    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));
    
    // 參考線吸附
    const snapThreshold = 5;
    const guides = findAlignmentGuides(selectedElement, newX, newY);
    
    if (guides.vertical) {
      newX = guides.vertical;
      showGuide('vertical', guides.vertical + parentRect.left);
    } else {
      hideGuide('vertical');
    }
    
    if (guides.horizontal) {
      newY = guides.horizontal;
      showGuide('horizontal', guides.horizontal + parentRect.top);
    } else {
      hideGuide('horizontal');
    }
    
    selectedElement.style.left = newX + 'px';
    selectedElement.style.top = newY + 'px';
    
    // 更新座標提示
    updatePositionTooltip(e.clientX, e.clientY, newX, newY);
    
    // 儲存位置
    elementPositions[selectedElement.dataset.elementId] = { x: newX, y: newY };
  }

  /* 結束拖曳 */
  function handleDragEnd(e) {
    if (!selectedElement) return;
    
    isDragging = false;
    selectedElement.classList.remove('dragging');
    
    // 隱藏座標提示和參考線
    positionTooltip.style.display = 'none';
    hideGuide('vertical');
    hideGuide('horizontal');
    
    // 儲存到 localStorage
    savePositions();
    
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
  }

  /* 尋找對齊參考線 */
  function findAlignmentGuides(element, x, y) {
    const parent = element.parentElement;
    const siblings = parent.querySelectorAll('.bv-draggable');
    const guides = { vertical: null, horizontal: null };
    const snapThreshold = 5;
    
    siblings.forEach(sibling => {
      if (sibling === element) return;
      
      const siblingX = parseFloat(sibling.style.left) || 0;
      const siblingY = parseFloat(sibling.style.top) || 0;
      const siblingWidth = sibling.offsetWidth;
      const siblingHeight = sibling.offsetHeight;
      
      // 垂直對齊
      if (Math.abs(x - siblingX) < snapThreshold) {
        guides.vertical = siblingX;
      } else if (Math.abs(x + element.offsetWidth - siblingX - siblingWidth) < snapThreshold) {
        guides.vertical = siblingX + siblingWidth - element.offsetWidth;
      } else if (Math.abs(x + element.offsetWidth - siblingX) < snapThreshold) {
        guides.vertical = siblingX - element.offsetWidth;
      }
      
      // 水平對齊
      if (Math.abs(y - siblingY) < snapThreshold) {
        guides.horizontal = siblingY;
      } else if (Math.abs(y + element.offsetHeight - siblingY - siblingHeight) < snapThreshold) {
        guides.horizontal = siblingY + siblingHeight - element.offsetHeight;
      }
    });
    
    return guides;
  }

  /* 顯示參考線 */
  function showGuide(type, position) {
    let guide = document.querySelector(`.bv-guide-line.${type}`);
    if (!guide) {
      guide = document.createElement('div');
      guide.className = `bv-guide-line ${type}`;
      document.body.appendChild(guide);
    }
    
    if (type === 'vertical') {
      guide.style.left = position + 'px';
    } else {
      guide.style.top = position + 'px';
    }
  }

  /* 隱藏參考線 */
  function hideGuide(type) {
    const guide = document.querySelector(`.bv-guide-line.${type}`);
    if (guide) guide.remove();
  }

  /* 更新座標提示 */
  function updatePositionTooltip(mouseX, mouseY, elementX, elementY) {
    positionTooltip.textContent = `X: ${Math.round(elementX)}px, Y: ${Math.round(elementY)}px`;
    positionTooltip.style.left = (mouseX + 15) + 'px';
    positionTooltip.style.top = (mouseY - 25) + 'px';
  }

  /* 儲存位置 */
  function savePositions() {
    try {
      localStorage.setItem('bvDragPositions', JSON.stringify(elementPositions));
    } catch (e) {
      console.error('無法儲存位置：', e);
    }
  }

  /* 載入位置 */
  function loadPositions() {
    try {
      const saved = localStorage.getItem('bvDragPositions');
      if (saved) {
        elementPositions = JSON.parse(saved);
      }
    } catch (e) {
      console.error('無法載入位置：', e);
    }
  }

  /* 重設所有位置 */
  function resetAllPositions() {
    elementPositions = {};
    document.querySelectorAll('.bv-draggable').forEach(element => {
      element.style.position = '';
      element.style.left = '';
      element.style.top = '';
      element.classList.remove('selected');
    });
    savePositions();
  }

  /* 對齊功能 */
  function alignSelected(alignment) {
    const selected = document.querySelectorAll('.bv-draggable.selected');
    if (selected.length < 2) return;
    
    const positions = Array.from(selected).map(el => ({
      element: el,
      x: parseFloat(el.style.left) || 0,
      y: parseFloat(el.style.top) || 0,
      width: el.offsetWidth,
      height: el.offsetHeight
    }));
    
    switch(alignment) {
      case 'left':
        const leftMost = Math.min(...positions.map(p => p.x));
        positions.forEach(p => {
          p.element.style.left = leftMost + 'px';
          elementPositions[p.element.dataset.elementId] = { 
            x: leftMost, 
            y: p.y 
          };
        });
        break;
        
      case 'center':
        const avgX = positions.reduce((sum, p) => sum + p.x + p.width / 2, 0) / positions.length;
        positions.forEach(p => {
          const newX = avgX - p.width / 2;
          p.element.style.left = newX + 'px';
          elementPositions[p.element.dataset.elementId] = { 
            x: newX, 
            y: p.y 
          };
        });
        break;
        
      case 'right':
        const rightMost = Math.max(...positions.map(p => p.x + p.width));
        positions.forEach(p => {
          const newX = rightMost - p.width;
          p.element.style.left = newX + 'px';
          elementPositions[p.element.dataset.elementId] = { 
            x: newX, 
            y: p.y 
          };
        });
        break;
        
      case 'top':
        const topMost = Math.min(...positions.map(p => p.y));
        positions.forEach(p => {
          p.element.style.top = topMost + 'px';
          elementPositions[p.element.dataset.elementId] = { 
            x: p.x, 
            y: topMost 
          };
        });
        break;
        
      case 'middle':
        const avgY = positions.reduce((sum, p) => sum + p.y + p.height / 2, 0) / positions.length;
        positions.forEach(p => {
          const newY = avgY - p.height / 2;
          p.element.style.top = newY + 'px';
          elementPositions[p.element.dataset.elementId] = { 
            x: p.x, 
            y: newY 
          };
        });
        break;
        
      case 'bottom':
        const bottomMost = Math.max(...positions.map(p => p.y + p.height));
        positions.forEach(p => {
          const newY = bottomMost - p.height;
          p.element.style.top = newY + 'px';
          elementPositions[p.element.dataset.elementId] = { 
            x: p.x, 
            y: newY 
          };
        });
        break;
    }
    
    savePositions();
  }

  /* 建立控制面板 */
  setTimeout(() => {
    // 抓取產品資料
    extractProductData();
    
    // 載入儲存的位置
    loadPositions();
    
    const panel = document.createElement('div');
    panel.id = 'bv-barcode-control-panel';
    panel.innerHTML = `
      <div class="bv-glass-panel">
        <div class="bv-panel-header">
          <div class="bv-header-content">
            <div class="bv-icon-wrapper">
              <span class="material-icons">label</span>
            </div>
            <div class="bv-title-group">
              <h3 class="bv-panel-title">BV 條碼標籤控制面板</h3>
              <div class="bv-panel-subtitle">精準控制每個印刷細節</div>
            </div>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="bv-glass-button bv-minimize-btn" id="bv-minimize-btn" title="最小化">
              <span class="material-icons">remove</span>
            </button>
          </div>
        </div>
        
        <div class="bv-panel-content-wrapper">
          <div class="bv-panel-body">
            <!-- 拖曳模式切換 -->
            <button class="bv-drag-mode-toggle" id="bv-drag-mode-toggle">
              <span class="material-icons">open_with</span>
              <span id="drag-mode-text">開啟拖曳模式</span>
            </button>
            
            <!-- 拖曳模式控制項 -->
            <div class="bv-settings-card" id="drag-controls-card" style="display: none;">
              <h4 class="bv-card-title">
                <span class="material-icons">control_camera</span>
                拖曳控制
              </h4>
              
              <div class="bv-card-content">
                <!-- 對齊按鈕 -->
                <div class="bv-align-buttons">
                  <button class="bv-align-btn" onclick="alignSelected('left')" title="左對齊">
                    <span class="material-icons">format_align_left</span>
                  </button>
                  <button class="bv-align-btn" onclick="alignSelected('center')" title="水平置中">
                    <span class="material-icons">format_align_center</span>
                  </button>
                  <button class="bv-align-btn" onclick="alignSelected('right')" title="右對齊">
                    <span class="material-icons">format_align_right</span>
                  </button>
                  <button class="bv-align-btn" onclick="alignSelected('top')" title="上對齊">
                    <span class="material-icons">vertical_align_top</span>
                  </button>
                  <button class="bv-align-btn" onclick="alignSelected('middle')" title="垂直置中">
                    <span class="material-icons">vertical_align_center</span>
                  </button>
                  <button class="bv-align-btn" onclick="alignSelected('bottom')" title="下對齊">
                    <span class="material-icons">vertical_align_bottom</span>
                  </button>
                </div>
                
                <button class="bv-glass-button" style="width: 100%; margin-top: 12px; height: 40px; justify-content: center;" onclick="resetAllPositions()">
                  <span class="material-icons">restart_alt</span>
                  <span style="margin-left: 8px;">重設所有位置</span>
                </button>
              </div>
            </div>
            
            <!-- 主要操作區 -->
            <div class="bv-primary-section">
              <button class="bv-reset-button" id="bv-reset-format">
                <div class="bv-button-icon">
                  <span class="material-icons">restart_alt</span>
                </div>
                <div class="bv-button-content">
                  <span class="bv-button-title">清除格式</span>
                  <span class="bv-button-subtitle">還原為 BV 原始預設值</span>
                </div>
              </button>
            </div>
            
            <!-- 標籤設定區塊 -->
            <div class="bv-settings-card" data-section="general">
              <h4 class="bv-card-title">
                <span class="material-icons">settings</span>
                標籤設定
                <span class="material-icons bv-collapse-icon">expand_more</span>
              </h4>
              
              <div class="bv-card-content">
                <!-- 預設尺寸按鈕 -->
                <div class="bv-preset-sizes">
                  ${presetSizes.map(size => `
                    <button class="bv-preset-size-btn" 
                            data-width="${size.width}" 
                            data-height="${size.height}"
                            data-type="${size.type}">
                      ${size.name}
                    </button>
                  `).join('')}
                </div>
                
                <div class="bv-slider-group">
                  <div class="bv-slider-item">
                    <div class="bv-slider-header">
                      <span>標籤寬度</span>
                      <span class="bv-value-label" id="label-width">40mm</span>
                    </div>
                    <input type="range" id="label-width-slider" min="19" max="60" value="40" class="bv-glass-slider">
                  </div>
                  
                  <div class="bv-slider-item">
                    <div class="bv-slider-header">
                      <span>標籤高度</span>
                      <span class="bv-value-label" id="label-height">30mm</span>
                    </div>
                    <input type="range" id="label-height-slider" min="19" max="60" value="30" class="bv-glass-slider">
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
                </div>
              </div>
            </div>
            
            <!-- 文字設定區塊 -->
            <div class="bv-settings-card" id="text-settings-card" data-section="text">
              <h4 class="bv-card-title">
                <span class="material-icons">text_fields</span>
                文字設定
                <span class="material-icons bv-collapse-icon">expand_more</span>
              </h4>
              
              <div class="bv-card-content">
                <div class="bv-slider-group">
                  <!-- 商品名稱 -->
                  <div class="bv-setting-item" id="main-text-setting">
                    <div class="bv-setting-info">
                      <span class="bv-setting-label">商品名稱</span>
                    </div>
                    <button class="bv-bold-button active" id="main-bold-btn" title="粗體">B</button>
                  </div>
                  
                  <div class="bv-slider-item" id="main-size-setting">
                    <div class="bv-slider-header">
                      <span>文字大小</span>
                      <span class="bv-value-label" id="main-size">10px</span>
                    </div>
                    <input type="range" id="main-slider" min="4" max="20" value="10" class="bv-glass-slider">
                  </div>

                  <div class="bv-slider-item" id="main-line-height-setting">
                    <div class="bv-slider-header">
                      <span>行高</span>
                      <span class="bv-value-label" id="main-line-height">11px</span>
                    </div>
                    <input type="range" id="main-line-height-slider" min="4" max="30" value="11" class="bv-glass-slider">
                  </div>
                  
                  <div class="bv-slider-item" id="main-gap-setting">
                    <div class="bv-slider-header">
                      <span>商品名稱與其他資訊間距</span>
                      <span class="bv-value-label" id="main-gap">0px</span>
                    </div>
                    <input type="range" id="main-gap-slider" min="0" max="10" step="0.5" value="0" class="bv-glass-slider">
                  </div>
                  
                  <!-- 分隔線 -->
                  <div style="height: 0.5px; background: rgba(0, 0, 0, 0.08); margin: 20px 0;"></div>
                  
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
                    <input type="range" id="sub-slider" min="4" max="16" value="8" class="bv-glass-slider">
                  </div>
                  
                  <div class="bv-slider-item">
                    <div class="bv-slider-header">
                      <span>行高</span>
                      <span class="bv-value-label" id="sub-line-height">9px</span>
                    </div>
                    <input type="range" id="sub-line-height-slider" min="4" max="20" value="9" class="bv-glass-slider">
                  </div>
                  
                  <!-- 分隔線 -->
                  <div style="height: 0.5px; background: rgba(0, 0, 0, 0.08); margin: 20px 0;"></div>
                  
                  <!-- 條碼數字 -->
                  <div class="bv-setting-item">
                    <div class="bv-setting-info">
                      <span class="bv-setting-label">條碼數字</span>
                    </div>
                    <button class="bv-bold-button active" id="barcode-text-bold-btn" title="粗體">B</button>
                  </div>
                  
                  <div class="bv-slider-item">
                    <div class="bv-slider-header">
                      <span>文字大小</span>
                      <span class="bv-value-label" id="barcode-text-size">8px</span>
                    </div>
                    <input type="range" id="barcode-text-slider" min="4" max="16" value="8" class="bv-glass-slider">
                  </div>
                  
                  <div class="bv-slider-item">
                    <div class="bv-slider-header">
                      <span>行高</span>
                      <span class="bv-value-label" id="barcode-text-line-height">10px</span>
                    </div>
                    <input type="range" id="barcode-text-line-height-slider" min="4" max="20" value="10" class="bv-glass-slider">
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 條碼圖片設定 -->
            <div class="bv-settings-card" id="barcode-settings-card" data-section="barcode">
              <h4 class="bv-card-title">
                <span class="material-icons">qr_code_2</span>
                條碼圖片設定
                <span class="material-icons bv-collapse-icon">expand_more</span>
              </h4>
              
              <div class="bv-card-content">
                <div class="bv-slider-group">
                  <div class="bv-slider-item" id="barcode-height-setting">
                    <div class="bv-slider-header">
                      <span>條碼圖片高度（Y軸拉伸）</span>
                      <span class="bv-value-label" id="barcode-height">100%</span>
                    </div>
                    <input type="range" id="barcode-height-slider" min="30" max="200" value="100" class="bv-glass-slider">
                  </div>
                  
                  <div class="bv-slider-item" id="barcode-width-setting">
                    <div class="bv-slider-header">
                      <span>條碼圖片寬度（X軸拉伸）</span>
                      <span class="bv-value-label" id="barcode-width">100%</span>
                    </div>
                    <input type="range" id="barcode-width-slider" min="85" max="100" value="100" class="bv-glass-slider">
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 底圖設定區塊 -->
            <div class="bv-settings-card" data-section="logo">
              <h4 class="bv-card-title">
                <span class="material-icons">image</span>
                底圖設定
                <span class="material-icons bv-collapse-icon">expand_more</span>
              </h4>
              
              <div class="bv-card-content">
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
            
            <!-- 預設管理 -->
            <div class="bv-settings-card" data-section="presets">
              <h4 class="bv-card-title">
                <span class="material-icons">bookmark</span>
                預設管理
                <span class="material-icons bv-collapse-icon">expand_more</span>
              </h4>
              
              <div class="bv-card-content">
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

    /* 浮動按鈕 */
    const floatingButton = document.createElement('button');
    floatingButton.className = 'bv-floating-button';
    floatingButton.id = 'bv-floating-print';
    floatingButton.innerHTML = '<span class="material-icons">print</span>';
    document.body.appendChild(floatingButton);
    
    /* 將函數暴露到全域 */
    window.alignSelected = alignSelected;
    window.resetAllPositions = resetAllPositions;
    
    /* 拖曳模式切換 */
    const dragModeToggle = document.getElementById('bv-drag-mode-toggle');
    const dragModeText = document.getElementById('drag-mode-text');
    const dragControlsCard = document.getElementById('drag-controls-card');
    
    dragModeToggle.addEventListener('click', function() {
      isDragMode = !isDragMode;
      
      if (isDragMode) {
        document.body.classList.add('bv-drag-mode');
        this.classList.add('active');
        dragModeText.textContent = '關閉拖曳模式';
        dragControlsCard.style.display = 'block';
        
        // 初始化拖曳功能
        initDragFeatures();
        
        // 使所有元素可拖曳
        document.querySelectorAll('.print_sample').forEach((sample, sampleIndex) => {
          // 商品名稱
          const mainElements = sample.querySelectorAll('.main');
          mainElements.forEach(el => makeElementDraggable(el, sampleIndex));
          
          // 規格、價格等
          const subElements = sample.querySelectorAll('.sub');
          subElements.forEach(el => makeElementDraggable(el, sampleIndex));
          
          // 條碼區域
          const barcodeAreas = sample.querySelectorAll('.spec_barcode');
          barcodeAreas.forEach(el => makeElementDraggable(el, sampleIndex));
          
          // 文字區域
          const infoAreas = sample.querySelectorAll('.spec_info');
          infoAreas.forEach(el => makeElementDraggable(el, sampleIndex));
        });
        
        showNotification('拖曳模式已開啟，點擊並拖曳元素調整位置');
      } else {
        document.body.classList.remove('bv-drag-mode');
        this.classList.remove('active');
        dragModeText.textContent = '開啟拖曳模式';
        dragControlsCard.style.display = 'none';
        
        // 移除所有參考線
        document.querySelectorAll('.bv-guide-line').forEach(guide => guide.remove());
        
        showNotification('拖曳模式已關閉');
      }
    });
    
    /* 多選功能 */
    document.addEventListener('click', function(e) {
      if (!isDragMode) return;
      
      // 如果點擊的不是可拖曳元素，清除所有選擇
      if (!e.target.closest('.bv-draggable') && !e.ctrlKey && !e.metaKey) {
        document.querySelectorAll('.bv-draggable').forEach(el => {
          el.classList.remove('selected');
        });
      }
    });
    
    /* Ctrl/Cmd + 點擊多選 */
    document.addEventListener('mousedown', function(e) {
      if (!isDragMode) return;
      
      const draggable = e.target.closest('.bv-draggable');
      if (draggable && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        draggable.classList.toggle('selected');
      }
    });
    
    /* 為 range input 添加動態值更新 */
    function updateRangeProgress(input) {
      const value = (input.value - input.min) / (input.max - input.min) * 100;
      input.style.setProperty('--value', value + '%');
      input.style.background = `linear-gradient(to right, #518aff 0%, #518aff ${value}%, rgba(0, 0, 0, 0.08) ${value}%, rgba(0, 0, 0, 0.08) 100%)`;
    }
    
    /* 延遲初始化所有控制項 */
    setTimeout(() => {
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
      const barcodeTextLineHeightSlider = document.getElementById('barcode-text-line-height-slider');
      const barcodeHeight = document.getElementById('barcode-height-slider');
      const barcodeWidth = document.getElementById('barcode-width-slider');
      
      const labelWidth = document.getElementById('label-width-slider');
      const labelHeight = document.getElementById('label-height-slider');
      const fontFamily = document.getElementById('font-family-select');
      
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
      
      /* 更新樣式函數 */
      function updateStyles() {
        if (!mainSize || !subSize) return;
        
        const mainLineHeight = mainLineHeightSlider ? mainLineHeightSlider.value : 11;
        const subLineHeight = subLineHeightSlider ? subLineHeightSlider.value : 9;
        const barcodeTextLineHeight = barcodeTextLineHeightSlider ? barcodeTextLineHeightSlider.value : 10;
        
        const validatedMainLineHeight = validateLineHeight(mainSize.value, mainLineHeight);
        const validatedSubLineHeight = validateLineHeight(subSize.value, subLineHeight);
        const validatedBarcodeTextLineHeight = validateLineHeight(barcodeTextSize.value, barcodeTextLineHeight);
        
        const mainFontWeight = mainBoldBtn && mainBoldBtn.classList.contains('active') ? 700 : 400;
        const subFontWeight = subBoldBtn && subBoldBtn.classList.contains('active') ? 700 : 400;
        const barcodeTextFontWeight = barcodeTextBoldBtn && barcodeTextBoldBtn.classList.contains('active') ? 700 : 400;
        
        const totalWidth = parseFloat(labelWidth.value);
        const totalHeight = parseFloat(labelHeight.value);
        const isBrotherLabel = labelWidth.value == 42 || labelWidth.value == 29;
        const paddingLeft = isBrotherLabel ? 4 : 3;
        const paddingOther = 3;
        
        const barcodeHeightScale = barcodeHeight ? parseFloat(barcodeHeight.value) / 100 : 1;
        const barcodeWidthScale = barcodeWidth ? parseFloat(barcodeWidth.value) / 100 : 1;
        
        // 計算條碼實際尺寸
        let barcodeHeightMM = 10 * barcodeHeightScale;
        let barcodeWidthMM = (totalWidth - paddingLeft - paddingOther) * barcodeWidthScale;
        
        /* 更新顯示值 */
        document.getElementById('main-size').textContent = mainSize.value + 'px';
        document.getElementById('main-gap').textContent = mainGap.value + 'px';
        document.getElementById('sub-size').textContent = subSize.value + 'px';
        
        document.getElementById('barcode-text-size').textContent = barcodeTextSize.value + 'px';
        document.getElementById('barcode-height').textContent = (barcodeHeightScale * 100).toFixed(0) + '%';
        document.getElementById('barcode-width').textContent = (barcodeWidthScale * 100).toFixed(0) + '%';
        document.getElementById('label-width').textContent = labelWidth.value + 'mm';
        document.getElementById('label-height').textContent = labelHeight.value + 'mm';
        
        if (document.getElementById('main-line-height')) {
          document.getElementById('main-line-height').textContent = validatedMainLineHeight + 'px';
        }
        if (document.getElementById('sub-line-height')) {
          document.getElementById('sub-line-height').textContent = validatedSubLineHeight + 'px';
        }
        if (document.getElementById('barcode-text-line-height')) {
          document.getElementById('barcode-text-line-height').textContent = validatedBarcodeTextLineHeight + 'px';
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
         barcodeTextSize, barcodeTextLineHeightSlider, barcodeHeight, barcodeWidth,
         labelWidth, labelHeight,
         logoSizeSlider, logoXSlider, logoYSlider, logoOpacitySlider].forEach(control => {
          if (control && control.type === 'range') {
            updateRangeProgress(control);
          }
        });
        
        /* 套用樣式 */
        dynamicStyle.innerHTML = `
          /* 調整條碼標籤整體尺寸 */
          .print_barcode_area {
            width: ${labelWidth.value}mm !important;
          }
          
          /* 調整單個標籤的尺寸 */
          html .print_barcode_area .print_sample,
          body .print_barcode_area .print_sample {
            height: ${labelHeight.value}mm !important;
            padding: ${paddingOther}mm ${paddingOther}mm ${paddingOther}mm ${paddingLeft}mm !important;
            box-sizing: border-box !important;
            position: relative !important;
            overflow: hidden !important;
          }
          
          /* 移除ul的預設樣式 */
          .print_barcode_area .print_sample ul {
            margin: 0 !important;
            padding: 0 !important;
            list-style: none !important;
          }
          
          .print_barcode_area .print_sample li {
            margin: 0 !important;
            padding: 0 !important;
            line-height: inherit !important;
          }
          
          /* 文字區域樣式 */
          .print_barcode_area .print_sample .spec_info {
            font-family: ${fontFamily.value} !important;
            text-align: left !important;
            display: block !important;
            height: auto !important;
            overflow: visible !important;
            position: relative !important;
            z-index: 2 !important;
          }
          
          /* 商品名稱 */
          .print_barcode_area .print_sample .spec_info .main,
          .print_barcode_area .print_sample .main {
            font-size: ${mainSize.value}px !important;
            line-height: ${validatedMainLineHeight}px !important;
            font-weight: ${mainFontWeight} !important;
            margin-bottom: ${mainGap.value}px !important;
            word-break: break-all !important;
            white-space: normal !important;
            display: block !important;
            letter-spacing: unset !important;
          }
          
          /* 規格/價格/編號 */
          .print_barcode_area .print_sample .spec_info .sub,
          .print_barcode_area .print_sample .sub {
            font-size: ${subSize.value}px !important;
            line-height: ${validatedSubLineHeight}px !important;
            font-weight: ${subFontWeight} !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            letter-spacing: unset !important;
            display: block !important;
          }
          
          /* 條碼區域樣式 */
          .print_barcode_area .print_sample .spec_barcode {
            display: flex !important;
            flex-direction: column !important;
            text-align: center !important;
            height: auto !important;
            position: relative !important;
            z-index: 2 !important;
            align-items: center !important;
          }
          
          /* 條碼圖片樣式 */
          .print_barcode_area .print_sample .spec_barcode > img {
            height: ${barcodeHeightMM}mm !important;
            width: ${barcodeWidthMM}mm !important;
            max-width: ${barcodeWidthMM}mm !important;
            object-fit: fill !important;
            margin: 0 auto !important;
            display: block !important;
          }
          
          /* 條碼文字樣式 */
          .print_barcode_area .print_sample .spec_barcode > span.sub,
          .print_barcode_area .print_sample .spec_barcode > b > span.sub,
          .print_barcode_area .print_sample .spec_barcode > .sub,
          .print_barcode_area .print_sample .spec_barcode .sub {
            font-size: ${barcodeTextSize.value}px !important;
            font-weight: ${barcodeTextFontWeight} !important;
            font-family: ${fontFamily.value} !important;
            line-height: ${validatedBarcodeTextLineHeight}px !important;
            margin-top: 2px !important;
            display: block !important;
          }
          
          /* 底圖樣式 */
          .label-background-logo {
            position: absolute !important;
            width: ${logoWidthMM}mm !important;
            height: ${logoHeightMM}mm !important;
            left: ${logoXSlider ? logoXSlider.value : 50}% !important;
            top: ${logoYSlider ? logoYSlider.value : 50}% !important;
            transform: translate(-50%, -50%) !important;
            opacity: ${logoOpacitySlider ? (100 - logoOpacitySlider.value) / 100 : 0.8} !important;
            z-index: 1 !important;
            pointer-events: none;
            object-fit: contain !important;
          }
          
          /* 防止任何連結樣式 */
          .print_barcode_area a {
            text-decoration: none !important;
            color: inherit !important;
            pointer-events: none !important;
          }
          
          /* 確保文字不會溢出 */
          .print_barcode_area .print_sample * {
            max-width: 100% !important;
          }
        `;
        
        /* 更新所有標籤的底圖 */
        updateAllLogos();
        
        /* 自動保存當前設定為臨時設定 */
        saveSettingsToLocal('_current_temp_settings', saveCurrentSettings());
      }
      
      /* 預設尺寸按鈕事件 */
      document.querySelectorAll('.bv-preset-size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const width = this.dataset.width;
          const height = this.dataset.height;
          const presetName = this.textContent;
          
          // 找到對應的預設配置
          const preset = presetSizes.find(p => p.name === presetName);
          
          if (labelWidth) labelWidth.value = width;
          if (labelHeight) labelHeight.value = height;
          
          // 應用預設的文字和條碼設定
          if (preset && preset.settings) {
            // 重置行高修改標記
            if (mainLineHeightSlider) mainLineHeightSlider.dataset.userModified = 'false';
            if (subLineHeightSlider) subLineHeightSlider.dataset.userModified = 'false';
            if (barcodeTextLineHeightSlider) barcodeTextLineHeightSlider.dataset.userModified = 'false';
            
            // 設定所有值
            if (mainSize) mainSize.value = preset.settings.mainSize;
            if (subSize) subSize.value = preset.settings.subSize;
            if (barcodeTextSize) barcodeTextSize.value = preset.settings.barcodeTextSize;
            if (barcodeTextLineHeightSlider) barcodeTextLineHeightSlider.value = preset.settings.barcodeTextLineHeight;
            if (barcodeHeight) barcodeHeight.value = preset.settings.barcodeHeight;
            if (barcodeWidth) barcodeWidth.value = preset.settings.barcodeWidth;
            if (mainLineHeightSlider) mainLineHeightSlider.value = preset.settings.mainLineHeight;
            if (subLineHeightSlider) subLineHeightSlider.value = preset.settings.subLineHeight;
            
            // 更新所有控制項的顯示
            document.querySelectorAll('input[type="range"]').forEach(updateRangeProgress);
          }
          
          // 更新 active 狀態
          document.querySelectorAll('.bv-preset-size-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          
          updateStyles();
          
          // 顯示通知
          if (preset && preset.type === 'brother' && presetName.includes('小標籤')) {
            showNotification(`已切換至 ${this.textContent}，並套用小標籤優化設定`);
          } else {
            showNotification(`已切換至 ${this.textContent}`);
          }
        });
      });
      
      /* 檢查當前尺寸是否為預設尺寸 */
      function checkPresetSizeActive() {
        const currentWidth = labelWidth ? labelWidth.value : 40;
        const currentHeight = labelHeight ? labelHeight.value : 30;
        
        document.querySelectorAll('.bv-preset-size-btn').forEach(btn => {
          const btnWidth = btn.dataset.width;
          const btnHeight = btn.dataset.height;
          
          if (btnWidth == currentWidth && btnHeight == currentHeight) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }
      
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
      
      /* 收摺功能 */
      function setupCollapsibleCards() {
        document.querySelectorAll('.bv-card-title').forEach(title => {
          title.addEventListener('click', function() {
            const card = this.closest('.bv-settings-card');
            const sectionId = card.getAttribute('data-section');
            
            if (card.classList.contains('collapsed')) {
              card.classList.remove('collapsed');
              collapsedSections[sectionId] = false;
            } else {
              card.classList.add('collapsed');
              collapsedSections[sectionId] = true;
            }
            
            chrome.storage.local.set({ bvCollapsedSections: collapsedSections });
          });
        });
      }
      
      setupCollapsibleCards();
      
      /* 載入收摺狀態 */
      chrome.storage.local.get(['bvCollapsedSections'], (result) => {
        if (result.bvCollapsedSections) {
          collapsedSections = result.bvCollapsedSections;
          Object.keys(collapsedSections).forEach(sectionId => {
            if (collapsedSections[sectionId]) {
              const card = document.querySelector(`[data-section="${sectionId}"]`);
              if (card) {
                card.classList.add('collapsed');
              }
            }
          });
        }
      });
      
      /* 初始化拖曳功能 */
      initDragFunction();
      
      /* 粗體按鈕點擊事件 */
      function setupBoldButton(button, updateCallback) {
        if (button) {
          button.addEventListener('click', function() {
            if (!this.disabled) {
              this.classList.toggle('active');
              updateCallback();
            }
          });
        }
      }

      setupBoldButton(mainBoldBtn, updateStyles);
      setupBoldButton(subBoldBtn, updateStyles);
      setupBoldButton(barcodeTextBoldBtn, updateStyles);

      /* 字體大小改變時，自動調整行高 */
      if (mainSize) {
        mainSize.addEventListener('input', function() {
          if (mainLineHeightSlider && !mainLineHeightSlider.disabled) {
            const suggestedLineHeight = calculateSuggestedLineHeight(this.value);
            
            if (!mainLineHeightSlider.dataset.userModified) {
              mainLineHeightSlider.value = suggestedLineHeight;
              updateRangeProgress(mainLineHeightSlider);
            }
            
            const minLineHeight = Math.ceil(this.value * 1.0);
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
          if (subLineHeightSlider && !subLineHeightSlider.disabled) {
            const suggestedLineHeight = calculateSuggestedLineHeight(this.value);
            
            if (!subLineHeightSlider.dataset.userModified) {
              subLineHeightSlider.value = suggestedLineHeight;
              updateRangeProgress(subLineHeightSlider);
            }
            
            const minLineHeight = Math.ceil(this.value * 1.0);
            subLineHeightSlider.min = minLineHeight;
            if (parseInt(subLineHeightSlider.value) < minLineHeight) {
              subLineHeightSlider.value = minLineHeight;
              updateRangeProgress(subLineHeightSlider);
            }
          }
          updateStyles();
        });
      }

      // 條碼文字大小改變時，自動調整行高
      if (barcodeTextSize) {
        barcodeTextSize.addEventListener('input', function() {
          if (barcodeTextLineHeightSlider && !barcodeTextLineHeightSlider.disabled) {
            const suggestedLineHeight = calculateSuggestedLineHeight(this.value);
            
            if (!barcodeTextLineHeightSlider.dataset.userModified) {
              barcodeTextLineHeightSlider.value = suggestedLineHeight;
              updateRangeProgress(barcodeTextLineHeightSlider);
            }
            
            const minLineHeight = Math.ceil(this.value * 1.0);
            barcodeTextLineHeightSlider.min = minLineHeight;
            if (parseInt(barcodeTextLineHeightSlider.value) < minLineHeight) {
              barcodeTextLineHeightSlider.value = minLineHeight;
              updateRangeProgress(barcodeTextLineHeightSlider);
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

      // 標記使用者手動調整過條碼文字行高
      if (barcodeTextLineHeightSlider) {
        barcodeTextLineHeightSlider.addEventListener('input', function() {
          this.dataset.userModified = 'true';
          updateStyles();
        });
      }
      
      /* 更新所有標籤的底圖 */
      function updateAllLogos() {
        // 移除現有底圖
        document.querySelectorAll('.label-background-logo').forEach(logo => logo.remove());
        
        // 為每個標籤添加底圖
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
        barcodeTextSize, barcodeTextLineHeightSlider, barcodeHeight, barcodeWidth,
        labelWidth, labelHeight, fontFamily,
        logoSizeSlider, logoXSlider, logoYSlider, logoOpacitySlider
      ];
      
      controls.forEach(control => {
        if(control) {
          control.addEventListener('input', () => {
            updateStyles();
            checkPresetSizeActive();
          });
          control.addEventListener('change', () => {
            updateStyles();
            checkPresetSizeActive();
          });
          
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
          if (confirm('確定要將所有設定還原到 BV 原始預設值嗎？\n\n此操作將會：\n• 清除所有格式設定\n• 清除底圖\n• 重設所有元素位置\n\n此操作無法復原。')) {
            // 清除底圖
            if (logoDataUrl) {
              logoDataUrl = null;
              logoAspectRatio = 1;
              if (logoPreview) logoPreview.style.display = 'none';
              if (uploadPrompt) uploadPrompt.style.display = 'block';
              if (logoUploadArea) logoUploadArea.classList.remove('has-logo');
              if (logoControls) logoControls.classList.remove('active');
              if (logoInput) logoInput.value = '';
            }
            
            // 重置行高修改標記
            if (mainLineHeightSlider) mainLineHeightSlider.dataset.userModified = 'false';
            if (subLineHeightSlider) subLineHeightSlider.dataset.userModified = 'false';
            if (barcodeTextLineHeightSlider) barcodeTextLineHeightSlider.dataset.userModified = 'false';
            
            // 重設所有元素位置
            resetAllPositions();
            
            // 如果在拖曳模式，關閉它
            if (isDragMode) {
              dragModeToggle.click();
            }
            
            // 應用預設設定
            applySavedSettings(completeDefaultSettings);
            
            // 清除預設選擇
            const presetSelect = document.getElementById('bv-preset-select');
            if (presetSelect) presetSelect.value = '';
            
            // 清除記錄
            try {
              localStorage.removeItem('bvShopBarcode_lastSelectedPreset');
              localStorage.removeItem('bvShopBarcode__current_temp_settings');
              localStorage.removeItem('bvDragPositions');
            } catch (e) {
              console.warn('無法清除記錄');
            }
            
            checkPresetSizeActive();
            showNotification('已還原 BV 原始預設值');
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
          barcodeTextLineHeight: barcodeTextLineHeightSlider ? barcodeTextLineHeightSlider.value : 10,
          barcodeHeight: barcodeHeight.value,
          barcodeWidth: barcodeWidth.value,
          labelWidth: labelWidth.value,
          labelHeight: labelHeight.value,
          fontFamily: fontFamily.value,
          logoDataUrl: logoDataUrl,
          logoSize: logoSizeSlider ? logoSizeSlider.value : 30,
          logoX: logoXSlider ? logoXSlider.value : 50,
          logoY: logoYSlider ? logoYSlider.value : 50,
          logoOpacity: logoOpacitySlider ? logoOpacitySlider.value : 20,
          logoAspectRatio: logoAspectRatio,
          elementPositions: elementPositions
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
        if (barcodeTextLineHeightSlider) {
          barcodeTextLineHeightSlider.value = settings.barcodeTextLineHeight !== undefined ? settings.barcodeTextLineHeight : completeDefaultSettings.barcodeTextLineHeight;
        }
        
        barcodeHeight.value = settings.barcodeHeight !== undefined ? settings.barcodeHeight : completeDefaultSettings.barcodeHeight;
        barcodeWidth.value = settings.barcodeWidth !== undefined ? settings.barcodeWidth : completeDefaultSettings.barcodeWidth;
        
        labelWidth.value = settings.labelWidth !== undefined ? settings.labelWidth : completeDefaultSettings.labelWidth;
        labelHeight.value = settings.labelHeight !== undefined ? settings.labelHeight : completeDefaultSettings.labelHeight;
        
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
        
        // 載入元素位置
        if (settings.elementPositions) {
          elementPositions = settings.elementPositions;
          // 套用儲存的位置
          Object.keys(elementPositions).forEach(elementId => {
            const element = document.querySelector(`[data-element-id="${elementId}"]`);
            if (element) {
              element.style.position = 'absolute';
              element.style.left = elementPositions[elementId].x + 'px';
              element.style.top = elementPositions[elementId].y + 'px';
            }
          });
        }
        
        document.querySelectorAll('input[type="range"]').forEach(updateRangeProgress);
        
        checkPresetSizeActive();
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
      
      /* 載入初始設定 */
      function loadInitialSettings() {
        // 先載入臨時設定
        const tempSettings = getSettingsFromLocal('_current_temp_settings');
        if (tempSettings) {
          applySavedSettings(tempSettings);
        } else {
          // 載入上次選擇的預設
          const lastSelectedPreset = getSettingsFromLocal('lastSelectedPreset');
          if (lastSelectedPreset) {
            const settings = getSettingsFromLocal('preset_' + lastSelectedPreset);
            if (settings) {
              applySavedSettings(settings);
              const presetSelect = document.getElementById('bv-preset-select');
              if (presetSelect) {
                presetSelect.value = lastSelectedPreset;
              }
            }
          } else {
            // 使用預設值
            applySavedSettings(completeDefaultSettings);
          }
        }
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
      checkPresetSizeActive();
      
      /* 將函數掛載到 window 物件 */
      window.barcodeEditor = {
        updateStyles,
        saveCurrentSettings,
        applySavedSettings,
        showNotification,
        updateAllLogos,
        productData,
        isDragMode,
        elementPositions,
        alignSelected,
        resetAllPositions
      };
    }, 100);
  }, 0);
  
  /* 初始化拖曳功能（面板拖曳） */
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
      
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      
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
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
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
  }
})();
