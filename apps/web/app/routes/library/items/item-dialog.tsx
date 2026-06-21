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
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import type { Item, ItemType, Unit } from '~/database/schema';
import { tns } from '~/i18n';
import type { IMLoader } from '~/routes/library/_api/item-management';

const labels = tns('/library/items');
type Options = { value: string; children: string }[];

const getFields = ({
  typeOptions,
  unitOptions,
}: {
  typeOptions: Options;
  unitOptions: Options;
}) => [
  {
    name: 'id' as const,
    f: 'input' as const,
    hidden: true,
    type: 'text',
  },
  {
    name: 'name' as const,
    f: 'input' as const,
    type: 'text',
  },
  {
    name: 'unit' as const,
    f: 'select' as const,
    options: unitOptions,
  },
  {
    name: 'priceSaleVATFree' as const,
    f: 'input' as const,
    type: 'number',
    step: 0.01,
  },
  {
    name: 'priceCostVATFree' as const,
    f: 'input' as const,
    type: 'number',
    step: 0.01,
  },
  {
    name: 'priceRetailInclVAT' as const,
    f: 'input' as const,
    type: 'number',
    step: 0.01,
  },
  {
    name: 'type' as const,
    f: 'select' as const,
    options: typeOptions,
  },
];

export const ItemDialog = ({
  item,
  types,
  units,
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
  item?: Item | null;
  types: ItemType[];
  units: Unit[];
}) => {
  const fetcher = useFetcher<IMLoader>();

  const i18n = item?.id ? labels.dialogs.edit : labels.dialogs.add;

  const typeOptions = types.map(({ name }) => ({ value: name, children: name }));
  const unitOptions = units.map(({ name }) => ({ value: name, children: name }));
  const fields = getFields({ typeOptions, unitOptions });

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
                  {!rest.hidden && (
                    <Label htmlFor={rest.name} className="pb-2">
                      {labels.table.headers[rest.name as keyof typeof labels.table.headers]}
                    </Label>
                  )}
                  <Input id={rest.name} defaultValue={item?.[rest.name] ?? undefined} {...rest} />
                </div>
              ) : (
                <div key={rest.name}>
                  <Label htmlFor={rest.name} className="pb-2">
                    {labels.table.headers[rest.name as keyof typeof labels.table.headers]}
                  </Label>
                  <select
                    id={rest.name}
                    defaultValue={item?.[rest.name] ?? undefined}
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
