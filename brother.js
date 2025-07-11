javascript:(function(){
  /* BV SHOP 條碼列印排版器 - Brother 連續長圖版本（修正版） */
  
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
    
    /* Brother 匯出區塊 */
    .brother-export-section {
      background: #f0f8ff;
      border: 2px solid #00a0e9;
      border-radius: 12px;
      padding: 20px;
      margin: 20px;
    }
    
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
    
    .control-hint {
      font-size: 13px;
      color: #666;
      margin-top: 12px;
      line-height: 1.5;
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
  `;
  document.head.appendChild(style);

  /* Brother 連續長圖匯出功能（改進版） */
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
      // 預設尺寸 29 x 42mm
      const labelWidthMM = 29;
      const labelHeightMM = 42;
      
      // 轉換為像素 (300 DPI)
      const dpi = 300;
      const mmToInch = 0.0393701;
      const labelWidthPx = Math.round(labelWidthMM * mmToInch * dpi);
      const labelHeightPx = Math.round(labelHeightMM * mmToInch * dpi);
      
      // 建立臨時容器來準備標籤
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: fixed;
        left: -99999px;
        top: 0;
        width: ${labelWidthPx}px;
        background: white;
        font-family: Arial, sans-serif;
      `;
      document.body.appendChild(tempContainer);

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
        const originalLabel = labels[i];
        
        // 建立標籤副本
        const labelClone = document.createElement('div');
        labelClone.style.cssText = `
          width: ${labelWidthPx}px;
          height: ${labelHeightPx}px;
          background: white;
          padding: ${Math.round(2 * mmToInch * dpi)}px;
          box-sizing: border-box;
          position: relative;
          font-family: Arial, sans-serif;
        `;
        
        // 提取文字資訊
        const mainText = originalLabel.querySelector('.spec_info .main')?.textContent || '';
        const subTexts = Array.from(originalLabel.querySelectorAll('.spec_info .sub')).map(el => el.textContent);
        const barcodeImg = originalLabel.querySelector('.spec_barcode img');
        const barcodeText = originalLabel.querySelector('.spec_barcode .sub')?.textContent || '';
        
        // 建立內容結構
        const contentHTML = `
          <div style="
            height: 100%;
            display: flex;
            flex-direction: column;
            font-family: Arial, sans-serif;
          ">
            <!-- 文字區域 -->
            <div style="
              flex: 1;
              padding: ${Math.round(1 * mmToInch * dpi)}px;
            ">
              <!-- 商品名稱 -->
              <div style="
                font-size: ${Math.round(10 * dpi / 72)}px;
                font-weight: bold;
                margin-bottom: ${Math.round(2 * mmToInch * dpi)}px;
                line-height: 1.2;
                color: #000;
              ">${mainText}</div>
              
              <!-- 其他資訊 -->
              ${subTexts.map(text => `
                <div style="
                  font-size: ${Math.round(8 * dpi / 72)}px;
                  margin-bottom: ${Math.round(1 * mmToInch * dpi)}px;
                  color: #000;
                ">${text}</div>
              `).join('')}
            </div>
            
            <!-- 條碼區域 -->
            <div style="
              height: ${Math.round(15 * mmToInch * dpi)}px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: ${Math.round(1 * mmToInch * dpi)}px;
            ">
              ${barcodeImg ? `<img src="${barcodeImg.src}" style="
                height: ${Math.round(10 * mmToInch * dpi)}px;
                width: auto;
                max-width: 90%;
              ">` : ''}
              <div style="
                font-size: ${Math.round(8 * dpi / 72)}px;
                margin-top: ${Math.round(1 * mmToInch * dpi)}px;
                font-family: monospace;
                letter-spacing: 1px;
                color: #000;
              ">${barcodeText}</div>
            </div>
          </div>
        `;
        
        labelClone.innerHTML = contentHTML;
        tempContainer.appendChild(labelClone);
        
        // 使用 html2canvas 轉換
        const tempCanvas = await html2canvas(labelClone, {
          scale: 1,
          backgroundColor: '#FFFFFF',
          logging: false,
          useCORS: true,
          width: labelWidthPx,
          height: labelHeightPx
        });
        
        // 繪製到主畫布
        ctx.drawImage(tempCanvas, i * labelWidthPx, 0);
        
        // 清理
        labelClone.remove();
      }
      
      // 清理臨時容器
      tempContainer.remove();

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
                .container {
                  max-width: 100%;
                  overflow-x: auto;
                  background: white;
                  border-radius: 8px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                  padding: 20px;
                  margin-bottom: 20px;
                }
                img {
                  display: block;
                  height: 400px;
                  width: auto;
                  margin: 0 auto;
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
                  border: none;
                  cursor: pointer;
                }
                .button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 16px rgba(0, 160, 233, 0.4);
                }
              </style>
            </head>
            <body>
              <div class="info">
                <h3>Brother 標籤連續長圖</h3>
                <p>尺寸：29 x 42mm × ${labels.length} 張</p>
                <p>總長度：${(labelWidthMM * labels.length / 10).toFixed(1)} cm</p>
                <p>解析度：300 DPI</p>
              </div>
              
              <div class="container">
                <img src="${url}" alt="Brother 標籤長圖">
              </div>
              
              <div style="margin: 20px;">
                <a href="${url}" download="brother_labels_${new Date().getTime()}.png" class="button">
                  下載圖片
                </a>
                <button onclick="saveToPhotos('${url}')" class="button">
                  儲存到相簿（iOS）
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
                  if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
                    // iOS：提示長按儲存
                    alert('請長按圖片，然後選擇「儲存影像」');
                  } else {
                    // 其他裝置：直接下載
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'brother_labels.png';
                    link.click();
                  }
                }
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
    icon.textContent = type === 'success' ? 'check_circle' : (type === 'warning' ? 'warning' : 'info');
    
    notification.appendChild(icon);
    notification.appendChild(document.createTextNode(message));
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  window.showNotification = showNotification;

  /* 建立簡單的控制面板 */
  setTimeout(() => {
    const panel = document.createElement('div');
    panel.className = 'brother-export-section';
    panel.innerHTML = `
      <h3 style="margin: 0 0 15px 0; color: #0068b7; font-size: 18px;">
        Brother 標籤列印工具
      </h3>
      <button class="action-button" onclick="exportBrotherContinuousImage()">
        <span class="material-icons">panorama_horizontal</span>
        <span>匯出 Brother 連續長圖 (29×42mm)</span>
      </button>
      <div class="control-hint">
        點擊後會在新視窗顯示橫向連續長圖，<br>
        可直接儲存到相簿並使用 Brother iPrint&Label 列印
      </div>
    `;
    
    // 插入到頁面頂部
    const printArea = document.querySelector('.print_barcode_area');
    if (printArea) {
      printArea.parentNode.insertBefore(panel, printArea);
    } else {
      document.body.insertBefore(panel, document.body.firstChild);
    }
  }, 100);

})();
