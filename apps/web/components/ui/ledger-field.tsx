import { cn } from '@/lib/utils';

export function LedgerLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        'mb-1.5 block font-mono text-[10.5px] tracking-wide text-muted-foreground',
        className,
      )}
    >
      {children}
    </label>
  );
}

export const ledgerFieldClass = cn(
  'w-full border-0 border-b border-border bg-transparent py-1.5 text-[14px] text-foreground outline-none',
  'transition-colors duration-150 ease-[var(--ease-out)] placeholder:text-muted-foreground/50',
  'focus:border-primary disabled:cursor-not-allowed disabled:opacity-50',
);

export function LedgerInput(props: React.ComponentProps<'input'>) {
  const { className, ...rest } = props;
  return <input className={cn(ledgerFieldClass, className)} {...rest} />;
}

export function LedgerSelect(props: React.ComponentProps<'select'>) {
  const { className, ...rest } = props;
  return <select className={cn(ledgerFieldClass, 'cursor-pointer', className)} {...rest} />;
}
