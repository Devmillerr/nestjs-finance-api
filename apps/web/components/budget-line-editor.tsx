'use client';

import { LedgerInput, LedgerSelect } from '@/components/ui/ledger-field';
import { formatCents } from '@/lib/format';
import { Plus, Trash2 } from 'lucide-react';

export interface BudgetLineForm {
  mode: 'product' | 'freeform';
  productId: string;
  title: string;
  priceCents: string;
}

export function emptyBudgetLine(): BudgetLineForm {
  return { mode: 'product', productId: '', title: '', priceCents: '' };
}

interface Product {
  id: string;
  name: string;
  priceCents: number;
}

export function BudgetLineEditor({
  lines,
  products,
  onChange,
  onAdd,
  onRemove,
}: {
  lines: BudgetLineForm[];
  products: Product[];
  onChange: (index: number, patch: Partial<BudgetLineForm>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <div className="border-t border-border">
        {lines.map((line, index) => (
          <div key={index} className="border-b border-border py-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => onChange(index, { mode: 'product' })}
                  className={`text-[12px] font-mono tracking-wide transition-colors ${line.mode === 'product' ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'}`}
                >
                  DEL CATÁLOGO
                </button>
                <button
                  type="button"
                  onClick={() => onChange(index, { mode: 'freeform' })}
                  className={`text-[12px] font-mono tracking-wide transition-colors ${line.mode === 'freeform' ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'}`}
                >
                  ÍTEM LIBRE
                </button>
              </div>
              <button
                type="button"
                aria-label="Quitar línea"
                disabled={lines.length === 1}
                onClick={() => onRemove(index)}
                className="text-muted-foreground/50 transition-colors hover:text-destructive disabled:opacity-30"
              >
                <Trash2 size={15} strokeWidth={1.6} />
              </button>
            </div>

            {line.mode === 'product' ? (
              <LedgerSelect
                value={line.productId}
                onChange={(e) => onChange(index, { productId: e.target.value })}
              >
                <option value="">Seleccioná un producto…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCents(p.priceCents)}
                  </option>
                ))}
              </LedgerSelect>
            ) : (
              <div className="flex gap-4">
                <LedgerInput
                  placeholder="Título del ítem"
                  value={line.title}
                  onChange={(e) => onChange(index, { title: e.target.value })}
                  className="flex-1"
                />
                <LedgerInput
                  type="number"
                  step="0.01"
                  placeholder="Precio"
                  className="w-28 text-right font-mono"
                  value={line.priceCents}
                  onChange={(e) => onChange(index, { priceCents: e.target.value })}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex items-center gap-1.5 text-[13px] text-primary transition-opacity hover:opacity-75"
      >
        <Plus size={14} strokeWidth={1.8} />
        Agregar línea
      </button>
    </div>
  );
}
