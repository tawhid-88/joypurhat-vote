"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Send, 
  UserCircle, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Vote,
  Menu,
  X
} from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
// In a real Next.js app, put these in a separate file (e.g., lib/firebase.js)
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp,
  updateDoc,
  increment 
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAdMS9DDSx839c_jJuDR1ACiQtdFSQZsqc",
  authDomain: "joypurhat-vote-test.firebaseapp.com",
  projectId: "joypurhat-vote-test",
  storageBucket: "joypurhat-vote-test.firebasestorage.app",
  messagingSenderId: "603832738750",
  appId: "1:603832738750:web:ce6f3e159938796f5acfef"
};
// Initialize Firebase only if config is present to prevent crashes in preview
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

// --- MOCK DATA FOR PREVIEW MODE ---
// This allows the app to demonstrate functionality without live backend keys
const MOCK_CENTERS = Array.from({ length: 130 }, (_, i) => ({
  id: `center-${i + 1}`,
  name: `Center ${i + 1} - Joypurhat Sadar`,
  totalVoters: 2500,
  isReported: i < 45, // Simulate 45 centers already reported
  votes: {
    boat: i < 45 ? Math.floor(Math.random() * 1200) : 0,
    eagle: i < 45 ? Math.floor(Math.random() * 800) : 0,
    truck: i < 45 ? Math.floor(Math.random() * 200) : 0,
  }
}));

// --- COMPONENTS ---

// 1. Dashboard Component (Public View)
const Dashboard = ({ centers }) => {
  const stats = useMemo(() => {
    let total = { boat: 0, eagle: 0, truck: 0, all: 0 };
    let reportedCount = 0;

    centers.forEach(c => {
      if (c.isReported) {
        total.boat += c.votes.boat;
        total.eagle += c.votes.eagle;
        total.truck += c.votes.truck;
        total.all += (c.votes.boat + c.votes.eagle + c.votes.truck);
        reportedCount++;
      }
    });
    return { total, reportedCount };
  }, [centers]);

  const maxVote = Math.max(stats.total.boat, stats.total.eagle, stats.total.truck, 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Total Counted</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total.all.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
          <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Reporting Centers</p>
          <p className="text-3xl font-bold text-gray-900">{stats.reportedCount} <span className="text-sm text-gray-400 font-normal">/ 130</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
          <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Leading</p>
          <p className="text-xl font-bold text-gray-900 truncate">
            {stats.total.boat > stats.total.eagle ? "Boat 🚤" : "Eagle 🦅"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
          <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Completion</p>
          <p className="text-3xl font-bold text-gray-900">{Math.round((stats.reportedCount / 130) * 100)}%</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          Live Results
        </h3>
        
        <div className="space-y-6">
          {/* Boat */}
          <CandidateBar 
            name="Boat (Nouka)" 
            symbol="🚤" 
            votes={stats.total.boat} 
            total={stats.total.all} 
            max={maxVote}
            color="bg-emerald-600"
            bg="bg-emerald-50"
          />
          {/* Eagle */}
          <CandidateBar 
            name="Eagle (Eagal)" 
            symbol="🦅" 
            votes={stats.total.eagle} 
            total={stats.total.all} 
            max={maxVote}
            color="bg-amber-500"
            bg="bg-amber-50"
          />
          {/* Truck */}
          <CandidateBar 
            name="Truck" 
            symbol="🚚" 
            votes={stats.total.truck} 
            total={stats.total.all} 
            max={maxVote}
            color="bg-purple-600"
            bg="bg-purple-50"
          />
        </div>
      </div>

      {/* Recent Updates Ticker */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h4 className="font-semibold text-sm text-gray-700">Recent Center Reports</h4>
        </div>
        <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {centers.filter(c => c.isReported).slice(0, 10).map((center) => (
            <div key={center.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900 text-sm">{center.name}</p>
                <p className="text-xs text-gray-500">Votes Cast: {(center.votes.boat + center.votes.eagle + center.votes.truck).toLocaleString()}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Submitted
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper for Chart Bars
const CandidateBar = ({ name, symbol, votes, total, max, color, bg }) => {
  const percentage = total > 0 ? ((votes / total) * 100).toFixed(1) : 0;
  const barWidth = max > 0 ? (votes / max) * 100 : 0;

  return (
    <div className={`p-4 rounded-xl ${bg} relative overflow-hidden transition-all duration-500`}>
      <div className="flex justify-between items-end mb-2 relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{symbol}</span>
          <div>
            <p className="font-bold text-gray-900">{name}</p>
            <p className="text-xs text-gray-500 font-medium">{percentage}% of total cast</p>
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{votes.toLocaleString()}</p>
      </div>
      
      {/* Progress Bar Background */}
      <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden relative z-10">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out`} 
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
};

// 2. Agent Input Component
const AgentInput = ({ user, onLogout, updateMockData }) => {
  const [formData, setFormData] = useState({ boat: '', eagle: '', truck: '' });
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  
  const centerName = user?.centerName || "Joypurhat Sadar Model School";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.boat || !formData.eagle) {
      alert("Please fill in at least the main candidates");
      return;
    }

    setStatus('submitting');
    
    // Simulate Network Delay
    setTimeout(async () => {
      try {
        if (db && user) {
           // Real Firestore Submit
           const centerRef = doc(db, "centers", user.centerId);
           await updateDoc(centerRef, {
             votes: {
               boat: Number(formData.boat),
               eagle: Number(formData.eagle),
               truck: Number(formData.truck || 0)
             },
             isReported: true,
             timestamp: serverTimestamp()
           });
        } else {
           // Mock Submit
           updateMockData(user.centerId, {
             boat: Number(formData.boat),
             eagle: Number(formData.eagle),
             truck: Number(formData.truck || 0)
           });
        }
        setStatus('success');
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    }, 1500);
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-white rounded-2xl shadow-sm border border-green-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Successful!</h2>
        <p className="text-gray-500 mb-8">Vote count for <br/><span className="font-semibold text-gray-800">{centerName}</span><br/> has been recorded.</p>
        <button 
          onClick={() => setStatus('idle')}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Submit Correction
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-900 p-6 text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold">Data Entry Form</h2>
            <p className="text-gray-400 text-sm">Official Agent Use Only</p>
          </div>
          <button onClick={onLogout} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-white/10 p-3 rounded-lg flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-full">
            <UserCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Assigned Center</p>
            <p className="text-sm font-semibold truncate">{centerName}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <label className="flex items-center gap-2 text-sm font-bold text-emerald-800 mb-2">
              <span>🚤</span> Boat (Awami League)
            </label>
            <input 
              type="number" 
              className="w-full p-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-xl font-mono"
              placeholder="0"
              value={formData.boat}
              onChange={e => setFormData({...formData, boat: e.target.value})}
              required
            />
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <label className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-2">
              <span>🦅</span> Eagle (Independent)
            </label>
            <input 
              type="number" 
              className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-xl font-mono"
              placeholder="0"
              value={formData.eagle}
              onChange={e => setFormData({...formData, eagle: e.target.value})}
              required
            />
          </div>

          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <label className="flex items-center gap-2 text-sm font-bold text-purple-800 mb-2">
              <span>🚚</span> Truck (Independent)
            </label>
            <input 
              type="number" 
              className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-xl font-mono"
              placeholder="0"
              value={formData.truck}
              onChange={e => setFormData({...formData, truck: e.target.value})}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={status === 'submitting'}
          className="w-full py-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {status === 'submitting' ? (
            <span className="animate-pulse">Submitting...</span>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Vote Count
            </>
          )}
        </button>
        
        <p className="text-center text-xs text-gray-400">
          By submitting, you certify these numbers match the official signed form.
        </p>
      </form>
    </div>
  );
};

// 3. Login Component
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Simple Simulation Logic (Replace with Firebase Auth in production)
    if (email.includes('agent') && password === '1234') {
      onLogin({ 
        uid: 'user_123', 
        email: email, 
        centerId: 'center-1', 
        centerName: 'Center 01 - Joypurhat Govt College' 
      });
    } else {
      setError("Invalid credentials. Try 'agent01' / '1234'");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-green-200">
          <Vote className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Portal</h1>
        <p className="text-gray-500">Joypurhat-1 Election Monitoring</p>
      </div>

      <form onSubmit={handleLogin} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agent ID</label>
          <input 
            type="text" 
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
            placeholder="e.g. agent01"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            type="password" 
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-md shadow-green-100 transition-all">
          Login to System
        </button>
      </form>
      
      <p className="text-center text-xs text-gray-400 mt-6">
        Authorized personnel only. IP address is logged.
      </p>
    </div>
  );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'login' | 'agent'
  const [user, setUser] = useState(null);
  const [centers, setCenters] = useState(MOCK_CENTERS);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Effect to load real data if Firebase is active
  useEffect(() => {
    if (!db) return; // Skip if no firebase config

    // Real-time listener
    const unsubscribe = onSnapshot(collection(db, "centers"), (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCenters(liveData);
    });

    return () => unsubscribe();
  }, []);

  const handleMockUpdate = (centerId, newVotes) => {
    setCenters(prev => prev.map(c => 
      c.id === centerId 
        ? { ...c, votes: newVotes, isReported: true } 
        : c
    ));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">BD</span>
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none text-gray-900">Joypurhat-1</h1>
                <p className="text-xs text-gray-500 font-medium">Unofficial Count</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('dashboard')}
                className={`hidden md:block px-4 py-2 rounded-full text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Live Dashboard
              </button>
              
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="hidden md:block text-sm font-medium text-gray-700">{user.email}</span>
                  <button 
                    onClick={() => { setUser(null); setView('dashboard'); }}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setView('login')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${view === 'login' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                >
                  Agent Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' && <Dashboard centers={centers} />}
        
        {view === 'login' && (
          <Login onLogin={(u) => { setUser(u); setView('agent'); }} />
        )}
        
        {view === 'agent' && user && (
          <AgentInput 
            user={user} 
            onLogout={() => { setUser(null); setView('dashboard'); }}
            updateMockData={handleMockUpdate}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-6 text-center text-gray-400 text-sm border-t border-gray-200 mt-auto">
        <p>© 2025 Joypurhat Election Monitoring Cell.</p>
        <p className="text-xs mt-1">This is an unofficial counting tool. Data is subject to verification.</p>
      </footer>
    </div>
  );
}