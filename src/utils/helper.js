export const getBase64 = (file) =>
  `data:${file?.mimetype};base64,${file?.buffer.toString("base64")}`;

export const calculateTax = (amount, taxSlab) =>
  taxSlab > 0 ? (amount * taxSlab) / 100 : 0;
