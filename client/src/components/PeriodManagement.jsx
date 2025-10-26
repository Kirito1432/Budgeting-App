/**
 * PeriodManagement Component
 *
 * Allows users to create, edit, and manage budget periods
 */

import { useState, useEffect } from 'react'
import { Plus, Calendar, Trash2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, format } from 'date-fns'

function PeriodManagement({ onPeriodCreated }) {
  const [periods, setPeriods] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [newPeriod, setNewPeriod] = useState({
    period_type: 'monthly',
    start_date: '',
    end_date: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPeriods()
  }, [])

  const fetchPeriods = async () => {
    try {
      const response = await fetch('/api/periods')
      const data = await response.json()
      setPeriods(data)
    } catch (error) {
      console.error('Error fetching periods:', error)
    }
  }

  // Auto-fill dates based on period type
  const handlePeriodTypeChange = (type) => {
    const now = new Date()
    let start, end

    switch (type) {
      case 'weekly':
        start = startOfWeek(now)
        end = endOfWeek(now)
        break
      case 'monthly':
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case 'yearly':
        start = startOfYear(now)
        end = endOfYear(now)
        break
      default:
        return
    }

    setNewPeriod({
      period_type: type,
      start_date: format(start, 'yyyy-MM-dd'),
      end_date: format(end, 'yyyy-MM-dd')
    })
  }

  const handleCreatePeriod = async () => {
    setError('')

    // Validation
    if (!newPeriod.start_date || !newPeriod.end_date) {
      setError('Start date and end date are required')
      return
    }

    if (new Date(newPeriod.end_date) < new Date(newPeriod.start_date)) {
      setError('End date must be after start date')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPeriod),
      })

      if (response.ok) {
        const createdPeriod = await response.json()
        setNewPeriod({ period_type: 'monthly', start_date: '', end_date: '' })
        setIsCreating(false)
        await fetchPeriods()
        if (onPeriodCreated) {
          onPeriodCreated(createdPeriod)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create period')
      }
    } catch (error) {
      console.error('Error creating period:', error)
      setError('Failed to create period')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePeriod = async (id, periodName) => {
    if (!window.confirm(`Are you sure you want to delete the period "${periodName}"? This will also delete all associated budget data.`)) {
      return
    }

    try {
      const response = await fetch(`/api/periods/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchPeriods()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete period')
      }
    } catch (error) {
      console.error('Error deleting period:', error)
      alert('Failed to delete period')
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getPeriodName = (period) => {
    const start = new Date(period.start_date)

    if (period.period_type === 'monthly') {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }

    return `${formatDate(period.start_date)} - ${formatDate(period.end_date)}`
  }

  const isCurrentPeriod = (period) => {
    const now = new Date()
    const start = new Date(period.start_date)
    const end = new Date(period.end_date)
    return now >= start && now <= end
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Period Management</CardTitle>
          <CardDescription>
            Create and manage budget periods. Each period can have its own budget limits per category.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Error</h4>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Create Period Button */}
      {!isCreating && (
        <Button
          onClick={() => {
            setIsCreating(true)
            handlePeriodTypeChange('monthly') // Initialize with monthly period
          }}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Period
        </Button>
      )}

      {/* Create Period Form */}
      {isCreating && (
        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Create New Budget Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Period Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Period Type</label>
                <select
                  value={newPeriod.period_type}
                  onChange={(e) => handlePeriodTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={loading}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <Input
                    type="date"
                    value={newPeriod.start_date}
                    onChange={(e) => setNewPeriod({ ...newPeriod, start_date: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <Input
                    type="date"
                    value={newPeriod.end_date}
                    onChange={(e) => setNewPeriod({ ...newPeriod, end_date: e.target.value })}
                    min={newPeriod.start_date}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Info Text */}
              <p className="text-sm text-muted-foreground">
                Budget limits will be copied from your default category budgets. You can customize them later.
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleCreatePeriod}
                  disabled={loading}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Period'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false)
                    setNewPeriod({ period_type: 'monthly', start_date: '', end_date: '' })
                    setError('')
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Periods List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Existing Periods</h3>

        {periods.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-muted-foreground">No periods created yet. Create your first period to get started!</p>
            </CardContent>
          </Card>
        ) : (
          periods.map((period) => (
            <Card key={period.id} className={isCurrentPeriod(period) ? 'border-2 border-green-300 bg-green-50/50' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{getPeriodName(period)}</h3>
                      {isCurrentPeriod(period) && (
                        <Badge className="bg-green-600">Current</Badge>
                      )}
                      <Badge variant="outline" className="capitalize">{period.period_type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(period.start_date)} - {formatDate(period.end_date)}
                    </p>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePeriod(period.id, getPeriodName(period))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default PeriodManagement
