'use client'

import { useLocale } from '@/lib/i18n/locale-context'
import type { Locale } from '@/lib/i18n/translations'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const options: { value: Locale; labelKey: string }[] = [
  { value: 'en', labelKey: 'lang_en' },
  { value: 'zh', labelKey: 'lang_zh' },
  { value: 'hi', labelKey: 'lang_hi' },
  { value: 'es', labelKey: 'lang_es' },
  { value: 'fr', labelKey: 'lang_fr' },
  { value: 'ar', labelKey: 'lang_ar' },
]

export default function LanguageSelect() {
  const { locale, setLocale, t } = useLocale()

  return (
    <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
      <SelectTrigger className="w-[140px] border-muted-foreground/30 bg-transparent text-sm font-medium text-muted-foreground hover:text-foreground">
        <SelectValue placeholder={t('footer_language')} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
            {t(opt.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
