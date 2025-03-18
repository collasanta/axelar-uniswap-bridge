"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info, Settings } from "lucide-react";
import { useState } from "react";

interface SettingsModalProps {
  slippage: string;
  setSlippage: (value: string) => void;
  deadline: string;
  setDeadline: (value: string) => void;
}

export function SettingsModal({
  slippage,
  setSlippage,
  deadline,
  setDeadline,
}: SettingsModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-700 px-1.5 rounded-full hover:bg-gray-100"
        >
          <Settings size={20} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-white border rounded-xl shadow-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-gray-700">Transaction Settings</h3>
        </div>
        <div className="space-y-4">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-600 flex items-center">
                Max Slippage
                <button className="ml-1 text-gray-400 hover:text-gray-600">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </label>
              <span className="text-sm font-medium text-gray-700">{slippage}%</span>
            </div>
            <div className="flex space-x-2">
              {['0.1', '0.5', '1.0'].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    slippage === value
                      ? 'bg-pink-100 text-pink-700 font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {value}%
                </button>
              ))}
              <div className="relative flex-1">
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-full px-3 py-1 rounded-lg text-sm bg-gray-100 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                  placeholder="Custom"
                  min="0.1"
                  max="20"
                  step="0.1"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-600 flex items-center">
                Transaction Deadline
                <button className="ml-1 text-gray-400 hover:text-gray-600">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </label>
              <span className="text-sm font-medium text-gray-700">{deadline} minutes</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-1 rounded-lg text-sm bg-gray-100 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                placeholder="20"
                min="1"
                max="60"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">minutes</span>
              </div>
            </div>
          </div>


        </div>
      </PopoverContent>
    </Popover>
  );
}
