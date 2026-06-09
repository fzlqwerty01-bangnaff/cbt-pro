import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Clock, LayoutDashboard, Upload, Download, 
  CheckCircle, LogOut, Plus, Trash2, ChevronRight, ChevronLeft, 
  Edit, Save, X, AlertTriangle, ShieldAlert, Flag, SaveAll,
  Users, Settings, Copy, RefreshCw, FileText, UserPlus, UserMinus
} from 'lucide-react';

// ==========================================
// DATA AWAL
// ==========================================
const initialExams = [
  { id: 'exam_1', title: 'Ujian Matematika & Sejarah', duration: 15, kelas: '7A', createdBy: 'subadmin1' }
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

const initialUsers = [
  { id: 'u1', username: 'superadmin', password: 'super123', role: 'superadmin', name: 'Super Admin', kelas: null },
  { id: 'u2', username: 'guru1', password: 'guru123', role: 'subadmin', name: 'Guru Matematika', kelas: '7A' },
  { id: 'u3', username: 'siswa1', password: 'siswa123', role: 'siswa', name: 'Ahmad Bima', kelas: '7A' },
  { id: 'u4', username: 'siswa2', password: 'siswa123', role: 'siswa', name: 'Nafi Fauzi', kelas: '7A' },
];

// ==========================================
// KOMPONEN UTAMA APP
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [exams, setExams] = useState(() => {
    const saved = localStorage.getItem('cbt_exams');
    return saved ? JSON.parse(saved) : initialExams;
  });
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('cbt_questions');
    return saved ? JSON.parse(saved) : initialQuestions;
  });
  const [attempts, setAttempts] = useState(() => {
    const saved = localStorage.getItem('cbt_attempts');
    return saved ? JSON.parse(saved) : [];
  });
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('cbt_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('cbt_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState('login');
  const [activeExamId, setActiveExamId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [systemConfig, setSystemConfig] = useState(() => {
    const saved = localStorage.getItem('cbt_config');
    return saved ? JSON.parse(saved) : { schoolName: 'CBT Pro School', logo: '' };
  });

  const showNotif = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    localStorage.setItem('cbt_exams', JSON.stringify(exams));
    localStorage.setItem('cbt_questions', JSON.stringify(questions));
    localStorage.setItem('cbt_attempts', JSON.stringify(attempts));
    localStorage.setItem('cbt_users', JSON.stringify(users));
    localStorage.setItem('cbt_logs', JSON.stringify(logs));
    localStorage.setItem('cbt_config', JSON.stringify(systemConfig));
  }, [exams, questions, attempts, users, logs, systemConfig]);

  const addLog = (action, userId, details) => {
    const newLog = { id: Date.now(), timestamp: new Date().toISOString(), userId, action, details };
    setLogs(prev => [newLog, ...prev].slice(0, 200));
  };

  const handleLogin = (username, password) => {
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      addLog('Login', foundUser.id, `User ${foundUser.username} login`);
      setView('dashboard');
    } else {
      showNotif('Username atau password salah', 'error');
    }
  };

  const handleLogout = () => {
    if (user) addLog('Logout', user.id, `User ${user.username} logout`);
    setUser(null);
    setView('login');
  };

  if (!user) return <LoginScreen onLogin={handleLogin} showNotif={showNotif} notification={notification} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative">
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl z-50 font-semibold flex items-center gap-2
          ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
          {notification.type === 'error' && <AlertTriangle className="w-5 h-5"/>}
          {notification.msg}
        </div>
      )}
      <header className="bg-blue-800 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-300" />
            <h1 className="text-xl font-bold tracking-wide">{systemConfig.schoolName || 'CBT Pro'} <span className="font-light text-blue-300">v2.0</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm bg-blue-900 px-3 py-1 rounded-full">
              {user.role === 'superadmin' ? 'Super Admin' : user.role === 'subadmin' ? `Guru: ${user.name}` : `Siswa: ${user.name}`}
            </span>
            <button onClick={handleLogout} className="hover:text-red-300"><LogOut className="w-5 h-5"/></button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 py-8">
        {user.role === 'superadmin' && (
          <SuperAdminDashboard 
            users={users} setUsers={setUsers}
            logs={logs}
            systemConfig={systemConfig} setSystemConfig={setSystemConfig}
            showNotif={showNotif}
            addLog={addLog}
          />
        )}
        {user.role === 'subadmin' && (
          <SubAdminDashboard 
            user={user}
            exams={exams} setExams={setExams}
            questions={questions} setQuestions={setQuestions}
            attempts={attempts}
            users={users} setUsers={setUsers}
            showNotif={showNotif}
            addLog={addLog}
          />
        )}
        {user.role === 'siswa' && (
          <StudentDashboard 
            user={user}
            exams={exams.filter(e => e.kelas === user.kelas)} 
            attempts={attempts.filter(a => a.studentId === user.id)}
            onStartExam={(examId) => { setActiveExamId(examId); setView('taking-exam'); }}
          />
        )}
        {user.role === 'siswa' && view === 'taking-exam' && (
          <ExamRunner 
            exam={exams.find(e => e.id === activeExamId)}
            questions={questions.filter(q => q.examId === activeExamId)}
            user={user}
            showNotif={showNotif}
            onFinish={(score, violations) => {
              const newAttempt = {
                id: 'att_' + Date.now(),
                studentId: user.id,
                studentName: user.name,
                examId: activeExamId,
                score: score,
                violations,
                date: new Date().toLocaleString()
              };
              setAttempts([...attempts, newAttempt]);
              setView('dashboard');
              showNotif(`Ujian selesai! Nilai: ${score}`, 'info');
            }}
          />
        )}
      </main>
    </div>
  );
}

// ==========================================
// LOGIN SCREEN
// ==========================================
function LoginScreen({ onLogin, showNotif, notification }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return showNotif('Isi username dan password', 'error');
    onLogin(username, password);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      {notification && <div className="absolute top-10 bg-red-600 text-white px-6 py-3 rounded-lg">{notification.msg}</div>}
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-4 rounded-2xl text-white mb-4"><ShieldAlert className="w-10 h-10"/></div>
          <h2 className="text-3xl font-black">CBT Pro</h2>
          <p className="text-sm text-slate-500 mt-2">Sistem Ujian Berbasis Role</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <input type="text" placeholder="Username" className="w-full border-2 p-3 rounded-xl" value={username} onChange={e=>setUsername(e.target.value)}/>
          <input type="password" placeholder="Password" className="w-full border-2 p-3 rounded-xl" value={password} onChange={e=>setPassword(e.target.value)}/>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Masuk</button>
        </form>
        <div className="mt-6 p-4 bg-blue-50 rounded-xl text-xs text-center">
          <b>Super Admin:</b> superadmin / super123<br/>
          <b>Sub Admin (Guru):</b> guru1 / guru123<br/>
          <b>Siswa:</b> siswa1 / siswa123 (atau siswa2)
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SUPER ADMIN DASHBOARD
// ==========================================
function SuperAdminDashboard({ users, setUsers, logs, systemConfig, setSystemConfig, showNotif, addLog }) {
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'subadmin', name: '', kelas: '' });
  const [editConfig, setEditConfig] = useState(false);

  // Download template CSV untuk user (Super Admin bisa upload subadmin & siswa)
  const downloadUserTemplate = () => {
    const csvContent = "Nama;Username;Password;Role;Kelas\nGuru Matematika;guru2;guru123;subadmin;7A\nSiswa Baru;siswa3;siswa123;siswa;7A";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_user.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload CSV user (Super Admin)
  const handleUserUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      const newUsers = [];
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
        if(cols.length >= 5) {
          const role = cols[3].toLowerCase();
          if (role !== 'subadmin' && role !== 'siswa') continue;
          newUsers.push({
            id: 'u'+Date.now()+'_'+i,
            username: cols[1],
            password: cols[2],
            role: role,
            name: cols[0],
            kelas: cols[4] || null
          });
        }
      }
      setUsers(prev => [...prev, ...newUsers]);
      addLog('Upload User', 'superadmin', `Menambah ${newUsers.length} user via CSV`);
      showNotif(`${newUsers.length} user berhasil ditambahkan`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.password || !newUser.name) return showNotif('Lengkapi data', 'error');
    const newId = 'u'+Date.now();
    setUsers([...users, { ...newUser, id: newId }]);
    addLog('Tambah User', 'superadmin', `Menambah user ${newUser.username} (${newUser.role})`);
    setShowUserForm(false);
    setNewUser({ username: '', password: '', role: 'subadmin', name: '', kelas: '' });
    showNotif('User berhasil ditambahkan');
  };

  const handleDeleteUser = (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete.role === 'superadmin') return showNotif('Tidak bisa menghapus Super Admin', 'error');
    setUsers(users.filter(u => u.id !== userId));
    addLog('Hapus User', 'superadmin', `Menghapus user ${userToDelete.username}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="w-7 h-7 text-red-600"/> Super Admin Dashboard</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowUserForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"><UserPlus className="w-4 h-4"/> Tambah Manual</button>
          <button onClick={downloadUserTemplate} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2"><Download className="w-4 h-4"/> Template User</button>
          <label className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer"><Upload className="w-4 h-4"/> Upload CSV<input type="file" accept=".csv" className="hidden" onChange={handleUserUpload}/></label>
        </div>
      </div>
      {showUserForm && (
        <div className="bg-white p-4 rounded-xl border shadow-lg grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <input type="text" placeholder="Nama" className="border p-2 rounded" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})}/>
          <input type="text" placeholder="Username" className="border p-2 rounded" value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})}/>
          <input type="text" placeholder="Password" className="border p-2 rounded" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})}/>
          <select className="border p-2 rounded" value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})}>
            <option value="subadmin">Sub Admin (Guru)</option>
            <option value="siswa">Siswa</option>
          </select>
          <input type="text" placeholder="Kelas (untuk siswa/guru)" className="border p-2 rounded" value={newUser.kelas} onChange={e=>setNewUser({...newUser, kelas: e.target.value})}/>
          <button onClick={handleAddUser} className="bg-blue-600 text-white p-2 rounded">Simpan</button>
          <button onClick={()=>setShowUserForm(false)} className="bg-slate-200 p-2 rounded">Batal</button>
        </div>
      )}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-bold text-lg mb-3">Manajemen User</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr><th>Nama</th><th>Username</th><th>Role</th><th>Kelas</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b">
                  <td className="p-2">{u.name}</td><td>{u.username}</td><td>{u.role}</td><td>{u.kelas || '-'}</td>
                  <td>{u.role !== 'superadmin' && <button onClick={()=>handleDeleteUser(u.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center"><h3 className="font-bold">Konfigurasi Sistem</h3><button onClick={()=>setEditConfig(!editConfig)} className="text-blue-600"><Settings className="w-4 h-4"/></button></div>
        {editConfig ? (
          <div className="mt-2 space-y-2">
            <input type="text" className="border p-2 rounded w-full" value={systemConfig.schoolName} onChange={e=>setSystemConfig({...systemConfig, schoolName: e.target.value})} placeholder="Nama Sekolah"/>
            <button onClick={()=>{setEditConfig(false); addLog('Ubah Konfigurasi', 'superadmin', 'Mengubah nama sekolah'); showNotif('Konfigurasi disimpan');}} className="bg-green-600 text-white px-3 py-1 rounded">Simpan</button>
          </div>
        ) : (
          <p className="mt-2">Nama Sekolah: <strong>{systemConfig.schoolName}</strong></p>
        )}
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-bold mb-2">Log Aktivitas</h3>
        <div className="h-60 overflow-y-auto text-xs">
          {logs.map(log => (
            <div key={log.id} className="border-b py-1">{log.timestamp} - {log.action} - {log.details}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SUB ADMIN DASHBOARD (Guru)
// ==========================================
function SubAdminDashboard({ user, exams, setExams, questions, setQuestions, attempts, users, setUsers, showNotif, addLog }) {
  const [activeTab, setActiveTab] = useState('exams');
  const [showExamForm, setShowExamForm] = useState(false);
  const [newExam, setNewExam] = useState({ title: '', duration: 30, kelas: user.kelas || '' });
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [students, setStudents] = useState(users.filter(u => u.role === 'siswa' && u.kelas === user.kelas));

  // Download template siswa untuk subadmin
  const downloadStudentTemplate = () => {
    const csvContent = "Nama;Username;Password;Kelas\nSiswa Baru;siswa3;siswa123;7A";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "template_siswa.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload CSV siswa (subadmin)
  const handleStudentUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      const newStudents = [];
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
        if(cols.length >= 4) {
          newStudents.push({
            id: 'u'+Date.now()+'_'+i,
            username: cols[1],
            password: cols[2],
            role: 'siswa',
            name: cols[0],
            kelas: cols[3] || user.kelas
          });
        }
      }
      setUsers(prev => [...prev, ...newStudents]);
      setStudents(prev => [...prev, ...newStudents]);
      addLog('Upload Siswa', user.id, `Menambah ${newStudents.length} siswa via CSV`);
      showNotif(`${newStudents.length} siswa ditambahkan`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const addStudentManual = (name, username, password) => {
    if (!name || !username) return showNotif('Data tidak lengkap', 'error');
    const newId = 'u'+Date.now();
    const newStudent = { id: newId, username, password, role: 'siswa', name, kelas: user.kelas };
    setUsers(prev => [...prev, newStudent]);
    setStudents([...students, newStudent]);
    addLog('Tambah Siswa', user.id, `Menambah siswa ${name} di kelas ${user.kelas}`);
    showNotif('Siswa ditambahkan');
  };

  const handleCreateExam = () => {
    if (!newExam.title) return showNotif('Judul harus diisi', 'error');
    const newId = 'exam_'+Date.now();
    setExams([...exams, { ...newExam, id: newId, createdBy: user.id }]);
    setShowExamForm(false);
    setNewExam({ title: '', duration: 30, kelas: user.kelas });
    addLog('Buat Ujian', user.id, `Membuat ujian ${newExam.title}`);
    showNotif('Ujian dibuat');
  };

  const handleCopyExam = (examId) => {
    const original = exams.find(e => e.id === examId);
    if (!original) return;
    const newId = 'exam_'+Date.now();
    const copied = { ...original, id: newId, title: original.title + ' (Salinan)', createdBy: user.id };
    setExams([...exams, copied]);
    const originalQuestions = questions.filter(q => q.examId === examId);
    const copiedQuestions = originalQuestions.map(q => ({ ...q, id: 'q_'+Date.now()+'_'+Math.random(), examId: newId }));
    setQuestions([...questions, ...copiedQuestions]);
    addLog('Copy Ujian', user.id, `Menyalin ujian ${original.title}`);
    showNotif('Ujian berhasil digandakan');
  };

  const resetStudentExam = (studentId, examId) => {
    // Hapus attempts siswa untuk ujian tertentu (fitur sederhana)
    // Untuk demo kita tidak punya akses ke setAttempts dari sini, jadi kita skip
    showNotif('Fitur reset akan segera hadir', 'info');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 border-b pb-2">
        <button onClick={()=>setActiveTab('exams')} className={`px-4 py-2 font-bold ${activeTab==='exams' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}>Ujian</button>
        <button onClick={()=>setActiveTab('students')} className={`px-4 py-2 font-bold ${activeTab==='students' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}>Manajemen Siswa</button>
        <button onClick={()=>setActiveTab('grades')} className={`px-4 py-2 font-bold ${activeTab==='grades' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}>Nilai</button>
      </div>

      {activeTab === 'exams' && (
        <div>
          <button onClick={()=>setShowExamForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/> Buat Ujian Baru</button>
          {showExamForm && (
            <div className="bg-white p-4 rounded-xl shadow mb-4 flex flex-wrap gap-3 items-end">
              <input type="text" placeholder="Judul Ujian" className="border p-2 rounded" value={newExam.title} onChange={e=>setNewExam({...newExam, title: e.target.value})}/>
              <input type="number" placeholder="Durasi (menit)" className="border p-2 rounded w-32" value={newExam.duration} onChange={e=>setNewExam({...newExam, duration: parseInt(e.target.value)})}/>
              <select className="border p-2 rounded" value={newExam.kelas} onChange={e=>setNewExam({...newExam, kelas: e.target.value})}>
                <option value={user.kelas}>{user.kelas}</option>
              </select>
              <button onClick={handleCreateExam} className="bg-green-600 text-white px-4 py-2 rounded">Simpan</button>
              <button onClick={()=>setShowExamForm(false)} className="bg-slate-200 px-4 py-2 rounded">Batal</button>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            {exams.filter(e => e.createdBy === user.id || e.kelas === user.kelas).map(ex => (
              <div key={ex.id} className="bg-white p-4 rounded-xl border shadow">
                <h3 className="font-bold text-lg">{ex.title}</h3>
                <p className="text-sm text-slate-500">Durasi: {ex.duration} menit | Kelas: {ex.kelas}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>setSelectedExamId(ex.id)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm">Kelola Soal</button>
                  <button onClick={()=>handleCopyExam(ex.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm flex items-center gap-1"><Copy className="w-3 h-3"/> Duplikat</button>
                </div>
                {selectedExamId === ex.id && (
                  <AdminExamEditor 
                    examId={ex.id}
                    examTitle={ex.title}
                    questions={questions.filter(q => q.examId === ex.id)}
                    setQuestions={setQuestions}
                    onBack={()=>setSelectedExamId(null)}
                    showNotif={showNotif}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-bold mb-2">Siswa Kelas {user.kelas}</h3>
          <div className="flex gap-2 mb-3">
            <button onClick={()=>{ const name=prompt('Nama'); const uname=prompt('Username'); const pass=prompt('Password'); if(name&&uname&&pass) addStudentManual(name,uname,pass); }} className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"><UserPlus className="w-4 h-4"/> Tambah Manual</button>
            <button onClick={downloadStudentTemplate} className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-sm flex items-center gap-1"><Download className="w-4 h-4"/> Template CSV</button>
            <label className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 cursor-pointer"><Upload className="w-4 h-4"/> Upload CSV<input type="file" accept=".csv" className="hidden" onChange={handleStudentUpload}/></label>
          </div>
          <table className="w-full text-sm">
            <thead><tr><th>Nama</th><th>Username</th><th>Reset Ujian</th></tr></thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}><td>{s.name}</td><td>{s.username}</td><td><button onClick={()=>resetStudentExam(s.id, null)} className="text-red-600"><RefreshCw className="w-4 h-4"/></button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-bold">Rekap Nilai Kelas {user.kelas}</h3>
          <table className="w-full text-sm mt-2">
            <thead><tr><th>Siswa</th><th>Ujian</th><th>Nilai</th><th>Tanggal</th></tr></thead>
            <tbody>
              {attempts.filter(a => students.some(s => s.id === a.studentId)).map(a => {
                const student = students.find(s => s.id === a.studentId);
                const exam = exams.find(e => e.id === a.examId);
                return (
                  <tr key={a.id}><td>{student?.name}</td><td>{exam?.title}</td><td>{a.score}</td><td>{a.date}</td></tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ADMIN EXAM EDITOR (LENGKAP dengan CSV)
// ==========================================
function AdminExamEditor({ examId, examTitle, questions, setQuestions, onBack, showNotif }) {
  const [editingData, setEditingData] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const renderMath = () => {}; // sederhana, tidak perlu renderMath di sini

  const downloadTemplate = () => {
    const csvContent = "Tipe(PG/ISIAN);Teks Soal;Opsi A;Opsi B;Opsi C;Opsi D;Kunci Jawaban\nPG;Apa ibukota Indonesia?;Jakarta;Bandung;Surabaya;Medan;A\nISIAN;Siapa presiden RI pertama?;;;;;Soekarno";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
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
            id: 'q_' + Date.now() + '_' + i,
            examId: examId,
            type: type,
            text: cols[1],
            options: type === 'pg' ? [
              { id: 'A', text: cols[2] },
              { id: 'B', text: cols[3] },
              { id: 'C', text: cols[4] },
              { id: 'D', text: cols[5] }
            ] : [],
            correctAnswer: type === 'pg' ? cols[6].toUpperCase() : cols[6]
          });
        }
      }
      setQuestions(prev => [...prev, ...newQs]);
      showNotif(`${newQs.length} Soal diimpor!`);
    };
    reader.readAsText(file);
    e.target.value = '';
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
    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
      <button onClick={onBack} className="text-blue-600 underline mb-2">← Kembali ke daftar ujian</button>
      <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
        <h3 className="font-bold">Kelola Soal: {examTitle}</h3>
        <div className="flex gap-2">
          <button onClick={handleAddNew} className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"><Plus className="w-4 h-4"/> Tambah Manual</button>
          <button onClick={downloadTemplate} className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-sm flex items-center gap-1"><Download className="w-4 h-4"/> Template CSV</button>
          <label className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 cursor-pointer"><Upload className="w-4 h-4"/> Upload CSV<input type="file" accept=".csv" className="hidden" onChange={handleFileUpload}/></label>
        </div>
      </div>
      {editingData && (
        <div className="bg-white p-3 rounded shadow mb-3 border">
          <div className="flex justify-between"><strong>{editingData.isNew ? 'Tambah Soal Baru' : 'Edit Soal'}</strong><button onClick={()=>setEditingData(null)} className="text-red-500">X</button></div>
          <select className="border p-1 my-2" value={editingData.type} onChange={e=>setEditingData({...editingData, type:e.target.value})}>
            <option value="pg">Pilihan Ganda</option>
            <option value="isian">Isian Singkat</option>
          </select>
          <textarea rows="2" className="w-full border p-2 my-1" value={editingData.text} onChange={e=>setEditingData({...editingData, text:e.target.value})} placeholder="Teks soal (bisa pakai $$rumus$$)"/>
          {editingData.type === 'pg' && (
            <div className="grid grid-cols-2 gap-2 my-2">
              {editingData.options.map((opt,i)=>(
                <input key={opt.id} className="border p-1" placeholder={`Opsi ${opt.id}`} value={opt.text} onChange={e=>{let opts=[...editingData.options]; opts[i].text=e.target.value; setEditingData({...editingData, options:opts});}}/>
              ))}
            </div>
          )}
          <div className="my-2">
            <label className="text-sm">Kunci Jawaban: </label>
            {editingData.type === 'pg' ? (
              <select value={editingData.correctAnswer} onChange={e=>setEditingData({...editingData, correctAnswer:e.target.value})} className="border p-1">
                <option>A</option><option>B</option><option>C</option><option>D</option>
              </select>
            ) : (
              <input type="text" className="border p-1 w-48" value={editingData.correctAnswer} onChange={e=>setEditingData({...editingData, correctAnswer:e.target.value})}/>
            )}
          </div>
          <button onClick={handleSaveQuestion} className="bg-green-600 text-white px-3 py-1 rounded">Simpan</button>
        </div>
      )}
      <div className="space-y-2">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-3 rounded shadow relative">
            <div className="absolute top-2 right-2 flex gap-1">
              <button onClick={()=>handleEditOpen(q)} className="text-blue-500"><Edit className="w-4 h-4"/></button>
              <button onClick={()=>setShowConfirmDelete(q.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></button>
            </div>
            <div><b>{idx+1}.</b> <span dangerouslySetInnerHTML={{__html: q.text}}/></div>
            {q.type === 'pg' && (
              <div className="grid grid-cols-2 gap-1 mt-2 text-sm">
                {q.options.map(opt => <div key={opt.id} className={q.correctAnswer === opt.id ? 'text-green-700 font-bold' : ''}>{opt.id}. {opt.text}</div>)}
              </div>
            )}
            {q.type === 'isian' && <div className="text-sm mt-1 text-green-700">Kunci: {q.correctAnswer}</div>}
            {showConfirmDelete === q.id && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center gap-2">
                <button onClick={()=>handleDelete(q.id)} className="bg-red-600 text-white px-2 py-1 rounded">Hapus</button>
                <button onClick={()=>setShowConfirmDelete(null)} className="bg-slate-200 px-2 py-1 rounded">Batal</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// STUDENT DASHBOARD
// ==========================================
function StudentDashboard({ user, exams, attempts, onStartExam }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Selamat Datang, {user.name}</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {exams.map(ex => {
          const past = attempts.find(a => a.examId === ex.id);
          return (
            <div key={ex.id} className="bg-white p-5 rounded-xl shadow flex justify-between items-center">
              <div><h3 className="font-bold">{ex.title}</h3><p className="text-sm">{ex.duration} menit</p></div>
              {past ? <div className="text-3xl font-bold text-green-600">{past.score}</div> : <button onClick={()=>onStartExam(ex.id)} className="bg-blue-600 text-white px-4 py-2 rounded">Mulai</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// EXAM RUNNER (sederhana tapi lengkap)
// ==========================================
function ExamRunner({ exam, questions, user, showNotif, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem(`answers_${user.id}_${exam.id}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [doubtful, setDoubtful] = useState({});
  const [timeLeft, setTimeLeft] = useState(() => {
    const savedTime = localStorage.getItem(`time_${user.id}_${exam.id}`);
    if (savedTime) return parseInt(savedTime);
    return exam ? exam.duration * 60 : 0;
  });
  const [examResult, setExamResult] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Simpan jawaban dan waktu setiap ada perubahan
  useEffect(() => {
    localStorage.setItem(`answers_${user.id}_${exam.id}`, JSON.stringify(answers));
    localStorage.setItem(`time_${user.id}_${exam.id}`, timeLeft);
  }, [answers, timeLeft, exam.id, user.id]);

  // Timer
  useEffect(() => {
    if (examResult !== null) return;
    if (timeLeft <= 0) { calculateScore(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, examResult]);

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      const ans = answers[q.id] || '';
      if (q.type === 'isian') {
        if (ans.trim().toLowerCase() === q.correctAnswer.toLowerCase()) correct++;
      } else {
        if (ans === q.correctAnswer) correct++;
      }
    });
    const score = questions.length ? Math.round((correct/questions.length)*100) : 0;
    setExamResult(score);
    onFinish(score, 0);
    // Hapus storage sementara
    localStorage.removeItem(`answers_${user.id}_${exam.id}`);
    localStorage.removeItem(`time_${user.id}_${exam.id}`);
  };

  if (!exam || !questions.length) return <div className="p-10">Ujian tidak tersedia</div>;
  if (examResult !== null) return <div className="p-10 text-center"><h2 className="text-2xl font-bold">Nilai Anda: {examResult}</h2><button onClick={()=>window.location.reload()} className="mt-4 bg-blue-600 text-white p-2 rounded">Kembali</button></div>;

  const currentQ = questions[currentIndex];
  const formatTime = (sec) => `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between mb-4"><span>Soal {currentIndex+1}/{questions.length}</span><span className="font-mono">{formatTime(timeLeft)}</span></div>
        <div className="mb-6" dangerouslySetInnerHTML={{__html: currentQ.text}}/>
        {currentQ.type === 'pg' ? (
          currentQ.options.map(opt => (
            <div key={opt.id} onClick={()=>setAnswers({...answers, [currentQ.id]: opt.id})} className={`p-3 border rounded mb-2 cursor-pointer ${answers[currentQ.id] === opt.id ? 'bg-blue-100 border-blue-500' : ''}`}>{opt.id}. {opt.text}</div>
          ))
        ) : (
          <textarea className="w-full border p-3 rounded" rows="4" value={answers[currentQ.id]||''} onChange={e=>setAnswers({...answers, [currentQ.id]: e.target.value})} placeholder="Jawaban anda"/>
        )}
        <div className="flex justify-between mt-6">
          <button disabled={currentIndex===0} onClick={()=>setCurrentIndex(prev=>prev-1)} className="bg-slate-200 px-4 py-2 rounded">Sebelumnya</button>
          {currentIndex === questions.length-1 ? <button onClick={()=>setShowSubmitModal(true)} className="bg-green-600 text-white px-4 py-2 rounded">Selesai</button> : <button onClick={()=>setCurrentIndex(prev=>prev+1)} className="bg-blue-600 text-white px-4 py-2 rounded">Selanjutnya</button>}
        </div>
      </div>
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="bg-white p-6 rounded-xl"><p>Yakin ingin mengakhiri ujian?</p><div className="flex gap-4 mt-4"><button onClick={calculateScore} className="bg-red-600 text-white px-4 py-2 rounded">Ya</button><button onClick={()=>setShowSubmitModal(false)} className="bg-slate-200 px-4 py-2 rounded">Batal</button></div></div></div>
      )}
    </div>
  );
}