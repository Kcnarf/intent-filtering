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
    <Card
      style={{
        backgroundImage: "linear-gradient(145deg, oklch(0.556 0 0 / 0) 0%, oklch(0.6 0.185 87) 100%)",
      }}
    >
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
