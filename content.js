javascript:(function(){
  /* BV SHOP 條碼列印排版器 - Brother 標籤機優化版 v6 - 最終版 */
  
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

  /* 八種內建樣式模板 - 改進版 */
  const layoutTemplates = {
    style1: {
      name: '樣式一',
      description: '標準版（含特價）',
      imageExt: 'PNG',
      hasMainText: true,
      hasSubText: true,
      hasBarcode: true,
      barcodePosition: 'bottom',
      canAdjustBarcodeY: true,
      hasSpecGap: true,
      hasPriceGap: true,
      barcodeHeight: 83,
      barcodeWidth: 100,
      barcodeYPosition: 50,
      rebuild: function(sample, data) {
        sample.innerHTML = `
          <div class="spec_info">
            <ul>
              <li class="main break-all show-multi-line">${data.productName || '商品名稱'}</li>
              <li class="sub spec-sub">${data.spec || '規格名稱一 / 規格名稱二'}</li>
              <li class="sub price-sub">${data.price || '售價 $1,234'}</li>
              <li class="sub special-price-sub">${data.specialPrice || '特價 $1,111'}</li>
            </ul>
          </div>
          <div class="spec_barcode">
            ${data.barcodeImage ? `<img src="${data.barcodeImage}" alt="barcode">` : ''}
            <b><span class="sub">${data.barcodeNumber || '123456789'}</span></b>
          </div>
        `;
      }
    },
    
    style2: {
      name: '樣式二',
      description: '標準版（無特價）',
      imageExt: 'PNG',
      hasMainText: true,
      hasSubText: true,
      hasBarcode: true,
      barcodePosition: 'bottom',
      canAdjustBarcodeY: true,
      hasSpecGap: true,
      hasPriceGap: true,
      barcodeHeight: 83,
      barcodeWidth: 100,
      barcodeYPosition: 50,
      rebuild: function(sample, data) {
        sample.innerHTML = `
          <div class="spec_info">
            <ul>
              <li class="main break-all show-multi-line">${data.productName || '商品名稱'}</li>
              <li class="sub spec-sub">${data.spec || '規格名稱一 / 規格名稱二'}</li>
              <li class="sub price-sub">${data.price || '售價 $1,234'}</li>
              <li class="sub">&nbsp;</li>
            </ul>
          </div>
          <div class="spec_barcode">
            ${data.barcodeImage ? `<img src="${data.barcodeImage}" alt="barcode">` : ''}
            <b><span class="sub">${data.barcodeNumber || '123456789'}</span></b>
          </div>
        `;
      }
    },
    
    style3: {
      name: '樣式三',
      description: '條碼嵌入（含特價）',
      imageExt: 'PNG',
      hasMainText: true,
      hasSubText: true,
      hasBarcode: true,
      barcodePosition: 'embedded',
      canAdjustBarcodeY: false,
      hasSpecGap: true,
      hasBarcodeGap: true,
      hasPriceGap: true,
      barcodeHeight: 40,
      barcodeWidth: 100,
      barcodeYPosition: 50,
      rebuild: function(sample, data) {
        sample.innerHTML = `
          <div class="spec_info">
            <ul>
              <li class="main break-all show-multi-line">${data.productName || '商品名稱'}</li>
              <li class="sub spec-sub">${data.spec || '規格名稱一 / 規格名稱二'}</li>
              <li class="sub barcode-number-sub">${data.barcodeNumber || '123456789'}</li>
              <div class="spec_barcode embedded-barcode">
                ${data.barcodeImage ? `<img src="${data.barcodeImage}" alt="barcode">` : ''}
                <span class="sub">${data.barcodeNumber || '123456789'}</span>
              </div>
              <li class="sub price-sub">${data.price || '售價 $1,234'}</li>
              <li class="sub special-price-sub">${data.specialPrice || '特價 $1,111'}</li>
            </ul>
          </div>
        `;
      }
    },
    
    style4: {
      name: '樣式四',
      description: '條碼嵌入（無特價）',
      imageExt: 'PNG',
      hasMainText: true,
      hasSubText: true,
      hasBarcode: true,
      barcodePosition: 'embedded',
      canAdjustBarcodeY: false,
      hasSpecGap: true,
      hasBarcodeGap: true,
      hasPriceGap: true,
      barcodeHeight: 40,
      barcodeWidth: 100,
      barcodeYPosition: 50,
      rebuild: function(sample, data) {
        sample.innerHTML = `
          <div class="spec_info">
            <ul>
              <li class="main break-all show-multi-line">${data.productName || '商品名稱'}</li>
              <li class="sub spec-sub">${data.spec || '規格名稱一 / 規格名稱二'}</li>
              <li class="sub barcode-number-sub">${data.barcodeNumber || '123456789'}</li>
              <div class="spec_barcode embedded-barcode">
                ${data.barcodeImage ? `<img src="${data.barcodeImage}" alt="barcode">` : ''}
                <span class="sub">${data.barcodeNumber || '123456789'}</span>
              </div>
              <li class="sub price-sub">${data.price || '售價 $1,234'}</li>
            </ul>
          </div>
        `;
      }
    },
    
    style5: {
      name: '樣式五',
      description: '價格置右',
      imageExt: 'PNG',
      hasMainText: true,
      hasSubText: true,
      hasBarcode: true,
      barcodePosition: 'bottom',
      canAdjustBarcodeY: true,
      hasPriceGap: true,
      hasSpecGap: true,
      barcodeHeight: 70,
      barcodeWidth: 100,
      barcodeYPosition: 60,
      rebuild: function(sample, data) {
        sample.innerHTML = `
          <div class="spec_info">
            <ul>
              <li class="main break-all show-multi-line">${data.productName || '商品名稱'}</li>
              <li class="sub spec-sub">${data.spec || '規格名稱一 / 規格名稱二'}</li>
              <li class="sub"></li>
            </ul>
          </div>
          <div class="spec_barcode style5-barcode">
            <span style="text-align: right" class="sub">
              <b>${data.price || '售價 $1,234'} ${data.specialPrice || '特價 $1,111'}</b>
            </span>
            ${data.barcodeImage ? `<img src="${data.barcodeImage}" alt="barcode">` : ''}
            <b><span class="sub">${data.barcodeNumber || '123456789'}</span></b>
          </div>
        `;
      }
    },
    
    style6: {
      name: '樣式六',
      description: '簡約版（無價格）',
      imageExt: 'jpg',
      hasMainText: true,
      hasSubText: true,
      hasBarcode: true,
      barcodePosition: 'embedded',
      canAdjustBarcodeY: false,
      hasSpecGap: true,
      hasBarcodeGap: true,
      barcodeHeight: 70,
      barcodeWidth: 100,
      barcodeYPosition: 60,
      rebuild: function(sample, data) {
        sample.innerHTML = `
          <div class="spec_info">
            <ul>
              <li class="main break-all show-multi-line">${data.productName || '商品名稱'}</li>
              <li class="sub spec-sub">${data.spec || '規格名稱一 / 規格名稱二'}</li>
              <br>
              <br>
              <div class="spec_barcode embedded-barcode">
                ${data.barcodeImage ? `<img src="${data.barcodeImage}" alt="barcode">` : ''}
                <div class="sub" style="margin-top: 1%;">${data.barcodeNumber || '123456789'}</div>
              </div>
            </ul>
          </div>
        `;
      }
    },
    
    style7: {
      name: '樣式七',
      description: '價格置右＋SKU',
      imageExt: 'jpg',
      hasMainText: true,
      hasSubText: true,
      hasBarcode: true,
      barcodePosition: 'bottom',
      canAdjustBarcodeY: true,
      hasPriceGap: true,
      hasSpecGap: true,
      hasSkuGap: true,
      barcodeHeight: 70,
      barcodeWidth: 100,
      barcodeYPosition: 60,
      rebuild: (sample, data) => {
        sample.innerHTML = '';
        sample.classList.add('style7-layout');
        
        // 商品名稱
        if (data.productName) {
          const main = document.createElement('div');
          main.className = 'main';
          main.textContent = data.productName;
          sample.appendChild(main);
        }
        
        // 條碼區域
        const specBarcode = document.createElement('div');
        specBarcode.className = 'spec_barcode compact-barcode';
        
        if (data.barcodeImage) {
          const img = document.createElement('img');
          img.src = data.barcodeImage;
          specBarcode.appendChild(img);
        }
        
        if (data.barcodeNumber) {
          const barcodeText = document.createElement('span');
          barcodeText.className = 'sub';
          barcodeText.textContent = data.barcodeNumber;
          specBarcode.appendChild(barcodeText);
        }
        
        sample.appendChild(specBarcode);
        
        // SKU
        if (data.sku) {
          const skuDiv = document.createElement('div');
          skuDiv.className = 'sub sku-text';
          skuDiv.textContent = data.sku;
          sample.appendChild(skuDiv);
        }
      }
    },
    
    style8: {
      name: '樣式八',
      description: '純條碼',
      imageExt: 'jpg',
      hasMainText: false,
      hasSubText: false,
      hasBarcode: true,
      barcodePosition: 'center',
      hasOnlyBarcode: true,
      canAdjustBarcodeY: true,
      barcodeHeight: 60,
      barcodeWidth: 100,
      barcodeYPosition: 50,
      rebuild: function(sample, data) {
        sample.style.display = 'flex';
        sample.style.justifyContent = 'center';
        sample.style.alignItems = 'center';
        sample.innerHTML = `
          <div class="spec_barcode pure-barcode">
            ${data.barcodeImage ? `<img src="${data.barcodeImage}" alt="barcode">` : ''}
            <br>
            <b><span class="sub">${data.barcodeNumber || '123456789'}</span></b>
          </div>
        `;
      }
    }
  };

  /* 初始變數 */
  let currentLayout = 'style1';
  let isPanelMinimized = false;
  let collapsedSections = {};
  let originalLayout = 'style1';

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
    // 間距設定
    specGap: 0,
    priceGap: 0,
    barcodeGap: 0,
    skuGap: 0,
    barcodeTextSize: 8,
    barcodeTextBold: true,
    barcodeTextLineHeight: 10,
    barcodeHeight: 100,
    barcodeWidth: 100,
    barcodeYPosition: 70,
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
  let originalHTML = {};
  
  /* 建立動態樣式元素 */
  const dynamicStyle = document.createElement('style');
  document.head.appendChild(dynamicStyle);

  /* Logo 相關變數 */
  let logoDataUrl = null;
  let logoAspectRatio = 1;

  /* 偵測原始樣式 */
  function detectOriginalLayout() {
    const firstSample = document.querySelector('.print_sample');
    if (!firstSample) return 'style1';
    
    // 樣式8：純條碼 - 檢查是否有 display: flex 的 inline style
    if (firstSample.style.display === 'flex' && 
        firstSample.style.justifyContent === 'center' && 
        firstSample.style.alignItems === 'center') {
      return 'style8';
    }
    
    const specInfo = firstSample.querySelector('.spec_info');
    const specBarcode = firstSample.querySelector('.spec_barcode');
    
    // 檢查是否有內嵌條碼（樣式3、4、6）
    const embeddedBarcode = firstSample.querySelector('.spec_info .spec_barcode');
    if (embeddedBarcode) {
      // 檢查是否有 <br> 標籤（樣式6）
      const hasBr = firstSample.querySelectorAll('.spec_info br').length > 0;
      if (hasBr) {
        return 'style6';
      }
      
      // 檢查是否有特價（樣式3 vs 4）
      const liElements = firstSample.querySelectorAll('.spec_info > ul > li.sub');
      let hasSpecialPrice = false;
      liElements.forEach(li => {
        if (li.textContent.includes('特價')) {
          hasSpecialPrice = true;
        }
      });
      
      return hasSpecialPrice ? 'style3' : 'style4';
    }
    
    // 樣式5 vs 樣式7：價格在右側的樣式
    if (specBarcode) {
      const priceSpan = specBarcode.querySelector('span[style*="text-align: right"]');
      if (priceSpan) {
        // 關鍵差異：檢查是否有 SKU (div.sub)
        const skuDiv = firstSample.querySelector('.spec_info div.sub');
        if (skuDiv) {
          return 'style7'; // 有SKU是樣式7
        } else {
          return 'style5'; // 沒有SKU是樣式5
        }
      }
    }
    
    // 樣式1、2：標準佈局
    if (specInfo && specBarcode) {
      const liElements = specInfo.querySelectorAll('li.sub');
      let hasSpecialPrice = false;
      liElements.forEach(li => {
        if (li.textContent.includes('特價') && li.textContent.trim() !== '&nbsp;') {
          hasSpecialPrice = true;
        }
      });
      
      return hasSpecialPrice ? 'style1' : 'style2';
    }
    
    return 'style1'; // 預設
  }
  
  /* 抓取產品資料函數 */
  function extractProductData() {
    productData = [];
    
    document.querySelectorAll('.print_sample').forEach((sample, index) => {
      let data = {};
      
      // 根據當前樣式抓取資料
      switch(currentLayout) {
        case 'style1':
        case 'style2':
          // 樣式1和2：標準上中下佈局
          const specInfo = sample.querySelector('.spec_info');
          const specBarcode = sample.querySelector('.spec_barcode');
          
          if (specInfo) {
            // 商品名稱
            data.productName = specInfo.querySelector('.main')?.textContent?.trim() || '';
            
            // 取得所有 li.sub
            const subItems = specInfo.querySelectorAll('li.sub');
            let specIndex = 0;
            
            subItems.forEach((li, idx) => {
              const text = li.textContent?.trim() || '';
              
              if (text && text !== '&nbsp;') {
                if (idx === specIndex) {
                  data.spec = text; // 第一個非空的是規格
                  specIndex++;
                } else if (idx === specIndex) {
                  data.productNumber = text; // 第二個可能是編號
                  specIndex++;
                } else if (text.includes('售價')) {
                  data.price = text;
                } else if (text.includes('特價')) {
                  data.specialPrice = text;
                }
              }
            });
          }
          
          if (specBarcode) {
            // 條碼數字可能在 span.sub 或 b > span.sub
            const barcodeSpan = specBarcode.querySelector('span.sub') || 
                               specBarcode.querySelector('b > span.sub');
            data.barcodeNumber = barcodeSpan?.textContent?.trim() || '';
            data.barcodeImage = specBarcode.querySelector('img')?.src || '';
          }
          break;
          
        case 'style3':
        case 'style4':
          // 樣式3和4：內嵌條碼
          const specInfo34 = sample.querySelector('.spec_info');
          
          if (specInfo34) {
            // 商品名稱
            data.productName = specInfo34.querySelector('.main')?.textContent?.trim() || '';
            
            // 取得所有 li.sub（條碼前的）
            const subItems = specInfo34.querySelectorAll('ul > li.sub');
            let foundSpec = false;
            let foundNumber = false;
            
            subItems.forEach(li => {
              const text = li.textContent?.trim() || '';
              
              // 跳過條碼區塊後的價格資訊
              const isAfterBarcode = li.previousElementSibling?.classList?.contains('spec_barcode') ||
                                   li.previousElementSibling?.previousElementSibling?.classList?.contains('spec_barcode');
              
              if (!isAfterBarcode && text) {
                if (!foundSpec) {
                  data.spec = text;
                  foundSpec = true;
                } else if (!foundNumber && !text.includes('$')) {
                  data.productNumber = text;
                  foundNumber = true;
                }
              } else if (text.includes('售價')) {
                data.price = text;
              } else if (text.includes('特價')) {
                data.specialPrice = text;
              }
            });
            
            // 條碼資訊
            const embeddedBarcode = specInfo34.querySelector('.spec_barcode');
            if (embeddedBarcode) {
              data.barcodeImage = embeddedBarcode.querySelector('img')?.src || '';
              const barcodeText = embeddedBarcode.querySelector('span.sub');
              data.barcodeNumber = barcodeText?.textContent?.trim() || '';
            }
          }
          break;
          
        case 'style5':
          // 樣式5：價格在右側
          const specInfo5 = sample.querySelector('.spec_info');
          const specBarcode5 = sample.querySelector('.spec_barcode');
          
          if (specInfo5) {
            data.productName = specInfo5.querySelector('.main')?.textContent?.trim() || '';
            
            const subItems = specInfo5.querySelectorAll('li.sub');
            if (subItems[0]) data.spec = subItems[0].textContent?.trim() || '';
            if (subItems[1]) data.productNumber = subItems[1].textContent?.trim() || '';
          }
          
          if (specBarcode5) {
            // 價格在右側的 span
            const priceSpan = specBarcode5.querySelector('span[style*="text-align: right"]');
            if (priceSpan) {
              const priceText = priceSpan.textContent?.trim() || '';
              // 分離售價和特價
              const priceMatch = priceText.match(/售價[^特]*/);
              const specialMatch = priceText.match(/特價.*/);
              
              if (priceMatch) data.price = priceMatch[0].trim();
              if (specialMatch) data.specialPrice = specialMatch[0].trim();
            }
            
            data.barcodeImage = specBarcode5.querySelector('img')?.src || '';
            
            // 條碼數字在最後
            const allSubs = specBarcode5.querySelectorAll('.sub');
            const lastSub = allSubs[allSubs.length - 1];
            if (lastSub && !lastSub.style.textAlign) {
              data.barcodeNumber = lastSub.textContent?.trim() || '';
            }
          }
          break;
          
        case 'style6':
          // 樣式6：緊湊佈局
          const specInfo6 = sample.querySelector('.spec_info');
          
          if (specInfo6) {
            data.productName = specInfo6.querySelector('.main')?.textContent?.trim() || '';
            
            // 只取第一個 li.sub 作為規格
            const firstSub = specInfo6.querySelector('ul > li.sub');
            if (firstSub) {
              data.spec = firstSub.textContent?.trim() || '';
            }
            
            // 條碼資訊
            const embeddedBarcode6 = specInfo6.querySelector('.spec_barcode');
            if (embeddedBarcode6) {
              data.barcodeImage = embeddedBarcode6.querySelector('img')?.src || '';
              const barcodeDiv = embeddedBarcode6.querySelector('div.sub');
              data.barcodeNumber = barcodeDiv?.textContent?.trim() || '';
            }
          }
          break;
          
        case 'style7':
          // 樣式7：帶SKU
          const specInfo7 = sample.querySelector('.spec_info');
          const specBarcode7 = sample.querySelector('.spec_barcode');
          
          if (specInfo7) {
            data.productName = specInfo7.querySelector('.main')?.textContent?.trim() || '';
            
            // 規格和編號
            const subItems = specInfo7.querySelectorAll('ul > li.sub');
            if (subItems[0]) data.spec = subItems[0].textContent?.trim() || '';
            if (subItems[1]) data.productNumber = subItems[1].textContent?.trim() || '';
            
            // SKU 在 div.sub 中 - 修正選擇器
            const skuDiv = sample.querySelector('.spec_info div.sub');
            if (skuDiv) {
              data.sku = skuDiv.textContent?.trim() || '';
            }
          }
          
          if (specBarcode7) {
            // 價格處理（同樣式5）
            const priceSpan = specBarcode7.querySelector('span[style*="text-align: right"]');
            if (priceSpan) {
              const priceText = priceSpan.textContent?.trim() || '';
              const priceMatch = priceText.match(/售價[^特]*/);
              const specialMatch = priceText.match(/特價.*/);
              
              if (priceMatch) data.price = priceMatch[0].trim();
              if (specialMatch) data.specialPrice = specialMatch[0].trim();
            }
            
            data.barcodeImage = specBarcode7.querySelector('img')?.src || '';
            
            // 條碼數字在 div.sub 中
            const barcodeDiv = specBarcode7.querySelector('div.sub[style*="margin-top"]');
            if (barcodeDiv) {
              data.barcodeNumber = barcodeDiv.textContent?.trim() || '';
            }
          }
          break;
          
        case 'style8':
          // 樣式8：純條碼
          const barcode8 = sample.querySelector('.spec_barcode');
          if (barcode8) {
            data.barcodeImage = barcode8.querySelector('img')?.src || '';
            const barcodeSpan = barcode8.querySelector('span.sub') || 
                               barcode8.querySelector('b > span.sub');
            data.barcodeNumber = barcodeSpan?.textContent?.trim() || '';
          }
          break;
      }
      
      productData.push(data);
    });
    
    console.log('抓取到的產品資料：', productData);
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
      
      /* 移除多餘的分頁 */
      .print_barcode_area {
        page-break-after: auto !important;
      }
      
      .print_sample {
        page-break-inside: avoid !important;
        page-break-after: auto !important;
      }
    }
  
    /* 主面板 - 更強的玻璃感 */
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
    
    /* 面板標題 - 增強玻璃感 */
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
    
    /* 當前樣式顯示 */
    .bv-current-style {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
      margin-top: 4px;
    }
    
    .bv-current-style-name {
      color: #518aff;
      font-weight: 500;
    }
    
    /* Glass 按鈕 - 增強玻璃感 */
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
    
    /* 內容區域 - 增強玻璃感 */
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
    
    /* 設定卡片 - 增強玻璃感 */
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
    
    /* 預設尺寸按鈕 - Brother 品牌色 */
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
    
    /* Glass Slider - 更強的玻璃感 */
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
    
    /* Glass Select - 增強玻璃感 */
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
    
    /* 通知 - 增強玻璃感 */
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
    
    /* 底圖上傳樣式 - 增強玻璃感 */
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
    
    /* 匯出匯入按鈕組 */
    .bv-export-import-group {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .bv-export-import-btn {
      flex: 1;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      border: 0.5px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.8);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .bv-export-import-btn:hover {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(0, 0, 0, 0.16);
      color: #518aff;
    }
    
    .bv-export-import-btn .material-icons {
      font-size: 18px;
    }
    
    /* 檔案輸入隱藏 */
    .bv-file-input-hidden {
      display: none;
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
    // 偵測原始樣式
    originalLayout = detectOriginalLayout();
    currentLayout = originalLayout;
    
    // 根據偵測到的樣式設定預設值
    if (layoutTemplates[originalLayout]) {
      const template = layoutTemplates[originalLayout];
      if (template.barcodeHeight !== undefined) {
        completeDefaultSettings.barcodeHeight = template.barcodeHeight;
      }
      if (template.barcodeWidth !== undefined) {
        completeDefaultSettings.barcodeWidth = template.barcodeWidth;
      }
      if (template.barcodeYPosition !== undefined) {
        completeDefaultSettings.barcodeYPosition = template.barcodeYPosition;
      }
    }
    
    // 抓取產品資料
    extractProductData();
    
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
              <div class="bv-current-style">
                目前使用：<span class="bv-current-style-name">${layoutTemplates[currentLayout].name}</span>
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
                  <span class="bv-button-title">清除格式</span>
                  <span class="bv-button-subtitle">還原為 BV 原始預設值</span>
                </div>
              </button>
              
              <!-- 匯出匯入按鈕 -->
              <div class="bv-export-import-group">
                <button class="bv-export-import-btn" id="bv-export-settings">
                  <span class="material-icons">file_download</span>
                  <span>匯出設定檔</span>
                </button>
                <button class="bv-export-import-btn" id="bv-import-settings">
                  <span class="material-icons">file_upload</span>
                  <span>匯入設定檔</span>
                </button>
                <input type="file" id="bv-import-file" class="bv-file-input-hidden" accept=".json">
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
            
            <!-- 欄位間距設定 -->
            <div class="bv-settings-card" id="spacing-settings-card" data-section="spacing">
              <h4 class="bv-card-title">
                <span class="material-icons">format_line_spacing</span>
                欄位間距設定
                <span class="material-icons bv-collapse-icon">expand_more</span>
              </h4>
              
              <div class="bv-card-content">
                <div class="bv-slider-group">
                  <!-- 規格與價格間距 -->
                  <div class="bv-slider-item" id="spec-gap-setting">
                    <div class="bv-slider-header">
                      <span>規格與下方欄位間距</span>
                      <span class="bv-value-label" id="spec-gap">0px</span>
                    </div>
                    <input type="range" id="spec-gap-slider" min="-5" max="10" step="0.5" value="0" class="bv-glass-slider">
                  </div>
                  
                  <!-- 價格與特價間距 -->
                  <div class="bv-slider-item" id="price-gap-setting">
                    <div class="bv-slider-header">
                      <span>售價與特價間距</span>
                      <span class="bv-value-label" id="price-gap">0px</span>
                    </div>
                    <input type="range" id="price-gap-slider" min="-5" max="10" step="0.5" value="0" class="bv-glass-slider">
                  </div>
                  
                  <!-- 條碼與價格間距（樣式3、4、6） -->
                  <div class="bv-slider-item" id="barcode-gap-setting" style="display: none;">
                    <div class="bv-slider-header">
                      <span>條碼區塊與價格間距</span>
                      <span class="bv-value-label" id="barcode-gap">0px</span>
                    </div>
                    <input type="range" id="barcode-gap-slider" min="-5" max="10" step="0.5" value="0" class="bv-glass-slider">
                  </div>
                  
                  <!-- SKU間距（樣式7） -->
                  <div class="bv-slider-item" id="sku-gap-setting" style="display: none;">
                    <div class="bv-slider-header">
                      <span>SKU與上方欄位間距</span>
                      <span class="bv-value-label" id="sku-gap">0px</span>
                    </div>
                    <input type="range" id="sku-gap-slider" min="-5" max="10" step="0.5" value="0" class="bv-glass-slider">
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
      const barcodeTextLineHeightSlider = document.getElementById('barcode-text-line-height-slider');
      const barcodeHeight = document.getElementById('barcode-height-slider');
      const barcodeWidth = document.getElementById('barcode-width-slider');
      const barcodeYPosition = document.getElementById('barcode-y-position-slider');
      
      // 間距控制項
      const specGapSlider = document.getElementById('spec-gap-slider');
      const priceGapSlider = document.getElementById('price-gap-slider');
      const barcodeGapSlider = document.getElementById('barcode-gap-slider');
      const skuGapSlider = document.getElementById('sku-gap-slider');
      
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
        
        // 間距設定顯示/隱藏
        const specGapSetting = document.getElementById('spec-gap-setting');
        const priceGapSetting = document.getElementById('price-gap-setting');
        const barcodeGapSetting = document.getElementById('barcode-gap-setting');
        const skuGapSetting = document.getElementById('sku-gap-setting');
        
        if (specGapSetting) {
          specGapSetting.style.display = template.hasSpecGap ? 'block' : 'none';
        }
        if (priceGapSetting) {
          priceGapSetting.style.display = template.hasPriceGap ? 'block' : 'none';
        }
        if (barcodeGapSetting) {
          barcodeGapSetting.style.display = template.hasBarcodeGap ? 'block' : 'none';
        }
        if (skuGapSetting) {
          skuGapSetting.style.display = template.hasSkuGap ? 'block' : 'none';
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
      
      /* 更新樣式函數 - 加入間距支援 */
      function updateStyles() {
        if (!mainSize || !subSize) return;
        
        const template = layoutTemplates[currentLayout];
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
        // Brother 標籤左邊界要多 1mm
        const isBrotherLabel = labelWidth.value == 42 || labelWidth.value == 29;
        const paddingLeft = isBrotherLabel ? 4 : 3;
        const paddingOther = 3;
        
        const barcodeYPercent = barcodeYPosition ? parseFloat(barcodeYPosition.value) : 70;
        const barcodeHeightScale = barcodeHeight ? parseFloat(barcodeHeight.value) / 100 : 1;
        const barcodeWidthScale = barcodeWidth ? parseFloat(barcodeWidth.value) / 100 : 1;
        
        // 間距值
        const specGap = specGapSlider ? parseFloat(specGapSlider.value) : 0;
        const priceGap = priceGapSlider ? parseFloat(priceGapSlider.value) : 0;
        const barcodeGap = barcodeGapSlider ? parseFloat(barcodeGapSlider.value) : 0;
        const skuGap = skuGapSlider ? parseFloat(skuGapSlider.value) : 0;
        
        // 計算條碼實際尺寸（拉伸後）
        let barcodeHeightMM = 10 * barcodeHeightScale; // 基礎高度 10mm
        let barcodeWidthMM = (totalWidth - paddingLeft - paddingOther) * barcodeWidthScale;
        
        // 根據樣式調整條碼尺寸
        if (template.barcodePosition === 'embedded') {
          barcodeHeightMM = 8 * barcodeHeightScale; // 內嵌條碼較小
          barcodeWidthMM = (totalWidth - paddingLeft - paddingOther) * barcodeWidthScale;
        } else if (template.barcodePosition === 'compact') {
          barcodeHeightMM = 8 * barcodeHeightScale;
          barcodeWidthMM = (totalWidth - paddingLeft - paddingOther) * barcodeWidthScale;
        } else if (template.barcodePosition === 'center') {
          barcodeHeightMM = 15 * barcodeHeightScale; // 純條碼較大
          barcodeWidthMM = (totalWidth - paddingLeft - paddingOther) * barcodeWidthScale;
        } else {
          // 預設情況也確保100%到達邊界
          barcodeWidthMM = (totalWidth - paddingLeft - paddingOther) * barcodeWidthScale;
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
        
        if (document.getElementById('main-line-height')) {
          document.getElementById('main-line-height').textContent = validatedMainLineHeight + 'px';
        }
        if (document.getElementById('sub-line-height')) {
          document.getElementById('sub-line-height').textContent = validatedSubLineHeight + 'px';
        }
        if (document.getElementById('barcode-text-line-height')) {
          document.getElementById('barcode-text-line-height').textContent = validatedBarcodeTextLineHeight + 'px';
        }
        
        // 更新間距顯示
        if (document.getElementById('spec-gap')) {
          document.getElementById('spec-gap').textContent = specGap + 'px';
        }
        if (document.getElementById('price-gap')) {
          document.getElementById('price-gap').textContent = priceGap + 'px';
        }
        if (document.getElementById('barcode-gap')) {
          document.getElementById('barcode-gap').textContent = barcodeGap + 'px';
        }
        if (document.getElementById('sku-gap')) {
          document.getElementById('sku-gap').textContent = skuGap + 'px';
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
         barcodeTextSize, barcodeTextLineHeightSlider, barcodeHeight, barcodeWidth, barcodeYPosition,
         specGapSlider, priceGapSlider, barcodeGapSlider, skuGapSlider, labelWidth, labelHeight,
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
          
          /* 規格間距 */
          .print_barcode_area .print_sample .spec-sub {
            margin-bottom: ${specGap}px !important;
          }
          
          /* 價格間距 */
          .print_barcode_area .print_sample .price-sub {
            margin-bottom: ${priceGap}px !important;
          }
          
          /* 條碼號碼間距（樣式3、4） */
          .print_barcode_area .print_sample .barcode-number-sub {
            margin-bottom: ${barcodeGap}px !important;
          }
          
          /* SKU 特殊樣式 */
          .print_barcode_area .print_sample .sku-text {
            font-size: ${Math.max(subSize.value - 1, 4)}px !important;
            margin-top: ${skuGap}px !important;
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
          
          /* 內嵌條碼特殊樣式 */
          .print_barcode_area .print_sample .embedded-barcode {
            margin: ${barcodeGap}px 0 !important;
          }
          
          .print_barcode_area .print_sample .embedded-barcode img {
            height: ${8 * barcodeHeightScale}mm !important;
            width: ${(totalWidth - paddingLeft - paddingOther) * barcodeWidthScale}mm !important;
            max-width: ${(totalWidth - paddingLeft - paddingOther) * barcodeWidthScale}mm !important;
          }
          
          /* 緊湊條碼特殊樣式 - 樣式6、7可調整位置 */
          .print_barcode_area .print_sample .compact-barcode {
            margin-top: ${(barcodeYPercent - 70) * 0.3}mm !important;
          }
          
          .print_barcode_area .print_sample .compact-barcode img {
            height: ${8 * barcodeHeightScale}mm !important;
            width: ${(totalWidth - paddingLeft - paddingOther) * barcodeWidthScale}mm !important;
            max-width: ${(totalWidth - paddingLeft - paddingOther) * barcodeWidthScale}mm !important;
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
            width: ${(totalWidth - paddingLeft - paddingOther) * barcodeWidthScale}mm !important;
            max-width: ${(totalWidth - paddingLeft - paddingOther) * barcodeWidthScale}mm !important;
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
          
          /* 樣式5 - 價格置右特殊處理 */
          .print_barcode_area .print_sample .style5-barcode > span.sub:first-child {
            position: absolute !important;
            right: 0 !important;
            top: ${-20 - priceGap}px !important;
            font-size: ${subSize.value}px !important;
            z-index: 3 !important;
            text-align: right !important;
            white-space: nowrap !important;
          }
          
          /* 樣式5的條碼位置調整 */
          .print_barcode_area .print_sample .style5-barcode {
            margin-top: ${(barcodeYPercent - 70) * 0.5}mm !important;
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
            
            if (!mainLineHeightSlider.dataset.userModified || mainLineHeightSlider.dataset.userModified === 'false') {
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
            
            if (!subLineHeightSlider.dataset.userModified || subLineHeightSlider.dataset.userModified === 'false') {
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
            
            if (!barcodeTextLineHeightSlider.dataset.userModified || barcodeTextLineHeightSlider.dataset.userModified === 'false') {
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
        barcodeTextSize, barcodeTextLineHeightSlider, barcodeHeight, barcodeWidth, barcodeYPosition,
        specGapSlider, priceGapSlider, barcodeGapSlider, skuGapSlider,
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
      
      /* 清除格式按鈕功能 - 修正版：還原到原始偵測的樣式 */
      const resetFormatBtn = document.getElementById('bv-reset-format');
      if (resetFormatBtn) {
        resetFormatBtn.addEventListener('click', function() {
          if (confirm('確定要將所有設定還原到 BV 原始預設值嗎？\n\n此操作無法復原。')) {
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
            
            // 重新抓取產品資料
            extractProductData();
            
            // 根據原始偵測的樣式設定預設值
            const defaultsWithOriginalLayout = {
              ...completeDefaultSettings,
              layout: originalLayout
            };
            
            // 如果原始樣式有特定的預設值，使用它們
            if (layoutTemplates[originalLayout]) {
              const template = layoutTemplates[originalLayout];
              if (template.barcodeHeight !== undefined) {
                defaultsWithOriginalLayout.barcodeHeight = template.barcodeHeight;
              }
              if (template.barcodeWidth !== undefined) {
                defaultsWithOriginalLayout.barcodeWidth = template.barcodeWidth;
              }
              if (template.barcodeYPosition !== undefined) {
                defaultsWithOriginalLayout.barcodeYPosition = template.barcodeYPosition;
              }
            }
            
            // 切換回原始樣式
            currentLayout = originalLayout;
            
            // 應用設定
            applySavedSettings(defaultsWithOriginalLayout);
            
            // 重建標籤內容
            applyLayoutTemplate();
            
            // 清除預設選擇
            const presetSelect = document.getElementById('bv-preset-select');
            if (presetSelect) presetSelect.value = '';
            
            // 清除記錄
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
          barcodeTextLineHeight: barcodeTextLineHeightSlider ? barcodeTextLineHeightSlider.value : 10,
          barcodeHeight: barcodeHeight.value,
          barcodeWidth: barcodeWidth.value,
          barcodeYPosition: barcodeYPosition ? barcodeYPosition.value : 70,
          // 間距設定
          specGap: specGapSlider ? specGapSlider.value : 0,
          priceGap: priceGapSlider ? priceGapSlider.value : 0,
          barcodeGap: barcodeGapSlider ? barcodeGapSlider.value : 0,
          skuGap: skuGapSlider ? skuGapSlider.value : 0,
          labelWidth: labelWidth.value,
          labelHeight: labelHeight.value,
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
        if (barcodeTextLineHeightSlider) {
          barcodeTextLineHeightSlider.value = settings.barcodeTextLineHeight !== undefined ? settings.barcodeTextLineHeight : completeDefaultSettings.barcodeTextLineHeight;
        }
        
        barcodeHeight.value = settings.barcodeHeight !== undefined ? settings.barcodeHeight : completeDefaultSettings.barcodeHeight;
        barcodeWidth.value = settings.barcodeWidth !== undefined ? settings.barcodeWidth : completeDefaultSettings.barcodeWidth;
        if (barcodeYPosition) {
          barcodeYPosition.value = settings.barcodeYPosition !== undefined ? settings.barcodeYPosition : completeDefaultSettings.barcodeYPosition;
        }
        
        // 載入間距設定
        if (specGapSlider) {
          specGapSlider.value = settings.specGap !== undefined ? settings.specGap : completeDefaultSettings.specGap;
        }
        if (priceGapSlider) {
          priceGapSlider.value = settings.priceGap !== undefined ? settings.priceGap : completeDefaultSettings.priceGap;
        }
        if (barcodeGapSlider) {
          barcodeGapSlider.value = settings.barcodeGap !== undefined ? settings.barcodeGap : completeDefaultSettings.barcodeGap;
        }
        if (skuGapSlider) {
          skuGapSlider.value = settings.skuGap !== undefined ? settings.skuGap : completeDefaultSettings.skuGap;
        }
        
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
      
      /* 匯出設定檔功能 */
      const exportSettingsBtn = document.getElementById('bv-export-settings');
      if (exportSettingsBtn) {
        exportSettingsBtn.addEventListener('click', function() {
          const settings = saveCurrentSettings();
          const allPresets = getSettingsFromLocal('presetList') || [];
          const presets = {};
          
          // 收集所有預設
          allPresets.forEach(name => {
            const preset = getSettingsFromLocal('preset_' + name);
            if (preset) {
              presets[name] = preset;
            }
          });
          
          const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            currentSettings: settings,
            presets: presets,
            presetList: allPresets
          };
          
          const dataStr = JSON.stringify(exportData, null, 2);
          const dataBlob = new Blob([dataStr], {type: 'application/json'});
          
          const link = document.createElement('a');
          link.href = URL.createObjectURL(dataBlob);
          link.download = `BV_條碼設定檔_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.json`;
          link.click();
          
          URL.revokeObjectURL(link.href);
          showNotification('設定檔已匯出');
        });
      }
      
      /* 匯入設定檔功能 */
      const importSettingsBtn = document.getElementById('bv-import-settings');
      const importFileInput = document.getElementById('bv-import-file');
      
      if (importSettingsBtn && importFileInput) {
        importSettingsBtn.addEventListener('click', function() {
          importFileInput.click();
        });
        
        importFileInput.addEventListener('change', function(e) {
          const file = e.target.files[0];
          if (file && file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = function(event) {
              try {
                const importData = JSON.parse(event.target.result);
                
                if (!importData.version || !importData.currentSettings) {
                  showNotification('無效的設定檔格式', 'warning');
                  return;
                }
                
                if (confirm('確定要匯入設定檔嗎？\n\n這將覆蓋目前的所有設定和預設。')) {
                  // 匯入預設列表
                  if (importData.presetList) {
                    saveSettingsToLocal('presetList', importData.presetList);
                  }
                  
                  // 匯入所有預設
                  if (importData.presets) {
                    Object.keys(importData.presets).forEach(name => {
                      saveSettingsToLocal('preset_' + name, importData.presets[name]);
                    });
                  }
                  
                  // 載入當前設定
                  applySavedSettings(importData.currentSettings);
                  
                  // 重新載入預設列表
                  loadPresetList();
                  
                  showNotification('設定檔已成功匯入');
                }
              } catch (error) {
                console.error('匯入失敗：', error);
                showNotification('設定檔格式錯誤', 'warning');
              }
            };
            reader.readAsText(file);
          } else {
            showNotification('請選擇 JSON 格式的設定檔', 'warning');
          }
          
          // 清空選擇，允許重複選擇同一檔案
          e.target.value = '';
        });
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
      
      /* 載入初始設定 - 修正：優先使用原始樣式 */
      function loadInitialSettings() {
        // 根據原始偵測的樣式設定預設值
        const defaultsWithOriginalLayout = {
          ...completeDefaultSettings,
          layout: originalLayout
        };
        
        // 如果原始樣式有特定的預設值，使用它們
        if (layoutTemplates[originalLayout]) {
          const template = layoutTemplates[originalLayout];
          if (template.barcodeHeight !== undefined) {
            defaultsWithOriginalLayout.barcodeHeight = template.barcodeHeight;
          }
          if (template.barcodeWidth !== undefined) {
            defaultsWithOriginalLayout.barcodeWidth = template.barcodeWidth;
          }
          if (template.barcodeYPosition !== undefined) {
            defaultsWithOriginalLayout.barcodeYPosition = template.barcodeYPosition;
          }
        }
        
        // 套用設定
        applySavedSettings(defaultsWithOriginalLayout);
        
        // 確保正確的樣式被選中
        currentLayout = originalLayout;
        const styleNameElement = document.querySelector('.bv-current-style-name');
        if (styleNameElement) {
          styleNameElement.textContent = layoutTemplates[currentLayout].name;
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
