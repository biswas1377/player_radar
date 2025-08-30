import React from 'react';
import './ModalCenter.css';

export default function ModalCenter({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-center-backdrop" onClick={onClose}>
      <div className="modal-center" onClick={e => e.stopPropagation()}>
        {title && <div className="modal-center-header"><h3>{title}</h3></div>}
        <div className="modal-center-body">{children}</div>
      </div>
    </div>
  );
}
