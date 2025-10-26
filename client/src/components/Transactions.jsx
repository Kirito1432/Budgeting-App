/**
 * Transactions Component with shadcn/ui
 *
 * Manages all transaction-related functionality with modern UI
 */

import { useState } from 'react'
import { Download, Trash2, AlertCircle, Plus, Edit2, X, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

function Transactions({
  transactions,
  categories,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onExportCSV,
  onClearDatabase
}) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
    transaction_type: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [editFormData, setEditFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
    transaction_type: '',
    date: ''
  })
  const [notification, setNotification] = useState({ show: false, type: '', message: '' })

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message })
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await onAddTransaction(formData)
    if (success) {
      showNotification('success', 'Transaction added!')
      setFormData({ description: '', amount: '', category_id: '', transaction_type: '' })
    } else {
      showNotification('error', 'Failed to add transaction')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this transaction?')) {
      const success = await onDeleteTransaction(id)
      showNotification(success ? 'success' : 'error', success ? 'Deleted!' : 'Failed to delete')
    }
  }

  const handleClearDatabase = async () => {
    const success = await onClearDatabase()
    showNotification(success ? 'success' : 'error', success ? 'All cleared!' : 'Failed to clear')
  }

  const startEditing = (transaction) => {
    setEditingId(transaction.id)
    setEditFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      category_id: transaction.category_id.toString(),
      transaction_type: transaction.transaction_type,
      date: transaction.date.split('T')[0] // Format date for input
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditFormData({
      description: '',
      amount: '',
      category_id: '',
      transaction_type: '',
      date: ''
    })
  }

  const handleUpdate = async (id) => {
    const success = await onUpdateTransaction(id, {
      ...editFormData,
      amount: parseFloat(editFormData.amount),
      category_id: parseInt(editFormData.category_id)
    })
    if (success) {
      showNotification('success', 'Transaction updated!')
      cancelEditing()
    } else {
      showNotification('error', 'Failed to update transaction')
    }
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white animate-in slide-in-from-right`}>
          {notification.message}
        </div>
      )}

      {/* Add Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Transaction
          </CardTitle>
          <CardDescription>Record a new income or expense</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Amount"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            <Select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </Select>
            <Select
              required
              value={formData.transaction_type}
              onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
            >
              <option value="">Type</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
            <Button type="submit" className="w-full">Add</Button>
          </form>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>{transactions.length} total transactions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClearDatabase}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No transactions yet. Add one above!
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map(t => (
                <div
                  key={t.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    editingId === t.id ? 'border-blue-300 bg-blue-50/50' : 'hover:bg-accent/50'
                  }`}
                >
                  {editingId === t.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">Description</label>
                          <Input
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Amount</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editFormData.amount}
                            onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Category</label>
                          <Select
                            value={editFormData.category_id}
                            onChange={(e) => setEditFormData({ ...editFormData, category_id: e.target.value })}
                            required
                          >
                            <option value="">Select category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Type</label>
                          <Select
                            value={editFormData.transaction_type}
                            onChange={(e) => setEditFormData({ ...editFormData, transaction_type: e.target.value })}
                            required
                          >
                            <option value="">Select type</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Date</label>
                          <Input
                            type="date"
                            value={editFormData.date}
                            onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(t.id)}
                          className="flex-1"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{t.description}</p>
                          <Badge variant={t.transaction_type === 'income' ? 'default' : 'secondary'}>
                            {t.transaction_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t.category_name || 'Uncategorized'} • {new Date(t.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className={`font-semibold ${
                          t.transaction_type === 'income' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {t.transaction_type === 'income' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditing(t)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(t.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Transactions
