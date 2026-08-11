import { PageHeader } from "@/components/page-header";
import { RandomMajorExplorer } from "@/components/random-major-explorer";
import {
  BookOpen,
  BookOpenCheck,
  Calculator,
  ChevronRight,
  FileSpreadsheet,
  ListChecks,
  MapPinned,
  Route,
} from "lucide-react";
import Link from "next/link";

const referenceResources = [
  {
    href: "/career/2028/admissions",
    title: "대학별 대입전형",
    description: "서울·부산 대학의 2028학년도 대입전형 시행계획 PDF",
    icon: BookOpen,
    iconStyle: "bg-[#e8f3fc] text-[#0075de]",
  },
  {
    href: "/career/2028/medical-admissions",
    title: "의약학계열 전형",
    description: "의예·치의예·약학·한의예·수의예 모집 정보",
    icon: FileSpreadsheet,
    iconStyle: "bg-[#fff0f2] text-[#c83f55]",
  },
  {
    href: "/career/2028/recommended-subjects",
    title: "핵심·권장과목",
    description: "권역별 대학·학과의 핵심과목과 권장과목 데이터베이스",
    icon: ListChecks,
    iconStyle: "bg-[#eaf8f1] text-[#27845b]",
  },
];

const explorationTools = [
  {
    href: "/career/2028/subjects-to-majors",
    title: "과목에서 학과 찾기",
    description: "좋아하는 과목을 골라 연결되는 대학·학과 살펴보기",
    icon: BookOpenCheck,
    iconStyle: "bg-[#e8f3fc] text-[#0075de]",
  },
  {
    href: "/career/2028/university-map",
    title: "대학 지도",
    description: "47개 대학을 권역과 지역별 지도에서 둘러보기",
    icon: MapPinned,
    iconStyle: "bg-[#eaf8f1] text-[#27845b]",
  },
  {
    href: "/career/2028/pathways",
    title: "진로 노선도",
    description: "관심 분야에서 과목과 대표 학과까지 한 흐름으로 보기",
    icon: Route,
    iconStyle: "bg-[#fff6e6] text-[#a65b00]",
  },
  {
    href: "/career/2028/grade-converter",
    title: "5→9등급 예상 범위",
    description: "부산교육청 401개 기준값으로 9등급제 예상 범위 확인",
    icon: Calculator,
    iconStyle: "bg-[#f4efff] text-[#7652b8]",
  },
];

function ResourceGrid({ resources }: { resources: typeof referenceResources }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {resources.map((resource) => {
        const Icon = resource.icon;
        return (
          <Link
            key={resource.href}
            href={resource.href}
            className="notion-card group flex min-h-48 flex-col p-5 hover:bg-[#fbfbfa]"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${resource.iconStyle}`}>
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-base font-semibold">{resource.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#787774]">{resource.description}</p>
            <ChevronRight className="mt-auto h-4 w-4 text-[#a39e98] transition-transform group-hover:translate-x-1" />
          </Link>
        );
      })}
    </div>
  );
}

export default function CareerIndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="2028학년도"
        title="진로진학 자료실"
        description="대입 자료를 확인하고, 과목·지역·관심 분야에서 새로운 학과를 탐색해 보세요."
        crumbs={[{ label: "홈", href: "/" }, { label: "2028 진로진학" }]}
      />
      <section>
        <div className="mb-3">
          <p className="text-xs font-semibold text-[#787774]">원문 자료</p>
          <h2 className="mt-1 text-xl font-semibold">대입 정보 확인</h2>
        </div>
        <ResourceGrid resources={referenceResources} />
      </section>

      <section className="mt-10 border-t border-[#e6e6e6] pt-8">
        <div className="mb-3">
          <p className="text-xs font-semibold text-[#787774]">가볍게 찾아보기</p>
          <h2 className="mt-1 text-xl font-semibold">전공 탐색 도구</h2>
        </div>
        <ResourceGrid resources={explorationTools} />
      </section>
      <RandomMajorExplorer />
    </>
  );
}
