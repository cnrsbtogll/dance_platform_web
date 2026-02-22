import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  colorVariant?: 'default' | 'instructor' | 'school';
}

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({
  courses,
  onAddCourse,
  isAdmin = false,
  colorVariant = 'default'
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('');

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Haftalık Program</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
            colorVariant={colorVariant === 'school' ? 'school' : 'default'}
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
                  className={`bg-white rounded-lg shadow-sm border p-3 min-h-[100px] sm:min-h-[200px] cursor-pointer hover:border-indigo-300 hover:ring-1 hover:ring-indigo-300 transition-all ${colorVariant === 'school' ? 'dark:bg-[#1a120b]' : 'dark:bg-slate-800'
                    } ${selectedDay === day
                      ? 'border-indigo-300 ring-1 ring-indigo-300'
                      : (colorVariant === 'school' ? 'border-gray-200 dark:border-[#493322]' : 'border-gray-200 dark:border-slate-700')
                    } ${selectedDay && selectedDay !== day ? 'sm:block hidden' : ''
                    }`}
                >
                  <div className={`text-center font-medium py-2 rounded-md mb-3 bg-gray-50 text-gray-700 ${colorVariant === 'school' ? 'dark:bg-[#231810] dark:text-[#cba990]' : 'dark:bg-slate-900 dark:text-gray-300'}`}>
                    {day}
                  </div>

                  <div className="space-y-2">
                    {courses
                      .filter(course => course.schedule.some(s => s.day === day))
                      .map(course => (
                        <Link
                          key={course.id}
                          to={`/courses/${course.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`block p-3 rounded-lg border transition-all duration-300 group hover:shadow-md ${colorVariant === 'school'
                            ? 'bg-amber-50/50 hover:bg-amber-100/80 border-amber-100 hover:border-amber-200 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 dark:border-amber-900/30'
                            : colorVariant === 'instructor'
                              ? 'bg-instructor-bg/50 hover:bg-instructor-bg border-instructor-lighter hover:border-instructor-light dark:bg-instructor-dark/10 dark:hover:bg-instructor-dark/20 dark:border-instructor-dark/30'
                              : 'bg-rose-50/50 hover:bg-rose-100/80 border-rose-100 hover:border-rose-200 dark:bg-brand-pink/5 dark:hover:bg-brand-pink/10 dark:border-brand-pink/20'
                            }`}
                        >
                          <div className={`font-semibold truncate mb-1.5 transition-colors ${colorVariant === 'school'
                            ? 'text-amber-900 dark:text-amber-100 group-hover:text-amber-700'
                            : colorVariant === 'instructor'
                              ? 'text-instructor dark:text-instructor-lighter group-hover:text-instructor-dark'
                              : 'text-rose-700 dark:text-brand-pink group-hover:text-rose-600'
                            }`}>
                            {course.name}
                          </div>
                          {course.schedule
                            .filter(s => s.day === day)
                            .map((schedule, index) => (
                              <div key={index} className="flex items-center text-gray-600 dark:text-gray-400 text-xs font-medium">
                                <svg className={`w-3.5 h-3.5 mr-1.5 flex-shrink-0 ${colorVariant === 'school' ? 'text-amber-600' : colorVariant === 'instructor' ? 'text-instructor' : 'text-brand-pink'
                                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="truncate">{schedule.time}</span>
                              </div>
                            ))}
                        </Link>
                      ))}
                    {courses.filter(course => course.schedule.some(s => s.day === day)).length === 0 && (
                      <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
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
        <div className={`text-center py-12 bg-white rounded-lg shadow-sm border ${colorVariant === 'school' ? 'dark:bg-[#1a120b] border-gray-200 dark:border-[#493322]' : 'dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Henüz Kurs Bulunmuyor</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
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