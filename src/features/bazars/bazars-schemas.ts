import { z } from "zod";
import { isMoney } from "@/lib/money";

const QUANTITY = /^\d{1,7}(\.\d{1,3})?$/;

const itemRow = z.object({
  name: z.string().trim(),
  quantity: z.string().trim(),
  unit: z.string().trim(),
  totalPrice: z.string().trim(),
});

export type ItemRow = z.infer<typeof itemRow>;

/** Rows with nothing typed in are ignored, so a spare empty row never blocks saving. */
export const isBlankRow = (row: ItemRow) => !row.name && !row.quantity && !row.unit && !row.totalPrice;

export const bazarFormSchema = z
  .object({
    date: z.string().min(1, "Pick the day"),
    shopperId: z.string(),
    paidFrom: z.enum(["MESS_FUND", "OWN_POCKET"]),
    mode: z.enum(["total", "items"]),
    totalAmount: z.string().trim(),
    items: z.array(itemRow),
    note: z.string().trim().max(300, "Keep it under 300 characters"),
  })
  .superRefine((v, ctx) => {
    if (v.mode === "total") {
      if (!isMoney(v.totalAmount) || Number(v.totalAmount) <= 0) {
        ctx.addIssue({ code: "custom", path: ["totalAmount"], message: "Enter what the bazar cost" });
      }
      return;
    }
    const filled = v.items.map((row, index) => ({ row, index })).filter(({ row }) => !isBlankRow(row));
    if (filled.length === 0) {
      ctx.addIssue({ code: "custom", path: ["items"], message: "Add at least one item" });
    }
    for (const { row, index } of filled) {
      if (!row.name) ctx.addIssue({ code: "custom", path: ["items", index, "name"], message: "Name it" });
      if (!isMoney(row.totalPrice) || Number(row.totalPrice) <= 0) {
        ctx.addIssue({ code: "custom", path: ["items", index, "totalPrice"], message: "Price" });
      }
      if (row.quantity && !QUANTITY.test(row.quantity)) {
        ctx.addIssue({ code: "custom", path: ["items", index, "quantity"], message: "Number" });
      }
    }
  });

export type BazarFormValues = z.infer<typeof bazarFormSchema>;

export const emptyItem = (): ItemRow => ({ name: "", quantity: "", unit: "", totalPrice: "" });
