'use client'

import * as React from 'react'
import {
  ArrowUpCircleIcon,
  CameraIcon,
  FileCodeIcon,
  FileTextIcon,
  ImageIcon,
  LayoutDashboardIcon,
  MessageCircleHeart,
  Reply,
  SearchIcon,
  SettingsIcon,
  Shapes,
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
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/context/store'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { loginDetail } = useAppStore()
  const [userData, setUserData] = useState({
    name: 'Lakshay Bhati',
    email: 'll3162@srmist.edu.in',
    avatar: 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png',
  })

  useEffect(() => {
    if (loginDetail)
      setUserData({
        name: loginDetail.name,
        email: loginDetail.email,
        avatar: loginDetail.profile_pic,
      })
    else
      setUserData({
        name: 'Demo user',
        email: 'demo_user@gmail.com',
        avatar: 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png',
      })
  }, [loginDetail])

  const data = {
    navMain: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboardIcon,
      },
      {
        title: 'Back to Frontend',
        url: '/',
        icon: Reply,
      },
      // {
      //   title: 'Team',
      //   url: '#',
      //   icon: UsersIcon,
      // },
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
      ...(loginDetail?.role === 'admin'
        ? [{ name: 'Media', url: '/dashboard/media', icon: ImageIcon }]
        : []),
    ],
  }
  return (
    <Sidebar collapsible="icon" {...props} className="h-full rounded-lg">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="">
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
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
