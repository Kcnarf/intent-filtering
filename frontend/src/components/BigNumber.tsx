import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type BigNumberType = "total_count" | "average_rating" | "total_votes"

const LABELS: Record<BigNumberType, string> = {
  total_count: "Films",
  average_rating: "Avg Rating",
  total_votes: "Total Votes",
}

interface BigNumberProps {
  type: BigNumberType
  value: string | number
  children?: React.ReactNode
}

export function BigNumber({ type, value, children }: BigNumberProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
          {LABELS[type]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold tabular-nums">{value}</p>
        {children}
      </CardContent>
    </Card>
  )
}
