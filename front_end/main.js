const API_BASE = '/api';

let currentTab = 'dashboard';
let transactions = [];
let categories = [];
let charts = {};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupTabNavigation();
    setupTransactionForm();
    loadCategories();
    loadTransactions();
    loadBudgetSummary();
}

function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.id.replace('-tab', '');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            currentTab = tabId;
            
            if (tabId === 'budget-overview') {
                loadBudgetSummary();
            } else if (tabId === 'charts') {
                loadCharts();
            }
        });
    });
}

function setupTransactionForm() {
    const form = document.getElementById('transaction-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const categoryId = parseInt(document.getElementById('category').value);
        const transactionType = document.getElementById('transaction-type').value;
        
        try {
            const response = await fetch(`${API_BASE}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description,
                    amount,
                    category_id: categoryId,
                    transaction_type: transactionType
                })
            });
            
            if (response.ok) {
                form.reset();
                loadTransactions();
                updateDashboard();
                showNotification('Transaction added successfully!', 'success');
            } else {
                showNotification('Error adding transaction', 'error');
            }
        } catch (error) {
            showNotification('Network error', 'error');
        }
    });
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        categories = await response.json();
        
        const categorySelect = document.getElementById('category');
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadTransactions() {
    try {
        const response = await fetch(`${API_BASE}/transactions`);
        transactions = await response.json();
        
        renderTransactions();
        updateDashboard();
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

function renderTransactions() {
    const container = document.getElementById('transactions-container');
    const recentContainer = document.getElementById('recent-list');
    
    if (transactions.length === 0) {
        container.innerHTML = '<p>No transactions found.</p>';
        recentContainer.innerHTML = '<p>No recent transactions.</p>';
        return;
    }
    
    const transactionHTML = transactions.map(transaction => `
        <div class="transaction-item ${transaction.transaction_type}">
            <div class="transaction-info">
                <h4>${transaction.description}</h4>
                <p>Category: ${transaction.category_name || 'Uncategorized'}</p>
                <small>${new Date(transaction.date).toLocaleDateString()}</small>
            </div>
            <div class="transaction-amount">
                <span class="amount ${transaction.transaction_type}">
                    ${transaction.transaction_type === 'income' ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)}
                </span>
                <button onclick="deleteTransaction(${transaction.id})" class="delete-btn">Delete</button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = transactionHTML;
    
    const recentTransactions = transactions.slice(0, 5);
    const recentHTML = recentTransactions.map(transaction => `
        <div class="recent-transaction">
            <span>${transaction.description}</span>
            <span class="amount ${transaction.transaction_type}">
                ${transaction.transaction_type === 'income' ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)}
            </span>
        </div>
    `).join('');
    
    recentContainer.innerHTML = recentHTML;
}

async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadTransactions();
            showNotification('Transaction deleted successfully!', 'success');
        } else {
            showNotification('Error deleting transaction', 'error');
        }
    } catch (error) {
        showNotification('Network error', 'error');
    }
}

function updateDashboard() {
    const totalIncome = transactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const netBalance = totalIncome - totalExpenses;
    
    document.getElementById('total-income').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('net-balance').textContent = `$${netBalance.toFixed(2)}`;
    
    const netBalanceElement = document.getElementById('net-balance');
    netBalanceElement.className = `amount ${netBalance >= 0 ? 'positive' : 'negative'}`;
}

async function loadBudgetSummary() {
    try {
        const response = await fetch(`${API_BASE}/budget-summary`);
        const budgetData = await response.json();
        
        const container = document.getElementById('budget-summary');
        
        if (budgetData.length === 0) {
            container.innerHTML = '<p>No budget data available.</p>';
            return;
        }
        
        const budgetHTML = budgetData.map(budget => {
            const percentageUsed = budget.percentage;
            const isOverBudget = percentageUsed > 100;
            const progressWidth = Math.min(percentageUsed, 100);
            
            return `
                <div class="budget-card ${isOverBudget ? 'over-budget' : ''}">
                    <h3>${budget.name}</h3>
                    <div class="budget-details">
                        <div class="budget-amounts">
                            <span>Spent: $${budget.spent.toFixed(2)}</span>
                            <span>Budget: $${budget.budget_limit.toFixed(2)}</span>
                            <span class="${budget.remaining >= 0 ? 'remaining' : 'over'}">
                                ${budget.remaining >= 0 ? 'Remaining' : 'Over'}: $${Math.abs(budget.remaining).toFixed(2)}
                            </span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${isOverBudget ? 'over-budget' : ''}" 
                                 style="width: ${progressWidth}%"></div>
                        </div>
                        <div class="percentage">${percentageUsed.toFixed(1)}% used</div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = budgetHTML;
    } catch (error) {
        console.error('Error loading budget summary:', error);
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

async function loadCharts() {
    await Promise.all([
        createExpenseChart(),
        createBudgetChart(),
        createIncomeExpenseChart(),
        createTrendChart()
    ]);
}

async function createExpenseChart() {
    try {
        const response = await fetch(`${API_BASE}/charts/expense-breakdown`);
        const data = await response.json();
        
        if (charts.expenseChart) {
            charts.expenseChart.destroy();
        }
        
        const ctx = document.getElementById('expenseChart').getContext('2d');
        charts.expenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.map(item => item.name),
                datasets: [{
                    data: data.map(item => item.total),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: $${context.parsed.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating expense chart:', error);
    }
}

async function createBudgetChart() {
    try {
        const response = await fetch(`${API_BASE}/budget-summary`);
        const data = await response.json();
        
        if (charts.budgetChart) {
            charts.budgetChart.destroy();
        }
        
        const ctx = document.getElementById('budgetChart').getContext('2d');
        charts.budgetChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.name),
                datasets: [
                    {
                        label: 'Budget',
                        data: data.map(item => item.budget_limit),
                        backgroundColor: '#36A2EB',
                        borderWidth: 1
                    },
                    {
                        label: 'Spent',
                        data: data.map(item => item.spent),
                        backgroundColor: '#FF6384',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating budget chart:', error);
    }
}

async function createIncomeExpenseChart() {
    try {
        const response = await fetch(`${API_BASE}/charts/income-expense`);
        const data = await response.json();
        
        if (charts.incomeExpenseChart) {
            charts.incomeExpenseChart.destroy();
        }
        
        const incomeData = data.find(item => item.transaction_type === 'income');
        const expenseData = data.find(item => item.transaction_type === 'expense');
        
        const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
        charts.incomeExpenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    data: [
                        incomeData ? incomeData.total : 0,
                        expenseData ? expenseData.total : 0
                    ],
                    backgroundColor: ['#28a745', '#dc3545'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: $${context.parsed.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating income/expense chart:', error);
    }
}

async function createTrendChart() {
    try {
        const response = await fetch(`${API_BASE}/charts/monthly-trend`);
        const data = await response.json();
        
        if (charts.trendChart) {
            charts.trendChart.destroy();
        }
        
        const ctx = document.getElementById('trendChart').getContext('2d');
        charts.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => {
                    const date = new Date(item.month + '-01');
                    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                }),
                datasets: [
                    {
                        label: 'Income',
                        data: data.map(item => item.income),
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Expenses',
                        data: data.map(item => item.expenses),
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating trend chart:', error);
    }
}