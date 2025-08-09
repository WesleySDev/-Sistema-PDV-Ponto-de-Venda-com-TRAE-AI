import React from 'react';
import { TextField } from '@mui/material';
import { useCurrencyInput } from '../utils/currency';

/**
 * Componente de input para valores monetários com formatação automática
 * @param {object} props - Props do componente
 * @param {number} props.value - Valor numérico atual
 * @param {function} props.onChange - Função chamada quando o valor muda
 * @param {string} props.label - Label do input
 * @param {boolean} props.required - Se o campo é obrigatório
 * @param {object} props.error - Objeto de erro
 * @param {string} props.helperText - Texto de ajuda
 * @param {object} props.sx - Estilos customizados
 * @param {object} props.InputProps - Props adicionais para o Input
 * @param {object} ...otherProps - Outras props do TextField
 */
const CurrencyInput = ({
  value = 0,
  onChange,
  label = 'Valor',
  required = false,
  error = false,
  helperText = '',
  sx = {},
  InputProps = {},
  ...otherProps
}) => {
  const {
    displayValue,
    onInputChange,
    onBlur,
    onFocus,
    setValue
  } = useCurrencyInput(value, onChange);

  // Sincroniza o valor interno com o valor externo
  React.useEffect(() => {
    setValue(value);
  }, [value, setValue]);

  const handleBlur = (e) => {
    onBlur();
    // Chama o onBlur externo se existir
    if (otherProps.onBlur) {
      otherProps.onBlur(e);
    }
  };

  const handleFocus = (e) => {
    onFocus();
    // Chama o onFocus externo se existir
    if (otherProps.onFocus) {
      otherProps.onFocus(e);
    }
  };

  return (
    <TextField
      {...otherProps}
      value={displayValue}
      onChange={onInputChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      label={label}
      required={required}
      error={error}
      helperText={helperText}
      sx={sx}
      InputProps={{
        ...InputProps,
        inputProps: {
          ...InputProps.inputProps,
          style: {
            textAlign: 'right',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            ...InputProps.inputProps?.style
          }
        }
      }}
    />
  );
};

export default CurrencyInput;