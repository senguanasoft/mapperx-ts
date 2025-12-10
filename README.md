# 🗺️ MapperX-TS

A lightweight, type-safe data mapper library for TypeScript. Transform API responses into clean domain models with validation, computed fields, async operations, and zero dependencies.

**A powerful data mapping solution by Emilio Yankuam Senguana**

---

## ✨ Features

- 🎯 **Type-safe**: Full TypeScript support with type inference
- 🚀 **Lightweight**: Zero dependencies, ~5KB minified
- 🔄 **Flexible Mapping**: Simple field mapping to complex transformations
- ✅ **Built-in Validators**: String, number, boolean, date, array, enum, email, URL, UUID, and custom
- 🧮 **Computed Fields**: Calculate derived properties from mapped data
- 📦 **Batch Processing**: Map arrays with error handling
- ⚡ **Async Support**: Full async/await support for validators, transforms, and computed fields
- 🔧 **Rich Transforms**: String, number, array, date, and object transformations
- 🛡️ **Error Handling**: Detailed error messages with field tracking
- 🎨 **Clean API**: Intuitive syntax with minimal boilerplate

---

## 📦 Installation

```bash
npm install mapperx-ts
# or
yarn add mapperx-ts
# or
pnpm add mapperx-ts
```

---

## 🚀 Quick Start

```typescript
import { mapperx, mxs, type MapperxSchema } from "mapperx-ts";

// Define your types
interface UserDto {
  id: number;
  full_name: string;
  email_address: string;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Create schema
const userSchema: MapperxSchema<UserDto, User> = {
  id: {
    from: "id",
    transform: (val) => `USER_${val}`,
  },
  name: "full_name", // Simple field mapping
  email: "email_address",
  createdAt: {
    from: "created_at",
    validate: mxs.date,
  },
};

// Map data
const dto = {
  id: 123,
  full_name: "John Doe",
  email_address: "john@example.com",
  created_at: "2024-12-04T10:00:00Z",
};

const user = mapperx(dto, userSchema);
console.log(user);
// {
//   id: "USER_123",
//   name: "John Doe",
//   email: "john@example.com",
//   createdAt: Date(...)
// }
```

---

## 📚 Progressive Examples (Simple to Advanced)

### 🟢 Level 1: Basic Field Mapping

Simple one-to-one field mapping:

```typescript
import { mapperx, type MapperxSchema } from "mapperx-ts";

interface ProductDto {
  product_id: number;
  product_name: string;
  price: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

const schema: MapperxSchema<ProductDto, Product> = {
  id: "product_id",
  name: "product_name",
  price: "price",
};

const dto = { product_id: 1, product_name: "Laptop", price: 999 };
const product = mapperx(dto, schema);
// { id: 1, name: "Laptop", price: 999 }
```

### 🟢 Level 2: Validation

Add type validation and conversion:

```typescript
import { mapperx, mxs, type MapperxSchema } from "mapperx-ts";

interface OrderDto {
  order_id: string;
  total: string; // API returns string
  created: string;
  is_paid: string; // "true" or "false"
}

interface Order {
  id: number;
  total: number;
  created: Date;
  isPaid: boolean;
}

const schema: MapperxSchema<OrderDto, Order> = {
  id: {
    from: "order_id",
    validate: mxs.number, // Convert string to number
  },
  total: {
    from: "total",
    validate: mxs.number,
  },
  created: {
    from: "created",
    validate: mxs.date, // Convert string to Date
  },
  isPaid: {
    from: "is_paid",
    validate: mxs.boolean, // Convert "true"/"false" to boolean
  },
};

const dto = {
  order_id: "123",
  total: "99.99",
  created: "2024-12-10T10:00:00Z",
  is_paid: "true",
};

const order = mapperx(dto, schema);
// { id: 123, total: 99.99, created: Date(...), isPaid: true }
```

### 🟡 Level 3: Transformations

Transform data during mapping:

```typescript
import { mapperx, mxs, mxt, type MapperxSchema } from "mapperx-ts";

interface UserDto {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
}

const schema: MapperxSchema<UserDto, User> = {
  id: {
    from: "user_id",
    transform: (val) => `USR_${String(val).padStart(6, "0")}`,
  },
  firstName: {
    from: "first_name",
    validate: mxs.string,
    transform: mxt.capitalize, // Capitalize first letter
  },
  lastName: {
    from: "last_name",
    validate: mxs.string,
    transform: mxt.capitalize,
  },
  email: {
    from: "email",
    validate: mxs.email,
    transform: mxt.toLowerCase, // Normalize email
  },
  status: {
    from: "status",
    validate: mxs.string,
    transform: mxt.toUpperCase, // Convert to uppercase
  },
};

const dto = {
  user_id: 42,
  first_name: "john",
  last_name: "DOE",
  email: "John.Doe@Example.COM",
  status: "active",
};

const user = mapperx(dto, schema);
// {
//   id: "USR_000042",
//   firstName: "John",
//   lastName: "Doe",
//   email: "john.doe@example.com",
//   status: "ACTIVE"
// }
```

### 🟡 Level 4: Computed Fields

Add calculated fields that don't exist in source:

```typescript
import { mapperx, mxs, mxc, type MapperxSchema } from "mapperx-ts";

interface ProductDto {
  id: number;
  name: string;
  price: number;
  stock: number;
  category_id: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  categoryId: number;
  // Computed fields
  priceWithTax: number;
  availability: "In Stock" | "Low Stock" | "Out of Stock";
  priceRange: "Budget" | "Standard" | "Premium";
  displayPrice: string;
}

const schema: MapperxSchema<ProductDto, Product> = {
  id: "id",
  name: "name",
  price: { from: "price", validate: mxs.number },
  stock: { from: "stock", validate: mxs.number },
  categoryId: { from: "category_id", validate: mxs.number },

  // Computed: Calculate tax
  priceWithTax: mxc((mapped) => {
    return mapped.price! * 1.15; // 15% tax
  }),

  // Computed: Determine availability
  availability: mxc((mapped) => {
    const stock = mapped.stock!;
    if (stock === 0) return "Out of Stock";
    if (stock < 10) return "Low Stock";
    return "In Stock";
  }),

  // Computed: Classify price range
  priceRange: mxc((mapped) => {
    const price = mapped.price!;
    if (price < 50) return "Budget";
    if (price < 200) return "Standard";
    return "Premium";
  }),

  // Computed: Format for display
  displayPrice: mxc((mapped) => {
    return `$${mapped.priceWithTax!.toFixed(2)}`;
  }),
};

const dto = {
  id: 1,
  name: "Wireless Mouse",
  price: 29.99,
  stock: 5,
  category_id: 10,
};

const product = mapperx(dto, schema);
// {
//   id: 1,
//   name: "Wireless Mouse",
//   price: 29.99,
//   stock: 5,
//   categoryId: 10,
//   priceWithTax: 34.49,
//   availability: "Low Stock",
//   priceRange: "Budget",
//   displayPrice: "$34.49"
// }
```

### 🟡 Level 5: Advanced Computed Fields

Use advanced computed field helpers:

```typescript
import { mapperx, mxs, mxc, type MapperxSchema } from "mapperx-ts";

interface PersonDto {
  first_name: string;
  last_name: string;
  birth_year: number;
  country: string;
  score: number;
}

interface Person {
  firstName: string;
  lastName: string;
  birthYear: number;
  country: string;
  score: number;
  // Computed fields
  fullName: string;
  age: number;
  isAdult: boolean;
  scoreLevel: "Low" | "Medium" | "High";
  nationality: string;
}

const schema: MapperxSchema<PersonDto, Person> = {
  firstName: "first_name",
  lastName: "last_name",
  birthYear: { from: "birth_year", validate: mxs.number },
  country: "country",
  score: { from: "score", validate: mxs.number },

  // Combine multiple fields
  fullName: mxc.combine(
    ["firstName", "lastName"],
    (first, last) => `${first} ${last}`
  ),

  // Calculate from source
  age: mxc.fromSource((src) => {
    const currentYear = new Date().getFullYear();
    return currentYear - src.birth_year;
  }),

  // Conditional computed
  isAdult: mxc.conditional(
    (mapped) => mapped.age! >= 18,
    () => true,
    () => false
  ),

  // Conditional with complex logic
  scoreLevel: mxc.conditional(
    (mapped) => mapped.score! >= 80,
    () => "High",
    mxc.conditional(
      (mapped) => mapped.score! >= 50,
      () => "Medium",
      () => "Low"
    ).computed
  ),

  // Constant value
  nationality: mxc.fromMapped((mapped) => {
    const countryMap: Record<string, string> = {
      US: "American",
      UK: "British",
      FR: "French",
    };
    return countryMap[mapped.country!] || "Unknown";
  }),
};

const dto = {
  first_name: "Alice",
  last_name: "Johnson",
  birth_year: 1990,
  country: "US",
  score: 85,
};

const person = mapperx(dto, schema);
// {
//   firstName: "Alice",
//   lastName: "Johnson",
//   birthYear: 1990,
//   country: "US",
//   score: 85,
//   fullName: "Alice Johnson",
//   age: 34,
//   isAdult: true,
//   scoreLevel: "High",
//   nationality: "American"
// }
```

### 🟠 Level 6: Array Processing & Nested Data

Handle arrays and nested structures:

```typescript
import { mapperx, mxs, mxc, mxtArray, type MapperxSchema } from "mapperx-ts";

interface OrderDto {
  order_id: number;
  items: Array<{ sku: string; qty: number; price: number }>;
  tags: string; // Comma-separated
  customer: {
    name: string;
    email: string;
  };
}

interface Order {
  id: string;
  items: Array<{ sku: string; qty: number; price: number }>;
  tags: string[];
  customerName: string;
  customerEmail: string;
  // Computed
  itemCount: number;
  totalItems: number;
  subtotal: number;
  firstItem: { sku: string; qty: number; price: number } | undefined;
}

const schema: MapperxSchema<OrderDto, Order> = {
  id: {
    from: "order_id",
    transform: (val) => `ORD-${val}`,
  },
  items: {
    from: "items",
    validate: mxs.array(mxs.custom((item: any) => item)),
  },
  tags: {
    from: "tags",
    validate: mxs.string,
    transform: mxt.split(","), // Split string to array
  },

  // Flatten nested customer object
  customerName: {
    from: "customer" as any,
    transform: (val: any) => val.name,
  },
  customerEmail: {
    from: "customer" as any,
    transform: (val: any) => val.email,
  },

  // Computed: Count unique items
  itemCount: mxc((mapped) => mapped.items!.length),

  // Computed: Total quantity
  totalItems: mxc((mapped) => {
    return mapped.items!.reduce((sum, item) => sum + item.qty, 0);
  }),

  // Computed: Calculate subtotal
  subtotal: mxc((mapped) => {
    return mapped.items!.reduce((sum, item) => sum + item.qty * item.price, 0);
  }),

  // Computed: Get first item
  firstItem: mxc((mapped) => mapped.items![0]),
};

const dto = {
  order_id: 1001,
  items: [
    { sku: "A001", qty: 2, price: 10.0 },
    { sku: "B002", qty: 1, price: 25.0 },
  ],
  tags: "electronics,sale,featured",
  customer: {
    name: "Bob Smith",
    email: "bob@example.com",
  },
};

const order = mapperx(dto, schema);
// {
//   id: "ORD-1001",
//   items: [...],
//   tags: ["electronics", "sale", "featured"],
//   customerName: "Bob Smith",
//   customerEmail: "bob@example.com",
//   itemCount: 2,
//   totalItems: 3,
//   subtotal: 45.0,
//   firstItem: { sku: "A001", qty: 2, price: 10.0 }
// }
```

### 🟠 Level 7: Batch Processing with Error Handling

Process multiple items with graceful error handling:

```typescript
import { mapperx, mxs, type MapperxSchema } from "mapperx-ts";

interface UserDto {
  id: number;
  name: string;
  age: string;
  email: string;
}

interface User {
  id: number;
  name: string;
  age: number;
  email: string;
}

const schema: MapperxSchema<UserDto, User> = {
  id: { from: "id", validate: mxs.number },
  name: { from: "name", validate: mxs.string },
  age: { from: "age", validate: mxs.number },
  email: { from: "email", validate: mxs.email },
};

const apiData = [
  { id: 1, name: "Alice", age: "30", email: "alice@example.com" },
  { id: 2, name: "Bob", age: "invalid", email: "bob@example.com" }, // ❌ Invalid age
  { id: 3, name: "Charlie", age: "25", email: "not-an-email" }, // ❌ Invalid email
  { id: 4, name: "Diana", age: "28", email: "diana@example.com" },
];

const result = mapperx.batch(apiData, schema);

console.log(result.data);
// [
//   { id: 1, name: "Alice", age: 30, email: "alice@example.com" },
//   { id: 4, name: "Diana", age: 28, email: "diana@example.com" }
// ]

console.log(result.errors);
// [
//   { index: 1, item: {...}, error: MapperXError(...) },
//   { index: 2, item: {...}, error: MapperXError(...) }
// ]

// Handle errors gracefully
result.errors.forEach(({ index, item, error }) => {
  console.error(`❌ Failed at index ${index}:`, error.message);
  console.error(`   Original item:`, item);
});
```

### 🔴 Level 8: Async Operations

Handle async validators, transforms, and computed fields:

```typescript
import { mapperxAsync, mxs, mxc, type AsyncMapperxSchema } from "mapperx-ts";

// Simulate API calls
const fetchUserRole = async (userId: number): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return userId === 1 ? "admin" : "user";
};

const validateEmailUnique = async (email: string): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  // Simulate email uniqueness check
  if (email === "duplicate@example.com") {
    throw new Error("Email already exists");
  }
  return email;
};

interface UserDto {
  id: number;
  name: string;
  email: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

const schema: AsyncMapperxSchema<UserDto, User> = {
  id: { from: "id", validate: mxs.number },
  name: { from: "name", validate: mxs.string },

  // Async validator
  email: {
    from: "email",
    validate: async (val) => {
      const email = mxs.email(val);
      return await validateEmailUnique(email);
    },
  },

  // Async computed field
  role: {
    computed: async (mapped) => {
      return await fetchUserRole(mapped.id!);
    },
  },

  // Async computed based on other async field
  permissions: {
    computed: async (mapped) => {
      const role = mapped.role!;
      if (role === "admin") {
        return ["read", "write", "delete", "admin"];
      }
      return ["read"];
    },
  },
};

const dto = {
  id: 1,
  name: "Admin User",
  email: "admin@example.com",
};

const user = await mapperxAsync(dto, schema);
// {
//   id: 1,
//   name: "Admin User",
//   email: "admin@example.com",
//   role: "admin",
//   permissions: ["read", "write", "delete", "admin"]
// }
```

### 🔴 Level 9: Complex Business Logic

Real-world e-commerce order processing:

```typescript
import { mapperx, mxs, mxc, type MapperxSchema } from "mapperx-ts";

interface OrderDto {
  id: number;
  items: string; // JSON string
  subtotal: string;
  customer_id: number;
  discount_code?: string;
  shipping_country: string;
  priority_shipping: string;
}

interface OrderModel {
  orderId: string;
  items: Array<{ sku: string; qty: number; price: number }>;
  subtotal: number;
  customerId: string;
  discountCode: string | null;
  shippingCountry: string;
  priorityShipping: boolean;
  // Computed business logic
  discount: number;
  discountPercentage: number;
  taxRate: number;
  tax: number;
  shipping: number;
  total: number;
  isEligibleForFreeShipping: boolean;
  priority: "high" | "normal" | "low";
  estimatedDeliveryDays: number;
  loyaltyPoints: number;
}

const schema: MapperxSchema<OrderDto, OrderModel> = {
  orderId: {
    from: "id",
    transform: (id) => `ORD-${String(id).padStart(8, "0")}`,
  },

  items: {
    from: "items",
    validate: mxs.custom((val) => {
      const parsed = JSON.parse(String(val));
      if (!Array.isArray(parsed)) throw new Error("Items must be array");
      return parsed;
    }),
  },

  subtotal: { from: "subtotal", validate: mxs.number },
  customerId: {
    from: "customer_id",
    transform: (id) => `CUST-${id}`,
  },
  discountCode: {
    from: "discount_code",
    validate: mxs.optional(mxs.string),
    default: null,
  },
  shippingCountry: { from: "shipping_country", validate: mxs.string },
  priorityShipping: { from: "priority_shipping", validate: mxs.boolean },

  // Business Logic: Calculate discount
  discount: mxc((mapped) => {
    const code = mapped.discountCode;
    if (!code) return 0;

    const discounts: Record<string, number> = {
      SAVE10: 0.1,
      SAVE20: 0.2,
      SAVE30: 0.3,
      BLACKFRIDAY: 0.5,
    };

    const rate = discounts[code] || 0;
    return mapped.subtotal! * rate;
  }),

  discountPercentage: mxc((mapped) => {
    if (mapped.subtotal === 0) return 0;
    return (mapped.discount! / mapped.subtotal!) * 100;
  }),

  // Business Logic: Tax rate by country
  taxRate: mxc((mapped) => {
    const taxRates: Record<string, number> = {
      US: 0.08,
      CA: 0.13,
      UK: 0.2,
      DE: 0.19,
      FR: 0.2,
    };
    return taxRates[mapped.shippingCountry!] || 0.15;
  }),

  tax: mxc((mapped) => {
    const taxableAmount = mapped.subtotal! - mapped.discount!;
    return taxableAmount * mapped.taxRate!;
  }),

  // Business Logic: Shipping calculation
  shipping: mxc((mapped) => {
    const baseShipping = 10;
    const priorityFee = mapped.priorityShipping ? 15 : 0;

    // Free shipping for orders over $100 after discount
    const afterDiscount = mapped.subtotal! - mapped.discount!;
    if (afterDiscount >= 100) return priorityFee;

    return baseShipping + priorityFee;
  }),

  total: mxc((mapped) => {
    return mapped.subtotal! - mapped.discount! + mapped.tax! + mapped.shipping!;
  }),

  isEligibleForFreeShipping: mxc((mapped) => {
    return mapped.subtotal! - mapped.discount! >= 100;
  }),

  // Business Logic: Order priority
  priority: mxc((mapped) => {
    const itemCount = mapped.items!.reduce((sum, item) => sum + item.qty, 0);

    if (mapped.total! > 500 || itemCount > 20 || mapped.priorityShipping) {
      return "high";
    }
    if (mapped.total! < 50) {
      return "low";
    }
    return "normal";
  }),

  // Business Logic: Delivery estimate
  estimatedDeliveryDays: mxc((mapped) => {
    if (mapped.priorityShipping) return 2;

    const domesticCountries = ["US", "CA"];
    if (domesticCountries.includes(mapped.shippingCountry!)) {
      return 5;
    }
    return 10;
  }),

  // Business Logic: Loyalty points
  loyaltyPoints: mxc((mapped) => {
    // 1 point per dollar spent (after discount, before tax)
    const pointsBase = Math.floor(mapped.subtotal! - mapped.discount!);

    // Bonus points for high-value orders
    const bonus = mapped.total! > 200 ? 50 : 0;

    return pointsBase + bonus;
  }),
};

const dto = {
  id: 12345,
  items:
    '[{"sku":"LAPTOP-001","qty":1,"price":899.99},{"sku":"MOUSE-002","qty":2,"price":29.99}]',
  subtotal: "959.97",
  customer_id: 7890,
  discount_code: "SAVE20",
  shipping_country: "US",
  priority_shipping: "true",
};

const order = mapperx(dto, schema);
console.log(order);
// {
//   orderId: "ORD-00012345",
//   items: [...],
//   subtotal: 959.97,
//   customerId: "CUST-7890",
//   discountCode: "SAVE20",
//   shippingCountry: "US",
//   priorityShipping: true,
//   discount: 191.99,
//   discountPercentage: 20,
//   taxRate: 0.08,
//   tax: 61.44,
//   shipping: 15,
//   total: 844.42,
//   isEligibleForFreeShipping: true,
//   priority: "high",
//   estimatedDeliveryDays: 2,
//   loyaltyPoints: 818
// }
```

### 🔴 Level 10: Advanced Validators & Custom Logic

Use extended validators and create custom validation logic:

```typescript
import { mapperx, mxs, mxsExt, type MapperxSchema } from "mapperx-ts";

interface RegistrationDto {
  username: string;
  email: string;
  password: string;
  age: string;
  website?: string;
  phone: string;
  country: string;
  terms_accepted: string;
}

interface Registration {
  username: string;
  email: string;
  password: string;
  age: number;
  website: string | null;
  phone: string;
  country: string;
  termsAccepted: boolean;
}

const schema: MapperxSchema<RegistrationDto, Registration> = {
  username: {
    from: "username",
    validate: mxs.custom((val) => {
      const str = mxs.string(val);
      // Custom validation: alphanumeric, 3-20 chars
      if (!/^[a-zA-Z0-9]{3,20}$/.test(str)) {
        throw new Error("Username must be 3-20 alphanumeric characters");
      }
      return str;
    }),
  },

  email: {
    from: "email",
    validate: mxs.email, // Built-in email validator
  },

  password: {
    from: "password",
    validate: mxs.custom((val) => {
      const str = mxs.string(val);
      // Custom: min 8 chars, must have uppercase, lowercase, number
      if (str.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      if (!/[A-Z]/.test(str)) {
        throw new Error("Password must contain uppercase letter");
      }
      if (!/[a-z]/.test(str)) {
        throw new Error("Password must contain lowercase letter");
      }
      if (!/[0-9]/.test(str)) {
        throw new Error("Password must contain number");
      }
      return str;
    }),
  },

  age: {
    from: "age",
    validate: mxs.custom((val) => {
      const num = mxs.number(val);
      // Use extended validator for range
      return mxsExt.range(13, 120)(num);
    }),
  },

  website: {
    from: "website",
    validate: mxs.optional(mxsExt.url), // Optional URL
    default: null,
  },

  phone: {
    from: "phone",
    validate: mxsExt.pattern(
      /^\+?[1-9]\d{1,14}$/,
      "Invalid phone number format"
    ),
  },

  country: {
    from: "country",
    validate: mxs.enum("US", "CA", "UK", "DE", "FR", "ES", "IT"),
  },

  termsAccepted: {
    from: "terms_accepted",
    validate: mxs.custom((val) => {
      const bool = mxs.boolean(val);
      if (!bool) {
        throw new Error("You must accept the terms and conditions");
      }
      return bool;
    }),
  },
};

const dto = {
  username: "john_doe123",
  email: "john@example.com",
  password: "SecurePass123",
  age: "25",
  website: "https://johndoe.com",
  phone: "+1234567890",
  country: "US",
  terms_accepted: "true",
};

const registration = mapperx(dto, schema);
// All validations passed! ✅
```

---

## 🔧 API Reference

### Main Functions

#### `mapperx<Api, Ui>(api, schema, options?)`

Maps a single object from API format to UI format.

**Alias**: `mx`

```typescript
const result = mapperx(apiData, schema);
// or
const result = mx(apiData, schema);
```

**Parameters:**

- `api`: Source object (API response)
- `schema`: Mapping schema
- `options?`: Optional configuration
  - `strict?: boolean` - Warn about unmapped API fields
  - `skipInvalid?: boolean` - Skip invalid fields instead of throwing
  - `throwOnError?: boolean` - Throw on first error (default: true)

#### `mapperx.batch<Api, Ui>(items, schema, options?)`

Maps an array of objects with error handling.

**Alias**: `mx.batch`

```typescript
const result = mapperx.batch(apiArray, schema);
// Returns: { data: Ui[], errors: Array<{index, item, error}> }
```

#### `mapperxAsync<Api, Ui>(api, schema, options?)`

Async version supporting async validators, transforms, and computed fields.

**Alias**: `mxa`

```typescript
const result = await mapperxAsync(apiData, asyncSchema);
```

### Validators (`mxs`)

Built-in validators for common types:

```typescript
import { mxs } from "mapperx-ts";

// Basic validators
mxs.string(value); // Converts to string
mxs.number(value); // Converts to number
mxs.boolean(value); // Converts to boolean
mxs.date(value); // Converts to Date
mxs.email(value); // Validates email format

// Array & Optional
mxs.array(itemValidator)(value); // Validates array items
mxs.optional(validator)(value); // Allows undefined
mxs.nullable(validator)(value); // Allows null

// Enum
mxs.enum("active", "inactive")(value);

// Custom
mxs.custom((val) => {
  // Your validation logic
  return transformedValue;
});
```

### Extended Validators (`mxsExt`)

Advanced validators:

```typescript
import { mxsExt } from "mapperx-ts";

mxsExt.url(value); // URL format
mxsExt.uuid(value); // UUID format
mxsExt.min(10)(value); // Min number
mxsExt.max(100)(value); // Max number
mxsExt.range(10, 100)(value); // Number range
mxsExt.minLength(3)(value); // Min string length
mxsExt.maxLength(50)(value); // Max string length
mxsExt.pattern(/regex/)(value); // Regex pattern
mxsExt.integer(value); // Integer only
mxsExt.positive(value); // Positive number
mxsExt.negative(value); // Negative number
mxsExt.nonEmpty(value); // Non-empty string
mxsExt.object(shape)(value); // Object shape
mxsExt.record(validator)(value); // Record type
mxsExt.tuple(...validators)(value); // Tuple validation
mxsExt.union(...validators)(value); // Union type
mxsExt.literal(value)(value); // Literal value
```

### String Transforms (`mxt`)

```typescript
import { mxt } from "mapperx-ts";

mxt.trim; // Remove whitespace
mxt.toLowerCase; // Convert to lowercase
mxt.toUpperCase; // Convert to uppercase
mxt.capitalize; // Capitalize first letter
mxt.titleCase; // Title Case
mxt.camelCase; // camelCase
mxt.snakeCase; // snake_case
mxt.kebabCase; // kebab-case
mxt.split(","); // Split to array
mxt.replace("old", "new"); // Replace text
mxt.truncate(50, "..."); // Truncate string
mxt.padStart(10, "0"); // Pad start
mxt.padEnd(10, " "); // Pad end
```

### Number Transforms (`mxtNumber`)

```typescript
import { mxtNumber } from "mapperx-ts";

mxtNumber.round(2); // Round to decimals
mxtNumber.ceil; // Round up
mxtNumber.floor; // Round down
mxtNumber.abs; // Absolute value
mxtNumber.clamp(0, 100); // Clamp to range
mxtNumber.add(10); // Add value
mxtNumber.subtract(5); // Subtract value
mxtNumber.multiply(1.15); // Multiply (e.g., tax)
mxtNumber.divide(2); // Divide
```

### Array Transforms (`mxtArray`)

```typescript
import { mxtArray } from "mapperx-ts";

mxtArray.join(","); // Join to string
mxtArray.filter(predicate); // Filter items
mxtArray.map(mapper); // Map items
mxtArray.first; // Get first item
mxtArray.last; // Get last item
mxtArray.find(predicate); // Find item
mxtArray.take(5); // Take first N
mxtArray.skip(2); // Skip first N
mxtArray.unique; // Remove duplicates
mxtArray.sort(compareFn); // Sort array
```

### Computed Fields (`mxc`)

```typescript
import { mxc } from "mapperx-ts";

// Basic computed
mxc((mapped, src) => {
  return mapped.price! * mapped.quantity!;
});

// With default value
mxc.withDefault((mapped) => (mapped.value! > 100 ? "High" : "Low"), "Unknown");

// Combine fields
mxc.combine(["firstName", "lastName"], (first, last) => `${first} ${last}`);

// Conditional
mxc.conditional(
  (mapped) => mapped.age! >= 18,
  () => "Adult",
  () => "Minor"
);

// From source only
mxc.fromSource((src) => src.raw_data);

// From mapped only
mxc.fromMapped((mapped) => mapped.field!);

// Constant value
mxc.constant("FIXED_VALUE");
```

---

## 🎯 Best Practices

### 1. Separate Business Logic

```typescript
// ✅ GOOD: Reusable business logic
const calculateShipping = (total: number, itemCount: number) => {
  if (total >= 50) return 0;
  if (itemCount > 10) return 5;
  return 10;
};

const schema: MapperxSchema<OrderDto, OrderModel> = {
  shipping: mxc((mapped) =>
    calculateShipping(mapped.total!, mapped.itemCount!)
  ),
};
```

### 2. Create Reusable Validators

```typescript
// ✅ GOOD: Domain-specific validators
const validators = {
  currency: mxs.custom((val) => {
    const num = mxs.number(val);
    if (num < 0) throw new Error("Currency cannot be negative");
    return Math.round(num * 100) / 100;
  }),

  email: mxs.custom((val) => {
    const str = mxs.string(val);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
      throw new Error("Invalid email format");
    }
    return str.toLowerCase();
  }),
};

// Use in schemas
price: { from: "precio", validate: validators.currency }
```

### 3. Handle Errors Gracefully

```typescript
// ✅ GOOD: Use batch for multiple items
const result = mapperx.batch(items, schema);

result.errors.forEach(({ index, error }) => {
  console.error(`Item ${index} failed:`, error.message);
});

// ✅ GOOD: Provide defaults for computed fields
availability: mxc.withDefault((mapped) => {
  if (!mapped.stock) throw new Error("Stock required");
  return mapped.stock > 0 ? "Available" : "Sold Out";
}, "Unknown");
```

---

## 🔍 Error Handling

MapperX-TS provides detailed error messages:

```typescript
try {
  const result = mapperx(dto, schema);
} catch (error) {
  if (isMapperxError(error)) {
    console.error(`Field: ${error.field}`);
    console.error(`Source: ${error.sourceField}`);
    console.error(`Cause: ${error.cause.message}`);
  }
}
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT © Emilio Yankuam Senguana

---

## 🙏 Acknowledgments

Created with ❤️ by Emilio Yankuam Senguana

---

## 📚 Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [API Design Best Practices](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design)

---

**Happy Mapping! 🗺️**
