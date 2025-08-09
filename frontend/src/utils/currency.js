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
  // Formata valor para exibição no input (sem formatação quando focado)
  const formatValueForInput = (val) => {
    if (val === 0) return '';
    return val.toString().replace('.', ',');
  };

  const [value, setValue] = useState(initialValue);
  const [displayValue, setDisplayValue] = useState(initialValue === 0 ? '' : formatValueForInput(initialValue));
  const [isFocused, setIsFocused] = useState(false);

  const updateValue = (newValue) => {
    setValue(newValue);
    if (onChangeCallback) {
      onChangeCallback(newValue);
    }
  };

  const onInputChange = (e) => {
    const inputValue = e.target.value;
    
    // Permite apenas números, vírgula e ponto
    let cleanInput = inputValue.replace(/[^0-9,\.]/g, '');
    
    // Se tem ponto, converte para vírgula (padrão brasileiro)
    if (cleanInput.includes('.')) {
      cleanInput = cleanInput.replace('.', ',');
    }
    
    // Garante apenas uma vírgula
    const commaCount = (cleanInput.match(/,/g) || []).length;
    if (commaCount > 1) {
      const parts = cleanInput.split(',');
      cleanInput = parts[0] + ',' + parts.slice(1).join('');
    }
    
    // Permite vírgula no início (ex: ',50' vira '0,50')
    if (cleanInput.startsWith(',')) {
      cleanInput = '0' + cleanInput;
    }
    
    // Permite vírgula no final (ex: '6,' fica como '6,')
    // Não precisa fazer nada especial, apenas manter como está
    
    setDisplayValue(cleanInput);
    
    // Converte para número
    let numericValue = 0;
    if (cleanInput) {
      let normalizedValue = cleanInput.replace(',', '.');
      // Se termina com ponto, remove para evitar erro no parseFloat
      if (normalizedValue.endsWith('.')) {
        normalizedValue = normalizedValue.slice(0, -1);
      }
      numericValue = parseFloat(normalizedValue) || 0;
    }
    
    updateValue(numericValue);
  };

  const onBlur = () => {
    setIsFocused(false);
    // Ao perder o foco, formata o valor como moeda
    if (value > 0) {
      setDisplayValue(formatCurrency(value));
    } else {
      setDisplayValue('');
    }
  };

  const onFocus = () => {
    setIsFocused(true);
    // Ao focar, mostra apenas o número para facilitar edição
    if (value > 0) {
      setDisplayValue(formatValueForInput(value));
    } else {
      setDisplayValue('');
    }
  };

  return {
    value,
    displayValue,
    onInputChange,
    onBlur,
    onFocus,
    setValue: (newValue) => {
      updateValue(newValue);
      if (!isFocused) {
        setDisplayValue(newValue === 0 ? '' : formatCurrency(newValue));
      } else {
        setDisplayValue(formatValueForInput(newValue));
      }
    }
  };
};