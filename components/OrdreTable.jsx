import React from 'react';

export default function OrdreTable({ data, loading }) {
  return (
    <table className="ordre-table">
      <thead>
        <tr>
          <th>Posició</th>
          <th>Jugador</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan="2" className="ordre-loading-cell">
              <div className="spinner" />
            </td>
          </tr>
        ) : data.length === 0 ? (
          <tr>
            <td colSpan="2" className="ordre-empty">No hi ha dades d’ordre</td>
          </tr>
        ) : (
          data.map((item) => (
            <tr key={item.jugador_id}>
              <td>{item.posicio}</td>
              <td>{item.jugador_id}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
