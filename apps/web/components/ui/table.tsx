import * as React from 'react';
import { cn } from '@/lib/utils';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return <table className={cn('w-full caption-bottom text-sm', className)} {...props} />;
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={cn('bg-secondary/50 [&_tr]:border-b [&_tr]:border-border', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={className} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors last:border-0 hover:bg-secondary/60',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({
  className,
  align = 'left',
  ...props
}: React.ComponentProps<'th'> & { align?: 'left' | 'right' }) {
  return (
    <th
      className={cn(
        'h-10 px-4 text-[11px] font-medium text-muted-foreground',
        align === 'left' ? 'text-left' : 'text-right',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  align = 'left',
  ...props
}: React.ComponentProps<'td'> & { align?: 'left' | 'right' }) {
  return (
    <td
      className={cn('px-4 py-3 align-middle', align === 'left' ? 'text-left' : 'text-right', className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
