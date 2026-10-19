import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // Generic parameters must match the library's declaration even when unused.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Right-align numeric columns (amounts, counts). */
    align?: "left" | "right";
  }
}
