import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="notion-card flex min-h-40 flex-col items-center justify-center p-8 text-center">
      <Inbox className="mb-3 h-6 w-6 text-[#a39e98]" />
      <p className="text-sm font-semibold">{title}</p>
      {description && <p className="mt-1 text-sm text-[#787774]">{description}</p>}
    </div>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-[#787774]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
