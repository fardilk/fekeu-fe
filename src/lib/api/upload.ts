import axios, { AxiosRequestConfig, type AxiosProgressEvent } from 'axios';
import { useAuthStore } from '../../store/authStore';

export type UploadResponse = {
	id: string;
	filename: string;
	url: string;
	size: number;
	mimeType: string;
	uploadedAt: string;
	ocrFound: boolean;
	ocrAmount?: number;
	message?: string;
};

export async function uploadReceipt(
	file: File,
	accessToken: string,
	onProgress?: (percent: number) => void,
): Promise<UploadResponse> {
	const form = new FormData();
	form.append('file', file);

	try {
    const base = (import.meta as any).env?.VITE_UPLOAD_API_URL || 'http://localhost:8081';
    const url = base.replace(/\/?$/,'') + '/uploads';
    const headers: Record<string,string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`; // optional override; otherwise interceptor handles

		const config: AxiosRequestConfig = {
			headers,
			// Send cookies so HttpOnly refresh token remains attached (backend suggestion).
			withCredentials: true,
			onUploadProgress: (ev?: AxiosProgressEvent) => {
				try {
					if (ev && typeof ev.loaded === 'number' && typeof ev.total === 'number' && onProgress) {
						const percent = Math.round((ev.loaded * 100) / ev.total);
						onProgress(percent);
					}
				} catch (_) {}
			},
		};

		// Standalone request: ONLY hits /uploads; no interceptors => no /refresh or other endpoints.
		const res = await axios.post<UploadResponse>(url, form, config);

		return res.data;
	} catch (err: any) {
		if (err?.response?.status === 401) {
			// Centralize unauthorized handling: clear auth + redirect to login.
			try { (useAuthStore.getState() as any).logout?.(); } catch (_) {}
			try { window.location.href = '/login'; } catch (_) {}
			throw new Error('Unauthorized: token invalid or expired. Silakan login kembali.');
		}
		if (err.response && err.response.data && err.response.data.error) {
			throw new Error(err.response.data.error);
		}
		if (err.code === 'ERR_BAD_REQUEST') throw new Error('Bad request');
		throw new Error(err.message || 'Upload failed');
	}
}

export default uploadReceipt;

// finalizeUpload removed per new flow (single direct upload on submit)
