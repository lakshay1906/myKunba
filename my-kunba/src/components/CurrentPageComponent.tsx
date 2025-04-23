import { Minus } from 'lucide-react'
import { Button } from './ui/button'

export default function CurrentPageComponent({
  total,
  currentPage,
  limit,
  getAsyncData,
  totalPages,
}: any) {
  const startResult = total === 0 ? 0 : (currentPage - 1) * limit + 1
  const endResult = Math.min(currentPage * limit, total)

  async function handlePrevClick() {
    await getAsyncData(limit, limit * (currentPage - 2), false, Math.max(currentPage - 1, 1))
  }

  async function handleNextClick() {
    await getAsyncData(limit, limit * currentPage, false, Math.min(currentPage + 1, totalPages))
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between p-4">
        <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
          {startResult}
          <Minus size="1rem" />
          {endResult} of {total} results
        </p>
        <div className="flex gap-5 items-center">
          <p className="text-sm text-muted-foreground font-medium">
            {currentPage} of {totalPages} pages
          </p>
          <Button
            onClick={handlePrevClick}
            disabled={currentPage === 1}
            variant="ghost"
            className="py-0 h-7 px-2"
          >
            Prev
          </Button>
          <Button
            onClick={handleNextClick}
            disabled={currentPage === totalPages}
            variant="ghost"
            className="py-0 h-7 px-2"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
