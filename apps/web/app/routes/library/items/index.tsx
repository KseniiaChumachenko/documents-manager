import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';

import { ErrorBoundary as EB } from '~/components/error-boundary';
import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/ui/data-table';
import { type Item, item, itemType, unit } from '~/database/schema';
import { getTitle, i18n as i } from '~/i18n';
import { ItemDialog } from '~/routes/library/items/item-dialog';

import type { Route } from '../../../../.react-router/types/app/routes/library/items/+types';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

export async function loader({ context }: Route.LoaderArgs) {
  const [items, types, units] = await Promise.all([
    context.db.select().from(item),
    context.db.select().from(itemType),
    context.db.select().from(unit),
  ]);
  return { data: { items, types, units } };
}

export default function Items({ loaderData: { data } }: Route.ComponentProps) {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<Item | null>(null);

  const i18n = i[`/library/items`];
  const tableHeaders = i18n.table.headers;
  const tableKeys = Object.keys(tableHeaders) as Array<keyof typeof tableHeaders>;
  const columns: ColumnDef<Item>[] = tableKeys.map((accessorKey) => ({
    accessorKey,
    header: tableHeaders[accessorKey],
    className: 'text-wrap',
  }));

  const handleOpenAdding = () => {
    setItem(null);
    setOpen(true);
  };
  const handleOpenEditing = (rowId: (typeof data)['items'][0]['id']) => {
    const item = data.items[rowId];
    if (item) {
      setItem(item);
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setItem(null);
  };

  return (
    <div className={'flex flex-col gap-4'}>
      <div className="flex justify-end">
        <Button onClick={handleOpenAdding}>{i18n.actions.primary}</Button>
        <ItemDialog
          open={open}
          onClose={handleClose}
          item={item}
          types={data.types}
          units={data.units}
        />
      </div>

      <DataTable data={data.items} columns={columns} onRowClick={handleOpenEditing} />
    </div>
  );
}

export const ErrorBoundary = EB;
