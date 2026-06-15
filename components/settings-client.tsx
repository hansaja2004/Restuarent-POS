'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  Edit2,
  Check,
  X,
  Sliders,
  Printer,
  BookOpen,
  Users,
  Key,
  Trash2,
  Save,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import {
  compileReceiptESC,
  getDrawerKickBytes,
  writeToWebUSB,
  writeToWebSerial,
  printHTMLReceipt,
  defaultConfig as libDefaultConfig,
} from '@/lib/escpos';
import type { TaxConfig } from '@/lib/escpos';
import { useConfig } from '@/components/ConfigContext';
import { createUser, updateUser, deleteUser, changeUserPassword } from '@/app/actions/employees';
import {
  createProduct,
  deleteProduct,
  createCategory,
  updateProduct,
} from '@/app/actions/products';
import { saveServerConfig } from '@/app/actions/settings';

// ── Types ──────────────────────────────────────────────────────────────────────

type UserRole = 'admin' | 'manager' | 'director' | 'cashier';

interface DBUser {
  id: number;
  username: string;
  role: string;
  employeeId: string | null;
}

interface DBProduct {
  id: number;
  name: string;
  price: string;
  categoryId: number;
  imageUrl: string | null;
  smallPrice?: string | null;
  mediumPrice?: string | null;
  largePrice?: string | null;
}

interface DBCategory {
  id: number;
  name: string;
}

interface Props {
  session: { userId: number; role: string; username: string };
  initialUsers: DBUser[];
  initialProducts: DBProduct[];
  initialCategories: DBCategory[];
  serverConfig: Partial<TaxConfig>;
}

// ── Image Compression ──────────────────────────────────────────────────────────

const compressImageToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 280;
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas unavailable');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      img.src = ev.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ── Role badge colors ──────────────────────────────────────────────────────────

const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    director: 'bg-blue-100 text-blue-700',
    manager: 'bg-yellow-100 text-yellow-700',
    cashier: 'bg-green-100 text-green-700',
  };
  return map[role.toLowerCase()] ?? 'bg-gray-100 text-gray-700';
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SettingsClient({
  session,
  initialUsers,
  initialProducts,
  initialCategories,
  serverConfig,
}: Props) {
  const router = useRouter();
  const { config, updateConfig } = useConfig();
  const [isPending, startTransition] = useTransition();

  const isAdmin = session.role === 'admin';
  const isManagerOrAbove = ['admin', 'manager', 'director'].includes(session.role);

  // ── Tab State ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'general' | 'hardware' | 'menu' | 'users'>('general');

  // ── Status Message ───────────────────────────────────────────────────────────
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // ── Tax / Config Form ────────────────────────────────────────────────────────
  const [taxForm, setTaxForm] = useState<TaxConfig>(() => ({
    ...libDefaultConfig,
    ...config,
    ...serverConfig,
  }));

  // Sync when context loads from localStorage
  useEffect(() => {
    setTaxForm((prev) => ({ ...prev, ...config, ...serverConfig }));
  }, [config, serverConfig]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(taxForm); // localStorage
    startTransition(async () => {
      const result = await saveServerConfig(taxForm);
      if (result?.error) {
        showMessage('Config saved locally. Server sync failed: ' + result.error, 'error');
      } else {
        showMessage('Configuration saved successfully!');
      }
    });
  };

  // ── Hardware / Printer ───────────────────────────────────────────────────────
  const [pairedUsbDevice, setPairedUsbDevice] = useState<USBDevice | null>(null);
  const [pairedSerialPort, setPairedSerialPort] = useState<any>(null);

  useEffect(() => {
    if ('usb' in navigator) {
      navigator.usb.getDevices().then((devices) => {
        if (devices.length > 0) setPairedUsbDevice(devices[0]);
      });
    }
  }, []);

  const handlePairUsb = async () => {
    if (!('usb' in navigator)) return alert('WebUSB not supported. Use Chrome or Edge.');
    try {
      const device = await navigator.usb.requestDevice({ filters: [] });
      setPairedUsbDevice(device);
      showMessage(`USB Paired: ${device.productName || 'Printer'} (${device.vendorId}:${device.productId})`);
    } catch (err: any) {
      showMessage('USB Pairing failed: ' + err.message, 'error');
    }
  };

  const handlePairSerial = async () => {
    if (!('serial' in navigator)) return alert('Web Serial not supported. Use Chrome or Edge.');
    try {
      const port = await (navigator as any).serial.requestPort();
      setPairedSerialPort(port);
      showMessage('Serial port paired successfully!');
    } catch (err: any) {
      showMessage('Serial pairing failed: ' + err.message, 'error');
    }
  };

  const handleTestPrint = async () => {
    const mockOrder = {
      orderNumber: 'TEST-000000',
      type: 'Counter',
      items: [
        { name: 'Test Chicken Rice', quantity: 1, price: 1200 },
        { name: 'Test Soft Drink', quantity: 2, price: 200 },
      ],
      total: 1600,
      timestamp: Date.now(),
    };
    try {
      if (taxForm.printerType === 'mock') {
        alert('Printer is in MOCK/DEMO mode. Print succeeded (simulated)!');
      } else if (taxForm.printerType === 'browser') {
        printHTMLReceipt(mockOrder, taxForm, session.username);
      } else if (taxForm.printerType === 'webusb') {
        if (!pairedUsbDevice) return alert("Click 'Pair USB Printer' first!");
        const bytes = compileReceiptESC(mockOrder, taxForm, session.username);
        await writeToWebUSB(pairedUsbDevice, bytes);
        showMessage('USB Test Print sent successfully!');
      } else if (taxForm.printerType === 'webserial') {
        if (!pairedSerialPort) return alert("Click 'Pair Serial Printer' first!");
        const bytes = compileReceiptESC(mockOrder, taxForm, session.username);
        await writeToWebSerial(pairedSerialPort, bytes);
        showMessage('Serial Test Print sent successfully!');
      }
    } catch (err: any) {
      alert('Print Test Failed: ' + err.message);
    }
  };

  const handleTestDrawer = async () => {
    try {
      if (taxForm.printerType === 'mock') return alert('Cash drawer kicked (simulated)!');
      const bytes = getDrawerKickBytes(taxForm.drawerPin);
      let sent = false;
      const errors: string[] = [];
      if (pairedUsbDevice) {
        try {
          await writeToWebUSB(pairedUsbDevice, bytes);
          sent = true;
        } catch (e: any) {
          errors.push('USB: ' + e.message);
        }
      }
      if (pairedSerialPort) {
        try {
          await writeToWebSerial(pairedSerialPort, bytes);
          sent = true;
        } catch (e: any) {
          errors.push('Serial: ' + e.message);
        }
      }
      if (sent) {
        showMessage('Cash Drawer kick command sent!');
        if (errors.length) alert('Drawer triggered with some errors: ' + errors.join(', '));
      } else {
        alert(errors.length ? 'Failed: ' + errors.join(', ') : 'No USB/Serial device paired.');
      }
    } catch (err: any) {
      alert('Drawer Test Failed: ' + err.message);
    }
  };

  const handleResetAllRecords = () => {
    const pin = prompt(
      'WARNING: This will permanently delete ALL local transaction history.\nEnter Manager Authorization PIN to authorize:',
    );
    if (pin === taxForm.refundPin) {
      localStorage.removeItem('pos_orders');
      localStorage.removeItem('refund_logs');
      showMessage('All local records reset successfully.');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      alert('Authorization Denied! Incorrect PIN.');
    }
  };

  // ── Menu State ───────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<DBProduct[]>(initialProducts);
  const [categories, setCategories] = useState<DBCategory[]>(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItemForm, setNewItemForm] = useState({ name: '', price: '', categoryId: '', imageUrl: '' });
  const [newImagePreview, setNewImagePreview] = useState('');
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editItemForm, setEditItemForm] = useState({ name: '', price: '', categoryId: '', imageUrl: '' });
  const [editImagePreview, setEditImagePreview] = useState('');

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', newCategoryName.trim());
    startTransition(async () => {
      const result = await createCategory(fd);
      if (result?.error) {
        showMessage(result.error, 'error');
      } else {
        setNewCategoryName('');
        showMessage('Category added!');
        router.refresh();
      }
    });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name || !newItemForm.price || !newItemForm.categoryId) {
      return alert('Please fill in all required fields.');
    }
    const fd = new FormData();
    fd.append('name', newItemForm.name.trim());
    fd.append('price', newItemForm.price);
    fd.append('mediumPrice', newItemForm.price);
    fd.append('categoryId', newItemForm.categoryId);
    fd.append('imageUrl', newItemForm.imageUrl || '/spicy-shrimp-rice.png');
    startTransition(async () => {
      const result = await createProduct(fd);
      if (result?.error) {
        showMessage(result.error, 'error');
      } else {
        setNewItemForm({ name: '', price: '', categoryId: '', imageUrl: '' });
        setNewImagePreview('');
        showMessage('Menu item added successfully!');
        router.refresh();
      }
    });
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result?.error) {
        showMessage(result.error, 'error');
      } else {
        showMessage('Menu item deleted.');
        router.refresh();
      }
    });
  };

  const handleSaveEditProduct = async (id: number) => {
    if (!editItemForm.name || !editItemForm.price || !editItemForm.categoryId) {
      return alert('Please fill in all required fields.');
    }
    const fd = new FormData();
    fd.append('name', editItemForm.name.trim());
    fd.append('price', editItemForm.price);
    fd.append('categoryId', editItemForm.categoryId);
    fd.append('imageUrl', editItemForm.imageUrl || '/spicy-shrimp-rice.png');
    startTransition(async () => {
      const result = await updateProduct(id, fd);
      if (result?.error) {
        showMessage(result.error, 'error');
      } else {
        setEditingProductId(null);
        setEditImagePreview('');
        showMessage('Menu item updated!');
        router.refresh();
      }
    });
  };

  // ── User State ───────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<DBUser[]>(initialUsers);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    employeeId: '',
    role: 'cashier' as UserRole,
    password: '',
  });
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editUserForm, setEditUserForm] = useState({ username: '', employeeId: '', role: 'cashier' as UserRole });
  const [changePassTargetId, setChangePassTargetId] = useState<number>(session.userId);
  const [newPassword, setNewPassword] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('username', newUserForm.username);
    fd.append('employeeId', newUserForm.employeeId);
    fd.append('role', newUserForm.role);
    fd.append('password', newUserForm.password);
    startTransition(async () => {
      const result = await createUser(fd);
      if (result?.error) {
        showMessage(result.error, 'error');
      } else {
        setNewUserForm({ username: '', employeeId: '', role: 'cashier', password: '' });
        showMessage('Staff member created successfully!');
        router.refresh();
      }
    });
  };

  const handleSaveEditUser = async (id: number) => {
    const fd = new FormData();
    fd.append('username', editUserForm.username);
    fd.append('employeeId', editUserForm.employeeId);
    fd.append('role', editUserForm.role);
    startTransition(async () => {
      const result = await updateUser(id, fd);
      if (result?.error) {
        showMessage(result.error, 'error');
      } else {
        setEditingUserId(null);
        showMessage('User updated!');
        router.refresh();
      }
    });
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteUser(id);
      if (result?.error) {
        showMessage(result.error, 'error');
      } else {
        showMessage(`User "${name}" deleted.`);
        router.refresh();
      }
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await changeUserPassword(changePassTargetId, newPassword);
      if (result?.error) {
        showMessage(result.error, 'error');
      } else {
        setNewPassword('');
        showMessage('Password changed successfully!');
      }
    });
  };

  // ── Shared input class ────────────────────────────────────────────────────────
  const inp =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white';

  const card = 'bg-white rounded-xl border border-gray-200 shadow-sm p-6';

  const tabBtn = (tab: string) =>
    `flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-lg transition-all ${
      activeTab === tab
        ? 'bg-teal-600 text-white shadow-md'
        : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'
    }`;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 min-h-full pb-20">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings & Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure business details, tax rates, thermal printer, menu items and staff directory.
          </p>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`mb-5 px-4 py-3 rounded-lg text-sm font-semibold border ${
            message.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-teal-50 text-teal-800 border-teal-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Pending overlay hint */}
      {isPending && (
        <div className="mb-4 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium animate-pulse">
          Saving…
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
        <button type="button" className={tabBtn('general')} onClick={() => setActiveTab('general')}>
          <Sliders size={16} /> General &amp; Taxes
        </button>
        {isManagerOrAbove && (
          <button type="button" className={tabBtn('hardware')} onClick={() => setActiveTab('hardware')}>
            <Printer size={16} /> Printer &amp; Hardware
          </button>
        )}
        <button type="button" className={tabBtn('menu')} onClick={() => setActiveTab('menu')}>
          <BookOpen size={16} /> Menu &amp; Items Editor
        </button>
        {isManagerOrAbove && (
          <button type="button" className={tabBtn('users')} onClick={() => setActiveTab('users')}>
            <Users size={16} /> User Management
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 1 — General & Taxes
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tax Rates */}
          {isAdmin ? (
            <div className={card}>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sliders size={18} className="text-teal-600" /> Global Tax &amp; Service Rates
              </h2>
              <form onSubmit={handleSaveConfig} className="space-y-4">
                {/* Toggles */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                  {[
                    { key: 'enableServiceCharge', label: 'Enable Service Charges' },
                    { key: 'enableSSCL', label: 'Enable SSCL Charge' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={taxForm[key as keyof TaxConfig] as boolean}
                        onChange={(e) => setTaxForm({ ...taxForm, [key]: e.target.checked })}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {taxForm.enableSSCL && (
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">SSCL (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        className={inp}
                        value={taxForm.ssclPercentage}
                        onChange={(e) => setTaxForm({ ...taxForm, ssclPercentage: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">VAT (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className={inp}
                      value={taxForm.vatPercentage}
                      onChange={(e) => setTaxForm({ ...taxForm, vatPercentage: parseFloat(e.target.value) })}
                    />
                  </div>
                  {taxForm.enableServiceCharge && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Counter Service Charge (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          className={inp}
                          value={taxForm.counterServiceCharge}
                          onChange={(e) => setTaxForm({ ...taxForm, counterServiceCharge: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Waiter Service Charge (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          className={inp}
                          value={taxForm.waiterServiceCharge}
                          onChange={(e) => setTaxForm({ ...taxForm, waiterServiceCharge: parseFloat(e.target.value) })}
                        />
                      </div>
                    </>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Save size={16} /> Save Tax Configuration
                </button>
              </form>
            </div>
          ) : (
            <div className={card}>
              <p className="text-gray-400 text-center py-8">Administrator access required to configure tax rates.</p>
            </div>
          )}

          {/* Receipt & Security */}
          {isManagerOrAbove && (
            <div className={card}>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sliders size={18} className="text-blue-500" /> Receipt Customization &amp; Security
              </h2>
              <form onSubmit={handleSaveConfig} className="space-y-3">
                {[
                  { key: 'receiptName', label: 'Store / Receipt Name' },
                  { key: 'receiptSubtitle', label: 'Subtitle / Tagline' },
                  { key: 'receiptAddress', label: 'Address' },
                  { key: 'receiptPhone', label: 'Phone Number' },
                  { key: 'receiptTaxRegNo', label: 'Tax Registration No.' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                    <input
                      type="text"
                      className={inp}
                      value={(taxForm[key as keyof TaxConfig] as string) || ''}
                      onChange={(e) => setTaxForm({ ...taxForm, [key]: e.target.value })}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Receipt Footer Message</label>
                  <textarea
                    className={`${inp} min-h-[60px] resize-none`}
                    value={taxForm.receiptFooter}
                    onChange={(e) => setTaxForm({ ...taxForm, receiptFooter: e.target.value })}
                  />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <label className="block text-xs font-bold text-amber-800 mb-2">Manager Authorization PIN</label>
                  <input
                    type="text"
                    maxLength={6}
                    className={`${inp} font-mono font-bold tracking-widest text-center max-w-[120px] mx-auto block`}
                    value={taxForm.refundPin}
                    onChange={(e) => setTaxForm({ ...taxForm, refundPin: e.target.value })}
                  />
                  <p className="text-[10px] text-center text-amber-700 mt-1">
                    Required to authorize refunds, reset records, and open cash drawer.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Save size={16} /> Save Receipt Configuration
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 2 — Printer & Hardware
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'hardware' && isManagerOrAbove && (
        <div className="max-w-3xl mx-auto">
          <div className={card}>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Printer size={18} className="text-teal-600" /> Hardware &amp; Printer Integration
            </h2>

            {/* Diagnostics */}
            <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono border border-gray-200 text-gray-700 mb-4">
              <b>[Hardware Connection Diagnostics]</b>
              <br />• Connection Mode:{' '}
              <span className="font-bold text-blue-600">"{taxForm.printerType}"</span>
              <br />• USB Device:{' '}
              <span className={pairedUsbDevice ? 'text-green-600 font-bold' : 'text-gray-500'}>
                {pairedUsbDevice ? pairedUsbDevice.productName || 'Paired' : 'Not paired'}
              </span>
              <br />• Serial Port:{' '}
              <span className={pairedSerialPort ? 'text-green-600 font-bold' : 'text-gray-500'}>
                {pairedSerialPort ? 'Active' : 'Not paired'}
              </span>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Printer Connection Mode</label>
                  <select
                    className={inp}
                    value={taxForm.printerType}
                    onChange={(e) => setTaxForm({ ...taxForm, printerType: e.target.value as any })}
                  >
                    <option value="mock">None (Mock / Demo)</option>
                    <option value="browser">Browser Print (Recommended)</option>
                    <option value="webusb">Direct WebUSB (ESC/POS)</option>
                    <option value="webserial">Direct WebSerial (COM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Paper Roll Width</label>
                  <select
                    className={inp}
                    value={taxForm.paperWidth}
                    onChange={(e) => setTaxForm({ ...taxForm, paperWidth: e.target.value as any })}
                  >
                    <option value="80mm">80mm (Standard)</option>
                    <option value="58mm">58mm (Narrow)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { key: 'autoPrintReceipt', label: 'Auto-Print Receipt on Sale' },
                  { key: 'autoKickDrawer', label: 'Auto-Kick Drawer on Cash Sale' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={taxForm[key as keyof TaxConfig] as boolean}
                      onChange={(e) => setTaxForm({ ...taxForm, [key]: e.target.checked })}
                    />
                    {label}
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Cash Drawer Trigger Signal (Pulse Pin)</label>
                <select
                  className={inp}
                  value={taxForm.drawerPin}
                  onChange={(e) => setTaxForm({ ...taxForm, drawerPin: parseInt(e.target.value) })}
                >
                  <option value={0}>Pin 2 (Standard Epson/Star — Dec 0)</option>
                  <option value={1}>Pin 5 (Standard Bixolon/Chinese — Dec 1)</option>
                  <option value={2}>Pin 2 (ASCII '0' — Dec 48)</option>
                  <option value={3}>Pin 5 (ASCII '1' — Dec 49)</option>
                  <option value={4}>Star Micronics BEL Command (Dec 7)</option>
                  <option value={5}>Star/Epson Alternative (Hex 1B 07…)</option>
                </select>
              </div>

              {/* Direct Hardware Pairing */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
                <div>
                  <p className="text-sm font-bold text-blue-900">Direct Hardware Pairing (WebUSB / WebSerial)</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Pair your printer directly for automated cash drawer signals and ESC/POS printing.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 bg-white p-3 rounded-lg border border-blue-200 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-bold text-blue-900 truncate max-w-[140px]">
                      {pairedUsbDevice ? `USB: ${pairedUsbDevice.productName || 'Printer'}` : 'No USB paired'}
                    </span>
                    <button
                      type="button"
                      onClick={handlePairUsb}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold px-3 py-1 rounded-lg transition-all"
                    >
                      {pairedUsbDevice ? 'Change' : 'Pair USB'}
                    </button>
                  </div>
                  <div className="flex-1 bg-white p-3 rounded-lg border border-blue-200 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-bold text-blue-900 truncate max-w-[140px]">
                      {pairedSerialPort ? 'Serial (COM) Active' : 'No Serial paired'}
                    </span>
                    <button
                      type="button"
                      onClick={handlePairSerial}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold px-3 py-1 rounded-lg transition-all"
                    >
                      {pairedSerialPort ? 'Change' : 'Pair Serial'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Test buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg text-sm transition-all"
                >
                  Test Print Receipt
                </button>
                <button
                  type="button"
                  onClick={handleTestDrawer}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg text-sm transition-all"
                >
                  Test Kick Drawer
                </button>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save size={16} /> Save Hardware Settings
              </button>
            </form>

            {/* Danger Zone */}
            {isAdmin && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} className="text-red-600" />
                  <span className="text-sm font-bold text-red-900">Danger Zone: Reset All Records</span>
                </div>
                <p className="text-xs text-red-700 mb-3">
                  Permanently clears all local orders, transaction history, and refund logs from this device.
                  This action is irreversible.
                </p>
                <button
                  type="button"
                  onClick={handleResetAllRecords}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all"
                >
                  Reset System Records
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 3 — Menu & Items Editor
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Panel */}
          <div className={card}>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-teal-600" /> Food Categories
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {initialCategories.map((cat) => (
                <span
                  key={cat.id}
                  className="bg-teal-600 text-white text-xs font-semibold px-3 py-1 rounded-full"
                >
                  {cat.name}
                </span>
              ))}
            </div>
            {isAdmin && (
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  className={`${inp} flex-1`}
                  placeholder="New Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-teal-100 hover:bg-teal-200 text-teal-700 font-bold px-3 py-2 rounded-lg text-sm transition-all disabled:opacity-60"
                >
                  <Plus size={16} />
                </button>
              </form>
            )}
          </div>

          {/* Add New Item */}
          {isAdmin && (
            <div className={`${card} lg:col-span-2`}>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Plus size={18} className="text-blue-500" /> Add New Menu Item
              </h2>
              <form onSubmit={handleAddProduct} className="space-y-3">
                <div className="flex gap-4">
                  {/* Image preview */}
                  <div className="flex-shrink-0">
                    {newImagePreview ? (
                      <img
                        src={newImagePreview}
                        alt="preview"
                        className="w-24 h-24 object-cover rounded-xl border-2 border-teal-400 shadow"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-teal-100 to-blue-100 border-2 border-dashed border-teal-300 flex items-center justify-center text-teal-400">
                        <BookOpen size={28} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Item Name</label>
                      <input
                        type="text"
                        className={inp}
                        placeholder="e.g. Devilled Chicken"
                        value={newItemForm.name}
                        onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Photo Upload (auto-compressed)</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full text-xs text-gray-500 cursor-pointer"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          try {
                            const b64 = await compressImageToBase64(f);
                            setNewImagePreview(b64);
                            setNewItemForm((p) => ({ ...p, imageUrl: b64 }));
                          } catch {
                            showMessage('Image compression failed.', 'error');
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Price (Rs.)</label>
                    <input
                      type="number"
                      className={inp}
                      placeholder="0.00"
                      value={newItemForm.price}
                      onChange={(e) => setNewItemForm({ ...newItemForm, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                    <select
                      className={inp}
                      value={newItemForm.categoryId}
                      onChange={(e) => setNewItemForm({ ...newItemForm, categoryId: e.target.value })}
                      required
                    >
                      <option value="">Select Category</option>
                      {initialCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Plus size={16} /> Add to Menu
                </button>
              </form>
            </div>
          )}

          {/* Menu Directory */}
          <div className={`${card} col-span-1 lg:col-span-3`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Menu Directory ({initialProducts.length} items)
              </h2>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {initialProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  {/* Photo area */}
                  {editingProductId === item.id ? (
                    <div className="relative w-full h-28 bg-gray-100">
                      {editImagePreview || item.imageUrl ? (
                        <img
                          src={editImagePreview || item.imageUrl!}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-teal-100 to-blue-100 flex items-center justify-center text-teal-400">
                          <BookOpen size={32} />
                        </div>
                      )}
                      <label className="absolute bottom-2 left-1/2 -translate-x-1/2 cursor-pointer bg-black/60 text-white text-[10px] font-bold px-3 py-0.5 rounded-full hover:bg-black/80 transition-all whitespace-nowrap">
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                              const b64 = await compressImageToBase64(f);
                              setEditImagePreview(b64);
                              setEditItemForm((p) => ({ ...p, imageUrl: b64 }));
                            } catch {
                              showMessage('Image compression failed.', 'error');
                            }
                          }}
                        />
                      </label>
                    </div>
                  ) : item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-gradient-to-tr from-teal-500 to-blue-400 flex items-center justify-center text-white text-2xl font-bold select-none">
                      {item.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 3)
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}

                  {/* Info / Edit */}
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    {editingProductId === item.id ? (
                      <>
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-bold"
                          value={editItemForm.name}
                          onChange={(e) => setEditItemForm({ ...editItemForm, name: e.target.value })}
                        />
                        <div className="flex gap-1">
                          <input
                            type="number"
                            className="w-1/2 px-2 py-1 border border-gray-300 rounded text-xs"
                            value={editItemForm.price}
                            onChange={(e) => setEditItemForm({ ...editItemForm, price: e.target.value })}
                          />
                          <select
                            className="w-1/2 px-1 py-1 border border-gray-300 rounded text-xs"
                            value={editItemForm.categoryId}
                            onChange={(e) => setEditItemForm({ ...editItemForm, categoryId: e.target.value })}
                          >
                            {initialCategories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSaveEditProduct(item.id)}
                            disabled={isPending}
                            className="flex-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 font-bold py-1 rounded transition-all"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingProductId(null); setEditImagePreview(''); }}
                            className="flex-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 font-bold py-1 rounded transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-sm text-gray-800 leading-tight">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {initialCategories.find((c) => c.id === item.categoryId)?.name ?? '—'}
                        </p>
                        <p className="text-teal-600 font-bold text-sm">Rs. {parseFloat(item.price).toFixed(2)}</p>
                        {isAdmin && (
                          <div className="flex gap-1 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => {
                                setEditingProductId(item.id);
                                setEditItemForm({
                                  name: item.name,
                                  price: item.price,
                                  categoryId: String(item.categoryId),
                                  imageUrl: item.imageUrl || '',
                                });
                                setEditImagePreview(item.imageUrl || '');
                              }}
                              className="flex-1 text-[10px] bg-gray-100 hover:bg-blue-100 text-blue-700 font-bold py-1 rounded transition-all flex items-center justify-center gap-1"
                            >
                              <Edit2 size={10} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(item.id)}
                              className="flex-1 text-[10px] bg-gray-100 hover:bg-red-100 text-red-600 font-bold py-1 rounded transition-all flex items-center justify-center gap-1"
                            >
                              <Trash2 size={10} /> Del
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 4 — User Management
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && isManagerOrAbove && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Directory Table */}
          <div className={`${card} lg:col-span-2`}>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={18} className="text-teal-600" /> User Directory
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs font-semibold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="pb-2 pr-4">Employee ID</th>
                    <th className="pb-2 pr-4">Username</th>
                    <th className="pb-2 pr-4">Role</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {initialUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs text-gray-600">
                        {editingUserId === user.id ? (
                          <input
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
                            value={editUserForm.employeeId}
                            onChange={(e) => setEditUserForm({ ...editUserForm, employeeId: e.target.value })}
                          />
                        ) : (
                          user.employeeId || '—'
                        )}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-gray-800">
                        {editingUserId === user.id ? (
                          <input
                            className="w-28 px-2 py-1 border border-gray-300 rounded text-xs"
                            value={editUserForm.username}
                            onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                          />
                        ) : (
                          user.username
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {editingUserId === user.id ? (
                          <select
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                            value={editUserForm.role}
                            onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as UserRole })}
                          >
                            <option value="cashier">Cashier</option>
                            <option value="manager">Manager</option>
                            <option value="director">Director</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${roleBadge(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {editingUserId === user.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEditUser(user.id)}
                              disabled={isPending}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setEditingUserId(user.id);
                                  setEditUserForm({
                                    username: user.username,
                                    employeeId: user.employeeId || '',
                                    role: user.role as UserRole,
                                  });
                                }}
                                className="text-indigo-500 hover:text-indigo-700 transition-colors"
                                title="Edit user"
                              >
                                <Edit2 size={15} />
                              </button>
                            )}
                            {isAdmin && session.userId !== user.id && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="Delete user"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel: Create + Change Password */}
          <div className="space-y-6">
            {/* Create Staff */}
            {isAdmin && (
              <div className={card}>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users size={16} className="text-teal-600" /> Create New Staff
                </h3>
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Employee ID</label>
                    <input
                      type="text"
                      className={inp}
                      placeholder="e.g. EMP-101"
                      value={newUserForm.employeeId}
                      onChange={(e) => setNewUserForm({ ...newUserForm, employeeId: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Username</label>
                    <input
                      type="text"
                      className={inp}
                      placeholder="e.g. john_doe"
                      value={newUserForm.username}
                      onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
                    <select
                      className={inp}
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    >
                      <option value="cashier">Cashier</option>
                      <option value="manager">Manager</option>
                      <option value="director">Director</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Access Password</label>
                    <input
                      type="password"
                      className={inp}
                      placeholder="Min. 4 characters"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-60"
                  >
                    Create Staff Member
                  </button>
                </form>
              </div>
            )}

            {/* Change Password */}
            <div className={card}>
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Key size={16} className="text-amber-500" /> Change User Password
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-3">
                {isAdmin && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Select Account</label>
                    <select
                      className={inp}
                      value={changePassTargetId}
                      onChange={(e) => setChangePassTargetId(Number(e.target.value))}
                    >
                      {initialUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({u.employeeId || u.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label>
                  <input
                    type="password"
                    className={inp}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-60"
                >
                  Apply New Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
