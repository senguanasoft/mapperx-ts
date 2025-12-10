// ============================================================================
// MAPPERX-TS - CORE MODULE
// ============================================================================

import { MapperxValidator } from "./validators";
import { Path } from "./types";

// ============================================================================
// TIPOS BASE
// ============================================================================

/**
 * Función de transformación: convierte un valor de entrada en uno de salida
 */
export type MapperxTransform<In, Out> = (val: In, src?: any) => Out;

/**
 * Función de campo computado: calcula un valor basado en campos ya mapeados
 */
export type MapperxComputed<Ui, K extends keyof Ui> = (
  mapped: Partial<Ui>,
  src: any
) => Ui[K];

// ============================================================================
// ESPECIFICACIONES DE CAMPOS (FIELD SPECS)
// ============================================================================

/**
 * Campo con validación/transformación
 * Tiene 'from' pero NO tiene 'schema' ni 'computed'
 */
export interface ObjectFieldSpec<Api, Ui, K extends keyof Ui> {
  from: Path<Api>;
  validate?: MapperxValidator<any>;
  transform?: MapperxTransform<any, Ui[K]>;
  default?: Ui[K];
  required?: boolean;
  nullable?: boolean;
}

/**
 * Campo anidado (nested schema)
 * Tiene 'from' Y 'schema' pero NO tiene 'computed', 'validate', ni 'transform'
 */
export interface NestedFieldSpec<Api, Ui, K extends keyof Ui> {
  from: Path<Api>;
  schema: MapperxSchema<any, Ui[K]>;
  required?: boolean;
  default?: Ui[K];
}

/**
 * Campo computado (BASE)
 * Tiene 'computed' pero NO tiene 'from' ni 'schema'
 *
 * NOTA: Este es el SOURCE OF TRUTH para ComputedFieldSpec
 * computed.ts puede extender este tipo para añadir variantes
 */
export interface ComputedFieldSpec<Ui, K extends keyof Ui> {
  computed: MapperxComputed<Ui, K>;
  default?: Ui[K]; // Opcional: valor por defecto si el computed falla
}

/**
 * Especificación de campo - Union de todas las posibilidades
 */
export type MapperxFieldSpec<Api, Ui, K extends keyof Ui = keyof Ui> =
  | keyof Api // 1. Mapeo directo: 'id: "user_id"'
  | ObjectFieldSpec<Api, Ui, K> // 2. Con validación/transformación
  | NestedFieldSpec<Api, Ui, K> // 3. Schema anidado
  | ComputedFieldSpec<Ui, K>; // 4. Campo computado

/**
 * Schema completo - mapea cada campo de Ui
 */
export type MapperxSchema<Api, Ui> = {
  [K in keyof Ui]: MapperxFieldSpec<Api, Ui, K>;
};

// ============================================================================
// TYPE GUARDS (Funciones para identificar el tipo de spec)
// ============================================================================

/**
 * Verifica si es un campo anidado (nested)
 */
function isNestedSpec<Api, Ui, K extends keyof Ui>(
  spec: MapperxFieldSpec<Api, Ui, K>
): spec is NestedFieldSpec<Api, Ui, K> {
  return (
    typeof spec === "object" &&
    spec !== null &&
    "schema" in spec &&
    "from" in spec &&
    !("computed" in spec) && // NO debe tener computed
    !("validate" in spec) && // NO debe tener validate
    !("transform" in spec) // NO debe tener transform
  );
}

/**
 * Verifica si es un campo con validación/transformación
 */
function isObjectSpec<Api, Ui, K extends keyof Ui>(
  spec: MapperxFieldSpec<Api, Ui, K>
): spec is ObjectFieldSpec<Api, Ui, K> {
  return (
    typeof spec === "object" &&
    spec !== null &&
    "from" in spec &&
    !("schema" in spec) && // NO debe tener schema
    !("computed" in spec) // NO debe tener computed
  );
}

/**
 * Verifica si es un campo computado
 */
function isComputedSpec<Api, Ui, K extends keyof Ui>(
  spec: MapperxFieldSpec<Api, Ui, K>
): spec is ComputedFieldSpec<Ui, K> {
  return (
    typeof spec === "object" &&
    spec !== null &&
    "computed" in spec &&
    !("from" in spec) && // NO debe tener from
    !("schema" in spec) // NO debe tener schema
  );
}

/**
 * Verifica si es un mapeo directo (string key)
 */
function isDirectMapping<Api>(spec: any): spec is keyof Api {
  return typeof spec === "string" || typeof spec === "symbol";
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Error específico de MapperX con información detallada
 */
export class MapperxError extends Error {
  constructor(
    public field: string, // Campo de destino que falló
    public sourceField: string | null, // Campo de origen (null si es computed)
    public cause: Error, // Error original
    public sourceValue?: any // Valor que causó el error
  ) {
    const source = sourceField ? ` (from "${sourceField}")` : " (computed)";
    super(`Mapperx mapping error at "${field}"${source}: ${cause.message}`);
    this.name = "MapperxError";
  }
}

// ============================================================================
// OPTIONS
// ============================================================================

/**
 * Opciones para el mapper
 */
export interface MapperxOptions {
  /**
   * Si es true, advierte sobre campos en el source que no están en el schema
   */
  strict?: boolean;

  /**
   * Si es true, continúa el mapeo aunque algunos campos fallen
   * Los campos que fallen simplemente no se incluyen en el resultado
   */
  skipInvalid?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene un valor de un path anidado de forma segura
 * Ejemplos:
 *   getDeepValue({a: {b: {c: 5}}}, "a.b.c") → 5
 *   getDeepValue({a: {b: null}}, "a.b.c") → undefined
 */
function getDeepValue(obj: any, path: string): any {
  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    // Si llegamos a null/undefined, retornar undefined
    if (current == null) return undefined;

    // Si la propiedad no existe, retornar undefined
    if (!(part in current)) return undefined;

    current = current[part];
  }

  return current;
}

// ============================================================================
// MAIN MAPPER FUNCTION (SÍNCRONO)
// ============================================================================

/**
 * Mapea un objeto Api a un objeto Ui usando un schema
 *
 * @param api Objeto fuente (API response)
 * @param schema Schema de mapeo
 * @param options Opciones de configuración
 * @returns Objeto mapeado de tipo Ui
 *
 * @example
 * ```typescript
 * const schema: MapperxSchema<ApiUser, UiUser> = {
 *   id: 'user_id',
 *   email: { from: 'email_address', validate: mxs.email },
 *   fullName: mxc((m, src) => `${src.first_name} ${src.last_name}`)
 * };
 *
 * const uiUser = mapperx(apiUser, schema);
 * ```
 */
export function mapperx<Api extends object, Ui extends object>(
  api: Api,
  schema: MapperxSchema<Api, Ui>,
  options: MapperxOptions = {}
): Ui {
  // Objeto de salida (acumulamos los campos mapeados aquí)
  const out = {} as Record<string, any>;

  // Lista de campos computados (se procesan al final)
  const computedFields: Array<keyof Ui> = [];

  // ============================================================================
  // FASE 1: PROCESAR CAMPOS REGULARES Y ANIDADOS
  // ============================================================================

  for (const key of Object.keys(schema) as Array<keyof Ui>) {
    const spec = schema[key];

    // Si es un campo computado, guardarlo para después
    if (isComputedSpec(spec)) {
      computedFields.push(key);
      continue;
    }

    let sourceField: string;
    let sourceVal: any;

    try {
      // ----------------------------------------------------------------
      // CASO 1: CAMPO ANIDADO (nested schema)
      // ----------------------------------------------------------------
      if (isNestedSpec(spec)) {
        sourceField = String(spec.from);
        sourceVal = getDeepValue(api, sourceField);

        // Si el valor no existe o es null
        if (sourceVal === undefined || sourceVal === null) {
          // Usar default si está disponible
          if ("default" in spec && spec.default !== undefined) {
            out[key as string] = spec.default;
            continue;
          }

          // Si es requerido, lanzar error
          if (spec.required !== false) {
            throw new Error("Required nested object is undefined or null");
          }

          // Si no es requerido y no hay default, simplemente continuar
          continue;
        }

        // Mapear el objeto anidado recursivamente
        out[key as string] = mapperx(sourceVal, spec.schema, options);
        continue;
      }

      // ----------------------------------------------------------------
      // CASO 2: CAMPO CON VALIDACIÓN/TRANSFORMACIÓN
      // ----------------------------------------------------------------
      if (isObjectSpec(spec)) {
        sourceField = String(spec.from);
        sourceVal = getDeepValue(api, sourceField);

        // Manejar valores undefined
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

        // Manejar valores null
        if (sourceVal === null && !spec.nullable) {
          throw new Error("Field is null but not nullable");
        }

        let val = sourceVal;

        // Aplicar validación si existe
        if (spec.validate) {
          val = spec.validate(val);
        }

        // Aplicar transformación si existe
        if (spec.transform) {
          val = spec.transform(val, api);
        }

        out[key as string] = val;
        continue;
      }

      // ----------------------------------------------------------------
      // CASO 3: MAPEO DIRECTO (string key)
      // ----------------------------------------------------------------
      if (isDirectMapping<Api>(spec)) {
        sourceField = String(spec);
        sourceVal = (api as any)[spec];

        if (sourceVal === undefined) {
          throw new Error("Field is undefined in source");
        }

        out[key as string] = sourceVal;
        continue;
      }

      // ----------------------------------------------------------------
      // CASO 4: ESPECIFICACIÓN INVÁLIDA
      // ----------------------------------------------------------------
      throw new Error(
        `Invalid field specification for "${String(key)}". ` +
          `Must be a key, object spec, nested spec, or computed spec.`
      );
    } catch (e) {
      // Crear error detallado
      const err = new MapperxError(
        String(key),
        sourceField!,
        e instanceof Error ? e : new Error(String(e)),
        sourceVal
      );

      // Si skipInvalid está activado, solo continuar
      if (options.skipInvalid) {
        continue;
      }

      // Si no, lanzar el error
      throw err;
    }
  }

  // ============================================================================
  // FASE 2: PROCESAR CAMPOS COMPUTADOS
  // ============================================================================

  for (const key of computedFields) {
    const spec = schema[key];

    // Verificación de tipo (debería ser siempre true aquí)
    if (!isComputedSpec(spec)) {
      console.warn(
        `[Mapperx] Field "${String(
          key
        )}" was marked as computed but spec is invalid`
      );
      continue;
    }

    try {
      // Ejecutar la función computada
      out[key as string] = spec.computed(out as Partial<Ui>, api);
    } catch (e) {
      const err = new MapperxError(
        String(key),
        null, // Los campos computados no tienen sourceField
        e instanceof Error ? e : new Error(String(e))
      );

      if (options.skipInvalid) {
        // Si hay un default, usarlo
        if ("default" in spec && spec.default !== undefined) {
          out[key as string] = spec.default;
        }
        continue;
      }

      throw err;
    }
  }

  // ============================================================================
  // FASE 3: MODO ESTRICTO (OPCIONAL)
  // ============================================================================

  if (options.strict) {
    // Recolectar todos los campos del source que están siendo mapeados
    const schemaFields = new Set<string>();

    for (const key of Object.keys(schema) as Array<keyof Ui>) {
      const spec = schema[key];

      if (isObjectSpec(spec) || isNestedSpec(spec)) {
        // Obtener el campo raíz del path
        const path = String(spec.from);
        const rootField = path.split(".")[0];
        schemaFields.add(rootField);
      } else if (isDirectMapping(spec)) {
        schemaFields.add(String(spec));
      }
    }

    // Encontrar campos extra en el source
    const extraFields = Object.keys(api).filter((k) => !schemaFields.has(k));

    if (extraFields.length > 0) {
      console.warn(
        `[Mapperx] Extra fields in source object were not mapped: ${extraFields.join(
          ", "
        )}`
      );
    }
  }

  return out as Ui;
}

/**
 * Alias corto para mapperx
 */
export const mx = mapperx;

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Resultado del procesamiento por lotes
 */
export interface MapperxBatchResult<T> {
  /** Items mapeados exitosamente */
  data: T[];

  /** Errores ocurridos durante el mapeo */
  errors: Array<{
    index: number; // Índice del item que falló
    item: any; // Item original que causó el error
    error: MapperxError; // Error detallado
  }>;
}

/**
 * Mapea múltiples items de una sola vez
 * Útil para procesar arrays de la API
 *
 * @param items Array de items a mapear
 * @param schema Schema de mapeo
 * @param options Opciones de configuración
 * @returns Resultado con data y errores
 *
 * @example
 * ```typescript
 * const result = mapperxBatch(apiUsers, userSchema);
 * console.log(`Mapeados: ${result.data.length}`);
 * console.log(`Errores: ${result.errors.length}`);
 * ```
 */
export function mapperxBatch<Api extends object, Ui extends object>(
  items: Api[],
  schema: MapperxSchema<Api, Ui>,
  options: MapperxOptions = {}
): MapperxBatchResult<Ui> {
  const data: Ui[] = [];
  const errors: MapperxBatchResult<Ui>["errors"] = [];

  items.forEach((item, index) => {
    try {
      const mapped = mapperx(item, schema, options);
      data.push(mapped);
    } catch (error) {
      // Si es un MapperxError, guardarlo directamente
      if (error instanceof MapperxError) {
        errors.push({ index, item, error });
      } else {
        // Si es otro tipo de error, envolverlo
        const wrappedError = new MapperxError(
          "unknown",
          null,
          error instanceof Error ? error : new Error(String(error))
        );
        errors.push({ index, item, error: wrappedError });
      }
    }
  });

  return { data, errors };
}

/**
 * Alias corto para mapperxBatch
 */
export const mxBatch = mapperxBatch;
