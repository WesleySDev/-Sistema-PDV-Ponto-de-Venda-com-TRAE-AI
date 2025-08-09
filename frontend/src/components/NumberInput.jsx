import React, { useState, useEffect } from 'react';
import { TextField } from '@mui/material';

/**
 * Componente de input para números inteiros com validação
 * @param {object} props - Props do componente
 * @param {number} props.value - Valor numérico atual
 * @param {function} props.onChange - Função chamada quando o valor muda
 * @param {string} props.label - Label do input
 * @param {number} props.min - Valor mínimo permitido
 * @param {number} props.max - Valor máximo permitido
 * @param {boolean} props.required - Se o campo é obrigatório
 * @param {object} props.error - Objeto de erro
 * @param {string} props.helperText - Texto de ajuda
 * @param {object} props.sx - Estilos customizados
 * @param {object} props.InputProps - Props adicionais para o Input
 * @param {object} ...otherProps - Outras props do TextField
 */
const NumberInput = ({
  value = 0,
  onChange,
  label = 'Número',
  min = 0,
  max,
  required = false,
  error = false,
  helperText = '',
  sx = {},
  InputProps = {},
  ...otherProps
}) => {
  const [displayValue, setDisplayValue] = useState(value === 0 ? '' : value.toString());

  // Sincroniza o valor interno com o valor externo
  useEffect(() => {
    setDisplayValue(value === 0 ? '' : value.toString());
  }, [value]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    // Permite apenas números
    const cleanInput = inputValue.replace(/[^0-9]/g, '');
    
    setDisplayValue(cleanInput);
    
    // Converte para número e aplica validações
    let numericValue = cleanInput === '' ? 0 : parseInt(cleanInput, 10);
    
    // Aplica limites mínimo e máximo
    if (min !== undefined && numericValue < min) {
      numericValue = min;
    }
    if (max !== undefined && numericValue > max) {
      numericValue = max;
    }
    
    // Chama o onChange externo
    if (onChange) {
      onChange(numericValue);
    }
  };

  const handleBlur = (e) => {
    // Ao perder o foco, garante que o valor está dentro dos limites
    let finalValue = displayValue === '' ? 0 : parseInt(displayValue, 10);
    
    if (min !== undefined && finalValue < min) {
      finalValue = min;
      setDisplayValue(finalValue.toString());
      if (onChange) {
        onChange(finalValue);
      }
    }
    
    if (max !== undefined && finalValue > max) {
      finalValue = max;
      setDisplayValue(finalValue.toString());
      if (onChange) {
        onChange(finalValue);
      }
    }
    
    // Chama o onBlur externo se existir
    if (otherProps.onBlur) {
      otherProps.onBlur(e);
    }
  };

  return (
    <TextField
      {...otherProps}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      label={label}
      required={required}
      error={error}
      helperText={helperText}
      sx={sx}
      InputProps={{
        ...InputProps,
        inputProps: {
          ...InputProps.inputProps,
          inputMode: 'numeric',
          pattern: '[0-9]*',
          style: {
            textAlign: 'right',
            fontWeight: 'bold',
            ...InputProps.inputProps?.style
          }
        }
      }}
    />
  );
};

export default NumberInput;