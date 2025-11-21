import React, { useState } from 'react';

export type ActivityEvidenceType = 'file' | 'video' | 'link' | 'observation';

export interface ActivitySubmissionFormProps {
  activityId: string;
  allowedTypes: ActivityEvidenceType[];
  onSubmit: (data: {
    file?: File;
    videoUrl?: string;
    linkUrl?: string;
    observation?: string;
  }) => Promise<void>;
  loading?: boolean;
}

const ActivitySubmissionForm: React.FC<ActivitySubmissionFormProps> = ({
  activityId,
  allowedTypes,
  onSubmit,
  loading = false,
}) => {
  const [file, setFile] = useState<File | undefined>();
  const [videoUrl, setVideoUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [observation, setObservation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit({ file, videoUrl, linkUrl, observation });
    } catch (err: any) {
      setError(err.message || 'Error al enviar la evidencia');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {allowedTypes.includes('file') && (
        <div>
          <label className="block font-medium">Archivo</label>
          <input
            type="file"
            onChange={e => setFile(e.target.files?.[0])}
            className="mt-1 block w-full"
          />
        </div>
      )}
      {allowedTypes.includes('video') && (
        <div>
          <label className="block font-medium">URL de video</label>
          <input
            type="url"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </div>
      )}
      {allowedTypes.includes('link') && (
        <div>
          <label className="block font-medium">Enlace</label>
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </div>
      )}
      {allowedTypes.includes('observation') && (
        <div>
          <label className="block font-medium">Observación</label>
          <textarea
            value={observation}
            onChange={e => setObservation(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
            rows={3}
          />
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Enviando...' : 'Enviar evidencia'}
      </button>
    </form>
  );
};

export default ActivitySubmissionForm;
