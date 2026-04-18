import { Minus } from 'lucide-react'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

export const DEFAULT_LIMIT_OPTIONS = [10, 20, 30, 40, 50]

type Props = {
  total: number
  currentPage: number
  limit: number
  getAsyncData: (limit: number, offset: number, skipScroll: boolean, page: number) => Promise<void>
  totalPages: number
  onLimitChange?: (newLimit: number) => void | Promise<void>
  limitOptions?: number[]
}

export default function CurrentPageComponent({
  total,
  currentPage,
  limit,
  getAsyncData,
  totalPages,
  onLimitChange,
  limitOptions = DEFAULT_LIMIT_OPTIONS,
}: Props) {
  const startResult = total === 0 ? 0 : (currentPage - 1) * limit + 1
  const endResult = Math.min(currentPage * limit, total)

  async function handlePrevClick() {
    const newPage = Math.max(currentPage - 1, 1)
    const offset = (newPage - 1) * limit
    await getAsyncData(limit, offset, false, newPage)
  }

  async function handleNextClick() {
    const newPage = Math.min(currentPage + 1, totalPages)
    const offset = (newPage - 1) * limit
    await getAsyncData(limit, offset, false, newPage)
  }

  async function handleLimitChange(value: string) {
    const newLimit = Number(value)
    if (!Number.isFinite(newLimit) || newLimit <= 0) return
    if (onLimitChange) {
      await onLimitChange(newLimit)
    } else {
      // Fallback: refetch page 1 with new limit
      await getAsyncData(newLimit, 0, false, 1)
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between p-4 gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
          {startResult}
          <Minus size="1rem" />
          {endResult} of {total} results
        </p>
        <div className="flex gap-3 sm:gap-5 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">Rows:</span>
            <Select value={String(limit)} onValueChange={handleLimitChange}>
              <SelectTrigger className="h-7 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {limitOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            disabled={currentPage === totalPages || totalPages === 0}
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
