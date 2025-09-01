import React from 'react';
import UploadReceiptForm from '../components/molecules/UploadReceiptForm';
import { useToast } from '../components/ui/ToastContext';
import { TotalPemasukan, BarGraphs, DaftarPembayaran } from '../components/molecules';
import { useUIStore } from '../store/uiStore';

const Homepage: React.FC = () => {
  const toast = useToast();

  const uploading = useUIStore(s => s.uploading);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-4">Catatan Keuangan</h1>
        <p className="text-slate-600 dark:text-slate-300">Catatan pemasukan anda.</p>

        <div className="mt-8 p-4 border border-slate-100 rounded-lg">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left wrapper */}
            <div className="left-wrapper lg:col-span-1 lg:row-span-2">
              <UploadReceiptForm variant="soft" onUpload={async (file) => {
                toast.showToast('File uploaded (mock).', 'success');
              }} />
            </div>

            {/* Right wrapper (nested layout) */}
            <div className={`right-wrapper lg:col-span-2 grid grid-rows-[auto,1fr] gap-4 ${uploading ? 'bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-4 rounded-lg' : ''}`}>
              <div className="top-cards grid grid-cols-1 md:grid-cols-2 gap-4">
                <TotalPemasukan variant="solid"/>
                <BarGraphs variant="soft" granularity="monthly" />
              </div>

              <div className="table-area">
                <DaftarPembayaran variant="default"   />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
