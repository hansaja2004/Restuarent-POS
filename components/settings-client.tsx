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
  writeToWebUSB,
  writeToWebSerial,
  getDrawerKickBytes,
  printHTMLReceipt,
  generateEscPosImage,
} from '@/lib/escpos';
import type { TaxConfig } from '@/lib/escpos';
import { useConfig, defaultConfig as libDefaultConfig } from '@/components/ConfigContext';
import { createUser, updateUser, deleteUser, changeUserPassword } from '@/app/actions/employees';
import { saveServerConfig, printToNetworkPrinter } from '@/app/actions/settings';

// ── Types ──────────────────────────────────────────────────────────────────────

type UserRole = 'admin' | 'manager' | 'director' | 'cashier';

interface DBUser {
  id: number;
  username: string;
  role: string;
  employeeId: string | null;
}



interface Props {
  session: { userId: number; role: string; username: string };
  initialUsers: DBUser[];
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
    setTaxForm((prev) => ({ ...prev, ...serverConfig, ...config }));
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
      } else if (taxForm.printerType === 'network') {
        if (!taxForm.networkIp || !taxForm.networkPort) return alert('Configure Network IP and Port first!');
        const bytes = compileReceiptESC(mockOrder, taxForm, session.username);
        const res = await printToNetworkPrinter(taxForm.networkIp, taxForm.networkPort, Array.from(bytes));
        if (res.error) throw new Error(res.error);
        showMessage('Network Test Print sent successfully!');
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
      if (taxForm.printerType === 'network') {
        if (!taxForm.networkIp || !taxForm.networkPort) return alert('Configure Network IP and Port first!');
        const res = await printToNetworkPrinter(taxForm.networkIp, taxForm.networkPort, Array.from(bytes));
        if (res.error) errors.push('Network: ' + res.error);
        else sent = true;
      }

      if (sent) {
        showMessage('Cash Drawer kick command sent!');
        if (errors.length) alert('Drawer triggered with some errors: ' + errors.join(', '));
      } else {
        alert(errors.length ? 'Failed: ' + errors.join(', ') : 'No USB/Serial device paired, or network failed.');
      }
    } catch (err: any) {
      alert('Drawer Test Failed: ' + err.message);
    }
  };

  const handleResetAllRecords = () => {
    const pin = prompt('Enter Manager Authorization PIN to authorize this action:');
    if (pin !== taxForm.refundPin) {
      if (pin !== null) alert('Authorization Denied! Incorrect PIN.');
      return;
    }

    const confirmPhrase = prompt(
      'WARNING: This will permanently delete ALL global and local transaction history.\nType "DELETE ALL" to confirm:',
    );
    if (confirmPhrase?.trim().toUpperCase() === 'DELETE ALL') {
      startTransition(async () => {
        // Clear Local Storage
        localStorage.removeItem('pos_orders');
        localStorage.removeItem('refund_logs');
        
        // Clear DB
        const { wipeAllTransactions } = await import('@/app/actions/settings');
        const res = await wipeAllTransactions();
        
        if (res.error) {
          showMessage(res.error, 'error');
        } else {
          showMessage('All records wiped successfully.');
          setTimeout(() => window.location.reload(), 1500);
        }
      });
    } else {
      if (confirmPhrase !== null) alert('Authorization Denied! Incorrect confirmation phrase.');
    }
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
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Receipt Logo</label>
                  <div className="flex items-center gap-3">
                    {taxForm.receiptLogoUrl && (
                      <img src={taxForm.receiptLogoUrl} alt="Logo" className="h-12 w-auto max-w-[100px] object-contain bg-white border rounded" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="text-xs text-gray-500 cursor-pointer"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          const b64 = await compressImageToBase64(f);
                          const escBytes = await generateEscPosImage(b64);
                          setTaxForm({ ...taxForm, receiptLogoUrl: b64, receiptLogoEsc: escBytes });
                        } catch {
                          showMessage('Image compression failed.', 'error');
                        }
                      }}
                    />
                    {taxForm.receiptLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setTaxForm({ ...taxForm, receiptLogoUrl: '', receiptLogoEsc: undefined })}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
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

          {/* Danger Zone (Moved from Hardware tab) */}
          {isAdmin && (
            <div className="col-span-1 lg:col-span-2 mt-4 bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={20} className="text-red-600" />
                <h2 className="text-lg font-bold text-red-900">Danger Zone: Factory Reset Data</h2>
              </div>
              <p className="text-sm text-red-700 mb-4">
                Permanently deletes ALL orders, transaction history, and refund logs from the global database and this device.
                This action is irreversible. Use this button to reset all past records in the entire system.
              </p>
              <button
                type="button"
                disabled={isPending}
                onClick={handleResetAllRecords}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 w-full md:w-auto"
              >
                <Trash2 size={16} /> Wipe All System Data & Records
              </button>
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
                    <option value="network">Network IP (RJ45 / LAN)</option>
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

              {taxForm.printerType === 'network' && (
                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="col-span-2">
                    <p className="text-sm font-bold text-blue-900 mb-2">Network Printer Configuration</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Printer IP Address</label>
                    <input
                      type="text"
                      className={inp}
                      placeholder="192.168.1.100"
                      value={taxForm.networkIp || ''}
                      onChange={(e) => setTaxForm({ ...taxForm, networkIp: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Printer Port (Default: 9100)</label>
                    <input
                      type="number"
                      className={inp}
                      placeholder="9100"
                      value={taxForm.networkPort || 9100}
                      onChange={(e) => setTaxForm({ ...taxForm, networkPort: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              )}

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
