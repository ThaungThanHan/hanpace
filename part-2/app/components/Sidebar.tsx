"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const isTimetable = pathname === "/timetable";
  const isMembers = pathname === "/members";

  return (
    <aside
      className="flex items-center justify-between gap-3 border-b border-[#d8e7dc] bg-[#f4faf5] px-[18px] py-3.5 md:sticky md:top-0 md:h-dvh md:flex-col md:items-stretch md:justify-start md:border-r md:border-b-0 md:pt-[30px] md:pb-[22px]"
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-[11px] whitespace-nowrap text-[#184b3d] md:px-1 lg:px-3" aria-label="Han Fitness">
        <span className="text-base max-[440px]:text-sm lg:text-lg">Han <strong className="font-extrabold">Fitness</strong></span>
      </div>

      <nav className="flex flex-col gap-3 md:mt-[58px]" aria-label="Main">
        <Link
          className={`flex min-h-[35px] items-center rounded-lg px-2.5 text-xs font-bold no-underline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#8dbb9a] md:min-h-11 md:px-4 md:text-sm ${isTimetable
            ? "bg-[#286d53] text-white hover:bg-[#184b3d]"
            : "text-[#184b3d] hover:bg-[#e7f3ea]"}`}
          href="/timetable"
          aria-current={isTimetable ? "page" : undefined}
        >
          Timetable
        </Link>
        <Link
          className={`flex min-h-[35px] items-center rounded-lg px-2.5 text-xs font-bold no-underline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#8dbb9a] md:min-h-11 md:px-4 md:text-sm ${isMembers
            ? "bg-[#286d53] text-white hover:bg-[#184b3d]"
            : "text-[#184b3d] hover:bg-[#e7f3ea]"}`}
          href="/members"
          aria-current={isMembers ? "page" : undefined}
        >
          Members
        </Link>
      </nav>

      <div className="mt-auto hidden border-t border-[#dce9df] px-3 pt-5 text-xs font-bold text-[#63786a] md:block">
        Han Fitness Studio
      </div>
    </aside>
  );
}
