import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateAge, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/router";
import { Client } from "pg";
import ReactPaginate from "react-paginate";
type iPatient = {
  id: number;
  sex: string;
  dob: string;
  zip3: string;
  encounters: number;
  notes: number;
};

export const getServerSideProps = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  const result = (
    await client.query(
      `SELECT d.patient_num, d.birth_date_shifted, d.gender_identity, d.state_c, d.zip3, COALESCE(encounter_count, 0) AS encounter_count
    FROM demographics d
    LEFT JOIN (
        SELECT patient_num, COUNT(*) AS encounter_count
        FROM encounters
        GROUP BY patient_num
    ) e ON d.patient_num = e.patient_num;`
    )
  ).rows;

  let patients = result.map((patient) => ({
    id: patient.patient_num,
    dob: patient.birth_date_shifted,
    sex: patient.gender_identity,
    zip3: patient.state_c + patient.zip3,
    encounters: patient.encounter_count,
    notes: Math.floor(Math.random() * 200),
  }));

  await client.end();

  return {
    props: {
      patients: JSON.parse(JSON.stringify(patients)),
    },
  };
};

export default function PatientList({ patients }: { patients: iPatient[] }) {
  const router = useRouter();
  const [selectedPage, setSelectedPage] = useState(0);

  const patientsPerPage = 15;
  const totalPages = Math.ceil(patients.length / patientsPerPage);
  const [displayedPatients, setDisplayedPatients] = useState<iPatient[]>([]);

  useEffect(() => {
    setDisplayedPatients(
      patients.slice(selectedPage, selectedPage + patientsPerPage)
    );
  }, [patients, selectedPage]);

  const handlePageClick = (event: { selected: number }) => {
    const selectedPage = event.selected;
    setSelectedPage(selectedPage);
  };

  return (
    <div className="max-w-[95%] mx-auto pb-6">
      <h1 className="text-2xl font-semibold py-6">
        {patients.length} Patients
      </h1>
      <Table>
        <TableHeader>
          <TableRow className="uppercase font-semibold text-left">
            <TableHead>Patient ID</TableHead>
            <TableHead>Date of Birth</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Zip Code</TableHead>
            <TableHead>Encounters</TableHead>
            {/* <TableHead>Number of Notes</TableHead> */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedPatients.map((patient) => (
            <TableRow
              key={patient.id}
              className="cursor-pointer"
              onClick={() => router.push(`/patients/${patient.id}`)}
            >
              <TableCell>#{patient.id}</TableCell>
              <TableCell>{formatDate(patient.dob)}</TableCell>
              <TableCell>{calculateAge(patient.dob)}</TableCell>
              <TableCell className="capitalize">{patient.sex}</TableCell>
              <TableCell>{patient.zip3}</TableCell>
              <TableCell>
                <Badge variant={"secondary"}>
                  {patient.encounters} Encounter{patient.encounters > 1 && "s"}
                </Badge>
              </TableCell>
              {/* <TableCell>
                <Badge variant={"secondary"}>{patient.notes} Notes</Badge>
              </TableCell> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="capitalize text-sm">
        <ReactPaginate
          breakLabel="..."
          nextLabel="Next >"
          onPageChange={handlePageClick}
          pageRangeDisplayed={5}
          pageCount={totalPages}
          previousLabel={"< Previous"}
          renderOnZeroPageCount={null}
          className="flex justify-center my-6 gap-2"
          pageLinkClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10 cursor-pointer"
          activeLinkClassName="border border-input bg-background"
          previousLinkClassName="px-4 py-2 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground h-10"
          nextClassName="h-10 flex items-center justify-center"
          previousClassName="h-10 flex items-center justify-center"
          nextLinkClassName="px-4 py-2 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground h-10"
          breakClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors  hover:bg-accent hover:text-accent-foreground h-10 w-10 cursor-pointer"
        />
      </div>
    </div>
  );
}
