import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, Flag } from 'lucide-react';

export default function ExamRunner({ exam, questions, user, showNotif, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Load answers from localStorage or default empty
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem(`answers_${user.id}_${exam.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Load doubtful/flagged questions
  const [doubtful, setDoubtful] = useState(() => {
    const saved = localStorage.getItem(`doubtful_${user.id}_${exam.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Load remaining time (in seconds)
  const [timeLeft, setTimeLeft] = useState(() => {
    const savedTime = localStorage.getItem(`time_${user.id}_${exam.id}`);
    if (savedTime) return parseInt(savedTime);
    return exam ? exam.duration * 60 : 0;
  });

  // Proctoring violations counter
  const [violations, setViolations] = useState(0);
  const [showProctorModal, setShowProctorModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Sync answers & time with localStorage
  useEffect(() => {
    localStorage.setItem(`answers_${user.id}_${exam.id}`, JSON.stringify(answers));
    localStorage.setItem(`time_${user.id}_${exam.id}`, timeLeft);
    localStorage.setItem(`doubtful_${user.id}_${exam.id}`, JSON.stringify(doubtful));
  }, [answers, timeLeft, doubtful, exam.id, user.id]);

  // Tab switch (proctoring alert) listener
  useEffect(() => {
    const handleWindowBlur = () => {
      // Increment violations
      setViolations(prev => {
        const next = prev + 1;
        showNotif(`Peringatan Proctoring! Anda keluar dari tab ujian (${next} kali)`, 'error');
        setShowProctorModal(true);
        return next;
      });
    };

    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [showNotif]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const toggleDoubtful = (qId) => {
    setDoubtful(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const selectAnswer = (qId, optionId) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optionId
    }));
  };

  const handleTextAnswerChange = (qId, text) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: text
    }));
  };

  const handleSubmitExam = () => {
    // 1. Calculate final score
    let correctCount = 0;
    questions.forEach(q => {
      const studentAns = answers[q.id] || '';
      const correctAns = q.correctAnswer || '';
      
      if (q.type === 'isian') {
        if (studentAns.trim().toLowerCase() === correctAns.trim().toLowerCase()) {
          correctCount++;
        }
      } else {
        if (studentAns === correctAns) {
          correctCount++;
        }
      }
    });

    const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

    // 2. Call parent callback
    onFinish(score, violations);

    // 3. Clear temporary localStorage items
    localStorage.removeItem(`answers_${user.id}_${exam.id}`);
    localStorage.removeItem(`time_${user.id}_${exam.id}`);
    localStorage.removeItem(`doubtful_${user.id}_${exam.id}`);
  };

  if (!exam || !questions || questions.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 max-w-md mx-auto my-12 shadow-md">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="font-extrabold text-slate-800 text-lg">Soal Tidak Ditemukan</h3>
        <p className="text-xs text-slate-400 mt-2">Ujian ini belum memiliki soal terdaftar. Harap hubungi guru/operator Anda.</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // Time Formatter
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isTimeCritical = timeLeft < 300; // less than 5 mins

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col gap-6 select-none">
      
      {/* TOP STATUS BAR */}
      <header className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{exam.title}</h2>
          <p className="text-xs text-slate-400 mt-1">Siswa: <strong className="text-slate-700">{user.name}</strong> • Kelas: {user.kelas}</p>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* Progress bar */}
          <div className="hidden md:flex flex-col gap-1 items-end w-40">
            <span className="text-[10px] font-bold text-slate-500">Progres: {answeredCount} / {totalQuestions} Soal</span>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
              <div style={{ width: `${progressPercent}%` }} className="bg-indigo-600 h-full rounded-full transition-all duration-300"></div>
            </div>
          </div>

          {/* Time Counter Widget */}
          <div className={`px-5 py-3 rounded-2xl font-mono text-lg font-black flex items-center gap-2.5 transition-all duration-300 border
            ${isTimeCritical 
              ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse shadow-md shadow-rose-50' 
              : 'bg-slate-50 border-slate-100 text-slate-800'}`}>
            <Clock className={`w-5 h-5 ${isTimeCritical ? 'text-rose-500' : 'text-slate-500'}`} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* DUAL-PANEL LAYOUT */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        
        {/* LEFT PANEL: QUESTION NAVIGATOR GRID */}
        <aside className="w-full lg:w-72 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 shrink-0 order-2 lg:order-1">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Navigasi Soal</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Klik nomor untuk melompat langsung ke soal.</p>
          </div>

          {/* Question Grid */}
          <div className="grid grid-cols-5 gap-2.5">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
              const isDoubt = doubtful[q.id];
              const isCurrent = currentIndex === idx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full aspect-square rounded-xl text-sm font-bold flex items-center justify-center transition-all duration-200 border-2
                    ${isCurrent 
                      ? 'border-indigo-600 ring-2 ring-indigo-100 scale-105' 
                      : 'border-transparent'}
                    ${isDoubt 
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-100' 
                      : isAnswered 
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend indicator */}
          <div className="border-t border-slate-100 pt-4 space-y-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-emerald-500"></span>
              <span>Sudah Dijawab</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-amber-500"></span>
              <span>Ragu-ragu (Ditandai)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-slate-100"></span>
              <span>Belum Dijawab</span>
            </div>
          </div>
        </aside>

        {/* CENTER PANEL: QUESTION DISPLAY & CONTROL */}
        <section className="flex-1 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col justify-between order-1 lg:order-2 space-y-6">
          
          {/* Question Text */}
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Soal Nomor {currentIndex + 1}</span>
              <button 
                onClick={() => toggleDoubtful(currentQ.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border
                  ${doubtful[currentQ.id] 
                    ? 'bg-amber-500 border-amber-400 text-white' 
                    : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}>
                <Flag className="w-3.5 h-3.5" />
                {doubtful[currentQ.id] ? 'Ragu-ragu Aktif' : 'Tandai Ragu-ragu'}
              </button>
            </div>

            {/* Question description */}
            <div 
              className="text-base md:text-lg font-semibold text-slate-800 leading-relaxed font-sans pr-2"
              dangerouslySetInnerHTML={{ __html: currentQ.text }}
            />

            {/* Answer Options Panel */}
            <div className="space-y-3 pt-3">
              {currentQ.type === 'pg' ? (
                currentQ.options.map(opt => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <div 
                      key={opt.id}
                      onClick={() => selectAnswer(currentQ.id, opt.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-3 group
                        ${isSelected 
                          ? 'border-indigo-600 bg-indigo-50/20 text-indigo-950 font-bold shadow-md shadow-indigo-50' 
                          : 'border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'}`}>
                      
                      <span className={`w-8 h-8 rounded-full border-2 font-bold flex items-center justify-center text-xs transition-all duration-200
                        ${isSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'bg-white border-slate-200 text-slate-500 group-hover:border-slate-400'}`}>
                        {opt.id}
                      </span>
                      
                      <span className="text-sm font-medium text-slate-700 leading-snug">{opt.text}</span>
                    </div>
                  );
                })
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Jawaban Isian Singkat</label>
                  <textarea 
                    placeholder="Tuliskan jawaban Anda di sini secara singkat dan tepat..."
                    className="w-full border-2 border-slate-200 focus:border-indigo-500 p-4 rounded-2xl text-sm focus:outline-none bg-slate-50/30"
                    rows="4" 
                    value={answers[currentQ.id] || ''}
                    onChange={e => handleTextAnswerChange(currentQ.id, e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400">Pastikan penulisan kata kunci/angka sesuai instruksi soal.</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Controls footer */}
          <div className="border-t border-slate-150 pt-5 flex justify-between items-center gap-3">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl transition-all flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Sebelumnya
            </button>

            {currentIndex === totalQuestions - 1 ? (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-emerald-50 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Akhiri & Kumpulkan Ujian
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all flex items-center gap-1">
                Selanjutnya <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>
      </div>

      {/* PROCTORING SWITCH TAB MODAL */}
      {showProctorModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full border border-rose-100 shadow-2xl text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">Pelanggaran Proctoring Terdeteksi!</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Anda dilarang berpindah aplikasi, membuka tab browser baru, atau meninggalkan halaman ujian. Aktivitas ini dicatat sistem dan dikirimkan ke laporan guru pengawas.
            </p>
            <div className="bg-rose-50/50 p-3 rounded-xl text-rose-700 font-bold text-xs border border-rose-100 inline-block">
              Pelanggaran saat ini: {violations} kali
            </div>
            <button 
              onClick={() => setShowProctorModal(false)}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm py-3 rounded-2xl transition-all shadow-lg shadow-rose-100">
              Saya Mengerti & Kembali Ujian
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUBMIT EXAM MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-4 animate-scaleUp">
            <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">Kumpulkan Jawaban Ujian?</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Anda telah menjawab {answeredCount} dari total {totalQuestions} pertanyaan. {Object.keys(doubtful).filter(k => doubtful[k]).length} pertanyaan masih ditandai ragu-ragu.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm py-3 rounded-xl transition-all">
                Batal
              </button>
              <button 
                onClick={handleSubmitExam}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-emerald-50">
                Ya, Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
