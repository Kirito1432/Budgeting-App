/**
 * Budget Overview Component with shadcn/ui
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'

function BudgetOverview({ budgetSummary }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Budget Overview</h2>
        <p className="text-muted-foreground">Track spending against your budget limits</p>
      </div>

      {budgetSummary.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No budget data available yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgetSummary.map((budget, index) => {
            const percentage = Math.min(budget.percentage, 100)
            const isOverBudget = budget.percentage > 100

            return (
              <Card key={index} className={isOverBudget ? 'border-red-300' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{budget.name}</CardTitle>
                    {isOverBudget && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Over Budget
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-semibold">${parseFloat(budget.budget_limit).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Spent</p>
                      <p className="font-semibold">${parseFloat(budget.spent).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{isOverBudget ? 'Over' : 'Remaining'}</p>
                      <p className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                        ${Math.abs(parseFloat(budget.remaining)).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{budget.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isOverBudget ? 'bg-red-500' : 'bg-primary'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default BudgetOverview
