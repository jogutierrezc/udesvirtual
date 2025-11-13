import { NavLink, useLocation } from "react-router-dom";

// Simple, black Coursera-style top navigation bar for audience modes
// Active item appears as a small white rounded pill with black text
// Non-active items are gray on black and turn white on hover

const items = [
  { to: "/individuos", label: "para individuos", key: "individuos" },
  { to: "/profesores-udes", label: "para profesores UDES", key: "profesores-udes" },
  { to: "/estudiantes-udes", label: "para estudiantes UDES", key: "estudiantes-udes" },
  { to: "/profesores-internacionales", label: "para profesores extranjeros", key: "profesores-internacionales" },
] as const;

function getActiveKey(pathname: string): string {
  if (pathname === "/" || pathname.startsWith("/individuos") || pathname.startsWith("/mooc")) return "individuos";
  if (pathname.startsWith("/profesores-udes")) return "profesores-udes";
  if (pathname.startsWith("/estudiantes-udes")) return "estudiantes-udes";
  if (pathname.startsWith("/profesores-internacionales")) return "profesores-internacionales";
  return "";
}

export const TopNavigationBar = () => {
  const { pathname } = useLocation();
  const activeKey = getActiveKey(pathname);

  return (
    <div className="w-full bg-black text-sm sticky top-0 z-[60]">
      <div className="mx-auto max-w-7xl px-4 h-10 flex items-center gap-1 overflow-x-auto">
        {items.map((item) => {
          const isActive = activeKey === item.key;
          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive: routeActive }) => {
                // use our activeKey mapping OR router match
                const active = isActive || routeActive;
                return [
                  "whitespace-nowrap transition-colors px-4 py-1.5 border-b-2",
                  active
                    ? "text-white border-white"
                    : "text-white border-transparent hover:bg-white hover:text-black",
                ].join(" ");
              }}
            >
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default TopNavigationBar;
