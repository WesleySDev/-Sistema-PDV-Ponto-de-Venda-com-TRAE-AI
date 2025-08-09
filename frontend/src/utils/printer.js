// Utilitário para impressão de nota fiscal

/**
 * Verifica se há uma impressora disponível (especialmente impressoras térmicas)
 * @returns {Promise<boolean>} true se há impressora disponível
 */
export const isPrinterAvailable = async () => {
  try {
    // Verifica se a API de impressão está disponível no navegador
    if (!('print' in window)) {
      return false;
    }

    // Tenta detectar impressoras usando a API moderna do navegador
    if ('navigator' in window && 'mediaDevices' in navigator) {
      try {
        // Verifica se há dispositivos de mídia (pode incluir impressoras USB)
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('Dispositivos detectados:', devices.length);
      } catch (e) {
        console.log('Não foi possível enumerar dispositivos:', e.message);
      }
    }

    // Verifica se há impressoras configuradas no sistema
    // Tenta imprimir uma página de teste invisível para verificar se há impressoras
    if ('matchMedia' in window) {
      const printMedia = window.matchMedia('print');
      console.log('Suporte a impressão:', printMedia.matches !== undefined);
    }

    // Verifica se há suporte a Web USB (para impressoras térmicas USB)
    if ('usb' in navigator) {
      try {
        // Não solicita permissão automaticamente, apenas verifica se a API está disponível
        console.log('API Web USB disponível para impressoras térmicas');
        return true;
      } catch (e) {
        console.log('Web USB não disponível:', e.message);
      }
    }

    // Verifica se há suporte a Serial API (para impressoras seriais)
    if ('serial' in navigator) {
      try {
        console.log('API Serial disponível para impressoras térmicas');
        return true;
      } catch (e) {
        console.log('Serial API não disponível:', e.message);
      }
    }

    // Fallback: sempre retorna true se window.print está disponível
    return true;
  } catch (error) {
    console.error('Erro ao verificar impressora:', error);
    return false;
  }
};

/**
 * Detecta impressoras térmicas conectadas via USB
 * @returns {Promise<boolean>} true se detectou impressora térmica
 */
export const detectThermalPrinter = async () => {
  try {
    if (!('usb' in navigator)) {
      console.log('Web USB não suportado neste navegador');
      return false;
    }

    // IDs de fornecedores comuns de impressoras térmicas
    const thermalPrinterVendors = [
      0x04b8, // Epson
      0x0519, // Star Micronics
      0x0fe6, // ICS Advent
      0x20d1, // Rongta
      0x0dd4, // Custom Engineering
      0x154f, // SNBC
      0x0483, // STMicroelectronics (algumas impressoras)
      0x1fc9, // NXP (algumas impressoras)
      0x1a86, // QinHeng Electronics (CH340/CH341)
      0x0403, // FTDI (conversores USB-Serial)
    ];

    // Verifica dispositivos USB já conectados
    const devices = await navigator.usb.getDevices();
    for (const device of devices) {
      if (thermalPrinterVendors.includes(device.vendorId)) {
        console.log('Impressora térmica detectada:', {
          vendorId: device.vendorId.toString(16),
          productId: device.productId.toString(16),
          productName: device.productName || 'Desconhecido'
        });
        return true;
      }
    }

    console.log('Nenhuma impressora térmica USB detectada');
    return false;
  } catch (error) {
    console.error('Erro ao detectar impressora térmica:', error);
    return false;
  }
};

/**
 * Gera o HTML da nota fiscal
 * @param {Object} saleData - Dados da venda
 * @param {Array} cartItems - Itens do carrinho
 * @param {Object} totals - Totais da venda
 * @returns {string} HTML da nota fiscal
 */
const generateReceiptHTML = (saleData, cartItems, totals) => {
  const currentDate = new Date().toLocaleString('pt-BR');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Nota Fiscal - Venda</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; font-family: 'Courier New', monospace; }
          .no-print { display: none; }
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          max-width: 300px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .receipt-title {
          font-size: 14px;
          font-weight: bold;
          margin: 10px 0;
        }
        .info-line {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }
        .items-header {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 5px 0;
          font-weight: bold;
          margin: 10px 0;
        }
        .item-line {
          margin: 3px 0;
          padding: 2px 0;
        }
        .item-name {
          font-weight: bold;
        }
        .item-details {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        .totals {
          border-top: 2px solid #000;
          padding-top: 10px;
          margin-top: 15px;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }
        .final-total {
          font-weight: bold;
          font-size: 14px;
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #000;
          font-size: 10px;
        }
        .payment-info {
          margin: 10px 0;
          padding: 5px 0;
          border-top: 1px solid #000;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">🛒 SISTEMA PDV</div>
        <div>Ponto de Venda</div>
        <div class="receipt-title">CUPOM FISCAL</div>
      </div>
      
      <div class="info-line">
        <span>Data/Hora:</span>
        <span>${currentDate}</span>
      </div>
      
      <div class="info-line">
        <span>Vendedor:</span>
        <span>${saleData.vendedor || 'Sistema'}</span>
      </div>
      
      <div class="items-header">
        ITENS DA VENDA
      </div>
      
      ${cartItems.map((item, index) => `
        <div class="item-line">
          <div class="item-name">${index + 1}. ${item.name}</div>
          <div class="item-details">
            <span>Qtd: ${item.quantity}</span>
            <span>Unit: R$ ${item.price.toFixed(2).replace('.', ',')}</span>
            <span>Total: R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
          </div>
          <div style="font-size: 10px; color: #666;">Cód: ${item.barcode || item.id}</div>
        </div>
      `).join('')}
      
      <div class="totals">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>R$ ${totals.subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
        
        ${totals.discount > 0 ? `
          <div class="total-line">
            <span>Desconto (${totals.discountPercentage}%):</span>
            <span>- R$ ${totals.discountAmount.toFixed(2).replace('.', ',')}</span>
          </div>
        ` : ''}
        
        <div class="total-line final-total">
          <span>TOTAL:</span>
          <span>R$ ${totals.total.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>
      
      <div class="payment-info">
        <div class="total-line">
          <span>Forma de Pagamento:</span>
          <span>${getPaymentMethodLabel(saleData.payment_method)}</span>
        </div>
        
        ${saleData.payment_method === 'dinheiro' && saleData.amount_received ? `
          <div class="total-line">
            <span>Valor Recebido:</span>
            <span>R$ ${saleData.amount_received.toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="total-line">
            <span>Troco:</span>
            <span>R$ ${totals.change.toFixed(2).replace('.', ',')}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <div>Obrigado pela preferência!</div>
        <div>Sistema PDV - ${currentDate}</div>
      </div>
      
      <script>
        // Auto-imprimir quando a página carregar
        window.onload = function() {
          window.print();
          // Fechar a janela após impressão (opcional)
          setTimeout(() => {
            window.close();
          }, 1000);
        };
      </script>
    </body>
    </html>
  `;
};

/**
 * Converte método de pagamento para label
 * @param {string} method - Método de pagamento
 * @returns {string} Label do método
 */
const getPaymentMethodLabel = (method) => {
  switch (method) {
    case 'dinheiro': return 'Dinheiro';
    case 'cartao_credito': return 'Cartão de Crédito';
    case 'cartao_debito': return 'Cartão de Débito';
    case 'pix': return 'PIX';
    default: return method;
  }
};

/**
 * Imprime a nota fiscal
 * @param {Object} saleData - Dados da venda
 * @param {Array} cartItems - Itens do carrinho
 * @param {Object} totals - Totais da venda
 * @returns {Promise<boolean>} true se a impressão foi iniciada com sucesso
 */
export const printReceipt = async (saleData, cartItems, totals) => {
  try {
    if (!isPrinterAvailable()) {
      console.warn('Impressora não disponível');
      return false;
    }

    // Gerar HTML da nota fiscal
    const receiptHTML = generateReceiptHTML(saleData, cartItems, totals);
    
    // Tentar criar uma nova janela para impressão
    let printWindow;
    try {
      printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes');
    } catch (popupError) {
      console.warn('Popup bloqueado, usando método alternativo:', popupError.message);
      printWindow = null;
    }
    
    if (!printWindow) {
      console.warn('Janela de impressão bloqueada, usando impressão direta');
      // Fallback: usar impressão direta na mesma janela
      return await printReceiptDirect(saleData, cartItems, totals);
    }
    
    // Escrever o HTML na nova janela
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Aguardar o carregamento e imprimir
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
    
    return true;
  } catch (error) {
    console.error('Erro ao imprimir nota fiscal:', error);
    // Tentar método alternativo em caso de erro
    try {
      return await printReceiptDirect(saleData, cartItems, totals);
    } catch (fallbackError) {
      console.error('Erro no método alternativo:', fallbackError);
      return false;
    }
  }
};

/**
 * Imprime nota fiscal usando a API nativa do navegador (alternativa)
 * @param {Object} saleData - Dados da venda
 * @param {Array} cartItems - Itens do carrinho
 * @param {Object} totals - Totais da venda
 * @returns {Promise<boolean>} true se a impressão foi iniciada com sucesso
 */
export const printReceiptDirect = async (saleData, cartItems, totals) => {
  try {
    if (!isPrinterAvailable()) {
      console.warn('Impressora não disponível');
      return false;
    }

    // Criar elemento temporário com o conteúdo da nota fiscal
    const printContent = document.createElement('div');
    printContent.innerHTML = generateReceiptHTML(saleData, cartItems, totals);
    
    // Adicionar ao DOM temporariamente
    document.body.appendChild(printContent);
    
    // Imprimir
    window.print();
    
    // Remover elemento temporário
    document.body.removeChild(printContent);
    
    return true;
  } catch (error) {
    console.error('Erro ao imprimir nota fiscal diretamente:', error);
    return false;
  }
};

/**
 * Mostra preview da nota fiscal (para teste)
 * @param {Object} saleData - Dados da venda
 * @param {Array} cartItems - Itens do carrinho
 * @param {Object} totals - Totais da venda
 */
export const previewReceipt = (saleData, cartItems, totals) => {
  const receiptHTML = generateReceiptHTML(saleData, cartItems, totals);
  const previewWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes');
  
  if (previewWindow) {
    previewWindow.document.write(receiptHTML);
    previewWindow.document.close();
  }
};