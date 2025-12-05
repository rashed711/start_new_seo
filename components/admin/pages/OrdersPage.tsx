import React from 'react';
import type { Language, RestaurantInfo, Order, User, OrderType, Role } from '../../../types';
import { FilterIcon, ChevronUpIcon, ChevronDownIcon, SearchIcon } from '../../icons/Icons';
import { OrderCard } from '../OrderCard';
import { formatNumber } from '../../../utils/helpers';
import { useUI } from '../../../contexts/UIContext';

interface OrdersPageProps {
    isOrderFilterExpanded: boolean;
    setIsOrderFilterExpanded: React.Dispatch<React.SetStateAction<boolean>>;
    orderSearchTerm: string;
    setOrderSearchTerm: (term: string) => void;
    activeDateFilter: string;
    setDateFilter: (filter: 'today' | 'yesterday' | 'week' | 'month' | 'custom') => void;
    startDate: string;
    handleStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    endDate: string;
    handleEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    orderFilterType: 'all' | 'Dine-in' | 'Delivery' | 'Takeaway';
    setOrderFilterType: (type: 'all' | 'Dine-in' | 'Delivery' | 'Takeaway') => void;
    orderFilterCreator: string;
    setOrderFilterCreator: (creator: string) => void;
    orderCreators: User[];
    restaurantInfo: RestaurantInfo;
    filteredOrders: Order[];
}

export const OrdersPage: React.FC<OrdersPageProps> = (props) => {
    const { t, language } = useUI();
    const {
        isOrderFilterExpanded, setIsOrderFilterExpanded, orderSearchTerm, setOrderSearchTerm,
        activeDateFilter, setDateFilter, startDate, handleStartDateChange, endDate, handleEndDateChange,
        orderFilterType, setOrderFilterType, orderFilterCreator, setOrderFilterCreator, orderCreators,
        restaurantInfo, filteredOrders
    } = props;

    const dateFilterButtonClasses = (filter: string) => `px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeDateFilter === filter ? 'bg-primary-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`;

    const getStatusColorClass = (color: string) => `text-${color}-500`;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.manageOrders}</h2>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg mb-6 border border-slate-200 dark:border-slate-700">
                <div className="p-4 flex justify-between items-center cursor-pointer select-none" onClick={() => setIsOrderFilterExpanded(!isOrderFilterExpanded)}>
                    <div className="flex items-center gap-2">
                        <FilterIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">{t.filter}</h3>
                    </div>
                    <button className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        {isOrderFilterExpanded ? <ChevronUpIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" /> : <ChevronDownIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />}
                    </button>
                </div>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOrderFilterExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-2 lg:col-span-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.search}</label>
                                <div className="relative">
                                    <input type="text" placeholder={`${t.orderId}, ${t.name}, ${t.mobileNumber}...`} value={orderSearchTerm} onChange={(e) => setOrderSearchTerm(e.target.value)} className="w-full p-2 ps-10 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"/>
                                    <div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"><SearchIcon className="w-5 h-5" /></div>
                                </div>
                            </div>
                            <div className="md:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-2">
                                <button onClick={() => setDateFilter('today')} className={dateFilterButtonClasses('today')}>{t.today}</button>
                                <button onClick={() => setDateFilter('yesterday')} className={dateFilterButtonClasses('yesterday')}>{t.yesterday}</button>
                                <button onClick={() => setDateFilter('week')} className={dateFilterButtonClasses('week')}>{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</button>
                                <button onClick={() => setDateFilter('month')} className={dateFilterButtonClasses('month')}>{t.thisMonth}</button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.startDate}</label>
                                <input type="date" value={startDate} onChange={handleStartDateChange} className="w-full p-2 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.endDate}</label>
                                <input type="date" value={endDate} onChange={handleEndDateChange} className="w-full p-2 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"/>
                            </div>
                            <div className="min-w-[150px]">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.orderType}</label>
                                <select value={orderFilterType} onChange={(e) => setOrderFilterType(e.target.value as any)} className="w-full p-2 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                    <option value="all">{t.all}</option>
                                    <option value="Dine-in">{t.dineIn}</option>
                                    <option value="Takeaway">{t.takeaway}</option>
                                    <option value="Delivery">{t.delivery}</option>
                                </select>
                            </div>
                            {orderCreators.length > 0 && (
                                <div className="min-w-[150px]">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.creator}</label>
                                    <select value={orderFilterCreator} onChange={(e) => setOrderFilterCreator(e.target.value)} className="w-full p-2 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                        <option value="all">{t.all}</option>
                                        {orderCreators.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            <div className="w-full overflow-x-auto pb-4">
              <div className="inline-grid gap-6 min-w-max" style={{ gridTemplateColumns: `repeat(${restaurantInfo.orderStatusColumns.length}, 20rem)` }}>
                  {restaurantInfo.orderStatusColumns.map(col => {
                    const colOrders = filteredOrders.filter(o => o.status === col.id || (col.id === 'cancelled' && o.status === 'refused'));
                    return (
                    <div key={col.id} className="w-80 flex flex-col">
                      <h3 className={`text-lg font-bold flex items-center gap-2 p-3 sticky bg-white dark:bg-slate-800 z-10 border-b-2 border-slate-200 dark:border-slate-700 ${getStatusColorClass(col.color)}`}>
                         {col.name[language]} ({formatNumber(colOrders.length)})
                      </h3>
                      <div className="bg-slate-200/50 dark:bg-slate-900/50 p-2 sm:p-4 rounded-b-lg space-y-4 min-h-[calc(100vh-250px)] flex-grow">
                          {colOrders.map((order, index) => (
                            <OrderCard order={order} key={order.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in-up" />
                          ))}
                          {colOrders.length === 0 && <div className="h-full flex items-center justify-center"><p className="text-center text-slate-500 p-8">No orders.</p></div>}
                      </div>
                    </div>
                    )
                  })}
              </div>
            </div>
        </div>
    );
};
