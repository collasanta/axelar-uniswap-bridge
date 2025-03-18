"use client";

import Image from "next/image";
import React, { useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TOKENS } from "@/lib/constants";
import { Input } from "./input";

interface TokenAmountInputProps {
  label: string;
  amount: string;
  onAmountChange: (value: string) => void;
  token: string;
  onTokenChange: (value: string) => void;
  tokens?: string[];
  disabled?: boolean;
  placeholder?: string;
  maxAmount?: string;
  showMaxButton?: boolean;
  className?: string;
}

export function TokenAmountInput({
  label,
  amount,
  onAmountChange,
  token,
  onTokenChange,
  tokens = Object.keys(TOKENS),
  disabled = false,
  placeholder = "0.0",
  maxAmount,
  showMaxButton = false,
  className = "",
}: TokenAmountInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and a single decimal point
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      onAmountChange(value);
    }
  };

  const handleMaxClick = () => {
    if (maxAmount) {
      onAmountChange(maxAmount);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {showMaxButton && maxAmount && (
          <button
            type="button"
            onClick={handleMaxClick}
            className="text-xs text-pink-500 hover:text-pink-600 font-medium"
            disabled={disabled}
          >
            MAX
          </button>
        )}
      </div>
      <div
        className={`flex items-center border ${
          isFocused ? "border-pink-500 ring-1 ring-pink-500" : "border-gray-300"
        } rounded-lg overflow-hidden bg-white ${disabled ? "opacity-70" : ""}`}
      >
        <Input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <div className="border-l border-gray-300 h-10 flex items-center">
          <Select value={token} onValueChange={onTokenChange} disabled={disabled}>
            <SelectTrigger className="border-0 bg-transparent w-[110px] h-10 focus:ring-0">
              <SelectValue placeholder="Select token">
                <div className="flex items-center">
                  {token && TOKENS[token as keyof typeof TOKENS] && (
                    <Image src={TOKENS[token as keyof typeof TOKENS].logo} alt={token} width={20} height={20} className="mr-2" />
                  )}
                  {token}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tokens.map((t) => (
                <SelectItem key={t} value={t}>
                  <div className="flex items-center">
                    {TOKENS[t as keyof typeof TOKENS] && (
                      <Image src={TOKENS[t as keyof typeof TOKENS].logo} alt={t} width={20} height={20} className="mr-2" />
                    )}
                    {t}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
