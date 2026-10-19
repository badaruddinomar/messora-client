"use client";

import { createContext, useContext, useId, type ComponentProps } from "react";
import { Slot } from "radix-ui";
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { cn } from "@/lib/cn";
import { Label } from "./label";

/**
 * React Hook Form bindings (DESIGN_SYSTEM §6): label above, description below, and the error
 * replaces the description. Usage:
 *
 *   <Form {...form}>
 *     <FormField control={form.control} name="email" render={({ field }) => (
 *       <FormItem>
 *         <FormLabel>Email</FormLabel>
 *         <FormControl><Input {...field} /></FormControl>
 *         <FormMessage />
 *       </FormItem>
 *     )} />
 *   </Form>
 */
export const Form = FormProvider;

const FormFieldContext = createContext<{ name: string } | null>(null);
const FormItemContext = createContext<{ id: string } | null>(null);

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

export function useFormField() {
  const field = useContext(FormFieldContext);
  const item = useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: field?.name });

  if (!field || !item) throw new Error("useFormField must be used inside <FormField> and <FormItem>");

  const fieldState = getFieldState(field.name, formState);
  return {
    name: field.name,
    formItemId: `${item.id}-item`,
    formDescriptionId: `${item.id}-description`,
    formMessageId: `${item.id}-message`,
    ...fieldState,
  };
}

export function FormItem({ className, ...props }: ComponentProps<"div">) {
  const id = useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn("grid gap-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}

export function FormLabel({ className, ...props }: ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField();
  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

export function FormControl(props: ComponentProps<typeof Slot.Root>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={error ? formMessageId : formDescriptionId}
      aria-invalid={!!error}
      {...props}
    />
  );
}

/** Help text under the field. Hidden while the field shows an error. */
export function FormDescription({ className, ...props }: ComponentProps<"p">) {
  const { error, formDescriptionId } = useFormField();
  if (error) return null;
  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

export function FormMessage({ className, children, ...props }: ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message ?? "") : children;
  if (!body) return null;
  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn(
        "animate-in text-xs text-destructive duration-150 fade-in-0 slide-in-from-top-1",
        className,
      )}
      {...props}
    >
      {body}
    </p>
  );
}
