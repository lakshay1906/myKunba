import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from './ui/separator'

const sections = [
  {
    title: 'Links',
    links: [
      { name: 'Home', href: '#' },
      { name: 'About', href: '#' },
      { name: 'Contact', href: '#' },
      { name: 'All Posts / Blog', href: '#' },
      // { name: 'Privacy Policy', href: '#' },
    ],
  },
  {
    title: 'Social Media',
    links: [
      { name: 'Twitter / X', href: '#' },
      { name: 'GitHub', href: '#' },
      { name: 'LinkedIn', href: '#' },
      { name: 'Instagram', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="container mx-auto mt-12">
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-6 px-6">
        <div className="col-span-2 mb-8 lg:mb-0">
          <div className="flex flex-col justify-start gap-3">
            <div className="flex justify-start gap-3 items-center">
              <div className="overflow-hidden rounded-xl">
                <img src="/logo.png" alt="logo" className="h-10 w-10" />
              </div>
              <p className="text-xl font-bold">myKunba.org</p>
            </div>
            <p className="text-base font-medium text-muted-foreground w-[80%]">
              Where Stories Come to Life is an innovative and engaging blogging platform designed
              for provide writers, storytellers, and content creators.
            </p>
          </div>
        </div>
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            <h3 className="mb-4 font-bold">{section.title}</h3>
            <ul className="space-y-4 text-muted-foreground">
              {section.links.map((link, linkIdx) => (
                <li key={linkIdx} className="font-medium hover:text-primary">
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="col-span-2 xs:col-span-1">
          <p className="mb-6 text-base font-semibold">Stay up to date</p>
          <form className="flex xs:flex-row flex-col gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="w-full xs:w-[20rem] text-sm"
            />
            <Button className="w-fit xs:w-auto px-7 xs:px-4">Subscribe</Button>
          </form>
        </div>
      </div>
      <Separator className="my-12" />
      <div className="flex flex-col justify-between gap-4 p-6 pt-0 text-sm font-medium text-muted-foreground md:flex-row md:items-center">
        <p>© 2024 Shadcn. All rights reserved.</p>
        <ul className="flex gap-4">
          <li className="underline hover:text-primary">
            <a href="#"> Terms and Conditions</a>
          </li>
          <li className="underline hover:text-primary">
            <a href="#"> Privacy Policy</a>
          </li>
        </ul>
      </div>
    </footer>
  )
}
