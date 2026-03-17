'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function RetroDashboard() {
  const [view, setView] = useState<'home' | 'timetable' | 'notice-list' | 'admin'>('home');
  const [studentId, setStudentId] = useState('');
  const [viewPath, setViewPath] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  
  const [notices, setNotices] = useState<any[]>([]);
  const [meal, setMeal] = useState<string>('오늘의 급식을 불러오는 중...');
  const [loading, setLoading] = useState(true);
  const [isImportant, setIsImportant] = useState(false);

  // --- 학교 정보 설정 (여기를 본인 학교 코드로 바꾸세요!) ---
  const OFFICE_CODE = "C10"; // 시도교육청코드 (예: 경기도 J10)
  const SCHOOL_CODE = "7150404"; // 학교고유코드 (7자리 숫자)
  // --------------------------------------------------

  // 1. 급식 정보 가져오기 (NEIS API)
  const fetchMeal = async () => {
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD 형식
      const res = await fetch(
        `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${today}`
      );
      const data = await res.json();
      
      if (data.mealServiceDietInfo) {
        let menu = data.mealServiceDietInfo[1].row[0].DDISH_NM;
        // 알러지 정보(숫자) 제거 및 줄바꿈 처리
        menu = menu.replace(/[0-9.]/g, '').replace(/<br\/>/g, ', ');
        setMeal(menu);
      } else {
        setMeal("오늘은 급식 정보가 없습니다. (주말/공휴일 등)");
      }
    } catch (err) {
      setMeal("급식 정보를 불러오는데 실패했습니다.");
    }
  };

  const fetchNotices = async () => {
    setLoading(true);
    const { data } = await supabase.from('notices').select('*').order('is_important', { ascending: false }).order('created_at', { ascending: false });
    if (data) setNotices(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMeal();
    fetchNotices();
  }, []);

  const saveNotice = async (title: string, content: string) => {
    const { error } = await supabase.from('notices').insert([{ title, content, is_important: isImportant }]);
    if (!error) { fetchNotices(); setView('notice-list'); setIsImportant(false); }
  };

  const deleteNotice = async (id: number) => {
    if (confirm('삭제할까요?')) {
      await supabase.from('notices').delete().eq('id', id);
      fetchNotices();
    }
  };

  const resetView = () => { setView('home'); setViewPath(''); setStudentId(''); setClickCount(0); };

  return (
    <div className="min-h-screen bg-[#f0e7db] text-[#222] font-mono p-4 md:p-8">
      {/* 상단 전광판: 오늘의 급식 (Marquee 효과) */}
      <div className="max-w-4xl mx-auto mb-6 bg-black text-[#00ff41] p-2 border-4 border-gray-600 overflow-hidden shadow-inner">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-sm font-bold uppercase tracking-tighter">
            [TODAY&apos;S LUNCH MENU]: {meal} --- [TODAY&apos;S LUNCH MENU]: {meal}
          </span>
        </div>
      </div>

      <header className="max-w-4xl mx-auto border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12 p-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-black uppercase cursor-pointer" onClick={resetView}>📟 2026 해강고 2학년 10반</h1>
        <div className="bg-yellow-300 border-2 border-black px-3 py-1 font-bold text-xs">SYSTEM_ONLINE</div>
      </header>

      <main className="max-w-4xl mx-auto">
        {view === 'home' ? (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div onClick={() => setView('timetable')} className="cursor-pointer bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              <div className="text-5xl mb-4">📅</div>
              <h2 className="text-2xl font-black mb-2 underline">시간표 조회</h2>
              <p className="font-bold text-gray-500 text-sm italic">GET YOUR BACKGROUND IMAGE</p>
            </div>
            <div onClick={() => { setView('notice-list'); fetchNotices(); }} className="cursor-pointer bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              <div className="text-5xl mb-4">📢</div>
              <h2 className="text-2xl font-black mb-2 underline">학급 공지사항</h2>
              <p className="font-bold text-gray-500 text-sm italic">REAL-TIME CLASS UPDATES</p>
            </div>
          </section>
        ) : view === 'notice-list' ? (
          <section className="max-w-2xl mx-auto bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-yellow-400 text-black px-4 py-1 border-b-4 border-black font-bold text-xs tracking-widest">BULLETIN_BOARD.EXE</div>
            <div className="p-6 space-y-4">
              {notices.map((n) => (
                <div key={n.id} className={`p-4 border-2 border-black ${n.is_important ? 'bg-yellow-100' : 'bg-white'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-gray-400 font-bold">{new Date(n.created_at).toLocaleDateString()}</span>
                    {isAdminAuthenticated && <button onClick={()=>deleteNotice(n.id)} className="text-red-500 text-xs font-bold underline">DELETE</button>}
                  </div>
                  <h4 className="text-lg font-black">{n.is_important ? '🔥 ' : ''}{n.title}</h4>
                  <p className="text-sm mt-2">{n.content}</p>
                </div>
              ))}
              <button onClick={resetView} className="w-full bg-black text-white py-3 font-bold mt-4">BACK_TO_HOME</button>
            </div>
          </section>
        ) : view === 'admin' ? (
          <section className="max-w-md mx-auto bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            {!isAdminAuthenticated ? (
              <div className="space-y-4">
                <h2 className="text-xl font-black">ADMIN_LOGIN</h2>
                <input type="password" className="w-full border-4 border-black p-2" value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} placeholder="PASSWORD" />
                <button onClick={()=>{if(adminPassword==='1234')setIsAdminAuthenticated(true); else alert('Error');}} className="w-full bg-black text-white py-2 font-bold">ACCESS</button>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <h2 className="text-xl font-black italic underline">POST_NOTICE</h2>
                <input id="n_title" type="text" className="w-full border-2 border-black p-2 font-bold" placeholder="제목" />
                <textarea id="n_content" className="w-full border-2 border-black p-2 h-32" placeholder="내용" />
                <label className="flex items-center space-x-2 bg-yellow-100 p-2 border-2 border-black border-dashed cursor-pointer">
                  <input type="checkbox" checked={isImportant} onChange={(e)=>setIsImportant(e.target.checked)} className="w-5 h-5 accent-black" />
                  <span className="font-bold text-xs">중요 공지 (강조 표시) 🔥</span>
                </label>
                <button onClick={() => {
                  const t = (document.getElementById('n_title') as HTMLInputElement).value;
                  const c = (document.getElementById('n_content') as HTMLTextAreaElement).value;
                  saveNotice(t, c);
                }} className="w-full bg-blue-600 text-white py-3 font-black border-4 border-black">DB_COMMIT</button>
                <button onClick={()=>setIsAdminAuthenticated(false)} className="w-full text-xs underline mt-4 text-center block">LOGOUT</button>
              </div>
            )}
          </section>
        ) : (
          <section className="max-w-md mx-auto bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-black text-white px-4 py-1 flex justify-between text-xs font-bold"><span>TIMETABLE.EXE</span><button onClick={resetView}>X</button></div>
            <div className="p-8 space-y-6 text-center">
              <input type="text" className="w-full border-4 border-black p-3 font-bold" placeholder="학번 5자리" value={studentId} onChange={(e)=>setStudentId(e.target.value)} />
              <button onClick={() => { if(!studentId.trim()) alert('!'); else setViewPath(`/timetables/${studentId}.png`); }} className="w-full bg-blue-500 text-white border-4 border-black py-4 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all">SEARCH 🔍</button>
              {viewPath && <div className="mt-6 border-t-4 border-dashed border-black pt-6"><img src={viewPath} className="border-4 border-black mb-4 w-full" onError={()=>{alert('!'); setViewPath('');}} /><a href={viewPath} download className="block w-full bg-[#00ff41] border-4 border-black py-4 font-black">SAVE_IMAGE 💾</a></div>}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-20 text-center text-[10px] font-bold text-gray-400 pb-10">
        COPYRIGHT (C) 2026. DongT. ALL RIGHTS RESERVED
        <span className="cursor-default select-none" onClick={() => { setClickCount(prev => { if (prev + 1 >= 5) { setView('admin'); return 0; } return prev + 1; }); }}>.</span>
      </footer>

      {/* Marquee 스타일 정의 */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}