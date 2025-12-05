import { describe, it, expect } from "vitest";
import { mapperx, mxs, mxc, type MapperxSchema } from "../src";

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

const schema: MapperxSchema<OrderDto, OrderModel> = {
  productId: "id_articulo",

  unitPrice: {
    from: "precio_unitario",
    validate: mxs.number,
  },

  quantity: {
    from: "cantidad",
    validate: mxs.number,
  },

  total: mxc((m) => m.unitPrice! * m.quantity!),

  pantalon: mxc((m) =>
    m.quantity! > 10 ? "Muchos pantalones" : "Pocos pantalones"
  ),

  status: {
    from: "estadoDoc",
    transform: (v) => (v === "ACTIVO" ? "Active" : "Cancelled"),
  },
};

describe("MapperX Basic Order Mapping", () => {
  it("should map order correctly", () => {
    const dto: OrderDto = {
      id_articulo: "A001",
      precio_unitario: "10.5",
      cantidad: "15",
      estadoDoc: "ACTIVO",
    };

    const result = mapperx(dto, schema);

    expect(result.productId).toBe("A001");
    expect(result.unitPrice).toBe(10.5);
    expect(result.quantity).toBe(15);
    expect(result.total).toBe(157.5);
    expect(result.pantalon).toBe("Muchos pantalones");
    expect(result.status).toBe("Active");
  });
});

it("should throw error if number is invalid", () => {
  const dto: OrderDto = {
    id_articulo: "A001",
    precio_unitario: "UNVALIDID",
    cantidad: "5",
    estadoDoc: "ACTIVO",
  };

  expect(() => mapperx(dto, schema)).toThrow();
});
