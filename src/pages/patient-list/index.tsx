import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { faker } from "@faker-js/faker";
import { calculateAge, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
type iPatient = {
  id: number;
  name: string;
  sex: string;
  dob: string;
  startDate: string;
  endDate: string;
  encounters: number;
  notes: number;
};

export default function PatientList({ patients }: { patients: iPatient[] }) {
  const [displayedPatients, setDisplayedPatients] = useState<iPatient[]>([]);

  useEffect(() => {
    setDisplayedPatients(patients.slice(0, 10));
  }, [patients]);

  return (
    <div className="max-w-[95%] mx-auto">
      <h1 className="text-2xl font-semibold py-6">
        {patients.length} Patients
      </h1>
      <Table>
        <TableHeader>
          <TableRow className="uppercase font-semibold text-left">
            <TableHead>Patient ID</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Date of Birth</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Encounters</TableHead>
            <TableHead>Number of Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedPatients.map((patient) => (
            <TableRow key={patient.id} className="cursor-pointer">
              <TableCell>#{patient.id}</TableCell>
              <TableCell>
                <span className="block">{patient.name}</span>
                <span className="block text-gray-500">
                  {patient.sex[0].toUpperCase()} | {calculateAge(patient.dob)}
                </span>
              </TableCell>
              <TableCell>{formatDate(patient.dob)}</TableCell>
              <TableCell>{formatDate(patient.startDate)}</TableCell>
              <TableCell>{formatDate(patient.endDate)}</TableCell>
              <TableCell>
                <Badge variant={"secondary"}>
                  {patient.encounters} Encounters
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={"secondary"}>{patient.notes} Notes</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination>
        <PaginationContent>
          <PaginationPrevious href="#" />
          <PaginationLink href="#">1</PaginationLink>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationNext href="#" />
        </PaginationContent>
      </Pagination>
    </div>
  );
}

// Generate 620 patients with faker js from getServersideProps and pass it to the component and id of random 5 characters number
export const getServerSideProps = async () => {
  const patients = [];
  for (let i = 0; i < 620; i++) {
    patients.push({
      id: faker.string.numeric(5),
      name: faker.person.fullName(),
      dob: faker.date.birthdate().toString(),
      sex: faker.person.sex(),
      startDate: faker.date.past().toString(),
      endDate: faker.date.past().toString(),
      encounters: Math.floor(Math.random() * 50),
      notes: Math.floor(Math.random() * 200),
    });
  }
  return {
    props: {
      patients,
    },
  };
};
