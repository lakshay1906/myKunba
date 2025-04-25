'use client'

import * as React from 'react'
import {
  ArrowUpCircleIcon,
  Bookmark,
  CameraIcon,
  FileCodeIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MessageCircleHeart,
  SearchIcon,
  SettingsIcon,
  Shapes,
  UsersIcon,
} from 'lucide-react'
import { NavDocuments } from '@/components/sidebar/nav-documents'
import { NavMain } from '@/components/sidebar/nav-main'
import { NavSecondary } from '@/components/sidebar/nav-secondary'
import { NavUser } from '@/components/sidebar/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const data = {
  user: {
    name: 'Lakshay Bhati',
    email: 'll3162@srmist.edu.in',
    avatar: 'https://shoppershine.com/wp-content/uploads/2021/01/SS-PS095-1.jpg',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '#',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Team',
      url: '#',
      icon: UsersIcon,
    },
  ],
  navClouds: [
    {
      title: 'Capture',
      icon: CameraIcon,
      isActive: true,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
    {
      title: 'Proposal',
      icon: FileTextIcon,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
    {
      title: 'Prompts',
      icon: FileCodeIcon,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Search',
      url: '#',
      icon: SearchIcon,
    },
    {
      title: 'Settings',
      url: '#',
      icon: SettingsIcon,
    },
    // {
    //   title: 'Get Help',
    //   url: '#',
    //   icon: HelpCircleIcon,
    // },
  ],
  documents: [
    {
      name: 'Blog',
      url: '/dashboard/blog',
      icon: MessageCircleHeart,
    },
    {
      name: 'Category',
      url: '/dashboard/category',
      icon: Shapes,
    },
    {
      name: 'Blog Tag',
      url: '/dashboard/tags',
      icon: Bookmark,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">My Kunba</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
