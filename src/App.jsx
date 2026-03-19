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
  Search,
  X,
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
  Baby,
  Leaf,
  TrendingUp,
  TrendingDown,
  ChevronRight as ChevronRightIcon,
  User,
  Settings2
} from 'lucide-react';

// --- Firebase のインポート ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { initializeFirestore, collection, addDoc, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

// Firebase設定
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
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});

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
  { id: 'rent', name: '住居費', iconName: 'HomeIcon', color: 'bg-emerald-100 text-emerald-600', hexColor: '#059669' },
  { id: 'utility', name: '電気・ガス', iconName: 'Zap', color: 'bg-yellow-100 text-yellow-600', hexColor: '#ca8a04' },
  { id: 'water', name: '水道代', iconName: 'Droplets', color: 'bg-cyan-100 text-cyan-600', hexColor: '#0891b2' },
  { id: 'telecom', name: '通信費', iconName: 'Smartphone', color: 'bg-indigo-100 text-indigo-600', hexColor: '#4f46e5' },
  { id: 'dog', name: 'お犬', iconName: 'Dog', color: 'bg-amber-100 text-amber-600', hexColor: '#d97706' },
  { id: 'event', name: 'イベント', iconName: 'PartyPopper', color: 'bg-fuchsia-100 text-fuchsia-600', hexColor: '#c026d3' },
  { id: 'leisure', name: 'レジャー費', iconName: 'Smile', color: 'bg-pink-100 text-pink-600', hexColor: '#db2777' },
  { id: 'transport', name: '交通・車両費', iconName: 'Train', color: 'bg-sky-100 text-sky-600', hexColor: '#0284c7' },
  { id: 'other', name: 'その他', iconName: 'MoreHorizontal', color: 'bg-gray-200 text-gray-700', hexColor: '#4b5563' },
];

// --- 💡 タイムゾーンズレを考慮した今日の日付取得関数 ---
const getTodayStr = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

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

const LineChart = ({ data, labels, color }) => {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i] > 0) return i;
    }
    return Math.max(0, data.length - 1);
  }); 

  const max = Math.max(...data, 100) * 1.15; 
  const isAllZero = max === 115 && data.every(d => d === 0);

  const points = data.map((val, i) => {
    const x = (i / (Math.max(data.length - 1, 1))) * 100;
    const y = isAllZero ? 100 : 100 - (val / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full mt-6 relative">
      {selectedIndex !== null && data[selectedIndex] !== undefined && (
        <div className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none z-10 animate-in fade-in zoom-in duration-200">
           <div className="bg-gray-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-md relative">
             {labels[selectedIndex]}: ¥{data[selectedIndex].toLocaleString()}
             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
           </div>
        </div>
      )}
      
      <div className="relative w-full" style={{ height: '80px' }}>
        <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline 
            points={points} 
            fill="none" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            vectorEffect="non-scaling-stroke" 
          />
        </svg>

        {data.map((val, i) => {
          const x = (i / (Math.max(data.length - 1, 1))) * 100;
          const y = isAllZero ? 100 : 100 - (val / max) * 100;
          const isSelected = selectedIndex === i;
          return (
            <div
              key={i}
              onClick={() => setSelectedIndex(i)}
              className="absolute cursor-pointer flex items-center justify-center"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: '30px',
                height: '30px',
                transform: 'translate(-50%, -50%)',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div 
                className="rounded-full transition-all duration-300 shadow-sm"
                style={{
                  width: isSelected ? '12px' : '8px',
                  height: isSelected ? '12px' : '8px',
                  backgroundColor: isSelected ? '#fff' : color,
                  border: `${isSelected ? '3px' : '2px'} solid ${color}`
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-[9px] sm:text-[10px] text-gray-400 mt-2 font-bold px-1">
        {labels.map((label, i) => (
          <span 
            key={i} 
            onClick={() => setSelectedIndex(i)}
            className={`cursor-pointer px-2 py-1 -mx-2 rounded-md transition-colors ${selectedIndex === i ? 'text-gray-800 bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

const HomeView = ({ selectedMonth, setSelectedMonth, handlePrevMonth, handleNextMonth, dateRangeText, stats, users, categories, settings, setActiveTab, setSearchCategory, u1NetDebt }) => {
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

  const finalDiff = stats.u1Diff - u1NetDebt;

  return (
    <div className="p-5 pb-24 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <MonthSelector 
        selectedMonth={selectedMonth} 
        onMonthChange={setSelectedMonth} 
        onPrev={handlePrevMonth} 
        onNext={handleNextMonth} 
        dateRangeText={dateRangeText}
      />

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-gray-500 text-sm font-medium mb-1">今月の共同生活費</h2>
        <div className="text-4xl font-bold text-gray-800 mb-4 break-words">
          ¥{stats.total.toLocaleString()}
        </div>

        {settings.monthlyBudget > 0 && (
          <div className="mb-6 pt-2">
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="text-gray-500 font-bold">予算: ¥{settings.monthlyBudget.toLocaleString()}</span>
              <span className={`font-bold ${stats.total > settings.monthlyBudget ? 'text-red-500' : 'text-teal-600'}`}>
                {stats.total > settings.monthlyBudget ? `¥${(stats.total - settings.monthlyBudget).toLocaleString()} オーバー` : `残り ¥${(settings.monthlyBudget - stats.total).toLocaleString()}`}
              </span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${stats.total > settings.monthlyBudget ? 'bg-red-500' : 'bg-teal-500'}`}
                style={{ width: `${Math.min((stats.total / settings.monthlyBudget) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

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
          <span className="truncate">負担目安: ¥{stats.u1Target.toLocaleString()}</span>
          <span className="bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200 text-[10px] mx-2 flex-shrink-0">
            {settings.splitMethod === 'ratio' ? `ルール: ${settings.user1Ratio}:${100-settings.user1Ratio}` : '金額固定'}
          </span>
          <span className="truncate">負担目安: ¥{stats.u2Target.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-teal-50 p-5 rounded-3xl border border-teal-100 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white rounded-full text-teal-600 shadow-sm flex-shrink-0">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <p className="text-xs text-teal-600 font-medium mb-1">今月の精算状況</p>
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
              <p className="font-bold text-gray-800">今月はピッタリです</p>
            )}
          </div>
        </div>
        
        {u1NetDebt !== 0 && (
          <div className="mt-2 pt-3 border-t border-teal-200/50">
            <p className="text-[10px] text-teal-700 font-medium mb-1 flex items-center gap-1">
              💡 立替分と相殺した最終的な精算額
            </p>
            {finalDiff > 0 ? (
              <p className="font-bold text-gray-800 text-sm break-words">
                最終的に <span className="text-teal-600 text-lg">¥{Math.abs(finalDiff).toLocaleString()}</span> もらう
              </p>
            ) : finalDiff < 0 ? (
              <p className="font-bold text-gray-800 text-sm break-words">
                最終的に <span className="text-rose-500 text-lg">¥{Math.abs(finalDiff).toLocaleString()}</span> 渡す
              </p>
            ) : (
              <p className="font-bold text-gray-800 text-sm">相殺するとプラスマイナスゼロです</p>
            )}
          </div>
        )}
      </div>

      {stats.categoryTotals.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6 text-sm flex items-center gap-2">
            <PieChart size={18} className="text-teal-600" />
            ジャンル別支出
            <span className="text-xs font-normal text-gray-400 ml-auto">タップで履歴検索</span>
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
              const percentage = ((c.amount / stats.total) * 100).toFixed(1).replace(/\.0$/, '');
              
              return (
                <div 
                  key={c.id} 
                  onClick={() => {
                    setSearchCategory(c.id);
                    setActiveTab('history');
                  }}
                  className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className={`p-2 rounded-full ${cat.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{cat.name}</span>
                      <div className="text-right flex items-center">
                        <span className="font-bold text-gray-800">¥{c.amount.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 font-medium ml-2 w-10 inline-block text-right">{percentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {u1NetDebt !== 0 && (
        <div className="bg-orange-50 p-4 sm:p-5 rounded-3xl border border-orange-100 mb-6 flex items-center justify-between mt-6">
          <div>
            <p className="text-xs text-orange-600 font-bold mb-1 flex items-center gap-1"><Wallet size={14}/> 未精算の立替バランス</p>
            {u1NetDebt > 0 ? (
              <p className="text-sm font-bold text-gray-800 leading-snug">
                あなたは <span className="text-orange-600">{users.user2.name}</span> に <br/>
                <span className="text-2xl">¥{u1NetDebt.toLocaleString()}</span> 立て替えてもらっています
              </p>
            ) : (
              <p className="text-sm font-bold text-gray-800 leading-snug">
                あなたは <span className="text-orange-600">{users.user2.name}</span> に <br/>
                <span className="text-2xl">¥{Math.abs(u1NetDebt).toLocaleString()}</span> 立て替えています
              </p>
            )}
          </div>
        </div>
      )}

      {stats.total === 0 && u1NetDebt === 0 && (
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

const TransactionFormView = ({ mode, editingTx, setEditingTx, copyTemplate, setCopyTemplate, selectedDateForNewTx, setActiveTab, setSelectedMonth, users, categories, settings, db, appId, txCollection, showToast, transactions, currentUserType }) => {
  const isEdit = mode === 'edit';
  const txToEdit = isEdit ? editingTx : null;
  const defaultCategoryId = categories.length > 0 ? categories[0].id : 'food';

  const [date, setDate] = useState(getTodayStr());
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUserType);
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [memo, setMemo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [customSplitMode, setCustomSplitMode] = useState('ratio');
  const [customUser1Ratio, setCustomUser1Ratio] = useState(settings.user1Ratio);
  const [customUser1Amount, setCustomUser1Amount] = useState('');

  const [hasDebt, setHasDebt] = useState(false);
  const [debtType, setDebtType] = useState('borrow'); 
  const [debtAmount, setDebtAmount] = useState('');

  const memoSuggestions = useMemo(() => {
    if (!transactions) return [];
    const memos = transactions.map(t => t.memo).filter(m => m && m.trim() !== '');
    return [...new Set(memos)];
  }, [transactions]);

  const existingTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => t.date === date).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [transactions, date]);

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
      setHasDebt(!!txToEdit.hasDebt);
      setDebtType(txToEdit.debtType || 'borrow');
      setDebtAmount(txToEdit.debtAmount ? txToEdit.debtAmount.toString() : '');
    } else if (!isEdit && copyTemplate) {
      setDate(getTodayStr());
      setAmount(copyTemplate.amount.toString());
      setPaidBy(copyTemplate.paidBy);
      setCategoryId(copyTemplate.categoryId);
      setMemo(copyTemplate.memo || '');
      setIsCustomSplit(!!copyTemplate.isCustomSplit);
      setCustomSplitMode(copyTemplate.customSplitMode || 'ratio');
      setCustomUser1Ratio(copyTemplate.customUser1Ratio ?? settings.user1Ratio);
      setCustomUser1Amount(copyTemplate.customUser1Amount ?? '');
      setHasDebt(!!copyTemplate.hasDebt);
      setDebtType(copyTemplate.debtType || 'borrow');
      setDebtAmount(copyTemplate.debtAmount ? copyTemplate.debtAmount.toString() : '');
    } else if (!isEdit && selectedDateForNewTx) {
      setDate(selectedDateForNewTx);
      setAmount('');
      setPaidBy(currentUserType);
      setCategoryId(defaultCategoryId);
      setMemo('');
      setIsCustomSplit(false);
      setCustomSplitMode('ratio');
      setCustomUser1Ratio(settings.user1Ratio);
      setCustomUser1Amount('');
      setHasDebt(false);
      setDebtType('borrow');
      setDebtAmount('');
    } else {
      setDate(getTodayStr());
      setAmount('');
      setPaidBy(currentUserType);
      setCategoryId(defaultCategoryId);
      setMemo('');
      setIsCustomSplit(false);
      setCustomSplitMode('ratio');
      setCustomUser1Ratio(settings.user1Ratio);
      setCustomUser1Amount('');
      setHasDebt(false);
      setDebtType('borrow');
      setDebtAmount('');
    }
  }, [isEdit, txToEdit, copyTemplate, selectedDateForNewTx, settings.user1Ratio, defaultCategoryId, currentUserType]);

  const handleSave = async (continueEditing = false) => {
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
        hasDebt,
        debtType: hasDebt ? debtType : null,
        debtAmount: hasDebt ? Number(debtAmount) : null,
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
        
        if (continueEditing) {
          setAmount('');
          setMemo('');
          setIsCustomSplit(false);
          setCustomSplitMode('ratio');
          setCustomUser1Ratio(settings.user1Ratio);
          setCustomUser1Amount('');
          setHasDebt(false);
          setDebtAmount('');
          const mainArea = document.getElementById('main-scroll-area');
          if (mainArea) mainArea.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
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
          
          if (selectedDateForNewTx) {
            setActiveTab('history');
          } else {
            setActiveTab('home');
          }
        }
      }
    } catch (error) {
      console.error("Error saving document: ", error);
      showToast('エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 h-full overflow-y-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-300">
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

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">金額</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">¥</span>
            <input 
              type="number" 
              inputMode="numeric"
              pattern="\d*"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-4 py-4 text-right text-3xl font-bold bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">誰が支払った？</label>
          <div className="flex gap-2">
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

        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
              個人的な立替・精算を含める
            </label>
            <button
              type="button"
              onClick={() => setHasDebt(!hasDebt)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center shadow-inner flex-shrink-0 ml-2 ${hasDebt ? 'bg-orange-500' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${hasDebt ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          
          {hasDebt && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 border-t border-orange-200 pt-4">
              <div className="flex gap-2 mb-4 p-1 bg-orange-200/50 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setDebtType('borrow')}
                  className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${debtType === 'borrow' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  {paidBy === 'user1' ? `${users.user2.name}の分を立て替えた` : `${users.user1.name}の分を立て替えた`}
                </button>
                <button 
                  type="button"
                  onClick={() => setDebtType('repay')}
                  className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${debtType === 'repay' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  立て替えてもらっていた分を返す
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-orange-600 mb-1 text-center">立替・精算に充てる金額</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">¥</span>
                  <input 
                    type="number" 
                    inputMode="numeric"
                    pattern="\d*"
                    value={debtAmount} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') { setDebtAmount(''); return; }
                      const numVal = Number(val);
                      const maxVal = Number(amount) || 0;
                      if (numVal > maxVal) setDebtAmount(maxVal.toString());
                      else setDebtAmount(val);
                    }}
                    placeholder="0"
                    className="w-full pl-6 pr-2 py-2 text-right font-bold bg-white border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                  />
                </div>
                <p className="text-[9px] text-gray-500 mt-2 text-center">
                  ※この金額は共同の生活費から除外され、未精算の立替バランスに反映されます。
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700">この支出だけ割り勘割合を変更する</label>
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
                      ¥{Math.max(0, (Number(amount) || 0) - (hasDebt ? Number(debtAmount) || 0 : 0) - (Number(customUser1Amount) || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-2 flex justify-between items-end">
            <span>ジャンル</span>
            <button onClick={() => setActiveTab('settings')} className="text-[10px] text-teal-600 hover:underline">追加・編集</button>
          </label>
          <div className="grid grid-cols-4 gap-2">
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
                    <Icon size={18} />
                  </div>
                  <span className={`text-[10px] leading-tight font-bold text-center break-words w-full px-0.5 ${isSelected ? 'text-teal-700' : 'text-gray-500'}`}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 mb-1">日付</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm text-sm font-bold"
            />
          </div>
          <div className="flex-[2]">
            <label className="block text-xs font-bold text-gray-500 mb-1">詳細・メモ</label>
            <input 
              type="text" 
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="何に使った？ (任意)"
              list="memo-options"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm text-sm font-bold"
            />
            <datalist id="memo-options">
              {memoSuggestions.map((m, idx) => (
                <option key={idx} value={m} />
              ))}
            </datalist>
          </div>
        </div>

        {existingTransactions.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1.5">
              <List size={14} className="text-gray-400" /> 
              この日 ({date.replace(/-/g, '/')}) の記録
            </h3>
            <div className="space-y-2">
              {existingTransactions.map(t => {
                const cat = categories.find(c => c.id === t.categoryId) || { name: '不明' };
                const isEditingThis = isEdit && txToEdit?.id === t.id;
                return (
                  <div key={t.id} className={`flex justify-between items-center p-2.5 rounded-xl shadow-sm border ${isEditingThis ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                       <span className={`text-[10px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded ${isEditingThis ? 'bg-teal-100 text-teal-600' : 'bg-gray-50 text-gray-400'}`}>{cat.name}</span>
                       <span className={`font-bold text-xs truncate ${isEditingThis ? 'text-teal-700' : 'text-gray-700'}`}>{t.memo || 'メモなし'}</span>
                    </div>
                    <span className={`font-bold text-xs ml-2 whitespace-nowrap ${isEditingThis ? 'text-teal-800' : 'text-gray-800'}`}>¥{t.amount.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isEdit ? (
          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-200 transition-all active:scale-[0.98]"
            >
              {isSaving ? '保存中...' : (selectedDateForNewTx ? '登録してカレンダーへ' : '登録してホームへ')}
            </button>
            <button 
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="w-full bg-white border-2 border-teal-500 text-teal-600 hover:bg-teal-50 disabled:opacity-50 font-bold py-3.5 rounded-2xl shadow-sm transition-all active:scale-[0.98]"
            >
              続けてもう1件登録する
            </button>
          </div>
        ) : (
          <div className="pt-2">
            <button 
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-200 transition-all active:scale-[0.98]"
            >
              {isSaving ? '保存中...' : '更新する'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

const HistoryView = ({ transactions, currentMonthTransactions, selectedMonth, setSelectedMonth, handlePrevMonth, handleNextMonth, dateRangeText, startDate, endDate, historySortMode, setHistorySortMode, categories, users, settings, setCopyTemplate, setEditingTx, setSelectedDateForNewTx, setActiveTab, showToast, db, appId, searchCategory, setSearchCategory, historyTab, setHistoryTab }) => {
  const [selectedCalDate, setSelectedCalDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const memoSuggestions = useMemo(() => {
    if (!transactions) return [];
    const memos = transactions.map(t => t.memo).filter(m => m && m.trim() !== '');
    return [...new Set(memos)];
  }, [transactions]);

  const displayData = useMemo(() => {
    let sorted = [...currentMonthTransactions];
    
    if (searchCategory !== 'all') {
      sorted = sorted.filter(t => t.categoryId === searchCategory);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      sorted = sorted.filter(t => {
        const cat = categories.find(c => c.id === t.categoryId)?.name || '';
        return (t.memo && t.memo.toLowerCase().includes(q)) || 
               cat.toLowerCase().includes(q) || 
               t.amount.toString().includes(q);
      });
    }
    
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
  }, [currentMonthTransactions, historySortMode, categories, searchQuery, searchCategory]);

  const { calendarDays, dailyData } = useMemo(() => {
    if (!startDate || !endDate) return { calendarDays: [], dailyData: {} };

    const [sy, sm, sd] = startDate.split('-');
    const start = new Date(sy, sm - 1, sd);
    
    const [ey, em, ed] = endDate.split('-');
    const end = new Date(ey, em - 1, ed);

    const days = [];
    const startDayOfWeek = start.getDay();

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    const currentD = new Date(start);
    while (currentD <= end) {
      const y = currentD.getFullYear();
      const m = (currentD.getMonth() + 1).toString().padStart(2, '0');
      const d = currentD.getDate().toString().padStart(2, '0');
      days.push(`${y}-${m}-${d}`);
      currentD.setDate(currentD.getDate() + 1);
    }
    
    const dData = {};
    currentMonthTransactions.forEach(t => {
      if (!dData[t.date]) dData[t.date] = { total: 0, items: [] };
      dData[t.date].total += t.amount; 
      dData[t.date].items.push(t);
    });

    return { calendarDays: days, dailyData: dData };
  }, [startDate, endDate, currentMonthTransactions]);

  const handleCopy = (tx) => {
    setCopyTemplate(tx);
    setEditingTx(null);
    setSelectedDateForNewTx(null);
    setActiveTab('add');
  };

  const handleEdit = (tx) => {
    setEditingTx(tx);
    setCopyTemplate(null);
    setSelectedDateForNewTx(null);
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
            {t.hasDebt && (
              <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-bold border border-orange-100">
                {t.debtType === 'borrow' ? '立替' : '精算'} ¥{t.debtAmount.toLocaleString()}
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
    <div className="p-5 h-full overflow-y-auto pb-24 animate-in fade-in duration-300">
      <div className="flex gap-2 mb-6 p-1.5 bg-gray-100 rounded-2xl">
        <button 
          onClick={() => { setHistoryTab('list'); setSearchQuery(''); setSearchCategory('all'); }}
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

          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-4 space-y-3">
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-teal-500 transition-all border border-gray-100">
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="メモや金額で検索..."
                list="search-options"
                className="flex-1 bg-transparent text-sm font-medium focus:outline-none text-gray-700 placeholder-gray-400 min-w-0"
              />
              <datalist id="search-options">
                {memoSuggestions.map((m, idx) => (
                  <option key={idx} value={m} />
                ))}
              </datalist>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 whitespace-nowrap pl-1">ジャンル</span>
              <div className="relative flex-1">
                <select 
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="w-full bg-gray-50 px-3 py-2 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none border border-gray-100"
                >
                  <option value="all">すべてのジャンル</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                  <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>

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
              {searchQuery || searchCategory !== 'all' ? (
                <>
                  <Search className="text-gray-300 w-12 h-12 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium text-sm">一致する記録が見つかりません</p>
                </>
              ) : (
                <>
                  <List className="text-gray-300 w-12 h-12 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium text-sm">この期間の記録はありません</p>
                </>
              )}
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
                
                const mm = parseInt(dateStr.split('-')[1], 10);
                const dd = parseInt(dateStr.split('-')[2], 10);
                const dDisplay = dd === 1 ? `${mm}/${dd}` : dd;
                
                const hasData = dailyData[dateStr];
                const isSelected = selectedCalDate === dateStr;
                const isToday = dateStr === getTodayStr();
                
                return (
                  <div 
                    key={dateStr}
                    onClick={() => setSelectedCalDate(isSelected ? null : dateStr)}
                    className={`flex flex-col items-center justify-start p-0.5 sm:p-1 h-14 sm:h-16 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-teal-500 bg-teal-50 shadow-sm scale-105 z-10' : 'border-transparent bg-gray-50 hover:bg-gray-100'} ${isToday && !isSelected ? 'border-gray-200 bg-white' : ''}`}
                  >
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-teal-700' : isToday ? 'text-gray-800' : 'text-gray-500'}`}>{dDisplay}</span>
                    {hasData && (
                      <span className="text-[8px] text-teal-600 font-bold mt-auto truncate w-full break-all leading-tight px-0.5 text-center">
                        ¥{hasData.total.toLocaleString()}
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                  <CalendarCheck size={16} className="text-teal-600" />
                  {selectedCalDate.replace(/-/g, '/')} の詳細
                </h3>
                <button
                  onClick={() => {
                    setCopyTemplate(null);
                    setEditingTx(null);
                    setSelectedDateForNewTx(selectedCalDate);
                    setActiveTab('add');
                  }}
                  className="text-[10px] font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  この日に記録
                </button>
              </div>
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
    </div>
  );
};

const ReportView = ({ transactions, selectedMonth, setSelectedMonth, settings, categories }) => {
  const [reportMode, setReportMode] = useState('monthly'); 
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

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

  const monthlyReport = useMemo(() => {
    const data = [];
    const labels = [];
    const categoriesData = {}; 
    categories.forEach(c => categoriesData[c.id] = Array(6).fill(0));

    const [y, m] = selectedMonth.split('-').map(Number);
    let maxTotal = 0;

    for (let i = 5; i >= 0; i--) {
      let d = new Date(y, m - 1 - i, 1);
      let targetYear = d.getFullYear();
      let targetMonthStr = (d.getMonth() + 1).toString().padStart(2, '0');
      let monthLabel = `${d.getMonth() + 1}月`;

      const range = getMonthDateRange(`${targetYear}-${targetMonthStr}`, settings.closingDate);

      let total = 0;
      transactions.forEach(t => {
        if (!t.date) return;
        let effectiveAmount = t.amount;
        if (t.hasDebt && t.debtAmount) effectiveAmount = Math.max(0, t.amount - t.debtAmount);
        
        if (t.date >= range.startDate && t.date <= range.endDate) {
          total += effectiveAmount;
          if (categoriesData[t.categoryId]) {
            categoriesData[t.categoryId][5 - i] += effectiveAmount;
          }
        }
      });

      if (total > maxTotal) maxTotal = total;
      data.push({ label: monthLabel, total });
      labels.push(monthLabel);
    }

    const currMonth = data[5].total;
    const prevMonth = data[4].total;
    const diff = currMonth - prevMonth;

    return { data, labels, maxTotal: maxTotal || 1, categoriesData, currMonth, prevMonth, diff };
  }, [transactions, selectedMonth, settings.closingDate, categories]);

  const yearlyReport = useMemo(() => {
    const data = [];
    const labels = [];
    const categoriesData = {}; 
    categories.forEach(c => categoriesData[c.id] = Array(12).fill(0));
    let maxTotal = 0;

    for (let i = 1; i <= 12; i++) {
      const monthStr = i.toString().padStart(2, '0');
      const currMonthRange = getMonthDateRange(`${reportYear}-${monthStr}`, settings.closingDate);
      
      let currTotal = 0;

      transactions.forEach(t => {
        if (!t.date) return;
        let effectiveAmount = t.amount;
        if (t.hasDebt && t.debtAmount) effectiveAmount = Math.max(0, t.amount - t.debtAmount);
        
        if (t.date >= currMonthRange.startDate && t.date <= currMonthRange.endDate) {
          currTotal += effectiveAmount;
          if (categoriesData[t.categoryId]) {
            categoriesData[t.categoryId][i - 1] += effectiveAmount;
          }
        }
      });

      if (currTotal > maxTotal) maxTotal = currTotal;
      data.push({ month: i, currTotal });
      labels.push(`${i}月`);
    }
    return { data, labels, maxTotal: maxTotal || 1, categoriesData }; 
  }, [transactions, reportYear, settings.closingDate, categories]);

  return (
    <div className="p-5 h-full overflow-y-auto pb-24 animate-in fade-in duration-300">
      <div className="flex gap-2 mb-6 p-1.5 bg-gray-100 rounded-2xl">
        <button 
          onClick={() => setReportMode('monthly')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${reportMode === 'monthly' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          月間推移 (前月比)
        </button>
        <button 
          onClick={() => setReportMode('yearly')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${reportMode === 'yearly' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          年間推移 (昨年比)
        </button>
      </div>

      {reportMode === 'monthly' ? (
        <div className="animate-in fade-in">
          <div className="flex items-center justify-between bg-white px-3 py-3 rounded-2xl border border-gray-100 shadow-sm mb-4">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-50 rounded-xl text-gray-500 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-gray-800 text-sm">{selectedMonth.replace('-', '年')}月 (過去6ヶ月)</span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-50 rounded-xl text-gray-500 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <p className="text-xs font-bold text-gray-500">全体支出の推移</p>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-3xl font-black text-gray-800">¥{monthlyReport.currMonth.toLocaleString()}</span>
              <div className={`flex items-center gap-1 text-sm font-bold pb-1 ${monthlyReport.diff > 0 ? 'text-red-500' : 'text-teal-600'}`}>
                {monthlyReport.diff > 0 ? <TrendingUp size={16}/> : monthlyReport.diff < 0 ? <TrendingDown size={16}/> : null}
                {monthlyReport.diff > 0 ? `+¥${monthlyReport.diff.toLocaleString()}` : monthlyReport.diff < 0 ? `-¥${Math.abs(monthlyReport.diff).toLocaleString()}` : '±¥0'}
                <span className="text-xs text-gray-400 font-medium ml-1">前月比</span>
              </div>
            </div>
            <LineChart key={`monthly-total-${selectedMonth}`} data={monthlyReport.data.map(d=>d.total)} labels={monthlyReport.labels} color="#0d9488" />
          </div>

          <h3 className="font-bold text-gray-700 text-sm ml-1 mt-8 mb-3">ジャンル別の推移</h3>
          <div className="space-y-4">
            {categories.map(cat => {
              const dataPoints = monthlyReport.categoriesData[cat.id];
              const sum = dataPoints.reduce((a,b)=>a+b,0);
              if (sum === 0) return null;
              const Icon = ICON_MAP[cat.iconName] || ICON_MAP.MoreHorizontal;

              return (
                <div key={cat.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-3 border-b border-gray-50 pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${cat.color}`}><Icon size={14} /></div>
                      <span className="font-bold text-gray-700 text-sm">{cat.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-500">
                      直近6ヶ月計: ¥{sum.toLocaleString()}
                    </span>
                  </div>
                  <LineChart key={`monthly-cat-${cat.id}-${selectedMonth}`} data={dataPoints} labels={monthlyReport.labels} color={cat.hexColor} />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in">
          <div className="flex items-center justify-between bg-white px-3 py-3 rounded-2xl border border-gray-100 shadow-sm mb-4">
            <button onClick={() => setReportYear(y => y - 1)} className="p-2 hover:bg-gray-50 rounded-xl text-gray-500 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-gray-800 text-sm">{reportYear}年 (年間推移)</span>
            <button onClick={() => setReportYear(y => y + 1)} className="p-2 hover:bg-gray-50 rounded-xl text-gray-500 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <p className="text-xs font-bold text-gray-500">全体支出の年間推移</p>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-3xl font-black text-gray-800">
                ¥{yearlyReport.data.reduce((a, b) => a + b.currTotal, 0).toLocaleString()}
              </span>
              <span className="text-xs text-gray-400 font-medium pb-1.5">年間合計</span>
            </div>
            <LineChart key={`yearly-total-${reportYear}`} data={yearlyReport.data.map(d=>d.currTotal)} labels={yearlyReport.labels.map(l => l.replace('月',''))} color="#0d9488" />
          </div>

          <h3 className="font-bold text-gray-700 text-sm ml-1 mt-8 mb-3">ジャンル別の年間推移</h3>
          <div className="space-y-4">
            {categories.map(cat => {
              const dataPoints = yearlyReport.categoriesData[cat.id];
              const sum = dataPoints.reduce((a,b)=>a+b,0);
              if (sum === 0) return null;
              const Icon = ICON_MAP[cat.iconName] || ICON_MAP.MoreHorizontal;

              return (
                <div key={cat.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-3 border-b border-gray-50 pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${cat.color}`}><Icon size={14} /></div>
                      <span className="font-bold text-gray-700 text-sm">{cat.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-500">
                      年間累計: ¥{sum.toLocaleString()}
                    </span>
                  </div>
                  <LineChart key={`yearly-cat-${cat.id}-${reportYear}`} data={dataPoints} labels={yearlyReport.labels.map(l => l.replace('月',''))} color={cat.hexColor} />
                </div>
              );
            })}
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
    <div className="p-5 h-full overflow-y-auto pb-24 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setActiveTab('settings')} className="p-2 -ml-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
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

const SettingsView = ({ settings, settingsDocRef, showToast, setActiveTab, currentUserType, setCurrentUserType }) => {
  const [method, setMethod] = useState(settings.splitMethod || 'ratio');
  const [ratio, setRatio] = useState(settings.user1Ratio ?? 50);
  const [fixedPayer, setFixedPayer] = useState(settings.fixedPayer || 'user1');
  const [amount, setAmount] = useState(settings.fixedAmount || 0);
  const [closingDate, setClosingDate] = useState(settings.closingDate || 'end');
  
  const [monthlyBudget, setMonthlyBudget] = useState(settings.monthlyBudget || 0);
  
  const [u1Name, setU1Name] = useState(settings.user1Name || 'あなた');
  const [u2Name, setU2Name] = useState(settings.user2Name || 'パートナー');
  
  const [isSaving, setIsSaving] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Gift');
  const [newCatColor, setNewCatColor] = useState(COLOR_PRESETS[0]);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [isSavingCat, setIsSavingCat] = useState(false);

  const [initialDebtPayer, setInitialDebtPayer] = useState(
    (settings.initialDebt || 0) > 0 ? 'user2' : (settings.initialDebt || 0) < 0 ? 'user1' : 'none'
  );
  const [initialDebtAmount, setInitialDebtAmount] = useState(Math.abs(settings.initialDebt || 0) || '');

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
        closingDate,
        monthlyBudget: Number(monthlyBudget),
        initialDebt: initialDebtPayer === 'none' ? 0 : (initialDebtPayer === 'user2' ? Number(initialDebtAmount) : -Number(initialDebtAmount)) 
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
    <div className="p-5 h-full overflow-y-auto pb-24 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Settings className="text-teal-600" />
        各種設定
      </h2>

      {/* 👤 基本設定セクション */}
      <h3 className="text-[11px] font-bold text-gray-400 mb-2 ml-1 uppercase tracking-wider">基本設定</h3>
      
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-4">
        <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-1.5"><Smartphone size={16}/> このスマホを使う人</h4>
        <select 
          value={currentUserType}
          onChange={(e) => {
            setCurrentUserType(e.target.value);
            localStorage.setItem('shareloo_currentUserType', e.target.value);
            showToast('あなたの設定を保存しました');
          }}
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-bold text-gray-800 text-sm"
        >
          <option value="user1">{u1Name}</option>
          <option value="user2">{u2Name}</option>
        </select>
        <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">
          ※記録を追加する際の最初の支払者として選択されます。
        </p>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-1.5"><User size={16}/> メンバーの名前</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-500 flex-shrink-0"></div>
            <input 
              type="text" 
              value={u1Name}
              onChange={(e) => setU1Name(e.target.value)}
              placeholder="あなた"
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-bold text-gray-800 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-400 flex-shrink-0"></div>
            <input 
              type="text" 
              value={u2Name}
              onChange={(e) => setU2Name(e.target.value)}
              placeholder="パートナー"
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all font-bold text-gray-800 text-sm"
            />
          </div>
        </div>
      </div>

      {/* 💰 ルール設定セクション */}
      <h3 className="text-[11px] font-bold text-gray-400 mb-2 ml-1 uppercase tracking-wider">お金のルール</h3>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-4">
        <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-1.5"><PieChart size={16}/> 割り勘のルール</h4>
        <div className="flex gap-2 mb-4 p-1 bg-gray-50 rounded-xl border border-gray-100">
          <button 
            onClick={() => setMethod('ratio')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${method === 'ratio' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            比率で分ける
          </button>
          <button 
            onClick={() => setMethod('amount')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${method === 'amount' ? 'bg-white shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            金額で分ける
          </button>
        </div>

        {method === 'ratio' ? (
          <div className="animate-in fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 text-center">
                <p className="text-[10px] font-bold text-teal-600 mb-1 truncate">{u1Name}</p>
                <div className="relative">
                  <input 
                    type="number" 
                    inputMode="numeric"
                    pattern="\d*"
                    value={ratio}
                    onChange={(e) => setRatio(Math.min(100, Math.max(0, e.target.value)))}
                    className="w-full text-center text-lg font-bold py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                </div>
              </div>
              <span className="font-bold text-gray-300 text-lg">:</span>
              <div className="flex-1 text-center min-w-0">
                <p className="text-[10px] font-bold text-rose-500 mb-1 truncate">{u2Name}</p>
                <div className="w-full text-center text-lg font-bold py-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 relative">
                  {100 - ratio}
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                </div>
              </div>
            </div>
            <div className="px-1">
              <input 
                type="range" 
                min="0" max="100" 
                value={ratio} 
                onChange={(e) => setRatio(e.target.value)}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-gray-500 mb-1">負担する人</label>
                <select 
                  value={fixedPayer} 
                  onChange={(e) => setFixedPayer(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                >
                  <option value="user1">{u1Name}</option>
                  <option value="user2">{u2Name}</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-gray-500 mb-1">固定負担額</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">¥</span>
                  <input 
                    type="number" 
                    inputMode="numeric"
                    pattern="\d*"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-6 pr-2 py-2 text-right text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            <p className="text-[9px] text-gray-400 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-100">
              ※毎月の合計支出がこの金額に満たない場合は指定された人が全額負担します。
            </p>
          </div>
        )}
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-4">
        <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-1.5"><CalendarCheck size={16}/> 締め日</h4>
        <select 
          value={closingDate}
          onChange={(e) => setClosingDate(e.target.value)}
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-bold text-gray-800 text-sm"
        >
          <option value="end">月末締め</option>
          {Array.from({length: 28}, (_, i) => i + 1).map(d => (
            <option key={d} value={d.toString()}>{d}日締め</option>
          ))}
        </select>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-4">
        <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-1.5"><TrendingDown size={16}/> 目標予算</h4>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">¥</span>
          <input 
            type="number" 
            inputMode="numeric"
            pattern="\d*"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
            className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-bold text-gray-800 text-sm"
            placeholder="0 (未設定)"
          />
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-1.5"><Wallet size={16}/> 立替・借金の初期残高</h4>
        <div className="space-y-3">
          <select 
            value={initialDebtPayer} 
            onChange={(e) => setInitialDebtPayer(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all text-gray-800 text-sm"
          >
            <option value="none">設定しない（0円）</option>
            <option value="user1">{u1Name} が立て替えている</option>
            <option value="user2">{u2Name} が立て替えている</option>
          </select>
          {initialDebtPayer !== 'none' && (
            <div className="relative animate-in fade-in slide-in-from-top-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">¥</span>
              <input 
                type="number" 
                inputMode="numeric"
                pattern="\d*"
                value={initialDebtAmount}
                onChange={(e) => setInitialDebtAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all font-bold text-gray-800 text-sm"
                placeholder="0"
              />
            </div>
          )}
        </div>
      </div>

      {/* 🛠 カスタマイズセクション */}
      <h3 className="text-[11px] font-bold text-gray-400 mb-2 ml-1 uppercase tracking-wider">カスタマイズ</h3>

      <button 
        onClick={() => setActiveTab('fixed')}
        className="w-full bg-indigo-50 border border-indigo-100 p-4 rounded-3xl mb-4 flex items-center justify-between hover:bg-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-full">
            <CalendarCheck size={18} />
          </div>
          <div className="text-left">
            <p className="font-bold text-indigo-900 text-sm">毎月の固定費を設定</p>
            <p className="text-[10px] text-indigo-600 mt-0.5">家賃やサブスクの自動入力を管理</p>
          </div>
        </div>
        <ChevronRightIcon size={20} className="text-indigo-400" />
      </button>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <h4 className="font-bold text-gray-700 mb-4 text-sm flex items-center gap-1.5"><Settings2 size={16}/> オリジナルジャンル</h4>
        
        {settings.customCategories && settings.customCategories.length > 0 && (
          <div className="mb-5 space-y-2">
            <label className="block text-[10px] text-gray-500 mb-1">追加済みのジャンル</label>
            <div className="flex flex-wrap gap-2">
              {settings.customCategories.map(cat => {
                const Icon = ICON_MAP[cat.iconName] || ICON_MAP.MoreHorizontal;
                return (
                  <div key={cat.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${cat.color} text-[11px] font-bold`}>
                    <Icon size={12} />
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
            className="w-full border-2 border-dashed border-gray-300 text-gray-500 font-bold py-3 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all flex justify-center items-center gap-2 text-sm"
          >
            <Plus size={16} />
            新しいジャンルを作成する
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">ジャンル名</label>
              <input 
                type="text" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="例：ペット用品"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-gray-800 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">アイコン</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(ICON_MAP).map(iconKey => {
                  const IconComp = ICON_MAP[iconKey];
                  return (
                    <button
                      key={iconKey}
                      onClick={() => setNewCatIcon(iconKey)}
                      className={`p-2 rounded-xl transition-all ${newCatIcon === iconKey ? 'bg-teal-500 text-white shadow-sm scale-110' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                    >
                      <IconComp size={16} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 mb-1">テーマカラー</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setNewCatColor(preset)}
                    className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${preset.color.split(' ')[0]} ${newCatColor.hexColor === preset.hexColor ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: preset.color.includes('bg-') ? undefined : preset.hexColor }}
                  >
                    {newCatColor.hexColor === preset.hexColor && <Check size={12} className={preset.color.split(' ')[1]} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-200">
              <div className="text-[10px] text-gray-400 font-bold w-12 text-center">プレビュー</div>
              <div className={`p-1.5 rounded-full ${newCatColor.color}`}>
                 {React.createElement(ICON_MAP[newCatIcon], { size: 14 })}
              </div>
              <span className="font-bold text-gray-800 text-xs">{newCatName || 'ジャンル名'}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setIsAddingCat(false)} className="flex-1 py-2 text-gray-500 font-bold border border-gray-200 bg-white rounded-xl hover:bg-gray-100 transition-colors text-xs">キャンセル</button>
              <button onClick={handleAddCategory} disabled={isSavingCat} className="flex-1 py-2 bg-teal-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-teal-700 transition-colors text-xs">作成する</button>
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={handleSaveGeneral}
        disabled={isSaving}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-teal-200 transition-all active:scale-[0.98] disabled:opacity-50 mt-8 mb-4"
      >
        {isSaving ? '保存中...' : 'すべての設定を保存する'}
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
  const [historyTab, setHistoryTab] = useState('list');
  
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
    closingDate: 'end',
    monthlyBudget: 0,
    initialDebt: 0 
  });
  const [selectedMonth, setSelectedMonth] = useState(getTodayStr().slice(0, 7));
  const [historySortMode, setHistorySortMode] = useState('date-desc');
  const [searchCategory, setSearchCategory] = useState('all');
  
  const [currentUserType, setCurrentUserType] = useState(() => {
    return localStorage.getItem('shareloo_currentUserType') || 'user1';
  });

  const [selectedDateForNewTx, setSelectedDateForNewTx] = useState(null);

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

  const u1NetDebt = useMemo(() => {
    let debt = settings.initialDebt || 0; 
    transactions.forEach(t => {
      if (t.hasDebt && t.debtAmount) {
        if (t.paidBy === 'user1') debt -= t.debtAmount;
        else debt += t.debtAmount;
      }
    });
    return debt;
  }, [transactions, settings.initialDebt]);

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
          closingDate: data.closingDate || 'end',
          monthlyBudget: data.monthlyBudget || 0,
          initialDebt: data.initialDebt || 0
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
      let effectiveAmount = t.amount;
      if (t.hasDebt && t.debtAmount) {
        effectiveAmount = Math.max(0, t.amount - t.debtAmount);
      }

      total += effectiveAmount;
      if (t.paidBy === 'user1') u1Total += effectiveAmount;
      if (t.paidBy === 'user2') u2Total += effectiveAmount;

      if (!categoryTotals[t.categoryId]) {
        categoryTotals[t.categoryId] = 0;
      }
      categoryTotals[t.categoryId] += effectiveAmount;

      if (t.isCustomSplit) {
        let tU1Target = 0;
        if (t.customSplitMode === 'amount') {
          tU1Target = t.customUser1Amount || 0;
        } else {
          tU1Target = Math.round(effectiveAmount * ((t.customUser1Ratio ?? 50) / 100));
        }
        customU1TargetSum += tU1Target;
        customU2TargetSum += (effectiveAmount - tU1Target);
      } else {
        defaultSplitTotal += effectiveAmount;
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
            <h1 className="text-2xl font-black tracking-tight text-gray-800 mb-2">ささっと家計簿</h1>
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
    <div className="max-w-md mx-auto bg-gray-50 h-[100dvh] relative shadow-2xl overflow-hidden font-sans text-gray-800 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md pt-12 pb-4 px-5 sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm shadow-teal-200">
            <Leaf size={20} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-black tracking-tight text-gray-800">ささっと家計簿</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto" id="main-scroll-area">
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
            setActiveTab={setActiveTab}
            setSearchCategory={setSearchCategory}
            u1NetDebt={u1NetDebt}
          />
        )}
        {activeTab === 'add' && (
          <TransactionFormView 
            mode="add"
            editingTx={null}
            setEditingTx={setEditingTx}
            copyTemplate={copyTemplate}
            setCopyTemplate={setCopyTemplate}
            selectedDateForNewTx={selectedDateForNewTx}
            setActiveTab={setActiveTab}
            setSelectedMonth={setSelectedMonth}
            users={users}
            categories={categories}
            settings={settings}
            db={db}
            appId={appId}
            txCollection={txCollection}
            showToast={showToast}
            transactions={transactions}
            currentUserType={currentUserType} 
          />
        )}
        {activeTab === 'edit' && (
          <TransactionFormView 
            mode="edit"
            editingTx={editingTx}
            setEditingTx={setEditingTx}
            copyTemplate={copyTemplate}
            setCopyTemplate={setCopyTemplate}
            selectedDateForNewTx={null}
            setActiveTab={setActiveTab}
            setSelectedMonth={setSelectedMonth}
            users={users}
            categories={categories}
            settings={settings}
            db={db}
            appId={appId}
            txCollection={txCollection}
            showToast={showToast}
            transactions={transactions}
            currentUserType={currentUserType} 
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
            startDate={startDate}
            endDate={endDate}
            historySortMode={historySortMode}
            setHistorySortMode={setHistorySortMode}
            categories={categories}
            users={users}
            settings={settings}
            setCopyTemplate={setCopyTemplate}
            setEditingTx={setEditingTx}
            setSelectedDateForNewTx={setSelectedDateForNewTx}
            setActiveTab={setActiveTab}
            showToast={showToast}
            db={db}
            appId={appId}
            searchCategory={searchCategory}
            setSearchCategory={setSearchCategory}
            historyTab={historyTab} 
            setHistoryTab={setHistoryTab} 
          />
        )}
        {activeTab === 'report' && (
          <ReportView 
            transactions={transactions}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            settings={settings}
            categories={categories}
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
            setActiveTab={setActiveTab}
            currentUserType={currentUserType} 
            setCurrentUserType={setCurrentUserType} 
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
        className="bg-white/95 backdrop-blur-md border-t border-gray-100 w-full z-20 shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-around items-center h-14 px-1">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 w-12 transition-all duration-200 ${activeTab === 'home' ? 'text-teal-600 scale-105' : 'text-gray-400 hover:text-gray-500'}`}
          >
            <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[8px] font-bold">ホーム</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('history'); setSearchCategory('all'); }}
            className={`flex flex-col items-center gap-0.5 w-12 transition-all duration-200 ${activeTab === 'history' ? 'text-teal-600 scale-105' : 'text-gray-400 hover:text-gray-500'}`}
          >
            <List size={20} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
            <span className="text-[8px] font-bold">履歴</span>
          </button>

          <button 
            onClick={() => {
              setEditingTx(null);
              setCopyTemplate(null);
              setSelectedDateForNewTx(null);
              setActiveTab('add');
            }}
            className="flex flex-col items-center justify-center -translate-y-4 group"
          >
            <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-200/50 group-hover:bg-teal-700 transition-all duration-300 active:scale-90 ring-4 ring-gray-50">
              <Plus size={24} strokeWidth={3} className="transition-transform group-hover:rotate-90 duration-300" />
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('report')}
            className={`flex flex-col items-center gap-0.5 w-12 transition-all duration-200 ${activeTab === 'report' ? 'text-teal-600 scale-105' : 'text-gray-400 hover:text-gray-500'}`}
          >
            <BarChart3 size={20} strokeWidth={activeTab === 'report' ? 2.5 : 2} />
            <span className="text-[8px] font-bold">レポート</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-0.5 w-12 transition-all duration-200 ${activeTab === 'settings' ? 'text-teal-600 scale-105' : 'text-gray-400 hover:text-gray-500'}`}
          >
            <Settings size={20} strokeWidth={activeTab === 'settings' ? 2.5 : 2} className={activeTab === 'settings' ? 'animate-spin-slow' : ''} />
            <span className="text-[8px] font-bold">設定</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
