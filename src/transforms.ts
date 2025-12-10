// ============================================================================
// MAPPERX-TS - TRANSFORMS MODULE
// ============================================================================

import { MapperxTransform } from "./core";

/**
 * Error personalizado para transformaciones
 */
export class TransformError extends Error {
  constructor(message: string, public value: unknown) {
    super(message);
    this.name = "TransformError";
  }
}

// ============================================================================
// TRANSFORMADORES DE STRING
// ============================================================================

export const mxt = {
  /**
   * Elimina espacios en blanco al inicio y final
   */
  trim: (val: string): string => {
    if (typeof val !== "string") {
      throw new TransformError("trim expects a string", val);
    }
    return val.trim();
  },

  /**
   * Convierte a minúsculas
   */
  toLowerCase: (val: string): string => {
    if (typeof val !== "string") {
      throw new TransformError("toLowerCase expects a string", val);
    }
    return val.toLowerCase();
  },

  /**
   * Convierte a mayúsculas
   */
  toUpperCase: (val: string): string => {
    if (typeof val !== "string") {
      throw new TransformError("toUpperCase expects a string", val);
    }
    return val.toUpperCase();
  },

  /**
   * Capitaliza primera letra (resto en minúsculas)
   */
  capitalize: (val: string): string => {
    if (typeof val !== "string") {
      throw new TransformError("capitalize expects a string", val);
    }
    if (val.length === 0) return val;
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  },

  /**
   * Capitaliza primera letra de cada palabra
   */
  titleCase: (val: string): string => {
    if (typeof val !== "string") {
      throw new TransformError("titleCase expects a string", val);
    }
    return val.replace(/\b\w/g, (char) => char.toUpperCase());
  },

  /**
   * Convierte a camelCase
   */
  camelCase: (val: string): string => {
    if (typeof val !== "string") {
      throw new TransformError("camelCase expects a string", val);
    }
    return val
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
  },

  /**
   * Convierte a snake_case
   */
  snakeCase: (val: string): string => {
    if (typeof val !== "string") {
      throw new TransformError("snakeCase expects a string", val);
    }
    return val
      .replace(/([A-Z])/g, "_$1")
      .toLowerCase()
      .replace(/^_/, "");
  },

  /**
   * Convierte a kebab-case
   */
  kebabCase: (val: string): string => {
    if (typeof val !== "string") {
      throw new TransformError("kebabCase expects a string", val);
    }
    return val
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .replace(/^-/, "");
  },

  /**
   * Divide string en array
   */
  split: (separator: string): MapperxTransform<string, string[]> => {
    return (val: string): string[] => {
      if (typeof val !== "string") {
        throw new TransformError("split expects a string", val);
      }
      return val.split(separator);
    };
  },

  /**
   * Reemplaza texto
   */
  replace: (
    searchValue: string | RegExp,
    replaceValue: string
  ): MapperxTransform<string, string> => {
    return (val: string): string => {
      if (typeof val !== "string") {
        throw new TransformError("replace expects a string", val);
      }
      return val.replace(searchValue, replaceValue);
    };
  },

  /**
   * Trunca string a longitud máxima
   */
  truncate: (
    maxLength: number,
    suffix: string = "..."
  ): MapperxTransform<string, string> => {
    return (val: string): string => {
      if (typeof val !== "string") {
        throw new TransformError("truncate expects a string", val);
      }
      if (val.length <= maxLength) return val;
      return val.slice(0, maxLength - suffix.length) + suffix;
    };
  },

  /**
   * Rellena string al inicio hasta alcanzar longitud
   */
  padStart: (
    targetLength: number,
    padString: string = " "
  ): MapperxTransform<string, string> => {
    return (val: string): string => {
      if (typeof val !== "string") {
        throw new TransformError("padStart expects a string", val);
      }
      return val.padStart(targetLength, padString);
    };
  },

  /**
   * Rellena string al final hasta alcanzar longitud
   */
  padEnd: (
    targetLength: number,
    padString: string = " "
  ): MapperxTransform<string, string> => {
    return (val: string): string => {
      if (typeof val !== "string") {
        throw new TransformError("padEnd expects a string", val);
      }
      return val.padEnd(targetLength, padString);
    };
  },
};

// ============================================================================
// TRANSFORMADORES DE NÚMERO
// ============================================================================

export const mxtNumber = {
  /**
   * Redondea número
   */
  round: (decimals: number = 0): MapperxTransform<number, number> => {
    return (val: number): number => {
      if (typeof val !== "number") {
        throw new TransformError("round expects a number", val);
      }
      const multiplier = Math.pow(10, decimals);
      return Math.round(val * multiplier) / multiplier;
    };
  },

  /**
   * Redondea hacia arriba
   */
  ceil: (val: number): number => {
    if (typeof val !== "number") {
      throw new TransformError("ceil expects a number", val);
    }
    return Math.ceil(val);
  },

  /**
   * Redondea hacia abajo
   */
  floor: (val: number): number => {
    if (typeof val !== "number") {
      throw new TransformError("floor expects a number", val);
    }
    return Math.floor(val);
  },

  /**
   * Valor absoluto
   */
  abs: (val: number): number => {
    if (typeof val !== "number") {
      throw new TransformError("abs expects a number", val);
    }
    return Math.abs(val);
  },

  /**
   * Clamp (limita valor a un rango)
   */
  clamp: (min: number, max: number): MapperxTransform<number, number> => {
    return (val: number): number => {
      if (typeof val !== "number") {
        throw new TransformError("clamp expects a number", val);
      }
      return Math.min(Math.max(val, min), max);
    };
  },

  /**
   * Suma un valor
   */
  add: (amount: number): MapperxTransform<number, number> => {
    return (val: number): number => {
      if (typeof val !== "number") {
        throw new TransformError("add expects a number", val);
      }
      return val + amount;
    };
  },

  /**
   * Resta un valor
   */
  subtract: (amount: number): MapperxTransform<number, number> => {
    return (val: number): number => {
      if (typeof val !== "number") {
        throw new TransformError("subtract expects a number", val);
      }
      return val - amount;
    };
  },

  /**
   * Multiplica por un valor
   */
  multiply: (factor: number): MapperxTransform<number, number> => {
    return (val: number): number => {
      if (typeof val !== "number") {
        throw new TransformError("multiply expects a number", val);
      }
      return val * factor;
    };
  },

  /**
   * Divide por un valor
   */
  divide: (divisor: number): MapperxTransform<number, number> => {
    return (val: number): number => {
      if (typeof val !== "number") {
        throw new TransformError("divide expects a number", val);
      }
      if (divisor === 0) {
        throw new TransformError("Cannot divide by zero", val);
      }
      return val / divisor;
    };
  },
};

// ============================================================================
// TRANSFORMADORES DE ARRAY
// ============================================================================

export const mxtArray = {
  /**
   * Une elementos de array en string
   */
  join: (separator: string = ","): MapperxTransform<any[], string> => {
    return (val: any[]): string => {
      if (!Array.isArray(val)) {
        throw new TransformError("join expects an array", val);
      }
      return val.join(separator);
    };
  },

  /**
   * Filtra elementos del array
   */
  filter: <T>(
    predicate: (item: T, index: number) => boolean
  ): MapperxTransform<T[], T[]> => {
    return (val: T[]): T[] => {
      if (!Array.isArray(val)) {
        throw new TransformError("filter expects an array", val);
      }
      return val.filter(predicate);
    };
  },

  /**
   * Mapea cada elemento del array
   */
  map: <T, U>(
    mapper: (item: T, index: number) => U
  ): MapperxTransform<T[], U[]> => {
    return (val: T[]): U[] => {
      if (!Array.isArray(val)) {
        throw new TransformError("map expects an array", val);
      }
      return val.map(mapper);
    };
  },

  /**
   * Obtiene el primer elemento
   */
  first: <T>(val: T[]): T | undefined => {
    if (!Array.isArray(val)) {
      throw new TransformError("first expects an array", val);
    }
    return val[0];
  },

  /**
   * Obtiene el último elemento
   */
  last: <T>(val: T[]): T | undefined => {
    if (!Array.isArray(val)) {
      throw new TransformError("last expects an array", val);
    }
    return val[val.length - 1];
  },

  /**
   * Encuentra un elemento
   */
  find: <T>(
    predicate: (item: T, index: number) => boolean
  ): MapperxTransform<T[], T | undefined> => {
    return (val: T[]): T | undefined => {
      if (!Array.isArray(val)) {
        throw new TransformError("find expects an array", val);
      }
      return val.find(predicate);
    };
  },

  /**
   * Toma los primeros N elementos
   */
  take: (n: number): MapperxTransform<any[], any[]> => {
    return (val: any[]): any[] => {
      if (!Array.isArray(val)) {
        throw new TransformError("take expects an array", val);
      }
      return val.slice(0, n);
    };
  },

  /**
   * Omite los primeros N elementos
   */
  skip: (n: number): MapperxTransform<any[], any[]> => {
    return (val: any[]): any[] => {
      if (!Array.isArray(val)) {
        throw new TransformError("skip expects an array", val);
      }
      return val.slice(n);
    };
  },

  /**
   * Aplana un array (un nivel)
   */
  flatten: <T>(val: T[][]): T[] => {
    if (!Array.isArray(val)) {
      throw new TransformError("flatten expects an array", val);
    }
    return val.flat();
  },

  /**
   * Aplana un array recursivamente
   */
  flattenDeep: (val: any[]): any[] => {
    if (!Array.isArray(val)) {
      throw new TransformError("flattenDeep expects an array", val);
    }
    return val.flat(Infinity);
  },

  /**
   * Elimina duplicados
   */
  unique: <T>(val: T[]): T[] => {
    if (!Array.isArray(val)) {
      throw new TransformError("unique expects an array", val);
    }
    return [...new Set(val)];
  },

  /**
   * Ordena el array
   */
  sort: <T>(compareFn?: (a: T, b: T) => number): MapperxTransform<T[], T[]> => {
    return (val: T[]): T[] => {
      if (!Array.isArray(val)) {
        throw new TransformError("sort expects an array", val);
      }
      return [...val].sort(compareFn);
    };
  },

  /**
   * Invierte el array
   */
  reverse: <T>(val: T[]): T[] => {
    if (!Array.isArray(val)) {
      throw new TransformError("reverse expects an array", val);
    }
    return [...val].reverse();
  },
};

// ============================================================================
// TRANSFORMADORES DE FECHA
// ============================================================================

export const mxtDate = {
  /**
   * Formatea fecha usando Intl.DateTimeFormat
   */
  format: (
    locale: string = "en-US",
    options: Intl.DateTimeFormatOptions = {}
  ): MapperxTransform<Date, string> => {
    return (val: Date): string => {
      if (!(val instanceof Date)) {
        throw new TransformError("format expects a Date", val);
      }
      return new Intl.DateTimeFormat(locale, options).format(val);
    };
  },

  /**
   * Convierte a ISO string
   */
  toISO: (val: Date): string => {
    if (!(val instanceof Date)) {
      throw new TransformError("toISO expects a Date", val);
    }
    return val.toISOString();
  },

  /**
   * Obtiene timestamp (milisegundos)
   */
  toTimestamp: (val: Date): number => {
    if (!(val instanceof Date)) {
      throw new TransformError("toTimestamp expects a Date", val);
    }
    return val.getTime();
  },

  /**
   * Obtiene Unix timestamp (segundos)
   */
  toUnix: (val: Date): number => {
    if (!(val instanceof Date)) {
      throw new TransformError("toUnix expects a Date", val);
    }
    return Math.floor(val.getTime() / 1000);
  },
};

// ============================================================================
// TRANSFORMADORES GENERALES
// ============================================================================

export const mxtGeneral = {
  /**
   * Convierte a JSON string
   */
  stringify: (val: any): string => {
    try {
      return JSON.stringify(val);
    } catch (e) {
      throw new TransformError("Cannot stringify value", val);
    }
  },

  /**
   * Parsea JSON string
   */
  parseJson: <T = any>(val: string): T => {
    if (typeof val !== "string") {
      throw new TransformError("parseJson expects a string", val);
    }
    try {
      return JSON.parse(val) as T;
    } catch (e) {
      throw new TransformError(`Invalid JSON: ${val}`, val);
    }
  },

  /**
   * Retorna valor por defecto si el actual es null/undefined
   */
  defaultTo: <T>(
    defaultValue: T
  ): MapperxTransform<T | null | undefined, T> => {
    return (val: T | null | undefined): T => {
      return val ?? defaultValue;
    };
  },

  /**
   * Composición de transformaciones (pipe)
   */
  pipe: <T>(
    ...transforms: Array<(val: any) => any>
  ): MapperxTransform<T, any> => {
    return (val: T): any => {
      return transforms.reduce((acc, transform) => transform(acc), val);
    };
  },
};
