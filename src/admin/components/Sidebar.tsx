// src/admin/components/Sidebar.tsx
import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import type { Schema } from "../types";
import { Layers, Square, List, Image, LogOut, Egg } from "lucide-react";

interface SidebarProps {
  schemas: Schema[];
}

export default function Sidebar({ schemas }: SidebarProps) {
  const { logout } = useAuth();
  const [location] = useLocation();

  const singletons = schemas.filter((s) => s.type === "singleton");
  const collections = schemas.filter((s) => s.type === "collection");

  const isActive = (href: string) =>
    location === href || location.startsWith(href + "/");

  return (
    <aside className="w-60 bg-white border-r border-[#E8E8E3] h-screen flex flex-col">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#E8E8E3]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E5644E] flex items-center justify-center">
            <Egg className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-[#1A1A18]">EggCMS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {singletons.length > 0 && (
          <div>
            <h2 className="px-2 mb-2 text-[11px] font-semibold text-[#9C9C91] uppercase tracking-wider">
              Singletons
            </h2>
            <div className="space-y-0.5">
              {singletons.map((s) => (
                <Link
                  key={s.name}
                  href={`/singletons/${s.name}`}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                    transition-colors duration-150
                    ${
                      isActive(`/singletons/${s.name}`)
                        ? "bg-[#F5F5F3] text-[#1A1A18] font-medium"
                        : "text-[#6B6B63] hover:bg-[#F5F5F3] hover:text-[#1A1A18]"
                    }
                  `}
                >
                  <Square className="w-4 h-4 opacity-60" />
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {collections.length > 0 && (
          <div>
            <h2 className="px-2 mb-2 text-[11px] font-semibold text-[#9C9C91] uppercase tracking-wider">
              Collections
            </h2>
            <div className="space-y-0.5">
              {collections.map((s) => (
                <Link
                  key={s.name}
                  href={`/collections/${s.name}`}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                    transition-colors duration-150
                    ${
                      isActive(`/collections/${s.name}`)
                        ? "bg-[#F5F5F3] text-[#1A1A18] font-medium"
                        : "text-[#6B6B63] hover:bg-[#F5F5F3] hover:text-[#1A1A18]"
                    }
                  `}
                >
                  <List className="w-4 h-4 opacity-60" />
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          <Link
            href="/media"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm
              transition-colors duration-150
              ${
                isActive("/media")
                  ? "bg-[#F5F5F3] text-[#1A1A18] font-medium"
                  : "text-[#6B6B63] hover:bg-[#F5F5F3] hover:text-[#1A1A18]"
              }
            `}
          >
            <Image className="w-4 h-4 opacity-60" />
            Media
          </Link>
        </div>
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t border-[#E8E8E3]">
        <button
          onClick={() => logout()}
          className="
            flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm
            text-[#6B6B63] hover:bg-[#F5F5F3] hover:text-[#1A1A18]
            transition-colors duration-150
          "
        >
          <LogOut className="w-4 h-4 opacity-60" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
