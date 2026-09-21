import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBookingStore } from '../../store/bookingStore';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(9, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  nationality: z.string().min(2, 'Please enter your nationality'),
  idType: z.string().min(1, 'Please select an ID type'),
  idNumber: z.string().min(3, 'Please enter your ID number'),
  specialRequests: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const idTypes = [
  { value: 'kebele_id', label: 'Kebele ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'student_id', label: 'Student ID' },
];

export default function GuestDetailsStep() {
  const { guestDetails, specialRequests, setGuestDetails, setSpecialRequests, nextStep, prevStep } = useBookingStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: guestDetails.fullName,
      phone: guestDetails.phone,
      email: guestDetails.email || '',
      nationality: guestDetails.nationality || 'Ethiopia',
      idType: guestDetails.idType || 'kebele_id',
      idNumber: guestDetails.idNumber || '',
      specialRequests: specialRequests,
    },
  });

  const onSubmit = (data: FormData) => {
    setGuestDetails({
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      nationality: data.nationality,
      idType: data.idType,
      idNumber: data.idNumber,
    });
    setSpecialRequests(data.specialRequests || '');
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          Guest Details
        </h2>
        <p className="text-sm text-white/40">Please provide your information to complete the booking</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Full Name"
            placeholder="e.g. Abebe Tadesse"
            required
            error={errors.fullName?.message}
            {...register('fullName')}
          />
        </div>
        <Input
          label="Phone Number"
          placeholder="+251 9XX XXX XXX"
          required
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="your@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Nationality"
          placeholder="e.g. Ethiopia"
          required
          error={errors.nationality?.message}
          {...register('nationality')}
        />
        <Select
          label="ID Type"
          required
          options={idTypes}
          error={errors.idType?.message}
          {...register('idType')}
        />
        <div className="sm:col-span-2">
          <Input
            label="ID Number"
            placeholder="Enter your ID number"
            required
            error={errors.idNumber?.message}
            {...register('idNumber')}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-white/70 block mb-1.5">
            Special Requests <span className="text-white/30">(optional)</span>
          </label>
          <textarea
            placeholder="Any special requirements or requests..."
            className="input-field resize-none h-24"
            {...register('specialRequests')}
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button variant="ghost" onClick={prevStep} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button variant="gold" fullWidth type="submit" rightIcon={<ArrowRight className="w-4 h-4" />}>
          Continue to Review
        </Button>
      </div>
    </form>
  );
}
