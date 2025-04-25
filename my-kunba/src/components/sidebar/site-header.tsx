import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import ThemeToggle from '../ThemeToggle'
import { Bell } from 'lucide-react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

export function SiteHeader() {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex justify-between w-full">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-base font-medium">Documents</h1>
        </div>
        <div className="flex justify-center gap-3 items-center mr-2">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger className="rounded-full p-1 border border-muted-foreground">
              <Bell size={'1.2rem'} />
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Notification</SheetTitle>
              </SheetHeader>
              <div className=" py-4">No notification to display</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
