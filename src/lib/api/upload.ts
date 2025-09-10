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

export type UploadOptions = {
	retryUntilSuccess?: boolean; // if true, keep retrying transient failures until success
	retryDelayMs?: number; // delay between retries
};

export async function uploadReceipt(
	file: File,
	accessToken: string,
	onProgress?: (percent: number) => void,
	folder?: string,
	amount?: number,
	options?: UploadOptions,
): Promise<UploadResponse> {
	const form = new FormData();
	// Backend expects the file field to be named "file"
	form.append('file', file);
	// Folder defaults to 'keu' if not provided (backend default expectation)
	const effFolder = folder || 'keu';
	if (effFolder) form.append('folder', effFolder);
	// Optional numeric amount if FE already parsed it (do not send when undefined)
	if (typeof amount === 'number' && !Number.isNaN(amount)) {
		form.append('amount', String(amount));
	}

	try {
	const base = (import.meta as any).env?.VITE_UPLOAD_API_URL || 'http://127.0.0.1:8081';
	const url = base.replace(/\/?$/,'') + '/uploads';
		const headers: Record<string,string> = {};
		// prefer explicit param, fallback to in-memory store token
		let token = accessToken || '';
		try {
			if (!token && (useAuthStore as any).getState) {
				token = (useAuthStore as any).getState().token || '';
			}
		} catch (_) { token = token || ''; }
		if (token) headers['Authorization'] = `Bearer ${token}`;

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
			const retryUntilSuccess = options?.retryUntilSuccess === true;
			const retryDelayMs = options?.retryDelayMs ?? 3000;

			const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

			while (true) {
				try {
					const res = await axios.post<UploadResponse>(url, form, config);
					return res.data;
				} catch (err: any) {
					const status = err?.response?.status;
					const serverError = err?.response?.data?.error || err?.message;

					// Non-retryable cases: unauthorized (handle centrally), or explicit client errors
					if (status === 401) {
						try { (useAuthStore.getState() as any).logout?.(); } catch (_) {}
						try { window.location.href = '/login'; } catch (_) {}
						throw new Error('Unauthorized: token invalid or expired. Silakan login kembali.');
					}

					if (status === 400) {
						const errCode = (err.response && err.response.data && (err.response.data.error || err.response.data.message)) || '';
						// If backend indicates missing_file or file_too_large, stop retrying.
						if (typeof errCode === 'string' && (errCode.includes('missing_file') || errCode.includes('file_too_large'))) {
							throw new Error(errCode || 'Bad request');
						}
					}

					// If caller asked to retry until success, sleep and retry for transient errors
					if (retryUntilSuccess) {
						try {
							// log to console for visibility
							// eslint-disable-next-line no-console
							console.warn('[uploadReceipt] transient failure, will retry in', retryDelayMs, 'ms:', serverError || status || err?.code);
						} catch (_) {}
						await sleep(retryDelayMs);
						// loop and try again
						continue;
					}

					// Otherwise map specific errors and throw
					if (err.response && err.response.data && err.response.data.error) {
						throw new Error(err.response.data.error);
					}
					if (err.code === 'ERR_BAD_REQUEST') throw new Error('Bad request');
					throw new Error(err.message || 'Upload failed');
				}
			}
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
