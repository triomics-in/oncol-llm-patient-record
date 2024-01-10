import React, { useEffect, useState } from "react";
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
import { ShowMore, Title } from "./[encounter]";
import { getSession } from "next-auth/react";
import { GetServerSidePropsContext } from "next";

type iPatient = {
  id: string;
  dob: string;
  sex: string;
  zip3: string;
  race: string;
  ethnicity: string;
  pcp: string;
  enounters: {
    encounterId: string;
    encounterDate: string;
    encounterName: string;
    department_external_name: string;
    visitProvider: {
      name: string;
      department: string;
    };
    notes: number;
  }[];
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
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
      d.sex, 
      d.zip3,
      d.race,
      d.ethnicity,
      d.state_c,
      d.primary_care_provider_name,
      json_agg(json_build_object(
          'encounter_num', e.encounter_num,
          'visit_date_shifted', e.visit_date_shifted,
          'src_enc_type_name', e.src_enc_type_name,
          'visit_provider_name', e.visit_provider_name,
          'department_name', e.department_name,
          'department_external_name', e.department_external_name,
          'note_text_count', COALESCE(note_counts.order_results_count, 0)
                               + COALESCE(note_counts.imaging_reports_count, 0)
                               + COALESCE(note_counts.hno_notes_count, 0)
      )) AS patient_encounters
    FROM demographics AS d
    LEFT JOIN encounters AS e ON e.patient_num = d.patient_num
    LEFT JOIN (
        SELECT encounter_num, patient_num,
               SUM(order_results_count) AS order_results_count,
               SUM(imaging_reports_count) AS imaging_reports_count,
               SUM(hno_notes_count) AS hno_notes_count
        FROM (
            SELECT encounter_num, patient_num,
                   COUNT(*) AS order_results_count,
                   0 AS imaging_reports_count,
                   0 AS hno_notes_count
            FROM order_results_deid
            WHERE note_text IS NOT NULL
            GROUP BY encounter_num, patient_num
            
            UNION ALL
            
            SELECT encounter_num, patient_num,
                   0 AS order_results_count,
                   COUNT(*) AS imaging_reports_count,
                   0 AS hno_notes_count
            FROM imaging_reports_deid
            WHERE note_text IS NOT NULL
            GROUP BY encounter_num, patient_num
            
            UNION ALL
            
            SELECT encounter_num, patient_num,
                   0 AS order_results_count,
                   0 AS imaging_reports_count,
                   COUNT(*) AS hno_notes_count
            FROM hno_notes_deid
            WHERE note_text IS NOT NULL
            GROUP BY encounter_num, patient_num
        ) AS subquery
        GROUP BY encounter_num, patient_num
    ) AS note_counts ON note_counts.encounter_num = e.encounter_num AND note_counts.patient_num = e.patient_num
    WHERE d.patient_num = ${patient_num}
    GROUP BY d.patient_num, d.birth_date_shifted, d.sex, d.zip3, d.race, d.ethnicity, d.state_c, d.primary_care_provider_name;
    `
  );
  const patient = result.rows[0];

  let pat: iPatient = {
    id: patient.patient_num,
    dob: patient.birth_date_shifted,
    sex: patient.sex,
    zip3: patient.state_c + patient.zip3,
    race: patient.race,
    ethnicity: patient.ethnicity,
    pcp: patient.primary_care_provider_name,
    enounters:
      patient?.patient_encounters?.map(
        (encounter: {
          encounter_num: string;
          visit_date_shifted: string;
          src_enc_type_name: string;
          visit_provider_name: string;
          department_name: string;
          department_external_name: string;
          note_text_count: number;
        }) => ({
          encounterId: encounter.encounter_num,
          encounterDate: encounter.visit_date_shifted,
          encounterName: encounter.src_enc_type_name,
          department_external_name: encounter.department_external_name,
          visitProvider: {
            name: encounter.visit_provider_name,
            department: encounter.department_name,
          },
          notes: encounter.note_text_count,
        })
      ) || [],
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
  const [encounters, setEncounters] = useState(patient.enounters || []);

  const [maxDisplay, setMaxDisplay] = useState(5);

  useEffect(() => {
    setEncounters(patient.enounters || []);
  }, [patient]);

  return (
    <div>
      <Card className="w-[95%] mx-auto my-7">
        <CardContent className="p-6">
          <div className="relative w-fit mx-auto">
            <h2 className="block font-semibold uppercase text-base text-blue-800">
              Patient Demographics
            </h2>
            <span className="absolute inset-x-0 -bottom-1 h-1 w-4 bg-blue-800"></span>
          </div>
          <div className="grid grid-cols-4 gap-5 mt-5">
            <Block title="Patient ID" value={patient.id} />
            <Block title="Gender" value={patient.sex} className="capitalize" />
            <Block title="DOB" value={formatDateWithSlash(patient.dob)} />
            <Block
              title="Age"
              value={calculateAge(patient.dob)}
              className="capitalize"
            />
            <Block title="Race" value={patient.race} />
            <Block title="Ethnicity" value={patient.ethnicity} />
            <Block title="PCP" value={patient.pcp} />
            <Block title="ZIP Code" value={patient.zip3} />
          </div>
        </CardContent>
      </Card>
      <Card className="w-[95%] mx-auto my-7">
        <CardContent className="p-6">
          <Title title="Encounters" />

          <Table>
            <TableHeader>
              <TableRow className="uppercase font-semibold text-left">
                <TableHead>Encounter ID</TableHead>
                <TableHead>Encounter Name</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead>Visit Provider</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Encounter Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {encounters.slice(0, maxDisplay).map((encounter) => (
                <TableRow
                  key={encounter.encounterId}
                  className="cursor-pointer capitalize"
                  onClick={() =>
                    router.push(
                      `/patients/${patientId}/${encounter.encounterId}`
                    )
                  }
                >
                  <TableCell>{encounter.encounterId}</TableCell>
                  <TableCell>{encounter.encounterName}</TableCell>
                  <TableCell>{encounter.department_external_name}</TableCell>
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
                    <Badge variant={"secondary"}>{encounter.notes} Notes</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {encounters.length > 5 && (
                <ShowMore
                  isActive={maxDisplay === encounters.length}
                  controlHandler={() =>
                    setMaxDisplay((maxDisplay) => {
                      if (maxDisplay === encounters.length) {
                        return 5;
                      } else {
                        return encounters.length;
                      }
                    })
                  }
                />
              )}
            </TableBody>
          </Table>
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
