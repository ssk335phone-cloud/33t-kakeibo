import React, { useState, useMemo, useEffect } from 'react';
import { 
  Home, 
  PlusCircle, 
  List, 
  CalendarCheck, 
  Utensils, 
  ShoppingCart, 
  Home as HomeIcon, 
  Zap, 
  Heart, 
  Train, 
  MoreHorizontal, 
  Copy, 
  Check, 
  Wallet,
  ArrowRightLeft,
  Plus,
  Settings,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Lock,
  Pencil,
  ArrowUpDown,
  BarChart3,
  Calendar as CalendarIcon,
  Coffee, 
  Droplets, 
  Smartphone, 
  Dog, 
  PartyPopper, 
  Car, 
  Plane, 
  Gift, 
  Monitor, 
  Book, 
  Music, 
  Film,
  Scissors,
  Shirt,
  Pill,
  Smile,
  Baby
} from 'lucide-react';

// --- Firebase のインポート ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

// いただいたFirebase設定
const customFirebaseConfig = {
  apiKey: "AIzaSyAD2u3XyZbAR39-1cocJdPx_YEvo5cq1To",
  authDomain: "kakeibo-9ed41.firebaseapp.com",
  projectId: "kakeibo-9ed41",
  storageBucket: "kakeibo-9ed41.firebasestorage.app",
  messagingSenderId: "70416192251",
  appId: "1:70416192251:web:83d3899b958769460a565e"
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : customFirebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? __app_id : '33t-kakeibo';

const txCollection = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
const fixedCollection = collection(db, 'artifacts', appId, 'public', 'data', 'fixedExpenses');
const settingsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'appSettings', 'general');

// 🔒 【重要】お二人だけの秘密の合言葉
const SECRET_PASSPHRASE = "!1214083120190322";

// --- アイコンとカラーの設定 ---
const ICON_MAP = {
  Utensils, ShoppingCart, HomeIcon, Zap, Heart, Train, MoreHorizontal,
  Coffee, Droplets, Smartphone, Dog, PartyPopper, Car, Plane, Gift, 
  Monitor, Book, Music, Film, Scissors, Shirt, Pill, Smile, Baby
};

const COLOR_PRESETS = [
  { color: 'bg-orange-100 text-orange-600', hexColor: '#ea580c' },
  { color: 'bg-red-100 text-red-600', hexColor: '#dc2626' },
  { color: 'bg-blue-100 text-blue-600', hexColor: '#2563eb' },
  { color: 'bg-emerald-100 text-emerald-600', hexColor: '#059669' },
  { color: 'bg-yellow-100 text-yellow-600', hexColor: '#ca8a04' },
  { color: 'bg-cyan-100 text-cyan-600', hexColor: '#0891b2' },
  { color: 'bg-indigo-100 text-indigo-600', hexColor: '#4f46e5' },
  { color: 'bg-violet-100 text-violet-600', hexColor: '#7c3aed' },
  { color: 'bg-fuchsia-100 text-fuchsia-600', hexColor: '#c026d3' },
  { color: 'bg-pink-100 text-pink-600', hexColor: '#db2777' },
  { color: 'bg-rose-100 text-rose-600', hexColor: '#e11d48' },
  { color: 'bg-amber-100 text-amber-600', hexColor: '#d97706' },
  { color: 'bg-lime-100 text-lime-600', hexColor: '#65a30d' },
  { color: 'bg-teal-100 text-teal-600', hexColor: '#0d9488' },
  { color: 'bg-sky-100 text-sky-600', hexColor: '#0284c7' },
  { color: 'bg-gray-200 text-gray-700', hexColor: '#4b5563' },
];

const DEFAULT_CATEGORIES = [
  { id: 'food', name: '食費', iconName: 'Utensils', color: 'bg-orange-100 text-orange-600', hexColor: '#ea580c' },
  { id: 'eatout', name: '外食費', iconName: 'Coffee', color: 'bg-red-100 text-red-600', hexColor: '#dc2626' },
  { id: 'daily', name: '日用品', iconName: 'ShoppingCart', color: 'bg-blue-100 text-blue-600', hexColor: '#2563eb' },
  { id: 'rent', name: '家賃', iconName: 'HomeIcon', color: 'bg-emerald-100 text-emerald-600', hexColor: '#059669' },
  { id: 'utility', name: '電気・ガス', iconName: 'Zap', color: 'bg-yellow-100 text-yellow-600', hexColor: '#ca8a04' },
  { id: 'water', name: '水道代', iconName: 'Droplets', color: 'bg-cyan-100 text-cyan-600', hexColor: '#0891b2' },
  { id: 'telecom', name: '通信費', iconName: 'Smartphone', color: 'bg-indigo-100 text-indigo-600', hexColor: '#4f46e5' },
  { id: 'dog', name: 'お犬', iconName: 'Dog', color: 'bg-amber-100 text-amber-600', hexColor: '#d97706' },
  { id: 'event', name: 'イベント', iconName: 'PartyPopper', color: 'bg-fuchsia-100 text-fuchsia-600', hexColor: '#c026d3' },
  { id: 'date', name: '交際費', iconName: 'Heart', color: 'bg-pink-100 text-pink-600', hexColor: '#db2777' },
  { id: 'transport', name: '交通費', iconName: 'Train', color: 'bg-sky-100 text-sky-600', hexColor: '#0284c7' },
  { id: 'other', name: 'その他', iconName: 'MoreHorizontal', color: 'bg-gray-200 text-gray-700', hexColor: '#4b5563' },
];

// --- 締め日計算ロジック ---
const getMonthDateRange = (yearMonth, closingDate) => {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const formatD = (d) => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

  if (!closingDate || closingDate === 'end' || closingDate === '0') {
    const startD = new Date(year, month - 1, 1);
    const endD = new Date(year, month, 0); 
    return { startDate: formatD(startD), endDate: formatD(endD) };
  } else {
    const cd = parseInt(closingDate, 10);
    const startD = new Date(year, month - 2, cd + 1);
    const endD = new Date(year, month - 1, cd);
    return { startDate: formatD(startD), endDate: formatD(endD) };
  }
};

// --- コンポーネント群 ---

const MonthSelector = ({ selectedMonth, onMonthChange, onPrev, onNext, dateRangeText }) => {
  const year = parseInt(selectedMonth.split('-')[0], 10);
  const month = parseInt(selectedMonth.split('-')[1], 10);
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 10}, (_, i) => currentYear - 5 + i);
  const months = Array.from({length: 12}, (_, i) => i + 1);

  return (
    <div className="bg-white px-3 py-3 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col">
      <div className="flex items-center justify-between w-full">
        <button onClick={onPrev} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <select 
                value={year} 
                onChange={(e) => onMonthChange(`${e.target.value}-${month.toString().padStart(2, '0')}`)}
                className="appearance-none bg-gray-50 border border-gray-200 font-bold text-gray-700 py-1.5 pl-3 pr-7 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                {years.map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
            <div className="relative">
              <select 
                value={month} 
                onChange={(e) => onMonthChange(`${year}-${e.target.value.padStart(2, '0')}`)}
                className="appearance-none bg-gray-50 border border-gray-200 font-bold text-gray-700 py-1.5 pl-3 pr-7 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                {months.map(m => <option key={m} value={m}>{m}月</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
          {dateRangeText && (
            <span className="text-[10px] text-gray-400 font-bold mt-1.5 bg-gray-50 px-2 py-0.5 rounded">
              {dateRangeText}
            </span>
          )}
        </div>
        <button onClick={onNext} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

const HomeView = ({ selectedMonth, setSelectedMonth, handlePrevMonth, handleNextMonth, dateRangeText, stats, users, categories, settings }) => {
  let cumulativePercent = 0;
  const gradientStops = stats.categoryTotals.length > 0 
    ? stats.categoryTotals.map(c => {
        const cat = categories.find(cat => cat.id === c.id) || { hexColor: '#9ca3af' };
        const percent = (c.amount / stats.total) * 100;
        const start = cumulativePercent;
        const end = cumulativePercent + percent;
        cumulativePercent += percent;
        return `${cat.hexColor} ${start}% ${end}%`;
      }).join(', ')
    : '#f3f4f6 0% 100%';

  return (
    <div className="p-5 pb-32 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <MonthSelector 
        selectedMonth={selectedMonth} 
        onMonthChange={setSelectedMonth} 
        onPrev={handlePrevMonth} 
        onNext={handleNextMonth} 
        dateRangeText={dateRangeText}
      />

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-gray-500 text-sm font-medium mb-1">共同生活費 合計</h2>
        <div className="text-4xl font-bold text-gray-800 mb-6 break-words">
          ¥{stats.total.toLocaleString()}
        </div>

        <div className="relative h-4 w-full bg-gray-100 rounded-full overflow-hidden flex mb-3">
          <div 
            className={`h-full ${users.user1.color} transition-all duration-500`} 
            style={{ width: stats.total > 0 ? `${(stats.u1Total / stats.total) * 100}%` : '50%' }}
          />
          <div 
            className={`h-full ${users.user2.color} transition-all duration-500`} 
            style={{ width: stats.total > 0 ? `${(stats.u2Total / stats.total) * 100}%` : '50%' }}
          />
          {stats.total > 0 && (
            <div 
              className="absolute top-0 bottom-0 w-1 bg-gray-800 z-10 opacity-70 rounded-full -translate-x-1/2"
              style={{ left: `${(stats.u1Target / stats.total) * 100}%` }}
            />
          )}
        </div>

        <div className="flex justify-between text-sm mb-3">
          <div className="flex items-center gap-1 w-1/2 pr-2">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${users.user1.color}`}></div>
            <span className="text-gray-600 truncate">{users.user1.name}: ¥{stats.u1Total.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 w-1/2 justify-end pl-2">
            <span className="text-gray-600 truncate text-right">¥{stats.u2Total.toLocaleString()} :{users.user2.name}</span>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${users.user2.color}`}></div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center text-xs text-gray-500 font-medium border border-gray-100">
          <span className="truncate">目標: ¥{stats.u1Target.toLocaleString()}</span>
          <span className="bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200 text-[10px] mx-2 flex-shrink-0">
            {settings.splitMethod === 'ratio' ? `ルール: ${settings.user1Ratio}:${100-settings.user1Ratio}` : '金額固定'}
          </span>
          <span className="truncate">目標: ¥{stats.u2Target.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-teal-50 p-5 rounded-3xl border border-teal-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white rounded-full text-teal-600 shadow-sm flex-shrink-0">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <p className="text-xs text-teal-600 font-medium mb-1">現在の精算状況</p>
            {stats.total === 0 ? (
              <p className="font-bold text-gray-800">支出はありません</p>
            ) : stats.u1Diff > 0 ? (
              <p className="font-bold text-gray-800 text-sm break-words">
                {users.user2.name}から <span className="text-teal-600 text-lg">¥{Math.abs(stats.u1Diff).toLocaleString()}</span> もらう
              </p>
            ) : stats.u1Diff < 0 ? (
              <p className="font-bold text-gray-800 text-sm break-words">
                {users.user2.name}へ <span className="text-rose-500 text-lg">¥{Math.abs(stats.u1Diff).toLocaleString()}</span> 渡す
              </p>
            ) : (
              <p className="font-bold text-gray-800">目標通りピッタリです</p>
            )}
          </div>
        </div>
      </div>

      {stats.categoryTotals.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6 text-sm flex items-center gap-2">
            <PieChart size={18} className="text-teal-600" />
            ジャンル別支出
          </h3>
          
          <div className="flex items-center justify-center mb-8">
            <div 
              className="w-40 h-40 rounded-full flex items-center justify-center relative transition-all duration-1000 ease-out"
              style={{ background: `conic-gradient(${gradientStops})` }}
            >
              <div className="w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                <span className="text-[10px] text-gray-500 font-bold">合計</span>
                <span className="text-sm font-black text-gray-800">¥{stats.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {stats.categoryTotals.map(c => {
              const cat = categories.find(cat => cat.id === c.id) || { name: '不明なジャンル', iconName: 'MoreHorizontal', color: 'bg-gray-200 text-gray-500', hexColor: '#9ca3af' };
              const Icon = ICON_MAP[cat.iconName] || ICON_MAP.MoreHorizontal;
              const percentage = Math.round((c.amount / stats.total) * 100);
              
              return (
                <div key={c.id} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl">
                  <div className={`p-2 rounded-full ${cat.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{cat.name}</span>
                      <div className="text-right">
                        <span className="font-bold text-gray-800">¥{c.amount.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 font-medium ml-2 w-8 inline-block">{percentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats.total === 0 && (
        <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 border-dashed">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wallet className="text-gray-300" size={32} />
          </div>
          <p className="text-gray-500 font-medium text-sm">まだ記録がありません</p>
          <p className="text-gray-400 text-xs mt-1">下の＋ボタンから記録を追加しましょう</p>
        </div>
      )}
    </div>
  );
};

const TransactionFormView = ({ mode, editingTx, setEditingTx, copyTemplate, setCopyTemplate, setActiveTab, setSelectedMonth, users, categories, settings, db, appId, txCollection, showToast }) => {
  const isEdit = mode === 'edit';
  const txToEdit = isEdit ? editingTx : null;
  // カテゴリが削除されていた場合の安全対策（先頭のカテゴリを初期値にする）
  const defaultCategoryId = categories.length > 0 ? categories[0].id : 'food';

  const [date, setDate] = useState(txToEdit ? txToEdit.date : new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(txToEdit ? txToEdit.amount.toString() : '');
  const [paidBy, setPaidBy] = useState(txToEdit ? txToEdit.paidBy : 'user1');
  const [categoryId, setCategoryId] = useState(txToEdit ? txToEdit.categoryId : defaultCategoryId);
  const [memo, setMemo] = useState(txToEdit ? txToEdit.memo : '');
  const [isSaving, setIsSaving] = useState(false);
  
  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [customSplitMode, setCustomSplitMode] = useState('ratio');
  const [customUser1Ratio, setCustomUser1Ratio] = useState(settings.user1Ratio);
  const [customUser1Amount, setCustomUser1Amount] = useState('');

  useEffect(() => {
    if (isEdit && txToEdit) {
      setDate(txToEdit.date);
      setAmount(txToEdit.amount.toString());
      setPaidBy(txToEdit.paidBy);
      setCategoryId(txToEdit.categoryId);
      setMemo(txToEdit.memo || '');
      setIsCustomSplit(!!txToEdit.isCustomSplit);
      setCustomSplitMode(txToEdit.customSplitMode || 'ratio');
      setCustomUser1Ratio(txToEdit.customUser1Ratio ?? settings.user1Ratio);
      setCustomUser1Amount(txToEdit.customUser1Amount ?? '');
    } else if (!isEdit && copyTemplate) {
      setDate(new Date().toISOString().slice(0, 10));
      setAmount(copyTemplate.amount.toString());
      setPaidBy(copyTemplate.paidBy);
      setCategoryId(copyTemplate.categoryId);
      setMemo(copyTemplate.memo || '');
      setIsCustomSplit(!!copyTemplate.isCustomSplit);
      setCustomSplitMode(copyTemplate.customSplitMode || 'ratio');
      setCustomUser1Ratio(copyTemplate.customUser1Ratio ?? settings.user1Ratio);
      setCustomUser1Amount(copyTemplate.customUser1Amount ?? '');
      setCopyTemplate(null);
    } else if (!isEdit && !copyTemplate) {
      setDate(new Date().toISOString().slice(0, 10));
      setAmount('');
      setPaidBy('user1');
      setCategoryId(defaultCategoryId);
      setMemo('');
      setIsCustomSplit(false);
      setCustomSplitMode('ratio');
      setCustomUser1Ratio(settings.user1Ratio);
      setCustomUser1Amount('');
    }
  }, [txToEdit, isEdit, copyTemplate, settings.user1Ratio, setCopyTemplate, defaultCategoryId]);

  const handleSave = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      showToast('正しい金額を入力してください');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        date,
        amount: Number(amount),
        paidBy,
        categoryId,
        memo,
        isCustomSplit,
        customSplitMode: isCustomSplit ? customSplitMode : null,
        customUser1Ratio: (isCustomSplit && customSplitMode === 'ratio') ? Number(customUser1Ratio) : null,
        customUser1Amount: (isCustomSplit && customSplitMode === 'amount') ? Number(customUser1Amount) : null,
      };

      if (isEdit) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', txToEdit.id), {
          ...payload,
          updatedAt: Date.now()
        });
        showToast('記録を更新しました');
        setEditingTx(null);
        setActiveTab('history');
      } else {
        await addDoc(txCollection, {
          ...payload,
          createdAt: Date.now()
        });
        showToast('記録を保存しました');
        
        const txDate = new Date(date);
        const d = txDate.getDate();
        let targetMonth = txDate.toISOString().slice(0, 7);
        
        if (settings.closingDate !== 'end' && settings.closingDate !== '0') {
          const cd = parseInt(settings.closingDate, 10);
          if (d > cd) {
            const nextM = new Date(txDate.getFullYear(), txDate.getMonth() + 1, 1);
            targetMonth = nextM.toISOString().slice(0, 7);
          }
        }
        setSelectedMonth(targetMonth);
        setActiveTab('home');
      }
    } catch (error) {
      console.error("Error saving document: ", error);
      showToast('エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 h-full overflow-y-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {isEdit ? <Pencil className="text-teal-600" /> : <Wallet className="text-teal-600" />}
          {isEdit ? '支出を編集する' : '支出を記録する'}
        </h2>
        {isEdit && (
          <button 
            onClick={() => { setEditingTx(null); setActiveTab('history'); }}
            className="text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            キャンセル
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">金額</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">¥</span>
            <input 
              type="number" 
              inputMode="numeric"
              pattern="\d*"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-4 py-4 text-right text-3xl font-bold bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">誰が支払った？</label>
          <div className="flex gap-3">
            {Object.values(users).map(u => (
              <button
                key={u.id}
                onClick={() => setPaidBy(u.id)}
                className={`flex-1 py-3 rounded-2xl font-bold transition-all border-2 truncate px-2 ${
                  paidBy === u.id 
                    ? `${u.color} border-transparent text-white shadow-md scale-[1.02]` 
                    : `bg-white border-gray-100 text-gray-500 hover:bg-gray-50`
                }`}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>

        {/* 個別割り勘設定 */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 transition-all">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">この支出だけ割り勘割合を変更する</label>
            <button
              type="button"
              onClick={() => setIsCustomSplit(!isCustomSplit)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center shadow-inner flex-shrink-0 ml-2 ${isCustomSplit ? 'bg-teal-500' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${isCustomSplit ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          
          {isCustomSplit && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 border-t border-gray-200 pt-4">
              <div className="flex gap-2 mb-4 p-1 bg-gray-200/50 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setCustomSplitMode('ratio')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${customSplitMode === 'ratio' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  割合(%)で指定
                </button>
                <button 
                  type="button"
                  onClick={() => setCustomSplitMode('amount')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${customSplitMode === 'amount' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  金額(円)で指定
                </button>
              </div>

              {customSplitMode === 'ratio' ? (
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1 text-center truncate">
                      <p className="text-[10px] font-bold text-teal-600 mb-1 truncate">{users.user1.name}</p>
                      <div className="text-xl font-bold text-gray-800">{customUser1Ratio}%</div>
                    </div>
                    <span className="font-bold text-gray-300 flex-shrink-0">:</span>
                    <div className="flex-1 text-center truncate">
                      <p className="text-[10px] font-bold text-rose-500 mb-1 truncate">{users.user2.name}</p>
                      <div className="text-xl font-bold text-gray-800">{100 - customUser1Ratio}%</div>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={customUser1Ratio} 
                    onChange={(e) => setCustomUser1Ratio(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500 mt-2"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-teal-600 mb-1 text-center truncate">{users.user1.name} (負担額)</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">¥</span>
                      <input 
                        type="number" 
                        inputMode="numeric"
                        pattern="\d*"
                        value={customUser1Amount} 
                        onChange={(e) => setCustomUser1Amount(e.target.value)}
                        placeholder="0"
                        className="w-full pl-6 pr-2 py-2 text-right font-bold bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg"
                      />
                    </div>
                  </div>
                  <span className="font-bold text-gray-300 mt-4 flex-shrink-0">:</span>
                  <div className="flex-1 text-center min-w-0">
                    <label className="block text-[10px] font-bold text-rose-500 mb-1 truncate">{users.user2.name} (残り)</label>
                    <div className="w-full py-2 bg-gray-100 border border-gray-100 rounded-xl text-gray-500 font-bold text-right pr-3 text-lg h-11 flex items-center justify-end truncate">
                      ¥{Math.max(0, (Number(amount) || 0) - (Number(customUser1Amount) || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2 flex justify-between items-end">
            <span>ジャンル</span>
            <button onClick={() => setActiveTab('settings')} className="text-xs text-teal-600 hover:underline">追加・編集</button>
          </label>
          <div className="grid grid-cols-4 gap-3">
            {categories.map(c => {
              const Icon = ICON_MAP[c.iconName] || ICON_MAP.MoreHorizontal;
              const isSelected = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`flex flex-col items-center justify-start py-3 px-1 rounded-2xl transition-all border-2 ${
                    isSelected ? 'border-teal-500 bg-teal-50 scale-105 shadow-sm' : 'border-transparent bg-white shadow-sm hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-full mb-1 flex-shrink-0 ${isSelected ? 'bg-teal-500 text-white' : c.color}`}>
                    <Icon size={20} />
                  </div>
                  <span className={`text-[11px] leading-tight font-bold text-center break-words w-full px-0.5 ${isSelected ? 'text-teal-700' : 'text-gray-500'}`}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">日付</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">詳細・メモ</label>
          <input 
            type="text" 
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="何に使った？ (任意)"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-200 transition-all active:scale-[0.98]"
        >
          {isSaving ? '保存中...' : (isEdit ? '更新する' : '登録する')}
        </button>
      </div>
    </div>
  );
};

const HistoryView = ({ transactions, currentMonthTransactions, selectedMonth, setSelectedMonth, handlePrevMonth, handleNextMonth, dateRangeText, historySortMode, setHistorySortMode, categories, users, settings, setCopyTemplate, setEditingTx, setActiveTab, showToast, db, appId }) => {
  const [historyTab, setHistoryTab] = useState('list');
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportCategory, setReportCategory] = useState('all');
  const [selectedCalDate, setSelectedCalDate] = useState(null);

  const displayData = useMemo(() => {
    const sorted = [...currentMonthTransactions];
    
    if (historySortMode === 'date-desc' || historySortMode === 'date-asc') {
      const isDesc = historySortMode === 'date-desc';
      sorted.sort((a, b) => {
        if (a.date !== b.date) return isDesc ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
        return isDesc ? (b.createdAt || 0) - (a.createdAt || 0) : (a.createdAt || 0) - (b.createdAt || 0);
      });
      return { type: 'flat', data: sorted };
      
    } else if (historySortMode === 'amount-desc' || historySortMode === 'amount-asc') {
      const isDesc = historySortMode === 'amount-desc';
      sorted.sort((a, b) => isDesc ? b.amount - a.amount : a.amount - b.amount);
      return { type: 'flat', data: sorted };
      
    } else if (historySortMode === 'category') {
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date) || (b.createdAt || 0) - (a.createdAt || 0)); 
      const groups = {};
      sorted.forEach(t => {
        const catId = t.categoryId;
        if (!groups[catId]) groups[catId] = [];
        groups[catId].push(t);
      });
      const formatCat = (catId) => categories.find(c => c.id === catId)?.name || 'その他';
      return { type: 'grouped', data: groups, formatKey: formatCat };
    }
  }, [currentMonthTransactions, historySortMode, categories]);

  const reportData = useMemo(() => {
    const data = [];
    let maxAmount = 0;

    for (let i = 1; i <= 12; i++) {
      const monthStr = i.toString().padStart(2, '0');
      const currMonthRange = getMonthDateRange(`${reportYear}-${monthStr}`, settings.closingDate);
      const prevMonthRange = getMonthDateRange(`${reportYear - 1}-${monthStr}`, settings.closingDate);

      let currTotal = 0;
      let prevTotal = 0;

      transactions.forEach(t => {
        if (!t.date) return;
        if (reportCategory !== 'all' && t.categoryId !== reportCategory) return;
        if (t.date >= currMonthRange.startDate && t.date <= currMonthRange.endDate) currTotal += t.amount;
        if (t.date >= prevMonthRange.startDate && t.date <= prevMonthRange.endDate) prevTotal += t.amount;
      });

      if (currTotal > maxAmount) maxAmount = currTotal;
      if (prevTotal > maxAmount) maxAmount = prevTotal;

      data.push({ month: i, currTotal, prevTotal });
    }
    return { data, maxAmount: maxAmount === 0 ? 1 : maxAmount }; 
  }, [transactions, reportYear, reportCategory, settings.closingDate]);

  const { calendarDays, dailyData } = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10) - 1;

    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(`${yearStr}-${monthStr}-${i.toString().padStart(2, '0')}`);
    }

    const prefix = selectedMonth; 
    const calTx = transactions.filter(t => t.date && t.date.startsWith(prefix));
    
    const dData = {};
    calTx.forEach(t => {
      if (!dData[t.date]) dData[t.date] = { total: 0, items: [] };
      dData[t.date].total += t.amount;
      dData[t.date].items.push(t);
    });

    return { calendarDays: days, dailyData: dData };
  }, [selectedMonth, transactions]);

  const handleCopy = (tx) => {
    setCopyTemplate(tx);
    setActiveTab('add');
  };

  const handleEdit = (tx) => {
    setEditingTx(tx);
    setActiveTab('edit');
  };

  const handleDeleteTx = async (id) => {
    if (!confirm('この記録を削除してもよろしいですか？')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', id));
      showToast('記録を削除しました');
    } catch (error) {
      console.error("Error deleting document: ", error);
      showToast('削除に失敗しました');
    }
  };

  const renderTransactionItem = (t) => {
    const cat = categories.find(c => c.id === t.categoryId) || { name: '不明なジャンル', iconName: 'MoreHorizontal', color: 'bg-gray-200 text-gray-500', hexColor: '#9ca3af' };
    const user = users[t.paidBy];
    const Icon = ICON_MAP[cat.iconName] || ICON_MAP.MoreHorizontal;
    return (
      <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 transition-all hover:shadow-md">
        <div className={`p-3 rounded-full flex-shrink-0 ${cat.color}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 truncate">{t.memo || cat.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">{t.date.replace(/-/g, '/')}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full truncate max-w-[80px] ${user?.lightColor || 'bg-gray-100'}`}>
              {user?.name || '不明'}
            </span>
            {t.isCustomSplit && (
              <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold border border-indigo-100">
                {t.customSplitMode === 'amount' ? '個別金額' : '個別割合'}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="font-bold text-gray-800">
            ¥{t.amount.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button 
              onClick={() => handleCopy(t)}
              className="text-xs flex items-center justify-center text-teal-600 bg-teal-50 p-1.5 rounded-lg hover:bg-teal-100 transition-colors"
              title="コピーして新規作成"
            >
              <Copy size={14} />
            </button>
            <button 
              onClick={() => handleEdit(t)}
              className="text-xs flex items-center justify-center text-blue-500 bg-blue-50 p-1.5 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors"
              title="編集"
            >
              <Pencil size={14} />
            </button>
            <button 
              onClick={() => handleDeleteTx(t.id)}
              className="text-xs flex items-center justify-center text-red-400 bg-red-50 p-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
              title="削除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 h-full overflow-y-auto pb-32 animate-in fade-in duration-300">
      <div className="flex gap-2 mb-6 p-1.5 bg-gray-100 rounded-2xl">
        <button 
          onClick={() => setHistoryTab('list')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-2 ${historyTab === 'list' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <List size={16} /> リスト
        </button>
        <button 
          onClick={() => setHistoryTab('calendar')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-2 ${historyTab === 'calendar' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <CalendarIcon size={16} /> カレンダー
        </button>
        <button 
          onClick={() => setHistoryTab('report')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-2 ${historyTab === 'report' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <BarChart3 size={16} /> レポート
        </button>
      </div>

      {historyTab === 'list' && (
        <div className="animate-in fade-in">
          <MonthSelector 
            selectedMonth={selectedMonth} 
            onMonthChange={setSelectedMonth} 
            onPrev={handlePrevMonth} 
            onNext={handleNextMonth} 
            dateRangeText={dateRangeText}
          />

          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm">
              <ArrowUpDown size={14} className="text-gray-400" />
              <select 
                value={historySortMode}
                onChange={(e) => setHistorySortMode(e.target.value)}
                className="text-xs font-bold text-gray-600 bg-transparent outline-none cursor-pointer"
              >
                <option value="date-desc">日付 (新しい順)</option>
                <option value="date-asc">日付 (古い順)</option>
                <option value="amount-desc">金額 (高い順)</option>
                <option value="amount-asc">金額 (低い順)</option>
                <option value="category">ジャンル別</option>
              </select>
            </div>
          </div>

          {displayData.data.length === 0 || Object.keys(displayData.data).length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 border-dashed">
              <List className="text-gray-300 w-12 h-12 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">この期間の記録はありません</p>
            </div>
          ) : (
            <div className="space-y-6">
              {displayData.type === 'grouped' ? (
                Object.keys(displayData.data).sort((a, b) => {
                  if (historySortMode === 'category') return displayData.formatKey(a).localeCompare(displayData.formatKey(b));
                  return historySortMode === 'date-asc' ? a.localeCompare(b) : b.localeCompare(a);
                }).map(groupKey => (
                  <div key={groupKey} className="space-y-3">
                    <h3 className="font-bold text-gray-500 text-sm border-b border-gray-200 pb-2 mb-2 sticky top-0 bg-gray-50/90 backdrop-blur z-10">
                      {displayData.formatKey(groupKey)}
                    </h3>
                    {displayData.data[groupKey].map(t => renderTransactionItem(t))}
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  {displayData.data.map(t => renderTransactionItem(t))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {historyTab === 'calendar' && (
        <div className="animate-in fade-in">
          <MonthSelector 
            selectedMonth={selectedMonth} 
            onMonthChange={setSelectedMonth} 
            onPrev={handlePrevMonth} 
            onNext={handleNextMonth} 
          />

          <div className="bg-white p-2 sm:p-4 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                <div key={d} className={`text-[10px] font-bold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{d}</div>
              ))}
              
              {calendarDays.map((dateStr, i) => {
                if (!dateStr) return <div key={`empty-${i}`} className="p-1"></div>;
                
                const d = parseInt(dateStr.split('-')[2], 10);
                const hasData = dailyData[dateStr];
                const isSelected = selectedCalDate === dateStr;
                const isToday = dateStr === new Date().toISOString().slice(0, 10);
                
                return (
                  <div 
                    key={dateStr}
                    onClick={() => setSelectedCalDate(isSelected ? null : dateStr)}
                    className={`flex flex-col items-center justify-start p-0.5 sm:p-1 h-14 sm:h-16 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-teal-500 bg-teal-50 shadow-sm scale-105 z-10' : 'border-transparent bg-gray-50 hover:bg-gray-100'} ${isToday && !isSelected ? 'border-gray-200 bg-white' : ''}`}
                  >
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-teal-700' : isToday ? 'text-gray-800' : 'text-gray-500'}`}>{d}</span>
                    {hasData && (
                      <span className="text-[8px] text-teal-600 font-bold mt-auto truncate w-full break-all leading-tight px-0.5">
                        {hasData.total > 99999 ? '¥99k+' : `¥${hasData.total.toLocaleString()}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* カレンダーで選択した日の詳細リスト */}
          {selectedCalDate && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <CalendarCheck size={16} className="text-teal-600" />
                {selectedCalDate.replace(/-/g, '/')} の詳細
              </h3>
              {dailyData[selectedCalDate] ? (
                <div className="space-y-3">
                  {dailyData[selectedCalDate].items.map(t => renderTransactionItem(t))}
                </div>
              ) : (
                <div className="text-center py-6 bg-white rounded-2xl border border-gray-100 border-dashed">
                  <p className="text-gray-400 font-medium text-xs">この日の記録はありません</p>
                </div>
              )}
            </div>
          )}
          {!selectedCalDate && (
            <div className="text-center py-6">
              <p className="text-gray-400 font-medium text-xs flex items-center justify-center gap-1">
                カレンダーの日付をタップすると詳細が表示されます
              </p>
            </div>
          )}
        </div>
      )}

      {historyTab === 'report' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
              <button onClick={() => setReportYear(y => y - 1)} className="p-1 hover:bg-white rounded-lg transition-colors text-gray-500">
                <ChevronLeft size={20} />
              </button>
              <span className="font-bold text-gray-800 text-base">{reportYear}年 (昨年比較)</span>
              <button onClick={() => setReportYear(y => y + 1)} className="p-1 hover:bg-white rounded-lg transition-colors text-gray-500">
                <ChevronRight size={20} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">対象ジャンル</label>
              <select 
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">すべての支出 (合計)</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-end gap-4 mb-4 text-[10px] font-bold text-gray-500">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-300 rounded-sm"></div>昨年 ({reportYear - 1})</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-teal-500 rounded-sm"></div>今年 ({reportYear})</div>
            </div>

            <div className="flex items-end gap-3 h-48 overflow-x-auto pb-2 pt-4 px-1 snap-x no-scrollbar">
              {reportData.data.map(d => {
                const currH = reportData.maxAmount > 1 ? (d.currTotal / reportData.maxAmount) * 100 : 0;
                const prevH = reportData.maxAmount > 1 ? (d.prevTotal / reportData.maxAmount) * 100 : 0;
                return (
                  <div key={d.month} className="flex flex-col items-center gap-2 snap-center min-w-[36px]">
                    <div className="flex items-end gap-1 h-32 w-full justify-center">
                      <div className="w-3 h-full bg-gray-50 rounded-t-sm relative group flex items-end">
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[9px] bg-gray-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                          ¥{d.prevTotal.toLocaleString()}
                        </div>
                        <div className="w-full bg-gray-300 rounded-t-sm transition-all duration-700" style={{height: `${prevH}%`}}></div>
                      </div>
                      <div className="w-3 h-full bg-teal-50 rounded-t-sm relative group flex items-end">
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[9px] bg-teal-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                          ¥{d.currTotal.toLocaleString()}
                        </div>
                        <div className="w-full bg-teal-500 rounded-t-sm transition-all duration-700 delay-100" style={{height: `${currH}%`}}></div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold">{d.month}月</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <span className="text-xs font-bold text-gray-500">月ごとの詳細比較</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
              {reportData.data.slice().reverse().map(d => {
                if (d.currTotal === 0 && d.prevTotal === 0) return null; 
                const diff = d.currTotal - d.prevTotal;
                return (
                  <div key={d.month} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="font-bold text-gray-700 w-10">{d.month}月</div>
                    <div className="flex-1 px-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">昨年</span>
                        <span className="font-medium text-gray-600">¥{d.prevTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-teal-600 font-bold">今年</span>
                        <span className="font-bold text-teal-700">¥{d.currTotal.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-20 text-right flex flex-col items-end justify-center">
                      <span className="text-[9px] text-gray-400 mb-0.5">昨年比</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${diff > 0 ? 'bg-red-50 text-red-600' : diff < 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        {diff > 0 ? '+' : ''}{diff === 0 ? '±0' : diff.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
              {reportData.data.every(d => d.currTotal === 0 && d.prevTotal === 0) && (
                <div className="p-6 text-center text-xs text-gray-400 font-medium">データがありません</div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

const FixedExpensesView = ({ fixedExpenses, categories, users, settings, txCollection, fixedCollection, db, appId, showToast, setSelectedMonth, setActiveTab, selectedMonth, currentMonthTransactions }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newMemo, setNewMemo] = useState('');
  const [newPaidBy, setNewPaidBy] = useState('user1');
  const [newCategory, setNewCategory] = useState('rent');
  const [isSaving, setIsSaving] = useState(false);

  const handleRegisterMonthly = async () => {
    if (fixedExpenses.length === 0) {
      showToast('固定費が登録されていません');
      return;
    }
    
    // 【改善】二重登録防止チェック
    const isAlreadyRegistered = fixedExpenses.some(expense => {
      return currentMonthTransactions.some(tx => 
        tx.memo === expense.memo && 
        tx.amount === expense.amount && 
        tx.categoryId === expense.categoryId
      );
    });

    if (isAlreadyRegistered) {
      if (!confirm('表示中の月に、既に同じ名目・金額の固定費が登録されているようです。\n重複して登録してもよろしいですか？')) {
        return;
      }
    }
    
    const { endDate } = getMonthDateRange(selectedMonth, settings.closingDate);

    try {
      const promises = fixedExpenses.map(expense => 
        addDoc(txCollection, {
          date: endDate,
          amount: expense.amount,
          paidBy: expense.paidBy,
          categoryId: expense.categoryId,
          memo: expense.memo,
          createdAt: Date.now()
        })
      );
      await Promise.all(promises);
      const formattedMonth = selectedMonth.split('-').join('年') + '月';
      showToast(`${formattedMonth}分の固定費を一括登録しました！`);
      
      setSelectedMonth(selectedMonth);
      setActiveTab('home');
    } catch (e) {
      console.error(e);
      showToast('エラーが発生しました');
    }
  };

  const handleAddFixed = async () => {
    if (!newAmount || isNaN(newAmount) || Number(newAmount) <= 0 || !newMemo) {
      showToast('金額と名目を入力してください');
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(fixedCollection, {
        amount: Number(newAmount),
        memo: newMemo,
        paidBy: newPaidBy,
        categoryId: newCategory,
        createdAt: Date.now()
      });
      showToast('固定費を追加しました');
      setIsAdding(false);
      setNewAmount('');
      setNewMemo('');
    } catch (e) {
      console.error(e);
      showToast('エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFixed = async (id) => {
    if (!confirm('この固定費設定を削除しますか？')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'fixedExpenses', id));
      showToast('固定費設定を削除しました');
    } catch (error) {
      console.error("Error deleting document: ", error);
      showToast('削除に失敗しました');
    }
  };

  return (
    <div className="p-5 h-full overflow-y-auto pb-32 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarCheck className="text-teal-600" />
          毎月の固定費
        </h2>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-3xl mb-8">
        <p className="text-sm text-indigo-800 mb-4 font-medium">
          毎月発生する家賃やサブスクなどを登録しておくと、ボタン一つで表示中の月（{selectedMonth.replace('-', '年')}月）の履歴に追加できます。
        </p>
        <button 
          onClick={handleRegisterMonthly}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
        >
          <Check size={20} />
          表示月の分として一括登録する
        </button>
      </div>

      <h3 className="font-bold text-gray-700 mb-4">登録済みの固定費</h3>
      
      {fixedExpenses.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-3xl border border-gray-100 border-dashed">
           <CalendarCheck className="text-gray-300 w-12 h-12 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">固定費はありません</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {fixedExpenses.map(f => {
            const cat = categories.find(c => c.id === f.categoryId) || { name: '不明なジャンル', iconName: 'MoreHorizontal', color: 'bg-gray-200 text-gray-500', hexColor: '#9ca3af' };
            const user = users[f.paidBy];
            const Icon = ICON_MAP[cat.iconName] || ICON_MAP.MoreHorizontal;
            return (
              <div key={f.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className={`p-3 rounded-full flex-shrink-0 ${cat.color}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{f.memo}</p>
                  <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full truncate max-w-[80px] ${user.lightColor}`}>
                    {user.name}が支払う
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="font-bold text-gray-800">
                    ¥{f.amount.toLocaleString()}
                  </div>
                  <button 
                    onClick={() => handleDeleteFixed(f.id)}
                    className="text-xs flex items-center justify-center text-red-400 bg-red-50 p-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors mt-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isAdding ? (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full border-2 border-dashed border-gray-300 text-gray-500 font-bold py-4 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all flex justify-center items-center gap-2"
        >
          <Plus size={20} />
          新しい固定費を設定
        </button>
      ) : (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mt-4 animate-in fade-in slide-in-from-top-2">
          <h4 className="font-bold text-gray-700 mb-4 text-sm">新しい固定費を登録</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">金額</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">¥</span>
                <input 
                  type="number" 
                  inputMode="numeric"
                  pattern="\d*"
                  value={newAmount} 
                  onChange={e=>setNewAmount(e.target.value)} 
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold" 
                  placeholder="0" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">名目（家賃など）</label>
              <input type="text" value={newMemo} onChange={e=>setNewMemo(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="何代？" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-gray-500 mb-1">支払う人</label>
                <select value={newPaidBy} onChange={e=>setNewPaidBy(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-medium truncate">
                  {Object.values(users).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-gray-500 mb-1">ジャンル</label>
                <select value={newCategory} onChange={e=>setNewCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-medium truncate">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-3 text-gray-500 font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">キャンセル</button>
              <button onClick={handleAddFixed} disabled={isSaving} className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-teal-700 transition-colors">追加する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsView = ({ settings, settingsDocRef, showToast }) => {
  const [method, setMethod] = useState(settings.splitMethod || 'ratio');
  const [ratio, setRatio] = useState(settings.user1Ratio ?? 50);
  const [fixedPayer, setFixedPayer] = useState(settings.fixedPayer || 'user1');
  const [amount, setAmount] = useState(settings.fixedAmount || 0);
  const [closingDate, setClosingDate] = useState(settings.closingDate || 'end');
  
  const [u1Name, setU1Name] = useState(settings.user1Name || 'あなた');
  const [u2Name, setU2Name] = useState(settings.user2Name || 'パートナー');
  
  const [isSaving, setIsSaving] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Gift');
  const [newCatColor, setNewCatColor] = useState(COLOR_PRESETS[0]);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [isSavingCat, setIsSavingCat] = useState(false);

  const handleSaveGeneral = async () => {
    if (!u1Name || !u2Name) {
      showToast('名前を入力してください');
      return;
    }
    setIsSaving(true);
    try {
      await setDoc(settingsDocRef, {
        ...settings, 
        splitMethod: method,
        user1Ratio: Number(ratio),
        fixedPayer,
        fixedAmount: Number(amount),
        user1Name: u1Name,
        user2Name: u2Name,
        closingDate
      });
      showToast('設定を保存しました');
    } catch (e) {
      console.error(e);
      showToast('エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      showToast('ジャンル名を入力してください');
      return;
    }
    setIsSavingCat(true);
    try {
      const newCategory = {
        id: 'custom_' + Date.now(),
        name: newCatName.trim(),
        iconName: newCatIcon,
        color: newCatColor.color,
        hexColor: newCatColor.hexColor
      };
      const updatedCustomCategories = [...(settings.customCategories || []), newCategory];
      
      await setDoc(settingsDocRef, {
        ...settings,
        customCategories: updatedCustomCategories
      });
      setNewCatName('');
      setIsAddingCat(false);
      showToast('ジャンルを追加しました');
    } catch (e) {
      console.error(e);
      showToast('エラーが発生しました');
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!confirm('このジャンルを削除しますか？\n※既に登録されている記録のアイコンは「その他」として表示されるようになります。')) return;
    try {
      const updatedCustomCategories = (settings.customCategories || []).filter(c => c.id !== catId);
      await setDoc(settingsDocRef, {
        ...settings,
        customCategories: updatedCustomCategories
      });
      showToast('ジャンルを削除しました');
    } catch (e) {
      console.error(e);
      showToast('エラーが発生しました');
    }
  };

  return (
    <div className="p-5 h-full overflow-y-auto pb-32 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Settings className="text-teal-600" />
        各種設定
      </h2>

      {/* --- 締め日の設定 --- */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-700 mb-4 text-sm">家計簿の締め日</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">毎月の締め日</label>
            <select 
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-bold text-gray-800"
            >
              <option value="end">月末締め</option>
              {Array.from({length: 28}, (_, i) => i + 1).map(d => (
                <option key={d} value={d.toString()}>{d}日締め</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              例：「25日締め」に設定すると、前月26日〜当月25日の出費が1ヶ月分として集計されます。
            </p>
          </div>
        </div>
      </div>

      {/* --- カスタムジャンルの追加 --- */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-700 mb-4 text-sm">オリジナルジャンル</h3>
        
        {settings.customCategories && settings.customCategories.length > 0 && (
          <div className="mb-6 space-y-2">
            <label className="block text-xs text-gray-500 mb-2">追加済みのジャンル</label>
            <div className="flex flex-wrap gap-2">
              {settings.customCategories.map(cat => {
                const Icon = ICON_MAP[cat.iconName] || ICON_MAP.MoreHorizontal;
                return (
                  <div key={cat.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${cat.color} text-sm font-medium`}>
                    <Icon size={14} />
                    {cat.name}
                    <button onClick={() => handleDeleteCategory(cat.id)} className="ml-1 opacity-50 hover:opacity-100 hover:text-red-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isAddingCat ? (
          <button 
            onClick={() => setIsAddingCat(true)}
            className="w-full border-2 border-dashed border-gray-300 text-gray-500 font-bold py-3 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all flex justify-center items-center gap-2"
          >
            <Plus size={18} />
            新しいジャンルを作成する
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div>
              <label className="block text-xs text-gray-500 mb-1">ジャンル名</label>
              <input 
                type="text" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="例：ペット用品"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-gray-800"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-2">アイコン</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(ICON_MAP).map(iconKey => {
                  const IconComp = ICON_MAP[iconKey];
                  return (
                    <button
                      key={iconKey}
                      onClick={() => setNewCatIcon(iconKey)}
                      className={`p-2 rounded-xl transition-all ${newCatIcon === iconKey ? 'bg-teal-500 text-white shadow-sm scale-110' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                    >
                      <IconComp size={18} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2">テーマカラー</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setNewCatColor(preset)}
                    className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${preset.color.split(' ')[0]} ${newCatColor.hexColor === preset.hexColor ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: preset.color.includes('bg-') ? undefined : preset.hexColor }}
                  >
                    {newCatColor.hexColor === preset.hexColor && <Check size={14} className={preset.color.split(' ')[1]} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
              <div className="text-xs text-gray-500 font-bold w-16">プレビュー</div>
              <div className={`p-2 rounded-full ${newCatColor.color}`}>
                 {React.createElement(ICON_MAP[newCatIcon], { size: 18 })}
              </div>
              <span className="font-bold text-gray-800 text-sm">{newCatName || 'ジャンル名'}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsAddingCat(false)} className="flex-1 py-2.5 text-gray-500 font-bold border border-gray-200 bg-white rounded-xl hover:bg-gray-100 transition-colors">キャンセル</button>
              <button onClick={handleAddCategory} disabled={isSavingCat} className="flex-1 py-2.5 bg-teal-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-teal-700 transition-colors">作成する</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-700 mb-4 text-sm">メンバーの名前</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">メンバー1 (左側・ティール色)</label>
            <input 
              type="text" 
              value={u1Name}
              onChange={(e) => setU1Name(e.target.value)}
              placeholder="あなた"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-bold text-gray-800"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">メンバー2 (右側・ローズ色)</label>
            <input 
              type="text" 
              value={u2Name}
              onChange={(e) => setU2Name(e.target.value)}
              placeholder="パートナー"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all font-bold text-gray-800"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-700 mb-4 text-sm">割り勘のルール</h3>
        <div className="flex gap-2 mb-8 p-1.5 bg-gray-100 rounded-2xl">
          <button 
            onClick={() => setMethod('ratio')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${method === 'ratio' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            比率で分ける
          </button>
          <button 
            onClick={() => setMethod('amount')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${method === 'amount' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            金額で分ける
          </button>
        </div>

        {method === 'ratio' ? (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-4">負担割合 (%)</label>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 text-center">
                  <p className="text-xs font-bold text-teal-600 mb-2">{u1Name}</p>
                  <input 
                    type="number" 
                    inputMode="numeric"
                    pattern="\d*"
                    value={ratio}
                    onChange={(e) => setRatio(Math.min(100, Math.max(0, e.target.value)))}
                    className="w-full text-center text-3xl font-bold py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  />
                </div>
                <span className="font-bold text-gray-300 text-2xl">:</span>
                <div className="flex-1 text-center">
                  <p className="text-xs font-bold text-rose-500 mb-2">{u2Name}</p>
                  <div className="w-full text-center text-3xl font-bold py-3 bg-gray-100 border border-gray-100 rounded-2xl text-gray-400">
                    {100 - ratio}
                  </div>
                </div>
              </div>
              <div className="px-2">
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={ratio} 
                  onChange={(e) => setRatio(e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">固定で負担する人</label>
              <select 
                value={fixedPayer} 
                onChange={(e) => setFixedPayer(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
              >
                <option value="user1">{u1Name}</option>
                <option value="user2">{u2Name}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">毎月の固定負担額 (円)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">¥</span>
                <input 
                  type="number" 
                  inputMode="numeric"
                  pattern="\d*"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 text-right text-2xl font-bold bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                />
              </div>
              <p className="text-xs text-gray-400 mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed">
                ※毎月の合計支出がこの金額に満たない場合は、指定された人が全額負担することになります。
              </p>
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={handleSaveGeneral}
        disabled={isSaving}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-200 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 mb-4"
      >
        {isSaving ? '保存中...' : '設定を保存する'}
      </button>
    </div>
  );
};

export default function App() {
  const [isPassphraseValid, setIsPassphraseValid] = useState(() => {
    return localStorage.getItem('shareloo_passphrase') === SECRET_PASSPHRASE;
  });
  const [passphraseInput, setPassphraseInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [activeTab, setActiveTab] = useState('home');
  const [transactions, setTransactions] = useState([]);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [settings, setSettings] = useState({ 
    splitMethod: 'ratio', 
    user1Ratio: 50, 
    fixedPayer: 'user1', 
    fixedAmount: 0,
    user1Name: 'あなた',
    user2Name: 'パートナー',
    customCategories: [],
    closingDate: 'end'
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [historySortMode, setHistorySortMode] = useState('date-desc');
  const [editingTx, setEditingTx] = useState(null);
  const [copyTemplate, setCopyTemplate] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [user, setUser] = useState(null);

  const users = useMemo(() => ({
    user1: { id: 'user1', name: settings.user1Name || 'あなた', color: 'bg-teal-500', lightColor: 'bg-teal-100 text-teal-700' },
    user2: { id: 'user2', name: settings.user2Name || 'パートナー', color: 'bg-rose-400', lightColor: 'bg-rose-100 text-rose-700' }
  }), [settings.user1Name, settings.user2Name]);

  const categories = useMemo(() => {
    return [...DEFAULT_CATEGORIES, ...(settings.customCategories || [])];
  }, [settings.customCategories]);

  useEffect(() => {
    if (!isPassphraseValid) return;

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Authentication failed:", error);
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, [isPassphraseValid]);

  useEffect(() => {
    if (!user || !isPassphraseValid) return;

    const unsubTx = onSnapshot(txCollection, (snapshot) => {
      const txData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txData);
    }, (error) => console.error(error));

    const unsubFixed = onSnapshot(fixedCollection, (snapshot) => {
      const fixedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFixedExpenses(fixedData);
    }, (error) => console.error(error));

    const unsubSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          splitMethod: data.splitMethod || 'ratio',
          user1Ratio: data.user1Ratio ?? 50,
          fixedPayer: data.fixedPayer || 'user1',
          fixedAmount: data.fixedAmount || 0,
          user1Name: data.user1Name || 'あなた',
          user2Name: data.user2Name || 'パートナー',
          customCategories: data.customCategories || [],
          closingDate: data.closingDate || 'end'
        });
      }
    }, (error) => console.error(error));

    return () => {
      unsubTx();
      unsubFixed();
      unsubSettings();
    };
  }, [user, isPassphraseValid]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleLogin = () => {
    if (passphraseInput === SECRET_PASSPHRASE) {
      localStorage.setItem('shareloo_passphrase', passphraseInput);
      setIsPassphraseValid(true);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const { startDate, endDate } = useMemo(() => {
    return getMonthDateRange(selectedMonth, settings.closingDate);
  }, [selectedMonth, settings.closingDate]);

  const dateRangeText = `${startDate.replace(/-/g, '/')} 〜 ${endDate.replace(/-/g, '/')}`;

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => t.date && t.date >= startDate && t.date <= endDate);
  }, [transactions, startDate, endDate]);

  const stats = useMemo(() => {
    let total = 0;
    let u1Total = 0;
    let u2Total = 0;
    const categoryTotals = {};
    
    let defaultSplitTotal = 0; 
    let customU1TargetSum = 0;
    let customU2TargetSum = 0;

    currentMonthTransactions.forEach(t => {
      total += t.amount;
      if (t.paidBy === 'user1') u1Total += t.amount;
      if (t.paidBy === 'user2') u2Total += t.amount;

      if (!categoryTotals[t.categoryId]) {
        categoryTotals[t.categoryId] = 0;
      }
      categoryTotals[t.categoryId] += t.amount;

      if (t.isCustomSplit) {
        let tU1Target = 0;
        if (t.customSplitMode === 'amount') {
          tU1Target = t.customUser1Amount || 0;
        } else {
          tU1Target = Math.round(t.amount * ((t.customUser1Ratio ?? 50) / 100));
        }
        customU1TargetSum += tU1Target;
        customU2TargetSum += (t.amount - tU1Target);
      } else {
        defaultSplitTotal += t.amount;
      }
    });

    let u1Target = 0;
    let u2Target = 0;

    if (settings.splitMethod === 'ratio') {
      const baseU1Target = Math.round(defaultSplitTotal * (settings.user1Ratio / 100));
      u1Target = baseU1Target + customU1TargetSum;
      u2Target = (defaultSplitTotal - baseU1Target) + customU2TargetSum;
    } else {
      let baseU1Target = 0;
      let baseU2Target = 0;
      if (settings.fixedPayer === 'user1') {
        baseU1Target = Math.min(settings.fixedAmount, defaultSplitTotal);
        baseU2Target = defaultSplitTotal - baseU1Target;
      } else {
        baseU2Target = Math.min(settings.fixedAmount, defaultSplitTotal);
        baseU1Target = defaultSplitTotal - baseU2Target;
      }
      u1Target = baseU1Target + customU1TargetSum;
      u2Target = baseU2Target + customU2TargetSum;
    }

    const u1Diff = u1Total - u1Target;

    const sortedCategoryTotals = Object.entries(categoryTotals)
      .map(([id, amount]) => ({ id, amount }))
      .sort((a, b) => b.amount - a.amount);

    return { total, u1Total, u2Total, u1Target, u2Target, u1Diff, categoryTotals: sortedCategoryTotals };
  }, [currentMonthTransactions, settings]);

  const handlePrevMonth = () => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  if (!isPassphraseValid) {
    return (
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden font-sans text-gray-800 flex items-center justify-center p-5">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-2">
            <Lock className="text-teal-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-800 mb-2">33T家計簿</h1>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              プライベートな家計簿です。<br/>お二人で決めた合言葉を入力してください。
            </p>
          </div>
          
          <div className="space-y-4 pt-4">
            <input
              type="password"
              value={passphraseInput}
              onChange={(e) => setPassphraseInput(e.target.value)}
              placeholder="合言葉を入力"
              className={`w-full p-4 bg-gray-50 border ${loginError ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-200 focus:ring-teal-500'} rounded-2xl focus:ring-2 focus:outline-none transition-all text-center font-bold tracking-widest text-lg`}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {loginError && <p className="text-red-500 text-xs font-bold animate-pulse">合言葉が間違っています</p>}
            
            <button
              onClick={handleLogin}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-200 transition-all active:scale-[0.98]"
            >
              ロックを解除する
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden font-sans text-gray-800 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md pt-12 pb-4 px-5 sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-teal-200">
            3
          </div>
          <h1 className="text-xl font-black tracking-tight text-gray-800">33T家計簿</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {activeTab === 'home' && (
          <HomeView 
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            handlePrevMonth={handlePrevMonth}
            handleNextMonth={handleNextMonth}
            dateRangeText={dateRangeText}
            stats={stats}
            users={users}
            categories={categories}
            settings={settings}
          />
        )}
        {activeTab === 'add' && (
          <TransactionFormView 
            mode="add"
            editingTx={null}
            setEditingTx={setEditingTx}
            copyTemplate={copyTemplate}
            setCopyTemplate={setCopyTemplate}
            setActiveTab={setActiveTab}
            setSelectedMonth={setSelectedMonth}
            users={users}
            categories={categories}
            settings={settings}
            db={db}
            appId={appId}
            txCollection={txCollection}
            showToast={showToast}
          />
        )}
        {activeTab === 'edit' && (
          <TransactionFormView 
            mode="edit"
            editingTx={editingTx}
            setEditingTx={setEditingTx}
            copyTemplate={copyTemplate}
            setCopyTemplate={setCopyTemplate}
            setActiveTab={setActiveTab}
            setSelectedMonth={setSelectedMonth}
            users={users}
            categories={categories}
            settings={settings}
            db={db}
            appId={appId}
            txCollection={txCollection}
            showToast={showToast}
          />
        )}
        {activeTab === 'history' && (
          <HistoryView 
            transactions={transactions}
            currentMonthTransactions={currentMonthTransactions}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            handlePrevMonth={handlePrevMonth}
            handleNextMonth={handleNextMonth}
            dateRangeText={dateRangeText}
            historySortMode={historySortMode}
            setHistorySortMode={setHistorySortMode}
            categories={categories}
            users={users}
            settings={settings}
            setCopyTemplate={setCopyTemplate}
            setEditingTx={setEditingTx}
            setActiveTab={setActiveTab}
            showToast={showToast}
            db={db}
            appId={appId}
          />
        )}
        {activeTab === 'fixed' && (
          <FixedExpensesView 
            fixedExpenses={fixedExpenses}
            categories={categories}
            users={users}
            settings={settings}
            txCollection={txCollection}
            fixedCollection={fixedCollection}
            db={db}
            appId={appId}
            showToast={showToast}
            setSelectedMonth={setSelectedMonth}
            setActiveTab={setActiveTab}
            selectedMonth={selectedMonth}
            currentMonthTransactions={currentMonthTransactions}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsView 
            settings={settings}
            settingsDocRef={settingsDocRef}
            showToast={showToast}
          />
        )}
      </main>

      {toastMessage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-5 py-3 rounded-full shadow-lg text-sm font-medium z-50 animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          {toastMessage}
        </div>
      )}

      <nav 
        className="bg-white border-t border-gray-100 absolute bottom-0 w-full z-20"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
      >
        <div className="flex justify-around items-center h-20 px-1 pb-2">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 w-12 ${activeTab === 'home' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-500'}`}
          >
            <div className={`p-1.5 rounded-full transition-all duration-300 ${activeTab === 'home' ? 'bg-teal-50 scale-110' : ''}`}>
              <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-bold">ホーム</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 w-12 ${activeTab === 'history' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-500'}`}
          >
            <div className={`p-1.5 rounded-full transition-all duration-300 ${activeTab === 'history' ? 'bg-teal-50 scale-110' : ''}`}>
              <List size={22} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-bold">履歴</span>
          </button>

          <button 
            onClick={() => setActiveTab('add')}
            className="flex flex-col items-center justify-center -translate-y-4 px-2 group"
          >
            <div className="w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-200 group-hover:bg-teal-700 transition-all duration-300 active:scale-90">
              <PlusCircle size={30} strokeWidth={2} className="transition-transform group-hover:rotate-90 duration-300" />
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('fixed')}
            className={`flex flex-col items-center gap-1 w-12 ${activeTab === 'fixed' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-500'}`}
          >
            <div className={`p-1.5 rounded-full transition-all duration-300 ${activeTab === 'fixed' ? 'bg-teal-50 scale-110' : ''}`}>
              <CalendarCheck size={22} strokeWidth={activeTab === 'fixed' ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-bold">固定費</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 w-12 ${activeTab === 'settings' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-500'}`}
          >
            <div className={`p-1.5 rounded-full transition-all duration-300 ${activeTab === 'settings' ? 'bg-teal-50 scale-110' : ''}`}>
              <Settings size={22} strokeWidth={activeTab === 'settings' ? 2.5 : 2} className={activeTab === 'settings' ? 'animate-spin-slow' : ''} />
            </div>
            <span className="text-[9px] font-bold">設定</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
