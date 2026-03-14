export type TypeAttributeValueType = "text" | "number" | "boolean";

export type TypeAttributeField = {
  key: string;
  valueType: TypeAttributeValueType;
  value: string;
};

export type RoomSearchType = "capacity" | "location";
