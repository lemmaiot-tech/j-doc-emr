
import React, { useMemo } from 'react';
import { SurgicalProcedure } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface SurgeryCalendarProps {
  surgeries: SurgicalProcedure[];
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
}

const SurgeryCalendar: React.FC<SurgeryCalendarProps> = ({
  surgeries,
  selectedDate,
  onDateSelect,
  currentDate,
  setCurrentDate,
}) => {
  const surgeryDates = useMemo(() => {
    const dates = new Set<string>();
    surgeries.forEach(s => {
      // Normalize date to YYYY-MM-DD format to ignore time
      dates.add(s.createdAt.toISOString().split('T')[0]);
    });
    return dates;
  }, [surgeries]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };

  const renderHeader = () => {
    const dateFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' });
    return (
      <div className="flex justify-between items-center py-2 px-2">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">&lt;</button>
        <div className="font-bold text-lg">
          {dateFormat.format(currentDate)}
        </div>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">&gt;</button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
        {days.map(day => <div key={day} className="py-2">{day}</div>)}
      </div>
    );
  };
  
  const renderCells = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

    const rows = [];
    let days = [];
    let day = startDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day);
        const dayKey = cloneDay.toISOString().split('T')[0];
        
        const isToday = cloneDay.getTime() === today.getTime();
        const isSelected = selectedDate && cloneDay.toDateString() === selectedDate.toDateString();
        const isCurrentMonth = cloneDay.getMonth() === currentDate.getMonth();
        const hasSurgery = surgeryDates.has(dayKey);

        days.push(
          <div
            key={day.toString()}
            className={`p-1 h-16 flex flex-col items-center justify-start border border-transparent 
              ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : ''}
              ${isCurrentMonth ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
              ${isSelected ? '!bg-primary-600 !text-white hover:!bg-primary-700' : ''}
              ${!isSelected && isToday ? 'bg-primary-100 dark:bg-primary-900/50' : ''}
              rounded-md transition-colors duration-200
            `}
            onClick={() => onDateSelect(cloneDay)}
          >
            <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>
              {cloneDay.getDate()}
            </span>
            {hasSurgery && (
              <div className={`mt-1 w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></div>
            )}
          </div>
        );
        day.setDate(day.getDate() + 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };


  return (
    <Card className="mb-6">
      <div className="p-2">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
       {selectedDate && (
          <div className="p-2 text-center border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" size="sm" onClick={() => onDateSelect(null)}>
                  Show All Surgeries
              </Button>
          </div>
      )}
    </Card>
  );
};

export default SurgeryCalendar;
