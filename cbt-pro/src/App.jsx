import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Clock, LayoutDashboard, Upload, Download, 
  CheckCircle, LogOut, Plus, Trash2, ChevronRight, ChevronLeft, 
  Edit, Save, X, AlertTriangle, ShieldAlert, Flag, SaveAll
} from 'lucide-react';

// ==========================================
// 1. DATA AWAL
// ==========================================
const initialExams = [
  { id: 'exam_1', title: 'Ujian Matematika & Sejarah', duration: 15 }
];

const initialQuestions = [
  {
    id: 'q_1', examId: 'exam_1', type: 'pg', text: 'Berapakah akar-akar dari persamaan kuadrat $x^2 + 5x + 6 = 0$ ?',
    options: [
      { id: 'A', text: '-2 dan -3' }, { id: 'B', text: '2 dan 3' },
      { id: 'C', text: '1 dan 6' }, { id: 'D', text: '-1 dan -6' }
    ],
    correctAnswer: 'A'
  },
  {
    id: 'q_2', examId: 'exam_1', type: 'pg', text: 'Hitunglah hasil dari integral berikut: $$\\int_0^1 2x \\, dx$$',
    options: [
      { id: 'A', text: '0' }, { id: 'B', text: '1' },
      { id: 'C', text: '2' }, { id: 'D', text: '0.5' }
    ],
    correctAnswer: 'B'
  },
  {
    id: 'q_3', examId: 'exam_1', type: 'isian', text: 'Siapakah proklamator kemerdekaan Republik Indonesia selain Bung Hatta?',
    options: [],
    correctAnswer: 'Soekarno'
  },
  {
    id: 'q_4', examId: 'exam_1', type: 'pg', text: 'Manakah dari berikut ini yang merupakan bahasa pemrograman tingkat tinggi?',
    options: [
      { id: 'A', text: 'Assembly' }, { id: 'B', text: 'Python' },
      { id: 'C', text: 'Machine Code' }, { id: 'D', text: 'Binary' }
    ],
    correctAnswer: 'B'
  }
];

// ==========================================
// 2. KOMPONEN UTAMA
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [exams, setExams] = useState(initialExams);
  const [questions, setQuestions] = useState(initialQuestions);
  const [attempts, setAttempts] = useState([]);
  const [view, setView] = useState('login'); 
  const [activeExamId, setActiveExamId] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const loadDeps = async () => {
      if (!document.getElementById('katex-css')) {
        const css = document.createElement('link');
        css.id = 'katex-css'; css.rel = 'stylesheet';
        css.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
        document.head.appendChild(css);
      }
      const loadScript = (src, id) => new Promise((resolve) => {
        if (document.getElementById(id)) return resolve();
        const script = document.createElement('script');
        script.id = id; script.src = src;
        script.onload = resolve;
        document.head.appendChild(script);
      });
      await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js', 'katex-js');
      await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js', 'katex-auto');
      window.katexLoaded = true;
      renderMath();
    };
    loadDeps();
  }, []);

  const renderMath = () => {
    if (window.renderMathInElement && window.katexLoaded) {
      const elements = document.querySelectorAll('.math-content');
      elements.forEach(el => {
        window.renderMathInElement(el, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
          ]
        });
      });
    }
  };

  const handleLogin = (username, password) => {
    if (username === 'admin' && password === 'admin123') {
      setUser({ username, role: 'admin' });
      setView('dashboard');
    } else {
      setUser({ username, role: 'student' });
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
  };

  if (!user) return <LoginScreen onLogin={handleLogin} showNotif={showNotif} notification={notification} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative">
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl z-50 font-semibold flex items-center gap-2
          ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
          {notification.type === 'error' && <AlertTriangle className="w-5 h-5"/>}
          {notification.msg}
        </div>
      )}

      {view !== 'taking-exam' && (
        <header className="bg-blue-800 text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-blue-300" />
              <h1 className="text-xl font-bold tracking-wide">CBT Pro <span className="font-light text-blue-300">v2.0</span></h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm bg-blue-900 px-3 py-1 rounded-full">
                {user.role === 'admin' ? 'Administrator' : `Siswa: ${user.username}`}
              </span>
              <button onClick={handleLogout} className="hover:text-red-300 transition-colors" title="Keluar">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`mx-auto ${view === 'taking-exam' ? 'w-full h-screen bg-slate-100' : 'max-w-6xl p-4 py-8'}`}>
        {user.role === 'admin' && view === 'dashboard' && (
          <AdminDashboard 
            exams={exams} setExams={setExams} attempts={attempts}
            onEditExam={(id) => { setActiveExamId(id); setView('exam-editor'); }} 
            showNotif={showNotif}
          />
        )}
        {user.role === 'admin' && view === 'exam-editor' && (
          <AdminExamEditor 
            examId={activeExamId}
            examTitle={exams.find(e => e.id === activeExamId)?.title}
            questions={questions.filter(q => q.examId === activeExamId)}
            setQuestions={setQuestions}
            onBack={() => setView('dashboard')}
            renderMath={renderMath}
            showNotif={showNotif}
          />
        )}
        {user.role === 'student' && view === 'dashboard' && (
          <StudentDashboard 
            exams={exams} 
            attempts={attempts.filter(a => a.student === user.username)}
            onStartExam={(id) => { setActiveExamId(id); setView('taking-exam'); }} 
          />
        )}
        {user.role === 'student' && view === 'taking-exam' && (
          <ExamRunner 
            exam={exams.find(e => e.id === activeExamId)}
            questions={questions.filter(q => q.examId === activeExamId)}
            user={user}
            renderMath={renderMath}
            showNotif={showNotif}
            onFinish={(score, violations) => {
              const newAttempt = {
                id: 'att_' + Date.now(),
                student: user.username,
                examId: activeExamId,
                score: score,
                violations: violations,
                date: new Date().toLocaleString()
              };
              setAttempts([...attempts, newAttempt]);
              setView('dashboard');
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.log(err));
              }
              showNotif(`Ujian selesai! Nilai Anda telah disimpan.`, 'info');
            }}
          />
        )}
      </main>
    </div>
  );
}

// ==========================================
// 3. LOGIN
// ==========================================
function LoginScreen({ onLogin, showNotif, notification }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if(username.trim() === '' || password.trim() === '') {
      showNotif('Harap isi username dan password', 'error');
      return;
    }
    onLogin(username, password);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      {notification && (
        <div className="absolute top-10 bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5"/> {notification.msg}
        </div>
      )}
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-2xl text-white mb-4">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-800">CBT Pro</h2>
          <p className="text-sm text-slate-500 mt-2">Sistem Ujian Aman Berstandar Internasional</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Username / NIM</label>
            <input type="text" className="w-full border-2 border-slate-200 px-4 py-3 rounded-xl focus:border-blue-500 focus:outline-none" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <input type="password" className="w-full border-2 border-slate-200 px-4 py-3 rounded-xl focus:border-blue-500 focus:outline-none" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition">Masuk Ujian</button>
        </form>
        <div className="mt-6 p-4 bg-blue-50 rounded-xl text-xs text-blue-800 text-center">
          <b>Guru:</b> admin / admin123 <br/>
          <b>Siswa:</b> Bebas (isi apa saja)
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. ADMIN DASHBOARD
// ==========================================
function AdminDashboard({ exams, setExams, attempts, onEditExam, showNotif }) {
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDur, setNewDur] = useState(60);
  const handleCreate = () => {
    if(newTitle.trim() === '') return showNotif('Judul ujian tidak boleh kosong', 'error');
    setExams([...exams, { id: 'exam_'+Date.now(), title: newTitle, duration: parseInt(newDur) }]);
    setShowNew(false); setNewTitle(''); showNotif('Ujian baru berhasil dibuat!');
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border">
        <h2 className="text-2xl font-bold flex items-center gap-3"><LayoutDashboard className="w-7 h-7 text-blue-600"/> Dashboard Pengawas</h2>
        <button onClick={() => setShowNew(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 font-bold">+ Buat Ujian Baru</button>
      </div>
      {showNew && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-200 flex flex-wrap gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-bold mb-2">Judul Ujian</label>
            <input type="text" className="w-full border-2 px-4 py-2.5 rounded-xl" value={newTitle} onChange={e=>setNewTitle(e.target.value)} />
          </div>
          <div className="w-32">
            <label className="block text-sm font-bold mb-2">Durasi (Menit)</label>
            <input type="number" className="w-full border-2 px-4 py-2.5 rounded-xl" value={newDur} onChange={e=>setNewDur(e.target.value)} />
          </div>
          <button onClick={handleCreate} className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold">Simpan</button>
          <button onClick={() => setShowNew(false)} className="bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl font-bold">Batal</button>
        </div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map(ex => (
          <div key={ex.id} className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xl">{ex.title}</h3>
              <div className="flex items-center gap-4 mt-3">
                <p className="text-slate-500 text-sm flex items-center gap-1"><Clock className="w-4 h-4"/> {ex.duration} Menit</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t flex justify-between items-center">
              <span className="text-sm font-bold bg-green-50 text-green-700 px-3 py-1 rounded-lg">{attempts.filter(a => a.examId === ex.id).length} Selesai</span>
              <button onClick={() => onEditExam(ex.id)} className="text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white font-bold">Kelola Soal</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 5. ADMIN EXAM EDITOR (LENGKAP)
// ==========================================
function AdminExamEditor({ examId, examTitle, questions, setQuestions, onBack, renderMath, showNotif }) {
  const [editingData, setEditingData] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  useEffect(() => { renderMath(); }, [questions, editingData]);

  const downloadTemplate = () => {
    const csvContent = "Tipe(PG/ISIAN);Teks Soal;Opsi A;Opsi B;Opsi C;Opsi D;Kunci Jawaban\nPG;Apa ibukota Indonesia?;Jakarta;Bandung;Surabaya;Medan;A\nISIAN;Siapa presiden RI pertama?;;;;;Soekarno";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_soal.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      const newQs = [];
      const parseCSVLine = (t) => {
        let ret = [], keep = false, cur = '';
        for(let i=0; i<t.length; i++) {
            let c = t[i];
            if(c === '"') { keep = !keep; continue; }
            if(c === ';' && !keep) { ret.push(cur.trim()); cur = ''; continue; }
            cur += c;
        }
        ret.push(cur.trim()); return ret;
      };
      for(let i=1; i<lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if(cols.length >= 7) {
          const type = cols[0].toUpperCase() === 'ISIAN' ? 'isian' : 'pg';
          newQs.push({
            id: 'q_' + Date.now() + '_' + i, examId: examId, type: type, text: cols[1],
            options: type === 'pg' ? [ { id: 'A', text: cols[2] }, { id: 'B', text: cols[3] }, { id: 'C', text: cols[4] }, { id: 'D', text: cols[5] } ] : [],
            correctAnswer: type === 'pg' ? cols[6].toUpperCase() : cols[6]
          });
        }
      }
      setQuestions(prev => [...prev, ...newQs]);
      showNotif(`${newQs.length} Soal diimpor!`);
    };
    reader.readAsText(file); e.target.value = '';
  };

  const handleAddNew = () => {
    setEditingData({
      id: 'q_new_' + Date.now(),
      examId: examId,
      type: 'pg',
      text: '',
      options: [
        { id: 'A', text: '' }, { id: 'B', text: '' },
        { id: 'C', text: '' }, { id: 'D', text: '' }
      ],
      correctAnswer: 'A',
      isNew: true
    });
  };

  const handleEditOpen = (q) => {
    setEditingData({ ...q, isNew: false });
  };

  const handleSaveQuestion = () => {
    if(editingData.text.trim() === '') {
      showNotif('Teks soal tidak boleh kosong', 'error'); return;
    }
    const preparedData = {
      id: editingData.id,
      examId: examId,
      type: editingData.type,
      text: editingData.text,
      options: editingData.type === 'pg' ? editingData.options : [],
      correctAnswer: editingData.correctAnswer
    };
    if(editingData.isNew) {
      setQuestions(prev => [...prev, preparedData]);
      showNotif('Soal baru ditambahkan');
    } else {
      setQuestions(prev => prev.map(q => q.id === editingData.id ? preparedData : q));
      showNotif('Perubahan disimpan');
    }
    setEditingData(null);
  };

  const handleDelete = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    setShowConfirmDelete(null);
    showNotif('Soal dihapus');
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-blue-600 hover:underline font-bold flex items-center gap-1 mb-2"><ChevronLeft className="w-4 h-4"/> Kembali</button>
      <div className="bg-white p-5 rounded-2xl border shadow-sm mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Kelola Soal: {examTitle}</h2>
          <p className="text-sm text-slate-500">Total Soal: {questions.length}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAddNew} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">+ Tambah Manual</button>
          <button onClick={downloadTemplate} className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2 border"><Download className="w-4 h-4"/> Template CSV</button>
          <label className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 cursor-pointer"><Upload className="w-4 h-4"/> Upload CSV<input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} /></label>
        </div>
      </div>

      {editingData && (
        <div className="bg-white p-5 rounded-xl border-2 border-blue-400 shadow-lg mb-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="font-bold text-lg">{editingData.isNew ? 'Tambah Soal Baru' : 'Edit Soal'}</h3>
            <button onClick={() => setEditingData(null)} className="text-slate-500 hover:text-red-500"><X className="w-5 h-5"/></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipe Soal</label>
              <select className="w-full border p-2 rounded" value={editingData.type} onChange={(e) => setEditingData({...editingData, type: e.target.value})}>
                <option value="pg">Pilihan Ganda</option>
                <option value="isian">Isian Singkat</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teks Soal (Bisa pakai $$rumus$$)</label>
              <textarea rows="3" className="w-full border p-2 rounded font-mono text-sm" value={editingData.text} onChange={(e) => setEditingData({...editingData, text: e.target.value})} />
            </div>
            {editingData.type === 'pg' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                {editingData.options.map((opt, i) => (
                  <div key={opt.id}>
                    <label className="block text-sm font-medium mb-1">Opsi {opt.id}</label>
                    <input type="text" className="w-full border p-2 rounded text-sm" value={opt.text} onChange={(e) => {
                      const newOpts = [...editingData.options];
                      newOpts[i].text = e.target.value;
                      setEditingData({...editingData, options: newOpts});
                    }} />
                  </div>
                ))}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Kunci Jawaban</label>
              {editingData.type === 'pg' ? (
                <select className="border p-2 rounded w-48" value={editingData.correctAnswer} onChange={(e) => setEditingData({...editingData, correctAnswer: e.target.value})}>
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                </select>
              ) : (
                <input type="text" className="w-full border p-2 rounded" value={editingData.correctAnswer} onChange={(e) => setEditingData({...editingData, correctAnswer: e.target.value})} />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => setEditingData(null)} className="px-4 py-2 bg-slate-200 rounded">Batal</button>
              <button onClick={handleSaveQuestion} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"><Save className="w-4 h-4"/> Simpan</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {questions.length === 0 && !editingData && <div className="text-center py-10 text-slate-500 bg-white rounded-xl border-dashed border">Belum ada soal. Klik Tambah Manual atau Upload CSV.</div>}
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-4 rounded-xl border shadow-sm relative group">
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => handleEditOpen(q)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Edit className="w-4 h-4"/></button>
              <button onClick={() => setShowConfirmDelete(q.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button>
            </div>
            {showConfirmDelete === q.id && (
              <div className="absolute top-0 left-0 w-full h-full bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl border border-red-200">
                <p className="font-bold text-red-600 mb-3">Yakin hapus soal ini?</p>
                <div className="flex gap-3">
                  <button onClick={() => handleDelete(q.id)} className="bg-red-600 text-white px-4 py-1.5 rounded">Hapus</button>
                  <button onClick={() => setShowConfirmDelete(null)} className="bg-slate-200 px-4 py-1.5 rounded">Batal</button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-2 pr-16">
              <div className="font-bold">Soal {idx + 1}</div>
              <span className={`text-xs px-2 py-0.5 rounded ${q.type === 'isian' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{q.type === 'isian' ? 'Isian' : 'PG'}</span>
            </div>
            <div className="math-content mb-3 text-lg" dangerouslySetInnerHTML={{__html: q.text}}></div>
            {q.type === 'pg' ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {q.options.map(opt => (
                  <div key={opt.id} className={`p-2 rounded border ${q.correctAnswer === opt.id ? 'bg-green-100 border-green-500 font-semibold' : 'bg-slate-50'}`}>
                    {opt.id}. <span className="math-content" dangerouslySetInnerHTML={{__html: opt.text}}></span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm font-semibold text-green-800">Kunci: {q.correctAnswer}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 6. DASHBOARD SISWA
// ==========================================
function StudentDashboard({ exams, attempts, onStartExam }) {
  const handleStartExamWithFullscreen = (examId) => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => console.warn(err.message));
    }
    onStartExam(examId);
  };
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8">
        <h2 className="text-2xl font-black text-slate-800 mb-2">Selamat Datang!</h2>
        <p className="text-slate-600">Silakan pilih ujian di bawah ini.</p>
        <div className="mt-4 p-4 bg-amber-50 border rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
          <div className="text-sm text-amber-800"><strong>Peraturan:</strong> Dilarang pindah tab, copy-paste, klik kanan. Pelanggaran 3x = ujian dihentikan.</div>
        </div>
      </div>
      <h3 className="text-xl font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600"/> Daftar Ujian</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {exams.map(ex => {
          const pastAttempt = attempts.find(a => a.examId === ex.id);
          return (
            <div key={ex.id} className="bg-white p-6 rounded-2xl border shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{ex.title}</h3>
                <p className="text-slate-500 text-sm flex items-center gap-1 mt-1"><Clock className="w-4 h-4"/> {ex.duration} Menit</p>
              </div>
              <div>
                {pastAttempt ? (
                  <div className="text-center bg-slate-50 px-4 py-2 rounded-xl border">
                    <div className="text-xs text-slate-500">Nilai Akhir</div>
                    <div className="text-3xl font-black text-green-600">{pastAttempt.score}</div>
                  </div>
                ) : (
                  <button onClick={() => handleStartExamWithFullscreen(ex.id)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700">Mulai Ujian</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 7. ENGINE UJIAN (DIPERBAIKI)
// ==========================================
function ExamRunner({ exam, questions, user, renderMath, onFinish, showNotif }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  // 👇 TAMBAHKAN INI (untuk memuat jawaban yang tersimpan)
useEffect(() => {
  const savedAnswers = localStorage.getItem(`answers_${user.username}_${exam.id}`);
  if (savedAnswers) {
    setAnswers(JSON.parse(savedAnswers));
  }
}, []);
  const [doubtful, setDoubtful] = useState({});
  const [timeLeft, setTimeLeft] = useState(exam ? exam.duration * 60 : 0);
  const [examResult, setExamResult] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const MAX_WARNINGS = 3;

  useEffect(() => { renderMath(); }, [currentIndex, questions]);

  // Timer
  useEffect(() => {
    if (examResult !== null) return;
    if (timeLeft <= 0) { calculateScore(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, examResult]);

  // Anti-cheat: visibility change
  useEffect(() => {
    if (examResult !== null) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_WARNINGS) {
            calculateScore(true);
          } else {
            setShowWarningModal(true);
          }
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [examResult]);

  const preventCheatingEvents = (e) => {
    e.preventDefault();
    showNotif("Tindakan tidak diizinkan selama ujian.", "error");
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (qId, val) => {
    setIsSaving(true);
    setAnswers(prev => ({ ...prev, [qId]: val }));
    // Di dalam handleAnswer, setelah setAnswers, tambahkan:
localStorage.setItem(`answers_${user.username}_${exam.id}`, JSON.stringify({ ...answers, [qId]: val }));
    if (doubtful[qId]) handleToggleDoubt(qId);
    setTimeout(() => setIsSaving(false), 600);
  };

  const handleToggleDoubt = (qId) => {
    setDoubtful(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach(q => {
      const studentAns = answers[q.id] || '';
      if (q.type === 'isian') {
        if (studentAns.toString().trim().toLowerCase() === q.correctAnswer.toString().trim().toLowerCase()) correctCount++;
      } else {
        if (studentAns === q.correctAnswer) correctCount++;
      }
    });
    const finalScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    setExamResult(finalScore);
    setShowSubmitModal(false);
    onFinish(finalScore, warnings);
  };

  const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k].trim() !== '').length;
  const doubtfulCount = Object.keys(doubtful).filter(k => doubtful[k]).length;
  const unansweredCount = questions.length - answeredCount;

  if (!exam || !questions || questions.length === 0) {
    return <div className="text-center p-10 bg-white rounded-xl mt-10">Ujian tidak valid atau soal belum tersedia.</div>;
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return <div className="text-center p-10">Soal tidak ditemukan.</div>;

  const currentAnswer = answers[currentQ.id] || '';
  const isCurrentDoubtful = doubtful[currentQ.id] || false;

  return (
    <div 
      className="flex flex-col md:flex-row gap-6 h-full p-4 md:p-6"
      onCopy={preventCheatingEvents}
      onCut={preventCheatingEvents}
      onPaste={preventCheatingEvents}
      onContextMenu={preventCheatingEvents}
      style={{ userSelect: 'none' }}
    >
      {showWarningModal && (
        <div className="fixed inset-0 bg-red-900/90 backdrop-blur-md flex items-center justify-center z-[100] px-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border-4 border-red-500">
            <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h3 className="text-3xl font-black text-slate-800 mb-2">PELANGGARAN TERDETEKSI</h3>
            <p className="text-slate-600 text-lg mb-2">Anda terdeteksi meninggalkan halaman ujian.</p>
            <div className="bg-red-50 text-red-800 font-bold py-3 px-4 rounded-xl border border-red-200 mb-6">Peringatan ke {warnings} dari {MAX_WARNINGS}</div>
            <button onClick={() => setShowWarningModal(false)} className="w-full bg-red-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-red-700">KEMBALI KE UJIAN</button>
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full">
            <h3 className="text-2xl font-black text-slate-800 mb-1">Akhiri Ujian?</h3>
            <p className="text-slate-500 text-sm mb-6">Ringkasan pengerjaan Anda:</p>
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-green-50 border p-3 rounded-xl text-center"><div className="text-2xl font-black text-green-600">{answeredCount}</div><div className="text-xs font-bold">Terjawab</div></div>
              <div className="bg-amber-50 border p-3 rounded-xl text-center"><div className="text-2xl font-black text-amber-600">{doubtfulCount}</div><div className="text-xs font-bold">Ragu</div></div>
              <div className="bg-slate-100 border p-3 rounded-xl text-center"><div className="text-2xl font-black text-slate-600">{unansweredCount}</div><div className="text-xs font-bold">Kosong</div></div>
            </div>
            {unansweredCount > 0 && <div className="flex gap-2 items-start bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-6"><AlertTriangle className="w-5 h-5"/> Masih ada {unansweredCount} soal belum dijawab.</div>}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowSubmitModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Lanjutkan</button>
              <button onClick={calculateScore} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Ya, Akhiri</button>
            </div>
          </div>
        </div>
      )}

      {/* Area Soal */}
      <div className="flex-1 bg-white rounded-2xl shadow-lg border overflow-hidden flex flex-col h-[calc(100vh-3rem)]">
        <div className="bg-slate-50 border-b p-4 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black">{currentIndex + 1}</div>
            <div className="hidden md:block text-slate-600 font-medium">dari {questions.length} Soal</div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-xs font-bold flex items-center gap-1 transition-opacity ${isSaving ? 'opacity-100' : 'opacity-0'}`}><SaveAll className="w-4 h-4 animate-pulse"/> Menyimpan...</div>
            <div className={`font-mono text-xl font-black px-4 py-1.5 rounded-xl flex items-center gap-2 border shadow-sm ${timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white'}`}><Clock className="w-5 h-5"/> {formatTime(timeLeft)}</div>
          </div>
        </div>
        <div className="p-6 md:p-10 flex-1 overflow-y-auto">
          <div className="math-content text-xl text-slate-800 mb-8 leading-relaxed" dangerouslySetInnerHTML={{__html: currentQ.text}}></div>
          {currentQ.type === 'pg' ? (
            <div className="space-y-4">
              {currentQ.options.map(opt => {
                const isSelected = currentAnswer === opt.id;
                return (
                  <div key={opt.id} onClick={() => handleAnswer(currentQ.id, opt.id)} className={`p-5 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-300'}`}><span className="font-bold">{opt.id}</span></div>
                    <div className="math-content text-lg" dangerouslySetInnerHTML={{__html: opt.text}}></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 bg-slate-50 p-6 rounded-2xl border">
              <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Edit className="w-4 h-4"/> Jawaban Anda:</label>
              <textarea rows="4" className="w-full border-2 rounded-xl p-5 text-xl" placeholder="Ketik jawaban..." value={currentAnswer} onChange={(e) => handleAnswer(currentQ.id, e.target.value)} />
            </div>
          )}
        </div>
        <div className="bg-white border-t p-4 px-6 flex justify-between items-center shrink-0">
          <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} className="px-5 py-3 bg-slate-100 font-bold rounded-xl disabled:opacity-40 flex items-center gap-2"><ChevronLeft className="w-5 h-5"/> Sebelumnya</button>
          <button onClick={() => handleToggleDoubt(currentQ.id)} className={`px-5 py-3 font-bold rounded-xl flex items-center gap-2 border-2 ${isCurrentDoubtful ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-slate-500 border-slate-200'}`}><Flag className="w-5 h-5"/> Ragu</button>
          {currentIndex === questions.length - 1 ? (
            <button onClick={() => setShowSubmitModal(true)} className="px-6 py-3 bg-green-600 text-white font-black rounded-xl shadow-lg flex items-center gap-2"><CheckCircle className="w-5 h-5"/> Selesai</button>
          ) : (
            <button onClick={() => setCurrentIndex(prev => prev + 1)} className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg flex items-center gap-2">Selanjutnya <ChevronRight className="w-5 h-5"/></button>
          )}
        </div>
      </div>

      {/* Navigasi Grid */}
      <div className="w-full md:w-80 shrink-0 flex flex-col gap-4">
        <div className="bg-white rounded-2xl shadow-sm border p-5"><div className="flex items-start gap-3"><div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">{user.username.substring(0,2).toUpperCase()}</div><div><div className="font-bold">{user.username}</div><div className="text-xs font-semibold text-slate-500">{exam.title}</div></div></div></div>
        <div className="bg-white rounded-2xl shadow-sm border p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-slate-700 mb-4 pb-3 border-b flex justify-between items-center">Peta Soal <span className="text-xs bg-slate-100 px-2 py-1 rounded-lg">{answeredCount}/{questions.length} Terjawab</span></h3>
          <div className="grid grid-cols-5 gap-2 md:gap-3 mb-6">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id] && answers[q.id].trim() !== '';
              const isFlagged = doubtful[q.id];
              const isActive = idx === currentIndex;
              let btnClass = 'bg-slate-100 text-slate-500 border border-slate-200';
              if (isFlagged) btnClass = 'bg-amber-400 text-amber-900 border border-amber-500 font-bold';
              else if (isAnswered) btnClass = 'bg-green-500 text-white border border-green-600 font-bold';
              if (isActive) btnClass += ' ring-4 ring-blue-500/30 scale-110 z-10 relative';
              return <button key={q.id} onClick={() => setCurrentIndex(idx)} className={`aspect-square rounded-xl flex items-center justify-center text-sm transition-all ${btnClass}`}>{idx + 1}</button>;
            })}
          </div>
          <div className="mt-auto space-y-2 text-xs font-bold text-slate-600 bg-slate-50 p-4 rounded-xl border">
            <div className="flex items-center gap-3"><div className="w-4 h-4 bg-green-500 rounded-md"></div> Sudah Dijawab</div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 bg-amber-400 rounded-md"></div> Ragu-ragu</div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 bg-slate-100 rounded-md border"></div> Belum Dijawab</div>
            <div className="flex items-center gap-3"><div className="w-4 h-4 bg-white border ring-2 ring-blue-400 rounded-md"></div> Posisi Saat Ini</div>
          </div>
        </div>
      </div>
    </div>
  );
}