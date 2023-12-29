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

export default function Encounter({ patient }: { patient: iPatient }) {
  const router = useRouter();

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
      <Tabs defaultValue="ordersNotes" className="w-[95%] mx-auto">
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
            <CardContent className="space-y-2"></CardContent>
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
              <OrderNote />
              <OrderNote />
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

const Title = ({ title }: { title: string }) => (
  <div className="relative">
    <span className="block font-semibold uppercase text-base text-blue-800">
      {title}
    </span>
    <span className="absolute inset-x-0 -bottom-1 h-1 w-4 bg-blue-800"></span>
  </div>
);

const OrderNote = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open</Button>
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
  };
  return {
    props: {
      patient,
    },
  };
};
