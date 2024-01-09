import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import React from "react";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();

  const { patient: patientId } = router.query;

  return (
    <header className="sticky top-0 border-b pt-3 bg-white z-50">
      <nav className="flex max-w-[95%] mx-auto" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
          <li className="inline-flex items-center">
            <Link
              href="/patients"
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            >
              Home
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight size={15} />
              <Link
                href="/patients"
                className="ms-1 text-xs font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
              >
                Patient List
              </Link>
            </div>
          </li>
          {pathname.split("/").length > 2 && (
            <li aria-current="page">
              <div className="flex items-center">
                <ChevronRight size={15} />
                <Link
                  href={`/patients/${patientId}`}
                  className="ms-1 text-xs font-medium text-blue-600 md:ms-2 dark:text-gray-400"
                >
                  Patient #{pathname.split("/")[2]}
                </Link>
              </div>
            </li>
          )}
        </ol>
        {status === "authenticated" && (
          <button
            onClick={() => signOut()}
            className="ml-auto inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            Sign out
          </button>
        )}
      </nav>
      <h2 className="text-blue-600 font-bold ml-[2.5%] border-b-2 border-blue-600 pb-2 w-fit mt-3 text-base">
        {/^\/patients\/\d+(\/\d+)?$/.test(pathname) &&
          `Patient #${pathname.split("/")[2]}`}
        {pathname === "/patients" && "Patient Lists"}
      </h2>
    </header>
  );
}
