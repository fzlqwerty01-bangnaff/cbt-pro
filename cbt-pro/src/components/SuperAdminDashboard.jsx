import React, { useState } from 'react';
import { 
  Users, ShieldAlert, Settings, FileText, Trash2, UserPlus, 
  Download, Upload, Plus, Edit, X, RefreshCw, LayoutDashboard, Database, Check
} from 'lucide-react';

export default function SuperAdminDashboard({ 
  users, setUsers, 
  logs, 
  systemConfig, setSystemConfig, 
  classes, setClasses,
  showNotif, addLog 
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'subadmin', name: '', kelas: '' });
  
  // Class management states
  const [newClassName, setNewClassName] = useState('');
  
  // Config edit state
  const [tempConfig, setTempConfig] = useState({ ...systemConfig });
  const [isEditingConfig, setIsEditingConfig] = useState(false);

  // Filter & Search states for Master Data
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  // Stats calculation
  const totalSubAdmins = users.filter(u => u.role === 'subadmin').length;
  const totalStudents = users.filter(u => u.role === 'siswa').length;
  const activeClassesCount = classes.length;
  const totalLogs = logs.length;

  // Mass CSV Import validation and execution
  const downloadUserTemplate = () => {
    const csvContent = "Nama Lengkap;Username;Password;Role;Kelas\nBudi Utomo;budi123;pass123;siswa;7A\nAni Lestari;ani123;pass123;siswa;7B\nDr. Hendra;hendra123;pass123;subadmin;\nSiti Aminah;siti123;pass123;siswa;8A";
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "template_masal_user.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotif('Template CSV berhasil diunduh');
  };

  const handleUserCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length <= 1) {
        showNotif('File CSV kosong atau format tidak sesuai', 'error');
        return;
      }

      const importedUsers = [];
      const duplicateUsernames = [];
      const invalidRows = [];

      // Helper to parse semi-colon delimited lines
      const parseCSVLine = (line) => {
        let result = [];
        let inQuotes = false;
        let currentValue = '';
        for (let i = 0; i < line.length; i++) {
          let char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ';' && !inQuotes) {
            result.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        result.push(currentValue.trim());
        return result;
      };

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 4) {
          invalidRows.push(i + 1);
          continue;
        }

        const [name, username, password, roleInput, classInput] = cols;
        const role = roleInput ? roleInput.toLowerCase().trim() : '';
        const kelasVal = classInput ? classInput.trim() : '';

        // Validations
        if (!name || !username || !password || !role) {
          invalidRows.push(i + 1);
          continue;
        }

        if (role !== 'subadmin' && role !== 'siswa') {
          invalidRows.push(i + 1);
          continue;
        }

        // Check if username already exists in current state or current import list
        const isDuplicate = users.some(u => u.username === username) || 
                            importedUsers.some(u => u.username === username);

        if (isDuplicate) {
          duplicateUsernames.push(username);
          continue;
        }

        importedUsers.push({
          id: 'u_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 5),
          name,
          username,
          password,
          role,
          kelas: role === 'siswa' ? (kelasVal || '7A') : null
        });
      }

      if (importedUsers.length > 0) {
        setUsers(prev => [...prev, ...importedUsers]);
        addLog('Upload User Massal', 'superadmin', `Berhasil mengimpor ${importedUsers.length} user via CSV`);
        
        let notifMsg = `${importedUsers.length} user berhasil diimpor!`;
        if (duplicateUsernames.length > 0) {
          notifMsg += ` (Abaikan ${duplicateUsernames.length} username duplikat)`;
        }
        if (invalidRows.length > 0) {
          notifMsg += ` (Baris tidak valid: ${invalidRows.join(', ')})`;
        }
        showNotif(notifMsg, duplicateUsernames.length > 0 || invalidRows.length > 0 ? 'warning' : 'success');
      } else {
        showNotif('Tidak ada user baru yang berhasil diimpor. Cek duplikat atau baris tidak valid.', 'error');
      }
    };

    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const handleAddUserManual = (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.username.trim() || !newUser.password.trim()) {
      showNotif('Harap lengkapi semua kolom wajib', 'error');
      return;
    }

    const isDuplicate = users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (isDuplicate) {
      showNotif(`Username "${newUser.username}" sudah digunakan`, 'error');
      return;
    }

    const addedUser = {
      id: 'u_' + Date.now(),
      name: newUser.name.trim(),
      username: newUser.username.trim(),
      password: newUser.password.trim(),
      role: newUser.role,
      kelas: newUser.role === 'siswa' ? (newUser.kelas || classes[0] || '7A') : null
    };

    setUsers(prev => [...prev, addedUser]);
    addLog('Tambah User Manual', 'superadmin', `Menambah user ${addedUser.username} (${addedUser.role})`);
    showNotif(`User ${addedUser.name} berhasil ditambahkan`, 'success');
    
    // Reset Form
    setShowUserForm(false);
    setNewUser({ username: '', password: '', role: 'subadmin', name: '', kelas: '' });
  };

  const handleDeleteUser = (userId, userName) => {
    const checkUser = users.find(u => u.id === userId);
    if (checkUser && checkUser.role === 'superadmin') {
      showNotif('Tidak dapat menghapus akun Super Admin', 'error');
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus user "${userName}"?`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      addLog('Hapus User', 'superadmin', `Menghapus user ${userName}`);
      showNotif(`User ${userName} telah dihapus`, 'info');
    }
  };

  // Class Management CRUD
  const handleAddClass = (e) => {
    e.preventDefault();
    const classNameClean = newClassName.trim().toUpperCase();
    if (!classNameClean) return;

    if (classes.includes(classNameClean)) {
      showNotif(`Kelas ${classNameClean} sudah terdaftar`, 'error');
      return;
    }

    setClasses(prev => [...prev, classNameClean]);
    addLog('Tambah Kelas', 'superadmin', `Menambahkan kelas baru: ${classNameClean}`);
    showNotif(`Kelas ${classNameClean} berhasil ditambahkan`, 'success');
    setNewClassName('');
  };

  const handleDeleteClass = (className) => {
    const isUsed = users.some(u => u.kelas === className);
    if (isUsed) {
      showNotif(`Kelas ${className} sedang digunakan oleh siswa/guru. Tidak bisa dihapus.`, 'error');
      return;
    }

    if (window.confirm(`Hapus kelas ${className}?`)) {
      setClasses(prev => prev.filter(c => c !== className));
      addLog('Hapus Kelas', 'superadmin', `Menghapus kelas: ${className}`);
      showNotif(`Kelas ${className} berhasil dihapus`, 'info');
    }
  };

  // System Config Management
  const handleSaveConfig = (e) => {
    e.preventDefault();
    setSystemConfig({ ...tempConfig });
    setIsEditingConfig(false);
    addLog('Ubah Konfigurasi Sistem', 'superadmin', 'Mengubah konfigurasi umum sekolah');
    showNotif('Konfigurasi sistem berhasil disimpan', 'success');
  };

  // Filtered users for Master Data list
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesClass = classFilter === 'all' || (u.kelas && u.kelas === classFilter);
    return matchesSearch && matchesRole && matchesClass;
  });

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-140px)]">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 rounded-2xl p-4 shadow-xl border border-slate-800 flex flex-col gap-2 shrink-0">
        <div className="px-3 py-4 border-b border-slate-800 mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500/10 p-2 rounded-xl text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base">Super Admin</h2>
              <p className="text-xs text-slate-500">Raja Terakhir</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
            ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>

        <button 
          onClick={() => setActiveTab('subadmin')} 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
            ${activeTab === 'subadmin' ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
          <Users className="w-4 h-4" />
          Manajemen Sub Admin
        </button>

        <button 
          onClick={() => setActiveTab('masterdata')} 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
            ${activeTab === 'masterdata' ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
          <Database className="w-4 h-4" />
          Master Data & Kelas
        </button>

        <button 
          onClick={() => setActiveTab('logs')} 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
            ${activeTab === 'logs' ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
          <FileText className="w-4 h-4" />
          Audit Log Aktivitas
        </button>

        <button 
          onClick={() => setActiveTab('settings')} 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
            ${activeTab === 'settings' ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
          <Settings className="w-4 h-4" />
          Konfigurasi Sistem
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <section className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 transition-all duration-300">
        
        {/* TAB 1: DASHBOARD STATS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ringkasan Statistik</h2>
              <p className="text-sm text-slate-500 mt-1">Status global aktivitas sekolah dan sistem CBT saat ini.</p>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-6 rounded-2xl border border-indigo-100 flex items-center gap-4">
                <div className="bg-indigo-600 p-3.5 rounded-2xl text-white shadow-md shadow-indigo-200">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider block">Total Siswa</span>
                  <span className="text-3xl font-extrabold text-slate-900 mt-0.5 block">{totalStudents}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-6 rounded-2xl border border-rose-100 flex items-center gap-4">
                <div className="bg-rose-600 p-3.5 rounded-2xl text-white shadow-md shadow-rose-200">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-rose-600 font-bold uppercase tracking-wider block">Sub Admin (Guru)</span>
                  <span className="text-3xl font-extrabold text-slate-900 mt-0.5 block">{totalSubAdmins}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-2xl border border-emerald-100 flex items-center gap-4">
                <div className="bg-emerald-600 p-3.5 rounded-2xl text-white shadow-md shadow-emerald-200">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider block">Daftar Kelas</span>
                  <span className="text-3xl font-extrabold text-slate-900 mt-0.5 block">{activeClassesCount}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 rounded-2xl border border-amber-100 flex items-center gap-4">
                <div className="bg-amber-600 p-3.5 rounded-2xl text-white shadow-md shadow-amber-200">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-amber-600 font-bold uppercase tracking-wider block">Audit Log</span>
                  <span className="text-3xl font-extrabold text-slate-900 mt-0.5 block">{totalLogs}</span>
                </div>
              </div>
            </div>

            {/* Custom SVG Graph (Mock Bar Chart) */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg mb-4">Jumlah Siswa Per Kelas</h3>
              {classes.length === 0 ? (
                <p className="text-slate-400 text-sm">Belum ada kelas yang terdaftar. Tambahkan kelas di tab Master Data.</p>
              ) : (
                <div className="flex flex-col gap-3 mt-6">
                  {classes.map(cls => {
                    const count = users.filter(u => u.role === 'siswa' && u.kelas === cls).length;
                    const maxCount = Math.max(...classes.map(c => users.filter(u => u.role === 'siswa' && u.kelas === c).length), 1);
                    const widthPercent = (count / maxCount) * 100;
                    return (
                      <div key={cls} className="flex items-center gap-4">
                        <span className="w-12 text-sm font-bold text-slate-600 text-right">{cls}</span>
                        <div className="flex-1 bg-slate-200 h-6 rounded-full overflow-hidden relative shadow-inner">
                          <div 
                            style={{ width: `${Math.max(widthPercent, 5)}%` }} 
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500 flex items-center justify-end px-3">
                            {count > 0 && <span className="text-[10px] font-bold text-white">{count} Siswa</span>}
                          </div>
                        </div>
                        <span className="w-10 text-xs text-slate-500">{count} org</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Logs Summary */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 text-lg">Aktivitas Sistem Terakhir</h3>
                <button onClick={() => setActiveTab('logs')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                  Lihat Semua
                </button>
              </div>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {logs.slice(0, 5).map(log => (
                  <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-0.5 uppercase shrink-0">
                        {log.action}
                      </span>
                      <p className="text-slate-700 font-medium">{log.details}</p>
                    </div>
                    <span className="text-xs text-slate-400 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-slate-400 text-center py-6 text-sm">Belum ada aktivitas tercatat.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GURU / SUB ADMIN MANAGEMENT */}
        {activeTab === 'subadmin' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manajemen Akun Guru</h2>
                <p className="text-sm text-slate-500 mt-1">Tambah, edit, dan hapus akun Sub Admin/Guru yang mengelola ujian.</p>
              </div>
              <button 
                onClick={() => {
                  setNewUser({ username: '', password: '', role: 'subadmin', name: '', kelas: '' });
                  setShowUserForm(true);
                }} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                <UserPlus className="w-4 h-4" />
                Tambah Guru Baru
              </button>
            </div>

            {/* FORM MODAL / PANEL */}
            {showUserForm && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-inner relative animate-slideDown">
                <button onClick={() => setShowUserForm(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-200 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="font-bold text-slate-800 text-lg mb-4">Formulir Tambah Guru (Sub Admin)</h3>
                
                <form onSubmit={handleAddUserManual} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Nama Lengkap *</label>
                    <input 
                      type="text" 
                      placeholder="Nama Lengkap" 
                      className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                      value={newUser.name} 
                      onChange={e => setNewUser({ ...newUser, name: e.target.value })} 
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Username *</label>
                    <input 
                      type="text" 
                      placeholder="Username" 
                      className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                      value={newUser.username} 
                      onChange={e => setNewUser({ ...newUser, username: e.target.value.toLowerCase().replace(/\s/g, '') })} 
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Password Baru *</label>
                    <input 
                      type="text" 
                      placeholder="Password" 
                      className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                      value={newUser.password} 
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })} 
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">Kelas Ditugaskan (Opsional)</label>
                    <select 
                      className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500"
                      value={newUser.kelas} 
                      onChange={e => setNewUser({ ...newUser, kelas: e.target.value })}>
                      <option value="">Semua Kelas</option>
                      {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-2.5 mt-2">
                    <button type="button" onClick={() => setShowUserForm(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                      Batal
                    </button>
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Simpan Guru
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List Guru */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                      <th className="p-4 pl-6">Nama Guru</th>
                      <th className="p-4">Username</th>
                      <th className="p-4">Password (Plain)</th>
                      <th className="p-4">Kelas Ditugaskan</th>
                      <th className="p-4 pr-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {users.filter(u => u.role === 'subadmin').map(guru => (
                      <tr key={guru.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 font-semibold text-slate-900">{guru.name}</td>
                        <td className="p-4 font-mono text-slate-600">{guru.username}</td>
                        <td className="p-4 text-slate-500">{guru.password}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                            ${guru.kelas ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                            {guru.kelas || 'Semua Kelas'}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button 
                            onClick={() => handleDeleteUser(guru.id, guru.name)} 
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors inline-flex"
                            title="Hapus Akun">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.filter(u => u.role === 'subadmin').length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400">Belum ada akun guru terdaftar.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MASTER DATA & KELAS */}
        {activeTab === 'masterdata' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* GRID DUA KOLOM: KELAS & USER MASSAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Kolom Kiri: CRUD KELAS */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 lg:col-span-1 space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Manajemen Kelas</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tambah & hapus jenjang kelas (7A, 7B, dll)</p>
                </div>

                <form onSubmit={handleAddClass} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Contoh: 7A" 
                    className="flex-1 border border-slate-200 p-2 rounded-xl bg-white text-sm uppercase font-bold focus:outline-none focus:border-indigo-500" 
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                  />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-1 shrink-0">
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                </form>

                <div className="bg-white rounded-xl border border-slate-200 p-3 max-h-80 overflow-y-auto">
                  <div className="divide-y divide-slate-100">
                    {classes.map(cls => (
                      <div key={cls} className="py-2.5 flex justify-between items-center text-sm font-semibold text-slate-700">
                        <span>Kelas {cls}</span>
                        <button onClick={() => handleDeleteClass(cls)} className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {classes.length === 0 && (
                      <p className="text-slate-400 text-center py-4 text-xs">Belum ada kelas</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: CRUD USER (SISWA & GURU) DAN IMPORT MASSAL */}
              <div className="lg:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Import Masal & Akun Global</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Upload guru/siswa sekaligus via file CSV.</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={downloadUserTemplate} 
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Template CSV
                    </button>
                    <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-50">
                      <Upload className="w-3.5 h-3.5" /> Upload CSV
                      <input type="file" accept=".csv" className="hidden" onChange={handleUserCSVUpload} />
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      placeholder="Cari nama atau username..." 
                      className="flex-1 border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500" 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    <select 
                      className="border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none text-slate-600"
                      value={roleFilter}
                      onChange={e => setRoleFilter(e.target.value)}>
                      <option value="all">Semua Peran</option>
                      <option value="subadmin">Guru/Operator</option>
                      <option value="siswa">Siswa</option>
                    </select>
                    <select 
                      className="border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none text-slate-600"
                      value={classFilter}
                      onChange={e => setClassFilter(e.target.value)}>
                      <option value="all">Semua Kelas</option>
                      {classes.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                    </select>
                  </div>

                  {/* Manual add button inside master data */}
                  <div className="flex justify-between items-center bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600">
                    <span>Menampilkan {filteredUsers.length} user terfilter</span>
                    <button 
                      onClick={() => {
                        setNewUser({ username: '', password: '', role: 'siswa', name: '', kelas: classes[0] || '' });
                        setShowUserForm(true);
                      }}
                      className="text-indigo-600 hover:underline hover:text-indigo-800 flex items-center gap-1">
                      + Tambah Siswa Manual
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-0">
                        <tr className="border-b border-slate-100">
                          <th className="p-3 pl-4">Nama</th>
                          <th className="p-3">Username</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">Kelas</th>
                          <th className="p-3 pr-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="p-3 pl-4 font-semibold text-slate-800">{u.name}</td>
                            <td className="p-3 font-mono text-slate-600">{u.username}</td>
                            <td className="p-3 uppercase font-bold text-[10px]">
                              <span className={`px-2 py-0.5 rounded-md
                                ${u.role === 'superadmin' ? 'bg-red-50 text-red-600' : u.role === 'subadmin' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-600">{u.kelas || '-'}</td>
                            <td className="p-3 pr-4 text-right">
                              {u.role !== 'superadmin' && (
                                <button onClick={() => handleDeleteUser(u.id, u.name)} className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan="5" className="p-6 text-center text-slate-400">Data tidak ditemukan.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOG VIEW */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Audit Log Aktivitas</h2>
              <p className="text-sm text-slate-500 mt-1">Riwayat tindakan penting yang dilakukan oleh Super Admin dan Sub Admin.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Cari log..." 
                  className="flex-1 border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  onChange={(e) => {
                    // Search dynamically
                  }}
                />
              </div>

              <div className="border border-slate-100 rounded-xl max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-0 border-b border-slate-100">
                    <tr>
                      <th className="p-3.5 pl-4">Tanggal/Waktu</th>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Tindakan</th>
                      <th className="p-3.5 pr-4">Rincian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/30">
                        <td className="p-3.5 pl-4 text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">
                          {log.userId === 'superadmin' ? 'Super Admin' : `User: ${log.userId}`}
                        </td>
                        <td className="p-3.5">
                          <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded uppercase text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 pr-4 text-slate-600 font-medium">{log.details}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-slate-400">Belum ada audit log tersimpan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM CONFIGURATION */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Konfigurasi Sistem</h2>
              <p className="text-sm text-slate-500 mt-1">Sesuaikan identitas sekolah dan batasan teknis aplikasi CBT Pro.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm max-w-2xl">
              <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Nama Sekolah / Lembaga</label>
                  <input 
                    type="text" 
                    className="border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50" 
                    value={tempConfig.schoolName} 
                    onChange={e => setTempConfig({ ...tempConfig, schoolName: e.target.value })}
                    required
                  />
                  <p className="text-xs text-slate-400">Nama ini akan muncul pada header halaman utama sistem.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Logo URL Sekolah</label>
                  <input 
                    type="text" 
                    className="border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50" 
                    value={tempConfig.logo} 
                    onChange={e => setTempConfig({ ...tempConfig, logo: e.target.value })}
                    placeholder="https://link-logo-anda.png"
                  />
                  <p className="text-xs text-slate-400">URL gambar logo sekolah (opsional). Kosongkan untuk menggunakan logo bawaan.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700">Timeout Sesi (Menit)</label>
                    <input 
                      type="number" 
                      className="border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50" 
                      value={tempConfig.sessionTimeout || 60} 
                      onChange={e => setTempConfig({ ...tempConfig, sessionTimeout: parseInt(e.target.value) })}
                      min="5"
                      max="1440"
                    />
                    <p className="text-xs text-slate-400">Durasi batas menganggur siswa sebelum otomatis logout.</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700">Batasan Pindah Tab (Proctoring)</label>
                    <select 
                      className="border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50 text-slate-700 font-semibold"
                      value={tempConfig.restrictTabSwitches ? 'true' : 'false'}
                      onChange={e => setTempConfig({ ...tempConfig, restrictTabSwitches: e.target.value === 'true' })}>
                      <option value="true">Aktif (Peringatan & Catat Pelanggaran)</option>
                      <option value="false">Tidak Aktif</option>
                    </select>
                    <p className="text-xs text-slate-400">Berikan peringatan jika siswa berpindah aplikasi atau tab selama ujian.</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
                  {isEditingConfig ? (
                    <>
                      <button 
                        type="button" 
                        onClick={() => {
                          setTempConfig({ ...systemConfig });
                          setIsEditingConfig(false);
                        }} 
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                        Batal
                      </button>
                      <button 
                        type="submit" 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-50">
                        Simpan Perubahan
                      </button>
                    </>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => setIsEditingConfig(true)} 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-50">
                      Ubah Konfigurasi
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
