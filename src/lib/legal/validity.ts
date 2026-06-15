// ============================================================
// Possession-route validity checks — REVIEW-ONLY drafting aids.
//
// These functions surface *warnings* a landlord should consider before serving
// a draft notice. They are computed from live tenancy / compliance data so the
// flags are honest, but they are NOT legal advice and NOT a guarantee of
// validity. A passing check never means a notice is valid — only a qualified
// solicitor can confirm that. The wizard records a snapshot of these checks on
// the case (validity_snapshot jsonb) for the review trail.
//
// Section 21 (no-fault) has well-known prerequisites that, if unmet, can make a
// notice invalid: deposit protected + prescribed information given, EPC / gas
// safety / How-to-Rent served, and (where required) a valid property licence.
// Section 8 (fault-based) is ground-dependent and does not share those gates,
// but we still surface deposit / licence context.
// ============================================================

import type { NoticeRoute } from './grounds'

export type CheckStatus = 'pass' | 'warn' | 'unknown'

export interface ValidityCheck {
  id: string
  label: string
  status: CheckStatus
  detail: string
}

export interface ValiditySnapshot {
  route: NoticeRoute
  checkedAt: string
  checks: ValidityCheck[]
  /** True when no check is a hard 'warn'. Review-only — not a validity guarantee. */
  allClear: boolean
}

/** Minimal shape of the signals the checks read (all from live data). */
export interface ValidityInputs {
  route: NoticeRoute
  depositAmount: number | null
  depositScheme: string | null
  depositProtectedAt: string | null
  /** Whether an EPC certificate is on record + in date for the property. */
  epcValid: boolean | null
  /** Whether a gas safety certificate is on record + in date for the property. */
  gasValid: boolean | null
  /** Whether the user has confirmed a How-to-Rent guide was served. */
  howToRentServed: boolean | null
  /** Whether the property has a valid (non-expired) HMO / property licence on record. */
  licenceValid: boolean | null
  /** Whether the property requires a licence at all (HMO licence row exists). */
  licenceRequired: boolean
}

function check(id: string, label: string, status: CheckStatus, detail: string): ValidityCheck {
  return { id, label, status, detail }
}

/**
 * Compute the prerequisite checks for the chosen route.
 * Section 21 surfaces the full set; Section 8 surfaces the deposit + licence
 * context only (those grounds do not depend on the S21 gates).
 */
export function computeValidity(input: ValidityInputs): ValiditySnapshot {
  const checks: ValidityCheck[] = []
  const isS21 = input.route === 'section_21'

  // Deposit protection (both routes — context for S8, gating for S21).
  if (input.depositAmount && input.depositAmount > 0) {
    if (input.depositProtectedAt && input.depositScheme) {
      checks.push(
        check('deposit', 'Deposit protected', 'pass', `Protected in ${input.depositScheme}.`)
      )
    } else if (input.depositScheme) {
      checks.push(
        check(
          'deposit',
          'Deposit protection',
          isS21 ? 'warn' : 'unknown',
          `Scheme recorded (${input.depositScheme}) but no protection date on file.`
        )
      )
    } else {
      checks.push(
        check(
          'deposit',
          'Deposit protection',
          'warn',
          'A deposit is held but no protection scheme is recorded. Section 21 may be invalid if unprotected.'
        )
      )
    }

    // Prescribed information (S21 only).
    if (isS21) {
      checks.push(
        check(
          'prescribed_info',
          'Prescribed information',
          input.depositProtectedAt ? 'unknown' : 'warn',
          'Confirm the prescribed information was given to the tenant within the statutory window.'
        )
      )
    }
  } else {
    checks.push(check('deposit', 'Deposit protection', 'pass', 'No deposit held — protection not required.'))
  }

  if (isS21) {
    // EPC.
    checks.push(
      input.epcValid == null
        ? check('epc', 'EPC served', 'unknown', 'No EPC certificate found on record for this property.')
        : input.epcValid
          ? check('epc', 'EPC served', 'pass', 'A valid EPC is on record for this property.')
          : check('epc', 'EPC served', 'warn', 'EPC missing or expired — required before a valid Section 21.')
    )

    // Gas safety.
    checks.push(
      input.gasValid == null
        ? check('gas', 'Gas safety record', 'unknown', 'No gas safety certificate found on record.')
        : input.gasValid
          ? check('gas', 'Gas safety record', 'pass', 'A valid gas safety record is on file.')
          : check('gas', 'Gas safety record', 'warn', 'Gas safety record missing or expired.')
    )

    // How-to-Rent.
    checks.push(
      input.howToRentServed
        ? check('how_to_rent', 'How-to-Rent guide served', 'pass', 'User confirmed the current guide was served.')
        : check(
            'how_to_rent',
            'How-to-Rent guide served',
            'warn',
            'Confirm the current How-to-Rent guide was served at the start of the tenancy.'
          )
    )
  }

  // Licence (both routes — over-licensed areas / HMOs).
  if (input.licenceRequired) {
    checks.push(
      input.licenceValid == null
        ? check('licence', 'Property licence', 'unknown', 'A licence is expected but none was found on record.')
        : input.licenceValid
          ? check('licence', 'Property licence', 'pass', 'A valid property licence is on record.')
          : check(
              'licence',
              'Property licence',
              'warn',
              'Property licence is missing or expired. Section 21 may be barred while unlicensed.'
            )
    )
  }

  const allClear = !checks.some((c) => c.status === 'warn')
  return { route: input.route, checkedAt: new Date().toISOString(), checks, allClear }
}

export function countWarnings(snapshot: ValiditySnapshot | null | undefined): number {
  if (!snapshot) return 0
  return snapshot.checks.filter((c) => c.status === 'warn').length
}
