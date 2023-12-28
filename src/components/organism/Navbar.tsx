import { ArrowRight, ChevronRight } from "lucide-react";
import React from "react";

export default function navbar() {
  return (
    <header className="sticky top-0 border-b pt-3 bg-white z-50">
      <nav className="flex max-w-[95%] mx-auto" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
          <li className="inline-flex items-center">
            <a
              href="#"
              className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            >
              Home
            </a>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight size={15} />
              <a
                href="#"
                className="ms-1 text-xs font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
              >
                Patient List
              </a>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRight size={15} />
              <span className="ms-1 text-xs font-medium text-blue-600 md:ms-2 dark:text-gray-400">
                Patient #34512
              </span>
            </div>
          </li>
        </ol>
      </nav>
      <h2 className="text-blue-600 font-bold ml-[2.5%] border-b-2 border-blue-600 pb-2 w-fit mt-3 text-base">Patient #34512</h2>
    </header>
  );
}
