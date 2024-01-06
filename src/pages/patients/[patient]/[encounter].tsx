import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateAge,
  cn,
  formatCustomDate,
  formatDateWithSlash,
} from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { GetServerSideProps } from "next";
import { Client } from "pg";

type iPatient = {
  // Set the type for the patient object from the server
  id: string;
  dob: string;
  sex: string;
  zip3: string;
  orders: {
    orderType: string;
    contactDate: string;
    note: string;
  }[];
  diagnosis: {
    name: string;
    description: string;
    source: string;
    date: string;
  }[];
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { patient: patient_num, encounter: encounter_num } = context.query;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  const patient = (
    await client.query(
      `SELECT 
          d.patient_num, 
          d.birth_date_shifted, 
          d.gender_identity, 
          d.zip3,
          (
              SELECT json_agg(diagnosis)
              FROM (
                  SELECT 
                      dx_name, 
                      dx_type, 
                      dx_source, 
                      dx_date_shifted 
                  FROM diagnosis 
                  WHERE patient_num = d.patient_num 
                  AND encounter_num = ${encounter_num}
              ) AS diagnosis
          ) AS patient_diagnosis,
          (
              SELECT json_agg(orders)
              FROM (
                  SELECT 
                      order_type, 
                      contact_date, 
                      note_text 
                  FROM order_results_deid 
                  WHERE patient_num = d.patient_num 
                  AND encounter_num = ${encounter_num}
              ) AS orders
          ) AS patient_orders
      FROM demographics AS d
      WHERE d.patient_num = ${patient_num};
      `
    )
  ).rows[0];

  let pat: iPatient = {
    id: patient.patient_num,
    dob: patient.birth_date_shifted,
    sex: patient.gender_identity,
    zip3: patient.zip3,
    orders: patient.patient_orders.map(
      (order: {
        order_type: string;
        contact_date: string;
        note_text: string;
      }) => ({
        orderType: order.order_type,
        contactDate: order.contact_date,
        note: order.note_text,
      })
    ),
    diagnosis: patient.patient_diagnosis.map(
      (diagnosis: {
        dx_name: string;
        dx_type: string;
        dx_source: string;
        dx_date_shifted: string;
      }) => ({
        name: diagnosis.dx_name,
        description: diagnosis.dx_type,
        source: diagnosis.dx_source,
        date: diagnosis.dx_date_shifted,
      })
    ),
  };

  await client.end();

  if (!pat || !pat.id)
    return {
      redirect: {
        destination: "/patients",
        permanent: false,
      },
    };

  return {
    props: {
      patient: JSON.parse(JSON.stringify(pat)),
    },
  };
};

export default function Encounter({ patient }: { patient: iPatient }) {
  const [diagnosisList, setDiagnosisList] = useState(5);
  const [ordersList, setOrdersList] = useState(5);

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
      <Tabs defaultValue="diagnosis" className="w-[95%] mx-auto mb-10">
        <TabsList className="w-full flex items-center justify-start px-1">
          <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
          <TabsTrigger value="procedures">Procedures</TabsTrigger>
          <TabsTrigger value="imagingReports">Imaging Reports</TabsTrigger>
          <TabsTrigger value="ordersNotes">Orders & Notes</TabsTrigger>
          <TabsTrigger value="hoNotes">HNO Notes</TabsTrigger>
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
                    {/* <TableHead>Severeity</TableHead> */}
                    <TableHead>Extracted From</TableHead>
                    <TableHead>Date of Diagnosis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient?.diagnosis
                    ?.slice(0, diagnosisList)
                    .map((diagnosis) => (
                      <TableRow key={diagnosis.name}>
                        <TableCell>{diagnosis.name}</TableCell>
                        <TableCell className="truncate max-w-[315px]">
                          {diagnosis.description}
                        </TableCell>
                        <TableCell>{diagnosis.source}</TableCell>
                        <TableCell>
                          {formatCustomDate(diagnosis.date).split(",")[0]}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <ShowMore
                isActive={diagnosisList === patient?.diagnosis?.length}
                controlHandler={() => {
                  if (diagnosisList === patient?.diagnosis?.length) {
                    setDiagnosisList(5);
                  } else {
                    setDiagnosisList(patient?.diagnosis?.length);
                  }
                }}
              />
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
        <TabsContent value="imagingReports">
          <Card>
            <CardHeader>
              <CardTitle>
                <Title title={"Imaging Reports"} />
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
              {patient?.orders?.slice(0, ordersList).map((order, i) => (
                <OrderNote
                  key={i}
                  title={order.orderType}
                  date={formatCustomDate(order.contactDate).split(",")[0]}
                  note={order.note}
                />
              ))}
              <ShowMore
                isActive={ordersList === patient?.orders?.length}
                controlHandler={() => {
                  if (ordersList === patient?.orders?.length) {
                    setOrdersList(5);
                  } else {
                    setOrdersList(patient?.orders?.length);
                  }
                }}
              />
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

export const ShowMore = ({
  isActive,
  controlHandler,
}: {
  isActive: boolean;
  controlHandler: () => void;
}) => {
  return (
    <div
      className={cn("text-blue-600 text-sm cursor-pointer block p-4 pb-0")}
      onClick={controlHandler}
    >
      View {isActive ? "Less" : "All"}
    </div>
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

const OrderNote = ({
  title,
  date,
  note,
}: {
  title: string;
  date: string;
  note: string;
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="text-sm cursor-pointer border-b p-4">
          <span className="text-blue-700 underline">{title}</span>, {date}
        </div>
      </SheetTrigger>
      <SheetContent className="min-w-[500px]">
        <SheetHeader className="relative -top-3">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div>{note}</div>
      </SheetContent>
    </Sheet>
  );
};
