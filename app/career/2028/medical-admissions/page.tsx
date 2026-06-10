"use client";

import { medicalAdmissionsWorkbook } from "@/app/career-data";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui";
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";

const sheetNames = ["의예", "치의예", "약학", "한의예", "수의예"];
const value = (text = "") => text.trim() && text.trim() !== "미선발" ? text.trim() : "-";

export default function MedicalAdmissionsPage() {
  const [sheetName, setSheetName] = useState(sheetNames[0]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const sheet = medicalAdmissionsWorkbook.sheets.find((item) => item.name === sheetName);
  const records = useMemo(() => !sheet ? [] : sheet.rows.slice(sheet.headerRowCount).map((row, index) => ({
    key: `${sheet.name}-${index}-${row[1]}`,
    region: row[0] || "",
    university: row[1] || "",
    curriculumCount: row[2] || "",
    curriculumMethod: row[3] || "",
    curriculumMinimum: [row[4], row[5]].filter(Boolean).join(" / "),
    schoolRecordCount: row[6] || "",
    schoolRecordMethod: row[7] || "",
    schoolRecordMinimum: [row[8], row[9]].filter(Boolean).join(" / "),
    regularCount: [["가", row[10]], ["나", row[11]], ["다", row[12]]].filter(([, count]) => count).map(([group, count]) => `${group} ${count}`).join(" / "),
    regularMethod: row[13] || "",
    search: row.join(" ").toLowerCase(),
  })).filter((record) => record.university && (!query.trim() || record.search.includes(query.trim().toLowerCase()))), [query, sheet]);

  return (
    <>
      <PageHeader title="의약학계열 전형" description="대학별 의약학계열 모집 정보를 요약해서 확인하세요." crumbs={[{ label: "홈", href: "/" }, { label: "2028 진로진학", href: "/career/2028" }, { label: "의약학계열 전형" }]} actions={<a href={medicalAdmissionsWorkbook.sourceFile} download={medicalAdmissionsWorkbook.downloadName} className="notion-button"><Download className="h-4 w-4" /> 원본 엑셀</a>} />
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg border border-[#e6e6e6] bg-white p-1">
        {sheetNames.map((name) => <button key={name} type="button" onClick={() => { setSheetName(name); setExpanded(null); }} className={`min-w-20 rounded-md px-3 py-2 text-sm font-medium ${sheetName === name ? "bg-[#e9e9e7]" : "text-[#787774] hover:bg-[#f3f3f2]"}`}>{name}</button>)}
      </div>
      <label className="relative mb-5 block max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-[#a39e98]" /><input className="notion-input w-full pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="대학명·전형방법 검색" /></label>
      {records.length ? <div className="grid gap-4 lg:grid-cols-2">{records.map((record) => {
        const open = expanded === record.key;
        return <article key={record.key} className="notion-card overflow-hidden"><button type="button" onClick={() => setExpanded(open ? null : record.key)} className="w-full p-5 text-left hover:bg-[#fbfbfa]"><p className="text-xs text-[#787774]">{record.region}</p><h2 className="mt-1 text-lg font-semibold">{record.university}</h2><div className="mt-4 grid grid-cols-3 gap-2 text-xs"><span className="rounded-md bg-[#f1f1ef] p-2"><b className="block">교과</b>{value(record.curriculumCount)}</span><span className="rounded-md bg-[#f1f1ef] p-2"><b className="block">학종</b>{value(record.schoolRecordCount)}</span><span className="rounded-md bg-[#f1f1ef] p-2"><b className="block">정시</b>{value(record.regularCount)}</span></div></button>{open && <div className="grid gap-4 border-t border-[#e6e6e6] bg-[#fbfbfa] p-5 text-sm md:grid-cols-3"><div><b>교과</b><p className="mt-2 whitespace-pre-line leading-6">{value(record.curriculumMethod)}</p><p className="mt-2 text-xs text-[#787774]">최저 {value(record.curriculumMinimum)}</p></div><div><b>학종</b><p className="mt-2 whitespace-pre-line leading-6">{value(record.schoolRecordMethod)}</p><p className="mt-2 text-xs text-[#787774]">최저 {value(record.schoolRecordMinimum)}</p></div><div><b>정시</b><p className="mt-2 whitespace-pre-line leading-6">{value(record.regularMethod)}</p></div></div>}</article>;
      })}</div> : <EmptyState title="검색 결과가 없습니다." />}
    </>
  );
}
