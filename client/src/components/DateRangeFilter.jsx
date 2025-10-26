/**
 * DateRangeFilter Component
 *
 * Provides preset date range options and custom date selection
 * for filtering transactions and other data by date.
 */

import { useState, useEffect } from 'react'
import { Calendar, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  format
} from 'date-fns'

function DateRangeFilter({ onFilterChange }) {
  const [activePreset, setActivePreset] = useState('thisMonth')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  // Date range presets
  const presets = {
    today: {
      label: 'Today',
      getRange: () => ({
        start: format(startOfDay(new Date()), 'yyyy-MM-dd'),
        end: format(endOfDay(new Date()), 'yyyy-MM-dd')
      })
    },
    thisWeek: {
      label: 'This Week',
      getRange: () => ({
        start: format(startOfWeek(new Date()), 'yyyy-MM-dd'),
        end: format(endOfWeek(new Date()), 'yyyy-MM-dd')
      })
    },
    thisMonth: {
      label: 'This Month',
      getRange: () => ({
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
      })
    },
    lastMonth: {
      label: 'Last Month',
      getRange: () => {
        const lastMonth = subMonths(new Date(), 1)
        return {
          start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
        }
      }
    },
    thisYear: {
      label: 'This Year',
      getRange: () => ({
        start: format(startOfYear(new Date()), 'yyyy-MM-dd'),
        end: format(endOfYear(new Date()), 'yyyy-MM-dd')
      })
    },
    allTime: {
      label: 'All Time',
      getRange: () => ({
        start: null,
        end: null
      })
    }
  }

  // Apply preset filter
  const applyPreset = (presetKey) => {
    const preset = presets[presetKey]
    const range = preset.getRange()
    setActivePreset(presetKey)
    setShowCustom(false)
    onFilterChange(range.start, range.end, presetKey)
  }

  // Apply custom date range
  const applyCustomRange = () => {
    if (customStart && customEnd) {
      setActivePreset('custom')
      onFilterChange(customStart, customEnd, 'custom')
    }
  }

  // Clear filter
  const clearFilter = () => {
    setCustomStart('')
    setCustomEnd('')
    setShowCustom(false)
    applyPreset('allTime')
  }

  // Initialize with "This Month" on mount
  useEffect(() => {
    applyPreset('thisMonth')
  }, [])

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold">Date Range</h3>
            </div>
            {activePreset !== 'allTime' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilter}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(presets).map(([key, preset]) => (
              <Button
                key={key}
                variant={activePreset === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyPreset(key)}
              >
                {preset.label}
              </Button>
            ))}
            <Button
              variant={showCustom ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowCustom(!showCustom)}
            >
              Custom Range
            </Button>
          </div>

          {/* Custom Date Range Inputs */}
          {showCustom && (
            <div className="space-y-3 pt-2 border-t">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    min={customStart}
                  />
                </div>
              </div>
              <Button
                onClick={applyCustomRange}
                disabled={!customStart || !customEnd}
                className="w-full"
                size="sm"
              >
                Apply Custom Range
              </Button>
            </div>
          )}

          {/* Active Filter Display */}
          {activePreset && activePreset !== 'allTime' && (
            <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
              <span className="font-medium">Active Filter:</span>{' '}
              {activePreset === 'custom' && customStart && customEnd
                ? `${customStart} to ${customEnd}`
                : presets[activePreset]?.label}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default DateRangeFilter
