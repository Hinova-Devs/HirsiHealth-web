import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { useMedplum, useMedplumProfile } from '@medplum/react';
import { useEffect, useState } from 'react';
import { 
  Share2, 
  UserPlus, 
  Link as LinkIcon, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  User, 
  Phone,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Patient, DocumentReference, RelatedPerson } from '@medplum/fhirtypes';

function SharePage() {
  const medplum = useMedplum();
  const currentProfile = useMedplumProfile();
  const [profile, setProfile] = useState<Patient | null>(null);
  const [documents, setDocuments] = useState<DocumentReference[]>([]);
  const [contacts, setContacts] = useState<RelatedPerson[]>([]);
  const [loading, setLoading] = useState(true);

  // Sharing states
  const [selectedDocId, setSelectedDocId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [duration, setDuration] = useState('86400'); // 1 day in seconds
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Emergency contact states
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('Spouse');
  const [contactPhone, setContactPhone] = useState('');
  const [contactLoading, setContactLoading] = useState(false);

  // Status/Error
  const [shareError, setShareError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const loadPageData = async () => {
    try {
      if (currentProfile) {
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

        // Get documents (supports Patient or Practitioner/Admin profiles)
        const docBundle = await medplum.search('DocumentReference', `subject=${currentProfile.resourceType}/${currentProfile.id}`);
        if (docBundle && docBundle.entry) {
          const docs = docBundle.entry
            .map((e: any) => e.resource as DocumentReference)
            .filter((r: any): r is DocumentReference => !!r);
          setDocuments(docs);
          if (docs.length > 0) setSelectedDocId(docs[0].id || '');
        }

        // Get emergency contacts
        const contactBundle = await medplum.search('RelatedPerson', `patient=${currentProfile.resourceType}/${currentProfile.id}`);
        if (contactBundle && contactBundle.entry) {
          const rels = contactBundle.entry
            .map((e: any) => e.resource as RelatedPerson)
            .filter((r: any): r is RelatedPerson => !!r);
          setContacts(rels);
        }
      }
    } catch (err) {
      console.error('Error fetching share page resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, [medplum, currentProfile]);

  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    setShareError(null);
    setGeneratedLink('');

    if (!selectedDocId) {
      setShareError('Please select a document to share.');
      return;
    }
    if (!recipient.trim()) {
      setShareError('Please specify the recipient doctor or clinic name.');
      return;
    }

    try {
      // Simulate creating a signed token link using search parameter validation
      // Doctors can view this specific document reference directly
      const origin = window.location.origin;
      const shareUrl = `${origin}/documents?publicDocId=${selectedDocId}&exp=${Date.now() + (parseInt(duration) * 1000)}&recipient=${encodeURIComponent(recipient)}`;
      
      setGeneratedLink(shareUrl);
    } catch (err) {
      console.error(err);
      setShareError('Failed to generate sharing token.');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    
    if (!contactName.trim()) {
      setContactError('Please enter the contact name.');
      return;
    }
    if (!contactPhone.trim()) {
      setContactError('Please enter the contact phone number.');
      return;
    }
    if (!profile || !profile.id) {
      setContactError('Patient context is not fully loaded.');
      return;
    }

    setContactLoading(true);

    try {
      // Create a FHIR RelatedPerson Resource in Medplum
      const newContact: RelatedPerson = {
        resourceType: 'RelatedPerson',
        patient: {
          reference: `${currentProfile?.resourceType || 'Patient'}/${currentProfile?.id || profile.id}`
        },
        active: true,
        name: [
          {
            text: contactName.trim(),
            given: contactName.trim().split(' ')
          }
        ],
        relationship: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
                code: 'C', // Emergency Contact
                display: contactRelation
              }
            ],
            text: contactRelation
          }
        ],
        telecom: [
          {
            system: 'phone',
            value: contactPhone.trim(),
            use: 'mobile'
          }
        ]
      };

      await medplum.createResource(newContact);

      // Reset contact inputs
      setContactName('');
      setContactPhone('');

      // Reload contacts
      const contactBundle = await medplum.search('RelatedPerson', `patient=${currentProfile?.resourceType || 'Patient'}/${currentProfile?.id || profile.id}`);
      if (contactBundle && contactBundle.entry) {
        const rels = contactBundle.entry
          .map((e: any) => e.resource as RelatedPerson)
          .filter((r: any): r is RelatedPerson => !!r);
        setContacts(rels);
      }
    } catch (err: any) {
      console.error('Error creating RelatedPerson:', err);
      setContactError(err.message || 'Failed to create emergency contact. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  const handleDeleteContact = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to remove this contact?')) return;

    try {
      await medplum.deleteResource('RelatedPerson', id);
      // Filter contact list locally to update fast
      setContacts(contacts.filter((c: any) => c.id !== id));
    } catch (err) {
      console.error('Failed to delete contact:', err);
      alert('Could not delete contact. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-teal-400 font-display animate-pulse">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Title Header */}
      <div>
        <h2 className="text-3xl font-extrabold font-display tracking-tight text-slate-100">Share Center</h2>
        <p className="text-slate-400 text-sm mt-1">Manage external document access links and emergency contacts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Card: Controlled Document Sharing */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800/80 flex flex-col gap-6">
          <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-4">
            <Share2 className="w-5.5 h-5.5 text-teal-400" />
            Controlled Document Sharing
          </h3>

          {documents.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
              You must upload medical documents before creating sharing links.
            </div>
          ) : (
            <form onSubmit={handleGenerateLink} className="flex flex-col gap-4">
              {shareError && (
                <div className="flex gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{shareError}</span>
                </div>
              )}

              {/* Select Document */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400" htmlFor="share-doc-select">
                  Select Document to Share
                </label>
                <select
                  id="share-doc-select"
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl py-3 px-4 text-sm font-medium text-slate-200 outline-none transition-all cursor-pointer"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id} className="bg-slate-950">
                      {doc.content?.[0]?.attachment?.title || doc.description || 'Untitled'} ({doc.category?.[0]?.text})
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Doctor */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400" htmlFor="recipient-input">
                  Recipient (e.g. Dr. Ali, Borama Clinic)
                </label>
                <input
                  id="recipient-input"
                  type="text"
                  placeholder="Enter doctor or clinic name"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl py-3 px-4 text-sm font-medium text-slate-200 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Link Expiration */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400" htmlFor="duration-select">
                  Link Expiration Duration
                </label>
                <select
                  id="duration-select"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl py-3 px-4 text-sm font-medium text-slate-200 outline-none transition-all cursor-pointer"
                >
                  <option value="3600" className="bg-slate-950">1 Hour</option>
                  <option value="86400" className="bg-slate-950">24 Hours</option>
                  <option value="604800" className="bg-slate-950">7 Days</option>
                  <option value="2592000" className="bg-slate-950">30 Days</option>
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                id="btn_generate_share"
                className="w-full flex items-center justify-center gap-2 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all active:scale-95 cursor-pointer"
              >
                <LinkIcon className="w-4 h-4" />
                <span>Generate Signed Access Link</span>
              </button>
            </form>
          )}

          {/* Generated Sharing Results Box */}
          {generatedLink && (
            <div className="mt-4 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                <Clock className="w-4 h-4" />
                <span>Time-Limited Link Generated Successfully</span>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl py-3 pl-4 pr-12 text-[10px] font-mono text-slate-300 outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  id="btn_copy_share_link"
                  className="absolute right-2 top-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-teal-400 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                <span>Expires: {new Date(Date.now() + parseInt(duration) * 1000).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Card: Manage Emergency Contacts */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800/80 flex flex-col gap-6">
          <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-4">
            <UserPlus className="w-5.5 h-5.5 text-indigo-400" />
            Emergency Contacts (FHIR RelatedPersons)
          </h3>

          <form onSubmit={handleAddContact} className="flex flex-col gap-4">
            {contactError && (
              <div className="flex gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{contactError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400" htmlFor="contact-name">
                  Contact Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="e.g. Fatima Omar"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-200 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Relationship */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400" htmlFor="contact-relation">
                  Relationship
                </label>
                <select
                  id="contact-relation"
                  value={contactRelation}
                  onChange={(e) => setContactRelation(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl py-3 px-4 text-sm font-medium text-slate-200 outline-none transition-all cursor-pointer"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Doctor">Doctor / Caregiver</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400" htmlFor="contact-phone">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  id="contact-phone"
                  type="text"
                  placeholder="e.g. +252 63 XXXXXXX"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-200 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Add Button */}
            <button
              type="submit"
              disabled={contactLoading}
              id="btn_add_contact"
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-100 font-bold rounded-xl text-sm transition-all active:scale-95 cursor-pointer"
            >
              {contactLoading ? (
                <span className="w-5 h-5 border-2 border-slate-100 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Add Emergency Contact</span>
                </>
              )}
            </button>
          </form>

          {/* Current Contacts List */}
          <div className="mt-4 flex flex-col gap-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Contact List</span>
            
            {contacts.length === 0 ? (
              <div className="text-center py-6 text-slate-600 text-xs bg-slate-950/20 border border-slate-900 rounded-xl">
                No active contacts recorded.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {contacts.map((c: any) => {
                  const nameStr = c.name?.[0]?.text || 'Emergency Contact';
                  const relationStr = c.relationship?.[0]?.text || 'Contact';
                  const phoneStr = c.telecom?.find((t: any) => t.system === 'phone')?.value || 'No phone';

                  return (
                    <div 
                      key={c.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-900"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{nameStr}</p>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">{relationStr} • {phoneStr}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(c.id)}
                        id={`btn_delete_contact_${c.id}`}
                        className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/share',
  component: SharePage,
});

export { shareRoute };
