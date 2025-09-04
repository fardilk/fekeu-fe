import React, { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../atoms/Button'
import ConfirmDialog from '../ui/ConfirmDialog'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }

export const LogoutButton: React.FC<Props> = ({ label = 'Logout', onClick: userOnClick, ...rest }) => {
  const logout = useAuthStore(s => s.logout)
  const [open, setOpen] = useState(false)

  const openDialog = () => setOpen(true)
  const closeDialog = () => setOpen(false)

  const handleConfirm = (e?: React.MouseEvent) => {
    // call the provided handler (which may navigate) then logout
    if (userOnClick) {
      // @ts-ignore allow calling with optional event
      userOnClick(e as any)
    }
    logout()
    closeDialog()
  }

  return (
    <>
      <Button variant="secondary" onClick={openDialog} {...rest}>
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        title="Konfirmasi Keluar"
        description="Anda yakin ingin keluar?"
        onConfirm={() => handleConfirm()}
        onCancel={closeDialog}
      />
    </>
  )
}

export default LogoutButton
