import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(inputDate: string) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const date = new Date(inputDate);
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  // Function to determine the ordinal suffix for the day
  function getOrdinalSuffix(day: number) {
    if (day >= 11 && day <= 13) {
      return "th";
    }
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  const ordinalSuffix = getOrdinalSuffix(day);
  const formattedDate = `${month} ${day}${ordinalSuffix}, ${year}`;

  return formattedDate;
}

export function formatDateWithSlash(inputDate: string) {
  const date = new Date(inputDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  const formattedDate = `${month}/${day}/${year}`;

  return formattedDate;
}

function getDateSuffix(day: number) {
  if (day >= 11 && day <= 13) {
    return "th";
  }
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
export function formatCustomDate(inputDate: string) {
  const date = new Date(inputDate);

  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();
  const hour = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
  const minute = date.getMinutes();
  const period = hour >= 12 ? "pm" : "am";

  const formattedDate = `${day}${getDateSuffix(
    day
  )} ${month} ${year}, ${hour}:${
    minute < 10 ? "0" + minute : minute
  } ${period}`;

  return formattedDate;
}
// Calculate age to end with yr(s)
export const calculateAge = (dob: string) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  if (age === 1) {
    return `${age} yr`;
  }
  return `${age} yrs`;
};
