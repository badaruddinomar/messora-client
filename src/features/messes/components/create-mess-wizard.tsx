"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, CircleAlert, Plus, Trash2, Users, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { messRoutes, ROUTES } from "@/constants/routes";
import { applyFieldErrors, getErrorMessage, type RequestError } from "@/lib/api-error";
import { cn } from "@/lib/cn";
import { useCreateMessMutation } from "../messes-api";
import { createMessSchema, DEFAULT_MEAL_SLOTS, MEAL_WEIGHTS, type CreateMessValues } from "../messes-schemas";
import { describeBillingMonth, formatStartDay, GENDER_LABELS } from "../utils";

const STEPS: { title: string; description: string; fields: FieldPath<CreateMessValues>[] }[] = [
  { title: "Your mess", description: "The basics members will see.", fields: ["name", "address", "gender"] },
  {
    title: "Billing month",
    description: "When each month's bill starts and ends.",
    fields: ["monthStartDay"],
  },
  { title: "Meals", description: "The meals your mess serves each day.", fields: ["mealSlots"] },
];

const START_DAYS = Array.from({ length: 28 }, (_, i) => String(i + 1));

export function CreateMessWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [createMess, { isLoading }] = useCreateMessMutation();
  const [formError, setFormError] = useState<RequestError>();

  const form = useForm<CreateMessValues>({
    resolver: zodResolver(createMessSchema),
    defaultValues: {
      name: "",
      address: "",
      gender: "MALE",
      monthStartDay: "1",
      mealSlots: DEFAULT_MEAL_SLOTS,
    },
  });

  const next = async () => {
    if (await form.trigger(STEPS[step].fields, { shouldFocus: true })) setStep((s) => s + 1);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    const res = await createMess({
      name: values.name,
      address: values.address || undefined,
      gender: values.gender,
      monthStartDay: Number(values.monthStartDay),
      mealSlots: values.mealSlots.map((s) => ({
        name: s.name,
        weight: Number(s.weight),
        cutoffTime: s.cutoffTime || null,
      })),
    });
    if (res.error) {
      if (!applyFieldErrors(res.error, form.setError)) setFormError(res.error);
      else setStep(0);
      return;
    }
    toast.success(`${res.data.name} is ready`, { description: "Next, invite your members." });
    router.push(messRoutes(res.data.slug).members);
  });

  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-8">
      <div className="space-y-4">
        <Button variant="link" asChild className="text-muted-foreground hover:text-foreground">
          <Link href={ROUTES.messes}>
            <ArrowLeft />
            My messes
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create a mess</h1>
          <p className="text-sm text-muted-foreground">You can change all of this later in settings.</p>
        </div>
        <Stepper current={step} />
      </div>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isLast) void onSubmit();
            else void next();
          }}
          noValidate
        >
          <Card className="px-5 sm:px-6">
            <div>
              <h2 className="font-semibold">{STEPS[step].title}</h2>
              <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
            </div>

            {formError && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{getErrorMessage(formError)}</AlertDescription>
              </Alert>
            )}

            {/* Keyed by step so each step animates in. */}
            <div key={step} className="grid animate-in gap-5 duration-200 fade-in-0 slide-in-from-right-2">
              {step === 0 && <DetailsStep form={form} />}
              {step === 1 && <BillingStep form={form} />}
              {step === 2 && <MealsStep form={form} />}
            </div>

            <div className="flex items-center justify-between gap-3 border-t pt-5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
                className={cn(step === 0 && "invisible")}
              >
                Back
              </Button>
              <Button type="submit" loading={isLoading}>
                {isLast ? "Create mess" : "Continue"}
              </Button>
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Steps">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={s.title}
            className="flex flex-1 items-center gap-2"
            aria-current={active ? "step" : undefined}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors duration-200",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary",
                !done && !active && "text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden truncate text-sm sm:block",
                active ? "font-medium" : "text-muted-foreground",
              )}
            >
              {s.title}
            </span>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px flex-1 transition-colors duration-200",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

type StepProps = { form: ReturnType<typeof useForm<CreateMessValues>> };

function DetailsStep({ form }: StepProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mess name</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Green House Mess" autoFocus {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Address <span className="font-normal text-muted-foreground">(optional)</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="House, road, area" autoComplete="street-address" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="gender"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type of mess</FormLabel>
            <FormControl>
              <RadioGroup value={field.value} onValueChange={field.onChange} className="sm:grid-cols-3">
                <RadioCard value="MALE" title={GENDER_LABELS.MALE} icon={<UserRound className="size-4" />} />
                <RadioCard
                  value="FEMALE"
                  title={GENDER_LABELS.FEMALE}
                  icon={<UserRound className="size-4" />}
                />
                <RadioCard value="MIXED" title={GENDER_LABELS.MIXED} icon={<Users className="size-4" />} />
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

function BillingStep({ form }: StepProps) {
  const startDay = Number(useWatch({ control: form.control, name: "monthStartDay" }));
  return (
    <FormField
      control={form.control}
      name="monthStartDay"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Months start on the</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="sm:w-64">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="max-h-72">
              {START_DAYS.map((d) => (
                <SelectItem key={d} value={d}>
                  {formatStartDay(Number(d))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            {describeBillingMonth(startDay)}. Most messes start on the 1st; pick another day if your rent
            cycle starts later.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function MealsStep({ form }: StepProps) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "mealSlots" });
  const rootError =
    form.formState.errors.mealSlots?.root?.message ?? form.formState.errors.mealSlots?.message;

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        The <span className="font-medium text-foreground">weight</span> is how much a meal counts toward the
        meal rate: a light breakfast is often half a meal. Members can change their meals until the{" "}
        <span className="font-medium text-foreground">cutoff time</span>.
      </p>

      <div className="hidden grid-cols-[1fr_7rem_8rem_2.5rem] gap-3 px-1 text-xs font-medium text-muted-foreground sm:grid">
        <span>Meal</span>
        <span>Counts as</span>
        <span>Cutoff</span>
      </div>

      <ul className="grid gap-3">
        {fields.map((f, index) => (
          <li
            key={f.id}
            className="grid animate-in grid-cols-[1fr_2.5rem] gap-3 rounded-lg border bg-muted/30 p-3 duration-200 fade-in-0 sm:grid-cols-[1fr_7rem_8rem_2.5rem] sm:border-0 sm:bg-transparent sm:p-0"
          >
            <FormField
              control={form.control}
              name={`mealSlots.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Meal name</FormLabel>
                  <FormControl>
                    <Input placeholder="Meal name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive sm:order-last"
              aria-label={`Remove ${form.getValues(`mealSlots.${index}.name`) || "meal"}`}
              disabled={fields.length === 1}
              onClick={() => remove(index)}
            >
              <Trash2 />
            </Button>
            <div className="col-span-2 grid grid-cols-2 gap-3 sm:col-span-1 sm:contents">
              <FormField
                control={form.control}
                name={`mealSlots.${index}.weight`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground sm:sr-only">Counts as</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MEAL_WEIGHTS.map((w) => (
                          <SelectItem key={w} value={w}>
                            {w} {w === "1" ? "meal" : "meals"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`mealSlots.${index}.cutoffTime`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground sm:sr-only">Cutoff</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </li>
        ))}
      </ul>

      {rootError && <p className="text-xs text-destructive">{rootError}</p>}

      <Button
        type="button"
        variant="outline"
        className="justify-self-start"
        disabled={fields.length >= 6}
        onClick={() => append({ name: "", weight: "1", cutoffTime: "" })}
      >
        <Plus />
        Add a meal
      </Button>
    </div>
  );
}
