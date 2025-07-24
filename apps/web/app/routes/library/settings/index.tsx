import { Trash } from 'lucide-react';
import { useFetcher } from 'react-router-dom';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import { Typography } from '~/components/ui/typography';
import { itemType, unit } from '~/database/schema';
import { getTitle, i18n } from '~/i18n';

import type { Route } from '../../../../.react-router/types/app/routes/library/settings/+types';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

export async function loader({ context }: Route.LoaderArgs) {
  const [types, units] = await Promise.all([
    context.db.select().from(itemType),
    context.db.select().from(unit),
  ]);
  return { data: { types, units } };
}

const i = i18n['/library/settings'];

export default function Settings({
  loaderData: {
    data: { types, units },
  },
}: Route.ComponentProps) {
  return (
    <div className={'flex flex-col gap-8'}>
      <Typography variant={'h3'}>{i.title}</Typography>
      <div className={'flex flex-col gap-2'}>
        <Typography variant={'h4'}>{i.sections.types.title}</Typography>
        <Typography variant={'muted'} className={'max-w-xl'}>
          {i.sections.types.description}
        </Typography>
        <SectionTable data={types} id={'type'} />
      </div>
      <div className={'flex flex-col gap-2'}>
        <Typography variant={'h4'}>{i.sections.units.title}</Typography>
        <Typography variant={'muted'} className={'max-w-xl'}>
          {i.sections.units.description}
        </Typography>
        <SectionTable data={units} id={'unit'} />
      </div>
    </div>
  );
}
const SectionTable = ({ data, id }: { data: { name: string }[]; id: 'unit' | 'type' }) => {
  const { Form, state } = useFetcher();
  const d = useFetcher();
  const u = useFetcher();
  return (
    <div className={'flex flex-col max-w-xl gap-4'}>
      <Table className="rounded-md border">
        <TableBody>
          {data.map((i) => (
            <TableRow key={i.name}>
              <TableCell>
                <u.Form method={'PUT'} action={`/library/enums/${id}/${i.name}`}>
                  <Input
                    disabled={u.state !== 'idle'}
                    defaultValue={i.name}
                    name={'name'}
                    type={'text'}
                  />
                </u.Form>
              </TableCell>
              <TableCell align={'right'}>
                <d.Form method={'DELETE'} action={`/library/enums/${id}/${i.name}`}>
                  <Button variant={'ghost'} disabled={d.state !== 'idle'} type={'submit'}>
                    <Trash />
                  </Button>
                </d.Form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Form id={`form-${id}`} method={'POST'} action={`/library/enums/${id}`}>
        <div className={'flex flex-col gap-2 w-full'}>
          <Label>{i.sections.actions.inputLabel}</Label>
          <div className={'flex flex-row items-center gap-2'}>
            <Input name={'name'} type={'text'} form={`form-${id}`} />
            <Button variant={'ghost'} disabled={state !== 'idle'}>
              {i.sections.actions.submit}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};
