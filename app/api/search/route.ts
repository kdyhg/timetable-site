import { NextRequest } from "next/server";
import { academicCalendarEvents } from "@/app/academic-calendar-data";
import { admissionDocuments } from "@/app/admissions-data";
import { medicalAdmissionsWorkbook } from "@/app/career-data";
import recommendationData from "@/app/data/recommended-subjects.json";
import { staticCareerResources } from "@/app/career-guides-data";
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

  staticCareerResources
    .filter((row) => includes([row.title, row.summary, row.content, ...row.key_points], query))
    .slice(0, 12)
    .forEach((row) =>
      add({
        id: `static-resource-${row.id}`,
        type: `진학 ${row.category}`,
        title: row.title,
        description: row.summary,
        href: "/career/2028/guides",
      }),
    );

  const supabase = getPublicSupabase();
  if (supabase) {
    const [notices, items, resources] = await Promise.all([
      supabase.from("notices").select("*").limit(100),
      supabase.from("class_items").select("*").limit(100),
      supabase.from("career_resources").select("*").limit(100),
    ]);
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
    (items.data ?? [])
      .filter((row) =>
        includes([row.title, row.subject, row.scope, row.preparation, row.details], query),
      )
      .slice(0, 12)
      .forEach((row) =>
        add({
          id: `item-${row.id}`,
          type: row.item_type,
          title: row.title,
          description: [row.date, row.subject, row.scope].filter(Boolean).join(" · "),
          href: "/school/assessments",
        }),
      );
    (resources.data ?? [])
      .filter((row) =>
        includes([row.title, row.summary, ...(row.key_points ?? []), row.content], query),
      )
      .slice(0, 12)
      .forEach((row) =>
        add({
          id: `resource-${row.id}`,
          type: `진학 ${row.category}`,
          title: row.title,
          description: row.summary,
          href: "/career/2028/guides",
        }),
      );
  }

  return jsonData(results);
}
