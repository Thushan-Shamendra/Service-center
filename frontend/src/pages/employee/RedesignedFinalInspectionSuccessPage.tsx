import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Printer,
  Send,
  Eye,
  Calendar,
  User,
  Car,
} from 'lucide-react';

export const RedesignedFinalInspectionSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobCardId } = useParams();

  const handleViewReport = () => {
    navigate(`/employee/final-inspection-preview/${jobCardId}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendCustomer = () => {
    // Implement email sending logic
    alert('Report sent to customer successfully!');
  };

  const handleBackToJobs = () => {
    navigate('/employee/assigned-jobs');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Success Card */}
      <div className="bg-white rounded-2xl border-2 border-green-200 shadow-sm p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ✅ Report Submitted Successfully!
          </h1>
          <p className="text-gray-600">
            Final Inspection Report has been submitted and approved
          </p>
        </div>

        {/* Report Details */}
        <div className="bg-green-50 rounded-xl p-6 border border-green-100 mb-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              ✅ Final Inspection Report
            </h2>
            <p className="text-green-700 font-medium">Submitted & Approved</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Report #</p>
                <p className="font-medium text-gray-900">FR-2026-0842</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium text-gray-900">
                  {new Date().toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">By</p>
                <p className="font-medium text-gray-900">Chamara Silva</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-green-200 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
              <Car className="w-4 h-4 text-green-600" />
              <span className="text-green-800 font-semibold">
                🚗 Vehicle is now READY FOR DELIVERY
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleViewReport}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Eye className="w-4 h-4" />
            📋 View Report
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            <Printer className="w-4 h-4" />
            🖨️ Print
          </button>
          <button
            onClick={handleSendCustomer}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            <Send className="w-4 h-4" />
            📧 Send Customer
          </button>
          <button
            onClick={handleBackToJobs}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            🔄 Back to Job Cards
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedesignedFinalInspectionSuccessPage;