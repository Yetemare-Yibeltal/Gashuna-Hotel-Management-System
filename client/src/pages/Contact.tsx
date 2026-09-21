import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { HOTEL } from '../config/constants';
import toast from 'react-hot-toast';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Please enter a subject'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormData = z.infer<typeof schema>;

const contactInfo = [
  {
    icon: Phone,
    label: 'Phone',
    value: HOTEL.phone || '+251 XXX XXX XXX',
    href: `tel:${HOTEL.phone}`,
    description: 'Available 24/7 for reservations and inquiries',
  },
  {
    icon: Mail,
    label: 'Email',
    value: HOTEL.email,
    href: `mailto:${HOTEL.email}`,
    description: 'We respond within 2 hours during business hours',
  },
  {
    icon: MapPin,
    label: 'Address',
    value: 'Dangila Kebele 05, End of Addis Kedam Exit',
    href: 'https://maps.google.com/?q=Gashuna+Hotel+Dangla+Ethiopia',
    description: 'Dangla, Awi Zone, Amhara Region, Ethiopia',
  },
  {
    icon: Clock,
    label: 'Hours',
    value: 'Open 24 Hours',
    href: null,
    description: 'Front desk available around the clock',
  },
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    // Simulate email sending — in production connect to a real email service
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log('Contact form submitted:', data);
    setSubmitted(true);
    reset();
    toast.success('Message sent! We will get back to you shortly.');
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-neutral-950">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-amber-600/10 border border-amber-600/20 rounded-full px-4 py-1.5 mb-6">
          <Mail className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Get In Touch</span>
        </div>
        <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          Contact <span className="gradient-text-gold">Gashuna Hotel</span>
        </h1>
        <p className="text-white/50">
          Have a question or want to make a special arrangement? Our team is always happy to help.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              We&apos;re Here to Help
            </h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Whether you want to make a reservation, ask about our services, or plan a special occasion,
              our dedicated team at Gashuna Hotel is ready to assist you every step of the way.
            </p>
          </div>

          <div className="space-y-4">
            {contactInfo.map(({ icon: Icon, label, value, href, description }) => (
              <div key={label} className="glass-card p-5 flex gap-4">
                <div className="p-3 bg-amber-600/10 rounded-xl shrink-0">
                  <Icon className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-0.5">{label}</p>
                  {href ? (

                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel="noreferrer"
                      className="text-sm font-semibold text-white hover:text-amber-400 transition-colors"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-white">{value}</p>
                  )}
                  <p className="text-xs text-white/30 mt-0.5">{description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-5">
            <p className="text-sm font-semibold text-white mb-4">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              <a href={`tel:${HOTEL.phone}`} className="btn-gold text-sm text-center py-2.5">
                Call Now
              </a>
              <a href={`mailto:${HOTEL.email}`} className="btn-outline-gold text-sm text-center py-2.5">
                Send Email
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="glass-card p-8">
          {submitted ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Message Sent!</h3>
              <p className="text-white/50 text-sm">
                Thank you for contacting Gashuna Hotel. We will get back to you within 2 hours.
              </p>
              <Button variant="gold" onClick={() => setSubmitted(false)}>
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <h3 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Send Us a Message
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input
                    label="Full Name"
                    placeholder="Your full name"
                    required
                    error={errors.fullName?.message}
                    {...register('fullName')}
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Input
                  label="Phone (optional)"
                  placeholder="+251 9XX XXX XXX"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
                <div className="col-span-2">
                  <Input
                    label="Subject"
                    placeholder="e.g. Room Reservation Inquiry"
                    required
                    error={errors.subject?.message}
                    {...register('subject')}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-white/70 block mb-1.5">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    placeholder="How can we help you?"
                    className="input-field resize-none h-32"
                    {...register('message')}
                  />
                  {errors.message && (
                    <p className="text-xs text-red-400 mt-1">{errors.message.message}</p>
                  )}
                </div>
              </div>
              <Button
                variant="gold"
                fullWidth
                type="submit"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
