"use client"

import { useCustomerToast } from "../../../components/toast"

interface Props {
  gallery: string[]
}

export default function LetGallerySection({ gallery }: Props) {
  const { toast } = useCustomerToast()
  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[320px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={gallery[0]} alt="" className="col-span-2 row-span-2 w-full h-full object-cover rounded-2xl" />
      {gallery.slice(1, 5).map((g, i) => (
        <div key={i} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={g} alt="" className="w-full h-full object-cover rounded-2xl" />
          {i === 3 && (
            <button
              onClick={() => toast("Gallery — coming soon", "info")}
              className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center text-white text-[13px] font-semibold"
            >
              View all photos
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
