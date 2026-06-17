import { createRoute, Link, useSearch } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { useMedplum, useMedplumProfile } from '@medplum/react';
import { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Phone, 
  Printer, 
  QrCode, 
  User,
  ShieldCheck,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { Patient, RelatedPerson } from '@medplum/fhirtypes';

interface EmergencySearch {
  id?: string;
}

function EmergencyPage() {
  const medplum = useMedplum();
  const currentProfile = useMedplumProfile();
  const search = useSearch({ from: '/emergency' }) as EmergencySearch;
  const publicId = search.id;

  const [profile, setProfile] = useState<Patient | null>(null);
  const [contacts, setContacts] = useState<RelatedPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);

  useEffect(() => {
    const loadEmergencyData = async () => {
      try {
        if (publicId) {
          // Public view - fetch the specific patient's public emergency summary
          setIsPublicView(true);
          const patientData = await medplum.readResource('Patient', publicId);
          setProfile(patientData as Patient);
          
          // Search for contacts
          const contactBundle = await medplum.search('RelatedPerson', `patient=Patient/${publicId}`);
          if (contactBundle && contactBundle.entry) {
            const relPersons = contactBundle.entry
              .map((e: any) => e.resource as RelatedPerson)
              .filter((r: any): r is RelatedPerson => !!r);
            setContacts(relPersons);
          }
        } else if (currentProfile) {
          // Standard logged-in view
          setIsPublicView(false);
          const isPatient = currentProfile.resourceType === 'Patient';
          setProfile(
            isPatient
              ? (currentProfile as Patient)
              : ({
                  resourceType: 'Patient',
                  id: currentProfile.id,
                  name: [{ given: ['Practitioner/Admin'], family: currentProfile?.meta?.project }]
                } as Patient)
          );
          
          const contactBundle = await medplum.search('RelatedPerson', `patient=${currentProfile.resourceType}/${currentProfile.id}`);
          if (contactBundle && contactBundle.entry) {
            const relPersons = contactBundle.entry
              .map((e: any) => e.resource as RelatedPerson)
              .filter((r: any): r is RelatedPerson => !!r);
            setContacts(relPersons);
          }
        }
      } catch (err) {
        console.error('Error loading emergency data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEmergencyData();
  }, [medplum, currentProfile, publicId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-rose-400 font-display animate-pulse">Loading emergency card...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-16 flex flex-col items-center gap-4">
        <AlertTriangle className="w-16 h-16 text-rose-500" />
        <h3 className="font-display font-bold text-xl text-slate-100">No Patient Profile Loaded</h3>
        <p className="text-slate-400 text-xs">
          Please sign in to view your card, or scan a valid emergency QR code.
        </p>
        <Link
          to="/"
          id="btn_emergency_back_home"
          className="mt-4 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
        >
          Go Back Home
        </Link>
      </div>
    );
  }

  const patientName = profile.name?.[0]
    ? `${profile.name[0].given?.join(' ') || ''} ${profile.name[0].family || ''}`.trim()
    : 'Valued Patient';

  // Blood Type and Allergies mapping from FHIR extensions
  const bloodTypeExtension = profile.extension?.find(
    (e: any) => e.url === 'http://hl7.org/fhir/StructureDefinition/patient-bloodType' || e.url?.includes('bloodType')
  );
  const bloodType = bloodTypeExtension?.valueString || 'O+';

  const allergyExtension = profile.extension?.find(
    (e: any) => e.url?.includes('allergy') || e.url?.includes('allergies')
  );
  const allergies = allergyExtension?.valueString || 'None reported';

  const conditionExtension = profile.extension?.find(
    (e: any) => e.url?.includes('condition') || e.url?.includes('medical-conditions')
  );
  const keyConditions = conditionExtension?.valueString || 'None reported';

  const medicationExtension = profile.extension?.find(
    (e: any) => e.url?.includes('medication') || e.url?.includes('active-medications')
  );
  const medications = medicationExtension?.valueString || 'None reported';

  // Construct sharing link
  const origin = window.location.origin;
  const qrShareLink = `${origin}/emergency?id=${profile.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrShareLink)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Header (Hide when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          {isPublicView && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold mb-3 uppercase tracking-wider">
              First Responder Read-Only View
            </span>
          )}
          <h2 className="text-3xl font-extrabold font-display tracking-tight text-slate-100">Emergency Medical Profile</h2>
          <p className="text-slate-400 text-sm mt-1">This profile displays critical health details in case of emergency.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            id="btn_print_emergency"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Profile</span>
          </button>
        </div>
      </div>

      {/* Grid: Card vs Information */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        
        {/* Printable/Visual Emergency Card - Span 2 */}
        <div className="md:col-span-2 flex flex-col gap-6 items-center">
          
          {/* Visual Plastic Medical Card layout */}
          <div className="w-full max-w-sm aspect-[1.586/1] bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-950 rounded-3xl border border-rose-500/30 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            {/* Holographic glowing overlays */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl"></div>
            
            {/* Card Top */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-4 h-4 fill-rose-500/20" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs tracking-tight text-slate-100">EMERGENCY CARD</h4>
                  <span className="text-[8px] text-rose-400 font-bold tracking-widest uppercase">HersiHealth Wallet</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-slate-500 font-bold uppercase">Blood Type</span>
                <span className="text-xl font-black text-rose-500 font-display leading-none mt-0.5">{bloodType}</span>
              </div>
            </div>

            {/* Card Middle */}
            <div className="my-2">
              <h3 className="font-display font-bold text-lg text-slate-100 truncate">{patientName}</h3>
              <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wide">Allergies: <span className="text-rose-400 font-semibold">{allergies}</span></p>
            </div>

            {/* Card Bottom */}
            <div className="flex items-end justify-between border-t border-slate-800/80 pt-3">
              <div className="text-[8px] text-slate-500">
                <p>Gender: {profile.gender || 'N/A'}</p>
                <p className="mt-0.5">DOB: {profile.birthDate || 'N/A'}</p>
              </div>
              
              <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded text-[8px] font-bold text-rose-400">
                <ShieldCheck className="w-3 h-3" />
                <span>FHIR Certified</span>
              </div>
            </div>
          </div>

          {/* QR Code generator - for scanning in emergency (Hide when printing) */}
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-slate-800/80 flex flex-col items-center gap-4 text-center print:hidden">
            <h4 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
              <QrCode className="w-4.5 h-4.5 text-teal-400" />
              Scan for First Responders
            </h4>
            <p className="text-slate-500 text-[10px] leading-relaxed max-w-[240px]">
              Doctors and EMTs can scan this code to access your medical information instantly, without requiring credentials.
            </p>
            <div className="w-40 h-40 bg-white p-2.5 rounded-2xl shadow-lg border border-slate-800">
              <img src={qrCodeUrl} alt="Emergency QR Code" className="w-full h-full" />
            </div>
            <code className="text-[9px] text-teal-400 bg-slate-950 px-2 py-1 rounded font-mono truncate max-w-full">
              {qrShareLink.slice(0, 40)}...
            </code>
          </div>
        </div>

        {/* Detailed Vitals/Emergency Information - Span 3 */}
        <div className="md:col-span-3 flex flex-col gap-6">
          {/* Medical Indicators Card */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800/80 flex flex-col gap-6">
            <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-4">
              <Activity className="w-5.5 h-5.5 text-rose-500" />
              Critical Medical Information
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Allergies details */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Allergies & Reactions</span>
                <div className="p-3.5 bg-rose-500/5 rounded-2xl border border-rose-500/20 text-sm font-semibold text-rose-400">
                  {allergies}
                </div>
              </div>

              {/* Conditions details */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Chronic/Key Conditions</span>
                <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-sm font-semibold text-slate-300">
                  {keyConditions}
                </div>
              </div>

              {/* Medications details */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Medications</span>
                <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-sm font-semibold text-slate-300">
                  {medications}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contacts Card */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800/80 flex flex-col gap-6">
            <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-4">
              <Phone className="w-5 h-5 text-teal-400" />
              Emergency Contacts (Related Person)
            </h3>

            {contacts.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center gap-2 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                <User className="w-8 h-8 text-slate-700" />
                <p>No emergency contacts recorded in Medplum.</p>
                {!isPublicView && (
                  <Link
                    to="/share"
                    id="link_add_emergency_contact"
                    className="text-xs text-teal-400 hover:text-teal-300 font-semibold"
                  >
                    Go to sharing settings
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {contacts.map((contact) => {
                  const contactName = contact.name?.[0]
                    ? `${contact.name[0].given?.join(' ') || ''} ${contact.name[0].family || ''}`.trim()
                    : 'Emergency Contact';
                  const contactPhone = contact.telecom?.find((t: any) => t.system === 'phone')?.value || 'N/A';
                  const contactRelation = contact.relationship?.[0]?.text || 'Contact';

                  return (
                    <div 
                      key={contact.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{contactName}</p>
                          <span className="text-[10px] text-teal-400 font-bold uppercase">{contactRelation}</span>
                        </div>
                      </div>
                      <a 
                        href={`tel:${contactPhone}`}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl transition-all"
                      >
                        <Phone className="w-3.5 h-3.5 text-teal-400" />
                        <span>{contactPhone}</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const emergencyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/emergency',
  validateSearch: (search: Record<string, unknown>): EmergencySearch => {
    return {
      id: (search.id as string) || undefined,
    };
  },
  component: EmergencyPage,
});

export { emergencyRoute };
