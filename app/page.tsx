'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 환경 변수 안전하게 로드 (빌드 에러 방지)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function RetroDashboard() {
  const [view, setView] = useState<'home' | 'timetable' | 'notice-list' | 'admin'>('home');
  const [studentId, setStudentId] = useState('');
  const [viewPath, setViewPath] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const saveNotice = async (title: string, content: string) => {
    if (!title || !content) return alert('내용을 입력하세요.');
    try {
      const { error } = await supabase.from('notices').insert([{ title, content }]);
      if (error) throw error;
      alert('게시 완료');
      fetchNotices();
      setView('notice-list');
    } catch (err: any) {
      alert('오류: ' + err.message);
    }
  };

  const handleSearch = () => {
    if (!studentId.trim()) return alert('학번 입력 필수');
    setViewPath(`/timetables/${studentId}.png`);
  };

  const resetView = () => {
    setView('home');
    setViewPath('');
    setStudentId('');
    setClickCount(0);
  };

  return (
    <div className="min-h-screen bg-[#f0e7db] text-[#222] font-mono p-4 md:p-8">
      <header className="max-w-4xl mx-auto border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12 p-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-black uppercase cursor-pointer" onClick={resetView}>📟 CLASS_COMM_2026</h1>
        <div className="bg-yellow-300 border-2 border-black px-3 py-1 font-bold text-xs">{loading ? 'LOADING...' : 'DB_ONLINE'}</div>
      </header>

      <main className="max-w-4xl mx-auto">
        {view === 'home' ? (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div onClick={() => setView('timetable')} className="cursor-pointer bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              <div className="text-5xl mb-4">📅</div>
              <h2 className="text-2xl font-black mb-2 underline">시간표 조회</h2>
              <p className="font-bold text-gray-500">배경화면 다운로드</p>
            </div>
            <div onClick={() => { setView('notice-list'); fetchNotices(); }} className="cursor-pointer bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              <div className="text-5xl mb-4">📢</div>
              <h2 className="text-2xl font-black mb-2 underline">학급 공지사항</h2>
              <p className="font-bold text-gray-500">실시간 소식 확인</p>
            </div>
          </section>
        ) : view === 'timetable' ? (
          <section className="max-w-md mx-auto bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-black text-white px-4 py-1 flex justify-between text-xs font-bold"><span>TIMETABLE.EXE</span><button onClick={resetView}>X</button></div>
            <div className="p-8 space-y-6">
              <input type="text" className="w-full border-4 border-black p-3 font-bold outline-none" placeholder="학번 5자리" value={studentId} onChange={(e)=>setStudentId(e.target.value)} />
              <button onClick={handleSearch} className="w-full bg-blue-500 text-white border-4 border-black py-4 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all">조회 🔍</button>
              {viewPath && <div className="mt-6 border-t-4 border-dashed border-black pt-6"><img src={viewPath} className="border-4 border-black mb-4 w-full" onError={()=>{alert('이미지 없음'); setViewPath('');}} /><a href={viewPath} download className="block w-full bg-[#00ff41] border-4 border-black py-4 text-center font-black">저장 💾</a></div>}
            </div>
          </section>
        ) : view === 'notice-list' ? (
          <section className="max-w-2xl mx-auto bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-yellow-400 text-black px-4 py-1 border-b-4 border-black font-bold text-xs">NOTICES.TXT</div>
            <div className="p-6 space-y-6 text-left">
              {notices.map((n) => (
                <div key={n.id} className="border-b-2 border-black pb-4">
                  <span className="text-[10px] font-bold text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                  <h4 className="text-lg font-black">{n.title}</h4>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{n.content}</p>
                </div>
              ))}
              <button onClick={resetView} className="w-full bg-black text-white py-3 font-bold mt-4">메인으로</button>
            </div>
          </section>
        ) : (
          <section className="max-w-md mx-auto bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            {!isAdminAuthenticated ? (
              <div className="space-y-4">
                <h2 className="text-xl font-black uppercase underline">Admin Access</h2>
                <input type="password" className="w-full border-4 border-black p-2" value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} placeholder="PASSWORD" />
                <button onClick={()=>{if(adminPassword==='1234')setIsAdminAuthenticated(true);else alert('Error');}} className="w-full bg-black text-white py-2 font-bold shadow-[4px_4px_0px_0px_rgba(100,100,100,1)]">LOGIN</button>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <h2 className="text-xl font-black underline italic">Post Notice</h2>
                <input id="n_title" type="text" className="w-full border-2 border-black p-2 font-bold" placeholder="제목" />
                <textarea id="n_content" className="w-full border-2 border-black p-2 h-32" placeholder="내용" />
                <button onClick={() => {
                  const t = (document.getElementById('n_title') as HTMLInputElement).value;
                  const c = (document.getElementById('n_content') as HTMLTextAreaElement).value;
                  saveNotice(t, c);
                }} className="w-full bg-blue-600 text-white py-3 font-black border-4 border-black">DB 전송</button>
                <button onClick={() => setIsAdminAuthenticated(false)} className="w-full text-xs underline mt-2 text-center block">로그아웃</button>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="mt-20 text-center text-[10px] font-bold text-gray-400 pb-10">
        COPYRIGHT (C) 2026. CLASS_ADMIN_SITE. ALL RIGHTS RESERVED
        <span className="cursor-default select-none" onClick={() => { setClickCount(prev => { if (prev + 1 >= 5) { setView('admin'); return 0; } return prev + 1; }); }}>.</span>
      </footer>
    </div>
  );
}