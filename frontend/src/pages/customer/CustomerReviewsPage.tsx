import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jobCardApi } from '../../api/jobCardApi';
import { reviewApi } from '../../api/reviewApi';
import { 
  Star, 
  StarOff, 
  Calendar, 
  Car, 
  X, 
  Send,
  CheckCircle2
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import toast from 'react-hot-toast';

interface JobCard {
  _id: string;
  jobCardNumber: string;
  vehicle: {
    _id: string;
    registrationNumber: string;
    make: string;
    model: string;
  };
  status: string;
  createdAt: string;
  completedAt?: string;
}

interface Review {
  _id: string;
  reviewId: string;
  jobCard: {
    _id?: string;
    jobCardNumber: string;
  };
  vehicle: {
    registrationNumber: string;
  };
  serviceQuality: number;
  mechanicPerformance: number;
  overallExperience: number;
  comments: string;
  status: string;
  createdAt: string;
}

const StarRating: React.FC<{ 
  rating: number; 
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
}> = ({ rating, onRatingChange, disabled = false }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !disabled && onRatingChange(star)}
          disabled={disabled}
          className={`transition-colors ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {star <= rating ? (
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          ) : (
            <StarOff className="w-6 h-6 text-slate-300" />
          )}
        </button>
      ))}
    </div>
  );
};

export const CustomerReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const [completedJobs, setCompletedJobs] = useState<JobCard[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [selectedJobCard, setSelectedJobCard] = useState<string>('');
  const [serviceQuality, setServiceQuality] = useState(0);
  const [mechanicPerformance, setMechanicPerformance] = useState(0);
  const [overallExperience, setOverallExperience] = useState(0);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchCompletedJobs = async () => {
    try {
      const res = await jobCardApi.getJobCards({ limit: 50 });
      if (res.success) {
        const completed = res.data.filter((job: JobCard) => 
          ['completed', 'delivered'].includes(job.status)
        );
        setCompletedJobs(completed);
      }
    } catch (err) {
      console.error('Failed to fetch completed jobs:', err);
    }
  };

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const customerId = user?.profile?._id || user?._id;
      const res = await reviewApi.getReviews({ customer: customerId, limit: 50 });
      if (res.success) {
        setReviews(res.data);
      } else {
        setError(res.message || 'Failed to fetch reviews');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedJobs();
    fetchReviews();
  }, [user]);

  const handleSubmitReview = async () => {
    if (!selectedJobCard) {
      toast.error('Please select a job card');
      return;
    }
    if (serviceQuality === 0 || mechanicPerformance === 0 || overallExperience === 0) {
      toast.error('Please provide all ratings');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedJob = completedJobs.find(j => j._id === selectedJobCard);
      const res = await reviewApi.createReview({
        jobCard: selectedJobCard,
        vehicle: selectedJob?.vehicle._id || '',
        serviceQuality,
        mechanicPerformance,
        overallExperience,
        comments,
      });

      if (res.success) {
        toast.success('Review submitted successfully');
        // Reset form
        setSelectedJobCard('');
        setServiceQuality(0);
        setMechanicPerformance(0);
        setOverallExperience(0);
        setComments('');
        setShowForm(false);
        // Refresh reviews
        fetchReviews();
      } else {
        toast.error(res.message || 'Failed to submit review');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error submitting review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedJobCard('');
    setServiceQuality(0);
    setMechanicPerformance(0);
    setOverallExperience(0);
    setComments('');
    setShowForm(false);
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getReviewedJobCardIds = () => {
    return reviews.map(r => r.jobCard?._id).filter(Boolean);
  };

  const availableJobs = completedJobs.filter(job => 
    !getReviewedJobCardIds().includes(job._id)
  );

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchReviews} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reviews & Ratings</h1>
        <p className="text-sm text-slate-500">Share your feedback and view your review history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit Review Form */}
        <div>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Submit Review</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Job Card Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Job Card
                </label>
                <select
                  value={selectedJobCard}
                  onChange={(e) => setSelectedJobCard(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  disabled={availableJobs.length === 0}
                >
                  <option value="">Select a completed service</option>
                  {availableJobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.jobCardNumber} - {job.vehicle.registrationNumber} ({formatDate(job.completedAt || job.createdAt)})
                    </option>
                  ))}
                </select>
                {availableJobs.length === 0 && (
                  <p className="text-xs text-slate-500 mt-1">No completed services available for review</p>
                )}
              </div>

              {/* Service Quality */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Service Quality (1-5)
                </label>
                <StarRating 
                  rating={serviceQuality} 
                  onRatingChange={setServiceQuality}
                  disabled={!selectedJobCard}
                />
                {serviceQuality > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {serviceQuality === 1 && 'Poor'}
                    {serviceQuality === 2 && 'Fair'}
                    {serviceQuality === 3 && 'Good'}
                    {serviceQuality === 4 && 'Very Good'}
                    {serviceQuality === 5 && 'Excellent'}
                  </p>
                )}
              </div>

              {/* Mechanic Performance */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Mechanic Performance (1-5)
                </label>
                <StarRating 
                  rating={mechanicPerformance} 
                  onRatingChange={setMechanicPerformance}
                  disabled={!selectedJobCard}
                />
                {mechanicPerformance > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {mechanicPerformance === 1 && 'Poor'}
                    {mechanicPerformance === 2 && 'Fair'}
                    {mechanicPerformance === 3 && 'Good'}
                    {mechanicPerformance === 4 && 'Very Good'}
                    {mechanicPerformance === 5 && 'Excellent'}
                  </p>
                )}
              </div>

              {/* Overall Experience */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Overall Experience (1-5)
                </label>
                <StarRating 
                  rating={overallExperience} 
                  onRatingChange={setOverallExperience}
                  disabled={!selectedJobCard}
                />
                {overallExperience > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {overallExperience === 1 && 'Poor'}
                    {overallExperience === 2 && 'Fair'}
                    {overallExperience === 3 && 'Good'}
                    {overallExperience === 4 && 'Very Good'}
                    {overallExperience === 5 && 'Excellent'}
                  </p>
                )}
              </div>

              {/* Comments */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Comments
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                  disabled={!selectedJobCard}
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Date
                </label>
                <div className="text-sm font-semibold text-slate-700">
                  {formatDate(new Date())}
                </div>
                <div className="text-[10px] text-slate-400">(Current Date)</div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || !selectedJobCard}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  <Star className="w-4 h-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Review History */}
        <div>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Review History</h2>
            </div>

            {reviews.length === 0 ? (
              <div className="p-8 text-center">
                <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No reviews submitted yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {reviews.map((review) => (
                  <div key={review._id} className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        review.status === 'approved' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : review.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                      </div>
                    </div>

                    <div className="text-xs mb-2">
                      <div className="text-slate-400">Vehicle</div>
                      <div className="font-semibold text-slate-700">{review.vehicle?.registrationNumber || 'N/A'}</div>
                    </div>

                    <div className="text-xs mb-3">
                      <div className="text-slate-400">Service</div>
                      <div className="font-semibold text-slate-700">{review.jobCard?.jobCardNumber || 'N/A'}</div>
                    </div>

                    {/* Ratings Display */}
                    <div className="flex gap-3 mb-3 text-lg">
                      <div className="flex flex-col items-center">
                        <span className="text-amber-500">{renderStars(review.serviceQuality)}</span>
                        <span className="text-[10px] text-slate-400 mt-1">Service</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-amber-500">{renderStars(review.mechanicPerformance)}</span>
                        <span className="text-[10px] text-slate-400 mt-1">Mechanic</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-amber-500">{renderStars(review.overallExperience)}</span>
                        <span className="text-[10px] text-slate-400 mt-1">Overall</span>
                      </div>
                    </div>

                    {review.comments && (
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <p className="text-sm text-slate-700 italic">"{review.comments}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
