import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { faker } from "@faker-js/faker";
import { Badge } from "@/components/ui/badge";
import {
  calculateAge,
  cn,
  formatCustomDate,
  formatDateWithSlash,
} from "@/lib/utils";
import { useRouter } from "next/router";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Dot } from "lucide-react";

type iPatient = {
  // Set the type for the patient object from the server
  id: string;
  name: string;
  dob: string;
  sex: string;
  email: string;
  phone: string;
  address: string;
};

const diagnoses = [
  {
    name: "Hypertension",
    description: "High blood pressure",
    severiety: "High",
    extractedFrom: "CBC Report",
    date: "June 13th, 2021",
  },
  {
    name: "Type 2 Diabetes Mellitus",
    description:
      "Chronic condition characterized by elevated blood sugar levels.",
    severiety: "Moderate",
    extractedFrom: "CBC Report",
    date: "March 13th, 2021",
  },
  {
    name: "Major Depressive Disorder",
    description:
      "A mental health disorder characterized by persistently depressed mood or loss of interest in activities, causing significant impairment in daily life.",
    severiety: "Mild",
    extractedFrom: "CBC Report",
    date: "December 18th, 2021",
  },
];

export default function Encounter({ patient }: { patient: iPatient }) {
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
      <Tabs defaultValue="diagnosis" className="w-[95%] mx-auto">
        <TabsList className="w-full flex items-center justify-start px-1">
          <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
          <TabsTrigger value="procedures">Procedures</TabsTrigger>
          <TabsTrigger value="ordersNotes">Orders & Notes</TabsTrigger>
          <TabsTrigger value="hoNotes">H&O Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="diagnosis">
          <Card>
            <CardHeader>
              <CardTitle>
                <Title title={"Diagnosis"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow className="uppercase font-semibold text-left">
                    <TableHead>Diagnosis Name</TableHead>
                    <TableHead className="w-[315px]">Description</TableHead>
                    <TableHead>Severeity</TableHead>
                    <TableHead>Extracted From</TableHead>
                    <TableHead>Date of Diagnosis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diagnoses.map((diagnosis) => (
                    <TableRow key={diagnosis.name}>
                      <TableCell>{diagnosis.name}</TableCell>
                      <TableCell className="truncate max-w-[315px]">
                        {diagnosis.description}
                      </TableCell>
                      <TableCell>
                        <Severity severity={diagnosis.severiety as any} />
                      </TableCell>
                      <TableCell>{diagnosis.extractedFrom}</TableCell>
                      <TableCell>{diagnosis.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ShowMore />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="procedures">
          <Card>
            <CardHeader>
              <CardTitle>
                <Title title={"Procedures"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2"></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ordersNotes">
          <Card>
            <CardHeader>
              <CardTitle>
                <Title title={"Orders & Notes"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <OrderNote title="Discharge Summary" date="June 13th, 2021" />
              <OrderNote title="Radiology Report" date="January 18th, 2023" />
              <OrderNote
                title="Electrocardiograph(ECG)"
                date="December 18th, 2022"
              />
              <OrderNote title="Physician Note" date="May 18th, 2022" />
              <ShowMore />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="hoNotes">
          <Card>
            <CardHeader>
              <CardTitle>
                <Title title={"H&O Notes"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2"></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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

const ShowMore = () => {
  return (
    <span className="text-blue-600 text-sm cursor-pointer block p-4 pb-0">
      View All
    </span>
  );
};

const Severity = ({ severity }: { severity: "High" | "Moderate" | "Mild" }) => {
  const bgColors = {
    High: "bg-red-50",
    Moderate: "bg-yellow-50",
    Mild: "bg-blue-50",
  };

  const colors = {
    High: "text-red-500",
    Moderate: "text-yellow-500",
    Mild: "text-blue-500",
  };
  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-xs font-semibold uppercase relative pl-5",
        bgColors[severity],
        colors[severity]
      )}
    >
      <Dot
        className="inline-block absolute -left-3 top-1/2 transform -translate-y-1/2"
        size={35}
      />
      {severity}
    </Badge>
  );
};

const Title = ({ title }: { title: string }) => (
  <div className="relative">
    <span className="block font-semibold uppercase text-base text-blue-800">
      {title}
    </span>
    <span className="absolute inset-x-0 -bottom-1 h-1 w-4 bg-blue-800"></span>
  </div>
);

const OrderNote = ({ title, date }: { title: string; date: string }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="text-sm cursor-pointer border-b p-4">
          <span className="text-blue-700 underline">{title}</span>, {date}
        </div>
      </SheetTrigger>
      <SheetContent className="min-w-[500px]">
        <SheetHeader className="relative -top-3">
          <SheetTitle>View Note</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4 ">
          <div className="grid grid-cols-4 items-center gap-4"></div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const getServerSideProps = async () => {
  let patient: iPatient = {
    id: faker.string.numeric(5),
    name: faker.person.fullName(),
    dob: faker.date.birthdate().toString(),
    sex: faker.person.sex(),
    email: faker.internet.email({
      provider: "gmail",
      allowSpecialCharacters: false,
    }),
    phone: faker.string.numeric(10),
    address: faker.location.streetAddress(),
  };
  return {
    props: {
      patient,
    },
  };
};
