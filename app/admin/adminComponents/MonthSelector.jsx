"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function MonthSelector({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}) {
  // Generate years - current year and 2 years back
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2">
      <span className="text-sm font-medium text-[#25323A]">Period:</span>
      <div className="flex items-center gap-2">
        <Select value={selectedMonth} onValueChange={onMonthChange}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-[100px] h-9">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
