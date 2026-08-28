"use client";

import {
  BookOpen,
  BookOpenCheck,
  Calculator,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Ellipsis,
  FileSpreadsheet,
  Folder,
  GraduationCap,
  Home,
  Menu,
  MoonStar,
  MapPinned,
  Newspaper,
  Search,
  Route,
  Table2,
  Utensils,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const schoolItems: NavItem[] = [
  { href: "/school/timetable", label: "시간표", icon: Table2 },
  { href: "/school/meals", label: "급식", icon: Utensils },
  { href: "/school/evening-study", label: "야간자율학습", icon: MoonStar },
  { href: "/school/calendar", label: "학사일정", icon: CalendarDays },
  { href: "/school/notices", label: "학급 공지사항", icon: Newspaper },
];

const careerItems: NavItem[] = [
  { href: "/career/2028", label: "2028 진로진학", icon: GraduationCap },
  { href: "/career/2028/admissions", label: "대학별 대입전형", icon: BookOpen },
  {
    href: "/career/2028/medical-admissions",
    label: "의약학계열 전형",
    icon: FileSpreadsheet,
  },
  {
    href: "/career/2028/recommended-subjects",
    label: "핵심·권장과목",
    icon: FileSpreadsheet,
  },
  {
    href: "/career/2028/subjects-to-majors",
    label: "과목에서 학과 찾기",
    icon: BookOpenCheck,
  },
  {
    href: "/career/2028/university-map",
    label: "대학 지도",
    icon: MapPinned,
  },
  {
    href: "/career/2028/pathways",
    label: "진로 노선도",
    icon: Route,
  },
  {
    href: "/career/2028/grade-converter",
    label: "5→9등급 예상 범위",
    icon: Calculator,
  },
];

const primaryItems: NavItem[] = [
  { href: "/", label: "오늘", icon: Home },
  { href: "/school/timetable", label: "시간표", icon: Table2 },
  { href: "/school/meals", label: "급식", icon: Utensils },
  { href: "/school/notices", label: "공지", icon: Newspaper },
];

const isActive = (pathname: string, href: string) => {
  if (href === "/") return pathname === href;
  if (href === "/career/2028") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
};

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex min-h-11 items-center gap-2 rounded-md px-2.5 text-sm transition-colors ${
        active
          ? "bg-[#e9e9e7] font-semibold text-[#191919]"
          : "text-[#615d59] hover:bg-[#efefed] hover:text-[#191919]"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function FolderGroup({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(
    items.some((item) => isActive(pathname, item.href)),
  );
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 text-sm font-medium text-[#615d59] hover:bg-[#efefed] hover:text-[#191919]"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        <Folder className="h-4 w-4" />
        <span>{label}</span>
      </button>
      {open && (
        <div className="ml-4 border-l border-[#e6e6e6] pl-2">
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);
  const closeDrawer = () => setDrawerOpen(false);

  const sidebar = (
    <aside className="flex h-full flex-col bg-[#fbfbfa]">
      <div className="flex min-h-14 items-center justify-between border-b border-[#e6e6e6] px-3">
        <Link
          href="/"
          onClick={closeDrawer}
          className="flex min-w-0 items-center gap-2 rounded-md px-2 py-2 hover:bg-[#efefed]"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#191919] text-xs font-bold text-white">
            H
          </span>
          {!collapsed && (
            <span className="truncate text-sm font-semibold">해강고 2학년 10반</span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="hidden h-11 w-11 items-center justify-center rounded-md text-[#787774] hover:bg-[#efefed] lg:flex"
          title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4 rotate-90" />
          )}
        </button>
        <button
          type="button"
          onClick={closeDrawer}
          className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-[#efefed] lg:hidden"
          aria-label="메뉴 닫기"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {!collapsed ? (
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          <NavLink
            item={{ href: "/", label: "오늘의 학급", icon: Home }}
            pathname={pathname}
            onNavigate={closeDrawer}
          />
          <NavLink
            item={{ href: "/search", label: "통합 검색", icon: Search }}
            pathname={pathname}
            onNavigate={closeDrawer}
          />
          <FolderGroup
            label="학교생활"
            items={schoolItems}
            pathname={pathname}
            onNavigate={closeDrawer}
          />
          <FolderGroup
            label="2028 진로진학"
            items={careerItems}
            pathname={pathname}
            onNavigate={closeDrawer}
          />
        </nav>
      ) : (
        <nav className="flex flex-1 flex-col items-center gap-1 p-2">
          {[
            { href: "/", icon: Home, label: "오늘" },
            { href: "/search", icon: Search, label: "검색" },
            { href: "/school/timetable", icon: Table2, label: "시간표" },
            { href: "/school/meals", icon: Utensils, label: "급식" },
            { href: "/school/evening-study", icon: MoonStar, label: "야간자율학습" },
            { href: "/school/calendar", icon: CalendarDays, label: "학사일정" },
            { href: "/school/notices", icon: Newspaper, label: "공지" },
            { href: "/career/2028", icon: GraduationCap, label: "진로진학" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className="flex h-11 w-11 items-center justify-center rounded-md text-[#615d59] hover:bg-[#efefed]"
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </nav>
      )}
      <button
        type="button"
        aria-label="관리자"
        onClick={() => {
          const next = adminClicks + 1;
          if (next >= 5) {
            setAdminClicks(0);
            router.push("/admin");
            closeDrawer();
          } else {
            setAdminClicks(next);
          }
        }}
        className="h-11 border-t border-[#e6e6e6] text-center text-[8px] text-[#d0ceca]"
      >
        ·
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f6f5f4]">
      <div
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-[#e6e6e6] transition-[width] lg:block ${
          collapsed ? "w-14" : "w-64"
        }`}
      >
        {sidebar}
      </div>

      <nav className="fixed inset-y-0 left-0 z-40 hidden w-14 flex-col items-center gap-1 border-r border-[#e6e6e6] bg-[#fbfbfa] py-2 md:flex lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="mb-2 flex h-11 w-11 items-center justify-center rounded-md hover:bg-[#efefed]"
          aria-label="전체 메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </button>
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex h-11 w-11 items-center justify-center rounded-md ${
                active
                  ? "bg-[#e9e9e7] text-[#191919]"
                  : "text-[#787774] hover:bg-[#efefed]"
              }`}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
        <Link
          href="/career/2028"
          title="진로진학"
          className={`flex h-11 w-11 items-center justify-center rounded-md ${
            pathname.startsWith("/career")
              ? "bg-[#e9e9e7] text-[#191919]"
              : "text-[#787774] hover:bg-[#efefed]"
          }`}
        >
          <GraduationCap className="h-5 w-5" />
        </Link>
      </nav>

      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/25"
          />
          <div className="absolute inset-y-0 left-0 w-[min(86vw,320px)] border-r border-[#e6e6e6] shadow-xl">
            {sidebar}
          </div>
        </div>
      )}

      <div
        className={`min-h-screen transition-[padding] md:pl-14 ${
          collapsed ? "lg:pl-14" : "lg:pl-64"
        }`}
      >
        <main className="mx-auto w-full max-w-[1180px] px-3 py-6 pb-28 sm:px-4 md:px-6 md:py-8 md:pb-10 lg:px-8 lg:py-12">
          {children}
        </main>
      </div>

      <nav className="phone-bottom-nav md:hidden" aria-label="주요 메뉴">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`phone-bottom-link ${
                active ? "text-[#0075de]" : "text-[#787774]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="phone-bottom-link text-[#787774]"
        >
          <Ellipsis className="h-5 w-5" />
          <span>더보기</span>
        </button>
      </nav>
    </div>
  );
}
