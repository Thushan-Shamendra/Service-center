import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Users, Clock, TrendingUp, Filter, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { reportApi } from '../../../api/reportApi';
import { hrApi } from '../../../api/hrApi';
import dayjs from 'dayjs';

export const TechnicianProductivityReport: React.FC = () => {
  const navigate = useNavigate();
  
  const [dateFrom, setDateFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [selectedService, setSelectedService] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const [kpiData, setKpiData] = useState({
    totalJobs: 0,
    completedJobs: 0,
    avgJobTime: '0h 0m',
    avgEfficiency: 0
  });

  const [technicianData, setTechnicianData] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const res = await reportApi.getEmployeePerformance({
        startDate: dateFrom,
        endDate: dateTo
      });
      
      if (res.success && res.data) {
        const performanceData = res.data;
        
        // Calculate KPIs
        const totalJobs = performanceData.reduce((sum: number, tech: any) => sum + (tech.totalJobs || 0), 0);
        const completedJobs = performanceData.reduce((sum: number, tech: any) => sum + (tech.completedJobs || 0), 0);
        const avgEfficiencyValue = totalJobs > 0 
          ? (performanceData.reduce((sum: number, tech: any) => sum + ((tech.completedJobs / tech.totalJobs) * 100 || 0), 0) / performanceData.length)
          : 0;
        
        setKpiData({
          totalJobs,
          completedJobs,
          avgJobTime: '4h 35m', // This would need to be calculated from time logs
          avgEfficiency: parseFloat(avgEfficiencyValue.toFixed(1))
        });

        // Transform technician data
        const transformedData = performanceData.map((tech: any) => ({
          name: tech.technicianName || 'Unknown',
          completedJobs: tech.completedJobs || 0,
          hoursWorked: 0, // This would need to be calculated from time logs
          avgTime: '4h', // This would need to be calculated from time logs
          efficiency: tech.totalJobs > 0 ? ((tech.completedJobs / tech.totalJobs) * 100).toFixed(0) : 0
        }));
        
        setTechnicianData(transformedData);
      }
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await hrApi.getHRStats();
      // This would need to be adapted to get actual technician list
      // For now, we'll use the employee performance data
    } catch (error) {
      console.error('Failed to load technicians:', error);
    }
  };

  useEffect(() => {
    fetchReportData();
    fetchTechnicians();
  }, [dateFrom, dateTo]);

  const handleReset = () => {
    setDateFrom(dayjs().startOf('month').format('YYYY-MM-DD'));
    setDateTo(dayjs().format('YYYY-MM-DD'));
    setSelectedTechnician('all');
    setSelectedService('all');
    fetchReportData();
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'bg-emerald-500';
    if (efficiency >= 80) return 'bg-blue-500';
    if (efficiency >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getEfficiencyBarWidth = (efficiency: number) => `${efficiency}%`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/manager/reports/workshop')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Reports / Workshop</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Technician Productivity Report</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Filters</span>
          </div>
          
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          
          <span className="text-slate-400">→</span>
          
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
          
          <select
            value={selectedTechnician}
            onChange={(e) => setSelectedTechnician(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">All Technicians</option>
            {technicianData.map((tech) => (
              <option key={tech.name} value={tech.name.toLowerCase().replace(/\s/g, '-')}>
                {tech.name}
              </option>
            ))}
          </select>
          
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">All Services</option>
            <option value="oil-change">Oil Change</option>
            <option value="brake-service">Brake Service</option>
            <option value="engine-repair">Engine Repair</option>
          </select>
          
          <button className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">
            Apply
          </button>
          
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Loading report data...</div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-brand-600" />
              <span className="text-xs text-slate-500">Total Jobs</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{kpiData.totalJobs}</p>
          </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span className="text-xs text-slate-500">Completed</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{kpiData.completedJobs}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-xs text-slate-500">Avg Job Time</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{kpiData.avgJobTime}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-slate-500">Avg Efficiency</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{kpiData.avgEfficiency}%</p>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">TECHNICIAN PRODUCTIVITY</h3>
        
        {/* Bar Chart Visualization */}
        <div className="space-y-4">
          {technicianData.map((tech) => (
            <div key={tech.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">{tech.name}</span>
                <span className="text-sm font-bold text-slate-900">{tech.efficiency}%</span>
              </div>
              <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                <div 
                  className={`h-full ${getEfficiencyColor(tech.efficiency)} rounded-lg transition-all duration-500`}
                  style={{ width: getEfficiencyBarWidth(tech.efficiency) }}
                >
                  <span className="text-xs font-medium text-white px-2 flex items-center h-full">
                    {tech.completedJobs} jobs
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">DETAILED DATA</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Technician</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Jobs</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Hours</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Avg Time</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {technicianData.map((tech) => (
                <tr key={tech.name} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">{tech.name}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{tech.completedJobs}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{tech.hoursWorked}h</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{tech.avgTime}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getEfficiencyColor(tech.efficiency)}`}>
                      {tech.efficiency}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
