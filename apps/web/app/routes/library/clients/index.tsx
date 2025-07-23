import type { ColumnDef } from '@tanstack/react-table';
import { eq } from 'drizzle-orm';

import { ErrorBoundary as EB } from '~/components/error-boundary';
import { DataTable } from '~/components/ui/data-table';
import { company } from '~/database/schema';
import type { Company } from '~/database/schema';
import { getTitle, i18n as i } from '~/i18n';
import { AddClientDialog } from '~/routes/library/clients/add-client-dialog';

import type { Route } from '../../../../.react-router/types/app/routes/library/clients/+types';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

export async function loader({ context: { db } }: Route.LoaderArgs) {
  const data = await db.select().from(company).where(eq(company.type, 'client'));

  return { data };
}
const i18n = i['/library/clients'];
const tableHeaders = i18n.table.headers;
const tableKeys = Object.keys(tableHeaders) as Array<keyof typeof tableHeaders>;
const columns: ColumnDef<Company>[] = tableKeys.map((accessorKey) => ({
  accessorKey,
  header: tableHeaders[accessorKey],
  className: 'text-wrap',
}));

export default function Clients({ loaderData: { data } }: Route.ComponentProps) {
  return (
    <div className={'flex flex-col gap-4'}>
      <div className="flex justify-end">
        <AddClientDialog />
      </div>

      <DataTable data={data} columns={columns} />
    </div>
  );
}

export const ErrorBoundary = EB;
