"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useUserProfile } from "@/components/UserProfileContext";

interface DatePickerProps {
  id?: string;
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  placeholder?: string;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_SHORT_MON = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const DAYS_SHORT_SUN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DatePicker({
  id,
  label,
  value,
  onChange,
  placeholder = "Select date...",
  required = false,
  minDate,
  maxDate,
  className = "",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useUserProfile();

  const weekStart = user?.profile?.week_start?.toLowerCase() === "sunday" ? "sunday" : "monday";
  const dayNames = weekStart === "sunday" ? DAYS_SHORT_SUN : DAYS_SHORT_MON;

  // Selected date parsed
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parts = value.split("-");
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }, [value]);

  // View state for navigating months
  const [viewYear, setViewYear] = useState<number>(() => {
    return selectedDate ? selectedDate.getFullYear() : new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return selectedDate ? selectedDate.getMonth() : new Date().getMonth();
  });

  // Sync view when opened
  useEffect(() => {
    if (isOpen) {
      if (selectedDate) {
        setViewYear(selectedDate.getFullYear());
        setViewMonth(selectedDate.getMonth());
      } else {
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
      }
    }
  }, [isOpen, selectedDate]);

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

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Determine day of week offset
    let startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday
    if (weekStart === "monday") {
      startDayOfWeek = (startDayOfWeek + 6) % 7; // 0 is Monday, 6 is Sunday
    }

    const days: Array<{
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
      isDisabled: boolean;
    }> = [];

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Days from previous month
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const pDate = new Date(viewYear, viewMonth - 1, pDay);
      const dateStr = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, "0")}-${String(pDay).padStart(2, "0")}`;
      days.push({
        date: pDate,
        dateStr,
        isCurrentMonth: false,
        isSelected: value === dateStr,
        isToday: dateStr === todayStr,
        isDisabled: (minDate ? dateStr < minDate : false) || (maxDate ? dateStr > maxDate : false),
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const cDate = new Date(viewYear, viewMonth, d);
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        date: cDate,
        dateStr,
        isCurrentMonth: true,
        isSelected: value === dateStr,
        isToday: dateStr === todayStr,
        isDisabled: (minDate ? dateStr < minDate : false) || (maxDate ? dateStr > maxDate : false),
      });
    }

    // Days from next month to complete 6 rows (42 days)
    const remainingDays = 42 - days.length;
    for (let n = 1; n <= remainingDays; n++) {
      const nDate = new Date(viewYear, viewMonth + 1, n);
      const dateStr = `${nDate.getFullYear()}-${String(nDate.getMonth() + 1).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
      days.push({
        date: nDate,
        dateStr,
        isCurrentMonth: false,
        isSelected: value === dateStr,
        isToday: dateStr === todayStr,
        isDisabled: (minDate ? dateStr < minDate : false) || (maxDate ? dateStr > maxDate : false),
      });
    }

    return days;
  }, [viewYear, viewMonth, weekStart, value, minDate, maxDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const setPreset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const formattedDisplay = useMemo(() => {
    if (!selectedDate) return "";
    return selectedDate.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

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
              title="Clear date"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </span>
          )}

          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-teal-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
          </svg>
        </div>
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-100"
          role="dialog"
          aria-label="Date Picker Calendar"
        >
          {/* Month / Year Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                title="Previous Month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                title="Next Month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2.5 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => setPreset(0)}
              className="rounded-lg bg-teal-50 px-2 py-1 font-semibold text-teal-800 hover:bg-teal-100 transition shrink-0"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPreset(1)}
              className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-700 hover:bg-slate-200 transition shrink-0"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setPreset(7)}
              className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-700 hover:bg-slate-200 transition shrink-0"
            >
              In 1 Week
            </button>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 mb-1">
            {dayNames.map((d, i) => (
              <span key={i} className="py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {calendarDays.map((item, idx) => {
              const isCurrentDay = item.isToday;
              const isSelected = item.isSelected;
              const isMuted = !item.isCurrentMonth;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={item.isDisabled}
                  onClick={() => handleSelectDay(item.dateStr)}
                  className={`flex h-8 w-8 mx-auto items-center justify-center rounded-lg font-medium transition ${
                    isSelected
                      ? "bg-teal-700 font-bold text-white shadow-xs"
                      : isCurrentDay
                      ? "border border-teal-600 font-bold text-teal-800 bg-teal-50/50 hover:bg-teal-100"
                      : isMuted
                      ? "text-slate-300 hover:bg-slate-100 hover:text-slate-600"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  } ${item.isDisabled ? "cursor-not-allowed opacity-30" : ""}`}
                >
                  {item.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
