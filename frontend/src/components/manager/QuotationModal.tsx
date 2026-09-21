import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Dashboard and quotation list use the same editor and validation.
export const QuotationModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess?: (quotation: any) => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (isOpen) { onClose(); navigate('/manager/quotations/new'); }
  }, [isOpen, navigate, onClose]);
  return null;
};
