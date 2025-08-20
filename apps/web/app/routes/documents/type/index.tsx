import { getTitle } from '~/i18n';

import type { Route } from '../../../../.react-router/types/app/routes/documents/type/+types';

export function meta({ location }: Route.MetaArgs) {
  return [{ title: getTitle(location) }];
}

export function loader({ params:{type}, context}: Route.LoaderArgs) {

  return { message: `Hello, ${type}!`, userEmail: context.user?.email };
}

export default function Documents({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.message}</div>;
}
