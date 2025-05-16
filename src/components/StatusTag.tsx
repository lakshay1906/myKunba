import React from 'react'
import { Badge } from './ui/badge'

export default function StatusTag({
  styles,
  product,
}: {
  styles: string
  product: {
    product_status: string
    indicator: 'green' | 'red' | 'gray' | 'black' | 'orange'
  }
}) {
  return (
    <Badge
      className={`capitalize rounded-full text-foreground font-normal text-sm ${product.indicator === 'green' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/15' : ''} ${
        product.indicator === 'red' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/15' : ''
      } ${product.indicator === 'gray' ? 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/15' : ''}
       ${product.indicator === 'black' ? 'bg-black/10 text-black hover:bg-black/15' : ''} ${
         product.indicator === 'orange'
           ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/10'
           : ''
       } ${styles}`}
    >
      {product.product_status}
    </Badge>
  )
}
