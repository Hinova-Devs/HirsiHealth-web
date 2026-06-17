import { createRoute, Link, useNavigate } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { useMedplumContext, useMedplumProfile } from '@medplum/react';
import { 
  ShieldAlert, 
  FileHeart, 
  Share2, 
  FileLock, 
  ChevronRight, 
  Activity,
  Heart
} from 'lucide-react';
import { useEffect } from 'react';

function IndexPage() {
  const { loading } = useMedplumContext();
  const currentProfile = useMedplumProfile();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already signed in, bypass landing page and go to dashboard
    if (!loading && currentProfile) {
      navigate({ to: '/dashboard' });
    }
  }, [loading, currentProfile, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]"></div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">HersiHealth</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/emergency"
            id="link_header_emergency"
            className="text-sm font-semibold text-slate-400 hover:text-teal-400 transition-colors"
          >
            Emergency Card
          </Link>
          <Link
            to="/register"
            id="link_header_register"
            className="text-sm font-semibold text-slate-400 hover:text-teal-400 transition-colors"
          >
            Register
          </Link>
          <Link
            to="/login"
            id="link_header_login"
            className="px-4 py-2 rounded-xl text-sm font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 active:scale-95 transition-all shadow-md shadow-teal-500/10 cursor-pointer"
          >
            Access Wallet
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-6 tracking-wide animate-pulse">
          <Heart className="w-3.5 h-3.5 fill-teal-400" />
          Patient-Controlled FHIR R4 Health Wallet
        </div>
        
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
          Your Complete Health Records.<br />
          <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500 bg-clip-text text-transparent text-glow">
            Owned By You, Accessible Anywhere.
          </span>
        </h1>
        
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Store, organize, and share your prescriptions, lab results, imaging reports, and vaccination certificates in a secure, digital wallet built on interoperable FHIR standards.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            id="btn_hero_get_started"
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:from-teal-400 hover:to-emerald-400 rounded-2xl text-base font-extrabold shadow-lg shadow-teal-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <span>Create Your Health Wallet</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
          
          <Link
            to="/emergency"
            id="btn_hero_emergency"
            className="flex items-center gap-2 px-8 py-4 border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 rounded-2xl text-base font-bold text-slate-200 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span>Emergency Quick Card</span>
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 border-t border-slate-900">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-12">Empowering Digital Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-panel p-8 rounded-3xl hover:translate-y-[-4px] transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6 text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all duration-300">
              <FileHeart className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold mb-3 text-slate-100">FHIR Native Records</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Standardized on HL7 FHIR R4 database models so your records remain portable across clinics and interoperable with modern hospitals.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-8 rounded-3xl hover:translate-y-[-4px] transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-slate-950 transition-all duration-300">
              <FileLock className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold mb-3 text-slate-100">Secure Document Wallet</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Store original PDF diagnostics and images directly in the Medplum Binary store. Rest assured your records are private and secure.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-8 rounded-3xl hover:translate-y-[-4px] transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold mb-3 text-slate-100">Controlled Consent Sharing</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Generate time-limited signed links to share specific medical documents with your doctors. Revoke access instantly, anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Faculty Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-10 text-center text-slate-500 text-xs font-medium">
        <p className="mb-2">HersiHealth 🏥 — Final Year Graduation Project</p>
        <p className="text-slate-600">Faculty of Computing & ICT, Borama University, Somaliland</p>
      </footer>
    </div>
  );
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});

export { indexRoute };
