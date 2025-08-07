// Utilitário para formatação de moeda brasileira
import { useState } from 'react';

/**
 * Formata um valor numérico para o formato de moeda brasileira
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} - Valor formatado como R$ X,XX
 */
export const formatCurrency = (value) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue);
};

/**
 * Remove a formatação de moeda e retorna apenas o valor numérico
 * @param {string} formattedValue - Valor formatado como R$ X,XX
 * @returns {number} - Valor numérico
 */
export const parseCurrency = (formattedValue) => {
  if (!formattedValue) return 0;
  // Remove R$, espaços e substitui vírgula por ponto
  const cleanValue = formattedValue
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

/**
 * Hook personalizado para input de moeda com formatação automática
 * @param {number} initialValue - Valor inicial
 * @param {function} onChangeCallback - Callback para mudanças de valor
 * @returns {object} - Objeto com value, displayValue e onChange
 */
export const useCurrencyInput = (initialValue = 0, onChangeCallback) => {
  const [value, setValue] = useState(initialValue);
  const [displayValue, setDisplayValue] = useState(initialValue === 0 ? '' : initialValue.toString());
  const [isFormatted, setIsFormatted] = useState(false);

  const updateValue = (newValue) => {
    setValue(newValue);
    if (onChangeCallback) {
      onChangeCallback(newValue);
    }
  };

  const onChange = (inputValue) => {
    // Remove formatação e converte para número
    const numericValue = parseCurrency(inputValue);
    updateValue(numericValue);
    setDisplayValue(formatCurrency(numericValue));
  };

  const onInputChange = (e) => {
    const inputValue = e.target.value;
    
    // Se está formatado e o usuário começou a digitar, remove a formatação
    if (isFormatted) {
      setIsFormatted(false);
      const cleanValue = inputValue.replace(/[^0-9,\.]/g, '');
      setDisplayValue(cleanValue);
      const numericValue = parseFloat(cleanValue.replace(',', '.')) || 0;
      updateValue(numericValue);
      return;
    }
    
    // Permite apenas números, vírgula e ponto
    const cleanInput = inputValue.replace(/[^0-9,\.]/g, '');
    setDisplayValue(cleanInput);
    
    // Converte para número
    const numericValue = parseFloat(cleanInput.replace(',', '.')) || 0;
    updateValue(numericValue);
  };

  const onBlur = () => {
    // Ao perder o foco, formata o valor
    if (value > 0) {
      setDisplayValue(formatCurrency(value));
      setIsFormatted(true);
    } else {
      setDisplayValue('');
      setIsFormatted(false);
    }
  };

  const onFocus = () => {
    // Ao focar, mostra apenas o número para facilitar edição
    if (isFormatted && value > 0) {
      setDisplayValue(value.toString().replace('.', ','));
      setIsFormatted(false);
    }
  };

  return {
    value,
    displayValue,
    onChange,
    onInputChange,
    onBlur,
    onFocus,
    setValue: (newValue) => {
      updateValue(newValue);
      setDisplayValue(formatCurrency(newValue));
      setIsFormatted(true);
    }
  };
};