import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Certificate() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/certificates/my').then(r => setCerts(r.data)).finally(() => setLoading(false));
  }, []);

  const downloadPDF = async (cert) => {
    const response = await api.get(`/certificates/${cert.id}/download`, { responseType: 'blob' });
    const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Constancia-${cert.folio}.pdf`;
    link.click();
    window.URL.revokeObjectURL(blobUrl);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Mis Constancias</h1>
      <p className="text-slate-500 text-sm mb-6">{certs.length} constancia{certs.length !== 1 ? 's' : ''} obtenida{certs.length !== 1 ? 's' : ''}</p>

      {certs.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-slate-400">Aún no tienes constancias. Completa un curso y aprueba el examen para obtener tu primera constancia.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {certs.map(cert => (
            <div key={cert.id} className="card border-l-4 border-l-green-400">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-2xl">🏆</span>
                  <h3 className="font-semibold text-slate-800 mt-1">{cert.course_title}</h3>
                  {cert.category && <p className="text-xs text-slate-400">{cert.category}</p>}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                <p className="text-xs text-slate-500">
                  <span className="font-medium">Folio:</span> {cert.folio}
                </p>
                <p className="text-xs text-slate-500">
                  <span className="font-medium">Emitida:</span> {new Date(cert.issued_at).toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' })}
                </p>
              </div>
              <button
                onClick={() => downloadPDF(cert)}
                className="mt-4 btn-primary w-full text-sm py-2">
                ⬇️ Descargar PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
