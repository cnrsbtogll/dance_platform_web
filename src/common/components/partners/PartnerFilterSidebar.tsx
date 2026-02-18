import React from 'react';
import CustomSelect from '../ui/CustomSelect';
import Button from '../ui/Button';

interface Option {
    value: string;
    label: string;
}

interface FilterState {
    danceStyle: string;
    gender: string;
    level: string;
    location: string;
    availableTimes: string[];
}

interface PartnerFilterSidebarProps {
    filters: FilterState;
    onFilterChange: (key: keyof FilterState, value: any) => void;
    onReset: () => void;
    danceStyles: Option[];
    loading?: boolean;
    className?: string;
}

const PartnerFilterSidebar: React.FC<PartnerFilterSidebarProps> = ({
    filters,
    onFilterChange,
    onReset,
    danceStyles,
    loading = false,
    className = '',
}) => {
    const genderOptions = [
        { value: 'Kadın', label: 'Kadın' },
        { value: 'Erkek', label: 'Erkek' },
    ];

    const levelOptions = [
        { value: 'Başlangıç', label: 'Başlangıç' },
        { value: 'Orta', label: 'Orta' },
        { value: 'İleri', label: 'İleri' },
        { value: 'Profesyonel', label: 'Profesyonel' },
    ];

    const timeOptions = ['Sabah', 'Öğlen', 'Akşam', 'Hafta Sonu'];

    const handleTimeToggle = (time: string) => {
        const newTimes = filters.availableTimes.includes(time)
            ? filters.availableTimes.filter(t => t !== time)
            : [...filters.availableTimes, time];
        onFilterChange('availableTimes', newTimes);
    };

    return (
        <div className={`bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-24 ${className}`}>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-brand-secondary flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    Filtrele
                </h2>
                <button
                    onClick={onReset}
                    className="text-xs font-semibold text-brand-primary hover:text-brand-darkAccent transition-colors bg-brand-primary/5 px-2 py-1 rounded-md"
                >
                    Temizle
                </button>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Dans Stili</label>
                    <CustomSelect
                        name="danceStyle"
                        options={danceStyles}
                        value={filters.danceStyle}
                        onChange={(val) => onFilterChange('danceStyle', val)}
                        placeholder="Tüm Stiller"
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cinsiyet</label>
                    <CustomSelect
                        name="gender"
                        options={genderOptions}
                        value={filters.gender}
                        onChange={(val) => onFilterChange('gender', val)}
                        placeholder="Hepsi"
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Seviye</label>
                    <CustomSelect
                        name="level"
                        options={levelOptions}
                        value={filters.level}
                        onChange={(val) => onFilterChange('level', val)}
                        placeholder="Tüm Seviyeler"
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Konum</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={filters.location}
                            onChange={(e) => onFilterChange('location', e.target.value)}
                            placeholder="Şehir veya Semt..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm transition-all"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Uygun Zamanlar</label>
                    <div className="grid grid-cols-2 gap-2">
                        {timeOptions.map((time) => (
                            <button
                                key={time}
                                onClick={() => handleTimeToggle(time)}
                                className={`
                  px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border
                  ${filters.availableTimes.includes(time)
                                        ? 'bg-brand-secondary text-white border-brand-secondary shadow-md transform scale-[1.02]'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-secondary/50 hover:bg-gray-50'
                                    }
                `}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerFilterSidebar;
