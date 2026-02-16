import React, { useState } from 'react';
import CustomSelect from '../../../../common/components/ui/CustomSelect';

interface Course {
  id: string;
  name: string;
  schedule: {
    day: string;
    time: string;
  }[];
}

interface ScheduleManagementProps {
  courses: Course[];
  onAddCourse?: () => void;
  isAdmin?: boolean;
}

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ 
  courses, 
  onAddCourse,
  isAdmin = false 
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('');

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Ders Programı</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isAdmin ? 'Okulunuzun' : 'Size ait'} haftalık ders programını görüntüleyin
          </p>
        </div>
        <div className="w-full sm:w-64 mt-4 sm:mt-0 block sm:hidden">
          <CustomSelect
            name="selectedDay"
            label="Gün Seçin"
            value={selectedDay}
            onChange={(value: string | string[]) => {
              if (typeof value === 'string') {
                setSelectedDay(value);
                const element = document.getElementById(`day-${value}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
              }
            }}
            options={[
              { value: 'Pazartesi', label: 'Pazartesi' },
              { value: 'Salı', label: 'Salı' },
              { value: 'Çarşamba', label: 'Çarşamba' },
              { value: 'Perşembe', label: 'Perşembe' },
              { value: 'Cuma', label: 'Cuma' },
              { value: 'Cumartesi', label: 'Cumartesi' },
              { value: 'Pazar', label: 'Pazar' }
            ]}
            fullWidth
            allowEmpty
          />
        </div>
      </div>

      {courses.length > 0 ? (
        <div className="relative">
          <div className="overflow-x-auto sm:overflow-x-visible">
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-4 sm:min-w-0">
              {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day) => (
                <div 
                  key={day} 
                  id={`day-${day}`}
                  onClick={() => setSelectedDay(day === selectedDay ? '' : day)}
                  className={`bg-white rounded-lg shadow-sm border p-3 min-h-[100px] sm:min-h-[200px] cursor-pointer hover:border-indigo-300 hover:ring-1 hover:ring-indigo-300 transition-all ${
                    selectedDay === day 
                      ? 'border-indigo-300 ring-1 ring-indigo-300' 
                      : 'border-gray-200'
                  } ${
                    selectedDay && selectedDay !== day ? 'sm:block hidden' : ''
                  }`}
                >
                  <div className="text-center font-medium py-2 rounded-md mb-3 bg-gray-50 text-gray-700">
                    {day}
                  </div>
                  
                  <div className="space-y-2">
                    {courses
                      .filter(course => course.schedule.some(s => s.day === day))
                      .map(course => (
                        <div 
                          key={course.id} 
                          className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-md transition-colors duration-200"
                        >
                          <div className="font-medium text-rose-700 truncate mb-1">{course.name}</div>
                          {course.schedule
                            .filter(s => s.day === day)
                            .map((schedule, index) => (
                              <div key={index} className="flex items-center text-gray-600 text-sm">
                                <svg className="w-4 h-4 mr-1.5 text-brand-pink flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="truncate">{schedule.time}</span>
                              </div>
                            ))}
                        </div>
                      ))}
                    {courses.filter(course => course.schedule.some(s => s.day === day)).length === 0 && (
                      <div className="text-center text-gray-500 text-sm py-4">
                        Bu güne ait ders bulunmuyor
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Kurs Bulunmuyor</h3>
          <p className="text-gray-500 mb-4">
            {isAdmin 
              ? 'Yeni bir kurs eklemek için "Kurslar" sekmesini kullanabilirsiniz.'
              : 'Henüz size atanmış bir kurs bulunmuyor.'}
          </p>
          {onAddCourse && (
            <button
              onClick={onAddCourse}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-pink hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Yeni Kurs Ekle
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement; 