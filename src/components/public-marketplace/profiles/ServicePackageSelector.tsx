'use client'

import { useState } from 'react'
import { CheckCircle, Lock } from 'lucide-react'
import type { PublicServiceOffer } from '@/lib/public-marketplace/types'

export default function ServicePackageSelector({ offer }: { offer: PublicServiceOffer }) {
  const [selectedPackage, setSelectedPackage] = useState(1) // default: standard (index 1)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])

  const packages = offer.packages ?? [
    { name: 'Basic', price: offer.basePrice, description: 'Essential clean', includes: ['Kitchen', 'Bathroom', 'Living areas', 'Bedrooms (1)', 'Interior windows', 'Up to 3 hours', '1 cleaner'] },
    { name: 'Standard', price: offer.standardPrice, description: 'Most popular', includes: ['Kitchen deep clean', 'Bathroom sanitisation', 'Living areas', 'Bedrooms (2)', 'Interior windows', 'Skirting boards', 'Oven included', 'Up to 5 hours', '2 cleaners'] },
    { name: 'Premium', price: offer.premiumPrice, description: 'Deep & detailed', includes: ['Full kitchen deep clean', 'All bathrooms', 'All living areas', 'All bedrooms (3)', 'All windows', 'Skirting & switches', 'Oven & fridge', 'Carpet shampooing'] },
  ]

  const addons = offer.addons ?? []

  const selectedPkg = packages[selectedPackage]
  const addonTotal = selectedAddons.reduce((sum, name) => {
    const addon = addons.find(a => a.name === name)
    return sum + (addon?.price ?? 0)
  }, 0)
  const total = selectedPkg.price + addonTotal

  const toggleAddon = (name: string) => {
    setSelectedAddons(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name])
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sticky top-20">
      <h3 className="text-base font-bold text-slate-900 mb-1">Choose your package</h3>
      <p className="text-xs text-slate-500 mb-4">All packages include professional equipment &amp; eco products</p>

      {/* Package selector */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {packages.map((pkg, i) => (
          <button
            key={pkg.name}
            onClick={() => setSelectedPackage(i)}
            className={`p-3 rounded-xl border-2 text-left transition-all ${selectedPackage === i ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <div className="text-xs font-bold text-slate-900">{pkg.name}</div>
            {i === 1 && <div className="text-xs text-blue-600 font-semibold">★ BEST</div>}
            <div className="text-sm font-bold text-slate-900 mt-1">£{(pkg.price / 100).toFixed(0)}</div>
            <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{pkg.description}</div>
          </button>
        ))}
      </div>

      {/* Included items */}
      <div className="space-y-1.5 mb-4">
        {selectedPkg.includes.map(item => (
          <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            {item}
          </div>
        ))}
      </div>

      {/* Add-ons */}
      {addons.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">Add-ons &amp; extras:</h4>
          <div className="space-y-2">
            {addons.map(addon => (
              <label key={addon.name} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAddons.includes(addon.name)}
                  onChange={() => toggleAddon(addon.name)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="flex-1 text-sm text-slate-700">{addon.name}</span>
                <span className="text-sm font-semibold text-slate-700">+£{(addon.price / 100).toFixed(0)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price summary */}
      <div className="bg-slate-50 rounded-xl p-3 mb-4 text-sm space-y-1.5">
        <div className="flex justify-between text-slate-600">
          <span>{selectedPkg.name} package:</span>
          <span>£{(selectedPkg.price / 100).toFixed(0)}</span>
        </div>
        {addonTotal > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>Add-ons:</span>
            <span>£{(addonTotal / 100).toFixed(0)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5">
          <span>Total:</span>
          <span>£{(total / 100).toFixed(0)}</span>
        </div>
      </div>

      <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors mb-2 flex items-center justify-center gap-2">
        <Lock className="h-4 w-4" />
        Secure checkout
      </button>
      <button className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors mb-3 text-sm">
        Request custom quote
      </button>

      <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1">
        <Lock className="h-3 w-3" />
        Secure payments powered by Propvora
      </p>
    </div>
  )
}
