import React from "react";

interface MobileTableProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  table: React.ReactNode;
  className?: string;
}

export function MobileTable<T>({ items, renderItem, table, className }: MobileTableProps<T>) {
  return (
    <div className={className}>
      {/* Mobile list */}
      <div className="grid grid-cols-1 gap-2 md:hidden">
        {items.map((item, idx) => (
          <React.Fragment key={idx}>{renderItem(item, idx)}</React.Fragment>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        {table}
      </div>
    </div>
  );
}

export default MobileTable;
