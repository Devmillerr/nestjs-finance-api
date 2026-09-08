'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

// Traduce los <option>/<optgroup> hijos (API de <select> nativo, la que ya
// usan todos los formularios) a <SelectItem>/<SelectGroup> de Radix. El
// <option value=""> de placeholder no se traduce a un item -- Radix reserva
// value="" como "nada seleccionado", así que se extrae como el placeholder
// de <SelectValue>.
function parseOptionChildren(children: React.ReactNode) {
  const items: React.ReactNode[] = [];
  let placeholder: React.ReactNode;

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === 'option') {
      const optionProps = child.props as React.ComponentProps<'option'>;
      const optionValue = optionProps.value == null ? '' : String(optionProps.value);
      if (optionValue === '') {
        placeholder = optionProps.children;
        return;
      }
      items.push(
        <SelectItem key={optionValue} value={optionValue} disabled={optionProps.disabled}>
          {optionProps.children}
        </SelectItem>,
      );
      return;
    }

    if (child.type === 'optgroup') {
      const groupProps = child.props as React.ComponentProps<'optgroup'>;
      const groupItems: React.ReactNode[] = [];
      React.Children.forEach(groupProps.children, (opt) => {
        if (!React.isValidElement(opt) || opt.type !== 'option') return;
        const optionProps = opt.props as React.ComponentProps<'option'>;
        const optionValue = optionProps.value == null ? '' : String(optionProps.value);
        if (optionValue === '') return;
        groupItems.push(
          <SelectItem key={optionValue} value={optionValue} disabled={optionProps.disabled}>
            {optionProps.children}
          </SelectItem>,
        );
      });
      if (groupItems.length > 0) {
        items.push(
          <SelectGroup key={String(groupProps.label)}>
            <SelectLabel>{groupProps.label}</SelectLabel>
            {groupItems}
          </SelectGroup>,
        );
      }
    }
  });

  return { items, placeholder };
}

// Select "estilo ledger" (línea inferior, sin caja) sobre Radix Select en
// vez del <select> nativo: el popup de un <select> nativo lo pinta el SO en
// Windows y no respeta el tema oscuro de la página. Mantiene la misma API
// que un <select> normal (value/onChange con <option>/<optgroup> como
// children) para no tocar los formularios que ya lo usan.
export function LedgerSelect({
  className,
  value,
  onChange,
  disabled,
  children,
  name,
  required,
}: Omit<React.ComponentProps<'select'>, 'onChange'> & {
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  const stringValue = value == null ? '' : String(value);
  const { items, placeholder } = parseOptionChildren(children);

  return (
    <Select
      value={stringValue}
      onValueChange={(next) => {
        onChange?.({ target: { value: next, name } } as unknown as React.ChangeEvent<HTMLSelectElement>);
      }}
      disabled={disabled}
      name={name}
      required={required}
    >
      <SelectTrigger
        className={cn(
          ledgerFieldClass,
          'h-auto w-full justify-between rounded-none border-0 border-b border-border bg-transparent px-0 py-1.5 shadow-none',
          !stringValue && 'text-muted-foreground/50',
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{items}</SelectContent>
    </Select>
  );
}
