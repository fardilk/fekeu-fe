import axios, { AxiosProgressEvent } from 'axios';

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
		const res = await axios.post<UploadResponse>('http://localhost:8080/uploads', form, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				// let the browser set Content-Type with boundary
			},
					onUploadProgress: (ev?: AxiosProgressEvent) => {
						try {
							if (ev && typeof ev.loaded === 'number' && typeof ev.total === 'number' && onProgress) {
								const percent = Math.round((ev.loaded * 100) / ev.total);
								onProgress(percent);
							}
						} catch (_) {}
					},
		});

		return res.data;
	} catch (err: any) {
		// normalize common axios/server errors into a thrown Error with message
		if (err.response && err.response.data && err.response.data.error) {
			throw new Error(err.response.data.error);
		}
		if (err.code === 'ERR_BAD_REQUEST') throw new Error('Bad request');
		throw new Error(err.message || 'Upload failed');
	}
}

export default uploadReceipt;

export async function finalizeUpload(id: string, accessToken: string): Promise<any> {
	try {
		const res = await axios.post(`http://localhost:8080/uploads/${id}/submit`, {}, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
		return res.data;
	} catch (err: any) {
		if (err.response && err.response.data && err.response.data.error) throw new Error(err.response.data.error);
		throw new Error(err.message || 'Finalize failed');
	}
}
