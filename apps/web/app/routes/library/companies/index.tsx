import type { ColumnDef } from '@tanstack/react-table';
import { eq } from 'drizzle-orm';

import { ErrorBoundary as EB } from '~/components/error-boundary';
import { DataTable } from '~/components/ui/data-table';
import { company } from '~/database/schema';
import type { Company } from '~/database/schema';
import { getTitle, i18n as i } from '~/i18n';

import type { Route } from '../../../../.react-router/types/app/routes/library/companies/+types';

import { AddCompanyDialog } from './add-company-dialog';

type Type = 'client' | 'source';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

export async function loader({ context: { db }, params }: Route.LoaderArgs) {
  const type = params.type as Type;
  const data = await db.select().from(company).where(eq(company.type, type));

  return { data, type };
}

function Component({ loaderData: { data, type } }: Route.ComponentProps) {
  const i18n = i[`/library/${type}`];
  const tableHeaders = i18n.table.headers;
  const tableKeys = Object.keys(tableHeaders) as Array<keyof typeof tableHeaders>;
  const columns: ColumnDef<Company>[] = tableKeys.map((accessorKey) => ({
    accessorKey,
    header: tableHeaders[accessorKey],
    className: 'text-wrap',
  }));

  return (
    <div className={'flex flex-col gap-4'}>
      <div className="flex justify-end">
        <AddCompanyDialog i18n={i18n} type={type} />
      </div>

      <DataTable data={data} columns={columns} />
    </div>
  );
}

export const ErrorBoundary = EB;

export default Component;
