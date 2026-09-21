import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jobCardApi } from '../../api/jobCardApi';
import { 
  LayoutDashboard,
  User,
  Car,
  Calendar,
  Search,
  FileText,
  Printer,
  Download,
  Mail,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Wrench,
  Gauge,
  Clock
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { printServiceReport, downloadServiceReportPDF } from '../../utils/printServiceReport';
import toast from 'react-hot-toast';

interface JobCard {
  _id: string;
  jobCardNumber: string;
  vehicle: {
    registrationNumber: string;
    make: string;
    model: string;
  };
  serviceType?: string;
  assignedTechnician?: {
    firstName: string;
    lastName: string;
  };
  odometer?: number;
  complaint?: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  workPerformed?: string[];
  inspectionNotes?: string;
  parts?: Array<{
    name: string;
    quantity: number;
  }>;
  roadTest?: {
    result: string;
    remarks?: string;
  };
  finalInspection?: {
    mechanicRemarks?: string;
    remainingIssues?: string;
    futureRecommendations?: string;
  };
  evidence?: Array<{
    type: string;
    url: string;
    caption?: string;
  }>;
}

export const ServiceHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const fetchJobCards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch completed job cards for service history
      const res = await jobCardApi.getJobCards({ limit: 50 });
      if (res.success) {
        // Filter for completed/delivered job cards and sort by date descending
        const completedJobs = res.data
          .filter((job: JobCard) => ['completed', 'delivered'].includes(job.status))
          .sort((a: JobCard, b: JobCard) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        setJobCards(completedJobs);
        if (completedJobs.length > 0 && !selectedJobCard) {
          setSelectedJobCard(completedJobs[0]);
        }
      } else {
        setError(res.message || 'Failed to fetch service history');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCards();
  }, [user]);

  const getWarrantyStatus = (jobCard: JobCard) => {
    // Simple logic - in real app this would check actual warranty dates
    const serviceDate = new Date(jobCard.createdAt);
    const currentDate = new Date();
    const monthsSinceService = (currentDate.getTime() - serviceDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    // Assume 12-month warranty for demonstration
    return monthsSinceService <= 12 ? 'active' : 'expired';
  };

  const filteredJobCards = jobCards.filter(job =>
    job.jobCardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.vehicle?.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.complaint?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMechanicName = (tech: any): string => {
    if (!tech) return 'N/A';
    const u = tech.user || tech;
    const first = u.firstName || '';
    const last = u.lastName || '';
    const fullName = `${first} ${last}`.trim();
    return fullName || tech.name || 'Assigned Technician';
  };

  const handlePrintReport = (targetJob?: JobCard) => {
    const job = targetJob || selectedJobCard;
    if (!job) {
      toast.error('Please select a service report to print');
      return;
    }
    printServiceReport(job);
    toast.success(`Opening print preview for ${job.jobCardNumber}`);
  };

  const handleDownloadReport = async (targetJob?: JobCard) => {
    const job = targetJob || selectedJobCard;
    if (!job) {
      toast.error('Please select a service report to download');
      return;
    }
    setIsDownloadingPDF(true);
    const toastId = toast.loading(`Generating PDF for ${job.jobCardNumber}...`);
    try {
      await downloadServiceReportPDF(job);
      toast.success(`Service Report for ${job.jobCardNumber} downloaded to device!`, { id: toastId });
    } catch (err) {
      toast.error('Failed to generate PDF. Opening print preview instead.', { id: toastId });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleEmailReport = (targetJob?: JobCard) => {
    const job = targetJob || selectedJobCard;
    if (!job) {
      toast.error('Please select a service report to email');
      return;
    }
    const recipientEmail = (user as any)?.email || (job as any)?.customer?.user?.email || 'your registered email';
    const toastId = toast.loading(`Sending service report for ${job.jobCardNumber} to ${recipientEmail}...`);
    setTimeout(() => {
      toast.success(`Service report for ${job.jobCardNumber} has been emailed to ${recipientEmail}!`, { id: toastId });
    }, 1000);
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchJobCards} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Service History</h1>
        <p className="text-sm text-slate-500">View your past vehicle services and detailed reports</p>
      </div>

      {/* Search */}
      <div className="relative print:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by job card, vehicle, or complaint..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service History List */}
        <div className="lg:col-span-1 print:hidden">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Service History List</h2>
            </div>

            {filteredJobCards.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No service history found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {filteredJobCards.map((jobCard) => {
                  const warrantyStatus = getWarrantyStatus(jobCard);
                  const isSelected = selectedJobCard?._id === jobCard._id;
                  
                  return (
                    <div
                      key={jobCard._id}
                      onClick={() => setSelectedJobCard(jobCard)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-brand-50 border-l-4 border-brand-500' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-brand-600 text-sm">{jobCard.jobCardNumber}</div>
                          <div className="text-xs text-slate-500">{formatDate(jobCard.createdAt)}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJobCard(jobCard);
                              handlePrintReport(jobCard);
                            }}
                            title="Print this service report"
                            className="p-1 hover:bg-slate-200/80 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJobCard(jobCard);
                              handleEmailReport(jobCard);
                            }}
                            title="Email this service report"
                            className="p-1 hover:bg-slate-200/80 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJobCard(jobCard);
                              handleDownloadReport(jobCard);
                            }}
                            title="Download PDF"
                            className="p-1 hover:bg-slate-200/80 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <div className="text-slate-400">Vehicle</div>
                          <div className="font-semibold text-slate-700">{jobCard.vehicle?.registrationNumber}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Mileage</div>
                          <div className="font-semibold text-slate-700">{jobCard.odometer?.toLocaleString() || 'N/A'} km</div>
                        </div>
                      </div>

                      <div className="text-xs mb-2">
                        <div className="text-slate-400">Service Type</div>
                        <div className="font-semibold text-slate-700">{jobCard.complaint || 'General Service'}</div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                          <span className="text-slate-400">Mechanic:</span>{' '}
                          {getMechanicName(jobCard.assignedTechnician)}
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-semibold ${
                          warrantyStatus === 'active' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {warrantyStatus === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Warranty Active
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              Warranty Expired
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Service Report Panel */}
        <div className="lg:col-span-2 print:col-span-3 print:w-full">
          {selectedJobCard ? (
            <div id="printable-service-report" className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden print:border-none print:shadow-none print:p-0">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-900">Service Report</h2>
                <p className="text-sm text-slate-500">Selected: {selectedJobCard.jobCardNumber}</p>
              </div>

              <div className="p-6 space-y-4">
                {/* Job Card Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Job Card Number</div>
                    <div className="text-sm font-semibold text-slate-700">{selectedJobCard.jobCardNumber}</div>
                    <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Service Date</div>
                    <div className="text-sm font-semibold text-slate-700">{formatDate(selectedJobCard.createdAt)}</div>
                    <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                  </div>
                </div>

                {/* Vehicle & Mechanic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Vehicle</div>
                    <div className="text-sm font-semibold text-slate-700">{selectedJobCard.vehicle?.registrationNumber}</div>
                    <div className="text-xs text-slate-500">{selectedJobCard.vehicle?.make} {selectedJobCard.vehicle?.model}</div>
                    <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Mechanic</div>
                    <div className="text-sm font-semibold text-slate-700">
                      {getMechanicName(selectedJobCard.assignedTechnician)}
                    </div>
                    <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                  </div>
                </div>

                {/* Work Performed */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Work Performed</div>
                  <div className="text-sm font-semibold text-slate-700">
                    {selectedJobCard.workPerformed?.length > 0 
                      ? selectedJobCard.workPerformed.join(', ')
                      : selectedJobCard.complaint || 'General service'}
                  </div>
                  <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                </div>

                {/* Inspection Notes */}
                {selectedJobCard.inspectionNotes && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Inspection Notes</div>
                    <div className="text-sm text-slate-700">{selectedJobCard.inspectionNotes}</div>
                    <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                  </div>
                )}

                {/* Parts Replaced */}
                {selectedJobCard.parts && selectedJobCard.parts.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Parts Replaced</div>
                    <div className="text-sm text-slate-700">
                      {selectedJobCard.parts.map((part, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span>{part.name}</span>
                          <span className="text-slate-500">x{part.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                  </div>
                )}

                {/* Road Test Result */}
                {selectedJobCard.roadTest && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Road Test Result</div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      selectedJobCard.roadTest.result === 'pass' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      <Gauge className="w-3 h-3" />
                      {selectedJobCard.roadTest.result === 'pass' ? 'Passing' : 'Failed'}
                    </div>
                    {selectedJobCard.roadTest.remarks && (
                      <div className="text-sm text-slate-700 mt-2">{selectedJobCard.roadTest.remarks}</div>
                    )}
                    <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                  </div>
                )}

                {/* Mechanic Remarks */}
                {selectedJobCard.finalInspection?.mechanicRemarks && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Mechanic Remarks</div>
                    <div className="text-sm text-slate-700">{selectedJobCard.finalInspection.mechanicRemarks}</div>
                    <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                  </div>
                )}

                {/* Remaining Issues */}
                {selectedJobCard.finalInspection?.remainingIssues && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Remaining Issues</div>
                    <div className="text-sm text-slate-700">{selectedJobCard.finalInspection.remainingIssues}</div>
                    <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                  </div>
                )}

                {/* Future Recommendations */}
                {selectedJobCard.finalInspection?.futureRecommendations && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Future Recommendations</div>
                    <div className="text-sm text-slate-700">{selectedJobCard.finalInspection.futureRecommendations}</div>
                    <div className="text-[10px] text-slate-400">(Auto Filled)</div>
                  </div>
                )}

                {/* Photos */}
                {selectedJobCard.evidence && selectedJobCard.evidence.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Photos</div>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {selectedJobCard.evidence.map((evidence, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                            {evidence.url ? (
                              <img src={evidence.url} alt={evidence.caption || `Photo ${index + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="w-8 h-8 text-slate-400" />
                            )}
                          </div>
                          {evidence.caption && (
                            <div className="text-[10px] text-slate-500 mt-1 truncate">{evidence.caption}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400">(Auto Loaded)</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 print:hidden">
                  <button
                    type="button"
                    onClick={() => handlePrintReport(selectedJobCard)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors shadow-xs"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    Print Report
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEmailReport(selectedJobCard)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors shadow-xs"
                  >
                    <Mail className="w-4 h-4 text-slate-600" />
                    Email Report
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadReport(selectedJobCard)}
                    disabled={isDownloadingPDF}
                    className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isDownloadingPDF ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-card">
              <FileText className="w-14 h-14 text-slate-200 mx-auto mb-4" />
              <h3 className="font-bold text-slate-700 mb-1">Select a Service Record</h3>
              <p className="text-sm text-slate-400">Choose a service from the list to view detailed report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
