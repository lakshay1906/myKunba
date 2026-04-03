'use client'

import * as React from 'react'
import {
  CameraIcon,
  DatabaseZap,
  FileCodeIcon,
  FileTextIcon,
  ImageIcon,
  LayoutDashboard,
  MessageCircleHeart,
  Reply,
  Shapes,
  Tag,
  Trash2,
  Languages,
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
import Image from 'next/image'
import Link from 'next/link'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { loginDetail } = useAppStore()
  const [userData, setUserData] = useState({
    name: 'Demo User',
    email: 'demo_user@gmail.com',
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
      ...(loginDetail?.role === 'admin'
        ? [{ title: 'CMS Dashboard', url: '/admin', icon: DatabaseZap }]
        : []),
      {
        title: 'Back to UserFront',
        url: '/',
        icon: Reply,
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
        title: 'Recycle bin',
        url: '/dashboard/recycle-bin',
        icon: Trash2,
      },
    ],
    documents: [
      ...(loginDetail?.role === 'admin'
        ? [{ name: 'Overview', url: '/dashboard', icon: LayoutDashboard }]
        : []),
      {
        name: 'Blog',
        url: '/dashboard/blog',
        icon: MessageCircleHeart,
      },
      {
        name: 'Translations',
        url: '/dashboard/translations',
        icon: Languages,
      },
      {
        name: 'Category',
        url: '/dashboard/category',
        icon: Shapes,
      },
      {
        name: 'Tags',
        url: '/dashboard/tag',
        icon: Tag,
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
              <Link href="#">
                <Image src="/logo.svg" alt="My Kunba" width={32} height={32} />
                <span className="text-base font-semibold">My Kunba</span>
              </Link>
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
