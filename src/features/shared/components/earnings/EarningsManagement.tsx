import React, { useState, useEffect, useMemo } from 'react';
import {
    Payments as PaymentsIcon,
    TrendingUp as TrendingUpIcon,
    AccountBalanceWallet as WalletIcon,
    FilterList as FilterIcon,
    Download as DownloadIcon,
    AccessTime as PendingIcon,
    CheckCircle as ConfirmedIcon,
    Cancel as CancelledIcon,
    LocalActivity as TicketIcon,
    School as CourseIcon,
    Paid as PaidIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getEarningsData,
    EarningsSummary,
    Transaction
} from '../../../../api/services/earningsService';

interface EarningsManagementProps {
    userId: string;
    role?: 'school' | 'instructor';
    colorVariant?: 'school' | 'instructor' | 'admin';
}

const EarningsManagement: React.FC<EarningsManagementProps> = ({
    userId,
    role = 'school',
    colorVariant = 'school'
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<EarningsSummary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getEarningsData(userId, role);
                setSummary(data.summary);
                setTransactions(data.transactions);
                setError(null);
            } catch (err) {
                console.error('Earnings fetch error:', err);
                setError('Kazanç verileri yüklenirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, role]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const statusMatch = filterStatus === 'all' || t.status === filterStatus;
            const typeMatch = filterType === 'all' || t.type === filterType;
            return statusMatch && typeMatch;
        });
    }, [transactions, filterStatus, filterType]);

    // Simple Area Chart Data Calculation
    const chartData = useMemo(() => {
        if (transactions.length === 0) return [];

        // Group earnings by day for the last 14 days
        const dailyMap = new Map<string, number>();
        const last14Days = [...Array(14)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (13 - i));
            return d.toISOString().split('T')[0];
        });

        last14Days.forEach(date => dailyMap.set(date, 0));

        transactions.forEach(t => {
            const dateKey = t.date.split('T')[0];
            if (dailyMap.has(dateKey) && t.status !== 'cancelled') {
                dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + (t.amount || 0));
            }
        });

        return last14Days.map(date => ({
            date,
            amount: dailyMap.get(date) || 0
        }));
    }, [transactions]);

    const maxAmount = Math.max(...chartData.map(d => d.amount), 1);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${colorVariant === 'instructor' ? 'border-instructor' : 'border-school'}`}></div>
            </div>
        );
    }

    // Define colors based on role
    const themeColors = {
        primary: colorVariant === 'instructor' ? 'instructor' : colorVariant === 'admin' ? 'brand-pink' : 'school',
        text: colorVariant === 'instructor' ? 'text-instructor' : 'text-school',
    };

    return (
        <div className="space-y-6">
            {/* Header & Stats Grid */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Finansal Özet</h2>
                    <p className="text-sm text-slate-500 dark:text-[#cba990]">Kazançlarınızı ve işlem geçmişinizi buradan takip edebilirsiniz.</p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
                >
                    <DownloadIcon fontSize="small" /> Rapor İndir
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Toplam Brüt"
                    value={`₺${summary?.totalGross.toLocaleString('tr-TR')}`}
                    icon={<PaymentsIcon />}
                    trend="+8%"
                    color="blue"
                />
                <StatsCard
                    title="Aylık Kazanç"
                    value={`₺${summary?.monthlyGross.toLocaleString('tr-TR')}`}
                    icon={<TrendingUpIcon />}
                    trend="+12%"
                    color="green"
                />
                <StatsCard
                    title="Bekleyen Tahsilat"
                    value={`₺${summary?.pendingAmount.toLocaleString('tr-TR')}`}
                    icon={<PendingIcon />}
                    color="orange"
                />
                <StatsCard
                    title="Ödenen / Tamamlanan"
                    value={`₺${summary?.paidAmount?.toLocaleString('tr-TR') || 0}`}
                    icon={<PaidIcon />}
                    color="emerald"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-[#231810]/50 p-6 rounded-xl border border-slate-200 dark:border-[#493322] shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <TrendingUpIcon className="text-green-500" /> Son 14 Günlük Performans
                        </h3>
                        <div className="text-xs text-slate-500">Günlük kazanç trendi (₺)</div>
                    </div>

                    <div className="h-48 flex items-end gap-1 md:gap-2">
                        {chartData.map((data, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center group relative">
                                <div
                                    className={`w-full rounded-t-sm transition-all duration-500 ${colorVariant === 'instructor' ? 'bg-instructor/60 group-hover:bg-instructor' : 'bg-school/60 group-hover:bg-school'}`}
                                    style={{ height: `${(data.amount / maxAmount) * 100}%`, minHeight: data.amount > 0 ? '4px' : '0' }}
                                />
                                <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    ₺{data.amount}
                                </div>
                                <div className="text-[9px] mt-2 text-slate-400 rotate-45 origin-left hidden sm:block whitespace-nowrap">
                                    {new Date(data.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-[#231810]/50 rounded-xl border border-slate-200 dark:border-[#493322] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-[#493322] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-semibold text-slate-800 dark:text-white">İşlem Geçmişi</h3>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="text-xs bg-slate-100 dark:bg-white/5 border-none rounded-lg px-3 py-2 outline-none cursor-pointer"
                        >
                            <option value="all">Tüm Tipler</option>
                            <option value="course">Kurs</option>
                            <option value="ticket">Bilet</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="text-xs bg-slate-100 dark:bg-white/5 border-none rounded-lg px-3 py-2 outline-none cursor-pointer"
                        >
                            <option value="all">Tüm Durumlar</option>
                            <option value="confirmed">Onaylandı</option>
                            <option value="pending">Bekliyor</option>
                            <option value="paid">Ödendi</option>
                            <option value="cancelled">İptal</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/5 text-[11px] uppercase tracking-wider text-slate-500 dark:text-[#cba990] font-bold">
                                <th className="px-6 py-3">İşlem / Üye</th>
                                <th className="px-6 py-3">Tip</th>
                                <th className="px-6 py-3">Tarih</th>
                                <th className="px-6 py-3 text-right">Miktar</th>
                                <th className="px-6 py-3 text-center">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#493322]">
                            <AnimatePresence mode="wait">
                                {filteredTransactions.map((tx) => (
                                    <motion.tr
                                        key={tx.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-800 dark:text-white text-sm">
                                                    {tx.itemName}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {tx.studentName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 capitalize text-xs text-slate-500">
                                                {tx.type === 'course' ? (
                                                    <><CourseIcon fontSize="inherit" className="text-blue-500" /> Kurs</>
                                                ) : (
                                                    <><TicketIcon fontSize="inherit" className="text-orange-500" /> Bilet</>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {new Date(tx.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-slate-800 dark:text-white">
                                                ₺{tx.amount.toLocaleString('tr-TR')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <StatusPill status={tx.status} />
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-sm italic">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, icon, trend, color }: any) => {
    const colorMap: any = {
        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
        green: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
        orange: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',
        emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
    };

    return (
        <div className="bg-white dark:bg-[#231810]/50 p-5 rounded-xl border border-slate-200 dark:border-[#493322] shadow-sm transform transition hover:-translate-y-1">
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</div>
                {trend && (
                    <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                        {trend} <TrendingUpIcon style={{ fontSize: 12 }} />
                    </span>
                )}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-[#cba990] mb-1">{title}</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{value}</h3>
        </div>
    );
};

const StatusPill = ({ status }: { status: string }) => {
    const configs: any = {
        confirmed: {
            label: 'Onaylandı',
            classes: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            icon: <ConfirmedIcon sx={{ fontSize: 12 }} />
        },
        pending: {
            label: 'Bekliyor',
            classes: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            icon: <PendingIcon sx={{ fontSize: 12 }} />
        },
        paid: {
            label: 'Ödendi',
            classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            icon: <PaidIcon sx={{ fontSize: 12 }} />
        },
        cancelled: {
            label: 'İptal',
            classes: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            icon: <CancelledIcon sx={{ fontSize: 12 }} />
        }
    };

    const config = configs[status] || configs.pending;

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${config.classes}`}>
            {config.icon} {config.label}
        </span>
    );
};

export default EarningsManagement;
