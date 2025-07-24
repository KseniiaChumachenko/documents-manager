import { useFetcher } from 'react-router-dom';

import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import type { Item, ItemType, Unit } from '~/database/schema';
import { i18n as i } from '~/i18n';
import type { IMLoader } from '~/routes/library/api/item-management';

const labels = i['/library/items'];
type Options = { value: string; children: string }[];

const getFields = ({
  typeOptions,
  unitOptions,
}: {
  typeOptions: Options;
  unitOptions: Options;
}) => [
  {
    name: 'name',
    f: 'input',
    type: 'text',
  },
  {
    name: 'unit',
    f: 'select',
    options: unitOptions,
  },
  {
    name: 'priceInputVATFree',
    f: 'input',
    type: 'number',
    step: 0.01,
  },
  {
    name: 'priceOutputVATFree',
    f: 'input',
    type: 'number',
    step: 0.01,
  },
  {
    name: 'priceRetailInclVAT',
    f: 'input',
    type: 'number',
    step: 0.01,
  },
  {
    name: 'type',
    f: 'select',
    options: typeOptions,
  },
];

export const ItemDialog = ({
  item,
  types,
  units,
}: {
  item?: Item;
  types: ItemType[];
  units: Unit[];
}) => {
  const fetcher = useFetcher<IMLoader>();

  const i18n = item?.id ? labels.dialogs.edit : labels.dialogs.add;

  const typeOptions = types.map(({ name }) => ({ value: name, children: name }));
  const unitOptions = units.map(({ name }) => ({ value: name, children: name }));
  const fields = getFields({ typeOptions, unitOptions });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{labels.actions.primary}</Button>
      </DialogTrigger>

      <DialogContent className={'md:max-w-lg'}>
        <fetcher.Form method={'post'} action={'/library/item-management'}>
          <DialogHeader>
            <DialogTitle>{i18n.title}</DialogTitle>
            <DialogDescription>{i18n.description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {fields.map(({ f, ...rest }) =>
              f === 'input' ? (
                <div key={rest.name}>
                  <Label htmlFor={rest.name} className="pb-2">
                    {labels.table.headers[rest.name]}
                  </Label>
                  <Input id={rest.name} {...rest} />
                </div>
              ) : (
                <div key={rest.name}>
                  <Label htmlFor={rest.name} className="pb-2">
                    {labels.table.headers[rest.name]}
                  </Label>
                  <select
                    id={rest.name}
                    {...rest}
                    className="border px-2 py-1 rounded-md w-full h-full"
                  >
                    {rest.options?.map((i) => (
                      <option key={i.value} {...i} />
                    ))}
                  </select>
                </div>
              )
            )}
          </div>

          <DialogFooter className="sm:justify-end pt-6">
            <DialogClose asChild>
              <Button type={'submit'}>{labels.dialogs.actions.primary}</Button>
            </DialogClose>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
};
