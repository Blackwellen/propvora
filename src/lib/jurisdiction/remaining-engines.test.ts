import { describe, it, expect } from "vitest"
import { tenureModel } from "@/lib/portfolio/tenure-models"
import { isHigherRisk, buildingSafetyDuties } from "@/lib/compliance/building-safety"
import { licensingFramework, requiresLicence } from "@/lib/legal/licensing"
import { tenancyModel } from "@/lib/legal/tenancy-models"
import { requiredTenantChecks } from "@/lib/legal/tenant-checks"
import { fitnessStandard } from "@/lib/compliance/fitness"
import { requiredTradeCredential, taxIdLabel } from "@/lib/work/trade-certs"
import { insuranceDuties } from "@/lib/compliance/insurance"
import { agentDuties } from "@/lib/legal/agent-regulation"
import { requiredNoticeLanguages } from "@/lib/i18n/notice-language"
import { amlDuties } from "@/lib/legal/aml"

describe("dim 17 tenure models", () => {
  it("US uses HOA dues; DE uses Hausgeld/WEG", () => {
    expect(tenureModel("US").periodicChargeLabel).toBe("HOA dues")
    expect(tenureModel("DE").governanceBody).toMatch(/WEG/)
  })
  it("UK leasehold has ground rent", () => {
    expect(tenureModel("GB").groundRent).toBe(true)
  })
})

describe("dim 27 building safety", () => {
  it("higher-risk = ≥18m or ≥7 storeys AND ≥2 units (E&W)", () => {
    expect(isHigherRisk({ countryCode: "GB", heightM: 20, unitCount: 12 })).toBe(true)
    expect(isHigherRisk({ countryCode: "GB", heightM: 20, unitCount: 1 })).toBe(false)
    expect(isHigherRisk({ countryCode: "GB", storeys: 8, unitCount: 4 })).toBe(true)
  })
  it("higher-risk duties include an Accountable Person", () => {
    const d = buildingSafetyDuties({ countryCode: "GB", storeys: 8, unitCount: 4 })
    expect(d.duties.join(" ")).toMatch(/Accountable Person/)
  })
})

describe("dim 3 licensing", () => {
  it("E&W mandatory HMO needs 5+ persons / 2+ households", () => {
    expect(requiresLicence("GB", null, 5, 2).required).toBe(true)
    expect(requiresLicence("GB", null, 4, 2).required).toBe(false)
  })
  it("Scotland HMO needs 3+ persons + has landlord registration", () => {
    expect(requiresLicence("GB", "SCT", 3, 1).required).toBe(true)
    expect(licensingFramework("GB", "SCT").registrationDuties.length).toBeGreaterThan(0)
  })
  it("Ireland has no HMO but requires RTB registration", () => {
    const f = licensingFramework("IE")
    expect(f.applies).toBe(false)
    expect(f.registrationDuties[0].name).toMatch(/RTB/)
  })
})

describe("dim 11/18 tenancy models", () => {
  it("Wales uses occupation contracts, not tenancies", () => {
    expect(tenancyModel("GB", "WLS").agreementTerm).toBe("occupation contract")
  })
  it("Scotland = PRT", () => {
    expect(tenancyModel("GB", "SCT").types[0].id).toBe("prt")
  })
})

describe("dim 13 right-to-rent", () => {
  it("Right to Rent applies in England only", () => {
    expect(requiredTenantChecks("GB", "EW").checks[0].required).toBe(true)
    expect(requiredTenantChecks("GB", "SCT").checks[0].required).toBe(false)
  })
})

describe("dim 23 fitness", () => {
  it("England has Awaab's Law hazard SLA", () => {
    expect(fitnessStandard("GB").hazardResponseDays).toBe(14)
    expect(fitnessStandard("GB").slaSource).toBe("Awaab's Law")
  })
  it("Scotland = Repairing Standard", () => {
    expect(fitnessStandard("GB", "SCT").standardName).toMatch(/Repairing Standard/)
  })
})

describe("dim 20 trade certs", () => {
  it("UK gas = Gas Safe (mandatory); IE = RGI", () => {
    expect(requiredTradeCredential("GB", "gas")?.credential).toMatch(/Gas Safe/)
    expect(requiredTradeCredential("IE", "gas")?.credential).toMatch(/RGI/)
  })
  it("tax-ID label varies (ABN/EIN/VAT)", () => {
    expect(taxIdLabel("AU")).toBe("ABN")
    expect(taxIdLabel("US")).toBe("EIN")
    expect(taxIdLabel("GB")).toBe("VAT number")
  })
})

describe("dim 24 insurance", () => {
  it("buildings insurance is a duty; HMO adds HMO cover", () => {
    const r = insuranceDuties("GB", "hmo")
    expect(r.duties.some((d) => d.id === "buildings")).toBe(true)
    expect(r.duties.some((d) => d.id === "hmo_cover")).toBe(true)
    expect(r.contractorPlMinimum).toBe(2_000_000)
  })
})

describe("dim 19 agent regulation", () => {
  it("Wales requires Rent Smart Wales licence; England requires CMP + redress", () => {
    expect(agentDuties("GB", "WLS").licenceName).toMatch(/Rent Smart Wales/)
    expect(agentDuties("GB").cmpRequired).toBe(true)
  })
})

describe("dim 25 notice language", () => {
  it("Wales is bilingual EN/CY", () => {
    const r = requiredNoticeLanguages("GB", "WLS")
    expect(r.bilingual).toBe(true)
    expect(r.languages).toContain("cy")
  })
})

describe("dim 28 AML", () => {
  it("UK letting/estate agency is in AML scope with an MLRO", () => {
    const r = amlDuties("GB")
    expect(r.inScope).toBe(true)
    expect(r.mlroRequired).toBe(true)
  })
})
