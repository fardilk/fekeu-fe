import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App, { AppInner } from '../../src/App';
import * as keuApi from '../../src/lib/api/keuangan';
import { MemoryRouter } from 'react-router-dom';

// Mock toast context to avoid errors
vi.mock('../../src/components/ui/ToastContext', () => ({
  useToast: () => ({ showToast: () => {} })
}));

// Spy on API
const mockLogin = vi.spyOn(keuApi, 'login');
const mockCatatan = vi.spyOn(keuApi, 'getCatatanList');

describe('DaftarPembayaran functional flow', () => {
  beforeEach(() => {
    localStorage.clear();
    mockLogin.mockReset();
    mockCatatan.mockReset();
  });

  it('logs in and renders daftar pembayaran rows', async () => {
    mockLogin.mockResolvedValue({ token: 'dummy.jwt.token' } as any);
    mockCatatan.mockResolvedValue([
      { id: 11, created_at: '2025-08-30T10:00:00', nominal: 10000 },
      { id: 12, created_at: '2025-08-29T09:00:00', nominal: 5000 }
    ]);

  render(<MemoryRouter initialEntries={['/login']}><AppInner /></MemoryRouter>);

  const userInput = await screen.findByPlaceholderText(/you@example.com/i);
    fireEvent.change(userInput, { target: { value: 'usertest01' } });
  const passInput = screen.getByPlaceholderText(/enter password/i);
    fireEvent.change(passInput, { target: { value: 'test123' } });
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    // Wait for redirect (presence of Daftar Pembayaran label)
    await waitFor(() => {
      const label = screen.getByText(/Daftar Pembayaran/i);
      expect(!!label).toBe(true);
    });

    // Rows should appear
    await waitFor(() => {
      expect(screen.getByText(/30-08-2025/)).toBeTruthy();
      expect(screen.getByText(/29-08-2025/)).toBeTruthy();
    });
  });
});
