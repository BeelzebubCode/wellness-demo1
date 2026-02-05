// ==========================================
// 📌 Admin Component: ConsultantForm
// ==========================================

import { Input } from '@/components/ui';

export interface ConsultantFormData {
  name: string;
  email: string;
  phone: string;
  specialty: string;
}

export interface ConsultantFormProps {
  formData: ConsultantFormData;
  onChange: (data: ConsultantFormData) => void;
}

export function ConsultantForm({ formData, onChange }: ConsultantFormProps) {
  return (
    <div className="space-y-4">
      <Input
        label="ชื่อ-นามสกุล *"
        value={formData.name}
        onChange={(e) => onChange({ ...formData, name: e.target.value })}
        placeholder="กรอกชื่อ-นามสกุล"
      />
      
      <Input
        label="ความเชี่ยวชาญ"
        value={formData.specialty}
        onChange={(e) => onChange({ ...formData, specialty: e.target.value })}
        placeholder="เช่น จิตวิทยาคลินิก, การให้คำปรึกษา"
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="อีเมล"
          type="email"
          value={formData.email}
          onChange={(e) => onChange({ ...formData, email: e.target.value })}
          placeholder="email@example.com"
        />
        
        <Input
          label="โทรศัพท์"
          value={formData.phone}
          onChange={(e) => onChange({ ...formData, phone: e.target.value })}
          placeholder="08x-xxx-xxxx"
        />
      </div>
    </div>
  );
}