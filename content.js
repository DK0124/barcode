javascript:(function(){
  /* BV SHOP 條碼列印排版器 - 全新模板系統 v6 */
  
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

  /* 預設尺寸選項 */
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
        barcodeHeight: 100,
        barcodeWidth: 100
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
        barcodeHeight: 100,
        barcodeWidth: 100
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
        barcodeHeight: 110,
        barcodeWidth: 100
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
        barcodeHeight: 35,
        barcodeWidth: 100
      }
    }
  ];

  /* 排版模板系統 */
  const layoutTemplates = {
    standard: {
      name: '標準版',
      description: '名稱、規格、價格、條碼依序排列',
      icon: 'view_agenda',
      render: (data) => `
        <div class="bv-label-content" data-layout="standard">
          <div class="bv-text-area">
            ${data.name ? `<div class="bv-product-name">${data.name}</div>` : ''}
            ${data.spec ? `<div class="bv-spec">${data.spec}</div>` : ''}
            ${data.price ? `<div class="bv-price">${data.price}</div>` : ''}
            ${data.specialPrice ? `<div class="bv-special-price">${data.specialPrice}</div>` : ''}
          </div>
          <div class="bv-barcode-area">
            ${data.barcodeImage ? `<img class="bv-barcode-img" src="${data.barcodeImage}" alt="barcode">` : ''}
            ${data.barcode ? `<div class="bv-barcode-text">${data.barcode}</div>` : ''}
          </div>
        </div>
      `
    },
    
    compact: {
      name: '精簡版',
      description: '只顯示名稱、規格和條碼',
      icon: 'compress',
      render: (data) => `
        <div class="bv-label-content" data-layout="compact">
          <div class="bv-text-area">
            ${data.name ? `<div class="bv-product-name">${data.name}</div>` : ''}
            ${data.spec ? `<div class="bv-spec">${data.spec}</div>` : ''}
          </div>
          <div class="bv-barcode-area">
            ${data.barcodeImage ? `<img class="bv-barcode-img" src="${data.barcodeImage}" alt="barcode">` : ''}
            ${data.barcode ? `<div class="bv-barcode-text">${data.barcode}</div>` : ''}
          </div>
        </div>
      `
    },
    
    embedded: {
      name: '條碼嵌入',
      description: '條碼在文字中間',
      icon: 'vertical_split',
      render: (data) => `
        <div class="bv-label-content" data-layout="embedded">
          <div class="bv-all-in-one">
            ${data.name ? `<div class="bv-product-name">${data.name}</div>` : ''}
            ${data.spec ? `<div class="bv-spec">${data.spec}</div>` : ''}
            ${data.barcode ? `<div class="bv-barcode-text-top">${data.barcode}</div>` : ''}
            <div class="bv-barcode-embedded">
              ${data.barcodeImage ? `<img class="bv-barcode-img" src="${data.barcodeImage}" alt="barcode">` : ''}
            </div>
            ${data.price ? `<div class="bv-price">${data.price}</div>` : ''}
            ${data.specialPrice ? `<div class="bv-special-price">${data.specialPrice}</div>` : ''}
          </div>
        </div>
      `
    },
    
    priceRight: {
      name: '價格置右',
      description: '價格顯示在條碼右上方',
      icon: 'align_horizontal_right',
      render: (data) => `
        <div class="bv-label-content" data-layout="price-right">
          <div class="bv-text-area">
            ${data.name ? `<div class="bv-product-name">${data.name}</div>` : ''}
            ${data.spec ? `<div class="bv-spec">${data.spec}</div>` : ''}
            ${data.sku ? `<div class="bv-sku">${data.sku}</div>` : ''}
          </div>
          <div class="bv-barcode-area">
            <div class="bv-price-float">
              ${[data.price, data.specialPrice].filter(Boolean).join(' ')}
            </div>
            ${data.barcodeImage ? `<img class="bv-barcode-img" src="${data.barcodeImage}" alt="barcode">` : ''}
            ${data.barcode ? `<div class="bv-barcode-text">${data.barcode}</div>` : ''}
          </div>
        </div>
      `
    },
    
    pureBarcode: {
      name: '純條碼',
      description: '只顯示條碼和號碼',
      icon: 'qr_code',
      render: (data) => `
        <div class="bv-label-content" data-layout="pure-barcode">
          <div class="bv-barcode-only">
            ${data.barcodeImage ? `<img class="bv-barcode-img" src="${data.barcodeImage}" alt="barcode">` : ''}
            ${data.barcode ? `<div class="bv-barcode-text">${data.barcode}</div>` : ''}
          </div>
        </div>
      `
    },
    
    custom: {
      name: '自訂版',
      description: '自由選擇顯示欄位',
      icon: 'tune',
      fields: {
        name: '商品名稱',
        spec: '規格',
        sku: 'SKU/貨號',
        price: '售價',
        specialPrice: '特價',
        barcode: '條碼數字'
      },
      render: (data, selectedFields = ['name', 'spec', 'price', 'barcode']) => {
        let html = '<div class="bv-label-content" data-layout="custom"><div class="bv-custom-content">';
        
        // 文字區域
        const textFields = selectedFields.filter(f => f !== 'barcode' && data[f]);
        if (textFields.length > 0) {
          html += '<div class="bv-text-area">';
          textFields.forEach(field => {
            if (field === 'name') {
              html += `<div class="bv-product-name">${data.name}</div>`;
            } else if (field === 'spec') {
              html += `<div class="bv-spec">${data.spec}</div>`;
            } else if (field === 'sku') {
              html += `<div class="bv-sku">${data.sku}</div>`;
            } else if (field === 'price') {
              html += `<div class="bv-price">${data.price}</div>`;
            } else if (field === 'specialPrice') {
              html += `<div class="bv-special-price">${data.specialPrice}</div>`;
            }
          });
          html += '</div>';
        }
        
        // 條碼區域
        if (data.barcodeImage) {
          html += '<div class="bv-barcode-area">';
          html += `<img class="bv-barcode-img" src="${data.barcodeImage}" alt="barcode">`;
          if (selectedFields.includes('barcode') && data.barcode) {
            html += `<div class="bv-barcode-text">${data.barcode}</div>`;
          }
          html += '</div>';
        }
        
        html += '</div></div>';
        return html;
      }
    }
  };

  /* 初始變數 */
  let currentTemplate = 'standard';
  let customSelectedFields = ['name', 'spec', 'price', 'barcode'];
  let productData = [];
  let isPanelMinimized = false;
  let collapsedSections = {};
  
  /* Logo 相關變數 */
  let logoDataUrl = null;
  let logoAspectRatio = 1;

  /* 完整的預設值物件 */
  const defaultSettings = {
    template: 'standard',
    customFields: ['name', 'spec', 'price', 'barcode'],
    mainSize: 10,
    mainBold: true,
    subSize: 8,
    subBold: true,
    barcodeTextSize: 8,
    barcodeTextBold: true,
    barcodeHeight: 100,
    barcodeWidth: 100,
    labelWidth: 40,
    labelHeight: 30,
    fontFamily: 'Arial, sans-serif',
    priceGap: 0,
    logoSize: 30,
    logoX: 50,
    logoY: 50,
    logoOpacity: 20
  };

  /* 統一資料抓取函數 */
  function extractUnifiedProductData() {
    const samples = document.querySelectorAll('.print_sample');
    const products = [];
    
    samples.forEach((sample) => {
      const product = {
        name: '',
        spec: '',
        price: '',
        specialPrice: '',
        sku: '',
        barcode: '',
        barcodeImage: '',
        allTexts: []
      };
      
      // 保存原始 HTML
      product.originalHTML = sample.innerHTML;
      
      // 抓取商品名稱
      const mainEl = sample.querySelector('.main');
      if (mainEl) {
        product.name = mainEl.textContent.trim();
      }
      
      // 抓取條碼圖片
      const barcodeImg = sample.querySelector('img[alt="barcode"], .spec_barcode img');
      if (barcodeImg) {
        product.barcodeImage = barcodeImg.src;
      }
      
      // 抓取所有 .sub 內容
      const subs = sample.querySelectorAll('.sub');
      subs.forEach(sub => {
        const text = sub.textContent.trim();
        if (!text) return;
        
        product.allTexts.push(text);
        
        // 智能分類
        if (/^\d{10,}$/.test(text)) {
          product.barcode = text;
        } else if (text.includes('/') && !text.includes('$')) {
          product.spec = text;
        } else if (text.includes('售價')) {
          product.price = text;
        } else if (text.includes('特價')) {
          product.specialPrice = text;
        } else if (/^[A-Za-z0-9\-_]{3,20}$/.test(text) && !text.includes('$')) {
          product.sku = text;
        }
      });
      
      // 處理價格可能在 <b> 標籤內
      const boldTexts = sample.querySelectorAll('b');
      boldTexts.forEach(b => {
        const text = b.textContent.trim();
        if (text.includes('售價') || text.includes('特價')) {
          const parts = text.split(/\s+/);
          parts.forEach(part => {
            if (part.includes('售價')) product.price = part;
            if (part.includes('特價')) product.specialPrice = part;
          });
        }
      });
      
      // 如果還沒找到條碼，檢查所有文字
      if (!product.barcode) {
        product.allTexts.forEach(text => {
          if (/^\d{10,}$/.test(text)) {
            product.barcode = text;
          }
        });
      }
      
      products.push(product);
    });
    
    console.log('抓取到的產品資料：', products);
    return products;
  }

  /* 重新渲染標籤 */
  function rerenderLabels(templateKey = null, selectedFields = null) {
    if (templateKey) currentTemplate = templateKey;
    if (selectedFields) customSelectedFields = selectedFields;
    
    const template = layoutTemplates[currentTemplate];
    
    document.querySelectorAll('.print_sample').forEach((sample, index) => {
      const product = productData[index];
      if (!product) return;
      
      // 使用模板渲染
      if (currentTemplate === 'custom') {
        sample.innerHTML = template.render(product, customSelectedFields);
      } else {
        sample.innerHTML = template.render(product);
      }
      
      // 添加自訂類別
      sample.className = 'print_sample bv-custom-layout';
      sample.setAttribute('data-template', currentTemplate);
    });
    
    // 更新樣式
    updateStyles();
    
    // 更新底圖
    updateAllLogos();
  }

  /* 建立動態樣式元素 */
  const dynamicStyle = document.createElement('style');
  document.head.appendChild(dynamicStyle);

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
  
    /* 主面板 */
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
        0 0 0 0.5px rgba(255, 255, 255, 0.2);
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
        0 0 0 0.5px rgba(255, 255, 255, 0.3);
    }
    
    #bv-barcode-control-panel.minimized ~ .bv-floating-button {
      display: flex;
    }
    
    /* 面板標題 */
    .bv-panel-header {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      background: rgba(255, 255, 255, 0.7);
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
      box-shadow: 0 2px 8px rgba(81, 138, 255, 0.2);
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
    
    /* 當前模板顯示 */
    .bv-current-template {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
      margin-top: 4px;
    }
    
    .bv-current-template-name {
      color: #518aff;
      font-weight: 500;
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
    
    /* 模板選擇網格 */
    .bv-template-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .bv-template-option {
      background: rgba(255, 255, 255, 0.8);
      border: 2px solid rgba(0, 0, 0, 0.08);
      border-radius: 10px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }
    
    .bv-template-option:hover {
      background: rgba(255, 255, 255, 0.95);
      border-color: rgba(81, 138, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    .bv-template-option.active {
      background: linear-gradient(135deg, rgba(81, 138, 255, 0.1) 0%, rgba(0, 64, 255, 0.1) 100%);
      border-color: #518aff;
      box-shadow: 0 0 0 3px rgba(81, 138, 255, 0.1);
    }
    
    .bv-template-icon {
      font-size: 32px;
      color: rgba(0, 0, 0, 0.5);
      margin-bottom: 8px;
    }
    
    .bv-template-option.active .bv-template-icon {
      color: #518aff;
    }
    
    .bv-template-name {
      font-size: 14px;
      font-weight: 600;
      color: #000;
      margin-bottom: 4px;
    }
    
    .bv-template-desc {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
      line-height: 1.3;
    }
    
    /* 自訂欄位選擇 */
    .bv-checkbox-group {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .bv-checkbox-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #000;
      cursor: pointer;
    }
    
    .bv-checkbox-group input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
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
      box-shadow: 0 2px 8px rgba(81, 138, 255, 0.25);
    }
    
    .bv-preset-size-btn[data-type="brother"].active {
      background: linear-gradient(135deg, #014898 0%, #003070 100%);
      box-shadow: 0 2px 8px rgba(1, 72, 152, 0.25);
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
    
    .bv-glass-slider::-webkit-slider-thumb:hover {
      transform: scale(1.1);
      box-shadow: 
        0 2px 8px rgba(0, 0, 0, 0.2),
        0 0 0 0.5px rgba(0, 0, 0, 0.08);
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
    
    /* Logo 上傳樣式 */
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
    
    /* 底圖在標籤上的樣式 */
    .label-background-logo {
      position: absolute !important;
      z-index: 1 !important;
      pointer-events: none;
      object-fit: contain !important;
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
    // 抓取產品資料
    productData = extractUnifiedProductData();
    
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
              <div class="bv-current-template">
                目前使用：<span class="bv-current-template-name">${layoutTemplates[currentTemplate].name}</span>
              </div>
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
            <!-- 主要操作區 -->
            <div class="bv-primary-section">
              <button class="bv-reset-button" id="bv-reset-format">
                <div class="bv-button-icon">
                  <span class="material-icons">restart_alt</span>
                </div>
                <div class="bv-button-content">
                  <span class="bv-button-title">重新整理資料</span>
                  <span class="bv-button-subtitle">重新抓取並分析標籤內容</span>
                </div>
              </button>
            </div>
            
            <!-- 排版模板選擇 -->
            <div class="bv-settings-card" data-section="template">
              <h4 class="bv-card-title">
                <span class="material-icons">dashboard</span>
                排版模板
                <span class="material-icons bv-collapse-icon">expand_more</span>
              </h4>
              
              <div class="bv-card-content">
                <div class="bv-template-grid">
                  ${Object.entries(layoutTemplates).map(([key, template]) => `
                    <div class="bv-template-option ${key === currentTemplate ? 'active' : ''}" data-template="${key}">
                      <div class="bv-template-icon material-icons">${template.icon}</div>
                      <div class="bv-template-name">${template.name}</div>
                      <div class="bv-template-desc">${template.description}</div>
                    </div>
                  `).join('')}
                </div>
                
                <!-- 自訂版的欄位選擇 -->
                <div id="custom-fields-selector" style="display: ${currentTemplate === 'custom' ? 'block' : 'none'}; margin-top: 20px;">
                  <div class="bv-setting-item">
                    <span class="bv-setting-label">選擇要顯示的欄位：</span>
                  </div>
                  <div class="bv-checkbox-group">
                    ${Object.entries(layoutTemplates.custom.fields).map(([key, label]) => `
                      <label>
                        <input type="checkbox" value="${key}" ${customSelectedFields.includes(key) ? 'checked' : ''}>
                        ${label}
                      </label>
                    `).join('')}
                  </div>
                </div>
              </div>
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
                    <input type="range" id="main-slider" min="4" max="20" value="10" class="bv-glass-slider">
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
                  
                  <!-- 價格間距設定（特定模板用） -->
                  <div class="bv-slider-item" id="price-gap-setting" style="display: none;">
                    <div class="bv-slider-header">
                      <span>價格與條碼間距</span>
                      <span class="bv-value-label" id="price-gap">0mm</span>
                    </div>
                    <input type="range" id="price-gap-slider" min="-5" max="10" value="0" class="bv-glass-slider">
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
                  <div class="bv-slider-item">
                    <div class="bv-slider-header">
                      <span>條碼圖片高度（Y軸拉伸）</span>
                      <span class="bv-value-label" id="barcode-height">100%</span>
                    </div>
                    <input type="range" id="barcode-height-slider" min="30" max="200" value="100" class="bv-glass-slider">
                  </div>
                  
                  <div class="bv-slider-item">
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
    
    /* 更新樣式函數 */
    function updateStyles() {
      const mainSize = document.getElementById('main-slider');
      const subSize = document.getElementById('sub-slider');
      const barcodeTextSize = document.getElementById('barcode-text-slider');
      const barcodeHeight = document.getElementById('barcode-height-slider');
      const barcodeWidth = document.getElementById('barcode-width-slider');
      const labelWidth = document.getElementById('label-width-slider');
      const labelHeight = document.getElementById('label-height-slider');
      const fontFamily = document.getElementById('font-family-select');
      const priceGapSlider = document.getElementById('price-gap-slider');
      
      if (!mainSize || !subSize) return;
      
      const mainFontWeight = document.getElementById('main-bold-btn')?.classList.contains('active') ? 700 : 400;
      const subFontWeight = document.getElementById('sub-bold-btn')?.classList.contains('active') ? 700 : 400;
      const barcodeTextFontWeight = document.getElementById('barcode-text-bold-btn')?.classList.contains('active') ? 700 : 400;
      
      const totalWidth = parseFloat(labelWidth.value);
      const totalHeight = parseFloat(labelHeight.value);
      
      // Brother 標籤左邊界要多 1mm
      const isBrotherLabel = totalWidth == 42 || totalWidth == 29;
      const paddingLeft = isBrotherLabel ? 4 : 3;
      const paddingOther = 3;
      
      const barcodeHeightScale = parseFloat(barcodeHeight.value) / 100;
      const barcodeWidthScale = parseFloat(barcodeWidth.value) / 100;
      const priceGap = priceGapSlider ? parseFloat(priceGapSlider.value) : 0;
      
      // 計算條碼尺寸
      let barcodeHeightMM = 10 * barcodeHeightScale;
      let barcodeWidthMM = (totalWidth - paddingLeft - paddingOther) * barcodeWidthScale;
      
      // 更新顯示值
      document.getElementById('main-size').textContent = mainSize.value + 'px';
      document.getElementById('sub-size').textContent = subSize.value + 'px';
      document.getElementById('barcode-text-size').textContent = barcodeTextSize.value + 'px';
      document.getElementById('barcode-height').textContent = (barcodeHeightScale * 100).toFixed(0) + '%';
      document.getElementById('barcode-width').textContent = (barcodeWidthScale * 100).toFixed(0) + '%';
      if (document.getElementById('price-gap')) {
        document.getElementById('price-gap').textContent = priceGap + 'mm';
      }
      document.getElementById('label-width').textContent = labelWidth.value + 'mm';
      document.getElementById('label-height').textContent = labelHeight.value + 'mm';
      
      const logoHeightMM = document.getElementById('logo-size-slider') ? 
        parseFloat(labelHeight.value) * parseFloat(document.getElementById('logo-size-slider').value) / 100 : 0;
      const logoWidthMM = logoHeightMM * logoAspectRatio;
      
      // 更新所有滑桿的進度條
      document.querySelectorAll('input[type="range"]').forEach(input => {
        const value = (input.value - input.min) / (input.max - input.min) * 100;
        input.style.setProperty('--value', value + '%');
        input.style.background = `linear-gradient(to right, #518aff 0%, #518aff ${value}%, rgba(0, 0, 0, 0.08) ${value}%, rgba(0, 0, 0, 0.08) 100%)`;
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
        
        /* 新的標籤內容結構 */
        .bv-label-content {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          font-family: ${fontFamily.value} !important;
          position: relative !important;
          z-index: 2 !important;
        }
        
        /* 標準版和精簡版佈局 */
        .bv-label-content[data-layout="standard"],
        .bv-label-content[data-layout="compact"] {
          justify-content: space-between !important;
        }
        
        /* 文字區域 */
        .bv-text-area {
          display: flex !important;
          flex-direction: column !important;
          gap: 2px !important;
          flex-shrink: 0 !important;
        }
        
        /* 商品名稱 */
        .bv-product-name {
          font-size: ${mainSize.value}px !important;
          font-weight: ${mainFontWeight} !important;
          line-height: 1.2 !important;
          word-break: break-all !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
        }
        
        /* 規格、SKU、價格 */
        .bv-spec,
        .bv-sku,
        .bv-price,
        .bv-special-price {
          font-size: ${subSize.value}px !important;
          font-weight: ${subFontWeight} !important;
          line-height: 1.15 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        
        /* SKU 特殊樣式 */
        .bv-sku {
          font-size: ${Math.max(parseInt(subSize.value) - 1, 4)}px !important;
          opacity: 0.8 !important;
        }
        
        /* 條碼區域 */
        .bv-barcode-area {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          margin-top: auto !important;
          position: relative !important;
        }
        
        /* 條碼圖片 */
        .bv-barcode-img {
          height: ${barcodeHeightMM}mm !important;
          width: ${barcodeWidthMM}mm !important;
          max-width: ${barcodeWidthMM}mm !important;
          object-fit: fill !important;
          display: block !important;
        }
        
        /* 條碼數字 */
        .bv-barcode-text {
          font-size: ${barcodeTextSize.value}px !important;
          font-weight: ${barcodeTextFontWeight} !important;
          margin-top: 2px !important;
          font-family: ${fontFamily.value} !important;
          letter-spacing: 0.5px !important;
        }
        
        /* 條碼嵌入版佈局 */
        .bv-label-content[data-layout="embedded"] .bv-all-in-one {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          gap: 2px !important;
        }
        
        .bv-label-content[data-layout="embedded"] .bv-barcode-embedded {
          margin: 4px 0 !important;
          display: flex !important;
          justify-content: center !important;
        }
        
        .bv-label-content[data-layout="embedded"] .bv-barcode-embedded img {
          height: ${Math.max(barcodeHeightMM * 0.8, 5)}mm !important;
          width: ${barcodeWidthMM}mm !important;
        }
        
        .bv-barcode-text-top {
          font-size: ${barcodeTextSize.value}px !important;
          font-weight: ${barcodeTextFontWeight} !important;
          text-align: center !important;
        }
        
        /* 價格置右版佈局 */
        .bv-label-content[data-layout="price-right"] .bv-price-float {
          position: absolute !important;
          right: 0 !important;
          top: ${-20 - priceGap}px !important;
          font-size: ${subSize.value}px !important;
          font-weight: ${subFontWeight} !important;
          white-space: nowrap !important;
          z-index: 3 !important;
        }
        
        /* 純條碼版佈局 */
        .bv-label-content[data-layout="pure-barcode"] {
          justify-content: center !important;
          align-items: center !important;
        }
        
        .bv-barcode-only {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 4px !important;
        }
        
        .bv-label-content[data-layout="pure-barcode"] .bv-barcode-img {
          height: ${Math.max(barcodeHeightMM * 1.5, 10)}mm !important;
        }
        
        /* 自訂版佈局 */
        .bv-custom-content {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          justify-content: space-between !important;
        }
        
        /* 底圖樣式 */
        .label-background-logo {
          position: absolute !important;
          width: ${logoWidthMM}mm !important;
          height: ${logoHeightMM}mm !important;
          left: ${document.getElementById('logo-x-slider')?.value || 50}% !important;
          top: ${document.getElementById('logo-y-slider')?.value || 50}% !important;
          transform: translate(-50%, -50%) !important;
          opacity: ${document.getElementById('logo-opacity-slider') ? 
            (100 - document.getElementById('logo-opacity-slider').value) / 100 : 0.8} !important;
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
      
      // 更新所有標籤的底圖
      updateAllLogos();
    }
    
    /* 為 range input 添加動態值更新 */
    function updateRangeProgress(input) {
      const value = (input.value - input.min) / (input.max - input.min) * 100;
      input.style.setProperty('--value', value + '%');
      input.style.background = `linear-gradient(to right, #518aff 0%, #518aff ${value}%, rgba(0, 0, 0, 0.08) ${value}%, rgba(0, 0, 0, 0.08) 100%)`;
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
    
    /* 延遲初始化所有控制項 */
    setTimeout(() => {
      /* 獲取所有控制項元素 */
      const mainSlider = document.getElementById('main-slider');
      const mainBoldBtn = document.getElementById('main-bold-btn');
      const subSlider = document.getElementById('sub-slider');
      const subBoldBtn = document.getElementById('sub-bold-btn');
      const barcodeTextSlider = document.getElementById('barcode-text-slider');
      const barcodeTextBoldBtn = document.getElementById('barcode-text-bold-btn');
      const barcodeHeightSlider = document.getElementById('barcode-height-slider');
      const barcodeWidthSlider = document.getElementById('barcode-width-slider');
      const priceGapSlider = document.getElementById('price-gap-slider');
      const priceGapSetting = document.getElementById('price-gap-setting');
      const labelWidthSlider = document.getElementById('label-width-slider');
      const labelHeightSlider = document.getElementById('label-height-slider');
      const fontFamilySelect = document.getElementById('font-family-select');
      
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
      
      /* 模板選擇功能 */
      document.querySelectorAll('.bv-template-option').forEach(option => {
        option.addEventListener('click', function() {
          const templateKey = this.dataset.template;
          
          // 更新 active 狀態
          document.querySelectorAll('.bv-template-option').forEach(opt => opt.classList.remove('active'));
          this.classList.add('active');
          
          // 更新當前模板名稱
          const templateNameEl = document.querySelector('.bv-current-template-name');
          if (templateNameEl) {
            templateNameEl.textContent = layoutTemplates[templateKey].name;
          }
          
          // 顯示/隱藏自訂欄位選擇器
          const customFieldsSelector = document.getElementById('custom-fields-selector');
          if (customFieldsSelector) {
            customFieldsSelector.style.display = templateKey === 'custom' ? 'block' : 'none';
          }
          
          // 顯示/隱藏價格間距設定
          if (priceGapSetting) {
            priceGapSetting.style.display = templateKey === 'priceRight' ? 'block' : 'none';
          }
          
          // 重新渲染標籤
          rerenderLabels(templateKey);
          
          showNotification(`已切換至${layoutTemplates[templateKey].name}模板`);
        });
      });
      
      /* 自訂欄位選擇 */
      const customFieldsSelector = document.getElementById('custom-fields-selector');
      if (customFieldsSelector) {
        customFieldsSelector.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
          checkbox.addEventListener('change', function() {
            const selectedFields = Array.from(
              customFieldsSelector.querySelectorAll('input[type="checkbox"]:checked')
            ).map(cb => cb.value);
            
            if (currentTemplate === 'custom') {
              rerenderLabels('custom', selectedFields);
            }
          });
        });
      }
      
      /* 預設尺寸按鈕事件 */
      document.querySelectorAll('.bv-preset-size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const width = this.dataset.width;
          const height = this.dataset.height;
          const presetName = this.textContent;
          
          // 找到對應的預設配置
          const preset = presetSizes.find(p => p.name === presetName);
          
          if (labelWidthSlider) labelWidthSlider.value = width;
          if (labelHeightSlider) labelHeightSlider.value = height;
          
          // 應用預設的文字和條碼設定
          if (preset && preset.settings) {
            if (mainSlider) mainSlider.value = preset.settings.mainSize;
            if (subSlider) subSlider.value = preset.settings.subSize;
            if (barcodeTextSlider) barcodeTextSlider.value = preset.settings.barcodeTextSize;
            if (barcodeHeightSlider) barcodeHeightSlider.value = preset.settings.barcodeHeight;
            if (barcodeWidthSlider) barcodeWidthSlider.value = preset.settings.barcodeWidth;
            
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
        const currentWidth = labelWidthSlider ? labelWidthSlider.value : 40;
        const currentHeight = labelHeightSlider ? labelHeightSlider.value : 30;
        
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
            this.classList.toggle('active');
            updateCallback();
          });
        }
      }

      setupBoldButton(mainBoldBtn, updateStyles);
      setupBoldButton(subBoldBtn, updateStyles);
      setupBoldButton(barcodeTextBoldBtn, updateStyles);
      
      /* 重新整理資料按鈕 */
      const resetFormatBtn = document.getElementById('bv-reset-format');
      if (resetFormatBtn) {
        resetFormatBtn.addEventListener('click', function() {
          // 重新抓取資料
          productData = extractUnifiedProductData();
          
          // 重新渲染當前模板
          rerenderLabels();
          
          showNotification('已重新整理資料');
        });
      }
      
      /* 添加事件監聽器 */
      const controls = [
        mainSlider, subSlider, barcodeTextSlider, 
        barcodeHeightSlider, barcodeWidthSlider, priceGapSlider, 
        labelWidthSlider, labelHeightSlider, fontFamilySelect,
        logoSizeSlider, logoXSlider, logoYSlider, logoOpacitySlider
      ];
      
      controls.forEach(control => {
        if(control) {
          control.addEventListener('input', () => {
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
      
      /* 儲存設定功能 */
      function saveCurrentSettings() {
        const settings = {
          template: currentTemplate,
          customFields: customSelectedFields,
          mainSize: mainSlider?.value || defaultSettings.mainSize,
          mainBold: mainBoldBtn?.classList.contains('active') || defaultSettings.mainBold,
          subSize: subSlider?.value || defaultSettings.subSize,
          subBold: subBoldBtn?.classList.contains('active') || defaultSettings.subBold,
          barcodeTextSize: barcodeTextSlider?.value || defaultSettings.barcodeTextSize,
          barcodeTextBold: barcodeTextBoldBtn?.classList.contains('active') || defaultSettings.barcodeTextBold,
          barcodeHeight: barcodeHeightSlider?.value || defaultSettings.barcodeHeight,
          barcodeWidth: barcodeWidthSlider?.value || defaultSettings.barcodeWidth,
          labelWidth: labelWidthSlider?.value || defaultSettings.labelWidth,
          labelHeight: labelHeightSlider?.value || defaultSettings.labelHeight,
          fontFamily: fontFamilySelect?.value || defaultSettings.fontFamily,
          priceGap: priceGapSlider?.value || defaultSettings.priceGap,
          logoDataUrl: logoDataUrl,
          logoSize: logoSizeSlider?.value || defaultSettings.logoSize,
          logoX: logoXSlider?.value || defaultSettings.logoX,
          logoY: logoYSlider?.value || defaultSettings.logoY,
          logoOpacity: logoOpacitySlider?.value || defaultSettings.logoOpacity,
          logoAspectRatio: logoAspectRatio
        };
        return settings;
      }
      
      function applySavedSettings(settings) {
        if (!settings) return;
        
        // 載入模板
        if (settings.template) {
          currentTemplate = settings.template;
          customSelectedFields = settings.customFields || defaultSettings.customFields;
          
          // 更新模板選擇UI
          document.querySelectorAll('.bv-template-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.template === currentTemplate);
          });
          
          const templateNameEl = document.querySelector('.bv-current-template-name');
          if (templateNameEl) {
            templateNameEl.textContent = layoutTemplates[currentTemplate].name;
          }
          
          // 顯示/隱藏自訂欄位
          const customFieldsSelector = document.getElementById('custom-fields-selector');
          if (customFieldsSelector) {
            customFieldsSelector.style.display = currentTemplate === 'custom' ? 'block' : 'none';
            
            // 更新勾選狀態
            customFieldsSelector.querySelectorAll('input[type="checkbox"]').forEach(cb => {
              cb.checked = customSelectedFields.includes(cb.value);
            });
          }
          
          // 顯示/隱藏價格間距
          if (priceGapSetting) {
            priceGapSetting.style.display = currentTemplate === 'priceRight' ? 'block' : 'none';
          }
        }
        
        // 載入其他設定
        if (mainSlider) mainSlider.value = settings.mainSize || defaultSettings.mainSize;
        if (mainBoldBtn) mainBoldBtn.classList.toggle('active', settings.mainBold ?? defaultSettings.mainBold);
        if (subSlider) subSlider.value = settings.subSize || defaultSettings.subSize;
        if (subBoldBtn) subBoldBtn.classList.toggle('active', settings.subBold ?? defaultSettings.subBold);
        if (barcodeTextSlider) barcodeTextSlider.value = settings.barcodeTextSize || defaultSettings.barcodeTextSize;
        if (barcodeTextBoldBtn) barcodeTextBoldBtn.classList.toggle('active', settings.barcodeTextBold ?? defaultSettings.barcodeTextBold);
        if (barcodeHeightSlider) barcodeHeightSlider.value = settings.barcodeHeight || defaultSettings.barcodeHeight;
        if (barcodeWidthSlider) barcodeWidthSlider.value = settings.barcodeWidth || defaultSettings.barcodeWidth;
        if (labelWidthSlider) labelWidthSlider.value = settings.labelWidth || defaultSettings.labelWidth;
        if (labelHeightSlider) labelHeightSlider.value = settings.labelHeight || defaultSettings.labelHeight;
        if (fontFamilySelect) fontFamilySelect.value = settings.fontFamily || defaultSettings.fontFamily;
        if (priceGapSlider) priceGapSlider.value = settings.priceGap || defaultSettings.priceGap;
        
        // 載入底圖
        if (settings.logoDataUrl) {
          logoDataUrl = settings.logoDataUrl;
          logoAspectRatio = settings.logoAspectRatio || 1;
          if (logoPreview) {
            logoPreview.src = logoDataUrl;
            logoPreview.style.display = 'block';
          }
          if (uploadPrompt) uploadPrompt.style.display = 'none';
          if (logoUploadArea) logoUploadArea.classList.add('has-logo');
          if (logoControls) logoControls.classList.add('active');
        }
        
        if (logoSizeSlider) logoSizeSlider.value = settings.logoSize || defaultSettings.logoSize;
        if (logoXSlider) logoXSlider.value = settings.logoX || defaultSettings.logoX;
        if (logoYSlider) logoYSlider.value = settings.logoY || defaultSettings.logoY;
        if (logoOpacitySlider) logoOpacitySlider.value = settings.logoOpacity || defaultSettings.logoOpacity;
        
        // 更新所有滑桿進度條
        document.querySelectorAll('input[type="range"]').forEach(updateRangeProgress);
        
        // 重新渲染
        rerenderLabels();
        checkPresetSizeActive();
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
            if (savePresetRow) savePresetRow.style.display = 'flex';
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
            if (savePresetRow) savePresetRow.style.display = 'none';
            
            showNotification(`預設「${presetName}」已儲存`);
          });
        }
        
        if (cancelSaveBtn) {
          cancelSaveBtn.addEventListener('click', function() {
            if (savePresetRow) savePresetRow.style.display = 'none';
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
        // 先載入預設值
        applySavedSettings(defaultSettings);
        
        // 載入臨時設定（如果有）
        const tempSettings = getSettingsFromLocal('_current_temp_settings');
        if (tempSettings) {
          applySavedSettings(tempSettings);
        }
      }
      
      /* 初始化所有 range input 的進度條 */
      document.querySelectorAll('input[type="range"]').forEach(updateRangeProgress);
      
      /* 初始化 */
      initPresetSystem();
      loadInitialSettings();
      checkPresetSizeActive();
      
      // 首次渲染
      rerenderLabels();
      
      /* 自動儲存當前設定 */
      setInterval(() => {
        saveSettingsToLocal('_current_temp_settings', saveCurrentSettings());
      }, 5000);
      
      /* 將函數掛載到 window 物件 */
      window.barcodeEditor = {
        updateStyles,
        saveCurrentSettings,
        applySavedSettings,
        showNotification,
        updateAllLogos,
        productData,
        currentTemplate,
        rerenderLabels,
        extractUnifiedProductData
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
