"use client"

import React from "react"
import { FieldLabel, TextInput, SectionCard } from "./shared"

interface Props {
  register: import("react-hook-form").UseFormRegister<Record<string, unknown>>
}

export function ContactAddressSection({ register }: Props) {
  return (
    <SectionCard title="Address">
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <FieldLabel>Address Line 1</FieldLabel>
          <TextInput {...register("address_line1")} placeholder="123 Oak Street" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel optional>Address Line 2</FieldLabel>
          <TextInput {...register("address_line2")} placeholder="Flat 2 (optional)" />
        </div>
        <div>
          <FieldLabel>City</FieldLabel>
          <TextInput {...register("city")} placeholder="Birmingham" />
        </div>
        <div>
          <FieldLabel>Postcode</FieldLabel>
          <TextInput {...register("postcode")} placeholder="B1 1AA" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Country</FieldLabel>
          <TextInput {...register("country")} placeholder="United Kingdom" />
        </div>
      </div>
    </SectionCard>
  )
}
