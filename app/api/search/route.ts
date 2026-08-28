import { NextRequest } from "next/server";
import { academicCalendarEvents } from "@/app/academic-calendar-data";
import { admissionDocuments } from "@/app/admissions-data";
import { medicalAdmissionsWorkbook } from "@/app/career-data";
import recommendationData from "@/app/data/recommended-subjects.json";
import { jsonData } from "@/lib/api-server";
import { getPublicSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export type SearchResult = {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string;
};

const includes = (values: unknown[], query: string) =>
  values.join(" ").toLocaleLowerCase("ko").includes(query);

const featurePages: Array<SearchResult & { keywords: string }> = [
  {
    id: "feature-evening-study",
    type: "학교생활",
    title: "야간자율학습",
    description: "오늘과 요일별 야간자율학습 참석 예정 명단을 확인합니다.",
    href: "/school/evening-study",
    keywords: "야자 야간자율학습 참석 명단 8교시 1차시 2차시",
  },
  {
    id: "feature-subjects-to-majors",
    type: "진로 탐색",
    title: "과목에서 학과 찾기",
    description: "관심 과목과 연결되는 대학·학과를 찾습니다.",
    href: "/career/2028/subjects-to-majors",
    keywords: "과목 학과 전공 선택과목 핵심과목 권장과목",
  },
  {
    id: "feature-university-map",
    type: "진로 탐색",
    title: "대학 지도",
    description: "대학을 권역과 지역별로 둘러봅니다.",
    href: "/career/2028/university-map",
    keywords: "대학 지도 지역 권역 서울 부산 수도권 영남권 중부권 호남권",
  },
  {
    id: "feature-pathways",
    type: "진로 탐색",
    title: "진로 노선도",
    description: "관심 분야에서 과목과 대표 학과까지 연결해 봅니다.",
    href: "/career/2028/pathways",
    keywords: "진로 노선 계열 전공 공학 인문 사회 자연 의약 보건 교육 예체능",
  },
  {
    id: "feature-grade-converter",
    type: "진학 도구",
    title: "5등급제 → 9등급제 예상 범위",
    description: "부산교육청 401개 기준값으로 예상 범위를 확인합니다.",
    href: "/career/2028/grade-converter",
    keywords: "등급 변환 환산 5등급 9등급 내신",
  },
  {
    id: "feature-monthly-calendar",
    type: "학사일정",
    title: "월간 학사 달력",
    description: "학사일정을 월간 달력으로 확인합니다.",
    href: "/school/calendar",
    keywords: "월간 달력 캘린더 학사일정 일정",
  },
];

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") || "")
    .trim()
    .toLocaleLowerCase("ko");
  if (!query) return jsonData([]);

  const results: SearchResult[] = [];
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });
  const add = (result: SearchResult) => {
    if (results.length < 80) results.push(result);
  };

  featurePages
    .filter((page) => includes([page.title, page.description, page.keywords], query))
    .forEach((page) =>
      add({
        id: page.id,
        type: page.type,
        title: page.title,
        description: page.description,
        href: page.href,
      }),
    );

  academicCalendarEvents
    .filter((event) => includes([event.title], query))
    .slice(0, 12)
    .forEach((event) =>
      add({
        id: `calendar-${event.id}`,
        type: "학사일정",
        title: event.title,
        description: event.date,
        href: "/school/calendar",
      }),
    );

  admissionDocuments
    .filter((document) => includes([document.university, document.regionLabel], query))
    .slice(0, 12)
    .forEach((document) =>
      add({
        id: `admission-${document.id}`,
        type: "대학별 전형",
        title: document.university,
        description: `${document.regionLabel} 2028학년도 대입전형 시행계획`,
        href: "/career/2028/admissions",
      }),
    );

  recommendationData.records
    .filter((row) =>
      includes(
        [
          row.university,
          row.department,
          row.departmentGroup,
          row.coreSubjects,
          row.recommendedSubjects,
          row.note,
        ],
        query,
      ),
    )
    .slice(0, 16)
    .forEach((row) =>
      add({
        id: `subject-${row.id}`,
        type: "핵심·권장과목",
        title: `${row.university} ${row.department}`,
        description: row.coreSubjects || row.recommendedSubjects || row.region,
        href: `/career/2028/recommended-subjects?q=${encodeURIComponent(query)}`,
      }),
    );

  medicalAdmissionsWorkbook.sheets.forEach((sheet) => {
    sheet.rows
      .slice(sheet.headerRowCount)
      .filter((row) => includes(row, query))
      .slice(0, 4)
      .forEach((row, index) =>
        add({
          id: `medical-${sheet.name}-${row[1]}-${index}`,
          type: "의약학계열",
          title: `${row[1] || "대학"} ${sheet.name}`,
          description: row.filter(Boolean).slice(2, 5).join(" · "),
          href: "/career/2028/medical-admissions",
        }),
      );
  });

  const supabase = getPublicSupabase();
  if (supabase) {
    const notices = await supabase.from("notices").select("*").limit(100);
    (notices.data ?? [])
      .filter(
        (row) =>
          (!row.publish_start || row.publish_start <= today) &&
          (!row.publish_end || row.publish_end >= today) &&
          includes([row.title, row.content, row.category], query),
      )
      .slice(0, 12)
      .forEach((row) =>
        add({
          id: `notice-${row.id}`,
          type: "공지",
          title: row.title,
          description: row.content,
          href: "/school/notices",
        }),
      );
  }

  return jsonData(results);
}
