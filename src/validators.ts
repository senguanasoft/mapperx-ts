// ============================================================================
// MAPPERX-TS - VALIDATORS MODULE
// ============================================================================

/**
 * Tipo base para todos los validadores
 * Un validador toma un valor desconocido y retorna un valor tipado o lanza un error
 */
export type MapperxValidator<T> = (val: unknown) => T;

/**
 * Error personalizado para validaciones
 */
export class ValidationError extends Error {
  constructor(message: string, public value: unknown) {
    super(message);
    this.name = "ValidationError";
  }
}

// ============================================================================
// VALIDADORES BÁSICOS
// ============================================================================

export const mxs = {
  /**
   * Valida y convierte a string
   * @throws ValidationError si el valor es null/undefined
   */
  string: (val: unknown): string => {
    if (typeof val === "string") return val;
    if (val == null) {
      throw new ValidationError("Expected string, got null/undefined", val);
    }
    return String(val);
  },

  /**
   * Valida y convierte a number
   * @throws ValidationError si el valor no puede ser convertido a número válido
   */
  number: (val: unknown): number => {
    if (typeof val === "number") {
      if (isNaN(val)) {
        throw new ValidationError("Expected number, got NaN", val);
      }
      if (!isFinite(val)) {
        throw new ValidationError("Expected finite number, got Infinity", val);
      }
      return val;
    }

    const n = Number(val);
    if (isNaN(n)) {
      throw new ValidationError(`Cannot convert "${val}" to number`, val);
    }
    if (!isFinite(n)) {
      throw new ValidationError(
        `Cannot convert "${val}" to finite number`,
        val
      );
    }
    return n;
  },

  /**
   * Valida y convierte a boolean
   * @throws ValidationError si el valor no puede ser convertido a boolean
   */
  boolean: (val: unknown): boolean => {
    if (typeof val === "boolean") return val;

    // Valores truthy
    if (val === "true" || val === "1" || val === 1) return true;

    // Valores falsy
    if (val === "false" || val === "0" || val === 0) return false;

    throw new ValidationError(
      `Cannot convert "${val}" to boolean. Expected true/false, 1/0, or "true"/"false"`,
      val
    );
  },

  /**
   * Valida y convierte a Date
   * @throws ValidationError si el valor no es una fecha válida
   */
  date: (val: unknown): Date => {
    if (val instanceof Date) {
      if (isNaN(val.getTime())) {
        throw new ValidationError("Invalid Date object", val);
      }
      return val;
    }

    // Intentar crear fecha desde el valor
    const d = new Date(val as string | number);
    if (isNaN(d.getTime())) {
      throw new ValidationError(`Invalid date: "${val}"`, val);
    }
    return d;
  },

  /**
   * Valida array y cada uno de sus elementos
   * @param itemValidator Validador para cada elemento del array
   */
  array: <T>(itemValidator: MapperxValidator<T>): MapperxValidator<T[]> => {
    return (val: unknown): T[] => {
      if (!Array.isArray(val)) {
        throw new ValidationError("Expected array", val);
      }

      const errors: Array<{ index: number; error: Error }> = [];
      const result: T[] = [];

      for (let i = 0; i < val.length; i++) {
        try {
          result.push(itemValidator(val[i]));
        } catch (e) {
          errors.push({
            index: i,
            error: e instanceof Error ? e : new Error(String(e)),
          });
        }
      }

      if (errors.length > 0) {
        const errorMsg = errors
          .map((e) => `  [${e.index}]: ${e.error.message}`)
          .join("\n");
        throw new ValidationError(`Array validation failed:\n${errorMsg}`, val);
      }

      return result;
    };
  },

  /**
   * Hace que un validador acepte undefined
   */
  optional: <T>(
    validator: MapperxValidator<T>
  ): MapperxValidator<T | undefined> => {
    return (val: unknown): T | undefined => {
      if (val === undefined || val === null) return undefined;
      return validator(val);
    };
  },

  /**
   * Hace que un validador acepte null
   */
  nullable: <T>(validator: MapperxValidator<T>): MapperxValidator<T | null> => {
    return (val: unknown): T | null => {
      if (val === null) return null;
      return validator(val);
    };
  },

  /**
   * Valida que el valor sea uno de los valores del enum
   */
  enum: <T extends string | number>(...values: T[]): MapperxValidator<T> => {
    return (val: unknown): T => {
      if (values.includes(val as T)) return val as T;
      throw new ValidationError(
        `Expected one of [${values.join(", ")}], got "${val}"`,
        val
      );
    };
  },

  /**
   * Valida formato de email
   */
  email: (val: unknown): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const str = mxs.string(val);
    if (!emailRegex.test(str)) {
      throw new ValidationError(`Invalid email format: "${val}"`, val);
    }
    return str;
  },

  /**
   * Validador personalizado
   */
  custom: <T>(fn: (val: unknown) => T): MapperxValidator<T> => fn,
};

// ============================================================================
// VALIDADORES EXTENDIDOS
// ============================================================================

export const mxsExt = {
  /**
   * Valida formato de URL
   */
  url: (val: unknown): string => {
    const str = mxs.string(val);
    try {
      new URL(str);
      return str;
    } catch {
      throw new ValidationError(`Invalid URL format: "${val}"`, val);
    }
  },

  /**
   * Valida número mínimo
   */
  min: (minValue: number): MapperxValidator<number> => {
    return (val: unknown): number => {
      const n = mxs.number(val);
      if (n < minValue) {
        throw new ValidationError(
          `Value ${n} is less than minimum ${minValue}`,
          val
        );
      }
      return n;
    };
  },

  /**
   * Valida número máximo
   */
  max: (maxValue: number): MapperxValidator<number> => {
    return (val: unknown): number => {
      const n = mxs.number(val);
      if (n > maxValue) {
        throw new ValidationError(
          `Value ${n} is greater than maximum ${maxValue}`,
          val
        );
      }
      return n;
    };
  },

  /**
   * Valida rango de número
   */
  range: (min: number, max: number): MapperxValidator<number> => {
    return (val: unknown): number => {
      const n = mxs.number(val);
      if (n < min || n > max) {
        throw new ValidationError(
          `Value ${n} is outside range [${min}, ${max}]`,
          val
        );
      }
      return n;
    };
  },

  /**
   * Valida longitud mínima de string
   */
  minLength: (minLen: number): MapperxValidator<string> => {
    return (val: unknown): string => {
      const str = mxs.string(val);
      if (str.length < minLen) {
        throw new ValidationError(
          `String length ${str.length} is less than minimum ${minLen}`,
          val
        );
      }
      return str;
    };
  },

  /**
   * Valida longitud máxima de string
   */
  maxLength: (maxLen: number): MapperxValidator<string> => {
    return (val: unknown): string => {
      const str = mxs.string(val);
      if (str.length > maxLen) {
        throw new ValidationError(
          `String length ${str.length} is greater than maximum ${maxLen}`,
          val
        );
      }
      return str;
    };
  },

  /**
   * Valida patrón regex
   */
  pattern: (regex: RegExp, message?: string): MapperxValidator<string> => {
    return (val: unknown): string => {
      const str = mxs.string(val);
      if (!regex.test(str)) {
        throw new ValidationError(
          message || `String "${str}" does not match pattern ${regex}`,
          val
        );
      }
      return str;
    };
  },

  /**
   * Valida formato UUID
   */
  uuid: (val: unknown): string => {
    const str = mxs.string(val);
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(str)) {
      throw new ValidationError(`Invalid UUID format: "${val}"`, val);
    }
    return str;
  },

  /**
   * Valida que sea un entero
   */
  integer: (val: unknown): number => {
    const n = mxs.number(val);
    if (!Number.isInteger(n)) {
      throw new ValidationError(`Expected integer, got ${n}`, val);
    }
    return n;
  },

  /**
   * Valida que sea un número positivo
   */
  positive: (val: unknown): number => {
    const n = mxs.number(val);
    if (n <= 0) {
      throw new ValidationError(`Expected positive number, got ${n}`, val);
    }
    return n;
  },

  /**
   * Valida que sea un número negativo
   */
  negative: (val: unknown): number => {
    const n = mxs.number(val);
    if (n >= 0) {
      throw new ValidationError(`Expected negative number, got ${n}`, val);
    }
    return n;
  },

  /**
   * Valida string no vacío
   */
  nonEmpty: (val: unknown): string => {
    const str = mxs.string(val);
    if (str.trim().length === 0) {
      throw new ValidationError("String cannot be empty", val);
    }
    return str;
  },

  /**
   * Valida objeto con estructura específica
   */
  object: <T extends Record<string, MapperxValidator<any>>>(
    shape: T
  ): MapperxValidator<{ [K in keyof T]: ReturnType<T[K]> }> => {
    return (val: unknown) => {
      if (typeof val !== "object" || val === null) {
        throw new ValidationError("Expected object", val);
      }

      const obj = val as Record<string, unknown>;
      const result = {} as any;
      const errors: string[] = [];

      for (const [key, validator] of Object.entries(shape)) {
        try {
          result[key] = validator(obj[key]);
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          errors.push(`  ${key}: ${error.message}`);
        }
      }

      if (errors.length > 0) {
        throw new ValidationError(
          `Object validation failed:\n${errors.join("\n")}`,
          val
        );
      }

      return result;
    };
  },

  /**
   * Valida que sea un record (objeto con keys string)
   */
  record: <V>(
    valueValidator: MapperxValidator<V>
  ): MapperxValidator<Record<string, V>> => {
    return (val: unknown): Record<string, V> => {
      if (typeof val !== "object" || val === null || Array.isArray(val)) {
        throw new ValidationError("Expected record object", val);
      }

      const obj = val as Record<string, unknown>;
      const result: Record<string, V> = {};
      const errors: string[] = [];

      for (const [key, value] of Object.entries(obj)) {
        try {
          result[key] = valueValidator(value);
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          errors.push(`  ${key}: ${error.message}`);
        }
      }

      if (errors.length > 0) {
        throw new ValidationError(
          `Record validation failed:\n${errors.join("\n")}`,
          val
        );
      }

      return result;
    };
  },

  /**
   * Valida tuple (array con tipos específicos por posición)
   */
  tuple: <T extends MapperxValidator<any>[]>(
    ...validators: T
  ): MapperxValidator<{ [K in keyof T]: ReturnType<T[K]> }> => {
    return (val: unknown) => {
      if (!Array.isArray(val)) {
        throw new ValidationError("Expected array for tuple", val);
      }

      if (val.length !== validators.length) {
        throw new ValidationError(
          `Expected tuple of length ${validators.length}, got ${val.length}`,
          val
        );
      }

      const result: any[] = [];
      const errors: string[] = [];

      validators.forEach((validator, index) => {
        try {
          result.push(validator(val[index]));
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          errors.push(`  [${index}]: ${error.message}`);
        }
      });

      if (errors.length > 0) {
        throw new ValidationError(
          `Tuple validation failed:\n${errors.join("\n")}`,
          val
        );
      }

      return result as any;
    };
  },

  /**
   * Valida union de tipos (OR lógico)
   */
  union: <T extends MapperxValidator<any>[]>(
    ...validators: T
  ): MapperxValidator<ReturnType<T[number]>> => {
    return (val: unknown) => {
      const errors: Error[] = [];

      for (const validator of validators) {
        try {
          return validator(val);
        } catch (e) {
          errors.push(e instanceof Error ? e : new Error(String(e)));
        }
      }

      throw new ValidationError(
        `Value does not match any of the union types. Errors:\n${errors
          .map((e, i) => `  Option ${i + 1}: ${e.message}`)
          .join("\n")}`,
        val
      );
    };
  },

  /**
   * Valida literal (valor exacto)
   */
  literal: <T extends string | number | boolean>(
    literalValue: T
  ): MapperxValidator<T> => {
    return (val: unknown): T => {
      if (val !== literalValue) {
        throw new ValidationError(
          `Expected literal value ${literalValue}, got ${val}`,
          val
        );
      }
      return literalValue;
    };
  },
};
