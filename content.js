javascript:(function(){
  /* BV SHOP 條碼標籤編輯器 - 完整版 v2.0 */
  
  // 只在條碼列印頁面上執行
  if (!document.querySelector('.print_barcode_area')) {
    alert('請在 BV SHOP 條碼列印頁面上使用此工具');
    return;
  }

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
    { name: '標楷體', value: 'DFKai-SB, 標楷體, serif' }
  ];

  /* 完整的預設值物件 - 內距改為 3mm */
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
    barcodeTextBold: true,
    barcodeHeight: 100,
    barcodeWidth: 100,
    barcodeYPosition: 70,
    labelWidth: 40,
    labelHeight: 30,
    labelPadding: 3, // 預設內距改為 3mm
    fontFamily: 'Arial, sans-serif',
    logoSize: 30,
    logoX: 50,
    logoY: 50,
    logoOpacity: 20
  };
  
  /* 偵測原始樣式 - 基於舊程式碼的改進版 */
  function detectOriginalLayout() {
    const firstSample = document.querySelector('.print_sample');
    if (!firstSample) return 'style1';
    
    const specInfo = firstSample.querySelector('.spec_info');
    const specBarcode = firstSample.querySelector('.spec_barcode');
    
    // 樣式八：純條碼（print_sample 有 flex 樣式）
    if (firstSample.style.display === 'flex' && firstSample.style.justifyContent === 'center') {
      console.log('偵測到樣式8：純條碼');
      return 'style8';
    }
    
    // 樣式三、四：條碼在 spec_info 內的 ul 裡面
    if (specInfo && specInfo.querySelector('ul .spec_barcode')) {
      const hasSpecialPrice = specInfo.innerHTML.includes('特價');
      console.log(`偵測到樣式${hasSpecialPrice ? '3' : '4'}：條碼在文字區內`);
      return hasSpecialPrice ? 'style3' : 'style4';
    }
    
    // 樣式六：條碼在 spec_info 內，但有 <br> 標籤
    if (specInfo && specInfo.querySelector('.spec_barcode') && specInfo.innerHTML.includes('<br>')) {
      console.log('偵測到樣式6：特殊間距版本');
      return 'style6';
    }
    
    // 樣式五、七：價格在條碼區
    if (specBarcode && specBarcode.querySelector('span.sub b')) {
      const hasProductCode = specInfo && (
        specInfo.innerHTML.includes('cat-') || 
        specInfo.querySelector('.sub:last-child')?.textContent?.includes('-')
      );
      console.log(`偵測到樣式${hasProductCode ? '7' : '5'}：價格在條碼區`);
      return hasProductCode ? 'style7' : 'style5';
    }
    
    // 樣式一、二：標準版
    if (specInfo) {
      const hasSpecialPrice = specInfo.innerHTML.includes('特價');
      console.log(`偵測到樣式${hasSpecialPrice ? '1' : '2'}：標準版`);
      return hasSpecialPrice ? 'style1' : 'style2';
    }
    
    console.log('使用預設樣式1');
    return 'style1';
  }
  
  /* 收集產品資料 */
  function collectProductData() {
    const data = [];
    document.querySelectorAll('.print_sample').forEach((sample, index) => {
      const specInfo = sample.querySelector('.spec_info');
      const specBarcode = sample.querySelector('.spec_barcode');
      
      const productData = {
        index: index,
        name: '',
        spec: '',
        price: '',
        specialPrice: '',
        sku: '',
        barcode: '',
        barcodeImg: null
      };
      
      // 獲取商品名稱
      const mainElement = specInfo?.querySelector('.main') || sample.querySelector('.main');
      if (mainElement) {
        productData.name = mainElement.textContent.trim();
      }
      
      // 獲取其他資訊
      const subElements = sample.querySelectorAll('.sub');
      subElements.forEach(sub => {
        const text = sub.textContent.trim();
        
        // 特價
        if (text.includes('特價')) {
          productData.specialPrice = text;
        }
        // SKU/商品編號
        else if (text.includes('cat-') || text.includes('-') || sub.classList.contains('sku-text')) {
          productData.sku = text;
        }
        // 規格
        else if (sub.parentElement === specInfo && !productData.spec) {
          productData.spec = text;
        }
        // 價格
        else if (text.includes('$') || /^\d+$/.test(text)) {
          if (!productData.price) {
            productData.price = text;
          }
        }
        // 條碼數字
        else if (sub.parentElement === specBarcode || sub.closest('.spec_barcode')) {
          productData.barcode = text;
        }
      });
      
      // 獲取條碼圖片
      const barcodeImg = sample.querySelector('.spec_barcode img') || specInfo?.querySelector('.spec_barcode img');
      if (barcodeImg) {
        productData.barcodeImg = barcodeImg.src;
      }
      
      data.push(productData);
    });
    
    return data;
  }
  
  const productData = collectProductData();
  const originalLayout = detectOriginalLayout();
  let currentLayout = originalLayout;
  
  /* 樣式模板定義 */
  const layoutTemplates = {
    'style1': {
      name: '標準版（有特價）',
      hasMainText: true,
      hasSubText: true,
      hasBarcode: true,
      hasOnlyBarcode: false,
      barcodePosition: 'bottom',
      canAdjustBarcodeY: false,
      rebuild: function(sample, data) {
        sample.innerHTML = `
          <div class="spec_info">
            <span class="main">${data.name || '商品名稱'}</span>
            <ul>
              <li><span class="sub">${data.spec || '規格'}</span></li>
              <li><span class="sub">${data.specialPrice || '特價 $999'}</span></li>
            </ul>
          </div>
          <div class="spec_barcode">
            ${data.barcodeImg ? `<img src="${data.barcodeImg}">` : ''}
            <span class="sub">${data.barcode || '1234567890123'}</span>
          </div>
        `;
      }
    },
    'style2': {
      name: '標準版（無特價）',
      hasMainText: true,
      hasSubText: true,
      hasBarcode: true,
      hasOnlyBarcode: false,
      barcodePosition: 'bottom',
      canAdjustBarcodeY: false,
      rebuild: function(sample, data) {
        sample.innerHTML = `
          <div class="spec_info">
            <span class="main">${data.name || '商品名稱'}</span>
            <ul>
              <li><span class="sub">${data.spec || '規格'}</span></li>
              <li><span class="sub">${data.price || '$999'}</span></li>
            </ul>
          </div>
          <div class="spec_barcode">
            ${data.barcodeImg ? `<img src="${data.barcodeImg}">` : ''}
            <span class="sub">${data.barcode || '1234567890123'}</span>
          </div>
        `;
      }
    },
    'style3': {
      name: '條碼內嵌版（有特價）',
      hasMainText: true,
      hasSubText: true,
      hasBarcode: true,
      hasOnlyBarcode: false,
      barcodePosition: 'embedded',
      canAdjustBarcodeY: false,
      rebuild: function(sample, data) {
        sample.innerHTML = `
          <div class="spec_info">
            <span class="main">${data.name || '商品名稱'}</span>
            <ul>
              <li><span class="sub">${data.spec || '規格'}</span></li>
              <li><span class="sub">${data.specialPrice || '特價 $999'}</span></li>
              <li>
                <div class="spec_barcode embedded-barcode">
                  ${data.barcodeImg ? `<img src="${data.barcodeImg}">` : ''}
                  <span class="sub">${data.barcode || '1234567890123'}</span>
                </div>
              </li>
            </ul>
          </div>
        `;
      }
    },
    'style4': {
      name: '條碼內嵌版（無特價）',
      hasMainText: true,
      hasSubText: true,
      hasBarcode: true,
      hasOnlyBarcode: false,
      barcodePosition: 'embedded',
      canAdjustBarcodeY: false,
      rebuild: function(sample, data) {
        sample.innerHTML = `
          <div class="spec_info">
            <span class="main">${data.name || '商品名稱'}</span>
            <ul>
              <li><span class="sub">${data.spec || '規格'}</span></li>
              <li><span class="sub">${data.price || '$999'}</span></li>
              <li>
                <div class="spec_barcode embedded-barcode">
                  ${data.barcodeImg ? `<img src="${data.barcodeImg}">` : ''}
                  <span class="sub">${data.barcode || '1234567890123'}</span>
                </div>
              </li>
            </ul>
          </div>
        `;
      }
    },
    'style5': {
      name: '價格置右版',
      hasMainText: true,
      hasSubText: true,
      hasBarcode: true,
      hasOnlyBarcode: false,
      barcodePosition: 'bottom',
      canAdjustBarcodeY: true,
      rebuild: function(sample, data) {
        sample.innerHTML = `
          <div class="spec_info">
            <span class="main">${data.name || '商品名稱'}</span>
            <ul>
              <li><span class="sub">${data.spec || '規格'}</span></li>
            </ul>
          </div>
          <div class="spec_barcode style5-barcode">
            <div class="price-right">
              <span class="sub"><b>${data.price || '$999'}</b></span>
            </div>
            ${data.barcodeImg ? `<img src="${data.barcodeImg}">` : ''}
            <span class="sub">${data.barcode || '1234567890123'}</span>
          </div>
        `;
      }
    },
    'style6': {
      name: '緊湊版（規格）',
      hasMainText: true,
      hasSubText: true,
      hasBarcode: true,
      hasOnlyBarcode: false,
      barcodePosition: 'compact',
      canAdjustBarcodeY: true,
      rebuild: function(sample, data) {
        sample.innerHTML = `
          <div class="style6-container">
            <div class="spec_info">
              <span class="main">${data.name || '商品名稱'}</span>
              <br>
              <span class="sub">${data.spec || '規格'}</span>
              <span class="sub">${data.price || '$999'}</span>
              <div class="spec_barcode compact-barcode">
                ${data.barcodeImg ? `<img src="${data.barcodeImg}">` : ''}
                <span class="sub">${data.barcode || '1234567890123'}</span>
              </div>
            </div>
          </div>
        `;
      }
    },
    'style7': {
      name: '緊湊版（SKU）',
      hasMainText: true,
      hasSubText: true,
      hasBarcode: true,
      hasOnlyBarcode: false,
      barcodePosition: 'compact',
      canAdjustBarcodeY: true,
      rebuild: function(sample, data) {
        sample.innerHTML = `
          <div class="style7-container">
            <span class="main">${data.name || '商品名稱'}</span>
            <div class="sub">${data.spec || '規格'}</div>
            <div class="sub sku-text" style="font-size: 7px;">${data.sku || 'cat-SKU-001'}</div>
            <div class="spec_barcode compact-barcode">
              <span class="sub"><b>${data.price || '$999'}</b></span>
              ${data.barcodeImg ? `<img src="${data.barcodeImg}">` : ''}
              <span class="sub">${data.barcode || '1234567890123'}</span>
            </div>
          </div>
        `;
      }
    },
    'style8': {
      name: '純條碼',
      hasMainText: false,
      hasSubText: false,
      hasBarcode: true,
      hasOnlyBarcode: true,
      barcodePosition: 'center',
      canAdjustBarcodeY: true,
      rebuild: function(sample, data) {
        sample.style.display = 'flex';
        sample.style.justifyContent = 'center';
        sample.style.alignItems = 'center';
        sample.innerHTML = `
          <div class="spec_barcode pure-barcode">
            ${data.barcodeImg ? `<img src="${data.barcodeImg}">` : ''}
            <span class="sub">${data.barcode || '1234567890123'}</span>
          </div>
        `;
      }
    }
  };
  
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
      ratio = 1.3;
    } else if (size <= 14) {
      ratio = 1.25;
    } else {
      ratio = 1.2;
    }
    return Math.round(size * ratio);
  }
  
  /* 建立基本樣式 */
  const style = document.createElement('style');
  style.innerHTML = `
    body {
      background: #f5f5f7;
      margin: 0;
      padding: 20px;
    }
    
    body > button.no-print {
      display: none !important;
    }
    
    .print_barcode_area {
      margin-top: 20px;
    }
    
    .print_sample {
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e1e4e8;
      position: relative;
      margin-bottom: 8px;
      overflow: hidden;
    }
    
    @media print {
      body {
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
      }
      
      #bv-barcode-control-panel,
      #bv-floating-print,
      .bv-notification {
        display: none !important;
      }
    }
    
    @media print {
      @page {
        margin: 0;
      }
    }
  `;
  document.head.appendChild(style);
  
  /* 建立動態樣式元素 */
  const dynamicStyle = document.createElement('style');
  document.head.appendChild(dynamicStyle);
  
  /* Logo 相關變數 */
  let logoDataUrl = null;
  let logoAspectRatio = 1;
  
  /* 防止列印時的重複執行 */
  let isPrinting = false;
  window.addEventListener('beforeprint', () => {
    if (!window.allowPrint) {
      if (!isPrinting) {
        isPrinting = true;
        setTimeout(() => { isPrinting = false; }, 100);
        alert('請使用編輯器內的列印按鈕');
      }
      return false;
    }
    window.allowPrint = false;
  });
  
  /* 控制面板收摺狀態 */
  let collapsedSections = {};
  let isPanelMinimized = false;
  
  /* 建立控制面板 */
  setTimeout(() => {
    const panel = document.createElement('div');
    panel.innerHTML = `
      <style>
        #bv-barcode-control-panel {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 380px;
          max-height: 90vh;
          z-index: 99999;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          overflow: hidden;
          transform: translateX(0);
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform;
        }
        
        #bv-barcode-control-panel.minimized {
          transform: translateX(calc(100% - 48px));
        }
        
        #bv-barcode-control-panel.minimized .bv-panel-header h3,
        #bv-barcode-control-panel.minimized .bv-panel-body,
        #bv-barcode-control-panel.minimized .bv-panel-footer {
          opacity: 0;
          pointer-events: none;
        }
        
        #bv-barcode-control-panel.minimized .bv-minimize-btn {
          right: 8px;
        }
        
        /* 毛玻璃效果 */
        .bv-glass-effect {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        
        .bv-panel-header {
          background: linear-gradient(135deg, #518aff 0%, #4371fb 100%);
          color: white;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          cursor: move;
          user-select: none;
        }
        
        .bv-panel-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .bv-current-style-name {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .bv-minimize-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.2);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .bv-minimize-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .bv-minimize-btn .material-icons {
          font-size: 20px;
          color: white;
        }
        
        .bv-panel-body {
          padding: 0;
          overflow-y: auto;
          max-height: calc(90vh - 138px);
          scroll-behavior: smooth;
        }
        
        .bv-panel-body::-webkit-scrollbar {
          width: 8px;
        }
        
        .bv-panel-body::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .bv-panel-body::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        
        .bv-panel-body::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
        
        .bv-panel-footer {
          padding: 16px 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(248, 249, 250, 0.5);
        }
        
        .bv-glass-action-button {
          width: 100%;
          background: linear-gradient(135deg, #518aff 0%, #4371fb 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(81, 138, 255, 0.3);
        }
        
        .bv-glass-action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(81, 138, 255, 0.4);
        }
        
        .bv-glass-action-button:active {
          transform: translateY(0);
        }
        
        /* 設定卡片 */
        .bv-settings-card {
          background: rgba(255, 255, 255, 0.6);
          margin: 16px;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }
        
        .bv-settings-card.collapsed .bv-card-content {
          max-height: 0;
          opacity: 0;
          padding: 0 20px;
        }
        
        .bv-settings-card.collapsed .bv-collapse-icon {
          transform: rotate(-90deg);
        }
        
        .bv-card-title {
          padding: 16px 20px;
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s ease;
          position: relative;
        }
        
        .bv-card-title:hover {
          background: rgba(0, 0, 0, 0.02);
        }
        
        .bv-card-title .material-icons {
          font-size: 20px;
          color: #518aff;
        }
        
        .bv-collapse-icon {
          margin-left: auto;
          color: #86868b;
          transition: transform 0.3s ease;
        }
        
        .bv-card-content {
          padding: 0 20px 20px 20px;
          max-height: 600px;
          opacity: 1;
          transition: all 0.3s ease;
        }
        
        /* 設定項目 */
        .bv-setting-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
        }
        
        .bv-setting-item:last-child {
          border-bottom: none;
        }
        
        .bv-setting-info {
          flex: 1;
        }
        
        .bv-setting-label {
          font-size: 13px;
          color: #1a1a1a;
          font-weight: 500;
        }
        
        /* 粗體按鈕 */
        .bv-bold-button {
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 6px;
          padding: 4px 12px;
          font-size: 14px;
          font-weight: 700;
          color: #86868b;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .bv-bold-button:hover:not(:disabled) {
          background: rgba(0, 0, 0, 0.08);
          color: #1a1a1a;
        }
        
        .bv-bold-button.active {
          background: #518aff;
          color: white;
          border-color: transparent;
        }
        
        .bv-bold-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* 滑桿樣式 */
        .bv-slider-group {
          padding: 8px 0;
        }
        
        .bv-slider-item {
          margin-bottom: 20px;
          transition: opacity 0.3s ease;
        }
        
        .bv-slider-item.disabled {
          opacity: 0.5;
          pointer-events: none;
        }
        
        .bv-slider-item:last-child {
          margin-bottom: 0;
        }
        
        .bv-slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .bv-slider-header span:first-child {
          font-size: 12px;
          color: #1a1a1a;
          font-weight: 500;
        }
        
        .bv-value-label {
          background: rgba(81, 138, 255, 0.1);
          color: #518aff;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
          min-width: 40px;
          text-align: center;
        }
        
        .bv-glass-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(0, 0, 0, 0.08);
          outline: none;
          position: relative;
          transition: background 0.2s ease;
        }
        
        .bv-glass-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }
        
        .bv-glass-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1);
        }
        
        .bv-glass-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: none;
          transition: all 0.2s ease;
        }
        
        .bv-glass-slider:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .bv-glass-slider:disabled::-webkit-slider-thumb {
          cursor: not-allowed;
        }
        
        /* 選擇器 */
        .bv-glass-select {
          width: 100%;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 8px;
          font-size: 13px;
          color: #1a1a1a;
          cursor: pointer;
          transition: all 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 16px;
        }
        
        .bv-glass-select:hover {
          background-color: rgba(0, 0, 0, 0.08);
          border-color: rgba(0, 0, 0, 0.12);
        }
        
        .bv-glass-select:focus {
          outline: none;
          border-color: #518aff;
          box-shadow: 0 0 0 3px rgba(81, 138, 255, 0.1);
        }
        
        /* 尺寸預設按鈕 */
        .bv-preset-sizes {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        
        .bv-preset-size-btn {
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 20px;
          padding: 6px 16px;
          font-size: 12px;
          color: #1a1a1a;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          font-weight: 500;
        }
        
        .bv-preset-size-btn:hover {
          background: rgba(0, 0, 0, 0.08);
          border-color: rgba(0, 0, 0, 0.12);
        }
        
        .bv-preset-size-btn.active {
          background: #518aff;
          color: white;
          border-color: transparent;
        }
        
        /* Logo 上傳區域 */
        .bv-logo-upload-area {
          border: 2px dashed rgba(0, 0, 0, 0.12);
          border-radius: 10px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(0, 0, 0, 0.02);
          margin-bottom: 16px;
        }
        
        .bv-logo-upload-area:hover {
          border-color: #518aff;
          background: rgba(81, 138, 255, 0.05);
        }
        
        .bv-logo-upload-area.has-logo {
          border-style: solid;
          padding: 16px;
          background: transparent;
        }
        
        .bv-logo-preview {
          max-width: 100%;
          max-height: 80px;
          display: block;
          margin: 0 auto;
        }
        
        .bv-upload-hint {
          color: #86868b;
          font-size: 12px;
          margin-top: 8px;
        }
        
        .bv-logo-controls {
          display: none;
        }
        
        .bv-logo-controls.active {
          display: block;
        }
        
        .bv-remove-logo-btn {
          background: #ff3b30;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 12px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        
        .bv-remove-logo-btn:hover {
          background: #e63329;
        }
        
        .bv-remove-logo-btn .material-icons {
          font-size: 16px;
        }
        
        /* 按鈕組 */
        .bv-button-group {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          justify-content: flex-end;
        }
        
        .bv-glass-button {
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          color: #1a1a1a;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }
        
        .bv-glass-button:hover {
          background: rgba(0, 0, 0, 0.08);
          border-color: rgba(0, 0, 0, 0.12);
        }
        
        .bv-glass-button .material-icons {
          font-size: 16px;
        }
        
        .bv-glass-button.bv-reset {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-color: transparent;
        }
        
        .bv-glass-button.bv-reset:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
        
        .bv-glass-button.bv-primary {
          background: #518aff;
          color: white;
          border-color: transparent;
        }
        
        .bv-glass-button.bv-primary:hover {
          background: #4371fb;
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
          gap: 6px;
        }
        
        .bv-preset-save-row {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          align-items: center;
        }
        
        .bv-glass-input {
          flex: 1;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 6px;
          font-size: 13px;
          color: #1a1a1a;
          transition: all 0.2s ease;
        }
        
        .bv-glass-input:focus {
          outline: none;
          border-color: #518aff;
          box-shadow: 0 0 0 3px rgba(81, 138, 255, 0.1);
        }
        
        /* 浮動按鈕 */
        .bv-floating-button {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #518aff 0%, #4371fb 100%);
          border: none;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(81, 138, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          z-index: 99998;
        }
        
        .bv-floating-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(81, 138, 255, 0.5), 0 3px 6px rgba(0, 0, 0, 0.1);
        }
        
        .bv-floating-button:active {
          transform: translateY(-1px);
        }
        
        .bv-floating-button .material-icons {
          color: white;
          font-size: 24px;
        }
        
        /* 通知訊息 */
        .bv-notification {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100000;
          background: white;
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
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
      </style>
      
      <div id="bv-barcode-control-panel">
        <div class="bv-panel-header">
          <h3>
            BV 條碼編輯器
            <span class="bv-current-style-name">${layoutTemplates[currentLayout].name}</span>
          </h3>
          <button class="bv-minimize-btn" id="bv-minimize-btn">
            <span class="material-icons">remove</span>
          </button>
        </div>
        
        <div class="bv-panel-body">
          <div class="bv-settings-card" id="paper-settings-card" data-section="paper">
            <h4 class="bv-card-title">
              <span class="material-icons">description</span>
              標籤紙張設定
              <span class="material-icons bv-collapse-icon">expand_more</span>
            </h4>
            
            <div class="bv-card-content">
              <div class="bv-preset-sizes">
                <button class="bv-preset-size-btn" data-width="42" data-height="29">42×29mm</button>
                <button class="bv-preset-size-btn active" data-width="40" data-height="30">40×30mm</button>
                <button class="bv-preset-size-btn" data-width="60" data-height="30">60×30mm</button>
              </div>
              
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
                    <span class="bv-value-label" id="label-height">30mm</span>
                  </div>
                  <input type="range" id="label-height-slider" min="20" max="60" value="30" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item">
                  <div class="bv-slider-header">
                    <span>內部邊距</span>
                    <span class="bv-value-label" id="label-padding">3mm</span>
                  </div>
                  <input type="range" id="label-padding-slider" min="0" max="5" step="0.5" value="3" class="bv-glass-slider">
                </div>
              </div>
              
              <div class="bv-slider-item" style="margin-top: 16px;">
                <div class="bv-slider-header">
                  <span>字體類型</span>
                </div>
                <select id="font-family-select" class="bv-glass-select">
                  ${fontOptions.map(font => `<option value="${font.value}">${font.name}</option>`).join('')}
                </select>
              </div>
              
              <div class="bv-button-group">
                <button class="bv-glass-button bv-reset" id="bv-reset-format">
                  <span class="material-icons">restart_alt</span>
                  還原 BV 預設值
                </button>
              </div>
            </div>
          </div>
          
          <!-- 文字設定 -->
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
                  <input type="range" id="main-slider" min="8" max="20" value="10" class="bv-glass-slider">
                </div>

                <div class="bv-slider-item" id="main-line-height-setting">
                  <div class="bv-slider-header">
                    <span>行高</span>
                    <span class="bv-value-label" id="main-line-height">11px</span>
                  </div>
                  <input type="range" id="main-line-height-slider" min="8" max="30" value="11" class="bv-glass-slider">
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
                <div class="bv-setting-item" id="sub-text-setting">
                  <div class="bv-setting-info">
                    <span class="bv-setting-label">規格/編號/價格</span>
                  </div>
                  <button class="bv-bold-button active" id="sub-bold-btn" title="粗體">B</button>
                </div>
                
                <div class="bv-slider-item" id="sub-size-setting">
                  <div class="bv-slider-header">
                    <span>文字大小</span>
                    <span class="bv-value-label" id="sub-size">8px</span>
                  </div>
                  <input type="range" id="sub-slider" min="6" max="16" value="8" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item" id="sub-line-height-setting">
                  <div class="bv-slider-header">
                    <span>行高</span>
                    <span class="bv-value-label" id="sub-line-height">9px</span>
                  </div>
                  <input type="range" id="sub-line-height-slider" min="6" max="20" value="9" class="bv-glass-slider">
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
                  <input type="range" id="barcode-text-slider" min="6" max="16" value="8" class="bv-glass-slider">
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
                  <input type="range" id="barcode-height-slider" min="50" max="200" value="100" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item" id="barcode-width-setting">
                  <div class="bv-slider-header">
                    <span>條碼圖片寬度（X軸拉伸）</span>
                    <span class="bv-value-label" id="barcode-width">100%</span>
                  </div>
                  <input type="range" id="barcode-width-slider" min="50" max="100" value="100" class="bv-glass-slider">
                </div>
                
                <div class="bv-slider-item" id="barcode-y-position-setting">
                  <div class="bv-slider-header">
                    <span>條碼垂直位置</span>
                    <span class="bv-value-label" id="barcode-y-position">70%</span>
                  </div>
                  <input type="range" id="barcode-y-position-slider" min="0" max="100" value="70" class="bv-glass-slider">
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
          
          <!-- 預設管理 - 移到最下面 -->
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
      const barcodeHeight = document.getElementById('barcode-height-slider');
      const barcodeWidth = document.getElementById('barcode-width-slider');
      const barcodeYPosition = document.getElementById('barcode-y-position-slider');
      
      const labelWidth = document.getElementById('label-width-slider');
      const labelHeight = document.getElementById('label-height-slider');
      const labelPadding = document.getElementById('label-padding-slider');
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
      
      /* 根據樣式調整控制項狀態 */
      function updateControlStates() {
        const template = layoutTemplates[currentLayout];
        
        // 文字設定
        const textSettingsCard = document.getElementById('text-settings-card');
        const mainSettings = ['main-text-setting', 'main-size-setting', 'main-line-height-setting', 'main-gap-setting'];
        const subSettings = ['sub-text-setting', 'sub-size-setting', 'sub-line-height-setting'];
        
        if (template.hasOnlyBarcode) {
          // 純條碼模式 - 隱藏文字設定卡片
          textSettingsCard.style.display = 'none';
        } else {
          textSettingsCard.style.display = '';
          
          // 根據樣式啟用/禁用相關設定
          mainSettings.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
              elem.classList.toggle('disabled', !template.hasMainText);
            }
          });
          
          subSettings.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
              elem.classList.toggle('disabled', !template.hasSubText);
            }
          });
        }
        
        // 條碼設定
        const barcodeHeightSetting = document.getElementById('barcode-height-setting');
        const barcodeWidthSetting = document.getElementById('barcode-width-setting');
        const barcodeYPositionSetting = document.getElementById('barcode-y-position-setting');
        
        if (barcodeHeightSetting) {
          barcodeHeightSetting.classList.toggle('disabled', !template.hasBarcode);
        }
        if (barcodeWidthSetting) {
          barcodeWidthSetting.classList.toggle('disabled', !template.hasBarcode);
        }
        if (barcodeYPositionSetting) {
          // 條碼位置根據樣式決定是否可調整
          barcodeYPositionSetting.classList.toggle('disabled', 
            !template.hasBarcode || !template.canAdjustBarcodeY);
        }
        
        // 禁用/啟用對應的控制項
        if (mainSize) mainSize.disabled = !template.hasMainText;
        if (mainBoldBtn) mainBoldBtn.disabled = !template.hasMainText;
        if (mainGap) mainGap.disabled = !template.hasMainText;
        if (mainLineHeightSlider) mainLineHeightSlider.disabled = !template.hasMainText;
        
        if (subSize) subSize.disabled = !template.hasSubText;
        if (subBoldBtn) subBoldBtn.disabled = !template.hasSubText;
        if (subLineHeightSlider) subLineHeightSlider.disabled = !template.hasSubText;
        
        if (barcodeHeight) barcodeHeight.disabled = !template.hasBarcode;
        if (barcodeWidth) barcodeWidth.disabled = !template.hasBarcode;
        if (barcodeYPosition) {
          barcodeYPosition.disabled = !template.hasBarcode || !template.canAdjustBarcodeY;
        }
      }
      
      /* 更新樣式函數 */
      function updateStyles() {
        if (!mainSize || !subSize) return;
        
        const template = layoutTemplates[currentLayout];
        const mainLineHeight = mainLineHeightSlider ? mainLineHeightSlider.value : 11;
        const subLineHeight = subLineHeightSlider ? subLineHeightSlider.value : 9;
        
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
        let barcodeHeightMM = 10 * barcodeHeightScale; // 基礎高度 10mm
        let barcodeWidthMM = (totalWidth * 0.9) * barcodeWidthScale;
        
        // 根據樣式調整條碼尺寸
        if (template.barcodePosition === 'embedded') {
          barcodeHeightMM = 8 * barcodeHeightScale; // 內嵌條碼較小
          barcodeWidthMM = (totalWidth * 0.8) * barcodeWidthScale;
        } else if (template.barcodePosition === 'compact') {
          barcodeHeightMM = 8 * barcodeHeightScale;
          barcodeWidthMM = (totalWidth * 0.85) * barcodeWidthScale;
        } else if (template.barcodePosition === 'center') {
          barcodeHeightMM = 15 * barcodeHeightScale; // 純條碼較大
          barcodeWidthMM = (totalWidth * 0.95) * barcodeWidthScale;
        }
        
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
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
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
          
          /* SKU 特殊樣式 */
          .print_barcode_area .print_sample .sku-text {
            font-size: ${Math.max(subSize.value - 1, 6)}px !important;
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
          
          /* 條碼圖片樣式 - 根據樣式調整 */
          .print_barcode_area .print_sample .spec_barcode > img {
            height: ${barcodeHeightMM}mm !important;
            width: auto !important;
            max-width: ${barcodeWidthMM}mm !important;
            object-fit: fill !important;
            margin: 0 auto !important;
            display: block !important;
          }
          
          /* 內嵌條碼特殊樣式 */
          .print_barcode_area .print_sample .embedded-barcode img {
            height: ${8 * barcodeHeightScale}mm !important;
            max-width: ${(totalWidth * 0.8) * barcodeWidthScale}mm !important;
          }
          
          /* 緊湊條碼特殊樣式 - 樣式6、7可調整位置 */
          .print_barcode_area .print_sample .compact-barcode {
            margin-top: ${(barcodeYPercent - 70) * 0.3}mm !important;
          }
          
          .print_barcode_area .print_sample .compact-barcode img {
            height: ${8 * barcodeHeightScale}mm !important;
            max-width: ${(totalWidth * 0.85) * barcodeWidthScale}mm !important;
          }
          
          /* 純條碼特殊樣式 - 樣式8可調整位置且置中 */
          .print_barcode_area .print_sample .pure-barcode {
            position: absolute !important;
            top: ${barcodeYPercent}% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: auto !important;
            height: auto !important;
          }
          
          .print_barcode_area .print_sample .pure-barcode img {
            height: ${15 * barcodeHeightScale}mm !important;
            max-width: ${(totalWidth * 0.95) * barcodeWidthScale}mm !important;
          }
          
          /* 條碼文字樣式 */
          .print_barcode_area .print_sample .spec_barcode > span.sub,
          .print_barcode_area .print_sample .spec_barcode > b > span.sub,
          .print_barcode_area .print_sample .spec_barcode > .sub,
          .print_barcode_area .print_sample .spec_barcode .sub {
            font-size: ${barcodeTextSize.value}px !important;
            font-weight: ${barcodeTextFontWeight} !important;
            font-family: ${fontFamily.value} !important;
            line-height: 1.2 !important;
            margin-top: 2px !important;
            display: block !important;
          }
          
          /* 樣式5 - 價格置右特殊處理 */
          .print_barcode_area .print_sample .price-right {
            position: absolute !important;
            right: 0 !important;
            top: -20px !important;
            font-size: ${subSize.value}px !important;
            z-index: 3 !important;
          }
          
          .print_barcode_area .print_sample .price-right .sub {
            white-space: nowrap !important;
          }
          
          /* 樣式5的條碼位置調整 */
          .print_barcode_area .print_sample .style5-barcode {
            margin-top: ${(barcodeYPercent - 70) * 0.5}mm !important;
          }
          
          /* 樣式6、7容器 */
          .print_barcode_area .print_sample .style6-container,
          .print_barcode_area .print_sample .style7-container {
            height: 100% !important;
            box-sizing: border-box !important;
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
          
          /* 特殊情況：當條碼垂直位置調整時（可調整的樣式） */
          ${template.canAdjustBarcodeY && template.barcodePosition === 'bottom' ? `
          .print_barcode_area .print_sample .spec_barcode {
            margin-top: ${(barcodeYPercent - 70) * 0.5}mm !important;
          }
          ` : ''}
        `;
        
        /* 更新所有標籤的底圖 */
        updateAllLogos();
        
        /* 自動保存當前設定為臨時設定 */
        saveSettingsToLocal('_current_temp_settings', saveCurrentSettings());
      }
      
      /* 根據樣式模板重建標籤內容 */
      function applyLayoutTemplate() {
        const template = layoutTemplates[currentLayout];
        
        // 更新控制項狀態
        updateControlStates();
        
        // 重建每個標籤的內容
        document.querySelectorAll('.print_sample').forEach((sample, index) => {
          const data = productData[index] || {};
          
          // 清除樣式
          sample.style = '';
          
          // 使用模板的 rebuild 函數重建內容
          if (template.rebuild) {
            template.rebuild(sample, data);
          }
        });
        
        // 立即更新樣式
        updateStyles();
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
          if (subLineHeightSlider && !subLineHeightSlider.disabled) {
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
        barcodeTextSize, barcodeHeight, barcodeWidth, barcodeYPosition,
        labelWidth, labelHeight, labelPadding, fontFamily,
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
      
      /* 清除格式按鈕功能 - 修正版 */
      const resetFormatBtn = document.getElementById('bv-reset-format');
      if (resetFormatBtn) {
        resetFormatBtn.addEventListener('click', function() {
          if (confirm('確定要將所有設定還原到 BV 原始預設值嗎？\n\n此操作無法復原。')) {
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
            
            // 套用完整預設值
            const defaultsWithOriginalLayout = {
              ...completeDefaultSettings,
              layout: originalLayout
            };
            applySavedSettings(defaultsWithOriginalLayout);
            
            const presetSelect = document.getElementById('bv-preset-select');
            if (presetSelect) presetSelect.value = '';
            
            try {
              localStorage.removeItem('bvShopBarcode_lastSelectedPreset');
              localStorage.removeItem('bvShopBarcode__current_temp_settings');
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
          
          // 更新當前樣式顯示
          const styleNameElement = document.querySelector('.bv-current-style-name');
          if (styleNameElement) {
            styleNameElement.textContent = layoutTemplates[currentLayout].name;
          }
          
          // 重建標籤內容
          applyLayoutTemplate();
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
        
        // 使用原始偵測的樣式作為預設
        const defaultsWithOriginalLayout = {
          ...completeDefaultSettings,
          layout: originalLayout
        };
        applySavedSettings(defaultsWithOriginalLayout);
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
      updateControlStates();
      checkPresetSizeActive();
      
      /* 將函數掛載到 window 物件 */
      window.barcodeEditor = {
        updateStyles,
        saveCurrentSettings,
        applySavedSettings,
        showNotification,
        updateAllLogos,
        productData,
        currentLayout,
        applyLayoutTemplate
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
