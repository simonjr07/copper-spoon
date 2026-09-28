"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";

import { MenuVisual } from "@/components/menu-visual";
import {
  submitOrderAction,
  type CheckoutActionState,
} from "@/features/checkout/actions";
import type { CheckoutSettings } from "@/features/checkout/checkout";
import {
  getCartSubtotal,
  getConfiguredUnitPrice,
  getLineTotal,
} from "@/features/cart/cart";
import { useCart } from "@/features/cart/cart-provider";
import { formatMoney } from "@/lib/money";

const initialState: CheckoutActionState = {};

export function CheckoutForm({
  settings,
  submissionToken,
}: {
  settings: CheckoutSettings;
  submissionToken: string;
}) {
  const router = useRouter();
  const { clearCart, isHydrated, lines } = useCart();
  const [state, action, pending] = useActionState(submitOrderAction, initialState);
  const initialFulfilment = settings.pickupEnabled ? "PICKUP" : "DELIVERY";
  const [fulfilmentType, setFulfilmentType] = useState<"PICKUP" | "DELIVERY">(
    initialFulfilment,
  );
  const [paymentMethod, setPaymentMethod] = useState(() =>
    getDefaultPayment(initialFulfilment, settings),
  );
  const handledOrder = useRef<string | null>(null);
  const formMessageId = useId();
  const cartPayload = useMemo(
    () =>
      JSON.stringify(
        lines.map((line) => ({
          menuItemId: line.menuItemId,
          optionIds: line.selectedOptions.map((option) => option.optionId),
          quantity: line.quantity,
        })),
      ),
    [lines],
  );

  useEffect(() => {
    if (!state.publicCode || handledOrder.current === state.publicCode) {
      return;
    }

    handledOrder.current = state.publicCode;
    clearCart();
    router.replace(`/order/${state.publicCode}`);
  }, [clearCart, router, state.publicCode]);

  if (!isHydrated) {
    return <CheckoutLoading />;
  }

  if (lines.length === 0) {
    return <EmptyCheckout />;
  }

  const subtotal = getCartSubtotal({ lines });
  const estimatedDeliveryFee =
    fulfilmentType === "DELIVERY" ? settings.deliveryFeeCents : 0;
  const estimatedTotal = subtotal + estimatedDeliveryFee;
  const availablePayments = getAvailablePayments(fulfilmentType, settings);

  function changeFulfilment(next: "PICKUP" | "DELIVERY") {
    setFulfilmentType(next);
    const compatiblePayments = getAvailablePayments(next, settings);
    if (!compatiblePayments.some((payment) => payment.value === paymentMethod)) {
      setPaymentMethod(getDefaultPayment(next, settings));
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
          Secure demo checkout
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">
          Finish your order
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted">
          Final availability and totals are confirmed from the restaurant database when you place the order. No real payment is collected.
        </p>
      </div>

      <form action={action} className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start" noValidate>
        <input name="cart" type="hidden" value={cartPayload} />
        <input name="submissionToken" type="hidden" value={submissionToken} />

        <div className="space-y-6">
          <FormSection eyebrow="Your details" title="Who is collecting or receiving it?">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                autoComplete="name"
                error={state.fieldErrors?.customerName?.[0]}
                label="Name"
                name="customerName"
                required
              />
              <TextField
                autoComplete="email"
                error={state.fieldErrors?.customerEmail?.[0]}
                label="Email"
                name="customerEmail"
                required
                type="email"
              />
              <TextField
                autoComplete="tel"
                className="sm:col-span-2"
                error={state.fieldErrors?.customerPhone?.[0]}
                label="Phone"
                name="customerPhone"
                required
                type="tel"
              />
            </div>
          </FormSection>

          <FormSection eyebrow="Fulfilment" title="How should we get it to you?">
            <div className="grid gap-3 sm:grid-cols-2">
              {settings.pickupEnabled ? (
                <ChoiceCard
                  checked={fulfilmentType === "PICKUP"}
                  description="Collect from Copper Spoon when it is ready."
                  label="Pickup"
                  name="fulfilmentType"
                  onChange={() => changeFulfilment("PICKUP")}
                  value="PICKUP"
                />
              ) : null}
              {settings.deliveryEnabled ? (
                <ChoiceCard
                  checked={fulfilmentType === "DELIVERY"}
                  description={`Delivered for ${formatMoney(settings.deliveryFeeCents, settings.currency)}.`}
                  label="Delivery"
                  name="fulfilmentType"
                  onChange={() => changeFulfilment("DELIVERY")}
                  value="DELIVERY"
                />
              ) : null}
            </div>

            {fulfilmentType === "DELIVERY" ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <TextField
                  autoComplete="address-line1"
                  className="sm:col-span-2"
                  error={state.fieldErrors?.deliveryAddressLine1?.[0]}
                  label="Address line 1"
                  name="deliveryAddressLine1"
                  required
                />
                <TextField
                  autoComplete="address-line2"
                  className="sm:col-span-2"
                  error={state.fieldErrors?.deliveryAddressLine2?.[0]}
                  label="Address line 2 (optional)"
                  name="deliveryAddressLine2"
                />
                <TextField
                  autoComplete="address-level2"
                  error={state.fieldErrors?.deliveryCity?.[0]}
                  label="City"
                  name="deliveryCity"
                  required
                />
                <TextField
                  autoComplete="address-level1"
                  error={state.fieldErrors?.deliveryRegion?.[0]}
                  label="Region/state (optional)"
                  name="deliveryRegion"
                />
                <TextField
                  autoComplete="postal-code"
                  error={state.fieldErrors?.deliveryPostalCode?.[0]}
                  label="Postal code"
                  name="deliveryPostalCode"
                  required
                />
                <TextField
                  autoComplete="country"
                  defaultValue="US"
                  error={state.fieldErrors?.deliveryCountry?.[0]}
                  label="Country code"
                  name="deliveryCountry"
                  required
                />
              </div>
            ) : null}

            {fulfilmentType === "DELIVERY" && settings.minimumDeliveryOrderCents !== null ? (
              <p className="mt-5 text-sm text-muted">
                Delivery minimum: {formatMoney(settings.minimumDeliveryOrderCents, settings.currency)} before the delivery fee.
              </p>
            ) : null}
          </FormSection>

          <FormSection eyebrow="Payment" title="Choose a demo payment method">
            <fieldset>
              <legend className="sr-only">Payment method</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {availablePayments.map((payment) => (
                  <ChoiceCard
                    checked={paymentMethod === payment.value}
                    description={payment.description}
                    key={payment.value}
                    label={payment.label}
                    name="paymentMethod"
                    onChange={() => setPaymentMethod(payment.value)}
                    value={payment.value}
                  />
                ))}
              </div>
            </fieldset>
            <FieldError message={state.fieldErrors?.paymentMethod?.[0]} />
            <p className="mt-4 text-sm leading-6 text-muted">
              Demo card marks the fictional order as simulated. Never enter card numbers or security codes.
            </p>
          </FormSection>
        </div>

        <aside className="rounded-[1.4rem] bg-[#35241d] p-6 text-white shadow-[0_28px_70px_-45px_rgba(45,27,20,0.85)] lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e6ad87]">
            Review order
          </p>
          <ul className="mt-5 space-y-5">
            {lines.map((line) => (
              <li className="flex gap-3 border-b border-white/10 pb-5 last:border-0 last:pb-0" key={line.id}>
                <MenuVisual
                  className="size-16 shrink-0 rounded-xl"
                  imageUrl={line.imageUrl}
                  name={line.name}
                  sizes="64px"
                  slug={line.slug}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{line.quantity} × {line.name}</p>
                  <p className="mt-1 text-xs leading-5 text-white/60">
                    {line.selectedOptions.length > 0
                      ? line.selectedOptions.map((option) => option.optionName).join(", ")
                      : "No additional options"}
                  </p>
                  <p className="mt-1 text-sm text-[#f4ceb5]">
                    {formatMoney(getLineTotal(line), line.currency)}
                    <span className="sr-only">
                      , {formatMoney(getConfiguredUnitPrice(line), line.currency)} each
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 border-t border-white/12 pt-5 text-sm">
            <div className="flex justify-between gap-4 text-white/75">
              <dt>Estimated subtotal</dt>
              <dd>{formatMoney(subtotal, settings.currency)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-white/75">
              <dt>Delivery fee</dt>
              <dd>{formatMoney(estimatedDeliveryFee, settings.currency)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 pt-2 text-lg font-semibold">
              <dt>Estimated total</dt>
              <dd>{formatMoney(estimatedTotal, settings.currency)}</dd>
            </div>
          </dl>

          <FieldError message={state.fieldErrors?.cart?.[0]} inverted />
          <p
            aria-live="polite"
            className="mt-4 min-h-5 text-sm leading-6 text-[#ffd4c7]"
            id={formMessageId}
          >
            {state.message}
          </p>
          <button
            aria-describedby={formMessageId}
            className="mt-4 w-full rounded-full bg-[#f5e8db] px-5 py-3.5 text-sm font-semibold text-ink transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-55"
            disabled={pending || availablePayments.length === 0}
            type="submit"
          >
            {pending ? "Confirming current prices…" : "Place demo order"}
          </button>
          <Link
            className="mt-4 flex justify-center rounded-md text-sm font-semibold text-[#f4ceb5] underline decoration-[#f4ceb5]/30 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
            href="/cart"
          >
            Return to cart
          </Link>
        </aside>
      </form>
    </main>
  );
}

function FormSection({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="rounded-[1.4rem] border border-[#3e2920]/10 bg-[#fffaf2] p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function TextField({
  autoComplete,
  className,
  defaultValue,
  error,
  label,
  name,
  required = false,
  type = "text",
}: {
  autoComplete?: string;
  className?: string;
  defaultValue?: string;
  error?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: "email" | "tel" | "text";
}) {
  const errorId = useId();

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-ink" htmlFor={name}>
        {label}
      </label>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20"
        defaultValue={defaultValue}
        id={name}
        name={name}
        required={required}
        type={type}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function ChoiceCard({
  checked,
  description,
  label,
  name,
  onChange,
  value,
}: {
  checked: boolean;
  description: string;
  label: string;
  name: string;
  onChange: () => void;
  value: string;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-line bg-white p-4 transition has-[:checked]:border-copper has-[:checked]:bg-[#f5e8db]">
      <input
        checked={checked}
        className="mt-1 size-4 accent-[#a24f2c] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-copper"
        name={name}
        onChange={onChange}
        type="radio"
        value={value}
      />
      <span>
        <span className="block font-semibold text-ink">{label}</span>
        <span className="mt-1 block text-sm leading-5 text-muted">{description}</span>
      </span>
    </label>
  );
}

function FieldError({
  id,
  inverted = false,
  message,
}: {
  id?: string;
  inverted?: boolean;
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`mt-2 text-sm ${inverted ? "text-[#ffd4c7]" : "text-red-700"}`}
      id={id}
    >
      {message}
    </p>
  );
}

function getAvailablePayments(
  fulfilmentType: "PICKUP" | "DELIVERY",
  settings: CheckoutSettings,
) {
  const payments: Array<{
    value: "PAY_ON_PICKUP" | "PAY_ON_DELIVERY" | "DEMO_CARD";
    label: string;
    description: string;
  }> = [];

  if (fulfilmentType === "PICKUP" && settings.payOnPickupEnabled) {
    payments.push({
      value: "PAY_ON_PICKUP",
      label: "Pay on pickup",
      description: "Payment remains unpaid until collection.",
    });
  }

  if (fulfilmentType === "DELIVERY" && settings.payOnDeliveryEnabled) {
    payments.push({
      value: "PAY_ON_DELIVERY",
      label: "Pay on delivery",
      description: "Payment remains unpaid until delivery.",
    });
  }

  if (settings.demoCardEnabled) {
    payments.push({
      value: "DEMO_CARD",
      label: "Demo card",
      description: "Simulated payment; no card details required.",
    });
  }

  return payments;
}

function getDefaultPayment(
  fulfilmentType: "PICKUP" | "DELIVERY",
  settings: CheckoutSettings,
) {
  return getAvailablePayments(fulfilmentType, settings)[0]?.value ?? "DEMO_CARD";
}

function CheckoutLoading() {
  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-7xl animate-pulse px-5 py-10 sm:px-8 lg:px-12">
      <div className="h-4 w-32 rounded-full bg-line" />
      <div className="mt-5 h-12 w-72 rounded-xl bg-line/70" />
      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="h-[34rem] rounded-[1.4rem] bg-line/55" />
        <div className="h-96 rounded-[1.4rem] bg-line/70" />
      </div>
      <p className="sr-only">Loading checkout</p>
    </main>
  );
}

function EmptyCheckout() {
  return (
    <main className="mx-auto grid min-h-[65vh] max-w-2xl place-items-center px-5 py-16 text-center sm:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
          Nothing to check out
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">
          Your cart is empty.
        </h1>
        <p className="mx-auto mt-5 max-w-lg leading-7 text-muted">
          Add an available dish before starting checkout.
        </p>
        <Link
          className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
          href="/menu"
        >
          Browse the menu
        </Link>
      </div>
    </main>
  );
}
