import { Home, Settings, Library, FileStack, Waves } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '~/components/ui/sidebar';
import { cn } from '~/lib/utils';

const items = [
  {
    title: 'Головна',
    url: '/',
    icon: Home,
  },
  {
    title: 'Документи',
    url: '/documents',
    icon: FileStack,
    action: {
      icon: Settings,
      url: '/documents/settings',
    },
    children: [
      {
        title: 'Довіренності',
        url: '/documents/poas',
      },
      {
        title: 'Видаткові накладні',
        url: '/documents/bills',
      },
      {
        title: 'Рахунки фактури',
        url: '/documents/invoices',
      },
    ],
  },
  {
    title: 'Бібліотека',
    url: '/library',
    icon: Library,
    action: {
      icon: Settings,
      url: '/library/settings',
    },
    children: [
      {
        title: 'Покупці',
        url: '/library/clients',
      },
      {
        title: 'Продавці',
        url: '/library/sources',
      },
      {
        title: 'Товари',
        url: '/library/items',
      },
    ],
  },
];

export function AppSidebar() {
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
                  <SidebarMenuSub>
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
