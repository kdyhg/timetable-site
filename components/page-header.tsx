import { ChevronRight } from "lucide-react";
import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function PageHeader({
  eyebrow,
  title,
  description,
  crumbs = [],
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8">
      {crumbs.length > 0 && (
        <nav className="mb-5 flex flex-wrap items-center gap-1 text-xs text-[#787774]">
          {crumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3 w-3" />}
              {crumb.href ? (
                <Link href={crumb.href} className="rounded px-1 py-0.5 hover:bg-[#e9e9e7]">
                  {crumb.label}
                </Link>
              ) : (
                <span className="px-1 py-0.5">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold text-[#787774]">{eyebrow}</p>
          )}
          <h1 className="text-3xl font-bold leading-tight text-[#191919] md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[#615d59]">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
