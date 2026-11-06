const profiles = [
  ['portfolio', 'Website'],
  ['instagram', 'Instagram'],
  ['youtube', 'YouTube'],
]

export default function AdditionalSocialLinks({ links = {} }) {
  const visibleProfiles = profiles.filter(([key]) => links[key])
  if (!visibleProfiles.length) return null

  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-3 text-xs">
      {visibleProfiles.map(([key, label]) => (
        <a key={key} href={links[key]} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:opacity-70">
          {label}
        </a>
      ))}
    </div>
  )
}
