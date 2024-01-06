import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  calculateAge,
  formatCustomDate,
  formatDateWithSlash,
} from "@/lib/utils";
import { useRouter } from "next/router";
import { Client } from "pg";
import { ShowMore } from "./[encounter]";

type iPatient = {
  id: string;
  dob: string;
  sex: string;
  zip3: string;
  enounters: {
    encounterId: string;
    encounterDate: string;
    encounterName: string;
    visitProvider: {
      name: string;
      department: string;
    };
    notes: number;
  }[];
};

export const getServerSideProps = async (context: {
  query: { patient: string };
}) => {
  // Get the patient id from the url
  const { patient: patient_num } = context.query;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  const result = await client.query(
    `SELECT 
    d.patient_num, 
    d.birth_date_shifted, 
    d.gender_identity, 
    d.zip3,
        (
            SELECT json_agg(encounters)
            FROM (
                SELECT 
                    encounter_num, 
                    visit_date_shifted, 
                    src_enc_type_c, 
                    visit_provider_name, 
                    department_name 
                FROM encounters 
                WHERE patient_num = d.patient_num
            ) AS encounters
        ) AS patient_encounters
    FROM demographics AS d
    WHERE d.patient_num = ${patient_num};
    `
  );
  const patient = result.rows[0];

  let pat: iPatient = {
    id: patient.patient_num,
    dob: patient.birth_date_shifted,
    sex: patient.gender_identity,
    zip3: patient.zip3,
    enounters: patient.patient_encounters.map(
      (encounter: {
        encounter_num: string;
        visit_date_shifted: string;
        src_enc_type_c: string;
        visit_provider_name: string;
        department_name: string;
      }) => ({
        encounterId: encounter.encounter_num,
        encounterDate: encounter.visit_date_shifted,
        encounterName: encounter.src_enc_type_c,
        visitProvider: {
          name: encounter.visit_provider_name,
          department: encounter.department_name,
        },
        notes: Math.floor(Math.random() * 200),
      })
    ),
  };
  return {
    props: {
      patient: JSON.parse(JSON.stringify(pat)),
    },
  };
};

export default function Patient({ patient }: { patient: iPatient }) {
  const router = useRouter();
  const { patient: patientId } = router.query;

  const [maxDisplay, setMaxDisplay] = useState(5);

  return (
    <div>
      <Card className="w-[95%] mx-auto my-7">
        <CardContent className="p-6">
          <h2 className="font-semibold uppercase text-base text-center text-blue-600">
            Patient Demographics
          </h2>
          <div className="grid grid-cols-5 mt-5">
            <Block title="Patient ID" value={patient.id} />
            <Block title="Gender" value={patient.sex} className="capitalize" />
            <Block title="DOB" value={formatDateWithSlash(patient.dob)} />
            <Block
              title="Age"
              value={calculateAge(patient.dob)}
              className="capitalize"
            />
            <Block title="ZIP Code" value={patient.zip3} />
          </div>
        </CardContent>
      </Card>
      <Card className="w-[95%] mx-auto my-7">
        <CardContent className="p-6">
          <h2 className="font-semibold uppercase text-base text-left text-blue-600">
            Enounters
          </h2>
          <div className="mt-5">
            <Table>
              <TableHeader>
                <TableRow className="uppercase font-semibold text-left">
                  <TableHead>Encounter ID</TableHead>
                  <TableHead>Encounter Name</TableHead>
                  <TableHead>Visit Provider</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Encounter Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.enounters.slice(0, maxDisplay).map((encounter) => (
                  <TableRow
                    key={encounter.encounterId}
                    className="cursor-pointer capitalize"
                    onClick={() =>
                      router.push(
                        `/patients/${patientId}/${encounter.encounterId}`
                      )
                    }
                  >
                    <TableCell>#{encounter.encounterId}</TableCell>
                    <TableCell>{encounter.encounterName}</TableCell>
                    <TableCell>
                      <span className="block">
                        {encounter.visitProvider.name}
                      </span>
                      <span className="block text-gray-500 text-xs">
                        {encounter.visitProvider.department} Department
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatCustomDate(encounter.encounterDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={"secondary"}>
                        {encounter.notes} Notes
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <ShowMore
                  isActive={maxDisplay === patient.enounters.length}
                  controlHandler={() =>
                    setMaxDisplay((maxDisplay) => {
                      if (maxDisplay === patient.enounters.length) {
                        return 5;
                      } else {
                        return patient.enounters.length;
                      }
                    })
                  }
                />
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const Block = ({
  title,
  value,
  className,
}: {
  title: string;
  value: string;
  className?: string;
}) => (
  <div className={className}>
    <span className="text-sm text-gray-500 block">{title}</span>
    <span className="text-base font-semibold">{value}</span>
  </div>
);
