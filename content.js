javascript:(function(){
  /* BV SHOP 條碼標籤自由編輯器 v8.1 - 完整修正版 */
  
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
    { name: '40×30mm', width: 40, height: 30, type: 'standard' },
    { name: '60×30mm', width: 60, height: 30, type: 'standard' },
    { name: 'Brother大標籤', width: 42, height: 29, type: 'brother' },
    { name: 'Brother小標籤', width: 29, height: 20, type: 'brother' }
  ];

  /* 初始變數 */
  let isPanelMinimized = false;
  let collapsedSections = {};
  let selectedElement = null;
  let draggedFieldData = null;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let labelElements = []; // 儲存所有標籤上的元素
  const PREVIEW_SCALE = 2; // 預覽區域的縮放比例

  /* 預設值物件 */
  const defaultSettings = {
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

  /* 抓取頁面資料 - 更完整的版本 */
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
      
      // 抓取條碼圖片
      const barcodeImg = sample.querySelector('.spec_barcode img, img[alt="barcode"]');
      if (barcodeImg) {
        data.barcodeImage = barcodeImg.src;
      }
      
      // 抓取所有 sub 元素的文字
      const subElements = sample.querySelectorAll('.sub');
      subElements.forEach(elem => {
        const text = elem.textContent.trim();
        if (text) {
          if (text.includes('售價') && !text.includes('特價')) {
            data.price = text;
          } else if (text.includes('特價')) {
            data.specialPrice = text;
          } else if (/^\d{5,}$/.test(text)) {
            data.barcodeNumber = text;
          } else if (text.includes('/')) {
            data.spec = text;
          } else if (text.match(/^[A-Za-z0-9\-_]{3,20}$/)) {
            data.sku = text;
            data.productCode = text;
          }
        }
      });
      
      // 如果沒有找到條碼號碼，嘗試從條碼區域找
      if (!data.barcodeNumber) {
        const barcodeText = sample.querySelector('.spec_barcode .sub, .spec_barcode span');
        if (barcodeText) {
          data.barcodeNumber = barcodeText.textContent.trim();
        }
      }
      
      productData.push(data);
    });
    
    console.log('抓取到的產品資料:', productData);
  }

  /* 建立可拖曳的元素 */
  function createDraggableElement(type, content, elementData = {}) {
    const element = document.createElement('div');
    element.className = 'bv-label-element';
    element.dataset.type = type;
    element.dataset.elementId = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    element.dataset.fieldKey = elementData.fieldKey || '';
    
    // 設定預設樣式
    const defaultStyles = {
      text: {
        fontSize: 10,
        fontWeight: 400,
        color: '#000000',
        fontFamily: 'Arial, sans-serif'
      },
      barcode: {
        height: 40,
        width: 80,
        textSize: 8
      }
    };
    
    const styles = {
      ...defaultStyles[type] || {},
      ...elementData.styles || {}
    };
    
    element.dataset.styles = JSON.stringify(styles);
    
    if (type === 'text') {
      element.innerHTML = `<span class="bv-element-text">${content}</span>`;
      // 立即套用樣式
      const textSpan = element.querySelector('.bv-element-text');
      textSpan.style.fontSize = `${styles.fontSize}px`;
      textSpan.style.fontWeight = styles.fontWeight;
      textSpan.style.color = styles.color;
      textSpan.style.fontFamily = styles.fontFamily;
    } else if (type === 'barcode') {
      element.innerHTML = `
        <img src="${content}" alt="barcode" class="bv-element-barcode">
        <span class="bv-element-barcode-text">${elementData.barcodeNumber || ''}</span>
      `;
      // 立即套用樣式
      const barcodeImg = element.querySelector('.bv-element-barcode');
      const barcodeText = element.querySelector('.bv-element-barcode-text');
      barcodeImg.style.height = `${styles.height}px`;
      barcodeImg.style.width = `${styles.width}px`;
      barcodeText.style.fontSize = `${styles.textSize}px`;
    }
    
    // 設定位置
    element.style.position = 'absolute';
    element.style.left = `${elementData.x || 0}px`;
    element.style.top = `${elementData.y || 0}px`;
    
    return element;
  }

  /* 顯示通知訊息 - 全域函數 */
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

  /* 更新所有標籤的底圖 - 全域函數 */
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

  /* 建立基本樣式 */
  const style = document.createElement('style');
  style.innerHTML = `
    /* 移除所有 focus outline */
    * {
      outline: none !important;
    }
    
    /* 預覽區域容器 */
    .bv-preview-container {
      transform: scale(${PREVIEW_SCALE});
      transform-origin: top left;
      width: ${100 / PREVIEW_SCALE}%;
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
    
    /* 隱藏原本的列印按鈕和內容 */
    body > button.no-print {
      display: none !important;
    }
    
    /* 隱藏原始的標籤內容 */
    .print_sample > *:not(.bv-margin-indicator):not(.bv-label-element):not(.label-background-logo) {
      display: none !important;
    }
    
    /* 標籤樣式 */
    .print_sample {
      background: #ffffff !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      border: 1px solid #e8e8e8 !important;
      position: relative !important;
      transition: all 0.2s ease !important;
      margin-bottom: 10px !important;
      border-radius: 4px !important;
      overflow: visible !important;
      display: block !important;
    }
    
    /* 標籤元素 */
    .bv-label-element {
      position: absolute !important;
      cursor: move;
      user-select: none;
      transition: none;
      z-index: 10;
      padding: 2px;
    }
    
    .bv-label-element:hover {
      outline: 1px dashed #518aff;
      background: rgba(81, 138, 255, 0.05);
    }
    
    .bv-label-element.dragging {
      opacity: 0.8;
      z-index: 1000;
      cursor: grabbing;
      outline: 2px solid #0071e3;
    }
    
    .bv-label-element.selected {
      outline: 2px solid #0071e3;
      background: rgba(81, 138, 255, 0.1);
    }
    
    /* 元素內容樣式 */
    .bv-element-text {
      display: block;
      white-space: nowrap;
    }
    
    .bv-element-barcode {
      display: block;
      max-width: 100%;
      height: auto;
    }
    
    .bv-element-barcode-text {
      display: block;
      text-align: center;
      font-size: 8px;
      margin-top: 2px;
    }
    
    /* 資料欄位面板 */
    .bv-fields-panel {
      position: fixed;
      left: 24px;
      top: 24px;
      bottom: 24px;
      width: 280px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(24px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.75);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .bv-fields-header {
      padding: 20px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      background: rgba(255, 255, 255, 0.7);
    }
    
    .bv-fields-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #000;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .bv-fields-subtitle {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.5);
      margin-top: 4px;
    }
    
    .bv-fields-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }
    
    /* 可拖曳欄位 */
    .bv-field-item {
      background: rgba(248, 250, 252, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 8px;
      cursor: grab;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
    }
    
    .bv-field-item:hover {
      background: rgba(81, 138, 255, 0.1);
      border-color: rgba(81, 138, 255, 0.3);
      transform: translateX(4px);
    }
    
    .bv-field-item:active {
      cursor: grabbing;
      transform: scale(0.98);
    }
    
    .bv-field-item.dragging {
      opacity: 0.5;
    }
    
    .bv-field-icon {
      font-size: 20px;
      color: #666;
      flex-shrink: 0;
    }
    
    .bv-field-content {
      flex: 1;
      overflow: hidden;
    }
    
    .bv-field-label {
      font-weight: 600;
      color: #333;
      margin-bottom: 2px;
    }
    
    .bv-field-value {
      font-size: 12px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    /* 邊界指示器 */
    .bv-margin-indicator {
      position: absolute;
      border: 1px dashed #ff3b30;
      pointer-events: none;
      opacity: 0.5;
    }
    
    /* 垃圾桶區域 */
    .bv-trash-area {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 80px;
      background: rgba(255, 59, 48, 0.1);
      border: 2px dashed rgba(255, 59, 48, 0.3);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: all 0.3s;
      pointer-events: none;
    }
    
    .bv-trash-area.active {
      opacity: 1;
      pointer-events: auto;
    }
    
    .bv-trash-area.hover {
      background: rgba(255, 59, 48, 0.2);
      border-color: rgba(255, 59, 48, 0.5);
      transform: translateX(-50%) scale(1.1);
    }
    
    .bv-trash-area .material-icons {
      font-size: 36px;
      color: #ff3b30;
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
      }
      
      .bv-label-element {
        outline: none !important;
        background: none !important;
      }
      
      .bv-margin-indicator,
      .bv-guide-line,
      .bv-trash-area,
      .bv-fields-panel,
      #bv-barcode-control-panel,
      .bv-floating-button,
      .bv-notification {
        display: none !important;
      }
    }
  
    /* 主控制面板樣式 */
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
    
    .bv-action-button {
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
    
    .bv-action-button.danger {
      background: linear-gradient(135deg, #FF3B30 0%, #D70015 100%);
      box-shadow: 0 3px 12px rgba(255, 59, 48, 0.25);
    }
    
    .bv-action-button:hover {
      transform: translateY(-1px);
      box-shadow: 
        0 6px 20px rgba(16, 185, 129, 0.35),
        inset 0 0 0 0.5px rgba(255, 255, 255, 0.3);
    }
    
    .bv-action-button.danger:hover {
      box-shadow: 0 6px 20px rgba(255, 59, 48, 0.35);
    }
    
    .bv-action-button:active {
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
    
    /* 滾動條 */
    .bv-panel-body::-webkit-scrollbar,
    .bv-fields-body::-webkit-scrollbar {
      width: 6px;
    }
    
    .bv-panel-body::-webkit-scrollbar-track,
    .bv-fields-body::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .bv-panel-body::-webkit-scrollbar-thumb,
    .bv-fields-body::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 6px;
      transition: background 0.2s ease;
    }
    
    .bv-panel-body::-webkit-scrollbar-thumb:hover,
    .bv-fields-body::-webkit-scrollbar-thumb:hover {
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
    
    /* 元素屬性面板 */
    .bv-element-properties {
      background: rgba(248, 250, 252, 0.8);
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }
    
    .bv-property-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .bv-property-label {
      font-size: 13px;
      font-weight: 500;
      color: #333;
      min-width: 60px;
    }
    
    .bv-property-input {
      flex: 1;
      height: 32px;
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 6px;
      padding: 0 8px;
      font-size: 13px;
    }
    
    .bv-color-picker {
      width: 32px;
      height: 32px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 6px;
      cursor: pointer;
      overflow: hidden;
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
    
    /* 底圖樣式 */
    .label-background-logo {
      position: absolute !important;
      z-index: 1 !important;
      pointer-events: none;
      object-fit: contain !important;
    }
    
    /* 拖曳幽靈圖片 */
    .bv-drag-ghost {
      position: fixed;
      pointer-events: none;
      opacity: 0.8;
      z-index: 10001;
      background: white;
      border: 2px solid #518aff;
      border-radius: 8px;
      padding: 8px 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      font-size: 14px;
      font-weight: 500;
      color: #333;
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

  /* 建立垃圾桶區域 */
  const trashArea = document.createElement('div');
  trashArea.className = 'bv-trash-area';
  trashArea.innerHTML = '<span class="material-icons">delete</span>';
  document.body.appendChild(trashArea);

  /* 初始化標籤 */
  function initializeLabels() {
    // 只初始化第一個標籤作為編輯區
    const firstSample = document.querySelector('.print_sample');
    if (firstSample) {
      // 清空原始內容
      firstSample.innerHTML = '';
      
      // 添加邊界指示器
      const marginIndicator = document.createElement('div');
      marginIndicator.className = 'bv-margin-indicator';
      
      // 計算邊界
      const labelWidth = parseFloat(window.getComputedStyle(firstSample).width);
      const labelHeight = parseFloat(window.getComputedStyle(firstSample).height);
      const isBrother = labelWidth < 120; // 小於120px可能是Brother標籤
      const leftMargin = isBrother ? 15 : 11; // 4mm : 3mm (約略值)
      const otherMargin = 11; // 3mm
      
      marginIndicator.style.top = `${otherMargin}px`;
      marginIndicator.style.left = `${leftMargin}px`;
      marginIndicator.style.right = `${otherMargin}px`;
      marginIndicator.style.bottom = `${otherMargin}px`;
      
      firstSample.appendChild(marginIndicator);
    }
    
    // 隱藏其他標籤
    document.querySelectorAll('.print_sample:not(:first-child)').forEach(sample => {
      sample.style.display = 'none';
    });
  }

  /* 建立資料欄位面板 */
  function createFieldsPanel() {
    const panel = document.createElement('div');
    panel.className = 'bv-fields-panel';
    panel.innerHTML = `
      <div class="bv-fields-header">
        <h3 class="bv-fields-title">
          <span class="material-icons">inventory_2</span>
          可用欄位
        </h3>
        <div class="bv-fields-subtitle">拖曳欄位到標籤上</div>
      </div>
      
      <div class="bv-fields-body" id="bv-fields-list">
        <!-- 動態生成欄位 -->
      </div>
    `;
    
    document.body.appendChild(panel);
  }

  /* 更新欄位列表 - 使用第一個產品的資料 */
  function updateFieldsList() {
    const container = document.getElementById('bv-fields-list');
    container.innerHTML = '';
    
    const product = productData[0]; // 只使用第一個產品
    if (!product) return;
    
    // 定義欄位配置
    const fields = [
      { key: 'productName', label: '商品名稱', icon: 'label', type: 'text' },
      { key: 'spec', label: '規格', icon: 'category', type: 'text' },
      { key: 'price', label: '售價', icon: 'sell', type: 'text' },
      { key: 'specialPrice', label: '特價', icon: 'local_offer', type: 'text' },
      { key: 'sku', label: 'SKU/貨號', icon: 'tag', type: 'text' },
      { key: 'barcodeNumber', label: '條碼號碼', icon: 'numbers', type: 'text' },
      { key: 'barcodeImage', label: '條碼圖片', icon: 'qr_code', type: 'barcode' }
    ];
    
    // 生成欄位項目
    fields.forEach(field => {
      if (product[field.key]) {
        const fieldItem = document.createElement('div');
        fieldItem.className = 'bv-field-item';
        fieldItem.draggable = true;
        fieldItem.dataset.fieldKey = field.key;
        fieldItem.dataset.fieldType = field.type;
        
        fieldItem.innerHTML = `
          <span class="material-icons bv-field-icon">${field.icon}</span>
          <div class="bv-field-content">
            <div class="bv-field-label">${field.label}</div>
            <div class="bv-field-value">${field.type === 'barcode' ? '條碼圖片' : product[field.key]}</div>
          </div>
        `;
        
        // 拖曳事件
        fieldItem.addEventListener('dragstart', handleFieldDragStart);
        fieldItem.addEventListener('dragend', handleFieldDragEnd);
        
        container.appendChild(fieldItem);
      }
    });
  }

  /* 建立拖曳幽靈圖片 */
  function createDragGhost(fieldKey, fieldType) {
    const ghost = document.createElement('div');
    ghost.className = 'bv-drag-ghost';
    ghost.style.display = 'none';
    
    const product = productData[0];
    if (fieldType === 'barcode') {
      ghost.innerHTML = '條碼圖片';
    } else {
      ghost.innerHTML = product[fieldKey] || '';
    }
    
    document.body.appendChild(ghost);
    return ghost;
  }

  /* 處理欄位拖曳開始 */
  let dragGhost = null;
  function handleFieldDragStart(e) {
    const fieldKey = e.target.dataset.fieldKey;
    const fieldType = e.target.dataset.fieldType;
    
    e.target.classList.add('dragging');
    
    // 儲存拖曳資料
    draggedFieldData = {
      fieldKey: fieldKey,
      fieldType: fieldType,
      content: productData[0][fieldKey] || ''
    };
    
    // 建立幽靈圖片
    dragGhost = createDragGhost(fieldKey, fieldType);
    
    // 設定拖曳效果
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setDragImage(new Image(), 0, 0); // 隱藏預設拖曳圖片
    
    // 顯示垃圾桶
    trashArea.classList.add('active');
  }

  /* 拖曳時更新幽靈圖片位置 */
  document.addEventListener('dragover', (e) => {
    if (dragGhost) {
      dragGhost.style.display = 'block';
      dragGhost.style.left = e.clientX + 10 + 'px';
      dragGhost.style.top = e.clientY + 10 + 'px';
    }
  });

  /* 處理欄位拖曳結束 */
  function handleFieldDragEnd(e) {
    e.target.classList.remove('dragging');
    trashArea.classList.remove('active', 'hover');
    
    // 移除幽靈圖片
    if (dragGhost) {
      dragGhost.remove();
      dragGhost = null;
    }
    
    draggedFieldData = null;
  }

  /* 設定標籤可接受拖放 */
  function setupLabelDropZones() {
    const firstSample = document.querySelector('.print_sample');
    if (firstSample) {
      firstSample.addEventListener('dragover', handleLabelDragOver);
      firstSample.addEventListener('drop', handleLabelDrop);
    }
    
    // 垃圾桶事件
    trashArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      trashArea.classList.add('hover');
    });
    
    trashArea.addEventListener('dragleave', () => {
      trashArea.classList.remove('hover');
    });
    
    trashArea.addEventListener('drop', (e) => {
      e.preventDefault();
      if (selectedElement && selectedElement.classList.contains('bv-label-element')) {
        // 刪除元素
        const elementId = selectedElement.dataset.elementId;
        labelElements = labelElements.filter(el => el.id !== elementId);
        selectedElement.remove();
        selectedElement = null;
        showNotification('元素已刪除');
        
        // 清空屬性面板
        const propertiesContainer = document.getElementById('bv-element-properties');
        if (propertiesContainer) {
          propertiesContainer.innerHTML = '<p style="text-align: center; color: #999; font-size: 13px;">請選擇一個元素</p>';
        }
      }
      trashArea.classList.remove('hover');
    });
  }

  /* 處理標籤拖曳經過 */
  function handleLabelDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  /* 處理標籤放置 - 修正縮放問題 */
  function handleLabelDrop(e) {
    e.preventDefault();
    
    if (!draggedFieldData) return;
    
    const sample = e.currentTarget;
    const rect = sample.getBoundingClientRect();
    const x = (e.clientX - rect.left) / PREVIEW_SCALE;
    const y = (e.clientY - rect.top) / PREVIEW_SCALE;
    
    const product = productData[0];
    let content = '';
    let elementData = { 
      x, 
      y, 
      styles: {},
      fieldKey: draggedFieldData.fieldKey
    };
    
    if (draggedFieldData.fieldType === 'barcode') {
      content = product.barcodeImage;
      elementData.barcodeNumber = product.barcodeNumber;
    } else {
      content = product[draggedFieldData.fieldKey] || '';
    }
    
    if (content) {
      const element = createDraggableElement(draggedFieldData.fieldType, content, elementData);
      sample.appendChild(element);
      
      // 調整初始位置（考慮元素大小）
      element.style.left = `${x - element.offsetWidth / 2}px`;
      element.style.top = `${y - element.offsetHeight / 2}px`;
      
      // 更新元素資料
      const elementId = element.dataset.elementId;
      labelElements.push({
        id: elementId,
        type: draggedFieldData.fieldType,
        content: content,
        fieldKey: draggedFieldData.fieldKey,
        x: parseFloat(element.style.left),
        y: parseFloat(element.style.top),
        styles: JSON.parse(element.dataset.styles)
      });
      
      // 綁定元素事件
      setupElementEvents(element);
      
      // 選中新元素
      selectElement(element);
      
      showNotification('已添加到標籤');
      saveElementsData();
    }
  }

  /* 設定元素事件 */
  function setupElementEvents(element) {
    element.addEventListener('mousedown', handleElementMouseDown);
    element.addEventListener('click', (e) => {
      e.stopPropagation();
      selectElement(element);
    });
  }

  /* 處理元素拖曳 - 修正縮放問題 */
  function handleElementMouseDown(e) {
    if (e.button !== 0) return; // 只響應左鍵
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = e.currentTarget;
    selectedElement = element;
    element.classList.add('dragging');
    
    const rect = element.getBoundingClientRect();
    const parentRect = element.parentElement.getBoundingClientRect();
    
    startX = (e.clientX - rect.left) / PREVIEW_SCALE;
    startY = (e.clientY - rect.top) / PREVIEW_SCALE;
    
    isDragging = true;
    
    // 顯示垃圾桶
    trashArea.classList.add('active');
    
    document.addEventListener('mousemove', handleElementDrag);
    document.addEventListener('mouseup', handleElementDragEnd);
  }

  /* 處理元素拖曳中 - 修正縮放問題 */
  function handleElementDrag(e) {
    if (!isDragging || !selectedElement) return;
    
    e.preventDefault();
    
    const parent = selectedElement.parentElement;
    const parentRect = parent.getBoundingClientRect();
    const marginIndicator = parent.querySelector('.bv-margin-indicator');
    const marginRect = marginIndicator ? marginIndicator.getBoundingClientRect() : parentRect;
    
    let newX = (e.clientX - parentRect.left) / PREVIEW_SCALE - startX;
    let newY = (e.clientY - parentRect.top) / PREVIEW_SCALE - startY;
    
    // 限制在邊界內
    const minX = (marginRect.left - parentRect.left) / PREVIEW_SCALE;
    const minY = (marginRect.top - parentRect.top) / PREVIEW_SCALE;
    const maxX = (marginRect.right - parentRect.left) / PREVIEW_SCALE - selectedElement.offsetWidth;
    const maxY = (marginRect.bottom - parentRect.top) / PREVIEW_SCALE - selectedElement.offsetHeight;
    
    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));
    
    selectedElement.style.left = newX + 'px';
    selectedElement.style.top = newY + 'px';
    
    // 更新元素資料
    const elementData = labelElements.find(el => el.id === selectedElement.dataset.elementId);
    if (elementData) {
      elementData.x = newX;
      elementData.y = newY;
    }
  }

  /* 結束元素拖曳 */
  function handleElementDragEnd(e) {
    if (!selectedElement) return;
    
    isDragging = false;
    selectedElement.classList.remove('dragging');
    
    // 隱藏垃圾桶
    trashArea.classList.remove('active');
    
    // 儲存位置
    saveElementsData();
    
    document.removeEventListener('mousemove', handleElementDrag);
    document.removeEventListener('mouseup', handleElementDragEnd);
  }

  /* 選中元素 */
  function selectElement(element) {
    // 清除其他選中狀態
    document.querySelectorAll('.bv-label-element').forEach(el => {
      el.classList.remove('selected');
    });
    
    element.classList.add('selected');
    selectedElement = element;
    
    // 更新屬性面板
    updateElementProperties(element);
  }

  /* 更新元素屬性面板 */
  function updateElementProperties(element) {
    const propertiesContainer = document.getElementById('bv-element-properties');
    if (!propertiesContainer) return;
    
    const styles = JSON.parse(element.dataset.styles || '{}');
    const type = element.dataset.type;
    
    let propertiesHTML = '';
    
    if (type === 'text') {
      propertiesHTML = `
        <div class="bv-property-row">
          <label class="bv-property-label">字體大小</label>
          <input type="number" class="bv-property-input" id="prop-font-size" value="${styles.fontSize || 10}" min="6" max="72">
        </div>
        <div class="bv-property-row">
          <label class="bv-property-label">字體粗細</label>
          <button class="bv-bold-button ${styles.fontWeight >= 700 ? 'active' : ''}" id="prop-font-bold">B</button>
        </div>
        <div class="bv-property-row">
          <label class="bv-property-label">顏色</label>
          <input type="color" class="bv-color-picker" id="prop-font-color" value="${styles.color || '#000000'}">
        </div>
        <div class="bv-property-row">
          <label class="bv-property-label">字體</label>
          <select class="bv-glass-select" id="prop-font-family">
            ${fontOptions.map(font => `
              <option value="${font.value}" ${styles.fontFamily === font.value ? 'selected' : ''}>${font.name}</option>
            `).join('')}
          </select>
        </div>
      `;
    } else if (type === 'barcode') {
      propertiesHTML = `
        <div class="bv-property-row">
          <label class="bv-property-label">條碼高度</label>
          <input type="number" class="bv-property-input" id="prop-barcode-height" value="${styles.height || 40}" min="20" max="100">
        </div>
        <div class="bv-property-row">
          <label class="bv-property-label">條碼寬度</label>
          <input type="number" class="bv-property-input" id="prop-barcode-width" value="${styles.width || 80}" min="40" max="200">
        </div>
        <div class="bv-property-row">
          <label class="bv-property-label">數字大小</label>
          <input type="number" class="bv-property-input" id="prop-barcode-text-size" value="${styles.textSize || 8}" min="6" max="16">
        </div>
      `;
    }
    
    propertiesContainer.innerHTML = propertiesHTML;
    
    // 綁定屬性變更事件
    bindPropertyEvents(element);
  }

  /* 綁定屬性事件 */
  function bindPropertyEvents(element) {
    const type = element.dataset.type;
    const styles = JSON.parse(element.dataset.styles || '{}');
    
    if (type === 'text') {
      // 字體大小
      const fontSize = document.getElementById('prop-font-size');
      if (fontSize) {
        fontSize.addEventListener('input', (e) => {
          styles.fontSize = parseInt(e.target.value);
          element.dataset.styles = JSON.stringify(styles);
          element.querySelector('.bv-element-text').style.fontSize = `${styles.fontSize}px`;
          saveElementsData();
        });
      }
      
      // 粗體
      const fontBold = document.getElementById('prop-font-bold');
      if (fontBold) {
        fontBold.addEventListener('click', () => {
          fontBold.classList.toggle('active');
          styles.fontWeight = fontBold.classList.contains('active') ? 700 : 400;
          element.dataset.styles = JSON.stringify(styles);
          element.querySelector('.bv-element-text').style.fontWeight = styles.fontWeight;
          saveElementsData();
        });
      }
      
      // 顏色
      const fontColor = document.getElementById('prop-font-color');
      if (fontColor) {
        fontColor.addEventListener('input', (e) => {
          styles.color = e.target.value;
          element.dataset.styles = JSON.stringify(styles);
          element.querySelector('.bv-element-text').style.color = styles.color;
          saveElementsData();
        });
      }
      
      // 字體
      const fontFamily = document.getElementById('prop-font-family');
      if (fontFamily) {
        fontFamily.addEventListener('change', (e) => {
          styles.fontFamily = e.target.value;
          element.dataset.styles = JSON.stringify(styles);
          element.querySelector('.bv-element-text').style.fontFamily = styles.fontFamily;
          saveElementsData();
        });
      }
    } else if (type === 'barcode') {
      // 條碼高度
      const barcodeHeight = document.getElementById('prop-barcode-height');
      if (barcodeHeight) {
        barcodeHeight.addEventListener('input', (e) => {
          styles.height = parseInt(e.target.value);
          element.dataset.styles = JSON.stringify(styles);
          element.querySelector('.bv-element-barcode').style.height = `${styles.height}px`;
          saveElementsData();
        });
      }
      
      // 條碼寬度
      const barcodeWidth = document.getElementById('prop-barcode-width');
      if (barcodeWidth) {
        barcodeWidth.addEventListener('input', (e) => {
          styles.width = parseInt(e.target.value);
          element.dataset.styles = JSON.stringify(styles);
          element.querySelector('.bv-element-barcode').style.width = `${styles.width}px`;
          saveElementsData();
        });
      }
      
      // 數字大小
      const textSize = document.getElementById('prop-barcode-text-size');
      if (textSize) {
        textSize.addEventListener('input', (e) => {
          styles.textSize = parseInt(e.target.value);
          element.dataset.styles = JSON.stringify(styles);
          const textElement = element.querySelector('.bv-element-barcode-text');
          if (textElement) {
            textElement.style.fontSize = `${styles.textSize}px`;
          }
          saveElementsData();
        });
      }
    }
    
    // 更新 labelElements 陣列中的樣式
    const elementData = labelElements.find(el => el.id === element.dataset.elementId);
    if (elementData) {
      elementData.styles = styles;
    }
  }

  /* 儲存元素資料 */
  function saveElementsData() {
    try {
      localStorage.setItem('bvLabelElements', JSON.stringify(labelElements));
      localStorage.setItem('bvLabelSettings', JSON.stringify({
        labelWidth: document.getElementById('label-width-slider')?.value || 40,
        labelHeight: document.getElementById('label-height-slider')?.value || 30,
        fontFamily: document.getElementById('font-family-select')?.value || 'Arial, sans-serif',
        logoDataUrl: logoDataUrl,
        logoSize: document.getElementById('logo-size-slider')?.value || 30,
        logoX: document.getElementById('logo-x-slider')?.value || 50,
        logoY: document.getElementById('logo-y-slider')?.value || 50,
        logoOpacity: document.getElementById('logo-opacity-slider')?.value || 20,
        logoAspectRatio: logoAspectRatio
      }));
    } catch (e) {
      console.error('無法儲存資料：', e);
    }
  }

  /* 載入元素資料 */
  function loadElementsData() {
    try {
      const saved = localStorage.getItem('bvLabelElements');
      const settings = localStorage.getItem('bvLabelSettings');
      
      if (saved) {
        labelElements = JSON.parse(saved);
        // 只在第一個標籤重建元素
        const firstSample = document.querySelector('.print_sample');
        if (firstSample) {
          labelElements.forEach(elementData => {
            const element = createDraggableElement(
              elementData.type, 
              elementData.content, 
              elementData
            );
            firstSample.appendChild(element);
            element.style.left = `${elementData.x}px`;
            element.style.top = `${elementData.y}px`;
            setupElementEvents(element);
          });
        }
      }
      
      if (settings) {
        const savedSettings = JSON.parse(settings);
        // 載入設定
        const labelWidth = document.getElementById('label-width-slider');
        const labelHeight = document.getElementById('label-height-slider');
        const fontFamily = document.getElementById('font-family-select');
        
        if (labelWidth) labelWidth.value = savedSettings.labelWidth || 40;
        if (labelHeight) labelHeight.value = savedSettings.labelHeight || 30;
        if (fontFamily) fontFamily.value = savedSettings.fontFamily || 'Arial, sans-serif';
        
        // 載入底圖
        if (savedSettings.logoDataUrl) {
          logoDataUrl = savedSettings.logoDataUrl;
          logoAspectRatio = savedSettings.logoAspectRatio || 1;
          
          const logoPreview = document.getElementById('logo-preview');
          const uploadPrompt = document.getElementById('upload-prompt');
          const logoControls = document.getElementById('logo-controls');
          
          if (logoPreview) {
            logoPreview.src = logoDataUrl;
            logoPreview.style.display = 'block';
          }
          if (uploadPrompt) uploadPrompt.style.display = 'none';
          if (logoControls) logoControls.style.display = 'block';
          
          const logoSizeSlider = document.getElementById('logo-size-slider');
          const logoXSlider = document.getElementById('logo-x-slider');
          const logoYSlider = document.getElementById('logo-y-slider');
          const logoOpacitySlider = document.getElementById('logo-opacity-slider');
          
          if (logoSizeSlider) logoSizeSlider.value = savedSettings.logoSize || 30;
          if (logoXSlider) logoXSlider.value = savedSettings.logoX || 50;
          if (logoYSlider) logoYSlider.value = savedSettings.logoY || 50;
          if (logoOpacitySlider) logoOpacitySlider.value = savedSettings.logoOpacity || 20;
        }
      }
    } catch (e) {
      console.error('無法載入資料：', e);
    }
  }

  /* 清空所有元素 */
  function clearAllElements() {
    labelElements = [];
    document.querySelectorAll('.bv-label-element').forEach(el => el.remove());
    saveElementsData();
  }

  /* 套用到所有標籤 */
  function applyToAllLabels() {
    if (labelElements.length === 0) {
      showNotification('目前沒有任何元素可以套用', 'warning');
      return;
    }
    
    // 顯示所有標籤
    document.querySelectorAll('.print_sample').forEach(sample => {
      sample.style.display = 'block';
    });
    
    // 為每個標籤套用相同的佈局
    document.querySelectorAll('.print_sample').forEach((sample, sampleIndex) => {
      // 清空標籤（保留邊界指示器）
      sample.querySelectorAll('.bv-label-element').forEach(el => el.remove());
      
      // 如果不是第一個標籤，添加邊界指示器
      if (sampleIndex > 0) {
        let marginIndicator = sample.querySelector('.bv-margin-indicator');
        if (!marginIndicator) {
          marginIndicator = document.createElement('div');
          marginIndicator.className = 'bv-margin-indicator';
          
          const labelWidth = parseFloat(window.getComputedStyle(sample).width);
          const isBrother = labelWidth < 120;
          const leftMargin = isBrother ? 15 : 11;
          const otherMargin = 11;
          
          marginIndicator.style.top = `${otherMargin}px`;
          marginIndicator.style.left = `${leftMargin}px`;
          marginIndicator.style.right = `${otherMargin}px`;
          marginIndicator.style.bottom = `${otherMargin}px`;
          
          sample.appendChild(marginIndicator);
        }
      }
      
      const product = productData[sampleIndex] || productData[0];
      
      // 複製每個元素
      labelElements.forEach(layoutElement => {
        let content = '';
        let elementData = {
          x: layoutElement.x,
          y: layoutElement.y,
          styles: layoutElement.styles,
          fieldKey: layoutElement.fieldKey
        };
        
        // 根據 fieldKey 獲取對應的產品資料
        if (layoutElement.type === 'text') {
          content = product[layoutElement.fieldKey] || layoutElement.content;
        } else if (layoutElement.type === 'barcode') {
          content = product.barcodeImage || layoutElement.content;
          elementData.barcodeNumber = product.barcodeNumber;
        }
        
        if (content) {
          const element = createDraggableElement(layoutElement.type, content, elementData);
          sample.appendChild(element);
          element.style.left = `${layoutElement.x}px`;
          element.style.top = `${layoutElement.y}px`;
          
          // 不需要為批次列印的元素綁定事件
          if (sampleIndex === 0) {
            setupElementEvents(element);
          }
        }
      });
    });
    
    // 更新底圖
    updateAllLogos();
  }

  /* 建立控制面板 */
  setTimeout(() => {
    // 抓取產品資料
    extractProductData();
    
    // 初始化標籤
    initializeLabels();
    
    // 建立資料欄位面板
    createFieldsPanel();
    
    // 更新欄位列表
    updateFieldsList();
    
    // 設定標籤可接受拖放
    setupLabelDropZones();
    
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
              <h3 class="bv-panel-title">BV 標籤自由編輯器</h3>
              <div class="bv-panel-subtitle">自由拖放欄位到標籤上</div>
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
              <button class="bv-action-button danger" id="bv-clear-all">
                <div class="bv-button-icon">
                  <span class="material-icons">clear_all</span>
                </div>
                <div class="bv-button-content">
                  <span class="bv-button-title">清空標籤</span>
                  <span class="bv-button-subtitle">移除所有已放置的元素</span>
                </div>
              </button>
            </div>
            
            <!-- 標籤設定 -->
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
                  <div style="font-size: 13px; font-weight: 500; margin-bottom: 8px;">預設字體</div>
                  <select id="font-family-select" class="bv-glass-select">
                    ${fontOptions.map(font => `<option value="${font.value}">${font.name}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
            
            <!-- 元素屬性 -->
            <div class="bv-settings-card" data-section="properties">
              <h4 class="bv-card-title">
                <span class="material-icons">tune</span>
                元素屬性
                <span class="material-icons bv-collapse-icon">expand_more</span>
              </h4>
              
              <div class="bv-card-content">
                <div id="bv-element-properties" class="bv-element-properties">
                  <p style="text-align: center; color: #999; font-size: 13px;">請選擇一個元素</p>
                </div>
              </div>
            </div>
            
            <!-- 底圖設定 -->
            <div class="bv-settings-card" data-section="logo">
              <h4 class="bv-card-title">
                <span class="material-icons">image</span>
                底圖設定
                <span class="material-icons bv-collapse-icon">expand_more</span>
              </h4>
              
              <div class="bv-card-content">
                <div class="bv-logo-upload-area" id="logo-upload-area" style="border: 2px dashed rgba(0, 0, 0, 0.08); border-radius: 12px; padding: 32px; text-align: center; cursor: pointer; transition: all 0.3s ease; background: rgba(248, 250, 252, 0.3); margin-bottom: 20px;">
                  <input type="file" id="logo-input" accept="image/png,image/jpeg,image/jpg" style="display:none;">
                  <img id="logo-preview" class="bv-logo-preview" style="display:none; max-width: 100%; max-height: 120px;">
                  <div id="upload-prompt">
                    <span class="material-icons" style="font-size:36px; color: #86868b;">add_photo_alternate</span>
                    <div style="color: rgba(0, 0, 0, 0.5); font-size: 14px; margin-top: 12px; font-weight: 500;">點擊上傳底圖（支援 PNG/JPG）</div>
                  </div>
                </div>
                
                <div class="bv-logo-controls" id="logo-controls" style="display: none;">
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
                  
                  <button class="bv-remove-logo-btn" id="remove-logo-btn" style="background: linear-gradient(135deg, #FF3B30 0%, #D70015 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 20px; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3); display: inline-flex; align-items: center; gap: 8px;">
                    <span class="material-icons" style="font-size: 18px;">delete</span>
                    移除底圖
                  </button>
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
    
    /* 為 range input 添加動態值更新 */
    function updateRangeProgress(input) {
      const value = (input.value - input.min) / (input.max - input.min) * 100;
      input.style.setProperty('--value', value + '%');
      input.style.background = `linear-gradient(to right, #518aff 0%, #518aff ${value}%, rgba(0, 0, 0, 0.08) ${value}%, rgba(0, 0, 0, 0.08) 100%)`;
    }
    
    /* 延遲初始化控制項 */
    setTimeout(() => {
      const labelWidth = document.getElementById('label-width-slider');
      const labelHeight = document.getElementById('label-height-slider');
      const fontFamily = document.getElementById('font-family-select');
      
      /* Logo 相關控制項 */
      const logoUploadArea = document.getElementById('logo-upload-area');
      const logoInput = document.getElementById('logo-input');
      const logoPreview = document.getElementById('logo-preview');
      const uploadPrompt = document.getElementById('upload-prompt');
      const logoControls = document.getElementById('logo-controls');
      const removeLogoBtn = document.getElementById('remove-logo-btn');
      
      const logoSizeSlider = document.getElementById('logo-size-slider');
      const logoXSlider = document.getElementById('logo-x-slider');
      const logoYSlider = document.getElementById('logo-y-slider');
      const logoOpacitySlider = document.getElementById('logo-opacity-slider');
      
      /* 更新樣式函數 */
      function updateStyles() {
        const totalWidth = parseFloat(labelWidth.value);
        const totalHeight = parseFloat(labelHeight.value);
        const isBrotherLabel = labelWidth.value == 42 || labelWidth.value == 29;
        const paddingLeft = isBrotherLabel ? 4 : 3;
        const paddingOther = 3;
        
        /* 更新顯示值 */
        document.getElementById('label-width').textContent = labelWidth.value + 'mm';
        document.getElementById('label-height').textContent = labelHeight.value + 'mm';
        
        if (logoSizeSlider) {
          document.getElementById('logo-size').textContent = logoSizeSlider.value + '%';
          document.getElementById('logo-x').textContent = logoXSlider.value + '%';
          document.getElementById('logo-y').textContent = logoYSlider.value + '%';
          document.getElementById('logo-opacity').textContent = logoOpacitySlider.value + '%';
        }
        
        const logoHeightMM = logoSizeSlider ? parseFloat(labelHeight.value) * parseFloat(logoSizeSlider.value) / 100 : 0;
        const logoWidthMM = logoHeightMM * logoAspectRatio;
        
        /* 更新所有滑桿的進度條 */
        [labelWidth, labelHeight, logoSizeSlider, logoXSlider, logoYSlider, logoOpacitySlider].forEach(control => {
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
            overflow: visible !important;
          }
          
          /* 元素樣式應用 */
          .bv-label-element {
            font-family: ${fontFamily.value} !important;
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
        `;
        
        /* 更新所有標籤的底圖 */
        updateAllLogos();
        
        /* 儲存設定 */
        saveElementsData();
      }
      
      /* 預設尺寸按鈕事件 */
      document.querySelectorAll('.bv-preset-size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const width = this.dataset.width;
          const height = this.dataset.height;
          
          if (labelWidth) labelWidth.value = width;
          if (labelHeight) labelHeight.value = height;
          
          // 更新 active 狀態
          document.querySelectorAll('.bv-preset-size-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          
          updateStyles();
          showNotification(`已切換至 ${this.textContent}`);
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
                logoUploadArea.style.borderStyle = 'solid';
                logoControls.style.display = 'block';
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
          logoUploadArea.style.borderStyle = 'dashed';
          logoControls.style.display = 'none';
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
          // 先套用到所有標籤
          applyToAllLabels();
          
          // 然後列印
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
      
      /* 初始化拖曳功能（面板） */
      initDragFunction();
      
      /* 添加事件監聽器 */
      const controls = [labelWidth, labelHeight, fontFamily, logoSizeSlider, logoXSlider, logoYSlider, logoOpacitySlider];
      
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
          // 先套用到所有標籤
          applyToAllLabels();
          
          // 然後列印
          window.allowPrint = true;
          window.print();
        });
      }
      
      /* 清空所有元素 */
      const clearAllBtn = document.getElementById('bv-clear-all');
      if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function() {
          if (confirm('確定要清空所有已放置的元素嗎？')) {
            clearAllElements();
            showNotification('已清空所有元素');
          }
        });
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
      
      /* 點擊空白處取消選擇 */
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.bv-label-element') && 
            !e.target.closest('.bv-element-properties')) {
          document.querySelectorAll('.bv-label-element').forEach(el => {
            el.classList.remove('selected');
          });
          selectedElement = null;
          
          // 清空屬性面板
          const propertiesContainer = document.getElementById('bv-element-properties');
          if (propertiesContainer) {
            propertiesContainer.innerHTML = '<p style="text-align: center; color: #999; font-size: 13px;">請選擇一個元素</p>';
          }
        }
      });
      
      /* 初始化所有 range input 的進度條 */
      document.querySelectorAll('input[type="range"]').forEach(updateRangeProgress);
      
      /* 載入之前的資料 */
      loadElementsData();
      
      /* 初始化 */
      checkPresetSizeActive();
      updateStyles();
      
      /* 將函數掛載到 window 物件 */
      window.barcodeEditor = {
        updateStyles,
        showNotification,
        updateAllLogos,
        productData,
        labelElements,
        clearAllElements,
        selectedElement,
        applyToAllLabels
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
