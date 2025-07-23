'use client';
import { Home, Settings, Library, FileStack, Waves } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from '~/components/ui/sidebar';
import { i18n } from '~/i18n';
import { cn } from '~/lib/utils';

export const items = [
  {
    title: i18n['/'].title,
    url: '/',
    icon: Home,
  },
  {
    title: i18n['/documents'].title,
    url: '/documents',
    icon: FileStack,
    action: {
      icon: Settings,
      url: '/documents/settings',
    },
    children: [
      {
        title: i18n['/documents/poas'].title,
        url: '/documents/poas',
      },
      {
        title: i18n['/documents/bills'].title,
        url: '/documents/bills',
      },
      {
        title: i18n['/documents/invoices'].title,
        url: '/documents/invoices',
      },
    ],
  },
  {
    title: i18n['/library'].title,
    url: '/library',
    icon: Library,
    action: {
      icon: Settings,
      url: '/library/settings',
    },
    children: [
      {
        title: i18n['/library/clients'].title,
        url: '/library/clients',
      },
      {
        title: i18n['/library/sources'].title,
        url: '/library/sources',
      },
      {
        title: i18n['/library/items'].title,
        url: '/library/items',
      },
    ],
  },
];

export function ASidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className={cn('p-2', 'bg-blue-500', 'rounded-md')}>
          <Waves color={'white'} />
        </div>
        <h3 className={'scroll-m-20 text-2xl font-stretch-expanded tracking-tight'}>AeroClime</h3>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <>
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                    {item.action && (
                      <SidebarMenuAction>
                        <a href={item.action?.url}>
                          <Settings size={15} />
                        </a>
                      </SidebarMenuAction>
                    )}
                  </SidebarMenuItem>
                  <SidebarMenuSub key={`action_${item.title}`}>
                    {item.children?.map((i) => (
                      <SidebarMenuSubItem key={i.title}>
                        <SidebarMenuSubButton href={i.url}>{i.title}</SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

export const AppSidebar = () => {
  return (
    <SidebarProvider>
      <ASidebar />
    </SidebarProvider>
  );
};
