import type { ColumnDef } from '@tanstack/react-table';

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
  const i18n = i[`/library/items`];
  const tableHeaders = i18n.table.headers;
  const tableKeys = Object.keys(tableHeaders) as Array<keyof typeof tableHeaders>;
  const columns: ColumnDef<Item>[] = tableKeys.map((accessorKey) => ({
    accessorKey,
    header: tableHeaders[accessorKey],
    className: 'text-wrap',
  }));

  return (
    <div className={'flex flex-col gap-4'}>
      <div className="flex justify-end">
        <ItemDialog id={''} types={data.types} units={data.units} />
      </div>

      <DataTable data={data.items} columns={columns} />
    </div>
  );
}
