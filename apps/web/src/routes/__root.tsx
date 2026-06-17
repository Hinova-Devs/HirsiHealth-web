import { createRootRoute, Outlet, Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { MedplumProvider, useMedplumContext, useMedplumProfile } from '@medplum/react';
import { medplum } from '../medplum';
import { useEffect, useState } from 'react';
import { 
  FolderHeart, 
  LayoutDashboard, 
  UploadCloud, 
  ShieldAlert, 
  Share2, 
  LogOut, 
  Menu, 
  X,
  UserCheck
} from 'lucide-react';
import { Patient } from '@medplum/fhirtypes';

function RootLayout() {
  const { medplum: medplumInstance, loading } = useMedplumContext();
  const currentProfile = useMedplumProfile();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const [profile, setProfile] = useState<Patient | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSignedIn = !!currentProfile;

  useEffect(() => {
    if (loading) return;

    if (currentProfile) {
      if (currentProfile.resourceType === 'Patient') {
        setProfile(currentProfile as Patient);
      } else {
        // If they are logged in as admin/practitioner, create a display profile
        setProfile({
          resourceType: 'Patient',
          id: currentProfile.id,
          name: [{ given: ['Practitioner/Admin'], family: currentProfile?.meta?.project }]
        } as Patient);
      }
    } else {
      setProfile(null);
      // Redirect if attempting to access protected route
      const publicRoutes = ['/', '/login', '/register', '/emergency'];
      const currentPath = routerState.location.pathname;
      if (!publicRoutes.includes(currentPath)) {
        navigate({ to: '/login' });
      }
    }
  }, [currentProfile, loading, routerState.location.pathname, navigate]);

  const handleLogout = async () => {
    await medplumInstance.signOut();
    setProfile(null);
    navigate({ to: '/' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium tracking-wide text-teal-400 font-display animate-pulse">Loading HersiHealth Wallet...</p>
      </div>
    );
  }

  const isPublic = ['/', '/login', '/register', '/emergency'].includes(routerState.location.pathname);

  // If public route, render simple container (like Landing Page or Login page)
  if (isPublic && !isSignedIn) {
    return (
      <main className="min-h-screen">
        <Outlet />
      </main>
    );
  }

  // Signed in / Protected pages layout
  const navigationItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Documents', to: '/documents', icon: FolderHeart },
    { label: 'Upload File', to: '/upload', icon: UploadCloud },
    { label: 'Emergency Profile', to: '/emergency', icon: ShieldAlert },
    { label: 'Share Center', to: '/share', icon: Share2 },
  ];

  const patientName = profile?.name?.[0]
    ? `${profile.name[0].given?.join(' ') || ''} ${profile.name[0].family || ''}`.trim()
    : 'Valued Patient';

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 glass-panel border-r border-slate-800 p-6 sticky top-0 h-screen justify-between z-30">
        <div className="flex flex-col gap-8">
          {/* Logo / Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-400/30">
              <span className="text-xl font-bold font-display text-white">H</span>
            </div>
            <div>
              <h1 className="text-lg font-bold font-display leading-none tracking-tight">HersiHealth</h1>
              <span className="text-xs text-teal-400 font-semibold tracking-wider uppercase">FHIR R4 Wallet</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-slate-300 hover:bg-slate-800/50 hover:text-teal-400 hover:translate-x-1 [&.active]:bg-gradient-to-r [&.active]:from-teal-500/10 [&.active]:to-indigo-500/5 [&.active]:border-l-4 [&.active]:border-teal-500 [&.active]:text-teal-400 [&.active]:translate-x-0"
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile Card & Logout */}
        <div className="flex flex-col gap-4 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-slate-200">{patientName}</p>
              <p className="text-xs text-teal-400 truncate">ID: {profile?.id?.slice(0, 8) || 'N/A'}...</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            id="btn_logout_sidebar"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all duration-300 font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between px-6 py-4 glass-panel border-b border-slate-800 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center">
              <span className="text-sm font-bold font-display text-white">H</span>
            </div>
            <h1 className="text-base font-bold font-display">HersiHealth</h1>
          </div>
          <button 
            id="mobile_menu_trigger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-300 p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Navigation Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-16 bg-slate-950/95 backdrop-blur-lg border-b border-slate-800 p-6 flex flex-col gap-6 z-30 animate-in fade-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-300 hover:bg-slate-800/50 hover:text-teal-400 [&.active]:bg-teal-500/10 [&.active]:text-teal-400"
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-800 pt-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold truncate text-slate-200">{patientName}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                id="btn_logout_mobile"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-800 text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <MedplumProvider medplum={medplum}>
      <RootLayout />
    </MedplumProvider>
  ),
});

export { rootRoute };
