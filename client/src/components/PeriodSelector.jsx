/**
 * PeriodSelector Component
 *
 * Allows users to select and navigate between budget periods
 */

import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

function PeriodSelector({ currentPeriod, onPeriodChange }) {
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch all periods on mount
  useEffect(() => {
    fetchPeriods()
  }, [])

  const fetchPeriods = async () => {
    try {
      const response = await fetch('/api/periods')
      const data = await response.json()
      setPeriods(data)
      setLoading(false)

      // If no current period selected, fetch and select the current period
      if (!currentPeriod && data.length > 0) {
        const currentResponse = await fetch('/api/periods/current')
        const current = await currentResponse.json()
        if (current) {
          onPeriodChange(current)
        }
      }
    } catch (error) {
      console.error('Error fetching periods:', error)
      setLoading(false)
    }
  }

  // Navigate to previous period
  const handlePrevious = () => {
    if (!currentPeriod || periods.length === 0) return
    const currentIndex = periods.findIndex(p => p.id === currentPeriod.id)
    if (currentIndex < periods.length - 1) {
      onPeriodChange(periods[currentIndex + 1])
    }
  }

  // Navigate to next period
  const handleNext = () => {
    if (!currentPeriod || periods.length === 0) return
    const currentIndex = periods.findIndex(p => p.id === currentPeriod.id)
    if (currentIndex > 0) {
      onPeriodChange(periods[currentIndex - 1])
    }
  }

  // Handle period selection from dropdown
  const handleSelect = (event) => {
    const selectedId = parseInt(event.target.value)
    const selected = periods.find(p => p.id === selectedId)
    if (selected) {
      onPeriodChange(selected)
    }
  }

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get period display name
  const getPeriodName = (period) => {
    if (!period) return 'No Period Selected'

    const start = new Date(period.start_date)
    const end = new Date(period.end_date)

    // For monthly periods, show month name
    if (period.period_type === 'monthly') {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }

    // For weekly/yearly, show date range
    return `${formatDate(period.start_date)} - ${formatDate(period.end_date)}`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground">Loading periods...</p>
        </CardContent>
      </Card>
    )
  }

  if (periods.length === 0) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="py-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-orange-600" />
          <p className="font-medium mb-1">No Budget Periods Created</p>
          <p className="text-sm text-muted-foreground">
            Create a budget period to start tracking period-based budgets
          </p>
        </CardContent>
      </Card>
    )
  }

  const currentIndex = currentPeriod ? periods.findIndex(p => p.id === currentPeriod.id) : -1
  const isFirst = currentIndex === 0
  const isLast = currentIndex === periods.length - 1

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          {/* Calendar Icon */}
          <Calendar className="h-5 w-5 text-gray-600 flex-shrink-0" />

          {/* Period Navigation */}
          <div className="flex items-center gap-2 flex-1">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={isLast || !currentPeriod}
              className="flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Period Selector Dropdown */}
            <select
              value={currentPeriod?.id || ''}
              onChange={handleSelect}
              className="flex-1 px-3 py-2 border rounded-md bg-white text-sm font-medium min-w-0"
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {getPeriodName(period)}
                </option>
              ))}
            </select>

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={isFirst || !currentPeriod}
              className="flex-shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Period Type Badge */}
          {currentPeriod && (
            <div className="hidden sm:block">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                {currentPeriod.period_type}
              </span>
            </div>
          )}
        </div>

        {/* Period Date Range (Mobile) */}
        {currentPeriod && (
          <div className="mt-3 text-xs text-muted-foreground text-center sm:hidden">
            {formatDate(currentPeriod.start_date)} - {formatDate(currentPeriod.end_date)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PeriodSelector
