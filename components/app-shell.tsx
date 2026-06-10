"use client";

import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  Folder,
  GraduationCap,
  Home,
  Menu,
  Newspaper,
  School,
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
  { href: "/school/timetable", label: "시간표", icon: ClipboardList },
  { href: "/school/meals", label: "급식", icon: Utensils },
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
];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === href : pathname === href;

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
      className={`flex min-h-9 items-center gap-2 rounded-md px-2.5 text-sm transition-colors ${
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
  initiallyOpen,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  initiallyOpen: boolean;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const visibleOpen =
    open || items.some((item) => pathname.startsWith(item.href));

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm font-medium text-[#615d59] hover:bg-[#efefed] hover:text-[#191919]"
      >
        {visibleOpen ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        <Folder className="h-4 w-4" />
        <span>{label}</span>
      </button>
      {visibleOpen && (
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);

  const navigate = () => setMobileOpen(false);
  const sidebar = (
    <aside className="flex h-full flex-col bg-[#fbfbfa]">
      <div className="flex h-14 items-center justify-between border-b border-[#e6e6e6] px-3">
        <Link
          href="/"
          onClick={navigate}
          className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#efefed]"
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
          className="hidden h-8 w-8 items-center justify-center rounded-md text-[#787774] hover:bg-[#efefed] lg:flex"
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
          onClick={() => setMobileOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#efefed] lg:hidden"
          aria-label="메뉴 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!collapsed ? (
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          <NavLink
            item={{ href: "/", label: "홈", icon: Home }}
            pathname={pathname}
            onNavigate={navigate}
          />
          <FolderGroup
            label="학교생활"
            items={schoolItems}
            pathname={pathname}
            initiallyOpen={pathname.startsWith("/school")}
            onNavigate={navigate}
          />
          <FolderGroup
            label="2028 진로진학"
            items={careerItems}
            pathname={pathname}
            initiallyOpen={pathname.startsWith("/career")}
            onNavigate={navigate}
          />
        </nav>
      ) : (
        <nav className="flex flex-1 flex-col items-center gap-1 p-2">
          {[{ href: "/", icon: Home }, { href: "/school/calendar", icon: School }, { href: "/career/2028", icon: GraduationCap }].map(
            (item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-[#615d59] hover:bg-[#efefed]"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            },
          )}
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
          } else {
            setAdminClicks(next);
          }
        }}
        className="h-8 border-t border-[#e6e6e6] text-center text-[8px] text-[#d0ceca]"
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

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/20"
          />
          <div className="absolute inset-y-0 left-0 w-[min(86vw,300px)] border-r border-[#e6e6e6] shadow-xl">
            {sidebar}
          </div>
        </div>
      )}

      <div
        className={`min-h-screen transition-[padding] ${
          collapsed ? "lg:pl-14" : "lg:pl-64"
        }`}
      >
        <header className="sticky top-0 z-30 flex h-12 items-center border-b border-[#e6e6e6] bg-[#f6f5f4]/95 px-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#e9e9e7]"
            aria-label="메뉴 열기"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="ml-2 text-sm font-semibold">해강고 2학년 10반</span>
        </header>
        <main className="mx-auto w-full max-w-[1180px] px-4 py-8 md:px-8 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
