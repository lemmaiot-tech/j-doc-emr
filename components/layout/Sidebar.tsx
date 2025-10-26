import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import Logo from '../Logo';
import { Home, Users, TestTube2, Stethoscope, Pill, Scissors, Tooth, FileText, X, Eye, ClipboardList } from '../icons/Icons';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Define the navigation structure with role-based access control
const navLinksConfig = [
  { to: "/", label: "Dashboard", icon: Home, roles: Object.values(Role) },
  { to: "/patients", label: "Patients", icon: Users, roles: Object.values(Role) },
  { to: "/general-consultation", label: "General Consultation", icon: ClipboardList, roles: [Role.Admin, Role.Doctor, Role.Nurse] },
  { to: "/physiotherapy", label: "Physiotherapy", icon: Stethoscope, roles: [Role.Admin, Role.Physiotherapist, Role.Doctor] },
  { to: "/eye-ent", label: "Eye/ENT", icon: Eye, roles: [Role.Admin, Role.Doctor, Role.Nurse] },
  { to: "/surgery", label: "Surgery", icon: Scissors, roles: [Role.Admin, Role.Surgeon, Role.Doctor, Role.Nurse] },
  { to: "/laboratory", label: "Laboratory", icon: TestTube2, roles: [Role.Admin, Role.LabTechnician, Role.Doctor] },
  { to: "/dental", label: "Dental", icon: Tooth, roles: [Role.Admin, Role.Dentist, Role.Doctor] },
  { to: "/paediatrics", label: "Paediatrician", icon: Users, roles: [Role.Admin, Role.Doctor, Role.Nurse] },
  { to: "/o-and-g", label: "O and G", icon: Users, roles: [Role.Admin, Role.Doctor, Role.Nurse] },
  { to: "/pharmacy", label: "Pharmacy", icon: Pill, roles: [Role.Admin, Role.Pharmacist, Role.Doctor, Role.Nurse] },
];

const adminLinksConfig = [
  { to: "/admin/users", label: "User Management", icon: Users, roles: [Role.Admin] },
  { to: "/admin/departments", label: "Departments", icon: Home, roles: [Role.Admin] },
  { to: "/admin/audit-log", label: "Audit Log", icon: FileText, roles: [Role.Admin] },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role;

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-primary-700 text-white'
        : 'text-gray-300 hover:bg-primary-800 hover:text-white'
    }`;
  
  // Filter links based on the current user's role
  const accessibleNavLinks = navLinksConfig.filter(link => userRole && link.roles.includes(userRole));
  
  const handleLinkClick = () => {
    if (window.innerWidth < 768) { // md breakpoint
        setIsOpen(false);
    }
  };
  
  return (
    <aside className={`
      fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-primary-900 text-white
      transform transition-transform duration-300 ease-in-out
      md:relative md:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-primary-800 flex-shrink-0">
        <Logo />
        {/* Close button for mobile */}
        <button onClick={() => setIsOpen(false)} className="md:hidden p-2 rounded-full hover:bg-primary-800">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto" onClick={handleLinkClick}>
        {/* Render the filtered navigation links */}
        {accessibleNavLinks.map(link => (
          <NavLink to={link.to} key={link.to} end={link.to === '/'} className={navLinkClasses}>
            <link.icon className="w-5 h-5 mr-3" />
            {link.label}
          </NavLink>
        ))}

        {/* The admin section is already guarded by the role check */}
        {userProfile?.role === Role.Admin && (
          <div className="pt-4 mt-4 border-t border-primary-800">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</h3>
            <div className="mt-2 space-y-2">
              {adminLinksConfig.map(link => (
                 <NavLink to={link.to} key={link.to} className={navLinkClasses}>
                    <link.icon className="w-5 h-5 mr-3" />
                    {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;