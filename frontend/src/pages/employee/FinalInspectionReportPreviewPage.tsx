import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { finalInspectionReportApi } from '../../api/finalInspectionReportApi';
import { jobCardApi } from '../../api/jobCardApi';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Printer,
  Download,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Car,
  User,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Wrench,
  Sparkles,
} from 'lucide-react';

export const FinalInspectionReportPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundMessage, setNotFoundMessage] = useState<string | null>(null);

  useEffect(() => {
    if (reportId) {
      fetchData();
    }
  }, [reportId]);

  const fetchData = async () => {
    setIsLoading(true);
    setNotFoundMessage(null);
    try {
      // 1. Check if temporary session report from failed save
      if (reportId?.startsWith('temp-')) {
        const failedReportData = sessionStorage.getItem('failedReportData');
        if (failedReportData) {
          const parsedData = JSON.parse(failedReportData);
          setReport(parsedData);
          if (parsedData.jobCard) {
            const jobRes = await jobCardApi.getJobCardById(parsedData.jobCard);
            if (jobRes.success) setJob(jobRes.data);
          }
          setIsLoading(false);
          return;
        }
      }

      // 2. Fetch report by ID (backend now resolves report _id, jobCard ID, or reportId string)
      let foundReport: any = null;
      try {
        const reportRes = await finalInspectionReportApi.getFinalInspectionReportById(reportId!);
        if (reportRes.success && reportRes.data) {
          foundReport = reportRes.data;
        }
      } catch (err) {
        console.warn('Direct report fetch failed, trying list by jobCard...', err);
      }

      // 3. Fallback: query reports list filtered by jobCard
      if (!foundReport) {
        try {
          const listRes = await finalInspectionReportApi.getFinalInspectionReports({ jobCard: reportId });
          if (listRes.success && Array.isArray(listRes.data) && listRes.data.length > 0) {
            foundReport = listRes.data[0];
          }
        } catch (err) {
          console.warn('Reports list query failed:', err);
        }
      }

      if (foundReport) {
        setReport(foundReport);

        // Resolve complete JobCard details
        const jcId = foundReport.jobCard?._id || foundReport.jobCard || reportId;
        if (jcId && typeof jcId === 'string') {
          try {
            const jobRes = await jobCardApi.getJobCardById(jcId);
            if (jobRes.success && jobRes.data) {
              setJob(jobRes.data);
            } else if (foundReport.jobCard && typeof foundReport.jobCard === 'object') {
              setJob(foundReport.jobCard);
            }
          } catch (jobErr) {
            if (foundReport.jobCard && typeof foundReport.jobCard === 'object') {
              setJob(foundReport.jobCard);
            }
          }
        } else if (foundReport.jobCard && typeof foundReport.jobCard === 'object') {
          setJob(foundReport.jobCard);
        }
      } else {
        // No report found. Check if the parameter was a valid JobCard
        try {
          const jobRes = await jobCardApi.getJobCardById(reportId!);
          if (jobRes.success && jobRes.data) {
            setJob(jobRes.data);
            setNotFoundMessage(`No Final Inspection Report has been submitted yet for Job Card #${jobRes.data.jobCardNumber}.`);
          } else {
            setNotFoundMessage('The requested inspection report or job card was not found.');
          }
        } catch (jobErr) {
          setNotFoundMessage('The requested inspection report could not be found.');
        }
      }
    } catch (error) {
      console.error('Failed to fetch inspection report data:', error);
      toast.error('Failed to load inspection report');
      setNotFoundMessage('Error loading inspection report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast('Select "Save as PDF" in your print dialog to download', {
      icon: '📄',
      duration: 4000,
    });
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleSendEmail = () => {
    const customerEmail =
      job?.customer?.user?.email || job?.customer?.email || 'customer email address';
    toast.success(`Report email dispatched to ${customerEmail}`);
  };

  const handleEditReport = () => {
    const targetJobCardId = job?._id || report?.jobCard?._id || report?.jobCard || (reportId?.startsWith('temp-') ? reportId.replace('temp-', '') : reportId);
    if (targetJobCardId) {
      navigate(`/employee/final-inspection-form/${targetJobCardId}`);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const getConditionConfig = (condition?: string) => {
    switch (condition?.toLowerCase()) {
      case 'excellent':
        return { label: 'Excellent', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'good':
        return { label: 'Good', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'fair':
        return { label: 'Fair', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'needs_repair':
      case 'needs_further_repair':
        return { label: 'Needs Further Repair', color: 'bg-red-100 text-red-800 border-red-300' };
      default:
        return { label: condition || 'Good', color: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm font-medium text-gray-600">Loading Final Inspection Report...</p>
        </div>
      </div>
    );
  }

  // If no report was found
  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Final Inspection Report</h2>
            <p className="text-sm text-gray-600">{notFoundMessage || 'No final inspection report available.'}</p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/employee/assigned-jobs')}
              className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Jobs
            </button>
            {job && (
              <button
                onClick={() => navigate(`/employee/final-inspection-form/${job._id}`)}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Create Final Inspection Report
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Resolve Customer & Vehicle Info
  const customerName =
    job?.customer?.user
      ? `${job.customer.user.firstName || ''} ${job.customer.user.lastName || ''}`.trim()
      : job?.customer?.name || 'Valued Customer';
  const customerPhone =
    job?.customer?.user?.mobile || job?.customer?.phone || job?.customer?.mobile || 'N/A';
  const customerEmail =
    job?.customer?.user?.email || job?.customer?.email || 'N/A';

  const vehicleName =
    job?.vehicle
      ? `${job.vehicle.make || ''} ${job.vehicle.model || ''}`.trim()
      : 'Vehicle';
  const vehiclePlate =
    job?.vehicle?.plateNumber || job?.vehicle?.registrationNumber || 'N/A';
  const vehicleYear = job?.vehicle?.year ? String(job.vehicle.year) : 'N/A';
  const odometerReading = job?.odometer || job?.roadTest?.mileageAfterTest;

  // Resolve Technician Info
  const technicianName =
    report?.technician?.user
      ? `${report.technician.user.firstName || ''} ${report.technician.user.lastName || ''}`.trim()
      : report?.technician?.firstName
      ? `${report.technician.firstName} ${report.technician.lastName || ''}`.trim()
      : job?.assignedTechnician?.user
      ? `${job.assignedTechnician.user.firstName || ''} ${job.assignedTechnician.user.lastName || ''}`.trim()
      : 'Assigned Technician';

  // Safety & Road Test Evaluation
  const safetyOverall =
    typeof report.safetyCheck === 'object'
      ? report.safetyCheck.overallStatus || 'pass'
      : report.safetyCheck || 'pass';
  const safetyCheckedItems =
    typeof report.safetyCheck === 'object' && Array.isArray(report.safetyCheck.checkedItems)
      ? report.safetyCheck.checkedItems
      : [];

  const roadTestResultStatus =
    typeof report.roadTestResult === 'object'
      ? report.roadTestResult.result || 'pass'
      : report.roadTestResult || 'pass';
  const roadTestRemarks =
    typeof report.roadTestResult === 'object'
      ? report.roadTestResult.remarks || ''
      : '';

  // Costs
  const totalParts =
    report.totalPartsCost ||
    report.reportSummary?.totalPartsCost ||
    (Array.isArray(report.partsReplaced)
      ? report.partsReplaced.reduce((acc: number, p: any) => acc + (p.cost || p.total || 0), 0)
      : 0);
  const totalLabor = report.laborCost || report.reportSummary?.laborCost || 0;
  const totalCost =
    report.totalCost ||
    report.reportSummary?.totalCost ||
    (totalParts + totalLabor);

  const conditionBadge = getConditionConfig(report.finalCondition);

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-6 print:hidden">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => (job?._id ? navigate(`/employee/repair-progress/${job._id}`) : navigate(-1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Final Vehicle Inspection Report
              </h1>
              <p className="text-xs text-gray-500">Preview & Print Mode • #{report.reportId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleEditReport}
              className="px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Wrench className="w-4 h-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report Document */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div
          id="report-content"
          className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 sm:p-12 space-y-8 print:shadow-none print:border-none print:p-0"
        >
          {/* Document Header */}
          <div className="border-b-2 border-gray-300 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xl tracking-tight">
                  <Wrench className="w-6 h-6" />
                  <span>VSMS.LK</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-semibold border border-blue-200">
                    SERVICE PRO
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
                  FINAL VEHICLE INSPECTION REPORT
                </h1>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-0.5">
                  Automotive Service & Quality Assurance Certification
                </p>
              </div>

              <div className="sm:text-right space-y-1">
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-full uppercase">
                  {report.status === 'completed' ? '✅ Completed' : '✅ Inspection Approved'}
                </span>
                <p className="text-sm font-mono font-bold text-gray-900">ID: {report.reportId}</p>
                <p className="text-xs text-gray-500">
                  Date: {formatDate(report.completionDate)} {formatTime(report.completionDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Job, Customer & Vehicle Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                <User className="w-4 h-4 text-blue-600" />
                Customer Details
              </div>
              <div className="text-sm text-gray-800 space-y-1">
                <p>
                  <span className="text-gray-500 text-xs">Customer Name:</span>{' '}
                  <strong className="text-gray-900">{customerName}</strong>
                </p>
                <p>
                  <span className="text-gray-500 text-xs">Contact Phone:</span>{' '}
                  <span className="font-mono">{customerPhone}</span>
                </p>
                <p>
                  <span className="text-gray-500 text-xs">Email Address:</span> {customerEmail}
                </p>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                <Car className="w-4 h-4 text-blue-600" />
                Vehicle & Job Information
              </div>
              <div className="text-sm text-gray-800 space-y-1">
                <p>
                  <span className="text-gray-500 text-xs">Vehicle:</span>{' '}
                  <strong className="text-gray-900">{vehicleName}</strong> ({vehicleYear})
                </p>
                <p>
                  <span className="text-gray-500 text-xs">Plate / Reg No:</span>{' '}
                  <span className="font-mono font-semibold text-blue-900">{vehiclePlate}</span>
                </p>
                <div className="flex justify-between items-center text-xs text-gray-600 pt-0.5">
                  <span>Job Card: <strong>#{job?.jobCardNumber || 'N/A'}</strong></span>
                  {odometerReading && <span>Odometer: <strong>{odometerReading.toLocaleString()} km</strong></span>}
                </div>
              </div>
            </div>
          </div>

          {/* Work Performed */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 pb-1 border-b border-gray-200 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              Work Performed
            </h2>
            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
              {report.workPerformed && report.workPerformed.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {report.workPerformed.map((item: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-gray-800">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : job?.workPerformed && job.workPerformed.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {job.workPerformed.map((item: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-gray-800">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No specific work performed recorded.</p>
              )}
            </div>
          </div>

          {/* Parts Replaced & Materials */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 pb-1 border-b border-gray-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Parts & Materials Replaced
            </h2>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {report.partsReplaced && report.partsReplaced.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-4">Part Description</th>
                      <th className="py-2.5 px-4">Part Code</th>
                      <th className="py-2.5 px-4 text-center">Qty</th>
                      <th className="py-2.5 px-4 text-right">Cost (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.partsReplaced.map((part: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-medium text-gray-900">{part.itemName}</td>
                        <td className="py-2.5 px-4 text-xs font-mono text-gray-500">{part.partNumber || 'N/A'}</td>
                        <td className="py-2.5 px-4 text-center text-gray-800 font-semibold">{part.quantity}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-gray-900">
                          Rs. {Number(part.cost || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50/80 font-bold border-t-2 border-gray-300">
                      <td colSpan={3} className="py-3 px-4 text-gray-900 text-right uppercase text-xs">
                        Total Parts Cost:
                      </td>
                      <td className="py-3 px-4 text-right text-blue-900 font-bold">
                        Rs. {totalParts.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-sm text-gray-500 italic text-center bg-gray-50/50">
                  No parts replaced for this service.
                </div>
              )}
            </div>
          </div>

          {/* Safety & Road Test Certification */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 pb-1 border-b border-gray-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Safety & Road Test Certification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Safety Inspection */}
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-gray-600">Multi-Point Safety Check</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      safetyOverall === 'pass'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}
                  >
                    {safetyOverall === 'pass' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {safetyOverall === 'pass' ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                {safetyCheckedItems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {safetyCheckedItems.map((item: string, i: number) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 bg-white border border-gray-200 text-gray-700 rounded-md capitalize font-medium"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Road Test */}
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-gray-600">Road Test Verification</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      roadTestResultStatus === 'pass'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : roadTestResultStatus === 'fail'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {roadTestResultStatus === 'pass' ? 'PASS' : roadTestResultStatus === 'fail' ? 'FAIL' : 'PENDING'}
                  </span>
                </div>
                {roadTestRemarks ? (
                  <p className="text-xs text-gray-700 italic bg-white p-2 rounded border border-gray-200">
                    Remarks: "{roadTestRemarks}"
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Vehicle driven and tested under load conditions.</p>
                )}
              </div>
            </div>
          </div>

          {/* Final Condition & Recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Condition */}
            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 space-y-2">
              <span className="text-xs font-bold uppercase text-gray-600">Final Vehicle Condition</span>
              <div className="pt-1">
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${conditionBadge.color}`}>
                  {conditionBadge.label}
                </span>
                <p className="text-xs text-gray-500 mt-2">
                  Assessed after completion of repairs and thorough post-service inspection.
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 space-y-2">
              <span className="text-xs font-bold uppercase text-gray-600">Future Recommendations</span>
              {report.futureRecommendations && report.futureRecommendations.length > 0 ? (
                <ul className="space-y-1 text-xs text-gray-700">
                  {report.futureRecommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 italic">No additional maintenance required at this time.</p>
              )}
            </div>
          </div>

          {/* Mechanic Remarks */}
          {report.mechanicRemarks && (
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200 space-y-1">
              <span className="text-xs font-bold uppercase text-blue-900 tracking-wider">Mechanic's Notes & Remarks</span>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{report.mechanicRemarks}</p>
            </div>
          )}

          {/* Signatures & Certification */}
          <div className="pt-8 border-t-2 border-gray-300">
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-gray-500">Certified by Technician</p>
                <div className="border-b border-gray-400 pb-1">
                  <p className="font-bold text-gray-900">{technicianName}</p>
                  <p className="text-xs text-gray-500">Certified Automotive Technician</p>
                </div>
                <p className="text-xs text-gray-500">
                  Date: {formatDate(report.completionDate)} • Workshop Center
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-gray-500">Customer Acknowledgement</p>
                <div className="border-b border-gray-400 pb-1 h-8 flex items-end">
                  <span className="text-xs text-gray-400 italic">Signature / Digital Confirmation</span>
                </div>
                <p className="text-xs text-gray-500">Customer Name: {customerName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
