import { useState } from 'react'
import { useData } from '../../data/DataContext'
import { formatCurrency } from '../../lib/utils'

// Stand-in for the "Basket Items" accordion (consumable + extra item tabs) on
// the RIS Appointment form. Only relevant once a booking reaches
// Under Inspection / Completed, same as the real view's invisible condition.
export default function BasketTables({ lines, onLinesChange, extraLines, onExtraLinesChange, basketLocationId, onBasketLocationChange }) {
  const { getAll } = useData()
  const products = getAll('products')
  const uoms = getAll('uoms')
  const basketLocations = getAll('basketLocations')
  const [tab, setTab] = useState('consumable')

  const [newProductId, setNewProductId] = useState('')
  const [newQty, setNewQty] = useState(1)

  const allDone = lines.length > 0 && lines.every((l) => l.isDone)
  const allExtraDone = extraLines.length > 0 && extraLines.every((l) => l.isDone)

  const addLine = () => {
    if (!newProductId) return
    const product = products.find((p) => p.id === Number(newProductId))
    if (!product) return
    const qty = Number(newQty) || 1
    const nextSeq = lines.reduce((m, l) => Math.max(m, l.sequence_ || 0), 0) + 1
    if (tab === 'consumable') {
      onLinesChange([
        ...lines,
        {
          id: nextSeq,
          sequence_: nextSeq,
          productId: product.id,
          uomId: uoms[0]?.id ?? null,
          price: product.price,
          plannedQty: qty,
          actualQty: qty,
          returnedQty: 0,
          availableQty: qty,
          totalPrice: product.price * qty,
          isDone: false,
        },
      ])
    } else {
      onExtraLinesChange([
        ...extraLines,
        {
          id: nextSeq,
          productId: product.id,
          uomId: uoms[0]?.id ?? null,
          price: product.price,
          extraAmount: qty,
          returnedQty: 0,
          availableQty: qty,
          extraItemPrice: product.price * qty,
          isDone: false,
        },
      ])
    }
    setNewProductId('')
    setNewQty(1)
  }

  const removeLine = (lineId) => {
    if (tab === 'consumable') onLinesChange(lines.filter((l) => l.id !== lineId))
    else onExtraLinesChange(extraLines.filter((l) => l.id !== lineId))
  }

  const markDone = (lineId) => {
    if (tab === 'consumable') onLinesChange(lines.map((l) => (l.id === lineId ? { ...l, isDone: true } : l)))
    else onExtraLinesChange(extraLines.map((l) => (l.id === lineId ? { ...l, isDone: true } : l)))
  }

  const markReturned = (lineId) => {
    if (tab === 'consumable') onLinesChange(lines.map((l) => (l.id === lineId ? { ...l, isDone: false } : l)))
    else onExtraLinesChange(extraLines.map((l) => (l.id === lineId ? { ...l, isDone: false } : l)))
  }

  const markAllDone = () => {
    if (tab === 'consumable') onLinesChange(lines.map((l) => ({ ...l, isDone: true })))
    else onExtraLinesChange(extraLines.map((l) => ({ ...l, isDone: true })))
  }

  const markAllReturned = () => {
    if (tab === 'consumable') onLinesChange(lines.map((l) => ({ ...l, isDone: false })))
    else onExtraLinesChange(extraLines.map((l) => ({ ...l, isDone: false })))
  }

  const totalExtraItemsPrice = extraLines.reduce((sum, l) => sum + (Number(l.extraItemPrice) || 0), 0)

  const activeLines = tab === 'consumable' ? lines : extraLines
  const activeAllDone = tab === 'consumable' ? allDone : allExtraDone

  return (
    <div>
      <div className="flex gap-4 border-b mb-3">
        <button
          type="button"
          onClick={() => setTab('consumable')}
          className={`pb-2 px-1 text-sm font-semibold border-b-2 ${tab === 'consumable' ? 'border-brand-500 text-brand-700' : 'border-transparent text-gray-500'}`}
        >
          🧪 Consumable Services
        </button>
        <button
          type="button"
          onClick={() => setTab('extra')}
          className={`pb-2 px-1 text-sm font-semibold border-b-2 ${tab === 'extra' ? 'border-brand-500 text-brand-700' : 'border-transparent text-gray-500'}`}
        >
          ➕ Extra Items
        </button>
      </div>

      <div className="mb-3">
        <label className="field-label">Basket Location</label>
        <select className="field-input" value={basketLocationId ?? ''} onChange={(e) => onBasketLocationChange(e.target.value ? Number(e.target.value) : null)}>
          <option value="">-</option>
          {basketLocations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end mb-2 gap-2">
        {!activeAllDone && activeLines.length > 0 && (
          <button type="button" onClick={markAllDone} className="bg-brand-500 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md">
            Done All
          </button>
        )}
        {activeAllDone && activeLines.length > 0 && (
          <button type="button" onClick={markAllReturned} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md">
            Return All
          </button>
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-1 pr-2">Product</th>
            <th className="py-1 pr-2">UoM</th>
            <th className="py-1 pr-2">Price</th>
            {tab === 'consumable' ? (
              <>
                <th className="py-1 pr-2">Planned</th>
                <th className="py-1 pr-2">Actual</th>
                <th className="py-1 pr-2">Returned</th>
                <th className="py-1 pr-2">Available</th>
                <th className="py-1 pr-2">Total</th>
              </>
            ) : (
              <>
                <th className="py-1 pr-2">Qty</th>
                <th className="py-1 pr-2">Returned</th>
                <th className="py-1 pr-2">Available</th>
                <th className="py-1 pr-2">Extra Total</th>
              </>
            )}
            <th className="py-1 pr-2"></th>
          </tr>
        </thead>
        <tbody>
          {activeLines.map((line) => {
            const product = products.find((p) => p.id === line.productId)
            const uom = uoms.find((u) => u.id === line.uomId)
            return (
              <tr key={line.id} className="border-b border-gray-100">
                <td className="py-1 pr-2">{product?.name ?? '—'}</td>
                <td className="py-1 pr-2">{uom?.name ?? '—'}</td>
                <td className="py-1 pr-2">{formatCurrency(line.price)}</td>
                {tab === 'consumable' ? (
                  <>
                    <td className="py-1 pr-2">{line.plannedQty}</td>
                    <td className="py-1 pr-2">{line.actualQty}</td>
                    <td className="py-1 pr-2">{line.returnedQty}</td>
                    <td className="py-1 pr-2">{line.availableQty}</td>
                    <td className="py-1 pr-2">{formatCurrency(line.totalPrice)}</td>
                  </>
                ) : (
                  <>
                    <td className="py-1 pr-2">{line.extraAmount}</td>
                    <td className="py-1 pr-2">{line.returnedQty}</td>
                    <td className="py-1 pr-2">{line.availableQty}</td>
                    <td className="py-1 pr-2">{formatCurrency(line.extraItemPrice)}</td>
                  </>
                )}
                <td className="py-1 pr-2 whitespace-nowrap">
                  {!line.isDone ? (
                    <button type="button" onClick={() => markDone(line.id)} className="bg-brand-500 text-white text-xs font-semibold px-2 py-1 rounded-md mr-2">
                      Done
                    </button>
                  ) : (
                    <button type="button" onClick={() => markReturned(line.id)} className="bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-md mr-2">
                      Return
                    </button>
                  )}
                  <button type="button" onClick={() => removeLine(line.id)} className="text-red-500 text-xs">✕</button>
                </td>
              </tr>
            )
          })}
          {activeLines.length === 0 && (
            <tr>
              <td colSpan={8} className="py-3 text-center text-gray-400">No items</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex items-end gap-2 mt-3">
        <select className="field-input" value={newProductId} onChange={(e) => setNewProductId(e.target.value)}>
          <option value="">+ Add product...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input type="number" min={1} className="field-input w-20" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
        <button type="button" onClick={addLine} className="bg-gray-100 hover:bg-gray-200 text-sm font-semibold px-3 py-2 rounded-md">
          Add
        </button>
      </div>

      {tab === 'extra' && (
        <div className="text-right mt-3 text-sm font-semibold text-brand-700">
          Total Extra Items Price: {formatCurrency(totalExtraItemsPrice)}
        </div>
      )}
    </div>
  )
}
