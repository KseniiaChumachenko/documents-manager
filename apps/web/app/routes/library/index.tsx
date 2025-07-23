import * as Router from 'react-router';

import { ErrorBoundary as EB } from '~/components/error-boundary';

export default function Library() {
  return <Router.Outlet />;
}
export const ErrorBoundary = EB;
