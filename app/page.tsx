'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const OFFICE_CODE = process.env.NEXT_PUBLIC_OFFICE_CODE || 'C10';
const SCHOOL_CODE = process.env.NEXT_PUBLIC_SCHOOL_CODE || '7150404';

const mealCache = new Map<string, { type: string, menu: string }[]>();

type ViewType = 'home' | 'timetable' | 'notice-list' | 'admin' | 'meal-board' | 'notice-write';

export default function RetroDashboard() {
  const [view, setView] = useState<ViewType>('home');
  const [prevView, setPrevView] = useState<ViewType>('home'); // 로그인 직전 화면 저장용
  
  const [studentId, setStudentId] = useState('');
  const [viewPath, setViewPath] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  
  const [notices, setNotices] = useState<any[]>([]);
  const [meal, setMeal] = useState<string>('오늘의 급식을 불러오는 중...');
  const [loading, setLoading] = useState(true);
  const [isImportant, setIsImportant] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyMeals, setDailyMeals] = useState<{ type: string, menu: string }[]>([]);
  const [isMealLoading, setIsMealLoading] = useState(false);

  const fetchMeal = async () => {
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const res = await fetch(
        `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${today}`
      );
      const data = await res.json();
      
      if (data.mealServiceDietInfo) {
        let menu = data.mealServiceDietInfo[1].row[0].DDISH_NM;
        menu = menu.replace(/[0-9.]/g, '').replace(/<br\/>/g, ', ');
        setMeal(menu);
      } else {
        setMeal("오늘은 급식 정보가 없습니다. (주말/공휴일 등)");
      }
    } catch (err) {
      setMeal("급식 정보를 불러오는데 실패했습니다.");
    }
  };

  const fetchDailyMeals = async (dateStr: string) => {
    const formattedDate = dateStr.replace(/-/g, '');

    if (mealCache.has(formattedDate)) {
      setDailyMeals(mealCache.get(formattedDate) || []);
      return;
    }

    setIsMealLoading(true);
    setDailyMeals([]);
    
    try {
      const res = await fetch(
        `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${formattedDate}`
      );
      const data = await res.json();
      
      let mealsToCache = [];

      if (data.mealServiceDietInfo) {
        const rows = data.mealServiceDietInfo[1].row;
        mealsToCache = rows.map((row: any) => ({
          type: row.MMEAL_SC_NM,
          menu: row.DDISH_NM.replace(/[0-9.]/g, '').replace(/<br\/>/g, ', ')
        }));
      } else {
        mealsToCache = [{ type: "INFO", menu: "해당 날짜의 급식 정보가 존재하지 않습니다." }];
      }

      mealCache.set(formattedDate, mealsToCache);
      setDailyMeals(mealsToCache);

    } catch (err) {
      setDailyMeals([{ type: "ERROR", menu: "급식 데이터를 불러오는 중 오류가 발생했습니다." }]);
    } finally {
      setIsMealLoading(false);
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

  const handleAdminTrigger = () => {
    setClickCount(prev => {
      if (prev + 1 >= 5) {
        setPrevView(view); // 현재 뷰 저장
        setView('admin');
        return 0;
      }
      return prev + 1;
    });
  };

  return (
    <div className="min-h-screen bg-[#f0e7db] text-[#222] font-mono p-4 md:p-8">
      {/* 상단 전광판 */}
      <div className="max-w-4xl mx-auto mb-6 bg-black text-[#00ff41] p-2 border-4 border-gray-600 overflow-hidden shadow-inner">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-sm font-bold uppercase tracking-tighter">
            [TODAY&apos;S LUNCH MENU]: {meal} --- [TODAY&apos;S LUNCH MENU]: {meal}
          </span>
        </div>
      </div>

      <header className="max-w-4xl mx-auto border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12 p-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-black uppercase cursor-pointer" onClick={resetView}>📟 2026 해강고 2학년 10반</h1>
        <div className="bg-yellow-300 border-2 border-black px-3 py-1 font-bold text-xs flex items-center gap-2">
          SYSTEM_ONLINE
          {isAdminAuthenticated && <span className="bg-red-500 text-white px-1 text-[10px]">ADMIN</span>}
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {view === 'home' ? (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div onClick={() => setView('timetable')} className="cursor-pointer bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex flex-col items-center text-center">
              <div className="text-5xl mb-4">📅</div>
              <h2 className="text-2xl font-black mb-2 underline">시간표 조회</h2>
              <p className="font-bold text-gray-500 text-xs italic">GET BACKGROUND</p>
            </div>
            <div onClick={() => { setView('notice-list'); fetchNotices(); }} className="cursor-pointer bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex flex-col items-center text-center">
              <div className="text-5xl mb-4">📢</div>
              <h2 className="text-2xl font-black mb-2 underline">학급 공지사항</h2>
              <p className="font-bold text-gray-500 text-xs italic">CLASS UPDATES</p>
            </div>
            <div onClick={() => { setView('meal-board'); fetchDailyMeals(selectedDate); }} className="cursor-pointer bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex flex-col items-center text-center">
              <div className="text-5xl mb-4">🍱</div>
              <h2 className="text-2xl font-black mb-2 underline">급식 조회</h2>
              <p className="font-bold text-gray-500 text-xs italic">CHECK ALL MEALS</p>
            </div>
          </section>
        ) : view === 'meal-board' ? (
          <section className="max-w-2xl mx-auto bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#00ff41] text-black px-4 py-1 border-b-4 border-black flex justify-between font-bold text-xs tracking-widest">
              <span>MEAL_BOARD.EXE</span>
              <button onClick={resetView}>X</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex space-x-2">
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border-4 border-black p-2 font-bold uppercase"
                />
                <button 
                  onClick={() => fetchDailyMeals(selectedDate)}
                  className="bg-black text-white px-6 font-bold border-4 border-black hover:bg-gray-800 transition-colors"
                >
                  SEARCH
                </button>
              </div>
              
              <div className="space-y-4 min-h-[150px]">
                {isMealLoading ? (
                  <p className="font-bold text-center py-8 animate-pulse text-gray-500">LOADING_DATA...</p>
                ) : dailyMeals.length > 0 ? (
                  dailyMeals.map((m, idx) => (
                    <div key={idx} className="border-4 border-black p-5 bg-yellow-50 relative mt-4">
                      <div className="absolute -top-3 left-4 bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-widest border-2 border-black">
                        {m.type}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed font-bold">{m.menu}</p>
                    </div>
                  ))
                ) : null}
              </div>
              
              <button onClick={resetView} className="w-full bg-black text-white py-3 font-bold mt-4 border-4 border-black hover:bg-gray-800">BACK_TO_HOME</button>
            </div>
          </section>
        ) : view === 'notice-list' ? (
          <section className="max-w-2xl mx-auto bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-yellow-400 text-black px-4 py-1 border-b-4 border-black flex justify-between font-bold text-xs tracking-widest">
              <span>BULLETIN_BOARD.EXE</span>
              <button onClick={resetView}>X</button>
            </div>
            <div className="p-6 space-y-4">
              {isAdminAuthenticated && (
                <button onClick={() => setView('notice-write')} className="w-full bg-blue-600 text-white py-3 font-black border-4 border-black mb-4 hover:bg-blue-700">
                  WRITE_NOTICE 📝
                </button>
              )}
              {notices.map((n) => (
                <div key={n.id} className={`p-4 border-2 border-black ${n.is_important ? 'bg-yellow-100' : 'bg-white'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-gray-400 font-bold">{new Date(n.created_at).toLocaleDateString()}</span>
                    {isAdminAuthenticated && <button onClick={()=>deleteNotice(n.id)} className="text-red-500 text-xs font-bold underline">DELETE</button>}
                  </div>
                  <h4 className="text-lg font-black">{n.is_important ? '🔥 ' : ''}{n.title}</h4>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{n.content}</p>
                </div>
              ))}
              <button onClick={resetView} className="w-full bg-black text-white py-3 font-bold mt-4">BACK_TO_HOME</button>
            </div>
          </section>
        ) : view === 'notice-write' ? (
          <section className="max-w-md mx-auto bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="space-y-4 text-left">
              <h2 className="text-xl font-black italic underline">POST_NOTICE</h2>
              <input id="n_title" type="text" className="w-full border-2 border-black p-2 font-bold" placeholder="제목" />
              <textarea id="n_content" className="w-full border-2 border-black p-2 h-32" placeholder="내용" />
              <label className="flex items-center space-x-2 bg-yellow-100 p-2 border-2 border-black border-dashed cursor-pointer">
                <input type="checkbox" checked={isImportant} onChange={(e)=>setIsImportant(e.target.checked)} className="w-5 h-5 accent-black" />
                <span className="font-bold text-xs">중요 공지 (강조 표시) 🔥</span>
              </label>
              <div className="flex gap-2 mt-4">
                <button onClick={() => {
                  const t = (document.getElementById('n_title') as HTMLInputElement).value;
                  const c = (document.getElementById('n_content') as HTMLTextAreaElement).value;
                  if(t && c) saveNotice(t, c);
                  else alert('제목과 내용을 입력하세요.');
                }} className="flex-1 bg-blue-600 text-white py-3 font-black border-4 border-black">DB_COMMIT</button>
                <button onClick={() => setView('notice-list')} className="flex-1 bg-gray-300 text-black py-3 font-black border-4 border-black">CANCEL</button>
              </div>
            </div>
          </section>
        ) : view === 'admin' ? (
          <section className="max-w-md mx-auto bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            {!isAdminAuthenticated ? (
              <div className="space-y-4">
                <h2 className="text-xl font-black">ADMIN_LOGIN</h2>
                <input type="password" className="w-full border-4 border-black p-2" value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} placeholder="PASSWORD" />
                <button onClick={() => {
                  if (adminPassword === 'Ehddus00__') {
                    setIsAdminAuthenticated(true);
                    setView(prevView); // 로그인 성공 시 직전 화면으로 복귀
                    setAdminPassword('');
                  } else {
                    alert('ACCESS DENIED');
                  }
                }} className="w-full bg-black text-white py-2 font-bold border-4 border-black">ACCESS</button>
                <button onClick={() => setView(prevView)} className="w-full text-xs underline mt-2 text-center block text-gray-500">CANCEL</button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <h2 className="text-xl font-black text-blue-600">ALREADY LOGGED IN</h2>
                <button onClick={() => setView(prevView)} className="w-full bg-black text-white py-3 font-bold border-4 border-black">RETURN_TO_PREVIOUS</button>
                <button onClick={() => { setIsAdminAuthenticated(false); setView('home'); }} className="w-full bg-red-500 text-white py-3 font-bold border-4 border-black mt-2">LOGOUT</button>
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
              
              <button onClick={resetView} className="w-full bg-black text-white py-3 font-bold mt-6 border-4 border-black hover:bg-gray-800">BACK_TO_HOME</button>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-20 text-center text-[10px] font-bold text-gray-400 pb-10">
        COPYRIGHT (C) 2026. DongT. ALL RIGHTS RESERVED
        <span className="cursor-default select-none" onClick={handleAdminTrigger}>.</span>
      </footer>

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