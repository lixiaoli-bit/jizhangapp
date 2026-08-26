import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import './App.css'

// ====== 预设分类 ======
const CATEGORIES = ['餐饮', '交通', '购物', '工资', '娱乐', '投资', '其他']

// ====== 柔雾莫兰迪色系 ======
const COLORS = [
  '#8BA3C4', '#D4A5A5', '#E8C9A0', '#A8C4B8', '#C5B4D4', '#D4B5B5', '#F0C4A8'
]

function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions')
    return saved ? JSON.parse(saved) : []
  })
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
  const [editingId, setEditingId] = useState(null)
  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem('budget')
    return saved ? Number(saved) : 5000
  })
  const [pieMode, setPieMode] = useState('income')

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem('budget', String(budget))
  }, [budget])

  const addTransaction = (newRecord) => {
    setTransactions(prev => [...prev, { ...newRecord, id: Date.now() }])
  }

  const deleteTransaction = (id) => {
    if (window.confirm('确定删除吗？')) {
      setTransactions(prev => prev.filter(item => item.id !== id))
    }
  }

  const updateTransaction = (id, updatedFields) => {
    setTransactions(prev => prev.map(item => 
      item.id === id ? { ...item, ...updatedFields } : item
    ))
  }

  const monthData = useMemo(() => {
    return transactions.filter(t => dayjs(t.date).format('YYYY-MM') === month)
  }, [transactions, month])

  const { totalIncome, totalExpense, balance, incomePieData, expensePieData } = useMemo(() => {
    let income = 0, expense = 0
    const incomeMap = {}
    const expenseMap = {}
    
    monthData.forEach(t => {
      if (t.type === '收入') {
        income += Number(t.amount)
        incomeMap[t.category] = (incomeMap[t.category] || 0) + Number(t.amount)
      } else {
        expense += Number(t.amount)
        expenseMap[t.category] = (expenseMap[t.category] || 0) + Number(t.amount)
      }
    })

    const incomePieData = Object.entries(incomeMap).map(([name, value]) => ({ name, value }))
    const expensePieData = Object.entries(expenseMap).map(([name, value]) => ({ name, value }))

    return { 
      totalIncome: income, 
      totalExpense: expense, 
      balance: income - expense, 
      incomePieData, 
      expensePieData 
    }
  }, [monthData])

  const currentPieData = pieMode === 'income' ? incomePieData : expensePieData
  const pieTitle = pieMode === 'income' ? '📈 收入分类占比' : '📉 支出分类占比'
  const pieTitleClass = pieMode === 'income' ? 'income-title' : 'expense-title'

  const isOverBudget = totalExpense > budget

  const exportCSV = () => {
    if (monthData.length === 0) return alert('本月无数据可导出')
    const headers = '日期,类型,分类,金额,描述\n'
    const rows = monthData.map(t => 
      `${t.date},${t.type},${t.category},${t.amount},${t.desc || ''}`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `记账_${month}.csv`
    link.click()
  }

  const renderLegend = (data) => (props) => {
    const { payload } = props
    const total = data.reduce((sum, d) => sum + d.value, 0)
    return (
      <ul className="legend-list">
        {payload.map((entry, index) => {
          const percent = ((entry.payload.value / total) * 100).toFixed(1)
          return (
            <li key={`item-${index}`} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: entry.color }}></span>
              <span className="legend-name">{entry.value}</span>
              <span className="legend-percent">{percent}%</span>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="app">
      <h1>💰 豪华记账本</h1>
      
      <div className="toolbar">
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
        <label>月度预算: 
          <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} />
        </label>
        <button onClick={exportCSV}>📥 导出CSV</button>
      </div>

      <div className="stats">
        <div className="stat-card income">
          <span className="label">💰 本月收入</span>
          <span className="value">¥{totalIncome.toFixed(2)}</span>
        </div>
        <div className="stat-card expense">
          <span className="label">📤 本月支出</span>
          <span className="value">¥{totalExpense.toFixed(2)}</span>
        </div>
        <div className="stat-card balance">
          <span className="label">📊 本月结余</span>
          <span className="value" style={{ color: balance >= 0 ? '#5B8A6F' : '#C47A7A' }}>
            ¥{balance.toFixed(2)}
          </span>
        </div>
      </div>

      {isOverBudget && (
        <div className="alert">⚠️ 警告！本月支出已超过预算 ¥{budget}</div>
      )}

      <div className="dashboard">
        <div className="chart-area">
          <div className="pie-wrapper">
            <div className="pie-toggle">
              <button 
                className={pieMode === 'income' ? 'active' : ''}
                onClick={() => setPieMode('income')}
              >
                💰 收入
              </button>
              <button 
                className={pieMode === 'expense' ? 'active' : ''}
                onClick={() => setPieMode('expense')}
              >
                💸 支出
              </button>
            </div>

            <p className={`pie-title ${pieTitleClass}`}>{pieTitle}</p>
            
            {currentPieData.length > 0 ? (
              <div className="pie-container">
                <PieChart width={280} height={280}>
                  <Pie 
                    data={currentPieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50} 
                    outerRadius={100} 
                    dataKey="value"
                  >
                    {currentPieData.map((_, index) => (
                      <Cell key={`pie-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `¥${value.toFixed(2)}`} />
                  <Legend 
                    content={renderLegend(currentPieData)}
                    wrapperStyle={{ width: '100%' }}
                  />
                </PieChart>
              </div>
            ) : (
              <p className="empty-chart">
                {pieMode === 'income' ? '暂无收入数据，快去添加吧 ✨' : '暂无支出数据，快去添加吧 ✨'}
              </p>
            )}
          </div>
        </div>

        <div className="form-area">
          <TransactionForm 
            onAdd={addTransaction} 
            editingId={editingId}
            transactions={transactions}
            onUpdate={updateTransaction}
            onCancelEdit={() => setEditingId(null)}
          />
        </div>
      </div>

      <TransactionList 
        data={monthData} 
        onDelete={deleteTransaction}
        onEdit={(id) => setEditingId(id)}
      />
    </div>
  )
}

// ====== 表单组件 ======
function TransactionForm({ onAdd, editingId, transactions, onUpdate, onCancelEdit }) {
  const [type, setType] = useState('支出')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))

  const editTarget = transactions.find(t => t.id === editingId)
  useEffect(() => {
    if (editTarget) {
      setType(editTarget.type)
      setAmount(editTarget.amount)
      setCategory(editTarget.category)
      setDesc(editTarget.desc || '')
      setDate(editTarget.date)
    }
  }, [editTarget])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return alert('请输入有效金额')
    
    const record = { type, amount: Number(amount), category, desc, date }
    if (editingId) {
      onUpdate(editingId, record)
      onCancelEdit()
    } else {
      onAdd(record)
    }
    if (!editingId) {
      setAmount('')
      setDesc('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="transaction-form">
      <h3>{editingId ? '✏️ 编辑记录' : '➕ 新增记录'}</h3>
      <div className="form-row">
        <select value={type} onChange={e => setType(e.target.value)}>
          <option>收入</option>
          <option>支出</option>
        </select>
        <input type="number" placeholder="金额" value={amount} onChange={e => setAmount(e.target.value)} step="0.01" />
      </div>
      <div className="form-row">
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input type="text" placeholder="描述（可选）" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <div className="form-row">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button type="submit">{editingId ? '更新' : '添加'}</button>
        {editingId && <button type="button" onClick={onCancelEdit}>取消</button>}
      </div>
    </form>
  )
}

// ====== 列表组件 ======
function TransactionList({ data, onDelete, onEdit }) {
  if (data.length === 0) return <p className="empty">📭 本月暂无记录</p>
  
  const grouped = data.reduce((acc, cur) => {
    const key = cur.date
    if (!acc[key]) acc[key] = []
    acc[key].push(cur)
    return acc
  }, {})

  return (
    <div className="list">
      {Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([date, items]) => (
        <div key={date} className="day-group">
          <h4>{date}  (共{items.reduce((s, i) => s + Number(i.amount), 0).toFixed(2)}元)</h4>
          {items.map(item => (
            <div key={item.id} className="transaction-item" style={{ borderLeftColor: item.type === '收入' ? '#A8C4B8' : '#D4A5A5' }}>
              <span>{item.category}</span>
              <span>{item.desc}</span>
              <span style={{ color: item.type === '收入' ? '#5B8A6F' : '#C47A7A', fontWeight: 600 }}>
                {item.type === '收入' ? '+' : '-'}¥{Number(item.amount).toFixed(2)}
              </span>
              <div>
                <button onClick={() => onEdit(item.id)}>✏️</button>
                <button onClick={() => onDelete(item.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default App