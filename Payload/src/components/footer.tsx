import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from './ui/separator'

const sections = [
  {
    title: 'Product',
    links: [
      { name: 'Product 1', href: '#' },
      { name: 'Product 2', href: '#' },
      { name: 'Product 3', href: '#' },
      { name: 'Product 4', href: '#' },
      { name: 'Product 5', href: '#' },
      { name: 'Product 6', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Blog', href: '#' },
      { name: 'Knowledge Base', href: '#' },
      { name: 'Documentation', href: '#' },
      { name: 'Partner Directory', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <section className="py-32">
      <footer>
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6 px-7">
          <div className="col-span-2 mb-8 lg:mb-0">
            <div className="flex flex-col justify-start gap-3">
              <div className="flex justify-start gap-3 items-center">
                <img
                  src="https://www.shadcnblocks.com/images/block/block-1.svg"
                  alt="logo"
                  className="h-10 w-10"
                />
                <p className="text-xl font-bold">Shadcnblocks</p>
              </div>
              <p className="text-base font-medium text-muted-foreground w-[80%]">
                A collection of 100+ responsive HTML templates for your startup business or side
                project.
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
          <div>
            <p className="mb-6 text-base font-semibold">Stay up to date</p>
            <form className="flex gap-2">
              <Input type="email" placeholder="Enter your email" className="w-[20rem]" />
              <Button variant={'destructive'}>Subscribe</Button>
            </form>
          </div>
        </div>
        <Separator className="my-12 bg-gray-500" />
        <div className="px-7 mt-12 flex flex-col justify-between gap-4 text-sm font-medium text-muted-foreground md:flex-row md:items-center">
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
    </section>
  )
}
