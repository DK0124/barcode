javascript:(function(){
  /* BV SHOP 條碼標籤編輯器 - 專業版 v7 */
  
  // 只在條碼列印頁面上執行
  if (!document.querySelector('.print_barcode_area')) return;

  /* 載入必要的外部資源 */
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap';
  document.head.appendChild(fontLink);

  const iconLink = document.createElement('link');
  iconLink.rel = 'stylesheet';
  iconLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
  document.head.appendChild(iconLink);

  /* 全域變數 */
  let selectedElement = null;
  let isDragging = false;
  let isResizing = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let elementStartX = 0;
  let elementStartY = 0;
  let currentLabelWidth = 40;
  let currentLabelHeight = 30;
  let showGrid = true;
  let snapToGrid = true;
  let gridSize = 5; // 5px
  let currentProject = null;
  let clipboard = null;
  let history = [];
  let historyIndex = -1;
  let maxHistory = 50;

  /* 元件類型定義 */
  const ELEMENT_TYPES = {
    TEXT: 'text',
    BARCODE: 'barcode',
    IMAGE: 'image',
    SHAPE: 'shape',
    LINE: 'line'
  };

  /* 預設字體選項 */
  const fontFamilies = [
    { name: '思源黑體', value: '"Noto Sans TC", sans-serif' },
    { name: '微軟正黑體', value: '"Microsoft JhengHei", sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: '標楷體', value: '"DFKai-SB", serif' },
    { name: '新細明體', value: '"PMingLiU", serif' }
  ];

  /* 從原始頁面抓取資料 */
  function extractProductData() {
    const samples = document.querySelectorAll('.print_sample');
    const products = [];
    
    samples.forEach((sample, index) => {
      const product = {
        id: `product_${index}`,
        name: '',
        spec: '',
        price: '',
        specialPrice: '',
        sku: '',
        barcode: '',
        barcodeImage: '',
        allTexts: [],
        originalHTML: sample.innerHTML
      };
      
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
      
      // 抓取所有文字內容
      const allTexts = sample.querySelectorAll('.sub, .main, li');
      allTexts.forEach(el => {
        const text = el.textContent.trim();
        if (text && !product.allTexts.includes(text)) {
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
          } else if (/^[A-Za-z0-9\-_]+$/.test(text) && text.length > 3) {
            product.sku = text;
          }
        }
      });
      
      products.push(product);
    });
    
    return products;
  }

  /* 建立主要樣式 */
  const style = document.createElement('style');
  style.innerHTML = `
    /* 隱藏原始內容 */
    .print_barcode_area {
      display: none !important;
    }
    
    /* 編輯器主容器 */
    #bv-editor-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #f5f5f7;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      z-index: 10000;
    }
    
    /* 頂部工具列 */
    .bv-toolbar {
      background: #1d1d1f;
      color: white;
      display: flex;
      align-items: center;
      padding: 0 16px;
      height: 48px;
      flex-shrink: 0;
      box-shadow: 0 1px 0 rgba(255,255,255,0.1) inset;
    }
    
    .bv-toolbar-section {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      border-right: 1px solid rgba(255,255,255,0.1);
    }
    
    .bv-toolbar-section:last-child {
      border-right: none;
      margin-left: auto;
    }
    
    .bv-tool-btn {
      background: transparent;
      border: none;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      transition: all 0.2s;
      position: relative;
    }
    
    .bv-tool-btn:hover {
      background: rgba(255,255,255,0.1);
    }
    
    .bv-tool-btn.active {
      background: #0071e3;
    }
    
    .bv-tool-btn .material-icons {
      font-size: 18px;
    }
    
    /* 主編輯區 */
    .bv-main-area {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
    
    /* 左側面板 */
    .bv-left-panel {
      width: 280px;
      background: white;
      border-right: 1px solid #d2d2d7;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .bv-panel-tabs {
      display: flex;
      border-bottom: 1px solid #d2d2d7;
      background: #fafafa;
    }
    
    .bv-panel-tab {
      flex: 1;
      padding: 12px;
      text-align: center;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #666;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    
    .bv-panel-tab.active {
      color: #0071e3;
      border-bottom-color: #0071e3;
      background: white;
    }
    
    .bv-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    
    /* 元件庫 */
    .bv-elements-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .bv-element-card {
      background: #f5f5f7;
      border: 1px solid #d2d2d7;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .bv-element-card:hover {
      background: #e8e8ed;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .bv-element-card .material-icons {
      font-size: 32px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .bv-element-card-title {
      font-size: 12px;
      color: #333;
      font-weight: 500;
    }
    
    /* 資料欄位 */
    .bv-data-field {
      background: #f5f5f7;
      border: 1px solid #d2d2d7;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 8px;
      cursor: move;
      transition: all 0.2s;
    }
    
    .bv-data-field:hover {
      background: #e8e8ed;
      transform: translateX(4px);
    }
    
    .bv-data-field-label {
      font-size: 11px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .bv-data-field-value {
      font-size: 13px;
      color: #000;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    /* 屬性面板 */
    .bv-property-group {
      margin-bottom: 24px;
    }
    
    .bv-property-title {
      font-size: 13px;
      font-weight: 600;
      color: #000;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .bv-property-item {
      margin-bottom: 12px;
    }
    
    .bv-property-label {
      font-size: 11px;
      color: #666;
      margin-bottom: 6px;
      display: block;
    }
    
    .bv-property-input {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid #d2d2d7;
      border-radius: 6px;
      font-size: 13px;
      background: white;
      transition: all 0.2s;
    }
    
    .bv-property-input:focus {
      outline: none;
      border-color: #0071e3;
      box-shadow: 0 0 0 3px rgba(0,113,227,0.1);
    }
    
    .bv-property-row {
      display: flex;
      gap: 8px;
    }
    
    .bv-property-row .bv-property-item {
      flex: 1;
    }
    
    /* 中央畫布區 */
    .bv-canvas-area {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: auto;
      position: relative;
      background: #e5e5e7;
      background-image: 
        linear-gradient(rgba(255,255,255,0.5) 2px, transparent 2px),
        linear-gradient(90deg, rgba(255,255,255,0.5) 2px, transparent 2px);
      background-size: 20px 20px;
    }
    
    /* 畫布容器 */
    .bv-canvas-container {
      position: relative;
      background: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transform-origin: center center;
      transition: transform 0.2s;
    }
    
    /* 畫布 */
    .bv-canvas {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: white;
    }
    
    /* 網格 */
    .bv-grid {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      opacity: 0.15;
    }
    
    .bv-grid.show {
      background-image: 
        repeating-linear-gradient(0deg, #ccc, #ccc 1px, transparent 1px, transparent 5mm),
        repeating-linear-gradient(90deg, #ccc, #ccc 1px, transparent 1px, transparent 5mm);
    }
    
    /* 邊界指示器 */
    .bv-margin-guide {
      position: absolute;
      border: 1px dashed #ff3b30;
      pointer-events: none;
      opacity: 0.5;
    }
    
    /* 參考線 */
    .bv-guide-line {
      position: absolute;
      background: #0071e3;
      opacity: 0.8;
      pointer-events: none;
      z-index: 1000;
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
    
    /* 可編輯元素 */
    .bv-element {
      position: absolute;
      cursor: move;
      user-select: none;
      min-width: 20px;
      min-height: 20px;
    }
    
    .bv-element.selected {
      outline: 2px solid #0071e3;
      outline-offset: -1px;
    }
    
    .bv-element.dragging {
      opacity: 0.8;
      cursor: grabbing;
    }
    
    /* 調整手柄 */
    .bv-resize-handle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: #0071e3;
      border: 1px solid white;
      border-radius: 50%;
      display: none;
    }
    
    .bv-element.selected .bv-resize-handle {
      display: block;
    }
    
    .bv-resize-handle.nw { top: -4px; left: -4px; cursor: nw-resize; }
    .bv-resize-handle.n { top: -4px; left: calc(50% - 4px); cursor: n-resize; }
    .bv-resize-handle.ne { top: -4px; right: -4px; cursor: ne-resize; }
    .bv-resize-handle.e { top: calc(50% - 4px); right: -4px; cursor: e-resize; }
    .bv-resize-handle.se { bottom: -4px; right: -4px; cursor: se-resize; }
    .bv-resize-handle.s { bottom: -4px; left: calc(50% - 4px); cursor: s-resize; }
    .bv-resize-handle.sw { bottom: -4px; left: -4px; cursor: sw-resize; }
    .bv-resize-handle.w { top: calc(50% - 4px); left: -4px; cursor: w-resize; }
    
    /* 文字元素 */
    .bv-text-element {
      padding: 4px;
      line-height: 1.4;
      word-break: break-word;
      white-space: pre-wrap;
    }
    
    .bv-text-element.editing {
      outline: 2px dashed #0071e3;
      cursor: text;
    }
    
    /* 條碼元素 */
    .bv-barcode-element img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    /* 圖片元素 */
    .bv-image-element img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    /* 形狀元素 */
    .bv-shape-element {
      background: #000;
    }
    
    .bv-shape-element.rectangle {
      /* 預設矩形 */
    }
    
    .bv-shape-element.circle {
      border-radius: 50%;
    }
    
    /* 線條元素 */
    .bv-line-element {
      background: #000;
      transform-origin: left center;
    }
    
    /* 右側面板 */
    .bv-right-panel {
      width: 280px;
      background: white;
      border-left: 1px solid #d2d2d7;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    /* 圖層面板 */
    .bv-layers-list {
      padding: 8px;
    }
    
    .bv-layer-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 4px;
      background: #f5f5f7;
      border: 1px solid transparent;
    }
    
    .bv-layer-item:hover {
      background: #e8e8ed;
    }
    
    .bv-layer-item.selected {
      background: #e3f2ff;
      border-color: #0071e3;
    }
    
    .bv-layer-icon {
      font-size: 16px;
      color: #666;
      margin-right: 8px;
    }
    
    .bv-layer-name {
      flex: 1;
      font-size: 13px;
      color: #000;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .bv-layer-visibility {
      font-size: 16px;
      color: #666;
      cursor: pointer;
      padding: 2px;
    }
    
    .bv-layer-visibility:hover {
      color: #0071e3;
    }
    
    /* 底部狀態列 */
    .bv-statusbar {
      height: 32px;
      background: #f5f5f7;
      border-top: 1px solid #d2d2d7;
      display: flex;
      align-items: center;
      padding: 0 16px;
      font-size: 11px;
      color: #666;
      flex-shrink: 0;
    }
    
    .bv-status-item {
      margin-right: 24px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    /* 縮放控制 */
    .bv-zoom-controls {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .bv-zoom-btn {
      background: transparent;
      border: 1px solid #d2d2d7;
      border-radius: 4px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #666;
      transition: all 0.2s;
    }
    
    .bv-zoom-btn:hover {
      background: white;
      color: #000;
    }
    
    .bv-zoom-value {
      min-width: 50px;
      text-align: center;
      font-weight: 500;
      color: #333;
    }
    
    /* 右鍵選單 */
    .bv-context-menu {
      position: fixed;
      background: white;
      border: 1px solid #d2d2d7;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      padding: 4px;
      min-width: 200px;
      z-index: 10001;
      display: none;
    }
    
    .bv-menu-item {
      padding: 8px 16px;
      font-size: 13px;
      color: #000;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.2s;
    }
    
    .bv-menu-item:hover {
      background: #f5f5f7;
    }
    
    .bv-menu-item .material-icons {
      font-size: 16px;
      color: #666;
    }
    
    .bv-menu-separator {
      height: 1px;
      background: #e5e5e7;
      margin: 4px 8px;
    }
    
    /* 對話框 */
    .bv-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
    }
    
    .bv-dialog {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      min-width: 400px;
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .bv-dialog-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e5e5e7;
    }
    
    .bv-dialog-title {
      font-size: 18px;
      font-weight: 600;
      color: #000;
    }
    
    .bv-dialog-body {
      padding: 24px;
      overflow-y: auto;
    }
    
    .bv-dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid #e5e5e7;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    
    .bv-button {
      padding: 8px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      outline: none;
    }
    
    .bv-button.primary {
      background: #0071e3;
      color: white;
    }
    
    .bv-button.primary:hover {
      background: #0058b3;
    }
    
    .bv-button.secondary {
      background: #f5f5f7;
      color: #000;
      border: 1px solid #d2d2d7;
    }
    
    .bv-button.secondary:hover {
      background: #e8e8ed;
    }
    
    /* 專案管理 */
    .bv-projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .bv-project-card {
      background: #f5f5f7;
      border: 1px solid #d2d2d7;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }
    
    .bv-project-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .bv-project-preview {
      width: 100%;
      height: 120px;
      background: white;
      border: 1px solid #e5e5e7;
      border-radius: 4px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      color: #d2d2d7;
    }
    
    .bv-project-name {
      font-size: 14px;
      font-weight: 500;
      color: #000;
      margin-bottom: 4px;
    }
    
    .bv-project-date {
      font-size: 11px;
      color: #666;
    }
    
    .bv-project-delete {
      position: absolute;
      top: 8px;
      right: 8px;
      background: white;
      border: 1px solid #d2d2d7;
      border-radius: 4px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: all 0.2s;
    }
    
    .bv-project-card:hover .bv-project-delete {
      opacity: 1;
    }
    
    .bv-project-delete:hover {
      background: #ff3b30;
      color: white;
      border-color: #ff3b30;
    }
    
    /* 快捷鍵提示 */
    .bv-shortcut {
      font-size: 11px;
      color: #999;
      margin-left: auto;
      font-family: monospace;
    }
    
    /* 載入動畫 */
    .bv-loading {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10003;
    }
    
    .bv-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #0071e3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* 列印樣式 */
    @media print {
      #bv-editor-container {
        display: none !important;
      }
      
      .print_barcode_area {
        display: block !important;
      }
      
      .bv-print-page {
        display: block !important;
        page-break-after: always;
      }
      
      .bv-print-label {
        position: relative !important;
        display: inline-block !important;
      }
    }
    
    /* 提示文字 */
    .bv-tooltip {
      position: absolute;
      background: #1d1d1f;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      pointer-events: none;
      z-index: 10004;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    .bv-tooltip.show {
      opacity: 1;
    }
    
    /* 顏色選擇器 */
    .bv-color-picker {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .bv-color-preview {
      width: 32px;
      height: 32px;
      border: 1px solid #d2d2d7;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .bv-color-input {
      flex: 1;
    }
    
    /* 滑桿 */
    .bv-slider {
      width: 100%;
      height: 4px;
      background: #e5e5e7;
      border-radius: 2px;
      outline: none;
      -webkit-appearance: none;
      margin: 8px 0;
    }
    
    .bv-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      background: #0071e3;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }
    
    .bv-slider-value {
      display: inline-block;
      min-width: 40px;
      text-align: right;
      font-size: 12px;
      color: #666;
    }
  `;
  document.head.appendChild(style);

  /* 建立編輯器介面 */
  const editor = document.createElement('div');
  editor.id = 'bv-editor-container';
  editor.innerHTML = `
    <!-- 頂部工具列 -->
    <div class="bv-toolbar">
      <div class="bv-toolbar-section">
        <button class="bv-tool-btn" id="btn-new-project" title="新專案">
          <span class="material-icons">add_box</span>
          <span>新專案</span>
        </button>
        <button class="bv-tool-btn" id="btn-open-project" title="開啟專案">
          <span class="material-icons">folder_open</span>
          <span>開啟</span>
        </button>
        <button class="bv-tool-btn" id="btn-save-project" title="儲存專案 (Ctrl+S)">
          <span class="material-icons">save</span>
          <span>儲存</span>
        </button>
      </div>
      
      <div class="bv-toolbar-section">
        <button class="bv-tool-btn" id="btn-undo" title="復原 (Ctrl+Z)">
          <span class="material-icons">undo</span>
        </button>
        <button class="bv-tool-btn" id="btn-redo" title="重做 (Ctrl+Y)">
          <span class="material-icons">redo</span>
        </button>
      </div>
      
      <div class="bv-toolbar-section">
        <button class="bv-tool-btn" id="btn-copy" title="複製 (Ctrl+C)">
          <span class="material-icons">content_copy</span>
        </button>
        <button class="bv-tool-btn" id="btn-paste" title="貼上 (Ctrl+V)">
          <span class="material-icons">content_paste</span>
        </button>
        <button class="bv-tool-btn" id="btn-delete" title="刪除 (Delete)">
          <span class="material-icons">delete</span>
        </button>
      </div>
      
      <div class="bv-toolbar-section">
        <button class="bv-tool-btn" id="btn-align-left" title="左對齊">
          <span class="material-icons">format_align_left</span>
        </button>
        <button class="bv-tool-btn" id="btn-align-center" title="置中對齊">
          <span class="material-icons">format_align_center</span>
        </button>
        <button class="bv-tool-btn" id="btn-align-right" title="右對齊">
          <span class="material-icons">format_align_right</span>
        </button>
        <button class="bv-tool-btn" id="btn-align-top" title="上對齊">
          <span class="material-icons">vertical_align_top</span>
        </button>
        <button class="bv-tool-btn" id="btn-align-middle" title="垂直置中">
          <span class="material-icons">vertical_align_center</span>
        </button>
        <button class="bv-tool-btn" id="btn-align-bottom" title="下對齊">
          <span class="material-icons">vertical_align_bottom</span>
        </button>
      </div>
      
      <div class="bv-toolbar-section">
        <button class="bv-tool-btn" id="btn-grid" title="顯示網格">
          <span class="material-icons">grid_on</span>
        </button>
        <button class="bv-tool-btn" id="btn-snap" title="貼齊網格">
          <span class="material-icons">grid_goldenratio</span>
        </button>
        <button class="bv-tool-btn" id="btn-guides" title="參考線">
          <span class="material-icons">straighten</span>
        </button>
      </div>
      
      <div class="bv-toolbar-section">
        <button class="bv-tool-btn" id="btn-preview" title="預覽列印">
          <span class="material-icons">preview</span>
          <span>預覽</span>
        </button>
        <button class="bv-tool-btn" id="btn-print" title="列印 (Ctrl+P)">
          <span class="material-icons">print</span>
          <span>列印</span>
        </button>
      </div>
    </div>
    
    <!-- 主編輯區 -->
    <div class="bv-main-area">
      <!-- 左側面板 -->
      <div class="bv-left-panel">
        <div class="bv-panel-tabs">
          <div class="bv-panel-tab active" data-tab="elements">元件</div>
          <div class="bv-panel-tab" data-tab="data">資料</div>
          <div class="bv-panel-tab" data-tab="properties">屬性</div>
        </div>
        
        <div class="bv-panel-content" id="panel-elements">
          <div class="bv-elements-grid">
            <div class="bv-element-card" data-element="text">
              <span class="material-icons">text_fields</span>
              <div class="bv-element-card-title">文字</div>
            </div>
            <div class="bv-element-card" data-element="barcode">
              <span class="material-icons">qr_code</span>
              <div class="bv-element-card-title">條碼</div>
            </div>
            <div class="bv-element-card" data-element="image">
              <span class="material-icons">image</span>
              <div class="bv-element-card-title">圖片</div>
            </div>
            <div class="bv-element-card" data-element="rectangle">
              <span class="material-icons">rectangle</span>
              <div class="bv-element-card-title">矩形</div>
            </div>
            <div class="bv-element-card" data-element="circle">
              <span class="material-icons">circle</span>
              <div class="bv-element-card-title">圓形</div>
            </div>
            <div class="bv-element-card" data-element="line">
              <span class="material-icons">horizontal_rule</span>
              <div class="bv-element-card-title">線條</div>
            </div>
          </div>
        </div>
        
        <div class="bv-panel-content" id="panel-data" style="display:none;">
          <div id="data-fields-container"></div>
        </div>
        
        <div class="bv-panel-content" id="panel-properties" style="display:none;">
          <div id="properties-container"></div>
        </div>
      </div>
      
      <!-- 中央畫布區 -->
      <div class="bv-canvas-area" id="canvas-area">
        <div class="bv-canvas-container" id="canvas-container">
          <div class="bv-canvas" id="canvas">
            <div class="bv-grid" id="grid"></div>
            <div class="bv-margin-guide" id="margin-guide"></div>
          </div>
        </div>
      </div>
      
      <!-- 右側面板 -->
      <div class="bv-right-panel">
        <div class="bv-panel-tabs">
          <div class="bv-panel-tab active" data-tab="layers">圖層</div>
          <div class="bv-panel-tab" data-tab="pages">頁面</div>
        </div>
        
        <div class="bv-panel-content" id="panel-layers">
          <div class="bv-layers-list" id="layers-list"></div>
        </div>
        
        <div class="bv-panel-content" id="panel-pages" style="display:none;">
          <div id="pages-container"></div>
        </div>
      </div>
    </div>
    
    <!-- 底部狀態列 -->
    <div class="bv-statusbar">
      <div class="bv-status-item">
        <span>標籤尺寸:</span>
        <strong id="label-size">40×30mm</strong>
      </div>
      <div class="bv-status-item">
        <span>選取:</span>
        <strong id="selection-info">無</strong>
      </div>
      <div class="bv-status-item">
        <span>位置:</span>
        <strong id="position-info">X: 0, Y: 0</strong>
      </div>
      
      <div class="bv-zoom-controls">
        <button class="bv-zoom-btn" id="zoom-out">
          <span class="material-icons">remove</span>
        </button>
        <div class="bv-zoom-value" id="zoom-value">100%</div>
        <button class="bv-zoom-btn" id="zoom-in">
          <span class="material-icons">add</span>
        </button>
      </div>
    </div>
    
    <!-- 右鍵選單 -->
    <div class="bv-context-menu" id="context-menu">
      <div class="bv-menu-item" data-action="copy">
        <span class="material-icons">content_copy</span>
        <span>複製</span>
        <span class="bv-shortcut">Ctrl+C</span>
      </div>
      <div class="bv-menu-item" data-action="paste">
        <span class="material-icons">content_paste</span>
        <span>貼上</span>
        <span class="bv-shortcut">Ctrl+V</span>
      </div>
      <div class="bv-menu-item" data-action="duplicate">
        <span class="material-icons">control_point_duplicate</span>
        <span>複製元件</span>
        <span class="bv-shortcut">Ctrl+D</span>
      </div>
      <div class="bv-menu-separator"></div>
      <div class="bv-menu-item" data-action="bring-front">
        <span class="material-icons">flip_to_front</span>
        <span>移到最前</span>
      </div>
      <div class="bv-menu-item" data-action="send-back">
        <span class="material-icons">flip_to_back</span>
        <span>移到最後</span>
      </div>
      <div class="bv-menu-separator"></div>
      <div class="bv-menu-item" data-action="delete">
        <span class="material-icons">delete</span>
        <span>刪除</span>
        <span class="bv-shortcut">Delete</span>
      </div>
    </div>
  `;
  document.body.appendChild(editor);

  /* 編輯器核心類別 */
  class BarcodeEditor {
    constructor() {
      this.canvas = document.getElementById('canvas');
      this.elements = [];
      this.selectedElements = [];
      this.productData = extractProductData();
      this.currentProductIndex = 0;
      this.zoom = 1;
      this.guides = [];
      this.isDragging = false;
      this.isResizing = false;
      this.dragStartPoint = { x: 0, y: 0 };
      this.elementStartPosition = { x: 0, y: 0 };
      this.resizeHandle = null;
      this.isTextEditing = false;
      
      this.init();
    }
    
    init() {
      this.setupCanvas();
      this.setupEventListeners();
      this.setupKeyboardShortcuts();
      this.loadProductData();
      this.createNewProject();
      this.updateLayersList();
    }
    
    setupCanvas() {
      // 設定畫布尺寸
      this.setCanvasSize(currentLabelWidth, currentLabelHeight);
      
      // 顯示邊界
      this.updateMarginGuide();
      
      // 顯示網格
      if (showGrid) {
        document.getElementById('grid').classList.add('show');
        document.getElementById('btn-grid').classList.add('active');
      }
      
      if (snapToGrid) {
        document.getElementById('btn-snap').classList.add('active');
      }
    }
    
    setCanvasSize(width, height) {
      currentLabelWidth = width;
      currentLabelHeight = height;
      
      const container = document.getElementById('canvas-container');
      container.style.width = `${width}mm`;
      container.style.height = `${height}mm`;
      
      document.getElementById('label-size').textContent = `${width}×${height}mm`;
    }
    
    updateMarginGuide() {
      const guide = document.getElementById('margin-guide');
      const isBrother = currentLabelWidth === 42 || currentLabelWidth === 29;
      const leftMargin = isBrother ? 4 : 3;
      const otherMargin = 3;
      
      guide.style.top = `${otherMargin}mm`;
      guide.style.left = `${leftMargin}mm`;
      guide.style.right = `${otherMargin}mm`;
      guide.style.bottom = `${otherMargin}mm`;
    }
    
    setupEventListeners() {
      // 元件面板標籤切換
      document.querySelectorAll('.bv-panel-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          const tabName = e.target.dataset.tab;
          const panel = e.target.closest('.bv-left-panel, .bv-right-panel');
          
          panel.querySelectorAll('.bv-panel-tab').forEach(t => t.classList.remove('active'));
          panel.querySelectorAll('.bv-panel-content').forEach(c => c.style.display = 'none');
          
          e.target.classList.add('active');
          const content = panel.querySelector(`#panel-${tabName}`);
          if (content) content.style.display = 'block';
        });
      });
      
      // 元件卡片點擊
      document.querySelectorAll('.bv-element-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const elementType = e.currentTarget.dataset.element;
          this.addElement(elementType);
        });
      });
      
      // 畫布事件
      this.canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
      document.addEventListener('mousemove', this.handleMouseMove.bind(this));
      document.addEventListener('mouseup', this.handleMouseUp.bind(this));
      
      // 右鍵選單
      this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
      document.addEventListener('click', () => {
        document.getElementById('context-menu').style.display = 'none';
      });
      
      // 工具列按鈕
      document.getElementById('btn-new-project').addEventListener('click', () => this.newProject());
      document.getElementById('btn-save-project').addEventListener('click', () => this.saveProject());
      document.getElementById('btn-open-project').addEventListener('click', () => this.openProject());
      document.getElementById('btn-print').addEventListener('click', () => this.print());
      document.getElementById('btn-preview').addEventListener('click', () => this.preview());
      
      document.getElementById('btn-undo').addEventListener('click', () => this.undo());
      document.getElementById('btn-redo').addEventListener('click', () => this.redo());
      
      document.getElementById('btn-copy').addEventListener('click', () => this.copy());
      document.getElementById('btn-paste').addEventListener('click', () => this.paste());
      document.getElementById('btn-delete').addEventListener('click', () => this.deleteSelected());
      
      // 對齊按鈕
      document.getElementById('btn-align-left').addEventListener('click', () => this.alignElements('left'));
      document.getElementById('btn-align-center').addEventListener('click', () => this.alignElements('center'));
      document.getElementById('btn-align-right').addEventListener('click', () => this.alignElements('right'));
      document.getElementById('btn-align-top').addEventListener('click', () => this.alignElements('top'));
      document.getElementById('btn-align-middle').addEventListener('click', () => this.alignElements('middle'));
      document.getElementById('btn-align-bottom').addEventListener('click', () => this.alignElements('bottom'));
      
      // 顯示設定
      document.getElementById('btn-grid').addEventListener('click', () => this.toggleGrid());
      document.getElementById('btn-snap').addEventListener('click', () => this.toggleSnap());
      document.getElementById('btn-guides').addEventListener('click', () => this.toggleGuides());
      
      // 縮放控制
      document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
      document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
      
      // 右鍵選單項目
      document.querySelectorAll('.bv-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const action = e.currentTarget.dataset.action;
          this.handleContextAction(action);
        });
      });
    }
    
    setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd 組合鍵
        if (e.ctrlKey || e.metaKey) {
          switch(e.key.toLowerCase()) {
            case 's':
              e.preventDefault();
              this.saveProject();
              break;
            case 'o':
              e.preventDefault();
              this.openProject();
              break;
            case 'p':
              e.preventDefault();
              this.print();
              break;
            case 'z':
              e.preventDefault();
              this.undo();
              break;
            case 'y':
              e.preventDefault();
              this.redo();
              break;
            case 'c':
              e.preventDefault();
              this.copy();
              break;
            case 'v':
              e.preventDefault();
              this.paste();
              break;
            case 'd':
              e.preventDefault();
              this.duplicateSelected();
              break;
            case 'a':
              e.preventDefault();
              this.selectAll();
              break;
          }
        }
        
        // 單鍵
        switch(e.key) {
          case 'Delete':
          case 'Backspace':
            if (!this.isTextEditing) {
              e.preventDefault();
              this.deleteSelected();
            }
            break;
          case 'Escape':
            this.deselectAll();
            break;
        }
        
        // 方向鍵微調
        if (this.selectedElements.length > 0 && !this.isTextEditing) {
          const moveAmount = e.shiftKey ? 10 : 1;
          switch(e.key) {
            case 'ArrowLeft':
              e.preventDefault();
              this.moveSelected(-moveAmount, 0);
              break;
            case 'ArrowRight':
              e.preventDefault();
              this.moveSelected(moveAmount, 0);
              break;
            case 'ArrowUp':
              e.preventDefault();
              this.moveSelected(0, -moveAmount);
              break;
            case 'ArrowDown':
              e.preventDefault();
              this.moveSelected(0, moveAmount);
              break;
          }
        }
      });
    }
    
    loadProductData() {
      const container = document.getElementById('data-fields-container');
      container.innerHTML = '';
      
      const product = this.productData[this.currentProductIndex];
      if (!product) return;
      
      // 顯示產品選擇器
      const selector = document.createElement('div');
      selector.className = 'bv-property-item';
      selector.innerHTML = `
        <label class="bv-property-label">選擇產品</label>
        <select class="bv-property-input" id="product-selector">
          ${this.productData.map((p, i) => 
            `<option value="${i}" ${i === this.currentProductIndex ? 'selected' : ''}>
              產品 ${i + 1} - ${p.name || '未命名'}
            </option>`
          ).join('')}
        </select>
      `;
      container.appendChild(selector);
      
      document.getElementById('product-selector').addEventListener('change', (e) => {
        this.currentProductIndex = parseInt(e.target.value);
        this.loadProductData();
      });
      
      // 分隔線
      const separator = document.createElement('div');
      separator.style.height = '1px';
      separator.style.background = '#e5e5e7';
      separator.style.margin = '16px 0';
      container.appendChild(separator);
      
      // 顯示資料欄位
      const fields = [
        { key: 'name', label: '商品名稱', value: product.name },
        { key: 'spec', label: '規格', value: product.spec },
        { key: 'sku', label: 'SKU/貨號', value: product.sku },
        { key: 'price', label: '售價', value: product.price },
        { key: 'specialPrice', label: '特價', value: product.specialPrice },
        { key: 'barcode', label: '條碼號碼', value: product.barcode }
      ];
      
      fields.forEach(field => {
        if (field.value) {
          const fieldEl = document.createElement('div');
          fieldEl.className = 'bv-data-field';
          fieldEl.draggable = true;
          fieldEl.dataset.field = field.key;
          fieldEl.innerHTML = `
            <div class="bv-data-field-label">${field.label}</div>
            <div class="bv-data-field-value">${field.value}</div>
          `;
          
          fieldEl.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('field', field.key);
            e.dataTransfer.effectAllowed = 'copy';
          });
          
          container.appendChild(fieldEl);
        }
      });
      
      // 條碼圖片
      if (product.barcodeImage) {
        const barcodeField = document.createElement('div');
        barcodeField.className = 'bv-data-field';
        barcodeField.draggable = true;
        barcodeField.dataset.field = 'barcodeImage';
        barcodeField.innerHTML = `
          <div class="bv-data-field-label">條碼圖片</div>
          <div class="bv-data-field-value">[條碼圖片]</div>
        `;
        
        barcodeField.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('field', 'barcodeImage');
          e.dataTransfer.effectAllowed = 'copy';
        });
        
        container.appendChild(barcodeField);
      }
    }
    
    createNewProject() {
      // 清空畫布
      this.elements = [];
      this.selectedElements = [];
      this.canvas.innerHTML = `
        <div class="bv-grid" id="grid" class="${showGrid ? 'show' : ''}"></div>
        <div class="bv-margin-guide" id="margin-guide"></div>
      `;
      
      // 設定預設標籤尺寸
      const sizeDialog = this.createSizeDialog();
      document.body.appendChild(sizeDialog);
    }
    
    createSizeDialog() {
      const dialog = document.createElement('div');
      dialog.className = 'bv-dialog-overlay';
      dialog.innerHTML = `
        <div class="bv-dialog">
          <div class="bv-dialog-header">
            <h3 class="bv-dialog-title">標籤尺寸設定</h3>
          </div>
          <div class="bv-dialog-body">
            <div class="bv-property-group">
              <div class="bv-property-item">
                <label class="bv-property-label">預設尺寸</label>
                <select class="bv-property-input" id="preset-size">
                  <option value="custom">自訂尺寸</option>
                  <option value="40x30" selected>標準 40×30mm</option>
                  <option value="60x30">標準 60×30mm</option>
                  <option value="42x29">Brother 大標籤 42×29mm</option>
                  <option value="29x20">Brother 小標籤 29×20mm</option>
                </select>
              </div>
              
              <div class="bv-property-row">
                <div class="bv-property-item">
                  <label class="bv-property-label">寬度 (mm)</label>
                  <input type="number" class="bv-property-input" id="label-width" value="40" min="10" max="100">
                </div>
                <div class="bv-property-item">
                  <label class="bv-property-label">高度 (mm)</label>
                  <input type="number" class="bv-property-input" id="label-height" value="30" min="10" max="100">
                </div>
              </div>
            </div>
          </div>
          <div class="bv-dialog-footer">
            <button class="bv-button primary" id="confirm-size">確定</button>
          </div>
        </div>
      `;
      
      // 事件處理
      const presetSelect = dialog.querySelector('#preset-size');
      const widthInput = dialog.querySelector('#label-width');
      const heightInput = dialog.querySelector('#label-height');
      
      presetSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        if (value !== 'custom') {
          const [width, height] = value.split('x').map(v => parseInt(v));
          widthInput.value = width;
          heightInput.value = height;
        }
      });
      
      dialog.querySelector('#confirm-size').addEventListener('click', () => {
        const width = parseInt(widthInput.value);
        const height = parseInt(heightInput.value);
        this.setCanvasSize(width, height);
        this.updateMarginGuide();
        dialog.remove();
      });
      
      return dialog;
    }
    
    addElement(type, data = {}) {
      let element;
      
      switch(type) {
        case 'text':
          element = this.createElement(ELEMENT_TYPES.TEXT, {
            text: data.text || '雙擊編輯文字',
            fontSize: 14,
            fontFamily: '"Noto Sans TC", sans-serif',
            fontWeight: 400,
            color: '#000000',
            textAlign: 'left',
            lineHeight: 1.4,
            ...data
          });
          break;
          
        case 'barcode':
          element = this.createElement(ELEMENT_TYPES.BARCODE, {
            width: 100,
            height: 50,
            ...data
          });
          break;
          
        case 'image':
          element = this.createElement(ELEMENT_TYPES.IMAGE, {
            width: 80,
            height: 80,
            ...data
          });
          break;
          
        case 'rectangle':
          element = this.createElement(ELEMENT_TYPES.SHAPE, {
            shapeType: 'rectangle',
            width: 100,
            height: 60,
            backgroundColor: '#f0f0f0',
            borderColor: '#000000',
            borderWidth: 1,
            ...data
          });
          break;
          
        case 'circle':
          element = this.createElement(ELEMENT_TYPES.SHAPE, {
            shapeType: 'circle',
            width: 60,
            height: 60,
            backgroundColor: '#f0f0f0',
            borderColor: '#000000',
            borderWidth: 1,
            ...data
          });
          break;
          
        case 'line':
          element = this.createElement(ELEMENT_TYPES.LINE, {
            width: 100,
            height: 1,
            color: '#000000',
            ...data
          });
          break;
      }
      
      if (element) {
        // 設定初始位置（畫布中央）
        const canvasRect = this.canvas.getBoundingClientRect();
        element.data.x = data.x || (canvasRect.width / 2 - element.data.width / 2);
        element.data.y = data.y || (canvasRect.height / 2 - element.data.height / 2);
        
        this.elements.push(element);
        this.renderElement(element);
        this.selectElement(element);
        this.updateLayersList();
        this.saveToHistory();
      }
    }
    
    createElement(type, data) {
      const id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id,
        type,
        data: {
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          visible: true,
          locked: false,
          opacity: 1,
          ...data
        }
      };
    }
    
    renderElement(element) {
      const el = document.createElement('div');
      el.className = 'bv-element';
      el.id = element.id;
      el.style.left = `${element.data.x}px`;
      el.style.top = `${element.data.y}px`;
      el.style.width = `${element.data.width}px`;
      el.style.height = `${element.data.height}px`;
      el.style.opacity = element.data.opacity;
      el.style.display = element.data.visible ? 'block' : 'none';
      
      // 根據類型渲染內容
      switch(element.type) {
        case ELEMENT_TYPES.TEXT:
          el.className += ' bv-text-element';
          el.style.fontSize = `${element.data.fontSize}px`;
          el.style.fontFamily = element.data.fontFamily;
          el.style.fontWeight = element.data.fontWeight;
          el.style.color = element.data.color;
          el.style.textAlign = element.data.textAlign;
          el.style.lineHeight = element.data.lineHeight;
          el.textContent = element.data.text;
          el.contentEditable = false;
          
          // 雙擊編輯
          el.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.editText(element, el);
          });
          break;
          
        case ELEMENT_TYPES.BARCODE:
          el.className += ' bv-barcode-element';
          if (element.data.barcodeImage) {
            el.innerHTML = `<img src="${element.data.barcodeImage}" alt="barcode">`;
          } else {
            // 從當前產品取得條碼圖片
            const product = this.productData[this.currentProductIndex];
            if (product && product.barcodeImage) {
              element.data.barcodeImage = product.barcodeImage;
              el.innerHTML = `<img src="${product.barcodeImage}" alt="barcode">`;
            } else {
              el.innerHTML = '<div style="background:#f0f0f0;height:100%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#999;">條碼預覽</div>';
            }
          }
          break;
          
        case ELEMENT_TYPES.IMAGE:
          el.className += ' bv-image-element';
          if (element.data.src) {
            el.innerHTML = `<img src="${element.data.src}" alt="">`;
          } else {
            el.innerHTML = '<div style="background:#f0f0f0;height:100%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#999;">點擊上傳圖片</div>';
            el.addEventListener('click', (e) => {
              if (this.selectedElements.includes(element)) {
                this.uploadImage(element, el);
              }
            });
          }
          break;
          
        case ELEMENT_TYPES.SHAPE:
          el.className += ' bv-shape-element ' + element.data.shapeType;
          el.style.backgroundColor = element.data.backgroundColor;
          el.style.border = `${element.data.borderWidth}px solid ${element.data.borderColor}`;
          break;
          
        case ELEMENT_TYPES.LINE:
          el.className += ' bv-line-element';
          el.style.backgroundColor = element.data.color;
          el.style.height = `${element.data.height}px`;
          break;
      }
      
      // 添加調整手柄
      const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
      handles.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `bv-resize-handle ${pos}`;
        handle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          this.startResize(element, pos, e);
        });
        el.appendChild(handle);
      });
      
      // 添加到畫布
      this.canvas.appendChild(el);
      
      // 綁定拖曳事件
      el.addEventListener('mousedown', (e) => {
        if (!element.data.locked && !e.target.classList.contains('bv-resize-handle')) {
          this.startDrag(element, e);
        }
      });
      
      // 處理拖放資料欄位
      el.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        const field = e.dataTransfer.getData('field');
        if (field && element.type === ELEMENT_TYPES.TEXT) {
          const product = this.productData[this.currentProductIndex];
          if (product[field]) {
            element.data.text = product[field];
            el.textContent = product[field];
            this.saveToHistory();
          }
        }
      });
    }
    
    editText(element, el) {
      if (this.isTextEditing) return;
      
      this.isTextEditing = true;
      el.contentEditable = true;
      el.classList.add('editing');
      el.focus();
      
      // 選取全部文字
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      // 監聽編輯完成
      const finishEdit = () => {
        el.contentEditable = false;
        el.classList.remove('editing');
        element.data.text = el.textContent;
        this.isTextEditing = false;
        this.saveToHistory();
      };
      
      el.addEventListener('blur', finishEdit, { once: true });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          el.blur();
        }
      });
    }
    
    uploadImage(element, el) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            element.data.src = event.target.result;
            el.innerHTML = `<img src="${event.target.result}" alt="">`;
            this.saveToHistory();
          };
          reader.readAsDataURL(file);
        }
      });
      
      input.click();
    }
    
    startDrag(element, e) {
      if (e.button !== 0) return; // 只響應左鍵
      
      this.isDragging = true;
      this.dragStartPoint = { x: e.clientX, y: e.clientY };
      this.elementStartPosition = { x: element.data.x, y: element.data.y };
      
      // 如果元素未被選中，選中它
      if (!this.selectedElements.includes(element)) {
        if (!e.ctrlKey && !e.metaKey) {
          this.deselectAll();
        }
        this.selectElement(element);
      }
      
      document.body.style.cursor = 'grabbing';
      e.preventDefault();
    }
    
    startResize(element, handle, e) {
      this.isResizing = true;
      this.resizeHandle = handle;
      this.dragStartPoint = { x: e.clientX, y: e.clientY };
      this.elementStartPosition = {
        x: element.data.x,
        y: element.data.y,
        width: element.data.width,
        height: element.data.height
      };
      
      e.preventDefault();
    }
    
    handleCanvasMouseDown(e) {
      // 如果點擊的是畫布背景，取消選擇
      if (e.target === this.canvas || e.target.classList.contains('bv-grid')) {
        this.deselectAll();
      }
    }
    
    handleMouseMove(e) {
      if (this.isDragging && this.selectedElements.length > 0) {
        const deltaX = e.clientX - this.dragStartPoint.x;
        const deltaY = e.clientY - this.dragStartPoint.y;
        
        this.selectedElements.forEach(element => {
          let newX = this.elementStartPosition.x + deltaX;
          let newY = this.elementStartPosition.y + deltaY;
          
          // 貼齊網格
          if (snapToGrid) {
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
          }
          
          // 限制在邊界內
          const margins = this.getMargins();
          const maxX = this.canvas.offsetWidth - element.data.width - margins.right;
          const maxY = this.canvas.offsetHeight - element.data.height - margins.bottom;
          
          newX = Math.max(margins.left, Math.min(newX, maxX));
          newY = Math.max(margins.top, Math.min(newY, maxY));
          
          element.data.x = newX;
          element.data.y = newY;
          
          const el = document.getElementById(element.id);
          if (el) {
            el.style.left = `${newX}px`;
            el.style.top = `${newY}px`;
          }
        });
        
        this.updatePositionInfo();
        this.showAlignmentGuides();
      }
      
      if (this.isResizing && this.selectedElements.length > 0) {
        const element = this.selectedElements[0];
        const deltaX = e.clientX - this.dragStartPoint.x;
        const deltaY = e.clientY - this.dragStartPoint.y;
        
        let newX = this.elementStartPosition.x;
        let newY = this.elementStartPosition.y;
        let newWidth = this.elementStartPosition.width;
        let newHeight = this.elementStartPosition.height;
        
        // 根據手柄位置調整
        if (this.resizeHandle.includes('w')) {
          newX = this.elementStartPosition.x + deltaX;
          newWidth = this.elementStartPosition.width - deltaX;
        }
        if (this.resizeHandle.includes('e')) {
          newWidth = this.elementStartPosition.width + deltaX;
        }
        if (this.resizeHandle.includes('n')) {
          newY = this.elementStartPosition.y + deltaY;
          newHeight = this.elementStartPosition.height - deltaY;
        }
        if (this.resizeHandle.includes('s')) {
          newHeight = this.elementStartPosition.height + deltaY;
        }
        
        // 限制最小尺寸
        if (newWidth < 20) {
          newWidth = 20;
          if (this.resizeHandle.includes('w')) {
            newX = this.elementStartPosition.x + this.elementStartPosition.width - 20;
          }
        }
        if (newHeight < 20) {
          newHeight = 20;
          if (this.resizeHandle.includes('n')) {
            newY = this.elementStartPosition.y + this.elementStartPosition.height - 20;
          }
        }
        
        // 貼齊網格
        if (snapToGrid) {
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
          newWidth = Math.round(newWidth / gridSize) * gridSize;
          newHeight = Math.round(newHeight / gridSize) * gridSize;
        }
        
        element.data.x = newX;
        element.data.y = newY;
        element.data.width = newWidth;
        element.data.height = newHeight;
        
        const el = document.getElementById(element.id);
        if (el) {
          el.style.left = `${newX}px`;
          el.style.top = `${newY}px`;
          el.style.width = `${newWidth}px`;
          el.style.height = `${newHeight}px`;
        }
        
        this.updatePositionInfo();
      }
    }
    
    handleMouseUp(e) {
      if (this.isDragging || this.isResizing) {
        this.saveToHistory();
      }
      
      this.isDragging = false;
      this.isResizing = false;
      this.resizeHandle = null;
      document.body.style.cursor = '';
      this.hideAlignmentGuides();
    }
    
    handleContextMenu(e) {
      e.preventDefault();
      
      const menu = document.getElementById('context-menu');
      menu.style.display = 'block';
      menu.style.left = `${e.clientX}px`;
      menu.style.top = `${e.clientY}px`;
      
      // 檢查是否點擊在元素上
      const element = e.target.closest('.bv-element');
      if (element) {
        const elementData = this.elements.find(el => el.id === element.id);
        if (elementData && !this.selectedElements.includes(elementData)) {
          this.deselectAll();
          this.selectElement(elementData);
        }
      }
    }
    
    handleContextAction(action) {
      switch(action) {
        case 'copy':
          this.copy();
          break;
        case 'paste':
          this.paste();
          break;
        case 'duplicate':
          this.duplicateSelected();
          break;
        case 'bring-front':
          this.bringToFront();
          break;
        case 'send-back':
          this.sendToBack();
          break;
        case 'delete':
          this.deleteSelected();
          break;
      }
    }
    
    selectElement(element, addToSelection = false) {
      if (!addToSelection) {
        this.deselectAll();
      }
      
      if (!this.selectedElements.includes(element)) {
        this.selectedElements.push(element);
        const el = document.getElementById(element.id);
        if (el) {
          el.classList.add('selected');
        }
      }
      
      this.updatePropertiesPanel();
      this.updateSelectionInfo();
      this.updateLayersList();
    }
    
    deselectAll() {
      this.selectedElements.forEach(element => {
        const el = document.getElementById(element.id);
        if (el) {
          el.classList.remove('selected');
        }
      });
      this.selectedElements = [];
      this.updatePropertiesPanel();
      this.updateSelectionInfo();
      this.updateLayersList();
    }
    
    selectAll() {
      this.deselectAll();
      this.elements.forEach(element => {
        this.selectElement(element, true);
      });
    }
    
    updatePropertiesPanel() {
      const container = document.getElementById('properties-container');
      container.innerHTML = '';
      
      if (this.selectedElements.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">選擇元素以檢視屬性</div>';
        return;
      }
      
      if (this.selectedElements.length > 1) {
        container.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">已選擇多個元素</div>';
        return;
      }
      
      const element = this.selectedElements[0];
      
      // 基本屬性
      const basicGroup = document.createElement('div');
      basicGroup.className = 'bv-property-group';
      basicGroup.innerHTML = `
        <div class="bv-property-title">
          <span class="material-icons">tune</span>
          基本屬性
        </div>
      `;
      
      // 位置和尺寸
      const positionRow = document.createElement('div');
      positionRow.className = 'bv-property-row';
      positionRow.innerHTML = `
        <div class="bv-property-item">
          <label class="bv-property-label">X</label>
          <input type="number" class="bv-property-input" id="prop-x" value="${Math.round(element.data.x)}">
        </div>
        <div class="bv-property-item">
          <label class="bv-property-label">Y</label>
          <input type="number" class="bv-property-input" id="prop-y" value="${Math.round(element.data.y)}">
        </div>
      `;
      basicGroup.appendChild(positionRow);
      
      const sizeRow = document.createElement('div');
      sizeRow.className = 'bv-property-row';
      sizeRow.innerHTML = `
        <div class="bv-property-item">
          <label class="bv-property-label">寬度</label>
          <input type="number" class="bv-property-input" id="prop-width" value="${Math.round(element.data.width)}">
        </div>
        <div class="bv-property-item">
          <label class="bv-property-label">高度</label>
          <input type="number" class="bv-property-input" id="prop-height" value="${Math.round(element.data.height)}">
        </div>
      `;
      basicGroup.appendChild(sizeRow);
      
      // 透明度
      const opacityItem = document.createElement('div');
      opacityItem.className = 'bv-property-item';
      opacityItem.innerHTML = `
        <label class="bv-property-label">透明度</label>
        <input type="range" class="bv-slider" id="prop-opacity" min="0" max="100" value="${element.data.opacity * 100}">
        <span class="bv-slider-value">${Math.round(element.data.opacity * 100)}%</span>
      `;
      basicGroup.appendChild(opacityItem);
      
      container.appendChild(basicGroup);
      
      // 根據元素類型添加特定屬性
      if (element.type === ELEMENT_TYPES.TEXT) {
        const textGroup = document.createElement('div');
        textGroup.className = 'bv-property-group';
        textGroup.innerHTML = `
          <div class="bv-property-title">
            <span class="material-icons">text_fields</span>
            文字屬性
          </div>
        `;
        
        // 字體
        const fontItem = document.createElement('div');
        fontItem.className = 'bv-property-item';
        fontItem.innerHTML = `
          <label class="bv-property-label">字體</label>
          <select class="bv-property-input" id="prop-font-family">
            ${fontFamilies.map(font => 
              `<option value="${font.value}" ${element.data.fontFamily === font.value ? 'selected' : ''}>${font.name}</option>`
            ).join('')}
          </select>
        `;
        textGroup.appendChild(fontItem);
        
        // 字體大小和粗細
        const fontRow = document.createElement('div');
        fontRow.className = 'bv-property-row';
        fontRow.innerHTML = `
          <div class="bv-property-item">
            <label class="bv-property-label">大小</label>
            <input type="number" class="bv-property-input" id="prop-font-size" value="${element.data.fontSize}" min="8" max="72">
          </div>
          <div class="bv-property-item">
            <label class="bv-property-label">粗細</label>
            <select class="bv-property-input" id="prop-font-weight">
              <option value="400" ${element.data.fontWeight == 400 ? 'selected' : ''}>正常</option>
              <option value="500" ${element.data.fontWeight == 500 ? 'selected' : ''}>中等</option>
              <option value="700" ${element.data.fontWeight == 700 ? 'selected' : ''}>粗體</option>
              <option value="900" ${element.data.fontWeight == 900 ? 'selected' : ''}>特粗</option>
            </select>
          </div>
        `;
        textGroup.appendChild(fontRow);
        
        // 顏色
        const colorItem = document.createElement('div');
        colorItem.className = 'bv-property-item';
        colorItem.innerHTML = `
          <label class="bv-property-label">顏色</label>
          <div class="bv-color-picker">
            <div class="bv-color-preview" id="text-color-preview" style="background:${element.data.color}"></div>
            <input type="text" class="bv-property-input bv-color-input" id="prop-text-color" value="${element.data.color}">
          </div>
        `;
        textGroup.appendChild(colorItem);
        
        // 對齊
        const alignItem = document.createElement('div');
        alignItem.className = 'bv-property-item';
        alignItem.innerHTML = `
          <label class="bv-property-label">對齊</label>
          <select class="bv-property-input" id="prop-text-align">
            <option value="left" ${element.data.textAlign === 'left' ? 'selected' : ''}>靠左</option>
            <option value="center" ${element.data.textAlign === 'center' ? 'selected' : ''}>置中</option>
            <option value="right" ${element.data.textAlign === 'right' ? 'selected' : ''}>靠右</option>
          </select>
        `;
        textGroup.appendChild(alignItem);
        
        // 行高
        const lineHeightItem = document.createElement('div');
        lineHeightItem.className = 'bv-property-item';
        lineHeightItem.innerHTML = `
          <label class="bv-property-label">行高</label>
          <input type="number" class="bv-property-input" id="prop-line-height" value="${element.data.lineHeight}" min="0.5" max="3" step="0.1">
        `;
        textGroup.appendChild(lineHeightItem);
        
        container.appendChild(textGroup);
      }
      
      if (element.type === ELEMENT_TYPES.SHAPE) {
        const shapeGroup = document.createElement('div');
        shapeGroup.className = 'bv-property-group';
        shapeGroup.innerHTML = `
          <div class="bv-property-title">
            <span class="material-icons">category</span>
            形狀屬性
          </div>
        `;
        
        // 背景色
        const bgColorItem = document.createElement('div');
        bgColorItem.className = 'bv-property-item';
        bgColorItem.innerHTML = `
          <label class="bv-property-label">背景色</label>
          <div class="bv-color-picker">
            <div class="bv-color-preview" id="bg-color-preview" style="background:${element.data.backgroundColor}"></div>
            <input type="text" class="bv-property-input bv-color-input" id="prop-bg-color" value="${element.data.backgroundColor}">
          </div>
        `;
        shapeGroup.appendChild(bgColorItem);
        
        // 邊框
        const borderRow = document.createElement('div');
        borderRow.className = 'bv-property-row';
        borderRow.innerHTML = `
          <div class="bv-property-item">
            <label class="bv-property-label">邊框寬度</label>
            <input type="number" class="bv-property-input" id="prop-border-width" value="${element.data.borderWidth}" min="0" max="10">
          </div>
          <div class="bv-property-item">
            <label class="bv-property-label">邊框色</label>
            <div class="bv-color-picker">
              <div class="bv-color-preview" id="border-color-preview" style="background:${element.data.borderColor}"></div>
              <input type="text" class="bv-property-input bv-color-input" id="prop-border-color" value="${element.data.borderColor}">
            </div>
          </div>
        `;
        shapeGroup.appendChild(borderRow);
        
        container.appendChild(shapeGroup);
      }
      
      if (element.type === ELEMENT_TYPES.LINE) {
        const lineGroup = document.createElement('div');
        lineGroup.className = 'bv-property-group';
        lineGroup.innerHTML = `
          <div class="bv-property-title">
            <span class="material-icons">horizontal_rule</span>
            線條屬性
          </div>
        `;
        
        // 顏色
        const colorItem = document.createElement('div');
        colorItem.className = 'bv-property-item';
        colorItem.innerHTML = `
          <label class="bv-property-label">顏色</label>
          <div class="bv-color-picker">
            <div class="bv-color-preview" id="line-color-preview" style="background:${element.data.color}"></div>
            <input type="text" class="bv-property-input bv-color-input" id="prop-line-color" value="${element.data.color}">
          </div>
        `;
        lineGroup.appendChild(colorItem);
        
        container.appendChild(lineGroup);
      }
      
      // 綁定屬性變更事件
      this.bindPropertyEvents(element);
    }
    
    bindPropertyEvents(element) {
      // 基本屬性
      const propX = document.getElementById('prop-x');
      const propY = document.getElementById('prop-y');
      const propWidth = document.getElementById('prop-width');
      const propHeight = document.getElementById('prop-height');
      const propOpacity = document.getElementById('prop-opacity');
      
      if (propX) {
        propX.addEventListener('input', (e) => {
          element.data.x = parseInt(e.target.value) || 0;
          this.updateElement(element);
        });
      }
      
      if (propY) {
        propY.addEventListener('input', (e) => {
          element.data.y = parseInt(e.target.value) || 0;
          this.updateElement(element);
        });
      }
      
      if (propWidth) {
        propWidth.addEventListener('input', (e) => {
          element.data.width = Math.max(20, parseInt(e.target.value) || 20);
          this.updateElement(element);
        });
      }
      
      if (propHeight) {
        propHeight.addEventListener('input', (e) => {
          element.data.height = Math.max(20, parseInt(e.target.value) || 20);
          this.updateElement(element);
        });
      }
      
      if (propOpacity) {
        propOpacity.addEventListener('input', (e) => {
          element.data.opacity = parseInt(e.target.value) / 100;
          e.target.nextElementSibling.textContent = `${e.target.value}%`;
          this.updateElement(element);
        });
      }
      
      // 文字屬性
      if (element.type === ELEMENT_TYPES.TEXT) {
        const propFontFamily = document.getElementById('prop-font-family');
        const propFontSize = document.getElementById('prop-font-size');
        const propFontWeight = document.getElementById('prop-font-weight');
        const propTextColor = document.getElementById('prop-text-color');
        const propTextAlign = document.getElementById('prop-text-align');
        const propLineHeight = document.getElementById('prop-line-height');
        
        if (propFontFamily) {
          propFontFamily.addEventListener('change', (e) => {
            element.data.fontFamily = e.target.value;
            this.updateElement(element);
          });
        }
        
        if (propFontSize) {
          propFontSize.addEventListener('input', (e) => {
            element.data.fontSize = parseInt(e.target.value) || 14;
            this.updateElement(element);
          });
        }
        
        if (propFontWeight) {
          propFontWeight.addEventListener('change', (e) => {
            element.data.fontWeight = parseInt(e.target.value);
            this.updateElement(element);
          });
        }
        
        if (propTextColor) {
          propTextColor.addEventListener('input', (e) => {
            element.data.color = e.target.value;
            document.getElementById('text-color-preview').style.background = e.target.value;
            this.updateElement(element);
          });
        }
        
        if (propTextAlign) {
          propTextAlign.addEventListener('change', (e) => {
            element.data.textAlign = e.target.value;
            this.updateElement(element);
          });
        }
        
        if (propLineHeight) {
          propLineHeight.addEventListener('input', (e) => {
            element.data.lineHeight = parseFloat(e.target.value) || 1.4;
            this.updateElement(element);
          });
        }
      }
      
      // 形狀屬性
      if (element.type === ELEMENT_TYPES.SHAPE) {
        const propBgColor = document.getElementById('prop-bg-color');
        const propBorderWidth = document.getElementById('prop-border-width');
        const propBorderColor = document.getElementById('prop-border-color');
        
        if (propBgColor) {
          propBgColor.addEventListener('input', (e) => {
            element.data.backgroundColor = e.target.value;
            document.getElementById('bg-color-preview').style.background = e.target.value;
            this.updateElement(element);
          });
        }
        
        if (propBorderWidth) {
          propBorderWidth.addEventListener('input', (e) => {
            element.data.borderWidth = parseInt(e.target.value) || 0;
            this.updateElement(element);
          });
        }
        
        if (propBorderColor) {
          propBorderColor.addEventListener('input', (e) => {
            element.data.borderColor = e.target.value;
            document.getElementById('border-color-preview').style.background = e.target.value;
            this.updateElement(element);
          });
        }
      }
      
      // 線條屬性
      if (element.type === ELEMENT_TYPES.LINE) {
        const propLineColor = document.getElementById('prop-line-color');
        
        if (propLineColor) {
          propLineColor.addEventListener('input', (e) => {
            element.data.color = e.target.value;
            document.getElementById('line-color-preview').style.background = e.target.value;
            this.updateElement(element);
          });
        }
      }
    }
    
    updateElement(element) {
      const el = document.getElementById(element.id);
      if (!el) return;
      
      // 更新位置和尺寸
      el.style.left = `${element.data.x}px`;
      el.style.top = `${element.data.y}px`;
      el.style.width = `${element.data.width}px`;
      el.style.height = `${element.data.height}px`;
      el.style.opacity = element.data.opacity;
      
      // 根據類型更新特定屬性
      if (element.type === ELEMENT_TYPES.TEXT) {
        el.style.fontSize = `${element.data.fontSize}px`;
        el.style.fontFamily = element.data.fontFamily;
        el.style.fontWeight = element.data.fontWeight;
        el.style.color = element.data.color;
        el.style.textAlign = element.data.textAlign;
        el.style.lineHeight = element.data.lineHeight;
      } else if (element.type === ELEMENT_TYPES.SHAPE) {
        el.style.backgroundColor = element.data.backgroundColor;
        el.style.border = `${element.data.borderWidth}px solid ${element.data.borderColor}`;
      } else if (element.type === ELEMENT_TYPES.LINE) {
        el.style.backgroundColor = element.data.color;
      }
      
      this.saveToHistory();
    }
    
    updateLayersList() {
      const container = document.getElementById('layers-list');
      container.innerHTML = '';
      
      // 反向顯示（最上層的在最前）
      const reversedElements = [...this.elements].reverse();
      
      reversedElements.forEach(element => {
        const layer = document.createElement('div');
        layer.className = 'bv-layer-item';
        if (this.selectedElements.includes(element)) {
          layer.classList.add('selected');
        }
        
        // 圖標
        let icon = 'layers';
        if (element.type === ELEMENT_TYPES.TEXT) icon = 'text_fields';
        else if (element.type === ELEMENT_TYPES.BARCODE) icon = 'qr_code';
        else if (element.type === ELEMENT_TYPES.IMAGE) icon = 'image';
        else if (element.type === ELEMENT_TYPES.SHAPE) icon = 'category';
        else if (element.type === ELEMENT_TYPES.LINE) icon = 'horizontal_rule';
        
        // 名稱
        let name = '未命名元素';
        if (element.type === ELEMENT_TYPES.TEXT) name = element.data.text.substring(0, 20) || '文字';
        else if (element.type === ELEMENT_TYPES.BARCODE) name = '條碼';
        else if (element.type === ELEMENT_TYPES.IMAGE) name = '圖片';
        else if (element.type === ELEMENT_TYPES.SHAPE) name = element.data.shapeType === 'circle' ? '圓形' : '矩形';
        else if (element.type === ELEMENT_TYPES.LINE) name = '線條';
        
        layer.innerHTML = `
          <span class="material-icons bv-layer-icon">${icon}</span>
          <span class="bv-layer-name">${name}</span>
          <span class="material-icons bv-layer-visibility" data-id="${element.id}">
            ${element.data.visible ? 'visibility' : 'visibility_off'}
          </span>
        `;
        
        // 點擊選擇
        layer.addEventListener('click', (e) => {
          if (!e.target.classList.contains('bv-layer-visibility')) {
            if (e.ctrlKey || e.metaKey) {
              this.selectElement(element, true);
            } else {
              this.selectElement(element);
            }
          }
        });
        
        // 切換可見性
        const visibilityBtn = layer.querySelector('.bv-layer-visibility');
        visibilityBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          element.data.visible = !element.data.visible;
          visibilityBtn.textContent = element.data.visible ? 'visibility' : 'visibility_off';
          
          const el = document.getElementById(element.id);
          if (el) {
            el.style.display = element.data.visible ? 'block' : 'none';
          }
          
          this.saveToHistory();
        });
        
        container.appendChild(layer);
      });
    }
    
    updateSelectionInfo() {
      const info = document.getElementById('selection-info');
      if (this.selectedElements.length === 0) {
        info.textContent = '無';
      } else if (this.selectedElements.length === 1) {
        const element = this.selectedElements[0];
        let type = '元素';
        if (element.type === ELEMENT_TYPES.TEXT) type = '文字';
        else if (element.type === ELEMENT_TYPES.BARCODE) type = '條碼';
        else if (element.type === ELEMENT_TYPES.IMAGE) type = '圖片';
        else if (element.type === ELEMENT_TYPES.SHAPE) type = '形狀';
        else if (element.type === ELEMENT_TYPES.LINE) type = '線條';
        info.textContent = type;
      } else {
        info.textContent = `${this.selectedElements.length} 個元素`;
      }
    }
    
    updatePositionInfo() {
      const info = document.getElementById('position-info');
      if (this.selectedElements.length === 1) {
        const element = this.selectedElements[0];
        info.textContent = `X: ${Math.round(element.data.x)}, Y: ${Math.round(element.data.y)}`;
      } else {
        info.textContent = 'X: -, Y: -';
      }
    }
    
    getMargins() {
      const isBrother = currentLabelWidth === 42 || currentLabelWidth === 29;
      return {
        left: (isBrother ? 4 : 3) * 3.78, // mm to px (approximate)
        right: 3 * 3.78,
        top: 3 * 3.78,
        bottom: 3 * 3.78
      };
    }
    
    showAlignmentGuides() {
      // TODO: 實作對齊參考線
    }
    
    hideAlignmentGuides() {
      // TODO: 隱藏對齊參考線
    }
    
    toggleGrid() {
      showGrid = !showGrid;
      const grid = document.getElementById('grid');
      const btn = document.getElementById('btn-grid');
      
      if (showGrid) {
        grid.classList.add('show');
        btn.classList.add('active');
      } else {
        grid.classList.remove('show');
        btn.classList.remove('active');
      }
    }
    
    toggleSnap() {
      snapToGrid = !snapToGrid;
      const btn = document.getElementById('btn-snap');
      
      if (snapToGrid) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
    
    toggleGuides() {
      // TODO: 實作參考線功能
    }
    
    zoomIn() {
      this.zoom = Math.min(this.zoom + 0.25, 4);
      this.updateZoom();
    }
    
    zoomOut() {
      this.zoom = Math.max(this.zoom - 0.25, 0.25);
      this.updateZoom();
    }
    
    updateZoom() {
      const container = document.getElementById('canvas-container');
      container.style.transform = `scale(${this.zoom})`;
      document.getElementById('zoom-value').textContent = `${Math.round(this.zoom * 100)}%`;
    }
    
    copy() {
      if (this.selectedElements.length > 0) {
        clipboard = this.selectedElements.map(element => ({
          ...element,
          data: { ...element.data }
        }));
      }
    }
    
    paste() {
      if (clipboard && clipboard.length > 0) {
        this.deselectAll();
        
        clipboard.forEach(element => {
          const newElement = {
            ...element,
            id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            data: {
              ...element.data,
              x: element.data.x + 20,
              y: element.data.y + 20
            }
          };
          
          this.elements.push(newElement);
          this.renderElement(newElement);
          this.selectElement(newElement, true);
        });
        
        this.updateLayersList();
        this.saveToHistory();
      }
    }
    
    duplicateSelected() {
      if (this.selectedElements.length > 0) {
        this.copy();
        this.paste();
      }
    }
    
    deleteSelected() {
      if (this.selectedElements.length > 0) {
        this.selectedElements.forEach(element => {
          // 從陣列中移除
          const index = this.elements.indexOf(element);
          if (index > -1) {
            this.elements.splice(index, 1);
          }
          
          // 從畫布中移除
          const el = document.getElementById(element.id);
          if (el) {
            el.remove();
          }
        });
        
        this.selectedElements = [];
        this.updateLayersList();
        this.updatePropertiesPanel();
        this.updateSelectionInfo();
        this.saveToHistory();
      }
    }
    
    moveSelected(deltaX, deltaY) {
      this.selectedElements.forEach(element => {
        element.data.x += deltaX;
        element.data.y += deltaY;
        
        // 限制在邊界內
        const margins = this.getMargins();
        const maxX = this.canvas.offsetWidth - element.data.width - margins.right;
        const maxY = this.canvas.offsetHeight - element.data.height - margins.bottom;
        
        element.data.x = Math.max(margins.left, Math.min(element.data.x, maxX));
        element.data.y = Math.max(margins.top, Math.min(element.data.y, maxY));
        
        const el = document.getElementById(element.id);
        if (el) {
          el.style.left = `${element.data.x}px`;
          el.style.top = `${element.data.y}px`;
        }
      });
      
      this.updatePositionInfo();
      this.updatePropertiesPanel();
      this.saveToHistory();
    }
    
    alignElements(alignment) {
      if (this.selectedElements.length < 2) return;
      
      const margins = this.getMargins();
      const canvasWidth = this.canvas.offsetWidth;
      const canvasHeight = this.canvas.offsetHeight;
      
      switch(alignment) {
        case 'left':
          const leftMost = Math.min(...this.selectedElements.map(el => el.data.x));
          this.selectedElements.forEach(el => {
            el.data.x = leftMost;
            this.updateElement(el);
          });
          break;
          
        case 'center':
          const centerX = this.selectedElements.reduce((sum, el) => 
            sum + el.data.x + el.data.width / 2, 0) / this.selectedElements.length;
          this.selectedElements.forEach(el => {
            el.data.x = centerX - el.data.width / 2;
            this.updateElement(el);
          });
          break;
          
        case 'right':
          const rightMost = Math.max(...this.selectedElements.map(el => 
            el.data.x + el.data.width));
          this.selectedElements.forEach(el => {
            el.data.x = rightMost - el.data.width;
            this.updateElement(el);
          });
          break;
          
        case 'top':
          const topMost = Math.min(...this.selectedElements.map(el => el.data.y));
          this.selectedElements.forEach(el => {
            el.data.y = topMost;
            this.updateElement(el);
          });
          break;
          
        case 'middle':
          const centerY = this.selectedElements.reduce((sum, el) => 
            sum + el.data.y + el.data.height / 2, 0) / this.selectedElements.length;
          this.selectedElements.forEach(el => {
            el.data.y = centerY - el.data.height / 2;
            this.updateElement(el);
          });
          break;
          
        case 'bottom':
          const bottomMost = Math.max(...this.selectedElements.map(el => 
            el.data.y + el.data.height));
          this.selectedElements.forEach(el => {
            el.data.y = bottomMost - el.data.height;
            this.updateElement(el);
          });
          break;
      }
    }
    
    bringToFront() {
      if (this.selectedElements.length === 0) return;
      
      this.selectedElements.forEach(element => {
        const index = this.elements.indexOf(element);
        if (index > -1) {
          this.elements.splice(index, 1);
          this.elements.push(element);
          
          const el = document.getElementById(element.id);
          if (el) {
            this.canvas.appendChild(el);
          }
        }
      });
      
      this.updateLayersList();
      this.saveToHistory();
    }
    
    sendToBack() {
      if (this.selectedElements.length === 0) return;
      
      this.selectedElements.forEach(element => {
        const index = this.elements.indexOf(element);
        if (index > -1) {
          this.elements.splice(index, 1);
          this.elements.unshift(element);
          
          const el = document.getElementById(element.id);
          if (el) {
            const grid = document.getElementById('grid');
            const marginGuide = document.getElementById('margin-guide');
            this.canvas.insertBefore(el, marginGuide.nextSibling);
          }
        }
      });
      
      this.updateLayersList();
      this.saveToHistory();
    }
    
    saveToHistory() {
      // 移除當前位置之後的歷史記錄
      history = history.slice(0, historyIndex + 1);
      
      // 添加新的歷史記錄
      const state = {
        elements: JSON.parse(JSON.stringify(this.elements)),
        timestamp: Date.now()
      };
      
      history.push(state);
      
      // 限制歷史記錄數量
      if (history.length > maxHistory) {
        history.shift();
      } else {
        historyIndex++;
      }
    }
    
    undo() {
      if (historyIndex > 0) {
        historyIndex--;
        this.restoreState(history[historyIndex]);
      }
    }
    
    redo() {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        this.restoreState(history[historyIndex]);
      }
    }
    
    restoreState(state) {
      // 清空畫布
      this.elements = [];
      this.selectedElements = [];
      this.canvas.innerHTML = `
        <div class="bv-grid" id="grid" class="${showGrid ? 'show' : ''}"></div>
        <div class="bv-margin-guide" id="margin-guide"></div>
      `;
      
      // 重新創建元素
      this.elements = JSON.parse(JSON.stringify(state.elements));
      this.elements.forEach(element => {
        this.renderElement(element);
      });
      
      this.updateLayersList();
      this.updatePropertiesPanel();
      this.updateSelectionInfo();
    }
    
    newProject() {
      if (confirm('確定要建立新專案嗎？未儲存的變更將會遺失。')) {
        this.createNewProject();
        this.saveToHistory();
      }
    }
    
    saveProject() {
      const projectData = {
        name: prompt('請輸入專案名稱：', '未命名專案') || '未命名專案',
        labelWidth: currentLabelWidth,
        labelHeight: currentLabelHeight,
        elements: this.elements,
        productIndex: this.currentProductIndex,
        createdAt: currentProject?.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      
      // 儲存到 localStorage
      const projectId = currentProject?.id || `project_${Date.now()}`;
      localStorage.setItem(`bv_label_${projectId}`, JSON.stringify(projectData));
      
      // 更新專案列表
      let projectList = JSON.parse(localStorage.getItem('bv_label_projects') || '[]');
      const existingIndex = projectList.findIndex(p => p.id === projectId);
      
      if (existingIndex > -1) {
        projectList[existingIndex] = {
          id: projectId,
          name: projectData.name,
          updatedAt: projectData.updatedAt
        };
      } else {
        projectList.push({
          id: projectId,
          name: projectData.name,
          updatedAt: projectData.updatedAt
        });
      }
      
      localStorage.setItem('bv_label_projects', JSON.stringify(projectList));
      currentProject = { id: projectId, ...projectData };
      
      // 下載為檔案
      const dataStr = JSON.stringify(projectData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectData.name.replace(/[^a-z0-9]/gi, '_')}.bvlabel`;
      link.click();
      URL.revokeObjectURL(url);
      
      alert('專案已儲存！');
    }
    
    openProject() {
      const dialog = this.createOpenDialog();
      document.body.appendChild(dialog);
    }
    
    createOpenDialog() {
      const projectList = JSON.parse(localStorage.getItem('bv_label_projects') || '[]');
      
      const dialog = document.createElement('div');
      dialog.className = 'bv-dialog-overlay';
      dialog.innerHTML = `
        <div class="bv-dialog" style="max-width:800px;">
          <div class="bv-dialog-header">
            <h3 class="bv-dialog-title">開啟專案</h3>
          </div>
          <div class="bv-dialog-body">
            <div style="margin-bottom:20px;">
              <button class="bv-button secondary" id="upload-project">
                <span class="material-icons" style="font-size:16px;margin-right:8px;">upload_file</span>
                從檔案開啟
              </button>
            </div>
            
            <div class="bv-property-title">
              <span class="material-icons">folder</span>
              最近的專案
            </div>
            
            <div class="bv-projects-grid">
              ${projectList.map(project => `
                <div class="bv-project-card" data-id="${project.id}">
                  <div class="bv-project-preview">
                    <span class="material-icons">label</span>
                  </div>
                  <div class="bv-project-name">${project.name}</div>
                  <div class="bv-project-date">${new Date(project.updatedAt).toLocaleDateString()}</div>
                  <button class="bv-project-delete" data-id="${project.id}">
                    <span class="material-icons">delete</span>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="bv-dialog-footer">
            <button class="bv-button secondary" id="cancel-open">取消</button>
          </div>
        </div>
      `;
      
      // 檔案上傳
      const uploadBtn = dialog.querySelector('#upload-project');
      uploadBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.bvlabel,.json';
        
        input.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                const projectData = JSON.parse(event.target.result);
                this.loadProject(projectData);
                dialog.remove();
              } catch (error) {
                alert('無效的專案檔案！');
              }
            };
            reader.readAsText(file);
          }
        });
        
        input.click();
      });
      
      // 開啟專案
      dialog.querySelectorAll('.bv-project-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.bv-project-delete')) {
            const projectId = card.dataset.id;
            const projectData = JSON.parse(localStorage.getItem(`bv_label_${projectId}`));
            if (projectData) {
              this.loadProject(projectData, projectId);
              dialog.remove();
            }
          }
        });
      });
      
      // 刪除專案
      dialog.querySelectorAll('.bv-project-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('確定要刪除此專案嗎？')) {
            const projectId = btn.dataset.id;
            localStorage.removeItem(`bv_label_${projectId}`);
            
            let projectList = JSON.parse(localStorage.getItem('bv_label_projects') || '[]');
            projectList = projectList.filter(p => p.id !== projectId);
            localStorage.setItem('bv_label_projects', JSON.stringify(projectList));
            
            btn.closest('.bv-project-card').remove();
          }
        });
      });
      
      // 取消
      dialog.querySelector('#cancel-open').addEventListener('click', () => {
        dialog.remove();
      });
      
      return dialog;
    }
    
    loadProject(projectData, projectId = null) {
      // 設定標籤尺寸
      this.setCanvasSize(projectData.labelWidth, projectData.labelHeight);
      this.updateMarginGuide();
      
      // 設定產品索引
      this.currentProductIndex = projectData.productIndex || 0;
      this.loadProductData();
      
      // 清空畫布
      this.elements = [];
      this.selectedElements = [];
      this.canvas.innerHTML = `
        <div class="bv-grid" id="grid" class="${showGrid ? 'show' : ''}"></div>
        <div class="bv-margin-guide" id="margin-guide"></div>
      `;
      
      // 載入元素
      this.elements = projectData.elements || [];
      this.elements.forEach(element => {
        this.renderElement(element);
      });
      
      // 更新介面
      this.updateLayersList();
      this.updatePropertiesPanel();
      this.updateSelectionInfo();
      
      // 設定當前專案
      currentProject = {
        id: projectId,
        ...projectData
      };
      
      // 重置歷史
      history = [];
      historyIndex = -1;
      this.saveToHistory();
    }
    
    preview() {
      // TODO: 實作預覽功能
      alert('預覽功能開發中...');
    }
    
    print() {
      // 準備列印資料
      const printData = this.productData.map((product, index) => {
        // 複製當前設計
        const labelElements = this.elements.map(element => ({
          ...element,
          data: { ...element.data }
        }));
        
        // 替換資料欄位
        labelElements.forEach(element => {
          if (element.type === ELEMENT_TYPES.TEXT) {
            // 檢查是否為資料欄位
            const fieldMatch = element.data.text.match(/\{\{(\w+)\}\}/);
            if (fieldMatch) {
              const field = fieldMatch[1];
              element.data.text = product[field] || element.data.text;
            }
          } else if (element.type === ELEMENT_TYPES.BARCODE) {
            element.data.barcodeImage = product.barcodeImage;
          }
        });
        
        return {
          product,
          elements: labelElements
        };
      });
      
      // 建立列印頁面
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>列印標籤</title>
          <style>
            @page {
              margin: 0;
              size: ${currentLabelWidth}mm ${currentLabelHeight}mm;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            
            .print-page {
              width: ${currentLabelWidth}mm;
              height: ${currentLabelHeight}mm;
              position: relative;
              page-break-after: always;
              overflow: hidden;
            }
            
            .print-page:last-child {
              page-break-after: auto;
            }
            
            .print-element {
              position: absolute;
            }
            
            .print-text {
              word-break: break-word;
              white-space: pre-wrap;
            }
            
            .print-shape.circle {
              border-radius: 50%;
            }
            
            @media print {
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
      `);
      
      // 渲染每個標籤
      printData.forEach((data, pageIndex) => {
        printWindow.document.write(`<div class="print-page">`);
        
        data.elements.forEach(element => {
          let elementHtml = '';
          
          switch(element.type) {
            case ELEMENT_TYPES.TEXT:
              elementHtml = `
                <div class="print-element print-text" style="
                  left: ${element.data.x}px;
                  top: ${element.data.y}px;
                  width: ${element.data.width}px;
                  height: ${element.data.height}px;
                  font-size: ${element.data.fontSize}px;
                  font-family: ${element.data.fontFamily};
                  font-weight: ${element.data.fontWeight};
                  color: ${element.data.color};
                  text-align: ${element.data.textAlign};
                  line-height: ${element.data.lineHeight};
                  opacity: ${element.data.opacity};
                ">${element.data.text}</div>
              `;
              break;
              
            case ELEMENT_TYPES.BARCODE:
              if (element.data.barcodeImage) {
                elementHtml = `
                  <div class="print-element" style="
                    left: ${element.data.x}px;
                    top: ${element.data.y}px;
                    width: ${element.data.width}px;
                    height: ${element.data.height}px;
                    opacity: ${element.data.opacity};
                  ">
                    <img src="${element.data.barcodeImage}" style="width:100%;height:100%;object-fit:contain;">
                  </div>
                `;
              }
              break;
              
            case ELEMENT_TYPES.IMAGE:
              if (element.data.src) {
                elementHtml = `
                  <div class="print-element" style="
                    left: ${element.data.x}px;
                    top: ${element.data.y}px;
                    width: ${element.data.width}px;
                    height: ${element.data.height}px;
                    opacity: ${element.data.opacity};
                  ">
                    <img src="${element.data.src}" style="width:100%;height:100%;object-fit:contain;">
                  </div>
                `;
              }
              break;
              
            case ELEMENT_TYPES.SHAPE:
              elementHtml = `
                <div class="print-element print-shape ${element.data.shapeType}" style="
                  left: ${element.data.x}px;
                  top: ${element.data.y}px;
                  width: ${element.data.width}px;
                  height: ${element.data.height}px;
                  background: ${element.data.backgroundColor};
                  border: ${element.data.borderWidth}px solid ${element.data.borderColor};
                  opacity: ${element.data.opacity};
                "></div>
              `;
              break;
              
            case ELEMENT_TYPES.LINE:
              elementHtml = `
                <div class="print-element" style="
                  left: ${element.data.x}px;
                  top: ${element.data.y}px;
                  width: ${element.data.width}px;
                  height: ${element.data.height}px;
                  background: ${element.data.color};
                  opacity: ${element.data.opacity};
                "></div>
              `;
              break;
          }
          
          if (element.data.visible) {
            printWindow.document.write(elementHtml);
          }
        });
        
        printWindow.document.write(`</div>`);
      });
      
      printWindow.document.write(`
          <div class="no-print" style="padding:20px;">
            <button onclick="window.print()" style="
              padding: 12px 24px;
              background: #0071e3;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 16px;
              cursor: pointer;
            ">開始列印</button>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
    }
  }
  
  /* 初始化編輯器 */
  const barcodeEditor = new BarcodeEditor();
  
  /* 處理畫布區域的拖放 */
  const canvasArea = document.getElementById('canvas');
  
  canvasArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  
  canvasArea.addEventListener('drop', (e) => {
    e.preventDefault();
    
    const field = e.dataTransfer.getData('field');
    if (field) {
      const rect = canvasArea.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const product = barcodeEditor.productData[barcodeEditor.currentProductIndex];
      
      if (field === 'barcodeImage') {
        // 新增條碼元素
        barcodeEditor.addElement('barcode', {
          x: x - 50,
          y: y - 25,
          width: 100,
          height: 50,
          barcodeImage: product.barcodeImage
        });
      } else if (product[field]) {
        // 新增文字元素
        barcodeEditor.addElement('text', {
          x: x - 50,
          y: y - 10,
          text: product[field],
          width: 'auto',
          height: 'auto'
        });
      }
    }
  });
  
  /* 自動儲存 */
  setInterval(() => {
    if (currentProject) {
      const projectData = {
        name: currentProject.name,
        labelWidth: currentLabelWidth,
        labelHeight: currentLabelHeight,
        elements: barcodeEditor.elements,
        productIndex: barcodeEditor.currentProductIndex,
        createdAt: currentProject.createdAt,
        updatedAt: Date.now()
      };
      
      localStorage.setItem(`bv_label_${currentProject.id}`, JSON.stringify(projectData));
    }
  }, 30000); // 每30秒自動儲存
  
  /* 防止意外關閉 */
  window.addEventListener('beforeunload', (e) => {
    if (barcodeEditor.elements.length > 0) {
      e.preventDefault();
      e.returnValue = '您有未儲存的變更，確定要離開嗎？';
    }
  });
  
  /* 擴充功能相關 */
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    // 儲存設定到 Chrome Storage
    chrome.storage.local.set({
      bv_label_editor_active: true,
      bv_label_last_used: Date.now()
    });
  }
  
  /* 顯示載入完成 */
  console.log('BV 條碼標籤編輯器已載入完成！');
})();
