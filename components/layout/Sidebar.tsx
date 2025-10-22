import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import Logo from '../Logo';
import { Home, Users, TestTube2, Stethoscope, Pill, Scissors, Tooth } from '../icons/Icons';

// Define the navigation structure with role-based access control
const navLinksConfig = [
  { to: "/", label: "Dashboard", icon: Home, roles: Object.values(Role) },
  { to: "/patients", label: "Patients", icon: Users, roles: Object.values(Role) },
  { to: "/pharmacy", label: "Pharmacy", icon: Pill, roles: [Role.Admin, Role.Pharmacist, Role.Doctor, Role.Nurse] },
  { to: "/surgery", label: "Surgery", icon: Scissors, roles: [Role.Admin, Role.Surgeon, Role.Doctor, Role.Nurse] },
  { to: "/dental", label: "Dental", icon: Tooth, roles: [Role.Admin, Role.Dentist, Role.Doctor] },
  { to: "/laboratory", label: "Laboratory", icon: TestTube2, roles: [Role.Admin, Role.LabTechnician, Role.Doctor] },
  { to: "/physiotherapy", label: "Physiotherapy", icon: Stethoscope, roles: [Role.Admin, Role.Physiotherapist, Role.Doctor] },
];

const adminLinksConfig = [
  { to: "/admin/users", label: "User Management", icon: Users, roles: [Role.Admin] },
  { to: "/admin/departments", label: "Departments", icon: Home, roles: [Role.Admin] },
];

const Sidebar: React.FC = () => {
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
  
  return (
    <aside className="hidden md:flex flex-col w-64 bg-primary-900 text-white">
      <div className="flex items-center justify-center h-20 border-b border-primary-800">
        <Logo />
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
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