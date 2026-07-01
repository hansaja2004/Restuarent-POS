'use client';

import { useState, useEffect, useTransition } from 'react';
import { 
  ArrowUpRight, 
  DollarSign, 
  RefreshCw, 
  Download, 
  FileSpreadsheet, 
  History, 
  ShoppingBag, 
  Banknote, 
  CreditCard, 
  QrCode, 
  TicketPercent, 
  Coins, 
  ReceiptText, 
  Undo2, 
  Ban, 
  Search, 
  Filter, 
  Hash, 
  UserCircle2, 
  Clock, 
  MapPin, 
  TabletSmartphone, 
  ShoppingCart, 
  Info, 
  CheckCircle2, 
  ChevronRight,
  BarChart2,
  UtensilsCrossed,
  PhoneCall,
  Wallet,
  Printer
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useConfig } from './ConfigContext';

interface Props {
  session: any;
  orders: any[];
  stats: any;
}

export default function DashboardClient({ session, orders, stats }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'item-sales' | 'orders' | 'refunds'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [refundLogs, setRefundLogs] = useState<any[]>([]);
  const { config } = useConfig();

  useEffect(() => {
    try {
      const logs = JSON.parse(localStorage.getItem('refund_logs') || '[]');
      setRefundLogs(logs);
    } catch (e) {}
  }, []);

  const handleManualReset = () => {
    if (!confirm('Are you sure you want to end the shift and reset dashboard metrics? (Older data remains safely in the database)')) return;
    
    startTransition(async () => {
      const { resetDashboardTime } = await import('@/app/actions/settings');
      const res = await resetDashboardTime();
      if (res?.error) {
        alert('Failed: ' + res.error);
      } else {
        alert('Dashboard metrics have been reset successfully!');
        window.location.reload();
      }
    });
  };

  // Fallback
  const s = stats || {
    totalAmount: 0,
    orderCount: 0,
    totalTax: 0,
    totalSSCL: 0,
    totalVAT: 0,
    totalServiceCharge: 0,
    totalDiscount: 0,
    typeBreakdown: { DineIn: 0, Takeaway: 0, Online: 0 },
    paymentBreakdown: {},
    refundCount: 0,
    refundAmount: 0,
    itemSales: [],
  };

  const allHistoryOrders = orders.filter((o) => o.status === 'completed' || o.status === 'refunded');
  
  const filteredOrders = allHistoryOrders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const idMatch = (o.orderNumber || `#${o.id}`).toLowerCase().includes(q);
    const typeMatch = (o.orderType || 'Takeaway').toLowerCase().includes(q);
    const payMatch = (o.paymentMethod || 'Cash').toLowerCase().includes(q);
    return idMatch || typeMatch || payMatch;
  });
  const refundedOrders = orders.filter((o) => o.status === 'refunded');

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      ['End of Day Report', new Date().toLocaleDateString()],
      [''],
      ['Total Revenue', s.totalAmount],
      ['Total Orders', s.orderCount],
      ['Total VAT', s.totalVAT],
      ['Total SSCL', s.totalSSCL],
      ['Total Service Charge', s.totalServiceCharge],
      ['Total Discount', s.totalDiscount],
      ['Total Refunds', s.refundAmount],
      ['Refund Count', s.refundCount],
      [''],
      ['Payment Methods'],
      ...Object.entries(s.paymentBreakdown).map(([method, amt]) => [method, amt]),
      [''],
      ['Order Types'],
      ['Takeaway', s.typeBreakdown.Takeaway],
      ['Dine-In', s.typeBreakdown.DineIn],
      ['Online', s.typeBreakdown.Online],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // 2. Orders Sheet
    const ordersData = [
      ['Order Number', 'Date', 'Status', 'Order Type', 'Payment Method', 'Items', 'Details', 'Subtotal', 'Tax', 'Service Charge', 'Discount', 'Total Amount', 'Refund Amount']
    ];
    allHistoryOrders.forEach(o => {
      ordersData.push([
        o.orderNumber || `#${o.id}`,
        o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
        o.status,
        o.orderType || 'Takeaway',
        o.paymentMethod || 'Cash',
        o.items?.toString() || '0',
        o.itemsDetail || '',
        o.subtotal || '',
        o.taxAmount || '',
        o.serviceCharge || '',
        o.discount || '',
        o.totalAmount || '',
        o.refundAmount || '0.00'
      ]);
    });
    const wsOrders = XLSX.utils.aoa_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(wb, wsOrders, 'All Orders');

    // 3. Refunds Sheet
    const refundsData = [
      ['Order Number', 'Date', 'Order Type', 'Items', 'Total', 'Refund Amount']
    ];
    refundedOrders.forEach(o => {
      refundsData.push([
        o.orderNumber || `#${o.id}`,
        o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
        o.orderType || 'Takeaway',
        o.items?.toString() || '0',
        o.totalAmount || '',
        o.refundAmount || o.totalAmount
      ]);
    });
    const wsRefunds = XLSX.utils.aoa_to_sheet(refundsData);
    XLSX.utils.book_append_sheet(wb, wsRefunds, 'Refund History');

    // 4. Order Items Sheet
    const orderItemsData = [
      ['Order Number', 'Date', 'Item Name', 'Size', 'Quantity', 'Unit Price', 'Total']
    ];
    allHistoryOrders.forEach(o => {
      if (o.cartItems && Array.isArray(o.cartItems)) {
        o.cartItems.forEach((item: any) => {
          orderItemsData.push([
            o.orderNumber || `#${o.id}`,
            o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
            item.name,
            item.size || 'reg',
            item.quantity.toString(),
            item.price.toString(),
            (item.price * item.quantity).toString()
          ]);
        });
      }
    });
    const wsOrderItems = XLSX.utils.aoa_to_sheet(orderItemsData);
    XLSX.utils.book_append_sheet(wb, wsOrderItems, 'Order Items');

    XLSX.writeFile(wb, `EOD_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrintSummary = async () => {
    try {
      if (config.printerType === 'mock') {
        alert('Printer is in mock mode. Summary printed (simulated).');
        return;
      }

      if (config.printerType === 'browser') {
        const { printHTMLSummary } = await import('@/lib/escpos');
        printHTMLSummary(s, config);
        return;
      }

      const { compileSummaryESC } = await import('@/lib/escpos');
      const bytes = compileSummaryESC(s, config);

      if (config.printerType === 'network') {
        if (!config.networkIp || !config.networkPort) return alert('No network printer configured.');
        const { printToNetworkPrinter } = await import('@/app/actions/settings');
        await printToNetworkPrinter(config.networkIp, config.networkPort, Array.from(bytes));
      } else if (config.printerType === 'webusb') {
        const devices = await (navigator as any).usb.getDevices();
        if (devices.length === 0) return alert('No USB printer paired. Go to Settings -> Hardware first.');
        const dev = devices[0];
        const { writeToWebUSB } = await import('@/lib/escpos');
        await writeToWebUSB(dev, bytes);
      } else if (config.printerType === 'webserial') {
        alert('Serial printing summary not fully supported in Dashboard. Switch to Browser print mode in Settings.');
      }
    } catch (err: any) {
      alert(`Print failed: ${err.message}`);
    }
  };

  const handlePrintOrderReceipt = async (o: any) => {
    try {
      const mappedOrder = {
        orderNumber: o.orderNumber || `#${o.id}`,
        timestamp: o.createdAt,
        type: o.orderType || 'Takeaway',
        total: parseFloat(o.totalAmount),
        items: o.cartItems || [],
        paymentMethod: o.paymentMethod || 'Cash',
        status: o.status,
      };

      if (config.printerType === 'mock') {
        alert('Printer is in mock mode. Receipt printed (simulated).');
        return;
      }
      if (config.printerType === 'browser') {
        const { printHTMLReceipt } = await import('@/lib/escpos');
        printHTMLReceipt(mappedOrder, config, session.username, true);
        return;
      }
      
      const { compileReceiptESC } = await import('@/lib/escpos');
      const bytes = compileReceiptESC(mappedOrder, config, session.username, true);

      if (config.printerType === 'network') {
        if (!config.networkIp || !config.networkPort) return alert('No network printer configured.');
        const { printToNetworkPrinter } = await import('@/app/actions/settings');
        await printToNetworkPrinter(config.networkIp, config.networkPort, Array.from(bytes));
      } else if (config.printerType === 'webusb') {
        const devices = await (navigator as any).usb.getDevices();
        if (devices.length === 0) return alert('No USB printer paired. Go to Settings -> Hardware first.');
        const dev = devices[0];
        const { writeToWebUSB } = await import('@/lib/escpos');
        await writeToWebUSB(dev, bytes);
      } else if (config.printerType === 'webserial') {
        alert('Serial printing not fully supported in Dashboard. Switch to Browser print mode in Settings.');
      }
    } catch (err: any) {
      alert(`Print failed: ${err.message}`);
    }
  };

  const tabBtn = (id: 'overview' | 'item-sales' | 'orders' | 'refunds', label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 font-semibold text-sm rounded-lg transition-all ${
        activeTab === id
          ? 'bg-teal-600 text-white shadow'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-6 min-h-full pb-20">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time analytics and transaction reports</p>
        </div>
        <div className="flex gap-2">
          {tabBtn('overview', 'Analytics Overview')}
          {tabBtn('item-sales', 'Item Sales')}
          {tabBtn('orders', 'Daily Order List')}
          {tabBtn('refunds', 'Refund History')}
          
          <div className="ml-4 flex gap-2">
            <button
              onClick={handleManualReset}
              disabled={isPending}
              className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 font-semibold text-sm rounded-lg hover:bg-red-100 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} /> {isPending ? 'Resetting...' : 'End Day Reset'}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-gray-900 text-white font-semibold text-sm rounded-lg hover:bg-gray-800 transition-all shadow flex items-center gap-2"
            >
              <Download size={14} /> Export Report
            </button>
            <button
              onClick={handlePrintSummary}
              className="px-4 py-2 bg-teal-600 text-white font-semibold text-sm rounded-lg hover:bg-teal-700 transition-all shadow flex items-center gap-2"
            >
              <Printer size={14} /> Print Summary
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-teal-100 font-medium text-sm flex items-center gap-2">
                  <DollarSign size={16} /> Total Revenue
                </p>
                <h3 className="text-3xl font-bold mt-2">Rs. {s.totalAmount.toLocaleString()}</h3>
                <p className="text-teal-100 text-xs mt-2 flex items-center gap-1">
                  Today's total (After refunds)
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
              <p className="text-gray-500 font-medium text-sm flex items-center gap-2">
                <ShoppingBag size={16} className="text-blue-500" /> Completed Orders
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{s.orderCount}</h3>
              <p className="text-gray-400 text-xs mt-2">Across all order types</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
              <p className="text-gray-500 font-medium text-sm flex items-center gap-2">
                <Undo2 size={16} className="text-red-500" /> Refunds Issued
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{s.refundCount}</h3>
              <p className="text-red-500 text-xs mt-2 font-semibold">
                Rs. {s.refundAmount.toLocaleString()} refunded
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
              <p className="text-gray-500 font-medium text-sm flex items-center gap-2">
                <TicketPercent size={16} className="text-purple-500" /> Taxes & Fees
              </p>
              {(config.enableVAT_Takeaway || config.enableVAT_DineIn || config.enableVAT_Online || (s.totalVAT > 0)) && (
                <h3 className="text-xl font-bold text-gray-900 mt-2">
                  <span className="text-sm text-gray-500 font-normal">VAT:</span> Rs. {(s.totalVAT || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              )}
              {(config.enableSSCL_Takeaway || config.enableSSCL_DineIn || config.enableSSCL_Online || (s.totalSSCL > 0)) && (
                <h3 className="text-xl font-bold text-gray-900 mt-1">
                  <span className="text-sm text-gray-500 font-normal">SSCL:</span> Rs. {(s.totalSSCL || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              )}
              {(config.enableServiceCharge_Takeaway || config.enableServiceCharge_DineIn || config.enableServiceCharge_Online || (s.totalServiceCharge > 0)) && (
                <h3 className="text-xl font-bold text-gray-900 mt-1">
                  <span className="text-sm text-gray-500 font-normal">SVC:</span> Rs. {(s.totalServiceCharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
              <p className="text-gray-500 font-medium text-sm flex items-center gap-2">
                <TicketPercent size={16} className="text-yellow-500" /> Discounts Given
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">Rs. {(s.totalDiscount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-yellow-600 text-xs mt-2 font-semibold">
                Customer Discounts Applied
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Wallet className="text-blue-500" size={20} /> Payment Breakdown
              </h2>
              <div className="space-y-4">
                {Object.entries(s.paymentBreakdown).map(([method, amount]) => {
                  let icon = <Banknote size={20} />;
                  let bg = "bg-emerald-100 text-emerald-600";
                  let title = method;
                  let desc = "Payment";
                  if (method.toLowerCase().includes('card')) {
                    icon = <CreditCard size={20} />;
                    bg = "bg-blue-100 text-blue-600";
                    desc = "Credit / Debit";
                  } else if (method.toLowerCase().includes('qr')) {
                    icon = <QrCode size={20} />;
                    bg = "bg-purple-100 text-purple-600";
                    desc = "Digital Transfer";
                  }

                  return (
                    <div key={method} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg}`}>
                          {icon}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{title}</p>
                          <p className="text-xs text-gray-500">{desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">Rs. {Number(amount).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{s.totalAmount ? Math.round((Number(amount) / s.totalAmount) * 100) : 0}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <UtensilsCrossed className="text-orange-500" size={20} /> Order Types
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Takeaway Orders</p>
                      <p className="text-xs text-gray-500">Counter pickups</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{s.typeBreakdown.Takeaway} Orders</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                      <UtensilsCrossed size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Dine-in Orders</p>
                      <p className="text-xs text-gray-500">In-house dining</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{s.typeBreakdown.DineIn} Orders</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                      <PhoneCall size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Online Orders</p>
                      <p className="text-xs text-gray-500">Web / App integrations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{s.typeBreakdown.Online} Orders</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'item-sales' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <BarChart2 size={18} className="text-teal-600" /> Item-wise Sales
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-700">
                <tr>
                  <th className="px-5 py-4 font-bold">Item Name</th>
                  <th className="px-5 py-4 font-bold text-right">Quantity Sold</th>
                  <th className="px-5 py-4 font-bold text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {s.itemSales && s.itemSales.length > 0 ? (
                  s.itemSales.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-gray-900">{item.name}</td>
                      <td className="px-5 py-3 text-right font-bold text-blue-600">{item.quantity}</td>
                      <td className="px-5 py-3 text-right font-bold text-teal-600">Rs. {item.revenue.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                      No items sold yet today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <History size={18} className="text-blue-600" /> Daily Orders
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search orders (ID, Type...)"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-700">
                <tr>
                  <th className="px-5 py-4 font-bold">Order ID</th>
                  <th className="px-5 py-4 font-bold">Time</th>
                  <th className="px-5 py-4 font-bold">Type</th>
                  <th className="px-5 py-4 font-bold">Payment</th>
                  <th className="px-5 py-4 font-bold">Items (Details)</th>
                  <th className="px-5 py-4 font-bold text-right">Amount</th>
                  <th className="px-5 py-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length > 0 ? filteredOrders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-gray-900">
                      {o.orderNumber || `#${o.id}`}
                      {o.status === 'refunded' && <span className="ml-2 text-[10px] text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full uppercase font-bold">Refunded</span>}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">{o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : ''}</td>
                    <td className="px-5 py-3">{o.orderType || 'Takeaway'}</td>
                    <td className="px-5 py-3 font-semibold">{o.paymentMethod || 'Cash'}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        {o.cartItems && o.cartItems.length > 0 ? o.cartItems.map((item: any, idx: number) => (
                          <div key={idx} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            <span className="font-bold">{item.quantity}x</span> {item.name} {item.size ? `(${item.size})` : ''}
                          </div>
                        )) : (
                          <span className="text-xs text-gray-400">{o.itemsDetail || 'No details'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-gray-900 whitespace-nowrap">Rs. {parseFloat(o.totalAmount).toLocaleString()}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handlePrintOrderReceipt(o)}
                        className="text-teal-600 hover:text-teal-800 transition-colors inline-flex items-center gap-1 text-xs font-semibold bg-teal-50 px-2 py-1 rounded"
                        title="Print Copy Bill"
                      >
                        <Printer size={14} /> Print
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No orders yet today.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'refunds' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Undo2 size={18} className="text-red-600" /> Refund History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-700">
                <tr>
                  <th className="px-5 py-4 font-bold">Order ID & Details</th>
                  <th className="px-5 py-4 font-bold">Time</th>
                  <th className="px-5 py-4 font-bold">Type</th>
                  <th className="px-5 py-4 font-bold">Total</th>
                  <th className="px-5 py-4 font-bold text-right text-red-600">Refund Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {refundedOrders.length > 0 ? refundedOrders.map(o => {
                  const log = refundLogs.find((l) => l.orderNumber === (o.orderNumber || `#${o.id}`));
                  return (
                  <tr key={o.id} className="hover:bg-red-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-gray-900">
                      <div className="font-bold text-red-600 mb-1">{o.orderNumber || `#${o.id}`}</div>
                      {log && (
                        <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                          <p><span className="font-semibold text-gray-700">Customer:</span> {log.customerName || 'N/A'}</p>
                          <p><span className="font-semibold text-gray-700">Phone:</span> {log.customerPhone || 'N/A'}</p>
                          <p><span className="font-semibold text-gray-700">Reason:</span> {log.reason || 'N/A'}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 align-top">{o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : ''}</td>
                    <td className="px-5 py-3 align-top">{o.orderType || 'Takeaway'}</td>
                    <td className="px-5 py-3 font-semibold align-top">Rs. {parseFloat(o.totalAmount).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-bold text-red-600 align-top">Rs. {parseFloat(o.refundAmount || o.totalAmount).toLocaleString()}</td>
                  </tr>
                )}) : (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No refunds issued today.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
