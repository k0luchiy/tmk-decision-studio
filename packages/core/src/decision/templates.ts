/**
 * Verdict text templates (`docs/03_estimation_model.md` §6, `docs/01_vision.md` §4).
 *
 * The verdict text is **never generated**: each function only substitutes
 * already-computed numbers into a fixed sentence. Formatting is fixed as well:
 *
 * - money — millions of roubles with exactly one decimal, e.g. `6,2 млн ₽`;
 * - duration — whole weeks, e.g. `14 нед.`;
 * - month — `М<n>`, e.g. `М6` (or `не достигается` when `null`).
 *
 * Because every literal digit in the output comes from the input, a guard test
 * can assert that no stray constant leaked into the sentences.
 */

/** Scenario numbers a template needs. Structural subset of `VerdictInput`. */
export interface TemplateScenario {
  p50Rub: number;
  tcoRub: number;
  weeks: number;
  breakevenMonth: number | null;
}

/** All three scenarios a template may reference. */
export interface TemplateInput {
  inhouse: TemplateScenario;
  contractor: TemplateScenario;
  hybrid: TemplateScenario;
}

/** Formats roubles as millions with one decimal, comma-separated (`6,2`). */
export function formatMoneyMln(rub: number): string {
  return (rub / 1_000_000).toFixed(1).replace('.', ',');
}

/** Formats a duration as whole weeks (`14`). */
export function formatWeeks(weeks: number): string {
  return String(Math.round(weeks));
}

/** Formats a break-even month as `М<n>`, or a word when it never happens. */
export function formatMonth(month: number | null): string {
  return month === null ? 'не достигается' : `М${month}`;
}

/** Parity: the TCO gap is inside the risk band, qualitative axes decide. */
export function parity_v1(input: TemplateInput): string {
  return (
    `Паритет сценариев: TCO различается в пределах диапазона ` +
    `(${formatMoneyMln(input.inhouse.tcoRub)} млн ₽ против ` +
    `${formatMoneyMln(input.contractor.tcoRub)} млн ₽); решают качественные оси — ` +
    `передаваемость знаний, срок, ИБ.`
  );
}

/** Hybrid: the contractor is faster on the critical path and TCO stays close. */
export function hybrid_v1(input: TemplateInput): string {
  return (
    `Рекомендуется гибрид: подрядчик быстрее ` +
    `(${formatWeeks(input.contractor.weeks)} нед. против ` +
    `${formatWeeks(input.inhouse.weeks)} нед. внутри), а TCO гибрида ` +
    `${formatMoneyMln(input.hybrid.tcoRub)} млн ₽ не выше лучшего из сценариев.`
  );
}

/** In-house wins on TCO. */
export function inhouse_v1(input: TemplateInput): string {
  return (
    `Выгоднее выполнить внутри: TCO ${formatMoneyMln(input.inhouse.tcoRub)} млн ₽ против ` +
    `${formatMoneyMln(input.contractor.tcoRub)} млн ₽ у подрядчика, срок ` +
    `${formatWeeks(input.inhouse.weeks)} нед. против ` +
    `${formatWeeks(input.contractor.weeks)} нед.`
  );
}

/** Contractor wins on TCO. */
export function contractor_v1(input: TemplateInput): string {
  return (
    `Выгоднее отдать подрядчику: TCO ${formatMoneyMln(input.contractor.tcoRub)} млн ₽ против ` +
    `${formatMoneyMln(input.inhouse.tcoRub)} млн ₽ внутри, срок ` +
    `${formatWeeks(input.contractor.weeks)} нед. против ` +
    `${formatWeeks(input.inhouse.weeks)} нед.`
  );
}

/** Conditional: contractor is cheaper up front but dearer on the horizon. */
export function conditional_v1(input: TemplateInput): string {
  return (
    `Подрядчик дешевле на старте ` +
    `(${formatMoneyMln(input.contractor.p50Rub)} млн ₽ против ` +
    `${formatMoneyMln(input.inhouse.p50Rub)} млн ₽), но дороже на горизонте ` +
    `(${formatMoneyMln(input.contractor.tcoRub)} млн ₽ против ` +
    `${formatMoneyMln(input.inhouse.tcoRub)} млн ₽); точка безубыточности — ` +
    `${formatMonth(input.contractor.breakevenMonth ?? input.inhouse.breakevenMonth)}; ` +
    `после неё выгоднее внутри.`
  );
}
