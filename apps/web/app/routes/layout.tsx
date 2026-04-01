import { Outlet } from 'react-router';

import { AppSidebar } from '~/components/app-sidebar';
import { ErrorBoundary as EB } from '~/components/error-boundary';

export default function Layout() {
  return (
    <div className={'flex'}>
      <AppSidebar />
      <div className={'p-4 w-full'}>
        <Outlet />
      </div>
    </div>
  );
}

export const ErrorBoundary = EB;
