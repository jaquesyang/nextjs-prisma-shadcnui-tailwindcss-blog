interface HighlightProps {
  text: string
  highlight: string
  className?: string
}

export function Highlight({ text, highlight, className = "" }: HighlightProps) {
  if (!highlight.trim()) {
    return <span className={className}>{text}</span>
  }

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (regex.test(part)) {
          return (
            <mark key={index} className="bg-yellow-200 px-1 rounded">
              {part}
            </mark>
          )
        }
        return part
      })}
    </span>
  )
}