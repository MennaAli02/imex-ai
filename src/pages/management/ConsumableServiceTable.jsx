import { useState } from 'react'
import { useData } from '../../data/DataContext'
import { formatCurrency } from '../../lib/utils'

// Stand-in for the editable <tree> embedded in the "Consumable Service" group.
export default function ConsumableServiceTable({ lines, onChange }) {
  const { getAll } = useData()
  const products = getAll('products')
  const uoms = getAll('uoms')
  const [newProductId, setNewProductId] = useState('')
  const [newQty, setNewQty] = useState(1)

  const allDone = lines.length > 0 && lines.every((l) => l.isDone)

  const markDone = (lineId) => {
    onChange(lines.map((l) => (l.id === lineId ? { ...l, isDone: true } : l)))
  }

  const markAllDone = () => {
    onChange(lines.map((l) => ({ ...l, isDone: true })))
  }

  const addLine = () => {
    if (!newProductId) return
    const product = products.find((p) => p.id === Number(newProductId))
    if (!product) return
    const qty = Number(newQty) || 1
    const nextSeq = lines.reduce((m, l) => Math.max(m, l.sequence_), 0) + 1
    onChange([
      ...lines,
      {
        id: nextSeq,
        sequence_: nextSeq,
        productId: product.id,
        uomId: uoms[0]?.id ?? null,
        barcode: product.barcode,
        price: product.price,
        plannedQty: qty,
        totalPrice: product.price * qty,
        isDone: false,
      },
    ])
    setNewProductId('')
    setNewQty(1)
  }

  const removeLine = (lineId) => {
    onChange(lines.filter((l) => l.id !== lineId))
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        {!allDone && lines.length > 0 && (
          <button
            type="button"
            onClick={markAllDone}
            className="bg-brand-500 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md"
          >
            Done All
          </button>
        )}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-1 pr-2">#</th>
            <th className="py-1 pr-2">Product</th>
            <th className="py-1 pr-2">UoM</th>
            <th className="py-1 pr-2">Barcode</th>
            <th className="py-1 pr-2">Price</th>
            <th className="py-1 pr-2">Qty</th>
            <th className="py-1 pr-2">Total</th>
            <th className="py-1 pr-2"></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const product = products.find((p) => p.id === line.productId)
            const uom = uoms.find((u) => u.id === line.uomId)
            return (
              <tr key={line.id} className="border-b border-gray-100">
                <td className="py-1 pr-2">{line.sequence_}</td>
                <td className="py-1 pr-2">{product?.name ?? '—'}</td>
                <td className="py-1 pr-2">{uom?.name ?? '—'}</td>
                <td className="py-1 pr-2">{line.barcode}</td>
                <td className="py-1 pr-2">{formatCurrency(line.price)}</td>
                <td className="py-1 pr-2">{line.plannedQty}</td>
                <td className="py-1 pr-2">{formatCurrency(line.totalPrice)}</td>
                <td className="py-1 pr-2 whitespace-nowrap">
                  {!line.isDone ? (
                    <button
                      type="button"
                      onClick={() => markDone(line.id)}
                      className="bg-brand-500 text-white text-xs font-semibold px-2 py-1 rounded-md mr-2"
                    >
                      Done
                    </button>
                  ) : (
                    <span className="text-green-600 text-xs font-semibold mr-2">✔ Done</span>
                  )}
                  <button type="button" onClick={() => removeLine(line.id)} className="text-red-500 text-xs">
                    ✕
                  </button>
                </td>
              </tr>
            )
          })}
          {lines.length === 0 && (
            <tr>
              <td colSpan={8} className="py-3 text-center text-gray-400">
                No consumable services
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex items-end gap-2 mt-3">
        <select className="field-input" value={newProductId} onChange={(e) => setNewProductId(e.target.value)}>
          <option value="">+ Add product...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          className="field-input w-20"
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
        />
        <button type="button" onClick={addLine} className="bg-gray-100 hover:bg-gray-200 text-sm font-semibold px-3 py-2 rounded-md">
          Add
        </button>
      </div>
    </div>
  )
}
