/**
 * Budget Overview Component with shadcn/ui
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import PeriodSelector from './PeriodSelector'

function BudgetOverview({ budgetSummary, currentPeriod, onPeriodChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Budget Overview</h2>
        <p className="text-muted-foreground">Track spending against your budget limits</p>
      </div>

      {/* Period Selector */}
      <PeriodSelector currentPeriod={currentPeriod} onPeriodChange={onPeriodChange} />

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

            // Determine progress bar color based on percentage
            const getProgressColor = () => {
              if (isOverBudget) return 'bg-gradient-to-r from-red-500 to-red-600'
              if (budget.percentage >= 90) return 'bg-gradient-to-r from-orange-500 to-red-500'
              if (budget.percentage >= 70) return 'bg-gradient-to-r from-yellow-500 to-orange-500'
              return 'bg-gradient-to-r from-green-500 to-emerald-500'
            }

            const getBorderColor = () => {
              if (isOverBudget) return 'border-red-300'
              if (budget.percentage >= 90) return 'border-orange-300'
              if (budget.percentage >= 70) return 'border-yellow-300'
              return 'border-green-200'
            }

            return (
              <Card key={index} className={`${getBorderColor()} transition-colors`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{budget.name}</CardTitle>
                    {isOverBudget && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Over Budget
                      </Badge>
                    )}
                    {!isOverBudget && budget.percentage >= 90 && (
                      <Badge className="bg-orange-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Near Limit
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

                  {/* Enhanced Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Budget Progress</span>
                      <span className={`font-bold ${
                        isOverBudget ? 'text-red-600' :
                        budget.percentage >= 90 ? 'text-orange-600' :
                        budget.percentage >= 70 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {budget.percentage.toFixed(1)}%
                      </span>
                    </div>

                    {/* Large visual progress bar */}
                    <div className="relative">
                      <div className="h-6 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-500 ease-out ${getProgressColor()} ${
                            isOverBudget ? 'animate-pulse' : ''
                          }`}
                          style={{ width: `${percentage}%` }}
                        >
                          {/* Shine effect */}
                          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                        </div>
                      </div>

                      {/* Percentage markers */}
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>0%</span>
                        <span className="text-yellow-600">70%</span>
                        <span className="text-orange-600">90%</span>
                        <span className="text-red-600">100%</span>
                      </div>
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
