import { getTitle } from '~/i18n';

import type { Route } from '../../../../.react-router/types/app/routes/library/sources/+types';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

export function loader() {
  return { message: 'Hello, library!' };
}

export default function Sources({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.message}</div>;
}
