import React from 'react';

export default function OrdreToolbar({ onRefresh, secondsAgo }) {
  return (
    <div className="ordre-toolbar">
      <h3>Ordre</h3>
      <div className="ordre-toolbar-actions">
        <button onClick={onRefresh}>Actualitza</button>
        <span className="ordre-toolbar-time">
          {secondsAgo !== null ? `Actualitzat fa ${secondsAgo}s` : ''}
        </span>
      </div>
    </div>
  );
}
