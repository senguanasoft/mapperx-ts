// ============================================================================
// MAPPERX-TS - ASYNC MODULE
// ============================================================================

import { MapperxOptions, MapperxError, MapperxComputed } from "./core";
import { Path } from "./types";

/**
 * Validador asíncrono - puede retornar valor o Promise
 */
export type AsyncMapperxValidator<T> = (val: unknown) => T | Promise<T>;

/**
 * Transformador asíncrono - puede retornar valor o Promise
 */
export type AsyncMapperxTransform<In, Out> = (
  val: In,
  src?: any
) => Out | Promise<Out>;

/**
 * Computed asíncrono - puede retornar valor o Promise
 */
export type AsyncMapperxComputed<Ui, K extends keyof Ui> = (
  mapped: Partial<Ui>,
  src: any
) => Ui[K] | Promise<Ui[K]>;

// ============================================================================
// FIELD SPECS PARA ASYNC
// ============================================================================

/**
 * Especificación de campo objeto (con validación/transformación)
 */
export interface AsyncObjectFieldSpec<Api, Ui, K extends keyof Ui> {
  from: Path<Api>;
  validate?: AsyncMapperxValidator<any>;
  transform?: AsyncMapperxTransform<any, Ui[K]>;
  default?: Ui[K];
  required?: boolean;
  nullable?: boolean;
}

/**
 * Especificación de campo anidado (nested schema)
 */
export interface AsyncNestedFieldSpec<Api, Ui, K extends keyof Ui> {
  from: Path<Api>;
  schema: AsyncMapperxSchema<any, Ui[K]>;
  required?: boolean;
  default?: Ui[K];
}

/**
 * Especificación de campo computado (puede ser async)
 */
export interface AsyncComputedFieldSpec<Ui, K extends keyof Ui> {
  computed: AsyncMapperxComputed<Ui, K>;
  default?: Ui[K];
}

/**
 * CORRECCIÓN: Union type bien definido para specs async
 */
export type AsyncMapperxFieldSpec<Api, Ui, K extends keyof Ui = keyof Ui> =
  | keyof Api // Mapeo directo
  | AsyncObjectFieldSpec<Api, Ui, K> // Con validación/transformación
  | AsyncNestedFieldSpec<Api, Ui, K> // Nested schema
  | AsyncComputedFieldSpec<Ui, K>; // Computado (puede ser async)

/**
 * Schema completo para mapeo asíncrono
 */
export type AsyncMapperxSchema<Api, Ui> = {
  [K in keyof Ui]: AsyncMapperxFieldSpec<Api, Ui, K>;
};

// ============================================================================
// TYPE GUARDS MEJORADOS
// ============================================================================

function isNestedSpec<Api, Ui, K extends keyof Ui>(
  spec: AsyncMapperxFieldSpec<Api, Ui, K>
): spec is AsyncNestedFieldSpec<Api, Ui, K> {
  return (
    typeof spec === "object" &&
    spec !== null &&
    "schema" in spec &&
    "from" in spec &&
    !("computed" in spec) &&
    !("validate" in spec) &&
    !("transform" in spec)
  );
}

function isObjectSpec<Api, Ui, K extends keyof Ui>(
  spec: AsyncMapperxFieldSpec<Api, Ui, K>
): spec is AsyncObjectFieldSpec<Api, Ui, K> {
  return (
    typeof spec === "object" &&
    spec !== null &&
    "from" in spec &&
    !("schema" in spec) &&
    !("computed" in spec)
  );
}

function isComputedSpec<Api, Ui, K extends keyof Ui>(
  spec: AsyncMapperxFieldSpec<Api, Ui, K>
): spec is AsyncComputedFieldSpec<Ui, K> {
  return (
    typeof spec === "object" &&
    spec !== null &&
    "computed" in spec &&
    !("from" in spec) &&
    !("schema" in spec)
  );
}

function isDirectMapping<Api>(spec: any): spec is keyof Api {
  return typeof spec === "string" || typeof spec === "symbol";
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene valor de un path anidado de forma segura
 */
function getDeepValue(obj: any, path: string): any {
  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (current == null) return undefined;
    if (!(part in current)) return undefined;
    current = current[part];
  }

  return current;
}

/**
 * Verifica si un valor es una Promise
 */
function isPromise<T>(value: any): value is Promise<T> {
  return value && typeof value.then === "function";
}

// ============================================================================
// MAIN ASYNC MAPPER - TIPADO FUERTE
// ============================================================================

/**
 * Mapper asíncrono principal
 * Soporta validadores, transformadores y computeds asíncronos
 */
export async function mapperxAsync<Api extends object, Ui extends object>(
  api: Api,
  schema: AsyncMapperxSchema<Api, Ui>,
  options: MapperxOptions = {}
): Promise<Ui> {
  const out = {} as Record<string, any>;
  const computedFields: Array<keyof Ui> = [];

  // FASE 1: Procesar campos regulares y anidados
  for (const key of Object.keys(schema) as Array<keyof Ui>) {
    const spec = schema[key];

    // Separar campos computados para procesar después
    if (isComputedSpec(spec)) {
      computedFields.push(key);
      continue;
    }

    let sourceField: string;
    let sourceVal: any;

    try {
      // CASO 1: Mapeo anidado (nested schema)
      if (isNestedSpec(spec)) {
        sourceField = String(spec.from);
        sourceVal = getDeepValue(api, sourceField);

        if (sourceVal === undefined || sourceVal === null) {
          if ("default" in spec && spec.default !== undefined) {
            out[key as string] = spec.default;
            continue;
          }
          if (spec.required !== false) {
            throw new Error("Required nested object is undefined or null");
          }
          continue;
        }

        // Llamada recursiva async
        out[key as string] = await mapperxAsync(
          sourceVal,
          spec.schema,
          options
        );
        continue;
      }

      // CASO 2: Mapeo con validación/transformación (potencialmente async)
      if (isObjectSpec(spec)) {
        sourceField = String(spec.from);
        sourceVal = getDeepValue(api, sourceField);

        if (sourceVal === undefined) {
          if ("default" in spec && spec.default !== undefined) {
            out[key as string] = spec.default;
            continue;
          }
          if (spec.required !== false) {
            throw new Error("Required field is undefined");
          }
          continue;
        }

        if (sourceVal === null && !spec.nullable) {
          throw new Error("Field is null but not nullable");
        }

        let val = sourceVal;

        // Aplicar validación (puede ser async)
        if (spec.validate) {
          const validated = spec.validate(val);
          val = isPromise(validated) ? await validated : validated;
        }

        // Aplicar transformación (puede ser async)
        if (spec.transform) {
          const transformed = spec.transform(val, api);
          val = isPromise(transformed) ? await transformed : transformed;
        }

        out[key as string] = val;
        continue;
      }

      // CASO 3: Mapeo directo (string key)
      if (isDirectMapping<Api>(spec)) {
        sourceField = String(spec);
        sourceVal = (api as any)[spec];

        if (sourceVal === undefined) {
          throw new Error("Field is undefined in source");
        }

        out[key as string] = sourceVal;
        continue;
      }

      // Si llegamos aquí, hay un problema con el schema
      throw new Error(
        `Invalid field specification for "${String(
          key
        )}". Must be a key, object spec, nested spec, or computed spec.`
      );
    } catch (e) {
      const err = new MapperxError(
        String(key),
        sourceField!,
        e instanceof Error ? e : new Error(String(e)),
        sourceVal
      );

      if (!options.skipInvalid) {
        throw err;
      }
      // Si skipInvalid está activado, continuar
    }
  }

  // FASE 2: Procesar campos computados (pueden ser async)
  for (const key of computedFields) {
    const spec = schema[key];

    if (!isComputedSpec(spec)) {
      console.warn(
        `[MapperxAsync] Field "${String(
          key
        )}" was marked as computed but spec is invalid`
      );
      continue;
    }

    try {
      const result = spec.computed(out as Partial<Ui>, api);

      // CORRECCIÓN: Manejar tanto valores síncronos como Promises
      out[key as string] = isPromise(result) ? await result : result;
    } catch (e) {
      const err = new MapperxError(
        String(key),
        null,
        e instanceof Error ? e : new Error(String(e))
      );

      if (options.skipInvalid) {
        if ("default" in spec && spec.default !== undefined) {
          out[key as string] = spec.default;
        }
        continue;
      }

      throw err;
    }
  }

  // FASE 3: Validación de modo estricto (igual que sync)
  if (options.strict) {
    const schemaFields = new Set<string>();

    for (const key of Object.keys(schema) as Array<keyof Ui>) {
      const spec = schema[key];

      if (isObjectSpec(spec) || isNestedSpec(spec)) {
        const path = String(spec.from);
        const rootField = path.split(".")[0];
        schemaFields.add(rootField);
      } else if (isDirectMapping(spec)) {
        schemaFields.add(String(spec));
      }
    }

    const extraFields = Object.keys(api).filter((k) => !schemaFields.has(k));

    if (extraFields.length > 0) {
      console.warn(
        `[MapperxAsync] Extra fields in source object were not mapped: ${extraFields.join(
          ", "
        )}`
      );
    }
  }

  return out as Ui;
}

/**
 * Alias corto para mapperxAsync
 */
export const mxa = mapperxAsync;

// ============================================================================
// BATCH ASYNC MAPPER
// ============================================================================

/**
 * Resultado del batch processing asíncrono
 */
export interface AsyncMapperxBatchResult<T> {
  data: T[];
  errors: Array<{
    index: number;
    item: any;
    error: MapperxError;
  }>;
}

/**
 * Procesa múltiples items de forma asíncrona usando Promise.allSettled
 * Esto permite que algunos items fallen sin detener el procesamiento de otros
 */
export async function mapperxBatchAsync<Api extends object, Ui extends object>(
  items: Api[],
  schema: AsyncMapperxSchema<Api, Ui>,
  options: MapperxOptions = {}
): Promise<AsyncMapperxBatchResult<Ui>> {
  // Usar Promise.allSettled para procesar todos los items
  // incluso si algunos fallan
  const results = await Promise.allSettled(
    items.map((item, index) =>
      mapperxAsync(item, schema, options).catch((error) => {
        // Capturar el error con su índice
        throw { index, error };
      })
    )
  );

  const data: Ui[] = [];
  const errors: AsyncMapperxBatchResult<Ui>["errors"] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      data.push(result.value);
    } else {
      const reason = result.reason;

      // Si el error tiene índice (de nuestro catch), usarlo
      if (reason && typeof reason === "object" && "error" in reason) {
        const error =
          reason.error instanceof MapperxError
            ? reason.error
            : new MapperxError("unknown", null, reason.error as Error);

        errors.push({
          index: reason.index,
          item: items[reason.index],
          error,
        });
      } else {
        // Error inesperado
        const error =
          reason instanceof MapperxError
            ? reason
            : new MapperxError("unknown", null, new Error(String(reason)));

        errors.push({
          index,
          item: items[index],
          error,
        });
      }
    }
  });

  return { data, errors };
}

/**
 * Alias corto para mapperxBatchAsync
 */
export const mxBatchAsync = mapperxBatchAsync;

// ============================================================================
// HELPERS PARA ASYNC VALIDATORS Y TRANSFORMS
// ============================================================================

/**
 * Helpers para crear validadores asíncronos comunes
 */
export const mxsAsync = {
  /**
   * Validador async que hace fetch a una URL
   */
  fetchJson: <T = any>(url: string): AsyncMapperxValidator<T> => {
    return async (_val: unknown): Promise<T> => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    };
  },

  /**
   * Validador async con delay (útil para testing)
   */
  withDelay: <T>(
    validator: AsyncMapperxValidator<T>,
    ms: number
  ): AsyncMapperxValidator<T> => {
    return async (val: unknown): Promise<T> => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return validator(val);
    };
  },

  /**
   * Validador async con retry
   */
  withRetry: <T>(
    validator: AsyncMapperxValidator<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): AsyncMapperxValidator<T> => {
    return async (val: unknown): Promise<T> => {
      let lastError: Error | null = null;

      for (let i = 0; i < maxRetries; i++) {
        try {
          return await validator(val);
        } catch (e) {
          lastError = e instanceof Error ? e : new Error(String(e));
          if (i < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }

      throw new Error(
        `Validation failed after ${maxRetries} retries: ${lastError?.message}`
      );
    };
  },
};
