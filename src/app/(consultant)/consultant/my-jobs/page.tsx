'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import {
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/cn';

interface Job {
  id: number;
  studentName: string;
  studentId: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  detail: string;
  status: 'ASSIGNED' | 'COMPLETED';
}

export default function ConsultantMyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [note, setNote] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [riskLevel, setRiskLevel] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================
  // Fetch งาน consultant
  // ==========================
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const verifyRes = await fetch('/api/v1/auth/verify-consultant', {
          credentials: 'include',
        });
        if (!verifyRes.ok) throw new Error('unauthorized');

        const verifyData = await verifyRes.json();
        const consultantId = verifyData.account.consultantId;

        const res = await fetch(
          `/api/v1/bookings?consultantId=${consultantId}`,
          { credentials: 'include' }
        );

        const data = await res.json();
        setJobs(data.data || []);
      } catch (err) {
        alert('โหลดงานไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleOpenCompleteModal = (job: Job) => {
    setSelectedJob(job);
    setNote('');
    setNextStep('');
    setRiskLevel(1);
    setIsModalOpen(true);
  };

  const handleSubmitOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/bookings/${selectedJob.id}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, nextStep, riskLevel }),
      });

      if (!res.ok) throw new Error();
      alert('บันทึกสำเร็จ');
      setIsModalOpen(false);
    } catch {
      alert('บันทึกไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">กำลังโหลดงาน...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <FileText className="w-6 h-6 text-indigo-600" />
        งานรับคำปรึกษาของฉัน
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {['UPCOMING', 'HISTORY'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              'px-4 py-2 border-b-2 text-sm',
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500'
            )}
          >
            {tab === 'UPCOMING' ? 'งานที่ต้องทำ' : 'ประวัติ'}
          </button>
        ))}
      </div>

      {/* Jobs */}
      {jobs.map(job => (
        <Card key={job.id} className="p-5">
          <div className="flex justify-between">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                <User className="w-4 h-4" />
                {job.studentName} ({job.studentId})
              </h3>
              <p className="text-sm text-gray-600 flex gap-2">
                <Calendar className="w-4 h-4" />
                {format(new Date(job.date), 'd MMM yyyy', { locale: th })}
                <Clock className="w-4 h-4 ml-2" />
                {format(new Date(job.startTime), 'HH:mm')} -
                {format(new Date(job.endTime), 'HH:mm')}
              </p>
            </div>

            {job.status === 'ASSIGNED' && (
              <Button onClick={() => handleOpenCompleteModal(job)}>
                <CheckCircle className="w-4 h-4 mr-1" />
                บันทึกผล
              </Button>
            )}
          </div>
        </Card>
      ))}

      {/* Modal */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <form
            onSubmit={handleSubmitOutcome}
            className="bg-white p-6 rounded-xl w-full max-w-xl space-y-4"
          >
            <div className="flex justify-between">
              <h3 className="font-bold">บันทึกผลการปรึกษา</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X />
              </button>
            </div>

            <textarea
              required
              className="w-full border p-2"
              placeholder="บันทึกการพูดคุย"
              value={note}
              onChange={e => setNote(e.target.value)}
            />

            <textarea
              className="w-full border p-2"
              placeholder="แนวทางต่อไป"
              value={nextStep}
              onChange={e => setNextStep(e.target.value)}
            />

            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(l => (
                <button
                  type="button"
                  key={l}
                  onClick={() => setRiskLevel(l)}
                  className={cn(
                    'px-3 py-2 border rounded',
                    riskLevel === l && 'bg-indigo-100 border-indigo-500'
                  )}
                >
                  {l}
                </button>
              ))}
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
