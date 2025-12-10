// ============================================================================
// MAPPERX-TS - COMPUTED FIELDS MODULE (CORREGIDO - SIN DUPLICACIÓN)
// ============================================================================

// IMPORTAR tipos del core (single source of truth)
import { MapperxComputed, ComputedFieldSpec } from "./core";

// ============================================================================
// RE-EXPORTAR el tipo base para conveniencia
// ============================================================================

/**
 * ComputedFieldSpec es el tipo base definido en core.ts
 * Lo re-exportamos aquí para conveniencia
 *
 * Estructura:
 * {
 *   computed: (mapped: Partial<Ui>, src: any) => Ui[K],
 *   default?: Ui[K]  // Opcional
 * }
 */
export type { ComputedFieldSpec } from "./core";

// ============================================================================
// TIPO ADICIONAL: ComputedFieldSpecWithDefault
// ============================================================================

/**
 * Especificación de campo computado CON valor por defecto REQUERIDO
 *
 * Diferencia con ComputedFieldSpec:
 * - ComputedFieldSpec: default es OPCIONAL
 * - ComputedFieldSpecWithDefault: default es REQUERIDO
 *
 * Uso: Cuando quieres garantizar que siempre hay un valor de respaldo
 *
 * @example
 * ```typescript
 * const spec: ComputedFieldSpecWithDefault<User, 'score'> = {
 *   computed: (mapped) => calculateScore(mapped),
 *   default: 0  // REQUERIDO
 * };
 * ```
 */
export interface ComputedFieldSpecWithDefault<Ui, K extends keyof Ui> {
  computed: MapperxComputed<Ui, K>;
  default: Ui[K]; // REQUERIDO (no opcional)
}

// ============================================================================
// COMPUTED BUILDER - TIPADO FUERTE
// ============================================================================

/**
 * Crea un campo computado
 *
 * @param fn Función que recibe el objeto parcialmente mapeado y el source original
 * @returns Especificación de campo computado
 *
 * @example
 * ```typescript
 * interface UiUser {
 *   firstName: string;
 *   lastName: string;
 *   fullName: string;
 * }
 *
 * const schema = {
 *   firstName: 'first_name',
 *   lastName: 'last_name',
 *   fullName: mxc<UiUser, 'fullName'>((mapped) =>
 *     `${mapped.firstName} ${mapped.lastName}`
 *   )
 * };
 * ```
 */
export function mxc<Ui, K extends keyof Ui>(
  fn: MapperxComputed<Ui, K>
): ComputedFieldSpec<Ui, K> {
  return { computed: fn };
}

/**
 * Namespace con funciones adicionales para campos computados
 */
export namespace mxc {
  /**
   * Crea un campo computado con valor por defecto
   * Se usa el default si la función computada falla o retorna undefined
   *
   * @param fn Función computada
   * @param defaultValue Valor por defecto
   * @returns Especificación de campo computado con default
   *
   * @example
   * ```typescript
   * const schema = {
   *   score: mxc.withDefault<UiUser, 'score'>(
   *     (mapped) => calculateScore(mapped),
   *     0 // Default si falla
   *   )
   * };
   * ```
   */
  export function withDefault<Ui, K extends keyof Ui>(
    fn: MapperxComputed<Ui, K>,
    defaultValue: Ui[K]
  ): ComputedFieldSpecWithDefault<Ui, K> {
    return { computed: fn, default: defaultValue };
  }

  /**
   * Crea un campo computado que combina múltiples campos
   *
   * @param keys Keys a combinar
   * @param combiner Función que combina los valores
   * @returns Campo computado
   *
   * @example
   * ```typescript
   * const schema = {
   *   firstName: 'first_name',
   *   lastName: 'last_name',
   *   fullName: mxc.combine(
   *     ['firstName', 'lastName'],
   *     (first, last) => `${first} ${last}`
   *   )
   * };
   * ```
   */
  export function combine<Ui, K extends keyof Ui>(
    keys: Array<keyof Ui>,
    combiner: (...values: any[]) => Ui[K]
  ): ComputedFieldSpec<Ui, K> {
    return {
      computed: (mapped: Partial<Ui>) => {
        const values = keys.map((key) => mapped[key]);

        // Verificar que todos los valores existan
        if (values.some((v) => v === undefined)) {
          throw new Error(
            `Cannot combine fields: some values are undefined. Keys: ${keys.join(
              ", "
            )}`
          );
        }

        return combiner(...values);
      },
    };
  }

  /**
   * Crea un campo computado condicional
   *
   * @param condition Condición para evaluar
   * @param thenFn Función si la condición es true
   * @param elseFn Función si la condición es false
   * @returns Campo computado
   *
   * @example
   * ```typescript
   * const schema = {
   *   age: 'user_age',
   *   isAdult: mxc.conditional(
   *     (mapped) => (mapped.age ?? 0) >= 18,
   *     () => true,
   *     () => false
   *   )
   * };
   * ```
   */
  export function conditional<Ui, K extends keyof Ui>(
    condition: (mapped: Partial<Ui>, src: any) => boolean,
    thenFn: MapperxComputed<Ui, K>,
    elseFn: MapperxComputed<Ui, K>
  ): ComputedFieldSpec<Ui, K> {
    return {
      computed: (mapped: Partial<Ui>, src: any) => {
        return condition(mapped, src)
          ? thenFn(mapped, src)
          : elseFn(mapped, src);
      },
    };
  }

  /**
   * Crea un campo computado desde el source original
   * Útil cuando necesitas acceder a campos del source que no están en el mapped
   *
   * @param fn Función que recibe solo el source
   * @returns Campo computado
   *
   * @example
   * ```typescript
   * const schema = {
   *   metadata: mxc.fromSource((src) =>
   *     JSON.parse(src.raw_metadata)
   *   )
   * };
   * ```
   */
  export function fromSource<Ui, K extends keyof Ui>(
    fn: (src: any) => Ui[K]
  ): ComputedFieldSpec<Ui, K> {
    return {
      computed: (_mapped: Partial<Ui>, src: any) => fn(src),
    };
  }

  /**
   * Crea un campo computado que usa solo los campos ya mapeados
   *
   * @param fn Función que recibe solo el mapped
   * @returns Campo computado
   *
   * @example
   * ```typescript
   * const schema = {
   *   firstName: 'first_name',
   *   lastName: 'last_name',
   *   initials: mxc.fromMapped((mapped) =>
   *     `${mapped.firstName?.[0] ?? ''}${mapped.lastName?.[0] ?? ''}`
   *   )
   * };
   * ```
   */
  export function fromMapped<Ui, K extends keyof Ui>(
    fn: (mapped: Partial<Ui>) => Ui[K]
  ): ComputedFieldSpec<Ui, K> {
    return {
      computed: (mapped: Partial<Ui>, _src: any) => fn(mapped),
    };
  }

  /**
   * Crea un campo computado con un valor constante
   *
   * @param value Valor constante
   * @returns Campo computado
   *
   * @example
   * ```typescript
   * const schema = {
   *   type: mxc.constant('user'),
   *   version: mxc.constant(1)
   * };
   * ```
   */
  export function constant<Ui, K extends keyof Ui>(
    value: Ui[K]
  ): ComputedFieldSpec<Ui, K> {
    return {
      computed: () => value,
    };
  }

  /**
   * Crea un campo computado que copia el valor de otro campo
   *
   * @param sourceKey Key del campo a copiar
   * @returns Campo computado
   *
   * @example
   * ```typescript
   * const schema = {
   *   email: 'user_email',
   *   username: mxc.copy('email') // Copia el email como username
   * };
   * ```
   */
  export function copy<Ui, K extends keyof Ui>(
    sourceKey: keyof Ui
  ): ComputedFieldSpec<Ui, K> {
    return {
      computed: (mapped: Partial<Ui>) => {
        const value = mapped[sourceKey];
        if (value === undefined) {
          throw new Error(
            `Cannot copy from "${String(sourceKey)}": value is undefined`
          );
        }
        return value as Ui[K];
      },
    };
  }

  /**
   * Crea un campo computado que transforma el valor de otro campo
   *
   * @param sourceKey Key del campo a transformar
   * @param transformer Función de transformación
   * @returns Campo computado
   *
   * @example
   * ```typescript
   * const schema = {
   *   price: 'raw_price',
   *   priceWithTax: mxc.transform('price', (price) => price * 1.16)
   * };
   * ```
   */
  export function transform<Ui, K extends keyof Ui, SK extends keyof Ui>(
    sourceKey: SK,
    transformer: (value: Ui[SK]) => Ui[K]
  ): ComputedFieldSpec<Ui, K> {
    return {
      computed: (mapped: Partial<Ui>) => {
        const value = mapped[sourceKey];
        if (value === undefined) {
          throw new Error(
            `Cannot transform from "${String(sourceKey)}": value is undefined`
          );
        }
        return transformer(value);
      },
    };
  }

  /**
   * Crea un campo computado async (retorna Promise)
   * NOTA: Solo funciona con mapperxAsync
   *
   * @param fn Función async
   * @returns Campo computado
   *
   * @example
   * ```typescript
   * const schema = {
   *   userId: 'user_id',
   *   userData: mxc.async(async (mapped, src) => {
   *     return await fetchUserData(mapped.userId);
   *   })
   * };
   * ```
   */
  export function async<Ui, K extends keyof Ui>(
    fn: (mapped: Partial<Ui>, src: any) => Promise<Ui[K]>
  ): ComputedFieldSpec<Ui, K> {
    return {
      computed: fn as any, // El tipo se maneja en mapperxAsync
    };
  }
}

/**
 * Alias más legible para crear campos computados
 */
export const mapperxComputed = mxc;

/**
 * Alias corto para crear campos computados
 */
export const computed = mxc;
