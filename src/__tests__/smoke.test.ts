/**
 * Propvora Smoke Tests
 *
 * These are lightweight integration-style tests that can be run with a Jest-compatible
 * runner (add jest + ts-jest as devDependencies to enable `npm test`).
 *
 * To run manually without Jest, use: npx ts-node --project tsconfig.json src/__tests__/smoke.test.ts
 */

describe('Propvora smoke tests', () => {
  it('should have required env vars defined in example', () => {
    // Just check the example file exists
    const fs = require('fs')
    const envExists = fs.existsSync('.env.example')
    expect(envExists).toBe(true)
  })

  it('should export planning calculation functions', () => {
    // Verify the module exports the expected function
    // Note: import path must be resolved relative to project root when using ts-jest
    const mod = require('../lib/planning/calculations')
    expect(typeof mod.calculatePlanningSet).toBe('function')
    expect(typeof mod.formatCurrency).toBe('function')
    expect(typeof mod.formatPercent).toBe('function')
  })

  it('planning calculations should return expected structure for rent-to-rent profile', () => {
    const { calculatePlanningSet } = require('../lib/planning/calculations')

    const result = calculatePlanningSet({
      profileKey: 'rent_to_rent',
      propertyName: 'Test HMO',
      address: '1 Test Street',
      postcode: 'TE1 1ST',
      numUnits: 1,
      rooms: [
        { id: '1', name: 'Room 1', type: 'single', monthlyRent: 600 },
        { id: '2', name: 'Room 2', type: 'single', monthlyRent: 600 },
      ],
      voidAllowancePct: 5,
      landlordMonthlyRent: 700,
      expenses: [{ id: '1', label: 'Management', category: 'management', monthlyAmount: 100 }],
      bills: [{ id: '1', label: 'Utilities', provider: 'OVO', monthlyAmount: 200, includedInRent: false }],
      upfrontCosts: [{ id: '1', label: 'Deposit', category: 'deposit', amount: 2000 }],
      complianceItems: [],
      status: 'draft',
    })

    expect(result).toHaveProperty('grossMonthlyIncome')
    expect(result).toHaveProperty('netMonthlyIncome')
    expect(result).toHaveProperty('riskScore')
    expect(result).toHaveProperty('totalUpfrontCash')
    expect(result).toHaveProperty('monthlyProjection')
    expect(result.grossMonthlyIncome).toBeGreaterThan(0)
    expect(Array.isArray(result.monthlyProjection)).toBe(true)
    expect(result.monthlyProjection.length).toBeGreaterThan(0)
  })

  it('planning calculations risk score should be a number between 0 and 100', () => {
    const { calculatePlanningSet } = require('../lib/planning/calculations')

    const result = calculatePlanningSet({
      profileKey: 'rent_to_rent',
      propertyName: 'Test',
      address: '',
      postcode: '',
      numUnits: 1,
      rooms: [{ id: '1', name: 'Room 1', type: 'single', monthlyRent: 400 }],
      voidAllowancePct: 10,
      landlordMonthlyRent: 600,
      expenses: [],
      bills: [],
      upfrontCosts: [],
      complianceItems: [],
      status: 'draft',
    })

    expect(typeof result.riskScore).toBe('number')
    expect(result.riskScore).toBeGreaterThanOrEqual(0)
    expect(result.riskScore).toBeLessThanOrEqual(100)
  })
})
