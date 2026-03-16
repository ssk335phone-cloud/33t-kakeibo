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
  Lock
} from 'lucide-react';

// --- Firebase のインポート ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

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

// 🔒 【重要】お二人だけの秘密の合言葉（ここで変更できます）
const SECRET_PASSPHRASE = "!1214083120190322";

const CATEGORIES = [
  { id: 'food', name: '食費', icon: Utensils, color: 'bg-orange-100 text-orange-600', hexColor: '#ea580c' },
  { id: 'daily', name: '日用品', icon: ShoppingCart, color: 'bg-blue-100 text-blue-600', hexColor: '#2563eb' },
  { id: 'rent', name: '家賃', icon: HomeIcon, color: 'bg-emerald-100 text-emerald-600', hexColor: '#059669' },
  { id: 'utility', name: '光熱費', icon: Zap, color: 'bg-yellow-100 text-yellow-600', hexColor: '#ca8a04' },
  { id: 'date', name: '交際費', icon: Heart, color: 'bg-pink-100 text-pink-600', hexColor: '#db2777' },
  { id: 'transport', name: '交通費', icon: Train, color: 'bg-cyan-100 text-cyan-600', hexColor: '#0891b2' },
  { id: 'other', name: 'その他', icon: MoreHorizontal, color: 'bg-gray-200 text-gray-700', hexColor: '#4b5563' },
];

export default function App() {
  // --- セキュリティ（合言葉）ステート ---
  // localStorageに保存された合言葉が一致しているかチェック
  const [isPassphraseValid, setIsPassphraseValid] = useState(() => {
    return localStorage.getItem('shareloo_passphrase') === SECRET_PASSPHRASE;
  });
  const [passphraseInput, setPassphraseInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // --- 既存のステート ---
  const [activeTab, setActiveTab] = useState('home');
  const [transactions, setTransactions] = useState([]);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [settings, setSettings] = useState({ 
    splitMethod: 'ratio', 
    user1Ratio: 50, 
    fixedPayer: 'user1', 
    fixedAmount: 0,
    user1Name: 'あなた',
    user2Name: 'パートナー'
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [copyTemplate, setCopyTemplate] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [user, setUser] = useState(null);

  const users = useMemo(() => ({
    user1: { id: 'user1', name: settings.user1Name || 'あなた', color: 'bg-teal-500', lightColor: 'bg-teal-100 text-teal-700' },
    user2: { id: 'user2', name: settings.user2Name || 'パートナー', color: 'bg-rose-400', lightColor: 'bg-rose-100 text-rose-700' }
  }), [settings.user1Name, settings.user2Name]);

  // --- Firebase 認証とデータ取得（合言葉がOKな場合のみ実行） ---
  useEffect(() => {
    if (!isPassphraseValid) return; // 合言葉が認証されるまではFirebaseに接続しない

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
          user2Name: data.user2Name || 'パートナー'
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

  // --- ログイン処理 ---
  const handleLogin = () => {
    if (passphraseInput === SECRET_PASSPHRASE) {
      localStorage.setItem('shareloo_passphrase', passphraseInput);
      setIsPassphraseValid(true);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  // --- 計算ロジック ---
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const stats = useMemo(() => {
    let total = 0;
    let u1Total = 0;
    let u2Total = 0;
    const categoryTotals = {};

    currentMonthTransactions.forEach(t => {
      total += t.amount;
      if (t.paidBy === 'user1') u1Total += t.amount;
      if (t.paidBy === 'user2') u2Total += t.amount;

      if (!categoryTotals[t.categoryId]) {
        categoryTotals[t.categoryId] = 0;
      }
      categoryTotals[t.categoryId] += t.amount;
    });

    let u1Target = 0;
    let u2Target = 0;

    if (settings.splitMethod === 'ratio') {
      u1Target = Math.round(total * (settings.user1Ratio / 100));
      u2Target = total - u1Target;
    } else {
      if (settings.fixedPayer === 'user1') {
        u1Target = Math.min(settings.fixedAmount, total);
        u2Target = total - u1Target;
      } else {
        u2Target = Math.min(settings.fixedAmount, total);
        u1Target = total - u2Target;
      }
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

  const formatMonth = (monthStr) => {
    const [y, m] = monthStr.split('-');
    return `${y}年${parseInt(m, 10)}月`;
  };

  // ==========================================
  // 🔒 ロック（合言葉入力）画面
  // ==========================================
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

  // ==========================================
  // メイン画面（認証済み）
  // ==========================================
  const HomeView = () => {
    let cumulativePercent = 0;
    const gradientStops = stats.categoryTotals.length > 0 
      ? stats.categoryTotals.map(c => {
          const cat = CATEGORIES.find(cat => cat.id === c.id);
          const percent = (c.amount / stats.total) * 100;
          const start = cumulativePercent;
          const end = cumulativePercent + percent;
          cumulativePercent += percent;
          return `${cat?.hexColor || '#ccc'} ${start}% ${end}%`;
        }).join(', ')
      : '#f3f4f6 0% 100%';

    return (
      <div className="p-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <ChevronLeft size={24} />
          </button>
          <span className="font-bold text-gray-800 text-lg tracking-wider">
            {formatMonth(selectedMonth)}
          </span>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-gray-500 text-sm font-medium mb-1">共同生活費 合計</h2>
          <div className="text-4xl font-bold text-gray-800 mb-6">
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
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${users.user1.color}`}></div>
              <span className="text-gray-600">{users.user1.name}: ¥{stats.u1Total.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-600">¥{stats.u2Total.toLocaleString()} :{users.user2.name}</span>
              <div className={`w-3 h-3 rounded-full ${users.user2.color}`}></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center text-xs text-gray-500 font-medium border border-gray-100">
            <span>目標: ¥{stats.u1Target.toLocaleString()}</span>
            <span className="bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200 text-[10px]">
              {settings.splitMethod === 'ratio' ? `ルール: ${settings.user1Ratio}:${100-settings.user1Ratio}` : '金額固定'}
            </span>
            <span>目標: ¥{stats.u2Target.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-teal-50 p-5 rounded-3xl border border-teal-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-full text-teal-600 shadow-sm">
              <ArrowRightLeft size={24} />
            </div>
            <div>
              <p className="text-xs text-teal-600 font-medium mb-1">現在の精算状況</p>
              {stats.total === 0 ? (
                <p className="font-bold text-gray-800">支出はありません</p>
              ) : stats.u1Diff > 0 ? (
                <p className="font-bold text-gray-800 text-sm">
                  {users.user2.name}から <span className="text-teal-600 text-lg">¥{Math.abs(stats.u1Diff).toLocaleString()}</span> もらう
                </p>
              ) : stats.u1Diff < 0 ? (
                <p className="font-bold text-gray-800 text-sm">
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
                const cat = CATEGORIES.find(cat => cat.id === c.id);
                if (!cat) return null;
                const Icon = cat.icon;
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

  const AddTransactionView = () => {
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState('user1');
    const [categoryId, setCategoryId] = useState('food');
    const [memo, setMemo] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
      if (copyTemplate) {
        setAmount(copyTemplate.amount.toString());
        setPaidBy(copyTemplate.paidBy);
        setCategoryId(copyTemplate.categoryId);
        setMemo(copyTemplate.memo);
        setCopyTemplate(null);
      }
    }, [copyTemplate]);

    const handleSave = async () => {
      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        showToast('正しい金額を入力してください');
        return;
      }
      setIsSaving(true);
      try {
        await addDoc(txCollection, {
          date,
          amount: Number(amount),
          paidBy,
          categoryId,
          memo,
          createdAt: Date.now()
        });
        showToast('記録を保存しました');
        setSelectedMonth(date.slice(0, 7));
        setActiveTab('home');
      } catch (error) {
        console.error("Error adding document: ", error);
        showToast('エラーが発生しました');
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div className="p-5 h-full overflow-y-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Wallet className="text-teal-600" />
          支出を記録する
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">金額</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">¥</span>
              <input 
                type="number" 
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
                  className={`flex-1 py-3 rounded-2xl font-bold transition-all border-2 ${
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

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">ジャンル</label>
            <div className="grid grid-cols-4 gap-3">
              {CATEGORIES.map(c => {
                const Icon = c.icon;
                const isSelected = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border-2 ${
                      isSelected ? 'border-teal-500 bg-teal-50 scale-105 shadow-sm' : 'border-transparent bg-white shadow-sm hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-full mb-1 ${isSelected ? 'bg-teal-500 text-white' : c.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-teal-700' : 'text-gray-500'}`}>
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
            {isSaving ? '保存中...' : '登録する'}
          </button>
        </div>
      </div>
    );
  };

  const HistoryView = () => {
    const groupedTx = useMemo(() => {
      const groups = {};
      const sorted = transactions.slice().sort((a, b) => {
        if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      
      sorted.forEach(t => {
        if (!t.date) return;
        const month = t.date.slice(0, 7);
        if (!groups[month]) groups[month] = [];
        groups[month].push(t);
      });
      return groups;
    }, [transactions]);

    const handleCopy = (tx) => {
      setCopyTemplate(tx);
      setActiveTab('add');
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

    return (
      <div className="p-5 h-full overflow-y-auto pb-32 animate-in fade-in duration-300">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <List className="text-teal-600" />
          支払い履歴
        </h2>

        {Object.keys(groupedTx).length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 border-dashed">
            <List className="text-gray-300 w-12 h-12 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">まだ記録がありません</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(groupedTx).sort((a, b) => b.localeCompare(a)).map(month => (
              <div key={month} className="space-y-3">
                <h3 className="font-bold text-gray-500 text-sm border-b border-gray-200 pb-2 mb-4 sticky top-0 bg-gray-50/90 backdrop-blur z-10">
                  {formatMonth(month)}
                </h3>
                
                {groupedTx[month].map(t => {
                  const cat = CATEGORIES.find(c => c.id === t.categoryId);
                  if (!cat) return null;
                  const user = users[t.paidBy];
                  const Icon = cat.icon;
                  return (
                    <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 transition-all hover:shadow-md">
                      <div className={`p-3 rounded-full ${cat.color}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate">{t.memo || cat.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 font-medium">{t.date.replace(/-/g, '/')}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${user.lightColor}`}>
                            {user.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="font-bold text-gray-800">
                          ¥{t.amount.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <button 
                            onClick={() => handleCopy(t)}
                            className="text-xs flex items-center gap-1 text-teal-600 bg-teal-50 px-2 py-1 rounded-lg hover:bg-teal-100 transition-colors"
                          >
                            <Copy size={12} />
                            コピー
                          </button>
                          <button 
                            onClick={() => handleDeleteTx(t.id)}
                            className="text-xs flex items-center justify-center text-red-400 bg-red-50 p-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const FixedExpensesView = () => {
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
      const today = new Date().toISOString().slice(0, 10);
      try {
        const promises = fixedExpenses.map(expense => 
          addDoc(txCollection, {
            date: today,
            amount: expense.amount,
            paidBy: expense.paidBy,
            categoryId: expense.categoryId,
            memo: expense.memo,
            createdAt: Date.now()
          })
        );
        await Promise.all(promises);
        showToast('今月分の固定費を一括登録しました！');
        setSelectedMonth(today.slice(0, 7));
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
            毎月発生する家賃やサブスクなどを登録しておくと、ボタン一つで今月分の履歴に追加できます。
          </p>
          <button 
            onClick={handleRegisterMonthly}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
          >
            <Check size={20} />
            今月分として一括登録する
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
              const cat = CATEGORIES.find(c => c.id === f.categoryId);
              if (!cat) return null;
              const user = users[f.paidBy];
              const Icon = cat.icon;
              return (
                <div key={f.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className={`p-3 rounded-full ${cat.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{f.memo}</p>
                    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${user.lightColor}`}>
                      {user.name}が支払う
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
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
                  <input type="number" value={newAmount} onChange={e=>setNewAmount(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">名目（家賃など）</label>
                <input type="text" value={newMemo} onChange={e=>setNewMemo(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="何代？" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">支払う人</label>
                  <select value={newPaidBy} onChange={e=>setNewPaidBy(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-medium">
                    {Object.values(users).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">ジャンル</label>
                  <select value={newCategory} onChange={e=>setNewCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-medium">
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

  const SettingsView = () => {
    const [method, setMethod] = useState(settings.splitMethod);
    const [ratio, setRatio] = useState(settings.user1Ratio);
    const [fixedPayer, setFixedPayer] = useState(settings.fixedPayer);
    const [amount, setAmount] = useState(settings.fixedAmount);
    
    const [u1Name, setU1Name] = useState(settings.user1Name || 'あなた');
    const [u2Name, setU2Name] = useState(settings.user2Name || 'パートナー');
    
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
      if (!u1Name || !u2Name) {
        showToast('名前を入力してください');
        return;
      }
      setIsSaving(true);
      try {
        await setDoc(settingsDocRef, {
          splitMethod: method,
          user1Ratio: Number(ratio),
          fixedPayer,
          fixedAmount: Number(amount),
          user1Name: u1Name,
          user2Name: u2Name
        });
        showToast('設定を保存しました');
      } catch (e) {
        console.error(e);
        showToast('エラーが発生しました');
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div className="p-5 h-full overflow-y-auto pb-32 animate-in fade-in duration-300">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Settings className="text-teal-600" />
          各種設定
        </h2>

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

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full mt-10 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '設定を保存する'}
          </button>
        </div>
      </div>
    );
  };

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
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'add' && <AddTransactionView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'fixed' && <FixedExpensesView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {toastMessage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-5 py-3 rounded-full shadow-lg text-sm font-medium z-50 animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          {toastMessage}
        </div>
      )}

      <nav className="bg-white border-t border-gray-100 pb-safe absolute bottom-0 w-full z-20">
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
