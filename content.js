javascript:(function(){
  /* BV SHOP 條碼列印排版器 - Brother 橫印版本 (42×29mm) */
  
  /* 裝置偵測 */
  const userAgent = navigator.userAgent;
  const isIPad = /iPad/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) && !isIPad;
  const shouldUseMobileLayout = isMobile || (isIPad && window.innerWidth < 768);
  
  // 只在條碼列印頁面上執行
  if (!document.querySelector('.print_barcode_area')) {
    alert('請在 BV SHOP 條碼列印頁面使用此工具');
    return;
  }

  /* 載入必要的函式庫 */
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  /* 載入 html2canvas */
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js').then(() => {
    console.log('html2canvas 載入完成');
  });

  /* 載入字體 */
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap';
  document.head.appendChild(fontLink);

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

  /* 固定標籤尺寸 42×29mm */
  const LABEL_WIDTH = 42;
  const LABEL_HEIGHT = 29;

  /* 重置原本的縮放設定 */
  const resetStyle = document.createElement('style');
  resetStyle.innerHTML = `
    /* 重置 body 縮放 */
    body {
      zoom: 1 !important;
      -moz-transform: none !important;
      -webkit-transform: none !important;
      transform: none !important;
    }
    
    /* 重置 html 縮放 */
    html {
      zoom: 1 !important;
      -moz-transform: none !important;
      -webkit-transform: none !important;
      transform: none !important;
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
    }
  `;
  document.head.appendChild(resetStyle);

  /* 建立基本樣式 */
  const style = document.createElement('style');
  style.innerHTML = `
    /* 基本樣式設定 */
    body {
      background: #f8f9fa;
      margin: 0;
      padding: 20px;
    }
    
    /* 隱藏原本的列印按鈕 */
    body > button.no-print {
      display: none !important;
    }
    
    /* 標籤區域 */
    .print_barcode_area {
      margin-top: 20px;
    }
    
    /* 標籤樣式 */
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
    
    @media (hover: hover) {
      .print_sample:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }
    }
  
    /* 控制面板 */
    #barcode-control-panel {
      position: fixed;
      ${shouldUseMobileLayout ? `
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        max-height: 80vh;
        border-radius: 20px 20px 0 0;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      ` : `
        top: 20px;
        right: 20px;
        width: 400px;
        max-height: 90vh;
        border-radius: 20px;
      `}
      z-index: 99999;
      background: #ffffff;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", Arial, sans-serif;
      font-size: 14px;
      overflow: hidden;
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
    
    .panel-header {
      background: linear-gradient(135deg, #00a0e9 0%, #0068b7 100%);
      color: white;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      position: relative;
    }
    
    .panel-header h3 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
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
    
    .panel-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
      max-height: calc(90vh - 200px);
    }
    
    .panel-footer {
      background: #fafbfc;
      padding: 16px 20px;
      border-top: 1px solid #eef0f2;
      flex-shrink: 0;
    }
    
    /* 預設檔區塊 */
    .preset-section {
      background: #f8f9ff;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      border: 1px solid rgba(88, 101, 242, 0.08);
    }
    
    .preset-row {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    #preset-select {
      flex-grow: 1;
      background: white;
      border: 2px solid #e8eaed;
      border-radius: 8px;
      padding: 10px 35px 10px 12px;
      font-size: 14px;
      -webkit-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 20px;
    }
    
    /* 按鈕樣式 */
    .icon-button {
      background: white;
      border: 2px solid #e8eaed;
      border-radius: 8px;
      padding: 8px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .icon-button:hover {
      background: #f8f9ff;
      border-color: #7289DA;
    }
    
    .icon-button .material-icons {
      font-size: 20px;
      color: #5865F2;
      vertical-align: middle;
      line-height: 1;
    }
    
    .icon-button.reset-button:hover {
      background: #fff5f5;
      border-color: #f04747;
    }
    
    .icon-button.reset-button .material-icons {
      color: #f04747;
    }
    
    .bold-button {
      background: white;
      border: 2px solid #e8eaed;
      border-radius: 6px;
      padding: 4px 12px;
      font-size: 16px;
      font-weight: 700;
      color: #6c757d;
      cursor: pointer;
      transition: all 0.2s ease;
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
    }
    
    /* 區塊樣式 */
    .section {
      margin-bottom: 0;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 10px;
      cursor: pointer;
      margin-bottom: 16px;
      user-select: none;
    }
    
    .section-header h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    /* Material Icons 對齊修正 */
    .section-icon {
      font-size: 20px;
      color: #00a0e9;
      vertical-align: middle;
      line-height: 1;
      display: inline-flex;
      align-items: center;
    }
    
    .section-toggle {
      color: #6c757d;
      transition: transform 0.3s ease;
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
      transition: max-height 0.3s ease;
      margin-bottom: 20px;
    }
    
    .section-content.collapsed {
      max-height: 0;
      margin-bottom: 0;
    }
    
    /* 控制項群組 */
    .control-group {
      background: #fafbfc;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      border: 1px solid #eef0f2;
    }
    
    .control-group-title {
      font-size: 12px;
      font-weight: 700;
      color: #00a0e9;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .control-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-weight: 500;
      font-size: 14px;
    }
    
    .value-badge {
      background: linear-gradient(135deg, #00a0e9 0%, #0068b7 100%);
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      min-width: 50px;
      text-align: center;
    }
    
    /* 滑桿樣式 */
    input[type="range"] {
      width: 100%;
      height: 6px;
      background: #e8eaed;
      border-radius: 3px;
      outline: none;
      -webkit-appearance: none;
      margin: 12px 0 8px 0;
      position: relative;
    }
    
    input[type="range"]:before {
      content: '';
      position: absolute;
      height: 6px;
      border-radius: 3px;
      background: linear-gradient(90deg, #00a0e9 0%, #0068b7 100%);
      width: var(--value, 0%);
      pointer-events: none;
    }
    
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      background: white;
      border: 3px solid #00a0e9;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 160, 233, 0.3);
      position: relative;
      z-index: 1;
    }
    
    input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
      background: white;
      border: 3px solid #00a0e9;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 160, 233, 0.3);
    }
    
    /* 選擇框樣式 */
    select {
      width: 100%;
      padding: 10px 35px 10px 12px;
      border: 2px solid #e8eaed;
      border-radius: 8px;
      background: white;
      font-size: 14px;
      -webkit-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 20px;
    }
    
    /* 動作按鈕 */
    .action-button {
      width: 100%;
      background: linear-gradient(135deg, #00a0e9 0%, #0068b7 100%);
      color: white;
      border: none;
      padding: 14px 20px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
    }
    
    .action-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 160, 233, 0.3);
    }
    
    .action-button .material-icons {
      vertical-align: middle;
      line-height: 1;
      font-size: 20px;
    }
    
    /* 固定尺寸提示 */
    .size-notice {
      background: #e3f2fd;
      border: 1px solid #64b5f6;
      border-radius: 8px;
      padding: 10px 15px;
      font-size: 13px;
      color: #1565c0;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .size-notice .material-icons {
      font-size: 18px;
      vertical-align: middle;
      line-height: 1;
    }
    
    /* 其他樣式 */
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #e8eaed 50%, transparent 100%);
      margin: 12px 0;
    }
    
    .control-hint {
      font-size: 12px;
      color: #6c757d;
      margin-top: 4px;
      font-style: italic;
    }
    
    .control-label-with-button {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    /* 底圖樣式 */
    .label-background-logo {
      position: absolute !important;
      z-index: 1 !important;
      pointer-events: none;
      object-fit: contain !important;
    }
    
    .print_sample > *:not(.label-background-logo) {
      position: relative !important;
      z-index: 2 !important;
    }
    
    /* 輸入框樣式 */
    input[type="text"], input[type="number"] {
      width: 100%;
      padding: 10px 12px;
      border: 2px solid #e8eaed;
      border-radius: 8px;
      font-size: 14px;
    }
    
    /* 小按鈕 */
    .small-button {
      padding: 6px 16px;
      background: white;
      border: 2px solid #e8eaed;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .small-button.primary {
      background: linear-gradient(135deg, #00a0e9 0%, #0068b7 100%);
      color: white;
      border-color: transparent;
    }
    
    /* 底圖上傳區域 */
    .logo-upload-area {
      border: 2px dashed #d4d7dd;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #fafbff;
      margin-bottom: 16px;
    }
    
    .logo-upload-area:hover {
      border-color: #00a0e9;
      background: #f0f8ff;
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
      max-height: 100px;
      margin: 0 auto;
      display: block;
    }
    
    .upload-hint {
      color: #6c757d;
      font-size: 13px;
      margin-top: 8px;
    }
    
    .logo-controls {
      display: none;
    }
    
    .logo-controls.active {
      display: block;
    }
    
    .remove-logo-btn {
      background: #f04747;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    
    .remove-logo-btn .material-icons {
      font-size: 16px;
      vertical-align: middle;
      line-height: 1;
    }
    
    /* 通知樣式 */
    .barcode-notification {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100000;
      background: rgba(255, 255, 255, 0.95);
      padding: 12px 24px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideDown 0.3s ease-out;
    }
    
    .notification.success {
      border-left: 4px solid #10b981;
      color: #059669;
    }
    
    .notification.warning {
      border-left: 4px solid #f59e0b;
      color: #d97706;
    }
    
    .notification.info {
      border-left: 4px solid #00a0e9;
      color: #0068b7;
    }
    
    .notification .material-icons {
      font-size: 20px;
      vertical-align: middle;
      line-height: 1;
    }
    
    /* 手機版浮動按鈕 */
    .mobile-toggle-btn {
      display: ${shouldUseMobileLayout ? 'flex' : 'none'};
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #00a0e9 0%, #0068b7 100%);
      border-radius: 50%;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 160, 233, 0.4);
      cursor: pointer;
      z-index: 99998;
    }
    
    .mobile-toggle-btn .material-icons {
      color: white;
      font-size: 28px;
      vertical-align: middle;
      line-height: 1;
    }
    
    #barcode-control-panel.hidden {
      transform: ${shouldUseMobileLayout ? 'translateY(100%)' : 'translateX(100%)'};
    }
    
    /* 動畫 */
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
    
    /* 條碼圖示 */
    .barcode-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 3px;
    }
    
    .barcode-icon svg {
      width: 18px;
      height: 18px;
      fill: white;
      vertical-align: middle;
    }
    
    /* 滾動條 */
    .panel-body::-webkit-scrollbar {
      width: 8px;
    }
    
    .panel-body::-webkit-scrollbar-track {
      background: #f8f9fa;
      border-radius: 4px;
    }
    
    .panel-body::-webkit-scrollbar-thumb {
      background: #d4d7dd;
      border-radius: 4px;
    }
    
    .panel-body::-webkit-scrollbar-thumb:hover {
      background: #b8bcc4;
    }
  `;
  document.head.appendChild(style);

  /* Brother 匯出功能 */
  window.exportBrotherImage = async function() {
    if (!window.html2canvas) {
      showNotification('請稍候，正在載入必要元件...', 'info');
      setTimeout(() => exportBrotherImage(), 1000);
      return;
    }

    const labels = document.querySelectorAll('.print_sample');
    if (labels.length === 0) {
      showNotification('找不到標籤資料', 'warning');
      return;
    }

    showNotification('正在生成 Brother 標籤圖片...', 'info');

    try {
      // 轉換為像素 (300 DPI)
      const dpi = 300;
      const mmToInch = 0.0393701;
      const labelWidthPx = Math.round(LABEL_WIDTH * mmToInch * dpi);
      const labelHeightPx = Math.round(LABEL_HEIGHT * mmToInch * dpi);
      
      // 建立橫向連續長圖畫布
      const canvas = document.createElement('canvas');
      canvas.width = labelWidthPx * labels.length;
      canvas.height = labelHeightPx;
      const ctx = canvas.getContext('2d');
      
      // 白色背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 處理每個標籤
      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        
        // 使用 html2canvas 繪製標籤
        const tempCanvas = await html2canvas(label, {
          scale: 3,
          backgroundColor: '#FFFFFF',
          logging: false,
          useCORS: true,
          width: label.offsetWidth,
          height: label.offsetHeight
        });
        
        // 計算縮放比例
        const scaleX = labelWidthPx / tempCanvas.width;
        const scaleY = labelHeightPx / tempCanvas.height;
        const scale = Math.min(scaleX, scaleY) * 0.95; // 留一點邊距
        
        // 計算繪製尺寸和位置（置中）
        const drawWidth = tempCanvas.width * scale;
        const drawHeight = tempCanvas.height * scale;
        const drawX = i * labelWidthPx + (labelWidthPx - drawWidth) / 2;
        const drawY = (labelHeightPx - drawHeight) / 2;
        
        // 繪製到連續長圖
        ctx.drawImage(tempCanvas, drawX, drawY, drawWidth, drawHeight);
      }

      // 轉換為 Blob 並儲存
      canvas.toBlob(async (blob) => {
        const url = URL.createObjectURL(blob);
        
        // iOS 裝置：使用 share API
        if (navigator.share && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          try {
            const file = new File([blob], `brother_labels_${new Date().getTime()}.png`, { type: 'image/png' });
            await navigator.share({
              files: [file],
              title: 'Brother 標籤'
            });
            showNotification('請選擇「儲存影像」儲存到相簿', 'success');
          } catch (err) {
            // 如果分享失敗，改用下載
            downloadImage(url);
          }
        } else {
          // 其他裝置：直接下載
          downloadImage(url);
        }
        
        // 延遲清理 URL
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('生成圖片失敗:', error);
      showNotification('生成圖片時發生錯誤', 'warning');
    }
  };

  function downloadImage(url) {
    const link = document.createElement('a');
    link.download = `brother_labels_${new Date().getTime()}.png`;
    link.href = url;
    link.click();
    showNotification('標籤圖片已下載', 'success');
  }

  /* 顯示通知訊息 */
  function showNotification(message, type = 'success') {
    const existingNotification = document.querySelector('.barcode-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `barcode-notification notification ${type}`;
    
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.style.fontSize = '20px';
    icon.textContent = type === 'success' ? 'check_circle' : (type === 'warning' ? 'warning' : 'info');
    
    notification.appendChild(icon);
    notification.appendChild(document.createTextNode(message));
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  window.showNotification = showNotification;

  /* 建立控制面板 */
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
          Brother 標籤編輯器
        </h3>
        ${(shouldUseMobileLayout || isIPad) ? `
          <div class="panel-close">
            <span class="material-icons">close</span>
          </div>
        ` : ''}
      </div>
      
      <div class="panel-body">
        <div class="size-notice">
          <span class="material-icons">info</span>
          <span>標籤尺寸固定為 42×29mm (橫印)</span>
        </div>
        
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
            <input type="text" id="new-preset-name" placeholder="輸入設定檔名稱">
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
            <!-- 內邊距設定 -->
            <div class="control-group">
              <div class="control-group-title">標籤設定</div>
              <div class="control-label">
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
              
              <div class="control-label" style="margin-top: 16px;">
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
              
              <div class="control-label" style="margin-top: 16px;">
                <span>條碼寬度（相對標籤寬度）</span>
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
              
              <div class="control-label" style="margin-top: 16px;">
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
                  <span class="material-icons" style="font-size:32px; color:#00a0e9;">add_photo_alternate</span>
                  <div class="upload-hint">點擊上傳底圖（支援 PNG/JPG）</div>
                </div>
              </div>
              
              <div class="logo-controls" id="logo-controls">
                <div class="control-label">
                  <span>底圖大小（相對標籤高度）</span>
                  <span class="value-badge" id="logo-size">30%</span>
                </div>
                <input type="range" id="logo-size-slider" min="10" max="100" value="30">
                
                <div class="control-label" style="margin-top: 16px;">
                  <span>水平位置</span>
                  <span class="value-badge" id="logo-x">50%</span>
                </div>
                <input type="range" id="logo-x-slider" min="0" max="100" value="50">
                
                <div class="control-label" style="margin-top: 16px;">
                  <span>垂直位置</span>
                  <span class="value-badge" id="logo-y">50%</span>
                </div>
                <input type="range" id="logo-y-slider" min="0" max="100" value="50">
                
                <div class="control-label" style="margin-top: 16px;">
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
      
      <div class="panel-footer">
        <button class="action-button" id="export-image">
          <span class="material-icons">save_alt</span>
          <span>匯出圖片</span>
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
      
      const labelPadding = document.getElementById('label-padding-slider');
      const textAlign = document.getElementById('text-align');
      const fontFamily = document.getElementById('font-family-select');
      
      const textAreaRatio = document.getElementById('text-area-ratio-slider');
      
      /* Brother 預設值 */
      const brotherDefaults = {
        mainSize: 10,
        mainBold: true,
        mainGap: 1,
        subSize: 8,
        subBold: true,
        barcodeTextSize: 8,
        barcodeTextBold: false,
        barcodeHeight: 10,
        barcodeWidth: 75,
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
      
      const defaultSettings = { ...brotherDefaults };

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

      /* 計算行高 */
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
        
        /* 更新顯示值 */
        document.getElementById('main-size').textContent = mainSize.value + 'px';
        document.getElementById('main-gap').textContent = mainGap.value + 'px';
        document.getElementById('sub-size').textContent = subSize.value + 'px';
        
        document.getElementById('barcode-text-size').textContent = barcodeTextSize.value + 'px';
        document.getElementById('barcode-height').textContent = barcodeHeight.value + 'mm';
        document.getElementById('barcode-width').textContent = barcodeWidth.value + '%';
        document.getElementById('label-padding').textContent = labelPadding.value + 'mm';
        
        /* 進階版面設定顯示值更新 */
        const textRatio = parseInt(textAreaRatio.value);
        const barcodeRatio = 100 - textRatio;
        document.getElementById('text-area-ratio').textContent = textRatio + '%';
        document.getElementById('area-hint').textContent = `文字區：${textRatio}% / 條碼區：${barcodeRatio}%`;
        
        /* 計算實際高度 */
        const totalHeight = LABEL_HEIGHT;
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
        const barcodeActualWidth = (LABEL_WIDTH * parseFloat(barcodeWidth.value) / 100).toFixed(1);
        
        /* 計算基於百分比的logo高度 */
        const logoHeightMM = logoSizeSlider ? LABEL_HEIGHT * parseFloat(logoSizeSlider.value) / 100 : 0;
        const logoWidthMM = logoHeightMM * logoAspectRatio;
        
        /* 套用樣式 */
        dynamicStyle.innerHTML = `
          /* 調整條碼標籤整體尺寸 - 固定為 42×29mm */
          .print_barcode_area {
            width: ${LABEL_WIDTH}mm !important;
          }
          
          /* 調整單個標籤的尺寸 */
          html .print_barcode_area .print_sample,
          body .print_barcode_area .print_sample {
            height: ${LABEL_HEIGHT}mm !important;
            padding: ${labelPadding.value}mm !important;
            box-sizing: border-box !important;
          }
          
          /* 文字區域高度 */
          html .print_barcode_area .print_sample .spec_info,
          body .print_barcode_area .print_sample .spec_info {
            height: ${specInfoHeight}mm !important;
            margin-bottom: 0 !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
          }
          
          /* 條碼區域高度 */
          html .print_barcode_area .print_sample .spec_barcode,
          body .print_barcode_area .print_sample .spec_barcode {
            height: ${specBarcodeHeight}mm !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            overflow: hidden !important;
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
          
          /* 規格/編號/價格樣式 */
          .print_barcode_area .print_sample .spec_info .sub {
            font-size: ${subSize.value}px !important;
            line-height: ${subLineHeight}px !important;
            font-weight: ${subFontWeight} !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          
          /* 
