export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-9 text-center">
      <div className="mx-auto mb-[18px] h-px w-8 bg-border" />
      <p className="text-[13.5px] font-medium">{title}</p>
      <p className="mt-0.5 mb-4 text-[13px] text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
