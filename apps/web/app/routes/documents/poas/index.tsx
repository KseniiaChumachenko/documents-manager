import { getTitle } from '~/i18n';

import type { Route } from '../../../../.react-router/types/app/routes/documents/poas/+types';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

export function loader() {
  return { message: 'Hello, library!' };
}

export default function Poas({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.message}</div>;
}
