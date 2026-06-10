import { PageHeader } from "@/components/page-header";
import { BookOpen, ChevronRight, FileSpreadsheet, ListChecks } from "lucide-react";
import Link from "next/link";

const resources = [
  {
    href: "/career/2028/admissions",
    title: "대학별 대입전형",
    description: "서울·부산 대학의 2028학년도 대입전형 시행계획 PDF",
    icon: BookOpen,
  },
  {
    href: "/career/2028/medical-admissions",
    title: "의약학계열 전형",
    description: "의예·치의예·약학·한의예·수의예 모집 정보",
    icon: FileSpreadsheet,
  },
  {
    href: "/career/2028/recommended-subjects",
    title: "핵심·권장과목",
    description: "권역별 대학·학과의 핵심과목과 권장과목 데이터베이스",
    icon: ListChecks,
  },
];

export default function CareerIndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="2028학년도"
        title="진로진학 자료실"
        description="대입전형 시행계획과 전공별 과목 선택 자료를 확인하세요."
        crumbs={[{ label: "홈", href: "/" }, { label: "2028 진로진학" }]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <Link key={resource.href} href={resource.href} className="notion-card group flex min-h-52 flex-col p-6 hover:bg-[#fbfbfa]">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f3fc] text-[#0075de]">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-6 text-lg font-semibold">{resource.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#787774]">{resource.description}</p>
              <ChevronRight className="mt-auto h-4 w-4 text-[#a39e98] transition-transform group-hover:translate-x-1" />
            </Link>
          );
        })}
      </div>
    </>
  );
}
