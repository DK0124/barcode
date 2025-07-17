javascript:(function(){
  /* BV SHOP 條碼列印排版器 - 八種樣式模板版本 */
  
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
    { name: '思源黑體', value: '"Noto Sans TC", sans-serif' },
    { name: '系統預設', value: 'Arial, sans-serif' },
    { name: '微軟正黑體', value: 'Microsoft JhengHei, 微軟正黑體, sans-serif' },
    { name: '蘋方體', value: 'PingFang TC, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif' }
  ];

  /* 八種內建樣式模板 */
  const layoutTemplates = {
    style1: {
      name: '樣式一：標準版（含特價）',
      description: '商品名稱、規格、特價、編號、條碼',
      showProductName: true,
      showSpec: true,
      showPrice: true,
      showSpecialPrice: true,
      showProductCode: true,
      showBarcode: true,
      barcodePosition: 'bottom',
      priceInBarcode: false
    },
    style2: {
      name: '樣式二：標準版',
      description: '商品名稱、規格、售價、編號、條碼',
      showProductName: true,
      showSpec: true,
      showPrice: true,
      showSpecialPrice: false,
      showProductCode: true,
      showBarcode: true,
      barcodePosition: 'bottom',
      priceInBarcode: false
    },
    style3: {
      name: '樣式三：精簡版（含特價）',
      description: '商品名稱、特價、條碼在文字區',
      showProductName: true,
      showSpec: false,
      showPrice: true,
      showSpecialPrice: true,
      showProductCode: false,
      showBarcode: true,
      barcodePosition: 'inline',
      priceInBarcode: false
    },
    style4: {
      name: '樣式四：精簡版',
      description: '商品名稱、售價、條碼在文字區',
      showProductName: true,
      showSpec: false,
      showPrice: true,
      showSpecialPrice: false,
      showProductCode: false,
      showBarcode: true,
      barcodePosition: 'inline',
      priceInBarcode: false
    },
    style5: {
      name: '樣式五：價格在條碼',
      description: '商品名稱、規格、價格顯示在條碼下方',
      showProductName: true,
      showSpec: true,
      showPrice: false,
      showSpecialPrice: false,
      showProductCode: false,
      showBarcode: true,
      barcodePosition: 'bottom',
      priceInBarcode: true
    },
    style6: {
      name: '樣式六：垂直排列',
      description: '商品名稱、條碼、售價垂直排列',
      showProductName: true,
      showSpec: false,
      showPrice: true,
      showSpecialPrice: false,
      showProductCode: false,
      showBarcode: true,
      barcodePosition: 'middle',
      priceInBarcode: false
    },
    style7: {
      name: '樣式七：完整版',
      description: '顯示所有資訊，價格在條碼下',
      showProductName: true,
      showSpec: true,
      showPrice: false,
      showSpecialPrice: false,
      showProductCode: true,
      showBarcode: true,
      barcodePosition: 'bottom',
      priceInBarcode: true
    },
    style8: {
      name: '樣式八：純條碼',
      description: '只顯示條碼',
      showProductName: false,
      showSpec: false,
      showPrice: false,
      showSpecialPrice: false,
      showProductCode: false,
      showBarcode: true,
      barcodePosition: 'center',
      priceInBarcode: false
    }
  };

  /* 初始變數 */
  let currentLayout = 'style1';
  let isPanelMinimized = false;

  /* 完整的預設值物件 */
  const completeDefaultSettings = {
    layout: 'style1',
    mainSize: 10,
    mainBold: true,
    mainGap: 0,
    mainLineHeight: 11,
    subSize: 8,
    subBold: true,
    subLineHeight: 9,
    barcodeTextSize: 8,
    barcodeTextBold: false,
    barcodeHeight: 100,
    barcodeWidth: 100,
    barcodeYPosition: 70,
    labelWidth: 40,
    labelHeight: 26,
    labelPadding: 1,
    fontFamily: 'Arial, sans-serif',
    logoSize: 30,
    logoX: 50,
    logoY: 50,
    logoOpacity: 20
  };

  /* 儲存原始資料 */
  let productData = [];

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
        barcodeImage: '',
        barcodeNumber: ''
      };
      
      // 抓取商品名稱
      const mainElement = sample.querySelector('.spec_info .main');
      if (mainElement) {
        data.productName = mainElement.textContent.trim();
      }
      
      // 抓取規格、價格、編號等資訊
      const subElements = sample.querySelectorAll('.spec_info .sub');
      subElements.forEach(sub => {
        const text = sub.textContent.trim();
        if (text.includes('規格:') || text.includes('規格：')) {
          data.spec = text.replace(/規格[:：]\s*/, '');
        } else if (text.includes('特價:') || text.includes('特價：')) {
          data.specialPrice = text.replace(/特價[:：]\s*/, '');
        } else if (text.includes('售價:') || text.includes('售價：')) {
          data.price = text.replace(/售價[:：]\s*/, '');
        } else if (text.includes('cat-') || /^[A-Z0-9-]+$/.test(text)) {
          data.productCode = text;
        }
      });
      
      // 抓取條碼圖片
      const barcodeImg = sample.querySelector('.spec_barcode img');
      if (barcodeImg) {
        data.barcodeImage = barcodeImg.src;
      }
      
      // 抓取條碼數字
      const barcodeText = sample.querySelector('.spec_barcode .sub');
      if (barcodeText) {
        const text = barcodeText.textContent.trim();
        if (/\d{5,}/.test(text)) {
          const match = text.match(/\d{5,}/);
          data.barcodeNumber = match ? match[0] : '';
        } else {
          data.barcodeNumber = text;
        }
      }
      
      // 如果價格在條碼區域
      if (!data.price && !data.specialPrice) {
        const barcodePrice = sample.querySelector('.spec_barcode span.sub b');
        if (barcodePrice) {
          data.price = barcodePrice.textContent.trim();
        }
      }
      
      productData.push(data);
    });
    
    console.log('抓取到的產品資料:', productData);
  }
  
  /* 驗證行高合理性 */
  function validateLineHeight(fontSize, lineHeight) {
    const minLineHeight = Math.ceil(fontSize * 1.1);
    return Math.max(parseInt(lineHeight), minLineHeight);
  }
  
  /* 計算建議的行高 */
  function calculateSuggestedLineHeight(fontSize) {
    const size = parseInt(fontSize);
    return Math.round(size * 1.1);
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
      transform: scale(${isMobile ? 1 : 2});
      transform-origin: top left;
      width: ${isMobile ? '100%' : '50%'};
      margin: 0;
      padding: 20px;
      background: #f8f9fa;
    }
    
    /* body 保持原始大小 */
    body {
      margin: 0;
      padding: 0;
      background: #f8f9fa;
      overflow-x: ${isMobile ? 'hidden' : 'auto'};
    }
    
    /* 隱藏原本的列印按鈕 */
    body > button.no-print {
      display: none !important;
    }
    
    /* 隱藏原始內容 */
    .print_barcode_area .print_sample > * {
      display: none !important;
    }
    
    /* 新的標籤容器 */
    .bv-label-content {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
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
    
    /* 標籤懸停效果 */
    @media (hover: hover) {
      .print_sample:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }
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
  
    /* 主面板 - Liquid Glass 風格 */
    #bv-barcode-control-panel {
      position: fixed;
      right: 20px;
      top: 20px;
      bottom: 20px;
      width: 360px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Noto Sans TC', sans-serif;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    ${shouldUseMobileLayout ? `
      #bv-barcode-control-panel {
        bottom: 0;
        left: 0;
        right: 0;
        top: auto;
        width: 100%;
        max-height: 80vh;
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
    
    /* 樣式選擇器 */
    .bv-layout-selector {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .bv-layout-option {
      background: rgba(246, 246, 248, 0.5);
      border: 2px solid rgba(0, 0, 0, 0.06);
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }
    
    .bv-layout-option:hover {
      background: rgba(81, 138, 255, 0.05);
      border-color: rgba(81, 138, 255, 0.3);
    }
    
    .bv-layout-option.active {
      background: rgba(81, 138, 255, 0.1);
      border-color: #518aff;
      box-shadow: 0 0 0 3px rgba(81, 138, 255, 0.1);
    }
    
    .bv-layout-option-title {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 2px;
    }
    
    .bv-layout-option-desc {
      font-size: 11px;
      color: #86868b;
      line-height: 1.3;
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
    
    .bv-setting-label {
      font-size: 13px;
      font-weight: 500;
      color: #1a1a1a;
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
    
    /* 智能最佳化按鈕 */
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
    .label-background-logo {
      position: absolute !important;
      z-index: 1 !important;
      pointer-events: none;
      object-fit: contain !important;
    }
    
    /* 條碼圖層樣式 */
    .label-barcode-layer {
      position: absolute !important;
      z-index: 3 !important;
      pointer-events: none;
      object-fit: fill !important;
    }
    
    /* 條碼文字樣式 */
    .label-barcode-text {
      position: absolute !important;
      z-index: 4 !important;
      text-align: center !important;
      white-space: nowrap !important;
      pointer-events: none !important;
    }
    
    /* 標籤內容區域 */
    .bv-text-info {
      position: relative;
      z-index: 2;
      padding: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .bv-product-name {
      font-weight: 700;
      margin-bottom: 0;
    }
    
    .bv-product-spec,
    .bv-product-price,
    .bv-product-code {
      font-weight: 400;
    }
    
    .bv-barcode-area {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
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

  /* 建立控制面板 */
  setTimeout(() => {
    // 先抓取產品資料
    extractProductData();
    
    const panel = document.createElement('div');
    panel.id = 'bv-barcode-control-panel';
    panel.className = shouldUseMobileLayout ? 'minimized' : '';
    panel.innerHTML = `
      <div class="bv-glass-panel">
        <div class="bv-panel-header">
          <div class="bv-header-content">
            <div class="bv-icon-wrapper">
              <span class="material-icons">label</span>
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
            <!-- 樣式選擇 -->
            <div class="bv-settings-card">
              <h4 class="bv-card-title">
                <span class="material-icons">dashboard</span>
                樣式選擇
              </h4>
              
              <div class="bv-layout-selector">
                ${Object.entries(layoutTemplates).map(([key, template]) => `
                  <div class="bv-layout-option ${key === currentLayout ? 'active' : ''}" data-layout="${key}">
                    <div class="bv-layout-option-title">${template.name.split('：')[0]}</div>
                    <div class="bv-layout-option-desc">${template.description}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            
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
              </div>
            </div>
            
            <!-- 文字設定區塊 -->
            <div class="bv-settings-card" id="text-settings-card">
              <h4 class="bv-card-title">
                <span class="material-icons">text_fields</span>
                文字設定
              </h4>
              
              <div class="bv-slider-group">
                <!-- 商品名稱 -->
                <div class="bv-setting-item" id="main-text-setting" style="${layoutTemplates[currentLayout].showProductName ? '' : 'display:none'}">
                  <div class="bv-setting-info">
                    <span class="bv-setting-label">商品名稱</span>
                  </div>
                  <button class="bv-bold-button active" id="main-bold-btn" title="粗體">B</button>
                </div>
                
                <div class="bv-slider-item" id="main-size-setting" style="${layoutTemplates[currentLayout].showProductName ? '' : 'display:none'}">
                  <div class="bv-slider-header">
                    <span>文字大小</span>
                    <span class="bv-value-label" id="main-size">10px</span>
                  </div>
                  <input type="range" id="main-slider" min="8" max="20" value="10" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item" id="main-line-height-setting" style="${layoutTemplates[currentLayout].showProductName ? '' : 'display:none'}">
                  <div class="bv-slider-header">
                    <span>行高</span>
                    <span class="bv-value-label" id="main-line-height">11px</span>
                  </div>
                  <input type="range" id="main-line-height-slider" min="8" max="30" value="11" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item" id="main-gap-setting" style="${layoutTemplates[currentLayout].showProductName ? '' : 'display:none'}">
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
            
            <!-- 條碼圖片設定 -->
            <div class="bv-settings-card" id="barcode-settings-card">
              <h4 class="bv-card-title">
                <span class="material-icons">qr_code_2</span>
                條碼圖片設定
              </h4>
              
              <div class="bv-slider-group">
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>條碼圖片高度（Y軸拉伸）</span>
                    <span class="bv-value-label" id="barcode-height">100%</span>
                  </div>
                  <input type="range" id="barcode-height-slider" min="50" max="200" value="100" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>條碼圖片寬度（X軸拉伸）</span>
                    <span class="bv-value-label" id="barcode-width">100%</span>
                  </div>
                  <input type="range" id="barcode-width-slider" min="50" max="150" value="100" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>條碼垂直位置</span>
                    <span class="bv-value-label" id="barcode-y-position">70%</span>
                  </div>
                  <input type="range" id="barcode-y-position-slider" min="0" max="100" value="70" class="bv-glass-slider">
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
      input.style.background = `linear-gradient(to right, #518aff 0%, #7289DA ${value}%, rgba(0, 0, 0, 0.1) ${value}%, rgba(0, 0, 0, 0.1) 100%)`;
    }
    
    /* 重新建立標籤內容 */
    function rebuildLabels() {
      document.querySelectorAll('.print_sample').forEach((sample, index) => {
        // 清空原始內容
        sample.innerHTML = '';
        
        // 建立新的內容容器
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'bv-label-content';
        
        const template = layoutTemplates[currentLayout];
        const data = productData[index] || {};
        
        // 根據樣式建立內容
        if (template.showProductName || template.showSpec || template.showPrice || template.showProductCode) {
          const textInfo = document.createElement('div');
          textInfo.className = 'bv-text-info';
          
          // 商品名稱
          if (template.showProductName && data.productName) {
            const productName = document.createElement('div');
            productName.className = 'bv-product-name';
            productName.textContent = data.productName;
            textInfo.appendChild(productName);
          }
          
          // 規格
          if (template.showSpec && data.spec) {
            const spec = document.createElement('div');
            spec.className = 'bv-product-spec';
            spec.textContent = `規格: ${data.spec}`;
            textInfo.appendChild(spec);
          }
          
          // 價格（如果不在條碼區域顯示）
          if (template.showPrice && !template.priceInBarcode) {
            if (template.showSpecialPrice && data.specialPrice) {
              const specialPrice = document.createElement('div');
              specialPrice.className = 'bv-product-price';
              specialPrice.textContent = `特價: ${data.specialPrice}`;
              textInfo.appendChild(specialPrice);
            } else if (data.price) {
              const price = document.createElement('div');
              price.className = 'bv-product-price';
              price.textContent = `售價: ${data.price}`;
              textInfo.appendChild(price);
            }
          }
          
          // 產品編號
          if (template.showProductCode && data.productCode) {
            const productCode = document.createElement('div');
            productCode.className = 'bv-product-code';
            productCode.textContent = data.productCode;
            textInfo.appendChild(productCode);
          }
          
          // 內嵌條碼（樣式三、四）
          if (template.barcodePosition === 'inline' && template.showBarcode && data.barcodeImage) {
            const barcodeArea = document.createElement('div');
            barcodeArea.className = 'bv-barcode-area bv-inline-barcode';
            
            const barcodeImg = document.createElement('img');
            barcodeImg.className = 'bv-barcode-image';
            barcodeImg.src = data.barcodeImage;
            barcodeArea.appendChild(barcodeImg);
            
            if (data.barcodeNumber) {
              const barcodeText = document.createElement('div');
              barcodeText.className = 'bv-barcode-text';
              barcodeText.textContent = data.barcodeNumber;
              barcodeArea.appendChild(barcodeText);
            }
            
            textInfo.appendChild(barcodeArea);
          }
          
          contentWrapper.appendChild(textInfo);
        }
        
        // 底部或中間條碼
        if ((template.barcodePosition === 'bottom' || template.barcodePosition === 'middle' || template.barcodePosition === 'center') 
            && template.showBarcode && data.barcodeImage) {
          const barcodeArea = document.createElement('div');
          barcodeArea.className = 'bv-barcode-area';
          
          const barcodeImg = document.createElement('img');
          barcodeImg.className = 'bv-barcode-image';
          barcodeImg.src = data.barcodeImage;
          barcodeArea.appendChild(barcodeImg);
          
          if (data.barcodeNumber) {
            const barcodeText = document.createElement('div');
            barcodeText.className = 'bv-barcode-text';
            
            // 如果價格顯示在條碼區域
            if (template.priceInBarcode && data.price) {
              barcodeText.innerHTML = `${data.barcodeNumber}<br><b>${data.price}</b>`;
            } else {
              barcodeText.textContent = data.barcodeNumber;
            }
            
            barcodeArea.appendChild(barcodeText);
          }
          
          contentWrapper.appendChild(barcodeArea);
        }
        
        sample.appendChild(contentWrapper);
      });
      
      // 更新樣式
      updateStyles();
    }
    
    /* 樣式選擇事件 */
    document.querySelectorAll('.bv-layout-option').forEach(option => {
      option.addEventListener('click', function() {
        // 移除所有 active 類
        document.querySelectorAll('.bv-layout-option').forEach(opt => opt.classList.remove('active'));
        // 添加 active 到當前選項
        this.classList.add('active');
        
        // 更新當前樣式
        currentLayout = this.dataset.layout;
        
        // 更新文字設定區塊的顯示狀態
        const template = layoutTemplates[currentLayout];
        const mainTextSetting = document.getElementById('main-text-setting');
        const mainSizeSetting = document.getElementById('main-size-setting');
        const mainLineHeightSetting = document.getElementById('main-line-height-setting');
        const mainGapSetting = document.getElementById('main-gap-setting');
        const textSettingsCard = document.getElementById('text-settings-card');
        
        if (template.showProductName) {
          mainTextSetting.style.display = '';
          mainSizeSetting.style.display = '';
          mainLineHeightSetting.style.display = '';
          mainGapSetting.style.display = '';
        } else {
          mainTextSetting.style.display = 'none';
          mainSizeSetting.style.display = 'none';
          mainLineHeightSetting.style.display = 'none';
          mainGapSetting.style.display = 'none';
        }
        
        // 如果是純條碼樣式，隱藏整個文字設定區塊
        if (currentLayout === 'style8') {
          textSettingsCard.style.display = 'none';
        } else {
          textSettingsCard.style.display = '';
        }
        
        // 重建標籤
        rebuildLabels();
        
        // 顯示通知
        showNotification(`已切換至${template.name.split('：')[0]}`);
      });
    });
    
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
      const fontFamily = document.getElementById('font-family-select');
      
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
        
        // 基於標籤大小計算基礎字體大小
        const baseFontSize = Math.min(availableWidth / 4, availableHeight / 2.5);
        
        // 根據寬度分類並套用美學比例
        if (labelWidthMM <= 30) {
          // 超小標籤
          optimizedSettings = {
            mainSize: Math.round(baseFontSize * 0.8),
            mainLineHeight: Math.round(baseFontSize * 0.88),
            mainGap: 0,
            subSize: Math.round(baseFontSize * 0.65),
            subLineHeight: Math.round(baseFontSize * 0.715),
            barcodeTextSize: Math.round(baseFontSize * 0.65),
            barcodeHeight: 90,
            barcodeWidth: 95,
            barcodeYPosition: 65,
            labelPadding: Math.min(paddingMM, 0.5)
          };
        } else if (labelWidthMM <= 35) {
          // 小標籤
          optimizedSettings = {
            mainSize: Math.round(baseFontSize * 0.85),
            mainLineHeight: Math.round(baseFontSize * 0.935),
            mainGap: 0,
            subSize: Math.round(baseFontSize * 0.68),
            subLineHeight: Math.round(baseFontSize * 0.748),
            barcodeTextSize: Math.round(baseFontSize * 0.68),
            barcodeHeight: 95,
            barcodeWidth: 98,
            barcodeYPosition: 68,
            labelPadding: Math.min(paddingMM, 0.8)
          };
        } else if (labelWidthMM <= 45) {
          // 標準標籤
          optimizedSettings = {
            mainSize: Math.round(baseFontSize * 0.9),
            mainLineHeight: Math.round(baseFontSize * 0.99),
            mainGap: 0,
            subSize: Math.round(baseFontSize * 0.72),
            subLineHeight: Math.round(baseFontSize * 0.792),
            barcodeTextSize: Math.round(baseFontSize * 0.72),
            barcodeHeight: 100,
            barcodeWidth: 100,
            barcodeYPosition: 70,
            labelPadding: paddingMM
          };
        } else if (labelWidthMM <= 55) {
          // 中型標籤
          optimizedSettings = {
            mainSize: Math.round(baseFontSize * 0.95),
            mainLineHeight: Math.round(baseFontSize * 1.045),
            mainGap: 0.5,
            subSize: Math.round(baseFontSize * 0.76),
            subLineHeight: Math.round(baseFontSize * 0.836),
            barcodeTextSize: Math.round(baseFontSize * 0.76),
            barcodeHeight: 105,
            barcodeWidth: 100,
            barcodeYPosition: 72,
            labelPadding: paddingMM
          };
        } else {
          // 大標籤
          optimizedSettings = {
            mainSize: Math.round(baseFontSize),
            mainLineHeight: Math.round(baseFontSize * 1.1),
            mainGap: 1,
            subSize: Math.round(baseFontSize * 0.8),
            subLineHeight: Math.round(baseFontSize * 0.88),
            barcodeTextSize: Math.round(baseFontSize * 0.8),
            barcodeHeight: 110,
            barcodeWidth: 100,
            barcodeYPosition: 75,
            labelPadding: paddingMM
          };
        }
        
        // 特殊高度調整
        if (labelHeightMM <= 20) {
          // 超矮標籤
          optimizedSettings.barcodeHeight = Math.max(optimizedSettings.barcodeHeight - 20, 70);
          optimizedSettings.barcodeYPosition = 60;
        } else if (labelHeightMM <= 25) {
          // 矮標籤
          optimizedSettings.barcodeHeight = Math.max(optimizedSettings.barcodeHeight - 10, 80);
        } else if (labelHeightMM >= 35) {
          // 高標籤
          optimizedSettings.barcodeHeight = Math.min(optimizedSettings.barcodeHeight + 10, 120);
        }
        
        // 根據寬高比進一步美化
        if (aspectRatio < 1.2) {
          // 接近正方形
          optimizedSettings.barcodeWidth = Math.min(optimizedSettings.barcodeWidth, 90);
        } else if (aspectRatio > 2.5) {
          // 特別寬
          optimizedSettings.barcodeWidth = Math.max(optimizedSettings.barcodeWidth - 10, 85);
        }
        
        // 確保最小值符合原CSS規範
        optimizedSettings.mainSize = Math.max(8, optimizedSettings.mainSize);
        optimizedSettings.subSize = Math.max(6, optimizedSettings.subSize);
        optimizedSettings.barcodeTextSize = Math.max(6, optimizedSettings.barcodeTextSize);
        
        // 套用最佳化設定
        applyOptimizedSettings(optimizedSettings);
        
        // 顯示詳細通知
        showNotification(`已針對 ${labelWidthMM}×${labelHeightMM}mm 標籤智能優化排版`);
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
        
        // 立即更新樣式
        updateStyles();
      }

      /* 更新樣式函數 */
      function updateStyles() {
        if (!mainSize || !subSize) return;
        
        const mainLineHeight = mainLineHeightSlider ? mainLineHeightSlider.value : 11;
        const subLineHeight = subLineHeightSlider ? subLineHeightSlider.value : 9;
        
        const template = layoutTemplates[currentLayout];
        const validatedMainLineHeight = validateLineHeight(mainSize.value, mainLineHeight);
        const validatedSubLineHeight = validateLineHeight(subSize.value, subLineHeight);
        
        const mainFontWeight = mainBoldBtn && mainBoldBtn.classList.contains('active') ? 700 : 400;
        const subFontWeight = subBoldBtn && subBoldBtn.classList.contains('active') ? 700 : 400;
        const barcodeTextFontWeight = barcodeTextBoldBtn && barcodeTextBoldBtn.classList.contains('active') ? 700 : 400;
        
        const totalWidth = parseFloat(labelWidth.value);
        const totalHeight = parseFloat(labelHeight.value);
        const paddingValue = parseFloat(labelPadding.value);
        
        const barcodeYPercent = barcodeYPosition ? parseFloat(barcodeYPosition.value) : 70;
        const barcodeHeightScale = barcodeHeight ? parseFloat(barcodeHeight.value) / 100 : 1;
        const barcodeWidthScale = barcodeWidth ? parseFloat(barcodeWidth.value) / 100 : 1;
        
        // 計算條碼實際尺寸（拉伸後）
        const barcodeHeightMM = 10 * barcodeHeightScale; // 基礎高度 10mm
        const barcodeWidthMM = (totalWidth * 0.9) * barcodeWidthScale;
        
        /* 更新顯示值 */
        document.getElementById('main-size').textContent = mainSize.value + 'px';
        document.getElementById('main-gap').textContent = mainGap.value + 'px';
        document.getElementById('sub-size').textContent = subSize.value + 'px';
        
        document.getElementById('barcode-text-size').textContent = barcodeTextSize.value + 'px';
        document.getElementById('barcode-height').textContent = (barcodeHeightScale * 100).toFixed(0) + '%';
        document.getElementById('barcode-width').textContent = (barcodeWidthScale * 100).toFixed(0) + '%';
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
            padding: ${paddingValue}mm !important;
            box-sizing: border-box !important;
            position: relative !important;
          }
          
          /* 標籤內容容器 */
          .bv-label-content {
            justify-content: ${template.barcodePosition === 'center' ? 'center' : 'space-between'} !important;
            align-items: ${template.barcodePosition === 'center' ? 'center' : 'stretch'} !important;
          }
          
          /* 文字區域樣式 */
          .bv-text-info {
            font-family: ${fontFamily.value} !important;
            text-align: left !important;
            ${template.barcodePosition === 'middle' ? 'margin-bottom: 2mm;' : ''}
          }
          
          /* 商品名稱 */
          .bv-product-name {
            font-size: ${mainSize.value}px !important;
            line-height: ${validatedMainLineHeight}px !important;
            font-weight: ${mainFontWeight} !important;
            margin-bottom: ${mainGap.value}px !important;
            word-break: break-all !important;
          }
          
          /* 規格/價格/編號 */
          .bv-product-spec,
          .bv-product-price,
          .bv-product-code {
            font-size: ${subSize.value}px !important;
            line-height: ${validatedSubLineHeight}px !important;
            font-weight: ${subFontWeight} !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          
          /* 條碼區域 */
          .bv-barcode-area {
            text-align: center !important;
            ${template.barcodePosition === 'middle' ? 'margin-top: 2mm;' : ''}
          }
          
          /* 內嵌條碼樣式 */
          .bv-inline-barcode {
            margin: 3px 0 !important;
          }
          
          .bv-inline-barcode .bv-barcode-image {
            height: 8mm !important;
            width: auto !important;
            max-width: 90% !important;
          }
          
          /* 條碼圖片 - 使用獨立圖層 */
          .bv-barcode-image {
            display: none !important;
          }
          
          /* 條碼文字 */
          .bv-barcode-text {
            font-size: ${barcodeTextSize.value}px !important;
            font-weight: ${barcodeTextFontWeight} !important;
            font-family: ${fontFamily.value} !important;
            line-height: 1.2 !important;
            margin-top: 2px !important;
          }
          
          /* 條碼獨立圖層 */
          .label-barcode-layer {
            left: 50% !important;
            top: ${barcodeYPercent}% !important;
            transform: translate(-50%, -50%) !important;
            width: ${barcodeWidthMM}mm !important;
            height: ${barcodeHeightMM}mm !important;
            max-width: none !important;
            max-height: none !important;
            display: ${template.showBarcode && template.barcodePosition !== 'inline' ? 'block' : 'none'} !important;
          }
          
          /* 條碼文字圖層 */
          .label-barcode-text {
            left: 50% !important;
            top: ${barcodeYPercent}% !important;
            transform: translate(-50%, calc(-50% + ${barcodeHeightMM/2}mm + 2px)) !important;
            font-size: ${barcodeTextSize.value}px !important;
            font-weight: ${barcodeTextFontWeight} !important;
            font-family: ${fontFamily.value} !important;
            color: black !important;
            display: ${template.showBarcode && template.barcodePosition !== 'inline' ? 'block' : 'none'} !important;
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
        
        /* 更新所有標籤的圖層 */
        updateAllLayers();
        
        /* 自動保存當前設定為臨時設定 */
        saveSettingsToLocal('_current_temp_settings', saveCurrentSettings());
      }
      
      /* 更新所有標籤的圖層 */
      function updateAllLayers() {
        // 移除現有圖層
        document.querySelectorAll('.label-background-logo, .label-barcode-layer, .label-barcode-text').forEach(layer => layer.remove());
        
        // 為每個標籤添加圖層
        document.querySelectorAll('.print_sample').forEach((sample, index) => {
          const template = layoutTemplates[currentLayout];
          const data = productData[index] || {};
          
          // 添加底圖
          if (logoDataUrl) {
            const logo = document.createElement('img');
            logo.className = 'label-background-logo';
            logo.src = logoDataUrl;
            sample.insertBefore(logo, sample.firstChild);
          }
          
          // 添加條碼圖片（獨立圖層，非內嵌）
          if (template.showBarcode && template.barcodePosition !== 'inline' && data.barcodeImage) {
            const barcode = document.createElement('img');
            barcode.className = 'label-barcode-layer';
            barcode.src = data.barcodeImage;
            sample.appendChild(barcode);
            
            // 添加條碼文字
            if (data.barcodeNumber) {
              const barcodeText = document.createElement('div');
              barcodeText.className = 'label-barcode-text';
              
              // 如果價格顯示在條碼區域
              if (template.priceInBarcode && data.price) {
                barcodeText.innerHTML = `${data.barcodeNumber}<br><b>${data.price}</b>`;
              } else {
                barcodeText.textContent = data.barcodeNumber;
              }
              
              sample.appendChild(barcodeText);
            }
          }
        });
      }
      
      /* 添加事件監聽器 */
      const controls = [
        mainSize, mainGap, mainLineHeightSlider,
        subSize, subLineHeightSlider,
        barcodeTextSize, barcodeHeight, barcodeWidth, barcodeYPosition,
        labelWidth, labelHeight, labelPadding, fontFamily,
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
            
            applySavedSettings(completeDefaultSettings);
            
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
          layout: currentLayout,
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
          barcodeYPosition: barcodeYPosition ? barcodeYPosition.value : 70,
          labelWidth: labelWidth.value,
          labelHeight: labelHeight.value,
          labelPadding: labelPadding.value,
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
        
        // 載入樣式
        if (settings.layout && layoutTemplates[settings.layout]) {
          currentLayout = settings.layout;
          document.querySelectorAll('.bv-layout-option').forEach(opt => {
            opt.classList.remove('active');
            if (opt.dataset.layout === currentLayout) {
              opt.classList.add('active');
            }
          });
          rebuildLabels();
        }
        
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
        
        applySavedSettings(completeDefaultSettings);
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
      rebuildLabels();
      
      /* 將函數掛載到 window 物件 */
      window.barcodeEditor = {
        updateStyles,
        saveCurrentSettings,
        applySavedSettings,
        showNotification,
        updateAllLayers,
        optimizeLayoutForLabelSize,
        productData,
        currentLayout
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
                    
