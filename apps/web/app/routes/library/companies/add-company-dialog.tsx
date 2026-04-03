import { useState } from 'react';
import { useFetcher, useRevalidator } from 'react-router-dom';

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
import { i18n as i } from '~/i18n';
import type { SaveCompanyLoader } from '~/routes/library/_api/save-company';
import type { SearchCompanyLoader } from '~/routes/library/_api/search-company';

const labels = i['/library/client'];

export const AddCompanyDialog = ({
  i18n,
  type,
}: {
  i18n: typeof labels;
  type: 'client' | 'source';
}) => {
  const searchFetcher = useFetcher<SearchCompanyLoader>();
  const saveFetcher = useFetcher<SaveCompanyLoader>();
  const revalidator = useRevalidator();
  const [fopForm, setFopForm] = useState({ name: '', address: '', phone: '' });

  const entityType = searchFetcher.data?.entity_type;
  const isFop = entityType === 'fop';
  const isFopManualEntry = isFop && !searchFetcher.data?.data;

  const handleSubmit = async () => {
    if (isFopManualEntry) {
      const code = new FormData(document.querySelector<HTMLFormElement>('.search-form')!).get(
        'code'
      ) as string;

      await saveFetcher.submit({ ik: code, type, ...fopForm }, { action: '/library/save-company' });
    } else if (searchFetcher.data?.data) {
      const data = searchFetcher.data.data;
      const params = isFop ? { ik: data.ik, type } : { ...data, type };

      await saveFetcher.submit(params, { action: '/library/save-company' });
    }
    await revalidator.revalidate();
  };

  const canSave = isFopManualEntry ? fopForm.name.trim().length > 0 : !!searchFetcher.data?.data;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{i18n.actions.primary}</Button>
      </DialogTrigger>

      <DialogContent className={'w-auto max-h-3/4 overflow-y-auto'}>
        <DialogHeader>
          <DialogTitle>{i18n.dialogs.add.title}</DialogTitle>
          <DialogDescription>{i18n.dialogs.add.description}</DialogDescription>
        </DialogHeader>
        <searchFetcher.Form
          method={'get'}
          action={'/library/search-company'}
          className="search-form"
        >
          <div className="flex items-center gap-2">
            <Input
              placeholder={i18n.dialogs.add.placeholder}
              type="text"
              name="code"
              minLength={8}
              maxLength={10}
            />
            <Button disabled={searchFetcher.state !== 'idle'} variant={'ghost'}>
              {i18n.dialogs.add.actions.secondary}
            </Button>
          </div>
        </searchFetcher.Form>
        {searchFetcher.data?.error && (
          <span className="text-red-500" data-state="error" data-slot="error">
            {searchFetcher.data?.error}
          </span>
        )}
        {searchFetcher.data?.data && !isFopManualEntry && (
          <table>
            <tbody>
              {Object.entries(searchFetcher.data.data)
                .filter(([key]) => key !== 'id' && key !== 'entity_type')
                .map(([key, value]) => (
                  <tr key={key}>
                    <td className="p-2 text-muted-foreground text-sm">
                      {i18n.table.headers[key as keyof typeof i18n.table.headers] || key}
                    </td>
                    <td className="p-2 text-sm leading-none font-medium">{String(value ?? '')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
        {isFopManualEntry && (
          <div className="flex flex-col gap-3 border rounded-md p-4">
            <p className="text-sm text-muted-foreground">{i18n.dialogs.add.fop.description}</p>
            <Input
              placeholder={i18n.dialogs.add.fop.fields.name}
              value={fopForm.name}
              onChange={(e) => setFopForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              placeholder={i18n.dialogs.add.fop.fields.address}
              value={fopForm.address}
              onChange={(e) => setFopForm((f) => ({ ...f, address: e.target.value }))}
            />
            <Input
              placeholder={i18n.dialogs.add.fop.fields.phone}
              value={fopForm.phone}
              onChange={(e) => setFopForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
        )}
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button disabled={!canSave} onClick={handleSubmit}>
              {i18n.dialogs.add.actions.primary}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
