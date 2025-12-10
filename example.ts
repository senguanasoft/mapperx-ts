// ============================================================================
// MAPPERX-TS - EJEMPLOS COMPLETOS DE USO
// ============================================================================

import {
  mapperx,
  mapperxAsync,
  mxs,
  mxsExt,
  mxt,
  mxtNumber,
  mxtArray,
  mxc,
  MapperxSchema,
  AsyncMapperxSchema,
} from "./src/index";

// ============================================================================
// EJEMPLO 1: MAPEO BÁSICO
// ============================================================================

interface ApiUser {
  user_id: string;
  email_address: string;
  first_name: string;
  last_name: string;
  created_at: string;
  is_active: boolean;
}

interface UiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  createdAt: Date;
  active: boolean;
}

const userSchema: MapperxSchema<ApiUser, UiUser> = {
  id: "user_id",
  email: {
    from: "email_address",
    validate: mxs.email,
    transform: mxt.toLowerCase,
  },
  firstName: "first_name",
  lastName: "last_name",
  fullName: mxc.combine(
    ["firstName", "lastName"],
    (first, last) => `${first} ${last}`
  ),
  createdAt: {
    from: "created_at",
    validate: mxs.date,
  },
  active: "is_active",
};

// Uso:
const apiUser: ApiUser = {
  user_id: "123",
  email_address: "JOHN@EXAMPLE.COM",
  first_name: "John",
  last_name: "Doe",
  created_at: "2024-01-01T00:00:00Z",
  is_active: true,
};

const uiUser = mapperx(apiUser, userSchema);
console.log(uiUser);
// {
//   id: '123',
//   email: 'john@example.com',
//   firstName: 'John',
//   lastName: 'Doe',
//   fullName: 'John Doe',
//   createdAt: Date,
//   active: true
// }

// ============================================================================
// EJEMPLO 2: NESTED OBJECTS (OBJETOS ANIDADOS)
// ============================================================================

interface ApiOrder {
  order_id: string;
  customer: {
    customer_id: string;
    customer_name: string;
    customer_email: string;
  };
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  total_amount: number;
}

interface UiOrder {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  total: number;
}

const orderSchema: MapperxSchema<ApiOrder, UiOrder> = {
  id: "order_id",
  customer: {
    from: "customer",
    schema: {
      id: "customer_id",
      name: "customer_name",
      email: "customer_email",
    },
  },
  items: {
    from: "items",
    validate: mxs.array(
      mxs.custom((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
      }))
    ),
    transform: mxtArray.map((item: any) => ({
      id: item.product_id,
      name: item.product_name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.quantity * item.price,
    })),
  },
  total: "total_amount",
};

// ============================================================================
// EJEMPLO 3: VALIDACIONES AVANZADAS
// ============================================================================

interface ApiProduct {
  product_id: string;
  product_name: string;
  price: string; // Viene como string de la API
  stock: number;
  category: string;
  tags: string; // JSON string
  discount_percentage?: number;
}

interface UiProduct {
  id: string;
  name: string;
  price: number;
  finalPrice: number;
  stock: number;
  category: string;
  tags: string[];
  inStock: boolean;
}

const productSchema: MapperxSchema<ApiProduct, UiProduct> = {
  id: "product_id",
  name: {
    from: "product_name",
    validate: mxsExt.nonEmpty,
    transform: mxt.trim,
  },
  price: {
    from: "price",
    validate: mxs.custom((val) => {
      const num = parseFloat(String(val));
      if (isNaN(num) || num < 0) {
        throw new Error("Invalid price");
      }
      return num;
    }),
    transform: mxtNumber.round(2),
  },
  finalPrice: mxc<UiProduct, "finalPrice">((mapped, src: ApiProduct) => {
    const discount = src.discount_percentage ?? 0;
    return mapped.price! * (1 - discount / 100);
  }),
  stock: {
    from: "stock",
    validate: mxsExt.min(0),
  },
  category: "category",
  tags: {
    from: "tags",
    validate: mxs.string,
    transform: (val: string) => {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    },
  },
  inStock: mxc.fromMapped((mapped) => (mapped.stock ?? 0) > 0),
};

// ============================================================================
// EJEMPLO 4: MAPEO ASÍNCRONO
// ============================================================================

interface ApiPost {
  post_id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
}

interface UiPost {
  id: string;
  title: string;
  content: string;
  // author: {
  //   id: string;
  //   name: string;
  //   email: string;
  // };
  // createdAt: Date;
  // wordCount: number;
}

// Función simulada para obtener datos del autor
async function fetchAuthor(authorId: string): Promise<{
  id: string;
  name: string;
  email: string;
}> {
  // Simular llamada a API
  await new Promise((resolve) => setTimeout(resolve, 100));
  return {
    id: authorId,
    name: "John Doe",
    email: "john@example.com",
  };
}

const postSchema: AsyncMapperxSchema<ApiPost, UiPost> = {
  id: "post_id",
  title: "title",
  content: "content",
  // author: mxc.async(async (mapped, src: ApiPost) => {
  //   return await fetchAuthor(src.author_id);
  // }),
  // createdAt: {
  //   from: "created_at",
  //   validate: mxs.date,
  // },
  // wordCount: mxc.fromMapped((mapped) => {
  //   return (mapped.content ?? "").split(/\s+/).filter(Boolean).length;
  // }),
};

// Uso async:
async function processPost(apiPost: ApiPost) {
  const uiPost = await mapperxAsync(apiPost, postSchema);
  console.log(uiPost);
}

// ============================================================================
// EJEMPLO 5: MANEJO DE ERRORES
// ============================================================================

interface ApiData {
  required_field: string;
  optional_field?: string;
  numeric_field: string;
}

interface UiData {
  required: string;
  optional: string;
  numeric: number;
}

const strictSchema: MapperxSchema<ApiData, UiData> = {
  required: {
    from: "required_field",
    validate: mxsExt.nonEmpty,
  },
  optional: {
    from: "optional_field",
    default: "N/A",
  },
  numeric: {
    from: "numeric_field",
    validate: mxs.number,
  },
};

// Con manejo de errores:
try {
  const badData: ApiData = {
    required_field: "",
    numeric_field: "not-a-number",
  };

  const result = mapperx(badData, strictSchema);
} catch (error) {
  if (error instanceof Error) {
    console.error("Mapping failed:", error.message);
    // Mapping failed: Mapperx mapping error at "required" (from "required_field"): String cannot be empty
  }
}

// Con skipInvalid:
const lenientData: ApiData = {
  required_field: "valid",
  numeric_field: "not-a-number",
};

const partialResult = mapperx(lenientData, strictSchema, { skipInvalid: true });
console.log(partialResult);
// { required: 'valid', optional: 'N/A' }
// numeric no se incluye porque falló la validación

// ============================================================================
// EJEMPLO 6: BATCH PROCESSING
// ============================================================================

interface ApiBatchItem {
  id: string;
  value: number;
}

interface UiBatchItem {
  id: string;
  value: number;
  doubled: number;
}

const batchSchema: MapperxSchema<ApiBatchItem, UiBatchItem> = {
  id: "id",
  value: "value",
  doubled: mxc.transform("value", (val) => val * 2),
};

const apiBatch: ApiBatchItem[] = [
  { id: "1", value: 10 },
  { id: "2", value: 20 },
  { id: "3", value: 30 },
];

import { mapperxBatch } from "./src/index";

const batchResult = mapperxBatch(apiBatch, batchSchema);
console.log(batchResult.data);
// [
//   { id: '1', value: 10, doubled: 20 },
//   { id: '2', value: 20, doubled: 40 },
//   { id: '3', value: 30, doubled: 60 }
// ]

// ============================================================================
// EJEMPLO 7: DEEP PATHS (RUTAS ANIDADAS)
// ============================================================================

interface ApiComplex {
  user: {
    profile: {
      personal: {
        firstName: string;
        lastName: string;
      };
      contact: {
        email: string;
      };
    };
  };
}

interface UiComplex {
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
}

const complexSchema: MapperxSchema<ApiComplex, UiComplex> = {
  firstName: "user.profile.personal.firstName" as any,
  lastName: "user.profile.personal.lastName" as any,
  email: "user.profile.contact.email" as any,
  fullName: mxc.combine(
    ["firstName", "lastName"],
    (first, last) => `${first} ${last}`
  ),
};

// ============================================================================
// EJEMPLO 8: TRANSFORMACIONES COMPLEJAS
// ============================================================================

interface ApiTransaction {
  transaction_id: string;
  amount: string;
  currency: string;
  date: string;
  status: string;
}

interface UiTransaction {
  id: string;
  amount: number;
  currency: string;
  formattedAmount: string;
  date: Date;
  dateFormatted: string;
  status: "pending" | "completed" | "failed";
}

const transactionSchema: MapperxSchema<ApiTransaction, UiTransaction> = {
  id: "transaction_id",
  amount: {
    from: "amount",
    validate: mxs.number,
    transform: mxtNumber.round(2),
  },
  currency: "currency",
  formattedAmount: mxc<UiTransaction, "formattedAmount">(
    (mapped, src: ApiTransaction) => {
      const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: mapped.currency ?? src.currency,
      });
      return formatter.format(mapped.amount ?? 0);
    }
  ),
  date: {
    from: "date",
    validate: mxs.date,
  },
  dateFormatted: mxc.transform("date", (date) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  ),
  status: {
    from: "status",
    validate: mxs.enum("pending", "completed", "failed"),
  },
};

// ============================================================================
// EJEMPLO 9: CONDICIONALES
// ============================================================================

interface ApiMember {
  member_id: string;
  age: number;
  subscription_type: string;
  points: number;
}

interface UiMember {
  id: string;
  age: number;
  tier: "basic" | "premium" | "vip";
  discount: number;
}

const memberSchema: MapperxSchema<ApiMember, UiMember> = {
  id: "member_id",
  age: "age",
  tier: mxc.conditional<UiMember, "tier">(
    (mapped, src: ApiMember) => src.points > 1000,
    () => "vip",
    (mapped, src: ApiMember) =>
      src.subscription_type === "premium" ? "premium" : "basic"
  ),
  discount: mxc<UiMember, "discount">((mapped, src: ApiMember) => {
    if (mapped.tier === "vip") return 0.3;
    if (mapped.tier === "premium") return 0.2;
    return 0.1;
  }),
};

// ============================================================================
// EJEMPLO 10: MODO ESTRICTO
// ============================================================================

const apiDataWithExtra = {
  id: "123",
  name: "Test",
  extraField1: "should warn",
  extraField2: "should warn",
};

const simpleSchema: MapperxSchema<
  { id: string; name: string },
  { id: string; name: string }
> = {
  id: "id",
  name: "name",
};

// Con strict mode, se mostrará advertencia de campos extra
const result = mapperx(apiDataWithExtra, simpleSchema, { strict: true });
// Console: [Mapperx] Extra fields in source object were not mapped: extraField1, extraField2

export {
  userSchema,
  orderSchema,
  productSchema,
  postSchema,
  strictSchema,
  batchSchema,
  complexSchema,
  transactionSchema,
  memberSchema,
};
