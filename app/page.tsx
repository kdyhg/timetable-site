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
  const [loading, setLoading] = useState(true);
  const [isImportant, setIsImportant] = useState(false); // 강조 상태값

  const fetchNotices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('is_important', { ascending: false }) // 강조된 글을 맨 위로
      .order('created_at', { ascending: false });

    if (!error) setNotices(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchNotices(); }, []);

  // 공지 저장 (강조 여부 포함)
  const saveNotice = async (title: string, content: string) => {
    if (!title || !content) return alert('내용을 입력하세요.');
    const { error } = await supabase.from('notices').insert([{ title, content, is_important: isImportant }]);
    if (error) alert('저장 실패: ' + error.message);
    else {
      alert('공지가 게시되었습니다!');
      setIsImportant(false);
      fetchNotices();
      setView('notice-list');
    }
  };

  // 공지 삭제 함수
  const deleteNotice = async (id: number) => {
    if (!confirm('정말로 이 공지를 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) alert('삭제 실패');
    else {
      alert('삭제되었습니다.');
      fetchNotices();
    }
  };

  const handleSearch = () => {
    if (!studentId.trim()) return alert('학번 입력!');
    setViewPath(`/timetables/${studentId}.png`);
  };

  const resetView = () => {
    setView('home'); setViewPath(''); setStudentId(''); setClickCount(0);
  };

  return (
    <div className="min-h-screen bg-[#f0e7db] text-[#222] font-mono p-4 md:p-8">
      <header className="max-w-4xl mx-auto border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12 p-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-black uppercase cursor-pointer" onClick={resetView}>📟 2026 해강고 2학년 10반</h1>
        <div className="bg-yellow-300 border-2 border-black px-3 py-1 font-bold text-xs">{loading ? 'LOADING' : 'ONLINE'}</div>
      </header>

      <main className="max-w-4xl mx-auto">
        {view === 'home' ? (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div onClick={() => setView('timetable')} className="cursor-pointer bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              <div className="text-5xl mb-4">📅</div>
              <h2 className="text-2xl font-black mb-2 underline">시간표 조회</h2>
            </div>
            <div onClick={() => { setView('notice-list'); fetchNotices(); }} className="cursor-pointer bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              <div className="text-5xl mb-4">📢</div>
              <h2 className="text-2xl font-black mb-2 underline">학급 공지사항</h2>
            </div>
          </section>
        ) : view === 'notice-list' ? (
          <section className="max-w-2xl mx-auto bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-yellow-400 text-black px-4 py-1 border-b-4 border-black font-bold text-xs">NOTICES.TXT</div>
            <div className="p-6 space-y-4 text-left">
              {notices.map((n) => (
                <div key={n.id} className={`p-4 border-2 border-black transition-all ${n.is_important ? 'bg-yellow-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-gray-500">{new Date(n.created_at).toLocaleDateString()}</span>
                    {isAdminAuthenticated && (
                      <button onClick={() => deleteNotice(n.id)} className="text-red-600 font-bold text-xs border-2 border-red-600 px-1 hover:bg-red-100">삭제</button>
                    )}
                  </div>
                  <h4 className="text-lg font-black mt-1">{n.is_important ? '🔥 ' : ''}{n.title}</h4>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{n.content}</p>
                </div>
              ))}
              <button onClick={resetView} className="w-full bg-black text-white py-3 font-bold mt-6">메인으로</button>
            </div>
          </section>
        ) : view === 'admin' ? (
          <section className="max-w-md mx-auto bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            {!isAdminAuthenticated ? (
              <div className="space-y-4">
                <h2 className="text-xl font-black uppercase">Admin Login</h2>
                <input type="password" className="w-full border-4 border-black p-2" value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} placeholder="PASSWORD" />
                <button onClick={()=>{if(adminPassword==='5314')setIsAdminAuthenticated(true);else alert('Error');}} className="w-full bg-black text-white py-2 font-bold">LOGIN</button>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <h2 className="text-xl font-black italic underline">New Notice</h2>
                <input id="n_title" type="text" className="w-full border-2 border-black p-2 font-bold" placeholder="제목" />
                <textarea id="n_content" className="w-full border-2 border-black p-2 h-32" placeholder="내용" />
                <label className="flex items-center space-x-2 cursor-pointer bg-yellow-100 p-2 border-2 border-black border-dashed">
                  <input type="checkbox" checked={isImportant} onChange={(e)=>setIsImportant(e.target.checked)} className="w-5 h-5 accent-black" />
                  <span className="font-bold text-sm">노란색으로 강조하기 🔥</span>
                </label>
                <button onClick={() => {
                  const t = (document.getElementById('n_title') as HTMLInputElement).value;
                  const c = (document.getElementById('n_content') as HTMLTextAreaElement).value;
                  saveNotice(t, c);
                }} className="w-full bg-blue-600 text-white py-3 font-black border-4 border-black">DB 게시</button>
                <button onClick={() => setIsAdminAuthenticated(false)} className="w-full text-xs underline mt-4 text-center block">로그아웃</button>
              </div>
            )}
          </section>
        ) : (
          /* 시간표 상세 (기존 코드 유지) */
          <section className="max-w-md mx-auto bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-black text-white px-4 py-1 flex justify-between text-xs font-bold"><span>TIMETABLE.EXE</span><button onClick={resetView}>X</button></div>
            <div className="p-8 space-y-6 text-center">
              <input type="text" className="w-full border-4 border-black p-3 font-bold" placeholder="학번 5자리" value={studentId} onChange={(e)=>setStudentId(e.target.value)} />
              <button onClick={handleSearch} className="w-full bg-blue-500 text-white border-4 border-black py-4 font-black">조회 🔍</button>
              {viewPath && <div className="mt-6 border-t-4 border-dashed border-black pt-6"><img src={viewPath} className="border-4 border-black mb-4 w-full" onError={()=>{alert('이미지 없음'); setViewPath('');}} /><a href={viewPath} download className="block w-full bg-[#00ff41] border-4 border-black py-4 font-black">저장 💾</a></div>}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-20 text-center text-[10px] font-bold text-gray-400 pb-10">
        COPYRIGHT (C) 2026. Dongt. ALL RIGHTS RESERVED
        <span className="cursor-default select-none" onClick={() => { setClickCount(prev => { if (prev + 1 >= 5) { setView('admin'); return 0; } return prev + 1; }); }}>.</span>
      </footer>
    </div>
  );
}