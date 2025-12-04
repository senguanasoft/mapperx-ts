// ============================================================================
// MAPPERX-TS - ENTERPRISE EDITION
// Type-safe DTO → Domain Mapper for TypeScript
// Soporte para campos computados y propiedades adicionales
// ============================================================================

type MapperxValidator<T> = (val: unknown) => T;
type MapperxTransform<In, Out> = (val: In, src?: any) => Out;
type MapperxComputed<Ui, K extends keyof Ui> = (
  mapped: Partial<Ui>,
  src: any
) => Ui[K];

type MapperxFieldSpec<Api, Ui, K extends keyof Ui = keyof Ui> =
  | keyof Api
  | {
      from: keyof Api;
      validate?: MapperxValidator<any>;
      transform?: MapperxTransform<any, Ui[K]>;
      default?: Ui[K];
      required?: boolean;
      nullable?: boolean;
    }
  | {
      computed: MapperxComputed<Ui, K>;
      default?: Ui[K];
    };

type MapperxSchema<Api, Ui> = {
  [K in keyof Ui]: MapperxFieldSpec<Api, Ui, K>;
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

function isObjectSpec<Api, Ui, K extends keyof Ui>(
  spec: MapperxFieldSpec<Api, Ui, K>
): spec is {
  from: keyof Api;
  validate?: MapperxValidator<any>;
  transform?: MapperxTransform<any, Ui[K]>;
  default?: Ui[K];
  required?: boolean;
  nullable?: boolean;
} {
  return typeof spec === "object" && spec !== null && "from" in spec;
}

function isComputedSpec<Api, Ui, K extends keyof Ui>(
  spec: MapperxFieldSpec<Api, Ui, K>
): spec is {
  computed: MapperxComputed<Ui, K>;
  default?: Ui[K];
} {
  return typeof spec === "object" && spec !== null && "computed" in spec;
}

// ============================================================================
// VALIDATORS
// ============================================================================

export const mxs = {
  string: (val: unknown): string => {
    if (typeof val === "string") return val;
    if (val == null) throw new Error("Expected string, got null/undefined");
    return String(val);
  },

  number: (val: unknown): number => {
    if (typeof val === "number" && !isNaN(val)) return val;
    const n = Number(val);
    if (isNaN(n)) throw new Error(`Cannot convert "${val}" to number`);
    return n;
  },

  boolean: (val: unknown): boolean => {
    if (typeof val === "boolean") return val;
    if (val === "true" || val === "1" || val === 1) return true;
    if (val === "false" || val === "0" || val === 0) return false;
    throw new Error(`Cannot convert "${val}" to boolean`);
  },

  date: (val: unknown): Date => {
    if (val instanceof Date) return val;
    const d = new Date(val as any);
    if (isNaN(d.getTime())) throw new Error(`Invalid date: "${val}"`);
    return d;
  },

  array:
    <T>(itemValidator: MapperxValidator<T>) =>
    (val: unknown): T[] => {
      if (!Array.isArray(val)) throw new Error("Expected array");
      return val.map((item, i) => {
        try {
          return itemValidator(item);
        } catch (e) {
          throw new Error(`Array[${i}]: ${(e as Error).message}`);
        }
      });
    },

  optional:
    <T>(validator: MapperxValidator<T>) =>
    (val: unknown): T | undefined => {
      if (val === undefined || val === null) return undefined;
      return validator(val);
    },

  nullable:
    <T>(validator: MapperxValidator<T>) =>
    (val: unknown): T | null => {
      if (val === null) return null;
      return validator(val);
    },

  enum:
    <T extends string>(...values: T[]) =>
    (val: unknown): T => {
      if (values.includes(val as T)) return val as T;
      throw new Error(`Expected one of [${values.join(", ")}], got "${val}"`);
    },

  custom: <T>(fn: (val: unknown) => T): MapperxValidator<T> => fn,
};

// ============================================================================
// ERROR
// ============================================================================

export class MapperxError extends Error {
  constructor(
    public field: string,
    public sourceField: string | null,
    public cause: Error
  ) {
    const source = sourceField ? ` (from "${sourceField}")` : " (computed)";
    super(`Mapperx mapping error at "${field}"${source}: ${cause.message}`);
    this.name = "MapperxError";
  }
}

// ============================================================================
// OPTIONS
// ============================================================================

export interface MapperxOptions {
  strict?: boolean;
  skipInvalid?: boolean;
}

// ============================================================================
// MAIN MAPPER
// ============================================================================

export function mapperx<Api extends object, Ui extends object>(
  api: Api,
  schema: MapperxSchema<Api, Ui>,
  options: MapperxOptions = {}
): Ui {
  const out = {} as any;
  const computedFields: Array<keyof Ui> = [];

  // PHASE 1: Regular fields
  for (const key of Object.keys(schema) as (keyof Ui)[]) {
    const spec = schema[key];

    if (isComputedSpec(spec)) {
      computedFields.push(key);
      continue;
    }

    try {
      if (!isObjectSpec(spec)) {
        const val = (api as any)[spec as any];
        if (val === undefined) {
          throw new Error("Field is undefined in source");
        }
        out[key] = val;
        continue;
      }

      const sourceVal = (api as any)[spec.from];

      if (sourceVal === undefined) {
        if (spec.default !== undefined) {
          out[key] = spec.default;
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

      if (spec.validate) val = spec.validate(sourceVal);
      if (spec.transform) val = spec.transform(val, api);

      out[key] = val;
    } catch (e) {
      const sourceField = isObjectSpec(spec) ? spec.from : spec;
      const err = new MapperxError(
        String(key),
        String(sourceField),
        e as Error
      );

      if (!options.skipInvalid) throw err;
    }
  }

  // PHASE 2: Computed fields
  for (const key of computedFields) {
    const spec = schema[key];

    if (!isComputedSpec(spec)) continue;

    try {
      out[key] = spec.computed(out, api);
    } catch (e) {
      const err = new MapperxError(String(key), null, e as Error);

      if (options.skipInvalid) {
        if (spec.default !== undefined) out[key] = spec.default;
        continue;
      }

      throw err;
    }
  }

  if (options.strict) {
    const schemaFields = new Set<keyof Api>(
      (Object.keys(schema) as (keyof Ui)[])
        .map((k) => {
          const s = schema[k];
          return isObjectSpec(s) ? s.from : null;
        })
        .filter((f): f is keyof Api => f !== null)
    );

    const extraFields = Object.keys(api).filter(
      (k) => !schemaFields.has(k as keyof Api)
    );

    if (extraFields.length > 0) {
      console.warn(`[Mapperx] Extra fields: ${extraFields.join(", ")}`);
    }
  }

  return out as Ui;
}

export const mx = mapperx;

// ============================================================================
// BATCH
// ============================================================================

export interface MapperxBatchResult<T> {
  data: T[];
  errors: Array<{ index: number; item: any; error: MapperxError }>;
}

export function mapperxBatch<Api extends object, Ui extends object>(
  items: Api[],
  schema: MapperxSchema<Api, Ui>,
  options: MapperxOptions = {}
): MapperxBatchResult<Ui> {
  const data: Ui[] = [];
  const errors: MapperxBatchResult<Ui>["errors"] = [];

  items.forEach((item, i) => {
    try {
      data.push(mapperx(item, schema, options));
    } catch (e) {
      errors.push({ index: i, item, error: e as MapperxError });
    }
  });

  return { data, errors };
}

export const mxBatch = mapperxBatch;

// ============================================================================
// COMPUTED BUILDER
// ============================================================================

export function mxc<Ui, K extends keyof Ui>(
  fn: (mapped: Partial<Ui>, src: any) => Ui[K]
): { computed: MapperxComputed<Ui, K> } {
  return { computed: fn };
}

mxc.withDefault = function <Ui, K extends keyof Ui>(
  fn: (mapped: Partial<Ui>, src: any) => Ui[K],
  defaultValue: Ui[K]
): { computed: MapperxComputed<Ui, K>; default: Ui[K] } {
  return { computed: fn, default: defaultValue };
};

// Aliases
export const mapperxComputed = mxc;

// ============================================================================
// TYPES EXPORT
// ============================================================================

export type {
  MapperxSchema,
  MapperxFieldSpec,
  MapperxValidator,
  MapperxTransform,
  MapperxComputed,
};
