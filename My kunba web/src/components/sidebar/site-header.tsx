import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import ThemeToggle from '../Home/ThemeToggle'
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
    <header className="sticky top-0 z-99 flex shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear py-4 px-2">
      <div className="flex justify-between w-full gap-x-4">
        <div className="flex w-full items-center gap-1 lg:gap-2 ml-2">
          <SidebarTrigger />
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
              <div className="py-4">No notification to display</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
