import { yankuam, yks, yc, type YankuamSchema } from "./src/index";

interface OrderDto {
  id_articulo: string;
  precio_unitario: string;
  cantidad: string;
  estadoDoc: string;
}

interface OrderModel {
  productId: string;
  unitPrice: number;
  quantity: number;
  total: number;
  pantalon: string;
  status: string;
}

const schema: YankuamSchema<OrderDto, OrderModel> = {
  productId: "id_articulo",

  unitPrice: {
    from: "precio_unitario",
    validate: yks.number,
  },

  quantity: {
    from: "cantidad",
    validate: yks.number,
  },

  // ✅ Computed field simple
  total: yc((mapped) => {
    return mapped.unitPrice! * mapped.quantity!;
  }),

  // ✅ Computed field con lógica
  pantalon: yc((mapped) => {
    console.log("Calculando pantalon para cantidad:", mapped);
    return mapped.quantity! > 10 ? "Muchos pantalones" : "Pocos pantalones";
  }),

  // ✅ Transform normal
  status: {
    from: "estadoDoc",
    transform: (val) => (val === "ACTIVO" ? "Active" : "Cancelled"),
  },
};

// Prueba
const dto = {
  id_articulo: "A001",
  precio_unitario: "10.50",
  cantidad: "15",
  estadoDoc: "ACTIVO",
};

const model = yankuam(dto, schema);
console.log(model);
/*
{
  productId: "A001",
  unitPrice: 10.5,
  quantity: 15,
  total: 157.5,
  pantalon: "Muchos pantalones",
  status: "Active"
}
*/
