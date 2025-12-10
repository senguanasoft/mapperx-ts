// ============================================================================
// MAPPERX-TS - ENTERPRISE EDITION
// Main Entry Point - Exports Organizados y Claros
// ============================================================================

// ============================================================================
// 1. CORE - Funciones y tipos principales
// ============================================================================

export {
  // Función principal de mapeo síncrono
  mapperx,
  mx, // Alias corto

  // Batch processing
  mapperxBatch,
  mxBatch, // Alias corto

  // Tipos de schema
  MapperxSchema,
  MapperxFieldSpec,

  // Tipos de especificaciones (definidos en core.ts)
  ObjectFieldSpec, // { from: ..., validate: ..., transform: ... }
  NestedFieldSpec, // { from: ..., schema: ... }
  ComputedFieldSpec, // { computed: ... } - SOURCE OF TRUTH

  // Tipos de funciones
  MapperxTransform,
  MapperxComputed,

  // Configuración
  MapperxOptions,

  // Error handling
  MapperxError,

  // Batch result
  MapperxBatchResult,
} from "./core";

// ============================================================================
// 2. TYPES - Sistema de tipos avanzado
// ============================================================================

export {
  // Tipos de paths
  Path, // "user" | "user.name" | "user.profile.email"
  DeepKeys, // Genera todos los paths posibles de un objeto
  PathValue, // Obtiene el tipo en un path específico
  IsValidPath, // Verifica si un path es válido

  // Utility types
  KeysOfType, // Obtiene keys que tienen un tipo específico
  OptionalKeys, // Obtiene keys opcionales
  RequiredKeys, // Obtiene keys requeridas
  PartialBy, // Hace específicas keys opcionales
  RequiredBy, // Hace específicas keys requeridas

  // Internal types (por si se necesitan)
  Primitive,
  NonNavigable,
  IsArray,
  ArrayElement,
} from "./types";

// ============================================================================
// 3. VALIDATORS - Validadores de datos
// ============================================================================

export {
  // Validadores básicos
  mxs, // { string, number, boolean, date, array, etc. }

  // Validadores extendidos
  mxsExt, // { email, url, uuid, min, max, pattern, etc. }

  // Tipos
  MapperxValidator, // (val: unknown) => T
  ValidationError, // Error de validación
} from "./validators";

// ============================================================================
// 4. TRANSFORMS - Transformadores de datos
// ============================================================================

export {
  // String transforms
  mxt, // { trim, toLowerCase, toUpperCase, capitalize, etc. }

  // Number transforms
  mxtNumber, // { round, ceil, floor, abs, clamp, etc. }

  // Array transforms
  mxtArray, // { join, filter, map, first, last, unique, etc. }

  // Date transforms
  mxtDate, // { format, toISO, toTimestamp, toUnix }

  // General transforms
  mxtGeneral, // { stringify, parseJson, defaultTo, pipe }

  // Error
  TransformError, // Error de transformación
} from "./transforms";

// ============================================================================
// 5. COMPUTED - Campos computados
// ============================================================================

export {
  // Builder principal
  mxc, // Función para crear campos computados

  // Aliases
  mapperxComputed,
  computed,

  // Tipos
  // ComputedFieldSpec ya está exportado desde core.ts (línea 26)
  ComputedFieldSpecWithDefault, // Único tipo adicional en computed.ts
} from "./computed";

// Namespace con helpers adicionales para computed fields
// mxc.withDefault()
// mxc.combine()
// mxc.conditional()
// mxc.fromSource()
// mxc.fromMapped()
// mxc.constant()
// mxc.copy()
// mxc.transform()
// mxc.async()

// ============================================================================
// 6. ASYNC - Mapeo asíncrono
// ============================================================================

export {
  // Funciones async
  mapperxAsync,
  mxa, // Alias corto
  mapperxBatchAsync,
  mxBatchAsync, // Alias corto

  // Tipos async
  AsyncMapperxValidator,
  AsyncMapperxTransform,
  AsyncMapperxComputed,
  AsyncMapperxSchema,
  AsyncMapperxFieldSpec,
  AsyncObjectFieldSpec,
  AsyncNestedFieldSpec,
  AsyncComputedFieldSpec,
  AsyncMapperxBatchResult,

  // Helpers async
  mxsAsync, // { fetchJson, withDelay, withRetry }
} from "./async";

// ============================================================================
// 7. TYPE HELPERS - Helpers de inferencia de tipos
// ============================================================================

import type { MapperxSchema } from "./core";

/**
 * Infiere el tipo de salida de un schema
 *
 * @example
 * ```typescript
 * const schema = {
 *   id: 'user_id',
 *   name: 'user_name'
 * } as const;
 *
 * type Output = InferSchemaOutput<typeof schema>;
 * // { id: any; name: any }
 * ```
 */
export type InferSchemaOutput<S> = S extends MapperxSchema<any, infer Ui>
  ? Ui
  : never;

/**
 * Infiere el tipo de entrada de un schema
 *
 * @example
 * ```typescript
 * const schema = {
 *   id: 'user_id',
 *   name: 'user_name'
 * } as const;
 *
 * type Input = InferSchemaInput<typeof schema>;
 * // { user_id: any; user_name: any }
 * ```
 */
export type InferSchemaInput<S> = S extends MapperxSchema<infer Api, any>
  ? Api
  : never;

// ============================================================================
// 8. TYPE ALIASES - Aliases para uso más cómodo
// ============================================================================

import type {
  MapperxFieldSpec,
  MapperxTransform,
  MapperxComputed,
} from "./core";

import type { MapperxValidator } from "./validators";

/**
 * Alias para schema
 */
export type Schema<Api, Ui> = MapperxSchema<Api, Ui>;

/**
 * Alias para validador
 */
export type Validator<T> = MapperxValidator<T>;

/**
 * Alias para transformador
 */
export type Transform<In, Out> = MapperxTransform<In, Out>;

/**
 * Alias para computed
 */
export type Computed<Ui, K extends keyof Ui> = MapperxComputed<Ui, K>;

/**
 * Alias para field spec
 */
export type FieldSpec<Api, Ui, K extends keyof Ui> = MapperxFieldSpec<
  Api,
  Ui,
  K
>;

// ============================================================================
// 9. UTILITY FUNCTIONS - Funciones de utilidad
// ============================================================================

import { MapperxError, MapperxOptions } from "./core";

/**
 * Crea un schema con mejor inferencia de tipos
 *
 * @example
 * ```typescript
 * const schema = createSchema<ApiUser, UiUser>({
 *   id: 'user_id',
 *   email: { from: 'email_address', validate: mxs.email }
 * });
 * ```
 */
export function createSchema<Api extends object, Ui extends object>(
  schema: MapperxSchema<Api, Ui>
): MapperxSchema<Api, Ui> {
  return schema;
}

/**
 * Verifica si un error es un MapperxError
 *
 * @example
 * ```typescript
 * try {
 *   mapperx(data, schema);
 * } catch (error) {
 *   if (isMapperxError(error)) {
 *     console.log(error.field, error.sourceField);
 *   }
 * }
 * ```
 */
export function isMapperxError(error: unknown): error is MapperxError {
  return error instanceof MapperxError;
}

/**
 * Extrae información útil de un MapperxError
 *
 * @example
 * ```typescript
 * const info = getErrorInfo(error);
 * console.log(`Error in ${info.field}: ${info.message}`);
 * ```
 */
export function getErrorInfo(error: MapperxError): {
  field: string;
  sourceField: string | null;
  message: string;
  sourceValue?: any;
} {
  return {
    field: error.field,
    sourceField: error.sourceField,
    message: error.cause.message,
    sourceValue: error.sourceValue,
  };
}

// ============================================================================
// 10. PRESET OPTIONS - Configuraciones predefinidas
// ============================================================================

/**
 * Opciones recomendadas para PRODUCCIÓN
 * - Strict: detecta campos extra
 * - No skipInvalid: falla rápido si hay errores
 */
export const PRODUCTION_OPTIONS: MapperxOptions = {
  strict: true,
  skipInvalid: false,
};

/**
 * Opciones recomendadas para DESARROLLO
 * - Strict: detecta campos extra
 * - No skipInvalid: muestra todos los errores
 */
export const DEVELOPMENT_OPTIONS: MapperxOptions = {
  strict: true,
  skipInvalid: false,
};

/**
 * Opciones para TESTING
 * - No strict: permite campos extra
 * - skipInvalid: continúa aunque haya errores
 */
export const TESTING_OPTIONS: MapperxOptions = {
  strict: false,
  skipInvalid: true,
};

/**
 * Opciones PERMISIVAS
 * - No strict: ignora campos extra
 * - skipInvalid: salta campos con errores
 */
export const LENIENT_OPTIONS: MapperxOptions = {
  strict: false,
  skipInvalid: true,
};

// ============================================================================
// 11. VERSION INFO
// ============================================================================

export const MAPPERX_VERSION = "2.0.0";
export const MAPPERX_NAME = "MapperX-TS Enterprise Edition";

// ============================================================================
// 12. DEFAULT EXPORT
// ============================================================================

import { mapperx } from "./core";

/**
 * Export por defecto: la función principal mapperx
 *
 * @example
 * ```typescript
 * import mapperx from 'mapperx-ts';
 *
 * const result = mapperx(apiData, schema);
 * ```
 */
export default mapperx;

// ============================================================================
// 13. QUICK START GUIDE (Solo comentarios para documentación)
// ============================================================================

/**
 * GUÍA RÁPIDA DE USO:
 *
 * 1. MAPEO BÁSICO:
 * ```typescript
 * import { mapperx, mxs } from 'mapperx-ts';
 *
 * const schema = {
 *   id: 'user_id',
 *   email: { from: 'email_address', validate: mxs.email }
 * };
 *
 * const result = mapperx(apiData, schema);
 * ```
 *
 * 2. CAMPOS COMPUTADOS:
 * ```typescript
 * import { mxc } from 'mapperx-ts';
 *
 * const schema = {
 *   firstName: 'first_name',
 *   lastName: 'last_name',
 *   fullName: mxc((mapped) => `${mapped.firstName} ${mapped.lastName}`)
 * };
 * ```
 *
 * 3. TRANSFORMACIONES:
 * ```typescript
 * import { mxt, mxtNumber } from 'mapperx-ts';
 *
 * const schema = {
 *   email: { from: 'email_address', transform: mxt.toLowerCase },
 *   price: { from: 'raw_price', transform: mxtNumber.round(2) }
 * };
 * ```
 *
 * 4. NESTED OBJECTS:
 * ```typescript
 * const schema = {
 *   user: {
 *     from: 'user_data',
 *     schema: {
 *       id: 'user_id',
 *       name: 'user_name'
 *     }
 *   }
 * };
 * ```
 *
 * 5. ASYNC:
 * ```typescript
 * import { mapperxAsync, mxc } from 'mapperx-ts';
 *
 * const schema = {
 *   id: 'user_id',
 *   userData: mxc.async(async (m, src) => {
 *     return await fetchUserData(src.user_id);
 *   })
 * };
 *
 * const result = await mapperxAsync(apiData, schema);
 * ```
 *
 * 6. BATCH PROCESSING:
 * ```typescript
 * import { mapperxBatch } from 'mapperx-ts';
 *
 * const result = mapperxBatch(apiArray, schema);
 * console.log(result.data);   // Items exitosos
 * console.log(result.errors); // Items con errores
 * ```
 */
