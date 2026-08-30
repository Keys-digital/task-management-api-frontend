"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useUserProfile } from "@/components/UserProfileContext";

interface TimePickerProps {
  id?: string;
  label?: string;
  value: string; // "HH:MM" or "HH:MM:SS"
  onChange: (timeStr: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const COMMON_MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const HOURS_12 = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];
const HOURS_24 = [
  "00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11",
  "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"
];

export default function TimePicker({
  id,
  label,
  value,
  onChange,
  placeholder = "Select time...",
  required = false,
  className = "",
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useUserProfile();

  const is24Hour = user?.profile?.time_format === "24h";

  // Parse current value
  const { currentHour24, currentMinute, currentHour12, currentPeriod } = useMemo(() => {
    if (!value) {
      return {
        currentHour24: "09",
        currentMinute: "00",
        currentHour12: "09",
        currentPeriod: "AM" as "AM" | "PM",
      };
    }

    const parts = value.split(":");
    const h24 = parseInt(parts[0] || "0", 10);
    const m = parts[1] ? parts[1].slice(0, 2) : "00";

    const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;

    return {
      currentHour24: String(h24).padStart(2, "0"),
      currentMinute: m.padStart(2, "0"),
      currentHour12: String(h12).padStart(2, "0"),
      currentPeriod: period,
    };
  }, [value]);

  const [selectedHour12, setSelectedHour12] = useState(currentHour12);
  const [selectedHour24, setSelectedHour24] = useState(currentHour24);
  const [selectedMinute, setSelectedMinute] = useState(currentMinute);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(currentPeriod);

  // Sync state when value changes or popup opens
  useEffect(() => {
    if (value) {
      setSelectedHour12(currentHour12);
      setSelectedHour24(currentHour24);
      setSelectedMinute(currentMinute);
      setSelectedPeriod(currentPeriod);
    }
  }, [value, currentHour12, currentHour24, currentMinute, currentPeriod]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const emitTime = (h12: string, min: string, period: "AM" | "PM", h24Override?: string) => {
    if (is24Hour) {
      const h24 = h24Override || selectedHour24;
      onChange(`${h24}:${min}:00`);
    } else {
      let hNum = parseInt(h12, 10);
      if (period === "PM" && hNum < 12) hNum += 12;
      if (period === "AM" && hNum === 12) hNum = 0;
      const h24Str = String(hNum).padStart(2, "0");
      onChange(`${h24Str}:${min}:00`);
    }
  };

  const handleHourSelect = (hour: string) => {
    if (is24Hour) {
      setSelectedHour24(hour);
      emitTime(selectedHour12, selectedMinute, selectedPeriod, hour);
    } else {
      setSelectedHour12(hour);
      emitTime(hour, selectedMinute, selectedPeriod);
    }
  };

  const handleMinuteSelect = (min: string) => {
    setSelectedMinute(min);
    emitTime(selectedHour12, min, selectedPeriod);
  };

  const handlePeriodSelect = (period: "AM" | "PM") => {
    setSelectedPeriod(period);
    emitTime(selectedHour12, selectedMinute, period);
  };

  const setPreset = (h24: string, min: string) => {
    const hNum = parseInt(h24, 10);
    const period: "AM" | "PM" = hNum >= 12 ? "PM" : "AM";
    let h12Num = hNum % 12;
    if (h12Num === 0) h12Num = 12;

    const h12Str = String(h12Num).padStart(2, "0");
    const h24Str = h24.padStart(2, "0");
    const minStr = min.padStart(2, "0");

    setSelectedHour12(h12Str);
    setSelectedHour24(h24Str);
    setSelectedMinute(minStr);
    setSelectedPeriod(period);

    onChange(`${h24Str}:${minStr}:00`);
    setIsOpen(false);
  };

  const formattedDisplay = useMemo(() => {
    if (!value) return "";
    if (is24Hour) {
      return `${currentHour24}:${currentMinute}`;
    }
    return `${currentHour12}:${currentMinute} ${currentPeriod}`;
  }, [value, is24Hour, currentHour24, currentHour12, currentMinute, currentPeriod]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Clickable Display Field */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-teal-100 ${
          isOpen
            ? "border-teal-600 ring-2 ring-teal-100 shadow-sm"
            : "border-slate-300 hover:border-slate-400 text-slate-900"
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={value ? "font-medium text-slate-900" : "text-slate-400"}>
          {value ? formattedDisplay : placeholder}
        </span>

        <div className="flex items-center gap-1.5 text-slate-400">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="rounded-md p-0.5 hover:bg-slate-100 hover:text-slate-700"
              title="Clear time"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </span>
          )}

          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-teal-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
      </button>

      {/* Time Picker Popover */}
      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-100"
          role="dialog"
          aria-label="Time Selection Interface"
        >
          {/* Quick Presets */}
          <div className="mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => setPreset("09", "00")}
              className="rounded-lg bg-teal-50 px-2 py-1 font-semibold text-teal-800 hover:bg-teal-100 transition shrink-0"
            >
              9:00 AM
            </button>
            <button
              type="button"
              onClick={() => setPreset("12", "00")}
              className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-700 hover:bg-slate-200 transition shrink-0"
            >
              12:00 PM
            </button>
            <button
              type="button"
              onClick={() => setPreset("17", "00")}
              className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-700 hover:bg-slate-200 transition shrink-0"
            >
              5:00 PM
            </button>
            <button
              type="button"
              onClick={() => setPreset("20", "00")}
              className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-700 hover:bg-slate-200 transition shrink-0"
            >
              8:00 PM
            </button>
          </div>

          {/* Time Selector Grid */}
          <div className="space-y-3">
            {/* 1. Hours */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Hour
              </p>
              <div className="grid grid-cols-6 gap-1 text-xs">
                {(is24Hour ? HOURS_24 : HOURS_12).map((h) => {
                  const isSelected = is24Hour ? selectedHour24 === h : selectedHour12 === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleHourSelect(h)}
                      className={`h-7 rounded-lg font-semibold transition ${
                        isSelected
                          ? "bg-teal-700 text-white shadow-xs"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Minutes */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Minute
              </p>
              <div className="grid grid-cols-6 gap-1 text-xs">
                {COMMON_MINUTES.map((m) => {
                  const isSelected = selectedMinute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMinuteSelect(m)}
                      className={`h-7 rounded-lg font-semibold transition ${
                        isSelected
                          ? "bg-teal-700 text-white shadow-xs"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. AM / PM (if 12h mode) & Done Action */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
              {!is24Hour ? (
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => handlePeriodSelect("AM")}
                    className={`rounded-lg px-3 py-1 transition ${
                      selectedPeriod === "AM"
                        ? "bg-white text-teal-800 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePeriodSelect("PM")}
                    className={`rounded-lg px-3 py-1 transition ${
                      selectedPeriod === "PM"
                        ? "bg-white text-teal-800 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    PM
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium">24-hour mode</span>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
