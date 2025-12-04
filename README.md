# 🗺️ MapperX-TS

A lightweight, type-safe data mapper library for TypeScript. Transform API responses into clean domain models with validation, computed fields, and zero dependencies.

**A powerful data mapping solution by Emilio Yankuam Senguana**

---

## ✨ Features

- 🎯 **Type-safe**: Full TypeScript support with type inference
- 🚀 **Lightweight**: Zero dependencies, ~5KB minified
- 🔄 **Flexible Mapping**: Simple field mapping to complex transformations
- ✅ **Built-in Validators**: String, number, boolean, date, array, enum, and custom
- 🧮 **Computed Fields**: Calculate derived properties from mapped data
- 📦 **Batch Processing**: Map arrays with error handling
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
import { mapperx, mx, type MapperXSchema } from "mapperx-ts";

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
const userSchema: MapperXSchema<UserDto, User> = {
  id: {
    from: "id",
    transform: (val) => `USER_${val}`,
  },
  name: "full_name",  // Simple field mapping
  email: "email_address",
  createdAt: {
    from: "created_at",
    validate: mx.date,
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

## 📖 Core Concepts

### Simple Field Mapping

Map fields directly by name:

```typescript
const schema: MapperXSchema<ApiType, UiType> = {
  name: "full_name",      // UiType.name ← ApiType.full_name
  email: "email_address", // UiType.email ← ApiType.email_address
};
```

### Advanced Field Mapping

Use objects for validation and transformation:

```typescript
const schema: MapperXSchema<OrderDto, Order> = {
  price: {
    from: "precio_unitario",
    validate: mx.number,            // Validate and convert to number
    transform: (val) => val * 1.15, // Apply 15% tax
    default: 0,                     // Default if undefined
    required: true,                 // Throw if missing (default)
    nullable: false,                // Throw if null (default)
  },
};
```

### Computed Fields

Add calculated properties that don't exist in the source:

```typescript
import { mx, type MapperXSchema } from "mapperx-ts";

interface OrderModel {
  unitPrice: number;
  quantity: number;
  total: number;        // ← Computed
  tax: number;          // ← Computed
  grandTotal: number;   // ← Computed
}

const schema: MapperXSchema<OrderDto, OrderModel> = {
  unitPrice: { from: "precio", validate: mx.number },
  quantity: { from: "cantidad", validate: mx.number },
  
  // Computed fields have access to already-mapped fields
  total: mx.computed((mapped) => {
    return mapped.unitPrice! * mapped.quantity!;
  }),
  
  tax: mx.computed((mapped) => {
    return mapped.total! * 0.15;
  }),
  
  grandTotal: mx.computed((mapped) => {
    return mapped.total! + mapped.tax!;
  }),
};
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

### Validators (`mx`)

Built-in validators for common types:

```typescript
import { mx } from "mapperx-ts";

// String validator
mx.string(value)      // Converts to string or throws

// Number validator
mx.number(value)      // Converts to number or throws

// Boolean validator
mx.boolean(value)     // Converts to boolean (handles "true", "1", etc.)

// Date validator
mx.date(value)        // Converts to Date object or throws

// Array validator
mx.array(itemValidator)(value)  // Validates each array item

// Optional validator
mx.optional(validator)(value)   // Returns undefined if null/undefined

// Nullable validator
mx.nullable(validator)(value)   // Returns null if null

// Enum validator
mx.enum("active", "inactive")(value)  // Must be one of the values

// Custom validator
mx.custom((val) => {
  if (typeof val !== "string") throw new Error("Must be string");
  return val.toUpperCase();
})
```

### Computed Fields (`mx.computed`)

Create calculated fields:

```typescript
import { mx } from "mapperx-ts";

// Simple computed field
fieldName: mx.computed((mapped, src) => {
  // mapped: Partial<UiType> - already mapped fields
  // src: ApiType - original source object
  return mapped.price! * mapped.quantity!;
})

// Computed field with default value
fieldName: mx.computed(
  (mapped, src) => {
    return mapped.value! > 100 ? "High" : "Low";
  },
  { default: "Unknown" }  // Used if computation throws error
)
```

**Aliases**: `mx.computed`, `mx.field`

---

## 💼 Enterprise Examples

### E-commerce Order Processing

```typescript
import { mapperx, mx, type MapperXSchema } from "mapperx-ts";

interface OrderDto {
  id: number;
  items: string;  // JSON string
  subtotal: string;
  customer_id: number;
  discount_code?: string;
}

interface OrderModel {
  orderId: string;
  items: Array<{ sku: string; qty: number }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  customerId: string;
  isEligibleForFreeShipping: boolean;
  priority: "high" | "normal" | "low";
}

const orderSchema: MapperXSchema<OrderDto, OrderModel> = {
  orderId: {
    from: "id",
    transform: (id) => `ORD-${String(id).padStart(6, "0")}`,
  },
  
  items: {
    from: "items",
    validate: mx.custom((val) => {
      const parsed = JSON.parse(String(val));
      if (!Array.isArray(parsed)) throw new Error("Items must be array");
      return parsed;
    }),
  },
  
  subtotal: {
    from: "subtotal",
    validate: mx.number,
  },
  
  customerId: {
    from: "customer_id",
    transform: (id) => `CUST-${id}`,
  },
  
  // Calculate discount based on code
  discount: mx.computed((mapped, src) => {
    const code = src.discount_code;
    if (!code) return 0;
    if (code === "SAVE10") return mapped.subtotal! * 0.10;
    if (code === "SAVE20") return mapped.subtotal! * 0.20;
    return 0;
  }),
  
  // Calculate tax (after discount)
  tax: mx.computed((mapped) => {
    const taxableAmount = mapped.subtotal! - mapped.discount!;
    return taxableAmount * 0.15;
  }),
  
  // Total amount
  total: mx.computed((mapped) => {
    return mapped.subtotal! - mapped.discount! + mapped.tax!;
  }),
  
  // Business rule: free shipping over $50
  isEligibleForFreeShipping: mx.computed((mapped) => {
    return mapped.total! >= 50;
  }),
  
  // Priority based on value and item count
  priority: mx.computed((mapped) => {
    const itemCount = mapped.items!.reduce((sum, item) => sum + item.qty, 0);
    if (mapped.total! > 500 || itemCount > 20) return "high";
    if (mapped.total! < 50) return "low";
    return "normal";
  }),
};

const dto = {
  id: 123,
  items: '[{"sku":"A001","qty":3},{"sku":"B002","qty":1}]',
  subtotal: "75.50",
  customer_id: 456,
  discount_code: "SAVE10",
};

const order = mapperx(dto, orderSchema);
```

### Data Enrichment

```typescript
interface ProductDto {
  id: string;
  price: number;
  category_id: number;
}

const categoryMap: Record<number, string> = {
  1: "Electronics",
  2: "Clothing",
  3: "Food",
};

interface ProductModel {
  id: string;
  price: number;
  categoryId: number;
  categoryName: string;      // ← Enriched from external data
  priceRange: string;        // ← Calculated
  formattedPrice: string;    // ← Formatted
}

const productSchema: MapperXSchema<ProductDto, ProductModel> = {
  id: "id",
  price: { from: "price", validate: mx.number },
  categoryId: { from: "category_id", validate: mx.number },
  
  // Enrich with external data
  categoryName: mx.computed((mapped) => {
    return categoryMap[mapped.categoryId!] || "Unknown";
  }),
  
  // Classify by price range
  priceRange: mx.computed((mapped) => {
    const price = mapped.price!;
    if (price < 20) return "Budget";
    if (price < 100) return "Standard";
    return "Premium";
  }),
  
  // Format for display
  formattedPrice: mx.computed((mapped) => {
    return `$${mapped.price!.toFixed(2)}`;
  }),
};
```

### Nested Data Flattening

```typescript
interface ComplexDto {
  order: {
    id: number;
    items: Array<{ sku: string; qty: number; price: number }>;
  };
  customer: {
    name: string;
    email: string;
  };
}

interface FlatModel {
  orderId: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  totalValue: number;
  summary: string;
}

const flatSchema: MapperXSchema<ComplexDto, FlatModel> = {
  orderId: {
    from: "order" as any,
    transform: (val: any) => `ORD-${val.id}`,
  },
  customerName: {
    from: "customer" as any,
    transform: (val: any) => val.name,
  },
  customerEmail: {
    from: "customer" as any,
    transform: (val: any) => val.email,
  },
  
  itemCount: mx.computed((mapped, src) => {
    return src.order.items.length;
  }),
  
  totalValue: mx.computed((mapped, src) => {
    return src.order.items.reduce(
      (sum: number, item: any) => sum + (item.qty * item.price),
      0
    );
  }),
  
  summary: mx.computed((mapped) => {
    return `Order ${mapped.orderId}: ${mapped.itemCount} items, $${mapped.totalValue?.toFixed(2)}`;
  }),
};
```

### Batch Processing with Error Handling

```typescript
import { mapperx } from "mapperx-ts";

const apiData = [
  { id: 1, name: "Alice", age: "30" },
  { id: 2, name: "Bob", age: "invalid" },  // ← Will error
  { id: 3, name: "Charlie", age: "25" },
];

const result = mapperx.batch(apiData, userSchema);

console.log(result.data);     // Successfully mapped items
console.log(result.errors);   // Failed items with error details

// Handle errors
result.errors.forEach(({ index, item, error }) => {
  console.error(`Failed to map item at index ${index}:`, error.message);
  console.error("Original item:", item);
});
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

const schema: MapperXSchema<OrderDto, OrderModel> = {
  // ... other fields
  shipping: mx.computed((mapped) => calculateShipping(mapped.total!, mapped.itemCount!)),
};
```

### 2. Create Reusable Validators

```typescript
// ✅ GOOD: Domain-specific validators
const validators = {
  currency: mx.custom((val) => {
    const num = mx.number(val);
    if (num < 0) throw new Error("Currency cannot be negative");
    return Math.round(num * 100) / 100;
  }),
  
  email: mx.custom((val) => {
    const str = mx.string(val);
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
// ✅ GOOD: Use skipInvalid for non-critical fields
const result = mapperx(dto, schema, { skipInvalid: true });

// ✅ GOOD: Provide defaults for computed fields
availability: mx.computed(
  (mapped) => {
    if (!mapped.stock) throw new Error("Stock required");
    return mapped.stock > 0 ? "Available" : "Sold Out";
  },
  { default: "Unknown" }
);
```

### 4. Use Strict Mode in Development

```typescript
// ✅ GOOD: Catch unmapped fields during development
const result = mapperx(dto, schema, { strict: true });
// Warns: "Extra fields: unused_field_1, unused_field_2"
```

---

## 🔍 Error Handling

MapperX-TS provides detailed error messages:

```typescript
try {
  const result = mapperx(dto, schema);
} catch (error) {
  if (error instanceof MapperXError) {
    console.error(`Field: ${error.field}`);           // UI field name
    console.error(`Source: ${error.sourceField}`);    // API field name
    console.error(`Cause: ${error.cause.message}`);   // Original error
  }
}
```

Example error:
```
MapperXError: Mapping error at "age" (from "user_age"): Cannot convert "invalid" to number
```

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