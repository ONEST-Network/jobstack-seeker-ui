import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  yearRange?: { start: number; end: number };
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  yearRange,
  className,
}: DatePickerProps) {
  const [month, setMonth] = React.useState<Date>(date || new Date());
  const [isOpen, setIsOpen] = React.useState(false);

  // Generate year range (default: 1950 to current year)
  const currentYear = new Date().getFullYear();
  const startYear = yearRange?.start || 1950;
  const endYear = yearRange?.end || currentYear;
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  ).reverse();

  // Generate months
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = new Date(month);
    newMonth.setMonth(parseInt(monthIndex));
    setMonth(newMonth);
  };

  const handleYearChange = (year: string) => {
    const newMonth = new Date(month);
    newMonth.setFullYear(parseInt(year));
    setMonth(newMonth);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-auto p-0",
          "max-h-[min(60vh,340px)] sm:max-h-none overflow-y-auto overflow-x-hidden",
          "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full",
          "overscroll-contain"
        )}
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={true}
        collisionPadding={8}
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        <div className="p-3 space-y-3 border-b shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={month.getMonth().toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[300px]">
                {months.map((monthName, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={month.getFullYear().toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-full sm:w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[300px]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange(selectedDate);
            setIsOpen(false);
          }}
          month={month}
          onMonthChange={setMonth}
          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// Date of Birth specific picker with age restrictions
interface DateOfBirthPickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minAge?: number; // Minimum age in years
  maxAge?: number; // Maximum age in years
  className?: string;
  onAgeValidation?: (isMinor: boolean, age: number) => void;
}

export function DateOfBirthPicker({
  date,
  onDateChange,
  placeholder = "Select date of birth",
  disabled = false,
  minAge = 0,
  maxAge = 100,
  className,
  onAgeValidation,
}: DateOfBirthPickerProps) {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - maxAge;
  const endYear = currentYear - minAge;

  const handleDateChange = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
    
    if (selectedDate && onAgeValidation) {
      const age = currentYear - selectedDate.getFullYear();
      const isMinor = age < 18;
      onAgeValidation(isMinor, age);
    }
  };

  return (
    <DatePicker
      date={date}
      onDateChange={handleDateChange}
      placeholder={placeholder}
      disabled={disabled}
      yearRange={{ start: startYear, end: endYear }}
      className={className}
    />
  );
}

