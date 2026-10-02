// src/components/NavBar/NavBar.tsx
import { List } from "@react95/core";
import { useLocation, useNavigate } from "react-router-dom";
import { navigation, type NavEntry } from "../../config/navigation";
import styles from "./NavBar.module.css";

// "/" must match exactly, otherwise Home would be active on every page
const matches = (pathname: string, path: string): boolean =>
  path === "/"
    ? pathname === "/"
    : pathname === path || pathname.startsWith(`${path}/`);

// a parent is active if it, or any descendant, matches
const isActive = (entry: NavEntry, pathname: string): boolean =>
  (entry.path !== undefined && matches(pathname, entry.path)) ||
  (entry.children?.some((child) => isActive(child, pathname)) ?? false);

interface NavItemsProps {
  items: readonly NavEntry[];
  pathname: string;
  onNavigate: (path: string) => void;
}

function NavItems({ items, pathname, onNavigate }: NavItemsProps) {
  return (
    <>
      {items.map((entry) => {
        const { path, label, icon, children } = entry;
        const active = isActive(entry, pathname);

        return (
          <List.Item
            key={path ?? label}
            icon={icon}
            aria-current={active && path ? "page" : undefined}
            // parents with children only open the submenu
            onClick={path && !children ? () => onNavigate(path) : undefined}
          >
            {label}
            {children && (
              <List className={styles.submenu}>
                <NavItems
                  items={children}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              </List>
            )}
          </List.Item>
        );
      })}
    </>
  );
}

interface NavBarProps {
  className?: string;
}

function NavBar({ className }: NavBarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={className} aria-label="Main navigation">
      <List>
        <NavItems
          items={navigation}
          pathname={pathname}
          onNavigate={navigate}
        />
      </List>
    </nav>
  );
}

export default NavBar;
