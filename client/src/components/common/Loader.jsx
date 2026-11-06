import { Loader2 } from 'lucide-react'

export default function Loader({ size = 'md', text = 'Loading...' }) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-3">
      <Loader2 className={`${sizeMap[size] || sizeMap.md} animate-spin text-purple-600`} />
      {text && <p className="text-sm font-medium text-gray-500 animate-pulse">{text}</p>}
    </div>
  )
}
