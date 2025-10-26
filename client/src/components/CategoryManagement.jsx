/**
 * CategoryManagement Component
 *
 * Allows users to create, edit, and delete budget categories.
 * Includes validation and transaction count checking before deletion.
 */

import { useState } from 'react'
import { Plus, Edit2, Trash2, Save, X, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

function CategoryManagement({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newCategory, setNewCategory] = useState({ name: '', budget_limit: '' })
  const [editCategory, setEditCategory] = useState({ name: '', budget_limit: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /**
   * Handles adding a new category
   */
  const handleAddCategory = async () => {
    setError('')

    // Validation
    if (!newCategory.name.trim()) {
      setError('Category name is required')
      return
    }

    if (newCategory.name.length > 50) {
      setError('Category name must be 50 characters or less')
      return
    }

    const budgetLimit = parseFloat(newCategory.budget_limit)
    if (isNaN(budgetLimit) || budgetLimit < 0) {
      setError('Budget limit must be a positive number')
      return
    }

    setLoading(true)
    const success = await onAddCategory({
      name: newCategory.name.trim(),
      budget_limit: budgetLimit
    })

    setLoading(false)

    if (success) {
      setNewCategory({ name: '', budget_limit: '' })
      setIsAdding(false)
      setError('')
    } else {
      setError('Failed to add category. Name may already exist.')
    }
  }

  /**
   * Handles updating an existing category
   */
  const handleUpdateCategory = async (id) => {
    setError('')

    // Validation
    if (!editCategory.name.trim()) {
      setError('Category name is required')
      return
    }

    if (editCategory.name.length > 50) {
      setError('Category name must be 50 characters or less')
      return
    }

    const budgetLimit = parseFloat(editCategory.budget_limit)
    if (isNaN(budgetLimit) || budgetLimit < 0) {
      setError('Budget limit must be a positive number')
      return
    }

    setLoading(true)
    const success = await onUpdateCategory(id, {
      name: editCategory.name.trim(),
      budget_limit: budgetLimit
    })

    setLoading(false)

    if (success) {
      setEditingId(null)
      setEditCategory({ name: '', budget_limit: '' })
      setError('')
    } else {
      setError('Failed to update category. Name may already exist.')
    }
  }

  /**
   * Handles deleting a category
   */
  const handleDeleteCategory = async (id, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"? This will deactivate it if it has transactions.`)) {
      return
    }

    setLoading(true)
    const success = await onDeleteCategory(id)
    setLoading(false)

    if (!success) {
      setError('Failed to delete category')
    }
  }

  /**
   * Starts editing a category
   */
  const startEditing = (category) => {
    setEditingId(category.id)
    setEditCategory({
      name: category.name,
      budget_limit: category.budget_limit.toString()
    })
    setError('')
  }

  /**
   * Cancels editing
   */
  const cancelEditing = () => {
    setEditingId(null)
    setEditCategory({ name: '', budget_limit: '' })
    setError('')
  }

  /**
   * Cancels adding
   */
  const cancelAdding = () => {
    setIsAdding(false)
    setNewCategory({ name: '', budget_limit: '' })
    setError('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Category Management</CardTitle>
          <CardDescription>
            Create, edit, and manage your budget categories. Each category can have a custom budget limit.
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

      {/* Add New Category Button */}
      {!isAdding && (
        <Button
          onClick={() => setIsAdding(true)}
          className="w-full sm:w-auto"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Category
        </Button>
      )}

      {/* Add New Category Form */}
      {isAdding && (
        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Add New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category Name</label>
                <Input
                  type="text"
                  placeholder="e.g., Groceries, Rent, Savings"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  maxLength={50}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Budget Limit ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={newCategory.budget_limit}
                  onChange={(e) => setNewCategory({ ...newCategory, budget_limit: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddCategory}
                  disabled={loading}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Category'}
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelAdding}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <div className="space-y-3">
        {categories.map((category) => (
          <Card key={category.id} className={editingId === category.id ? 'border-2 border-blue-200 bg-blue-50/50' : ''}>
            <CardContent className="pt-6">
              {editingId === category.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category Name</label>
                    <Input
                      type="text"
                      value={editCategory.name}
                      onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                      maxLength={50}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Budget Limit ($)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editCategory.budget_limit}
                      onChange={(e) => setEditCategory({ ...editCategory, budget_limit: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateCategory(category.id)}
                      disabled={loading}
                      size="sm"
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelEditing}
                      disabled={loading}
                      size="sm"
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
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      {category.is_active === 0 && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Budget Limit: <span className="font-semibold">${category.budget_limit.toFixed(2)}</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(category)}
                      disabled={loading}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && !isAdding && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No categories yet. Add your first category to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default CategoryManagement
