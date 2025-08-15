import React, { useEffect, useState } from 'react';
import { apiGetClassificacio } from '../api.js';
import OrdreTable from '../components/OrdreTable.jsx';
import OrdreToolbar from '../components/OrdreToolbar.jsx';

export default function Ordre() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [now, setNow] = useState(Date.now());

  const fetchData = () => {
    setLoading(true);
    setError(null);
    apiGetClassificacio()
      .then(json => {
        if (json.error) {
          throw new Error(json.error);
        }
        const items = Array.isArray(json.items) ? json.items : [];
        const ordered = items.sort((a, b) => a.posicio - b.posicio);
        setData(ordered);
        setUpdatedAt(Date.now());
      })
      .catch(() => setError('Error carregant dades.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const secondsAgo = updatedAt ? Math.floor((now - updatedAt) / 1000) : null;

  return (
    <div>
      {error && <div className="ordre-error">{error}</div>}
      <OrdreToolbar onRefresh={fetchData} secondsAgo={secondsAgo} />
      <OrdreTable data={data} loading={loading} />
    </div>
  );
}

/*
Tests manuals:
- Mock { items:[{posicio:1,jugador_id:'J001'}] } → es renderitza una fila.
- Si l’API falla → es veu un banner d’error.
- En clicar Actualitza → re-fetch i actualitza el “fa Xs”.
*/
