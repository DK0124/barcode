javascript:(function(){
  /* BV SHOP 條碼列印排版器 - Brother 連續長圖版本 */
  
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
    
    /* 防止自動識別 */
    meta[name="format-detection"] {
      content: "telephone=no" !important;
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
        border-radius: 0 !important;
        transform: none !important;
      }
      
      #barcode-control-panel,
      .mobile-toggle-btn,
      .barcode-notification {
        display: none !important;
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
    
    .panel-header {
      background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
      color: white;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
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
    
    .section-icon {
      font-size: 20px;
      color: #5865F2;
    }
    
    .section-toggle {
      color: #6c757d;
      transition: transform 0.3s ease;
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
      color: #5865F2;
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
      background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
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
      background: linear-gradient(90deg, #5865F2 0%, #7289DA 100%);
      width: var(--value, 0%);
      pointer-events: none;
    }
    
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      background: white;
      border: 3px solid #5865F2;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(88, 101, 242, 0.3);
      position: relative;
      z-index: 1;
    }
    
    input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
      background: white;
      border: 3px solid #5865F2;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(88, 101, 242, 0.3);
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
      background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
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
      box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3);
    }
    
    .action-button.brother-button {
      background: linear-gradient(135deg, #00a0e9 0%, #0068b7 100%);
    }
    
    .action-button.brother-button:hover {
      box-shadow: 0 4px 12px rgba(0, 160, 233, 0.3);
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
    }
    
    /* 手機版浮動按鈕 */
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
    }
    
    .mobile-toggle-btn .material-icons {
      color: white;
      font-size: 28px;
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
      background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
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
      border-color: #7289DA;
      background: #f8f9ff;
    }
    
    .logo-upload-area.has-logo {
      border-style: solid;
      padding: 16px;
      background: white;
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

  /* Brother 連續長圖匯出功能 */
  window.exportBrotherContinuousImage = async function() {
    if (!window.html2canvas) {
      showNotification('請稍候，正在載入必要元件...', 'info');
      setTimeout(() => exportBrotherContinuousImage(), 1000);
      return;
    }

    const labels = document.querySelectorAll('.print_sample');
    if (labels.length === 0) {
      showNotification('找不到標籤資料', 'warning');
      return;
    }

    showNotification('正在生成 Brother 連續長圖...', 'info');

    try {
      // 預設尺寸 42 x 29mm
      const labelWidthMM = 42;
      const labelHeightMM = 29;
      
      // 轉換為像素 (300 DPI)
      const pixelPerMM = 11.811; // 300 DPI
      const labelWidth = Math.round(labelWidthMM * pixelPerMM); 
      const labelHeight = Math.round(labelHeightMM * pixelPerMM); 
      
      // 建立橫向連續長圖畫布
      const totalWidth = labelWidth * labels.length;
      const canvas = document.createElement('canvas');
      canvas.width = totalWidth;
      canvas.height = labelHeight;
      const ctx = canvas.getContext('2d');
      
      // 白色背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 處理每個標籤
      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        
        // 複製標籤以避免修改原始元素
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
          position: fixed;
          left: -9999px;
          top: 0;
          width: ${label.offsetWidth}px;
          height: ${label.offsetHeight}px;
          background: white;
          overflow: visible;
        `;
        
        const clonedLabel = label.cloneNode(true);
        
        // 確保條碼數字不會被識別為電話號碼
        const barcodeTexts = clonedLabel.querySelectorAll('.spec_barcode .sub');
        barcodeTexts.forEach(text => {
          text.style.cssText += `
            pointer-events: none !important;
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            user-select: none !important;
            text-decoration: none !important;
            color: inherit !important;
          `;
          // 包裹在 span 中以防止識別
          const span = document.createElement('span');
          span.style.cssText = 'display: inline-block;';
          span.textContent = text.textContent;
          text.textContent = '';
          text.appendChild(span);
        });
        
        tempContainer.appendChild(clonedLabel);
        document.body.appendChild(tempContainer);
        
        // 使用 html2canvas 繪製標籤
        const tempCanvas = await html2canvas(clonedLabel, {
          scale: 3,
          backgroundColor: '#FFFFFF',
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: clonedLabel.offsetWidth,
          height: clonedLabel.offsetHeight
        });
        
        // 移除臨時容器
        tempContainer.remove();
        
        // 計算縮放比例
        const scaleX = labelWidth / tempCanvas.width;
        const scaleY = labelHeight / tempCanvas.height;
        const scale = Math.min(scaleX, scaleY);
        
        // 計算繪製尺寸和位置（置中）
        const drawWidth = tempCanvas.width * scale;
        const drawHeight = tempCanvas.height * scale;
        const drawX = i * labelWidth + (labelWidth - drawWidth) / 2;
        const drawY = (labelHeight - drawHeight) / 2;
        
        // 繪製到連續長圖
        ctx.drawImage(tempCanvas, drawX, drawY, drawWidth, drawHeight);
        
        // 添加分隔線（可選）
        if (i < labels.length - 1) {
          ctx.strokeStyle = '#f0f0f0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo((i + 1) * labelWidth, 0);
          ctx.lineTo((i + 1) * labelWidth, labelHeight);
          ctx.stroke();
        }
      }

      // 轉換為 Blob
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        
        // 在新視窗中顯示
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta name="format-detection" content="telephone=no">
              <title>Brother 標籤長圖</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background: #f0f0f0;
                  text-align: center;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
                }
                img {
                  max-width: 100%;
                  height: auto;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                  border-radius: 8px;
                  display: block;
                  margin: 0 auto 20px;
                }
                .info {
                  background: white;
                  padding: 20px;
                  border-radius: 12px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  margin-bottom: 20px;
                  max-width: 600px;
                  margin-left: auto;
                  margin-right: auto;
                }
                .info h3 {
                  margin: 0 0 10px 0;
                  color: #333;
                  font-size: 18px;
                }
                .info p {
                  margin: 5px 0;
                  color: #666;
                  font-size: 14px;
                }
                .button {
                  display: inline-block;
                  background: linear-gradient(135deg, #00a0e9 0%, #0068b7 100%);
                  color: white;
                  padding: 12px 24px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-weight: 600;
                  margin: 10px;
                  font-size: 16px;
                  box-shadow: 0 4px 12px rgba(0, 160, 233, 0.3);
                  transition: all 0.2s ease;
                }
                .button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 16px rgba(0, 160, 233, 0.4);
                }
                .secondary-button {
                  background: white;
                  color: #333;
                  border: 2px solid #e0e0e0;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .secondary-button:hover {
                  background: #f8f9fa;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
              </style>
            </head>
            <body>
              <div class="info">
                <h3>Brother 標籤連續長圖</h3>
                <p>尺寸：42 x 29mm × ${labels.length} 張</p>
                <p>總長度：${(labelWidthMM * labels.length / 10).toFixed(1)} cm</p>
                <p>解析度：300 DPI</p>
              </div>
              
              <img src="${url}" alt="Brother 標籤長圖">
              
              <div style="margin: 20px;">
                <a href="${url}" download="brother_labels_${new Date().getTime()}.png" class="button">
                  下載圖片
                </a>
                <button onclick="saveToPhotos('${url}')" class="button secondary-button">
                  儲存到相簿
                </button>
              </div>
              
              <div class="info" style="margin-top: 20px;">
                <h3>使用說明</h3>
                <p>1. 點擊「下載圖片」或「儲存到相簿」</p>
                <p>2. 開啟 Brother iPrint&Label App</p>
                <p>3. 選擇「相簿列印」功能</p>
                <p>4. 選擇此圖片並列印</p>
              </div>
              
              <script>
                function saveToPhotos(url) {
                  // iOS Safari
                  if (navigator.share) {
                    fetch(url)
                      .then(res => res.blob())
                      .then(blob => {
                        const file = new File([blob], 'brother_labels.png', { type: 'image/png' });
                        navigator.share({
                          files: [file],
                          title: 'Brother 標籤'
                        });
                      });
                  } else {
                    // 其他瀏覽器：長按圖片儲存
                    alert('請長按圖片，選擇「儲存圖片」');
                  }
                }
                
                // 防止電話號碼識別
                document.addEventListener('DOMContentLoaded', function() {
                  const meta = document.createElement('meta');
                  meta.name = 'format-detection';
                  meta.content = 'telephone=no';
                  document.head.appendChild(meta);
                });
              </script>
            </body>
            </html>
          `);
          
          showNotification('已在新視窗開啟 Brother 標籤長圖', 'success');
        } else {
          // 如果無法開啟新視窗，直接下載
          const link = document.createElement('a');
          link.download = `brother_labels_${new Date().getTime()}.png`;
          link.href = url;
          link.click();
          
          showNotification('已下載 Brother 標籤長圖', 'success');
        }
        
        // 延遲清理 URL
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('生成圖片失敗:', error);
      showNotification('生成圖片時發生錯誤', 'warning');
    }
  };

  /* 建立控制面板 */
  setTimeout(() => {
    const panel = document.createElement('div');
    panel.id = 'barcode-control-panel';
    panel.className = shouldUseMobileLayout ? 'hidden' : '';
    
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
            <input type="text" id="new-preset-name" placeholder="輸入設定檔名稱">
            <button class="small-button primary" id="confirm-save">確認</button>
            <button class="small-button" id="cancel-save">取消</button>
          </div>
        </div>
        
        <!-- Brother 匯出區塊 -->
        <div class="control-group" style="background: #f0f8ff; border-color: #00a0e9;">
          <div class="control-group-title" style="color: #0068b7;">Brother 印表機專用</div>
          <button class="action-button brother-button" onclick="exportBrotherContinuousImage()">
            <span class="material-icons">panorama_horizontal</span>
            <span>匯出 Brother 連續長圖 (42×29mm)</span>
          </button>
          <div class="control-hint" style="margin-top: 10px;">
            點擊後會在新視窗顯示橫向連續長圖，<br>
            可直接儲存到相簿並使用 Brother iPrint&Label 列印
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
              
              <div class="control-label" style="margin-top: 16px;">
                <span>標籤高度</span>
                <span class="value-badge" id="label-height">30mm</span>
              </div>
              <input type="range" id="label-height-slider" min="20" max="40" value="30">
              
              <div class="control-label" style="margin-top: 16px;">
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
                  <span class="material-icons" style="font-size:32px; color:#5865F2;">add_photo_alternate</span>
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
                  <span class="material-icons" style="font-size: 16px;">delete</span>
                  移除底圖
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
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
    
    /* 顯示通知訊息 */
    function showNotification(message, type = 'success') {
      /* 移除現有的通知 */
      const existingNotification = document.querySelector('.barcode-notification');
      if (existingNotification) {
        existingNotification.remove();
      }
      
      const notification = document.createElement('div');
      notification.className = `barcode-notification notification ${type}`;
      
      /* 添加圖標 */
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
      
      /* 預設值設置 */
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
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
          }
          
          /* 條碼區域高度 - 使用計算的百分比高度 */
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
            white-space: normal !important; /* 允許自動換行 */
            word-break: break-all !important; /* 單字太長也會換行 */
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
          
          /* 多行文字處理 */
          .main.show-multi-line.two-lines {
            height: ${mainLineHeight * 2}px !important;
            line-height: ${mainLineHeight}px !important;
          }
          
          /* 條碼下方數字樣式 - 防止電話連結 */
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
          
          /* 條碼圖片高度和寬度 - 使用百分比寬度 */
          .print_barcode_area .print_sample .spec_barcode img {
            height: ${barcodeHeight.value}mm !important;
            width: ${barcodeActualWidth}mm !important;
            max-width: 100% !important;
            object-fit: contain !important;
            margin: 0 auto !important;
          }
          
          /* 確保條碼容器能適應條碼大小 */
          .print_barcode_area .print_sample .spec_barcode {
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
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
        
        /* 防止條碼數字被識別為電話號碼 */
        document.querySelectorAll('.spec_barcode .sub').forEach(element => {
          element.setAttribute('x-ms-format-detection', 'none');
          element.setAttribute('format-detection', 'telephone=no');
        });
        
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
        
        /* 特別防止條碼數字被識別為電話 */
        .spec_barcode .sub {
          -webkit-text-size-adjust: 100%;
          -webkit-tap-highlight-color: transparent;
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
})();
