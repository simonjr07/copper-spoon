"use client";

import { useMemo, useState } from "react";

import {
  MAX_CART_QUANTITY,
  buildCartLine,
  getConfiguredUnitPrice,
  getSelectedOptions,
  validateItemConfiguration,
  type OptionSelections,
} from "@/features/cart/cart";
import { useCart } from "@/features/cart/cart-provider";
import type { PublicMenuItemDetail } from "@/features/menu/catalog";
import { formatMoney, formatPriceAdjustment } from "@/lib/money";

export function ItemConfigurator({ item }: { item: PublicMenuItemDetail }) {
  const { addLine } = useCart();
  const [selections, setSelections] = useState<OptionSelections>({});
  const [quantity, setQuantity] = useState(1);
  const [announcement, setAnnouncement] = useState("");
  const errors = useMemo(
    () => validateItemConfiguration(item, selections),
    [item, selections],
  );
  const selectedOptions = useMemo(
    () => getSelectedOptions(item, selections),
    [item, selections],
  );
  const configuredUnitPrice = getConfiguredUnitPrice({
    basePriceCents: item.priceCents,
    selectedOptions,
  });
  const canAdd = Object.keys(errors).length === 0;

  function selectSingle(groupId: string, optionId: string | null) {
    setSelections((current) => ({
      ...current,
      [groupId]: optionId ? [optionId] : [],
    }));
    setAnnouncement("");
  }

  function toggleMultiple(groupId: string, optionId: string, maxSelections: number) {
    setSelections((current) => {
      const selected = current[groupId] ?? [];
      const next = selected.includes(optionId)
        ? selected.filter((id) => id !== optionId)
        : selected.length < maxSelections
          ? [...selected, optionId]
          : selected;

      return { ...current, [groupId]: next };
    });
    setAnnouncement("");
  }

  function addConfiguredItem() {
    const result = buildCartLine(item, selections, quantity);

    if (!result.ok) {
      setAnnouncement("Complete the required choices before adding this item.");
      return;
    }

    addLine(result.line);
    setAnnouncement(
      `${quantity} ${quantity === 1 ? "item" : "items"} added to your cart.`,
    );
  }

  return (
    <section className="mt-10 border-t border-[#3e2920]/10 pt-8" aria-labelledby="configure-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
        Make it yours
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-ink" id="configure-heading">
        Choose your options
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Required choices are marked. Prices shown here are estimates and will be rechecked at checkout.
      </p>

      {item.optionGroups.length > 0 ? (
        <div className="mt-6 space-y-5">
          {item.optionGroups.map((group) => {
            const selected = selections[group.id] ?? [];
            const error = errors[group.id];
            const descriptionId = `group-${group.id}-description`;
            const errorId = `group-${group.id}-error`;

            return (
              <fieldset
                aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ""}`}
                aria-invalid={Boolean(error)}
                className="rounded-2xl border border-[#3e2920]/10 bg-[#fffaf2] p-5 disabled:opacity-65"
                disabled={!item.isAvailable}
                key={group.id}
              >
                <legend className="w-full px-0">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-ink">{group.name}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-copper">
                      {getSelectionLabel(group)}
                    </span>
                  </span>
                </legend>
                <p className="mt-1 text-xs text-muted" id={descriptionId}>
                  {group.selectionType === "SINGLE"
                    ? "Select one choice."
                    : `Select between ${group.minSelections} and ${group.maxSelections}.`}
                </p>

                <div className="mt-4 space-y-2">
                  {group.selectionType === "SINGLE" && group.minSelections === 0 ? (
                    <OptionControl
                      checked={selected.length === 0}
                      inputType="radio"
                      label="No selection"
                      name={`group-${group.id}`}
                      onChange={() => selectSingle(group.id, null)}
                      priceLabel="Included"
                      value="none"
                    />
                  ) : null}

                  {group.options.map((option) => {
                    const checked = selected.includes(option.id);
                    const reachedMaximum =
                      group.selectionType === "MULTIPLE" &&
                      selected.length >= group.maxSelections &&
                      !checked;

                    return (
                      <OptionControl
                        checked={checked}
                        disabled={reachedMaximum}
                        inputType={
                          group.selectionType === "SINGLE" ? "radio" : "checkbox"
                        }
                        key={option.id}
                        label={option.name}
                        name={`group-${group.id}`}
                        onChange={() =>
                          group.selectionType === "SINGLE"
                            ? selectSingle(group.id, option.id)
                            : toggleMultiple(
                                group.id,
                                option.id,
                                group.maxSelections,
                              )
                        }
                        priceLabel={formatPriceAdjustment(
                          option.priceAdjustmentCents,
                          item.currency,
                        )}
                        value={option.id}
                      />
                    );
                  })}
                </div>

                {error ? (
                  <p className="mt-3 text-sm font-medium text-[#9b3e30]" id={errorId} role="alert">
                    {error}
                  </p>
                ) : null}
              </fieldset>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-[#3e2920]/10 bg-[#fffaf2] p-5 text-sm text-muted">
          No additional choices are needed for this dish.
        </p>
      )}

      <div className="mt-6 rounded-2xl bg-[#35241d] p-5 text-white">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e6ad87]">
              Configured price
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {formatMoney(configuredUnitPrice, item.currency)}
              <span className="ml-1 text-sm font-normal text-white/65">each</span>
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
              Quantity
            </p>
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/8 p-1">
              <button
                aria-label={`Decrease quantity of ${item.name}`}
                className="grid size-10 place-items-center rounded-full text-xl transition hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-35"
                disabled={quantity <= 1 || !item.isAvailable}
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                type="button"
              >
                −
              </button>
              <output
                aria-live="polite"
                aria-label={`Quantity ${quantity}`}
                className="min-w-10 text-center font-semibold"
              >
                {quantity}
              </output>
              <button
                aria-label={`Increase quantity of ${item.name}`}
                className="grid size-10 place-items-center rounded-full text-xl transition hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-35"
                disabled={quantity >= MAX_CART_QUANTITY || !item.isAvailable}
                onClick={() =>
                  setQuantity((current) =>
                    Math.min(MAX_CART_QUANTITY, current + 1),
                  )
                }
                type="button"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          className="mt-5 w-full rounded-full bg-[#f5e8db] px-5 py-3.5 text-sm font-semibold text-ink transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/45"
          disabled={!canAdd}
          onClick={addConfiguredItem}
          type="button"
        >
          {item.isAvailable
            ? `Add to cart · ${formatMoney(configuredUnitPrice * quantity, item.currency)}`
            : "Currently sold out"}
        </button>
        <p className="mt-3 min-h-5 text-center text-sm text-[#f4ceb5]" aria-live="polite">
          {announcement}
        </p>
      </div>
    </section>
  );
}

function OptionControl({
  checked,
  disabled = false,
  inputType,
  label,
  name,
  onChange,
  priceLabel,
  value,
}: {
  checked: boolean;
  disabled?: boolean;
  inputType: "checkbox" | "radio";
  label: string;
  name: string;
  onChange: () => void;
  priceLabel: string;
  value: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-transparent px-3 py-3 transition hover:border-[#3e2920]/10 hover:bg-[#f7f1e8] has-[:checked]:border-copper/35 has-[:checked]:bg-[#f5e8db] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45">
      <span className="flex items-center gap-3 text-sm font-medium text-ink">
        <input
          checked={checked}
          className="size-4 accent-[#a24f2c] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-copper"
          disabled={disabled}
          name={name}
          onChange={onChange}
          type={inputType}
          value={value}
        />
        {label}
      </span>
      <span className="text-sm font-semibold text-muted">{priceLabel}</span>
    </label>
  );
}

function getSelectionLabel(group: {
  selectionType: "SINGLE" | "MULTIPLE";
  minSelections: number;
  maxSelections: number;
}) {
  if (group.minSelections === 0) {
    return group.maxSelections === 1
      ? "Optional · up to 1"
      : `Optional · up to ${group.maxSelections}`;
  }

  if (group.selectionType === "SINGLE") {
    return "Required · choose 1";
  }

  return `Required · ${group.minSelections}–${group.maxSelections}`;
}
