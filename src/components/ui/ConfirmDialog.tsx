import React from 'react'

type Props = {
  open: boolean
  title?: string
  description?: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog: React.FC<Props> = ({ open, title = 'Confirm', description, onConfirm, onCancel }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md shadow-md">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{description}</p>}
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200" onClick={onCancel}>Batal</button>
          <button className="px-3 py-1 rounded bg-teal-600 text-white hover:bg-teal-700" onClick={onConfirm}>Keluar</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
