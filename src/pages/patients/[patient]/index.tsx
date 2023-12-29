import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { faker } from "@faker-js/faker";
import { Badge } from "@/components/ui/badge";
import {
  calculateAge,
  formatCustomDate,
  formatDateWithSlash,
} from "@/lib/utils";
import { useRouter } from "next/router";

type iPatient = {
  // Set the type for the patient object from the server
  id: string;
  name: string;
  dob: string;
  sex: string;
  email: string;
  phone: string;
  address: string;
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

export default function Patient({ patient }: { patient: iPatient }) {
  const router = useRouter();
  const { patient: patientId } = router.query;

  return (
    <div>
      <Card className="w-[95%] mx-auto my-7">
        <CardContent className="p-6">
          <h2 className="font-semibold uppercase text-base text-center text-blue-600">
            Patient Demographics
          </h2>
          <div className="grid grid-cols-7 mt-5">
            <Block title="Name" value={patient.name} />
            <Block
              title="DOB"
              value={
                formatDateWithSlash(patient.dob) +
                "(" +
                calculateAge(patient.dob) +
                ")"
              }
            />
            <Block title="Gender" value={patient.sex} className="capitalize" />
            <Block title="MRN Number" value="MI123456789" />
            <Block title="Email" value={patient.email} className="lowercase" />
            <Block title="Phone Number" value={patient.phone} />
            <Block title="Address" value={patient.address} />
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
                {patient.enounters.slice(0, 5).map((encounter) => (
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

export const getServerSideProps = async () => {
  let patient: iPatient = {
    id: faker.random.numeric(5),
    name: faker.person.fullName(),
    dob: faker.date.birthdate().toString(),
    sex: faker.person.sex(),
    email: faker.internet.email({
      provider: "gmail",
      allowSpecialCharacters: false,
    }),
    phone: faker.phone.number("(+###) ###-####"),
    address: faker.location.streetAddress(),
    enounters: [],
  };
  for (let i = 0; i < 7; i++) {
    patient.enounters.push({
      encounterId: faker.random.numeric(5),
      encounterDate: faker.date.past().toString(),
      encounterName: faker.lorem.words({
        min: 2,
        max: 3,
      }),
      visitProvider: {
        name: faker.person.fullName(),
        department: faker.lorem.words(1),
      },
      notes: Math.floor(Math.random() * 200),
    });
  }
  return {
    props: {
      patient,
    },
  };
};
