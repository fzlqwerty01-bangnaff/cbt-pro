import React from 'react';
import { BookOpen, CheckCircle, Clock, Calendar, AlertCircle, Award } from 'lucide-react';

export default function StudentDashboard({ user, exams, attempts, onStartExam }) {
  // Stats
  const completedAttempts = attempts.filter(a => a.studentId === user.id);
  const totalCompleted = completedAttempts.length;
  
  const averageScore = totalCompleted > 0 
    ? Math.round(completedAttempts.reduce((acc, a) => acc + a.score, 0) / totalCompleted) 
    : 0;

  const activeExamsCount = exams.filter(e => e.status === 'active' && !attempts.some(a => a.examId === e.id)).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center">
          <BookOpen className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-3 max-w-xl">
          <span className="bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
            Siswa CBT Pro • Kelas {user.kelas}
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Selamat Datang, {user.name}!</h2>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Periksa jadwal ujian aktif di bawah ini. Harap kerjakan ujian tepat waktu dan patuhi peraturan proctoring (dilarang keluar dari tab pengerjaan).
          </p>
        </div>
      </div>

      {/* Grid Quick Info Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 p-3.5 rounded-xl text-indigo-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ujian Aktif</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{activeExamsCount} Sesi</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3.5 rounded-xl text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ujian Selesai</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalCompleted} Sesi</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 p-3.5 rounded-xl text-amber-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nilai Rata-rata</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{averageScore} / 100</span>
          </div>
        </div>
      </div>

      {/* Exams Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Daftar Jadwal & Sesi Ujian</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map(ex => {
            const pastAttempt = attempts.find(a => a.examId === ex.id);
            const isPass = pastAttempt && pastAttempt.score >= 70;

            return (
              <div 
                key={ex.id} 
                className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300
                  ${pastAttempt ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-100'}`}>
                
                <div className="space-y-4">
                  {/* Status Badges */}
                  <div className="flex justify-between items-center">
                    {pastAttempt ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Selesai Dikerjakan
                      </span>
                    ) : ex.status === 'active' ? (
                      <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        Ujian Aktif
                      </span>
                    ) : ex.status === 'finished' ? (
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Telah Berakhir
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Belum Dimulai (Draft)
                      </span>
                    )}
                    
                    <span className="text-xs font-semibold text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {ex.date}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-lg leading-snug tracking-tight">
                      {ex.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {ex.description || 'Petunjuk umum: Baca doa sebelum mengerjakan, pilih opsi yang menurut Anda benar, dan jawab dengan jujur.'}
                    </p>
                  </div>

                  {/* Info block */}
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" /> {ex.duration} Menit
                    </span>
                    <span className="text-slate-400">•</span>
                    <span>Target Kelas: {ex.kelas}</span>
                  </div>
                </div>

                {/* Footer Action or Score representation */}
                <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center">
                  {pastAttempt ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs text-slate-500 font-semibold">Ujian tersimpan</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Nilai Anda</span>
                        <span className={`text-xl font-black font-mono
                          ${isPass ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {pastAttempt.score}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end w-full">
                      {ex.status === 'active' ? (
                        <button 
                          onClick={() => onStartExam(ex.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-150 flex items-center gap-1">
                          Mulai Ujian
                        </button>
                      ) : ex.status === 'finished' ? (
                        <button 
                          disabled 
                          className="bg-slate-100 text-slate-400 font-bold text-xs px-5 py-2.5 rounded-xl cursor-not-allowed">
                          Ujian Ditutup
                        </button>
                      ) : (
                        <button 
                          disabled 
                          className="bg-slate-100 text-slate-400 font-bold text-xs px-5 py-2.5 rounded-xl cursor-not-allowed flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Belum Dibuka
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}

          {exams.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-400 text-sm">Belum ada ujian terjadwal untuk kelas Anda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
