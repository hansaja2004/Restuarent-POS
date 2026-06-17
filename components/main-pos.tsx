'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  Clock,
  CheckCircle,
  FileText,
  CornerDownLeft,
  Download,
  BookOpen,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useConfig } from '@/components/ConfigContext';
import {
  compileReceiptESC,
  getDrawerKickBytes,
  writeToWebUSB,
  writeToWebSerial,
  printHTMLReceipt,
} from '@/lib/escpos';
import { createFullOrder } from '@/app/actions/orders';
import { toggleProductAvailability } from '@/app/actions/products';

// ── Types ──────────────────────────────────────────────────────────────────────

type Session = { userId: number; role: string; username: string };

type Product = {
  id: number;
  name: string;
  price: string;
  categoryId: number;
  imageUrl: string | null;
  smallPrice?: string | null;
  mediumPrice?: string | null;
  largePrice?: string | null;
  isAvailable?: boolean;
};

type Category = { id: number; name: string };

type CartItem = {
  id: string; // `${productId}-${size}`
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  size?: string;
};

type OrderStatus = 'Unpaid' | 'Paid' | 'Refunded';
type PaymentMethod = string; // E.g., 'Cash', 'Card', or 'Cash (500) + Card (1000)'
type OrderType = 'Takeaway' | 'Dine in' | 'Online';

interface SavedOrder {
  id: string;
  orderNumber: string;
  type: OrderType;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  timestamp: number;
  paymentMethod?: PaymentMethod;
  cashReceived?: number;
  changeDue?: number;
  notes?: string;
  isCustomerSelected?: boolean;
  applyServiceCharge?: boolean;
  dbId?: number; // Backend database ID
}

interface RefundLog {
  id: string;
  customerName: string;
  customerPhone: string;
  reason: string;
  amount: number;
  cashierName: string;
  timestamp: number;
  orderNumber: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ORDERS_KEY = 'pos_orders';
const REFUNDS_KEY = 'refund_logs';

const loadOrders = (): SavedOrder[] => {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistOrders = (orders: SavedOrder[]) => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function MainPos({
  products,
  categories,
  session,
  globalOrders = [],
}: {
  products: Product[];
  categories: Category[];
  session: Session;
  globalOrders?: any[];
}) {
  const { config } = useConfig();
  const [isPending, startTransition] = useTransition();

  const isPrivileged = ['admin', 'manager', 'director'].includes(session.role);

  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'New' | 'Unpaid' | 'History'>('New');

  // ── Hardware ─────────────────────────────────────────────────────────────────
  const [activeUsbDevice, setActiveUsbDevice] = useState<USBDevice | null>(null);
  const [activeSerialPort, setActiveSerialPort] = useState<any>(null);

  useEffect(() => {
    if ('usb' in navigator) {
      navigator.usb.getDevices().then((devices) => {
        if (devices.length > 0) setActiveUsbDevice(devices[0]);
      });
    }
    if ('serial' in navigator) {
      (navigator as any).serial.getPorts().then((ports: any[]) => {
        if (ports.length > 0) setActiveSerialPort(ports[0]);
      });
    }
  }, []);

  const handleKickDrawer = async () => {
    if (config.printerType === 'mock') return;
    const bytes = getDrawerKickBytes(config.drawerPin);
    let usbDev = activeUsbDevice;
    if (!usbDev && 'usb' in navigator) {
      const devs = await navigator.usb.getDevices();
      if (devs.length) { usbDev = devs[0]; setActiveUsbDevice(usbDev); }
    }
    if (usbDev) {
      try { await writeToWebUSB(usbDev, bytes); } catch { /* ignore */ }
    }
    let serialPt = activeSerialPort;
    if (!serialPt && 'serial' in navigator) {
      const pts = await (navigator as any).serial.getPorts();
      if (pts.length) { serialPt = pts[0]; setActiveSerialPort(serialPt); }
    }
    if (serialPt) {
      try { await writeToWebSerial(serialPt, bytes); } catch { /* ignore */ }
    }
  };

  const handlePrint = async (order: any, isCopy = false, kickDrawer = false, isUnpaid = false) => {
    try {
      if (config.printerType === 'mock') {
        console.log('Mock print:', order.orderNumber);
        return;
      }
      if (config.printerType === 'browser') {
        if (kickDrawer) {
          // Fire and forget the drawer kick so it doesn't block window.print()
          handleKickDrawer().catch(console.error);
        }
        printHTMLReceipt(order, config, session.username, isCopy, isUnpaid);
        return;
      }
      let bytes = compileReceiptESC(order, config, session.username, isCopy, isUnpaid);
      if (kickDrawer) {
        const kick = getDrawerKickBytes(config.drawerPin);
        const combined = new Uint8Array(kick.length + bytes.length);
        combined.set(kick, 0);
        combined.set(bytes, kick.length);
        bytes = combined;
      }
      if (config.printerType === 'webusb') {
        let dev = activeUsbDevice;
        if (!dev && 'usb' in navigator) {
          const devs = await navigator.usb.getDevices();
          if (devs.length) { dev = devs[0]; setActiveUsbDevice(dev); }
        }
        if (!dev) return alert('No USB printer paired. Go to Settings → Hardware.');
        await writeToWebUSB(dev, bytes);
      } else if (config.printerType === 'webserial') {
        if (!activeSerialPort) return alert('No Serial printer paired. Go to Settings → Hardware.');
        await writeToWebSerial(activeSerialPort, bytes);
      }
    } catch (err: any) {
      alert(`Print failed: ${err.message}`);
    }
  };

  const handleManualDrawerKick = () => {
    if (isPrivileged) {
      handleKickDrawer();
      alert('Cash drawer opened!');
    } else {
      const pin = prompt('Enter Manager Authorization PIN to open cash drawer:');
      if (pin === config.refundPin) {
        handleKickDrawer();
        alert('Cash drawer opened!');
      } else {
        alert('Authorization Denied! Cash drawer remains locked.');
      }
    }
  };

  // ── Menu & Search ─────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const filteredProducts = localProducts.filter((p) => {
    const matchCat = selectedCategory === null || p.categoryId === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Cart ──────────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('Takeaway');
  const [isCustomerSelected, setIsCustomerSelected] = useState(false);
  const [applyServiceCharge, setApplyServiceCharge] = useState(true);

  // ── Size Selector ───────────────────────────────────────────────────────────
  const [selectedProductForSize, setSelectedProductForSize] = useState<Product | null>(null);

  const handleProductClick = (product: Product) => {
    if (product.smallPrice || product.mediumPrice || product.largePrice) {
      setSelectedProductForSize(product);
    } else {
      addToCart(product, parseFloat(product.price));
    }
  };

  const addToCart = (product: Product, price: number, size?: string) => {
    setCart((prev) => {
      const cartItemId = size ? `${product.id}-${size}` : String(product.id);
      const existing = prev.find((i) => i.id === cartItemId);
      if (existing) {
        return prev.map((i) =>
          i.id === cartItemId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          name: size ? `${product.name} (${size})` : product.name,
          price: price,
          quantity: 1,
          imageUrl: product.imageUrl,
          size: size,
        },
      ];
    });
    setSelectedProductForSize(null);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  // ── Tax Calculation ───────────────────────────────────────────────────────────
  const foodSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const hasCharges = !isCustomerSelected;
  const serviceChargePercent =
    applyServiceCharge && hasCharges && config.enableServiceCharge
      ? orderType === 'Dine in'
        ? config.waiterServiceCharge
        : orderType === 'Takeaway' || orderType === 'Online'
        ? config.counterServiceCharge
        : 0
      : 0;
  const serviceCharge = (foodSubtotal * serviceChargePercent) / 100;
  const amountForSSCL = foodSubtotal + serviceCharge;
  const sscl = hasCharges && config.enableSSCL ? (amountForSSCL * config.ssclPercentage) / 100 : 0;
  const amountForVAT = amountForSSCL + sscl;
  const vat = hasCharges ? (amountForVAT * config.vatPercentage) / 100 : 0;
  const finalTotal = foodSubtotal + serviceCharge + sscl + vat;

  // ── Orders ────────────────────────────────────────────────────────────────────
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);

  useEffect(() => {
    // 1. Load any local orders
    const localOrders = loadOrders();
    const localUnpaid = localOrders.filter(o => o.status === 'Unpaid');

    // 2. Map global orders to SavedOrder format
    const mappedGlobal: SavedOrder[] = globalOrders.map((go: any) => ({
      id: go.id.toString(),
      orderNumber: go.orderNumber || `ORD-Sys-${go.id}`,
      type: (go.orderType as OrderType) || 'Takeaway',
      items: go.cartItems || [],
      total: parseFloat(go.totalAmount),
      status: go.status === 'refunded' ? 'Refunded' : 'Paid',
      timestamp: new Date(go.createdAt).getTime(),
      paymentMethod: go.paymentMethod || 'Cash',
      dbId: go.id,
    }));

    // 3. Merge them (Local Unpaid + Global Paid/Refunded)
    // We sort them by timestamp descending
    const merged = [...localUnpaid, ...mappedGlobal].sort((a, b) => b.timestamp - a.timestamp);

    setSavedOrders(merged);
    // Note: We don't persist global orders to localStorage to avoid bloating it,
    // but we can if we want offline history. We will just keep local unpaid in local storage.
  }, [globalOrders]);

  const persistAndSet = (orders: SavedOrder[]) => {
    setSavedOrders(orders);
    // Only persist Unpaid to localStorage so we don't duplicate global data or bloat local storage
    persistOrders(orders.filter(o => o.status === 'Unpaid'));
  };

  const generateOrderNumber = () => {
    const ts = Date.now().toString().slice(-6);
    return `ORD-${ts}-${session.username.slice(0, 4).toUpperCase()}`;
  };

  // ── Checkout Modal ────────────────────────────────────────────────────────────
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentSplits, setPaymentSplits] = useState({ Cash: '', Card: '', QR: '' });
  const [orderNotes, setOrderNotes] = useState('');
  
  // Search state for History Tab
  const [historySearch, setHistorySearch] = useState('');

  const cashGiven = parseFloat(paymentSplits.Cash) || 0;
  const cardGiven = parseFloat(paymentSplits.Card) || 0;
  const qrGiven = parseFloat(paymentSplits.QR) || 0;
  const totalGiven = cashGiven + cardGiven + qrGiven;
  const changeDue = totalGiven - finalTotal;

  const handleSaveUnpaid = () => {
    if (cart.length === 0) return;
    const ordNum = generateOrderNumber();
    const order: SavedOrder = {
      id: Date.now().toString(),
      orderNumber: ordNum,
      type: orderType,
      items: [...cart],
      total: finalTotal,
      status: 'Unpaid',
      timestamp: Date.now(),
      notes: orderNotes || undefined,
      isCustomerSelected: isCustomerSelected || undefined,
      applyServiceCharge: applyServiceCharge,
    };
    
    // Also save unpaid orders to backend if needed, or wait until paid. 
    // Currently unpaid orders are just stored locally until paid.
    // Let's keep it local for now, as it will be sent to the backend when processed from "Unpaid" tab.

    persistAndSet([order, ...savedOrders]);
    if (config.autoPrintReceipt) handlePrint(order, false, false, true);
    else alert('Order saved as UNPAID.');
    setCart([]);
    setOrderNotes('');
    setIsCustomerSelected(false);
  };

  const processPayment = async () => {
    let methodStr = '';
    const parts = [];
    if (cashGiven > 0) parts.push(`Cash`);
    if (cardGiven > 0) parts.push(`Card`);
    if (qrGiven > 0) parts.push(`QR`);
    methodStr = parts.join(' + ') || 'Cash';

    const totalCashInHand = cashGiven;

    const ordNum = generateOrderNumber();
    const order: SavedOrder = {
      id: Date.now().toString(),
      orderNumber: ordNum,
      type: orderType,
      items: [...cart],
      total: finalTotal,
      status: 'Paid',
      timestamp: Date.now(),
      paymentMethod: methodStr,
      cashReceived: totalCashInHand > 0 ? totalCashInHand : 0,
      changeDue: Math.max(changeDue, 0),
      notes: orderNotes || undefined,
      isCustomerSelected: isCustomerSelected || undefined,
      applyServiceCharge: applyServiceCharge,
    };

    // Show loading state or just await it before persisting locally so we get the dbId
    try {
      const dbResult = await createFullOrder({
        orderNumber: ordNum,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price.toFixed(2),
          size: i.size,
        })),
        subtotal: foodSubtotal,
        taxAmount: sscl + vat,
        serviceCharge: serviceCharge,
        discount: 0,
        totalAmount: finalTotal,
        status: 'completed',
        orderType: orderType,
        paymentMethod: methodStr,
        notes: orderNotes,
      });
      if (dbResult?.orderId) {
        order.dbId = dbResult.orderId;
      }
    } catch (e) {
      console.error("Failed to save to DB", e);
    }

    // Persist locally
    persistAndSet([order, ...savedOrders]);

    const kickDrawer = config.autoKickDrawer && cashGiven > 0;
    if (config.autoPrintReceipt) {
      handlePrint(order, false, kickDrawer);
    } else if (kickDrawer) {
      handleKickDrawer();
    }

    setCart([]);
    setShowCheckout(false);
    setPaymentSplits({ Cash: '', Card: '', QR: '' });
    setOrderNotes('');
    setIsCustomerSelected(false);
    // Stay on 'New' tab
  };

  const handlePayUnpaid = (order: SavedOrder) => {
    setCart(order.items);
    setOrderType(order.type);
    persistAndSet(savedOrders.filter((o) => o.id !== order.id));
    setActiveTab('New');
    setShowCheckout(true);
  };

  const handleReprint = (order: SavedOrder) => handlePrint(order, true);

  // ── Refund & Exchange ────────────────────────────────────────────────────────
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedRefundOrder, setSelectedRefundOrder] = useState<SavedOrder | null>(null);
  const [refundForm, setRefundForm] = useState({ 
    name: '', phone: '', reason: '', pin: '', amount: '', method: 'Cash'
  });

  const initiateRefund = (order: SavedOrder) => {
    setSelectedRefundOrder(order);
    setShowRefundModal(true);
    setRefundForm({ name: '', phone: '', reason: '', pin: '', amount: order.total.toString(), method: 'Cash' });
  };

  const executeRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefundOrder) return;
    if (refundForm.pin !== config.refundPin) {
      alert('Invalid Authorization PIN! Refund Denied.');
      return;
    }

    const refundAmt = parseFloat(refundForm.amount);
    if (isNaN(refundAmt) || refundAmt <= 0 || refundAmt > selectedRefundOrder.total) {
      alert('Invalid refund amount!');
      return;
    }

    // Exchange Logic
    if (refundForm.method === 'Exchange') {
      // Add a negative item to the cart representing the store credit
      setCart(prev => [
        ...prev,
        {
          id: `exchange-${Date.now()}`,
          productId: 0,
          name: `[Exchange Credit from ${selectedRefundOrder.orderNumber}]`,
          price: -Math.abs(refundAmt),
          quantity: 1,
        }
      ]);
      setActiveTab('New');
    }

    // Call server action to mark as refunded in DB
    if (selectedRefundOrder.dbId) {
      startTransition(async () => {
        // We import refundOrder dynamically or statically
        const { refundOrder } = await import('@/app/actions/orders');
        await refundOrder(selectedRefundOrder.dbId!, refundAmt, refundForm.method);
      });
    }

    const log: RefundLog = {
      id: Date.now().toString(),
      customerName: refundForm.name,
      customerPhone: refundForm.phone,
      reason: refundForm.reason,
      amount: refundAmt,
      cashierName: session.username,
      timestamp: Date.now(),
      orderNumber: selectedRefundOrder.orderNumber,
    };
    const existing: RefundLog[] = JSON.parse(localStorage.getItem(REFUNDS_KEY) || '[]');
    localStorage.setItem(REFUNDS_KEY, JSON.stringify([log, ...existing]));

    // We only mark the order as fully 'Refunded' locally if the refund amount equals total, otherwise leave as Paid?
    // Let's mark it as Refunded so it shows up differently.
    persistAndSet(
      savedOrders.map((o) =>
        o.id === selectedRefundOrder.id ? { ...o, status: 'Refunded' as const } : o,
      ),
    );
    setShowRefundModal(false);
    
    if (refundForm.method === 'Exchange') {
      alert('Exchange credit applied to New Order tab!');
    } else {
      alert(`Refund of Rs. ${refundAmt.toFixed(2)} processed to ${refundForm.method}!`);
    }
  };

  // ── Excel Export ──────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todays = savedOrders.filter(
      (o) =>
        o.timestamp >= today.getTime() &&
        o.timestamp < tomorrow.getTime() &&
        (o.status === 'Paid' || o.status === 'Refunded'),
    );

    if (todays.length === 0) {
      alert('No paid or refunded orders recorded today yet!');
      return;
    }

    const rows = todays.map((order) => {
      const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
      const hasC = !order.isCustomerSelected;
      const scPct = hasC && config.enableServiceCharge
        ? order.type === 'Waiter' ? config.waiterServiceCharge : config.counterServiceCharge
        : 0;
      const sc = (subtotal * scPct) / 100;
      const ssclAmt = hasC && config.enableSSCL ? ((subtotal + sc) * config.ssclPercentage) / 100 : 0;
      const vatAmt = hasC ? ((subtotal + sc + ssclAmt) * config.vatPercentage) / 100 : 0;

      return {
        'Order Number': order.orderNumber,
        'Date': new Date(order.timestamp).toLocaleDateString(),
        'Time': new Date(order.timestamp).toLocaleTimeString(),
        'Order Type': order.type,
        'Customer Type': order.isCustomerSelected ? 'Registered Customer' : 'Walk-in',
        'Items Summary': order.items.map((i) => `${i.name} (x${i.quantity})`).join(', '),
        'Payment Method': order.paymentMethod || 'N/A',
        'Subtotal (Rs.)': subtotal,
        'Service Charge (Rs.)': sc,
        'SSCL (Rs.)': ssclAmt,
        'VAT (Rs.)': vatAmt,
        'Total Paid (Rs.)': order.total,
        'Order Status': order.status,
        'Cash Received (Rs.)': order.cashReceived || 0,
        'Change Due (Rs.)': order.changeDue || 0,
        'Order Notes': order.notes || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Today's POS History");
    XLSX.writeFile(wb, `POS_History_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ── Shared styles ─────────────────────────────────────────────────────────────
  const tabBtn = (tab: 'New' | 'Unpaid' | 'History') =>
    `px-3 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
      activeTab === tab
        ? 'bg-teal-600 text-white shadow'
        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
    }`;

  const catBtn = (id: number | null) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition-all ${
      selectedCategory === id
        ? 'bg-teal-600 text-white shadow-md'
        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
    }`;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
        {/* Category pills */}
        <div className="flex items-center gap-2 flex-wrap max-w-full">
          <button className={catBtn(null)} onClick={() => setSelectedCategory(null)}>
            All
          </button>
          {categories.map((cat) => (
            <button key={cat.id} className={catBtn(cat.id)} onClick={() => setSelectedCategory(cat.id)}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tab switcher */}
          <div className="flex gap-1.5">
            <button className={tabBtn('New')} onClick={() => setActiveTab('New')}>
              <Plus size={14} /> New Order
            </button>
            <button className={tabBtn('Unpaid')} onClick={() => setActiveTab('Unpaid')}>
              <Clock size={14} /> Unpaid
              {savedOrders.filter((o) => o.status === 'Unpaid').length > 0 && (
                <span className="bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {savedOrders.filter((o) => o.status === 'Unpaid').length}
                </span>
              )}
            </button>
            <button className={tabBtn('History')} onClick={() => setActiveTab('History')}>
              <CheckCircle size={14} /> History
            </button>
          </div>

          {/* Drawer button */}
          <button
            onClick={handleManualDrawerKick}
            className="px-3 py-1.5 text-sm font-bold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
          >
            Open Drawer
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search menu…"
              className="pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 w-44"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ══ New Order Tab ══ */}
          {activeTab === 'New' && (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}
            >
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => product.isAvailable !== false && handleProductClick(product)}
                  className={`relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all text-left focus:outline-none ${
                    product.isAvailable !== false
                      ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer focus-within:ring-2 focus-within:ring-teal-500'
                      : 'opacity-50 grayscale cursor-not-allowed'
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newAvail = product.isAvailable === false ? true : false;
                      if (!newAvail) {
                        if (!window.confirm(`Are you sure you want to mark ${product.name} as OUT OF STOCK?`)) {
                          return;
                        }
                      }
                      setLocalProducts((prev) =>
                        prev.map((p) => (p.id === product.id ? { ...p, isAvailable: newAvail } : p))
                      );
                      startTransition(async () => {
                        await toggleProductAvailability(product.id, newAvail);
                      });
                    }}
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full z-10 text-[9px] font-bold uppercase shadow-sm transition-colors ${
                      product.isAvailable !== false ? 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white' : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {product.isAvailable !== false ? 'Mark Out' : 'Out of Stock'}
                  </button>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-28 object-cover"
                    />
                  ) : (
                    <div className="w-full h-28 bg-gradient-to-tr from-teal-500 to-blue-400 flex items-center justify-center text-white text-2xl font-bold select-none">
                      {product.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 3)
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-semibold text-sm text-gray-900 leading-tight">{product.name}</p>
                    {product.smallPrice || product.mediumPrice || product.largePrice ? (
                      <div className="flex flex-wrap gap-1.5 mt-2 text-xs font-bold">
                        {product.smallPrice && <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">S: Rs.{parseFloat(product.smallPrice).toFixed(0)}</span>}
                        {product.mediumPrice && <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">M: Rs.{parseFloat(product.mediumPrice).toFixed(0)}</span>}
                        {product.largePrice && <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">L: Rs.{parseFloat(product.largePrice).toFixed(0)}</span>}
                      </div>
                    ) : (
                      <p className="text-teal-600 font-bold text-sm mt-1">
                        Rs. {parseFloat(product.price).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-400">
                  <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
                  <p>No menu items found.</p>
                </div>
              )}
            </div>
          )}

          {/* ══ Unpaid Tab ══ */}
          {activeTab === 'Unpaid' && (
            <div className="max-w-3xl mx-auto space-y-4">
              {savedOrders.filter((o) => o.status === 'Unpaid').length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Clock size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-lg">No unpaid orders.</p>
                </div>
              ) : (
                savedOrders
                  .filter((o) => o.status === 'Unpaid')
                  .map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl border border-amber-200 p-4 flex justify-between items-center shadow-sm"
                    >
                      <div>
                        <h3 className="font-bold text-gray-900">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {order.type} • {new Date(order.timestamp).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-gray-700 mt-2 font-medium">
                          {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-5">
                        <p className="text-2xl font-bold text-teal-600">Rs. {order.total.toFixed(2)}</p>
                        <button
                          onClick={() => handlePayUnpaid(order)}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                        >
                          <Banknote size={16} /> Process Payment
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* ══ History Tab ══ */}
          {activeTab === 'History' && (
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Export header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-xl border border-gray-200 p-4 shadow-sm gap-3">
                <div>
                  <h2 className="font-bold text-gray-900">Order History Logs</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    View, reprint, or export today's paid transactions to Excel.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search ORD-XXXX..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-bold px-4 py-2 rounded-lg text-sm transition-all"
                  >
                    <Download size={14} /> Export
                  </button>
                </div>
              </div>

              {savedOrders.filter((o) => (o.status === 'Paid' || o.status === 'Refunded') && o.orderNumber.toLowerCase().includes(historySearch.toLowerCase())).length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <CheckCircle size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-lg">{historySearch ? 'No matching orders found.' : 'No order history yet.'}</p>
                </div>
              ) : (
                savedOrders
                  .filter((o) => (o.status === 'Paid' || o.status === 'Refunded') && o.orderNumber.toLowerCase().includes(historySearch.toLowerCase()))
                  .map((order) => (
                    <div
                      key={order.id}
                      className={`bg-white rounded-xl border p-4 flex justify-between items-center shadow-sm ${
                        order.status === 'Refunded'
                          ? 'border-red-200 bg-red-50/50 opacity-80'
                          : 'border-gray-200'
                      }`}
                    >
                      <div>
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          {order.orderNumber}
                          {order.status === 'Refunded' && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              REFUNDED
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {order.type} • {order.paymentMethod} •{' '}
                          {new Date(order.timestamp).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                          {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p
                          className={`text-xl font-bold ${
                            order.status === 'Refunded'
                              ? 'text-red-500 line-through'
                              : 'text-emerald-600'
                          }`}
                        >
                          Rs. {order.total.toFixed(2)}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReprint(order)}
                            className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg transition-all"
                          >
                            <Printer size={12} /> Reprint
                          </button>
                          {order.status === 'Paid' && (
                            <button
                              onClick={() => initiateRefund(order)}
                              className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-3 py-1.5 rounded-lg transition-all"
                            >
                              <CornerDownLeft size={12} /> Refund
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        {/* ── Cart Sidebar (New Order only) ── */}
        {activeTab === 'New' && (
          <div className="w-88 shrink-0 bg-white border-l border-gray-200 flex flex-col shadow-xl" style={{ width: '360px' }}>
            {/* Cart header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold text-gray-900 text-lg">Current Order</h2>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {(['Takeaway', 'Dine in', 'Online'] as OrderType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      orderType === type ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer mode & Options (shows when items in cart) */}
            {cart.length > 0 && (
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Customer Mode</span>
                  <select
                    className="bg-white border border-gray-300 rounded-md px-2 py-1 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    value={isCustomerSelected ? 'customer' : 'walkin'}
                    onChange={(e) => setIsCustomerSelected(e.target.value === 'customer')}
                  >
                    <option value="walkin">Walk-in (With Charges)</option>
                    <option value="customer">Registered Customer (No Charges)</option>
                  </select>
                </div>
                {config.enableServiceCharge && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-semibold text-gray-600">Apply Service Charge</span>
                    <input
                      type="checkbox"
                      checked={applyServiceCharge}
                      onChange={(e) => setApplyServiceCharge(e.target.checked)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <FileText size={36} className="opacity-30" />
                  <p className="text-sm">Cart is empty</p>
                  <p className="text-xs">Click a menu item to add it</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-teal-500 to-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {item.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                      <p className="text-teal-600 font-bold text-xs mt-0.5">
                        Rs. {item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-full px-2 py-1 border border-gray-200 shadow-sm">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="text-gray-500 hover:text-teal-600 transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      onClick={() => updateQty(item.id, -item.quantity)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="p-4 border-t border-gray-200 bg-white space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>Rs. {foodSubtotal.toFixed(2)}</span>
              </div>
              {serviceCharge > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Service ({serviceChargePercent}%)</span>
                  <span>Rs. {serviceCharge.toFixed(2)}</span>
                </div>
              )}
              {sscl > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>SSCL ({config.ssclPercentage}%)</span>
                  <span>Rs. {sscl.toFixed(2)}</span>
                </div>
              )}
              {vat > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>VAT ({config.vatPercentage}%)</span>
                  <span>Rs. {vat.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="font-bold text-lg text-gray-900">Total</span>
                <span className="font-bold text-lg text-teal-600">Rs. {finalTotal.toFixed(2)}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveUnpaid}
                  disabled={cart.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-sm transition-all disabled:opacity-40"
                >
                  <FileText size={15} /> Save Unpaid
                </button>
                <button
                  onClick={() => setShowCheckout(true)}
                  disabled={cart.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-all disabled:opacity-40 shadow-md"
                >
                  <CreditCard size={15} /> Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          CHECKOUT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {/* Amount */}
            <div className="text-center py-3">
              <p className="text-sm text-gray-500 font-medium mb-1">Amount Due</p>
              <p className="text-5xl font-extrabold text-teal-600">Rs. {finalTotal.toFixed(2)}</p>
            </div>

            {/* Split Payments */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <p className="text-sm font-bold text-gray-700 mb-2">Split Payments (Optional)</p>
              
              <div className="flex items-center gap-3">
                <Banknote className="text-gray-400" size={20} />
                <label className="text-sm font-semibold text-gray-600 w-16">Cash</label>
                <input
                  type="number"
                  className="flex-1 bg-white border border-gray-300 rounded-lg p-2 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0.00"
                  value={paymentSplits.Cash}
                  onChange={(e) => setPaymentSplits({ ...paymentSplits, Cash: e.target.value })}
                  autoFocus
                />
              </div>

              {/* Quick Cash Amounts */}
              <div className="grid grid-cols-4 gap-2 pl-24">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      const current = parseFloat(paymentSplits.Cash) || 0;
                      setPaymentSplits({ ...paymentSplits, Cash: String(current + amt) });
                    }}
                    className="py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold border border-teal-200 transition-all"
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-3">
                <CreditCard className="text-gray-400" size={20} />
                <label className="text-sm font-semibold text-gray-600 w-16">Card</label>
                <input
                  type="number"
                  className="flex-1 bg-white border border-gray-300 rounded-lg p-2 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0.00"
                  value={paymentSplits.Card}
                  onChange={(e) => setPaymentSplits({ ...paymentSplits, Card: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 mt-3">
                <QrCode className="text-gray-400" size={20} />
                <label className="text-sm font-semibold text-gray-600 w-16">QR</label>
                <input
                  type="number"
                  className="flex-1 bg-white border border-gray-300 rounded-lg p-2 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0.00"
                  value={paymentSplits.QR}
                  onChange={(e) => setPaymentSplits({ ...paymentSplits, QR: e.target.value })}
                />
              </div>

              <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">
                <span className="text-gray-600 font-medium">Change Due:</span>
                <span
                  className={`text-xl font-bold ${
                    changeDue >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  Rs. {changeDue >= 0 ? changeDue.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            {/* Order notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Order Notes / Kitchen Instructions
              </label>
              <textarea
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all resize-none min-h-[70px]"
                placeholder="e.g. No onions, extra spicy, Table 4…"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
            </div>

            {/* Confirm button */}
            <button
              onClick={processPayment}
              disabled={totalGiven < finalTotal}
              className="w-full py-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer size={20} /> Confirm & Print Receipt
            </button>

            {/* Pending DB write indicator */}
            {isPending && (
              <p className="text-xs text-center text-gray-400 animate-pulse">Syncing to database…</p>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SIZE SELECTOR MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedProductForSize && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-[360px] p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">Select Size</h2>
              <button
                onClick={() => setSelectedProductForSize(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm font-semibold text-gray-700 text-center mb-2">
              {selectedProductForSize.name}
            </p>
            <div className="grid gap-3">

              {selectedProductForSize.smallPrice && (
                <button
                  onClick={() => addToCart(selectedProductForSize, parseFloat(selectedProductForSize.smallPrice!), 'Small')}
                  className="w-full py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold transition-all flex justify-between px-4"
                >
                  <span>Small</span>
                  <span>Rs. {parseFloat(selectedProductForSize.smallPrice).toFixed(2)}</span>
                </button>
              )}
              {selectedProductForSize.mediumPrice && (
                <button
                  onClick={() => addToCart(selectedProductForSize, parseFloat(selectedProductForSize.mediumPrice!), 'Medium')}
                  className="w-full py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold transition-all flex justify-between px-4"
                >
                  <span>Medium</span>
                  <span>Rs. {parseFloat(selectedProductForSize.mediumPrice).toFixed(2)}</span>
                </button>
              )}
              {selectedProductForSize.largePrice && (
                <button
                  onClick={() => addToCart(selectedProductForSize, parseFloat(selectedProductForSize.largePrice!), 'Large')}
                  className="w-full py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold transition-all flex justify-between px-4"
                >
                  <span>Large</span>
                  <span>Rs. {parseFloat(selectedProductForSize.largePrice).toFixed(2)}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          REFUND MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-[440px] p-6 space-y-4">
            <h2 className="text-xl font-bold text-red-600 flex items-center gap-2 border-b border-gray-100 pb-3">
              <CornerDownLeft size={20} /> Process Refund
            </h2>
            <p className="text-sm text-gray-500">
              Refunding order{' '}
              <span className="font-bold text-gray-800">{selectedRefundOrder?.orderNumber}</span> for{' '}
              <span className="font-bold text-red-600">
                Rs. {selectedRefundOrder?.total.toFixed(2)}
              </span>
            </p>

            <form onSubmit={executeRefund} className="space-y-4">
              {[
                { key: 'name', label: 'Customer Name', placeholder: 'Full name' },
                { key: 'phone', label: 'Customer Phone', placeholder: '+94 7X XXX XXXX' },
                { key: 'reason', label: 'Reason for Refund', placeholder: 'Brief description…' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{label} *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"
                    placeholder={placeholder}
                    value={(refundForm as any)[key]}
                    onChange={(e) => setRefundForm({ ...refundForm, [key]: e.target.value })}
                    required
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Amount to Refund *</label>
                  <input
                    type="number"
                    step="0.01"
                    max={selectedRefundOrder?.total}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Refund Method *</label>
                  <select
                    className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"
                    value={refundForm.method}
                    onChange={(e) => setRefundForm({ ...refundForm, method: e.target.value })}
                  >
                    <option value="Cash">Cash (from drawer)</option>
                    <option value="Card">Card (reversal)</option>
                    <option value="Exchange">Exchange Items</option>
                  </select>
                </div>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <label className="block text-sm font-bold text-red-800 mb-2">
                  Manager Authorization PIN *
                </label>
                <input
                  type="password"
                  placeholder="Enter PIN"
                  className="w-full border border-red-300 rounded-lg p-3 text-center tracking-widest text-lg font-bold focus:outline-none focus:border-red-500 bg-white transition-all"
                  value={refundForm.pin}
                  onChange={(e) => setRefundForm({ ...refundForm, pin: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md transition-all"
                >
                  Authorize &amp; Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
