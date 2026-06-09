import React, { useState } from 'react';
import { 
  Plus, Copy, Trash2, Edit, Users, BookOpen, FileText, Download, 
  Upload, RefreshCw, ChevronLeft, ChevronRight, BarChart2, CheckCircle2, AlertCircle, X
} from 'lucide-react';

export default function SubAdminDashboard({ 
  user, 
  exams, setExams, 
  questions, setQuestions, 
  attempts, setAttempts, 
  users, setUsers, 
  classes,
  showNotif, addLog 
}) {
  const [activeTab, setActiveTab] = useState('exams');
  const [showExamForm, setShowExamForm] = useState(false);
  const [newExam, setNewExam] = useState({ 
    title: '', 
    description: '', 
    duration: 30, 
    kelas: user.kelas || classes[0] || '7A', 
    date: new Date().toISOString().split('T')[0],
    randomize: false,
    status: 'draft' 
  });
  
  // Selected exam for managing questions
  const [selectedExamId, setSelectedExamId] = useState(null);
  
  // Student class filters
  const [selectedClass, setSelectedClass] = useState(user.kelas || classes[0] || '7A');
  const [newStudent, setNewStudent] = useState({ name: '', username: '', password: '' });
  
  // Grades filtering
  const [selectedGradeExamId, setSelectedGradeExamId] = useState('all');

  // Question editing state
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showConfirmDeleteQ, setShowConfirmDeleteQ] = useState(null);

  // Stats
  const teacherExams = exams.filter(e => e.createdBy === user.id || e.kelas === user.kelas);
  const teacherStudents = users.filter(u => u.role === 'siswa' && (user.kelas ? u.kelas === user.kelas : u.kelas === selectedClass));

  // --- FEATURE: COPY EXAM ---
  const handleCopyExam = (examId) => {
    const original = exams.find(e => e.id === examId);
    if (!original) return;

    const newExamId = 'exam_' + Date.now();
    const copiedExam = {
      ...original,
      id: newExamId,
      title: original.title + ' (Salinan)',
      status: 'draft', // Always copy into Draft status
      createdBy: user.id,
      date: new Date().toISOString().split('T')[0] // Set to today
    };

    // Copy questions associated with this exam
    const originalQuestions = questions.filter(q => q.examId === examId);
    const copiedQuestions = originalQuestions.map((q, idx) => ({
      ...q,
      id: 'q_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 5),
      examId: newExamId
    }));

    setExams(prev => [...prev, copiedExam]);
    setQuestions(prev => [...prev, ...copiedQuestions]);
    
    addLog('Copy Ujian', user.id, `Menduplikasi ujian "${original.title}" ke ID baru dengan status Draft`);
    showNotif(`Ujian "${original.title}" berhasil diduplikasi sebagai Draft`, 'success');
  };

  // --- FEATURE: RESET EXAM FOR STUDENT ---
  const handleResetExam = (studentId, studentName, examId, examTitle) => {
    if (window.confirm(`Reset hasil ujian "${examTitle}" untuk siswa "${studentName}"? Siswa akan bisa mengulang ujian ini.`)) {
      // 1. Remove attempt from global state
      setAttempts(prev => prev.filter(a => !(a.studentId === studentId && a.examId === examId)));
      
      // 2. Clear browser localStorage items for that specific student attempt
      localStorage.removeItem(`answers_${studentId}_${examId}`);
      localStorage.removeItem(`time_${studentId}_${examId}`);

      addLog('Reset Ujian Siswa', user.id, `Mereset sesi ujian ${examTitle} untuk siswa ${studentName}`);
      showNotif(`Sesi ujian ${studentName} berhasil direset!`, 'success');
    }
  };

  // --- FEATURE: EXPORT GRADES TO EXCEL (CSV Format) ---
  const exportGradesToCSV = () => {
    const filteredAttempts = attempts.filter(a => {
      const student = users.find(s => s.id === a.studentId);
      const isMyClass = user.kelas ? student?.kelas === user.kelas : student?.kelas === selectedClass;
      const matchesExam = selectedGradeExamId === 'all' || a.examId === selectedGradeExamId;
      return isMyClass && matchesExam;
    });

    if (filteredAttempts.length === 0) {
      showNotif('Tidak ada nilai untuk diekspor', 'warning');
      return;
    }

    let csvContent = "No;Nama Siswa;Username;Kelas;Ujian;Nilai Akhir;Tanggal Mengerjakan;Pelanggaran Tab\n";
    filteredAttempts.forEach((a, idx) => {
      const student = users.find(s => s.id === a.studentId);
      const exam = exams.find(e => e.id === a.examId);
      csvContent += `${idx + 1};${a.studentName};${student?.username || ''};${student?.kelas || ''};${exam?.title || ''};${a.score};${a.date};${a.violations || 0}\n`;
    });

    // Semicolon separator with BOM (\uFEFF) to make it open automatically in columns in MS Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Rekap_Nilai_Kelas_${user.kelas || selectedClass}_${selectedGradeExamId === 'all' ? 'Semua_Ujian' : 'Ujian'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotif('Rekap nilai berhasil diekspor ke Excel (CSV)', 'success');
  };

  // Create Exam Handler
  const handleCreateExam = (e) => {
    e.preventDefault();
    if (!newExam.title.trim()) {
      showNotif('Judul ujian tidak boleh kosong', 'error');
      return;
    }

    const examId = 'exam_' + Date.now();
    const createdExam = {
      ...newExam,
      id: examId,
      createdBy: user.id,
      title: newExam.title.trim(),
      description: newExam.description.trim()
    };

    setExams(prev => [...prev, createdExam]);
    addLog('Buat Ujian', user.id, `Membuat ujian baru: ${createdExam.title}`);
    showNotif(`Ujian "${createdExam.title}" berhasil dibuat`, 'success');
    
    setShowExamForm(false);
    setNewExam({
      title: '',
      description: '',
      duration: 30,
      kelas: user.kelas || classes[0] || '7A',
      date: new Date().toISOString().split('T')[0],
      randomize: false,
      status: 'draft'
    });
  };

  // Delete Exam
  const handleDeleteExam = (examId, examTitle) => {
    if (window.confirm(`Hapus ujian "${examTitle}"? Semua pertanyaan di dalamnya juga akan terhapus.`)) {
      setExams(prev => prev.filter(e => e.id !== examId));
      setQuestions(prev => prev.filter(q => q.examId !== examId));
      setAttempts(prev => prev.filter(a => a.examId !== examId));
      addLog('Hapus Ujian', user.id, `Menghapus ujian: ${examTitle}`);
      showNotif(`Ujian "${examTitle}" telah dihapus`, 'info');
    }
  };

  // Add Student Manual inside classroom view
  const handleAddStudentManual = (e) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !newStudent.username.trim() || !newStudent.password.trim()) {
      showNotif('Lengkapi data siswa baru', 'error');
      return;
    }

    const isDuplicate = users.some(u => u.username.toLowerCase() === newStudent.username.toLowerCase());
    if (isDuplicate) {
      showNotif(`Username "${newStudent.username}" sudah digunakan`, 'error');
      return;
    }

    const targetClass = user.kelas || selectedClass;
    const addedUser = {
      id: 'u_' + Date.now(),
      name: newStudent.name.trim(),
      username: newStudent.username.trim(),
      password: newStudent.password.trim(),
      role: 'siswa',
      kelas: targetClass
    };

    setUsers(prev => [...prev, addedUser]);
    addLog('Tambah Siswa Manual', user.id, `Menambahkan siswa ${addedUser.name} ke kelas ${targetClass}`);
    showNotif(`Siswa ${addedUser.name} berhasil ditambahkan`, 'success');
    setNewStudent({ name: '', username: '', password: '' });
  };

  // Stats calculation for GradeBook
  const getGradeStatistics = () => {
    const classAttempts = attempts.filter(a => {
      const student = users.find(s => s.id === a.studentId);
      const isMyClass = user.kelas ? student?.kelas === user.kelas : student?.kelas === selectedClass;
      const matchesExam = selectedGradeExamId === 'all' || a.examId === selectedGradeExamId;
      return isMyClass && matchesExam;
    });

    if (classAttempts.length === 0) return { avg: 0, max: 0, min: 0, passRate: 0 };
    const scores = classAttempts.map(a => a.score);
    const sum = scores.reduce((acc, s) => acc + s, 0);
    const avg = Math.round(sum / scores.length);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const passCount = scores.filter(s => s >= 70).length; // passing score threshold is 70
    const passRate = Math.round((passCount / scores.length) * 100);

    return { avg, max, min, passRate };
  };

  const stats = getGradeStatistics();

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-140px)]">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 rounded-2xl p-4 shadow-xl border border-slate-800 flex flex-col gap-2 shrink-0">
        <div className="px-3 py-4 border-b border-slate-800 mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-sm truncate">{user.name}</h2>
              <p className="text-xs text-slate-500">Guru / Operator</p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <button 
          onClick={() => { setActiveTab('exams'); setSelectedExamId(null); }} 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
            ${activeTab === 'exams' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
          <BookOpen className="w-4 h-4" />
          Manajemen Ujian
        </button>

        <button 
          onClick={() => { setActiveTab('banksoal'); setSelectedExamId(null); }} 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
            ${activeTab === 'banksoal' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
          <FileText className="w-4 h-4" />
          Bank Soal
        </button>

        <button 
          onClick={() => { setActiveTab('students'); setSelectedExamId(null); }} 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
            ${activeTab === 'students' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
          <Users className="w-4 h-4" />
          Manajemen Kelas
        </button>

        <button 
          onClick={() => { setActiveTab('grades'); setSelectedExamId(null); }} 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
            ${activeTab === 'grades' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
          <BarChart2 className="w-4 h-4" />
          Rekapitulasi Nilai
        </button>
      </aside>

      {/* WORKSPACE AREA */}
      <section className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
        
        {/* VIEW 1: EXAM LIST OR EXAM EDITOR */}
        {activeTab === 'exams' && (
          selectedExamId ? (
            <AdminExamEditor 
              examId={selectedExamId}
              exam={exams.find(e => e.id === selectedExamId)}
              questions={questions.filter(q => q.examId === selectedExamId)}
              setQuestions={setQuestions}
              onBack={() => setSelectedExamId(null)}
              showNotif={showNotif}
            />
          ) : (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manajemen Sesi Ujian</h2>
                  <p className="text-sm text-slate-500 mt-1">Buat jadwal ujian baru, salin, atau kelola soal di dalamnya.</p>
                </div>
                <button 
                  onClick={() => setShowExamForm(true)} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                  <Plus className="w-4 h-4" />
                  Buat Ujian Baru
                </button>
              </div>

              {/* CREATE EXAM FORM */}
              {showExamForm && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner relative animate-slideDown">
                  <button onClick={() => setShowExamForm(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-200 text-slate-500">
                    <XIcon className="w-5 h-5" />
                  </button>
                  <h3 className="font-bold text-slate-800 text-lg mb-4">Pengaturan Ujian Baru</h3>
                  
                  <form onSubmit={handleCreateExam} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-600">Judul Ujian *</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Ujian Akhir Semester Fisika" 
                        className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500" 
                        value={newExam.title} 
                        onChange={e => setNewExam({ ...newExam, title: e.target.value })} 
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-600">Deskripsi / Petunjuk Ujian</label>
                      <textarea 
                        rows="2"
                        placeholder="Petunjuk pengerjaan..." 
                        className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500" 
                        value={newExam.description} 
                        onChange={e => setNewExam({ ...newExam, description: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">Durasi (Menit) *</label>
                      <input 
                        type="number" 
                        placeholder="Menit" 
                        className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500" 
                        value={newExam.duration} 
                        onChange={e => setNewExam({ ...newExam, duration: parseInt(e.target.value) || 30 })} 
                        min="5"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">Tanggal Pelaksanaan *</label>
                      <input 
                        type="date" 
                        className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500" 
                        value={newExam.date} 
                        onChange={e => setNewExam({ ...newExam, date: e.target.value })} 
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">Kelas Target *</label>
                      <select 
                        disabled={!!user.kelas}
                        className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500 text-slate-700"
                        value={newExam.kelas} 
                        onChange={e => setNewExam({ ...newExam, kelas: e.target.value })}>
                        {classes.map(cls => <option key={cls} value={cls}>Kelas {cls}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-600">Status Ujian *</label>
                      <select 
                        className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500 text-slate-700 font-semibold"
                        value={newExam.status} 
                        onChange={e => setNewExam({ ...newExam, status: e.target.value })}>
                        <option value="draft">Draft (Belum Dimulai)</option>
                        <option value="active">Aktif (Sedang Berlangsung)</option>
                        <option value="finished">Selesai (Ditutup)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 flex items-center gap-2 py-2">
                      <input 
                        type="checkbox" 
                        id="randomize" 
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        checked={newExam.randomize}
                        onChange={e => setNewExam({ ...newExam, randomize: e.target.checked })}
                      />
                      <label htmlFor="randomize" className="text-xs font-bold text-slate-600 cursor-pointer">
                        Acak Urutan Soal Ujian untuk Siswa
                      </label>
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2.5 mt-2">
                      <button type="button" onClick={() => setShowExamForm(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        Batal
                      </button>
                      <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all">
                        Simpan Ujian
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* GRID EXAM CARD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teacherExams.map(ex => {
                  const examQsCount = questions.filter(q => q.examId === ex.id).length;
                  return (
                    <div key={ex.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                            ${ex.status === 'active' ? 'bg-emerald-50 text-emerald-600' : ex.status === 'finished' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-600'}`}>
                            {ex.status}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 font-mono">{ex.date}</span>
                        </div>

                        <h3 className="font-extrabold text-slate-900 text-lg tracking-tight leading-snug">{ex.title}</h3>
                        <p className="text-slate-500 text-xs line-clamp-2">{ex.description || 'Tidak ada deskripsi ujian.'}</p>
                        
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center text-xs font-bold text-slate-600 border border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-normal uppercase mb-0.5">Durasi</span>
                            <span>{ex.duration}m</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-normal uppercase mb-0.5">Target</span>
                            <span>{ex.kelas}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-normal uppercase mb-0.5">Jumlah Soal</span>
                            <span>{examQsCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 mt-5">
                        <div className="flex gap-1">
                          <button 
                            onClick={() => setSelectedExamId(ex.id)} 
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1">
                            Kelola Soal
                          </button>
                          <button 
                            onClick={() => handleCopyExam(ex.id)} 
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                            title="Duplikat Ujian">
                            <Copy className="w-3.5 h-3.5" /> Duplikat
                          </button>
                        </div>
                        <button 
                          onClick={() => handleDeleteExam(ex.id, ex.title)} 
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {teacherExams.length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-slate-400 text-sm">Belum ada ujian dibuat. Silakan klik tombol 'Buat Ujian Baru'.</p>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* VIEW 2: BANK SOAL */}
        {activeTab === 'banksoal' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bank Soal</h2>
              <p className="text-sm text-slate-500 mt-1">Daftar semua soal yang telah Anda buat untuk digunakan kembali di ujian manapun.</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <span className="text-xs font-bold text-slate-600">Total bank soal terkumpul: {questions.length} Soal</span>
              <button 
                onClick={() => {
                  showNotif('Untuk menambahkan soal ke bank soal, silakan kelola soal melalui menu Ujian → Kelola Soal.', 'info');
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold">
                Tambah Soal Baru
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const linkedExam = exams.find(e => e.id === q.examId);
                return (
                  <div key={q.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-slate-400 font-bold">Pertanyaan #{idx+1}</span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
                        Ujian: {linkedExam?.title || 'Bebas / Tidak Terhubung'}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-slate-800" dangerouslySetInnerHTML={{ __html: q.text }} />

                    {q.type === 'pg' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                        {q.options.map(opt => (
                          <div 
                            key={opt.id} 
                            className={`p-2 border rounded-xl 
                              ${q.correctAnswer === opt.id ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50/50 border-slate-100'}`}>
                            {opt.id}. {opt.text}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-xl inline-block">
                        Kunci Jawaban Singkat: {q.correctAnswer}
                      </div>
                    )}
                  </div>
                );
              })}

              {questions.length === 0 && (
                <p className="text-slate-400 text-center py-12">Belum ada bank soal tersedia.</p>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: MANAJEMEN SISWA & KELAS */}
        {activeTab === 'students' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header with Classroom Selector */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manajemen Kelas & Siswa</h2>
                <p className="text-sm text-slate-500 mt-1">Daftar siswa dalam kelas Anda serta pemantauan status ujian.</p>
              </div>

              {!user.kelas && (
                <div className="flex items-center gap-2.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Pilih Kelas:</label>
                  <select 
                    className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500 text-slate-700 font-bold"
                    value={selectedClass} 
                    onChange={e => setSelectedClass(e.target.value)}>
                    {classes.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* KOLOM KIRI: TAMBAH SISWA MANUAL */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 lg:col-span-1 space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Tambah Siswa Baru</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tambah siswa ke kelas {user.kelas || selectedClass} secara instan.</p>
                </div>

                <form onSubmit={handleAddStudentManual} className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Nama Siswa</label>
                    <input 
                      type="text" 
                      placeholder="Nama Lengkap" 
                      className="border border-slate-200 p-2 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500" 
                      value={newStudent.name}
                      onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Username</label>
                    <input 
                      type="text" 
                      placeholder="Username" 
                      className="border border-slate-200 p-2 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500" 
                      value={newStudent.username}
                      onChange={e => setNewStudent({ ...newStudent, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Password</label>
                    <input 
                      type="text" 
                      placeholder="Password" 
                      className="border border-slate-200 p-2 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500" 
                      value={newStudent.password}
                      onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1">
                    <Plus className="w-4 h-4" /> Simpan Siswa
                  </button>
                </form>
              </div>

              {/* KOLOM KANAN: TABEL SISWA DAN MONITORING RESET */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm">Siswa Terdaftar (Kelas {user.kelas || selectedClass})</h3>
                  <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {teacherStudents.length} Siswa
                  </span>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-0 border-b border-slate-100">
                      <tr>
                        <th className="p-3 pl-4">Nama Siswa</th>
                        <th className="p-3">Username</th>
                        <th className="p-3">Hasil / Monitoring</th>
                        <th className="p-3 pr-4 text-right">Reset Akses</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teacherStudents.map(student => {
                        // Check if student has completed any exam
                        const studentAttempts = attempts.filter(a => a.studentId === student.id);
                        return (
                          <tr key={student.id} className="hover:bg-slate-50/40">
                            <td className="p-3 pl-4 font-semibold text-slate-800">{student.name}</td>
                            <td className="p-3 text-slate-500 font-mono">{student.username}</td>
                            <td className="p-3 space-y-1">
                              {studentAttempts.map(a => {
                                const exam = exams.find(e => e.id === a.examId);
                                return (
                                  <div key={a.id} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span>{exam?.title}: <strong>{a.score}</strong></span>
                                  </div>
                                );
                              })}
                              {studentAttempts.length === 0 && (
                                <span className="text-[10px] text-slate-400">Belum mengerjakan ujian</span>
                              )}
                            </td>
                            <td className="p-3 pr-4 text-right">
                              {studentAttempts.map(a => {
                                const exam = exams.find(e => e.id === a.examId);
                                return (
                                  <button 
                                    key={a.id}
                                    onClick={() => handleResetExam(student.id, student.name, a.examId, exam?.title)} 
                                    className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors border border-rose-200 ml-1 inline-flex"
                                    title={`Reset Ujian ${exam?.title}`}>
                                    <RefreshCw className="w-3 h-3" />
                                  </button>
                                );
                              })}
                            </td>
                          </tr>
                        );
                      })}
                      {teacherStudents.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-6 text-center text-slate-400">Belum ada siswa di kelas ini.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: NILAI / REKAPITULASI */}
        {activeTab === 'grades' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header + Actions */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Rekapitulasi Nilai Kelas</h2>
                <p className="text-sm text-slate-500 mt-1">Pantau performa nilai akhir ujian siswa dan ekspor data.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!user.kelas && (
                  <select 
                    className="border border-slate-200 p-2.5 rounded-xl bg-white text-xs font-bold focus:outline-none text-slate-700"
                    value={selectedClass} 
                    onChange={e => setSelectedClass(e.target.value)}>
                    {classes.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                  </select>
                )}
                
                <select 
                  className="border border-slate-200 p-2.5 rounded-xl bg-white text-xs font-bold focus:outline-none text-slate-700"
                  value={selectedGradeExamId} 
                  onChange={e => setSelectedGradeExamId(e.target.value)}>
                  <option value="all">Semua Sesi Ujian</option>
                  {teacherExams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                </select>

                <button 
                  onClick={exportGradesToCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-50 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Ekspor Excel
                </button>
              </div>
            </div>

            {/* STATISTICS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Rata-rata Kelas</span>
                <span className="text-2xl font-extrabold text-slate-900">{stats.avg}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Nilai Tertinggi</span>
                <span className="text-2xl font-extrabold text-emerald-600">{stats.max}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Nilai Terendah</span>
                <span className="text-2xl font-extrabold text-rose-600">{stats.min}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Tingkat Kelulusan</span>
                  <span className="text-2xl font-extrabold text-indigo-600">{stats.passRate}%</span>
                </div>
                <div className="relative w-10 h-10 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="20" cy="20" r="16" stroke="#e2e8f0" strokeWidth="4" fill="transparent"/>
                    <circle cx="20" cy="20" r="16" stroke="#4f46e5" strokeWidth="4" fill="transparent"
                      strokeDasharray={100} strokeDashoffset={100 - stats.passRate}/>
                  </svg>
                </div>
              </div>
            </div>

            {/* GRADES TABLE */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3 pl-4">Siswa</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">Sesi Ujian</th>
                      <th className="p-3">Pelanggaran Tab</th>
                      <th className="p-3">Tanggal Selesai</th>
                      <th className="p-3 pr-4 text-right">Nilai Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {attempts
                      .filter(a => {
                        const student = users.find(s => s.id === a.studentId);
                        const isMyClass = user.kelas ? student?.kelas === user.kelas : student?.kelas === selectedClass;
                        const matchesExam = selectedGradeExamId === 'all' || a.examId === selectedGradeExamId;
                        return isMyClass && matchesExam;
                      })
                      .map(a => {
                        const exam = exams.find(e => e.id === a.examId);
                        const isPass = a.score >= 70;
                        return (
                          <tr key={a.id} className="hover:bg-slate-50/30">
                            <td className="p-3 pl-4 font-semibold text-slate-900">{a.studentName}</td>
                            <td className="p-3 font-mono text-slate-500">{users.find(s => s.id === a.studentId)?.username || ''}</td>
                            <td className="p-3 font-medium text-slate-800">{exam?.title || ''}</td>
                            <td className="p-3">
                              {a.violations > 0 ? (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" /> {a.violations} Pelanggaran
                                </span>
                              ) : (
                                <span className="text-slate-400">Tidak ada</span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-slate-400">{a.date}</td>
                            <td className="p-3 pr-4 text-right">
                              <span className={`text-sm font-extrabold px-3 py-1 rounded-xl
                                ${isPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {a.score}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    {attempts.filter(a => {
                      const student = users.find(s => s.id === a.studentId);
                      const isMyClass = user.kelas ? student?.kelas === user.kelas : student?.kelas === selectedClass;
                      const matchesExam = selectedGradeExamId === 'all' || a.examId === selectedGradeExamId;
                      return isMyClass && matchesExam;
                    }).length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">Belum ada siswa yang menyelesaikan ujian terpilih.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// Custom Close Icon Helper
function XIcon({ className }) {
  return <X className={className} />;
}

// ==========================================
// EXAM EDITOR SUB-COMPONENT (Inline inside Dashboard)
// ==========================================
function AdminExamEditor({ examId, exam, questions, setQuestions, onBack, showNotif }) {
  const [editingData, setEditingData] = useState(null);
  const [showConfirmDeleteQ, setShowConfirmDeleteQ] = useState(null);

  const downloadQuestionTemplate = () => {
    const csvContent = "Tipe(PG/ISIAN);Teks Soal;Opsi A;Opsi B;Opsi C;Opsi D;Kunci Jawaban\nPG;Siapa nama presiden RI pertama?;Soekarno;Soeharto;Habibie;Gusdur;A\nISIAN;Berapakah hasil dari 12 dikali 12?;;;;;144";
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "template_soal_cbt.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotif('Template soal berhasil diunduh');
  };

  const handleQuestionUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length <= 1) {
        showNotif('CSV Kosong atau salah format', 'error');
        return;
      }

      const newQs = [];
      const parseCSVLine = (t) => {
        let ret = [], keep = false, cur = '';
        for (let i = 0; i < t.length; i++) {
          let c = t[i];
          if (c === '"') { keep = !keep; continue; }
          if (c === ';' && !keep) { ret.push(cur.trim()); cur = ''; continue; }
          cur += c;
        }
        ret.push(cur.trim());
        return ret;
      };

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length >= 7) {
          const type = cols[0].toUpperCase() === 'ISIAN' ? 'isian' : 'pg';
          newQs.push({
            id: 'q_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 5),
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
      showNotif(`Berhasil mengimpor ${newQs.length} soal ke ujian ini!`, 'success');
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddNewQuestion = () => {
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

  const handleSaveQuestion = () => {
    if (!editingData.text.trim()) {
      showNotif('Teks soal wajib diisi', 'error');
      return;
    }

    const cleanedQuestion = {
      id: editingData.id,
      examId: examId,
      type: editingData.type,
      text: editingData.text.trim(),
      options: editingData.type === 'pg' ? editingData.options : [],
      correctAnswer: editingData.correctAnswer.trim()
    };

    if (editingData.isNew) {
      setQuestions(prev => [...prev, cleanedQuestion]);
      showNotif('Soal baru berhasil ditambahkan', 'success');
    } else {
      setQuestions(prev => prev.map(q => q.id === editingData.id ? cleanedQuestion : q));
      showNotif('Perubahan soal disimpan', 'success');
    }

    setEditingData(null);
  };

  const handleDeleteQuestion = (qId) => {
    setQuestions(prev => prev.filter(q => q.id !== qId));
    setShowConfirmDeleteQ(null);
    showNotif('Soal berhasil dihapus', 'info');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kelola Soal</h2>
          <p className="text-xs text-slate-500 mt-0.5">Ujian: <strong className="text-slate-800">{exam?.title}</strong></p>
        </div>
      </div>

      {/* ACTION HEADER FOR QUESTIONS */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-wrap justify-between items-center gap-4">
        <span className="text-xs font-bold text-slate-600">Terdaftar: {questions.length} Soal</span>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleAddNewQuestion} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-150">
            <Plus className="w-4 h-4" /> Tambah Soal
          </button>
          <button 
            onClick={downloadQuestionTemplate} 
            className="bg-slate-150 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 bg-white">
            <Download className="w-4 h-4" /> Template CSV
          </button>
          <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-50">
            <Upload className="w-4 h-4" /> Impor CSV Soal
            <input type="file" accept=".csv" className="hidden" onChange={handleQuestionUpload} />
          </label>
        </div>
      </div>

      {/* QUESTION EDITING MODAL / FORM PANEL */}
      {editingData && (
        <div className="bg-slate-50/80 backdrop-blur-sm p-6 rounded-2xl border border-indigo-150/80 shadow-lg space-y-4 animate-slideDown">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <h4 className="font-extrabold text-slate-900">{editingData.isNew ? 'Tambah Soal Baru' : 'Edit Pertanyaan'}</h4>
            <button onClick={() => setEditingData(null)} className="p-1 hover:bg-slate-200 text-slate-500 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Tipe Pertanyaan</label>
              <select 
                className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                value={editingData.type}
                onChange={e => setEditingData({ ...editingData, type: e.target.value })}>
                <option value="pg">Pilihan Ganda (PG)</option>
                <option value="isian">Isian Singkat</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Kunci Jawaban</label>
              {editingData.type === 'pg' ? (
                <select 
                  className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500 font-bold"
                  value={editingData.correctAnswer}
                  onChange={e => setEditingData({ ...editingData, correctAnswer: e.target.value })}>
                  <option value="A">Opsi A</option>
                  <option value="B">Opsi B</option>
                  <option value="C">Opsi C</option>
                  <option value="D">Opsi D</option>
                </select>
              ) : (
                <input 
                  type="text" 
                  placeholder="Kunci Jawaban Singkat"
                  className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500" 
                  value={editingData.correctAnswer}
                  onChange={e => setEditingData({ ...editingData, correctAnswer: e.target.value })}
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Teks Pertanyaan</label>
              <textarea 
                rows="3"
                placeholder="Teks soal... (Mendukung rumus LaTeX sederhana seperti $x^2$)"
                className="border border-slate-200 p-2.5 rounded-xl bg-white text-sm focus:outline-none focus:border-indigo-500" 
                value={editingData.text}
                onChange={e => setEditingData({ ...editingData, text: e.target.value })}
              />
            </div>
          </div>

          {editingData.type === 'pg' && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <h5 className="text-[10px] font-bold text-slate-600 uppercase">Pilihan Jawaban (A - D)</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {editingData.options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-500 text-sm">{opt.id}.</span>
                    <input 
                      type="text" 
                      placeholder={`Jawaban Pilihan ${opt.id}`}
                      className="flex-1 border border-slate-200 p-2 rounded-xl bg-white text-xs focus:outline-none focus:border-indigo-500" 
                      value={opt.text}
                      onChange={e => {
                        const newOpts = [...editingData.options];
                        newOpts[i].text = e.target.value;
                        setEditingData({ ...editingData, options: newOpts });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button onClick={() => setEditingData(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-all">
              Batal
            </button>
            <button onClick={handleSaveQuestion} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all">
              Simpan Soal
            </button>
          </div>
        </div>
      )}

      {/* QUESTIONS LISTING */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative hover:border-indigo-100 transition-colors">
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={() => setEditingData({ ...q, isNew: false })} 
                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                title="Edit Soal">
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setShowConfirmDeleteQ(q.id)} 
                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all"
                title="Hapus Soal">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-start gap-3">
              <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[10px] shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="flex-1 space-y-3">
                <p className="text-sm font-semibold text-slate-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.text }} />

                {q.type === 'pg' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {q.options.map(opt => (
                      <div 
                        key={opt.id} 
                        className={`p-2.5 rounded-xl border
                          ${q.correctAnswer === opt.id ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50/50 border-slate-100 text-slate-600'}`}>
                        {opt.id}. {opt.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl inline-block">
                    Kunci Jawaban Singkat: {q.correctAnswer}
                  </div>
                )}
              </div>
            </div>

            {/* CONFIRM DELETE PANEL */}
            {showConfirmDeleteQ === q.id && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-3 animate-fadeIn">
                <span className="text-xs font-extrabold text-slate-800">Yakin ingin menghapus soal ini?</span>
                <button onClick={() => handleDeleteQuestion(q.id)} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all">
                  Ya, Hapus
                </button>
                <button onClick={() => setShowConfirmDeleteQ(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">
                  Batal
                </button>
              </div>
            )}
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Ujian ini belum memiliki soal. Silakan tambah atau impor soal via CSV.</p>
          </div>
        )}
      </div>
    </div>
  );
}
