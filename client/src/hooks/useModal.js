import { useState, useCallback } from 'react';

export default function useModal(initial=false){
  const [open, setOpen] = useState(initial);
  const openModal = useCallback(()=>setOpen(true), []);
  const closeModal = useCallback(()=>setOpen(false), []);
  return { open, openModal, closeModal, setOpen };
}
