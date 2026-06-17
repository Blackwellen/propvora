'use client'

import { useState } from 'react'
import { Check, Lock } from 'lucide-react'
import type { PublicServiceOffer } from '@/lib/public-marketplace/types'

export default function ServicePackageSelector({ offer }: { offer: PublicServiceOffer }) {
  const [selectedPackage, setSelectedPackage] = useState(1)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])

  const packages = offer.packages ?? [
    { name: 'Basic', price: offer.basePrice, description: 'Essential clean', includes: ['Kitchen', 'Bathroom', 'Living areas', 'Bedrooms (1)', 'Interior windows', 'Up to 3 hours', '1 cleaner'] },
    { name: 'Standard', price: offer.standardPrice, description: 'Most popular', includes: ['Everything in Basic', 'Bedrooms (up to 2)', 'Interior windows', 'Up to 5 hours', '2 cleaners'] },
    { name: 'Premium', price: offer.premiumPrice, description: 'Deep and detailed', includes: ['Everything in Standard', 'Bedrooms (up to 3)', 'Interior windows', 'Up to 7 hours', '3 cleaners'] },
  ]
  const addons = offer.addons ?? []
  const selectedPkg = packages[selectedPackage]
  const addonTotal = selectedAddons.reduce((sum, name) => sum + (addons.find(a => a.name === name)?.price ?? 0), 0)
  const total = selectedPkg.price + addonTotal

  const toggleAddon = (name: string) => {
    setSelectedAddons(prev => prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name])
  }

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
      <h3 className="text-[18px] font-[800] leading-6 text-slate-950">Choose your package</h3>
      <p className="mt-1 text-[13px] font-[500] text-slate-500">All packages include professional equipment and eco products</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {packages.map((pkg, i) => (
          <button
            key={pkg.name}
            onClick={() => setSelectedPackage(i)}
            className={`relative min-h-[306px] rounded-[10px] border p-4 text-left transition-colors ${
              selectedPackage === i ? 'border-blue-600 bg-blue-50/40 shadow-[0_12px_32px_rgba(37,99,235,0.12)]' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {i === 1 && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-[800] text-emerald-700">
                Best value
              </span>
            )}
            <div className="text-[16px] font-[800] text-slate-950">{pkg.name}</div>
            <div className="mt-2 min-h-[34px] text-[12px] font-[600] leading-4 text-slate-500">{pkg.description}</div>
            {i === 1 && <div className="mt-1 text-[12px] font-[800] text-blue-600">Most popular</div>}
            <div className="mt-5 text-[26px] font-[800] leading-none text-slate-950">&pound;{(pkg.price / 100).toFixed(0)}</div>
            <div className="mt-2 text-[12px] font-[600] text-slate-500">Up to {i + 1} bed / {i + 1} bath</div>
            <div className={`mt-5 flex h-10 items-center justify-center rounded-[8px] border text-[13px] font-[800] ${
              selectedPackage === i ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-blue-600'
            }`}>
              Select
            </div>
            <div className="mt-5 space-y-2">
              {pkg.includes.slice(0, 7).map(item => (
                <div key={item} className="flex items-start gap-2 text-[12px] font-[600] leading-4 text-slate-700">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-[10px] border border-slate-200 bg-white p-4">
          <h4 className="mb-3 text-[15px] font-[800] text-slate-950">Add-ons &amp; extras</h4>
          <div className="space-y-2.5">
            {addons.slice(0, 5).map(addon => (
              <label key={addon.name} className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedAddons.includes(addon.name)}
                  onChange={() => toggleAddon(addon.name)}
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                />
                <span className="flex-1 text-[13px] font-[500] text-slate-600">{addon.name}</span>
                <span className="text-[13px] font-[800] text-slate-900">+&pound;{(addon.price / 100).toFixed(0)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-[10px] border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[15px] font-[800] text-slate-950">{selectedPkg.name} package</h4>
            <span className="text-[15px] font-[800] text-slate-950">&pound;{(selectedPkg.price / 100).toFixed(0)}</span>
          </div>
          <div className="mt-5 space-y-3 border-b border-slate-200 pb-4 text-[13px]">
            <div className="flex justify-between text-slate-500"><span>Add-ons</span><span>&pound;{(addonTotal / 100).toFixed(0)}</span></div>
            <div className="flex justify-between text-[16px] font-[800] text-slate-950"><span>Total</span><span>&pound;{(total / 100).toFixed(0)}</span></div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[12px] font-[600] text-slate-500">
            <Lock className="h-3.5 w-3.5" />
            Secure checkout
          </div>
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-[8px] bg-blue-600 py-3 text-[14px] font-[800] text-white hover:bg-blue-700">
            Book now
            <span aria-hidden>-&gt;</span>
          </button>
          <button className="mt-3 w-full rounded-[8px] border border-blue-600 py-3 text-[14px] font-[800] text-blue-600 hover:bg-blue-50">
            Request custom quote
          </button>
        </div>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-[12px] font-[600] text-slate-500">
        <Lock className="h-4 w-4 text-blue-600" />
        Secure payments powered by Propvora
      </p>
    </div>
  )
}
