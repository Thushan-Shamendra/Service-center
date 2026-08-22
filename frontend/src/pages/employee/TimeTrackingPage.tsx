import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { timeTrackingApi } from '../../api/timeTrackingApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Clock,
  Plus,
  Save,
  Calendar,
} from 'lucide-react';

export const TimeTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [assignedJobs, setAssignedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTimeLog, setNewTimeLog] = useState({
    jobCard: '',
    recordDate: new Date().toISOString().split('T')[0],
    inspectionTime: { hours: 0, minutes: 0 },
    repairTime: { hours: 0, minutes: 0 },
    waitingTime: { hours: 0, minutes: 0 },
    testingTime: { hours: 0, minutes: 0 },
    breakTime: { hours: 0, minutes: 0 },
    remarks: '',
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const [logsRes, summaryRes, jobsRes] = await Promise.all([
        timeTrackingApi.getTimeLogs({ date: selectedDate }),
        timeTrackingApi.getDailyTimeSummary(selectedDate),
        jobCardApi.getJobCards({ assignedTechnician: 'current' }),
      ]);

      if (logsRes.data.success) setTimeLogs(logsRes.data.data);
      if (summaryRes.data.success) setDailySummary(summaryRes.data.data);
      if (jobsRes.data.success) setAssignedJobs(jobsRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch time tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTimeLog = async () => {
    if (!newTimeLog.jobCard) {
      toast.error('Please select a job card');
      return;
    }

    setIsSaving(true);
    try {
      const res = await timeTrackingApi.createTimeLog(newTimeLog);
      if (res.data.success) {
        toast.success('Time log saved successfully');
        setShowTimeLogModal(false);
        setNewTimeLog({
          jobCard: '',
          recordDate: new Date().toISOString().split('T')[0],
          inspectionTime: { hours: 0, minutes: 0 },
          repairTime: { hours: 0, minutes: 0 },
          waitingTime: { hours: 0, minutes: 0 },
          testingTime: { hours: 0, minutes: 0 },
          breakTime: { hours: 0, minutes: 0 },
          remarks: '',
        });
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to save time log');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotalTime = (timeObj: { hours: number; minutes: number }) => {
    return timeObj.hours + (timeObj.minutes / 60);
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/employee/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
            <p className="text-sm text-gray-600">Record and review your working time for assigned Job Cards</p>
          </div>
        </div>
        <button
          onClick={() => setShowTimeLogModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Working Time
        </button>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Daily Summary Cards */}
      {dailySummary && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inspection</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatTime(dailySummary.summary.inspection.hours + dailySummary.summary.inspection.minutes / 60)}
                </p>
              </div>
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Repair</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatTime(dailySummary.summary.repair.hours + dailySummary.summary.repair.minutes / 60)}
                </p>
              </div>
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Waiting</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatTime(dailySummary.summary.waiting.hours + dailySummary.summary.waiting.minutes / 60)}
                </p>
              </div>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Testing</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatTime(dailySummary.summary.testing.hours + dailySummary.summary.testing.minutes / 60)}
                </p>
              </div>
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Working</p>
                <p className="text-xl font-bold text-gray-900">{formatTime(dailySummary.summary.total)}</p>
              </div>
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Time Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Today's Time Logs</h2>
        </div>
        {timeLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No time logs recorded for this date</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Log ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Card</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspection</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Repair</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waiting</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Testing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Break</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {timeLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.timeLogId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.jobCard?.jobCardNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatTime(calculateTotalTime(log.inspectionTime))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatTime(calculateTotalTime(log.repairTime))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatTime(calculateTotalTime(log.waitingTime))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatTime(calculateTotalTime(log.testingTime))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatTime(calculateTotalTime(log.breakTime))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatTime(log.totalWorkingHours)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Time Log Modal */}
      {showTimeLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Record Working Time</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Job Card Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Card *</label>
                <select
                  value={newTimeLog.jobCard}
                  onChange={(e) => setNewTimeLog({ ...newTimeLog, jobCard: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Job Card</option>
                  {assignedJobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.jobCardNumber} - {job.vehicle?.make} {job.vehicle?.model}
                    </option>
                  ))}
                </select>
              </div>

              {/* Record Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Record Date</label>
                <input
                  type="date"
                  value={newTimeLog.recordDate}
                  onChange={(e) => setNewTimeLog({ ...newTimeLog, recordDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Time Entries */}
              <div className="space-y-4">
                {[
                  { key: 'inspectionTime', label: 'Inspection Time' },
                  { key: 'repairTime', label: 'Repair Time' },
                  { key: 'waitingTime', label: 'Waiting Time' },
                  { key: 'testingTime', label: 'Testing Time' },
                  { key: 'breakTime', label: 'Break Time' },
                ].map((timeField) => (
                  <div key={timeField.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{timeField.label}</label>
                    <div className="flex space-x-3">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="0"
                          value={typeof newTimeLog[timeField.key as keyof typeof newTimeLog] === 'object' 
                            ? (newTimeLog[timeField.key as keyof typeof newTimeLog] as any)?.hours || 0 
                            : 0}
                          onChange={(e) => setNewTimeLog({
                            ...newTimeLog,
                            [timeField.key]: {
                              ...(typeof newTimeLog[timeField.key as keyof typeof newTimeLog] === 'object' 
                                ? (newTimeLog[timeField.key as keyof typeof newTimeLog] as Record<string, any>) 
                                : { hours: 0, minutes: 0 }),
                              hours: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Hours"
                        />
                        <span className="text-xs text-gray-500">Hours</span>
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={typeof newTimeLog[timeField.key as keyof typeof newTimeLog] === 'object' 
                            ? (newTimeLog[timeField.key as keyof typeof newTimeLog] as any)?.minutes || 0 
                            : 0}
                          onChange={(e) => setNewTimeLog({
                            ...newTimeLog,
                            [timeField.key]: {
                              ...(typeof newTimeLog[timeField.key as keyof typeof newTimeLog] === 'object' 
                                ? (newTimeLog[timeField.key as keyof typeof newTimeLog] as Record<string, any>) 
                                : { hours: 0, minutes: 0 }),
                              minutes: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Minutes"
                        />
                        <span className="text-xs text-gray-500">Minutes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total Working Hours</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatTime(
                      calculateTotalTime(newTimeLog.inspectionTime) +
                      calculateTotalTime(newTimeLog.repairTime) +
                      calculateTotalTime(newTimeLog.waitingTime) +
                      calculateTotalTime(newTimeLog.testingTime) -
                      calculateTotalTime(newTimeLog.breakTime)
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Auto Calculated</p>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={newTimeLog.remarks}
                  onChange={(e) => setNewTimeLog({ ...newTimeLog, remarks: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowTimeLogModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTimeLog}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2 inline" />
                {isSaving ? 'Saving...' : 'Save Time Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};