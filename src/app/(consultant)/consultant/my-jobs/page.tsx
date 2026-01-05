'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui'; // ปรับ import ตาม UI library ของคุณ
import { Calendar, Clock, User, FileText, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

// Type จำลองตาม Schema
interface Job {
  id: number;
  studentName: string;
  studentId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  category: string;
  detail: string;
  status: 'ASSIGNED' | 'COMPLETED';
}

export default function ConsultantMyJobsPage() {
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [note, setNote] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [riskLevel, setRiskLevel] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock Data (ของจริงต้อง Fetch จาก API)
  const jobs: Job[] = [
    {
      id: 101,
      studentName: 'นิสิต ทดสอบ1',
      studentId: '63000001',
      date: new Date(),
      startTime: new Date(new Date().setHours(10, 0)),
      endTime: new Date(new Date().setHours(11, 0)),
      category: 'ความเครียด/วิตกกังวล',
      detail: 'รู้สึกเครียดจากการเรียน ใกล้สอบ อ่านหนังสือไม่ทัน นอนไม่หลับมา 3 วันแล้ว',
      status: 'ASSIGNED'
    },
    {
      id: 102,
      studentName: 'นิสิต ทดสอบ2',
      studentId: '63000002',
      date: new Date(new Date().setDate(new Date().getDate() + 1)),
      startTime: new Date(new Date().setHours(13, 0)),
      endTime: new Date(new Date().setHours(14, 0)),
      category: 'ความสัมพันธ์',
      detail: 'มีปัญหากับรูมเมท ทะเลาะกันเรื่องความสะอาด',
      status: 'ASSIGNED'
    }
  ];

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
      // เรียก API เพื่อบันทึกผล (ดู code ส่วนที่ 2)
      const res = await fetch(`/api/v1/bookings/${selectedJob.id}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note,
          nextStep,
          riskLevel
        }),
      });

      if (!res.ok) throw new Error('บันทึกไม่สำเร็จ');

      alert('บันทึกผลการให้คำปรึกษาเรียบร้อยแล้ว');
      setIsModalOpen(false);
      // ตรงนี้ควร refresh data ใหม่
    } catch (error) {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          งานรับคำปรึกษาของฉัน
        </h1>
        <p className="text-gray-500 text-sm mt-1">จัดการคิวงานและบันทึกผลการให้คำปรึกษา</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'UPCOMING' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          งานที่ต้องทำ (Upcoming)
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'HISTORY' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          ประวัติการปรึกษา (History)
        </button>
      </div>

      {/* Job List */}
      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="p-5 border-l-4 border-l-indigo-500 hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              
              {/* Left Info */}
              <div className="space-y-3 flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {job.category}
                    </span>
                    <span className="text-xs text-gray-400">ID: {job.id}</span>
                  </div>
                </div>

                <div>
                   <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                     <User className="w-5 h-5 text-gray-400" />
                     {job.studentName} <span className="text-sm font-normal text-gray-500">({job.studentId})</span>
                   </h3>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {format(job.date, 'd MMM yyyy', { locale: th })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {format(job.startTime, 'HH:mm')} - {format(job.endTime, 'HH:mm')}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mt-2">
                  <span className="font-semibold text-gray-700 block mb-1">รายละเอียดเบื้องต้น:</span>
                  "{job.detail}"
                </div>
              </div>

              {/* Right Action */}
              <div className="flex flex-col justify-center items-end min-w-[150px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                {activeTab === 'UPCOMING' ? (
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => handleOpenCompleteModal(job)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    บันทึกผลงาน
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    เสร็จสิ้นแล้ว
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {jobs.length === 0 && (
          <div className="text-center py-10 text-gray-400">ไม่มีรายการงาน</div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">บันทึกผลการให้คำปรึกษา</h3>
                <p className="text-sm text-gray-500">เคส: {selectedJob.studentName}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitOutcome} className="p-6 space-y-6">
              
              {/* Note */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">บันทึกรายละเอียดการพูดคุย (Consultant Note) <span className="text-red-500">*</span></label>
                <textarea 
                  required
                  rows={4}
                  className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="สรุปประเด็นสำคัญที่ได้พูดคุย..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Next Step */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">แนวทางดำเนินการต่อ (Next Step)</label>
                <textarea 
                  rows={2}
                  className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="เช่น นัดติดตามผลอีก 2 สัปดาห์ หรือ แนะนำให้พบจิตแพทย์"
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value)}
                />
              </div>

              {/* Risk Level */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ประเมินระดับความเสี่ยง (Risk Level) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setRiskLevel(level)}
                      className={cn(
                        "py-3 rounded-lg text-sm font-medium border-2 transition-all",
                        riskLevel === level 
                          ? getRiskColor(level, true)
                          : "border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      <span className="block text-lg font-bold">{level}</span>
                      <span className="text-[10px]">{getRiskLabel(level)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                  {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันและปิดงาน'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Functions
function getRiskLabel(level: number) {
  switch (level) {
    case 1: return 'ต่ำมาก';
    case 2: return 'ต่ำ';
    case 3: return 'ปานกลาง';
    case 4: return 'สูง';
    case 5: return 'วิกฤต';
    default: return '';
  }
}

function getRiskColor(level: number, active: boolean) {
  if (!active) return '';
  switch (level) {
    case 1: return 'border-green-500 bg-green-50 text-green-700';
    case 2: return 'border-teal-500 bg-teal-50 text-teal-700';
    case 3: return 'border-yellow-500 bg-yellow-50 text-yellow-700';
    case 4: return 'border-orange-500 bg-orange-50 text-orange-700';
    case 5: return 'border-red-500 bg-red-50 text-red-700';
    default: return '';
  }
}