import { mapperx, mxs, mxc, type MapperxSchema } from "./src/index";

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
  test: string;
}

const orderSchema: MapperxSchema<OrderDto, OrderModel> = {
  productId: "id_articulo",

  unitPrice: {
    from: "precio_unitario",
    validate: mxs.number,
  },

  quantity: {
    from: "cantidad",
    validate: mxs.number,
  },

  //  Computed field básico
  total: mxc((mapped, src) => {
    console.log("Calculating total...", mapped);
    console.log("Calculating src...", src);
    return mapped.unitPrice! * mapped.quantity!;
  }),

  // Computed field con lógica
  pantalon: mxc((mapped) => {
    return mapped.quantity! > 10 ? "Muchos pantalones" : "Pocos pantalones";
  }),

  //  Transform normal
  status: {
    from: "estadoDoc",
    transform: (val) => (val === "ACTIVO" ? "Active" : "Cancelled"),
  },
  test: mxc((_, src) => {
    return `Test field with productId: ${src.id_articulo}`;
  }),
};

// ✅ Test real
const dto: OrderDto = {
  id_articulo: "A001",
  precio_unitario: "10.50",
  cantidad: "15",
  estadoDoc: "ACTIVO",
};

const model = mapperx(dto, orderSchema);

console.log(model);
