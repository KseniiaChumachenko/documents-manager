import { Outlet } from 'react-router';

import { AppSidebar } from '~/components/app-sidebar';
import { SidebarProvider } from '~/components/ui/sidebar';

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <Outlet />
    </SidebarProvider>
  );
}
