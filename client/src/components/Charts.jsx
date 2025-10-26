/**
 * Charts Component with shadcn/ui
 */

import { useEffect, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function Charts({ dateFilter }) {
  const expenseChartRef = useRef(null)
  const budgetChartRef = useRef(null)
  const incomeExpenseChartRef = useRef(null)
  const trendChartRef = useRef(null)

  const [expenseData, setExpenseData] = useState([])
  const [budgetData, setBudgetData] = useState([])
  const [incomeExpenseData, setIncomeExpenseData] = useState([])
  const [trendData, setTrendData] = useState([])

  const chartInstances = useRef({})

  // Fetch data when component mounts or when date filter changes
  useEffect(() => {
    fetchChartData()
  }, [dateFilter])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(chartInstances.current).forEach(chart => chart?.destroy())
    }
  }, [])

  useEffect(() => { if (expenseData.length > 0) renderExpenseChart() }, [expenseData])
  useEffect(() => { if (budgetData.length > 0) renderBudgetChart() }, [budgetData])
  useEffect(() => { if (incomeExpenseData.length > 0) renderIncomeExpenseChart() }, [incomeExpenseData])
  useEffect(() => { if (trendData.length > 0) renderTrendChart() }, [trendData])

  const fetchChartData = async () => {
    try {
      // Build query params for date filtering
      const params = new URLSearchParams()
      if (dateFilter?.start) {
        params.append('start_date', dateFilter.start)
      }
      if (dateFilter?.end) {
        params.append('end_date', dateFilter.end)
      }
      const queryString = params.toString() ? `?${params.toString()}` : ''

      const [expenseRes, budgetRes, incomeExpenseRes, trendRes] = await Promise.all([
        fetch(`/api/charts/expense-breakdown${queryString}`),
        fetch(`/api/budget-summary${queryString}`),
        fetch(`/api/charts/income-expense${queryString}`),
        fetch(`/api/charts/monthly-trend${queryString}`)
      ])
      setExpenseData(await expenseRes.json())
      setBudgetData(await budgetRes.json())
      setIncomeExpenseData(await incomeExpenseRes.json())
      setTrendData(await trendRes.json())
    } catch (error) {
      console.error('Error fetching chart data:', error)
    }
  }

  const renderExpenseChart = () => {
    const canvas = expenseChartRef.current
    if (!canvas) return
    chartInstances.current.expense?.destroy()
    const ctx = canvas.getContext('2d')
    chartInstances.current.expense = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: expenseData.map(item => item.name),
        datasets: [{
          data: expenseData.map(item => item.total),
          backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a']
        }]
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
    })
  }

  const renderBudgetChart = () => {
    const canvas = budgetChartRef.current
    if (!canvas) return
    chartInstances.current.budget?.destroy()
    const ctx = canvas.getContext('2d')
    chartInstances.current.budget = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: budgetData.map(item => item.name),
        datasets: [
          { label: 'Budget', data: budgetData.map(item => item.budget_limit), backgroundColor: '#667eea' },
          { label: 'Spent', data: budgetData.map(item => item.spent), backgroundColor: '#764ba2' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' } } }
    })
  }

  const renderIncomeExpenseChart = () => {
    const canvas = incomeExpenseChartRef.current
    if (!canvas) return
    chartInstances.current.incomeExpense?.destroy()
    const ctx = canvas.getContext('2d')
    const income = incomeExpenseData.find(item => item.transaction_type === 'income')?.total || 0
    const expense = incomeExpenseData.find(item => item.transaction_type === 'expense')?.total || 0
    chartInstances.current.incomeExpense = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Income', 'Expenses'],
        datasets: [{ data: [income, expense], backgroundColor: ['#28a745', '#dc3545'] }]
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
    })
  }

  const renderTrendChart = () => {
    const canvas = trendChartRef.current
    if (!canvas) return
    chartInstances.current.trend?.destroy()
    const ctx = canvas.getContext('2d')
    chartInstances.current.trend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trendData.map(item => item.month),
        datasets: [
          { label: 'Income', data: trendData.map(item => item.income), borderColor: '#28a745', backgroundColor: 'rgba(40, 167, 69, 0.1)', tension: 0.4 },
          { label: 'Expenses', data: trendData.map(item => item.expenses), borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.1)', tension: 0.4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' } } }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Charts & Analytics</h2>
        <p className="text-muted-foreground">Visual insights into your financial data</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas ref={expenseChartRef}></canvas>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget vs Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas ref={budgetChartRef}></canvas>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas ref={incomeExpenseChartRef}></canvas>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas ref={trendChartRef}></canvas>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Charts
