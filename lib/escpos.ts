// ESC/POS Command Builder and Web Transmission Library â€” Rubber Estate POS
// Ported from the original Vite project (src/lib/escpos.ts)

class EscPosBuilder {
  private chunks: Uint8Array[] = [];
  private encoder = new TextEncoder();

  addBytes(bytes: number[] | Uint8Array) {
    this.chunks.push(new Uint8Array(bytes));
  }

  addText(text: string) {
    this.chunks.push(this.encoder.encode(text));
  }

  addLine(text: string = '') {
    this.addText(text + '\n');
  }

  initialize() {
    this.addBytes([0x1b, 0x40]); // ESC @
  }

  alignLeft() {
    this.addBytes([0x1b, 0x61, 0x00]); // ESC a 0
  }

  alignCenter() {
    this.addBytes([0x1b, 0x61, 0x01]); // ESC a 1
  }

  alignRight() {
    this.addBytes([0x1b, 0x61, 0x02]); // ESC a 2
  }

  boldOn() {
    this.addBytes([0x1b, 0x45, 0x01]); // ESC E 1
  }

  boldOff() {
    this.addBytes([0x1b, 0x45, 0x00]); // ESC E 0
  }

  doubleSizeOn() {
    this.addBytes([0x1d, 0x21, 0x11]); // GS ! 0x11 (double height & width)
  }

  doubleSizeOff() {
    this.addBytes([0x1d, 0x21, 0x00]); // GS ! 0x00 (normal size)
  }

  feedAndCut() {
    this.addBytes([0x1b, 0x64, 0x03]); // ESC d 3 (feed 3 lines)
    this.addBytes([0x1d, 0x56, 0x42, 0x00]); // GS V 66 0 (feed to cut + full cut)
  }

  build(): Uint8Array {
    let totalLength = 0;
    for (const chunk of this.chunks) totalLength += chunk.length;
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
}

export interface TaxConfig {
  ssclPercentage: number;
  vatPercentage: number;
  counterServiceCharge: number;
  waiterServiceCharge: number;
  refundPin: string;
  printerType: 'mock' | 'webusb' | 'webserial' | 'browser' | 'network';
  networkIp?: string;
  networkPort?: number;
  paperWidth: '80mm' | '58mm';
  autoPrintReceipt: boolean;
  autoKickDrawer: boolean;
  drawerPin: number;
  receiptLogoUrl?: string;
  receiptLogoEsc?: number[];
  receiptName: string;
  receiptSubtitle: string;
  receiptAddress: string;
  receiptPhone: string;
  receiptFooter: string;
  receiptTaxRegNo: string;
  enableServiceCharge_Takeaway?: boolean;
  enableServiceCharge_DineIn?: boolean;
  enableServiceCharge_Online?: boolean;
  enableSSCL_Takeaway?: boolean;
  enableSSCL_DineIn?: boolean;
  enableSSCL_Online?: boolean;
  enableVAT_Takeaway?: boolean;
  enableVAT_DineIn?: boolean;
  enableVAT_Online?: boolean;
  storeStatusOverride?: 'auto' | 'open' | 'closed';
  autoOpenTime?: string;
  autoCloseTime?: string;
  googlePlacesApiKey?: string;
  googlePlaceId?: string;
  landingActivities?: { title: string; description: string; image: string }[];
  landingGallery?: { src: string; alt: string; size: 'large' | 'medium' }[];
  landingHoursList?: { label: string; hours: string }[];
  landingHoursBanner?: string;
  landingHeroImage?: string;
  enableCustomerDiscount?: boolean;
  customerDiscountAmount?: number;
}

export const generateEscPosImage = (base64Url: string): Promise<number[]> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const targetWidth = 200;
      const ratio = targetWidth / img.width;
      const targetHeight = Math.round(img.height * ratio);
      const width = Math.ceil(targetWidth / 8) * 8;
      const height = targetHeight;
      canvas.width = width;
      canvas.height = height;
      if (!ctx) return resolve([]);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, (width - targetWidth) / 2, 0, targetWidth, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const rasterBytes: number[] = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x += 8) {
          let byte = 0;
          for (let b = 0; b < 8; b++) {
            const i = (y * width + x + b) * 4;
            if (i < data.length) {
              const r = data[i];
              const g = data[i + 1];
              const b_color = data[i + 2];
              const a = data[i + 3];
              const brightness = (r + g + b_color) / 3;
              if (brightness < 128 && a > 128) {
                byte |= (1 << (7 - b));
              }
            }
          }
          rasterBytes.push(byte);
        }
      }
      const xL = (width / 8) % 256;
      const xH = Math.floor((width / 8) / 256);
      const yL = height % 256;
      const yH = Math.floor(height / 256);
      resolve([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH, ...rasterBytes]);
    };
    img.onerror = () => resolve([]);
    img.src = base64Url;
  });
};

export const compileReceiptESC = (
  order: any,
  config: TaxConfig,
  cashierName: string,
  isCopy: boolean = false,
  isUnpaid: boolean = false,
): Uint8Array => {
  const builder = new EscPosBuilder();
  builder.initialize();

  // Header
  builder.alignCenter();
  if (config.receiptLogoEsc && config.receiptLogoEsc.length > 0) {
    builder.addBytes(config.receiptLogoEsc);
  }
  builder.boldOn();
  builder.doubleSizeOn();
  builder.addLine(config.receiptName || 'RUBBER ESTATE');
  builder.doubleSizeOff();
  if (config.receiptSubtitle) builder.addLine(config.receiptSubtitle);
  builder.boldOff();
  if (config.receiptAddress) builder.addLine(config.receiptAddress);
  if (config.receiptPhone) builder.addLine(`Tel: ${config.receiptPhone}`);

  const is80 = config.paperWidth === '80mm';
  const width = is80 ? 48 : 32;
  const lineChar = is80 ? '=' : '-';
  builder.addLine(lineChar.repeat(width));

  if (order.status === 'Refunded') {
    builder.boldOn();
    builder.addLine('*** REFUND RECEIPT ***');
    builder.boldOff();
    builder.addLine(lineChar.repeat(width));
  } else if (isCopy) {
    builder.boldOn();
    builder.addLine('*** DUPLICATE COPY ***');
    builder.boldOff();
    builder.addLine(lineChar.repeat(width));
  } else if (isUnpaid) {
    builder.boldOn();
    builder.addLine('*** UNPAID BILL ***');
    builder.boldOff();
    builder.addLine(lineChar.repeat(width));
  }

  // Metadata
  builder.alignLeft();
  builder.addLine(`Order: ${order.orderNumber}`);
  builder.addLine(`Date : ${new Date(order.timestamp).toLocaleString()}`);
  builder.addLine(`Staff: ${cashierName}`);
  if (order.customerName) {
    builder.addLine(`Cust : ${order.customerName}`);
  }
  builder.addLine(`Type : ${order.type} Service`);
  builder.addLine(lineChar.repeat(width));

  // Items Header
  builder.boldOn();
  if (is80) {
    builder.addLine('Item Name                 Qty   Price   Subtotal');
  } else {
    builder.addLine('Item Name       Qty  Price   Sub');
  }
  builder.boldOff();
  builder.addLine(lineChar.repeat(width));

  // Items List
  order.items.forEach((item: any) => {
    const qtyStr = item.quantity.toString();
    const priceStr = item.price.toFixed(0);
    const subStr = (item.price * item.quantity).toFixed(0);
    let fullName = item.name.replace(/\(?\bSmall\b\)?/ig, '(S)')
                            .replace(/\(?\bMedium\b\)?/ig, '(M)')
                            .replace(/\(?\bLarge\b\)?/ig, '(L)');
    if (item.size && item.size !== 'Regular') {
      const sizeStr = `(${item.size.charAt(0).toUpperCase()})`;
      if (!fullName.includes(sizeStr)) {
        fullName += ` ${sizeStr}`;
      }
    }

    if (is80) {
      const name = fullName.substring(0, 24).padEnd(25, ' ');
      const qty = qtyStr.padStart(4, ' ') + ' ';
      const price = priceStr.padStart(7, ' ') + ' ';
      const sub = subStr.padStart(10, ' ');
      builder.addLine(`${name}${qty}${price}${sub}`);
      if (fullName.length > 24) builder.addLine(`  ${fullName.substring(24)}`);
    } else {
      const name = fullName.substring(0, 14).padEnd(15, ' ');
      const qty = qtyStr.padStart(3, ' ') + ' ';
      const price = priceStr.padStart(5, ' ') + ' ';
      const sub = subStr.padStart(7, ' ');
      builder.addLine(`${name}${qty}${price}${sub}`);
      if (fullName.length > 14) builder.addLine(`  ${fullName.substring(14)}`);
    }
  });

  builder.addLine(lineChar.repeat(width));

  // Totals
  builder.alignRight();
  const formatTotalLine = (label: string, value: number) => {
    const valStr = `Rs. ${value.toFixed(2)}`;
    const pad = width - label.length;
    return `${label}${valStr.padStart(pad, ' ')}`;
  };

  const foodSubtotal = order.items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0,
  );

  const applyServiceCharge = order.applyServiceCharge !== false;
  
  // Resolve toggles for this order type
  const isType = (t: string) => order.type === t;
  const typeScEnabled = isType('Dine in') ? config.enableServiceCharge_DineIn : isType('Online') ? config.enableServiceCharge_Online : config.enableServiceCharge_Takeaway;
  const typeSsclEnabled = isType('Dine in') ? config.enableSSCL_DineIn : isType('Online') ? config.enableSSCL_Online : config.enableSSCL_Takeaway;
  const typeVatEnabled = isType('Dine in') ? config.enableVAT_DineIn : isType('Online') ? config.enableVAT_Online : config.enableVAT_Takeaway;

  const serviceChargePercent =
    applyServiceCharge && typeScEnabled
      ? order.type === 'Dine in'
        ? config.waiterServiceCharge
        : config.counterServiceCharge
      : 0;
      
  const serviceCharge = (foodSubtotal * serviceChargePercent) / 100;
  if (typeScEnabled && serviceCharge > 0) {
    builder.addLine(formatTotalLine(`Service Charge (${serviceChargePercent}%): `, serviceCharge));
  }

  const amountForSSCL = foodSubtotal + serviceCharge;
  const sscl = typeSsclEnabled ? amountForSSCL * (config.ssclPercentage / 100) : 0;
  if (typeSsclEnabled && sscl > 0) {
    builder.addLine(formatTotalLine(`SSCL (${config.ssclPercentage}%): `, sscl));
  }

  const amountForVAT = amountForSSCL + sscl;
  const vat = typeVatEnabled ? amountForVAT * (config.vatPercentage / 100) : 0;
  if (typeVatEnabled && vat > 0) {
    builder.addLine(formatTotalLine(`VAT (${config.vatPercentage}%): `, vat));
  }

  if (order.discount && order.discount > 0) {
    builder.addLine(formatTotalLine(`Customer Discount: `, -order.discount));
  }

  builder.addLine(lineChar.repeat(width));
  builder.boldOn();
  builder.addLine(formatTotalLine('TOTAL AMOUNT: ', order.total));
  builder.boldOff();
  builder.addLine(lineChar.repeat(width));

  if (order.paymentMethod === 'Cash') {
    builder.addLine(formatTotalLine('Cash Received: ', order.cashReceived || 0));
    builder.addLine(formatTotalLine('Change Due:    ', order.changeDue || 0));
    builder.addLine(lineChar.repeat(width));
  } else if (order.paymentMethod) {
    builder.addLine(`Payment Method: ${order.paymentMethod.replace(/\|/g, ', ')}`);
    builder.addLine(lineChar.repeat(width));
  }

  if (order.status === 'Refunded' && order.refundDetails) {
    builder.alignLeft();
    builder.boldOn();
    builder.addLine('REFUND DETAILS:');
    builder.boldOff();
    builder.addLine(`Amount: Rs. ${order.refundDetails.amount.toFixed(2)}`);
    builder.addLine(`Reason: ${order.refundDetails.reason}`);
    builder.addLine(`Customer: ${order.refundDetails.customerName}`);
    if (order.refundDetails.customerPhone) {
      builder.addLine(`Phone: ${order.refundDetails.customerPhone}`);
    }
    builder.addLine(lineChar.repeat(width));
  }

  if (order.notes) {
    builder.alignLeft();
    builder.boldOn();
    builder.addLine('Notes / Instructions:');
    builder.boldOff();
    builder.addLine(order.notes);
    builder.addLine(lineChar.repeat(width));
  }

  // Footer
  builder.alignCenter();
  if (config.receiptFooter) {
    builder.addLine(config.receiptFooter);
  } else {
    builder.addLine('THANK YOU FOR YOUR PATRONAGE!');
    builder.addLine('Please come again.');
  }
  if (config.receiptTaxRegNo) {
    builder.addLine(`Tax Reg No: ${config.receiptTaxRegNo}`);
  }
  builder.addLine('Software: RubberEstatePOS v2.0');
  builder.feedAndCut();

  return builder.build();
};

export const getDrawerKickBytes = (pin: number = 0): Uint8Array => {
  switch (pin) {
    case 1:
      return new Uint8Array([0x1b, 0x70, 0x01, 0x19, 0xfa]);
    case 2:
      return new Uint8Array([0x1b, 0x70, 0x30, 0x19, 0xfa]);
    case 3:
      return new Uint8Array([0x1b, 0x70, 0x31, 0x19, 0xfa]);
    case 4:
      return new Uint8Array([0x07]);
    case 5:
      return new Uint8Array([0x1b, 0x07, 0x0b, 0x37, 0x0b]);
    case 0:
    default:
      return new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);
  }
};

const withTimeout = <T>(promise: Promise<T>, ms = 2000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
};

export const writeToWebUSB = async (device: USBDevice, bytes: Uint8Array): Promise<void> => {
  await withTimeout((async () => {
    try {
      if (!device.opened) await device.open();
    } catch (e: any) {
      console.warn('USB Open error (might already be open):', e);
      if (!device.opened) {
        throw new Error(`Failed to open USB device. Ensure no other app is using it, and that the WinUSB driver is installed via Zadig (Windows). Detail: ${e.message}`);
      }
    }
    
    try {
      if (device.configuration === null) await device.selectConfiguration(1);
      await device.claimInterface(0);
    } catch (e: any) {
      console.warn('USB Config/Claim error:', e);
      throw new Error(`Failed to claim USB interface. Detail: ${e.message}`);
    }

    let endpointNumber = -1;
    const interfaces = device.configuration?.interfaces || [];
    for (const iface of interfaces) {
      for (const alt of iface.alternates || []) {
        for (const ep of alt.endpoints || []) {
          if (ep.direction === 'out' && ep.type === 'bulk') {
            endpointNumber = ep.endpointNumber;
            break;
          }
        }
        if (endpointNumber !== -1) break;
      }
      if (endpointNumber !== -1) break;
    }

    if (endpointNumber === -1) {
      throw new Error('Could not find Bulk OUT endpoint on the paired printer.');
    }

    await device.transferOut(endpointNumber, bytes as any);
  })(), 3000); // 3 second timeout for USB ops
};

export const writeToWebSerial = async (port: any, bytes: Uint8Array): Promise<void> => {
  await withTimeout((async () => {
    try {
      // Don't error if already open
      await port.open({ baudRate: 9600 });
    } catch (e) {
      console.warn('Serial Open error:', e);
    }
    const writer = port.writable.getWriter();
    await writer.write(bytes);
    writer.releaseLock();
  })(), 3000); // 3 second timeout
};

export const compileShortcutsESC = (config: TaxConfig): Uint8Array => {
  const builder = new EscPosBuilder();
  builder.initialize();

  // Header
  builder.alignCenter();
  builder.boldOn();
  builder.doubleSizeOn();
  builder.addLine('POS SHORTCUTS');
  builder.doubleSizeOff();
  builder.boldOff();

  const is80 = config.paperWidth === '80mm';
  const width = is80 ? 48 : 32;
  const lineChar = is80 ? '=' : '-';
  builder.addLine(lineChar.repeat(width));

  builder.alignLeft();
  builder.addLine('F8     : Search Menu');
  builder.addLine('F9     : Open Checkout');
  builder.addLine('Enter  : Confirm Payment');
  builder.addLine('1      : Full Cash');
  builder.addLine('2      : Full Card');
  builder.addLine('3      : Full QR');
  builder.addLine('F4     : Clear Cart');
  builder.addLine('Esc    : Close Modals');
  builder.addLine('F1     : New Order Tab');
  builder.addLine('F2     : Unpaid Tab');
  builder.addLine('F3     : History Tab');
  builder.addLine('S/M/L  : Select Size (in popup)');
  builder.addLine('D/T/O  : Order Type (Dine/Take/Onl)');
  builder.addLine(lineChar.repeat(width));
  builder.alignCenter();
  builder.addLine('Keep this cheat sheet handy!');
  builder.feedAndCut();

  return builder.build();
};

export const printHTMLShortcuts = (config: TaxConfig) => {
  const w = window.open('', '_blank', 'width=350,height=500');
  if (!w) return alert('Pop-up blocked! Allow pop-ups to print receipts.');

  const is80 = config.paperWidth === '80mm';
  const maxWidth = is80 ? '300px' : '200px';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>POS Shortcuts</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 0; padding: 10px; color: #000; }
          .receipt { width: 100%; max-width: \${maxWidth}; margin: 0 auto; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .title { font-size: 16px; margin-bottom: 5px; }
          .line { border-bottom: 1px dashed #000; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="center bold title">POS SHORTCUTS</div>
          <div class="line"></div>
          <div class="row"><span>F8</span><span>Search Menu</span></div>
          <div class="row"><span>F9</span><span>Open Checkout</span></div>
          <div class="row"><span>Enter</span><span>Confirm Payment</span></div>
          <div class="row"><span>1</span><span>Full Cash</span></div>
          <div class="row"><span>2</span><span>Full Card</span></div>
          <div class="row"><span>3</span><span>Full QR</span></div>
          <div class="row"><span>F4</span><span>Clear Cart</span></div>
          <div class="row"><span>Esc</span><span>Close Modals</span></div>
          <div class="row"><span>F1</span><span>New Order Tab</span></div>
          <div class="row"><span>F2</span><span>Unpaid Tab</span></div>
          <div class="row"><span>F3</span><span>History Tab</span></div>
          <div class="row"><span>S/M/L</span><span>Select Size</span></div>
          <div class="row"><span>D/T/O</span><span>Order Type</span></div>
          <div class="line"></div>
          <div class="center">Keep this cheat sheet handy!</div>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;
  w.document.open();
  w.document.write(html);
  w.document.close();
};

export const printHTMLReceipt = (
  order: any,
  config: TaxConfig,
  cashierName: string,
  isCopy: boolean = false,
  isUnpaid: boolean = false,
) => {
  const printArea = document.createElement('div');
  printArea.id = 'thermal-receipt-print-area';
  if (config.paperWidth === '58mm') {
    printArea.classList.add('width-58mm');
  }

  const foodSubtotal = order.items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0,
  );

  const applyServiceCharge = order.applyServiceCharge !== false;
  
  const isType = (t: string) => order.type === t;
  const typeScEnabled = isType('Dine in') ? config.enableServiceCharge_DineIn : isType('Online') ? config.enableServiceCharge_Online : config.enableServiceCharge_Takeaway;
  const typeSsclEnabled = isType('Dine in') ? config.enableSSCL_DineIn : isType('Online') ? config.enableSSCL_Online : config.enableSSCL_Takeaway;
  const typeVatEnabled = isType('Dine in') ? config.enableVAT_DineIn : isType('Online') ? config.enableVAT_Online : config.enableVAT_Takeaway;

  const serviceChargePercent =
    applyServiceCharge && typeScEnabled
      ? order.type === 'Dine in'
        ? config.waiterServiceCharge
        : config.counterServiceCharge
      : 0;
      
  const serviceCharge = (foodSubtotal * serviceChargePercent) / 100;
  const amountForSSCL = foodSubtotal + serviceCharge;
  const sscl = typeSsclEnabled ? amountForSSCL * (config.ssclPercentage / 100) : 0;
  const amountForVAT = amountForSSCL + sscl;
  const vat = typeVatEnabled ? amountForVAT * (config.vatPercentage / 100) : 0;

  let itemsHtml = '';
  order.items.forEach((item: any) => {
    let fullName = item.name.replace(/\(?\bSmall\b\)?/ig, '(S)')
                            .replace(/\(?\bMedium\b\)?/ig, '(M)')
                            .replace(/\(?\bLarge\b\)?/ig, '(L)');
    if (item.size && item.size !== 'Regular') {
      const sizeStr = `(${item.size.charAt(0).toUpperCase()})`;
      if (!fullName.includes(sizeStr)) {
        fullName += ` ${sizeStr}`;
      }
    }
    itemsHtml += `
      <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
        <span style="flex:1;text-align:left;">${fullName} x${item.quantity}</span>
        <span style="width:80px;text-align:right;">Rs. ${(item.price * item.quantity).toFixed(0)}</span>
      </div>
    `;
  });

  const divider = `<div style="border-bottom:1px dashed black;margin:6px 0;"></div>`;

  printArea.innerHTML = `
    <div style="text-align:center;margin-bottom:8px;">
      ${config.receiptLogoUrl ? `<img src="${config.receiptLogoUrl}" style="max-height:80px;max-width:100%;object-fit:contain;margin-bottom:4px;" alt="Logo" /><br/>` : ''}
      <h2 style="margin:0;font-size:16px;font-weight:bold;">${config.receiptName || 'RUBBER ESTATE'}</h2>
      ${config.receiptSubtitle ? `<div style="font-size:12px;">${config.receiptSubtitle}</div>` : ''}
      ${config.receiptAddress ? `<div style="font-size:11px;">${config.receiptAddress}</div>` : ''}
      ${config.receiptPhone ? `<div style="font-size:11px;">Tel: ${config.receiptPhone}</div>` : ''}
    </div>
    ${divider}
    ${order.status === 'Refunded' ? `<div style="text-align:center;font-weight:bold;font-size:13px;margin:4px 0;color:red;">*** REFUND RECEIPT ***</div>${divider}` : ''}
    ${isCopy && order.status !== 'Refunded' ? `<div style="text-align:center;font-weight:bold;font-size:13px;margin:4px 0;">*** DUPLICATE COPY ***</div>${divider}` : ''}
    ${isUnpaid && order.status !== 'Refunded' ? `<div style="text-align:center;font-weight:bold;font-size:13px;margin:4px 0;">*** UNPAID BILL ***</div>${divider}` : ''}
    <div style="font-size:11px;margin-bottom:4px;line-height:1.3;">
      <div><b>Order:</b> ${order.orderNumber}</div>
      <div><b>Date:</b> ${new Date(order.timestamp).toLocaleString()}</div>
      <div><b>Staff:</b> ${cashierName}</div>
      ${order.customerName ? `<div><b>Cust:</b> ${order.customerName}</div>` : ''}
      <div><b>Type:</b> ${order.type} Service</div>
    </div>
    ${divider}
    <div style="font-size:11px;font-weight:bold;display:flex;justify-content:space-between;margin-bottom:2px;">
      <span style="flex:1;text-align:left;">Item Description</span>
      <span style="width:80px;text-align:right;">Subtotal</span>
    </div>
    ${divider}
    <div style="font-size:11px;line-height:1.3;">${itemsHtml}</div>
    ${divider}
    <div style="font-size:11px;text-align:right;line-height:1.3;">
      <div>Subtotal: Rs. ${foodSubtotal.toFixed(2)}</div>
      ${typeScEnabled && serviceCharge > 0 ? `<div>Service Charge (${serviceChargePercent}%): Rs. ${serviceCharge.toFixed(2)}</div>` : ''}
      ${typeSsclEnabled && sscl > 0 ? `<div>SSCL (${config.ssclPercentage}%): Rs. ${sscl.toFixed(2)}</div>` : ''}
      ${typeVatEnabled && vat > 0 ? `<div>VAT (${config.vatPercentage}%): Rs. ${vat.toFixed(2)}</div>` : ''}
      ${order.discount && order.discount > 0 ? `<div>Customer Discount: -Rs. ${order.discount.toFixed(2)}</div>` : ''}
    </div>
    ${divider}
    <div style="font-size:14px;font-weight:bold;display:flex;justify-content:space-between;">
      <span>TOTAL AMOUNT:</span><span>Rs. ${order.total.toFixed(2)}</span>
    </div>
    ${divider}
    ${
      order.paymentMethod === 'Cash'
        ? `<div style="font-size:11px;text-align:right;line-height:1.3;">
        <div>Cash Received: Rs. ${(order.cashReceived || 0).toFixed(2)}</div>
        <div>Change Due: Rs. ${(order.changeDue || 0).toFixed(2)}</div>
      </div>${divider}`
        : order.paymentMethod
          ? `<div style="font-size:11px;text-align:right;"><div>Payment Method: ${order.paymentMethod.replace(/\|/g, ', ')}</div></div>${divider}`
          : ''
    }
    ${
      order.status === 'Refunded' && order.refundDetails
        ? `<div style="font-size:11px;line-height:1.3;text-align:left;">
            <div style="font-weight:bold;margin-bottom:2px;">REFUND DETAILS:</div>
            <div>Amount: Rs. ${order.refundDetails.amount.toFixed(2)}</div>
            <div>Reason: ${order.refundDetails.reason}</div>
            <div>Customer: ${order.refundDetails.customerName}</div>
            ${order.refundDetails.customerPhone ? `<div>Phone: ${order.refundDetails.customerPhone}</div>` : ''}
          </div>${divider}`
        : ''
    }
    ${order.notes ? `<div style="font-size:11px;line-height:1.3;margin-bottom:4px;"><b>Notes / Instructions:</b><div style="font-style:italic;white-space:pre-wrap;margin-top:2px;">${order.notes}</div></div>${divider}` : ''}
    <div style="text-align:center;font-size:11px;margin-top:10px;line-height:1.3;">
      ${config.receiptFooter ? `<div>${config.receiptFooter}</div>` : '<div>THANK YOU FOR YOUR PATRONAGE!</div><div>Please come again.</div>'}
      ${config.receiptTaxRegNo ? `<div style="margin-top:4px;font-size:9px;color:#555;">Tax Reg No: ${config.receiptTaxRegNo}</div>` : ''}
      <div style="font-size:9px;color:#555;">Software: RubberEstatePOS v2.0</div>
    </div>
  `;

  document.body.appendChild(printArea);
  window.print();
  document.body.removeChild(printArea);
};
export const compileSummaryESC = (stats: any, config: TaxConfig) => {
  const builder = new EscPosBuilder();
  builder.initialize();
  const is80 = config.paperWidth === '80mm';
  const width = is80 ? 48 : 32;
  const lineChar = '-';

  builder.alignCenter();
  builder.boldOn();
  builder.addLine(config.receiptName || 'DAILY SUMMARY REPORT');
  builder.boldOff();
  builder.addLine(`Date: ${new Date().toLocaleString()}`);
  builder.addLine(lineChar.repeat(width));
  builder.alignLeft();

  const formatLine = (label: string, value: string) => {
    const pad = width - label.length;
    return `${label}${value.padStart(pad, ' ')}`;
  };

  builder.addLine(formatLine('Total Revenue:', `Rs. ${stats.totalAmount.toLocaleString()}`));
  builder.addLine(formatLine('Total Orders:', stats.orderCount.toString()));
  builder.addLine(formatLine('Total Refunds:', `Rs. ${stats.refundAmount.toLocaleString()}`));
  builder.addLine(lineChar.repeat(width));
  builder.addLine('PAYMENT METHODS:');
  Object.entries(stats.paymentBreakdown).forEach(([method, amt]: [string, any]) => {
    builder.addLine(formatLine(`  ${method}:`, `Rs. ${Number(amt).toLocaleString()}`));
  });
  builder.addLine(lineChar.repeat(width));
  builder.addLine('TAX & FEES:');
  builder.addLine(formatLine('  VAT:', `Rs. ${(stats.totalVAT || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`));
  builder.addLine(formatLine('  SSCL:', `Rs. ${(stats.totalSSCL || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`));
  builder.addLine(formatLine('  Service Chg:', `Rs. ${(stats.totalServiceCharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`));
  builder.addLine(formatLine('  Discounts:', `Rs. ${(stats.totalDiscount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`));
  builder.addLine(lineChar.repeat(width));
  builder.addLine('ORDER TYPES:');
  builder.addLine(formatLine('  Takeaway:', stats.typeBreakdown.Takeaway.toString()));
  builder.addLine(formatLine('  Dine-In:', stats.typeBreakdown.DineIn.toString()));
  builder.addLine(formatLine('  Online:', stats.typeBreakdown.Online.toString()));

  builder.addLine(lineChar.repeat(width));
  builder.alignCenter();
  builder.addLine('END OF REPORT');
  builder.feedAndCut();
  return builder.build();
};

export const printHTMLSummary = (stats: any, config: TaxConfig) => {
  const printArea = document.createElement('div');
  printArea.id = 'thermal-receipt-print-area';
  if (config.paperWidth === '58mm') {
    printArea.classList.add('width-58mm');
  }

  let paymentHtml = '';
  Object.entries(stats.paymentBreakdown).forEach(([method, amt]: [string, any]) => {
    paymentHtml += `<div style="display:flex;justify-content:space-between;">
      <span>${method}</span><span>Rs. ${Number(amt).toLocaleString()}</span>
    </div>`;
  });

  printArea.innerHTML = `
    <div style="font-family:monospace;font-size:12px;color:#000;background:#fff;padding:10px;">
      <div style="text-align:center;font-weight:bold;font-size:14px;margin-bottom:5px;">
        ${config.receiptName || 'DAILY SUMMARY REPORT'}
      </div>
      <div style="text-align:center;margin-bottom:10px;">Date: ${new Date().toLocaleString()}</div>
      <hr style="border:1px dashed #000;margin:5px 0;" />
      
      <div style="display:flex;justify-content:space-between;font-weight:bold;">
        <span>Total Revenue:</span><span>Rs. ${stats.totalAmount.toLocaleString()}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>Total Orders:</span><span>${stats.orderCount}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>Total Refunds:</span><span>Rs. ${stats.refundAmount.toLocaleString()}</span>
      </div>
      
      <hr style="border:1px dashed #000;margin:5px 0;" />
      <div style="font-weight:bold;margin-bottom:3px;">PAYMENT METHODS:</div>
      ${paymentHtml}
      
      <hr style="border:1px dashed #000;margin:5px 0;" />
      <div style="font-weight:bold;margin-bottom:3px;">TAX & FEES:</div>
      <div style="display:flex;justify-content:space-between;">
        <span>VAT:</span><span>Rs. ${(stats.totalVAT || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>SSCL:</span><span>Rs. ${(stats.totalSSCL || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>Service Charge:</span><span>Rs. ${(stats.totalServiceCharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>Discounts:</span><span>Rs. ${(stats.totalDiscount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      
      <hr style="border:1px dashed #000;margin:5px 0;" />
      <div style="font-weight:bold;margin-bottom:3px;">ORDER TYPES:</div>
      <div style="display:flex;justify-content:space-between;">
        <span>Takeaway:</span><span>${stats.typeBreakdown.Takeaway}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>Dine-In:</span><span>${stats.typeBreakdown.DineIn}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>Online:</span><span>${stats.typeBreakdown.Online}</span>
      </div>
      
      <hr style="border:1px dashed #000;margin:5px 0;" />
      <div style="text-align:center;margin-top:10px;">END OF REPORT</div>
    </div>
  `;

  document.body.appendChild(printArea);
  window.print();
  document.body.removeChild(printArea);
};
