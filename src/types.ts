// ============================================================================
// MAPPERX-TS - TYPES MODULE
// ============================================================================

/**
 * Tipos primitivos que terminan la recursión en DeepKeys
 */
type Primitive = string | number | boolean | bigint | symbol | undefined | null;

/**
 * Tipos que no deberían ser navegados recursivamente
 */
type NonNavigable = Primitive | Date | RegExp | Function | Promise<any>;

/**
 * Verifica si un tipo es un array
 */
type IsArray<T> = T extends readonly any[] ? true : false;

/**
 * Obtiene el tipo de elemento de un array
 */
type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * CORRECCIÓN CRÍTICA: DeepKeys mejorado con mejor manejo de arrays y objetos
 *
 * Recursivamente obtiene todos los paths posibles de un objeto como union de strings.
 *
 * Ejemplos:
 * - { a: string } → "a"
 * - { a: { b: string } } → "a" | "a.b"
 * - { user: { name: string; age: number } } → "user" | "user.name" | "user.age"
 */
export type DeepKeys<T> = T extends NonNavigable
  ? never // No navegar tipos primitivos, Date, etc.
  : T extends readonly any[]
  ? never // No navegar arrays directamente (usa el elemento del array si es necesario)
  : {
      [K in keyof T & string]: T[K] extends NonNavigable
        ? K // Si el valor es primitivo, retornar solo la key
        : T[K] extends object
        ? K | `${K}.${DeepKeys<T[K]>}` // Si es objeto, recursión
        : K;
    }[keyof T & string];

/**
 * CORRECCIÓN: Path ahora solo acepta keys válidas o deep paths válidos
 *
 * Path<T> representa cualquier ruta válida en el objeto T:
 * - Keys de nivel superior: keyof T
 * - Rutas anidadas usando dot notation: DeepKeys<T>
 */
export type Path<T> = keyof T | DeepKeys<T>;

/**
 * NUEVO: Obtiene el tipo en una ruta específica
 *
 * Útil para validar que un path retorna el tipo esperado
 *
 * Ejemplos:
 * - PathValue<{ a: { b: string } }, "a.b"> → string
 * - PathValue<{ user: { name: string } }, "user.name"> → string
 */
export type PathValue<T, P extends string> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends string
      ? PathValue<T[K], Rest>
      : never
    : never
  : never;

/**
 * NUEVO: Verifica si un path es válido para un tipo dado
 */
export type IsValidPath<T, P extends string> = P extends Path<T> ? true : false;

/**
 * NUEVO: Extrae todas las keys que apuntan a un tipo específico
 *
 * Útil para filtrar keys por tipo de valor
 *
 * Ejemplo:
 * type User = { name: string; age: number; email: string };
 * KeysOfType<User, string> → "name" | "email"
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * NUEVO: Extrae todas las keys opcionales
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * NUEVO: Extrae todas las keys requeridas
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * NUEVO: Helper para hacer específicas keys opcionales
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * NUEVO: Helper para hacer específicas keys requeridas
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

// ============================================================================
// TESTS DE TIPOS (Solo para verificación, no se exportan)
// ============================================================================

/**
 * Tests para verificar que los tipos funcionan correctamente
 * Estos no generan código en runtime, solo validan tipos en compile time
 */

// Test 1: DeepKeys básico
type TestObj1 = {
  a: string;
  b: {
    c: number;
    d: {
      e: boolean;
    };
  };
};

type Test1 = DeepKeys<TestObj1>;
// Debería ser: "a" | "b" | "b.c" | "b.d" | "b.d.e"

// Test 2: DeepKeys con primitivos
type TestObj2 = {
  name: string;
  age: number;
  active: boolean;
};

type Test2 = DeepKeys<TestObj2>;
// Debería ser: "name" | "age" | "active"

// Test 3: DeepKeys con Date (no debería navegar)
type TestObj3 = {
  user: {
    name: string;
    createdAt: Date;
  };
};

type Test3 = DeepKeys<TestObj3>;
// Debería ser: "user" | "user.name" | "user.createdAt" (pero Date no se navega más allá)

// Test 4: PathValue
type TestPath1 = PathValue<TestObj1, "b.d.e">;
// Debería ser: boolean

type TestPath2 = PathValue<TestObj3, "user.name">;
// Debería ser: string

// Test 5: KeysOfType
type TestKeys1 = KeysOfType<TestObj2, string>;
// Debería ser: "name"

type TestKeys2 = KeysOfType<TestObj2, number>;
// Debería ser: "age"

// ============================================================================
// EXPORTS
// ============================================================================

export type { Primitive, NonNavigable, IsArray, ArrayElement };
