import { Check, Clock, Circle } from 'lucide-react'

interface TimelineEvent {
  label: string
  date?: string
  done: boolean
  current?: boolean
}

interface ProjetoTimelineProps {
  events: TimelineEvent[]
}

export function ProjetoTimeline({ events }: ProjetoTimelineProps) {
  return (
    <div className="space-y-0">
      {events.map((event, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
              event.done ? 'bg-green-100 text-green-600' :
              event.current ? 'bg-primary/10 text-primary' :
              'bg-muted text-muted-foreground'
            }`}>
              {event.done ? <Check className="h-3.5 w-3.5" /> :
               event.current ? <Clock className="h-3.5 w-3.5" /> :
               <Circle className="h-3.5 w-3.5" />}
            </div>
            {i < events.length - 1 && (
              <div className={`w-px flex-1 min-h-6 ${event.done ? 'bg-green-300' : 'bg-border'}`} />
            )}
          </div>
          <div className="pb-4">
            <p className={`text-sm font-medium ${!event.done && !event.current ? 'text-muted-foreground' : ''}`}>
              {event.label}
            </p>
            {event.date && (
              <p className="text-xs text-muted-foreground">{event.date}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
