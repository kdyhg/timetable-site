'use client';

import { useState } from 'react';

export default function ClassDashboard() {
  const [view, setView] = useState<'home' | 'timetable'>('home');
  const [studentId, setStudentId] = useState('');
  const [viewPath, setViewPath] = useState('');

  // 시간표 조회 로직
  const handleSearch = () => {
    if (!studentId.trim()) {
      alert('학번을 입력해주세요.');
      return;
    }
    setViewPath(`/timetables/${studentId}.png`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 상단 네비게이션 바 */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-extrabold text-blue-600 cursor-pointer" onClick={() => setView('home')}>
          해강고 2학년 10반 전용 사이트
        </h1>
        <div className="text-sm text-slate-500 font-medium">2026학년도 1학기</div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        {view === 'home' ? (
          /* 메인 대시보드 화면 */
          <section>
            <h2 className="text-2xl font-bold mb-6">학급 활동 메뉴</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* 기능 카드 1: 시간표 다운로드 */}
              <div 
                onClick={() => setView('timetable')}
                className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                  <span className="text-2xl group-hover:filter group-hover:invert">📅</span>
                </div>
                <h3 className="text-lg font-bold mb-2">시간표 배경화면</h3>
                <p className="text-slate-500 text-sm">자신의 학번을 입력하여 개별 시간표 이미지를 다운로드하세요.</p>
              </div>

              {/* 기능 카드 2: (예시) 향후 추가 기능 */}
              <div className="bg-slate-100 p-6 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                <span className="text-3xl mb-2">+</span>
                <p className="text-sm font-medium">준비 중인 기능</p>
              </div>

            </div>
          </section>
        ) : (
          /* 시간표 다운로드 상세 화면 */
          <section className="max-w-md mx-auto">
            <button 
              onClick={() => { setView('home'); setViewPath(''); setStudentId(''); }}
              className="mb-4 text-blue-600 font-medium hover:underline flex items-center"
            >
              ← 돌아가기
            </button>
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
              <h2 className="text-2xl font-bold text-center mb-2">시간표 조회</h2>
              <p className="text-center text-slate-500 mb-8 text-sm">학번 8자리를 입력하세요.</p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="예: 20260101"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
                <button
                  onClick={handleSearch}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  시간표 불러오기
                </button>
              </div>

              {viewPath && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="rounded-2xl overflow-hidden border-4 border-slate-50 shadow-inner mb-6">
                    <img
                      src={viewPath}
                      alt="시간표"
                      className="w-full h-auto"
                      onError={() => {
                        alert('이미지를 찾을 수 없습니다.');
                        setViewPath('');
                      }}
                    />
                  </div>
                  <a
                    href={viewPath}
                    download={`${studentId}_timetable.png`}
                    className="block w-full bg-emerald-500 text-white text-center py-4 rounded-xl font-bold hover:bg-emerald-600 transition-all"
                  >
                    이미지 저장하기
                  </a>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}